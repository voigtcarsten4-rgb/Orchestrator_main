// ===========================================================================
// ELWIS INTEGRATION – Wave Bite / Waterinfo
// Erstellt: 30.04.2026 | ADDITIV – kein Write auf Master/Waters/WaterReadings
// Namespace verifiziert: http://www.ris.eu/nts.ms/2.0.4.0 (WSDL live 30.04.2026)
// SOAPAction verifiziert: "http://www.ris.eu/nts.ms/get_messages"
// FIX v2: parseElwisResponse_ nutzt findElwisElements_() mit getChildren()
// PROXY v3: fetchElwisNotices_ nutzt Cloudflare Worker wenn ELWIS_PROXY_URL gesetzt
// ===========================================================================

/**
 * ENTRY POINT – öffentlich ausführbar aus Apps Script Editor.
 * Schreibt NUR ins Elwis_Notices_Staging Sheet (additiv).
 */
function runElwisStagingDryRun() {
  var ss = SpreadsheetApp.getActive();
  var stagingSheet = initElwisStaging_(ss);
  if (!stagingSheet) {
    Logger.log('[ELWIS] ABBRUCH: Staging-Sheet konnte nicht initialisiert werden.');
    return;
  }
  Logger.log('[ELWIS] Starte Dry-Run – Staging-Sheet: Elwis_Notices_Staging');

  var watersLookup = buildWatersLookup_(ss);
  Logger.log('[ELWIS] Waters-Lookup: ' + Object.keys(watersLookup).length + ' Eintraege geladen.');

  var totalFetched = 0;
  var totalWritten = 0;
  var messageTypes = ['FTM', 'WRM'];

  for (var t = 0; t < messageTypes.length; t++) {
    var msgType = messageTypes[t];
    Logger.log('[ELWIS] Verarbeite message_type: ' + msgType);
    try {
      var result = fetchElwisNotices_(msgType, 14);
      if (!result) { Logger.log('[ELWIS] ' + msgType + ': Kein Ergebnis.'); continue; }

      var rows = [];
      if (result.isProxy) {
        // Proxy-Pfad: JSON bereits geparst, direkt als Rows verarbeiten
        Logger.log('[ELWIS] ' + msgType + ': Proxy-Pfad. Nachrichten: ' + result.messages.length + ' / total: ' + result.total_count);
        totalFetched += result.messages.length;
        for (var pi = 0; pi < result.messages.length; pi++) {
          var row = parseElwisNoticeFromProxy_(result.messages[pi], msgType);
          if (row) rows.push(matchElwisToWater_(row, watersLookup));
        }
      } else {
        // SOAP-Fallback-Pfad: XML parsen
        var elements = parseElwisResponse_(result.xml);
        Logger.log('[ELWIS] ' + msgType + ': result_message gefunden: ' + elements.length);
        totalFetched += elements.length;
        for (var i = 0; i < elements.length; i++) {
          var row = parseElwisNotice_(elements[i], msgType);
          if (row) rows.push(matchElwisToWater_(row, watersLookup));
        }
      }

      Logger.log('[ELWIS] ' + msgType + ': ' + rows.length + ' Zeilen geparst.');
      if (rows.length > 0) {
        writeElwisToStaging_(stagingSheet, rows);
        totalWritten += rows.length;
      }
    } catch (e) {
      Logger.log('[ELWIS] ' + msgType + ' Fehler: ' + e.message);
    }
  }
  Logger.log('[ELWIS] Dry-Run abgeschlossen. Fetch: ' + totalFetched + ' | Staging: ' + totalWritten);
}

// ===========================================================================
// SHEET INIT
// ===========================================================================
function initElwisStaging_(ss) {
  var SHEET_NAME = 'Elwis_Notices_Staging';
  var HEADERS = ['source','notice_id','title','type','area','waterway',
    'valid_from','valid_to','published_at','url','raw_text',
    'matched_water_id','matched_bb_nr','match_confidence','created_at','match_notes'];
  try {
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      Logger.log('[ELWIS] Staging-Sheet neu erstellt.');
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      Logger.log('[ELWIS] Header gesetzt.');
    }
    return sheet;
  } catch (e) {
    Logger.log('[ELWIS] initElwisStaging_ Fehler: ' + e.message);
    return null;
  }
}

