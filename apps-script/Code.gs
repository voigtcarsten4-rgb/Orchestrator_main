/**
 * Orchestrator_main — Google Apps Script entry point.
 *
 * On first sync, run `clasp pull` locally (or trigger the
 * "Apps Script: Pull from Google" GitHub Action) to replace
 * this skeleton with your actual project files.
 *
 * After that, every commit on the deploy branch automatically
 * pushes to this Apps Script project via GitHub Actions.
 */

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'Orchestrator_main', ts: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function ping() {
  Logger.log('pong @ %s', new Date().toISOString());
  return 'pong';
}
