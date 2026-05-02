/**
 * Wave Bite — ELWIS Proxy (Cloudflare Worker)
 *
 * Forwards SOAP requests to ELWIS NTS so Apps Script can fetch live notice
 * data despite WAF-level POST blocking on Apps Script egress IPs.
 *
 * Endpoints:
 *   GET /health
 *   GET /elwis/nts?message_type=FTM|WRM&days_back=14
 *
 * Auth: optional, via x-api-key header. Set PROXY_API_KEY as a secret.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Optional auth
    if (env.PROXY_API_KEY) {
      const got = request.headers.get('x-api-key');
      if (got !== env.PROXY_API_KEY) {
        return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
      }
    }

    if (url.pathname === '/health') {
      return jsonResponse({
        ok: true,
        service: 'wave-bite-elwis-proxy',
        version: '1.0.0',
        ts: new Date().toISOString()
      });
    }

    if (url.pathname === '/elwis/nts') {
      if (request.method !== 'GET') {
        return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
      }
      const messageType = (url.searchParams.get('message_type') || 'FTM').toUpperCase();
      const daysBack = clamp(parseInt(url.searchParams.get('days_back') || '14', 10), 1, 60);
      const limit = clamp(parseInt(url.searchParams.get('limit') || '50', 10), 1, 200);
      try {
        const result = await fetchElwisNts(messageType, daysBack, limit);
        return jsonResponse(result, result.ok ? 200 : 502);
      } catch (e) {
        return jsonResponse({
          ok: false,
          error: 'fetch_failed',
          message: String(e && e.message || e)
        }, 502);
      }
    }

    if (url.pathname === '/elwis/nts/multi') {
      if (request.method !== 'GET') {
        return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
      }
      const types = (url.searchParams.get('message_types') || 'FTM,WRM').split(',').map(s => s.trim().toUpperCase());
      const daysBack = clamp(parseInt(url.searchParams.get('days_back') || '14', 10), 1, 60);
      const limit = clamp(parseInt(url.searchParams.get('limit') || '50', 10), 1, 200);
      const results = {};
      for (const t of types) {
        try {
          results[t] = await fetchElwisNts(t, daysBack, limit);
        } catch (e) {
          results[t] = { ok: false, error: String(e && e.message || e) };
        }
      }
      const total = Object.values(results).reduce((acc, r) => acc + (r.count || 0), 0);
      return jsonResponse({
        ok: true,
        message_types: types,
        days_back: daysBack,
        total_count: total,
        results
      });
    }

    return jsonResponse({ ok: false, error: 'not_found', path: url.pathname }, 404);
  }
};

async function fetchElwisNts(messageType, daysBack, limit) {
  const endpoint = 'https://nts40.elwis.de/server/web/MessageServer.php';
  const ns = 'http://www.ris.eu/nts.ms/2.0.4.0';
  const soapAction = 'http://www.ris.eu/nts.ms/get_messages';

  const now = new Date();
  const from = new Date(now.getTime() - daysBack * 24 * 3600 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 10) + 'T00:00:00Z';

  const soapBody =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:NS1="' + ns + '">' +
    '<SOAP-ENV:Body><NS1:get_messages>' +
    '<NS1:message_type>' + messageType + '</NS1:message_type>' +
    '<NS1:date_from>' + fmt(from) + '</NS1:date_from>' +
    '<NS1:date_to>' + fmt(now) + '</NS1:date_to>' +
    '<NS1:limit>' + limit + '</NS1:limit>' +
    '</NS1:get_messages></SOAP-ENV:Body></SOAP-ENV:Envelope>';

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'text/xml; charset=UTF-8',
      'SOAPAction': '"' + soapAction + '"',
      'user-agent': 'WaveBite-CF-Proxy/1.0'
    },
    body: soapBody
  });

  if (!resp.ok) {
    return {
      ok: false,
      error: 'upstream_http_' + resp.status,
      message_type: messageType
    };
  }

  const xmlText = await resp.text();
  const messages = parseSoapMessages(xmlText, messageType);

  return {
    ok: true,
    message_type: messageType,
    days_back: daysBack,
    count: messages.length,
    raw_bytes: xmlText.length,
    messages: messages,
    fetched_at: new Date().toISOString()
  };
}

function parseSoapMessages(xml, source) {
  const messages = [];
  const re = /<(?:[\w-]+:)?result_message[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?result_message>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const get = (tag) => {
      const t = new RegExp('<(?:[\\w-]+:)?' + tag + '[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?' + tag + '>', 'i');
      const r = block.match(t);
      return r ? r[1].replace(/<[^>]+>/g, '').trim() : '';
    };

    const year = get('year') || get('Year');
    const number = get('number') || get('Number');
    const noticeId = (year && number) ? (year + '-' + number) : (source + '-' + Date.now() + '-' + messages.length);

    messages.push({
      source,
      notice_id: noticeId,
      year,
      number,
      title:        get('subject')      || get('title'),
      area:         get('fairway_name') || get('area'),
      waterway:     get('section_name') || get('waterway_name'),
      valid_from:   get('date_from')    || get('valid_from'),
      valid_to:     get('date_to')      || get('valid_to'),
      published_at: get('date_issue')   || get('published_at'),
      raw_text:     block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500)
    });
  }
  return messages;
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj, null, 2), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=180'
    }
  });
}

function clamp(n, min, max) {
  if (!isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