// ===========================================================================
// FETCH – Proxy bevorzugt, SOAP als Fallback
// ===========================================================================
function fetchElwisNotices_(messageType, daysBack) {
  // --- Proxy-Pfad ---
  var proxyUrl = '';
  try {
    proxyUrl = PropertiesService.getScriptProperties().getProperty('ELWIS_PROXY_URL') || '';
  } catch (e) {
    Logger.log('[ELWIS] Script Property Fehler: ' + e.message);
  }

  if (proxyUrl) {
    try {
      var url = proxyUrl + '/elwis/nts?message_type=' + encodeURIComponent(messageType) +
                '&days_back=' + daysBack + '&limit=200';
      Logger.log('[ELWIS] Proxy-URL: ' + url);
      var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      var code = resp.getResponseCode();
      Logger.log('[ELWIS] Proxy HTTP ' + code + ' fuer ' + messageType);
      if (code === 200) {
        var json = JSON.parse(resp.getContentText('UTF-8'));
        if (json.ok && json.messages) {
          return { isProxy: true, messages: json.messages, total_count: json.total_count || json.count };
        }
        Logger.log('[ELWIS] Proxy JSON unvollstaendig: ' + JSON.stringify(json).slice(0, 200));
      }
      Logger.log('[ELWIS] Proxy fehlgeschlagen (HTTP ' + code + ') – Fallback zu SOAP');
    } catch (e) {
      Logger.log('[ELWIS] Proxy Exception: ' + e.message + ' – Fallback zu SOAP');
    }
  } else {
    Logger.log('[ELWIS] Kein ELWIS_PROXY_URL gesetzt – direkter SOAP-Aufruf');
  }

  // --- SOAP-Fallback ---
  var endpoint = 'https://nts40.elwis.de/server/web/MessageServer.php';
  var ns = 'http://www.ris.eu/nts.ms/2.0.4.0';
  var soapAction = 'http://www.ris.eu/nts.ms/get_messages';
  var now = new Date();
  var from = new Date(now.getTime() - daysBack * 24 * 3600 * 1000);
  var fmt = function(d) { return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd'); };
  var soapBody = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="' + ns + '">' +
    '<soap:Body><tns:get_messages_query>' +
    '<tns:message_type>' + messageType + '</tns:message_type>' +
    '<tns:dates_issue><tns:date_start>' + fmt(from) + '</tns:date_start>' +
    '<tns:date_end>' + fmt(now) + '</tns:date_end></tns:dates_issue>' +
    '<tns:paging_request><tns:offset>0</tns:offset><tns:limit>200</tns:limit>' +
    '<tns:total_count>true</tns:total_count></tns:paging_request>' +
    '</tns:get_messages_query></soap:Body></soap:Envelope>';
  var options = {
    method: 'post',
    contentType: 'text/xml; charset=UTF-8',
    headers: { 'SOAPAction': '"' + soapAction + '"' },
    payload: soapBody,
    muteHttpExceptions: true
  };
  try {
    var soapResp = UrlFetchApp.fetch(endpoint, options);
    var soapCode = soapResp.getResponseCode();
    Logger.log('[ELWIS] SOAP HTTP ' + soapCode + ' fuer ' + messageType);
    if (soapCode !== 200) { return null; }
    return { isProxy: false, xml: soapResp.getContentText('UTF-8') };
  } catch (e) {
    Logger.log('[ELWIS] SOAP Exception: ' + e.message);
    return null;
  }
}

// ===========================================================================
// PARSE PROXY RESPONSE – JSON-Objekt direkt zu Row-Array
// ===========================================================================
function parseElwisNoticeFromProxy_(msg, source) {
  try {
    var noticeId   = msg.notice_id   || (source + '-' + new Date().getTime());
    var title      = msg.contents    || msg.subject_code || '';
    var area       = msg.fairway_name || '';
    var waterway   = msg.section_name || msg.fairway_name || area;
    var validFrom  = msg.valid_from  || '';
    var validTo    = msg.valid_to    || '';
    var publishedAt = msg.date_issue || '';
    var rawText    = title.slice(0, 200);
    var createdAt  = new Date().toISOString();

    return [source, noticeId, title, source, area, waterway,
            validFrom, validTo, publishedAt, '', rawText,
            '', '', '', createdAt, ''];
  } catch (e) {
    Logger.log('[ELWIS] parseElwisNoticeFromProxy_ Fehler: ' + e.message);
    return null;
  }
}

// ===========================================================================
// PARSE RESPONSE – FIX v2: findElwisElements_ mit getChildren()
// ===========================================================================
function parseElwisResponse_(xmlText) {
  try {
    var doc = XmlService.parse(xmlText);
    var root = doc.getRootElement();
    var results = [];
    findElwisElements_(root, 'result_message', results);
    return results;
  } catch (e) {
    Logger.log('[ELWIS] parseElwisResponse_ XML-Fehler: ' + e.message);
    return [];
  }
}

/**
 * Rekursive Suche mit getChildren() – liefert echte XmlElement-Objekte.
 */
function findElwisElements_(element, targetName, results) {
  try {
    var children = element.getChildren();
    for (var i = 0; i < children.length; i++) {
      try {
        var child = children[i];
        if (child.getName() === targetName) {
          results.push(child);
        }
        findElwisElements_(child, targetName, results);
      } catch (e2) { /* skip */ }
    }
  } catch (e) { /* element nicht traversierbar */ }
}

// ===========================================================================
// PARSE NOTICE (XML-Pfad) – FIX v2: getDeepText mit getChildren()
// ===========================================================================
function parseElwisNotice_(msgElement, source) {
  try {
    var getDeepText = function(el, localName) {
      try {
        var ch = el.getChildren();
        for (var i = 0; i < ch.length; i++) {
          try { if (ch[i].getName() === localName) return ch[i].getText() || ''; } catch(e) {}
        }
        for (var j = 0; j < ch.length; j++) {
          try { var f = getDeepText(ch[j], localName); if (f) return f; } catch(e) {}
        }
      } catch(e) {}
      return '';
    };

    var year     = getDeepText(msgElement, 'year')         || getDeepText(msgElement, 'Year');
    var number   = getDeepText(msgElement, 'number')       || getDeepText(msgElement, 'Number');
    var noticeId = (year && number) ? (year + '-' + number) : ('ELWIS-' + source + '-' + new Date().getTime());
    var title    = getDeepText(msgElement, 'subject')      || getDeepText(msgElement, 'title') || '';
    var area     = getDeepText(msgElement, 'fairway_name') || getDeepText(msgElement, 'area')  || '';
    var waterway = getDeepText(msgElement, 'section_name') || getDeepText(msgElement, 'waterway_name') || area;
    var validFrom    = getDeepText(msgElement, 'date_from')  || getDeepText(msgElement, 'valid_from')  || '';
    var validTo      = getDeepText(msgElement, 'date_to')    || getDeepText(msgElement, 'valid_to')    || '';
    var publishedAt  = getDeepText(msgElement, 'date_issue') || getDeepText(msgElement, 'published_at')|| '';
    var rawText      = (title || area || waterway || noticeId).slice(0, 200);
    var createdAt    = new Date().toISOString();

    return [source, noticeId, title, source, area, waterway,
            validFrom, validTo, publishedAt, '', rawText,
            '', '', '', createdAt, ''];
  } catch (e) {
    Logger.log('[ELWIS] parseElwisNotice_ Fehler: ' + e.message);
    return null;
  }
}

// ===========================================================================
// MATCHING
// ===========================================================================
function matchElwisToWater_(noticeRow, watersLookup) {
  var waterway = (noticeRow[5] || '').toLowerCase().trim();
  var area     = (noticeRow[4] || '').toLowerCase().trim();
  var bestKey = null;
  var bestScore = 0;
  var keys = Object.keys(watersLookup);
  for (var k = 0; k < keys.length; k++) {
    var kl = keys[k].toLowerCase();
    var score = 0;
    if (waterway && (waterway.indexOf(kl) >= 0 || kl.indexOf(waterway) >= 0)) score = 3;
    else if (area && (area.indexOf(kl) >= 0 || kl.indexOf(area) >= 0)) score = 2;
    if (score > bestScore) { bestScore = score; bestKey = keys[k]; }
  }
  var row = noticeRow.slice();
  if (bestKey) {
    row[11] = watersLookup[bestKey].water_id || '';
    row[12] = watersLookup[bestKey].bb_nr    || '';
    row[13] = bestScore;
    row[15] = 'matched: ' + bestKey;
  } else {
    row[11] = ''; row[12] = ''; row[13] = 0; row[15] = 'KEIN_MATCH';
  }
  return row;
}

// ===========================================================================
// WATERS LOOKUP – FIX v2: case-insensitive Spaltensuche
// ===========================================================================
function buildWatersLookup_(ss) {
  var lookup = {};
  try {
    var sheet = ss.getSheetByName('Waters');
    if (!sheet) { Logger.log('[ELWIS] Waters-Sheet nicht gefunden.'); return lookup; }
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return lookup;
    var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var findCol = function(names) {
      for (var n = 0; n < names.length; n++) {
        var idx = headers.indexOf(names[n]);
        if (idx >= 0) return idx;
      }
      return -1;
    };
    var nameIdx    = findCol(['waterbody_name','spot_name','name','wassername','water_name','gewaesser','bezeichnung']);
    var bbNrIdx    = findCol(['bb_nr','bbnr','bb nr','bb-nr']);
    var altIdx     = findCol(['alt_name','alternativname','alias','kurz']);
    var waterIdIdx = findCol(['water_id','id','waterid','wasser_id']);
    Logger.log('[ELWIS] Waters-Spalten gefunden: name=' + nameIdx + ' bb_nr=' + bbNrIdx +
               ' alt_name=' + altIdx + ' water_id=' + waterIdIdx);
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var name = nameIdx >= 0 ? String(row[nameIdx] || '').trim() : '';
      if (!name) continue;
      var entry = {
        bb_nr:    bbNrIdx    >= 0 ? String(row[bbNrIdx]    || '') : '',
        water_id: waterIdIdx >= 0 ? String(row[waterIdIdx] || '') : ''
      };
      lookup[name] = entry;
      if (altIdx >= 0 && row[altIdx]) lookup[String(row[altIdx]).trim()] = entry;
    }
  } catch (e) { Logger.log('[ELWIS] buildWatersLookup_ Fehler: ' + e.message); }
  return lookup;
}

