/* =========================
   BOAT CONDITIONS PHASE A
   PEGELONLINE + OPEN-METEO
   DRY RUN / DIAGNOSIS ONLY
   ========================= */

function fetchPegelOnline_(lat, lon, log) {
  if (lat == null || lon == null) return null;
  try {
    const nLat = toNumberMaybe_(lat);
    const nLon = toNumberMaybe_(lon);
    if (nLat === "" || nLon === "") return null;

    const latNum = Number(nLat);
    const lonNum = Number(nLon);
    if (!isFinite(latNum) || !isFinite(lonNum)) return null;

    const url = "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json";
    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      method: "get",
      headers: { "User-Agent": "WaveBite-BoatEngine/6.7.0" }
    });

    if (resp.getResponseCode() !== 200) {
      log.warn("PEGELONLINE fetch failed", { code: resp.getResponseCode() });
      return null;
    }

    const txt = resp.getContentText("UTF-8");
    const data = JSON.parse(txt);
    if (!Array.isArray(data)) return null;

    const MAX_DISTANCE_KM = 50;
    let bestStation = null;
    let bestDist = Infinity;

    for (const station of data) {
      const sLat = toNumberMaybe_(station.latitude);
      const sLon = toNumberMaybe_(station.longitude);
      if (sLat === "" || sLon === "") continue;

      const sLatNum = Number(sLat);
      const sLonNum = Number(sLon);
      if (!isFinite(sLatNum) || !isFinite(sLonNum)) continue;

      const dx = (sLonNum - lonNum) * 111.32 * Math.cos((latNum * Math.PI) / 180);
      const dy = (sLatNum - latNum) * 110.574;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MAX_DISTANCE_KM && dist < bestDist) {
        bestDist = dist;
        bestStation = station;
      }
    }

    if (!bestStation) return null;

    const stationUrl = "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/" + encodeURIComponent(bestStation.uuid) + "/currentmeasurement.json";
    const mResp = UrlFetchApp.fetch(stationUrl, {
      muteHttpExceptions: true,
      method: "get",
      headers: { "User-Agent": "WaveBite-BoatEngine/6.7.0" }
    });

    if (mResp.getResponseCode() !== 200) return null;

    const mData = JSON.parse(mResp.getContentText("UTF-8"));
    return {
      station_name: bestStation.longname || bestStation.shortname || "",
      water_level: mData.value || 0,
      timestamp: mData.timestamp || ""
    };
  } catch (e) {
    log.warn("PEGELONLINE error", { err: String(e) });
    return null;
  }
}

function fetchOpenMeteo_(lat, lon, log) {
  if (lat == null || lon == null) return null;
  try {
    const nLat = toNumberMaybe_(lat);
    const nLon = toNumberMaybe_(lon);
    if (nLat === "" || nLon === "") return null;

    const latNum = Number(nLat);
    const lonNum = Number(nLon);
    if (!isFinite(latNum) || !isFinite(lonNum)) return null;

    const url = "https://api.open-meteo.com/v1/forecast?" +
      "latitude=" + latNum +
      "&longitude=" + lonNum +
      "&current=temperature_2m,windspeed_10m,windgusts_10m,wind_direction_10m,visibility,precipitation,weather_code,is_day" +
      "&timezone=Europe/Berlin";

    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      method: "get",
      headers: { "User-Agent": "WaveBite-BoatEngine/6.7.0" }
    });

    if (resp.getResponseCode() !== 200) {
      log.warn("OPEN-METEO fetch failed", { code: resp.getResponseCode() });
      return null;
    }

    const data = JSON.parse(resp.getContentText("UTF-8"));
    if (!data.current) return null;

    const curr = data.current;
    return {
      temperature_air: toNumberMaybe_(curr.temperature_2m),
      wind_speed: toNumberMaybe_(curr.windspeed_10m),
      wind_gust: toNumberMaybe_(curr.windgusts_10m),
      wind_direction: toNumberMaybe_(curr.wind_direction_10m),
      visibility: toNumberMaybe_(curr.visibility),
      rain_intensity: toNumberMaybe_(curr.precipitation),
      weather_code: toNumberMaybe_(curr.weather_code),
      timestamp: curr.time || ""
    };
  } catch (e) {
    log.warn("OPEN-METEO error", { err: String(e) });
    return null;
  }
}

