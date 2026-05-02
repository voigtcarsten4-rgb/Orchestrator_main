/*
 * Website API (read-only, additive)
 *
 * Supported endpoints:
 *   doGet?action=stations
 *   doGet?action=detail&water_id=...
 *   doGet?action=all
 *
 * Safe/verified fields:
 *   Waters: water_id, spot_name, district, waterbody_name, source_key, source_key_alt, category
 *   WaterReadings: water_id, reading_id, source, source_url, measured_at/date/datum,
 *                  latitude/longitude, badestellelink, profillink, ort, badestelle, gewaesser,
 *                  kreis, smiley, hinweis, bakteriologie, sichttiefe, algen, wc, gastronomie,
 *                  rettungsschwimmer, strandbeschaffenheit, quality_notice/notice/hint
 *   Master: bb_nr, detail_url, latitude, longitude, latest_measured_at, ort, kreis,
 *           badestelle, gewaesser, hinweis, algen, bakteriologie, sichttiefe_m
 *
 * Optional/fallback-based fields:
 *   region, map_url, detail_url, image_url, notice, name
 *
 * Not safely proven in the current local engine stand:
 *   WaterNotices sheet, map_image, forecast/captain UI fields, water_level fields,
 *   status UI fields, eco/ente/water_temp dedicated headers.
 */

function buildStationsList_() {
  const ctx = loadWebsiteApiContext_();
  return ctx.stationRows.map(function(rowRef) {
    return buildStationListItem_(ctx, rowRef);
  }).filter(function(item) {
    return String(item.water_id || '').trim() !== '';
  });
}

function buildWaterDetail_(waterId) {
  const id = String(waterId || '').trim();
  if (!id) return null;

  const ctx = loadWebsiteApiContext_();
  const resolvedId = resolveWaterId_(id);
  if (!resolvedId) { logBridgeMiss_(id, 'buildWaterDetail_'); return null; }
  const rowRef = findRowRefsByWaterId_(ctx, resolvedId);
  if (!rowRef) { logBridgeMiss_(id, 'buildWaterDetail_'); return null; }

  const refs = resolveRefs_(ctx, rowRef);
  const summary = buildStationListItem_(ctx, rowRef);
  const notice = buildNoticeObject_(ctx, refs);

  return {
    water_id: summary.water_id,
    name: summary.name || null,
    spot_name: summary.spot_name || null,
    region: summary.region || null,
    source: summary.source || null,
    bb_nr: summary.bb_nr || null,
    location: {
      lat: summary.latitude,
      lng: summary.longitude
    },
    map: {
      url: summary.map_url || null,
      detail: summary.detail_url || null,
      image: summary.image_url || null
    },
    waterbody_name: summary.waterbody_name || null,
    ort: summary.ort || null,
    kreis: summary.kreis || null,
    region_state: summary.region_state || null,
    region_area: summary.region_area || null,
    water_type: summary.water_type || null,
    measurements: {
      water_temp: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['water_temp'], ['watertemp'], ['wassertemperatur'], ['temperatur']] }
      ]),
      sichttiefe_m: numericOrNull_(pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['sichttiefe_m'], ['sichttiefe'], ['clarity']] },
        { table: 'master', row: 'masterRow', aliases: [['sichttiefe_m'], ['sichttiefe'], ['clarity']] }
      ])),
      bakteriologie: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['bakteriologie']] },
        { table: 'master', row: 'masterRow', aliases: [['bakteriologie']] }
      ]),
      algen: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['algen']] },
        { table: 'master', row: 'masterRow', aliases: [['algen']] }
      ]),
      eco: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['eco']] }
      ]),
      ente: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['ente']] }
      ]),
      water_level: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['water_level'], ['wasserstand']] }
      ]),
      trend: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['water_level_trend'], ['trend']] }
      ]),
      station: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['pegel_station'], ['station'], ['messstelle']] }
      ])
    },
    status: {
      visit: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['visit_status']] }
      ]),
      bathing: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['bathing_status'], ['smiley']] },
        { table: 'master', row: 'masterRow', aliases: [['smiley']] }
      ]),
      boating: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['boating_status']] }
      ]),
      explanation: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['status_explanation'], ['quality_notice'], ['notice'], ['hint'], ['hinweis']] },
        { table: 'master', row: 'masterRow', aliases: [['hinweis']] }
      ]),
      explanation_human: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['status_explanation_humanized'], ['quality_notice'], ['notice'], ['hint'], ['hinweis']] },
        { table: 'master', row: 'masterRow', aliases: [['hinweis']] }
      ]),
      smiley: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['smiley']] },
        { table: 'master', row: 'masterRow', aliases: [['smiley']] }
      ]),
      hazard_status: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['hazard_status'], ['hazardstatus']] },
        { table: 'master', row: 'masterRow', aliases: [['hazard_status'], ['hazardstatus']] }
      ]),
      hazard_reason: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['hazard_reason'], ['hazardreason']] },
        { table: 'master', row: 'masterRow', aliases: [['hazard_reason'], ['hazardreason']] }
      ]),
      boating_restriction: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['boating_restriction'], ['boatingrestriction'], ['bootsverbot']] },
        { table: 'master', row: 'masterRow', aliases: [['boating_restriction'], ['boatingrestriction'], ['bootsverbot']] }
      ]),
      boating_reason: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['boating_reason'], ['boatingreason']] },
        { table: 'master', row: 'masterRow', aliases: [['boating_reason'], ['boatingreason']] }
      ])
    },
    infra: {
      wc: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['wc']] },
        { table: 'master', row: 'masterRow', aliases: [['wc']] }
      ]),
      gastronomie: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['gastronomie']] },
        { table: 'master', row: 'masterRow', aliases: [['gastronomie']] }
      ]),
      rettung: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['rettung'], ['rettungsschwimmer']] },
        { table: 'master', row: 'masterRow', aliases: [['rettung'], ['rettungsschwimmer']] }
      ]),
      strandbeschaffenheit: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['strandbeschaffenheit']] },
        { table: 'master', row: 'masterRow', aliases: [['strandbeschaffenheit']] }
      ]),
      abfallentsorgung: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['abfallentsorgung']] },
        { table: 'master', row: 'masterRow', aliases: [['abfallentsorgung']] }
      ])
    },
    forecast: {
      text: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['forecast_text']] }
      ]),
      recommendation: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['recommendation_text']] }
      ]),
      alert: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['alert_text']] }
      ])
    },
    captain: {
      outlook: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['captain_outlook_ui']] }
      ]),
      tip: pickFromRefs_(refs, [
        { table: 'readings', row: 'readingsRow', aliases: [['captain_tip_ui']] }
      ])
    },
    notice: notice,
    last_updated: toIsoStringOrNull_(pickFromRefs_(refs, [
      { table: 'readings', row: 'readingsRow', aliases: [['measured_at'], ['measuredat'], ['datum'], ['date']] },
      { table: 'master', row: 'masterRow', aliases: [['latest_measured_at']] }
    ]))
  };
}

