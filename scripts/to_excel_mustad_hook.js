const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const axios = require('axios');
const cheerio = require('cheerio');
const gearDataPaths = require('./gear_data_paths');

const OUTPUT_DIR = gearDataPaths.dataRawDir;
const NORMALIZED_PATH = path.join(OUTPUT_DIR, 'mustad_hook_normalized.json');
const EXCEL_PATH = path.join(OUTPUT_DIR, 'mustad_hook_import.xlsx');
const IMAGE_DIR = path.join(__dirname, '../GearSage-client/pkgGear/images/hook/MUSTAD');

const BRAND_ID = 112;
const BRAND_NAME = 'Mustad';
const ID_PREFIX = 'MHK';
const BASE_URL = 'https://mustad-fishing.com';
const COLLECTION_URL = `${BASE_URL}/us/collections/bass-hooks`;

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

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sanitizeFileName(name) {
  return normalizeText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 90);
}

function absoluteUrl(href) {
  const value = normalizeText(href);
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${BASE_URL}${value}`;
  return `${BASE_URL}/${value}`;
}

function cleanPrice(value) {
  const text = normalizeText(value);
  if (!text) return '';
  const matched = text.match(/[\d,.]+/);
  return matched ? matched[0] : '';
}

function classifyType(model, description) {
  const text = `${model} ${description}`.toLowerCase();
  let type = '特种钩';
  let subType = 'Bass Hook';

  if (text.includes('drop shot')) {
    type = '倒钓钩';
    subType = 'Drop Shot';
  } else if (text.includes('wacky')) {
    type = '倒钓钩';
    subType = 'Wacky';
  } else if (text.includes('swimbait')) {
    type = '特种钩';
    subType = 'Swimbait Hook';
  } else if (text.includes('jig')) {
    type = '挂钩';
    subType = 'Jig Hook';
  } else if (
    text.includes('offset') ||
    text.includes('worm') ||
    text.includes('ewg') ||
    text.includes('wide gap')
  ) {
    type = '曲柄钩';
    subType = 'Offset / Wide Gap';
  }

  return { type, subType, gapWidth: '标准' };
}

function fallbackSku(hookId, variation, idx) {
  const size = normalizeText(variation.size).replace(/\s+/g, '').replace(/[\/\\]/g, '-');
  const qty = normalizeText(variation.quantityPerPack).replace(/\s+/g, '');
  const suffix = [size && `S${size}`, qty && `Q${qty}`, `N${idx + 1}`].filter(Boolean).join('-');
  return `${hookId}-${suffix || `N${idx + 1}`}`;
}

async function getWithRetry(url, config = {}, maxAttempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await axios.get(url, { ...HTTP_CONFIG, ...config });
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 600));
      }
    }
  }
  throw lastError;
}

async function fetchCollectionProductUrls() {
  const { data } = await getWithRetry(COLLECTION_URL);
  const $ = cheerio.load(data);
  const links = new Set();
  $('a.product-item[href^="/us/products/"]').each((_, a) => {
    const href = normalizeText($(a).attr('href') || '').split('?')[0];
    if (!href) return;
    links.add(absoluteUrl(href));
  });
  return [...links];
}

function parseVariantTable($) {
  const table = $('.product-variant-table').first();
  if (!table.length) return [];

  const rows = table.find('tr');
  if (rows.length <= 1) return [];

  const headers = [];
  rows
    .first()
    .find('th,td')
    .each((_, cell) => {
      headers.push(normalizeText($(cell).text()).toLowerCase());
    });

  const items = [];
  rows.slice(1).each((_, tr) => {
    const cells = $(tr)
      .find('td')
      .map((__, td) => normalizeText($(td).text()))
      .get();

    if (cells.length === 0) return;

    const rowMap = {};
    headers.forEach((key, idx) => {
      rowMap[key] = cells[idx] || '';
    });

    const statusText = normalizeText(cells.join(' ')).toLowerCase();
    const status = statusText.includes('sold out') || statusText.includes('out of stock')
      ? 'out_of_stock'
      : 'in_stock';

    const sku = normalizeText(rowMap.reference || rowMap.sku || rowMap['item no'] || rowMap.model || '');
    const size = normalizeText(rowMap['hook size'] || rowMap.size || '');
    const quantityPerPack = normalizeText(rowMap['pack code'] || rowMap.pack || rowMap.quantity || '');
    const price = cleanPrice(rowMap.price || '');
    const color = normalizeText(rowMap['color name'] || rowMap.color || '');

    if (!sku && !size && !quantityPerPack && !price) return;

    items.push({
      sku,
      size,
      quantityPerPack,
      price,
      status,
      color,
    });
  });

  return items;
}

async function downloadImage(url, model) {
  if (process.env.MUSTAD_SKIP_IMAGE === '1') {
    return '';
  }
  if (!url) return '';
  const parsed = new URL(url);
  const ext = path.extname(parsed.pathname) || '.jpg';
  const fileName = `${sanitizeFileName(model)}${ext.toLowerCase()}`;
  const localPath = path.join(IMAGE_DIR, fileName);
  const relativePath = `pkgGear/images/hook/MUSTAD/${fileName}`;

  if (fs.existsSync(localPath)) {
    return relativePath;
  }

  const response = await getWithRetry(url, { responseType: 'stream' });
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(localPath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  return relativePath;
}

async function fetchProduct(url) {
  const { data } = await getWithRetry(url);
  const $ = cheerio.load(data);

  const model = normalizeText($('h1').first().text());
  const description = normalizeText($('.product-description').first().text());
  const imageUrl = absoluteUrl(
    $('.product-image img').first().attr('src') || $('.product-images img').first().attr('src') || ''
  );

  const taxonomy = classifyType(model, description);
  const rawVariations = parseVariantTable($);
  const coatings = [...new Set(rawVariations.map((v) => normalizeText(v.color)).filter(Boolean))].join(' / ');

  const variations = rawVariations.map((row) => ({
    sku: row.sku,
    size: row.size,
    quantityPerPack: row.quantityPerPack,
    price: row.price,
    status: row.status,
  }));

  return {
    model,
    source_url: url,
    description,
    image_url: imageUrl,
    type: taxonomy.type,
    sub_type: taxonomy.subType,
    type_tips: `${taxonomy.type} / ${taxonomy.subType}`,
    gap_width: taxonomy.gapWidth,
    coating: coatings,
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

  const productUrls = await fetchCollectionProductUrls();
  const normalized = [];

  for (const url of productUrls) {
    try {
      const product = await fetchProduct(url);
      normalized.push(product);
      console.log(`[mustad_hook] fetched ${normalized.length}/${productUrls.length}: ${product.model}`);
    } catch (error) {
      console.warn(`[mustad_hook] product failed ${url}: ${error.message}`);
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
      : [{ sku: '', size: '', quantityPerPack: '', price: '', status: 'unknown' }];

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

  console.log(`[mustad_hook] products=${normalized.length} master=${masterRows.length} detail=${detailRows.length}`);
  console.log(`[mustad_hook] wrote normalized data: ${NORMALIZED_PATH}`);
  console.log(`[mustad_hook] wrote excel: ${EXCEL_PATH}`);
}

main().catch((error) => {
  console.error('[mustad_hook] failed:', error.message);
  process.exit(1);
});
