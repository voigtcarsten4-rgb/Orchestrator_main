// ===========================================================================
// ELWIS PIPELINE — Wave Bite / Waterinfo
// ADDITIV: holt ELWIS-Meldungen, normalisiert & matched konservativ,
// schreibt in Sheet "Elwis_Notices" (Upsert nach notice_uid).
//
// Stützt sich auf Helper aus ElwisIntegration.js
// (fetchElwisNotices_, parseElwisResponse_, parseElwisNotice_)
// — refactort diese NICHT.
//
// Nutzt getOrchestratorSpreadsheet_() aus Code.js (Trigger/Webapp-tauglich).
// ===========================================================================

const ELWIS_NOTICES_SHEET = 'Elwis_Notices';
const ELWIS_NOTICES_HEADERS = [
  'notice_uid','title','summary','severity','category','waterway','region',
  'valid_from','valid_to','source_url','match_scope','match_confidence',
  'matched_water_id','matched_station_id','display_policy','is_active',
  'sort_weight','updated_at','raw_type','raw_id','raw_text','published_at',
  'source_system','match_notes'
];

// ---------------------------------------------------------------------------
// ENTRY POINTS
// ---------------------------------------------------------------------------

/**
 * Manueller Apps-Script-Editor-Aufruf zum Initialisieren / Auffüllen.
 * Idempotent. Schreibt Pflicht-Header an, falls Sheet leer / fehlt.
 */
function runElwisFetch() {
  return fetchAndStoreElwisNotices_();
}

// ---------------------------------------------------------------------------
// MAIN PIPELINE
// ---------------------------------------------------------------------------

function fetchAndStoreElwisNotices_() {
  const ss = getOrchestratorSpreadsheet_();
  const sheet = ensureElwisNoticesSheet_(ss);
  const watersIndex = buildWatersIndexForElwis_(ss);
  const existing = readElwisNoticesIndex_(sheet);

  const stats = {
    fetched: 0, parsed: 0, written: 0, updated: 0,
    skipped: 0, errors: [],
    sheet_rows_before: Object.keys(existing).length,
    soap_endpoint_reachable: null,
    html_sources_used: [],
    pipeline_status: ''
  };
  const allNotices = [];

  // ===== Primary: ELWIS HTML (NfB + Schleusensperrungen) =====
  // ELWIS web pages are JavaScript-rendered SPAs — server returns the form
  // shell, JS calls NTS-SOAP for actual content. UrlFetchApp cannot run JS,
  // so static HTML scraping yields only form-default dates. We try anyway
  // in case ELWIS adds a server-rendered fallback.
  var htmlSources = [
    { url: 'https://www.elwis.de/DE/dynamisch/Nfb/',                  source: 'NfB' },
    { url: 'https://www.elwis.de/DE/dynamisch/Schleusensperrungen/',  source: 'SCHLEUSE' }
  ];
  htmlSources.forEach(function(src) {
    try {
      var notices = fetchElwisHtmlNotices_(src.url, src.source, watersIndex, stats);
      if (notices && notices.length > 0) {
        stats.html_sources_used.push(src.source + ':' + notices.length);
        allNotices.push.apply(allNotices, notices);
      }
    } catch (e) {
      stats.errors.push('HTML ' + src.source + ': ' + ((e && e.message) || e));
    }
  });

  // ===== Secondary: ELWIS NTS SOAP (POST blocked at WAF level for Apps Script IPs) =====
  if (allNotices.length === 0) {
    var messageTypes = ['FTM', 'WRM'];
    messageTypes.forEach(function(msgType) {
      try {
        var xml = fetchElwisNotices_(msgType, 14);
        if (!xml) { stats.errors.push('SOAP ' + msgType + ': empty response'); return; }
        stats.soap_endpoint_reachable = true;
        var elements = parseElwisResponse_(xml);
        stats.fetched += elements.length;
        for (var i = 0; i < elements.length; i++) {
          var raw = parseElwisNotice_(elements[i], msgType);
          if (!raw) { stats.skipped++; continue; }
          var norm = normalizeElwisNotice_(raw, msgType);
          if (!norm) { stats.skipped++; continue; }
          matchElwisToWatersConservative_(norm, watersIndex);
          allNotices.push(norm);
          stats.parsed++;
        }
      } catch (e) {
        stats.errors.push('SOAP ' + msgType + ': ' + ((e && e.message) || e));
      }
    });
  }

  if (stats.soap_endpoint_reachable === null) stats.soap_endpoint_reachable = false;

  // Honest pipeline status — frontend should surface this rather than fake data
  if (allNotices.length > 0) {
    stats.pipeline_status = 'live_data_ok';
  } else if (stats.html_sources_used.length === 0 && !stats.soap_endpoint_reachable) {
    stats.pipeline_status = 'unreachable_from_apps_script_js_spa_blocks_scraping';
  } else {
    stats.pipeline_status = 'no_notices_in_period';
  }

  // Robust demo-seed: greift bei leerem Sheet (kein notice_uid-Eintrag)
  // unabhängig davon, ob noch Reste aus einer alten Schemaversion in
  // sheet.getLastRow() stecken.
  if (allNotices.length === 0 && stats.sheet_rows_before === 0) {
    seedElwisDemoRow_(sheet);
    stats.demo_seeded = true;
    Logger.log('[ELWIS-PIPE] Demo-Row eingefügt (Pipeline ok, ELWIS-Endpoint unreachable oder leer).');
  } else if (allNotices.length > 0) {
    upsertElwisNotices_(sheet, allNotices, existing, stats);
  }

  Logger.log('[ELWIS-PIPE] DONE ' + JSON.stringify(stats));
  return stats;
}

/**
 * Diagnose-Helper: testet die ELWIS-Endpoint-Erreichbarkeit isoliert.
 * Editor-Aufruf: gibt HTTP-Status / Fehlertext zurück, ohne Sheets anzufassen.
 *
 * Testet:
 *  - GET-Erreichbarkeit verschiedener ELWIS-URLs
 *  - SOAP-POST mit dem real verwendeten Body in 4 Header-Varianten
 *  - alternative Quellen (HTML-Seiten, mögliche RSS/JSON-Feeds)
 *
 * Ziel: zeigen, welche URL/Methode aus Apps Script heraus ECHTE Daten liefert.
 */
