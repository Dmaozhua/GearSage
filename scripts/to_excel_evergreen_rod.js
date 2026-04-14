const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const { BRAND_IDS, HEADERS, SHEET_NAMES } = require('./gear_export_schema');

const BASE_URL = 'https://www.evergreen-fishing.com';
const ENTRY_URLS = [
  `${BASE_URL}/saltwater/`,
  `${BASE_URL}/trout/`,
];

const OUTPUT_DIR = path.join(__dirname, '../GearSage-client/pkgGear/data_raw');
const NORMALIZED_PATH = path.join(OUTPUT_DIR, 'evergreen_rod_normalized.json');
const EXCEL_PATH = path.join(OUTPUT_DIR, 'evergreen_rod_import.xlsx');

// User requested local image download directory.
const IMAGE_DIR = '/Users/tommy/Pictures/images/evergreen_rods';

const BRAND_ID = BRAND_IDS.EVERGREEN;
const ROD_PREFIX = 'ER';
const ROD_DETAIL_PREFIX = 'ERD';

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

function sanitizeFileName(text) {
  const file = normalizeText(text)
    .toLowerCase()
    .replace(/[\s\-–—/\\|+&.,'"`~!@#$%^*(){}\[\]:;<>?=]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return file || 'evergreen_rod';
}

function absoluteUrl(raw) {
  const value = normalizeText(raw);
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) return `${BASE_URL}${value}`;
  return `${BASE_URL}/${value}`;
}

function parsePriceNumber(text) {
  const v = normalizeText(text);
  if (!v) return '';
  const m = v.match(/[\d,]+(?:\.\d+)?/);
  return m ? m[0] : '';
}

function inferRodType(sku, model) {
  const text = `${normalizeText(sku)} ${normalizeText(model)}`.toUpperCase();
  const match = text.match(/([CS])\-?\d{2,4}/);
  if (match) {
    return match[1];
  }
  if (/\bBAIT\b/.test(text)) return 'C';
  if (/\bSPIN/i.test(text)) return 'S';
  return '';
}

function extractPower(sku, rawSpecs) {
  const candidates = [
    rawSpecs['パワー'],
    rawSpecs['POWER'],
    rawSpecs['Power'],
    normalizeText(sku),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const up = String(candidate).toUpperCase();
    const m = up.match(/(X{1,3}UL|S{1,2}UL|X{1,3}H|MH|ML|UL|L|M|H)(\+)?(?:\/(MH|ML|UL|L|M|H)(\+)?)?/);
    if (m) return m[0];
  }
  return normalizeText(rawSpecs['パワー'] || '');
}

function pickMainImage($) {
  // Strictly prefer Evergreen's declared main image naming.
  const strictMain = [];
  $('img[src]').each((_, img) => {
    const src = absoluteUrl($(img).attr('src'));
    if (!src) return;
    if (/news_html\/img\/.+_main\.(jpg|jpeg|png|webp)$/i.test(src)) {
      strictMain.push(src);
    }
  });
  if (strictMain[0]) return strictMain[0];

  const mediumMain = [];
  $('img[src]').each((_, img) => {
    const src = absoluteUrl($(img).attr('src'));
    if (!src) return;
    if (/news_html\/img\/.+_m\.(jpg|jpeg|png|webp)$/i.test(src)) {
      mediumMain.push(src);
    }
  });
  if (mediumMain[0]) return mediumMain[0];

  const productLike = [];
  $('img[src]').each((_, img) => {
    const src = absoluteUrl($(img).attr('src'));
    if (!src) return;
    if (!/news_html\/img\//i.test(src)) return;
    if (/banner|blank|grip|logo/i.test(src)) return;
    productLike.push(src);
  });
  if (productLike[0]) return productLike[0];

  const bannerFallback = [];
  $('img[src]').each((_, img) => {
    const src = absoluteUrl($(img).attr('src'));
    if (!src) return;
    if (/news_html\/img\//i.test(src) && /banner/i.test(src)) {
      bannerFallback.push(src);
    }
  });
  if (bannerFallback[0]) return bannerFallback[0];

  // Resource gap: keep empty when no confident main image exists.
  return '';
}

function extractDescription($, table) {
  const parts = [];
  if (table && table.length) {
    let node = table.prev();
    while (node && node.length && parts.length < 3) {
      const text = normalizeText(node.text());
      if (text.length >= 20 && !/受付時間|PAGE TOP|お問い合わせ/.test(text)) {
        parts.unshift(text);
      }
      node = node.prev();
    }
  }

  if (parts.length === 0) {
    $('p,div').each((_, el) => {
      if (parts.length >= 3) return false;
      const text = normalizeText($(el).text());
      if (text.length >= 30 && !/受付時間|PAGE TOP|お問い合わせ/.test(text)) {
        parts.push(text);
      }
      return undefined;
    });
  }

  return normalizeText(parts.join(' '));
}

function parseSpecTable($) {
  const table = $('#allspec table').first().length ? $('#allspec table').first() : $('table.spec').first();
  const rawSpecs = {};
  if (!table.length) {
    return { rawSpecs, table };
  }

  table.find('tr').each((_, tr) => {
    const cells = $(tr)
      .find('th,td')
      .map((__, cell) => normalizeText($(cell).text()))
      .get()
      .filter(Boolean);
    if (cells.length < 2) return;

    for (let i = 0; i + 1 < cells.length; i += 2) {
      const key = cells[i];
      const value = cells[i + 1] || '';
      if (key && value && !rawSpecs[key]) {
        rawSpecs[key] = value;
      }
    }
  });

  return { rawSpecs, table };
}

function extractModelAndSku($, url) {
  const title = normalizeText($('title').first().text()).replace(/banner_snsbanner_prostaff/gi, '');
  let model = title;
  if (model.includes(' - ')) {
    model = model.split(' - ').pop();
  }
  model = normalizeText(model);

  let sku = '';
  const skuMatch = model.match(/\b[A-Z]{1,5}[A-Z0-9\-]{3,}\b/);
  if (skuMatch) sku = skuMatch[0];

  if (!sku) {
    const base = path.basename(new URL(url).pathname).replace(/\.html$/i, '');
    sku = base.toUpperCase();
  }

  return { model, sku };
}

async function getWithRetry(url, maxAttempts = 3) {
  let lastError = null;
  for (let i = 1; i <= maxAttempts; i += 1) {
    try {
      return await axios.get(url, HTTP_CONFIG);
    } catch (error) {
      lastError = error;
      if (i < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, i * 600));
      }
    }
  }
  throw lastError;
}

