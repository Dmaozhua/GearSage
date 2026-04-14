const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATA_RAW_DIR = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw';
const LOCAL_IMAGE_ROOT = '/Users/tommy/Pictures/images';
const URL_BASE = 'https://static.gearsage.club/gearsage/Gearimg/images';

const SHEET_PRIORITY = ['hook', 'lure', 'line', 'reel', 'rod'];

function norm(v) {
  return String(v === 0 ? '0' : (v || '')).trim();
}

function normalizeStem(text) {
  return norm(text)
    .replace(/\.[A-Za-z0-9]+$/, '')
    .replace(/[\s\-–—/\\|+&.,'"`~!@#$%^*(){}\[\]:;<>?=]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function encodePath(parts) {
  return parts.map((part) => encodeURIComponent(part)).join('/');
}

function getMasterSheetName(wb) {
  for (const name of SHEET_PRIORITY) {
    if (wb.SheetNames.includes(name)) return name;
  }
  return wb.SheetNames[0];
}

function inferDirFromImagePath(imageValue) {
  const value = norm(imageValue).replace(/\\/g, '/');
  if (!value) return '';

  const absMarker = '/Users/tommy/Pictures/images/';
  const absIndex = value.indexOf(absMarker);
  if (absIndex >= 0) {
    const rest = value.slice(absIndex + absMarker.length);
    const seg = rest.split('/').filter(Boolean);
    if (seg.length) return seg[0];
  }

  const imagesMarker = 'images/';
  const markerIndex = value.indexOf(imagesMarker);
  if (markerIndex >= 0) {
    const rest = value.slice(markerIndex + imagesMarker.length);
    const seg = rest.split('/').filter(Boolean);
    if (seg.length >= 2 && seg[0] === 'hook') {
      return `${seg[1]}_hooks`;
    }
    if (seg.length >= 2 && seg[0] === 'lure') {
      return `${seg[1]}_lures`;
    }
    if (seg.length >= 2 && seg[0] === 'rod') {
      return `${seg[1]}_rods`;
    }
    if (seg.length >= 2 && seg[0] === 'reel') {
      return `${seg[1]}_reels`;
    }
    if (seg.length >= 2 && seg[0] === 'line') {
      return `${seg[1]}_lines`;
    }
    if (seg.length) return seg[0];
  }

  return '';
}

function collectTopDirs(rootDir) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((ent) => ent.isDirectory())
    .map((ent) => ent.name);
}

function inferDirByFileName(importFileName, sheetName, topDirs) {
  const base = importFileName.replace(/_import\.xlsx$/i, '');
  const parts = base.split('_');
  const brand = parts[0] || '';

  if (sheetName === 'hook') {
    const candidates = [`${brand.toUpperCase()}_hooks`, `${brand}_hooks`];
    for (const c of candidates) {
      if (topDirs.includes(c)) return c;
    }
  }
  if (sheetName === 'lure') {
    const candidates = [`${brand.toUpperCase()}_lures`, `${brand}_lures`];
    for (const c of candidates) {
      if (topDirs.includes(c)) return c;
    }
  }
  if (sheetName === 'rod') {
    const candidates = [`${brand.toUpperCase()}_rods`, `${brand}_rods`];
    for (const c of candidates) {
      if (topDirs.includes(c)) return c;
    }
  }
  if (sheetName === 'reel') {
    if (topDirs.includes(`${brand}_reels`)) return `${brand}_reels`;
    if (topDirs.includes(`${brand.toUpperCase()}_reels`)) return `${brand.toUpperCase()}_reels`;
  }
  if (sheetName === 'line') {
    if (topDirs.includes(`${brand}_lines`)) return `${brand}_lines`;
    if (topDirs.includes(`${brand.toUpperCase()}_lines`)) return `${brand.toUpperCase()}_lines`;
  }

  return '';
}

function buildFileIndex(dirPath) {
  const files = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((ent) => ent.isFile())
    .map((ent) => ent.name);

  const byExact = new Map();
  const byStem = new Map();

  files.forEach((file) => {
    byExact.set(file, file);
    const stem = normalizeStem(path.parse(file).name);
    if (stem && !byStem.has(stem)) byStem.set(stem, file);
  });

  return { files, byExact, byStem };
}

function pickImageFile(row, fileIndex) {
  const current = norm(row.images).replace(/\\/g, '/');
  let currentBase = path.basename(current);
  try {
    currentBase = decodeURIComponent(currentBase);
  } catch (_) {
    // keep original basename if decode fails
  }
  if (currentBase && fileIndex.byExact.has(currentBase)) {
    return fileIndex.byExact.get(currentBase);
  }

  const model = norm(row.model);
  const modelStem = normalizeStem(model);
  if (modelStem && fileIndex.byStem.has(modelStem)) {
    return fileIndex.byStem.get(modelStem);
  }

  if (modelStem) {
    const partial = fileIndex.files.find((file) => {
      const stem = normalizeStem(path.parse(file).name);
      return stem && (stem.includes(modelStem) || modelStem.includes(stem));
    });
    if (partial) return partial;
  }

  return '';
}

function main() {
  const cliFiles = process.argv.slice(2).map((v) => norm(v)).filter(Boolean);
  const cliFileSet = new Set(cliFiles);
  const topDirs = collectTopDirs(LOCAL_IMAGE_ROOT);
  const files = fs
    .readdirSync(DATA_RAW_DIR)
    .filter((f) => f.endsWith('_import.xlsx'))
    .filter((f) => !cliFileSet.size || cliFileSet.has(f))
    .sort();

  const report = [];
  const unresolved = [];

  files.forEach((fileName) => {
    const fullPath = path.join(DATA_RAW_DIR, fileName);
    const wb = XLSX.readFile(fullPath);
    const masterSheet = getMasterSheetName(wb);
    const ws = wb.Sheets[masterSheet];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!rows.length || !Object.prototype.hasOwnProperty.call(rows[0], 'images')) {
      report.push({ file: fileName, sheet: masterSheet, rows: rows.length, updated: 0, unresolved: rows.length, dir: '' });
      return;
    }

    let imageDir = '';
    for (const row of rows) {
      imageDir = inferDirFromImagePath(row.images);
      if (imageDir) break;
    }
    if (!imageDir) {
      imageDir = inferDirByFileName(fileName, masterSheet, topDirs);
    }

    const dirPath = imageDir ? path.join(LOCAL_IMAGE_ROOT, imageDir) : '';
    if (!imageDir || !fs.existsSync(dirPath)) {
      rows.forEach((row) => {
        unresolved.push({
          file: fileName,
          id: norm(row.id),
          model: norm(row.model),
          reason: `image dir not found: ${imageDir || '(empty)'}`,
        });
      });
      report.push({ file: fileName, sheet: masterSheet, rows: rows.length, updated: 0, unresolved: rows.length, dir: imageDir });
      return;
    }

    const fileIndex = buildFileIndex(dirPath);
    let updated = 0;
    let miss = 0;

    rows.forEach((row) => {
      const pickedFile = pickImageFile(row, fileIndex);
      if (!pickedFile) {
        row.images = '';
        miss += 1;
        unresolved.push({
          file: fileName,
          id: norm(row.id),
          model: norm(row.model),
          reason: `file not found in ${imageDir}`,
        });
        return;
      }

      const encodedPath = encodePath([imageDir, pickedFile]);
      row.images = `${URL_BASE}/${encodedPath}`;
      updated += 1;
    });

    wb.Sheets[masterSheet] = XLSX.utils.json_to_sheet(rows);
    XLSX.writeFile(wb, fullPath);
    report.push({ file: fileName, sheet: masterSheet, rows: rows.length, updated, unresolved: miss, dir: imageDir });
  });

  console.log(JSON.stringify({ total_files: files.length, report, unresolved_count: unresolved.length, unresolved }, null, 2));
}

main();
