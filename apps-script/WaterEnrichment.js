// ===========================================================================
// WATER ENRICHMENT — Wave Bite
// ADDITIV: füllt fehlende Felder in WaterReadings für Brandenburger Spots,
// die im Berlin-CSV-Importer keine Wassertemperatur bekommen (Brandenburg-XML
// liefert keine Wassertemp, Berlin-CSV nur für Berliner Spots).
//
// Quelle: Pegelonline WT-Time-Series. Stationen die einen Wassertemperatur-
// Sensor haben, sind in stations.json mit timeseries-Array auffindbar.
// Wir nutzen die NÄCHSTE Station mit WT-Sensor pro Spot (max 50 km).
//
// SICHER: schreibt nur in leere Zellen. Bestehende Werte bleiben unverändert.
// Keine Trigger-Modifikation. Kein Schema-Change. Editor-Aufruf:
//   runWaterTempEnrichment   – einmaliger Lauf
// ===========================================================================

var _PEGEL_WT_STATIONS_CACHE = null;

function runWaterTempEnrichment() {
  return enrichWaterTemperatureFromPegel_();
}

function enrichWaterTemperatureFromPegel_() {
  var ss = getOrchestratorSpreadsheet_();
  var watersSheet  = ss.getSheetByName('Waters');
  var readingsSheet = ss.getSheetByName('WaterReadings');
  if (!watersSheet || !readingsSheet) {
    Logger.log('[WT-ENRICH] Sheets fehlen.');
    return { ok: false, error: 'sheets_missing' };
  }

  var stations = loadPegelWtStations_();
  if (!stations || stations.length === 0) {
    Logger.log('[WT-ENRICH] keine WT-Stationen verfügbar');
    return { ok: false, error: 'no_wt_stations' };
  }

  // Read Waters → lat/lon/water_id mapping
  var wHeaders = watersSheet.getRange(1, 1, 1, watersSheet.getLastColumn()).getValues()[0]
    .map(function(h) { return String(h || '').toLowerCase().trim(); });
  var cWid  = wHeaders.indexOf('water_id');
  var cLat  = wHeaders.indexOf('latitude');
  var cLon  = wHeaders.indexOf('longitude');
  if (cWid < 0 || cLat < 0 || cLon < 0) {
    Logger.log('[WT-ENRICH] Waters: water_id/latitude/longitude Spalten fehlen');
    return { ok: false, error: 'waters_columns_missing' };
  }
  var wRows = watersSheet.getRange(2, 1, watersSheet.getLastRow() - 1, watersSheet.getLastColumn()).getValues();
  var watersByWid = {};
  wRows.forEach(function(r) {
    var wid = String(r[cWid] || '').trim();
    var lat = parseFloat(r[cLat]);
    var lon = parseFloat(r[cLon]);
    if (wid && isFinite(lat) && isFinite(lon)) {
      watersByWid[wid] = { lat: lat, lon: lon };
    }
  });

  // Read WaterReadings — only update rows where water_temp_c is empty
  var rHeaders = readingsSheet.getRange(1, 1, 1, readingsSheet.getLastColumn()).getValues()[0]
    .map(function(h) { return String(h || '').toLowerCase().trim(); });
  var cRwid  = rHeaders.indexOf('water_id');
  var cRtemp = rHeaders.indexOf('water_temp_c');
  if (cRwid < 0 || cRtemp < 0) {
    Logger.log('[WT-ENRICH] WaterReadings: water_id/water_temp_c Spalten fehlen');
    return { ok: false, error: 'readings_columns_missing' };
  }

  var rRows = readingsSheet.getRange(2, 1, readingsSheet.getLastRow() - 1, readingsSheet.getLastColumn()).getValues();
  var stats = {
    total_rows: rRows.length,
    already_set: 0,
    no_water_meta: 0,
    no_station_within_50km: 0,
    fetch_failed: 0,
    written: 0,
    samples: []
  };

  var stationCacheByWid = {};
  for (var i = 0; i < rRows.length; i++) {
    var row = rRows[i];
    var wid = String(row[cRwid] || '').trim();
    var existing = row[cRtemp];
    if (existing !== '' && existing != null) { stats.already_set++; continue; }
    var meta = watersByWid[wid];
    if (!meta) { stats.no_water_meta++; continue; }

    var hit = stationCacheByWid[wid];
    if (hit === undefined) {
      hit = nearestPegelWtStation_(stations, meta.lat, meta.lon, 50);
      stationCacheByWid[wid] = hit;
    }
    if (!hit) { stats.no_station_within_50km++; continue; }

    var wt = fetchPegelWtCurrent_(hit.uuid);
    if (wt == null) { stats.fetch_failed++; continue; }

    readingsSheet.getRange(i + 2, cRtemp + 1).setValue(wt);
    stats.written++;
    if (stats.samples.length < 5) {
      stats.samples.push({ water_id: wid, water_temp_c: wt, station: hit.shortname, dist_km: Number(hit.dist_km.toFixed(1)) });
    }
  }

  Logger.log('[WT-ENRICH] DONE ' + JSON.stringify(stats));
  return stats;
}

