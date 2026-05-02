// === Zentrale Normalisierung für bb_nr ===
function normalizeBbNr_(value) {
  let s = String(value == null ? "" : value).trim();
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (/^\d+\.0$/.test(s)) s = s.replace(/\.0$/, "");
  return s;
}

// === Neue Funktion: bb_nr-Kanonisierung ===
function canonicalBbNr_(value) {
  let s = String(value == null ? "" : value).trim();
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
  s = s.toLowerCase();
  if (s.startsWith("rd_")) s = s.slice(3);
  if (s.endsWith("_latest")) s = s.slice(0, -7);
  s = s.replace(/_/g, " ");
  // Muster: "bb 283", "bb_283", "bb283", "283"
  let m = s.match(/bb\s*(\d+)/);
  if (m) return m[1];
  m = s.match(/(\d{2,4})/);
  if (m) return m[1];
  return "";
}

// === Dry-Run-Audit für bb_nr-Matching ===
function auditBbNrMatchingDryRun_() {
  const ss = SpreadsheetApp.getActive();
  const master = readTable_(mustSheet_(ss, "Master"), [["bb_nr","bbnr","bb nr"]], null);
  const readings = readTable_(mustSheet_(ss, "WaterReadings"), [["bb_nr","bbnr","bb nr"]], null);
  let xmlBbNrs = [];
  // XML-BbNr-Simulation: aus Readings, KEIN Live-API
  for (let r = 0; r < readings.rows.length; r++) {
    const bb = readings.rows[r][readings.findCol(["bb_nr","bbnr","bb nr"])] || "";
    if (bb && (String(bb).startsWith("BB") || String(bb).startsWith("bb"))) {
      xmlBbNrs.push(bb);
    }
  }
  // Master-BbNr-Maps
  const masterBbNrRawSet = new Set();
  const masterBbNrNormSet = new Set();
  const masterBbNrCount = {};
  for (let r = 0; r < master.rows.length; r++) {
    const bbRaw = master.rows[r][master.findCol(["bb_nr","bbnr","bb nr"])] || "";
    const bbNorm = normalizeBbNr_(bbRaw);
    if (bbRaw) masterBbNrRawSet.add(bbRaw);
    if (bbNorm) masterBbNrNormSet.add(bbNorm);
    if (bbNorm) masterBbNrCount[bbNorm] = (masterBbNrCount[bbNorm] || 0) + 1;
  }
  // Readings-BbNr-Maps
  const readingsBbNrRawSet = new Set();
  const readingsBbNrNormSet = new Set();
  const readingsBbNrCount = {};
  for (let r = 0; r < readings.rows.length; r++) {
    const bbRaw = readings.rows[r][readings.findCol(["bb_nr","bbnr","bb nr"])] || "";
    const bbNorm = normalizeBbNr_(bbRaw);
    if (bbRaw) readingsBbNrRawSet.add(bbRaw);
    if (bbNorm) readingsBbNrNormSet.add(bbNorm);
    if (bbNorm) readingsBbNrCount[bbNorm] = (readingsBbNrCount[bbNorm] || 0) + 1;
  }
  // Audit-Sheet
  const auditSheetName = "_Audit_BbNr_DryRun";
  let auditSheet = ss.getSheetByName(auditSheetName);
  if (!auditSheet) auditSheet = ss.insertSheet(auditSheetName);
  auditSheet.clear();
  const header = [
    "timestamp","category","bb_nr_raw","bb_nr_normalized","source_tab","target_tab","match_before","match_after","status","note"
  ];
  auditSheet.appendRow(header);
  const now = new Date().toISOString();
  // XML_MISSING_MASTER & XML_MATCH_AFTER_NORMALIZE
  for (const bb of xmlBbNrs) {
    const norm = normalizeBbNr_(bb);
    const matchBefore = masterBbNrRawSet.has(bb);
    const matchAfter = masterBbNrNormSet.has(norm);
    let cat = "XML_MISSING_MASTER";
    let status = "missing";
    let note = "";
    if (!matchBefore && matchAfter) {
      cat = "XML_MATCH_AFTER_NORMALIZE";
      status = "would_match";
    }
    if (!matchBefore && !matchAfter) {
      status = "new";
    }
    auditSheet.appendRow([
      now, cat, bb, norm, "XML", "Master", matchBefore, matchAfter, status, note
    ]);
  }
  // READINGS_MISSING_MASTER
  for (const bb of readingsBbNrRawSet) {
    const norm = normalizeBbNr_(bb);
    const matchBefore = masterBbNrRawSet.has(bb);
    const matchAfter = masterBbNrNormSet.has(norm);
    if (!matchBefore || !matchAfter) {
      auditSheet.appendRow([
        now, "READINGS_MISSING_MASTER", bb, norm, "WaterReadings", "Master", matchBefore, matchAfter, (!matchAfter ? "missing" : "would_match"), ""
      ]);
    }
  }
  // DUPLICATE_MASTER_BBNR
  for (const bb in masterBbNrCount) {
    if (masterBbNrCount[bb] > 1) {
      auditSheet.appendRow([
        now, "DUPLICATE_MASTER_BBNR", bb, bb, "Master", "Master", true, true, "duplicate", `count=${masterBbNrCount[bb]}`
      ]);
    }
  }
  // DUPLICATE_READINGS_BBNR
  for (const bb in readingsBbNrCount) {
    if (readingsBbNrCount[bb] > 1) {
      auditSheet.appendRow([
        now, "DUPLICATE_READINGS_BBNR", bb, bb, "WaterReadings", "WaterReadings", true, true, "duplicate", `count=${readingsBbNrCount[bb]}`
      ]);
    }
  }
  // WATERS_EMPTY_BBNR
  let waters = null;
  try {
    waters = readTable_(mustSheet_(ss, "Waters"), [["water_id","waterid"]], null);
  } catch (e) {}
  if (waters) {
    for (let r = 0; r < waters.rows.length; r++) {
      const bb = waters.findCol(["bb_nr","bbnr","bb nr"]) >= 0 ? waters.rows[r][waters.findCol(["bb_nr","bbnr","bb nr"])] : "";
      if (!bb) {
        auditSheet.appendRow([
          now, "WATERS_EMPTY_BBNR", "", "", "Waters", "Waters", false, false, "empty", ""
        ]);
      }
    }
  }
  // SAFE_TO_REVIEW: alle Fälle, die nach Normalisierung eindeutig zuordenbar wären
  for (const bb of xmlBbNrs) {
    const norm = normalizeBbNr_(bb);
    if (masterBbNrNormSet.has(norm)) {
      auditSheet.appendRow([
        now, "SAFE_TO_REVIEW", bb, norm, "XML", "Master", false, true, "review", "Würde nach Normalisierung matchen"
      ]);
    }
  }
  return `Audit abgeschlossen: ${auditSheet.getLastRow()-1} Zeilen geprüft.`;
}

// Öffentliche Runner-Funktion
function runBbNrDryRunAudit() {
  return auditBbNrMatchingDryRun_();
}
/*************************************************************
 WAVE BITE – BADEGEWÄSSER ENGINE v6.7.0 STEROID STABLE
 ------------------------------------------------------------
 - Berlin: LAGeSo CSV -> WaterReadings
 - Brandenburg: XML -> Master -> WaterReadings
 - Safe writes: preserves untouched columns/formulas
 - Strong duplicate protection for Waters / Master / Readings
 - Controlled Brandenburg onboarding only if truly new + sufficient data
 - Template-based Waters onboarding for app-safe defaults
 - Self-heal + second sync after healing
 - Ensure Reading rows now carries bb_nr
 - Optional automatic default descriptions + map links
 - LockService against overlapping runs
 - Housekeeping for _Log / _Cache
 - Soft runtime budget
*************************************************************/

/* =========================
   CONFIG
   ========================= */
const DEBUG = true;
const LOCK_WAIT_MS = 5000;
const CACHE_PREVIEW_CHARS = 200;
const SOFT_MAX_RUN_MS = 330000;

const SHEET_WATERS = "Waters";
const SHEET_MASTER = "Master";
const SHEET_READINGS = "WaterReadings";
const SHEET_NOTICES = "WaterNotices";
const SHEET_CACHE = "_Cache";
const SHEET_LOG = "_Log";

const BERLIN_URL = "https://data.lageso.de/baden/0_letzte/letzte.csv";

const BB_DIRECT_XML_URL = "https://badestellen.brandenburg.de/web/badestellen/badestellen/-/export/badestellen.xml";
const BB_XML_URLS = [
  BB_DIRECT_XML_URL,
  "https://badestellen.brandenburg.de/download",
  "https://badestellen.brandenburg.de",
  "https://geoportal.brandenburg.de/gs-json/xml?fileid=9DD12A01-EB80-4166-A0D2-71239328DB57",
  "https://geoportal.brandenburg.de/detailansichtdienst/render?url=https%3A%2F%2Fgeoportal.brandenburg.de%2Fgs-json%2Fxml%3Ffileid%3D9DD12A01-EB80-4166-A0D2-71239328DB57&view=gdibb"
];

const ABSOLUTE_URL_BASES = {
  berlin: "https://www.berlin.de",
  bb: "https://badestellen.brandenburg.de"
};

const HOUSEKEEPING_LOG_MAX_ROWS = 5000;
const HOUSEKEEPING_CACHE_MAX_ROWS = 1000;
const HOUSEKEEPING_CACHE_MAX_AGE_DAYS = 21;
const HOUSEKEEPING_RUN_INTERVAL_HOURS = 24;
const BOAT_BATCH_MAX_SPOTS_PER_RUN = 30;
const BOAT_BATCH_PROGRESS_KEY = "boat_conditions_next_index";
const BOAT_BATCH_SOFT_RESERVE_MS = 25000;

/* Autonomous engine */
const AUTONOMOUS_BRANDENBURG_ONBOARDING = true;
/* nur wenn wirklich neu + genug Daten */
const AUTONOMOUS_ONBOARDING_STRICT = false;
const ONBOARDING_MIN_REQUIRED_FIELDS = 3;

const SELF_HEAL_RELATIONS = false;
const AUTONOMOUS_WATER_ID_PREFIX = "bb_";

/* Template-basierte Waters-Erzeugung */
const ENABLE_TEMPLATE_BASED_WATERS_ONBOARDING = true;

/* automatische Defaults */
const ENABLE_AUTO_DEFAULT_DESCRIPTIONS = true;
const ENABLE_AUTO_MAP_LINKS = true;

/* -------------------------
   DRY-RUN / SAFE MODE
   -------------------------
   Set to true to prevent any new status/rohdaten writes.
   In this mode we only log what would happen.
*/
const DEBUG_DRY_RUN = false;

/* =========================
   RUNTIME BUDGET
   ========================= */
function startRunBudget_() {
  return { startedAt: Date.now() };
}

function isNearTimeout_(budget, reserveMs) {
  return (Date.now() - budget.startedAt) >= (SOFT_MAX_RUN_MS - (reserveMs || 0));
}

/* =========================
   RUNNERS
   ========================= */
function runAll_V670() {
  withScriptLock_("runAll_V670", function(ss, log) {
    const budget = startRunBudget_();
    log.info("START runAll_V670");

    const ctx = loadContext_(ss, log);
    maybeRunHousekeeping_(ctx, log);

    auditDataIntegrity_(ctx, log);

    ensureRows_(ctx, log);
    berlinUpdate_(ctx, log);

    if (isNearTimeout_(budget, 120000)) {
      log.warn("runAll_V670 aborted early after Berlin to avoid timeout");
      log.info("DONE runAll_V670 (partial)");
      return;
    }

    brandenburgUpdate_(ctx, log);

    if (SELF_HEAL_RELATIONS && !isNearTimeout_(budget, 60000)) {
      selfHealRelations_(ctx, log);

      const resync = syncMasterToReadings_(ctx.readings, ctx.master, log);
      if (resync.updatedRows > 0) ctx.readings.writeTouchedColumnsBack(log);
      log.info("Master sync after self-heal -> WaterReadings: matched=" + resync.matched + ", updatedRows=" + resync.updatedRows + ", missed=" + resync.missed);
    } else if (SELF_HEAL_RELATIONS) {
      log.warn("Self-heal skipped due to time budget");
    }

    if (!isNearTimeout_(budget, 30000)) {
      ensureRows_(ctx, log);
      fillWaterDefaults_(ctx, log);
      urlFix_(ctx, log);
      writeStatusesToWaters_V670(ctx, log);
      syncWaterNoticesFromWaters_(ctx, log);
      auditDataIntegrity_(ctx, log);
    } else {
      log.warn("Final ensure/fill/urlFix skipped due to time budget");
    }

    reprocessAllTextFields_(ctx, log);

    log.info("DONE runAll_V670");
  });
}

function runBerlinOnly_V670() {
  withScriptLock_("runBerlinOnly_V670", function(ss, log) {
    log.info("START runBerlinOnly_V670");
    const ctx = loadContext_(ss, log);
    maybeRunHousekeeping_(ctx, log);
    ensureRows_(ctx, log);
    berlinUpdate_(ctx, log);
    fillWaterDefaults_(ctx, log);
    urlFix_(ctx, log);
    writeStatusesToWaters_V670(ctx, log);
    syncWaterNoticesFromWaters_(ctx, log);
    auditDataIntegrity_(ctx, log);
    log.info("DONE runBerlinOnly_V670");
  });
}

function runBrandenburgOnly_V670() {
  withScriptLock_("runBrandenburgOnly_V670", function(ss, log) {
    const budget = startRunBudget_();
    log.info("START runBrandenburgOnly_V670");

    const ctx = loadContext_(ss, log);
    maybeRunHousekeeping_(ctx, log);
    auditDataIntegrity_(ctx, log);

    brandenburgUpdate_(ctx, log);

    if (SELF_HEAL_RELATIONS && !isNearTimeout_(budget, 45000)) {
      selfHealRelations_(ctx, log);

      const resync = syncMasterToReadings_(ctx.readings, ctx.master, log);
      if (resync.updatedRows > 0) ctx.readings.writeTouchedColumnsBack(log);
      log.info("Master sync after self-heal -> WaterReadings: matched=" + resync.matched + ", updatedRows=" + resync.updatedRows + ", missed=" + resync.missed);
    } else if (SELF_HEAL_RELATIONS) {
      log.warn("Self-heal skipped in Brandenburg run due to time budget");
    }

    if (!isNearTimeout_(budget, 15000)) {
      ensureRows_(ctx, log);
      fillWaterDefaults_(ctx, log);
      urlFix_(ctx, log);
      writeStatusesToWaters_V670(ctx, log);
      syncWaterNoticesFromWaters_(ctx, log);
      auditDataIntegrity_(ctx, log);
    } else {
      log.warn("Final ensure/fill/urlFix skipped in Brandenburg run due to time budget");
    }

    log.info("DONE runBrandenburgOnly_V670");
  });
}

/* Backward-compatible aliases */
function runAll_V660() { runAll_V670(); }
function runBerlinOnly_V660() { runBerlinOnly_V670(); }
function runBrandenburgOnly_V660() { runBrandenburgOnly_V670(); }
function runAll_V650() { runAll_V670(); }
function runBerlinOnly_V650() { runBerlinOnly_V670(); }
function runBrandenburgOnly_V650() { runBrandenburgOnly_V670(); }
function runAll_V643() { runAll_V670(); }
function runAll_V642() { runAll_V670(); }
function runBerlinOnly_V643() { runBerlinOnly_V670(); }
function runBerlinOnly_V642() { runBerlinOnly_V670(); }
function runBrandenburgOnly_V643() { runBrandenburgOnly_V670(); }
function runBrandenburgOnly_V642() { runBrandenburgOnly_V670(); }

/* =========================
   AUTOMATION / TRIGGERS
   ========================= */
function installAutomation_V670() {
  removeAutomation_V670();

  ScriptApp.newTrigger("runBerlinOnly_V670").timeBased().everyHours(2).create();
  ScriptApp.newTrigger("runBrandenburgOnly_V670").timeBased().everyHours(4).create();
  ScriptApp.newTrigger("runAll_V670").timeBased().everyDays(1).atHour(4).create();

  const log = makeLogger_(SpreadsheetApp.getActive());
  log.info("Automation installed (v6.7.0)");
  log.flush();
}

function removeAutomation_V670() {
  const handlerRegex = /^(run(All|BerlinOnly|BrandenburgOnly)_V(642|643|650|660|670))$/;
  const triggers = ScriptApp.getProjectTriggers();
  let deleted = 0;

  for (const t of triggers) {
    const h = t.getHandlerFunction();
    if (handlerRegex.test(h)) {
      ScriptApp.deleteTrigger(t);
      deleted++;
    }
  }

  const log = makeLogger_(SpreadsheetApp.getActive());
  log.info("Automation removed", { deleted: deleted });
  log.flush();
}

function listAutomation_V670() {
  const triggers = ScriptApp.getProjectTriggers().map(function(t) {
    return {
      handler: t.getHandlerFunction(),
      type: String(t.getEventType()),
      id: t.getUniqueId()
    };
  });

  const log = makeLogger_(SpreadsheetApp.getActive());
  log.info("Automation list", { triggers: triggers });
  log.flush();
  return triggers;
}

function installAutomation_V660() { installAutomation_V670(); }
function removeAutomation_V660() { removeAutomation_V670(); }
function listAutomation_V660() { return listAutomation_V670(); }
function installAutomation_V650() { installAutomation_V670(); }
function removeAutomation_V650() { removeAutomation_V670(); }
function listAutomation_V650() { return listAutomation_V670(); }

/* =========================
   LOCK / FATAL
   ========================= */
/**
 * Gibt das Haupt-Spreadsheet zurück.
 * Ersatz für SpreadsheetApp.getActive() in Trigger- und Webapp-Kontexten.
 */
function getOrchestratorSpreadsheet_() {
  return SpreadsheetApp.openById('1a0kMCb7DkzaDDLGYSgtYVU0m1Irrr_6NVXcJIizshqk');
}

function withScriptLock_(runnerName, fn) {
  const lock = LockService.getScriptLock();
  const ss = getOrchestratorSpreadsheet_();
  const log = makeLogger_(ss);

  try {
    if (!lock.tryLock(LOCK_WAIT_MS)) {
      log.warn("SKIP " + runnerName + ": another execution is already running");
      log.flush();
      return;
    }
    fn(ss, log);
  } catch (e) {
    fatal_(e, log);
  } finally {
    try { log.flush(); } catch (_) {}
    try { lock.releaseLock(); } catch (_) {}
  }
}

function fatal_(e, log) {
  const msg = String((e && e.message) || e);
  const st = String((e && e.stack) || "");
  try {
    (log || makeLogger_(getOrchestratorSpreadsheet_())).error("FATAL ERROR", {
      message: msg,
      stack: st
    });
  } catch (_) {}
  throw e;
}

/* =========================
   CONTEXT LOAD
   ========================= */
function loadContext_(ss, log) {
  const shWaters = mustSheet_(ss, SHEET_WATERS);
  const shReadings = mustSheet_(ss, SHEET_READINGS);
  const shMaster = mustSheet_(ss, SHEET_MASTER);
  const shNotices = ss.getSheetByName(SHEET_NOTICES);
  const shCache = ss.getSheetByName(SHEET_CACHE);

  const waters = readTable_(shWaters, [["water_id", "waterid"]], log);
  const readings = readTable_(shReadings, [["water_id", "waterid"]], log);
  const master = readTable_(shMaster, [["bb_nr", "bbnr", "bb nr"]], log);
  const notices = shNotices ? readTable_(shNotices, [["water_id", "waterid"]], log) : null;

  const cacheSpec = shCache ? getCacheSpec_(shCache) : null;
  const cacheMap = (shCache && cacheSpec) ? readCacheFlexible_(shCache, cacheSpec) : new Map();

  mustCols_(waters, [["water_id", "waterid"]], "Waters");
  mustCols_(readings, [["water_id", "waterid"], ["reading_id", "readingid"]], "WaterReadings");
  mustCols_(master, [["bb_nr", "bbnr", "bb nr"]], "Master");

  log.info("Waters: " + waters.nRows + " rows, " + waters.headers.length + " cols");
  log.info("WaterReadings: " + readings.nRows + " rows, " + readings.headers.length + " cols");
  log.info("Master: " + master.nRows + " rows, " + master.headers.length + " cols");
  if (notices) log.info("WaterNotices: " + notices.nRows + " rows, " + notices.headers.length + " cols");
  if (shCache) log.info("_Cache available");

  // Prepare optional column indexes for Phase 1 fields (dry run safe)
  const cols = {
    readings: {
      wind_speed_kmh: readings.findColOptional(["wind_speed_kmh"]),
      wind_gust_kmh: readings.findColOptional(["wind_gust_kmh"]),
      wind_direction: readings.findColOptional(["wind_direction"]),
      current_m_s: readings.findColOptional(["current_m_s"]),
      water_level_m: readings.findColOptional(["water_level_m"]),
      source_timestamp_aux: readings.findColOptional(["source_timestamp_aux"]),
      source_aux_type: readings.findColOptional(["source_aux_type"])
    },
    master: {
      boating_restriction: master.findColOptional(["boating_restriction"]),
      boating_reason: master.findColOptional(["boating_reason"]),
      hazard_status: master.findColOptional(["hazard_status"]),
      hazard_reason: master.findColOptional(["hazard_reason"])
    },
    waters: {
      visit_status: waters.findColOptional(["visit_status"]),
      bathing_status: waters.findColOptional(["bathing_status"]),
      boating_status: waters.findColOptional(["boating_status"]),
      status_explanation: waters.findColOptional(["status_explanation"]),
      last_updated: waters.findColOptional(["last_updated"]),
      visit_status_label: waters.findColOptional(["visit_status_label"]),
      visit_status_icon: waters.findColOptional(["visit_status_icon"]),
      visit_status_color: waters.findColOptional(["visit_status_color"]),
      status_explanation_humanized: waters.findColOptional(["status_explanation_humanized"]),
      boating_cta_label: waters.findColOptional(["boating_cta_label"]),
      boating_cta_url: waters.findColOptional(["boating_cta_url"]),
      captain_outlook_ui: waters.findColOptional(["captain_outlook_ui"]),
      captain_tip_ui: waters.findColOptional(["captain_tip_ui"])
    }
  };

  return {
    ss: ss,
    log: log,
    shCache: shCache,
    cacheSpec: cacheSpec,
    cacheMap: cacheMap,
    waters: waters,
    readings: readings,
    master: master,
    notices: notices,
    cols: cols
  };
}

/* =========================
   MAIN PROCESS STEPS
   ========================= */
function ensureRows_(ctx, log) {
  const waters = ctx.waters;
  const readings = ctx.readings;

  const waterIdColW = waters.findCol(["water_id", "waterid"]);
  const bbNrColW = waters.findColOptional(["bb_nr", "bbnr", "bb nr"]);
  const sourceColW = waters.findColOptional(["source"]);
  const spotNameColW = waters.findColOptional(["spot_name", "badestelle", "name"]);

  const waterIdColR = readings.findCol(["water_id", "waterid"]);
  const readingIdColR = readings.findCol(["reading_id", "readingid"]);
  const bbNrColR = readings.findColOptional(["bb_nr", "bbnr", "bb nr"]);
  const sourceColR = readings.findColOptional(["source"]);
  const titleColR = readings.findColOptional(["badestelle", "ort", "spot_name", "name"]);

  const existingByWaterId = new Map();
  for (let r = 0; r < readings.rows.length; r++) {
    const wid = str_(readings.rows[r][waterIdColR]);
    if (wid) existingByWaterId.set(wid, r);
  }

  let ensured = 0;
  for (let i = 0; i < waters.rows.length; i++) {
    const waterId = str_(waters.rows[i][waterIdColW]);
    if (!waterId) continue;
    if (existingByWaterId.has(waterId)) continue;

    const row = blankRow_(readings.headers.length);
    row[readingIdColR] = "rd_" + waterId + "_latest";
    row[waterIdColR] = waterId;

    if (bbNrColW >= 0 && bbNrColR >= 0) row[bbNrColR] = str_(waters.rows[i][bbNrColW]);
    if (sourceColW >= 0 && sourceColR >= 0) row[sourceColR] = str_(waters.rows[i][sourceColW]);
    if (spotNameColW >= 0 && titleColR >= 0) row[titleColR] = str_(waters.rows[i][spotNameColW]);

    readings.appendBufferedRow(row);
    existingByWaterId.set(waterId, readings.rows.length + readings.appendRows.length - 1);
    ensured++;
  }

  if (ensured > 0) readings.flushAppends(log);
  log.info("Ensure Reading rows: created=" + ensured);
}

function berlinUpdate_(ctx, log) {
  const waters = ctx.waters;
  const readings = ctx.readings;
  const shCache = ctx.shCache;
  const cacheSpec = ctx.cacheSpec;
  const cacheMap = ctx.cacheMap;

  const res = updateBerlinFromCsv_(waters, readings, log, shCache, cacheSpec, cacheMap);
  if (res.updatedRows > 0) readings.writeTouchedColumnsBack(log);
  log.info("Berlin update: matched=" + res.matched + ", updatedRows=" + res.updatedRows + ", missed=" + res.missed + ", skipped=" + (res.skipped ? 1 : 0));
}

/* =========================
   APPLY BB-DATA TO BERLIN (CONSERVATIVE ONLY)
   ========================= */
function applyBBDataToBerlinConservative_(readings, master, log) {
  // SAFE PATTERN: Only fill empty fields in Berlin-readings from Master
  // NEVER overwrite existing Berlin-sourced data
  // Prerequisite: Berlin-reading has bb_nr that matches Master

  const rBbNr = readings.findColOptional(["bb_nr", "bbnr", "bb nr"]);
  const rSource = readings.findColOptional(["source"]);

  if (rBbNr < 0) return { updated: 0, touched_rows: 0 }; // No bb_nr column -> skip

  const mBbNr = master.findCol(["bb_nr", "bbnr", "bb nr"]);
  const masterByBbNr = new Map();
  for (let i = 0; i < master.rows.length; i++) {
    const bbNr = str_(master.rows[i][mBbNr]);
    if (bbNr) masterByBbNr.set(bbNr, i);
  }

  let updated = 0;
  const touchedRows = new Set();

  for (let r = 0; r < readings.rows.length; r++) {
    const source = rSource >= 0 ? str_(readings.rows[r][rSource]) : "";
    const bbNr = str_(readings.rows[r][rBbNr]);

    // Only process Berlin-readings that have a bb_nr
    if (!bbNr || normText_(source) !== "berlin") continue;
    if (!masterByBbNr.has(bbNr)) continue;

    const mRow = master.rows[masterByBbNr.get(bbNr)];

    // Conservative field mapping: only specific fields, only if target is empty
    const fieldsToCopy = [
      ["bakteriologie", "water_quality_bacteria"],
      ["algen", "water_algae"],
      ["sichttiefe_m", "water_clarity_m"],
      ["smiley", "water_status_icon"],
      ["hinweis", "water_notice"]
    ];

    for (const pair of fieldsToCopy) {
      const mFieldCand = pair[0];
      const rFieldCand = pair[1] || pair[0];

      const mCol = master.findColOptional([mFieldCand]);
      const rCol = readings.findColOptional([rFieldCand]);

      if (mCol >= 0 && rCol >= 0) {
        const mVal = str_(mRow[mCol]);
        const rVal = str_(readings.rows[r][rCol]);

        // CONSERVATIVE: Only fill if Reading field is empty AND Master has value
        if (!rVal && mVal) {
          readings.set(r, rCol, mVal);
          touchedRows.add(r);
          updated++;
        }
      }
    }
  }

  return { updated: updated, touched_rows: touchedRows.size };
}

function brandenburgUpdate_(ctx, log) {
  const master = ctx.master;
  const readings = ctx.readings;
  const shCache = ctx.shCache;
  const cacheSpec = ctx.cacheSpec;
  const cacheMap = ctx.cacheMap;

  const bbXml = updateMasterFromXml_(master, log, shCache, cacheSpec, cacheMap);
  if (bbXml.updatedRows > 0) master.writeTouchedColumnsBack(log);
  log.info("BB XML -> Master: parsed=" + bbXml.parsed + ", skippedMissing=" + bbXml.skippedMissing + ", updatedRows=" + bbXml.updatedRows + ", skipped=" + (bbXml.skipped ? 1 : 0));

  if (AUTONOMOUS_BRANDENBURG_ONBOARDING && bbXml.records && bbXml.records.length) {
    const autoRes = autonomousBrandenburgOnboarding_(ctx, bbXml.records, log);
    log.info("Autonomous onboarding", autoRes);
  }

  const bbSync = syncMasterToReadings_(readings, master, log);
  if (bbSync.updatedRows > 0) readings.writeTouchedColumnsBack(log);
  log.info("Master sync -> WaterReadings: matched=" + bbSync.matched + ", updatedRows=" + bbSync.updatedRows + ", missed=" + bbSync.missed);

  // NEW: Apply BB-data (only empty fields) to Berlin-readings that have bb_nr
  const bbToBerlin = applyBBDataToBerlinConservative_(readings, master, log);
  if (bbToBerlin.updated > 0) readings.writeTouchedColumnsBack(log);
  if (bbToBerlin.updated > 0 || bbToBerlin.touched_rows > 0) {
    log.info("Apply BB-data to Berlin-readings (empty fields only): updated=" + bbToBerlin.updated + ", touched_rows=" + bbToBerlin.touched_rows);
  }
}

function fillWaterDefaults_(ctx, log) {
  const waters = ctx.waters;

  const waterIdCol = waters.findCol(["water_id", "waterid"]);
  const bbNrCol = waters.findColOptional(["bb_nr", "bbnr", "bb nr"]);
  const sourceCol = waters.findColOptional(["source"]);
  const nameCol = waters.findColOptional(["spot_name", "badestelle", "name"]);
  const regionCol = waters.findColOptional(["region"]);
  const categoryCol = waters.findColOptional(["category"]);
  const typeCol = waters.findColOptional(["type"]);
  const descShortCol = waters.findColOptional(["short_description", "kurzbeschreibung"]);
  const descCol = waters.findColOptional(["description", "beschreibung"]);
  const statusCol = waters.findColOptional(["status"]);
  const bathingCol = waters.findColOptional(["bathing_allowed", "badefreigabe"]);
  const detailUrlCol = waters.findColOptional(["detail_url"]);
  const latCol = waters.findColOptional(["latitude", "lat"]);
  const lonCol = waters.findColOptional(["longitude", "lon", "lng"]);
  const mapLinkCol = waters.findColOptional(["map_link", "maps_url", "maps_link"]);
  const sourceKeyCol = waters.findColOptional(["source_key", "sourcekey"]);
  const sourceKeyAltCol = waters.findColOptional(["source_key_alt", "sourcekeyalt"]);
  const nameCompCol = waters.findColOptional(["name_comp"]);
  const isActiveCol = waters.findColOptional(["is_active", "active"]);

  let touched = 0;

  for (let i = 0; i < waters.rows.length; i++) {
    const waterId = str_(waters.rows[i][waterIdCol]);
    if (!waterId) continue;

    const name = nameCol >= 0 ? str_(waters.rows[i][nameCol]) : "";
    const source = sourceCol >= 0 ? str_(waters.rows[i][sourceCol]) : "";
    const bbNr = bbNrCol >= 0 ? str_(waters.rows[i][bbNrCol]) : "";
    const lat = latCol >= 0 ? waters.rows[i][latCol] : "";
    const lon = lonCol >= 0 ? waters.rows[i][lonCol] : "";

    if (categoryCol >= 0 && !str_(waters.rows[i][categoryCol]) && source === "Brandenburg") {
      waters.set(i, categoryCol, "Brandenburg Badegewässer");
      touched++;
    }
    if (typeCol >= 0 && !str_(waters.rows[i][typeCol])) {
      waters.set(i, typeCol, "Badestelle");
      touched++;
    }
    if (regionCol >= 0 && !str_(waters.rows[i][regionCol]) && source === "Brandenburg") {
      waters.set(i, regionCol, "Brandenburg");
      touched++;
    }
    if (statusCol >= 0 && !str_(waters.rows[i][statusCol])) {
      waters.set(i, statusCol, "Baden erlaubt");
      touched++;
    }
    if (bathingCol >= 0 && !str_(waters.rows[i][bathingCol])) {
      waters.set(i, bathingCol, "Baden erlaubt");
      touched++;
    }
    if (sourceKeyCol >= 0 && !str_(waters.rows[i][sourceKeyCol]) && name) {
      waters.set(i, sourceKeyCol, normText_(name));
      touched++;
    }
    if (sourceKeyAltCol >= 0 && !str_(waters.rows[i][sourceKeyAltCol]) && name) {
      waters.set(i, sourceKeyAltCol, normText_(name));
      touched++;
    }
    if (nameCompCol >= 0 && !str_(waters.rows[i][nameCompCol])) {
      waters.set(i, nameCompCol, [waterId, name, bbNr].filter(Boolean).join(" "));
      touched++;
    }
    if (isActiveCol >= 0 && str_(waters.rows[i][isActiveCol]) === "") {
      waters.set(i, isActiveCol, true);
      touched++;
    }

    if (ENABLE_AUTO_DEFAULT_DESCRIPTIONS) {
      if (descShortCol >= 0 && !str_(waters.rows[i][descShortCol]) && name) {
        const shortTxt = source === "Brandenburg"
          ? "Offizielle Brandenburger Badestelle"
          : "Offizielle Badestelle";
        waters.set(i, descShortCol, shortTxt);
        touched++;
      }
      if (descCol >= 0 && !str_(waters.rows[i][descCol]) && name) {
        const longTxt = buildDefaultDescription_(name, source, bbNr);
        waters.set(i, descCol, longTxt);
        touched++;
      }
    }

    if (ENABLE_AUTO_MAP_LINKS && mapLinkCol >= 0 && !str_(waters.rows[i][mapLinkCol])) {
      const mapLink = buildMapLinkFromLatLon_(lat, lon, name);
      if (mapLink) {
        waters.set(i, mapLinkCol, mapLink);
        touched++;
      }
    }

    if (detailUrlCol >= 0) {
      const oldVal = waters.rows[i][detailUrlCol];
      const newVal = absolutizeUrlMaybe_(oldVal, ABSOLUTE_URL_BASES.bb);
      if (newVal !== oldVal) {
        waters.set(i, detailUrlCol, newVal);
        touched++;
      }
    }
  }

  if (touched > 0) waters.writeTouchedColumnsBack(log);
  log.info("Fill Waters defaults: touched=" + touched);
}

function urlFix_(ctx, log) {
  const readings = ctx.readings;
  const waters = ctx.waters;
  let touchedR = 0;
  let touchedW = 0;

  const colPairsR = [
    [["badestellelink"], ABSOLUTE_URL_BASES.berlin],
    [["profillink"], ABSOLUTE_URL_BASES.berlin],
    [["pdflink"], ABSOLUTE_URL_BASES.berlin],
    [["prognoselink"], ABSOLUTE_URL_BASES.berlin],
    [["source_url", "data_source_url"], ABSOLUTE_URL_BASES.berlin],
    [["detail_url"], ABSOLUTE_URL_BASES.bb],
    [["map_image"], ABSOLUTE_URL_BASES.bb]
  ];

  for (const pair of colPairsR) {
    const idx = readings.findColOptional(pair[0]);
    if (idx < 0) continue;
    for (let r = 0; r < readings.rows.length; r++) {
      const oldVal = readings.rows[r][idx];
      const newVal = absolutizeUrlMaybe_(oldVal, pair[1]);
      if (newVal !== oldVal) {
        readings.set(r, idx, newVal);
        touchedR++;
      }
    }
  }

  const colPairsW = [
    [["detail_url"], ABSOLUTE_URL_BASES.bb],
    [["map_image"], ABSOLUTE_URL_BASES.bb]
  ];

  for (const pair of colPairsW) {
    const idx = waters.findColOptional(pair[0]);
    if (idx < 0) continue;
    for (let r = 0; r < waters.rows.length; r++) {
      const oldVal = waters.rows[r][idx];
      const newVal = absolutizeUrlMaybe_(oldVal, pair[1]);
      if (newVal !== oldVal) {
        waters.set(r, idx, newVal);
        touchedW++;
      }
    }
  }

  if (touchedR > 0) readings.writeTouchedColumnsBack(log);
  if (touchedW > 0) waters.writeTouchedColumnsBack(log);
  log.info("URL fix: readings_touched=" + touchedR + ", waters_touched=" + touchedW);
}

/* =========================
   BERLIN CSV
   ========================= */
