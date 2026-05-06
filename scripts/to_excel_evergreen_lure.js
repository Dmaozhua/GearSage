const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');
const gearDataPaths = require('./gear_data_paths');

const BASE_URL = 'https://www.evergreen-fishing.com';
const ENTRY_URLS = [
  `${BASE_URL}/freshwater/`,
  `${BASE_URL}/trout/`,
];

const OUTPUT_DIR = gearDataPaths.dataRawDir;
const NORMALIZED_PATH = path.join(OUTPUT_DIR, 'evergreen_lure_normalized.json');
const EXCEL_PATH = path.join(OUTPUT_DIR, 'evergreen_lure_import.xlsx');
const IMAGE_DIR = '/Users/tommy/Pictures/images/evergreen_lures';
const DOWNLOAD_IMAGES = false;

const BRAND_ID = BRAND_IDS.EVERGREEN;

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
  const cleaned = normalizeText(text)
    .toLowerCase()
    .replace(/[\s\-–—/\\|+&.,'"`~!@#$%^*(){}\[\]:;<>?=]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'evergreen_lure';
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
  const m = normalizeText(text).match(/[\d,]+(?:\.\d+)?/);
  return m ? m[0].replace(/,/g, '') : '';
}

function parseDepthRangeMeters(depthText) {
  const t = normalizeText(depthText).replace(/〜|～|~|to/gi, '-');
  const nums = (t.match(/(\d+(?:\.\d+)?)/g) || []).map(Number).filter((v) => !Number.isNaN(v));
  if (nums.length === 0) return null;
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
}

function getTypeTips(categoryLabel, model, rawSpecs) {
  const c = normalizeText(categoryLabel);
  const m = normalizeText(model);
  const typeSpec = normalizeText(rawSpecs['タイプ']);

  if (/クランクベイト/.test(c)) return 'crank';
  if (/バイブレーション/.test(c)) return 'vib';
  if (/ジギングスプーン/.test(c)) return 'spoon';
  if (/ビッグベイト/.test(c)) return 'swimbait';
  if (/blade|ブレード/i.test(m)) return 'blade_bait';
  if (/spy|スパイ/i.test(m)) return 'spy_bait';
  if (/ワーム/.test(c)) return 'weightless_soft_bait';
  if (/ジグ/.test(c)) return 'finesse_jig';
  if (/ワイヤーベイト/.test(c)) {
    if (/buzz|バズ/i.test(m)) return 'buzzbait';
    if (/blade|ブレード/i.test(m)) return 'spinner';
    return 'spinnerbait';
  }
  if (/トップウォーター/.test(c)) {
    if (/popper|ポッパー/i.test(m)) return 'popper';
    if (/pencil|ペンシル/i.test(m)) return 'topwater_pencil';
    return 'topwater_walker';
  }
  if (/プロップベイト/.test(c)) return 'topwater_pencil';
  if (/フロッグ/.test(c)) return 'special_lure';
  if (/ミノー|シャッド|ジャークベイト/.test(c)) {
    if (/サスペンド/i.test(typeSpec)) return 'suspending_minnow';
    return 'minnow';
  }
  if (/エリア|ネイティブ/.test(c)) {
    if (/スプーン|spoon/i.test(m)) return 'spoon';
    if (/バイブ|vib|vibration/i.test(m)) return 'vib';
    return 'special_lure';
  }
  if (/sinking|シンキング/i.test(typeSpec) && /pencil|ペンシル/i.test(m)) return 'sinking_pencil';
  if (/サスペンド/i.test(typeSpec)) return 'suspending_minnow';
  if (/ミノー|shad|シャッド|jerk/i.test(m)) return 'minnow';
  if (/クランク|crank/i.test(m)) return 'crank';
  if (/スイム|swim|joint|ジョイント/.test(m)) return 'swimbait';
  return 'special_lure';
}

function getSystem(typeTips) {
  if (['spinnerbait', 'buzzbait', 'spinner'].includes(typeTips)) return 'wire';
  if (['spoon', 'vib', 'blade_bait'].includes(typeTips)) return 'metal';
  if (typeTips === 'finesse_jig') return 'jig';
  if (typeTips === 'weightless_soft_bait') return 'soft';
  return 'hardbait';
}

function categorySpecificityScore(categoryLabel) {
  const c = normalizeText(categoryLabel);
  if (!c) return 0;
  if (/ビッグベイト|クランクベイト|バイブレーション|ミノー|シャッド|ジャークベイト|プロップベイト|トップウォーター|フロッグ|ワイヤーベイト|ジグ|ジギングスプーン|ワーム|エリア|ネイティブ/i.test(c)) {
    return 3;
  }
  if (/コンバットルアーズ|モード|ファクト|インスパイア|スペシャルエディション/i.test(c)) {
    return 1;
  }
  return 2;
}

function getAction(rawSpecs, typeTips, model) {
  const m = normalizeText(model);
  const t = normalizeText(rawSpecs['タイプ']);
  if (['topwater_pencil', 'topwater_walker', 'popper'].includes(typeTips)) return 'walk_pop';
  if (['minnow', 'suspending_minnow', 'spy_bait'].includes(typeTips)) return 'jerk_dart';
  if (typeTips === 'crank') return 'wobble_roll';
  if (typeTips === 'vib' || typeTips === 'blade_bait') return 'vibration';
  if (typeTips === 'swimbait') return 'glide';
  if (['spinnerbait', 'buzzbait', 'spinner'].includes(typeTips)) return 'spin_flash';
  if (typeTips === 'spoon') return 'flutter_fall';
  if (typeTips === 'finesse_jig') return 'crawl_creature';
  if (typeTips === 'weightless_soft_bait') return 'worm';
  if (/frog|フロッグ/i.test(m)) return 'frog';
  if (/フローティング|サスペンド/.test(t)) return 'wobble_roll';
  return 'glide';
}

function getWaterColumn(rawSpecs, typeTips) {
  const depthText = normalizeText(rawSpecs['潜行レンジ']);
  const typeText = normalizeText(rawSpecs['タイプ']);
  if (['topwater_pencil', 'topwater_walker', 'popper', 'buzzbait'].includes(typeTips)) return 'Topwater';
  if (typeTips === 'finesse_jig' || typeTips === 'weightless_soft_bait') return 'Bottom';
  if (typeTips === 'spoon') return 'Deep (2m+)';
  if (typeTips === 'vib' || typeTips === 'blade_bait') return 'Mid (0.5–2m)';

  if (!depthText || depthText === '－' || depthText === '-') {
    if (/フローティング/i.test(typeText)) return 'Topwater';
    if (/シンキング/i.test(typeText)) return 'Subsurface (0–0.5m)';
    return 'Variable';
  }
  if (/ボトム|底/.test(depthText)) return 'Bottom';
  const range = parseDepthRangeMeters(depthText);
  if (!range) return 'Variable';
  if (range.max <= 0.5) return 'Subsurface (0–0.5m)';
  if (range.max <= 2) return 'Mid (0.5–2m)';
  return 'Deep (2m+)';
}

function buildMainImageUrl($, fallbackThumb) {
  const titleImg = absoluteUrl($('.titleArea p.tit img').first().attr('src'));
  if (titleImg) return titleImg;

  const detailImg = absoluteUrl(
    $('img[src*="/goods_images/goods_detail/"]').not('[src*="_features"]').first().attr('src'),
  );
  if (detailImg) return detailImg;

  return fallbackThumb || '';
}

function extractDescription($) {
  const table = $('table.spec').first();
  const chunks = [];
  if (table.length) {
    let node = table.prev();
    while (node && node.length && chunks.length < 4) {
      const text = normalizeText(node.text());
      if (text.length >= 20 && !/PAGE TOP|受付時間|お問い合わせ/.test(text)) {
        chunks.unshift(text);
      }
      node = node.prev();
    }
  }
  return normalizeText(chunks.join(' '));
}

function parseSpecTable($) {
  const rawSpecs = {};
  const table = $('table.spec').first();
  if (!table.length) return rawSpecs;

  table.find('tr').each((_, tr) => {
    const cells = $(tr)
      .find('th,td')
      .map((__, cell) => normalizeText($(cell).text()))
      .get()
      .filter(Boolean);
    if (cells.length < 2) return;
    for (let i = 0; i + 1 < cells.length; i += 2) {
      const key = cells[i];
      const val = cells[i + 1];
      if (key && val && !rawSpecs[key]) rawSpecs[key] = val;
    }
  });

  return rawSpecs;
}

function parseVariants($, fallbackSku, rawSpecs) {
  const variants = [];
  $('#c_chart li, li.topborder').each((_, li) => {
    const code = normalizeText($(li).find('span.num').first().text()).replace(/^#/, '');
    const color = normalizeText($(li).find('strong').first().text()) || normalizeText($(li).find('img[alt]').first().attr('alt'));
    if (!code && !color) return;

    variants.push({
      sku: code ? `#${code}` : fallbackSku,
      color,
      size: normalizeText(rawSpecs['全長']),
      weight: normalizeText(rawSpecs['自重']),
      length: normalizeText(rawSpecs['全長']),
      hook_size: normalizeText(rawSpecs['フックサイズ']),
      depth: normalizeText(rawSpecs['潜行レンジ']),
      action: normalizeText(rawSpecs['タイプ']),
      quantity: '',
      price: parsePriceNumber(rawSpecs['価格']),
      admin_code: code,
    });
  });

  if (variants.length === 0) {
    variants.push({
      sku: fallbackSku,
      color: '',
      size: normalizeText(rawSpecs['全長']),
      weight: normalizeText(rawSpecs['自重']),
      length: normalizeText(rawSpecs['全長']),
      hook_size: normalizeText(rawSpecs['フックサイズ']),
      depth: normalizeText(rawSpecs['潜行レンジ']),
      action: normalizeText(rawSpecs['タイプ']),
      quantity: '',
      price: parsePriceNumber(rawSpecs['価格']),
      admin_code: '',
    });
  }

  return variants;
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

async function downloadMainImage(imageUrl, model, sku) {
  if (!imageUrl) return '';
  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
  const fileName = `${sanitizeFileName(model || sku)}${ext.toLowerCase()}`;
  const filePath = path.join(IMAGE_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    if (!DOWNLOAD_IMAGES) return '';
    const response = await axios.get(imageUrl, { ...HTTP_CONFIG, responseType: 'stream' });
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  return `images/evergreen_lures/${fileName}`;
}

async function fetchLureListEntries() {
  const categoryMap = new Map();
  for (const entryUrl of ENTRY_URLS) {
    const { data } = await getWithRetry(entryUrl);
    const $ = cheerio.load(data);
    $('a[href*="goods_list_22lure.php"]').each((_, a) => {
      const listUrl = absoluteUrl($(a).attr('href'));
      if (!listUrl) return;
      const categoryLabel = normalizeText($(a).text());
      const existing = categoryMap.get(listUrl) || '';
      // The page often renders two anchors per URL: icon link (empty text) + text link.
      // Always prefer non-empty category labels when available.
      if (!existing || (!existing.trim() && categoryLabel)) {
        categoryMap.set(listUrl, categoryLabel);
      }
    });
  }
  return [...categoryMap.entries()].map(([url, categoryLabel]) => ({ url, categoryLabel }));
}

async function fetchProductEntries(listEntries) {
  const productMap = new Map();
  for (const listEntry of listEntries) {
    const { data } = await getWithRetry(listEntry.url);
    const $ = cheerio.load(data);
    $('a[href]').each((_, a) => {
      const href = normalizeText($(a).attr('href'));
      if (!/\/goods_list\/.+\.html$/i.test(href)) return;
      const productUrl = absoluteUrl(href);
      const thumb = absoluteUrl($(a).find('img').first().attr('src'));
      if (!productMap.has(productUrl)) {
        productMap.set(productUrl, {
          url: productUrl,
          thumbnailUrl: thumb,
          categoryLabel: listEntry.categoryLabel,
          listUrl: listEntry.url,
        });
      } else {
        const existing = productMap.get(productUrl);
        if (!existing.thumbnailUrl && thumb) existing.thumbnailUrl = thumb;
        if (categorySpecificityScore(listEntry.categoryLabel) > categorySpecificityScore(existing.categoryLabel)) {
          existing.categoryLabel = listEntry.categoryLabel;
          existing.listUrl = listEntry.url;
        }
      }
    });
  }
  return [...productMap.values()];
}

async function scrapeProduct(productEntry) {
  const { data } = await getWithRetry(productEntry.url);
  const $ = cheerio.load(data);

  const title = normalizeText($('title').first().text()).replace(/banner_snsbanner_prostaff/gi, '');
  const model = normalizeText(title.includes(' - ') ? title.split(' - ').pop() : title);
  const fallbackSku = path.basename(new URL(productEntry.url).pathname).replace(/\.html$/i, '').toUpperCase();
  const rawSpecs = parseSpecTable($);
  const typeTips = getTypeTips(productEntry.categoryLabel, model, rawSpecs);
  const action = getAction(rawSpecs, typeTips, model);
  const system = getSystem(typeTips);
  const waterColumn = getWaterColumn(rawSpecs, typeTips);
  const imageUrl = buildMainImageUrl($, productEntry.thumbnailUrl);
  const localImagePath = await downloadMainImage(imageUrl, model, fallbackSku);

  return {
    brand: 'Evergreen',
    brand_id: BRAND_ID,
    model,
    model_cn: '',
    model_year: '',
    alias: '',
    type_tips: typeTips,
    category: productEntry.categoryLabel,
    system,
    water_column: waterColumn,
    action,
    source_url: productEntry.url,
    main_image_url: imageUrl,
    local_image_path: localImagePath,
    description: extractDescription($),
    raw_specs: rawSpecs,
    variants: parseVariants($, fallbackSku, rawSpecs),
    raw_data_hash: crypto.createHash('sha256').update(data).digest('hex'),
    scraped_at: new Date().toISOString(),
  };
}

function toWorkbookRows(items) {
  const masterRows = [];
  const hardbaitDetailRows = [];
  const metalDetailRows = [];
  const softDetailRows = [];
  const wireDetailRows = [];
  const jigDetailRows = [];

  let masterId = 1000;
  let detailId = 10000;

  for (const item of items) {
    const lureId = `EL${masterId++}`;
    masterRows.push({
      id: lureId,
      brand_id: BRAND_ID,
      model: item.model,
      model_cn: item.model_cn,
      model_year: item.model_year,
      alias: item.alias,
      type_tips: item.type_tips,
      system: item.system,
      water_column: item.water_column,
      action: item.action,
      images: item.local_image_path || '',
      official_link: item.source_url || '',
      created_at: '',
      updated_at: '',
      description: item.description || '',
    });

    const targetRows = item.system === 'wire'
      ? wireDetailRows
      : (item.system === 'jig'
        ? jigDetailRows
        : (item.system === 'metal'
          ? metalDetailRows
          : (item.system === 'soft' ? softDetailRows : hardbaitDetailRows)));

    for (const v of item.variants) {
      const baseDetail = {
        id: `ELD${detailId++}`,
        lure_id: lureId,
        SKU: v.sku || '',
        WEIGHT: v.weight || '',
        length: v.length || '',
        size: v.size || '',
        sinkingspeed: '',
        referenceprice: v.price || '',
        created_at: '',
        updated_at: '',
        COLOR: v.color || '',
        AdminCode: v.admin_code || '',
        hook_size: v.hook_size || '',
        depth: v.depth || '',
        action: v.action || '',
        subname: '',
        'other.1': '',
      };

      if (targetRows === softDetailRows) {
        baseDetail['quantity (入数)'] = v.quantity || '';
      }
      targetRows.push(baseDetail);
    }
  }

  return {
    masterRows,
    hardbaitDetailRows,
    metalDetailRows,
    softDetailRows,
    wireDetailRows,
    jigDetailRows,
  };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const listEntries = await fetchLureListEntries();
  const productEntries = await fetchProductEntries(listEntries);
  const scraped = [];
  const concurrency = 8;

  for (let i = 0; i < productEntries.length; i += concurrency) {
    const chunk = productEntries.slice(i, i + concurrency);
    const results = await Promise.allSettled(chunk.map((entry) => scrapeProduct(entry)));
    for (let j = 0; j < results.length; j += 1) {
      const result = results[j];
      const target = chunk[j];
      if (result.status === 'rejected') {
        console.warn(`[evergreen_lure] failed ${target.url}: ${result.reason.message}`);
        continue;
      }
      const item = result.value;
      if (!item.model) {
        console.warn(`[evergreen_lure] skip empty model: ${target.url}`);
        continue;
      }
      scraped.push(item);
      console.log(`[evergreen_lure] fetched ${scraped.length}/${productEntries.length}: ${item.model}`);
    }
  }

  const {
    masterRows,
    hardbaitDetailRows,
    metalDetailRows,
    softDetailRows,
    wireDetailRows,
    jigDetailRows,
  } = toWorkbookRows(scraped);
  fs.writeFileSync(NORMALIZED_PATH, JSON.stringify(scraped, null, 2), 'utf8');

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(masterRows, { header: HEADERS.lureMaster }), SHEET_NAMES.lure);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hardbaitDetailRows, { header: HEADERS.hardbaitLureDetail }), SHEET_NAMES.hardbaitLureDetail);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metalDetailRows, { header: HEADERS.metalLureDetail }), SHEET_NAMES.metalLureDetail);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(softDetailRows, { header: HEADERS.softLureDetail }), SHEET_NAMES.softLureDetail);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wireDetailRows, { header: HEADERS.wireLureDetail }), SHEET_NAMES.wireLureDetail);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(jigDetailRows, { header: HEADERS.jigLureDetail }), SHEET_NAMES.jigLureDetail);
  XLSX.writeFile(wb, EXCEL_PATH);

  console.log(`[evergreen_lure] entryUrls=${ENTRY_URLS.length} listUrls=${listEntries.length} products=${productEntries.length}`);
  console.log(
    `[evergreen_lure] master=${masterRows.length} hard=${hardbaitDetailRows.length} metal=${metalDetailRows.length} soft=${softDetailRows.length} wire=${wireDetailRows.length} jig=${jigDetailRows.length}`,
  );
  console.log(`[evergreen_lure] wrote normalized data: ${NORMALIZED_PATH}`);
  console.log(`[evergreen_lure] wrote excel: ${EXCEL_PATH}`);
}

main().catch((error) => {
  console.error('[evergreen_lure] fatal:', error.message);
  process.exit(1);
});