function buildPayload_() {
  const stations = buildStationsList_();
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    count: stations.length,
    stations: stations
  };
}

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = String(params.action || 'all').trim().toLowerCase();
  const waterId = String(params.water_id || '').trim();

  try {
    if (action === 'stations') {
      return jsonOutput_({ ok: true, generated_at: new Date().toISOString(), stations: buildStationsList_() });
    }

    if (action === 'detail') {
      if (!waterId) {
        return jsonOutput_({ ok: false, error: 'missing_water_id', message: 'Parameter water_id is required for action=detail.' });
      }
      const resolvedId = resolveWaterId_(waterId); // BRIDGE 2026-04-30
      const detail = buildWaterDetail_(resolvedId);
      if (!detail) {resolvedId
        return jsonOutput_({ ok: false, error: 'not_found', message: 'No station found for the given water_id.', water_id: waterId });
      }
      return jsonOutput_({ ok: true, generated_at: new Date().toISOString(), detail: detail });
    }

    if (action === 'all') {
      return jsonOutput_(buildPayload_());
    }

    // ADDITIVE 30.04.2026: ELWIS Warnmeldungen fuer Wasserstrassen
    if (action === 'elwis_notices') {
      return jsonOutput_(getElwisNotices_(params));
    }

    return jsonOutput_({ ok: false, error: 'invalid_action', message: 'Supported actions: stations, detail, all, elwis_notices.' });
  } catch (err) {
    return jsonOutput_({
      ok: false,
      error: 'server_error',
      message: String((err && err.message) || err)
    });
  }
}

