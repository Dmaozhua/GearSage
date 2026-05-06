const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const XLSX = require('xlsx');
const axios = require('axios');
const cheerio = require('cheerio');
const gearDataPaths = require('./gear_data_paths');

const OUTPUT_DIR = gearDataPaths.dataRawDir;
const NORMALIZED_PATH = path.join(OUTPUT_DIR, 'bkk_hook_normalized.json');
const EXCEL_PATH = path.join(OUTPUT_DIR, 'bkk_hook_import.xlsx');
const IMAGE_DIR = path.join(__dirname, '../GearSage-client/pkgGear/images/hook/BKK');
const TEMP_DIR = path.join(os.tmpdir(), 'gearsage_bkk_hook');

const BRAND_ID = 111;
const BRAND_NAME = 'BKK';
const ID_PREFIX = 'BHK';

const CATEGORY_CONFIGS = [
  {
    slug: 'technical-bass-hooks',
    type: '特种钩',
    subType: 'Technical Bass Hooks',
    typeTips: '特种钩 / Technical Bass Hooks',
  },
  {
    slug: 'jigheads',
    type: '挂钩',
    subType: 'Jigheads',
    typeTips: '挂钩 / Jigheads',
  },
  {
    slug: 'swimbait-hooks',
    type: '特种钩',
    subType: 'Swimbait Hooks',
    typeTips: '特种钩 / Swimbait Hooks',
  },
];

const MASTER_HEADERS = [
  'id',
  'brand_id',
  'model',
  'model_cn',
  'model_year',
  'alias',
  'type_tips',
  'images',
  'created_at',
  'updated_at',
  'description',
];

const DETAIL_HEADERS = [
  'id',
  'hookId',
  'brand',
  'sku',
  'type',
  'subType',
  'gapWidth',
  'coating',
  'size',
  'quantityPerPack',
  'price',
  'status',
  'created_at',
  'updated_at',
  'description',
];

const HTTP_CONFIG = {
  timeout: 30000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  },
};

const SWIFT_OCR_SOURCE_PATH = path.join(TEMP_DIR, 'bkk_spec_ocr.swift');
const SWIFT_OCR_BINARY_PATH = path.join(TEMP_DIR, 'bkk_spec_ocr');
const OCR_CACHE_PATH = path.join(TEMP_DIR, 'bkk_spec_ocr_cache.json');

const SWIFT_OCR_SOURCE = `import Foundation
import Vision
import AppKit

if CommandLine.arguments.count < 2 {
  fputs("missing image path\\n", stderr)
  exit(2)
}

let imagePath = CommandLine.arguments[1]
let url = URL(fileURLWithPath: imagePath)

guard let nsImage = NSImage(contentsOf: url) else {
  fputs("cannot load image\\n", stderr)
  exit(3)
}

var rect = NSRect(origin: .zero, size: nsImage.size)
guard let cgImage = nsImage.cgImage(forProposedRect: &rect, context: nil, hints: nil) else {
  fputs("cannot convert image\\n", stderr)
  exit(4)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
  try handler.perform([request])
} catch {
  fputs("vision request failed\\n", stderr)
  exit(5)
}

for obs in request.results ?? [] {
  if let best = obs.topCandidates(1).first {
    print(best.string)
  }
}
`;

const SPEC_IMAGE_VARIATION_MAP = {
  'jigheads尺寸图_refrax-jighead.png.webp': [
    '1/0 (5g)',
    '1/0 (7.5g)',
    '1/0 (10g)',
    '2/0 (5g)',
    '2/0 (7.5g)',
    '2/0 (10g)',
    '2/0 (15g)',
    '3/0 (7.5g)',
    '3/0 (10g)',
    '3/0 (15g)',
  ],
  'jigheads尺寸图_prisma-darting.png.webp': [
    '1/0 (1/8oz)',
    '1/0 (3/16oz)',
    '1/0 (1/4oz)',
    '1/0 (3/8oz)',
    '3/0 (1/8oz)',
    '3/0 (3/16oz)',
    '3/0 (1/4oz)',
    '3/0 (3/8oz)',
    '5/0 (1/2oz)',
    '5/0 (5/8oz)',
    '5/0 (3/4oz)',
    '5/0 (7/8oz)',
  ],
};

const OCR_LABEL_CACHE = new Map();

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function readJsonSafe(filePath, fallbackValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallbackValue;
  }
}