function runElwisDiagnose() {
  var report = [];

  // ---------- GET probes ----------
  var getTargets = [
    'https://nts40.elwis.de/server/web/MessageServer.php?wsdl',
    'https://nts40.elwis.de/server/web/MessageServer.php',
    'https://www.elwis.de/',
    'https://www.elwis.de/DE/Service/Schifffahrtspolizeiliche-Verfuegungen/Schifffahrtspolizeiliche-Verfuegungen-node.html',
    'https://www.elwis.de/DE/Schifffahrtsinformationen/Bekanntmachungen-fuer-die-Binnenschifffahrt/Aktuelle-Meldungen/Aktuelle-Meldungen-node.html',
    'https://www.elwis.de/DE/Service/RSS/RSS-node.html',
    'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json?ids=BERLIN'
  ];
  report.push('--- GET PROBES ---');
  getTargets.forEach(function(url) {
    try {
      var t0 = Date.now();
      var resp = UrlFetchApp.fetch(url, {
        method: 'get',
        muteHttpExceptions: true,
        followRedirects: true
      });
      var ms = Date.now() - t0;
      var len = (resp.getContentText('UTF-8') || '').length;
      report.push('GET ' + ms + 'ms  HTTP ' + resp.getResponseCode() + '  ' + len + ' bytes  ' + url);
    } catch (e) {
      report.push('GET ERROR  ' + ((e && e.message) || e) + '  ' + url);
    }
  });

  // ---------- POST SOAP variants ----------
  report.push('');
  report.push('--- SOAP POST VARIANTS ---');
  var soapEndpoint = 'https://nts40.elwis.de/server/web/MessageServer.php';
  var ns = 'http://www.ris.eu/nts.ms/2.0.4.0';
  var soapAction = 'http://www.ris.eu/nts.ms/get_messages';
  var now = new Date();
  var from = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
  var fmt = function(d) { return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd') + 'T00:00:00Z'; };
  var body = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:NS1="' + ns + '">' +
    '<SOAP-ENV:Body><NS1:get_messages>' +
    '<NS1:message_type>FTM</NS1:message_type>' +
    '<NS1:date_from>' + fmt(from) + '</NS1:date_from>' +
    '<NS1:date_to>'   + fmt(now)  + '</NS1:date_to>' +
    '<NS1:limit>1</NS1:limit>' +
    '</NS1:get_messages></SOAP-ENV:Body></SOAP-ENV:Envelope>';

  var variants = [
    { label: 'A:standard (text/xml + SOAPAction quoted)',
      opts: { method: 'post', contentType: 'text/xml; charset=UTF-8',
              headers: { 'SOAPAction': '"' + soapAction + '"' },
              payload: body, muteHttpExceptions: true } },
    { label: 'B:application/soap+xml + SOAPAction unquoted',
      opts: { method: 'post', contentType: 'application/soap+xml; charset=UTF-8',
              headers: { 'SOAPAction': soapAction },
              payload: body, muteHttpExceptions: true } },
    { label: 'C:Mozilla User-Agent override',
      opts: { method: 'post', contentType: 'text/xml; charset=UTF-8',
              headers: { 'SOAPAction': '"' + soapAction + '"',
                         'User-Agent': 'Mozilla/5.0 (compatible; WaveBite/1.0)' },
              payload: body, muteHttpExceptions: true } },
    { label: 'D:no SOAPAction header',
      opts: { method: 'post', contentType: 'text/xml; charset=UTF-8',
              payload: body, muteHttpExceptions: true } }
  ];

  variants.forEach(function(v) {
    try {
      var t0 = Date.now();
      var resp = UrlFetchApp.fetch(soapEndpoint, v.opts);
      var ms = Date.now() - t0;
      var code = resp.getResponseCode();
      var text = resp.getContentText('UTF-8') || '';
      var hasMessages = text.indexOf('result_message') >= 0 || text.indexOf('get_messagesResponse') >= 0;
      var faultIdx = text.toLowerCase().indexOf('fault');
      var snippet  = text.slice(0, 240).replace(/\s+/g, ' ');
      report.push('POST ' + v.label + '  ' + ms + 'ms  HTTP ' + code +
                  '  bytes=' + text.length +
                  '  msgs=' + hasMessages +
                  '  fault@' + faultIdx +
                  '  snippet=' + snippet);
    } catch (e) {
      report.push('POST ' + v.label + '  ERROR ' + ((e && e.message) || e));
    }
  });

  // ---------- HTML title sniff (kann Quelle für scrape sein) ----------
  report.push('');
  report.push('--- HTML PROBE elwis.de Bekanntmachungen ---');
  try {
    var bUrl = 'https://www.elwis.de/DE/Schifffahrtsinformationen/Bekanntmachungen-fuer-die-Binnenschifffahrt/Aktuelle-Meldungen/Aktuelle-Meldungen-node.html';
    var bResp = UrlFetchApp.fetch(bUrl, { muteHttpExceptions: true, followRedirects: true });
    var html = bResp.getContentText('UTF-8') || '';
    var titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    var listItems = (html.match(/<li[\s>]/g) || []).length;
    var newsItems = (html.match(/(class\s*=\s*"[^"]*(?:news|teaser|bekanntm|meldung)[^"]*")/gi) || []).length;
    report.push('HTML  HTTP ' + bResp.getResponseCode() +
                '  bytes=' + html.length +
                '  <li>=' + listItems +
                '  newsClass=' + newsItems +
                '  title="' + (titleMatch ? titleMatch[1].slice(0, 120) : '?') + '"');
  } catch (e) {
    report.push('HTML  ERROR ' + ((e && e.message) || e));
  }

  Logger.log('[ELWIS-DIAG]\n' + report.join('\n'));
  return report;
}

// ---------------------------------------------------------------------------
// HTML SCRAPER (primary source — SOAP is blocked from Apps Script)
// ---------------------------------------------------------------------------

/**
 * Lädt eine ELWIS-Seite (NfB / Schleusensperrungen) und extrahiert
 * strukturierte Notice-Items aus <table>-Rows oder <li>-Listen.
 *
 * Die Seiten sind serverseitig gerenderte HTML von Government Site Builder
 * mit konsistentem Markup. Der Parser ist defensiv — extrahiert <tr>/<li>
 * mit dd.MM.yyyy-Datum, dedupliziert nach Datum+Text.
 */
function fetchElwisHtmlNotices_(url, sourceTag, watersIndex, stats) {
  var resp = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { 'Accept': 'text/html,application/xhtml+xml' }
  });
  var code = resp.getResponseCode();
  if (code !== 200) {
    stats.errors.push('HTML ' + sourceTag + ': HTTP ' + code);
    return [];
  }
  var html = resp.getContentText('UTF-8') || '';
  if (!html) return [];
  stats.fetched += 1;

  var items = extractElwisItemsFromHtml_(html, url);
  var out = [];
  items.forEach(function(it) {
    var norm = normalizeHtmlElwisItem_(it, sourceTag, url);
    if (!norm) { stats.skipped++; return; }
    matchElwisToWatersConservative_(norm, watersIndex);
    out.push(norm);
    stats.parsed++;
  });
  return out;
}

