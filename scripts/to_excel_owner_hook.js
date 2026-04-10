const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const axios = require('axios');
const cheerio = require('cheerio');

const OUTPUT_DIR = path.join(__dirname, '../GearSage-client/pkgGear/data_raw');
const NORMALIZED_PATH = path.join(OUTPUT_DIR, 'owner_hook_normalized.json');
const EXCEL_PATH = path.join(OUTPUT_DIR, 'owner_hook_import.xlsx');
const IMAGE_DIR = path.join(__dirname, '../GearSage-client/pkgGear/images/hook/OWNER');

const BRAND_ID = 46;
const BRAND_NAME = 'Owner';
const CATEGORY_ID = 7; // https://www.ownerhooks.com/product-category/bass-hooks/
const BASE_URL = 'https://www.ownerhooks.com';
const PRODUCT_API = `${BASE_URL}/wp-json/wp/v2/product`;
const MEDIA_API = `${BASE_URL}/wp-json/wp/v2/media`;

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

function decodeHtml(html) {
  return String(html || '')
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
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sanitizeFileName(name) {
  return normalizeText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
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
  } else if (text.includes('offset') || text.includes('wide gap') || text.includes('worm')) {
    type = '曲柄钩';
    subType = 'Offset / Wide Gap';
  } else if (text.includes('swimbait') || text.includes('beast')) {
    type = '特种钩';
    subType = 'Swimbait';
  } else if (text.includes('jig')) {
    type = '特种钩';
    subType = 'Jig Hook';
  }
  return { type, subType, gapWidth: '标准' };
}

function inferCoating(description) {
  const patterns = [
    /black chrome/i,
    /black nickel/i,
    /silky gray/i,
    /red/i,
    /tin/i,
    /cp point/i,
    /super needle point/i,
  ];
  for (const pattern of patterns) {
    const match = String(description || '').match(pattern);
    if (match) return match[0];
  }
  return '';
}

function fallbackSku(hookId, variation, idx) {
  const size = normalizeText(variation.size).replace(/\s+/g, '').replace(/[\/\\]/g, '-');
  const qty = normalizeText(variation.quantityPerPack).replace(/\s+/g, '');
  const suffix = [size && `S${size}`, qty && `Q${qty}`, `N${idx + 1}`].filter(Boolean).join('-');
  return `${hookId}-${suffix || `N${idx + 1}`}`;
}

async function fetchJson(url) {
  const response = await axios.get(url, HTTP_CONFIG);
  return response.data;
}

async function fetchAllProducts() {
  const url = `${PRODUCT_API}?product_cat=${CATEGORY_ID}&per_page=100&_fields=id,slug,title,link,excerpt,content,featured_media`;
  const products = await fetchJson(url);
  if (!Array.isArray(products)) {
    throw new Error('Owner products API returned invalid payload.');
  }
  return products;
}

async function fetchMediaMap(mediaIds) {
  const ids = [...new Set(mediaIds.filter((id) => Number(id) > 0))];
  const map = new Map();
  if (ids.length === 0) return map;

  const chunkSize = 50;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const url = `${MEDIA_API}?include=${chunk.join(',')}&per_page=${chunk.length}&_fields=id,source_url`;
    const medias = await fetchJson(url);
    for (const media of medias || []) {
      if (media && media.id && media.source_url) {
        map.set(Number(media.id), String(media.source_url));
      }
    }
  }
  return map;
}

async function fetchProductHtml(productUrl) {
  const response = await axios.get(productUrl, HTTP_CONFIG);
  return response.data;
}

function parseVariationRows(html) {
  const $ = cheerio.load(html);
  const rows = [];

  $('tr.pvt-tr').each((_, tr) => {
    const rowMap = {};
    $(tr)
      .find('td')
      .each((__, td) => {
        const key = normalizeText($(td).attr('data-title')).toLowerCase();
        const value = normalizeText($(td).text());
        if (key) rowMap[key] = value;
      });

    const sku = rowMap['model-no'] || rowMap['model no'] || '';
    const size = rowMap.size || '';
    const quantityPerPack = rowMap['qty-per-pack'] || rowMap['qty per pack'] || rowMap.quantity || '';
    const price = rowMap.price || '';
    const stockText = rowMap.stock || rowMap.status || normalizeText($(tr).find('.stock').text());
    const status = /in stock/i.test(stockText)
      ? 'in_stock'
      : /out of stock/i.test(stockText)
        ? 'out_of_stock'
        : 'unknown';

    if (sku || size || quantityPerPack) {
      rows.push({
        sku,
        size,
        quantityPerPack,
        price,
        status,
      });
    }
  });

  return rows;
}

async function downloadImage(url, model) {
  if (!url) return '';
  const parsed = new URL(url);
  const ext = path.extname(parsed.pathname) || '.jpg';
  const fileName = `${sanitizeFileName(model)}${ext.toLowerCase()}`;
  const localPath = path.join(IMAGE_DIR, fileName);
  const relativePath = `pkgGear/images/hook/OWNER/${fileName}`;

  if (fs.existsSync(localPath)) {
    return relativePath;
  }

  const response = await axios.get(url, { ...HTTP_CONFIG, responseType: 'stream' });
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(localPath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  return relativePath;
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

  const products = await fetchAllProducts();
  const mediaMap = await fetchMediaMap(products.map((p) => p.featured_media));
  const normalized = [];

  for (const product of products) {
    const model = decodeHtml(product.title?.rendered || '');
    const sourceUrl = product.link || `${BASE_URL}/product/${product.slug}/`;
    const description = decodeHtml(product.excerpt?.rendered || product.content?.rendered || '');
    const taxonomy = classifyType(model, description);
    const coating = inferCoating(description);
    const imageUrl = mediaMap.get(Number(product.featured_media)) || '';
    const html = await fetchProductHtml(sourceUrl);
    const variations = parseVariationRows(html);

    normalized.push({
      model,
      source_url: sourceUrl,
      description,
      type: taxonomy.type,
      sub_type: taxonomy.subType,
      gap_width: taxonomy.gapWidth,
      coating,
      status: 'in_stock',
      image_url: imageUrl,
      variations,
    });
  }

  const masterRows = [];
  const detailRows = [];

  for (let i = 0; i < normalized.length; i += 1) {
    const item = normalized[i];
    const hookId = `OHK${String(1000 + i)}`;
    const imagePath = await downloadImage(item.image_url, item.model);
    const typeTips = `${item.type} / ${item.sub_type}`;

    masterRows.push({
      id: hookId,
      brand_id: BRAND_ID,
      model: item.model,
      model_cn: '',
      model_year: '',
      alias: '',
      type_tips: typeTips,
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

  console.log(`[owner_hook] products=${products.length} master=${masterRows.length} detail=${detailRows.length}`);
  console.log(`[owner_hook] wrote normalized data: ${NORMALIZED_PATH}`);
  console.log(`[owner_hook] wrote excel: ${EXCEL_PATH}`);
}

main().catch((error) => {
  console.error('[owner_hook] failed:', error.message);
  process.exit(1);
});