function writeJsonSafe(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.warn('[bkk_hook] failed to write cache:', error.message);
  }
}

async function getWithRetry(url, config = {}, maxAttempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await axios.get(url, config);
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 600));
      }
    }
  }
  throw lastError;
}

function decodeHtml(text) {
  return normalizeText(
    String(text || '')
      .replace(/&#8211;/g, '-')
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#038;/g, '&')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/<[^>]*>/g, ' ')
      .replace(/&hellip;/g, '...')
  );
}

function sanitizeFileName(name) {
  return normalizeText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 90);
}

function extractProductLinks(html) {
  const $ = cheerio.load(html);
  const links = new Set();
  $('.products-grid-full a[href]').each((_, a) => {
    const href = normalizeText($(a).attr('href'));
    if (!/^https:\/\/bkkhooks\.com\/products\/[a-z0-9-]+\/?$/.test(href)) {
      return;
    }
    if (href.includes('/products/categories/')) {
      return;
    }
    links.add(href.replace(/\/+$/, ''));
  });
  return [...links];
}

function selectMainImage($, model, sourceUrl) {
  const slug = sourceUrl.split('/').filter(Boolean).pop() || '';
  const imgs = $('img')
    .map((_, img) =>
      normalizeText($(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy-src'))
    )
    .get()
    .filter((src) => src.startsWith('https://') && /\/box\//i.test(src) && !/\.svg($|\?)/i.test(src));

  if (imgs.length === 0) {
    return '';
  }

  const genericPattern =
    /(category|designpage|history|banner|accessories|apparel|icon|locationicon|lone-diablo|super-slide|forged|ring-regular)/i;
  const secondaryPattern = /(pk|style|412x522|1000x1000)/i;
  const nameKeys = normalizeText(model)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length >= 4);

  const primary = imgs.find((src) => {
    const lower = src.toLowerCase();
    if (genericPattern.test(lower) || secondaryPattern.test(lower)) {
      return false;
    }
    if (lower.includes(slug.toLowerCase())) {
      return true;
    }
    return nameKeys.some((key) => lower.includes(key));
  });
  if (primary) {
    return primary;
  }

  const normal = imgs.find((src) => !genericPattern.test(src.toLowerCase()) && !secondaryPattern.test(src.toLowerCase()));
  if (normal) {
    return normal;
  }

  return imgs.find((src) => !genericPattern.test(src.toLowerCase())) || imgs[0];
}

function parseVariationRows($) {
  function parseRows(rows) {
    let sizes = [];
    let qtys = [];
    rows.forEach((cells) => {
      const head = normalizeText(cells[0]).toLowerCase();
      if (head === 'size' || head.includes('size')) {
        sizes = cells.slice(1).map((v) => normalizeText(v));
      }
      if (head === 'quantity' || head.includes('qty') || head.includes('quantity')) {
        qtys = cells.slice(1).map((v) => normalizeText(v));
      }
    });

    if (sizes.length === 0) {
      const weightRow = rows.find((cells) => {
        const head = normalizeText(cells[0]).toLowerCase();
        return head.includes('weight') || head.includes('oz') || head.includes('gram') || head.includes('g');
      });
      if (weightRow) {
        sizes = weightRow.slice(1).map((v) => normalizeText(v));
      }
    }

    const rowLen = sizes.length || qtys.length;
    if (rowLen === 0) {
      return [];
    }

    const items = [];
    for (let i = 0; i < rowLen; i += 1) {
      const size = sizes[i] || '';
      const quantityPerPack = qtys[i] || (qtys.length === 1 ? qtys[0] : '');
      items.push({
        sku: '',
        size,
        quantityPerPack,
        price: '',
        status: 'in_stock',
      });
    }
    return items;
  }

  const allItems = [];
  $('table').each((_, table) => {
    const rows = [];
    $(table).find('tr').each((__, tr) => {
      const cells = $(tr)
        .find('th,td')
        .map((___, td) => normalizeText($(td).text()))
        .get();
      if (cells.length > 1 && cells.some((cell) => cell !== '')) {
        rows.push(cells);
      }
    });
    allItems.push(...parseRows(rows));
  });

  if (allItems.length > 0) {
    return allItems;
  }

  // Fallback: handle pages that have rows but no explicit table grouping.
  const looseRows = [];
  $('table tr').each((_, tr) => {
    const cells = $(tr)
      .find('th,td')
      .map((__, td) => normalizeText($(td).text()))
      .get();
    if (cells.length > 1 && cells.some((cell) => cell !== '')) {
      looseRows.push(cells);
    }
  });
  return parseRows(looseRows);
}

function getSpecImageUrl($) {
  return normalizeText($('.spec-tech-img img').attr('data-src') || $('.spec-tech-img img').attr('src') || '');
}

function normalizeSpecImageBasename(specImageUrl) {
  if (!specImageUrl) return '';
  try {
    return decodeURIComponent(new URL(specImageUrl).pathname.split('/').pop() || '').toLowerCase();
  } catch {
    return specImageUrl.toLowerCase().split('/').pop() || '';
  }
}

function extractLabelsFromOcrText(rawText) {
  const text = normalizeText(rawText);
  if (!text) return [];
  const labels = [];
  const seen = new Set();

  const sizeWeightRegex = /\b\d+\/0\s*\(\s*[\d./]+\s*(?:g|oz)\s*\)/gi;
  let match = sizeWeightRegex.exec(text);
  while (match) {
    const normalized = normalizeText(match[0]).replace(/\s*\(\s*/g, ' (').replace(/\s*\)/g, ')');
    if (!seen.has(normalized)) {
      seen.add(normalized);
      labels.push(normalized);
    }
    match = sizeWeightRegex.exec(text);
  }
  if (labels.length > 0) return labels;

  const sizeOnlyRegex = /\b\d+\/0\b/gi;
  match = sizeOnlyRegex.exec(text);
  while (match) {
    const normalized = normalizeText(match[0]);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      labels.push(normalized);
    }
    match = sizeOnlyRegex.exec(text);
  }
  return labels;
}

function ensureOcrBinary() {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const sourceHash = crypto.createHash('sha1').update(SWIFT_OCR_SOURCE).digest('hex');
  const hashFile = `${SWIFT_OCR_BINARY_PATH}.sha1`;
  const currentHash = fs.existsSync(hashFile) ? fs.readFileSync(hashFile, 'utf8') : '';
  if (fs.existsSync(SWIFT_OCR_BINARY_PATH) && currentHash === sourceHash) {
    return SWIFT_OCR_BINARY_PATH;
  }
  fs.writeFileSync(SWIFT_OCR_SOURCE_PATH, SWIFT_OCR_SOURCE, 'utf8');
  execFileSync('swiftc', [SWIFT_OCR_SOURCE_PATH, '-o', SWIFT_OCR_BINARY_PATH], { stdio: 'pipe' });
  fs.writeFileSync(hashFile, sourceHash, 'utf8');
  return SWIFT_OCR_BINARY_PATH;
}

async function extractImageVariationLabelsWithOcr(specImageUrl) {
  if (!specImageUrl) return [];
  const basename = normalizeSpecImageBasename(specImageUrl);
  if (!basename) return [];
  if (OCR_LABEL_CACHE.has(basename)) {
    return OCR_LABEL_CACHE.get(basename);
  }

  const diskCache = readJsonSafe(OCR_CACHE_PATH, {});
  if (Array.isArray(diskCache[basename])) {
    OCR_LABEL_CACHE.set(basename, diskCache[basename]);
    return diskCache[basename];
  }

  try {
    const ocrBinary = ensureOcrBinary();
    const imagePath = path.join(TEMP_DIR, basename);
    if (!fs.existsSync(imagePath)) {
      const resp = await getWithRetry(specImageUrl, { ...HTTP_CONFIG, responseType: 'arraybuffer' }, 3);
      fs.writeFileSync(imagePath, Buffer.from(resp.data));
    }
    const stdout = execFileSync(ocrBinary, [imagePath], { encoding: 'utf8', stdio: 'pipe' });
    const labels = extractLabelsFromOcrText(stdout);
    OCR_LABEL_CACHE.set(basename, labels);
    diskCache[basename] = labels;
    writeJsonSafe(OCR_CACHE_PATH, diskCache);
    return labels;
  } catch (error) {
    console.warn(`[bkk_hook] OCR failed for ${basename}: ${error.message}`);
    OCR_LABEL_CACHE.set(basename, []);
    return [];
  }
}

async function parseImageBasedVariations(specImageUrl) {
  if (!specImageUrl) return [];
  const basename = normalizeSpecImageBasename(specImageUrl);
  const mapped = SPEC_IMAGE_VARIATION_MAP[basename];
  const labels = mapped && mapped.length > 0 ? mapped : await extractImageVariationLabelsWithOcr(specImageUrl);
  return labels.map((label) => ({
    sku: '',
    size: label,
    quantityPerPack: '',
    price: '',
    status: 'in_stock',
  }));
}

function extractTechItemCoating($) {
  const parts = [];
  $('.tech-item').each((_, item) => {
    const rawText = decodeHtml($(item).text());
    const icon = normalizeText($(item).find('img').attr('src') || '').toLowerCase();
    if (/coatings?/i.test(rawText)) {
      const cleaned = normalizeText(rawText.replace(/coatings?/gi, '').replace(/features?/gi, ''));
      if (cleaned) parts.push(cleaned);
    }
    if (icon) {
      parts.push(icon);
    }
  });
  return normalizeText(parts.join(' '));
}

function inferCoating(description, techCoatingText = '') {
  const text = `${String(techCoatingText || '')} ${String(description || '')}`;
  const rules = [
    { pattern: /\bsuper\s+slide\b/i, value: 'super slide' },
    { pattern: /\bfluorescent\s+uv\b/i, value: 'fluorescent uv' },
    { pattern: /\buv\s+coating\b/i, value: 'uv coating' },
    { pattern: /\bblack\s+nickel\b/i, value: 'black nickel' },
    { pattern: /\bbright\s+tin\b/i, value: 'bright tin' },
    { pattern: /\bb\/n\b/i, value: 'b/n' },
    { pattern: /\bmatte\b/i, value: 'matte' },
    { pattern: /\bss\b/i, value: 'ss' },
    { pattern: /\btin\b/i, value: 'bright tin' },
  ];
  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      return rule.value;
    }
  }
  return '';
}

