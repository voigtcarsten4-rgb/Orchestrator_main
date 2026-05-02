// =============================================================================
// BRIDGE LAYER — Phase 2 (additiv, 2026-04-30)
// Mappt OLD water_id → NEW water_id über BridgeMapping-Sheet.
// READ-ONLY. Kein Schreiben in irgendein Daten-Sheet.
// Berührt KEINE bestehenden Funktionen.
// =============================================================================

var BRIDGE_CACHE_KEY_ = 'bridgeMapping_v5';
var BRIDGE_CACHE_TTL_ = 600; // 10 Minuten

// -----------------------------------------------------------------------------
// getNewIdFromOld_(old_id)
// Sucht old_id in BridgeMapping. Gibt new_water_id zurück wenn GRUEN, sonst null.
// Read-only. Keine Seiteneffekte.
// -----------------------------------------------------------------------------
function getNewIdFromOld_(oldId) {
  if (!oldId || String(oldId).trim() === '') return null;
  var id = String(oldId).trim();
  var index = loadBridgeMappingIndex_();
  if (!index) return null;
  var entry = index[id];
  if (!entry) return null;
  if (entry.confidence !== 'GRUEN') return null;
  return entry.new_water_id || null;
}

// -----------------------------------------------------------------------------
// resolveWaterId_(input_id)
// Auflösungs-Wrapper. Gibt den effektiven water_id zurück.
//   1. OLD ID mit GRUEN-Mapping → gibt new_water_id zurück
//   2. NEW ID oder unbekannte ID → Pass-through
//   3. Leere ID → Pass-through
// Keine Seiteneffekte.
// -----------------------------------------------------------------------------
function resolveWaterId_(inputId) {
  var id = String(inputId || '').trim();
  if (!id) return id;
  var mappedId = getNewIdFromOld_(id);
  return mappedId || id;
}

// -----------------------------------------------------------------------------
// logBridgeMiss_(input_id, context)
// Strukturiertes Logging für IDs die weder direkt noch per Bridge auflösbar sind.
// Rate-limited: max 1x pro ID pro 5 Minuten (via CacheService).
// Darf NIEMALS die API zum Absturz bringen (try/catch).
// -----------------------------------------------------------------------------
function logBridgeMiss_(inputId, context) {
  try {
    var id = String(inputId || '').trim();
    if (!id) return;
    var cache = CacheService.getScriptCache();
    var rateKey = 'bmiss_' + id.replace(/[^a-z0-9_]/gi, '_').substring(0, 50);
    if (cache.get(rateKey)) return;
    cache.put(rateKey, '1', 300);
    Logger.log('[BRIDGE_MISS] ts=' + new Date().toISOString()
               + ' id=' + id
               + ' ctx=' + String(context || 'unknown'));
  } catch (e) {
    // Logging darf API nie crashen
  }
}

// -----------------------------------------------------------------------------
// loadBridgeMappingIndex_()
// Lädt BridgeMapping Sheet in einen Index: { old_water_id → { new_water_id, confidence } }
// Cache: 10 Minuten via CacheService.
// Gibt null zurück bei Fehler (kein Crash).
// -----------------------------------------------------------------------------
function loadBridgeMappingIndex_() {
  // 1. Cache-Versuch
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(BRIDGE_CACHE_KEY_);
    if (cached) return JSON.parse(cached);
  } catch (e) { /* Cache-Miss — weiter */ }

  // 2. Sheet lesen
  try {
    var ss = SpreadsheetApp.openById('102BRsJJlRSLgk-DgLAUDfUjREI9w-5br9TIyx5l_NTU');
    var sh = ss.getSheetByName('BridgeMapping');
    if (!sh) {
      Logger.log('[BRIDGE] BridgeMapping sheet nicht gefunden');
      return null;
    }
    var data = sh.getDataRange().getValues();
    if (data.length < 2) return {};

    var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var idxOld  = headers.indexOf('old_water_id');
    var idxNew  = headers.indexOf('new_water_id');
    var idxConf = headers.indexOf('confidence');
        if (idxConf < 0) idxConf = headers.indexOf('match_confidence'); // fallback legacy header

    if (idxOld < 0 || idxNew < 0 || idxConf < 0) {
      Logger.log('[BRIDGE] BridgeMapping: fehlende Pflicht-Spalten');
      return null;
    }

    var index = {};
    for (var i = 1; i < data.length; i++) {
      var row   = data[i];
      var oldId = String(row[idxOld]  || '').trim();
      var newId = String(row[idxNew]  || '').trim();
      var conf  = String(row[idxConf] || '').trim().toUpperCase();
      if (!oldId || !newId) continue;
      if (conf !== 'GRUEN' && conf !== 'ROT') continue;
      index[oldId] = { new_water_id: newId, confidence: conf };
    }

    // 3. Ergebnis cachen
    try {
      cache.put(BRIDGE_CACHE_KEY_, JSON.stringify(index), BRIDGE_CACHE_TTL_);
    } catch (ce) { /* Cache-Write-Fehler — nicht fatal */ }

    return index;
  } catch (e) {
    Logger.log('[BRIDGE] Fehler beim Laden von BridgeMapping: ' + String(e.message || e));
    return null;
  }
}

