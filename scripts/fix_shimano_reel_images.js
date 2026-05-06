const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const IMAGE_DIR = '/Users/tommy/Pictures/images/shimano_reels';
const STATIC_PREFIX = 'https://static.gearsage.club/gearsage/Gearimg/images/shimano_reels/';
const REPORT_FILE = gearDataPaths.resolveDataRaw('shimano_reel_images_audit.json');

const WORKBOOKS = [
  {
    file: gearDataPaths.resolveDataRaw('shimano_spinning_reels_import.xlsx'),
    sheet: 'reel',
    filter: (row) => normalizeText(row.id).startsWith('SRE'),
  },
  {
    file: gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import.xlsx'),
    sheet: 'reel',
    filter: (row) => normalizeText(row.id).startsWith('SRE'),
  },
  {
    file: gearDataPaths.resolveExcel('reel.xlsx'),
    sheet: 'reel',
    filter: (row) => normalizeText(row.id).startsWith('SRE') || normalizeText(row.brand_id) === '1',
  },
];

const NORMALIZED_FILES = [
  gearDataPaths.resolveDataRaw('shimano_spinning_reel_normalized.json'),
  gearDataPaths.resolveDataRaw('shimano_baitcasting_reel_normalized.json'),
];

const MANUAL_SOURCES = {
  SRE5004: {
    imageUrl: 'https://japantackle.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/s/h/shimano23antaresdcmd.jpg',
    filename: 'ANTARES DC MD_main.jpg',
  },
  SRE5058: {
    filename: '24 SLX 70_main.jpeg',
  },
  SRE5082: {
    filename: '22 CURADO 200_main.jpg',
  },
};

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sanitizeFilename(name) {
  return normalizeText(name).replace(/[\\/*?:"<>|]/g, '_').trim();
}

function detectExtension(url) {
  const lower = normalizeText(url).toLowerCase();
  if (lower.includes('.png')) return '.png';
  if (lower.includes('.webp')) return '.webp';
  if (lower.includes('.jpeg')) return '.jpeg';
  return '.jpg';
}

function filenameFromStaticUrl(url) {
  const value = normalizeText(url);
  if (!value.startsWith(STATIC_PREFIX)) return '';
  return decodeURIComponent(value.slice(STATIC_PREFIX.length));
}

function staticUrl(filename) {
  return `${STATIC_PREFIX}${encodeURIComponent(filename)}`;
}

function fileExistsNonZero(filename) {
  const filePath = path.join(IMAGE_DIR, filename);
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

function buildLocalFileIndex() {
  if (!fs.existsSync(IMAGE_DIR)) return new Map();
  const index = new Map();
  for (const filename of fs.readdirSync(IMAGE_DIR)) {
    const fullPath = path.join(IMAGE_DIR, filename);
    if (!fs.statSync(fullPath).isFile() || fs.statSync(fullPath).size === 0) continue;
    const stem = filename.replace(/_main\.[^.]+$/i, '');
    const key = normalizeKey(stem);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(filename);
  }
  return index;
}

function normalizeKey(value) {
  return normalizeText(value)
    .replace(/^NEW\s+/i, '')
    .replace(/[（(].*?[）)]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '')
    .toUpperCase();
}

function loadNormalizedSources() {
  const byFilename = new Map();
  const byModel = new Map();

  for (const file of NORMALIZED_FILES) {
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const items = Array.isArray(data) ? data : [];
    for (const item of items) {
      const model = normalizeText(item.model_name || item.model || '');
      const imageUrl = normalizeText(item.main_image_url);
      if (!model || !imageUrl) continue;
      const localPath = normalizeText(item.local_image_path || item.downloaded_image_path);
      const filename = localPath
        ? path.basename(localPath)
        : `${sanitizeFilename(model)}_main${detectExtension(imageUrl)}`;
      const source = { model, imageUrl, filename, sourceFile: path.basename(file) };
      byFilename.set(filename, source);

      const modelKey = normalizeKey(model);
      if (!byModel.has(modelKey)) byModel.set(modelKey, []);
      byModel.get(modelKey).push(source);

      const pageTitle = normalizeText(item.page_title || '');
      if (pageTitle) {
        const pageModel = normalizeText(pageTitle.split('|')[0]);
        const pageKey = normalizeKey(pageModel);
        if (pageKey) {
          if (!byModel.has(pageKey)) byModel.set(pageKey, []);
          byModel.get(pageKey).push(source);
        }
      }
    }
  }

  return { byFilename, byModel };
}

function extractMainImageFromPage(url) {
  const html = execFileSync('curl', ['-L', '-s', '-A', 'Mozilla/5.0', '--max-time', '30', url], {
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  });
  const candidates = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /https:\/\/dassets2\.shimano\.com\/[^"'\s<>]+_main\.[^"'\s<>]+/i,
  ];
  for (const regex of candidates) {
    const match = html.match(regex);
    if (match) return match[1] || match[0];
  }
  return '';
}

function chooseLocalFilename(row, localIndex) {
  const keys = [
    normalizeKey(row.alias),
    normalizeKey(row.model),
    normalizeKey(normalizeText(row.model).replace(/[（(](\d+).*[）)]/, ' $1')),
  ].filter(Boolean);

  for (const key of keys) {
    const candidates = localIndex.get(key);
    if (candidates && candidates.length) return candidates[0];
  }

  return '';
}

function chooseSource(row, currentFilename, sources, localIndex) {
  const localFilename = chooseLocalFilename(row, localIndex);
  if (localFilename) {
    return {
      model: normalizeText(row.model),
      imageUrl: '',
      filename: localFilename,
      sourceFile: 'local_existing',
      reason: 'local_existing',
    };
  }

  const manual = MANUAL_SOURCES[normalizeText(row.id)];
  if (manual) {
    return {
      model: normalizeText(row.model),
      imageUrl: manual.imageUrl || (manual.sourceUrl ? extractMainImageFromPage(manual.sourceUrl) : ''),
      filename: manual.filename,
      sourceFile: 'manual_official_url',
      reason: 'manual_official_url',
    };
  }

  if (currentFilename && sources.byFilename.has(currentFilename)) {
    return { ...sources.byFilename.get(currentFilename), filename: currentFilename, reason: 'current_filename' };
  }

  const modelKey = normalizeKey(row.model);
  const candidates = sources.byModel.get(modelKey) || [];
  if (candidates.length) {
    const exact = candidates.find((candidate) => normalizeKey(candidate.model) === modelKey) || candidates[0];
    const filename = currentFilename || exact.filename;
    return { ...exact, filename, reason: 'model_match' };
  }

  return null;
}

function downloadImage(sourceUrl, filename) {
  if (!sourceUrl) return false;
  const outPath = path.join(IMAGE_DIR, filename);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  execFileSync('curl', ['-L', '-s', '--fail', '-A', 'Mozilla/5.0', '--max-time', '45', '-o', outPath, sourceUrl], {
    maxBuffer: 30 * 1024 * 1024,
  });
  return fileExistsNonZero(filename);
}

function normalizeWorkbook(workbookConfig, sources, localIndex) {
  const workbook = XLSX.readFile(workbookConfig.file);
  const sheet = workbook.Sheets[workbookConfig.sheet];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const headerRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headers = headerRows[0] || Object.keys(rows[0] || {});

  const report = {
    file: path.relative(REPO_ROOT, workbookConfig.file),
    total_shimano_rows: 0,
    updated_images: 0,
    already_present: 0,
    downloaded: 0,
    missing_source: [],
    download_failed: [],
  };

  let changed = false;

  for (const row of rows) {
    if (!workbookConfig.filter(row)) continue;
    report.total_shimano_rows += 1;

    const currentFilename = filenameFromStaticUrl(row.images);
    const localOk = currentFilename && fileExistsNonZero(currentFilename);
    if (localOk) {
      report.already_present += 1;
      continue;
    }

    const source = chooseSource(row, currentFilename, sources, localIndex);
    if (!source || !source.filename) {
      report.missing_source.push({ id: row.id, model: row.model, images: row.images });
      continue;
    }

    if (row.images !== staticUrl(source.filename)) {
      row.images = staticUrl(source.filename);
      report.updated_images += 1;
      changed = true;
    }

    if (fileExistsNonZero(source.filename)) {
      report.already_present += 1;
      continue;
    }

    if (!source.imageUrl) {
      report.missing_source.push({ id: row.id, model: row.model, images: row.images, filename: source.filename });
      continue;
    }

    try {
      if (downloadImage(source.imageUrl, source.filename)) {
        report.downloaded += 1;
      } else {
        report.download_failed.push({ id: row.id, model: row.model, filename: source.filename, sourceUrl: source.imageUrl });
      }
    } catch (error) {
      report.download_failed.push({
        id: row.id,
        model: row.model,
        filename: source.filename,
        sourceUrl: source.imageUrl,
        error: error.message,
      });
    }
  }

  if (changed) {
    workbook.Sheets[workbookConfig.sheet] = XLSX.utils.json_to_sheet(rows, { header: headers });
    XLSX.writeFile(workbook, workbookConfig.file);
  }

  return report;
}

function main() {
  const sources = loadNormalizedSources();
  const localIndex = buildLocalFileIndex();
  const reports = WORKBOOKS.map((workbookConfig) => normalizeWorkbook(workbookConfig, sources, localIndex));
  const summary = {
    generated_at: new Date().toISOString(),
    image_dir: IMAGE_DIR,
    static_prefix: STATIC_PREFIX,
    reports,
  };
  fs.writeFileSync(REPORT_FILE, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main();
