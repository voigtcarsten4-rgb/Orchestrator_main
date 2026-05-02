/**
 * Wave Bite — ELWIS Proxy (Cloudflare Worker)
 *
 * Forwards SOAP requests to ELWIS NTS-4.0 so Apps Script can fetch live
 * notice data. Uses the correct namespace & element names from the WSDL.
 *
 * Endpoints:
 *   GET /health
 *   GET /elwis/nts?message_type=FTM|WRM|ICEM|WERM&days_back=14&limit=50
 *   GET /elwis/nts/multi?message_types=FTM,WRM&days_back=14&limit=50
 *
 * Auth: optional, via x-api-key header. Set PROXY_API_KEY as a secret.
 */

const ELWIS_ENDPOINT = 'https://nts40.elwis.de/server/web/MessageServer.php';
const NS_TNS        = 'http://www.ris.eu/nts.ms/2.0.4.0';
const SOAP_ACTION   = 'http://www.ris.eu/nts.ms/get_messages';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Optional API key auth
    if (env.PROXY_API_KEY) {
      const got = request.headers.get('x-api-key');
      if (got !== env.PROXY_API_KEY) {
        return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
      }
    }

    // ── /health ──────────────────────────────────────────────────────────────
    if (url.pathname === '/health') {
      return jsonResponse({
        ok: true,
        service: 'wave-bite-elwis-proxy',
        version: '2.0.0',
        ts: new Date().toISOString()
      });
    }

    // ── /elwis/nts ───────────────────────────────────────────────────────────
    if (url.pathname === '/elwis/nts') {
      if (request.method !== 'GET') return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
      const messageType = (url.searchParams.get('message_type') || 'FTM').toUpperCase();
      const daysBack    = clamp(parseInt(url.searchParams.get('days_back') || '14', 10), 1, 60);
      const limit       = clamp(parseInt(url.searchParams.get('limit')     || '50', 10), 1, 200);
      try {
        const result = await fetchElwisNts(messageType, daysBack, limit);
        return jsonResponse(result, result.ok ? 200 : 502);
      } catch (e) {
        return jsonResponse({ ok: false, error: 'fetch_failed', message: String(e?.message || e) }, 502);
      }
    }

    // ── /elwis/nts/multi ─────────────────────────────────────────────────────
    if (url.pathname === '/elwis/nts/multi') {
      if (request.method !== 'GET') return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
      const types    = (url.searchParams.get('message_types') || 'FTM,WRM').split(',').map(s => s.trim().toUpperCase());
      const daysBack = clamp(parseInt(url.searchParams.get('days_back') || '14', 10), 1, 60);
      const limit    = clamp(parseInt(url.searchParams.get('limit')     || '50', 10), 1, 200);
      const results  = {};
      for (const t of types) {
        try {
          results[t] = await fetchElwisNts(t, daysBack, limit);
        } catch (e) {
          results[t] = { ok: false, error: String(e?.message || e) };
        }
      }
      const total = Object.values(results).reduce((acc, r) => acc + (r.count || 0), 0);
      return jsonResponse({ ok: true, message_types: types, days_back: daysBack, total_count: total, results });
    }

    return jsonResponse({ ok: false, error: 'not_found', path: url.pathname }, 404);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Core fetch: correct WSDL namespace + element names
// ─────────────────────────────────────────────────────────────────────────────
async function fetchElwisNts(messageType, daysBack, limit) {
  const now  = new Date();
  const from = new Date(now.getTime() - daysBack * 24 * 3600 * 1000);
  const fmt  = d => d.toISOString().slice(0, 10);   // YYYY-MM-DD (xs:date)

  const soapBody = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"',
    '               xmlns:tns="' + NS_TNS + '">',
    '  <soap:Body>',
    '    <tns:get_messages_query>',
    '      <tns:message_type>' + xmlEsc(messageType) + '</tns:message_type>',
    '      <tns:dates_issue>',
    '        <tns:date_start>' + fmt(from) + '</tns:date_start>',
    '        <tns:date_end>'   + fmt(now)  + '</tns:date_end>',
    '      </tns:dates_issue>',
    '      <tns:paging_request>',
    '        <tns:offset>0</tns:offset>',
    '        <tns:limit>' + limit + '</tns:limit>',
    '        <tns:total_count>true</tns:total_count>',
    '      </tns:paging_request>',
    '    </tns:get_messages_query>',
    '  </soap:Body>',
    '</soap:Envelope>'
  ].join('\n');

  const resp = await fetch(ELWIS_ENDPOINT, {
    method:  'POST',
    headers: {
      'content-type': 'text/xml; charset=UTF-8',
      'SOAPAction':   '"' + SOAP_ACTION + '"',
      'user-agent':   'WaveBite-CF-Proxy/2.0'
    },
    body: soapBody
  });

  if (!resp.ok) {
    return { ok: false, error: 'upstream_http_' + resp.status, message_type: messageType };
  }

  const xmlText  = await resp.text();
  const messages = parseSoapMessages(xmlText);
  const total    = extractTotalCount(xmlText);

  return {
    ok:          true,
    message_type: messageType,
    days_back:   daysBack,
    count:       messages.length,
    total_count: total,
    raw_bytes:   xmlText.length,
    messages:    messages,
    fetched_at:  new Date().toISOString()
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// XML helpers
// ─────────────────────────────────────────────────────────────────────────────
function parseSoapMessages(xml) {
  const messages = [];
  const re = /<(?:[\w-]+:)?result_message[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?result_message>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const get = tag => {
      const r = block.match(new RegExp('<(?:[\\w-]+:)?' + tag + '[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?' + tag + '>', 'i'));
      return r ? r[1].replace(/<[^>]+>/g, '').trim() : '';
    };
    const year   = get('year');
    const number = get('number');
    messages.push({
      notice_id:    year && number ? year + '-' + number : 'x-' + messages.length,
      year,
      number,
      subject_code: get('subject_code'),
      contents:     get('contents'),
      source:       get('source'),
      reason_code:  get('reason_code'),
      fairway_name: get('fairway_name'),
      date_issue:   get('date_issue'),
      valid_from:   get('date_start'),
      valid_to:     get('date_end'),
      limitation_code: get('limitation_code'),
      country_code: get('country_code'),
      language_code: get('language_code'),
    });
  }
  return messages;
}

function extractTotalCount(xml) {
  const m = xml.match(/<(?:[\w-]+:)?total_count[^>]*>(\d+)<\/(?:[\w-]+:)?total_count>/i);
  return m ? parseInt(m[1], 10) : null;
}

function xmlEsc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj, null, 2), {
    status: status || 200,
    headers: {
      'content-type':                'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control':               'public, max-age=180'
    }
  });
}

function clamp(n, min, max) {
  if (!isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