function normalizeConditions_(pegelData, meteoData) {
  const conditions = {
    wind_speed: (meteoData && meteoData.wind_speed !== "") ? meteoData.wind_speed : null,
    wind_gust: (meteoData && meteoData.wind_gust !== "") ? meteoData.wind_gust : null,
    wind_direction: (meteoData && meteoData.wind_direction !== "") ? meteoData.wind_direction : null,
    water_level: (pegelData && pegelData.water_level !== "") ? pegelData.water_level : null,
    temperature_air: (meteoData && meteoData.temperature_air !== "") ? meteoData.temperature_air : null,
    visibility: (meteoData && meteoData.visibility !== "") ? meteoData.visibility : null,
    rain_intensity: (meteoData && meteoData.rain_intensity !== "") ? meteoData.rain_intensity : null,
    weather_code: (meteoData && meteoData.weather_code !== "") ? meteoData.weather_code : null,
    pegel_station: (pegelData && pegelData.station_name) ? pegelData.station_name : "",
    meteo_time: (meteoData && meteoData.timestamp) ? meteoData.timestamp : "",
    pegel_time: (pegelData && pegelData.timestamp) ? pegelData.timestamp : ""
  };

  conditions.wave_height = null;
  conditions.water_level_trend = null;
  conditions.storm_risk = deriveStormRisk_(conditions);

  return conditions;
}

function deriveStormRisk_(conditions) {
  if (conditions.weather_code == null) return null;
  
  const code = Number(conditions.weather_code);
  if (code >= 80 && code <= 82) return "high";
  if (code >= 50 && code <= 67) return "medium";
  if (code >= 71 && code <= 77) return "high";
  if (code >= 85 && code <= 86) return "high";
  return "low";
}

function computeBoatStatus_(conditions) {
  if (!conditions) {
    return {
      boat_status: "unknown",
      boat_status_label: "Unbekannt",
      boat_status_icon: "⚪",
      boat_status_color: "gray",
      boat_status_reason: "Keine Bootsbedingungen-Daten"
    };
  }

  const reasons = [];

  if (conditions.storm_risk === "high") {
    reasons.push("Gewitterrisiko");
  }
  
  if (conditions.wind_gust != null && conditions.wind_gust > 40) {
    reasons.push("Böen > 40 km/h");
    if (conditions.storm_risk !== "high") {
      return {
        boat_status: "restricted",
        boat_status_label: "Eingeschränkt",
        boat_status_icon: "🔴",
        boat_status_color: "red",
        boat_status_reason: reasons.join(", ")
      };
    }
  }

  if (conditions.storm_risk === "high") {
    return {
      boat_status: "restricted",
      boat_status_label: "Eingeschränkt",
      boat_status_icon: "🔴",
      boat_status_color: "red",
      boat_status_reason: reasons.join(", ")
    };
  }

  if (conditions.wind_speed != null && conditions.wind_speed > 25) {
    reasons.push("Wind > 25 km/h");
  }
  if (conditions.wind_gust != null && conditions.wind_gust > 30) {
    reasons.push("Böen > 30 km/h");
  }
  if (conditions.visibility != null && conditions.visibility < 1000) {
    reasons.push("Sicht < 1 km");
  }
  if (conditions.rain_intensity != null && conditions.rain_intensity > 5) {
    reasons.push("Regen intensiv");
  }

  if (reasons.length > 0) {
    return {
      boat_status: "caution",
      boat_status_label: "Vorsicht",
      boat_status_icon: "🟡",
      boat_status_color: "amber",
      boat_status_reason: reasons.join(", ")
    };
  }

  return {
    boat_status: "ok",
    boat_status_label: "Empfohlen",
    boat_status_icon: "🟢",
    boat_status_color: "green",
    boat_status_reason: "Bedingungen günstig"
  };
}