function loadWebsiteApiContext_() {
  const ss = getOrchestratorSpreadsheet_();
  const waters  = wrapTable_(readTable_(mustSheet_(ss, SHEET_WATERS),   null, null));
  const readings = wrapTable_(readTable_(mustSheet_(ss, SHEET_READINGS), null, null));
  const master   = wrapTable_(readTable_(mustSheet_(ss, SHEET_MASTER),   null, null));
  const noticesSheet = ss.getSheetByName('WaterNotices');
  const notices = noticesSheet
    ? wrapTable_(readTable_(noticesSheet, null, null))
    : null;

  mustCols_(waters, [['water_id', 'waterid']], 'Waters', nullLogger_());
  mustCols_(readings, [['water_id', 'waterid']], 'WaterReadings', nullLogger_());
  mustCols_(master, [['bb_nr', 'bbnr', 'bb nr']], 'Master', nullLogger_());

  const readingsByWaterId = new Map();
  const masterByBbNr = new Map();
  const noticesByWaterId = new Map();
  const noticesByBbNr = new Map();
  const stationRows = [];

  for (let i = 0; i < readings.nRows; i++) {
    const waterId = stringValue_(readings.get(i, ['water_id', 'waterid']));
    if (waterId && !readingsByWaterId.has(waterId)) readingsByWaterId.set(waterId, i);
  }

  for (let i = 0; i < master.nRows; i++) {
    const bbNr = stringValue_(master.get(i, ['bb_nr', 'bbnr', 'bb nr']));
    if (bbNr && !masterByBbNr.has(bbNr)) masterByBbNr.set(bbNr, i);
  }

  if (notices) {
    for (let i = 0; i < notices.nRows; i++) {
      const waterId = stringValue_(getOptional_(notices, i, [['water_id', 'waterid']]));
      const bbNr = stringValue_(getOptional_(notices, i, [['bb_nr', 'bbnr', 'bb nr']]));
      if (waterId && !noticesByWaterId.has(waterId)) noticesByWaterId.set(waterId, i);
      if (bbNr && !noticesByBbNr.has(bbNr)) noticesByBbNr.set(bbNr, i);
    }
  }

  for (let i = 0; i < waters.nRows; i++) {
    const waterId = stringValue_(waters.get(i, ['water_id', 'waterid']));
    if (!waterId) continue;

    const readingIdx = readingsByWaterId.has(waterId) ? readingsByWaterId.get(waterId) : -1;
    const bbNr = resolveBbNr_(readings, readingIdx, waterId);
    const masterIdx = bbNr && masterByBbNr.has(bbNr) ? masterByBbNr.get(bbNr) : -1;
    const noticeIdx = waterId && noticesByWaterId.has(waterId)
      ? noticesByWaterId.get(waterId)
      : (bbNr && noticesByBbNr.has(bbNr) ? noticesByBbNr.get(bbNr) : -1);

    stationRows.push({
      waters: i,
      readings: readingIdx,
      master: masterIdx,
      notices: noticeIdx
    });
  }

  return {
    ss: ss,
    waters: waters,
    readings: readings,
    master: master,
    notices: notices,
    stationRows: stationRows
  };
}