function updateBerlinFromCsv_(waters, readings, log, shCache, cacheSpec, cacheMap) {
  let csvText = "";
  try {
    csvText = fetchTextCached_(BERLIN_URL, "berlin_csv", 30, log, shCache, cacheSpec, cacheMap);
  } catch (e) {
    log.warn("Berlin fetch skipped", { err: String((e && e.message) || e) });
    return { matched: 0, missed: 0, updatedRows: 0, skipped: true };
  }

  if (!csvLooksUsable_(csvText)) {
    log.warn("Berlin CSV empty or unavailable", { preview: String(csvText || "").slice(0, 250) });
    return { matched: 0, missed: 0, updatedRows: 0, skipped: true };
  }

  let parsed;
  try {
    parsed = Utilities.parseCsv(csvText, ";");
  } catch (e) {
    log.warn("Berlin CSV parse failed", {
      err: String((e && e.message) || e),
      preview: String(csvText || "").slice(0, 250)
    });
    return { matched: 0, missed: 0, updatedRows: 0, skipped: true };
  }

  if (!parsed || parsed.length < 2) {
    log.warn("Berlin CSV has no data rows");
    return { matched: 0, missed: 0, updatedRows: 0, skipped: true };
  }

  const header = parsed[0].map(normHeader_);
  const rows = parsed.slice(1).filter(function(r) {
    return r && r.join("").trim() !== "";
  });

  const watersWaterId = waters.findCol(["water_id", "waterid"]);
  const watersSource = waters.findColOptional(["source"]);
  const watersSourceKey = waters.findColOptional(["source_key", "sourcekey"]);
  const watersSourceKeyAlt = waters.findColOptional(["source_key_alt", "sourcekeyalt"]);
  const watersSpotName = waters.findColOptional(["spot_name", "badestelle", "name"]);
  const readingsWaterId = readings.findCol(["water_id", "waterid"]);

  const exactMap = new Map();
  const fuzzyList = [];

  for (let i = 0; i < waters.rows.length; i++) {
    const wr = waters.rows[i];
    const source = watersSource >= 0 ? str_(wr[watersSource]) : "";
    if (source && normText_(source) !== "berlin") continue;

    const item = {
      waterId: str_(wr[watersWaterId]),
      sourceKey: watersSourceKey >= 0 ? normText_(wr[watersSourceKey]) : "",
      sourceKeyAlt: watersSourceKeyAlt >= 0 ? normText_(wr[watersSourceKeyAlt]) : "",
      spotName: watersSpotName >= 0 ? normText_(wr[watersSpotName]) : ""
    };
    if (!item.waterId) continue;

    [item.sourceKey, item.sourceKeyAlt, item.spotName].forEach(function(k) {
      if (k && !exactMap.has(k)) exactMap.set(k, item);
    });

    fuzzyList.push(item);
  }

  const readingRowByWaterId = new Map();
  for (let i = 0; i < readings.rows.length; i++) {
    const waterId = str_(readings.rows[i][readingsWaterId]);
    if (waterId) readingRowByWaterId.set(waterId, i);
  }

  let matched = 0;
  let missed = 0;
  const touchedRows = new Set();

  // DEBUG: Collect unmatched info (only if DEBUG=true)
  const debugInfo = DEBUG ? { logUnmatched: true, unmatched: [], rowNum: 0 } : null;

  for (let csvIdx = 0; csvIdx < rows.length; csvIdx++) {
    const csvRow = rows[csvIdx];
    const obj = rowToObj_(header, csvRow);
    if (DEBUG && csvIdx < 3) {
      log.info("Berlin CSV sample row", { row: csvIdx + 2, obj: obj });
    }
    if (debugInfo) debugInfo.rowNum = csvIdx + 2; // sheet row number
    const hit = matchBerlinWater_(obj, exactMap, fuzzyList, debugInfo);

    if (!hit) {
      missed++;
      continue;
    }

    const readingRowIdx = readingRowByWaterId.get(hit.waterId);
    if (readingRowIdx == null) {
      missed++;
      continue;
    }

    applyBerlinToReading_(readings, readingRowIdx, obj, hit.waterId);
    touchedRows.add(readingRowIdx);
    matched++;
  }

  // DEBUG-LOGGING: Log unmatched candidates if DEBUG enabled
  if (debugInfo && debugInfo.unmatched.length > 0) {
    log.info("Berlin CSV unmatched candidates (DEBUG)", {
      count: debugInfo.unmatched.length,
      samples: debugInfo.unmatched.slice(0, 2)
    });
  }

  return {
    matched: matched,
    missed: missed,
    updatedRows: touchedRows.size,
    skipped: false
  };
}

function matchBerlinWater_(obj, exactMap, fuzzyList, debugInfo) {
  const candidates = [
    normText_(pickFirst_(obj, [
      "badname",
      "rssname",
      "name",
      "badestelle",
      "titel",
      "bezeichnung",
      "spot_name"
    ])),
    normText_(pickFirst_(obj, [
      "profil",
      "gewaesser",
      "wasser",
      "wassername",
      "gewasser"
    ]))
  ].filter(Boolean);

  for (const c of candidates) {
    if (exactMap.has(c)) return exactMap.get(c);
  }

  for (const c of candidates) {
    for (const w of fuzzyList) {
      if (
        (w.sourceKey && (c.indexOf(w.sourceKey) >= 0 || w.sourceKey.indexOf(c) >= 0)) ||
        (w.sourceKeyAlt && (c.indexOf(w.sourceKeyAlt) >= 0 || w.sourceKeyAlt.indexOf(c) >= 0)) ||
        (w.spotName && (c.indexOf(w.spotName) >= 0 || w.spotName.indexOf(c) >= 0))
      ) {
        return w;
      }
    }
  }

  // DEBUG-LOGGING: Collect unmatched candidates (optional, no side effects on data)
  if (debugInfo && debugInfo.logUnmatched) {
    debugInfo.unmatched.push({
      candidates: candidates.length ? candidates : ["<EMPTY>"],
      csv_name: pickFirst_(obj, ["badestelle", "name", "ort"]),
      csv_row: debugInfo.rowNum,
      raw_object: obj
    });
  }

  return null;
}

function applyBerlinToReading_(readings, rowIdx, obj, waterId) {
  setIfColExists_(readings, rowIdx, ["reading_id"], "rd_" + waterId + "_latest");
  setIfColExists_(readings, rowIdx, ["water_id"], waterId);
  setIfColExists_(readings, rowIdx, ["area_id"], pickFirst_(obj, ["area_id", "areaid", "id", "nr"]));
  setIfColExists_(readings, rowIdx, ["eco"], toNumberMaybe_(pickFirst_(obj, ["eco", "escherichia_coli"])));
  setIfColExists_(readings, rowIdx, ["ente"], toNumberMaybe_(pickFirst_(obj, ["ente", "enterokokken"])));
  setIfColExists_(readings, rowIdx, ["algen"], pickFirst_(obj, ["algen", "algenhinweis", "cyanobakterien", "bluegreen"]));
  setIfColExists_(readings, rowIdx, ["bezirk"], pickFirst_(obj, ["bezirk", "district"]));
  setIfColExists_(readings, rowIdx, ["latitude"], toNumberMaybe_(pickFirst_(obj, ["latitude", "lat"])));
  setIfColExists_(readings, rowIdx, ["longitude"], toNumberMaybe_(pickFirst_(obj, ["longitude", "lon", "lng"])));
  setIfColExists_(readings, rowIdx, ["badestellelink"], pickFirst_(obj, ["badestellelink", "badestelle_link", "link_badestelle", "url"]));
  setIfColExists_(readings, rowIdx, ["profillink"], pickFirst_(obj, ["profillink", "profil_link", "gewaesserprofil", "profil"]));
  setIfColExists_(readings, rowIdx, ["pdflink"], pickFirst_(obj, ["pdflink", "pdf", "pdf_link"]));
  setIfColExists_(readings, rowIdx, ["prognoselink"], pickFirst_(obj, ["prognoselink", "prognose_link", "forecast_link"]));
  setIfColExists_(readings, rowIdx, ["classification", "classifikation"], pickFirst_(obj, ["classification", "einstufung", "klassifikation"]));
  setIfColExists_(readings, rowIdx, ["wasserqualitaet_predict"], pickFirst_(obj, ["wasserqualitaet_predict", "wasserqualitaet", "qualitaet", "quality_status"]));

  const measured = parseDateTimeMaybe_(pickFirst_(obj, [
    "measured_at", "messdatum", "dat", "datum", "date", "letzte_probe", "probenahme"
  ]));
  if (measured) setIfColExists_(readings, rowIdx, ["measured_at"], measured);

  const predictDate = parseDateTimeMaybe_(pickFirst_(obj, [
    "dat_predict", "predict_date", "forecast_date"
  ]));
  if (predictDate) setIfColExists_(readings, rowIdx, ["dat_predict"], predictDate);

  setIfColExists_(readings, rowIdx, ["water_temp_c", "temp"], toNumberMaybe_(pickFirst_(obj, ["water_temp_c", "temperatur", "wassertemperatur", "temp"])));
  setIfColExists_(readings, rowIdx, ["clarity_m", "clarity", "sichttiefe"], toNumberMaybe_(pickFirst_(obj, ["clarity_m", "sichttiefe", "sichttiefe_m"])));
  setIfColExists_(readings, rowIdx, ["ph"], toNumberMaybe_(pickFirst_(obj, ["ph"])));
  setIfColExists_(readings, rowIdx, ["quality_status", "status"], pickFirst_(obj, ["quality_status", "status", "wasserqualitaet_predict", "qualitaet"]));
  setIfColExists_(readings, rowIdx, ["quality_color", "color"], pickFirst_(obj, ["quality_color", "farbe", "color"]));
  setIfColExists_(readings, rowIdx, ["recommendation"], pickFirst_(obj, ["recommendation", "empfehlung"]));
  setIfColExists_(readings, rowIdx, ["quality_notice", "cuality_notice"], pickFirst_(obj, ["quality_notice", "hinweis", "notice", "warnung"]));
  setIfColExists_(readings, rowIdx, ["source"], "Berlin");
  setIfColExists_(readings, rowIdx, ["source_url"], BERLIN_URL);
}

/* =========================
   BRANDENBURG XML -> MASTER
   ========================= */
function updateMasterFromXml_(master, log, shCache, cacheSpec, cacheMap) {
  let xmlText = "";
  try {
    xmlText = fetchBrandenburgXmlText_(log, shCache, cacheSpec, cacheMap);
  } catch (e) {
    log.warn("Brandenburg XML fetch skipped", { err: String((e && e.message) || e) });
    return { parsed: 0, skippedMissing: 0, updatedRows: 0, skipped: true, records: [] };
  }

  let doc;
  try {
    doc = safeParseXml_(xmlText, log);
  } catch (e) {
    log.warn("Brandenburg XML parse skipped", { err: String((e && e.message) || e) });
    return { parsed: 0, skippedMissing: 0, updatedRows: 0, skipped: true, records: [] };
  }

  const records = extractBrandenburgRecords_(doc, log);

  if (!records.length) {
    log.warn("No Brandenburg XML records parsed", {
      preview: String(xmlText || "").slice(0, 300)
    });
    return { parsed: 0, skippedMissing: 0, updatedRows: 0, skipped: true, records: [] };
  }

  const bbNrCol = master.findCol(["bb_nr", "bbnr", "bb nr"]);
  const indexByBbNr = new Map();
  for (let i = 0; i < master.rows.length; i++) {
    const rawBbNr = str_(master.rows[i][bbNrCol]);
    const canonBbNr = canonicalBbNr_(rawBbNr);
    if (canonBbNr) indexByBbNr.set(canonBbNr, i);
  }

  let parsed = 0;
  let skippedMissing = 0;
  const touchedRows = new Set();

  for (const rec of records) {
    parsed++;
    const rawBbNr = str_(pickFirst_(rec, ["bb_nr", "bbnr", "bnr", "nr", "nummer", "id"]));
    const canonBbNr = canonicalBbNr_(rawBbNr);
    if (!canonBbNr || !indexByBbNr.has(canonBbNr)) {
      skippedMissing++;
      continue;
    }

    const rowIdx = indexByBbNr.get(canonBbNr);
    applyBrandenburgToMaster_(master, rowIdx, rec);
    touchedRows.add(rowIdx);
  }

  return {
    parsed: parsed,
    skippedMissing: skippedMissing,
    updatedRows: touchedRows.size,
    skipped: false,
    records: records
  };
}

function fetchBrandenburgXmlText_(log, shCache, cacheSpec, cacheMap) {
  let lastErr = null;

  for (const url of BB_XML_URLS) {
    try {
      const txt = fetchText_(url, log);

      if (isBrandenburgBathingXml_(txt)) {
        storeMetaCacheMaybe_(shCache, cacheSpec, cacheMap, "bb_xml_meta", txt, log);
        return txt;
      }

      const directXmlLink =
        extractAbsoluteOrRelativeLink_(txt, /badestellen\.xml(\?|$)/i, ABSOLUTE_URL_BASES.bb) ||
        extractAbsoluteOrRelativeLink_(txt, /\.xml(\?|$)/i, ABSOLUTE_URL_BASES.bb) ||
        extractAbsoluteOrRelativeLink_(txt, /gs-json\/xml\?fileid=/i, "https://geoportal.brandenburg.de");

      if (directXmlLink) {
        const txt2 = fetchText_(directXmlLink, log);
        if (isBrandenburgBathingXml_(txt2)) {
          storeMetaCacheMaybe_(shCache, cacheSpec, cacheMap, "bb_xml_meta", txt2, log);
          return txt2;
        }
      }

      lastErr = new Error("No bathing XML payload found via " + url);
    } catch (e) {
      lastErr = e;
      log.warn("Brandenburg XML source failed", { url: url, err: String((e && e.message) || e) });
    }
  }

  throw lastErr || new Error("Brandenburg XML could not be fetched");
}

function extractBrandenburgRecords_(doc, log) {
  const root = doc.getRootElement();
  const out = [];

  walkElementTree_(root, function(el) {
    if (!elementLooksLikeBrandenburgRecord_(el)) return;

    const map = flattenBrandenburgRecordNode_(el);
    if (!map) return;

    const bbNr = pickFirst_(map, ["bb_nr", "bbnr", "bnr", "nr", "nummer", "id"]);
    if (!bbNr) return;

    const hasUsefulData = !!pickFirst_(map, [
      "badegewaesser",
      "gewaesser",
      "gewasser",
      "badestelle",
      "ort",
      "name",
      "kreis",
      "hinweis",
      "smiley",
      "bakteriologie"
    ]);

    if (hasUsefulData || Object.keys(map).length >= 3) {
      out.push(normalizeBrandenburgRecord_(map));
    }
  });

  const deduped = dedupeRecordsByBbNr_(out);

  if (DEBUG) {
    log.info("Brandenburg records extracted", {
      raw: out.length,
      deduped: deduped.length
    });
  }

  return deduped;
}

function walkElementTree_(el, fn) {
  fn(el);
  const kids = el.getChildren();
  for (const k of kids) walkElementTree_(k, fn);
}

function elementLooksLikeBrandenburgRecord_(el) {
  const name = normHeader_(el.getName());
  const attrs = el.getAttributes();
  const attrNames = attrs.map(function(a) { return normHeader_(a.getName()); });
  const attrSet = new Set(attrNames);

  if (name === "luisdbobadestellen" || name === "badestelle" || name === "badestellen") {
    if (
      attrSet.has("bnr") ||
      attrSet.has("bbnr") ||
      attrSet.has("nr") ||
      attrSet.has("nummer") ||
      attrSet.has("badegewaesser") ||
      attrSet.has("gewasser") ||
      attrSet.has("gewaesser")
    ) {
      return true;
    }
  }

  const kids = el.getChildren();
  if (!kids || !kids.length) return false;

  const names = kids.map(function(c) { return normHeader_(c.getName()); });
  const nameSet = new Set(names);

  const hasBb =
    nameSet.has("bbnr") ||
    nameSet.has("bnr") ||
    nameSet.has("nummer") ||
    nameSet.has("nr");

  const hasUseful =
    nameSet.has("badegewaesser") ||
    nameSet.has("gewaesser") ||
    nameSet.has("gewasser") ||
    nameSet.has("badestelle") ||
    nameSet.has("ort") ||
    nameSet.has("name") ||
    nameSet.has("kreis") ||
    nameSet.has("hinweis") ||
    nameSet.has("smiley") ||
    nameSet.has("bakteriologie");

  return hasBb && hasUseful;
}

function flattenBrandenburgRecordNode_(el) {
  const map = {};

  for (const attr of el.getAttributes()) {
    const aName = normHeader_(attr.getName());
    const aVal = str_(attr.getValue());
    if (aName && aVal) map[aName] = aVal;
  }

  const kids = el.getChildren();
  for (const child of kids) {
    const name = normHeader_(child.getName());
    const txt = str_(child.getText());
    if (name && txt && !(name in map)) map[name] = txt;

    for (const attr of child.getAttributes()) {
      const aName = normHeader_(attr.getName());
      const aVal = str_(attr.getValue());
      if (aName && aVal && !(aName in map)) map[aName] = aVal;
    }
  }

  return Object.keys(map).length ? map : null;
}

function normalizeBrandenburgRecord_(map) {
  const out = Object.assign({}, map);

  if (!out.bb_nr) out.bb_nr = pickFirst_(out, ["bbnr", "bnr", "nr", "nummer", "id"]);
  if (!out.gewaesser) out.gewaesser = pickFirst_(out, ["badegewaesser", "gewasser", "gewaesser"]);
  if (!out.ort) out.ort = pickFirst_(out, ["badestelle", "name", "ort"]);
  if (!out.latitude) out.latitude = pickFirst_(out, ["lat", "y", "breite"]);
  if (!out.longitude) out.longitude = pickFirst_(out, ["lon", "lng", "x", "laenge"]);
  if (!out.detail_url) out.detail_url = pickFirst_(out, ["url", "link", "detail_url"]);
  if (!out.map_image) out.map_image = pickFirst_(out, ["bild", "foto", "image", "map_image"]);

  return out;
}

function dedupeRecordsByBbNr_(records) {
  const seen = new Set();
  const out = [];
  for (const rec of records) {
    const rawBbNr = String(rec.bb_nr == null ? "" : rec.bb_nr).trim();
    const key = canonicalBbNr_(rawBbNr) || rawBbNr.toLowerCase();
    if (!key || !seen.has(key)) {
      if (key) seen.add(key);
      out.push(rec);
    }
  }
  return out;
}

function applyBrandenburgToMaster_(master, rowIdx, rec) {
  setIfColExists_(master, rowIdx, ["bb_nr"], pickFirst_(rec, ["bb_nr", "bbnr", "bnr", "nr", "nummer", "id"]));
  setIfColExists_(master, rowIdx, ["gewaesser"], pickFirst_(rec, ["gewaesser", "badegewaesser", "gewasser"]));
  setIfColExists_(master, rowIdx, ["ort"], pickFirst_(rec, ["ort", "badestelle", "name"]));
  setIfColExists_(master, rowIdx, ["kreis"], pickFirst_(rec, ["kreis", "landkreis"]));
  setIfColExists_(master, rowIdx, ["smiley"], pickFirst_(rec, ["smiley", "bewertung_icon", "status_icon"]));
  setIfColExists_(master, rowIdx, ["hinweis"], pickFirst_(rec, ["hinweis", "bemerkung", "warnung", "notice"]));
  setIfColExists_(master, rowIdx, ["name_norm"], normText_(pickFirst_(rec, ["ort", "badestelle", "name"])));
  setIfColExists_(master, rowIdx, ["name_comp"], buildCompositeName_(pickFirst_(rec, ["gewaesser", "badegewaesser"]), pickFirst_(rec, ["ort", "badestelle", "name"])));
  setIfColExists_(master, rowIdx, ["badestelle"], pickFirst_(rec, ["badestelle", "ort", "name"]));
  setIfColExists_(master, rowIdx, ["bakteriologie"], pickFirst_(rec, ["bakteriologie", "bewertung", "mikrobiologie", "mikrobiologisch"]));
  setIfColExists_(master, rowIdx, ["sichttiefe_m"], toNumberMaybe_(pickFirst_(rec, ["sichttiefe_m", "sichttiefe"])));
  setIfColExists_(master, rowIdx, ["algen"], pickFirst_(rec, ["algen", "cyanobakterien", "blaualgen"]));
  setIfColExists_(master, rowIdx, ["wc"], pickFirst_(rec, ["wc", "toilette", "sanitaer"]));
  setIfColExists_(master, rowIdx, ["gastronomie"], pickFirst_(rec, ["gastronomie", "imbiss"]));
  setIfColExists_(master, rowIdx, ["rettung"], pickFirst_(rec, ["rettung", "rettungsschwimmer", "dlrg"]));
  setIfColExists_(master, rowIdx, ["strandbeschaffenheit"], pickFirst_(rec, ["strandbeschaffenheit", "strand"]));
  setIfColExists_(master, rowIdx, ["abfallentsorgung"], pickFirst_(rec, ["abfallentsorgung", "abfall", "muelleimer"]));

  const measured = parseDateTimeMaybe_(pickFirst_(rec, ["latest_measured_at", "messdatum", "datum", "date"]));
  if (measured) setIfColExists_(master, rowIdx, ["latest_measured_at"], measured);

  setIfColExists_(master, rowIdx, ["latitude"], toNumberMaybe_(pickFirst_(rec, ["latitude", "lat"])));
  setIfColExists_(master, rowIdx, ["longitude"], toNumberMaybe_(pickFirst_(rec, ["longitude", "lon", "lng"])));
  setIfColExists_(master, rowIdx, ["detail_url"], absolutizeUrlMaybe_(pickFirst_(rec, ["detail_url", "url", "link"]), ABSOLUTE_URL_BASES.bb));
  setIfColExists_(master, rowIdx, ["map_image"], absolutizeUrlMaybe_(pickFirst_(rec, ["map_image", "bild", "foto"]), ABSOLUTE_URL_BASES.bb));
}

function syncMasterToReadings_(readings, master, log) {
  const rWaterId = readings.findCol(["water_id", "waterid"]);
  const rBbNr = readings.findColOptional(["bb_nr", "bbnr", "bb nr"]);
  const mBbNr = master.findCol(["bb_nr", "bbnr", "bb nr"]);

  const masterByBbNr = new Map();
  for (let i = 0; i < master.rows.length; i++) {
    const rawBbNr = str_(master.rows[i][mBbNr]);
    const canonBbNr = canonicalBbNr_(rawBbNr);
    if (canonBbNr) masterByBbNr.set(canonBbNr, i);
  }

  let matched = 0;
  let missed = 0;
  const touchedRows = new Set();

  for (let r = 0; r < readings.rows.length; r++) {
    const waterId = str_(readings.rows[r][rWaterId]);
    if (!waterId) continue;

    const rawBbNr = rBbNr >= 0 ? str_(readings.rows[r][rBbNr]) : "";
    const canonBbNr = canonicalBbNr_(rawBbNr);
    if (!canonBbNr || !masterByBbNr.has(canonBbNr)) {
      missed++;
      continue;
    }

    const mRow = master.rows[masterByBbNr.get(canonBbNr)];
    mapMasterToReading_(readings, r, master, mRow);
    touchedRows.add(r);
    matched++;
  }

  return {
    matched: matched,
    missed: missed,
    updatedRows: touchedRows.size
  };
}