function diagnoseBoatConditions_V670(ctx, log) {
  const waters = ctx.waters;
  const waterIdColW = waters.findCol(["water_id", "waterid"]);
  let latColW = waters.findColOptional(["latitude", "lat", "Latitude", "LATITUDE", "gps_lat", "coord_lat", "koord_lat"]);
  let lonColW = waters.findColOptional(["longitude", "lon", "lng", "Longitude", "LONGITUDE", "gps_lon", "coord_lon", "koord_lon"]);
  const spotNameColW = waters.findColOptional(["spot_name", "badestelle", "name"]);

  const watersName = (waters && waters.name) ? waters.name :
    ((waters && waters.sheetName) ? waters.sheetName :
    ((waters && waters.sheet && typeof waters.sheet.getName === "function") ? waters.sheet.getName() : "unknown"));
  const headers = Array.isArray(waters.headers) ? waters.headers : [];
  const firstHeaders = headers.slice(0, 20);

  log.info("Boat diagnosis headers debug", {
    waters_table: watersName,
    headers_preview: firstHeaders,
    water_id_col: waterIdColW,
    latitude_col: latColW,
    longitude_col: lonColW,
    spot_name_col: spotNameColW
  });

  if ((latColW < 0 || lonColW < 0) && headers.length) {
    const normalizedHeaders = headers.map(function(h) {
      return str_(h).trim().toLowerCase();
    });

    if (latColW < 0) {
      const manualLatIdx = normalizedHeaders.indexOf("latitude");
      if (manualLatIdx >= 0) latColW = manualLatIdx;
    }
    if (lonColW < 0) {
      const manualLonIdx = normalizedHeaders.indexOf("longitude");
      if (manualLonIdx >= 0) lonColW = manualLonIdx;
    }

    log.info("Boat diagnosis coordinate fallback result", {
      latitude_col: latColW,
      longitude_col: lonColW
    });
  }

  if (latColW < 0 || lonColW < 0) {
    const headerCount = headers.length;
    const joinedHeaders = headerCount ? headers.map(function(h) { return str_(h); }).join(" | ") : "";
    log.warn("Boat diagnosis: latitude/longitude columns missing", {
      header_count: headerCount,
      headers_joined: joinedHeaders
    });
    return;
  }

  let withWeather = 0;
  let withPegel = 0;
  let withWave = 0;
  const boatStatusCounts = { ok: 0, caution: 0, restricted: 0, unknown: 0 };
  const topReasons = new Map();
  const samples = [];

  for (let i = 0; i < waters.rows.length; i++) {
    const waterId = str_(waters.rows[i][waterIdColW]);
    if (!waterId) continue;

    const lat = waters.rows[i][latColW];
    const lon = waters.rows[i][lonColW];
    const spotName = spotNameColW >= 0 ? str_(waters.rows[i][spotNameColW]) : "";

    const pegelData = fetchPegelOnline_(lat, lon, log);
    if (pegelData) withPegel++;

    const meteoData = fetchOpenMeteo_(lat, lon, log);
    if (meteoData) withWeather++;

    const conditions = normalizeConditions_(pegelData, meteoData);
    const boatEval = computeBoatStatus_(conditions);

    boatStatusCounts[boatEval.boat_status]++;
    const reasonKey = boatEval.boat_status_reason;
    topReasons.set(reasonKey, (topReasons.get(reasonKey) || 0) + 1);

    if (samples.length < 15) {
      samples.push({
        water_id: waterId,
        spot_name: spotName,
        boat_status: boatEval.boat_status,
        boat_status_label: boatEval.boat_status_label,
        boat_status_reason: boatEval.boat_status_reason,
        wind_speed: conditions.wind_speed,
        wind_gust: conditions.wind_gust,
        water_level: conditions.water_level,
        wave_height: conditions.wave_height,
        storm_risk: conditions.storm_risk
      });
    }
  }

  const topReasonsSorted = Array.from(topReasons.entries())
    .sort(function(a, b) { return b[1] - a[1]; })
    .slice(0, 5)
    .map(function(e) { return e[0] + " (" + e[1] + ")"; });

  const summary = {
    total_spots: waters.nRows,
    spots_with_weather_data: withWeather,
    spots_with_pegel_data: withPegel,
    spots_with_wave_data: withWave,
    boat_status_counts: boatStatusCounts,
    top_boat_reasons: topReasonsSorted.join("; "),
    spots_without_sufficient_conditions: waters.nRows - (withWeather + withPegel)
  };

  log.info("Boat Conditions Diagnosis V1", summary);
  if (samples.length) {
    log.info("Boat Conditions Diagnosis Samples", samples);
  }
}