function extractElwisItemsFromHtml_(html, baseUrl) {
  var clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // Datum-zentrische Extraktion: finde jedes dd.MM.yyyy und schneide
  // den umschließenden Block aus (tr|li|dt|dd|article|section|div|p|h*).
  // Dadurch unabhängig von der konkreten Markup-Wahl der ELWIS-Seite.
  var items = [];
  var seen = {};
  var dateRe = /\b(\d{2})\.(\d{2})\.(\d{4})\b/g;
  var match;
  while ((match = dateRe.exec(clean)) !== null) {
    var pos = match.index;
    var ds  = match[0];
    var blockStart = findElwisBlockStart_(clean, pos);
    var blockEnd   = findElwisBlockEnd_(clean, pos);
    if (blockEnd <= blockStart) continue;
    var block = clean.slice(blockStart, blockEnd);
    var text = block.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length < 12) continue;
    if (/^(home|impressum|sitemap|datenschutz|kontakt|navigation)\b/i.test(text)) continue;

    // Strip the leading date(s) from the title for cleaner display
    var title = text.replace(new RegExp('^(' + ds.replace(/\./g, '\\.') + '\\s*[-–:]?\\s*)+', ''), '').slice(0, 200).trim();
    if (!title) title = text.slice(0, 200);

    var hrefMatch = block.match(/href\s*=\s*["']([^"'#]+)["']/i);
    var link = hrefMatch ? absoluteUrl_(hrefMatch[1], baseUrl) : '';

    var key = ds + '|' + title.slice(0, 80);
    if (seen[key]) continue;
    seen[key] = true;

    items.push({
      datestr: ds,
      text: text,
      title: title,
      url: link
    });
  }
  return items;
}

/**
 * Geht von pos rückwärts und findet den nächsten öffnenden Block-Tag.
 * Berücksichtigt: tr li dt dd article section div p h1-6.
 * Liefert die Position direkt nach dem Tag, sodass slice(start, end) den
 * Inhalt ohne Außenwand liefert.
 */
function findElwisBlockStart_(html, pos) {
  var window = html.slice(Math.max(0, pos - 1500), pos);
  var openRe = /<(tr|li|dt|dd|article|section|div|p|h[1-6])\b[^>]*>/gi;
  var lastEnd = 0;
  var m;
  while ((m = openRe.exec(window)) !== null) {
    lastEnd = m.index + m[0].length;
  }
  return Math.max(0, pos - 1500) + lastEnd;
}

function findElwisBlockEnd_(html, pos) {
  var maxLook = Math.min(html.length, pos + 1500);
  var window = html.slice(pos, maxLook);
  var closeRe = /<\/(tr|li|dt|dd|article|section|div|p|h[1-6])>/i;
  var m = window.match(closeRe);
  if (m) return pos + m.index;
  return Math.min(html.length, pos + 400);
}

/**
 * Probe whether www.elwis.de accepts POST/GET form submissions to fetch
 * actual NfB notice rows. Static NfB HTML is just an empty search form —
 * results are loaded after submission. Tries multiple variants.
 */
function runElwisFormProbe() {
  var report = [];
  var nfbUrl = 'https://www.elwis.de/DE/dynamisch/Nfb/';

  // 1) POST form with default date range (last 30 days)
  var now = new Date();
  var from = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  var fmtDe = function(d) { return Utilities.formatDate(d, 'Europe/Berlin', 'dd.MM.yyyy'); };

  function dateInfo(body) {
    var dates = body.match(/\b\d{2}\.\d{2}\.\d{4}\b/g) || [];
    var unique = {};
    dates.forEach(function(d) { unique[d] = (unique[d] || 0) + 1; });
    var distinct = Object.keys(unique).length;
    return 'dates=' + dates.length + ' distinct=' + distinct + ' sample=' + dates.slice(0, 5).join(',');
  }

  // 1a: POST application/x-www-form-urlencoded (object payload)
  try {
    var t0 = Date.now();
    var r = UrlFetchApp.fetch(nfbUrl, {
      method: 'post',
      payload: {
        'search_nfb[gueltigVon]': fmtDe(from),
        'search_nfb[gueltigBis]': fmtDe(now),
        'search_nfb[search]': 'submit'
      },
      muteHttpExceptions: true,
      followRedirects: true,
      headers: { 'Accept': 'text/html,*/*;q=0.8', 'Referer': nfbUrl }
    });
    var b = r.getContentText('UTF-8') || '';
    report.push('1a POST form-urlencoded  ' + (Date.now() - t0) + 'ms HTTP ' + r.getResponseCode() + ' bytes=' + b.length + '  ' + dateInfo(b));
  } catch (e) { report.push('1a ERROR ' + ((e && e.message) || e)); }

  // 1b: POST same fields without trailing [search]=submit
  try {
    var r2 = UrlFetchApp.fetch(nfbUrl, {
      method: 'post',
      payload: {
        'search_nfb[gueltigVon]': fmtDe(from),
        'search_nfb[gueltigBis]': fmtDe(now)
      },
      muteHttpExceptions: true,
      followRedirects: true,
      headers: { 'Referer': nfbUrl }
    });
    var b2 = r2.getContentText('UTF-8') || '';
    report.push('1b POST minimal  HTTP ' + r2.getResponseCode() + ' bytes=' + b2.length + '  ' + dateInfo(b2));
  } catch (e) { report.push('1b ERROR ' + ((e && e.message) || e)); }

  // 2) GET with query string
  try {
    var qs = '?' + 'search_nfb%5BgueltigVon%5D=' + encodeURIComponent(fmtDe(from)) +
             '&search_nfb%5BgueltigBis%5D=' + encodeURIComponent(fmtDe(now)) +
             '&search_nfb%5Bsearch%5D=submit';
    var r3 = UrlFetchApp.fetch(nfbUrl + qs, { muteHttpExceptions: true, followRedirects: true });
    var b3 = r3.getContentText('UTF-8') || '';
    report.push('2 GET querystring  HTTP ' + r3.getResponseCode() + ' bytes=' + b3.length + '  ' + dateInfo(b3));
  } catch (e) { report.push('2 ERROR ' + ((e && e.message) || e)); }

  // 3) Probe alternative ELWIS URLs that might serve actual notice content
  //    without requiring form submit.
  var alt = [
    'https://www.elwis.de/DE/dynamisch/Nfb/Nfb_Liste.html',
    'https://www.elwis.de/DE/dynamisch/Nfb/index.html',
    'https://www.elwis.de/DE/dynamisch/Nfb/?aktuell=1',
    'https://www.elwis.de/DE/Service/Suche/suche_node.html?search=schleusensperrung',
    'https://www.elwis.de/DE/dynamisch/Nfb/aktuelle.html',
    'https://www.elwis.de/DE/dynamisch/Nfb/Nfb.json',
    'https://www.elwis.de/DE/Schifffahrtsinformationen/aktuelle-Meldungen.html'
  ];
  alt.forEach(function(url) {
    try {
      var r4 = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
      var b4 = r4.getContentText('UTF-8') || '';
      report.push('3 GET alt  HTTP ' + r4.getResponseCode() + ' bytes=' + b4.length + '  ' + dateInfo(b4) + '  ' + url);
    } catch (e) {
      report.push('3 ERROR ' + ((e && e.message) || e) + '  ' + url);
    }
  });

  // 4) Look for inline news on the homepage (some GSB sites surface latest items there)
  try {
    var rh = UrlFetchApp.fetch('https://www.elwis.de/', { muteHttpExceptions: true, followRedirects: true });
    var bh = rh.getContentText('UTF-8') || '';
    var clean = bh.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
    // Find headlines + look for a "Meldung", "aktuell", "Hinweis" section
    var headlines = (clean.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi) || []).slice(0, 12);
    report.push('4 homepage bytes=' + bh.length + '  ' + dateInfo(bh) + '  headlines:');
    headlines.forEach(function(h) {
      var t = h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (t) report.push('   - ' + t.slice(0, 120));
    });
  } catch (e) { report.push('4 homepage ERROR ' + ((e && e.message) || e)); }

  Logger.log('[ELWIS-FORM-PROBE]\n' + report.join('\n'));
  return report;
}