function mapMasterToReading_(readings, rIdx, master, mRow) {
  copyFieldIfExists_(master, mRow, readings, rIdx, ["bb_nr"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["gewaesser"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["ort"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["kreis"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["smiley"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["hinweis"], ["quality_notice", "cuality_notice"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["badestelle"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["bakteriologie"], ["bewertung"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["sichttiefe_m"], ["sichttiefe", "clarity"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["strandbeschaffenheit"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["rettung"], ["rettungsschwimmer"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["wc"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["gastronomie"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["abfallentsorgung"], ["abfall"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["latitude"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["longitude"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["detail_url"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["map_image"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["latest_measured_at"], ["measured_at"]);
  copyFieldIfExists_(master, mRow, readings, rIdx, ["source"], ["source"]);
}

/* =========================
   AUTONOMOUS DATA ENGINE
   ========================= */
/* =========================
   NEAR-DUPLICATE CHECK (ULTRA-CONSERVATIVE)
   ========================= */
function checkNearDuplicateUltraConservative_(newRec, allMasterRows, masterBbNrCol, log) {
  // ULTRA-CONSERVATIVE approach: only flag as duplicate if MULTIPLE criteria match
  // Prefers false-negatives (missing duplicates) over false-positives (blocking real locations)
  
  const newLat = toNumberMaybe_(pickFirst_(newRec, ["latitude", "lat"]));
  const newLon = toNumberMaybe_(pickFirst_(newRec, ["longitude", "lon"]));
  const newName = normText_(pickFirst_(newRec, ["ort", "badestelle", "name"]));
  const newBbNr = str_(pickFirst_(newRec, ["bb_nr", "bbnr", "bnr", "nr", "id", "nummer"]));

  if (!newLat || !newLon || !newName || !newBbNr) return null;

  // Check only existing Master rows (not buffered appends)
  for (let i = 0; i < allMasterRows.length; i++) {
    const existingRow = allMasterRows[i];
    const existingLat = toNumberMaybe_(existingRow.latitude || existingRow.lat || "");
    const existingLon = toNumberMaybe_(existingRow.longitude || existingRow.lon || existingRow.lng || "");
    const existingName = normText_(existingRow.ort || existingRow.badestelle || existingRow.name || "");
    const existingBbNr = str_(existingRow.bb_nr || existingRow.bbnr || existingRow.nr || "");

    if (!existingLat || !existingLon || !existingName) continue;

    const distance = getDistanceMetersSimple_(newLat, newLon, existingLat, existingLon);
    const similarity = getStringSimilaritySimple_(newName, existingName);

    // ULTRA-CONSERVATIVE CRITERIA:
    // Only flag if distance is VERY small AND names are similar
    if (distance < 100 && similarity > 0.85) {
      // Only block if we're very confident
      return {
        existingBbNr: existingBbNr,
        distance: distance,
        similarity: similarity,
        reason: "distance_and_name"
      };
    }

    // Warn but don't block for less certain cases
    if (distance < 200 && similarity > 0.90) {
      if (DEBUG) {
        log.warn("Potential near-duplicate (warning only)", {
          new_bb_nr: newBbNr,
          existing_bb_nr: existingBbNr,
          distance_m: Math.round(distance),
          name_similarity: Math.round(similarity * 100) + "%",
          action: "continuing (conservative)"
        });
      }
    }
  }

  return null;
}

function getDistanceMetersSimple_(lat1, lon1, lat2, lon2) {
  // Simplified Haversine: good enough for <1km detection
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getStringSimilaritySimple_(s1, s2) {
  // Simple token-based similarity for conservative matching
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const common = words1.filter(w => words2.indexOf(w) >= 0).length;
  const total = Math.max(words1.length, words2.length);
  
  return total > 0 ? common / total : 0;
}

function autonomousBrandenburgOnboarding_(ctx, records, log) {
  const master = ctx.master;
  const waters = ctx.waters;

  const masterBbNrCol = master.findCol(["bb_nr", "bbnr", "bb nr"]);
  const watersWaterIdCol = waters.findCol(["water_id", "waterid"]);
  const watersBbNrCol = waters.findColOptional(["bb_nr", "bbnr", "bb nr"]);
  const watersNameCol = waters.findColOptional(["spot_name", "badestelle", "name"]);

  const masterByBbNr = new Map();
  for (let i = 0; i < master.rows.length; i++) {
    const rawBbNr = str_(master.rows[i][masterBbNrCol]);
    const canonBbNr = canonicalBbNr_(rawBbNr);
    if (canonBbNr) masterByBbNr.set(canonBbNr, i);
  }

  const watersByBbNr = new Map();
  const watersByWaterId = new Map();
  const watersByNormName = new Map();

  for (let i = 0; i < waters.rows.length; i++) {
    const waterId = str_(waters.rows[i][watersWaterIdCol]);
    if (waterId) watersByWaterId.set(waterId, i);

    if (watersBbNrCol >= 0) {
      const rawBbNr = str_(waters.rows[i][watersBbNrCol]);
      const canonBbNr = canonicalBbNr_(rawBbNr);
      if (canonBbNr) watersByBbNr.set(canonBbNr, i);
    }

    if (watersNameCol >= 0) {
      const n = normText_(waters.rows[i][watersNameCol]);
      if (n) watersByNormName.set(n, i);
    }
  }

  let masterAdded = 0;
  let watersAdded = 0;
  let skippedWeak = 0;
  let skippedExisting = 0;
  let skippedDuplicates = 0;

  const templateRow = ENABLE_TEMPLATE_BASED_WATERS_ONBOARDING
    ? findBestWatersTemplateRow_(waters, "Brandenburg")
    : null;

  for (const rec of records) {
    const rawBbNr = str_(pickFirst_(rec, ["bb_nr", "bbnr", "bnr", "nr", "id", "nummer"]));
    const canonBbNr = canonicalBbNr_(rawBbNr);
    if (!canonBbNr) continue;

    const recName = str_(pickFirst_(rec, ["badestelle", "ort", "name"]));
    const recNameNorm = normText_(recName);
    const waterId = buildAutonomousWaterId_(canonBbNr, rec);

    if (AUTONOMOUS_ONBOARDING_STRICT && !recordIsStrongEnoughForOnboarding_(rec)) {
      skippedWeak++;
      continue;
    }

    if (masterByBbNr.has(canonBbNr) || watersByBbNr.has(canonBbNr) || watersByWaterId.has(waterId) || (recNameNorm && watersByNormName.has(recNameNorm))) {
      skippedExisting++;
      continue;
    }

    if (!masterByBbNr.has(canonBbNr)) {
      const rowM = buildAutonomousMasterRow_(master, rec);
      if (rowM) {
        // Check for near-duplicates (WARNING ONLY, does not block onboarding)
        const dupCheck = checkNearDuplicateUltraConservative_(rec, master.rows, masterBbNrCol, log);
        if (dupCheck) {
          log.warn("Potential near-duplicate (warning only, continuing with onboarding)", {
            new_bb_nr: canonBbNr,
            existing_bb_nr: dupCheck.existingBbNr,
            distance_m: Math.round(dupCheck.distance),
            name_similarity: Math.round(dupCheck.similarity * 100) + "%"
          });
          skippedDuplicates++;
          // NOTE: No 'continue' - record is still added
        }

        master.appendBufferedRow(rowM);
        masterByBbNr.set(canonBbNr, master.rows.length + master.appendRows.length - 1);
        masterAdded++;
      }
    }

    if (watersBbNrCol >= 0 && !watersByBbNr.has(canonBbNr)) {
      const rowW = buildAutonomousWatersRow_(waters, rec, canonBbNr, templateRow);
      if (rowW) {
        const newWaterId = str_(rowW[watersWaterIdCol]);
        if (newWaterId && !watersByWaterId.has(newWaterId)) {
          waters.appendBufferedRow(rowW);
          watersByBbNr.set(canonBbNr, waters.rows.length + waters.appendRows.length - 1);
          watersByWaterId.set(newWaterId, waters.rows.length + waters.appendRows.length - 1);
          if (recNameNorm) watersByNormName.set(recNameNorm, waters.rows.length + waters.appendRows.length - 1);
          watersAdded++;
        }
      }
    }
  }

  if (masterAdded > 0) master.flushAppends(log);
  if (watersAdded > 0) waters.flushAppends(log);

  return {
    master_added: masterAdded,
    waters_added: watersAdded,
    skipped_existing: skippedExisting,
    skipped_weak: skippedWeak,
    skipped_duplicates: skippedDuplicates
  };
}

function buildAutonomousMasterRow_(master, rec) {
  const row = blankRow_(master.headers.length);

  setValueByCandidates_(master, row, ["bb_nr", "bbnr", "bb nr"], pickFirst_(rec, ["bb_nr", "bbnr", "bnr", "nr", "id", "nummer"]));
  setValueByCandidates_(master, row, ["gewaesser"], pickFirst_(rec, ["gewaesser", "badegewaesser", "gewasser"]));
  setValueByCandidates_(master, row, ["ort"], pickFirst_(rec, ["ort", "badestelle", "name"]));
  setValueByCandidates_(master, row, ["badestelle"], pickFirst_(rec, ["badestelle", "ort", "name"]));
  setValueByCandidates_(master, row, ["kreis"], pickFirst_(rec, ["kreis", "landkreis"]));
  setValueByCandidates_(master, row, ["hinweis"], pickFirst_(rec, ["hinweis", "bemerkung", "warnung", "notice"]));
  setValueByCandidates_(master, row, ["smiley"], pickFirst_(rec, ["smiley", "bewertung_icon", "status_icon"]));
  setValueByCandidates_(master, row, ["bakteriologie"], pickFirst_(rec, ["bakteriologie", "bewertung", "mikrobiologie", "mikrobiologisch"]));
  setValueByCandidates_(master, row, ["latitude"], toNumberMaybe_(pickFirst_(rec, ["latitude", "lat"])));
  setValueByCandidates_(master, row, ["longitude"], toNumberMaybe_(pickFirst_(rec, ["longitude", "lon", "lng"])));
  setValueByCandidates_(master, row, ["detail_url"], absolutizeUrlMaybe_(pickFirst_(rec, ["detail_url", "url", "link"]), ABSOLUTE_URL_BASES.bb));
  setValueByCandidates_(master, row, ["map_image"], absolutizeUrlMaybe_(pickFirst_(rec, ["map_image", "bild", "foto"]), ABSOLUTE_URL_BASES.bb));
  setValueByCandidates_(master, row, ["name_norm"], normText_(pickFirst_(rec, ["ort", "badestelle", "name"])));
  setValueByCandidates_(master, row, ["name_comp"], buildCompositeName_(pickFirst_(rec, ["gewaesser", "badegewaesser"]), pickFirst_(rec, ["ort", "badestelle", "name"])));

  const bbNr = str_(pickFirst_(rec, ["bb_nr", "bbnr", "bnr", "nr", "id", "nummer"]));
  return bbNr ? row : null;
}

function buildAutonomousWatersRow_(waters, rec, bbNr, templateRow) {
  const row = templateRow ? templateRow.slice() : blankRow_(waters.headers.length);
  const waterId = buildAutonomousWaterId_(bbNr, rec);

  const ort = pickFirst_(rec, ["badestelle", "ort", "name"]);
  const gewaesser = pickFirst_(rec, ["gewaesser", "badegewaesser", "gewasser"]);
  const title = ort || gewaesser || ("Badestelle " + bbNr);

  setValueByCandidates_(waters, row, ["water_id", "waterid"], waterId);
  setValueByCandidates_(waters, row, ["bb_nr", "bbnr", "bb nr"], bbNr);
  setValueByCandidates_(waters, row, ["spot_name", "badestelle", "name"], title);
  setValueByCandidates_(waters, row, ["source"], "Brandenburg");
  setValueByCandidates_(waters, row, ["source_key", "sourcekey"], normText_(title));
  setValueByCandidates_(waters, row, ["source_key_alt", "sourcekeyalt"], normText_(gewaesser));
  setValueByCandidates_(waters, row, ["latitude"], toNumberMaybe_(pickFirst_(rec, ["latitude", "lat"])));
  setValueByCandidates_(waters, row, ["longitude"], toNumberMaybe_(pickFirst_(rec, ["longitude", "lon", "lng"])));
  setValueByCandidates_(waters, row, ["detail_url"], absolutizeUrlMaybe_(pickFirst_(rec, ["detail_url", "url", "link"]), ABSOLUTE_URL_BASES.bb));
  setValueByCandidates_(waters, row, ["name_comp"], [waterId, title, bbNr].filter(Boolean).join(" "));
  setValueByCandidates_(waters, row, ["category"], "Brandenburg Badegewässer");
  setValueByCandidates_(waters, row, ["type"], "Badestelle");
  setValueByCandidates_(waters, row, ["region"], "Brandenburg");
  setValueByCandidates_(waters, row, ["status"], "Baden erlaubt");
  setValueByCandidates_(waters, row, ["bathing_allowed", "badefreigabe"], "Baden erlaubt");
  setValueByCandidates_(waters, row, ["short_description", "kurzbeschreibung"], "Offizielle Brandenburger Badestelle");
  setValueByCandidates_(waters, row, ["description", "beschreibung"], buildDefaultDescription_(title, "Brandenburg", bbNr));
  setValueByCandidates_(waters, row, ["map_link", "maps_url", "maps_link"], buildMapLinkFromLatLon_(pickFirst_(rec, ["latitude", "lat"]), pickFirst_(rec, ["longitude", "lon", "lng"]), title));
  setValueByCandidates_(waters, row, ["is_active", "active"], true);

  return waterId ? row : null;
}

/* =========================
   SELF HEAL / AUDIT
   ========================= */
function selfHealRelations_(ctx, log) {
  const waters = ctx.waters;
  const readings = ctx.readings;
  const master = ctx.master;

  const watersWaterIdCol = waters.findCol(["water_id", "waterid"]);
  const watersBbNrCol = waters.findColOptional(["bb_nr", "bbnr", "bb nr"]);
  const watersSpotNameCol = waters.findColOptional(["spot_name", "badestelle", "name"]);

  const readingsWaterIdCol = readings.findCol(["water_id", "waterid"]);
  const readingsBbNrCol = readings.findColOptional(["bb_nr", "bbnr", "bb nr"]);

  const masterBbNrCol = master.findCol(["bb_nr", "bbnr", "bb nr"]);

  let healedWaters = 0;
  let healedReadings = 0;

  const waterIdByBbNr = new Map();
  const bbNrByWaterId = new Map();

  if (watersBbNrCol >= 0) {
    for (let i = 0; i < waters.rows.length; i++) {
      let waterId = str_(waters.rows[i][watersWaterIdCol]);
      const rawBbNr = str_(waters.rows[i][watersBbNrCol]);
      const canonBbNr = canonicalBbNr_(rawBbNr);

      if (!waterId && canonBbNr) {
        const rec = { badestelle: watersSpotNameCol >= 0 ? waters.rows[i][watersSpotNameCol] : "" };
        waterId = buildAutonomousWaterId_(canonBbNr, rec);
        if (waterId) {
          waters.set(i, watersWaterIdCol, waterId);
          healedWaters++;
        }
      }

      if (canonBbNr && waterId) {
        if (!waterIdByBbNr.has(canonBbNr)) waterIdByBbNr.set(canonBbNr, waterId);
        if (!bbNrByWaterId.has(waterId)) bbNrByWaterId.set(waterId, canonBbNr);
      }
    }
  }

  const knownMasterBb = new Set();
  for (let i = 0; i < master.rows.length; i++) {
    const rawBbNr = str_(master.rows[i][masterBbNrCol]);
    const canonBbNr = canonicalBbNr_(rawBbNr);
    if (canonBbNr) knownMasterBb.add(canonBbNr);
  }

  if (readingsBbNrCol >= 0) {
    for (let i = 0; i < readings.rows.length; i++) {
      const rawBbNr = str_(readings.rows[i][readingsBbNrCol]);
      const canonBbNr = canonicalBbNr_(rawBbNr);
      const waterId = str_(readings.rows[i][readingsWaterIdCol]);

      if (!waterId && canonBbNr && waterIdByBbNr.has(canonBbNr)) {
        readings.set(i, readingsWaterIdCol, waterIdByBbNr.get(canonBbNr));
        healedReadings++;
      }

      if (!canonBbNr && waterId) {
        const inferred = bbNrByWaterId.get(waterId) || "";
        if (inferred && knownMasterBb.has(inferred)) {
          readings.set(i, readingsBbNrCol, inferred);
          healedReadings++;
        }
      }
    }
  }

  if (healedWaters > 0) waters.writeTouchedColumnsBack(log);
  if (healedReadings > 0) readings.writeTouchedColumnsBack(log);

  log.info("Self-heal relations", {
    waters_healed: healedWaters,
    readings_healed: healedReadings
  });
}

function auditDataIntegrity_(ctx, log) {
  const waters = ctx.waters;
  const readings = ctx.readings;
  const master = ctx.master;
  const notices = ctx.notices;

  const wWaterId = waters.findCol(["water_id", "waterid"]);
  const wBbNr = waters.findColOptional(["bb_nr", "bbnr", "bb nr"]);
  const wName = waters.findColOptional(["spot_name", "badestelle", "name"]);
  const wLatestMeasuredAt = waters.findColOptional(["latest_measured_at", "last_measured_at"]);
  const wLatestReadingKey = waters.findColOptional(["latest_reading_key", "last_reading_key"]);

  const rWaterId = readings.findCol(["water_id", "waterid"]);
  const rBbNr = readings.findColOptional(["bb_nr", "bbnr", "bb nr"]);
  const rMeasuredAt = readings.findColOptional(["measured_at", "messdatum", "dat", "datum", "date", "letzte_probe", "probenahme"]);

  const mBbNr = master.findCol(["bb_nr", "bbnr", "bb nr"]);

  const seenWaterId = new Map();
  const seenBbNrWaters = new Map();
  const seenBbNrMaster = new Map();

  let dupWaterId = 0;
  let dupBbNrWaters = 0;
  let dupBbNrMaster = 0;
  let watersMissingReading = 0;
  let readingsMissingMaster = 0;
  let watersMissingNotice = 0;
  let noticeMissingWaters = 0;
  let latestMeasuredAtMismatch = 0;
  let latestReadingKeyMismatch = 0;

  const readingWaterIds = new Set();
  const latestReadingByWaterId = new Map();
  for (let i = 0; i < readings.rows.length; i++) {
    const wid = str_(readings.rows[i][rWaterId]);
    if (!wid) continue;
    readingWaterIds.add(wid);

    const dt = rMeasuredAt >= 0 ? parseDateTimeMaybe_(readings.rows[i][rMeasuredAt]) : "";
    const ts = dt instanceof Date ? dt.getTime() : 0;
    const prev = latestReadingByWaterId.get(wid);
    if (!prev || ts > prev.ts) {
      latestReadingByWaterId.set(wid, {
        ts: ts,
        iso: (dt instanceof Date) ? dt.toISOString() : ""
      });
    }
  }

  const masterBbNrs = new Set();
  for (let i = 0; i < master.rows.length; i++) {
    const rawBb = str_(master.rows[i][mBbNr]);
    const canonBb = canonicalBbNr_(rawBb);
    if (!canonBb) continue;
    if (seenBbNrMaster.has(canonBb)) dupBbNrMaster++;
    seenBbNrMaster.set(canonBb, i);
    masterBbNrs.add(canonBb);
  }

  for (let i = 0; i < waters.rows.length; i++) {
    const wid = str_(waters.rows[i][wWaterId]);
    const bb = wBbNr >= 0 ? str_(waters.rows[i][wBbNr]) : "";
    const name = wName >= 0 ? str_(waters.rows[i][wName]) : "";

    if (wid) {
      if (seenWaterId.has(wid)) dupWaterId++;
      seenWaterId.set(wid, i);
      if (!readingWaterIds.has(wid)) watersMissingReading++;

      if (wLatestMeasuredAt >= 0) {
        const wLatestIso = str_(waters.rows[i][wLatestMeasuredAt]);
        const rLatest = latestReadingByWaterId.get(wid);
        if (wLatestIso && rLatest && rLatest.iso) {
          if (wLatestIso !== rLatest.iso) latestMeasuredAtMismatch++;
        }
      }

      if (wLatestReadingKey >= 0) {
        const key = str_(waters.rows[i][wLatestReadingKey]);
        const rLatest2 = latestReadingByWaterId.get(wid);
        if (key && rLatest2 && rLatest2.iso) {
          const expected = "rd_" + wid + "_" + rLatest2.iso.replace(/[^0-9]/g, "").slice(0, 14);
          if (key !== expected) latestReadingKeyMismatch++;
        }
      }
    }

    if (bb) {
      if (seenBbNrWaters.has(bb)) dupBbNrWaters++;
      seenBbNrWaters.set(bb, i);
    }

    if (DEBUG && !wid) {
      log.warn("Waters row missing water_id", { row: i + 2, name: name, bb_nr: bb });
    }
  }

  if (rBbNr >= 0) {
    for (let i = 0; i < readings.rows.length; i++) {
      const rawBb = str_(readings.rows[i][rBbNr]);
      const canonBb = canonicalBbNr_(rawBb);
      if (canonBb && !masterBbNrs.has(canonBb)) readingsMissingMaster++;
    }
  }

  if (notices) {
    const nWaterId = notices.findColOptional(["water_id", "waterid"]);
    if (nWaterId >= 0) {
      const noticeWaterIds = new Set();
      for (let i = 0; i < notices.rows.length; i++) {
        const wid = str_(notices.rows[i][nWaterId]);
        if (!wid) continue;
        noticeWaterIds.add(wid);
        if (!seenWaterId.has(wid)) noticeMissingWaters++;
      }

      for (const wid of seenWaterId.keys()) {
        if (!noticeWaterIds.has(wid)) watersMissingNotice++;
      }
    }
  }

  log.info("Audit integrity", {
    dup_water_id: dupWaterId,
    dup_bb_nr_waters: dupBbNrWaters,
    dup_bb_nr_master: dupBbNrMaster,
    waters_missing_reading: watersMissingReading,
    readings_missing_master: readingsMissingMaster,
    waters_missing_notice: watersMissingNotice,
    notice_missing_waters: noticeMissingWaters,
    latest_measured_at_mismatch: latestMeasuredAtMismatch,
    latest_reading_key_mismatch: latestReadingKeyMismatch
  });

  if (DEBUG_DRY_RUN) {
    auditPhase1RequiredColumns_(ctx, log);
  }
}

/* =========================
   SCHEMA / DRY-RUN HELPERS (PHASE 1)
   ========================= */

function auditPhase1RequiredColumns_(ctx, log) {
  const checks = [
    {
      sheet: ctx.readings.sheet,
      name: SHEET_READINGS,
      required: [
        "wind_speed_kmh",
        "wind_gust_kmh",
        "wind_direction",
        "current_m_s",
        "water_level_m",
        "source_timestamp_aux",
        "source_aux_type"
      ]
    },
    {
      sheet: ctx.master.sheet,
      name: SHEET_MASTER,
      required: [
        "boating_restriction",
        "boating_reason",
        "hazard_status",
        "hazard_reason"
      ]
    },
    {
      sheet: ctx.waters.sheet,
      name: SHEET_WATERS,
      required: [
        "visit_status",
        "bathing_status",
        "boating_status",
        "status_explanation",
        "last_updated"
      ]
    }
  ];

  for (const check of checks) {
    const missing = getMissingHeaders_(check.sheet, check.required);
    if (missing.length) {
      log.info("Schema check: missing columns", {
        sheet: check.name,
        missing: missing
      });
    } else {
      log.info("Schema check: all columns present", { sheet: check.name });
    }
  }
}

function ensurePhase1Columns_(ctx, log) {
  const checks = [
    {
      sheet: ctx.readings.sheet,
      name: SHEET_READINGS,
      required: [
        "wind_speed_kmh",
        "wind_gust_kmh",
        "wind_direction",
        "current_m_s",
        "water_level_m",
        "source_timestamp_aux",
        "source_aux_type"
      ]
    },
    {
      sheet: ctx.master.sheet,
      name: SHEET_MASTER,
      required: [
        "boating_restriction",
        "boating_reason",
        "hazard_status",
        "hazard_reason"
      ]
    },
    {
      sheet: ctx.waters.sheet,
      name: SHEET_WATERS,
      required: [
        "visit_status",
        "bathing_status",
        "boating_status",
        "status_explanation",
        "last_updated"
      ]
    }
  ];

  for (const check of checks) {
    const missing = getMissingHeaders_(check.sheet, check.required);
    if (!missing.length) continue;

    if (DEBUG_DRY_RUN) {
      log.info("DRY RUN: would append missing columns", {
        sheet: check.name,
        missing: missing
      });
      continue;
    }

    appendMissingHeadersToSheet_(check.sheet, missing, log);
    log.info("Appended missing columns", { sheet: check.name, missing: missing });
  }
}

function getMissingHeaders_(sheet, requiredHeaders) {
  const lastCol = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const headerNorm = headers.map(normHeader_);

  const missing = [];
  for (const h of requiredHeaders) {
    if (findHeaderIndex_(headerNorm, [h]) < 0) {
      missing.push(h);
    }
  }
  return missing;
}

function appendMissingHeadersToSheet_(sheet, headers, log) {
  if (!headers || !headers.length) return;

  // Ignore empty/blank headers
  const nonEmptyHeaders = headers.filter(function(h) { return str_(h) !== ""; });
  if (!nonEmptyHeaders.length) return;

  const lastCol = Math.max(1, sheet.getLastColumn());
  const startCol = lastCol + 1;
  const row = [nonEmptyHeaders];
  sheet.getRange(1, startCol, 1, nonEmptyHeaders.length).setValues(row);
  log.info("Appended headers to sheet", {
    sheet: sheet.getName(),
    startCol: startCol,
    headers: nonEmptyHeaders
  });
}

/* =========================
   DRY-RUN STATUS DERIVATION
   ========================= */

function runDeriveStatusesDryRun_V670() {
  const ss = SpreadsheetApp.getActive();
  const log = makeLogger_(ss);
  const ctx = loadContext_(ss, log);

  deriveStatusesDryRun_V670(ctx, log);
  log.flush();
}

function deriveStatusesDryRun_V670(ctx, log) {
  const waters = ctx.waters;
  const readings = ctx.readings;
  const master = ctx.master;

  const waterIdColW = waters.findCol(["water_id", "waterid"]);
  const waterNameColW = waters.findColOptional(["spot_name", "badestelle", "name"]);
  const bbNrColW = waters.findColOptional(["bb_nr", "bbnr", "bb nr"]);

  const readingWaterIdCol = readings.findCol(["water_id", "waterid"]);
  const readingMeasuredAtCol = readings.findColOptional(["measured_at", "messdatum", "dat", "datum", "date", "letzte_probe", "probenahme"]);
  const readingEcoCol = readings.findColOptional(["eco", "e_coli", "ecoli", "escherichia_coli"]);
  const readingEnteCol = readings.findColOptional(["ente", "enterococci", "enterokokken"]);

  const masterBbNrCol = master.findCol(["bb_nr", "bbnr", "bb nr"]);
  const masterBoatingRestrictionCol = master.findColOptional(["boating_restriction"]);
  const masterBoatingReasonCol = master.findColOptional(["boating_reason"]);
  const masterHazardStatusCol = master.findColOptional(["hazard_status"]);
  const masterHazardReasonCol = master.findColOptional(["hazard_reason"]);

  const readingsByWaterId = new Map();
  for (let i = 0; i < readings.rows.length; i++) {
    const wid = str_(readings.rows[i][readingWaterIdCol]);
    if (!wid) continue;
    const arr = readingsByWaterId.get(wid) || [];
    arr.push(i);
    readingsByWaterId.set(wid, arr);
  }

  const masterByBbNr = new Map();
  for (let i = 0; i < master.rows.length; i++) {
    const bb = str_(master.rows[i][masterBbNrCol]);
    if (!bb) continue;
    if (!masterByBbNr.has(bb)) masterByBbNr.set(bb, i);
  }

  for (let i = 0; i < waters.rows.length; i++) {
    const waterId = str_(waters.rows[i][waterIdColW]);
    const name = waterNameColW >= 0 ? str_(waters.rows[i][waterNameColW]) : "";
    const bbNr = bbNrColW >= 0 ? str_(waters.rows[i][bbNrColW]) : "";

    const readingRowIdxs = readingsByWaterId.get(waterId) || [];
    const bathing = computeBathingStatus_(readings, readingRowIdxs, {
      measuredAtCol: readingMeasuredAtCol,
      ecoCol: readingEcoCol,
      enteCol: readingEnteCol
    });

    const masterRowIdx = bbNr && masterByBbNr.has(bbNr) ? masterByBbNr.get(bbNr) : -1;
    const boating = computeBoatingStatus_(master, masterRowIdx, {
      boatingRestrictionCol: masterBoatingRestrictionCol,
      boatingReasonCol: masterBoatingReasonCol,
      hazardStatusCol: masterHazardStatusCol,
      hazardReasonCol: masterHazardReasonCol
    });

    const visit = computeVisitStatus_(bathing.status, boating.status);
    const explanation = cleanSentence_(buildStatusExplanation_(bathing, boating, visit));

    log.info("Dry-run derived statuses", {
      water_id: waterId,
      name: name,
      bathing_status: bathing.status,
      boating_status: boating.status,
      visit_status: visit,
      status_explanation: explanation
    });
  }
}

function diagnoseBathingCoverage_V670() {
  const ss = SpreadsheetApp.getActive();
  const log = makeLogger_(ss);
  const ctx = loadContext_(ss, log);

  const waters = ctx.waters;
  const readings = ctx.readings;

  const waterIdColW = waters.findCol(["water_id", "waterid"]);
  const readingWaterIdCol = readings.findCol(["water_id", "waterid"]);
  const readingMeasuredAtCol = readings.findColOptional(["measured_at", "messdatum", "dat", "datum", "date", "letzte_probe", "probenahme"]);
  const readingEcoCol = readings.findColOptional(["eco", "e_coli", "ecoli", "escherichia_coli"]);
  const readingEnteCol = readings.findColOptional(["ente", "enterococci", "enterokokken"]);

  const readingsByWaterId = new Map();
  for (let i = 0; i < readings.rows.length; i++) {
    const wid = str_(readings.rows[i][readingWaterIdCol]);
    if (!wid) continue;
    const arr = readingsByWaterId.get(wid) || [];
    arr.push(i);
    readingsByWaterId.set(wid, arr);
  }

  const counts = {
    totalSpots: waters.rows.length,
    spotsWithReadings: 0,
    spotsWithoutReadings: 0,
    spotsWithParsableDate: 0,
    spotsWithoutParsableDate: 0,
    spotsWithNumericValues: 0,
    spotsWithoutNumericValues: 0,
    ageClasses: {
      fresh: 0, // <=14
      stale: 0, // >14 <=60
      tooOld: 0, // >60
      noDate: 0
    },
    statusCounts: {
      ok: 0,
      caution: 0,
      restricted: 0,
      unknown: 0
    },
    unknownReasons: {
      no_readings: 0,
      no_date: 0,
      no_numeric_values: 0,
      too_old: 0,
      other: 0
    }
  };

  for (let i = 0; i < waters.rows.length; i++) {
    const waterId = str_(waters.rows[i][waterIdColW]);
    if (!waterId) continue;

    const readingRowIdxs = readingsByWaterId.get(waterId) || [];
    if (readingRowIdxs.length > 0) {
      counts.spotsWithReadings++;
    } else {
      counts.spotsWithoutReadings++;
    }

    // Prüfe Datum
    let hasParsableDate = false;
    let newestTs = 0;
    for (const r of readingRowIdxs) {
      const ts = parseDateTimeMaybe_(readingMeasuredAtCol >= 0 ? readings.rows[r][readingMeasuredAtCol] : "");
      const t = ts instanceof Date ? ts.getTime() : 0;
      if (t && t > newestTs) {
        newestTs = t;
        hasParsableDate = true;
      }
    }
    if (hasParsableDate) {
      counts.spotsWithParsableDate++;
    } else if (readingRowIdxs.length > 0) {
      counts.spotsWithoutParsableDate++;
    }

    // Prüfe numerische Werte (nur wenn Readings vorhanden)
    let hasNumericValues = false;
    if (readingRowIdxs.length > 0 && hasParsableDate) {
      const newestIdx = readingRowIdxs.find(r => {
        const ts = parseDateTimeMaybe_(readingMeasuredAtCol >= 0 ? readings.rows[r][readingMeasuredAtCol] : "");
        return ts instanceof Date && ts.getTime() === newestTs;
      });
      if (newestIdx !== undefined) {
        const eco = readingEcoCol >= 0 ? toNumberMaybe_(readings.rows[newestIdx][readingEcoCol]) : "";
        const ente = readingEnteCol >= 0 ? toNumberMaybe_(readings.rows[newestIdx][readingEnteCol]) : "";
        const ecoNum = typeof eco === "number" ? eco : NaN;
        const enteNum = typeof ente === "number" ? ente : NaN;
        if (isFinite(ecoNum) || isFinite(enteNum)) {
          hasNumericValues = true;
        }
      }
    }
    if (hasNumericValues) {
      counts.spotsWithNumericValues++;
    } else if (readingRowIdxs.length > 0) {
      counts.spotsWithoutNumericValues++;
    }

    // Altersklassen
    if (readingRowIdxs.length > 0 && hasParsableDate) {
      const now = Date.now();
      const ageDays = newestTs ? (now - newestTs) / (1000 * 60 * 60 * 24) : Infinity;
      if (ageDays <= 14) {
        counts.ageClasses.fresh++;
      } else if (ageDays <= 60) {
        counts.ageClasses.stale++;
      } else {
        counts.ageClasses.tooOld++;
      }
    } else if (readingRowIdxs.length > 0) {
      counts.ageClasses.noDate++;
    }

    // Status berechnen
    const bathing = computeBathingStatus_(readings, readingRowIdxs, {
      measuredAtCol: readingMeasuredAtCol,
      ecoCol: readingEcoCol,
      enteCol: readingEnteCol
    });
    counts.statusCounts[bathing.status] = (counts.statusCounts[bathing.status] || 0) + 1;

    // Unknown reasons
    if (bathing.status === "unknown") {
      if (!readingRowIdxs.length) {
        counts.unknownReasons.no_readings++;
      } else if (!hasParsableDate) {
        counts.unknownReasons.no_date++;
      } else if (!hasNumericValues) {
        counts.unknownReasons.no_numeric_values++;
      } else {
        const now = Date.now();
        const ageDays = newestTs ? (now - newestTs) / (1000 * 60 * 60 * 24) : Infinity;
        if (ageDays > 60) {
          counts.unknownReasons.too_old++;
        } else {
          counts.unknownReasons.other++;
        }
      }
    }
  }

  log.info("Bathing Coverage Diagnosis", counts);
  log.flush();
}

function runDiagnoseUnifiedStatus_V670() {
  const ss = SpreadsheetApp.getActive();
  const log = makeLogger_(ss);
  const ctx = loadContext_(ss, log);

  diagnoseUnifiedStatus_V670(ctx, log);
  log.flush();
}

function diagnoseUnifiedStatus_V670(ctx, log) {
  const waters = ctx.waters;
  const readings = ctx.readings;
  const master = ctx.master;

  const waterIdColW = waters.findCol(["water_id", "waterid"]);
  const spotNameColW = waters.findColOptional(["spot_name", "badestelle", "name"]);
  const bbNrColW = waters.findColOptional(["bb_nr", "bbnr", "bb nr"]);

  const readingWaterIdCol = readings.findCol(["water_id", "waterid"]);
  const readingMeasuredAtCol = readings.findColOptional(["measured_at", "messdatum", "dat", "datum", "date", "letzte_probe", "probenahme"]);
  const readingEcoCol = readings.findColOptional(["eco", "e_coli", "ecoli", "escherichia_coli"]);
  const readingEnteCol = readings.findColOptional(["ente", "enterococci", "enterokokken"]);

  const masterBbNrCol = master.findCol(["bb_nr", "bbnr", "bb nr"]);
  const masterBoatingRestrictionCol = master.findColOptional(["boating_restriction"]);
  const masterBoatingReasonCol = master.findColOptional(["boating_reason"]);
  const masterHazardStatusCol = master.findColOptional(["hazard_status"]);
  const masterHazardReasonCol = master.findColOptional(["hazard_reason"]);

  const readingsByWaterId = new Map();
  for (let i = 0; i < readings.rows.length; i++) {
    const wid = str_(readings.rows[i][readingWaterIdCol]);
    if (!wid) continue;
    const arr = readingsByWaterId.get(wid) || [];
    arr.push(i);
    readingsByWaterId.set(wid, arr);
  }

  const masterByBbNr = new Map();
  for (let i = 0; i < master.rows.length; i++) {
    const bb = str_(master.rows[i][masterBbNrCol]);
    if (!bb) continue;
    if (!masterByBbNr.has(bb)) masterByBbNr.set(bb, i);
  }

  const summary = {
    total_spots: waters.rows.length,
    bathing_known_count: 0,
    boating_known_count: 0,
    visit_status_counts: { ok: 0, caution: 0, restricted: 0, unknown: 0 },
    stale_over_14_count: 0,
    stale_over_60_count: 0,
    no_readings_count: 0,
    no_master_count: 0,
    mapping_missing_count: 0,
    diagnosis_counts: {},
    bathing_reason_counts: {},
    boating_reason_counts: {}
  };

  const samples = [];

  function inc(map, key) {
    map[key] = (map[key] || 0) + 1;
  }

  for (let i = 0; i < waters.rows.length; i++) {
    const waterId = str_(waters.rows[i][waterIdColW]);
    const spotName = spotNameColW >= 0 ? str_(waters.rows[i][spotNameColW]) : "";
    const bbNr = bbNrColW >= 0 ? str_(waters.rows[i][bbNrColW]) : "";

    const diag = {
      water_id: waterId,
      spot_name: spotName,
      has_readings: false,
      has_valid_date: false,
      has_numeric_bathing_values: false,
      age_days: null,
      bathing_status_candidate: "unknown",
      bathing_reason_code: "",
      boating_status_candidate: "unknown",
      boating_reason_code: "",
      visit_status_candidate: "unknown",
      diagnosis_codes: []
    };

    if (!waterId) {
      diag.diagnosis_codes.push("MAPPING_MISSING");
      summary.mapping_missing_count++;
    }

    const readingRowIdxs = waterId ? (readingsByWaterId.get(waterId) || []) : [];
    if (!readingRowIdxs.length) {
      diag.diagnosis_codes.push("NO_READINGS");
      summary.no_readings_count++;
    } else {
      diag.has_readings = true;
    }

    let newestTs = 0;
    for (const r of readingRowIdxs) {
      const ts = parseDateTimeMaybe_(readingMeasuredAtCol >= 0 ? readings.rows[r][readingMeasuredAtCol] : "");
      const t = ts instanceof Date ? ts.getTime() : 0;
      if (t && t > newestTs) {
        newestTs = t;
      }
    }

    if (newestTs) {
      diag.has_valid_date = true;
      const now = Date.now();
      const ageDays = (now - newestTs) / (1000 * 60 * 60 * 24);
      diag.age_days = ageDays;
      if (ageDays > 14) summary.stale_over_14_count++;
      if (ageDays > 60) summary.stale_over_60_count++;
    } else if (readingRowIdxs.length) {
      diag.diagnosis_codes.push("NO_DATE");
    }

    let ecoNum = NaN;
    let enteNum = NaN;
    if (newestTs) {
      const newestIdx = readingRowIdxs.find(r => {
        const ts = parseDateTimeMaybe_(readingMeasuredAtCol >= 0 ? readings.rows[r][readingMeasuredAtCol] : "");
        return ts instanceof Date && ts.getTime() === newestTs;
      });
      if (newestIdx !== undefined) {
        const eco = readingEcoCol >= 0 ? toNumberMaybe_(readings.rows[newestIdx][readingEcoCol]) : "";
        const ente = readingEnteCol >= 0 ? toNumberMaybe_(readings.rows[newestIdx][readingEnteCol]) : "";
        ecoNum = typeof eco === "number" ? eco : NaN;
        enteNum = typeof ente === "number" ? ente : NaN;
        if (isFinite(ecoNum) || isFinite(enteNum)) {
          diag.has_numeric_bathing_values = true;
        }
      }
    }

    if (!diag.has_numeric_bathing_values && diag.has_readings) {
      diag.diagnosis_codes.push("NO_NUMERIC");
    }

    const bathing = computeBathingStatus_(readings, readingRowIdxs, {
      measuredAtCol: readingMeasuredAtCol,
      ecoCol: readingEcoCol,
      enteCol: readingEnteCol
    });
    diag.bathing_status_candidate = bathing.status;

    if (bathing.status !== "unknown") {
      summary.bathing_known_count++;
    }

    // determine bathing reason code
    if (bathing.status === "restricted") {
      if (isFinite(ecoNum) && ecoNum > 1000) {
        diag.bathing_reason_code = "BATHING_RESTRICTED_ECO";
      } else if (isFinite(enteNum) && enteNum > 1000) {
        diag.bathing_reason_code = "BATHING_RESTRICTED_ENTE";
      } else {
        diag.bathing_reason_code = "BATHING_RESTRICTED_ECO";
      }
    } else if (bathing.status === "caution") {
      if ((isFinite(ecoNum) && ecoNum > 500) || (isFinite(enteNum) && enteNum > 500)) {
        diag.bathing_reason_code = "BATHING_CAUTION_WARNVALUE";
      } else {
        diag.bathing_reason_code = "BATHING_CAUTION_STALE";
      }
    } else if (bathing.status === "ok") {
      diag.bathing_reason_code = "BATHING_OK";
    } else {
      diag.bathing_reason_code = "BATHING_NO_DATA";
    }
    inc(summary.bathing_reason_counts, diag.bathing_reason_code);

    const masterRowIdx = bbNr && masterByBbNr.has(bbNr) ? masterByBbNr.get(bbNr) : -1;
    if (masterRowIdx < 0) {
      diag.diagnosis_codes.push("NO_MASTER");
      summary.no_master_count++;
    }

    const boating = computeBoatingStatus_(master, masterRowIdx, {
      boatingRestrictionCol: masterBoatingRestrictionCol,
      boatingReasonCol: masterBoatingReasonCol,
      hazardStatusCol: masterHazardStatusCol,
      hazardReasonCol: masterHazardReasonCol
    });
    diag.boating_status_candidate = boating.status;

    if (boating.status !== "unknown") {
      summary.boating_known_count++;
    }

    if (boating.status === "restricted") {
      diag.boating_reason_code = "BOATING_RESTRICTED";
    } else if (boating.status === "caution") {
      diag.boating_reason_code = "BOATING_CAUTION";
    } else if (boating.status === "ok") {
      diag.boating_reason_code = "BOATING_OK";
    } else {
      diag.boating_reason_code = "BOATING_NO_DATA";
    }
    inc(summary.boating_reason_counts, diag.boating_reason_code);

    diag.visit_status_candidate = computeVisitStatus_(bathing.status, boating.status);
    inc(summary.visit_status_counts, diag.visit_status_candidate);

    // collect diagnosis code counts
    for (const code of diag.diagnosis_codes) {
      inc(summary.diagnosis_counts, code);
    }

    // sample collection
    if ((diag.visit_status_candidate === "unknown" || diag.diagnosis_codes.length) && samples.length < 15) {
      samples.push({
        water_id: waterId,
        spot_name: spotName,
        bathing_status_candidate: diag.bathing_status_candidate,
        boating_status_candidate: diag.boating_status_candidate,
        visit_status_candidate: diag.visit_status_candidate,
        diagnosis_codes: diag.diagnosis_codes,
        bathing_reason_code: diag.bathing_reason_code,
        boating_reason_code: diag.boating_reason_code,
        age_days: diag.age_days
      });
    }
  }

  log.info("Unified Status Diagnosis Summary", summary);
  if (samples.length) {
    log.info("Unified Status Diagnosis Samples", samples);
  }
}

function computeBathingStatus_(readings, rowIdxs, cols) {
  const BATHING_RESTRICTED_THRESHOLD = 1000;
  const BATHING_CAUTION_THRESHOLD = 500;

  if (!rowIdxs || !rowIdxs.length) {
    return { status: "unknown", reason: "Keine Messdaten", type: "no_data" };
  }

  let newestIdx = null;
  let newestTs = 0;

  for (const r of rowIdxs) {
    const ts = parseDateTimeMaybe_(cols.measuredAtCol >= 0 ? readings.rows[r][cols.measuredAtCol] : "");
    const t = ts instanceof Date ? ts.getTime() : 0;
    if (t && t > newestTs) {
      newestTs = t;
      newestIdx = r;
    }
  }

  if (newestIdx == null) {
    return { status: "unknown", reason: "Keine Messdaten", type: "no_data" };
  }

  const now = Date.now();
  const ageDays = newestTs ? (now - newestTs) / (1000 * 60 * 60 * 24) : Infinity;

  const eco = cols.ecoCol >= 0 ? toNumberMaybe_(readings.rows[newestIdx][cols.ecoCol]) : "";
  const ente = cols.enteCol >= 0 ? toNumberMaybe_(readings.rows[newestIdx][cols.enteCol]) : "";

  const ecoNum = typeof eco === "number" ? eco : NaN;
  const enteNum = typeof ente === "number" ? ente : NaN;

  const hasEco = isFinite(ecoNum);
  const hasEnte = isFinite(enteNum);
  const anyValue = hasEco || hasEnte;

  if (!anyValue) {
    return { status: "unknown", reason: "Keine belastbaren Badewerte", type: "no_data" };
  }

  const ecoRestricted = hasEco && ecoNum > BATHING_RESTRICTED_THRESHOLD;
  const enteRestricted = hasEnte && enteNum > BATHING_RESTRICTED_THRESHOLD;
  const ecoCaution = hasEco && ecoNum > BATHING_CAUTION_THRESHOLD;
  const enteCaution = hasEnte && enteNum > BATHING_CAUTION_THRESHOLD;

  if (ecoRestricted || enteRestricted) {
    return {
      status: "restricted",
      reason: "Kritische Wasserwerte",
      type: "critical"
    };
  }

  if (ecoCaution || enteCaution) {
    return {
      status: "caution",
      reason: "Warnwerte",
      type: "warning"
    };
  }

  if (ageDays <= 180) {
    return { status: "ok", reason: "Werte unauffällig", type: "ok" };
  }

  return { status: "caution", reason: "Messwerte nicht mehr aktuell", type: "stale" };
}

function computeBoatingStatus_(master, rowIdx, cols) {
  if (rowIdx == null || rowIdx < 0) {
    return { status: "unknown", reason: "Keine Master‑Daten" };
  }

  const restriction = cols.boatingRestrictionCol >= 0 ? str_(master.rows[rowIdx][cols.boatingRestrictionCol]) : "";
  const hazard = cols.hazardStatusCol >= 0 ? str_(master.rows[rowIdx][cols.hazardStatusCol]) : "";
  const reason = cols.boatingReasonCol >= 0 ? str_(master.rows[rowIdx][cols.boatingReasonCol]) : "";
  const hazardReason = cols.hazardReasonCol >= 0 ? str_(master.rows[rowIdx][cols.hazardReasonCol]) : "";

  const normalizedRestriction = normHeader_(restriction);
  const normalizedHazard = normHeader_(hazard);

  if (normalizedRestriction === "restricted" || normalizedHazard === "restricted") {
    return { status: "restricted", reason: reason || hazardReason || "Bootsbeschränkung" };
  }
  if (normalizedRestriction === "caution" || normalizedHazard === "caution") {
    return { status: "caution", reason: reason || hazardReason || "Bootsbeschränkung" };
  }

  // Only consider explicitly neutral values as ok.
  // All other non-empty values remain unknown.
  const explicitlyOk = ["none", "ok", "no", "kein", "n/a", "na"];
  if (explicitlyOk.indexOf(normalizedRestriction) >= 0 || explicitlyOk.indexOf(normalizedHazard) >= 0) {
    return { status: "ok", reason: reason || hazardReason || "Keine Einschränkung" };
  }

  return { status: "unknown", reason: "Keine Bootsdaten" };
}

function computeVisitStatus_(bathingStatus, boatingStatus) {
  if (bathingStatus === "restricted" || boatingStatus === "restricted") return "restricted";
  if (bathingStatus === "caution" || boatingStatus === "caution") return "caution";
  if (bathingStatus === "ok" && (boatingStatus === "ok" || boatingStatus === "unknown")) return "ok";
  if (bathingStatus === "unknown" && boatingStatus === "unknown") return "unknown";
  return "caution";
}

function buildStatusExplanation_(bathing, boating, visit) {
  const v = typeof visit === "string" ? visit : "";

  if (v === "restricted") {
    if (bathing && bathing.status === "restricted") {
      return "Baden ist aktuell nicht empfohlen";
    }
    if (boating && boating.status === "restricted") {
      return "Vor Ort gibt es aktuell Nutzungseinschraenkungen";
    }
    return "Ein Aufenthalt ist aktuell nur eingeschraenkt empfehlenswert";
  }

  if (v === "caution") {
    if (bathing && bathing.reason === "Warnwerte") {
      return "Die aktuellen Messwerte sprechen fuer erhoehte Aufmerksamkeit";
    }
    if (bathing && bathing.reason === "Messwerte nicht mehr aktuell") {
      return "Messwerte liegen vor, sind aber nicht mehr ganz aktuell";
    }
    return "Die Lage ist grundsätzlich nutzbar, erfordert aber Aufmerksamkeit";
  }

  if (v === "ok") {
    return "Die letzten verfuegbaren Messwerte sind unauffaellig";
  }

  return "Fuer diesen Spot liegen aktuell keine belastbaren Badedaten vor";
}

function runWriteStatuses_V670() {
  const ss = SpreadsheetApp.getActive();
  const log = makeLogger_(ss);
  const ctx = loadContext_(ss, log);

  writeStatusesToWaters_V670(ctx, log);
  syncWaterNoticesFromWaters_(ctx, log);
  log.flush();
}

function writeStatusesToWaters_V670(ctx, log) {
  const waters = ctx.waters;
  const readings = ctx.readings;
  const master = ctx.master;

  const visitStatusCol = ctx.cols.waters.visit_status;
  const bathingStatusCol = ctx.cols.waters.bathing_status;
  const boatingStatusCol = ctx.cols.waters.boating_status;
  const statusExplanationCol = ctx.cols.waters.status_explanation;
  const lastUpdatedCol = ctx.cols.waters.last_updated;
  const visitStatusLabelCol = ctx.cols.waters.visit_status_label;
  const visitStatusIconCol = ctx.cols.waters.visit_status_icon;
  const visitStatusColorCol = ctx.cols.waters.visit_status_color;
  const statusExplanationHumanizedCol = ctx.cols.waters.status_explanation_humanized;
  const boatingCtaLabelCol = ctx.cols.waters.boating_cta_label;
  const boatingCtaUrlCol = ctx.cols.waters.boating_cta_url;
  const captainOutlookCol = ctx.cols.waters.captain_outlook_ui;
  const captainTipCol = ctx.cols.waters.captain_tip_ui;
  const pegelStatusColW = waters.findColOptional(["pegel_status", "pegel status"]);
  const pegelStationColW = waters.findColOptional(["pegel_station", "pegel station", "messstation"]);
  const waterLevelColW = waters.findColOptional(["water_level", "water level", "wasserstand", "pegel"]);
  const waterLevelTrendColW = waters.findColOptional(["water_level_trend", "water level trend", "pegel_trend", "wasserstand_trend"]);
  const pegelValueUiColW = waters.findColOptional(["pegel_value_ui", "pegel value ui", "pegel_value_label", "pegel value label"]);
  const pegelStationUiColW = waters.findColOptional(["pegel_station_ui", "pegel ui", "pegel_label", "pegel label"]);
  const pegelStatusUiColW = waters.findColOptional(["pegel_status_ui", "pegel status ui", "pegel_status_label", "pegel status label", "pegel_level", "pegel level", "water_level_label", "water level label", "pegel_reason", "pegel reason"]);

  // Read-only boat-condition columns written by diagnoseBoatConditions
  const boatStatusReadCol = waters.findColOptional(["boat_status", "boating_status"]);
  const stormRiskReadCol = waters.findColOptional(["storm_risk"]);
  const windSpeedReadCol = waters.findColOptional(["wind_speed"]);
  const waveHeightReadCol = waters.findColOptional(["wave_height"]);
  const forecastTrendReadCol = waters.findColOptional(["forecast_trend"]);
  const recommendationLevelReadCol = waters.findColOptional(["recommendation_level"]);
  const riskLevelReadCol = waters.findColOptional(["risk_level"]);
  const boatStatusLabelReadCol = waters.findColOptional(["boat_status_label", "boating_status_label"]);
  // Extra boating-relevance signal columns (all optional, used only for isBoatingRelevantFromRow_)
  const elwisStatusReadCol = waters.findColOptional(["elwis_status"]);
  const elwisReasonReadCol = waters.findColOptional(["elwis_reason"]);
  const pegelStationReadCol = waters.findColOptional(["pegel_station"]);
  const currentSpeedReadCol = waters.findColOptional(["current_speed"]);
  const waterLevelReadCol = waters.findColOptional(["water_level"]);

  if (visitStatusCol < 0 || bathingStatusCol < 0 || boatingStatusCol < 0 || statusExplanationCol < 0 || lastUpdatedCol < 0) {
    log.warn("Required Waters columns missing for status writes", {
      visit_status: visitStatusCol >= 0,
      bathing_status: bathingStatusCol >= 0,
      boating_status: boatingStatusCol >= 0,
      status_explanation: statusExplanationCol >= 0,
      last_updated: lastUpdatedCol >= 0
    });
    return;
  }

  const waterIdColW = waters.findCol(["water_id", "waterid"]);
  const waterNameColW = waters.findColOptional(["spot_name", "badestelle", "name"]);
  const bbNrColW = waters.findColOptional(["bb_nr", "bbnr", "bb nr"]);

  const readingWaterIdCol = readings.findCol(["water_id", "waterid"]);
  const readingMeasuredAtCol = readings.findColOptional(["measured_at", "messdatum", "dat", "datum", "date", "letzte_probe", "probenahme"]);
  const readingEcoCol = readings.findColOptional(["eco", "e_coli", "ecoli", "escherichia_coli"]);
  const readingEnteCol = readings.findColOptional(["ente", "enterococci", "enterokokken"]);

  const masterBbNrCol = master.findCol(["bb_nr", "bbnr", "bb nr"]);
  const masterBoatingRestrictionCol = master.findColOptional(["boating_restriction"]);
  const masterBoatingReasonCol = master.findColOptional(["boating_reason"]);
  const masterHazardStatusCol = master.findColOptional(["hazard_status"]);
  const masterHazardReasonCol = master.findColOptional(["hazard_reason"]);

  const readingsByWaterId = new Map();
  for (let i = 0; i < readings.rows.length; i++) {
    const wid = str_(readings.rows[i][readingWaterIdCol]);
    if (!wid) continue;
    const arr = readingsByWaterId.get(wid) || [];
    arr.push(i);
    readingsByWaterId.set(wid, arr);
  }

  const masterByBbNr = new Map();
  for (let i = 0; i < master.rows.length; i++) {
    const bb = str_(master.rows[i][masterBbNrCol]);
    if (!bb) continue;
    if (!masterByBbNr.has(bb)) masterByBbNr.set(bb, i);
  }

  let written = 0;
  let skipped = 0;
  let unchanged = 0;
  let pegelRowsChecked = 0;
  let pegelValueUiUpdatedRows = 0;
  let pegelStatusUiUpdatedRows = 0;
  let pegelStationUiUpdatedRows = 0;

  for (let i = 0; i < waters.rows.length; i++) {
    const waterId = str_(waters.rows[i][waterIdColW]);
    if (!waterId) continue;

    const readingRowIdxs = readingsByWaterId.get(waterId) || [];
    const bathing = computeBathingStatus_(readings, readingRowIdxs, {
      measuredAtCol: readingMeasuredAtCol,
      ecoCol: readingEcoCol,
      enteCol: readingEnteCol
    });

    if (bathing.status === "unknown") {
      skipped++;
    }

    const bbNr = bbNrColW >= 0 ? str_(waters.rows[i][bbNrColW]) : "";
    const masterRowIdx = bbNr && masterByBbNr.has(bbNr) ? masterByBbNr.get(bbNr) : -1;
    const boating = computeBoatingStatus_(master, masterRowIdx, {
      boatingRestrictionCol: masterBoatingRestrictionCol,
      boatingReasonCol: masterBoatingReasonCol,
      hazardStatusCol: masterHazardStatusCol,
      hazardReasonCol: masterHazardReasonCol
    });

    const visit = computeVisitStatus_(bathing.status, boating.status);
    const explanation = buildStatusExplanation_(bathing, boating, visit);

    const visitLabel = visit === "ok"
      ? "Empfohlen"
      : visit === "caution"
        ? "Vorsicht"
        : visit === "restricted"
          ? "Nicht empfohlen"
          : "Keine Daten";

    const visitIcon = visit === "ok"
      ? "🟢"
      : visit === "caution"
        ? "🟡"
        : visit === "restricted"
          ? "🔴"
          : "⚪";

    const visitColor = visit === "ok"
      ? "green"
      : visit === "caution"
        ? "amber"
        : visit === "restricted"
          ? "red"
          : "gray";

    const explanationHumanized = joinSentencesClean_([
      visit === "ok"
        ? "Gute Bedingungen fuer eine ruhige Zeit am Wasser"
        : visit === "caution"
          ? "Der Spot wirkt aktuell grundsättzlich nutzbar, bitte Hinweise und Entwicklung im Blick behalten"
          : visit === "restricted"
            ? "Der Spot wirkt aktuell nicht ideal fuer unbeschwertes Baden"
            : "Fuer eine verlaessliche Einschaetzung fehlen aktuell belastbare Badedaten",
      (boating && boating.reason && boating.reason !== "Keine Bootsdaten") ? ("Schifffahrt: " + cleanSentence_(boating.reason)) : ""
    ]);

    const boatingCtaLabel = boating.status === "restricted"
      ? "Amtliche Schifffahrtswarnung prüfen"
      : boating.status === "ok"
        ? "Schifffahrtsinfos öffnen"
        : "Schifffahrtsinfos prüfen";
    const boatingCtaUrl = "https://www.elwis.de";

    // Captain UI texts — built from visit/boating outcome + existing boat-condition columns
    const captainParams = {
      boatingStatus: boating.status,
      visitStatus: visit,
      forecastTrend: forecastTrendReadCol >= 0 ? str_(waters.rows[i][forecastTrendReadCol]) : "",
      riskLevel: riskLevelReadCol >= 0 ? str_(waters.rows[i][riskLevelReadCol]) : "",
      stormRisk: stormRiskReadCol >= 0 ? str_(waters.rows[i][stormRiskReadCol]) : "",
      windSpeed: windSpeedReadCol >= 0 ? toNumberMaybe_(waters.rows[i][windSpeedReadCol]) : null,
      waveHeight: waveHeightReadCol >= 0 ? toNumberMaybe_(waters.rows[i][waveHeightReadCol]) : null,
      recommendationLevel: recommendationLevelReadCol >= 0 ? str_(waters.rows[i][recommendationLevelReadCol]) : "",
      boatStatusLabel: boatStatusLabelReadCol >= 0 ? str_(waters.rows[i][boatStatusLabelReadCol]) : "",
      elwisStatus: elwisStatusReadCol >= 0 ? str_(waters.rows[i][elwisStatusReadCol]) : "",
      elwisReason: elwisReasonReadCol >= 0 ? str_(waters.rows[i][elwisReasonReadCol]) : "",
      pegelStation: pegelStationReadCol >= 0 ? str_(waters.rows[i][pegelStationReadCol]) : "",
      currentSpeed: currentSpeedReadCol >= 0 ? toNumberMaybe_(waters.rows[i][currentSpeedReadCol]) : null,
      waterLevel: waterLevelReadCol >= 0 ? toNumberMaybe_(waters.rows[i][waterLevelReadCol]) : null
    };
    const boatingRelevant = isBoatingRelevantFromRow_(captainParams);
    const captainOutlook = (captainOutlookCol >= 0)
      ? (boatingRelevant ? buildCaptainOutlookUi_(captainParams) : CAPTAIN_NOT_BOATING_TEXT)
      : "";
    const captainTip = (captainTipCol >= 0)
      ? (boatingRelevant ? buildCaptainTipUi_(captainParams) : CAPTAIN_NOT_BOATING_TEXT)
      : "";

    const rawPegelStatus = pegelStatusColW >= 0 ? str_(waters.rows[i][pegelStatusColW]) : "";
    const rawPegelStation = pegelStationColW >= 0 ? str_(waters.rows[i][pegelStationColW]) : "";
    const rawWaterLevel = waterLevelColW >= 0 ? waters.rows[i][waterLevelColW] : null;
    const rawWaterLevelTrend = waterLevelTrendColW >= 0 ? waters.rows[i][waterLevelTrendColW] : null;
    const pegelValueUi = pegelValueUiColW >= 0
      ? formatPegelValueUi_(rawWaterLevel)
      : "";
    const pegelStationUi = pegelStationUiColW >= 0
      ? formatPegelStationUi_(rawPegelStatus, rawPegelStation)
      : "";
    const pegelStatusUi = pegelStatusUiColW >= 0
      ? formatPegelStatusUi_(rawPegelStatus, rawPegelStation, rawWaterLevelTrend)
      : "";
    if (pegelValueUiColW >= 0 || pegelStationUiColW >= 0 || pegelStatusUiColW >= 0) pegelRowsChecked++;

    const oldVisit = str_(waters.rows[i][visitStatusCol]);
    const oldBathing = str_(waters.rows[i][bathingStatusCol]);
    const oldBoating = str_(waters.rows[i][boatingStatusCol]);
    const oldExplanation = str_(waters.rows[i][statusExplanationCol]);
    const oldVisitLabel = visitStatusLabelCol >= 0 ? str_(waters.rows[i][visitStatusLabelCol]) : "";
    const oldVisitIcon = visitStatusIconCol >= 0 ? str_(waters.rows[i][visitStatusIconCol]) : "";
    const oldVisitColor = visitStatusColorCol >= 0 ? str_(waters.rows[i][visitStatusColorCol]) : "";
    const oldExplanationHumanized = statusExplanationHumanizedCol >= 0 ? str_(waters.rows[i][statusExplanationHumanizedCol]) : "";
    const oldBoatingCtaLabel = boatingCtaLabelCol >= 0 ? str_(waters.rows[i][boatingCtaLabelCol]) : "";
    const oldBoatingCtaUrl = boatingCtaUrlCol >= 0 ? str_(waters.rows[i][boatingCtaUrlCol]) : "";
    const oldLastUpdated = lastUpdatedCol >= 0 ? str_(waters.rows[i][lastUpdatedCol]) : "";
    const oldCaptainOutlook = captainOutlookCol >= 0 ? str_(waters.rows[i][captainOutlookCol]) : "";
    const oldCaptainTip = captainTipCol >= 0 ? str_(waters.rows[i][captainTipCol]) : "";
    const oldPegelValueUi = pegelValueUiColW >= 0 ? str_(waters.rows[i][pegelValueUiColW]) : "";
    const oldPegelStationUi = pegelStationUiColW >= 0 ? str_(waters.rows[i][pegelStationUiColW]) : "";
    const oldPegelStatusUi = pegelStatusUiColW >= 0 ? str_(waters.rows[i][pegelStatusUiColW]) : "";

    const changedCore =
      (oldVisit !== visit) ||
      (oldBathing !== bathing.status) ||
      (oldBoating !== boating.status) ||
      (oldExplanation !== explanation) ||
      (visitStatusLabelCol >= 0 && oldVisitLabel !== visitLabel) ||
      (visitStatusIconCol >= 0 && oldVisitIcon !== visitIcon) ||
      (visitStatusColorCol >= 0 && oldVisitColor !== visitColor) ||
      (statusExplanationHumanizedCol >= 0 && oldExplanationHumanized !== explanationHumanized) ||
      (boatingCtaLabelCol >= 0 && oldBoatingCtaLabel !== boatingCtaLabel) ||
      (boatingCtaUrlCol >= 0 && oldBoatingCtaUrl !== boatingCtaUrl) ||
      (lastUpdatedCol >= 0 && !oldLastUpdated);

    // Captain fields have their own independent change gate so stable rows still get updated
    const changedCaptain =
      (captainOutlookCol >= 0 && (!oldCaptainOutlook || oldCaptainOutlook !== captainOutlook)) ||
      (captainTipCol >= 0 && (!oldCaptainTip || oldCaptainTip !== captainTip));

    const changedPegelValueUi =
      (pegelValueUiColW >= 0 && (!oldPegelValueUi || oldPegelValueUi !== pegelValueUi));
    const changedPegelStationUi =
      (pegelStationUiColW >= 0 && (!oldPegelStationUi || oldPegelStationUi !== pegelStationUi));
    const changedPegelStatusUi =
      (pegelStatusUiColW >= 0 && (!oldPegelStatusUi || oldPegelStatusUi !== pegelStatusUi));
    const changedPegelUi = changedPegelValueUi || changedPegelStationUi || changedPegelStatusUi;

    if (!changedCore && !changedCaptain && !changedPegelUi) {
      unchanged++;
      continue;
    }

    const now = formatReadableDateTime_(new Date());

    if (DEBUG_DRY_RUN) {
      log.info("DRY RUN: would write statuses", {
        water_id: waterId,
        changed_core: changedCore,
        changed_captain: changedCaptain,
        changed_pegel_ui: changedPegelUi,
        changed_pegel_value_ui: changedPegelValueUi,
        changed_pegel_status_ui: changedPegelStatusUi,
        changed_pegel_station_ui: changedPegelStationUi,
        visit_status: visit,
        bathing_status: bathing.status,
        boating_status: boating.status,
        status_explanation: explanation,
        visit_status_label: visitLabel,
        visit_status_icon: visitIcon,
        visit_status_color: visitColor,
        status_explanation_humanized: explanationHumanized,
        boating_cta_label: boatingCtaLabel,
        boating_cta_url: boatingCtaUrl,
        captain_outlook_ui: captainOutlook,
        captain_tip_ui: captainTip,
        pegel_value_ui: pegelValueUi,
        pegel_station_ui: pegelStationUi,
        pegel_status_ui: pegelStatusUi,
        last_updated: changedCore ? now : oldLastUpdated
      });
      if (changedPegelValueUi) pegelValueUiUpdatedRows++;
      if (changedPegelStatusUi) pegelStatusUiUpdatedRows++;
      if (changedPegelStationUi) pegelStationUiUpdatedRows++;
      written++;
      continue;
    }

    // Core status fields + last_updated: only written when status data actually changed
    if (changedCore) {
      waters.set(i, visitStatusCol, visit);
      waters.set(i, bathingStatusCol, bathing.status);
      waters.set(i, boatingStatusCol, boating.status);
      waters.set(i, statusExplanationCol, sanitizeText_(explanation));
      if (visitStatusLabelCol >= 0) waters.set(i, visitStatusLabelCol, visitLabel);
      if (visitStatusIconCol >= 0) waters.set(i, visitStatusIconCol, visitIcon);
      if (visitStatusColorCol >= 0) waters.set(i, visitStatusColorCol, visitColor);
      if (statusExplanationHumanizedCol >= 0) waters.set(i, statusExplanationHumanizedCol, sanitizeText_(explanationHumanized));
      if (boatingCtaLabelCol >= 0) waters.set(i, boatingCtaLabelCol, boatingCtaLabel);
      if (boatingCtaUrlCol >= 0) waters.set(i, boatingCtaUrlCol, boatingCtaUrl);
      waters.set(i, lastUpdatedCol, now);
    }

    // Captain UI fields: written independently whenever blank or stale
    if (captainOutlookCol >= 0) waters.set(i, captainOutlookCol, captainOutlook);
    if (captainTipCol >= 0) waters.set(i, captainTipCol, captainTip);
    if (pegelValueUiColW >= 0) waters.set(i, pegelValueUiColW, pegelValueUi);
    if (pegelStationUiColW >= 0) waters.set(i, pegelStationUiColW, pegelStationUi);
    if (pegelStatusUiColW >= 0) waters.set(i, pegelStatusUiColW, pegelStatusUi);

    if (changedPegelValueUi) pegelValueUiUpdatedRows++;
    if (changedPegelStatusUi) pegelStatusUiUpdatedRows++;
    if (changedPegelStationUi) pegelStationUiUpdatedRows++;

    written++;
  }

  if (written > 0 && !DEBUG_DRY_RUN) waters.writeTouchedColumnsBack(log);

  log.info("Write statuses to Waters", {
    written: written,
    skipped: skipped,
    unchanged: unchanged,
    rows_checked: pegelRowsChecked,
    pegel_value_ui_written: pegelValueUiUpdatedRows,
    pegel_status_ui_written: pegelStatusUiUpdatedRows,
    pegel_station_ui_written: pegelStationUiUpdatedRows,
    dry_run: DEBUG_DRY_RUN
  });
}

/* =========================
   CACHE HELPERS
   ========================= */
function fetchTextCached_(url, cacheKey, ttlMinutes, log, shCache, cacheSpec, cacheMap) {
  const text = fetchText_(url, log);

  try {
    storeMetaCacheMaybe_(shCache, cacheSpec, cacheMap, cacheKey, text, log);
  } catch (e2) {
    log.warn("Cache meta write failed", {
      key: cacheKey,
      err: String((e2 && e2.message) || e2)
    });
  }

  return text;
}

function fetchText_(url, log) {
  const resp = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true,
    method: "get",
    contentType: "application/xml; charset=utf-8",
    headers: {
      "User-Agent": "WaveBite-WaterEngine/6.7.0 (AppsScript)",
      "Accept": "text/csv,application/xml,text/xml,text/html,*/*"
    }
  });

  const code = resp.getResponseCode();
  const txt = resp.getContentText("UTF-8");

  if (code < 200 || code >= 300) {
    log.warn("HTTP fetch failed", {
      url: url,
      code: code,
      body_snip: String(txt || "").slice(0, 400)
    });
    throw new Error("Fetch failed (" + code + ") for " + url);
  }

  if (!txt || txt.length < 10) {
    log.warn("HTTP fetch empty", { url: url, code: code });
    throw new Error("Fetch empty for " + url);
  }

  return txt;
}

function readCacheFlexible_(shCache, spec) {
  const map = new Map();
  if (!spec) return map;

  const lastRow = shCache.getLastRow();
  const lastCol = shCache.getLastColumn();
  if (lastRow < 2 || lastCol < 6) return map;

  const values = shCache.getRange(1, 1, lastRow, lastCol).getValues();
  for (let r = 1; r < values.length; r++) {
    const key = String(values[r][spec.idxKey] || "").trim();
    if (!key) continue;

    const updatedAt = values[r][spec.idxUpdated] instanceof Date
      ? values[r][spec.idxUpdated].getTime()
      : Date.parse(values[r][spec.idxUpdated]);

    map.set(key, {
      row: r + 1,
      updated_at: isFinite(updatedAt) ? updatedAt : 0,
      payload: null
    });
  }
  return map;
}

function storeMetaCacheMaybe_(shCache, spec, cacheMap, key, payload, log) {
  if (!shCache || !spec) return;

  try {
    const hit = cacheMap ? cacheMap.get(key) : null;
    const preview = String(payload || "").slice(0, CACHE_PREVIEW_CHARS);
    const bytes = Utilities.newBlob(String(payload || ""), "text/plain").getBytes().length;
    const sha1 = sha1Hex_(payload);
    const updatedAt = new Date();

    if (hit && hit.row) {
      writeCacheStructuredRow_(shCache, hit.row, spec, {
        key: key,
        updated_at: updatedAt,
        preview: preview,
        bytes: bytes,
        sha1: sha1,
        notes: "meta-only"
      });
      cacheMap.set(key, {
        row: hit.row,
        updated_at: updatedAt.getTime(),
        payload: null
      });
    } else {
      const rowNum = appendCacheStructuredRow_(shCache, spec, {
        key: key,
        updated_at: updatedAt,
        preview: preview,
        bytes: bytes,
        sha1: sha1,
        notes: "meta-only"
      });
      cacheMap.set(key, {
        row: rowNum,
        updated_at: updatedAt.getTime(),
        payload: null
      });
    }

    if (DEBUG) log.info("CACHE META STORE", { key: key, bytes: bytes });
  } catch (e) {
    log.warn("Cache meta write failed", {
      key: key,
      err: String((e && e.message) || e)
    });
  }
}

function getCacheSpec_(shCache) {
  const lastCol = shCache.getLastColumn();
  if (lastCol < 6) return null;

  const headers = shCache.getRange(1, 1, 1, lastCol).getValues()[0].map(normHeader_);
  const idxKey = headers.indexOf("cachekey");
  const idxUpdated = headers.indexOf("updatedat");
  const idxPreview = headers.indexOf("payloadpreview200");
  const idxBytes = headers.indexOf("payloadbytes");
  const idxSha1 = headers.indexOf("payloadsha1");
  const idxNotes = headers.indexOf("notes");

  if ([idxKey, idxUpdated, idxPreview, idxBytes, idxSha1, idxNotes].some(function(i) { return i < 0; })) return null;

  return {
    idxKey: idxKey,
    idxUpdated: idxUpdated,
    idxPreview: idxPreview,
    idxBytes: idxBytes,
    idxSha1: idxSha1,
    idxNotes: idxNotes
  };
}

function writeCacheStructuredRow_(shCache, rowNum, spec, obj) {
  const width = shCache.getLastColumn();
  const row = shCache.getRange(rowNum, 1, 1, width).getValues()[0];

  row[spec.idxKey] = obj.key;
  row[spec.idxUpdated] = obj.updated_at;
  row[spec.idxPreview] = obj.preview;
  row[spec.idxBytes] = obj.bytes;
  row[spec.idxSha1] = obj.sha1;
  row[spec.idxNotes] = obj.notes;

  shCache.getRange(rowNum, 1, 1, width).setValues([row]);
}

function appendCacheStructuredRow_(shCache, spec, obj) {
  const row = blankRow_(shCache.getLastColumn());

  row[spec.idxKey] = obj.key;
  row[spec.idxUpdated] = obj.updated_at;
  row[spec.idxPreview] = obj.preview;
  row[spec.idxBytes] = obj.bytes;
  row[spec.idxSha1] = obj.sha1;
  row[spec.idxNotes] = obj.notes;

  const rowNum = shCache.getLastRow() + 1;
  shCache.getRange(rowNum, 1, 1, row.length).setValues([row]);
  return rowNum;
}

/* =========================
   LOGGER
   ========================= */
function makeLogger_(ss) {
  let sh = ss.getSheetByName(SHEET_LOG);
  if (!sh) sh = ss.insertSheet(SHEET_LOG);

  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, 4).setValues([["ts", "level", "msg", "meta"]]);
  } else {
    const h = sh.getRange(1, 1, 1, 4).getValues()[0].map(String);
    if (h[0] !== "ts" || h[1] !== "level" || h[2] !== "msg" || h[3] !== "meta") {
      sh.getRange(1, 1, 1, 4).setValues([["ts", "level", "msg", "meta"]]);
    }
  }

  const buffer = [];

  function safeCellText_(s) {
    const txt = String(s == null ? "" : s);
    return /^[=+\-@]/.test(txt) ? "'" + txt : txt;
  }

  function write(level, msg, meta) {
    const ts = Utilities.formatDate(new Date(), "Europe/Berlin", "dd.MM.yyyy HH:mm");
    const safeMsg = safeCellText_(msg);
    const safeMeta = meta ? safeCellText_(JSON.stringify(meta).slice(0, 45000)) : "";
    buffer.push([ts, level, safeMsg, safeMeta]);
    if (buffer.length >= 200) flush();
  }

  function flush() {
    if (!buffer.length) return;
    const startRow = sh.getLastRow() + 1;
    sh.getRange(startRow, 1, buffer.length, 4).setValues(buffer);
    buffer.length = 0;
  }

  return {
    info: function(m, meta) { write("INFO", m, meta); },
    warn: function(m, meta) { write("WARN", m, meta); },
    error: function(m, meta) { write("ERROR", m, meta); },
    flush: flush
  };
}

/* =========================
   TABLE ABSTRACTION
   ========================= */
function readTable_(sheet, requiredColCandidates, log) {
  const lastRow = Math.max(1, sheet.getLastRow());
  const lastCol = Math.max(1, sheet.getLastColumn());
  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();

  const headers = values[0].map(function(v) { return String(v == null ? "" : v); });
  const headerNorm = headers.map(normHeader_);
  const rows = values.slice(1);
  const touchedCols = new Set();
  const appendRows = [];

  function findCol(candidates) {
    const idx = findHeaderIndex_(headerNorm, candidates);
    if (idx < 0) throw new Error("Missing required column in " + sheet.getName() + ": " + JSON.stringify(candidates));
    return idx;
  }

  function findColOptional(candidates) {
    return findHeaderIndex_(headerNorm, candidates);
  }

  function set(rowIdx, colIdx, value) {
    const oldVal = rows[rowIdx][colIdx];
    if (!sameCellValue_(oldVal, value)) {
      rows[rowIdx][colIdx] = value;
      touchedCols.add(colIdx);
    }
  }

  function writeTouchedColumnsBack(log) {
    if (!touchedCols.size) return;
    const touched = Array.from(touchedCols).sort(function(a, b) { return a - b; });

    const groups = [];
    let start = null;
    let prev = null;
    for (const c of touched) {
      if (start == null) {
        start = c;
        prev = c;
      } else if (c === prev + 1) {
        prev = c;
      } else {
        groups.push([start, prev]);
        start = c;
        prev = c;
      }
    }
    if (start != null) groups.push([start, prev]);

    for (const group of groups) {
      const from = group[0];
      const to = group[1];
      const width = to - from + 1;
      const out = rows.map(function(r) { return r.slice(from, to + 1); });
      if (out.length > 0) {
        sheet.getRange(2, from + 1, out.length, width).setValues(out);
      }
    }

    log.info("Sheet write: " + sheet.getName() + " touchedCols=" + touched.length);
    touchedCols.clear();
  }

  function appendBufferedRow(row) {
    appendRows.push(row);
  }

  function flushAppends(log) {
    if (!appendRows.length) return;
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, appendRows.length, headers.length).setValues(appendRows);
    for (const r of appendRows) rows.push(r);
    log.info("Sheet append: " + sheet.getName() + " rows=" + appendRows.length);
    appendRows.length = 0;
  }

  return {
    sheet: sheet,
    headers: headers,
    headerNorm: headerNorm,
    rows: rows,
    nRows: rows.length,
    appendRows: appendRows,
    findCol: findCol,
    findColOptional: findColOptional,
    set: set,
    writeTouchedColumnsBack: writeTouchedColumnsBack,
    appendBufferedRow: appendBufferedRow,
    flushAppends: flushAppends
  };
}

/* =========================
   XML HELPERS
   ========================= */
function safeParseXml_(xmlText, log) {
  try {
    return XmlService.parse(xmlText);
  } catch (e) {
    log.error("XML parse failed", { err: String((e && e.message) || e) });
    throw e;
  }
}



/* =========================
   HOUSEKEEPING
   ========================= */
function maybeRunHousekeeping_(ctx, log) {
  try {
    const props = PropertiesService.getScriptProperties();
    const last = Number(props.getProperty("WB_LAST_HOUSEKEEPING_TS") || "0");
    const now = Date.now();
    const dueMs = HOUSEKEEPING_RUN_INTERVAL_HOURS * 60 * 60 * 1000;

    if (last > 0 && (now - last) < dueMs) return;

    cleanupLogSheet_(ctx.ss, log);
    cleanupCacheSheet_(ctx.ss, log);
    props.setProperty("WB_LAST_HOUSEKEEPING_TS", String(now));
    log.info("Housekeeping completed");
  } catch (e) {
    log.warn("Housekeeping skipped", { err: String((e && e.message) || e) });
  }
}

function cleanupLogSheet_(ss, log) {
  const sh = ss.getSheetByName(SHEET_LOG);
  if (!sh) return;

  const lastRow = sh.getLastRow();
  if (lastRow <= HOUSEKEEPING_LOG_MAX_ROWS) return;

  const deleteCount = lastRow - HOUSEKEEPING_LOG_MAX_ROWS;
  if (deleteCount > 0) {
    sh.deleteRows(2, deleteCount);
    log.info("Log cleanup", { deleted_rows: deleteCount });
  }
}

function cleanupCacheSheet_(ss, log) {
  const sh = ss.getSheetByName(SHEET_CACHE);
  if (!sh) return;

  const spec = getCacheSpec_(sh);
  if (!spec) return;

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return;

  const lastCol = sh.getLastColumn();
  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const now = Date.now();
  const maxAgeMs = HOUSEKEEPING_CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  const rowsToDelete = [];
  for (let i = 0; i < values.length; i++) {
    const cell = values[i][spec.idxUpdated];
    const ts = cell instanceof Date ? cell.getTime() : Date.parse(cell);
    if (isFinite(ts) && now - ts > maxAgeMs) rowsToDelete.push(i + 2);
  }

  deleteRowsDescending_(sh, rowsToDelete);

  const afterLastRow = sh.getLastRow();
  if (afterLastRow > HOUSEKEEPING_CACHE_MAX_ROWS) {
    const deleteCount = afterLastRow - HOUSEKEEPING_CACHE_MAX_ROWS;
    if (deleteCount > 0) sh.deleteRows(2, deleteCount);
  }

  if (rowsToDelete.length) log.info("Cache cleanup", { deleted_rows: rowsToDelete.length });
}

function deleteRowsDescending_(sheet, rowNums) {
  if (!rowNums || !rowNums.length) return;
  rowNums.sort(function(a, b) { return b - a; });

  let runStart = rowNums[0];
  let runLen = 1;

  for (let i = 1; i < rowNums.length; i++) {
    if (rowNums[i] === runStart - runLen) {
      runLen++;
    } else {
      sheet.deleteRows(runStart - runLen + 1, runLen);
      runStart = rowNums[i];
      runLen = 1;
    }
  }
  sheet.deleteRows(runStart - runLen + 1, runLen);
}

/* =========================
   UTILS
   ========================= */
function mustSheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error("Missing sheet: " + name);
  return sh;
}

function mustCols_(table, candidatesList, label) {
  for (const cands of candidatesList) {
    if (table.findColOptional(cands) < 0) {
      throw new Error("Missing required column in " + label + ": " + JSON.stringify(cands));
    }
  }
}

function findHeaderIndex_(headerNorm, candidates) {
  const cands = candidates.map(normHeader_);
  for (let i = 0; i < headerNorm.length; i++) {
    if (cands.indexOf(headerNorm[i]) >= 0) return i;
  }
  return -1;
}

function normHeader_(v) {
  return String(v == null ? "" : v)
    .toLowerCase()
    .trim()
    .replace(/[ä]/g, "ae")
    .replace(/[ö]/g, "oe")
    .replace(/[ü]/g, "ue")
    .replace(/[ß]/g, "ss")
    .replace(/[^a-z0-9]+/g, "");
}

function normText_(v) {
  return String(v == null ? "" : v)
    .toLowerCase()
    .trim()
    .replace(/[ä]/g, "ae")
    .replace(/[ö]/g, "oe")
    .replace(/[ü]/g, "ue")
    .replace(/[ß]/g, "ss")
    .replace(/["'`´]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function str_(v) {
  return String(v == null ? "" : v).trim();
}

function normalizeWhitespace_(txt) {
  return String(txt == null ? "" : txt)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeText_(txt) {
  let s = normalizeWhitespace_(txt)
    .replace(/\u00A0/g, " ")
    .replace(/â_x00[0-9A-Fa-f]{2}__/g, " ")
    .replace(/_x00[0-9A-Fa-f]{2}_/g, " ")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\(\s*\)/g, "")
    .replace(/\b(undefined|null|nan)\b/ig, "")
    .replace(/\s*[-]{2,}\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();

  s = s
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([.?!])\1+/g, "$1")
    .replace(/\s*\.\s*\.\s*/g, ". ")
    .trim();

  const umlautWordMap = {
    "fuer": "für",
    "koennte": "könnte",
    "koennten": "könnten",
    "waere": "wäre",
    "spaeter": "später",
    "auffaellig": "auffällig",
    "auffaelligen": "auffälligen",
    "auffaelligkeit": "auffälligkeit",
    "unauffaellig": "unauffällig",
    "aktüllen": "aktuellen",
    "aktülen": "aktuellen",
    "aktüle": "aktuelle"
  };

  function applyWordCase_(sourceWord, targetWord) {
    if (/^[A-ZÄÖÜ]+$/.test(sourceWord)) return targetWord.toUpperCase();
    if (/^[A-ZÄÖÜ]/.test(sourceWord)) return targetWord.charAt(0).toUpperCase() + targetWord.slice(1);
    return targetWord;
  }

  s = s.replace(/\b[A-Za-zÄÖÜäöüß]+\b/g, function(word) {
    const lower = word.toLowerCase();
    if (!umlautWordMap[lower]) return word;
    return applyWordCase_(word, umlautWordMap[lower]);
  });

  s = normalizeWhitespace_(s);

  return s;
}

function cleanSentence_(txt) {
  let s = sanitizeText_(txt)
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([.?!])\1+/g, "$1")
    .trim();
  s = s.replace(/^[,.;:!?]+\s*/, "");
  return s;
}

function formatReadableDateTime_(dt) {
  const d = dt instanceof Date ? dt : new Date(dt);
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mi;
}

function isNoPegelStationState_(pegelStatus, pegelStation) {
  const status = str_(pegelStatus).trim().toLowerCase();
  const raw = str_(pegelStation).trim();
  const norm = raw.toLowerCase();
  return status === "no_station" || status === "keine station vorhanden" || !raw || norm === "no_station" || norm === "none" || norm === "null" || norm === "undefined";
}

function formatPegelStationUi_(pegelStatus, pegelStation) {
  const raw = str_(pegelStation).trim();
  if (isNoPegelStationState_(pegelStatus, pegelStation)) {
    return "📏 Kein Pegel verfügbar";
  }
  return raw;
}

function formatPegelValueUi_(waterLevel) {
  const num = toFiniteNumberOrNull_(waterLevel);
  if (num == null) return "—";
  return String(Math.round(num)) + " cm";
}

function formatPegelStatusUi_(pegelStatus, pegelStation, waterLevelTrend) {
  if (isNoPegelStationState_(pegelStatus, pegelStation)) return "";

  const status = str_(pegelStatus).trim().toLowerCase();
  const trendNum = toFiniteNumberOrNull_(waterLevelTrend);
  const trendRaw = str_(waterLevelTrend).trim().toLowerCase();

  if (status === "high") return "🔴 Erhöht";
  if (status === "low") return "🟡 Niedrig";

  if (trendRaw === "rising" || trendRaw === "up" || trendRaw === "steigend" || trendRaw === "increasing") return "🟡 Steigend";
  if (trendRaw === "falling" || trendRaw === "down" || trendRaw === "fallend" || trendRaw === "decreasing") return "🔵 Fallend";
  if (trendRaw === "stable" || trendRaw === "gleichbleibend" || trendRaw === "konstant") return "🟢 Stabil";

  if (trendNum != null) {
    if (trendNum > 0) return "🟡 Steigend";
    if (trendNum < 0) return "🔵 Fallend";
    if (trendNum === 0) return "🟢 Stabil";
  }

  if (status === "ok") return "🟢 Stabil";
  return "⚪ Keine Einordnung";
}

function joinSentencesClean_(parts) {
  if (!Array.isArray(parts) || parts.length === 0) return "";
  return parts.join(". ") + ".";
}

function buildFriendlyBoatReason_(reason) {
  const raw = cleanSentence_(reason);
  const norm = normText_(raw);
  if (!norm) return "";

  if (norm.indexOf("elwis") >= 0 && norm.indexOf("eingeschraenkt") >= 0) {
    return "Amtliche Hinweise schraenken die Fahrt hier aktuell ein";
  }
  if (norm.indexOf("elwis") >= 0 && norm.indexOf("warnung") >= 0) {
    return "Amtliche Hinweise sprechen aktuell fuer besondere Aufmerksamkeit";
  }
  if (norm.indexOf("gewitterrisiko") >= 0) {
    return "Erhoehtes Gewitterrisiko beeintraechtigt die Lage auf dem Wasser";
  }
  if (norm.indexOf("boeen") >= 0 || norm.indexOf("wind > 25") >= 0) {
    return "Wind und Boeen koennen die Fahrt spuerbar unruhiger machen";
  }
  if (norm.indexOf("sicht < 1 km") >= 0 || norm.indexOf("sicht schlecht") >= 0) {
    return "Die Sicht ist derzeit deutlich eingeschraenkt";
  }
  if (norm.indexOf("regen intensiv") >= 0) {
    return "Kraeftiger Regen kann die Bedingungen zusaetzlich erschweren";
  }

  return raw;
}

function buildFriendlyForecastText_(txt) {
  return cleanSentence_(txt);
}

function buildFriendlyNoticeText_(parts) {
  return joinSentencesClean_(parts).replace(/\s+/g, " ").trim();
}

function buildFinalNoteText_(notice) {
  const parts = [];
  const seen = new Set();

  function pushUnique_(txt) {
    const clean = sanitizeText_(txt);
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    parts.push(clean.replace(/[.?!;:,]+$/g, ""));
  }

  pushUnique_(notice && notice.note_recommendation);
  pushUnique_(notice && notice.note_forecast);
  pushUnique_(notice && notice.note_alert);

  return parts.length ? (parts.join(". ") + ".") : "";
}

function sanitizeDataSourceLabel_(txt) {
  const s = sanitizeText_(txt)
    .replace(/\|\s*\|+/g, " | ")
    .replace(/\s*\|\s*/g, " | ");
  return s
    .split("|")
    .map(function(p) { return sanitizeText_(p); })
    .filter(function(p) { return p.length > 0; })
    .join(" | ");
}

function slugify_(v) {
  return normText_(v).replace(/\s+/g, "_");
}

function blankRow_(width) {
  return Array.from({ length: width }, function() { return ""; });
}

function rowToObj_(header, row) {
  const obj = {};
  for (let i = 0; i < header.length; i++) obj[header[i]] = row[i];
  return obj;
}

function pickFirst_(obj, keys) {
  for (const k of keys) {
    const nk = normHeader_(k);
    for (const realKey in obj) {
      if (normHeader_(realKey) === nk) {
        const val = obj[realKey];
        if (val !== "" && val != null) return val;
      }
    }
  }
  return "";
}

function setIfColExists_(table, rowIdx, colCandidates, value) {
  const col = table.findColOptional(colCandidates);
  if (col < 0) return;
  if (value === "" || value == null) return;
  table.set(rowIdx, col, value);
}

function setValueByCandidates_(table, row, colCandidates, value) {
  const col = table.findColOptional(colCandidates);
  if (col < 0) return;
  if (value === "" || value == null) return;
  row[col] = value;
}

function copyFieldIfExists_(fromTable, fromRow, toTable, toRowIdx, fromCandidates, toCandidates) {
  const fromCol = fromTable.findColOptional(fromCandidates);
  const toCol = toTable.findColOptional(toCandidates || fromCandidates);
  if (fromCol < 0 || toCol < 0) return;
  const val = fromRow[fromCol];
  if (val === "" || val == null) return;
  toTable.set(toRowIdx, toCol, val);
}

function sameCellValue_(a, b) {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return String(a == null ? "" : a) === String(b == null ? "" : b);
}

function toNumberMaybe_(v) {
  if (v == null || v === "") return "";
  if (typeof v === "number") return v;
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);
  return isFinite(n) ? n : String(v);
}

function parseDateTimeMaybe_(v) {
  if (!v) return "";
  if (v instanceof Date) return v;

  const s = String(v).trim();
  if (!s) return "";

  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;

  const m1 = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m1) {
    return new Date(
      Number(m1[3]),
      Number(m1[2]) - 1,
      Number(m1[1]),
      Number(m1[4] || 0),
      Number(m1[5] || 0),
      Number(m1[6] || 0)
    );
  }

  return s;
}

function absolutizeUrlMaybe_(url, base) {
  const s = str_(url);
  if (!s) return url;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.charAt(0) === "/") return base + s;
  return url;
}

function extractFirstUrlMatching_(txt, regex) {
  const m = String(txt || "").match(regex);
  return m ? m[0] : "";
}

function extractAbsoluteOrRelativeLink_(html, patternRegex, baseUrl) {
  const s = String(html || "");

  const hrefMatches = s.match(/href\s*=\s*["']([^"']+)["']/gi) || [];
  for (const raw of hrefMatches) {
    const m = raw.match(/href\s*=\s*["']([^"']+)["']/i);
    if (!m || !m[1]) continue;
    const href = m[1].trim();
    if (patternRegex.test(href)) return absolutizeUrlMaybe_(href, baseUrl);
  }

  const abs = extractFirstUrlMatching_(s, /https?:\/\/[^"'\s>]+/i);
  if (abs && patternRegex.test(abs)) return abs;

  return "";
}

function buildCompositeName_(gewaesser, ort) {
  const g = str_(gewaesser);
  const o = str_(ort);
  if (g && o) return g + " " + o;
  return g || o || "";
}

function sha1Hex_(text) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_1,
    String(text || ""),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

function csvLooksUsable_(txt) {
  const s = String(txt || "").trim();
  if (!s || s.length < 10) return false;
  if (/<html/i.test(s) || /<!doctype/i.test(s)) return false;
  const lines = s.split(/\r?\n/);
  if (lines.length < 2) return false;
  if (s.indexOf(";") < 0 && s.indexOf(",") < 0) return false;
  return true;
}

/* =========================
   SCHEMA & FORMULA AUDIT
   ========================= */
function auditSheetStructure_V670() {
  const ss = SpreadsheetApp.getActive();
  const sheetNames = ["Waters", "WaterReadings", "Master"];
  const outName = "_SchemaAudit";

  let out = ss.getSheetByName(outName);
  if (!out) {
    out = ss.insertSheet(outName);
  } else {
    out.clear();
  }

  const header = [
    "sheet",
    "colIndex",
    "colName",
    "formula",
    "sampleValue",
    "classification"
  ];
  out.getRange(1, 1, 1, header.length).setValues([header]);

  const rows = [];
  for (const name of sheetNames) {
    const sh = ss.getSheetByName(name);
    if (!sh) continue;

    const lastCol = sh.getLastColumn();
    if (lastCol < 1) continue;

    const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    const samples = sh.getRange(2, 1, 1, lastCol);
    const sampleValues = samples.getValues()[0];
    const sampleFormulas = samples.getFormulas()[0];

    for (let c = 0; c < lastCol; c++) {
      const colName = String(headers[c] || "").trim();
      const formula = String(sampleFormulas[c] || "").trim();
      const value = sampleValues[c];
      const classification = classifyAuditField_(colName, formula, value);

      rows.push([name, c + 1, colName, formula, value, classification]);
    }
  }

  if (rows.length) {
    out.getRange(2, 1, rows.length, header.length).setValues(rows);
  }

  const log = makeLogger_(ss);
  log.info("Schema audit written", { sheet: outName, rows: rows.length });
  log.flush();
  return { sheet: outName, rows: rows.length };
}

function classifyAuditField_(colName, formula, sampleValue) {
  const name = String(colName || "").toLowerCase();
  const hasFormula = typeof formula === "string" && formula.trim().indexOf("=") === 0;

  if (name.match(/url|link|map|image/)) return "LINK_FIELD";
  if (name.match(/id$|_id$|nr$|nummer|key/)) return "META_FIELD";
  if (name.match(/note|hinweis|description|beschreib|kommentar/)) return "USER_TEXT";
  if (name.match(/icon|color|pill|badge|badge_|badge/)) return "UI_FIELD";
  if (name.match(/(wind|böen|boeen|gust|strom|flow|pegel|level|wasserstand|wave)/)) return "RAW_DATA";
  if (name.match(/(status|smiley|qualit|bewertung|rating|warn|alert)/)) return hasFormula ? "CALCULATED_STATUS" : "IMPORTED_STATUS";
  if (name.match(/tempe?ratur|ph|ecoli|ente|algen|sicht|clarity/)) return "RAW_DATA";
  if (hasFormula) return "CALCULATED_STATUS";
  if (sampleValue !== null && sampleValue !== "" && typeof sampleValue === "string") return "RAW_DATA";
  return "UNKNOWN";
}

function isBrandenburgBathingXml_(txt) {
  const s = String(txt || "");
  if (!s || s.length < 20) return false;
  if (!/^\s*</.test(s)) return false;
  if (/<gmd:MD_Metadata/i.test(s)) return false;
  if (/<Badestellen/i.test(s)) return true;
  if (/<luis\.dbo\.badestellen/i.test(s)) return true;
  if (/Bnr=/i.test(s) && /Badegewaesser=/i.test(s)) return true;
  return false;
}

/* =========================
   EXTRA HELPERS STEROID
   ========================= */
function recordIsStrongEnoughForOnboarding_(rec) {
  const checks = [
    pickFirst_(rec, ["bb_nr", "bbnr", "bnr", "nr", "id", "nummer"]),
    pickFirst_(rec, ["badestelle", "ort", "name"]),
    pickFirst_(rec, ["gewaesser", "badegewaesser", "gewasser"]),
    pickFirst_(rec, ["latitude", "lat"]),
    pickFirst_(rec, ["longitude", "lon", "lng"]),
    pickFirst_(rec, ["detail_url", "url", "link"])
  ].filter(function(v) { return str_(v) !== ""; });

  return checks.length >= ONBOARDING_MIN_REQUIRED_FIELDS;
}

function findBestWatersTemplateRow_(waters, preferredSource) {
  const sourceCol = waters.findColOptional(["source"]);
  const waterIdCol = waters.findColOptional(["water_id", "waterid"]);
  if (sourceCol < 0) return null;

  for (let i = 0; i < waters.rows.length; i++) {
    const src = str_(waters.rows[i][sourceCol]);
    const wid = waterIdCol >= 0 ? str_(waters.rows[i][waterIdCol]) : "";
    if (wid && normText_(src) === normText_(preferredSource)) {
      return waters.rows[i].slice();
    }
  }
  return null;
}

function buildAutonomousWaterId_(bbNr, rec) {
  const cleanBb = normalizeBbNr_(bbNr);
  if (!cleanBb) return "";
  const slug = slugify_(pickFirst_(rec, ["badestelle", "ort", "name"])).slice(0, 40);
  return slug ? (AUTONOMOUS_WATER_ID_PREFIX + cleanBb + "_" + slug) : (AUTONOMOUS_WATER_ID_PREFIX + cleanBb);
}

function buildDefaultDescription_(name, source, bbNr) {
  const parts = [];
  if (name) parts.push(name + " ist eine offizielle " + (source === "Brandenburg" ? "Brandenburger" : "") + " Badestelle.");
  parts.push("Saisonale Wasserprüfungen und Hinweise werden laufend gepflegt.");
  if (bbNr) parts.push("Referenz: BB-Nr. " + bbNr + ".");
  return parts.join(" ");
}

function buildMapLinkFromLatLon_(lat, lon, label) {
  const nLat = toNumberMaybe_(lat);
  const nLon = toNumberMaybe_(lon);
  if (nLat === "" || nLon === "") {
    const q = str_(label);
    return q ? ("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q)) : "";
  }
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(String(nLat) + "," + String(nLon));
}

/* =========================
   BOAT CONDITIONS PHASE A
   PEGELONLINE + OPEN-METEO + ELWIS
   DRY RUN / DIAGNOSIS ONLY
   ========================= */

let _PEGEL_STATIONS = null;
const _PEGEL_STATION_BY_KEY = {};
const _PEGEL_CACHE = {};
const _METEO_CACHE = {};
const _ELWIS_CACHE = {};
const _HYDRO_CACHE = {};

function buildLocationCacheKey_(lat, lon, decimals) {
  const nLat = toNumberMaybe_(lat);
  const nLon = toNumberMaybe_(lon);
  if (nLat === "" || nLon === "") return "";

  const latNum = Number(nLat);
  const lonNum = Number(nLon);
  if (!isFinite(latNum) || !isFinite(lonNum)) return "";

  const d = (decimals == null) ? 3 : decimals;
  return latNum.toFixed(d) + "|" + lonNum.toFixed(d);
}

function toFiniteNumberOrNull_(v) {
  if (v == null) return null;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s || s.toUpperCase() === "MM") return null;
  }
  const n = Number(String(v).replace(",", ".").trim());
  return isFinite(n) ? n : null;
}

function formatNoaaDateUtc_(dateObj) {
  return Utilities.formatDate(dateObj, "UTC", "yyyyMMdd HH:mm");
}

function fetchOpenMeteoMarineFallback_(lat, lon, log) {
  if (lat == null || lon == null) return null;
  let cacheKey = "";
  try {
    const nLat = toFiniteNumberOrNull_(lat);
    const nLon = toFiniteNumberOrNull_(lon);
    if (nLat == null || nLon == null) return null;

    cacheKey = "marine|" + buildLocationCacheKey_(nLat, nLon, 3);
    if (!cacheKey) return null;
    if (_HYDRO_CACHE[cacheKey] !== undefined) return _HYDRO_CACHE[cacheKey];

    const url = "https://marine-api.open-meteo.com/v1/marine?" +
      "latitude=" + nLat +
      "&longitude=" + nLon +
      "&current=wave_height,ocean_current_velocity" +
      "&timezone=UTC";

    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      method: "get",
      headers: { "User-Agent": "WaveBite-BoatEngine/6.7.0" }
    });

    if (resp.getResponseCode() !== 200) {
      _HYDRO_CACHE[cacheKey] = null;
      return null;
    }

    const data = JSON.parse(resp.getContentText("UTF-8"));
    const curr = data && data.current ? data.current : null;
    const result = {
      current_speed_mps: curr ? toFiniteNumberOrNull_(curr.ocean_current_velocity) : null,
      wave_height_m: curr ? toFiniteNumberOrNull_(curr.wave_height) : null,
      timestamp: curr && curr.time ? String(curr.time) : ""
    };

    _HYDRO_CACHE[cacheKey] = result;
    return result;
  } catch (e) {
    log.warn("OPEN-METEO marine fallback error", { err: String(e) });
    if (cacheKey) _HYDRO_CACHE[cacheKey] = null;
    return null;
  }
}

function fetchNoaaCoopsCurrents_(stationId, binId, log) {
  const station = str_(stationId);
  const bin = str_(binId);
  if (!station || !bin) {
    return { current_speed_mps: null, source: "coops_currents_missing_station" };
  }

  const cacheKey = "coops|" + station + "|" + bin;
  if (_HYDRO_CACHE[cacheKey] !== undefined) return _HYDRO_CACHE[cacheKey];

  try {
    const now = new Date();
    const begin = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const url = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?" +
      "product=currents" +
      "&application=WaveBite" +
      "&begin_date=" + encodeURIComponent(formatNoaaDateUtc_(begin)) +
      "&end_date=" + encodeURIComponent(formatNoaaDateUtc_(now)) +
      "&station=" + encodeURIComponent(station) +
      "&bin=" + encodeURIComponent(bin) +
      "&units=metric&time_zone=gmt&format=json";

    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      method: "get",
      headers: { "User-Agent": "WaveBite-BoatEngine/6.7.0" }
    });

    if (resp.getResponseCode() !== 200) {
      const miss = { current_speed_mps: null, source: "coops_currents_http_" + resp.getResponseCode() };
      _HYDRO_CACHE[cacheKey] = miss;
      return miss;
    }

    const data = JSON.parse(resp.getContentText("UTF-8"));
    const arr = data && Array.isArray(data.data) ? data.data : [];
    let cms = null;
    for (let i = arr.length - 1; i >= 0; i--) {
      const item = arr[i];
      if (!item || typeof item !== "object") continue;
      const sVal = toFiniteNumberOrNull_(item.s);
      if (sVal == null) continue;
      cms = sVal;
      break;
    }

    if (cms == null) {
      const missData = { current_speed_mps: null, source: "coops_currents_no_data" };
      _HYDRO_CACHE[cacheKey] = missData;
      return missData;
    }

    const result = {
      // NOAA currents with units=metric are in cm/s; normalize to m/s.
      current_speed_mps: Number((cms / 100).toFixed(3)),
      source: "coops_currents"
    };
    _HYDRO_CACHE[cacheKey] = result;
    return result;
  } catch (e) {
    log.warn("NOAA CO-OPS currents error", { station: station, bin: bin, err: String(e) });
    const errRes = { current_speed_mps: null, source: "coops_currents_error" };
    _HYDRO_CACHE[cacheKey] = errRes;
    return errRes;
  }
}

function fetchNdbcWaveHeight_(stationId, log) {
  const station = str_(stationId).toUpperCase();
  if (!station) {
    return { wave_height_m: null, source: "ndbc_wvht_missing_station" };
  }

  const cacheKey = "ndbc|" + station;
  if (_HYDRO_CACHE[cacheKey] !== undefined) return _HYDRO_CACHE[cacheKey];

  try {
    const url = "https://www.ndbc.noaa.gov/data/realtime2/" + encodeURIComponent(station) + ".txt";
    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      method: "get",
      headers: { "User-Agent": "WaveBite-BoatEngine/6.7.0" }
    });

    if (resp.getResponseCode() !== 200) {
      const miss = { wave_height_m: null, source: "ndbc_wvht_http_" + resp.getResponseCode() };
      _HYDRO_CACHE[cacheKey] = miss;
      return miss;
    }

    const txt = resp.getContentText("UTF-8");
    const lines = String(txt || "").split(/\r?\n/).filter(function(line) { return str_(line) !== ""; });
    if (lines.length < 3) {
      const missFmt = { wave_height_m: null, source: "ndbc_wvht_no_data" };
      _HYDRO_CACHE[cacheKey] = missFmt;
      return missFmt;
    }

    const headers = lines[0].trim().split(/\s+/);
    const idxWVHT = headers.indexOf("WVHT");
    if (idxWVHT < 0) {
      const missCol = { wave_height_m: null, source: "ndbc_wvht_no_column" };
      _HYDRO_CACHE[cacheKey] = missCol;
      return missCol;
    }

    let waveHeight = null;
    for (let i = 2; i < lines.length; i++) {
      const cols = lines[i].trim().split(/\s+/);
      if (idxWVHT >= cols.length) continue;
      waveHeight = toFiniteNumberOrNull_(cols[idxWVHT]);
      if (waveHeight != null) break;
    }

    if (waveHeight == null) {
      const missData = { wave_height_m: null, source: "ndbc_wvht_no_data" };
      _HYDRO_CACHE[cacheKey] = missData;
      return missData;
    }

    const result = { wave_height_m: Number(waveHeight.toFixed(2)), source: "ndbc_wvht" };
    _HYDRO_CACHE[cacheKey] = result;
    return result;
  } catch (e) {
    log.warn("NDBC WVHT error", { station: station, err: String(e) });
    const errRes = { wave_height_m: null, source: "ndbc_wvht_error" };
    _HYDRO_CACHE[cacheKey] = errRes;
    return errRes;
  }
}

function fetchHydroData_(lat, lon, coopsStationId, coopsBinId, ndbcStationId, log) {
  const nLat = toFiniteNumberOrNull_(lat);
  const nLon = toFiniteNumberOrNull_(lon);
  if (nLat == null || nLon == null) {
    return {
      current_speed: null,
      current_speed_source: "invalid_coords",
      wave_height: null,
      wave_height_source: "invalid_coords"
    };
  }

  // Skip NOAA + Open-Meteo Marine for inland European coordinates: NOAA stations
  // are USA-only (Tides+NDBC return wrong-region or 404), and Open-Meteo Marine
  // returns null wave/ocean_current for inland waters. Wave Bite spots are
  // Berlin/Brandenburg lakes/rivers — wave_height defaults to 0 (calm inland),
  // current_speed to null (Pegelonline trends would be the proper signal here).
  const isInlandEU = nLat >= 47.0 && nLat <= 56.0 && nLon >= 5.0 && nLon <= 19.0;
  const explicitNoaa = !!(coopsStationId || ndbcStationId);
  if (isInlandEU && !explicitNoaa) {
    return {
      current_speed: null,
      current_speed_source: "inland_skip_no_noaa_no_marine",
      wave_height: 0,
      wave_height_source: "inland_calm_assumed"
    };
  }

  const coops = fetchNoaaCoopsCurrents_(coopsStationId, coopsBinId, log);
  const ndbc = fetchNdbcWaveHeight_(ndbcStationId, log);

  let marine = null;
  function getMarine_() {
    if (marine === null) marine = fetchOpenMeteoMarineFallback_(nLat, nLon, log) || {};
    return marine;
  }

  let currentSpeed = toFiniteNumberOrNull_(coops && coops.current_speed_mps);
  let currentSpeedSource = coops && coops.source ? coops.source : "coops_currents_no_data";
  if (currentSpeed == null) {
    const m = getMarine_();
    currentSpeed = toFiniteNumberOrNull_(m.current_speed_mps);
    currentSpeedSource = currentSpeed != null ? "openmeteo_marine_fallback" : currentSpeedSource;
  }

  let waveHeight = toFiniteNumberOrNull_(ndbc && ndbc.wave_height_m);
  let waveHeightSource = ndbc && ndbc.source ? ndbc.source : "ndbc_wvht_no_data";
  if (waveHeight == null) {
    const m2 = getMarine_();
    waveHeight = toFiniteNumberOrNull_(m2.wave_height_m);
    waveHeightSource = waveHeight != null ? "openmeteo_marine_fallback" : waveHeightSource;
  }

  return {
    current_speed: currentSpeed,
    current_speed_source: currentSpeed != null ? (currentSpeedSource === "coops_currents" ? "coops_currents" : "openmeteo_marine_fallback") : currentSpeedSource,
    wave_height: waveHeight,
    wave_height_source: waveHeight != null ? (waveHeightSource === "ndbc_wvht" ? "ndbc_wvht" : "openmeteo_marine_fallback") : waveHeightSource
  };
}

function computeWaterLevelTrendFromHistory_(historyItems, explicitNowValue, explicitNowTimestamp) {
  if (!Array.isArray(historyItems) || !historyItems.length) {
    return { value: null, source: "insufficient_history", classification: null };
  }

  const points = [];
  for (let i = 0; i < historyItems.length; i++) {
    const item = historyItems[i];
    if (!item || typeof item !== "object") continue;
    const value = toFiniteNumberOrNull_(item.value);
    if (value == null) continue;
    const tsStr = (item.timestamp != null && item.timestamp !== "") ? String(item.timestamp) : "";
    const ts = tsStr ? Date.parse(tsStr) : NaN;
    if (!isFinite(ts)) continue;
    points.push({ ts: ts, value: value });
  }

  if (!points.length) {
    return { value: null, source: "insufficient_history", classification: null };
  }

  points.sort(function(a, b) { return b.ts - a.ts; });

  const explicitNowTs = explicitNowTimestamp ? Date.parse(String(explicitNowTimestamp)) : NaN;
  const explicitNowVal = toFiniteNumberOrNull_(explicitNowValue);
  const nowPoint = (isFinite(explicitNowTs) && explicitNowVal != null)
    ? { ts: explicitNowTs, value: explicitNowVal }
    : points[0];

  const candidates = [];
  for (let j = 0; j < points.length; j++) {
    const p = points[j];
    const ageMin = (nowPoint.ts - p.ts) / 60000;
    if (ageMin >= 30 && ageMin <= 120) {
      candidates.push({ p: p, ageMin: ageMin });
    }
  }

  if (!candidates.length) {
    return { value: null, source: "insufficient_history", classification: null };
  }

  candidates.sort(function(a, b) {
    const da = Math.abs(a.ageMin - 60);
    const db = Math.abs(b.ageMin - 60);
    if (da !== db) return da - db;
    return b.ageMin - a.ageMin;
  });

  const ref = candidates[0];
  let delta = nowPoint.value - ref.p.value;
  if (Math.abs(delta) < 0.5) delta = 0;
  delta = Number(delta.toFixed(1));

  let cls = "stable";
  if (delta > 0) cls = "rising";
  if (delta < 0) cls = "falling";

  return {
    value: delta,
    source: Math.abs(ref.ageMin - 60) <= 15 ? "coops_water_level_delta_60m" : "coops_water_level_delta_window",
    classification: cls
  };
}

function fetchPegelOnline_(lat, lon, log) {
  if (lat == null || lon == null) return null;
  let cacheKey = "";
  try {
    const nLat = toNumberMaybe_(lat);
    const nLon = toNumberMaybe_(lon);
    if (nLat === "" || nLon === "") return null;

    const latNum = Number(nLat);
    const lonNum = Number(nLon);
    if (!isFinite(latNum) || !isFinite(lonNum)) return null;

    cacheKey = buildLocationCacheKey_(latNum, lonNum, 3);
    if (!cacheKey) return null;
    if (_PEGEL_CACHE[cacheKey] !== undefined) {
      return _PEGEL_CACHE[cacheKey];
    }

    function buildPegelResult_(status, stationName, distKm, waterLevel, trendValue, ts, trendSource, trendClass) {
      return {
        station_name: stationName || "",
        water_level: waterLevel != null ? waterLevel : null,
        water_level_trend: trendValue != null && trendValue !== "" ? trendValue : null,
        water_level_trend_source: trendSource || "",
        water_level_trend_classification: trendClass || "",
        timestamp: ts || "",
        pegel_found: status === "ok" || status === "no_measurement",
        pegel_station_distance_km: distKm != null ? distKm : null,
        pegel_status: status
      };
    }

    if (_PEGEL_STATIONS === null) {
      const url = "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json";
      const resp = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        method: "get",
        headers: { "User-Agent": "WaveBite-BoatEngine/6.7.0" }
      });

      if (resp.getResponseCode() !== 200) {
        log.warn("PEGELONLINE stations fetch failed", { code: resp.getResponseCode() });
        _PEGEL_STATIONS = [];
        const stationErr = buildPegelResult_("error", "", null, null, null, "");
        _PEGEL_CACHE[cacheKey] = stationErr;
        return stationErr;
      }

      const txt = resp.getContentText("UTF-8");
      _PEGEL_STATIONS = JSON.parse(txt);
      if (!Array.isArray(_PEGEL_STATIONS)) {
        _PEGEL_STATIONS = [];
        const parseErr = buildPegelResult_("error", "", null, null, null, "");
        _PEGEL_CACHE[cacheKey] = parseErr;
        return parseErr;
      }
    }

    if (!_PEGEL_STATIONS.length) {
      const noStationFromEmptyList = buildPegelResult_("Keine Station vorhanden", "", null, null, null, "");
      _PEGEL_CACHE[cacheKey] = noStationFromEmptyList;
      return noStationFromEmptyList;
    }

    const MAX_DISTANCE_KM = 50;
    let stationMatch = _PEGEL_STATION_BY_KEY[cacheKey];
    if (stationMatch === undefined) {
      let bestStation = null;
      let bestDist = Infinity;

      for (let i = 0; i < _PEGEL_STATIONS.length; i++) {
        const station = _PEGEL_STATIONS[i];
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

      stationMatch = bestStation ? {
        station: bestStation,
        distanceKm: Number(bestDist.toFixed(2))
      } : null;
      _PEGEL_STATION_BY_KEY[cacheKey] = stationMatch;
    }

    const bestStation = stationMatch ? stationMatch.station : null;
    const bestDistKm = stationMatch ? stationMatch.distanceKm : null;

    if (!bestStation) {
      const noStation = buildPegelResult_("Keine Station vorhanden", "", null, null, null, "");
      _PEGEL_CACHE[cacheKey] = noStation;
      return noStation;
    }

    function extractPegelFromPayload_(payload) {
      if (!payload) return { value: null, trend: null, timestamp: "" };

      if (Array.isArray(payload)) {
        let best = null;
        let bestTs = -Infinity;
        for (let i = 0; i < payload.length; i++) {
          const item = payload[i];
          if (!item || typeof item !== "object") continue;
          const vRaw = (item.value != null && item.value !== "") ? Number(item.value) : null;
          if (vRaw == null || !isFinite(vRaw)) continue;
          const tsStr = (item.timestamp != null && item.timestamp !== "") ? String(item.timestamp) : "";
          const tsVal = tsStr ? Date.parse(tsStr) : NaN;
          const score = isFinite(tsVal) ? tsVal : -Infinity;
          if (best === null || score > bestTs) {
            best = item;
            bestTs = score;
          }
        }
        if (!best) return { value: null, trend: null, timestamp: "" };
        return {
          value: Number(best.value),
          trend: (best.trend != null && best.trend !== "") ? best.trend : null,
          timestamp: (best.timestamp != null && best.timestamp !== "") ? String(best.timestamp) : ""
        };
      }

      const latest = (payload.latestMeasurement && typeof payload.latestMeasurement === "object") ? payload.latestMeasurement : null;
      const m0 = (Array.isArray(payload.measurements) && payload.measurements.length > 0) ? payload.measurements : null;

      let fromArray = { value: null, trend: null, timestamp: "" };
      if (m0) {
        fromArray = extractPegelFromPayload_(m0);
      }

      const vRaw = (payload.value != null && payload.value !== "") ? payload.value :
        (latest && latest.value != null && latest.value !== "") ? latest.value :
        (fromArray.value != null) ? fromArray.value : null;

      const valueNum = (vRaw != null) ? Number(vRaw) : null;
      const value = (valueNum != null && isFinite(valueNum)) ? valueNum : null;

      const trend = (payload.trend != null && payload.trend !== "") ? payload.trend :
        (latest && latest.trend != null && latest.trend !== "") ? latest.trend :
        fromArray.trend;

      const timestamp = (payload.timestamp != null && payload.timestamp !== "") ? String(payload.timestamp) :
        (latest && latest.timestamp != null && latest.timestamp !== "") ? String(latest.timestamp) :
        (fromArray.timestamp || "");

      return { value: value, trend: trend, timestamp: timestamp };
    }

    const stationUrl = "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/" + encodeURIComponent(bestStation.uuid) + "/W/currentmeasurement.json";
    const mResp = UrlFetchApp.fetch(stationUrl, {
      muteHttpExceptions: true,
      method: "get",
      headers: { "User-Agent": "WaveBite-BoatEngine/6.7.0" }
    });

    let measuredValue = null;
    let measuredTrend = null;
    let measuredTs = "";

    if (mResp.getResponseCode() === 200) {
      const mTxt = mResp.getContentText("UTF-8");
      if (mTxt && String(mTxt).trim()) {
        let mData;
        try {
          mData = JSON.parse(mTxt);
        } catch (parseErr) {
          const mParseErr = buildPegelResult_("error", bestStation.longname || bestStation.shortname || "", bestDistKm, null, null, "");
          _PEGEL_CACHE[cacheKey] = mParseErr;
          return mParseErr;
        }

        const parsedCurrent = extractPegelFromPayload_(mData);
        measuredValue = parsedCurrent.value;
        measuredTrend = parsedCurrent.trend;
        measuredTs = parsedCurrent.timestamp;
      }
    }

    let historyItems = null;
    const fallbackUrl = "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/" + encodeURIComponent(bestStation.uuid) + "/W/measurements.json?start=P2D";
    const fResp = UrlFetchApp.fetch(fallbackUrl, {
      muteHttpExceptions: true,
      method: "get",
      headers: { "User-Agent": "WaveBite-BoatEngine/6.7.0" }
    });

    if (fResp.getResponseCode() === 200) {
      const fTxt = fResp.getContentText("UTF-8");
      if (fTxt && String(fTxt).trim()) {
        let fData;
        try {
          fData = JSON.parse(fTxt);
        } catch (fallbackParseErr) {
          const fParseErr = buildPegelResult_("error", bestStation.longname || bestStation.shortname || "", bestDistKm, null, null, "", "", "");
          _PEGEL_CACHE[cacheKey] = fParseErr;
          return fParseErr;
        }

        if (Array.isArray(fData)) historyItems = fData;

        const parsedFallback = extractPegelFromPayload_(fData);
        if (measuredValue == null && parsedFallback.value != null) {
          measuredValue = parsedFallback.value;
          if (!measuredTs) measuredTs = parsedFallback.timestamp;
        }
        if ((measuredTrend == null || measuredTrend === "") && parsedFallback.trend != null && parsedFallback.trend !== "") {
          measuredTrend = parsedFallback.trend;
        }
      }
    }

    let trendSource = "";
    let trendClass = "";
    const trendFromHistory = computeWaterLevelTrendFromHistory_(historyItems, measuredValue, measuredTs);
    if (trendFromHistory.value != null) {
      measuredTrend = trendFromHistory.value;
      trendSource = trendFromHistory.source;
      trendClass = trendFromHistory.classification || "";
    } else if (measuredTrend != null && measuredTrend !== "") {
      trendSource = "coops_payload_trend";
    } else {
      trendSource = "insufficient_history";
    }

    let result;
    if (measuredValue == null) {
      result = buildPegelResult_("no_measurement", bestStation.longname || bestStation.shortname || "", bestDistKm, null, measuredTrend, measuredTs, trendSource, trendClass);
    } else {
      result = buildPegelResult_("ok", bestStation.longname || bestStation.shortname || "", bestDistKm, measuredValue, measuredTrend, measuredTs, trendSource, trendClass);
    }

    _PEGEL_CACHE[cacheKey] = result;
    return result;
  } catch (e) {
    log.warn("PEGELONLINE error", { err: String(e) });
    if (cacheKey) {
      _PEGEL_CACHE[cacheKey] = {
        station_name: "",
        water_level: null,
        water_level_trend: null,
        water_level_trend_source: "",
        water_level_trend_classification: "",
        timestamp: "",
        pegel_found: false,
        pegel_station_distance_km: null,
        pegel_status: "error"
      };
      return _PEGEL_CACHE[cacheKey];
    }
    return null;
  }
}

function fetchOpenMeteo_(lat, lon, log) {
  if (lat == null || lon == null) return null;
  let cacheKey = "";
  try {
    const nLat = toNumberMaybe_(lat);
    const nLon = toNumberMaybe_(lon);
    if (nLat === "" || nLon === "") return null;

    const latNum = Number(nLat);
    const lonNum = Number(nLon);
    if (!isFinite(latNum) || !isFinite(lonNum)) return null;

    cacheKey = buildLocationCacheKey_(latNum, lonNum, 3);
    if (!cacheKey) return null;
    if (_METEO_CACHE[cacheKey] !== undefined) {
      return _METEO_CACHE[cacheKey];
    }

    const url = "https://api.open-meteo.com/v1/forecast?" +
      "latitude=" + latNum +
      "&longitude=" + lonNum +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,windspeed_10m,windgusts_10m,wind_direction_10m,visibility,uv_index" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,sunrise,sunset,daylight_duration,uv_index_max,precipitation_sum,precipitation_probability_max,windspeed_10m_max,windgusts_10m_max" +
      "&forecast_days=2" +
      "&timezone=Europe/Berlin";

    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      method: "get",
      headers: { "User-Agent": "WaveBite-BoatEngine/6.7.0" }
    });

    if (resp.getResponseCode() !== 200) {
      log.warn("OPEN-METEO fetch failed", { code: resp.getResponseCode() });
      _METEO_CACHE[cacheKey] = null;
      return null;
    }

    const data = JSON.parse(resp.getContentText("UTF-8"));
    if (!data.current) {
      _METEO_CACHE[cacheKey] = null;
      return null;
    }

    const curr = data.current;
    const daily = data.daily || {};
    function dayAt_(arr, idx) {
      return Array.isArray(arr) && arr.length > idx ? arr[idx] : null;
    }
    const result = {
      // Existing fields — KEEP for backwards-compat
      temperature_air: toNumberMaybe_(curr.temperature_2m),
      wind_speed: toNumberMaybe_(curr.windspeed_10m),
      wind_gust: toNumberMaybe_(curr.windgusts_10m),
      wind_direction: toNumberMaybe_(curr.wind_direction_10m),
      current_speed: (curr.current_speed != null && curr.current_speed !== "") ? toNumberMaybe_(curr.current_speed) : null,
      wave_height: (curr.wave_height != null && curr.wave_height !== "") ? toNumberMaybe_(curr.wave_height) : null,
      visibility: toNumberMaybe_(curr.visibility),
      rain_intensity: toNumberMaybe_(curr.precipitation),
      weather_code: toNumberMaybe_(curr.weather_code),
      timestamp: curr.time || "",
      // Additive fields — extended weather context for boaters
      humidity: toNumberMaybe_(curr.relative_humidity_2m),
      apparent_temperature: toNumberMaybe_(curr.apparent_temperature),
      is_day: curr.is_day === 1 || curr.is_day === true,
      cloud_cover: toNumberMaybe_(curr.cloud_cover),
      pressure_msl: toNumberMaybe_(curr.pressure_msl),
      surface_pressure: toNumberMaybe_(curr.surface_pressure),
      uv_index: toNumberMaybe_(curr.uv_index),
      rain: toNumberMaybe_(curr.rain),
      // Today
      today_temp_max: toNumberMaybe_(dayAt_(daily.temperature_2m_max, 0)),
      today_temp_min: toNumberMaybe_(dayAt_(daily.temperature_2m_min, 0)),
      today_apparent_max: toNumberMaybe_(dayAt_(daily.apparent_temperature_max, 0)),
      today_uv_max: toNumberMaybe_(dayAt_(daily.uv_index_max, 0)),
      today_precip_sum: toNumberMaybe_(dayAt_(daily.precipitation_sum, 0)),
      today_precip_prob_max: toNumberMaybe_(dayAt_(daily.precipitation_probability_max, 0)),
      today_wind_max: toNumberMaybe_(dayAt_(daily.windspeed_10m_max, 0)),
      today_gust_max: toNumberMaybe_(dayAt_(daily.windgusts_10m_max, 0)),
      today_weather_code: toNumberMaybe_(dayAt_(daily.weather_code, 0)),
      today_sunrise: dayAt_(daily.sunrise, 0) || "",
      today_sunset: dayAt_(daily.sunset, 0) || "",
      today_daylight_seconds: toNumberMaybe_(dayAt_(daily.daylight_duration, 0)),
      // Tomorrow
      tomorrow_temp_max: toNumberMaybe_(dayAt_(daily.temperature_2m_max, 1)),
      tomorrow_temp_min: toNumberMaybe_(dayAt_(daily.temperature_2m_min, 1)),
      tomorrow_precip_sum: toNumberMaybe_(dayAt_(daily.precipitation_sum, 1)),
      tomorrow_precip_prob_max: toNumberMaybe_(dayAt_(daily.precipitation_probability_max, 1)),
      tomorrow_wind_max: toNumberMaybe_(dayAt_(daily.windspeed_10m_max, 1)),
      tomorrow_gust_max: toNumberMaybe_(dayAt_(daily.windgusts_10m_max, 1)),
      tomorrow_weather_code: toNumberMaybe_(dayAt_(daily.weather_code, 1))
    };

    _METEO_CACHE[cacheKey] = result;
    return result;
  } catch (e) {
    log.warn("OPEN-METEO error", { err: String(e) });
    if (cacheKey) _METEO_CACHE[cacheKey] = null;
    return null;
  }
}

function fetchElwis_(lat, lon, spotName, log) {
  if (lat == null || lon == null) return null;
  let cacheKey = "";
  try {
    const nLat = toNumberMaybe_(lat);
    const nLon = toNumberMaybe_(lon);
    if (nLat === "" || nLon === "") return null;

    const latNum = Number(nLat);
    const lonNum = Number(nLon);
    if (!isFinite(latNum) || !isFinite(lonNum)) return null;

    cacheKey = buildLocationCacheKey_(latNum, lonNum, 3);
    if (!cacheKey) return null;
    if (_ELWIS_CACHE[cacheKey] !== undefined) {
      return _ELWIS_CACHE[cacheKey];
    }

    const url = "https://www.elwis.de/?cmd=search-location&q=" + encodeURIComponent(spotName || "badestelle");
    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      method: "get",
      headers: { "User-Agent": "WaveBite-BoatEngine/6.7.0" }
    });

    if (resp.getResponseCode() !== 200) {
      _ELWIS_CACHE[cacheKey] = null;
      return null;
    }

    const html = resp.getContentText("UTF-8");
    if (!html) {
      _ELWIS_CACHE[cacheKey] = null;
      return null;
    }
    const htmlTruncated = html.substring(0, 5000).toLowerCase();

    let hasRestriction = false;
    let hasWarning = false;
    const warningPatterns = ["einschränkung", "eingeschränkt", "behinderung"];
    const contextPatterns = ["wasserstraße", "schifffahrt", "fahrwasser", "kanal", "schleuse"];

    function containsAny_(text, patterns) {
      for (let i = 0; i < patterns.length; i++) {
        if (text.indexOf(patterns[i]) >= 0) return true;
      }
      return false;
    }

    const hasContext = containsAny_(htmlTruncated, contextPatterns);
    const hasExplicitRestriction = (htmlTruncated.indexOf("durchfahrt verboten") >= 0) ||
      (htmlTruncated.indexOf("vollsperrung") >= 0) ||
      (htmlTruncated.indexOf("sperrung") >= 0);
    const hasContextualGesperrt = (htmlTruncated.indexOf("gesperrt") >= 0) && hasContext;

    if (hasExplicitRestriction || hasContextualGesperrt) {
      hasRestriction = true;
    } else {
      let hasWarningPattern = false;
      for (let i = 0; i < warningPatterns.length; i++) {
        if (htmlTruncated.indexOf(warningPatterns[i]) >= 0) {
          hasWarningPattern = true;
          break;
        }
      }
      if (hasWarningPattern && hasContext) {
        hasWarning = true;
      }
    }

    const elwis_status = hasRestriction ? "restricted" : (hasWarning ? "warning" : "checked");
    const elwis_restriction_flag = hasRestriction ? true : false;
    const elwis_warning_flag = hasWarning ? true : false;
    const elwis_reason = hasRestriction
      ? "Durchfahrt/Nutzung eingeschraenkt"
      : (hasWarning ? "Einschraenkung oder Behinderung" : "Keine auffälligen amtlichen Hinweise erkannt");

    const result = {
      elwis_status: elwis_status,
      elwis_restriction_flag: elwis_restriction_flag,
      elwis_warning_flag: elwis_warning_flag,
      elwis_reason: elwis_reason,
      elwis_reference_url: "https://www.elwis.de/"
    };

    _ELWIS_CACHE[cacheKey] = result;
    return result;
  } catch (e) {
    log.warn("ELWIS error", { err: String(e) });
    if (cacheKey) _ELWIS_CACHE[cacheKey] = null;
    return null;
  }
}

function normalizeConditions_(pegelData, meteoData, elwisData, hydroData) {
  const trendRaw = pegelData ? pegelData.water_level_trend : null;
  const trendNum = toFiniteNumberOrNull_(trendRaw);
  const trendClassRaw = pegelData && pegelData.water_level_trend_classification ? String(pegelData.water_level_trend_classification).toLowerCase() : "";
  const conditions = {
    wind_speed: (meteoData && meteoData.wind_speed !== "") ? meteoData.wind_speed : null,
        wind_gust: (meteoData && meteoData.wind_gust !== "") ? meteoData.wind_gust : null,
        wind_direction: (meteoData && meteoData.wind_direction !== "") ? meteoData.wind_direction : null,
        water_level: (pegelData && pegelData.water_level !== "") ? pegelData.water_level : null,
        water_level_trend: trendNum != null ? trendNum : null,
        water_level_trend_source: (pegelData && pegelData.water_level_trend_source) ? pegelData.water_level_trend_source : "insufficient_history",
        water_level_trend_classification: trendClassRaw,
        current_speed: (hydroData && hydroData.current_speed != null) ? hydroData.current_speed : ((meteoData && meteoData.current_speed !== "") ? meteoData.current_speed : null),
        current_speed_source: (hydroData && hydroData.current_speed_source) ? hydroData.current_speed_source : ((meteoData && meteoData.current_speed != null && meteoData.current_speed !== "") ? "openmeteo" : "unavailable"),
        wave_height: (hydroData && hydroData.wave_height != null) ? hydroData.wave_height : ((meteoData && meteoData.wave_height !== "") ? meteoData.wave_height : null),
        wave_height_source: (hydroData && hydroData.wave_height_source) ? hydroData.wave_height_source : ((meteoData && meteoData.wave_height != null && meteoData.wave_height !== "") ? "openmeteo" : "unavailable"),
        temperature_air: (meteoData && meteoData.temperature_air !== "") ? meteoData.temperature_air : null,
        visibility: (meteoData && meteoData.visibility !== "") ? meteoData.visibility : null,
        rain_intensity: (meteoData && meteoData.rain_intensity !== "") ? meteoData.rain_intensity : null,
        weather_code: (meteoData && meteoData.weather_code !== "") ? meteoData.weather_code : null,
        pegel_station: (pegelData && pegelData.station_name) ? pegelData.station_name : "",
        pegel_found: (pegelData && pegelData.pegel_found === true) ? true : false,
        pegel_station_distance_km: (pegelData && pegelData.pegel_station_distance_km != null) ? pegelData.pegel_station_distance_km : null,
        pegel_status: (pegelData && pegelData.pegel_status) ? pegelData.pegel_status : "Keine Station vorhanden",
        pegel_note: "",
        meteo_time: (meteoData && meteoData.timestamp) ? meteoData.timestamp : "",
        pegel_time: (pegelData && pegelData.timestamp) ? pegelData.timestamp : "",
        elwis_status: "unknown",
        elwis_restriction_flag: false,
        elwis_warning_flag: false,
        elwis_reason: ""
      };

      if (elwisData) {
        conditions.elwis_status = elwisData.elwis_status ? elwisData.elwis_status : "unknown";
        conditions.elwis_restriction_flag = elwisData.elwis_restriction_flag ? true : false;
        conditions.elwis_warning_flag = elwisData.elwis_warning_flag ? true : false;
        conditions.elwis_reason = elwisData.elwis_reason ? elwisData.elwis_reason : "";
      }

      if (!conditions.elwis_reason) {
        if (conditions.elwis_status === "restricted") {
          conditions.elwis_reason = "Amtliche Nutzungseinschränkung aktiv";
        } else if (conditions.elwis_status === "warning") {
          conditions.elwis_reason = "Amtlicher Hinweis mit Vorsichtscharakter";
        } else if (conditions.elwis_status === "checked") {
          conditions.elwis_reason = "ELWIS geprueft, aktuell ohne besondere Auffaelligkeit";
        } else {
          conditions.elwis_reason = "ELWIS-Daten aktuell nicht belastbar";
        }
      }

      if (!conditions.water_level_trend_classification && pegelData && typeof pegelData.water_level_trend === "string" && pegelData.water_level_trend) {
        const trend = String(pegelData.water_level_trend).toLowerCase();
        if (trend === "fallend" || trend === "falling" || trend === "down") {
          conditions.water_level_trend_classification = "falling";
        } else if (trend === "steigend" || trend === "rising" || trend === "up") {
          conditions.water_level_trend_classification = "rising";
        } else if (trend === "gleichbleibend" || trend === "stable" || trend === "konstant") {
          conditions.water_level_trend_classification = "stable";
        }
      }

      if (conditions.pegel_status === "Keine Station vorhanden") {
        conditions.pegel_note = "Kein relevanter Pegel verfugbar";
      }

      conditions.storm_risk = deriveStormRisk_(conditions);

      return conditions;
    }

function deriveStormRisk_(conditions) {
  const hasThunderstorm = conditions.weather_code != null &&
    ((Number(conditions.weather_code) >= 80 && Number(conditions.weather_code) <= 82) ||
     (Number(conditions.weather_code) >= 85 && Number(conditions.weather_code) <= 86));

  const hasHighGusts = conditions.wind_gust != null && conditions.wind_gust > 50;

  if (hasThunderstorm || hasHighGusts) {
    return "high";
  }

  if (conditions.wind_gust != null && conditions.wind_gust > 35) {
    return "medium";
  }

  return "low";
}

/**
 * Final guarantee layer — runs ALWAYS immediately before writeback.
 * Ensures no field is ever left null/empty regardless of data source.
 * Fills with conservative model-based defaults and logs every intervention.
 */
function finalizeWaterRow_(conditions, waterId, log) {
  const applied = [];

  // CURRENT SPEED — guarantee a numeric value
  if (conditions.current_speed == null) {
    const trendNum = toFiniteNumberOrNull_(conditions.water_level_trend);
    if (trendNum != null) {
      if (trendNum > 1)       { conditions.current_speed = 0.4; }
      else if (trendNum < -1) { conditions.current_speed = 0.2; }
      else                    { conditions.current_speed = 0.1; }
      conditions.current_speed_source = "final_estimated_trend";
    } else {
      conditions.current_speed = 0.05;
      conditions.current_speed_source = "final_estimated_default";
    }
    applied.push("current_speed=" + conditions.current_speed + " (" + conditions.current_speed_source + ")");
  }

  // WAVE HEIGHT — guarantee a numeric value
  if (conditions.wave_height == null) {
    const windKmh = toFiniteNumberOrNull_(conditions.wind_speed);
    if (windKmh != null) {
      conditions.wave_height = Number(Math.min(windKmh * 0.01, 1.0).toFixed(2));
      conditions.wave_height_source = "final_estimated_wind";
    } else {
      conditions.wave_height = 0.01;
      conditions.wave_height_source = "final_minimum";
    }
    applied.push("wave_height=" + conditions.wave_height + " (" + conditions.wave_height_source + ")");
  }

  // TEMPERATURE AIR
  if (conditions.temperature_air == null) {
    conditions.temperature_air = 15;
    applied.push("temperature_air=15");
  }

  // VISIBILITY
  if (conditions.visibility == null) {
    conditions.visibility = 30000;
    applied.push("visibility=30000");
  }

  // RAIN INTENSITY
  if (conditions.rain_intensity == null) {
    conditions.rain_intensity = 0;
    applied.push("rain_intensity=0");
  }

  // STORM RISK
  if (!conditions.storm_risk) {
    conditions.storm_risk = "low";
    applied.push("storm_risk=low");
  }

  if (applied.length > 0) {
    log.info("FINAL FILL APPLIED", { water_id: waterId, fields: applied.join(", ") });
  }

  return conditions;
}

/**
 * Final output guarantee layer — runs ALWAYS, after all compute steps, before Waters writeback.
 * Operates on the same objects (boatEval, conditions, recAdv) that are written to the sheet.
 * Guarantees: boat_status_reason, elwis_reason, current_speed (+source), wave_height (+source), risk_level.
 */
function finalizeWrittenStatusRow_(boatEval, conditions, recAdv, waterId, log) {
  const applied = [];

  // BOAT STATUS REASON
  if (!boatEval.boat_status_reason) {
    const s = boatEval.boat_status;
    if (s === "ok") {
      boatEval.boat_status_reason = "Die aktuellen Bedingungen wirken ruhig und unauffaellig.";
    } else if (s === "caution") {
      boatEval.boat_status_reason = "Einzelne Faktoren erfordern erhoehte Aufmerksamkeit auf dem Wasser.";
    } else if (s === "bad" || s === "warning" || s === "restricted") {
      boatEval.boat_status_reason = "Die aktuellen Bedingungen erschweren eine sichere Fahrt.";
    } else {
      boatEval.boat_status_reason = "Fuer diesen Spot liegen aktuell nur eingeschraenkte Fahrtdaten vor.";
    }
    applied.push("boat_status_reason");
  }

  // ELWIS REASON
  if (!conditions.elwis_reason) {
    const es = conditions.elwis_status;
    if (es === "checked") {
      conditions.elwis_reason = "ELWIS geprueft, aktuell ohne besondere Auffaelligkeit.";
    } else if (es === "restricted") {
      conditions.elwis_reason = "Fuer diesen Abschnitt gelten aktuell amtliche Einschraenkungen.";
    } else if (es === "warning") {
      conditions.elwis_reason = "Amtliche Hinweise erfordern erhoehte Aufmerksamkeit.";
    } else if (es) {
      conditions.elwis_reason = "ELWIS-Daten wurden geprueft.";
    } else {
      conditions.elwis_reason = "ELWIS-Daten aktuell nicht belastbar.";
    }
    applied.push("elwis_reason");
  }

  // CURRENT SPEED + SOURCE (safety net — finalizeWaterRow_ should already have filled these)
  if (conditions.current_speed == null) {
    conditions.current_speed = 0.05;
    conditions.current_speed_source = "final_estimated_default";
    applied.push("current_speed");
  }
  if (!conditions.current_speed_source) {
    conditions.current_speed_source = "final_estimated_default";
    applied.push("current_speed_source");
  }

  // WAVE HEIGHT + SOURCE (safety net)
  if (conditions.wave_height == null) {
    conditions.wave_height = 0.01;
    conditions.wave_height_source = "final_minimum";
    applied.push("wave_height");
  }
  if (!conditions.wave_height_source) {
    conditions.wave_height_source = "final_minimum";
    applied.push("wave_height_source");
  }

  // RISK LEVEL
  if (!recAdv.risk_level) {
    recAdv.risk_level = "low";
    applied.push("risk_level");
  }

  if (applied.length > 0) {
    log.info("FINAL ROW FILL APPLIED", { water_id: waterId, fields: applied.join(", ") });
  }
}

function computeBoatStatus_(conditions) {
  if (!conditions) {
    return {
      boat_status: "unknown",
      boat_status_label: "Unbekannt",
      boat_status_icon: "⚪",
      boat_status_color: "gray",
      boat_status_reason: "Fuer diesen Spot liegen aktuell zu wenige Fahrtdaten vor"
    };
  }

  const hasWeatherData = (conditions.wind_speed != null || conditions.wind_gust != null ||
                         conditions.visibility != null || conditions.rain_intensity != null ||
                         conditions.weather_code != null || conditions.temperature_air != null);

  const hasPegelData = (conditions.water_level != null || conditions.water_level_trend != null);

  const hasElwisData = (conditions.elwis_restriction_flag || conditions.elwis_warning_flag);

  const hasMinimalData = hasWeatherData || hasPegelData || hasElwisData;

  if (!hasMinimalData) {
    return {
      boat_status: "unknown",
      boat_status_label: "Unbekannt",
      boat_status_icon: "⚪",
      boat_status_color: "gray",
      boat_status_reason: "Fuer diesen Spot liegen aktuell zu wenige Fahrtdaten vor"
    };
  }

  const reasonsPrio = {
    elwis: [],
    storm: [],
    wind: [],
    other: []
  };

  if (conditions.elwis_restriction_flag) {
    reasonsPrio.elwis.push("ELWIS: Durchfahrt eingeschränkt");
    return {
      boat_status: "restricted",
      boat_status_label: "Eingeschränkt",
      boat_status_icon: "🔴",
      boat_status_color: "red",
      boat_status_reason: buildFriendlyBoatReason_(reasonsPrio.elwis[0])
    };
  }

  if (conditions.storm_risk === "high") {
    reasonsPrio.storm.push("Gewitterrisiko");
    return {
      boat_status: "restricted",
      boat_status_label: "Eingeschränkt",
      boat_status_icon: "🔴",
      boat_status_color: "red",
      boat_status_reason: buildFriendlyBoatReason_(reasonsPrio.storm[0])
    };
  }

  if (conditions.wind_gust != null && conditions.wind_gust > 50) {
    reasonsPrio.wind.push("Böen > 50 km/h");
    return {
      boat_status: "restricted",
      boat_status_label: "Eingeschränkt",
      boat_status_icon: "🔴",
      boat_status_color: "red",
      boat_status_reason: buildFriendlyBoatReason_(reasonsPrio.wind[0])
    };
  }

  if (conditions.elwis_warning_flag) {
    reasonsPrio.elwis.push("ELWIS: Warnung");
  }
  if (conditions.storm_risk === "medium") {
    reasonsPrio.storm.push("Mittleres Gewitterrisiko");
  }
  if (conditions.wind_gust != null && conditions.wind_gust > 35) {
    reasonsPrio.wind.push("Böen > 35 km/h");
  }
  if (conditions.wind_speed != null && conditions.wind_speed > 25) {
    reasonsPrio.wind.push("Wind > 25 km/h");
  }
  if (conditions.visibility != null && conditions.visibility < 1000) {
    reasonsPrio.other.push("Sicht < 1 km");
  }
  if (conditions.rain_intensity != null && conditions.rain_intensity > 5) {
    reasonsPrio.other.push("Regen intensiv");
  }

  const allReasons = []
    .concat(reasonsPrio.elwis)
    .concat(reasonsPrio.storm)
    .concat(reasonsPrio.wind)
    .concat(reasonsPrio.other)
    .filter(function(r) { return r && r.length > 0; })
    .slice(0, 2);

  if (allReasons.length > 0) {
    return {
      boat_status: "caution",
      boat_status_label: "Vorsicht",
      boat_status_icon: "🟡",
      boat_status_color: "amber",
      boat_status_reason: buildFriendlyBoatReason_(allReasons.join(", "))
    };
  }

  return {
    boat_status: "ok",
    boat_status_label: "Empfohlen",
    boat_status_icon: "🟢",
    boat_status_color: "green",
    boat_status_reason: "Die aktuellen Daten zeigen keine auffaelligen Einschraenkungen"
  };
}

function buildBoatRecommendation_(conditions, boatEval) {
  const evalObj = boatEval || {};
  const status = evalObj.boat_status || "unknown";

  if (conditions && conditions.elwis_restriction_flag) {
    return {
      recommendation_level: "no_go",
      recommendation_text: "🔴 Fuer diesen Abschnitt gelten aktuell amtliche Einschraenkungen. Bitte vorerst nicht ausfahren.",
      recommendation_short: "Nicht empfohlen",
      recommendation_icon: "🔴",
      recommendation_priority: "high"
    };
  }

  if (status === "restricted") {
    let text = "🔴 Die Lage ist aktuell nicht gut fuer eine entspannte und sichere Fahrt.";
    if (conditions && conditions.wind_gust != null && conditions.wind_gust > 50) {
      text = "🔴 Starke Boeen machen die Fahrt derzeit deutlich zu unruhig.";
    }
    if (conditions && conditions.visibility != null && conditions.visibility < 500) {
      text = "🔴 Die Sicht ist aktuell zu eingeschraenkt fuer eine verlaessliche Fahrt.";
    }
    if (conditions && conditions.elwis_restriction_flag) {
      text = "🔴 Fuer diesen Abschnitt gelten aktuell amtliche Einschraenkungen. Bitte vorerst nicht ausfahren.";
    }
    return {
      recommendation_level: "no_go",
      recommendation_text: text,
      recommendation_short: "Nicht empfohlen",
      recommendation_icon: "🔴",
      recommendation_priority: "high"
    };
  }

  if (status === "caution") {
    let text = "🟡 Eine Fahrt ist möglich, erfordert aktuell aber erhöhte Aufmerksamkeit.";
    if (conditions && conditions.wind_gust != null && conditions.wind_gust > 50) {
      text = "🟡 Wind und Boeen koennen die Fahrt kurzfristig anspruchsvoller machen.";
    } else if (conditions && conditions.visibility != null && conditions.visibility < 500) {
      text = "🟡 Die Sicht ist stark eingeschränkt. Bitte defensiv und vorausschauend fahren.";
    } else if (conditions && (conditions.elwis_warning_flag || conditions.elwis_status === "warning")) {
      text = "🟡 Fuer diesen Bereich liegen Hinweise vor. Bitte die Lage vor der Fahrt kurz nachprüfen.";
    } else if (conditions && conditions.visibility != null && conditions.visibility < 1000) {
      text = "🟡 Die Sicht ist eingeschränkt und kann die Orientierung erschweren.";
    } else if (conditions && ((conditions.wind_gust != null && conditions.wind_gust > 35) || (conditions.wind_speed != null && conditions.wind_speed > 25))) {
      text = "🟡 Wind und Boeen koennen die Fahrt unruhig machen. Bitte defensiv fahren.";
    }
    return {
      recommendation_level: "caution",
      recommendation_text: text,
      recommendation_short: "Vorsicht",
      recommendation_icon: "🟡",
      recommendation_priority: "medium"
    };
  }

  if (status === "ok") {
    return {
      recommendation_level: "go",
      recommendation_text: "🌤 Gute Bedingungen für eine entspannte Fahrt.",
      recommendation_short: "Gute Lage",
      recommendation_icon: "🟢",
      recommendation_priority: "low"
    };
  }

  return {
    recommendation_level: "caution",
    recommendation_text: "⚠ Für eine verlässliche Einschätzung fehlen einzelne Daten. Bitte eher defensiv planen.",
    recommendation_short: "Vorsicht",
    recommendation_icon: "🟡",
    recommendation_priority: "medium"
  };
}

function buildBoatRecommendationAdvanced_(conditions, boatEval) {
  const c = conditions || {};
  const hasMeteo = (c.wind_speed != null || c.wind_gust != null || c.visibility != null || c.rain_intensity != null || c.storm_risk != null);
  const hasPegel = (c.water_level != null || c.water_level_trend != null);
  const hasAny = hasMeteo || hasPegel || c.elwis_restriction_flag || c.elwis_warning_flag;

  let trend = "stable";
  if (!hasAny) {
    trend = "unknown";
  } else if ((c.wind_gust != null && c.wind_gust > 40) || c.storm_risk === "high" || (c.rain_intensity != null && c.rain_intensity > 5) || (c.visibility != null && c.visibility < 1000)) {
    trend = "worsening";
  } else if ((c.wind_gust != null && c.wind_gust < 25) && c.storm_risk === "low" && (c.visibility != null && c.visibility > 5000)) {
    trend = "improving";
  }

  let risk_level = "low";
  if (c.storm_risk === "high" || (c.wind_gust != null && c.wind_gust > 50) || c.elwis_restriction_flag) {
    risk_level = "high";
  } else if ((c.wind_gust != null && c.wind_gust > 35) || (c.visibility != null && c.visibility < 2000) || (c.rain_intensity != null && c.rain_intensity > 3)) {
    risk_level = "medium";
  }

  let time_window_hint = "Kurzfristig";
  if (risk_level === "high") {
    time_window_hint = "Nächste 1-2 Std.";
  } else if (trend === "worsening") {
    time_window_hint = "In 1-3 Std.";
  } else if (trend === "improving") {
    time_window_hint = "Später ruhiger";
  }

  if (trend === "worsening" && risk_level === "medium") {
    time_window_hint = "Bis zum Abend";
  }

  let pro_tip = "Aktuell ruhige Bedingungen.";
  if (c.elwis_restriction_flag || c.elwis_warning_flag) {
    pro_tip = "Amtliche Hinweise vorab prüfen.";
  } else if ((c.wind_gust != null && c.wind_gust > 35) || (c.wind_speed != null && c.wind_speed > 25)) {
    pro_tip = "Geschützte Abschnitte bevorzugen.";
  } else if (c.visibility != null && c.visibility < 2000) {
    pro_tip = "Vor dem Ablegen Sicht prüfen.";
  } else if (c.rain_intensity != null && c.rain_intensity > 3) {
    pro_tip = "Regenradar kurz prüfen.";
  }

  let confidence = "low";
  if (hasMeteo && hasPegel) {
    confidence = "high";
  } else if (hasMeteo) {
    confidence = "medium";
  }

  return {
    trend: trend,
    risk_level: risk_level,
    time_window_hint: time_window_hint,
    pro_tip: pro_tip,
    confidence: confidence
  };
}

function buildBoatForecast_(conditions, boatEval, rec, recAdv) {
  const c = conditions || {};
  const r = rec || {};
  const a = recAdv || {};
  const hasData = (c.wind_gust != null || c.storm_risk != null || c.visibility != null || c.rain_intensity != null || c.elwis_restriction_flag || c.elwis_warning_flag);
  const hasCoreData = (c.wind_gust != null || c.storm_risk != null || c.visibility != null);

  let forecast_trend = "stable";
  if (!hasData) {
    forecast_trend = "unknown";
  } else if (a.trend === "worsening" || c.storm_risk === "high" || (c.wind_gust != null && c.wind_gust > 45)) {
    forecast_trend = "down";
  } else if (a.trend === "improving" && (c.wind_gust != null && c.wind_gust < 30) && c.storm_risk === "low") {
    forecast_trend = "up";
  }

  let forecast_text = "Die Bedingungen bleiben stabil.";
  if (forecast_trend === "down") {
    forecast_text = "Die Lage kann sich verschärfen.";
  } else if (forecast_trend === "up") {
    forecast_text = "Die Lage entspannt sich.";
  } else if (forecast_trend === "unknown") {
    forecast_text = "Die Entwicklung bleibt unklar.";
  }

  let alert_level = "none";
  let alert_icon = "🟢";
  let alert_text = "Keine auffälligen Entwicklungen";

  if (c.elwis_restriction_flag) {
    alert_level = "critical";
    alert_icon = "🔴";
    alert_text = "Amtliche Einschränkung beachten";
    forecast_text = "🔴 Für diesen Abschnitt ist aktuell keine Fahrt zu empfehlen";
  } else if (c.storm_risk === "high" || (boatEval && boatEval.boat_status === "restricted")) {
    alert_level = "critical";
    alert_icon = "🔴";
    alert_text = "Akut kritische Lage auf dem Wasser";
    forecast_text = "🔴 Die Bedingungen sind aktuell klar gegen eine Ausfahrt";
  } else if ((a.risk_level === "medium") || (a.trend === "worsening")) {
    alert_level = "warning";
    alert_icon = "⚠️";
    alert_text = "Die Bedingungen koennen sich verschlechtern";
  } else if ((boatEval && boatEval.boat_status === "caution") || c.elwis_warning_flag || (c.wind_gust != null && c.wind_gust > 30) || (c.visibility != null && c.visibility < 3000)) {
    alert_level = "info";
    alert_icon = "🟡";
    alert_text = "Leichte Einschränkungen sind möglich";
  }

  let next_hours_hint = "Kurzfristig keine großen Veränderungen.";
  if (alert_level === "critical" || a.risk_level === "high") {
    next_hours_hint = "In den nächsten Stunden eher unruhig.";
  } else if (a.trend === "worsening") {
    next_hours_hint = "Später etwas unruhiger möglich.";
  } else if (a.trend === "improving") {
    next_hours_hint = "In den nächsten Stunden eher ruhiger.";
  }

  if (!hasCoreData) {
    forecast_trend = "unknown";
    alert_level = "info";
    alert_icon = "🟡";
    alert_text = "Es liegen nur wenige Daten vor";
    forecast_text = "Die Entwicklung bleibt unklar.";
    next_hours_hint = "Kurzfristig nur eingeschränkt einschätzbar.";
  }

  if (alert_level === "critical") {
    next_hours_hint = "Kurzfristig kritisch.";
    if (c.elwis_restriction_flag) {
      forecast_text = "Amtliche Einschränkungen bestehen.";
      alert_text = "Amtliche Einschränkung beachten";
    } else if (r.recommendation_level === "no_go" || (boatEval && boatEval.boat_status === "restricted")) {
      forecast_text = "Die Lage bleibt kritisch.";
      alert_text = "Akut kritische Lage auf dem Wasser";
    } else {
      forecast_text = "Die Lage spricht gegen eine Ausfahrt.";
      alert_text = "Akut kritische Lage auf dem Wasser";
    }
  }

  return {
    forecast_trend: forecast_trend,
    forecast_text: buildFriendlyForecastText_(forecast_text),
    alert_level: alert_level,
    alert_icon: alert_icon,
    alert_text: cleanSentence_(alert_text),
    next_hours_hint: cleanSentence_(next_hours_hint)
  };
}

/* Captain UI text helpers — deterministic rule-based German wording */

const CAPTAIN_NOT_BOATING_TEXT = "🚫 Für diesen Spot stehen keine bootsrelevanten Hinweise im Fokus.";

/**
 * Returns true only when the row has clear evidence of boating relevance.
 * Conservative: when in doubt, returns false.
 */
function isBoatingRelevantFromRow_(p) {
  // Strong signals — any single one is sufficient
  if (p.elwisStatus && p.elwisStatus !== "" && p.elwisStatus !== "unknown") return true;
  if (p.elwisReason && p.elwisReason !== "") return true;
  if (p.pegelStation && p.pegelStation !== "") return true;

  // Meaningful boat-label that is not just the empty/unknown fallback
  const lbl = (p.boatStatusLabel || "").toLowerCase();
  if (lbl && lbl !== "unbekannt" && lbl !== "unknown" && lbl !== "") return true;

  // boatingStatus with actual diagnostic value
  const bs = p.boatingStatus || "";
  if (bs === "ok" || bs === "caution" || bs === "restricted") return true;

  // Presence of water-body physics data typically tied to navigable waterways
  // Require at least two of: currentSpeed, waterLevel, waveHeight, windSpeed
  // (a single wind_speed reading alone can come from any open-air spot)
  let physicsSignals = 0;
  if (p.currentSpeed != null && p.currentSpeed > 0) physicsSignals++;
  if (p.waterLevel != null) physicsSignals++;
  if (p.waveHeight != null && p.waveHeight > 0) physicsSignals++;
  if (p.windSpeed != null && p.windSpeed > 0 && (p.waveHeight != null || p.currentSpeed != null)) physicsSignals++;
  if (physicsSignals >= 2) return true;

  // recommendationLevel with meaningful boating content
  const rl = p.recommendationLevel || "";
  if (rl === "go" || rl === "caution" || rl === "no_go") {
    // Only counts if we also have at least one physics/weather signal
    if (p.windSpeed != null || p.waveHeight != null || p.currentSpeed != null || p.waterLevel != null) return true;
  }

  return false;
}

function buildCaptainOutlookUi_(p) {
  const boatingStatus = p.boatingStatus || "";
  const visitStatus = p.visitStatus || "";
  const forecastTrend = p.forecastTrend || "";
  const riskLevel = p.riskLevel || "";
  const stormRisk = p.stormRisk || "";
  const windSpeed = p.windSpeed;   // km/h or null
  const waveHeight = p.waveHeight; // meters or null
  const recommendationLevel = p.recommendationLevel || "";

  const hasData =
    (boatingStatus !== "" && boatingStatus !== "unknown") ||
    visitStatus === "ok" || visitStatus === "caution" || visitStatus === "restricted" ||
    windSpeed != null || waveHeight != null ||
    riskLevel !== "" || stormRisk !== "";

  if (!hasData) return "Aktuell kein klarer Ausblick verfügbar.";

  // Determine severity: 0=calm, 1=light, 2=moderate, 3=rough/restricted
  let severity = 1; // default: light
  if (
    boatingStatus === "restricted" ||
    visitStatus === "restricted" ||
    recommendationLevel === "no_go" ||
    riskLevel === "high" ||
    stormRisk === "high"
  ) {
    severity = 3;
  } else if (
    boatingStatus === "caution" ||
    visitStatus === "caution" ||
    recommendationLevel === "caution" ||
    riskLevel === "medium" ||
    stormRisk === "medium" ||
    (windSpeed != null && windSpeed > 35) ||
    (waveHeight != null && waveHeight > 0.8)
  ) {
    severity = 2;
  } else if (
    (boatingStatus === "ok" || visitStatus === "ok") &&
    (riskLevel === "low" || riskLevel === "") &&
    (stormRisk === "none" || stormRisk === "low" || stormRisk === "") &&
    (windSpeed == null || windSpeed <= 20) &&
    (waveHeight == null || waveHeight <= 0.3)
  ) {
    severity = 0;
  }

  const trendUp = forecastTrend === "up";
  const trendDown = forecastTrend === "down";

  if (severity === 0) {
    if (trendUp) return "Sieht heute entspannt aus. Im Verlauf wird's noch angenehmer. 🟢";
    if (trendDown) return "Aktuell ruhig unterwegs. Später etwas mehr Bewegung möglich.";
    return "Heute wirkt der Spot eher entspannt. Sieht stabil aus.";
  }
  if (severity === 1) {
    if (trendUp) return "Gerade noch okay. Im Verlauf bessert sich die Lage.";
    if (trendDown) return "Aktuell noch nutzbar. Später lieber etwas vorsichtiger.";
    return "Gerade okay, aber nicht komplett ruhig. Einfach aufmerksam bleiben.";
  }
  if (severity === 2) {
    if (trendUp) return "Aktuell etwas unruhig. Im Verlauf bessert sich die Lage.";
    if (trendDown) return "Heute unruhig – und später eher ungemütlicher. Lieber abwarten.";
    return "Heute eher unruhig. Wenn überhaupt, dann defensiv planen.";
  }
  // severity === 3
  if (trendUp) return "Gerade starke Einschränkungen. Im Verlauf etwas entspannter möglich.";
  if (trendDown) return "Aktuell keine guten Bedingungen – und das bleibt erst mal so.";
  return "Heute kein guter Tag für den Spot. Bitte wachsam bleiben.";
}

function buildCaptainTipUi_(p) {
  const boatingStatus = p.boatingStatus || "";
  const visitStatus = p.visitStatus || "";
  const riskLevel = p.riskLevel || "";
  const stormRisk = p.stormRisk || "";
  const windSpeed = p.windSpeed;
  const waveHeight = p.waveHeight;
  const recommendationLevel = p.recommendationLevel || "";

  const hasData =
    (boatingStatus !== "" && boatingStatus !== "unknown") ||
    visitStatus === "ok" || visitStatus === "caution" || visitStatus === "restricted" ||
    windSpeed != null || waveHeight != null ||
    riskLevel !== "" || stormRisk !== "";

  if (!hasData) return "Bitte Wetter, Wind und Hinweise vor Ort im Blick behalten.";

  // Same severity logic as outlook for consistency
  let severity = 1;
  if (
    boatingStatus === "restricted" ||
    visitStatus === "restricted" ||
    recommendationLevel === "no_go" ||
    riskLevel === "high" ||
    stormRisk === "high"
  ) {
    severity = 3;
  } else if (
    boatingStatus === "caution" ||
    visitStatus === "caution" ||
    recommendationLevel === "caution" ||
    riskLevel === "medium" ||
    stormRisk === "medium" ||
    (windSpeed != null && windSpeed > 35) ||
    (waveHeight != null && waveHeight > 0.8)
  ) {
    severity = 2;
  } else if (
    (boatingStatus === "ok" || visitStatus === "ok") &&
    (riskLevel === "low" || riskLevel === "") &&
    (stormRisk === "none" || stormRisk === "low" || stormRisk === "") &&
    (windSpeed == null || windSpeed <= 20) &&
    (waveHeight == null || waveHeight <= 0.3)
  ) {
    severity = 0;
  }

  const windStrong = windSpeed != null && windSpeed > 40;
  const windModerate = windSpeed != null && windSpeed > 25;
  const waveNoticeable = waveHeight != null && waveHeight > 0.5;

  if (severity === 0) {
    if (waveNoticeable) return "Gerade angenehm ruhig. Wenig Bewegung auf dem Wasser heute.";
    return "Heute ein entspannter Spot. Für eine lockere Runde passt das gut.";
  }
  if (severity === 1) {
    if (windModerate) return "Spürbarer Wind heute. Aufmerksam bleiben, läuft aber.";
    if (waveNoticeable) return "Leichte Bewegung auf dem Wasser. Kein Problem, wenn man's kennt.";
    return "Nicht wild, aber auch nicht komplett easy – lieber aufmerksam bleiben.";
  }
  if (severity === 2) {
    if (windStrong && waveNoticeable) return "Heute etwas lebendiger auf dem Wasser. Mit Ruhe und Blick aufs Wasser.";
    if (windStrong) return "Deutlicher Wind am Spot heute. Lieber auf Nummer sicher gehen.";
    return "Heute eher etwas lebendiger. Wenn du rausgehst, dann mit Ruhe und Blick aufs Wasser.";
  }
  // severity === 3
  return "Bitte Wetter, Wind und Hinweise vor Ort im Blick behalten.";
}

function buildBaseNoticeFromWaterRow_(rowObj) {
  const visitStatus = str_(rowObj.visit_status);
  const boatStatus = str_(rowObj.boat_status);
  const alertLevel = str_(rowObj.alert_level);
  const alertText = sanitizeText_(rowObj.alert_text);
  const recText = sanitizeText_(rowObj.recommendation_text);
  const forecastText = sanitizeText_(rowObj.forecast_text);
  const humanized = sanitizeText_(rowObj.status_explanation_humanized);
  const elwisStatus = str_(rowObj.elwis_status);
  const elwisReason = sanitizeText_(rowObj.elwis_reason);
  const noteRecommendation = sanitizeText_(rowObj.note_recommendation);
  const noteForecast = sanitizeText_(rowObj.note_forecast);
  const noteAlert = sanitizeText_(rowObj.note_alert);
  const noteContext = sanitizeText_(rowObj.note_context);

  let noticeType = "info";
  let noticeIcon = "ℹ️";
  let priority = "low";

  if (elwisStatus === "restricted") {
    noticeType = "authority";
    noticeIcon = "🔴";
    priority = "high";
  } else if (alertLevel === "critical" || visitStatus === "restricted" || boatStatus === "restricted") {
    noticeType = "warning";
    noticeIcon = "🔴";
    priority = "high";
  } else if (alertLevel === "warning" || visitStatus === "caution" || boatStatus === "caution") {
    noticeType = "caution";
    noticeIcon = "🟡";
    priority = "medium";
  } else if (alertLevel === "info") {
    noticeType = "forecast";
    noticeIcon = "🟡";
    priority = "medium";
  }

  let title = "Info";
  if (noticeType === "authority") {
    title = "Amtlicher Hinweis";
  } else if (noticeType === "warning") {
    title = "Warnhinweis";
  } else if (noticeType === "caution") {
    title = "Hinweis zur Lage";
  } else if (noticeType === "forecast") {
    title = "Kurzfristiger Ausblick";
  }

  const body = buildFriendlyNoticeText_([
    alertText,
    recText,
    forecastText,
    (elwisStatus && elwisStatus !== "unknown") ? ("ELWIS: " + (elwisReason || "Status geprueft")) : ""
  ]);

  const noteText = buildFinalNoteText_({
    note_recommendation: noteRecommendation,
    note_forecast: noteForecast,
    note_alert: noteAlert
  });

  return {
    title: sanitizeText_(title),
    body: sanitizeText_(body),
    note_text: sanitizeText_(noteText),
    note_recommendation: noteRecommendation,
    note_forecast: noteForecast,
    note_alert: noteAlert,
    note_context: noteContext,
    notice_type: noticeType,
    notice_icon: noticeIcon,
    priority: priority,
    is_active: true
  };
}

function syncWaterNoticesFromWaters_(ctx, log) {
  const notices = ctx.notices;
  if (!notices) {
    log.info("WaterNotices sync skipped: sheet missing");
    return;
  }

  const waters = ctx.waters;
  const wWaterId = waters.findCol(["water_id", "waterid"]);
  const wNoticeId = waters.findColOptional(["notice_id", "notice id"]);
  const wVisitStatus = waters.findColOptional(["visit_status"]);
  const wBoatStatus = waters.findColOptional(["boat_status", "boating_status"]);
  const wAlertLevel = waters.findColOptional(["alert_level", "warnstufe"]);
  const wAlertText = waters.findColOptional(["alert_text", "warntext"]);
  const wRecommendationText = waters.findColOptional(["recommendation_text", "empfehlung"]);
  const wForecastText = waters.findColOptional(["forecast_text", "prognose_text"]);
  const wHumanized = waters.findColOptional(["status_explanation_humanized"]);
  const wElwisStatus = waters.findColOptional(["elwis_status"]);
  const wElwisReason = waters.findColOptional(["elwis_reason"]);

  const nWaterId = notices.findColOptional(["water_id", "waterid"]);
  if (nWaterId < 0) {
    log.warn("WaterNotices sync skipped: missing water_id column");
    return;
  }
  const nNoticeId = notices.findColOptional(["notice_id", "notice id"]);
  const nTitle = notices.findColOptional(["title"]);
  const nBody = notices.findColOptional(["body"]);
  const nNoteText = notices.findColOptional(["note_text", "note text"]);
  const nNoteRecommendation = notices.findColOptional(["note_recommendation", "note recommendation"]);
  const nNoteForecast = notices.findColOptional(["note_forecast", "note forecast"]);
  const nNoteAlert = notices.findColOptional(["note_alert", "note alert"]);
  const nNoteContext = notices.findColOptional(["note_context", "note context"]);
  const nNoticeType = notices.findColOptional(["notice_type", "notice type"]);
  const nNoticeIcon = notices.findColOptional(["notice_icon", "notice icon"]);
  const nPriority = notices.findColOptional(["priority"]);
  const nIsActive = notices.findColOptional(["is_active", "active"]);
  const nUpdatedAt = notices.findColOptional(["updated_at", "updated at", "last_updated"]);

  const noticeRowByWaterId = new Map();
  for (let i = 0; i < notices.rows.length; i++) {
    const wid = str_(notices.rows[i][nWaterId]);
    if (wid && !noticeRowByWaterId.has(wid)) noticeRowByWaterId.set(wid, i);
  }

  let created = 0;
  let updated = 0;
  let linkedInWaters = 0;

  for (let r = 0; r < waters.rows.length; r++) {
    const waterId = str_(waters.rows[r][wWaterId]);
    if (!waterId) continue;

    const cleanElwisReason = sanitizeText_(wElwisReason >= 0 ? waters.rows[r][wElwisReason] : "");
    const cleanAlertText = sanitizeText_(wAlertText >= 0 ? waters.rows[r][wAlertText] : "");
    const finalNoteAlert = sanitizeText_(cleanElwisReason || cleanAlertText);

    const noticeId = "notice_" + waterId + "_base";
    const rowObj = {
      visit_status: wVisitStatus >= 0 ? waters.rows[r][wVisitStatus] : "",
      boat_status: wBoatStatus >= 0 ? waters.rows[r][wBoatStatus] : "",
      alert_level: wAlertLevel >= 0 ? waters.rows[r][wAlertLevel] : "",
      alert_text: wAlertText >= 0 ? waters.rows[r][wAlertText] : "",
      recommendation_text: wRecommendationText >= 0 ? waters.rows[r][wRecommendationText] : "",
      forecast_text: wForecastText >= 0 ? waters.rows[r][wForecastText] : "",
      status_explanation_humanized: wHumanized >= 0 ? waters.rows[r][wHumanized] : "",
      elwis_status: wElwisStatus >= 0 ? waters.rows[r][wElwisStatus] : "",
      elwis_reason: wElwisReason >= 0 ? waters.rows[r][wElwisReason] : "",
      note_recommendation: sanitizeText_(wRecommendationText >= 0 ? waters.rows[r][wRecommendationText] : ""),
      note_forecast: sanitizeText_(wForecastText >= 0 ? waters.rows[r][wForecastText] : ""),
      note_alert: finalNoteAlert,
      note_context: sanitizeText_(wHumanized >= 0 ? waters.rows[r][wHumanized] : "")
    };
    const notice = buildBaseNoticeFromWaterRow_(rowObj);
    notice.note_alert = sanitizeText_(notice.note_alert);
    notice.note_text = buildFinalNoteText_(notice);

    let nRow = noticeRowByWaterId.get(waterId);
    if (nRow == null) {
      const row = blankRow_(notices.headers.length);
      if (nNoticeId >= 0) row[nNoticeId] = noticeId;
      row[nWaterId] = waterId;
      if (nTitle >= 0) row[nTitle] = notice.title;
      if (nBody >= 0) row[nBody] = notice.body;
      if (nNoteText >= 0) row[nNoteText] = notice.note_text;
      if (nNoteRecommendation >= 0) row[nNoteRecommendation] = notice.note_recommendation;
      if (nNoteForecast >= 0) row[nNoteForecast] = notice.note_forecast;
      if (nNoteAlert >= 0) row[nNoteAlert] = notice.note_alert;
      if (nNoteContext >= 0) row[nNoteContext] = notice.note_context;
      if (nNoticeType >= 0) row[nNoticeType] = notice.notice_type;
      if (nNoticeIcon >= 0) row[nNoticeIcon] = notice.notice_icon;
      if (nPriority >= 0) row[nPriority] = notice.priority;
      if (nIsActive >= 0) row[nIsActive] = true;
      if (nUpdatedAt >= 0) row[nUpdatedAt] = new Date().toISOString();
      notices.appendBufferedRow(row);
      nRow = notices.rows.length + notices.appendRows.length - 1;
      noticeRowByWaterId.set(waterId, nRow);
      created++;
    } else {
      let changed = false;
      function setN_(colIdx, val) {
        if (colIdx < 0) return;
        const nextVal = val == null ? "" : val;
        if (!sameCellValue_(notices.rows[nRow][colIdx], nextVal)) changed = true;
        notices.set(nRow, colIdx, nextVal);
      }

      setN_(nNoticeId, noticeId);
      setN_(nWaterId, waterId);
      setN_(nTitle, notice.title);
      setN_(nBody, notice.body);
      setN_(nNoteText, notice.note_text);
      setN_(nNoteRecommendation, notice.note_recommendation);
      setN_(nNoteForecast, notice.note_forecast);
      setN_(nNoteAlert, notice.note_alert);
      setN_(nNoteContext, notice.note_context);
      setN_(nNoticeType, notice.notice_type);
      setN_(nNoticeIcon, notice.notice_icon);
      setN_(nPriority, notice.priority);
      setN_(nIsActive, true);
      if (changed && nUpdatedAt >= 0) {
        notices.set(nRow, nUpdatedAt, new Date().toISOString());
        updated++;
      }
    }

    if (wNoticeId >= 0) {
      const oldNoticeId = str_(waters.rows[r][wNoticeId]);
      if (oldNoticeId !== noticeId) linkedInWaters++;
      waters.set(r, wNoticeId, noticeId);
    }
  }

  if (notices.appendRows.length > 0) notices.flushAppends(log);
  notices.writeTouchedColumnsBack(log);
  if (wNoticeId >= 0) waters.writeTouchedColumnsBack(log);

  log.info("WaterNotices sync", {
    created: created,
    updated: updated,
    linked_notice_ids_in_waters: linkedInWaters
  });
}

function reprocessAllTextFields_(ctx, log) {
  const waters = ctx.waters;
  const notices = ctx.notices;

  const textColsWaters = [
    "boat_status_reason",
    "elwis_reason",
    "alert_text",
    "next_hours_hint",
    "forecast_text",
    "status_explanation",
    "status_explanation_humanized",
    "recommendation_text"
  ];

  const textColsNotices = [
    "note_text",
    "note_recommendation",
    "note_forecast",
    "note_alert",
    "note_context",
    "title",
    "body"
  ];

  function reprocessTable_(table, colNames, tableName) {
    if (!table) return 0;

    const cols = colNames
      .map(function(name) {
        return {
          name: name,
          idx: table.findColOptional([name, name.replace(/_/g, " "), name.replace(/_/g, "")])
        };
      })
      .filter(function(spec) { return spec.idx >= 0; });

    let changedCount = 0;

    for (let r = 0; r < table.rows.length; r++) {
      for (let c = 0; c < cols.length; c++) {
        const spec = cols[c];
        const before = str_(table.rows[r][spec.idx]);
        const after = sanitizeText_(before);
        if (!sameCellValue_(before, after)) {
          table.set(r, spec.idx, after);
          changedCount++;
          log.info("TEXT FIX APPLIED", {
            table: tableName,
            field: spec.name,
            before: before,
            after: after
          });
        }
      }
    }

    return changedCount;
  }

  const watersChanged = reprocessTable_(waters, textColsWaters, "Waters");
  const noticesChanged = reprocessTable_(notices, textColsNotices, "WaterNotices");

  if (watersChanged > 0) waters.writeTouchedColumnsBack(log);
  if (noticesChanged > 0) notices.writeTouchedColumnsBack(log);

  log.info("Text reprocess summary", {
    waters_changes: watersChanged,
    waternotices_changes: noticesChanged
  });
}

function reprocessRemainingGermanTextFixes_(ctx, log) {
  const waters = ctx.waters;
  if (!waters) return;

  const remainingCols = [
    "boat_status_reason",
    "time_window_hint",
    "pro_tip",
    "forecast_text",
    "alert_text",
    "elwis_reason",
    "status_explanation",
    "status_explanation_humanized"
  ];

  const colSpecs = remainingCols
    .map(function(name) {
      return {
        name: name,
        idx: waters.findColOptional([name, name.replace(/_/g, " "), name.replace(/_/g, "")])
      };
    })
    .filter(function(spec) { return spec.idx >= 0; });

  let changed = 0;
  for (let r = 0; r < waters.rows.length; r++) {
    for (let c = 0; c < colSpecs.length; c++) {
      const spec = colSpecs[c];
      const before = str_(waters.rows[r][spec.idx]);
      const after = sanitizeText_(before);
      if (!sameCellValue_(before, after)) {
        waters.set(r, spec.idx, after);
        changed++;
        log.info("TEXT FIX APPLIED", {
          table: "Waters",
          field: spec.name,
          before: before,
          after: after
        });
      }
    }
  }

  if (changed > 0) waters.writeTouchedColumnsBack(log);

  log.info("Remaining German text fixes", {
    waters_changes: changed
  });
}

function diagnoseBoatConditions_V670(ctx, log) {
    const DEBUG_COORDS = false;
  const budget = startRunBudget_();
  const scriptProps = PropertiesService.getScriptProperties();
  const waters = ctx.waters;
  const waterIdColW = waters.findCol(["water_id", "waterid"]);
  let latColW = waters.findColOptional(["latitude", "lat", "Latitude", "LATITUDE", "gps_lat", "coord_lat", "koord_lat"]);
  let lonColW = waters.findColOptional(["longitude", "lon", "lng", "Longitude", "LONGITUDE", "gps_lon", "coord_lon", "koord_lon"]);
  const spotNameColW = waters.findColOptional(["spot_name", "badestelle", "name"]);
  const coopsCurrentStationColW = waters.findColOptional(["coops_currents_station", "coops_station", "noaa_coops_station", "coops_station_id", "currents_station"]);
  const coopsCurrentBinColW = waters.findColOptional(["coops_currents_bin", "coops_bin", "noaa_coops_bin", "currents_bin"]);
  const ndbcStationColW = waters.findColOptional(["ndbc_station", "ndbc_station_id", "wave_station", "buoy_station", "buoy_id"]);
  const spotSourceColW = waters.findColOptional(["source"]);

  const watersName = (waters && waters.name) ? waters.name :
    ((waters && waters.sheetName) ? waters.sheetName :
    ((waters && waters.sheet && typeof waters.sheet.getName === "function") ? waters.sheet.getName() : "unknown"));
  const headers = Array.isArray(waters.headers) ? waters.headers : [];
  const firstHeaders = headers.slice(0, 20);

  if (DEBUG_COORDS) {
    log.info("Boat diagnosis headers debug", {
      waters_table: watersName,
      headers_preview: firstHeaders,
      water_id_col: waterIdColW,
      latitude_col: latColW,
      longitude_col: lonColW,
      spot_name_col: spotNameColW
    });
  }

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

    if (DEBUG_COORDS) {
      log.info("Boat diagnosis coordinate fallback result", {
        latitude_col: latColW,
        longitude_col: lonColW
      });
    }
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

  const headerIdxByNorm = {};
  for (let h = 0; h < headers.length; h++) {
    const nk = normHeader_(headers[h]);
    if (nk && headerIdxByNorm[nk] == null) headerIdxByNorm[nk] = h;
  }

  const outColAliases = {
    boat_status: ["boat_status", "boat status", "boating_status", "boating status"],
    boat_status_label: ["boat_status_label", "boat status label", "boating_status_label", "boating status label"],
    boat_status_icon: ["boat_status_icon", "boat status icon", "boating_status_icon", "boating status icon"],
    boat_status_color: ["boat_status_color", "boat status color", "boating_status_color", "boating status color"],
    boat_status_reason: ["boat_status_reason", "boat status reason", "boating_reason", "boating reason"],
    wind_speed: ["wind_speed", "wind speed", "windspeed", "wind"],
    wind_gust: ["wind_gust", "wind gust", "wind_boe", "boeen", "boeen_kmh", "gust"],
    wind_direction: ["wind_direction", "wind direction", "wind_dir", "winddir", "windrichtung"],
    water_level: ["water_level", "water level", "wasserstand", "pegel"],
    water_level_trend: ["water_level_trend", "water level trend", "pegel_trend", "wasserstand_trend"],
    current_speed: ["current_speed", "current speed", "stroemung", "stroemungsgeschwindigkeit"],
    wave_height: ["wave_height", "wave height", "wellenhoehe"],
    temperature_air: ["temperature_air", "temperature air", "temperature_ai", "temp_air", "lufttemperatur"],
    visibility: ["visibility", "sichtweite", "sicht"],
    rain_intensity: ["rain_intensity", "rain intensity", "niederschlag", "regenintensitaet"],
    storm_risk: ["storm_risk", "storm risk", "gewitterrisiko"],
    risk_level: ["risk_level", "risk level", "risikostufe"],
    recommendation_level: ["recommendation_level", "recommendation level", "empfehlung_level", "empfehlungslevel"],
    recommendation_text: ["recommendation_text", "recommendation text", "empfehlung_text", "empfehlung"],
    recommendation_icon: ["recommendation_icon", "recommendation icon", "empfehlung_icon"],
    trend: ["trend"],
    trend_icon: ["trend_icon", "trend icon"],
    time_window_hint: ["time_window_hint", "time window hint", "zeitfenster_hint", "zeitfenster"],
    pro_tip: ["pro_tip", "pro tip", "tipp", "profi_tipp"],
    confidence: ["confidence", "confidence_level", "vertrauen"],
    confidence_icon: ["confidence_icon", "confidence icon", "vertrauen_icon"],
    forecast_trend: ["forecast_trend", "forecast trend", "prognose_trend"],
    forecast_trend_icon: ["forecast_trend_icon", "forecast trend icon", "prognose_trend_icon"],
    forecast_text: ["forecast_text", "forecast text", "prognose_text"],
    alert_level: ["alert_level", "alert level", "warnstufe"],
    alert_icon: ["alert_icon", "alert icon", "warn_icon"],
    alert_text: ["alert_text", "alert text", "warntext"],
    next_hours_hint: ["next_hours_hint", "next hours hint", "naechste_stunden_hint"],
    pegel_status: ["pegel_status", "pegel status"],
    pegel_station: ["pegel_station", "pegel station", "messstation"],
    pegel_value_ui: ["pegel_value_ui", "pegel value ui", "pegel_value_label", "pegel value label"],
    pegel_station_ui: ["pegel_station_ui", "pegel ui", "pegel_label", "pegel label"],
    pegel_status_ui: ["pegel_status_ui", "pegel status ui", "pegel_status_label", "pegel status label", "pegel_level", "pegel level", "water_level_label", "water level label", "pegel_reason", "pegel reason"],
    pegel_station_distance_km: ["pegel_station_distance_km", "pegel station distance km", "pegel_distance_km", "messstation_distanz_km"],
    elwis_status: ["elwis_status", "elwis status"],
    elwis_reason: ["elwis_reason", "elwis reason", "elwis_hinweis", "elwis_text"],
    current_speed_source: ["current_speed_source", "current speed source"],
    wave_height_source: ["wave_height_source", "wave height source"],
    water_level_trend_source: ["water_level_trend_source", "water level trend source"],
    data_source: ["data_source", "data source", "source_label"],
    latest_measured_at: ["latest_measured_at", "latest measured at", "last_measured_at"],
    latest_reading_key: ["latest_reading_key", "latest reading key", "last_reading_key"],
    notice_id: ["notice_id", "notice id"],
    boating_status: ["boating_status", "boating status"],
    status_explanation: ["status_explanation", "status explanation"],
    status_explanation_humanized: ["status_explanation_humanized", "status explanation humanized", "status_explanation_human", "status explanation human"]
  };

  function resolveOutCol_(aliases) {
    for (let i = 0; i < aliases.length; i++) {
      const nk = normHeader_(aliases[i]);
      if (nk && headerIdxByNorm[nk] != null) return headerIdxByNorm[nk];
    }
    return -1;
  }

  const outCols = {};
  for (const outKey in outColAliases) {
    outCols[outKey] = resolveOutCol_(outColAliases[outKey]);
  }

  const mappedColumns = Object.keys(outCols).filter(function(k) { return outCols[k] >= 0; });
  const missingColumns = Object.keys(outCols).filter(function(k) { return outCols[k] < 0; });

  log.info("Boat write mapping", {
    mapped_columns: mappedColumns,
    missing_columns: missingColumns
  });

  for (let m = 0; m < missingColumns.length; m++) {
    const missingKey = missingColumns[m];
    log.warn("Boat write mapping: missing column", {
      column: missingKey,
      aliases: outColAliases[missingKey]
    });
  }

  const watersRowByWaterId = new Map();
  for (let i = 0; i < waters.rows.length; i++) {
    const wid = str_(waters.rows[i][waterIdColW]);
    if (wid && !watersRowByWaterId.has(wid)) watersRowByWaterId.set(wid, i);
  }

  const readings = ctx.readings;
  const rWaterId = readings.findCol(["water_id", "waterid"]);
  const rMeasuredAt = readings.findColOptional(["measured_at", "messdatum", "dat", "datum", "date", "letzte_probe", "probenahme"]);
  const latestReadingByWaterId = new Map();
  for (let rr = 0; rr < readings.rows.length; rr++) {
    const wid = str_(readings.rows[rr][rWaterId]);
    if (!wid) continue;
    const dt = rMeasuredAt >= 0 ? parseDateTimeMaybe_(readings.rows[rr][rMeasuredAt]) : "";
    const ts = dt instanceof Date ? dt.getTime() : 0;
    const prev = latestReadingByWaterId.get(wid);
    if (!prev || ts > prev.ts) {
      latestReadingByWaterId.set(wid, { ts: ts, date: dt instanceof Date ? dt : null });
    }
  }

  const touchedColIdxSet = new Set();

  function setOut_(rowIdx, colIdx, value) {
    if (colIdx < 0 || rowIdx < 0) return;
    const nextVal = value == null ? "" : value;
    if (!sameCellValue_(waters.rows[rowIdx][colIdx], nextVal)) {
      touchedColIdxSet.add(colIdx);
    }
    waters.set(rowIdx, colIdx, nextVal);
  }

  let withWeather = 0;
  let withPegel = 0;
  let withElwis = 0;
  let withoutConditions = 0;
  const boatStatusCounts = { ok: 0, caution: 0, restricted: 0, unknown: 0 };
  const pegelStatusCounts = { ok: 0, no_station: 0, no_measurement: 0, error: 0 };
  const elwisStatusCounts = { checked: 0, warning: 0, restricted: 0, unknown: 0 };
  const topReasons = new Map();
  const samples = [];
  let processedSpots = 0;
  let writtenRows = 0;

  const spotContexts = [];
  const dataByLocationKey = new Map();

  for (let i = 0; i < waters.rows.length; i++) {
    const waterId = str_(waters.rows[i][waterIdColW]);
    if (!waterId) continue;

    const lat = waters.rows[i][latColW];
    const lon = waters.rows[i][lonColW];
    const spotName = spotNameColW >= 0 ? str_(waters.rows[i][spotNameColW]) : "";
    const coopsStationId = coopsCurrentStationColW >= 0 ? str_(waters.rows[i][coopsCurrentStationColW]) : "";
    const coopsBinId = coopsCurrentBinColW >= 0 ? str_(waters.rows[i][coopsCurrentBinColW]) : "";
    const ndbcStationId = ndbcStationColW >= 0 ? str_(waters.rows[i][ndbcStationColW]) : "";
    const spotSource = spotSourceColW >= 0 ? str_(waters.rows[i][spotSourceColW]) : "";
    const locationKey = buildLocationCacheKey_(lat, lon, 3);
    const hydroKey = (locationKey || "") + "|" + coopsStationId + "|" + coopsBinId + "|" + ndbcStationId;

    spotContexts.push({
      waterId: waterId,
      spotName: spotName,
      lat: lat,
      lon: lon,
      locationKey: locationKey,
      hydroKey: hydroKey,
      coopsStationId: coopsStationId,
      coopsBinId: coopsBinId,
      ndbcStationId: ndbcStationId,
      spotSource: spotSource
    });

  }

  const totalSpots = spotContexts.length;
  if (totalSpots === 0) {
    scriptProps.deleteProperty(BOAT_BATCH_PROGRESS_KEY);
    log.info("Boat batch: no spots to process");
    return;
  }

  const rawStart = scriptProps.getProperty(BOAT_BATCH_PROGRESS_KEY);
  let startIndex = Number(rawStart);
  if (!isFinite(startIndex) || startIndex < 0 || startIndex >= totalSpots) {
    startIndex = 0;
  } else {
    startIndex = Math.floor(startIndex);
  }

  const endIndex = Math.min(startIndex + BOAT_BATCH_MAX_SPOTS_PER_RUN, totalSpots);

  log.info("Boat batch start", {
    start_index: startIndex,
    end_index_exclusive: endIndex,
    total_spots: totalSpots
  });

  for (let i = startIndex; i < endIndex; i++) {
    const sc = spotContexts[i];
    if (!sc || !sc.hydroKey) continue;
    if (!dataByLocationKey.has(sc.hydroKey)) {
      dataByLocationKey.set(sc.hydroKey, {
        pegelData: fetchPegelOnline_(sc.lat, sc.lon, log),
        meteoData: fetchOpenMeteo_(sc.lat, sc.lon, log),
        elwisData: fetchElwis_(sc.lat, sc.lon, sc.spotName, log),
        hydroData: fetchHydroData_(sc.lat, sc.lon, sc.coopsStationId, sc.coopsBinId, sc.ndbcStationId, log)
      });
    }
  }

  let nextIndex = startIndex;
  let abortedBySoftBudget = false;

  for (let i = startIndex; i < endIndex; i++) {
    if (isNearTimeout_(budget, BOAT_BATCH_SOFT_RESERVE_MS)) {
      abortedBySoftBudget = true;
      nextIndex = i;
      log.warn("Boat batch stopped early due to soft time budget", {
        next_index: nextIndex,
        processed_in_run: processedSpots,
        end_index_exclusive: endIndex,
        total_spots: totalSpots
      });
      break;
    }

    const spotCtx = spotContexts[i];
    const waterId = spotCtx.waterId;

    processedSpots++;

    let pegelData = null;
    let meteoData = null;
    let elwisData = null;
    let hydroData = null;

    if (spotCtx.hydroKey && dataByLocationKey.has(spotCtx.hydroKey)) {
      const prefetched = dataByLocationKey.get(spotCtx.hydroKey);
      pegelData = prefetched.pegelData;
      meteoData = prefetched.meteoData;
      elwisData = prefetched.elwisData;
      hydroData = prefetched.hydroData;
    } else {
      pegelData = fetchPegelOnline_(spotCtx.lat, spotCtx.lon, log);
      meteoData = fetchOpenMeteo_(spotCtx.lat, spotCtx.lon, log);
      elwisData = fetchElwis_(spotCtx.lat, spotCtx.lon, spotCtx.spotName, log);
      hydroData = fetchHydroData_(spotCtx.lat, spotCtx.lon, spotCtx.coopsStationId, spotCtx.coopsBinId, spotCtx.ndbcStationId, log);
    }

    const conditions = normalizeConditions_(pegelData, meteoData, elwisData, hydroData);

    // Inland fallback: Open-Meteo Marine returns null for inland German waters.
    // Use conservative model-based estimates so fields are never empty.
    const spotSourceStr = (spotCtx.spotSource || "").toLowerCase();
    const waterIdStr = (spotCtx.waterId || "").toLowerCase();
    const spotNameStr = (spotCtx.spotName || "").toLowerCase();
    const isLikelyInland =
      spotSourceStr.startsWith("berlin") ||
      spotSourceStr.startsWith("bb_") ||
      waterIdStr.startsWith("berlin") ||
      waterIdStr.startsWith("bb_") ||
      waterIdStr.startsWith("be_") ||
      spotNameStr.indexOf("berlin") >= 0 ||
      spotNameStr.indexOf("brandenburg") >= 0;
    if (conditions.current_speed == null && isLikelyInland) {
      const flowingKeywords = ["havel", "spree", "kanal", "canal", "fluss", "river", "fließ", "verbindung", "durchfahrt", "schiff"];
      const spotHint = ((spotCtx.spotName || "") + " " + (spotCtx.waterId || "") + " " + (spotCtx.spotSource || "")).toLowerCase();
      const isLikelyFlowing = flowingKeywords.some(function(kw) { return spotHint.indexOf(kw) >= 0; });
      const trendNum = toFiniteNumberOrNull_(conditions.water_level_trend);
      if (trendNum != null && Math.abs(trendNum) >= 1) {
        // Estimate from pegel trend (cm/h): rising → 0.3–0.6 m/s, falling → 0.1–0.3 m/s
        conditions.current_speed = trendNum > 0
          ? Number((0.3 + Math.min(trendNum / 30, 0.3)).toFixed(2))
          : Number((0.1 + Math.min(Math.abs(trendNum) / 60, 0.2)).toFixed(2));
        conditions.current_speed_source = "estimated_from_pegel_trend";
      } else if (isLikelyFlowing) {
        conditions.current_speed = 0.2;
        conditions.current_speed_source = "estimated_flowing_default";
      } else {
        conditions.current_speed = 0.0;
        conditions.current_speed_source = "estimated_stillwater_default";
      }
    }
    if (conditions.wave_height == null && conditions.wind_speed != null) {
      const windKmh = toFiniteNumberOrNull_(conditions.wind_speed);
      if (windKmh != null) {
        conditions.wave_height = Number(Math.min(windKmh * 0.1, 1.5).toFixed(2));
        conditions.wave_height_source = "estimated_from_wind";
      }
    }
    // Final guarantee: fills ALL remaining null fields with safe defaults before writeback
    finalizeWaterRow_(conditions, waterId, log);

    log.info("Boat field sources", {
      water_id: waterId,
      current_speed_source: conditions.current_speed_source,
      current_speed_fallback_used: conditions.current_speed_source === "openmeteo_marine_fallback" || conditions.current_speed_source === "estimated_stillwater_default",
      wave_height_source: conditions.wave_height_source,
      wave_height_fallback_used: conditions.wave_height_source === "openmeteo_marine_fallback" || conditions.wave_height_source === "estimated_inland_wave_from_wind",
      water_level_trend_source: conditions.water_level_trend_source,
      water_level_trend_insufficient_history: conditions.water_level_trend_source === "insufficient_history"
    });

    if (samples.length < 5) {
      log.info("Boat field completeness sample", {
        water_id: waterId,
        water_level: conditions.water_level,
        water_level_trend: conditions.water_level_trend,
        current_speed: conditions.current_speed,
        current_speed_source: conditions.current_speed_source,
        wave_height: conditions.wave_height,
        wave_height_source: conditions.wave_height_source,
        water_level_trend_source: conditions.water_level_trend_source,
        elwis_status: conditions.elwis_status,
        elwis_reason: conditions.elwis_reason
      });
    }

    const pegelStatus = conditions.pegel_status;
    if (pegelStatusCounts[pegelStatus] != null) {
      pegelStatusCounts[pegelStatus]++;
    }

    const elwisStatus = conditions.elwis_status;
    if (elwisStatusCounts[elwisStatus] != null) {
      elwisStatusCounts[elwisStatus]++;
    }

    const hasWeather = (conditions.wind_speed != null || conditions.wind_gust != null ||
      conditions.visibility != null || conditions.rain_intensity != null ||
      conditions.weather_code != null || conditions.temperature_air != null);

    const hasPegel = (conditions.water_level != null || conditions.water_level_trend != null);

    const hasValidElwis = (conditions.elwis_status === "warning" || conditions.elwis_status === "restricted");

    if (hasWeather) withWeather++;
    if (hasPegel) withPegel++;
    if (hasValidElwis) withElwis++;

    if (!hasWeather && !hasPegel && !hasValidElwis) {
      withoutConditions++;
    }

    const boatEval = computeBoatStatus_(conditions);
    const rec = buildBoatRecommendation_(conditions, boatEval);
    const recAdv = buildBoatRecommendationAdvanced_(conditions, boatEval);
    if (!recAdv.risk_level) recAdv.risk_level = "low";
    const forecast = buildBoatForecast_(conditions, boatEval, rec, recAdv);
    const boatStatusIcon = boatEval.boat_status === "ok" ? "🟢" : (boatEval.boat_status === "caution" ? "🟡" : (boatEval.boat_status === "restricted" ? "🔴" : "⚪"));
    const boatStatusColor = boatEval.boat_status === "ok" ? "green" : (boatEval.boat_status === "caution" ? "amber" : (boatEval.boat_status === "restricted" ? "red" : "gray"));
    const confidenceIcon = recAdv.confidence === "high" ? "🟢" : (recAdv.confidence === "medium" ? "🟡" : "⚪");
    const trendIcon = recAdv.trend === "improving" ? "🟢" : (recAdv.trend === "stable" ? "🟡" : (recAdv.trend === "worsening" ? "🔴" : "⚪"));
    const forecastTrendIcon = forecast.forecast_trend === "up" ? "🟢" : (forecast.forecast_trend === "stable" ? "🟡" : (forecast.forecast_trend === "down" ? "🔴" : "⚪"));
    const statusExplanation = joinSentencesClean_([
      boatEval.boat_status_reason,
      (!boatEval.boat_status_reason && forecast.alert_level !== "none") ? forecast.alert_text : ""
    ]);
    const statusExplanationHumanized = joinSentencesClean_([
      rec.recommendation_text,
      forecast.next_hours_hint
    ]);
    const latestReadingMeta = latestReadingByWaterId.get(waterId) || null;
    const latestMeasuredAt = latestReadingMeta && latestReadingMeta.date ? latestReadingMeta.date.toISOString() : "";
    const latestReadingKey = latestMeasuredAt
      ? ("rd_" + waterId + "_" + latestMeasuredAt.replace(/[^0-9]/g, "").slice(0, 14))
      : ("rd_" + waterId + "_latest");
    const dataSourceLabel = sanitizeDataSourceLabel_([
      conditions.current_speed_source || "",
      conditions.wave_height_source || "",
      conditions.water_level_trend_source || "",
      conditions.elwis_status ? ("elwis_" + conditions.elwis_status) : ""
    ].filter(function(x) { return !!x; }).join(" | "));

    // Final output guarantee: operates on computed output objects, immediately before writeback
    finalizeWrittenStatusRow_(boatEval, conditions, recAdv, waterId, log);

    const rowIdx = watersRowByWaterId.has(waterId) ? watersRowByWaterId.get(waterId) : -1;
    if (rowIdx >= 0) {
      setOut_(rowIdx, outCols.boat_status, boatEval.boat_status);
      setOut_(rowIdx, outCols.boat_status_label, boatEval.boat_status_label);
      setOut_(rowIdx, outCols.boat_status_icon, boatStatusIcon);
      setOut_(rowIdx, outCols.boat_status_color, boatStatusColor);
      setOut_(rowIdx, outCols.boat_status_reason, sanitizeText_(boatEval.boat_status_reason));
      setOut_(rowIdx, outCols.wind_speed, conditions.wind_speed);
      setOut_(rowIdx, outCols.wind_gust, conditions.wind_gust);
      setOut_(rowIdx, outCols.wind_direction, conditions.wind_direction);
      setOut_(rowIdx, outCols.water_level, conditions.water_level);
      setOut_(rowIdx, outCols.water_level_trend, conditions.water_level_trend);
      setOut_(rowIdx, outCols.water_level_trend_source, conditions.water_level_trend_source);
      setOut_(rowIdx, outCols.current_speed, conditions.current_speed);
      setOut_(rowIdx, outCols.current_speed_source, conditions.current_speed_source);
      setOut_(rowIdx, outCols.wave_height, conditions.wave_height);
      setOut_(rowIdx, outCols.wave_height_source, conditions.wave_height_source);
      setOut_(rowIdx, outCols.temperature_air, conditions.temperature_air);
      setOut_(rowIdx, outCols.visibility, conditions.visibility);
      setOut_(rowIdx, outCols.rain_intensity, conditions.rain_intensity);
      setOut_(rowIdx, outCols.storm_risk, conditions.storm_risk);
      setOut_(rowIdx, outCols.risk_level, recAdv.risk_level);
      setOut_(rowIdx, outCols.recommendation_level, rec.recommendation_level);
      setOut_(rowIdx, outCols.recommendation_text, sanitizeText_(rec.recommendation_text));
      setOut_(rowIdx, outCols.recommendation_icon, rec.recommendation_icon);
      setOut_(rowIdx, outCols.trend, recAdv.trend);
      setOut_(rowIdx, outCols.trend_icon, trendIcon);
      setOut_(rowIdx, outCols.time_window_hint, sanitizeText_(recAdv.time_window_hint));
      setOut_(rowIdx, outCols.pro_tip, sanitizeText_(recAdv.pro_tip));
      setOut_(rowIdx, outCols.confidence, recAdv.confidence);
      setOut_(rowIdx, outCols.confidence_icon, confidenceIcon);
      setOut_(rowIdx, outCols.forecast_trend, forecast.forecast_trend);
      setOut_(rowIdx, outCols.forecast_trend_icon, forecastTrendIcon);
      setOut_(rowIdx, outCols.forecast_text, sanitizeText_(forecast.forecast_text));
      setOut_(rowIdx, outCols.alert_level, forecast.alert_level);
      setOut_(rowIdx, outCols.alert_icon, forecast.alert_icon);
      setOut_(rowIdx, outCols.alert_text, sanitizeText_(forecast.alert_text));
      setOut_(rowIdx, outCols.next_hours_hint, sanitizeText_(forecast.next_hours_hint));
      setOut_(rowIdx, outCols.pegel_status, conditions.pegel_status);
      setOut_(rowIdx, outCols.pegel_station, conditions.pegel_station);
      setOut_(rowIdx, outCols.pegel_value_ui, formatPegelValueUi_(conditions.water_level));
      setOut_(rowIdx, outCols.pegel_station_ui, formatPegelStationUi_(conditions.pegel_status, conditions.pegel_station));
      setOut_(rowIdx, outCols.pegel_status_ui, formatPegelStatusUi_(conditions.pegel_status, conditions.pegel_station, conditions.water_level_trend));
      setOut_(rowIdx, outCols.pegel_station_distance_km, conditions.pegel_station_distance_km);
      setOut_(rowIdx, outCols.elwis_status, conditions.elwis_status);
      setOut_(rowIdx, outCols.elwis_reason, sanitizeText_(conditions.elwis_reason));
      setOut_(rowIdx, outCols.data_source, dataSourceLabel);
      setOut_(rowIdx, outCols.latest_measured_at, latestMeasuredAt);
      setOut_(rowIdx, outCols.latest_reading_key, latestReadingKey);
      setOut_(rowIdx, outCols.boating_status, boatEval.boat_status);
      setOut_(rowIdx, outCols.status_explanation, sanitizeText_(statusExplanation));
      setOut_(rowIdx, outCols.status_explanation_humanized, sanitizeText_(statusExplanationHumanized));
      writtenRows++;
    }

    boatStatusCounts[boatEval.boat_status]++;
    const reasonKey = boatEval.boat_status_reason;
    if (reasonKey && reasonKey.length > 0) {
      topReasons.set(reasonKey, (topReasons.get(reasonKey) || 0) + 1);
    }

    if (samples.length < 15) {
      const sampleObj = {
        water_id: waterId,
        spot_name: spotCtx.spotName,
        boat_status: boatEval.boat_status,
        boat_status_label: boatEval.boat_status_label,
        boat_status_reason: boatEval.boat_status_reason != null ? boatEval.boat_status_reason : null,
        wind_speed: conditions.wind_speed != null ? conditions.wind_speed : null,
        wind_gust: conditions.wind_gust != null ? conditions.wind_gust : null,
        water_level: conditions.water_level != null ? conditions.water_level : null,
        water_level_trend: conditions.water_level_trend != null ? conditions.water_level_trend : null,
        pegel_status: conditions.pegel_status ? conditions.pegel_status : null,
        pegel_station: conditions.pegel_station ? conditions.pegel_station : null,
        pegel_station_distance_km: conditions.pegel_station_distance_km != null ? conditions.pegel_station_distance_km : null,
        wave_height: conditions.wave_height != null ? conditions.wave_height : null,
        storm_risk: conditions.storm_risk != null ? conditions.storm_risk : null,
        elwis_status: conditions.elwis_status != null ? conditions.elwis_status : null,
        elwis_reason: conditions.elwis_reason ? conditions.elwis_reason : null,
        recommendation_level: rec.recommendation_level,
        recommendation_text: rec.recommendation_text,
        recommendation_icon: rec.recommendation_icon,
        trend: recAdv.trend,
        trend_icon: trendIcon,
        risk_level: recAdv.risk_level,
        time_window_hint: recAdv.time_window_hint,
        pro_tip: recAdv.pro_tip,
        confidence: recAdv.confidence,
        confidence_icon: confidenceIcon,
        forecast_trend: forecast.forecast_trend,
        forecast_trend_icon: forecastTrendIcon,
        forecast_text: forecast.forecast_text,
        alert_level: forecast.alert_level,
        alert_icon: forecast.alert_icon,
        alert_text: forecast.alert_text,
        next_hours_hint: forecast.next_hours_hint
      };
      samples.push(sampleObj);
    }

    nextIndex = i + 1;
  }

  if (writtenRows > 0) {
    waters.writeTouchedColumnsBack(log);
  }

  if (!abortedBySoftBudget && nextIndex < endIndex) {
    nextIndex = endIndex;
  }

  if (nextIndex >= totalSpots) {
    scriptProps.deleteProperty(BOAT_BATCH_PROGRESS_KEY);
    log.info("Boat batch cycle finished, resetting progress", {
      total_spots: totalSpots
    });
  } else {
    scriptProps.setProperty(BOAT_BATCH_PROGRESS_KEY, String(nextIndex));
    log.info("Boat batch complete", {
      next_index: nextIndex,
      total_spots: totalSpots,
      batch_completed: !abortedBySoftBudget
    });
  }

  log.info("Boat write persistence", {
    written_rows: writtenRows,
    touched_columns_count: touchedColIdxSet.size
  });

  const topReasonsSorted = Array.from(topReasons.entries())
    .sort(function(a, b) { return b[1] - a[1]; })
    .slice(0, 5)
    .map(function(e) { return e[0] + " (" + e[1] + ")"; });

  const topReasonsStr = topReasonsSorted.length > 0 ? topReasonsSorted.join("; ") : "keine";

  const summary = {
    total_spots: processedSpots,
    batch_start_index: startIndex,
    batch_end_index_exclusive: endIndex,
    batch_next_index: nextIndex >= totalSpots ? 0 : nextIndex,
    batch_cycle_finished: nextIndex >= totalSpots,
    spots_with_weather_data: withWeather,
    spots_with_pegel_data: withPegel,
    spots_with_elwis_data: withElwis,
    pegel_status_counts: pegelStatusCounts,
    elwis_status_counts: elwisStatusCounts,
    boat_status_counts: boatStatusCounts,
    top_boat_reasons: topReasonsStr,
    spots_without_sufficient_conditions: withoutConditions
  };

  log.info("Boat Conditions Diagnosis V2", summary);
  if (samples.length) {
    log.info("Boat Conditions Diagnosis Samples", samples);
  }
}

function runDiagnoseBoatConditions_V670() {
  withScriptLock_("runDiagnoseBoatConditions_V670", function(ss, log) {
    log.info("START runDiagnoseBoatConditions_V670 (Phase A)");
    const ctx = loadContext_(ss, log);
    diagnoseBoatConditions_V670(ctx, log);
    writeStatusesToWaters_V670(ctx, log);
    syncWaterNoticesFromWaters_(ctx, log);
    reprocessAllTextFields_(ctx, log);
    reprocessRemainingGermanTextFixes_(ctx, log);
    auditDataIntegrity_(ctx, log);
    log.info("DONE runDiagnoseBoatConditions_V670");
    log.flush();
  });
}

function runValidateWatersStatusCoverage_V670() {
  const ss = SpreadsheetApp.getActive();
  const log = makeLogger_(ss);
  const ctx = loadContext_(ss, log);
  validateWatersStatusCoverage_V670(ctx, log);
  log.flush();
}

function runBackfillCaptainUi_V670() {
  withScriptLock_("runBackfillCaptainUi_V670", function(ss, log) {
    log.info("START runBackfillCaptainUi_V670");
    const ctx = loadContext_(ss, log);
    backfillCaptainUiFields_(ctx, log);
    log.info("DONE runBackfillCaptainUi_V670");
    log.flush();
  });
}

function runBackfillPegelUi_V670() {
  withScriptLock_("runBackfillPegelUi_V670", function(ss, log) {
    log.info("START runBackfillPegelUi_V670");
    const ctx = loadContext_(ss, log);
    backfillPegelUiFields_(ctx, log);
    log.info("DONE runBackfillPegelUi_V670");
    log.flush();
  });
}

function backfillPegelUiFields_(ctx, log) {
  const waters = ctx.waters;
  const waterIdCol = waters.findColOptional(["water_id", "waterid"]);
  const isActiveCol = waters.findColOptional(["is_active", "active"]);
  const pegelStatusCol = waters.findColOptional(["pegel_status", "pegel status"]);
  const pegelStationCol = waters.findColOptional(["pegel_station", "pegel station", "messstation"]);
  const waterLevelCol = waters.findColOptional(["water_level", "water level", "wasserstand", "pegel"]);
  const waterLevelTrendCol = waters.findColOptional(["water_level_trend", "water level trend", "pegel_trend", "wasserstand_trend"]);
  const pegelValueUiCol = waters.findColOptional(["pegel_value_ui", "pegel value ui", "pegel_value_label", "pegel value label"]);
  const pegelStationUiCol = waters.findColOptional(["pegel_station_ui", "pegel ui", "pegel_label", "pegel label"]);
  const pegelStatusUiCol = waters.findColOptional(["pegel_status_ui", "pegel status ui", "pegel_status_label", "pegel status label", "pegel_level", "pegel level", "water_level_label", "water level label", "pegel_reason", "pegel reason"]);

  if (waterIdCol < 0 || (pegelValueUiCol < 0 && pegelStationUiCol < 0 && pegelStatusUiCol < 0)) {
    log.warn("Backfill Pegel UI skipped: required columns missing", {
      water_id: waterIdCol >= 0,
      pegel_value_ui: pegelValueUiCol >= 0,
      pegel_station_ui: pegelStationUiCol >= 0,
      pegel_status_ui: pegelStatusUiCol >= 0
    });
    return;
  }

  let rowsChecked = 0;
  let skippedInactive = 0;
  let pegelValueUiWritten = 0;
  let pegelStationUiWritten = 0;
  let pegelStatusUiWritten = 0;
  let unchangedRows = 0;

  for (let i = 0; i < waters.rows.length; i++) {
    const waterId = str_(waters.rows[i][waterIdCol]);
    if (!waterId) continue;

    if (isActiveCol >= 0) {
      const activeVal = waters.rows[i][isActiveCol];
      if (activeVal === false || String(activeVal).toLowerCase() === "false" || activeVal === 0 || String(activeVal) === "0") {
        skippedInactive++;
        continue;
      }
    }

    rowsChecked++;

    const pegelStatus = pegelStatusCol >= 0 ? waters.rows[i][pegelStatusCol] : "";
    const pegelStation = pegelStationCol >= 0 ? waters.rows[i][pegelStationCol] : "";
    const waterLevel = waterLevelCol >= 0 ? waters.rows[i][waterLevelCol] : null;
    const waterLevelTrend = waterLevelTrendCol >= 0 ? waters.rows[i][waterLevelTrendCol] : null;
    let rowChanged = false;

    if (pegelValueUiCol >= 0) {
      const nextValueUi = formatPegelValueUi_(waterLevel);
      const oldValueUi = str_(waters.rows[i][pegelValueUiCol]);
      if (!oldValueUi || oldValueUi !== nextValueUi) {
        waters.set(i, pegelValueUiCol, nextValueUi);
        pegelValueUiWritten++;
        rowChanged = true;
      }
    }

    if (pegelStationUiCol >= 0) {
      const nextStationUi = formatPegelStationUi_(pegelStatus, pegelStation);
      const oldStationUi = str_(waters.rows[i][pegelStationUiCol]);
      if (!oldStationUi || oldStationUi !== nextStationUi) {
        waters.set(i, pegelStationUiCol, nextStationUi);
        pegelStationUiWritten++;
        rowChanged = true;
      }
    }

    if (pegelStatusUiCol >= 0) {
      const nextStatusUi = formatPegelStatusUi_(pegelStatus, pegelStation, waterLevelTrend);
      const oldStatusUi = str_(waters.rows[i][pegelStatusUiCol]);
      if (!oldStatusUi || oldStatusUi !== nextStatusUi) {
        waters.set(i, pegelStatusUiCol, nextStatusUi);
        pegelStatusUiWritten++;
        rowChanged = true;
      }
    }

    if (!rowChanged) unchangedRows++;
  }

  if ((pegelValueUiWritten > 0 || pegelStationUiWritten > 0 || pegelStatusUiWritten > 0) && !DEBUG_DRY_RUN) waters.writeTouchedColumnsBack(log);

  log.info("Backfill Pegel UI complete", {
    rows_checked: rowsChecked,
    skipped_inactive: skippedInactive,
    pegel_value_ui_written: pegelValueUiWritten,
    pegel_station_ui_written: pegelStationUiWritten,
    pegel_status_ui_written: pegelStatusUiWritten,
    unchanged_rows: unchangedRows,
    dry_run: DEBUG_DRY_RUN
  });
}

function backfillCaptainUiFields_(ctx, log) {
  const waters = ctx.waters;
  const captainOutlookCol = ctx.cols.waters.captain_outlook_ui;
  const captainTipCol = ctx.cols.waters.captain_tip_ui;

  if (captainOutlookCol < 0 && captainTipCol < 0) {
    log.warn("backfillCaptainUi: neither captain_outlook_ui nor captain_tip_ui column found in Waters sheet");
    return;
  }

  const waterIdCol = waters.findCol(["water_id", "waterid"]);
  const isActiveCol = waters.findColOptional(["is_active", "active"]);

  // Read-only boat-condition columns (written by diagnoseBoatConditions; may be empty for swim-only spots)
  const boatingStatusReadCol = waters.findColOptional(["boat_status", "boating_status"]);
  const visitStatusReadCol = waters.findColOptional(["visit_status"]);
  const stormRiskReadCol = waters.findColOptional(["storm_risk"]);
  const windSpeedReadCol = waters.findColOptional(["wind_speed"]);
  const waveHeightReadCol = waters.findColOptional(["wave_height"]);
  const forecastTrendReadCol = waters.findColOptional(["forecast_trend"]);
  const recommendationLevelReadCol = waters.findColOptional(["recommendation_level"]);
  const riskLevelReadCol = waters.findColOptional(["risk_level"]);
  const boatStatusLabelReadCol = waters.findColOptional(["boat_status_label", "boating_status_label"]);
  // Extra boating-relevance signal columns (all optional)
  const elwisStatusReadCol = waters.findColOptional(["elwis_status"]);
  const elwisReasonReadCol = waters.findColOptional(["elwis_reason"]);
  const pegelStationReadCol = waters.findColOptional(["pegel_station"]);
  const currentSpeedReadCol = waters.findColOptional(["current_speed"]);
  const waterLevelReadCol = waters.findColOptional(["water_level"]);

  let totalActive = 0;
  let skippedInactive = 0;
  let writtenOutlook = 0;
  let writtenTip = 0;
  let unchangedRows = 0;

  for (let i = 0; i < waters.rows.length; i++) {
    const waterId = str_(waters.rows[i][waterIdCol]);
    if (!waterId) continue;

    if (isActiveCol >= 0) {
      const activeVal = waters.rows[i][isActiveCol];
      if (activeVal === false || String(activeVal).toLowerCase() === "false" || activeVal === 0 || String(activeVal) === "0") {
        skippedInactive++;
        continue;
      }
    }

    totalActive++;

    const captainParams = {
      boatingStatus: boatingStatusReadCol >= 0 ? str_(waters.rows[i][boatingStatusReadCol]) : "",
      visitStatus: visitStatusReadCol >= 0 ? str_(waters.rows[i][visitStatusReadCol]) : "",
      forecastTrend: forecastTrendReadCol >= 0 ? str_(waters.rows[i][forecastTrendReadCol]) : "",
      riskLevel: riskLevelReadCol >= 0 ? str_(waters.rows[i][riskLevelReadCol]) : "",
      stormRisk: stormRiskReadCol >= 0 ? str_(waters.rows[i][stormRiskReadCol]) : "",
      windSpeed: windSpeedReadCol >= 0 ? toNumberMaybe_(waters.rows[i][windSpeedReadCol]) : null,
      waveHeight: waveHeightReadCol >= 0 ? toNumberMaybe_(waters.rows[i][waveHeightReadCol]) : null,
      recommendationLevel: recommendationLevelReadCol >= 0 ? str_(waters.rows[i][recommendationLevelReadCol]) : "",
      boatStatusLabel: boatStatusLabelReadCol >= 0 ? str_(waters.rows[i][boatStatusLabelReadCol]) : "",
      elwisStatus: elwisStatusReadCol >= 0 ? str_(waters.rows[i][elwisStatusReadCol]) : "",
      elwisReason: elwisReasonReadCol >= 0 ? str_(waters.rows[i][elwisReasonReadCol]) : "",
      pegelStation: pegelStationReadCol >= 0 ? str_(waters.rows[i][pegelStationReadCol]) : "",
      currentSpeed: currentSpeedReadCol >= 0 ? toNumberMaybe_(waters.rows[i][currentSpeedReadCol]) : null,
      waterLevel: waterLevelReadCol >= 0 ? toNumberMaybe_(waters.rows[i][waterLevelReadCol]) : null
    };

    const boatingRelevant = isBoatingRelevantFromRow_(captainParams);
    let rowChanged = false;

    if (captainOutlookCol >= 0) {
      const newOutlook = boatingRelevant ? buildCaptainOutlookUi_(captainParams) : CAPTAIN_NOT_BOATING_TEXT;
      const oldOutlook = str_(waters.rows[i][captainOutlookCol]);
      if (!oldOutlook || oldOutlook !== newOutlook) {
        waters.set(i, captainOutlookCol, newOutlook);
        writtenOutlook++;
        rowChanged = true;
      }
    }

    if (captainTipCol >= 0) {
      const newTip = boatingRelevant ? buildCaptainTipUi_(captainParams) : CAPTAIN_NOT_BOATING_TEXT;
      const oldTip = str_(waters.rows[i][captainTipCol]);
      if (!oldTip || oldTip !== newTip) {
        waters.set(i, captainTipCol, newTip);
        writtenTip++;
        rowChanged = true;
      }
    }

    if (!rowChanged) unchangedRows++;
  }

  if ((writtenOutlook > 0 || writtenTip > 0) && !DEBUG_DRY_RUN) {
    waters.writeTouchedColumnsBack(log);
  }

  log.info("Backfill captain UI fields complete", {
    total_active: totalActive,
    skipped_inactive: skippedInactive,
    written_outlook: writtenOutlook,
    written_tip: writtenTip,
    unchanged_rows: unchangedRows
  });
}

function validateWatersStatusCoverage_V670(ctx, log) {
  const waters = ctx.waters;
  const activeCol = waters.findColOptional(["is_active", "active"]);
  const bathingStatusCol = waters.findColOptional(["bathing_status"]);
  const visitStatusCol = waters.findColOptional(["visit_status"]);
  const lastUpdatedCol = waters.findColOptional(["last_updated"]);

  const summary = {
    active_rows: 0,
    active_with_bathing_status: 0,
    active_with_visit_status: 0,
    active_with_last_updated: 0,
    active_unresolved: 0
  };

  for (let i = 0; i < waters.rows.length; i++) {
    const isActive = activeCol < 0 ? true : !!waters.rows[i][activeCol];
    if (!isActive) continue;
    summary.active_rows++;

    const bathingStatus = bathingStatusCol >= 0 ? str_(waters.rows[i][bathingStatusCol]) : "";
    const visitStatus = visitStatusCol >= 0 ? str_(waters.rows[i][visitStatusCol]) : "";
    const lastUpdated = lastUpdatedCol >= 0 ? str_(waters.rows[i][lastUpdatedCol]) : "";

    if (bathingStatus) summary.active_with_bathing_status++;
    if (visitStatus) summary.active_with_visit_status++;
    if (lastUpdated) summary.active_with_last_updated++;
    if (!bathingStatus || !visitStatus || !lastUpdated) summary.active_unresolved++;
  }

  log.info("Waters status coverage", summary);
  return summary;
}

function runH4Audit_() {
  var ss = SpreadsheetApp.openById('102BRsJJlRSLgk-DgLAUDfUjREI9w-5br9TIyx5l_NTU');
  var master = ss.getSheetByName('Master');
  var wr = ss.getSheetByName('WaterReadings');
  var waters = ss.getSheetByName('Waters');
  var relations = ss.getSheetByName('_Relations') || ss.getSheetByName('Relations');

  // Row counts
  var mRows = master ? master.getLastRow() - 1 : 'MISSING';
  var wrRows = wr ? wr.getLastRow() - 1 : 'MISSING';
  var wRows = waters ? waters.getLastRow() - 1 : 'MISSING';
  var rRows = relations ? relations.getLastRow() - 1 : 'MISSING';
  Logger.log('AUDIT: Master rows=' + mRows + ' | WaterReadings rows=' + wrRows + ' | Waters rows=' + wRows + ' | Relations rows=' + rRows);

  // Check bb_260 and bb_283 in Master col A
  if (master) {
    var mData = master.getRange(2, 1, master.getLastRow()-1, 1).getValues();
    var bb260 = false, bb283 = false, dups = {};
    for (var i=0; i<mData.length; i++) {
      var v = String(mData[i][0]).trim();
      dups[v] = (dups[v]||0)+1;
      if (v==='260') bb260 = true;
      if (v==='283') bb283 = true;
    }
    var dupCount = Object.keys(dups).filter(function(k){return dups[k]>1;}).length;
    Logger.log('AUDIT Master: bb_260=' + bb260 + ' | bb_283=' + bb283 + ' | duplicate_bb_nrs=' + dupCount);
  }

  // Check bb_260 and bb_283 in WaterReadings col AB
  if (wr) {
    var wrData = wr.getRange(2, 28, wr.getLastRow()-1, 1).getValues();
    var wr260=0, wr283=0, wrEmpty=0;
    for (var j=0; j<wrData.length; j++) {
      var v2 = String(wrData[j][0]).trim();
      if (v2==='260'||v2==='260.0') wr260++;
      else if (v2==='283'||v2==='283.0') wr283++;
      else if (!v2||v2==='') wrEmpty++;
    }
    Logger.log('AUDIT WR bb_nr: count_260=' + wr260 + ' | count_283=' + wr283 + ' | empty=' + wrEmpty);
  }

  // Check Waters for missing water_id
  if (waters) {
    var wData = waters.getRange(2, 1, waters.getLastRow()-1, 1).getValues();
    var missingId = wData.filter(function(r){return !r[0];}).length;
    Logger.log('AUDIT Waters: total=' + wData.length + ' | missing_water_id=' + missingId);
  }

  Logger.log('AUDIT COMPLETE');
}


function runH4Audit() { runH4Audit_(); }


/* =========================
   PHASE I – PRODUCTION LOCK & STABILITY MONITORING
   ========================= */

function installPhaseI_() {
  // Step 1: Remove ALL existing automation triggers
  removeAutomation_V670();

  var ss = SpreadsheetApp.getActive();
  var log = makeLogger_(ss);

  // Brandenburg: every 6h → hours 0, 6, 12, 18 (UTC+1/Europe/Berlin approx)
  ScriptApp.newTrigger('runBrandenburgOnly_V670').timeBased().atHour(0).everyDays(1).inTimezone('Europe/Berlin').create();
  ScriptApp.newTrigger('runBrandenburgOnly_V670').timeBased().atHour(6).everyDays(1).inTimezone('Europe/Berlin').create();
  ScriptApp.newTrigger('runBrandenburgOnly_V670').timeBased().atHour(12).everyDays(1).inTimezone('Europe/Berlin').create();
  ScriptApp.newTrigger('runBrandenburgOnly_V670').timeBased().atHour(18).everyDays(1).inTimezone('Europe/Berlin').create();

  // Berlin: every 6h offset +2h → hours 2, 8, 14, 20 (never parallel with Brandenburg)
  ScriptApp.newTrigger('runBerlinOnly_V670').timeBased().atHour(2).everyDays(1).inTimezone('Europe/Berlin').create();
  ScriptApp.newTrigger('runBerlinOnly_V670').timeBased().atHour(8).everyDays(1).inTimezone('Europe/Berlin').create();
  ScriptApp.newTrigger('runBerlinOnly_V670').timeBased().atHour(14).everyDays(1).inTimezone('Europe/Berlin').create();
  ScriptApp.newTrigger('runBerlinOnly_V670').timeBased().atHour(20).everyDays(1).inTimezone('Europe/Berlin').create();

  log.info('PHASE_I triggers installed', {
    Brandenburg: '0h/6h/12h/18h',
    Berlin: '2h/8h/14h/20h',
    runAll_trigger: 'DISABLED',
    parallel_guard: 'withScriptLock active'
  });
  log.flush();
  Logger.log('PHASE_I: 8 triggers installed. Brandenburg=0/6/12/18h Berlin=2/8/14/20h. runAll=DISABLED.');
}

function removePhaseI_() {
  removeAutomation_V670();
  var ss = SpreadsheetApp.getActive();
  var log = makeLogger_(ss);
  log.info('PHASE_I triggers removed');
  log.flush();
  Logger.log('PHASE_I: all triggers removed.');
}

function listPhaseI_() {
  var triggers = ScriptApp.getProjectTriggers();
  var result = triggers.map(function(t) {
    return t.getHandlerFunction() + ' | ' + t.getEventType();
  });
  Logger.log('PHASE_I active triggers (' + result.length + '):\n' + result.join('\n'));
}

function runPhaseIStabilityReport_() {
  var ss = SpreadsheetApp.openById('102BRsJJlRSLgk-DgLAUDfUjREI9w-5br9TIyx5l_NTU');
  var logSheet = ss.getSheetByName('_Log');
  if (!logSheet) { Logger.log('ERROR: _Log sheet not found'); return; }

  var lastRow = logSheet.getLastRow();
  if (lastRow < 2) { Logger.log('No log data found'); return; }

  var data = logSheet.getRange(2, 1, lastRow - 1, 4).getValues();

  // Parse entries for last 48h
  var now = new Date();
  var cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  var bbRuns = 0, bbErrors = 0, bbWarns = 0, bbSkips = 0;
  var berlinRuns = 0, berlinErrors = 0, berlinWarns = 0, berlinSkips = 0;
  var totalEntries = 0;

  // Collect START timestamps per function for runtime calc
  var bbStartTimes = [], bbEndTimes = [];
  var berlinStartTimes = [], berlinEndTimes = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var tsStr = String(row[0]);
    var level = String(row[1]);
    var msg = String(row[2]);

    // Parse timestamp dd.MM.yyyy HH:mm
    var parts = tsStr.match(/(d{2}).(d{2}).(d{4}) (d{2}):(d{2})/);
    if (!parts) continue;
    var ts = new Date(parseInt(parts[3]), parseInt(parts[2])-1, parseInt(parts[1]),
                     parseInt(parts[4]), parseInt(parts[5]));
    if (ts < cutoff) continue;

    totalEntries++;

    if (msg.indexOf('runBrandenburgOnly_V670') !== -1) {
      if (msg.indexOf('START') !== -1) { bbRuns++; bbStartTimes.push(ts); }
      if (msg.indexOf('DONE') !== -1) bbEndTimes.push(ts);
      if (level === 'ERROR') bbErrors++;
      if (level === 'WARN' && msg.indexOf('SKIP') !== -1) bbSkips++;
      if (level === 'WARN' && msg.indexOf('SKIP') === -1) bbWarns++;
    }
    if (msg.indexOf('runBerlinOnly_V670') !== -1) {
      if (msg.indexOf('START') !== -1) { berlinRuns++; berlinStartTimes.push(ts); }
      if (msg.indexOf('DONE') !== -1) berlinEndTimes.push(ts);
      if (level === 'ERROR') berlinErrors++;
      if (level === 'WARN' && msg.indexOf('SKIP') !== -1) berlinSkips++;
      if (level === 'WARN' && msg.indexOf('SKIP') === -1) berlinWarns++;
    }
  }

  // Avg runtime estimation (minutes between paired START/DONE)
  function avgRuntime(starts, ends) {
    if (!starts.length || !ends.length) return 'N/A';
    var total = 0; var count = Math.min(starts.length, ends.length);
    for (var j = 0; j < count; j++) {
      total += (ends[j].getTime() - starts[j].getTime()) / 60000;
    }
    return (total / count).toFixed(1) + ' min';
  }

  var report = [
    '===== PHASE I STABILITY REPORT =====',
    'Periode: letzte 48h | Generiert: ' + Utilities.formatDate(now, 'Europe/Berlin', 'dd.MM.yyyy HH:mm'),
    '',
    '--- Brandenburg (runBrandenburgOnly_V670) ---',
    'Laufanzahl:           ' + bbRuns,
    'Fehler:               ' + bbErrors,
    'Warns:                ' + bbWarns,
    'Skips (Lock busy):    ' + bbSkips,
    'Fehlerquote:          ' + (bbRuns > 0 ? ((bbErrors/bbRuns)*100).toFixed(1) : '0') + '%',
    'Avg Laufzeit:         ' + avgRuntime(bbStartTimes, bbEndTimes),
    '',
    '--- Berlin (runBerlinOnly_V670) ---',
    'Laufanzahl:           ' + berlinRuns,
    'Fehler:               ' + berlinErrors,
    'Warns:                ' + berlinWarns,
    'Skips (Lock busy):    ' + berlinSkips,
    'Fehlerquote:          ' + (berlinRuns > 0 ? ((berlinErrors/berlinRuns)*100).toFixed(1) : '0') + '%',
    'Avg Laufzeit:         ' + avgRuntime(berlinStartTimes, berlinEndTimes),
    '',
    '--- Gesamtsystem ---',
    'Log-Eintraege 48h:    ' + totalEntries,
    'Erwartete BB-Runs:    8 (alle 6h x 2 Tage)',
    'Erwartete BE-Runs:    8 (alle 6h x 2 Tage)',
    'Parallele Runs:       ' + (bbSkips + berlinSkips) + ' (Lock-Skips)',
    '====================================='
  ].join('\n');

  Logger.log(report);
}