function loadPegelWtStations_() {
  if (_PEGEL_WT_STATIONS_CACHE) return _PEGEL_WT_STATIONS_CACHE;
  try {
    var resp = UrlFetchApp.fetch(
      'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json?includeTimeseries=true',
      { muteHttpExceptions: true, method: 'get', headers: { 'User-Agent': 'WaveBite-WT-Enrich/1.0' } }
    );
    if (resp.getResponseCode() !== 200) {
      Logger.log('[WT-ENRICH] stations fetch HTTP ' + resp.getResponseCode());
      _PEGEL_WT_STATIONS_CACHE = [];
      return _PEGEL_WT_STATIONS_CACHE;
    }
    var arr = JSON.parse(resp.getContentText('UTF-8'));
    var withWt = [];
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i];
      var ts = s.timeseries || [];
      var hasWt = false;
      for (var j = 0; j < ts.length; j++) {
        if (String(ts[j].shortname || '').toUpperCase() === 'WT') { hasWt = true; break; }
      }
      if (hasWt && isFinite(s.latitude) && isFinite(s.longitude)) {
        withWt.push({
          uuid: s.uuid,
          shortname: s.shortname,
          longname: s.longname,
          latitude: s.latitude,
          longitude: s.longitude
        });
      }
    }
    Logger.log('[WT-ENRICH] WT-Stationen: ' + withWt.length + ' / ' + arr.length);
    _PEGEL_WT_STATIONS_CACHE = withWt;
    return withWt;
  } catch (e) {
    Logger.log('[WT-ENRICH] stations error: ' + ((e && e.message) || e));
    _PEGEL_WT_STATIONS_CACHE = [];
    return [];
  }
}

function nearestPegelWtStation_(stations, lat, lon, maxKm) {
  var best = null;
  var bestDist = Infinity;
  for (var i = 0; i < stations.length; i++) {
    var s = stations[i];
    var dx = (s.longitude - lon) * 111.32 * Math.cos((lat * Math.PI) / 180);
    var dy = (s.latitude - lat) * 110.574;
    var d  = Math.sqrt(dx * dx + dy * dy);
    if (d < maxKm && d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  if (!best) return null;
  return { uuid: best.uuid, shortname: best.shortname, longname: best.longname, dist_km: bestDist };
}

function fetchPegelWtCurrent_(uuid) {
  if (!uuid) return null;
  try {
    var url = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/' + encodeURIComponent(uuid) + '/WT/currentmeasurement.json';
    var resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      method: 'get',
      headers: { 'User-Agent': 'WaveBite-WT-Enrich/1.0' }
    });
    if (resp.getResponseCode() !== 200) return null;
    var data = JSON.parse(resp.getContentText('UTF-8'));
    var v = parseFloat(data.value);
    if (!isFinite(v)) return null;
    // Pegelonline WT is in °C
    return Number(v.toFixed(1));
  } catch (e) {
    return null;
  }
}

// ===========================================================================
// END WATER ENRICHMENT
// ===========================================================================