function buildStationListItem_(ctx, rowRef) {
  const refs = resolveRefs_(ctx, rowRef);
  const spotName = stringValue_(pickFromRefs_(refs, [
    { table: 'waters', row: 'watersRow', aliases: [['spot_name'], ['spotname']] },
    { table: 'readings', row: 'readingsRow', aliases: [['ort'], ['badestelle']] },
    { table: 'master', row: 'masterRow', aliases: [['badestelle'], ['ort']] }
  ]));

  const name = stringValue_(pickFromRefs_(refs, [
    { table: 'waters', row: 'watersRow', aliases: [['waterbody_name'], ['name'], ['waterbodyname']] },
    { table: 'readings', row: 'readingsRow', aliases: [['gewaesser'], ['badestelle']] },
    { table: 'master', row: 'masterRow', aliases: [['name_comp'], ['gewaesser'], ['badestelle']] }
  ]));

  const region = stringValue_(pickFromRefs_(refs, [
    { table: 'waters', row: 'watersRow', aliases: [['region'], ['district']] },
    { table: 'readings', row: 'readingsRow', aliases: [['kreis'], ['ort']] },
    { table: 'master', row: 'masterRow', aliases: [['kreis'], ['ort']] }
  ]));

  const source = stringValue_(pickFromRefs_(refs, [
    { table: 'readings', row: 'readingsRow', aliases: [['source']] },
    { table: 'waters', row: 'watersRow', aliases: [['source'], ['category']] }
  ]));

  const bbNr = stringValue_(resolveBbNr_(ctx.readings, rowRef.readings, stringValue_(refs.waters.get(refs.watersRow, ['water_id', 'waterid']))));
  const detailUrl = stringValue_(pickFromRefs_(refs, [
    { table: 'master', row: 'masterRow', aliases: [['detail_url']] },
    { table: 'readings', row: 'readingsRow', aliases: [['profillink'], ['badestellelink'], ['source_url', 'sourceurl']] }
  ]));
  const mapUrl = stringValue_(pickFromRefs_(refs, [
    { table: 'readings', row: 'readingsRow', aliases: [['badestellelink'], ['profillink']] },
    { table: 'master', row: 'masterRow', aliases: [['detail_url']] }
  ])) || detailUrl;

  const rawImageUrl = stringValue_(pickFromRefs_(refs, [
    { table: 'readings', row: 'readingsRow', aliases: [['map_image']] },
    { table: 'master', row: 'masterRow', aliases: [['map_image']] },
    { table: 'waters', row: 'watersRow', aliases: [['map_image']] }
  ]));

  const imageUrl = rawImageUrl || detailUrl || mapUrl || '';

  return {
    water_id: stringValue_(refs.waters.get(refs.watersRow, ['water_id', 'waterid'])),
    spot_name: spotName || null,
    waterbody_name: stringValue_(pickFromRefs_(refs, [
      { table: 'waters', row: 'watersRow', aliases: [['waterbody_name'], ['waterbodyname']] },
      { table: 'readings', row: 'readingsRow', aliases: [['gewaesser'], ['badegewaesser']] },
      { table: 'master', row: 'masterRow', aliases: [['gewaesser'], ['badegewaesser']] }
    ])) || null,
    name: (name || spotName || null),
    ort: stringValue_(pickFromRefs_(refs, [
      { table: 'readings', row: 'readingsRow', aliases: [['ort']] },
      { table: 'master', row: 'masterRow', aliases: [['ort']] }
    ])) || null,
    kreis: stringValue_(pickFromRefs_(refs, [
      { table: 'readings', row: 'readingsRow', aliases: [['kreis']] },
      { table: 'master', row: 'masterRow', aliases: [['kreis']] }
    ])) || null,
    region: region || null,
    region_state: stringValue_(getOptional_(refs.waters, refs.watersRow, [['region_state', 'regionstate']])) || null,
    region_area: stringValue_(getOptional_(refs.waters, refs.watersRow, [['region_area', 'regionarea']])) || null,
    water_type: stringValue_(getOptional_(refs.waters, refs.watersRow, [['water_type', 'watertype'], ['category']])) || null,
    source: source || null,
    bb_nr: bbNr || null,
    map_url: mapUrl || null,
    detail_url: detailUrl || null,
    image_url: imageUrl || null,
    smiley: stringValue_(pickFromRefs_(refs, [
      { table: 'readings', row: 'readingsRow', aliases: [['smiley']] },
      { table: 'master', row: 'masterRow', aliases: [['smiley']] }
    ])) || null,
    bakteriologie: stringValue_(pickFromRefs_(refs, [
      { table: 'readings', row: 'readingsRow', aliases: [['bakteriologie']] },
      { table: 'master', row: 'masterRow', aliases: [['bakteriologie']] }
    ])) || null,
    algen: stringValue_(pickFromRefs_(refs, [
      { table: 'readings', row: 'readingsRow', aliases: [['algen']] },
      { table: 'master', row: 'masterRow', aliases: [['algen']] }
    ])) || null,
    hinweis: stringValue_(pickFromRefs_(refs, [
      { table: 'readings', row: 'readingsRow', aliases: [['hinweis']] },
      { table: 'master', row: 'masterRow', aliases: [['hinweis']] }
    ])) || null,
    latitude: numericOrNull_(pickFromRefs_(refs, [
      { table: 'readings', row: 'readingsRow', aliases: [['latitude'], ['lat']] },
      { table: 'master', row: 'masterRow', aliases: [['latitude'], ['lat']] }
    ])),
    longitude: numericOrNull_(pickFromRefs_(refs, [
      { table: 'readings', row: 'readingsRow', aliases: [['longitude'], ['lng'], ['lon']] },
      { table: 'master', row: 'masterRow', aliases: [['longitude'], ['lng'], ['lon']] }
    ]))
  };
}