function runDiagnoseBoatConditions_V670() {
  withScriptLock_("runDiagnoseBoatConditions_V670", function(ss, log) {
    log.info("START runDiagnoseBoatConditions_V670 (Phase A)");
    const ctx = loadContext_(ss, log);
    diagnoseBoatConditions_V670(ctx, log);
    log.info("DONE runDiagnoseBoatConditions_V670");
    log.flush();
  });
}


// ===== G2 MIGRATION (TEMP) =====
function migrateG2() {
  var ss = SpreadsheetApp.openById('102BRsJJlRSLgk-DgLAUDfUjREI9w-5br9TIyx5l_NTU');
  var master = ss.getSheetByName('Master');
  var lastRow = master.getLastRow();
  Logger.log('Last row before G2: ' + lastRow);
  var a233 = master.getRange('A233').getValue();
  var a290 = master.getRange('A290').getValue();
  Logger.log('A233=' + a233 + ' A290=' + a290);
  if (a233 != 193 || a290 != 250) {
    Logger.log('ABORT: Template rows changed!');
    return;
  }
  var src233 = master.getRange(233, 1, 1, 26);
  var tgt313 = master.getRange(313, 1, 1, 26);
  src233.copyTo(tgt313);
  master.getRange('A313').setValue(260);
  master.getRange('B313').setValue('bb_260_ruhlsdorf_strand_feriendorf_dorado');
  var src290 = master.getRange(290, 1, 1, 26);
  var tgt314 = master.getRange(314, 1, 1, 26);
  src290.copyTo(tgt314);
  master.getRange('A314').setValue(283);
  master.getRange('B314').setValue('bb_283_zehdenick_ot_zabelsdorf');
  master.getRange('V314').setValue('https://badestellen.brandenburg.de/web/badestellen/badestellen/');
  SpreadsheetApp.flush();
  Logger.log('=== G2 VERIFICATION ===');
  Logger.log('R313: A=' + master.getRange('A313').getValue() + ' B=' + master.getRange('B313').getValue() + ' V=' + master.getRange('V313').getValue() + ' T_formula=' + master.getRange('T313').getFormula());
  Logger.log('R314: A=' + master.getRange('A314').getValue() + ' B=' + master.getRange('B314').getValue() + ' V=' + master.getRange('V314').getValue() + ' T_formula=' + master.getRange('T314').getFormula());
  Logger.log('R233_check: A=' + master.getRange('A233').getValue() + ' B=' + master.getRange('B233').getValue());
  Logger.log('R290_check: A=' + master.getRange('A290').getValue() + ' B=' + master.getRange('B290').getValue());
  Logger.log('G2 DONE');
}


function migrateG3() {
  var ss = SpreadsheetApp.openById('102BRsJJlRSLgk-DgLAUDfUjREI9w-5br9TIyx5l_NTU');
  var wr = ss.getSheetByName('WaterReadings');
  if (!wr) {
    Logger.log('ABORT: WaterReadings Sheet nicht gefunden');
    return;
  }
  var header = wr.getRange('AB1').getValue();
  if (String(header).toLowerCase().indexOf('bb') === -1) {
    Logger.log('ABORT: Spalte AB ist nicht bb_nr. Header=' + header);
    return;
  }
  var ab291 = wr.getRange('AB291').getValue();
  var ab299 = wr.getRange('AB299').getValue();
  Logger.log('PRE WR291 AB: ' + ab291 + ' erwartet 250');
  Logger.log('PRE WR299 AB: ' + ab299 + ' erwartet 193');
  if (ab291 != 250) {
    Logger.log('ABORT: WR291 unerwartet: ' + ab291);
    return;
  }
  if (ab299 != 193) {
    Logger.log('ABORT: WR299 unerwartet: ' + ab299);
    return;
  }
  wr.getRange('AB291').setValue(283);
  wr.getRange('AB299').setValue(260);
  SpreadsheetApp.flush();
  var post291 = wr.getRange('AB291').getValue();
  var post299 = wr.getRange('AB299').getValue();
  Logger.log('POST WR291 AB: ' + post291 + ' soll 283');
  Logger.log('POST WR299 AB: ' + post299 + ' soll 260');
  if (post291 != 283 || post299 != 260) {
    Logger.log('WARN: Post-Check fehlgeschlagen');
    return;
  }
  Logger.log('G3 DONE');
}