async function downloadImage(url, model, sku) {
  if (!url) return '';
  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const ext = path.extname(new URL(url).pathname) || '.jpg';
  const fileName = `${sanitizeFileName(model || sku)}${ext.toLowerCase()}`;
  const filePath = path.join(IMAGE_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    const response = await axios.get(url, { ...HTTP_CONFIG, responseType: 'stream' });
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  return `images/evergreen_rods/${fileName}`;
}

async function fetchCategoryUrls(entryUrls) {
  const urls = new Set();

  for (const entryUrl of entryUrls) {
    const { data } = await getWithRetry(entryUrl);
    const $ = cheerio.load(data);
    $('a[href*="goods_list_22rod.php"]').each((_, a) => {
      const href = normalizeText($(a).attr('href'));
      if (!href) return;
      urls.add(absoluteUrl(href));
    });
  }

  return [...urls];
}

async function fetchProductEntries(categoryUrls) {
  const productMap = new Map();
  for (const categoryUrl of categoryUrls) {
    const { data } = await getWithRetry(categoryUrl);
    const $ = cheerio.load(data);
    $('a[href]').each((_, a) => {
      const href = normalizeText($(a).attr('href'));
      if (!href) return;
      if (!/\/goods_list\/.+\.html$/i.test(href)) return;
      const productUrl = absoluteUrl(href);
      const thumb = absoluteUrl($(a).find('img').first().attr('src'));
      if (!productMap.has(productUrl)) {
        productMap.set(productUrl, {
          url: productUrl,
          thumbnailUrl: thumb,
        });
      } else if (!productMap.get(productUrl).thumbnailUrl && thumb) {
        productMap.get(productUrl).thumbnailUrl = thumb;
      }
    });
  }
  return [...productMap.values()];
}

function toRows(normalized) {
  const rodRows = [];
  const detailRows = [];
  let rodCounter = 1000;
  let detailCounter = 10000;

  for (const item of normalized) {
    const rodId = `${ROD_PREFIX}${rodCounter++}`;
    const typeSet = new Set(item.variants.map((v) => v.type).filter(Boolean));
    let typeTips = '';
    if (typeSet.size === 1) {
      typeTips = typeSet.has('C') ? 'casting' : 'spinning';
    } else if (typeSet.size > 1) {
      typeTips = 'casting/spinning';
    }

    rodRows.push({
      id: rodId,
      brand_id: BRAND_ID,
      model: item.model,
      model_cn: '',
      model_year: '',
      alias: '',
      type_tips: typeTips,
      images: item.local_image_path || '',
      created_at: '',
      updated_at: '',
      Description: item.description || '',
    });

    for (const v of item.variants) {
      const raw = v.raw_specs || {};
      const mappedKeys = new Set([
        '全長',
        '全長（m）',
        '継数',
        '標準自重',
        '自重',
        'パワー',
        'ルアー範囲',
        'ルアーウエイト',
        'ライン範囲',
        '適合ライン',
        '価格',
        'テーパー',
        '調子',
        'アクション',
        '先径',
        '仕舞寸法',
        'カーボン含有率',
        'JAN',
      ]);

      const extra = [];
      for (const [k, val] of Object.entries(raw)) {
        if (!mappedKeys.has(k) && normalizeText(val)) {
          extra.push(`${k}: ${normalizeText(val)}`);
        }
      }

      detailRows.push({
        id: `${ROD_DETAIL_PREFIX}${detailCounter++}`,
        rod_id: rodId,
        TYPE: v.type || '',
        SKU: v.sku || '',
        'TOTAL LENGTH': normalizeText(raw['全長'] || raw['全長（m）']),
        Action: normalizeText(raw['テーパー'] || raw['調子'] || raw['アクション']),
        PIECES: normalizeText(raw['継数']),
        CLOSELENGTH: normalizeText(raw['仕舞寸法']),
        WEIGHT: normalizeText(raw['標準自重'] || raw['自重']),
        'Tip Diameter': normalizeText(raw['先径']),
        'LURE WEIGHT': normalizeText(raw['ルアー範囲'] || raw['ルアーウエイト']),
        'Line Wt N F': normalizeText(raw['ライン範囲'] || raw['適合ライン']),
        'PE Line Size': '',
        'Handle Length': '',
        'Reel Seat Position': '',
        'CONTENT CARBON': normalizeText(raw['カーボン含有率']),
        'Market Reference Price': parsePriceNumber(raw['価格']),
        AdminCode: normalizeText(raw['JAN']),
        'Service Card': '',
        ' Jig Weight': '',
        'Squid Jig Size': '',
        'Sinker Rating': '',
        created_at: '',
        updated_at: '',
        POWER: v.power || '',
        'LURE WEIGHT (oz)': '',
        'Sale Price': '',
        'Joint Type': '',
        'Code Name': '',
        'Fly Line': '',
        'Grip Type': '',
        'Reel Size': '',
        Description: v.description || item.description || '',
        'Extra Spec 1': extra[0] || '',
        'Extra Spec 2': extra[1] || '',
      });
    }
  }

  return { rodRows, detailRows };
}

async function scrapeProduct(url, thumbnailUrl = '') {
  const { data } = await getWithRetry(url);
  const $ = cheerio.load(data);

  const { model, sku } = extractModelAndSku($, url);
  const { rawSpecs, table } = parseSpecTable($);
  const description = extractDescription($, table);
  const imageUrl = pickMainImage($) || thumbnailUrl;
  const localImagePath = await downloadImage(imageUrl, model, sku);

  const variant = {
    sku,
    type: inferRodType(sku, model),
    power: extractPower(sku, rawSpecs),
    specs: {
      total_length_m: normalizeText(rawSpecs['全長'] || rawSpecs['全長（m）']),
      pieces: normalizeText(rawSpecs['継数']),
      weight_g: normalizeText(rawSpecs['標準自重'] || rawSpecs['自重']),
      power: normalizeText(rawSpecs['パワー']),
      lure_weight: normalizeText(rawSpecs['ルアー範囲'] || rawSpecs['ルアーウエイト']),
      line_range: normalizeText(rawSpecs['ライン範囲'] || rawSpecs['適合ライン']),
      price: parsePriceNumber(rawSpecs['価格']),
      action: normalizeText(rawSpecs['テーパー'] || rawSpecs['調子'] || rawSpecs['アクション']),
    },
    raw_specs: rawSpecs,
    description,
  };

  return {
    brand: 'Evergreen',
    kind: 'rod',
    model,
    model_year: '',
    source_url: url,
    main_image_url: imageUrl,
    local_image_path: localImagePath,
    description,
    variants: [variant],
    raw_data_hash: crypto.createHash('sha256').update(data).digest('hex'),
    scraped_at: new Date().toISOString(),
  };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const categoryUrls = await fetchCategoryUrls(ENTRY_URLS);
  const productEntries = await fetchProductEntries(categoryUrls);
  const normalized = [];
  const concurrency = 8;

  for (let i = 0; i < productEntries.length; i += concurrency) {
    const chunk = productEntries.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      chunk.map((entry) => scrapeProduct(entry.url, entry.thumbnailUrl)),
    );

    for (let offset = 0; offset < results.length; offset += 1) {
      const result = results[offset];
      const { url } = chunk[offset];
      if (result.status === 'rejected') {
        console.warn(`[evergreen_rod] failed ${url}: ${result.reason.message}`);
        continue;
      }

      const item = result.value;
      if (!item.model) {
        console.warn(`[evergreen_rod] skip empty model: ${url}`);
        continue;
      }

      normalized.push(item);
      console.log(`[evergreen_rod] fetched ${normalized.length}/${productEntries.length}: ${item.model}`);
    }
  }

  const { rodRows, detailRows } = toRows(normalized);
  fs.writeFileSync(NORMALIZED_PATH, JSON.stringify(normalized, null, 2), 'utf8');

  const wb = XLSX.utils.book_new();
  const rodSheet = XLSX.utils.json_to_sheet(rodRows, { header: HEADERS.rodMaster });
  const detailSheet = XLSX.utils.json_to_sheet(detailRows, { header: HEADERS.rodDetail });
  XLSX.utils.book_append_sheet(wb, rodSheet, SHEET_NAMES.rod);
  XLSX.utils.book_append_sheet(wb, detailSheet, SHEET_NAMES.rodDetail);
  XLSX.writeFile(wb, EXCEL_PATH);

  console.log(`[evergreen_rod] entryUrls=${ENTRY_URLS.length} categoryUrls=${categoryUrls.length} productUrls=${productEntries.length}`);
  console.log(`[evergreen_rod] master=${rodRows.length} detail=${detailRows.length}`);
  console.log(`[evergreen_rod] wrote normalized data: ${NORMALIZED_PATH}`);
  console.log(`[evergreen_rod] wrote excel: ${EXCEL_PATH}`);
}

main().catch((error) => {
  console.error('[evergreen_rod] fatal:', error.message);
  process.exit(1);
});