// ===========================================================================
// WRITE TO STAGING
// ===========================================================================
function writeElwisToStaging_(stagingSheet, rows) {
  if (!rows || rows.length === 0) return;
  var lastRow = stagingSheet.getLastRow();
  stagingSheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
}

// ===========================================================================
// DIAGNOSE
// ===========================================================================
function testElwisFetch() {
  Logger.log('[ELWIS] === DIAGNOSE START ===');
  var proxyUrl = '';
  try {
    proxyUrl = PropertiesService.getScriptProperties().getProperty('ELWIS_PROXY_URL') || '';
    Logger.log('[ELWIS] ELWIS_PROXY_URL: ' + (proxyUrl || '(nicht gesetzt)'));
  } catch (e) { Logger.log('[ELWIS] Script Property Fehler: ' + e.message); }

  try {
    var result = fetchElwisNotices_('FTM', 14);
    if (!result) {
      Logger.log('[ELWIS] FTM: kein Ergebnis');
    } else if (result.isProxy) {
      Logger.log('[ELWIS] FTM via Proxy: ' + result.messages.length + ' Nachrichten (total: ' + result.total_count + ')');
      if (result.messages.length > 0) {
        var m = result.messages[0];
        Logger.log('[ELWIS] Sample[0]: ' + m.notice_id + ' | ' + m.fairway_name + ' | ' + (m.contents || '').slice(0, 80));
      }
    } else {
      var elements = parseElwisResponse_(result.xml);
      Logger.log('[ELWIS] FTM via SOAP: ' + elements.length + ' result_message Elemente');
    }
  } catch (e) { Logger.log('[ELWIS] Fehler: ' + e.message); }
  Logger.log('[ELWIS] === DIAGNOSE ENDE ===');
}

function runElwisStagingTest() {
  return runElwisStagingDryRun();
}

// ===========================================================================
// END ELWIS INTEGRATION – Wave Bite 30.04.2026 – PROXY v3
// ===========================================================================