/**
 * Editor-Hilfe: zeigt für NfB + Schleusensperrungen die ECHTEN
 * 250-Zeichen-Kontexte rund um jedes gefundene Datum. Damit lässt sich
 * sehen, in welchem Markup-Block die Notices stecken — falls der Extractor
 * weiterhin 0 Items liefert.
 */
function runElwisHtmlPreview() {
  var report = [];
  var urls = [
    'https://www.elwis.de/DE/dynamisch/Nfb/',
    'https://www.elwis.de/DE/dynamisch/Schleusensperrungen/',
    'https://www.elwis.de/DE/Binnenschifffahrt/Verkehrsinformationen/Verkehrsinformationen-node.html',
    'https://www.elwis.de/DE/Binnenschifffahrt/Fahrrinneneinschraenkungen/Fahrrinneneinschraenkungen-node.html'
  ];
  urls.forEach(function(url) {
    report.push('=== ' + url + ' ===');
    try {
      var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
      if (resp.getResponseCode() !== 200) {
        report.push('  HTTP ' + resp.getResponseCode());
        return;
      }
      var html = resp.getContentText('UTF-8') || '';
      var clean = html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
                       .replace(/<style[\s\S]*?<\/style>/gi, ' ');
      var dateRe = /\b\d{2}\.\d{2}\.\d{4}\b/g;
      var positions = [];
      var m;
      while ((m = dateRe.exec(clean)) !== null) positions.push({ pos: m.index, date: m[0] });
      report.push('  total dates found: ' + positions.length);
      positions.slice(0, 6).forEach(function(p, i) {
        var ctx = clean.slice(Math.max(0, p.pos - 120), Math.min(clean.length, p.pos + 220));
        ctx = ctx.replace(/\s+/g, ' ').slice(0, 320);
        report.push('  [' + (i + 1) + '] ' + p.date + ' ctx: ' + ctx);
      });
      // Also: show what extractElwisItemsFromHtml_ does
      var items = extractElwisItemsFromHtml_(html, url);
      report.push('  items via extractor: ' + items.length);
      items.slice(0, 3).forEach(function(it, i) {
        report.push('  ITEM[' + i + '] ' + it.datestr + ' | ' + it.title.slice(0, 140));
      });
    } catch (e) {
      report.push('  ERROR ' + ((e && e.message) || e));
    }
  });
  Logger.log('[ELWIS-HTML-PREVIEW]\n' + report.join('\n'));
  return report;
}

function absoluteUrl_(href, baseUrl) {
  if (!href) return '';
  if (/^https?:\/\//i.test(href)) return href;
  if (href.charAt(0) === '/') {
    var m = baseUrl.match(/^(https?:\/\/[^\/]+)/);
    return m ? m[1] + href : href;
  }
  return baseUrl.replace(/[^/]*$/, '') + href;
}

function normalizeHtmlElwisItem_(it, sourceTag, baseUrl) {
  if (!it || !it.text) return null;
  var ddmmyyyy = it.datestr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  var iso = ddmmyyyy ? (ddmmyyyy[3] + '-' + ddmmyyyy[2] + '-' + ddmmyyyy[1]) : '';
  var title    = it.title;
  var summary  = it.text.length > 240 ? it.text.slice(0, 240) + '…' : it.text;
  var rawText  = it.text;
  var sourceUrl = it.url || baseUrl;
  var lower = it.text.toLowerCase();
  var severity   = inferSeverity_(lower);
  var category   = inferCategoryHtml_(lower, sourceTag);
  var validFrom = iso;
  var validTo = '';
  var allDates = (it.text.match(/\d{2}\.\d{2}\.\d{4}/g) || []);
  if (allDates.length >= 2) {
    var d2 = allDates[1].match(/(\d{2})\.(\d{2})\.(\d{4})/);
    validTo = d2 ? (d2[3] + '-' + d2[2] + '-' + d2[1]) : '';
  }
  var isActive = computeIsActive_(validFrom, validTo);
  var sortWeight = computeSortWeight_(severity, isActive);
  var waterway = extractWaterway_(it.text);
  var uid = sourceTag + ':' + iso + ':' + md5Short_(title);

  return {
    notice_uid: uid,
    title: title,
    summary: summary,
    severity: severity,
    category: category,
    waterway: waterway,
    region: '',
    valid_from: validFrom,
    valid_to: validTo,
    source_url: sourceUrl,
    match_scope: 'global',
    match_confidence: 'none',
    matched_water_id: '',
    matched_station_id: '',
    display_policy: 'global',
    is_active: isActive,
    sort_weight: sortWeight,
    updated_at: new Date().toISOString(),
    raw_type: sourceTag,
    raw_id: iso + '|' + title.slice(0, 60),
    raw_text: rawText.slice(0, 500),
    published_at: validFrom,
    source_system: 'ELWIS_HTML',
    match_notes: ''
  };
}

function inferCategoryHtml_(text, sourceTag) {
  if (sourceTag === 'SCHLEUSE' || /schleus/.test(text)) return 'lock';
  if (/sperrung|fahrverbot|gesperrt|stillgelegt/.test(text)) return 'closure';
  if (/baustelle|bauarbeit|baumaßnahme|baumassn/.test(text)) return 'construction';
  if (/geschwindigkeit|tempo|knoten|km\/h/.test(text)) return 'speed';
  if (/warnung|gefahr|untiefe|hindernis/.test(text)) return 'warning';
  if (/befahr|navig|fahrwasser|leuchtfeuer|tonne/.test(text)) return 'navigation';
  return 'info';
}

function extractWaterway_(text) {
  var known = /(spree|havel|elbe|oder|dahme|teltowkanal|landwehrkanal|wannsee|m[üu]ggelsee|tegeler see|nieder neuendorfer see|oranienburg|berlin-spandauer|untere havel-wasserstra(?:ß|ss)e|rhin|finowkanal|werbellin)/i;
  var m = text.match(known);
  return m ? m[1] : '';
}

function md5Short_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(s || ''))
    .map(function(b) { return ((b & 0xff) + 0x100).toString(16).slice(1); })
    .join('').slice(0, 10);
}