function fallbackSku(hookId, variation, idx) {
  const size = normalizeText(variation.size).replace(/[\/\\]/g, '-');
  const qty = normalizeText(variation.quantityPerPack);
  const parts = [size && `S${size}`, qty && `Q${qty}`, `N${idx + 1}`].filter(Boolean);
  return `${hookId}-${parts.join('-')}`;
}

async function downloadImage(url, model) {
  if (!url) return '';
  const ext = path.extname(new URL(url).pathname) || '.jpg';
  const fileName = `${sanitizeFileName(model)}${ext.toLowerCase()}`;
  const filePath = path.join(IMAGE_DIR, fileName);
  const relativePath = `pkgGear/images/hook/BKK/${fileName}`;
  if (fs.existsSync(filePath)) {
    return relativePath;
  }
  const response = await getWithRetry(url, { ...HTTP_CONFIG, responseType: 'stream' }, 3);
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  return relativePath;
}

async function fetchCategoryProducts(config) {
  const url = `https://bkkhooks.com/products/categories/${config.slug}`;
  const { data } = await getWithRetry(url, HTTP_CONFIG, 3);
  const links = extractProductLinks(data);
  return links.map((sourceUrl) => ({ sourceUrl, category: config }));
}

async function fetchProduct(entry) {
  const { sourceUrl, category } = entry;
  const { data } = await getWithRetry(sourceUrl, HTTP_CONFIG, 3);
  const $ = cheerio.load(data);
  const model = decodeHtml($('h1').first().text());
  const metaDescription = decodeHtml($('meta[name="description"]').attr('content'));
  const bodyDescription = decodeHtml($('h1').first().nextAll('p').first().text());
  const description = bodyDescription.length > metaDescription.length ? bodyDescription : metaDescription;
  const techCoatingText = extractTechItemCoating($);
  const imageUrl = selectMainImage($, model, sourceUrl);
  const tableVariations = parseVariationRows($);
  const specImageUrl = getSpecImageUrl($);
  const imageVariations = tableVariations.length === 0 ? await parseImageBasedVariations(specImageUrl) : [];
  const variations = tableVariations.length > 0 ? tableVariations : imageVariations;

  return {
    model,
    source_url: sourceUrl,
    description,
    image_url: imageUrl,
    type: category.type,
    sub_type: category.subType,
    type_tips: category.typeTips,
    gap_width: '标准',
    coating: inferCoating(description, techCoatingText),
    status: 'in_stock',
    variations,
  };
}