function resolveRefs_(ctx, rowRef) {
  return {
    waters: ctx.waters,
    readings: rowRef.readings >= 0 ? ctx.readings : null,
    master: rowRef.master >= 0 ? ctx.master : null,
    notices: (ctx.notices && rowRef.notices >= 0) ? ctx.notices : null,
    watersRow: rowRef.waters,
    readingsRow: rowRef.readings,
    masterRow: rowRef.master,
    noticesRow: rowRef.notices
  };
}

function findRowRefsByWaterId_(ctx, waterId) {
  for (var i = 0; i < ctx.stationRows.length; i++) {
    var rowRef = ctx.stationRows[i];
    var wid = stringValue_(ctx.waters.get(rowRef.waters, ['water_id', 'waterid']));
    if (wid === waterId) return rowRef;
  }
  return null;
}

function resolveBbNr_(readings, readingRow, waterId) {
  if (readings && readingRow >= 0) {
    const bbNr = stringValue_(getOptional_(readings, readingRow, [['bb_nr', 'bbnr', 'bb nr']]));
    if (bbNr) return bbNr;
  }

  const id = String(waterId || '').trim();
  const match = id.match(/^bb_(\d{1,6})$/i);
  return match ? match[1] : '';
}

function buildNoticeObject_(ctx, refs) {
  const noticeValue = stringValue_(pickFromRefs_(refs, [
    { table: 'notices', row: 'noticesRow', aliases: [['notice_body'], ['body'], ['notice'], ['hinweis']] },
    { table: 'readings', row: 'readingsRow', aliases: [['quality_notice'], ['notice'], ['hint'], ['hinweis']] },
    { table: 'master', row: 'masterRow', aliases: [['hinweis']] }
  ]));

  if (!noticeValue) {
    return {
      title: null,
      body: null,
      icon: null,
      priority: null
    };
  }

  return {
    title: stringValue_(pickFromRefs_(refs, [
      { table: 'notices', row: 'noticesRow', aliases: [['notice_title'], ['title']] }
    ])) || 'Hinweis',
    body: noticeValue,
    icon: stringValue_(pickFromRefs_(refs, [
      { table: 'notices', row: 'noticesRow', aliases: [['notice_icon'], ['icon']] }
    ])) || null,
    priority: stringValue_(pickFromRefs_(refs, [
      { table: 'notices', row: 'noticesRow', aliases: [['notice_priority'], ['priority']] }
    ])) || null
  };
}

function pickFromRefs_(refs, defs) {
  for (var i = 0; i < defs.length; i++) {
    var def = defs[i];
    var table = refs[def.table];
    var row = refs[def.row];
    var value = getOptional_(table, row, def.aliases);
    if (!isBlank_(value)) return value;
  }
  return null;
}

function getOptional_(table, rowIndex, aliasGroups) {
  if (!table || typeof table.get !== 'function' || rowIndex == null || rowIndex < 0) return null;
  for (var i = 0; i < aliasGroups.length; i++) {
    var value = table.get(rowIndex, aliasGroups[i]);
    if (!isBlank_(value)) return value;
  }
  return null;
}

function stringValue_(value) {
  return String(value == null ? '' : value).trim();
}

function numericOrNull_(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && isFinite(value)) return value;
  var parsed = parseFloat(String(value).replace(',', '.'));
  return isFinite(parsed) ? parsed : null;
}