// ---------------------------------------------------------------------------
// SHEET INIT / SCHEMA
// ---------------------------------------------------------------------------

function ensureElwisNoticesSheet_(ss) {
  var sheet = ss.getSheetByName(ELWIS_NOTICES_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ELWIS_NOTICES_SHEET);
    sheet.getRange(1, 1, 1, ELWIS_NOTICES_HEADERS.length).setValues([ELWIS_NOTICES_HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  // ADDITIV: fehlende Spalten anhängen, bestehende NIEMALS umbenennen oder löschen
  var lastCol = sheet.getLastColumn();
  var current = lastCol > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h || '').trim(); })
    : [];
  if (current.length === 0) {
    sheet.getRange(1, 1, 1, ELWIS_NOTICES_HEADERS.length).setValues([ELWIS_NOTICES_HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  var lower = current.map(function(h) { return h.toLowerCase(); });
  var missing = ELWIS_NOTICES_HEADERS.filter(function(h) {
    return lower.indexOf(h.toLowerCase()) < 0;
  });
  if (missing.length > 0) {
    var start = current.length + 1;
    sheet.getRange(1, start, 1, missing.length).setValues([missing]);
  }
  return sheet;
}

function readElwisNoticesIndex_(sheet) {
  var idx = {};
  if (sheet.getLastRow() < 2) return idx;
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function(h) { return String(h || '').trim().toLowerCase(); });
  var cUid = headers.indexOf('notice_uid');
  if (cUid < 0) return idx;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  for (var i = 0; i < data.length; i++) {
    var uid = String(data[i][cUid] || '').trim();
    if (uid) idx[uid] = i + 2; // sheet row number (1-based, +1 for header)
  }
  return idx;
}

// ---------------------------------------------------------------------------
// NORMALIZATION
// ---------------------------------------------------------------------------

function normalizeElwisNotice_(rawRow, source) {
  // rawRow indices from parseElwisNotice_:
  // 0=source 1=noticeId 2=title 3=type 4=area 5=waterway
  // 6=valid_from 7=valid_to 8=published_at 9=url 10=raw_text
  var noticeId    = String(rawRow[1] || '').trim();
  var title       = String(rawRow[2] || '').trim();
  var area        = String(rawRow[4] || '').trim();
  var waterway    = String(rawRow[5] || '').trim();
  var validFrom   = normalizeIsoDate_(rawRow[6]);
  var validTo     = normalizeIsoDate_(rawRow[7]);
  var publishedAt = normalizeIsoDate_(rawRow[8]);
  var rawText     = String(rawRow[10] || '').trim();

  if (!noticeId && !title && !waterway && !rawText) return null;

  var noticeUid  = buildNoticeUid_(source, noticeId, title || rawText);
  var summary    = title || rawText.slice(0, 160);
  var lowerText  = (title + ' ' + rawText + ' ' + waterway + ' ' + area).toLowerCase();
  var severity   = inferSeverity_(lowerText);
  var category   = inferCategory_(lowerText);
  var isActive   = computeIsActive_(validFrom, validTo);
  var sortWeight = computeSortWeight_(severity, isActive);

  return {
    notice_uid: noticeUid,
    title: title,
    summary: summary,
    severity: severity,
    category: category,
    waterway: waterway,
    region: area,
    valid_from: validFrom,
    valid_to: validTo,
    source_url: 'https://www.elwis.de/',
    match_scope: 'global',
    match_confidence: 'none',
    matched_water_id: '',
    matched_station_id: '',
    display_policy: 'global',
    is_active: isActive,
    sort_weight: sortWeight,
    updated_at: new Date().toISOString(),
    raw_type: String(source || ''),
    raw_id: noticeId,
    raw_text: rawText.slice(0, 500),
    published_at: publishedAt,
    source_system: 'ELWIS_NTS_SOAP',
    match_notes: ''
  };
}

function buildNoticeUid_(source, noticeId, fallbackText) {
  if (noticeId) return source + ':' + noticeId;
  var seed = fallbackText || ('empty-' + new Date().getTime());
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, seed)
    .map(function(b) { return ((b & 0xff) + 0x100).toString(16).slice(1); })
    .join('').slice(0, 12);
  return source + ':h:' + hash;
}

function inferSeverity_(text) {
  if (!text) return 'info';
  if (/sperrung|fahrverbot|gesperrt|schleusensperrung|gefahr|stillgelegt|au[ßs]er betrieb/.test(text)) return 'critical';
  if (/sperrzeit|umleitung|notbetrieb|stark eingeschr[äa]nkt|nicht passierbar/.test(text)) return 'high';
  if (/baustelle|bauarbeit|engstelle|zeitlich begrenzt|durchfahrt eingeschr[äa]nkt/.test(text)) return 'medium';
  if (/hinweis|achtung|vorsicht|empfehl/.test(text)) return 'low';
  return 'info';
}

function inferCategory_(text) {
  if (!text) return 'info';
  if (/schleus/.test(text)) return 'lock';
  if (/sperrung|fahrverbot|gesperrt|stillgelegt/.test(text)) return 'closure';
  if (/baustelle|bauarbeit|baumaß|baumassn/.test(text)) return 'construction';
  if (/geschwindigkeit|tempo|knoten|km\/h/.test(text)) return 'speed';
  if (/warnung|gefahr|untiefe|hindernis/.test(text)) return 'warning';
  if (/befahr|navig|fahrwasser|leuchtfeuer|tonne/.test(text)) return 'navigation';
  return 'info';
}

function normalizeIsoDate_(v) {
  if (!v) return '';
  var s = String(v).trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;
  var d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toISOString();
}

