const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATA_RAW_DIR = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw';
const LOCAL_IMAGE_ROOT = '/Users/tommy/Pictures/images';
const URL_BASE = 'https://static.gearsage.club/gearsage/Gearimg/images';

const TARGETS = [
  { file: 'evergreen_lure_import.xlsx', sheet: 'lure', dir: 'evergreen_lures' },
  { file: 'evergreen_rod_import.xlsx', sheet: 'rod', dir: 'evergreen_rods' },
];

function norm(v) {
  return String(v === 0 ? '0' : (v || '')).trim();
}

function decodeMaybe(value) {
  try {
    return decodeURIComponent(value);
  } catch (_) {
    return value;
  }
}

function pickBaseName(row) {
  const candidates = [row.images, row.local_image_path, row.main_image_url]
    .map((v) => norm(v))
    .filter(Boolean);

  for (const v of candidates) {
    const clean = v.split('?')[0].split('#')[0].replace(/\\/g, '/');
    const base = path.basename(clean);
    if (!base) continue;
    return decodeMaybe(base);
  }
  return '';
}

function run() {
  const report = [];

  for (const target of TARGETS) {
    const excelPath = path.join(DATA_RAW_DIR, target.file);
    const wb = XLSX.readFile(excelPath);
    const sheetName = wb.SheetNames.includes(target.sheet) ? target.sheet : wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

    let updated = 0;
    let unresolved = 0;
    const unresolvedSamples = [];

    rows.forEach((row) => {
      const baseName = pickBaseName(row);
      if (!baseName) {
        row.images = '';
        unresolved += 1;
        if (unresolvedSamples.length < 10) {
          unresolvedSamples.push({ id: norm(row.id), model: norm(row.model), reason: 'basename missing' });
        }
        return;
      }

      const localPath = path.join(LOCAL_IMAGE_ROOT, target.dir, baseName);
      if (!fs.existsSync(localPath)) {
        row.images = '';
        unresolved += 1;
        if (unresolvedSamples.length < 10) {
          unresolvedSamples.push({ id: norm(row.id), model: norm(row.model), file: baseName, reason: 'local file not found' });
        }
        return;
      }

      // Keep exact local file name, do not rename/normalize.
      row.images = `${URL_BASE}/${target.dir}/${baseName}`;
      updated += 1;
    });

    wb.Sheets[sheetName] = XLSX.utils.json_to_sheet(rows);
    XLSX.writeFile(wb, excelPath);

    report.push({
      file: target.file,
      sheet: sheetName,
      rows: rows.length,
      updated,
      unresolved,
      sample: rows.slice(0, 3).map((row) => row.images),
      unresolvedSamples,
    });
  }

  console.log(JSON.stringify({ report }, null, 2));
}

run();