function toIsoStringOrNull_(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  var parsed = Date.parse(value);
  return isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function isBlank_(value) {
  return value == null || String(value).trim() === '';
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function nullLogger_() {
  return {
    info: function() {},
    warn: function() {},
    error: function() {},
    flush: function() {}
  };
}

/**
 * wrapTable_() Compatibility shim (additiv, 30.04.2026)
 * Die live Code.gs readTable_() gibt { rows[], nRows, findColOptional(), findCol(), set() } zurueck.
 * WebsiteApi.gs erwartet zusaetzlich .get(rowIdx, aliases) und .hasCol(aliases).
 * Diese Funktion patcht das Table-Objekt additiv ohne bestehende Felder zu aendern.
 */
function wrapTable_(tbl) {
  if (!tbl) return tbl;
  if (typeof tbl.get === 'function') return tbl;

  var lookup = typeof tbl.findColOptional === 'function'
    ? tbl.findColOptional.bind(tbl)
    : function() { return -1; };

  tbl.get = function(rowIdx, aliases) {
    if (rowIdx == null || rowIdx < 0) return '';
    var dataRows = tbl.rows || tbl.data || [];
    if (rowIdx >= dataRows.length) return '';
    var col = lookup(aliases);
    return col >= 0 ? dataRows[rowIdx][col] : '';
  };

  tbl.hasCol = function(aliases) {
    return lookup(aliases) >= 0;
  };

  return tbl;
}

// =============================================================================
// ELWIS NOTICES API  (additiv, 30.04.2026)
// Liest aus Elwis_Notices_Active (bevorzugt) oder Elwis_Notices_Staging
// Schreibt NIEMALS in Master, Waters oder WaterReadings
// =============================================================================

function getElwisNotices_(params) {
  var ss = getOrchestratorSpreadsheet_();

  var waterId    = String(params.water_id    || '').trim();
  var bbNr       = String(params.bb_nr       || '').trim();
  var activeOnly = String(params.active_only || 'true').toLowerCase() !== 'false';
  var limitParam = Math.min(parseInt(params.limit || '50', 10), 200);
  if (isNaN(limitParam) || limitParam < 1) limitParam = 50;

  var shActive  = ss.getSheetByName('Elwis_Notices_Active');
  var shStaging = ss.getSheetByName('Elwis_Notices_Staging');
  var sh = shActive || shStaging;

  if (!sh) {
    return { ok: false, error: 'no_elwis_sheet',
             message: 'Neither Elwis_Notices_Active nor Elwis_Notices_Staging found.',
             notices: [], count: 0 };
  }

  var data = sh.getDataRange().getValues();
  if (data.length < 2) {
    return { ok: true, notices: [], count: 0, source: sh.getName(),
             generated_at: new Date().toISOString() };
  }

  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var today = new Date().toISOString().slice(0, 10);

  var idxValid      = headers.indexOf('valid_to');
  var idxWaterId    = headers.indexOf('matched_water_id');
  var idxBbNr       = headers.indexOf('matched_bb_nr');
  var idxNoticeId   = headers.indexOf('notice_id');
  var idxTitle      = headers.indexOf('title');
  var idxWaterway   = headers.indexOf('waterway');
  var idxSeverity   = headers.indexOf('severity');
  var idxType       = headers.indexOf('notice_type');
  var idxFrom       = headers.indexOf('valid_from');
  var idxUrl        = headers.indexOf('url');
  var idxSummary    = headers.indexOf('ui_summary');
  var idxConfidence = headers.indexOf('match_confidence');
  var idxText       = headers.indexOf('raw_text');

  var notices = [];

  for (var i = 1; i < data.length && notices.length < limitParam; i++) {
    var row = data[i];

    if (activeOnly && idxValid >= 0) {
      var validTo = String(row[idxValid] || '').slice(0, 10);
      if (validTo && validTo < today) continue;
    }

    if (waterId && idxWaterId >= 0) {
      if (String(row[idxWaterId] || '').trim() !== waterId) continue;
    }

    if (bbNr && idxBbNr >= 0) {
      if (String(row[idxBbNr] || '').trim() !== bbNr) continue;
    }

    notices.push({
      notice_id:        idxNoticeId   >= 0 ? String(row[idxNoticeId]   || '') : '',
      title:            idxTitle      >= 0 ? String(row[idxTitle]      || '') : '',
      waterway:         idxWaterway   >= 0 ? String(row[idxWaterway]   || '') : '',
      notice_type:      idxType       >= 0 ? String(row[idxType]       || '') : '',
      severity:         idxSeverity   >= 0 ? String(row[idxSeverity]   || '') : '',
      valid_from:       idxFrom       >= 0 ? String(row[idxFrom]       || '').slice(0,10) : '',
      valid_to:         idxValid      >= 0 ? String(row[idxValid]      || '').slice(0,10) : '',
      ui_summary:       idxSummary    >= 0 ? String(row[idxSummary]    || '') : '',
      url:              idxUrl        >= 0 ? String(row[idxUrl]        || '') : '',
      match_confidence: idxConfidence >= 0 ? String(row[idxConfidence] || '') : '',
      matched_water_id: idxWaterId    >= 0 ? String(row[idxWaterId]    || '') : '',
      matched_bb_nr:    idxBbNr       >= 0 ? String(row[idxBbNr]       || '') : '',
      raw_text_short:   idxText       >= 0 ? String(row[idxText] || '').slice(0,150) : ''
    });
  }

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    count: notices.length,
    source: sh.getName(),
    filters_applied: {
      water_id: waterId || null,
      bb_nr: bbNr || null,
      active_only: activeOnly,
      limit: limitParam
    },
    notices: notices
  };
}