// -----------------------------------------------------------------------------
// testBridgeLayer_()
// Manuelle Test-Funktion. Im Apps Script Editor ausführen.
// Kein Effekt auf Produktionsdaten.
// -----------------------------------------------------------------------------
function testBridgeLayer_() {
  Logger.log('=== BRIDGE LAYER TEST START ===');

  var t1 = getNewIdFromOld_('zo_zootzensee_zechlinerhutte');
  Logger.log('T1 [ROT→null]     : expected=null  got=' + t1 + '  PASS=' + (t1 === null));

  var t2 = getNewIdFromOld_('totally_unknown_xyz_12345');
  Logger.log('T2 [unknown→null] : expected=null  got=' + t2 + '  PASS=' + (t2 === null));

  var t3 = resolveWaterId_('totally_unknown_xyz_12345');
  Logger.log('T3 [resolve-pass] : expected=totally_unknown_xyz_12345  got=' + t3
             + '  PASS=' + (t3 === 'totally_unknown_xyz_12345'));

  var t4 = resolveWaterId_('zo_zootzensee_zechlinerhutte');
  Logger.log('T4 [resolve-ROT]  : expected=zo_zootzensee_zechlinerhutte  got=' + t4
             + '  PASS=' + (t4 === 'zo_zootzensee_zechlinerhutte'));

  try {
    logBridgeMiss_('test_id_t5', 'testBridgeLayer_');
    Logger.log('T5 [log-no-crash]: PASS');
  } catch (e) {
    Logger.log('T5 [log-no-crash]: FAIL exception=' + e.message);
  }

  var t6 = resolveWaterId_('wa_waldbad_wriezen');
  Logger.log('T6 [GRUEN-map]    : expected=bb_waldbad_wriezen  got=' + t6
             + '  PASS=' + (t6 === 'bb_waldbad_wriezen'));

  var t7 = resolveWaterId_('bb_waldbad_wriezen');
  Logger.log('T7 [new-id-pass]  : expected=bb_waldbad_wriezen  got=' + t7
             + '  PASS=' + (t7 === 'bb_waldbad_wriezen'));

  var t8 = resolveWaterId_('');
  Logger.log('T8 [empty-id]     : expected=  got="' + t8 + '"'
             + '  PASS=' + (t8 === ''));

  Logger.log('=== BRIDGE LAYER TEST END ===');
}

// Public test entry point (calls private testBridgeLayer_)
function testBridgeLayer() { testBridgeLayer_(); }

// === TEMP DIAG - REMOVE AFTER USE ===
function diagBridgeIndex() {
  var ss = SpreadsheetApp.openById('102BRsJJlRSLgk-DgLAUDfUjREI9w-5br9TIyx5l_NTU');
  var sh = ss.getSheetByName("BridgeMapping");
  if (!sh) { Logger.log("SHEET NOT FOUND"); return; }
  var data = sh.getDataRange().getValues();
    Logger.log("DATA_LEN: " + data.length);
      if (data.length > 1) { Logger.log("ROW1: " + JSON.stringify(data[1])); }
  Logger.log("RAW_HEADERS: " + JSON.stringify(data[0]));
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
  Logger.log("LOW_HEADERS: " + JSON.stringify(headers));
  var ic = headers.indexOf("confidence");
  var io = headers.indexOf("old_water_id");
  Logger.log("INDICES old=" + io + " conf=" + ic);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).indexOf("waldbad_wriezen") !== -1) {
      Logger.log("ROW_FOUND idx=" + i + " data=" + JSON.stringify(data[i]));
      break;
    }
  }
  var idx = loadBridgeMappingIndex_();
  Logger.log("IDX_NULL=" + (idx === null) + " IDX_SIZE=" + (idx ? Object.keys(idx).length : -1));
  if (idx) Logger.log("ENTRY_WA=" + JSON.stringify(idx["wa_waldbad_wriezen"]));
}

// ONE-TIME FIX: set BridgeMapping D1
function fixD1_() {
  var sh = SpreadsheetApp.getActive().getSheetByName("BridgeMapping");
  if (!sh) { Logger.log("NO SHEET"); return; }
  sh.getRange("D1").setValue("confidence");
  Logger.log("D1_FIXED: " + sh.getRange("D1").getValue());
}
function diagD1_() {
  var ss = SpreadsheetApp.getActive();
  Logger.log("SS_ID: " + ss.getId());
  var sh = ss.getSheetByName("BridgeMapping");
  if (!sh) { Logger.log("NO SHEET"); return; }
  Logger.log("D1_DIRECT: " + sh.getRange("D1").getValue());
  Logger.log("ROW1_RANGE: " + JSON.stringify(sh.getRange("A1:H1").getValues()[0]));
  Logger.log("SHEET_GID: " + sh.getSheetId());
}