function computeIsActive_(validFromIso, validToIso) {
  var today = new Date();
  if (validFromIso) {
    var from = new Date(validFromIso);
    if (!isNaN(from.getTime()) && from > today) return false;
  }
  if (validToIso) {
    var to = new Date(validToIso);
    if (!isNaN(to.getTime()) && to < today) return false;
  }
  return true;
}

function computeSortWeight_(severity, isActive) {
  var base = 0;
  if (severity === 'critical') base = 100;
  else if (severity === 'high') base = 80;
  else if (severity === 'medium') base = 60;
  else if (severity === 'low') base = 40;
  else if (severity === 'info') base = 20;
  return isActive ? base : (base - 50);
}

// ---------------------------------------------------------------------------
// CONSERVATIVE MATCHING (station > region > global)
// ---------------------------------------------------------------------------

function buildWatersIndexForElwis_(ss) {
  var idx = { byKey: {}, byBbNr: {} };
  var sheet = ss.getSheetByName('Waters');
  if (!sheet || sheet.getLastRow() < 2) return idx;
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function(h) { return String(h || '').toLowerCase().trim(); });
  var cWaterId  = headers.indexOf('water_id');
  var cBbNr     = headers.indexOf('bb_nr');
  var cName     = headers.indexOf('waterbody_name');
  var cSrcKey   = headers.indexOf('source_key');
  var cSrcKeyA  = headers.indexOf('source_key_alt');
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var wid = cWaterId >= 0 ? String(r[cWaterId] || '').trim() : '';
    var bb  = cBbNr    >= 0 ? String(r[cBbNr]    || '').trim() : '';
    if (!wid) continue;
    var entry = { water_id: wid, bb_nr: bb };
    if (bb) idx.byBbNr[bb] = entry;
    [cName, cSrcKey, cSrcKeyA].forEach(function(c) {
      if (c < 0) return;
      var k = String(r[c] || '').trim().toLowerCase();
      if (k) idx.byKey[k] = entry;
    });
  }
  return idx;
}

function matchElwisToWatersConservative_(notice, watersIndex) {
  var wkey = (notice.waterway || '').toLowerCase().trim();
  var rkey = (notice.region   || '').toLowerCase().trim();

  // Station: exakte Treffer
  var exact = (wkey && watersIndex.byKey[wkey]) || (rkey && watersIndex.byKey[rkey]);
  if (exact) {
    notice.match_scope = 'station';
    notice.match_confidence = 'high';
    notice.display_policy = 'spot';
    notice.matched_water_id = exact.water_id;
    notice.matched_station_id = exact.bb_nr || '';
    notice.match_notes = 'exact key match';
    return;
  }

  // Region: substring overlap
  var allKeys = Object.keys(watersIndex.byKey);
  for (var i = 0; i < allKeys.length; i++) {
    var k = allKeys[i];
    if (!k) continue;
    var hitW = wkey && (wkey.indexOf(k) >= 0 || k.indexOf(wkey) >= 0);
    var hitR = rkey && (rkey.indexOf(k) >= 0 || k.indexOf(rkey) >= 0);
    if (hitW || hitR) {
      notice.match_scope = 'region';
      notice.match_confidence = 'medium';
      notice.display_policy = 'region';
      notice.matched_water_id = '';
      notice.matched_station_id = '';
      notice.match_notes = 'partial overlap with: ' + k;
      return;
    }
  }

  // Default: global (lieber global als falsch)
  notice.match_scope = 'global';
  notice.match_confidence = 'none';
  notice.display_policy = 'global';
  notice.match_notes = 'no waterway/region match';
}

// ---------------------------------------------------------------------------
// UPSERT (write/update) — kein Duplikat
// ---------------------------------------------------------------------------

function upsertElwisNotices_(sheet, notices, existingIndex, stats) {
  if (!notices || notices.length === 0) return;
  var lastCol = sheet.getLastColumn();
  var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var headerKeys = headerRow.map(function(h) {
    var k = String(h || '').trim().toLowerCase();
    return ELWIS_NOTICES_HEADERS.find(function(x) { return x.toLowerCase() === k; }) || null;
  });

  var newRows = [];
  notices.forEach(function(n) {
    var uid = n.notice_uid;
    var row = headerKeys.map(function(realKey) {
      return realKey && n[realKey] !== undefined ? n[realKey] : '';
    });
    if (existingIndex[uid]) {
      sheet.getRange(existingIndex[uid], 1, 1, headerRow.length).setValues([row]);
      stats.updated++;
    } else {
      newRows.push(row);
    }
  });
  if (newRows.length > 0) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, newRows.length, headerRow.length).setValues(newRows);
    stats.written += newRows.length;
  }
}

function seedElwisDemoRow_(sheet) {
  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var demo = {
    notice_uid: 'DEMO:format-validation',
    title: 'Format-Validierungseintrag (keine echte Meldung)',
    summary: 'Pipeline aktiv; aktuell keine ELWIS-Meldungen verfuegbar. Demo-Eintrag dient nur dem Output-Format.',
    severity: 'info',
    category: 'info',
    waterway: '',
    region: '',
    valid_from: '',
    valid_to: '1970-01-02',
    source_url: 'https://www.elwis.de/',
    match_scope: 'global',
    match_confidence: 'none',
    matched_water_id: '',
    matched_station_id: '',
    display_policy: 'global',
    is_active: false,
    sort_weight: -30,
    updated_at: new Date().toISOString(),
    raw_type: 'DEMO',
    raw_id: 'demo-1',
    raw_text: 'Auto-generierter Demo-Eintrag (Pipeline-Validierung)',
    published_at: new Date().toISOString(),
    source_system: 'ELWIS_PIPELINE_DEMO',
    match_notes: 'Demo-Eintrag bei leerer ELWIS-Antwort'
  };
  var row = headerRow.map(function(h) {
    var k = String(h || '').trim().toLowerCase();
    var realKey = ELWIS_NOTICES_HEADERS.find(function(x) { return x.toLowerCase() === k; });
    return realKey && demo[realKey] !== undefined ? demo[realKey] : '';
  });
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, 1, headerRow.length).setValues([row]);
}

// ===========================================================================
// HOMEPAGE / DEEP DISCOVERY
// ===========================================================================

/**
 * Lädt elwis.de, extrahiert alle <a href>, filtert nach relevanten Keywords
 * (bekanntm|verfüg|meldung|schiffahrt|verkehrs|nautische|rss|feed|json),
 * und probiert jeden Kandidaten mit GET. Liefert eine kompakte Liste der
 * URLs die HTTP 200 liefern + Header- und Inhalts-Hinweise.
 *
 * Editor-Aufruf: runElwisHomepageScan
 */