function buildWorkbook(masterRows, detailRows) {
  const wb = XLSX.utils.book_new();
  const hookSheet = XLSX.utils.json_to_sheet(masterRows, { header: MASTER_HEADERS });
  const detailSheet = XLSX.utils.json_to_sheet(detailRows, { header: DETAIL_HEADERS });
  XLSX.utils.book_append_sheet(wb, hookSheet, 'hook');
  XLSX.utils.book_append_sheet(wb, detailSheet, 'hook_detail');
  return wb;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const normalized = [];
  let linkEntries = [];
  let productEntries = [];

  if (process.env.BKK_ENRICH_ONLY === '1' && fs.existsSync(NORMALIZED_PATH)) {
    const existing = readJsonSafe(NORMALIZED_PATH, []);
    for (const item of existing) {
      if ((item.variations || []).length > 0) {
        normalized.push(item);
        continue;
      }
      const category = {
        type: item.type || '挂钩',
        subType: item.sub_type || 'Jigheads',
        typeTips: item.type_tips || `${item.type || '挂钩'} / ${item.sub_type || 'Jigheads'}`,
      };
      try {
        const refreshed = await fetchProduct({ sourceUrl: item.source_url, category });
        normalized.push(refreshed);
      } catch (error) {
        console.warn(`[bkk_hook] enrich failed ${item.source_url}: ${error.message}`);
        normalized.push(item);
      }
    }
    linkEntries = existing.map((item) => ({ sourceUrl: item.source_url, category: null }));
    productEntries = [...linkEntries];
  } else {
    for (const category of CATEGORY_CONFIGS) {
      try {
        const entries = await fetchCategoryProducts(category);
        linkEntries.push(...entries);
      } catch (error) {
        console.warn(`[bkk_hook] category failed ${category.slug}: ${error.message}`);
      }
    }

    const dedupMap = new Map();
    for (const entry of linkEntries) {
      if (!dedupMap.has(entry.sourceUrl)) {
        dedupMap.set(entry.sourceUrl, entry);
      }
    }
    productEntries = [...dedupMap.values()];

    for (const entry of productEntries) {
      try {
        const item = await fetchProduct(entry);
        normalized.push(item);
      } catch (error) {
        console.warn(`[bkk_hook] product failed ${entry.sourceUrl}: ${error.message}`);
      }
    }
  }

  const masterRows = [];
  const detailRows = [];

  for (let i = 0; i < normalized.length; i += 1) {
    const item = normalized[i];
    const hookId = `${ID_PREFIX}${String(1000 + i)}`;
    const imagePath = await downloadImage(item.image_url, item.model || hookId);

    masterRows.push({
      id: hookId,
      brand_id: BRAND_ID,
      model: item.model,
      model_cn: '',
      model_year: '',
      alias: '',
      type_tips: item.type_tips,
      images: imagePath,
      created_at: '',
      updated_at: '',
      description: item.description,
    });

    const rows = item.variations.length > 0
      ? item.variations
      : [{ sku: '', size: '', quantityPerPack: '', price: '', status: 'in_stock' }];

    rows.forEach((variation, idx) => {
      const sku = normalizeText(variation.sku) || fallbackSku(hookId, variation, idx);
      detailRows.push({
        id: `${hookId}-D${String(idx + 1).padStart(3, '0')}`,
        hookId,
        brand: BRAND_NAME,
        sku,
        type: item.type,
        subType: item.sub_type,
        gapWidth: item.gap_width,
        coating: item.coating,
        size: normalizeText(variation.size),
        quantityPerPack: normalizeText(variation.quantityPerPack),
        price: normalizeText(variation.price),
        status: normalizeText(variation.status || item.status),
        created_at: '',
        updated_at: '',
        description: item.description,
      });
    });
  }

  fs.writeFileSync(NORMALIZED_PATH, JSON.stringify(normalized, null, 2), 'utf8');
  const workbook = buildWorkbook(masterRows, detailRows);
  XLSX.writeFile(workbook, EXCEL_PATH);

  console.log(`[bkk_hook] categories=${CATEGORY_CONFIGS.length} links=${linkEntries.length} dedup_products=${productEntries.length}`);
  console.log(`[bkk_hook] wrote normalized data: ${NORMALIZED_PATH}`);
  console.log(`[bkk_hook] wrote excel: ${EXCEL_PATH}`);
  console.log(`[bkk_hook] master rows=${masterRows.length} detail rows=${detailRows.length}`);
}

main().catch((error) => {
  console.error('[bkk_hook] failed:', error.message);
  process.exit(1);
});