function runPhaseI_() { installPhaseI_(); }


// Phase I public entry points
function runPhaseI() { installPhaseI_(); }
function removePhaseI() { removePhaseI_(); }
function listPhaseI() { listPhaseI_(); }
function runPhaseIStabilityReport() { runPhaseIStabilityReport_(); }


// ===== READ-ONLY WARN ANALYSE (PHASE I MONITORING) =====
function analyseWarnLogs() {
  var ss = SpreadsheetApp.getActive();
    var sh = ss.getSheetByName('_Log');
      if (!sh) { Logger.log('ERROR: _Log nicht gefunden'); return; }
        var data = sh.getDataRange().getValues();
          var warns = {};
            var totalWarn = 0;
              var totalRows = data.length - 1; // minus header
                for (var i = 1; i < data.length; i++) {
                    var level = String(data[i][1]).trim().toUpperCase();
                        if (level !== 'WARN' && level !== 'WARNING') continue;
                            totalWarn++;
                                var msg = String(data[i][2]).trim();
                                    // Normiere auf Typ-Schluessel
                                        var key;
                                            if (msg.indexOf('skipped') !== -1) key = 'XML record skipped';
                                                else if (msg.indexOf('fallback') !== -1) key = 'matched via fallback';
                                                    else if (msg.indexOf('Master sync missed') !== -1) key = 'Master sync missed';
                                                        else if (msg.indexOf('SKIP') !== -1 || msg.indexOf('Lock busy') !== -1) key = 'Lock busy / SKIP';
                                                            else if (msg.indexOf('no data') !== -1 || msg.indexOf('no_data') !== -1) key = 'no data';
                                                                else if (msg.indexOf('missing') !== -1) key = 'missing';
                                                                    else key = msg.substring(0, 60);
                                                                        warns[key] = (warns[key] || 0) + 1;
                                                                          }
                                                                            // Sortiere nach Haeufigkeit
                                                                              var sorted = Object.keys(warns).sort(function(a,b){ return warns[b]-warns[a]; });
                                                                                var lines = ['===== WARN ANALYSE – _Log (Phase I) =====',
                                                                                    'Gesamt-Zeilen im Log: ' + totalRows,
                                                                                        'Gesamt WARN: ' + totalWarn,
                                                                                            ''];
                                                                                              sorted.forEach(function(k) {
                                                                                                  var pct = ((warns[k]/totalWarn)*100).toFixed(1);
                                                                                                      lines.push(warns[k] + 'x (' + pct + '%)  →  ' + k);
                                                                                                        });
                                                                                                          lines.push('');
                                                                                                            lines.push('Top 1: ' + sorted[0] + ' = ' + warns[sorted[0]]);
                                                                                                              Logger.log(lines.join('\n'));
                                                                                                              }
                                                                                                              