function runElwisHomepageScan() {
  var report = [];
  var base = 'https://www.elwis.de';
  var html;
  try {
    var resp = UrlFetchApp.fetch(base + '/', { muteHttpExceptions: true, followRedirects: true });
    if (resp.getResponseCode() !== 200) {
      report.push('FATAL: homepage HTTP ' + resp.getResponseCode());
      Logger.log('[ELWIS-SCAN]\n' + report.join('\n'));
      return report;
    }
    html = resp.getContentText('UTF-8');
  } catch (e) {
    report.push('FATAL: homepage ERROR ' + ((e && e.message) || e));
    Logger.log('[ELWIS-SCAN]\n' + report.join('\n'));
    return report;
  }

  // 1) extract every <a href="...">linktext</a>
  var anchors = [];
  var re = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  var m;
  while ((m = re.exec(html)) !== null) {
    var href = m[1];
    var label = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    anchors.push({ href: href, label: label });
  }

  // 2) filter for ELWIS-relevant URLs
  var keyword = /(bekanntm|verfüg|verfueg|meldung|schiff|nautisch|rss|feed|json|hinweis|warn|sperr|nts|messageserver)/i;
  var seen = {};
  var candidates = [];
  anchors.forEach(function(a) {
    if (!a.href) return;
    if (a.href.indexOf('#') === 0) return;
    if (a.href.indexOf('mailto:') === 0) return;
    var abs = a.href;
    if (abs.indexOf('http') !== 0) {
      abs = abs.indexOf('/') === 0 ? base + abs : base + '/' + abs;
    }
    if (abs.indexOf('elwis.de') < 0) return; // bleib bei ELWIS
    if (seen[abs]) return;
    if (!keyword.test(a.href + ' ' + a.label)) return;
    seen[abs] = true;
    candidates.push({ href: abs, label: a.label.slice(0, 80) });
  });

  report.push('homepage bytes=' + html.length + '  total_anchors=' + anchors.length + '  candidates=' + candidates.length);
  report.push('');
  report.push('--- TOP 20 CANDIDATES (status / size / content-type / title) ---');

  candidates.slice(0, 20).forEach(function(c) {
    try {
      var t0 = Date.now();
      var r = UrlFetchApp.fetch(c.href, { muteHttpExceptions: true, followRedirects: true });
      var ms = Date.now() - t0;
      var code = r.getResponseCode();
      var hdr = r.getHeaders() || {};
      var ct = hdr['Content-Type'] || hdr['content-type'] || '?';
      var body = r.getContentText('UTF-8') || '';
      var title = (body.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1].replace(/\s+/g, ' ').trim().slice(0, 80);
      var rss = body.indexOf('<rss') >= 0 || body.indexOf('<feed') >= 0;
      report.push(
        'HTTP ' + code +
        '  ' + ms + 'ms' +
        '  bytes=' + body.length +
        '  rss=' + rss +
        '  ct=' + String(ct).slice(0, 40) +
        '  url=' + c.href +
        '  label="' + c.label + '"' +
        '  title="' + title + '"'
      );
    } catch (e) {
      report.push('ERROR  ' + ((e && e.message) || e) + '  ' + c.href);
    }
  });

  Logger.log('[ELWIS-SCAN]\n' + report.join('\n'));
  return report;
}

// ===========================================================================
// END-TO-END DATA SOURCE AUDIT
// ===========================================================================

/**
 * Pingt jede externe Datenquelle der Wave-Bite-Pipeline einzeln und
 * berichtet HTTP-Status, Latenz, Bytes und – soweit möglich – ein
 * geparstes Sample. Liest NICHTS in Sheets, schreibt NICHTS.
 *
 * Editor-Aufruf: runDataSourceAudit
 *
 * Kategorien:
 *   A  PEGELONLINE WSV (Wasserstand)
 *   B  Open-Meteo Forecast (Wind/Lufttemp)
 *   C  Open-Meteo Marine (Wellen)
 *   D  NOAA Tides + NDBC (USA – erwartet tot für Berlin)
 *   E  ELWIS HTML (NfB, Schleusensperrungen, Verkehrsinfo)
 *   F  Berlin LaGeSo CSV (Wassertemperatur Quelle)
 *   G  Brandenburg XML (Wassertemperatur Quelle 2)
 *   H  Geoportal Brandenburg (Fallback)
 */
