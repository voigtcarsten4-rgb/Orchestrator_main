/**
 * Benennt alle WaterData_Backup_* Sheets mit "_"-Präfix um,
 * sodass Glide sie nicht mehr als Data Source anzeigt.
 *
 * SAFE: Nur Umbenennung, kein Löschen. Vollständig reversibel.
 * Einmalig manuell ausführen via Apps Script Editor.
 */
function hideBackupSheetsFromGlide() {
  const ss = getOrchestratorSpreadsheet_();
  const sheets = ss.getSheets();
  const renamed = [];
  const skipped = [];

  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (name.startsWith('WaterData_Backup_') && !name.startsWith('_')) {
      const newName = '_' + name;
      sheet.setName(newName);
      renamed.push(name + ' → ' + newName);
    } else if (name.startsWith('_WaterData_Backup_')) {
      skipped.push(name + ' (bereits bereinigt)');
    }
  });

  const log = [];
  log.push('=== GlideCleanup: hideBackupSheetsFromGlide ===');
  log.push('Umbenannt (' + renamed.length + '):');
  renamed.forEach(r => log.push('  ' + r));
  if (skipped.length) {
    log.push('Übersprungen (' + skipped.length + '):');
    skipped.forEach(s => log.push('  ' + s));
  }
  log.push('FERTIG. Glide-Sync neu starten, dann verschwinden die Backup-Tables aus der Sidebar.');
  Logger.log(log.join('\n'));
}

/**
 * Macht hideBackupSheetsFromGlide() vollständig rückgängig.
 * Entfernt das "_"-Präfix von allen umbenannten Backup-Sheets.
 */
function restoreBackupSheetNames() {
  const ss = getOrchestratorSpreadsheet_();
  const sheets = ss.getSheets();
  const restored = [];

  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (name.startsWith('_WaterData_Backup_')) {
      const originalName = name.substring(1);
      sheet.setName(originalName);
      restored.push(name + ' → ' + originalName);
    }
  });

  Logger.log('Wiederhergestellt: ' + restored.length + ' Sheets\n' + restored.join('\n'));
}
