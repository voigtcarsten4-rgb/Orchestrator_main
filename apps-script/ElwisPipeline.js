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

  const messageTypes = ['FTM', 'WRM'];
  const stats = {
    fetched: 0, parsed: 0, written: 0, updated: 0,
    skipped: 0, errors: [],
    sheet_rows_before: Object.keys(existing).length,
    endpoint_reachable: null
  };
  const allNotices = [];

  messageTypes.forEach(function(msgType) {
    try {
      var xml = fetchElwisNotices_(msgType, 14);
      if (!xml) {
        stats.errors.push(msgType + ': empty response');
        return;
      }
      stats.endpoint_reachable = true;
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
      stats.errors.push(msgType + ': ' + ((e && e.message) || e));
    }
  });

  if (stats.endpoint_reachable === null) stats.endpoint_reachable = false;

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
// END ELWIS PIPELINE
// ===========================================================================