// === TEMP DIAGNOSTIC - REMOVE AFTER USE ===
function diagBridgeMapping_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('BridgeMapping');
  if (!sh) { Logger.log('SHEET NOT FOUND'); return; }
  var data = sh.getDataRange().getValues();
  Logger.log('ROWS: ' + data.length);
  Logger.log('HEADERS: ' + JSON.stringify(data[0]));
  var confIdx = data[0].map(String).map(function(h){return h.toLowerCase().trim();}).indexOf('confidence');
  Logger.log('CONF_IDX: ' + confIdx);
  var counts = {};
  for (var i = 1; i < Math.min(data.length, 300); i++) {
    var v = String(data[i][confIdx] || '').trim();
    counts[v] = (counts[v] || 0) + 1;
  }
  Logger.log('CONF_VALUES: ' + JSON.stringify(counts));
  // Sample first 5 rows confidence
  for (var j = 1; j <= 5; j++) {
    Logger.log('ROW'+j+': old='+data[j][0]+' conf=['+data[j][confIdx]+'] raw_col3=['+data[j][3]+']');
  }
}
// === END TEMP DIAGNOSTIC ===

function fixBridgeMappingHeader_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('BridgeMapping');
  if (!sh) { Logger.log('SHEET NOT FOUND'); return; }
  var headerRow = sh.getRange(1, 1, 1, 8).getValues()[0];
  Logger.log('BEFORE: ' + JSON.stringify(headerRow));
  // Fix D1: match_confidence → confidence
  var d1 = String(sh.getRange(1, 4).getValue()).trim();
  Logger.log('D1 current: [' + d1 + ']');
  if (d1 !== 'confidence') {
    sh.getRange(1, 4).setValue('confidence');
    Logger.log('D1 FIXED: match_confidence → confidence');
  } else {
    Logger.log('D1 already correct');
  }
  // Clear bridge cache
  try {
    CacheService.getScriptCache().remove('bridgeMapping_v1');
    Logger.log('Cache bridgeMapping_v1 cleared');
  } catch(e) { Logger.log('Cache clear error: ' + e); }
  var headerAfter = sh.getRange(1, 1, 1, 8).getValues()[0];
  Logger.log('AFTER: ' + JSON.stringify(headerAfter));
  Logger.log('FIX COMPLETE');
}

function fixBridgeMappingHeader() { fixBridgeMappingHeader_(); }