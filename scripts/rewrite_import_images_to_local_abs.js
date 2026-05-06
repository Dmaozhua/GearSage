const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const DATA_RAW_DIR = gearDataPaths.dataRawDir;
const LOCAL_IMAGE_ROOT = '/Users/tommy/Pictures/images';

const TARGETS = {
  'evergreen_lure_import.xlsx': { sheet: 'lure', imageDir: 'evergreen_lures' },
  'evergreen_rod_import.xlsx': { sheet: 'rod', imageDir: 'evergreen_rods' },
};

function norm(v) {
  return String(v === 0 ? '0' : (v || '')).trim();
}

function decodeName(name) {
  try {
    return decodeURIComponent(name);
  } catch (_) {
    return name;
  }
}

function extractFileName(imageValue) {
  const value = norm(imageValue).replace(/\\/g, '/');
  if (!value) return '';
  const clean = value.split('?')[0].split('#')[0];
  return decodeName(path.basename(clean));
}

function rewriteFile(fileName) {
  const cfg = TARGETS[fileName];
  if (!cfg) {
    throw new Error(`unsupported file: ${fileName}`);
  }

  const fullPath = path.join(DATA_RAW_DIR, fileName);
  const wb = XLSX.readFile(fullPath);
  const sheetName = wb.SheetNames.includes(cfg.sheet) ? cfg.sheet : wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

  let updated = 0;
  let unresolved = 0;
  const unresolvedRows = [];

  rows.forEach((row) => {
    const fileNameFromRow = extractFileName(row.images);
    if (!fileNameFromRow) {
      row.images = '';
      unresolved += 1;
      unresolvedRows.push({
        id: norm(row.id),
        model: norm(row.model),
        reason: 'missing image basename',
      });
      return;
    }

    const absPath = path.join(LOCAL_IMAGE_ROOT, cfg.imageDir, fileNameFromRow);
    row.images = absPath;
    updated += 1;

    if (!fs.existsSync(absPath)) {
      unresolved += 1;
      unresolvedRows.push({
        id: norm(row.id),
        model: norm(row.model),
        path: absPath,
        reason: 'file not found',
      });
    }
  });

  wb.Sheets[sheetName] = XLSX.utils.json_to_sheet(rows);
  XLSX.writeFile(wb, fullPath);

  return {
    file: fileName,
    sheet: sheetName,
    rows: rows.length,
    updated,
    unresolved,
    unresolved_samples: unresolvedRows.slice(0, 10),
  };
}

function main() {
  const inputFiles = process.argv.slice(2).map((v) => norm(v)).filter(Boolean);
  const files = inputFiles.length ? inputFiles : Object.keys(TARGETS);
  const report = files.map((file) => rewriteFile(file));
  console.log(JSON.stringify({ report }, null, 2));
}

main();
