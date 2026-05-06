const path = require('path');

const DEFAULT_DATA_ROOT = '/Users/tommy/GearSage-data';

function dataRoot() {
  return process.env.GEARSAGE_DATA_ROOT || DEFAULT_DATA_ROOT;
}

function fromRoot(envName, ...segments) {
  return process.env[envName] || path.join(dataRoot(), ...segments);
}

function resolveDataRaw(...segments) {
  return path.join(module.exports.dataRawDir, ...segments);
}

function resolveExcel(...segments) {
  return path.join(module.exports.excelDir, ...segments);
}

function resolveWebp(...segments) {
  return path.join(module.exports.webpDir, ...segments);
}

function resolveReport(...segments) {
  return path.join(module.exports.reportDir, ...segments);
}

function resolveBackup(...segments) {
  return path.join(module.exports.backupDir, ...segments);
}

module.exports = {
  dataRoot: dataRoot(),
  dataRawDir: fromRoot('GEAR_DATA_RAW_DIR', 'data_raw'),
  excelDir: fromRoot('GEAR_EXCEL_DIR', 'rate', 'excel'),
  webpDir: fromRoot('GEAR_WEBP_DIR', 'rate', 'webp'),
  reportDir: fromRoot('GEAR_REPORT_DIR', 'reports'),
  backupDir: fromRoot('GEAR_BACKUP_DIR', 'backups'),
  resolveDataRaw,
  resolveExcel,
  resolveWebp,
  resolveReport,
  resolveBackup,
};
