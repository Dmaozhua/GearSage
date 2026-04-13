const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const axios = require('axios');
const cheerio = require('cheerio');

const OUTPUT_DIR = path.join(__dirname, '../GearSage-client/pkgGear/data_raw');
const NORMALIZED_PATH = path.join(OUTPUT_DIR, 'bkk_hook_normalized.json');
const EXCEL_PATH = path.join(OUTPUT_DIR, 'bkk_hook_import.xlsx');
const IMAGE_DIR = path.join(__dirname, '../GearSage-client/pkgGear/images/hook/BKK');

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

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
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
  const rows = [];
  $('table tr').each((_, tr) => {
    const cells = $(tr)
      .find('th,td')
      .map((__, td) => normalizeText($(td).text()))
      .get()
      .filter(Boolean);
    if (cells.length > 1) {
      rows.push(cells);
    }
  });

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

function inferCoating(description) {
  const patterns = [
    /super slide/i,
    /black nickel/i,
    /bright tin/i,
    /tin/i,
    /matte/i,
    /ss/i,
    /b\/n/i,
  ];
  for (const p of patterns) {
    const m = String(description || '').match(p);
    if (m) return m[0];
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
  const response = await axios.get(url, { ...HTTP_CONFIG, responseType: 'stream' });
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
  const { data } = await axios.get(url, HTTP_CONFIG);
  const links = extractProductLinks(data);
  return links.map((sourceUrl) => ({ sourceUrl, category: config }));
}

async function fetchProduct(entry) {
  const { sourceUrl, category } = entry;
  const { data } = await axios.get(sourceUrl, HTTP_CONFIG);
  const $ = cheerio.load(data);
  const model = decodeHtml($('h1').first().text());
  const description = decodeHtml($('meta[name="description"]').attr('content'));
  const imageUrl = selectMainImage($, model, sourceUrl);
  const variations = parseVariationRows($);

  return {
    model,
    source_url: sourceUrl,
    description,
    image_url: imageUrl,
    type: category.type,
    sub_type: category.subType,
    type_tips: category.typeTips,
    gap_width: '标准',
    coating: inferCoating(description),
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

  const linkEntries = [];
  for (const category of CATEGORY_CONFIGS) {
    const entries = await fetchCategoryProducts(category);
    linkEntries.push(...entries);
  }

  const dedupMap = new Map();
  for (const entry of linkEntries) {
    if (!dedupMap.has(entry.sourceUrl)) {
      dedupMap.set(entry.sourceUrl, entry);
    }
  }
  const productEntries = [...dedupMap.values()];

  const normalized = [];
  for (const entry of productEntries) {
    const item = await fetchProduct(entry);
    normalized.push(item);
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