function runDataSourceAudit() {
  var report = [];
  var BERLIN = { lat: 52.52, lon: 13.405 };

  function probe(label, url, opts) {
    var fopts = opts || { method: 'get', muteHttpExceptions: true, followRedirects: true };
    try {
      var t0 = Date.now();
      var r = UrlFetchApp.fetch(url, fopts);
      var ms = Date.now() - t0;
      var code = r.getResponseCode();
      var text = r.getContentText('UTF-8') || '';
      return { ok: code === 200, code: code, ms: ms, bytes: text.length, text: text };
    } catch (e) {
      return { ok: false, error: ((e && e.message) || e) };
    }
  }

  function line(label, res, extra) {
    if (res.error) {
      report.push(label + '  ERROR  ' + res.error);
      return;
    }
    var s = label + '  HTTP ' + res.code + '  ' + res.ms + 'ms  bytes=' + res.bytes;
    if (extra) s += '  ' + extra;
    report.push(s);
  }

  // ---------- A: PEGELONLINE WSV ----------
  report.push('=== A) PEGELONLINE WSV ===');
  var pA = probe('A1 stations.json', 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json');
  if (pA.ok) {
    try {
      var arr = JSON.parse(pA.text);
      line('A1 stations.json', pA, 'count=' + arr.length + '  sample.shortname=' + (arr[0] && arr[0].shortname));
    } catch (e) { line('A1 stations.json', pA, 'JSON-PARSE-ERROR'); }
  } else { line('A1 stations.json', pA); }

  // sample current measurement
  var pegelSampleStation = '593647aa-9fea-4e13-bf0a-6c5180b80a73'; // BERLIN-MUEHLENDAMM (stable)
  var pA2 = probe('A2 station current', 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/' + pegelSampleStation + '/W/currentmeasurement.json');
  if (pA2.ok) {
    try { var m = JSON.parse(pA2.text); line('A2 station current', pA2, 'value=' + m.value + '  unit=' + (m.stateMnwMhw || '?')); }
    catch (e) { line('A2 station current', pA2, 'JSON-PARSE-ERROR'); }
  } else { line('A2 station current', pA2); }

  // ---------- B: Open-Meteo Forecast ----------
  report.push('');
  report.push('=== B) Open-Meteo Forecast ===');
  var fcUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + BERLIN.lat +
              '&longitude=' + BERLIN.lon +
              '&current=temperature_2m,windspeed_10m,windgusts_10m,wind_direction_10m,visibility,precipitation,weather_code' +
              '&timezone=UTC';
  var pB = probe('B1 forecast', fcUrl);
  if (pB.ok) {
    try {
      var f = JSON.parse(pB.text);
      var c = f && f.current;
      line('B1 forecast', pB,
        'air=' + (c && c.temperature_2m) +
        ' wind=' + (c && c.windspeed_10m) +
        ' gust=' + (c && c.windgusts_10m) +
        ' dir=' + (c && c.wind_direction_10m));
    } catch (e) { line('B1 forecast', pB, 'JSON-PARSE-ERROR'); }
  } else { line('B1 forecast', pB); }

  // ---------- C: Open-Meteo Marine ----------
  report.push('');
  report.push('=== C) Open-Meteo Marine (Berlin = Binnengewässer) ===');
  var marineUrl = 'https://marine-api.open-meteo.com/v1/marine?latitude=' + BERLIN.lat +
                  '&longitude=' + BERLIN.lon +
                  '&current=wave_height,ocean_current_velocity&timezone=UTC';
  var pC = probe('C1 marine', marineUrl);
  if (pC.ok) {
    try {
      var mr = JSON.parse(pC.text);
      var mc = mr && mr.current;
      line('C1 marine', pC,
        'wave=' + (mc && mc.wave_height) +
        ' ocean_current=' + (mc && mc.ocean_current_velocity) +
        ' (null=keine_Marine_Daten_für_Binnengewässer)');
    } catch (e) { line('C1 marine', pC, 'JSON-PARSE-ERROR  body200=' + pC.text.slice(0, 200)); }
  } else { line('C1 marine', pC); }

  // ---------- D: NOAA (USA) ----------
  report.push('');
  report.push('=== D) NOAA Tides + NDBC (USA-only) ===');
  var pD1 = probe('D1 NOAA tides', 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=8454000&product=water_level&datum=MLLW&time_zone=gmt&units=metric&format=json');
  line('D1 NOAA tides', pD1, pD1.ok ? 'sample=' + pD1.text.slice(0, 120).replace(/\s+/g, ' ') : '');
  var pD2 = probe('D2 NOAA NDBC', 'https://www.ndbc.noaa.gov/data/realtime2/41001.txt');
  line('D2 NOAA NDBC', pD2, pD2.ok ? 'first_line=' + pD2.text.split('\n')[0] : '');

  // ---------- E: ELWIS HTML real URLs ----------
  report.push('');
  report.push('=== E) ELWIS HTML (echte URLs) ===');
  var elwisUrls = [
    { tag: 'E1 NfB-Modul',          url: 'https://www.elwis.de/DE/dynamisch/Nfb/' },
    { tag: 'E2 Schleusensperrungen',url: 'https://www.elwis.de/DE/dynamisch/Schleusensperrungen/' },
    { tag: 'E3 Verkehrsinfo',       url: 'https://www.elwis.de/DE/Binnenschifffahrt/Verkehrsinformationen/Verkehrsinformationen-node.html' },
    { tag: 'E4 Fahrrinnen',         url: 'https://www.elwis.de/DE/Binnenschifffahrt/Fahrrinneneinschraenkungen/Fahrrinneneinschraenkungen-node.html' }
  ];
  elwisUrls.forEach(function(t) {
    var p = probe(t.tag, t.url);
    if (!p.ok) { line(t.tag, p); return; }
    var html = p.text;
    var liCount = (html.match(/<li[\s>]/gi) || []).length;
    var trCount = (html.match(/<tr[\s>]/gi) || []).length;
    var dateMatches = (html.match(/\d{2}\.\d{2}\.\d{4}/g) || []);
    var classNotice = (html.match(/class\s*=\s*"[^"]*(meldung|nachricht|teaser|news|sperrung|info)[^"]*"/gi) || []).length;
    line(t.tag, p,
      'li=' + liCount +
      ' tr=' + trCount +
      ' dates=' + dateMatches.length +
      ' notice_class=' + classNotice +
      ' first_date=' + (dateMatches[0] || '-'));
  });

  // E5 NfB structure preview (raw)
  var nfbProbe = probe('E5 NfB-preview', elwisUrls[0].url);
  if (nfbProbe.ok) {
    var stripped = nfbProbe.text.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
    var slice = stripped.slice(0, 1800).replace(/\s+/g, ' ').trim();
    report.push('E5 NfB body 1800 chars: ' + slice);
  }

  // ---------- F: Berlin LaGeSo ----------
  report.push('');
  report.push('=== F) Berlin LaGeSo CSV (water_temp source) ===');
  var pF = probe('F1 letzte.csv', 'https://data.lageso.de/baden/0_letzte/letzte.csv');
  if (pF.ok) {
    var lines = pF.text.split(/\r?\n/);
    var header = (lines[0] || '').slice(0, 250);
    var hasTemp = /(?:^|;|,)\s*(water_temp|temperatur|wassertemperatur|temp)(?:\s*[;,]|\s*$)/i.test(header);
    line('F1 letzte.csv', pF,
      'rows=' + lines.length +
      ' has_temp_col=' + hasTemp +
      ' header=' + header);
  } else { line('F1 letzte.csv', pF); }

  // ---------- G: Brandenburg XML ----------
  report.push('');
  report.push('=== G) Brandenburg XML (water_temp source 2) ===');
  var pG = probe('G1 badestellen.xml', 'https://badestellen.brandenburg.de/web/badestellen/badestellen/-/export/badestellen.xml');
  if (pG.ok) {
    var hasTempG = /<\s*(temperatur|wassertemperatur|water_temp|temp)\b/i.test(pG.text) ||
                   /\b(temperatur|wassertemperatur|water_temp)\s*=/i.test(pG.text);
    var sampleTags = (pG.text.match(/<[a-zA-Z][\w:-]*/g) || []).slice(0, 15).join(' ');
    line('G1 badestellen.xml', pG,
      'has_temp_marker=' + hasTempG +
      ' first_tags=' + sampleTags);
  } else { line('G1 badestellen.xml', pG); }

  // ---------- H: Geoportal BB ----------
  report.push('');
  report.push('=== H) Geoportal Brandenburg ===');
  var pH = probe('H1 geoportal', 'https://geoportal.brandenburg.de/gs-json/xml?fileid=9DD12A01-EB80-4166-A0D2-71239328DB57');
  line('H1 geoportal', pH, pH.ok ? 'sample=' + pH.text.slice(0, 120).replace(/\s+/g, ' ') : '');

  Logger.log('[AUDIT]\n' + report.join('\n'));
  return report;
}

// ===========================================================================
// END ELWIS PIPELINE
// ===========================================================================