function verifyG3G4() {
  var ss = SpreadsheetApp.openById('102BRsJJlRSLgk-DgLAUDfUjREI9w-5br9TIyx5l_NTU');
  var wr = ss.getSheetByName('WaterReadings');
  var master = ss.getSheetByName('Master');
  
  // WR Header
  Logger.log('WR AB1 header: ' + wr.getRange('AB1').getValue());
  
  // G3 check
  Logger.log('WR AB291: ' + wr.getRange('AB291').getValue() + ' (soll 283)');
  Logger.log('WR AB299: ' + wr.getRange('AB299').getValue() + ' (soll 260)');
  
  // G2 check — Master bb_260 und bb_283
  Logger.log('Master A313: ' + master.getRange('A313').getValue() + ' (soll 260)');
  Logger.log('Master A314: ' + master.getRange('A314').getValue() + ' (soll 283)');
  
  // Alte Rows unverändert
  Logger.log('Master A233: ' + master.getRange('A233').getValue() + ' (soll 193)');
  Logger.log('Master A290: ' + master.getRange('A290').getValue() + ' (soll 250)');
  
  // Keine neuen Rows: WR letzte Row
  Logger.log('WR lastRow: ' + wr.getLastRow());
  Logger.log('Master lastRow: ' + master.getLastRow());
  
  Logger.log('G4 VERIFY DONE');
}

// ========================================== 
// EINMALIG: BridgeMapping Sheet anlegen
// Nach Ausführung entfernen
// ==========================================
function createBridgeMappingSheet_() {
  var ss = SpreadsheetApp.openById('102BRsJJlRSLgk-DgLAUDfUjREI9w-5br9TIyx5l_NTU');
  var sheetName = 'BridgeMapping';
  
  // Prüfen ob Sheet bereits existiert
  var existing = ss.getSheetByName(sheetName);
  if (existing) {
    Logger.log('BridgeMapping Sheet existiert bereits – keine Änderung.');
    return;
  }
  
  // Neues Sheet anlegen
  var sheet = ss.insertSheet(sheetName);
  
  // Spaltenheader setzen (exakt wie spezifiziert)
  var headers = [
    'old_water_id',
    'new_water_id',
    'bb_nr',
    'match_confidence',
    'match_method',
    'locked',
    'notes',
    'last_checked'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Header formatieren
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4a86e8');
  headerRange.setFontColor('#ffffff');
  
  // Spaltenbreiten anpassen
  sheet.setColumnWidth(1, 280); // old_water_id
  sheet.setColumnWidth(2, 280); // new_water_id
  sheet.setColumnWidth(3, 70);  // bb_nr
  sheet.setColumnWidth(4, 130); // match_confidence
  sheet.setColumnWidth(5, 200); // match_method
  sheet.setColumnWidth(6, 70);  // locked
  sheet.setColumnWidth(7, 250); // notes
  sheet.setColumnWidth(8, 140); // last_checked
  
  // Zeile 1 einfrieren
  sheet.setFrozenRows(1);
  
  Logger.log('BridgeMapping Sheet erfolgreich angelegt mit ' + headers.length + ' Spalten.');
  Logger.log('Spreadsheet: ' + ss.getName() + ' (' + ss.getId() + ')');
}
