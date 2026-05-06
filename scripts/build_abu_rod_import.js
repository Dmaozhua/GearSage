const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

const BASE_URL = 'https://www.abugarcia.com';
const START_URL = `${BASE_URL}/collections/rods?sort_by=created-descending`;
const OUTPUT_DIR = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw');
const CACHE_DIR = path.join(OUTPUT_DIR, 'abu_rods_cache');
const DETAIL_CACHE_DIR = path.join(CACHE_DIR, 'details');
const LIST_CACHE_DIR = path.join(CACHE_DIR, 'list_pages');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'abu_rods_normalized.json');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'abu_rod_import.xlsx');
const SHADE_SCRIPT = path.join(__dirname, 'shade_abu_rod_detail_groups.py');
const IMAGE_DIR = '/Users/tommy/Pictures/images/abu_rods';
const STATIC_PREFIX = 'https://static.gearsage.club/gearsage/Gearimg/images/abu_rods/';

const HTTP_CONFIG = {
  timeout: 60000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  },
};

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function decodeHtml(value) {
  const raw = String(value || '');
  if (!raw) return '';
  return normalizeText(cheerio.load(`<span>${raw}</span>`)('span').text());
}

function stripHtml(html) {
  return decodeHtml(String(html || '').replace(/<br\s*\/?>/gi, ' '));
}

function ensureDirs() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(DETAIL_CACHE_DIR, { recursive: true });
  fs.mkdirSync(LIST_CACHE_DIR, { recursive: true });
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWithRetry(url, attempts = 3) {
  let lastError = null;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const response = await axios.get(url, HTTP_CONFIG);
      return response.data;
    } catch (error) {
      lastError = error;
      if (i < attempts) await sleep(i * 700);
    }
  }
  throw lastError;
}

function sanitizeFilename(name) {
  const base = normalizeText(name)
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[\\/*?:"<>|]/g, '_')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base || 'abu_rod';
}

function toAbsoluteUrl(raw) {
  const value = normalizeText(raw);
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) return `${BASE_URL}${value}`;
  return `${BASE_URL}/${value}`;
}

function handleFromUrl(url) {
  const parsed = new URL(url);
  return path.basename(parsed.pathname);
}

function priceFromCents(cents) {
  const value = Number(cents || 0);
  if (!Number.isFinite(value) || value <= 0) return '';
  return `$${(value / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function extractYear(text) {
  const match = normalizeText(text).match(/\b(20\d{2}|\d{2})\b/);
  if (!match) return '';
  const raw = match[1];
  return raw.length === 4 ? raw : `20${raw}`;
}

function buildAlias(year, model) {
  return year ? `${year.slice(-2)} ${normalizeText(model)}` : '';
}

function inferType(productType, sku, title) {
  const text = `${productType} ${sku} ${title}`.toUpperCase();
  if (/SPIN|SPINNING/.test(text)) return 'S';
  if (/CAST|CASTING|BAIT/.test(text)) return 'C';
  return '';
}

function normalizePower(value) {
  const text = decodeHtml(value);
  const map = {
    'Extra Ultra Light': 'XUL',
    'Ultra Light': 'UL',
    'Light': 'L',
    'Medium Light': 'ML',
    'Medium': 'M',
    'Medium Heavy': 'MH',
    'Heavy': 'H',
    'Extra Heavy': 'XH',
    'Extra Extra Heavy': 'XXH',
  };
  if (/[|/]/.test(text)) {
    const normalized = text
      .split(/\s*[|/]\s*/)
      .map((part) => map[part] || part)
      .filter(Boolean)
      .join('/');
    return normalized;
  }
  return map[text] || text;
}

function normalizeLineRating(value) {
  const text = decodeHtml(value);
  if (!text || /^none$/i.test(text)) return '';
  return text
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCodeName(variant, specs) {
  const title = normalizeText(variant.title);
  if (title && title !== 'Default Title') return title;
  const parts = [
    normalizeText(specs['Rod Length']),
    normalizeText(specs['Rod Power'] || specs.Power),
    normalizeText(specs['Number of Pieces']),
  ].filter(Boolean);
  return parts.join(' / ');
}

function normalizeFeatureText(features) {
  return (features || []).map((feature) => normalizeText(feature)).filter(Boolean).join(' / ');
}

function inferGripType(features) {
  const text = normalizeFeatureText(features);
  if (!text) return '';
  if (/Winn/i.test(text)) return 'Winn Dri-Tac';
  if (/cork\b/i.test(text) && /EVA/i.test(text)) return 'Cork / EVA';
  if (/EVA and Carbon split grip/i.test(text)) return 'EVA / Carbon split grip';
  if (/carbon split grip/i.test(text)) return 'Carbon split grip';
  if (/Closed Cell EVA/i.test(text)) return 'Closed Cell EVA';
  if (/high density EVA/i.test(text)) return 'High density EVA';
  if (/EVA split grip|split grip EVA|EVA handles|EVA grips/i.test(text)) return 'EVA split grip';
  if (/split grip handles/i.test(text)) return 'Split grip';
  return '';
}

function inferReelSeatPosition(features) {
  const text = normalizeFeatureText(features);
  if (!text) return '';
  if (/Fuji/i.test(text) && /reel seat/i.test(text)) return 'Fuji reel seat';
  if (/CCRS|Carbon Constructed Reel Seat/i.test(text)) return 'CCRS carbon constructed reel seat';
  if (/custom Abu designed reel seat/i.test(text)) return 'Abu Garcia custom ergonomic reel seat';
  if (/Ergonomic Abu designed reel seats?/i.test(text)) return 'Ergonomic Abu designed reel seat';
  return '';
}

function inferHookKeeperIncluded(features) {
  return /hook keeper/i.test(normalizeFeatureText(features)) ? '1' : '';
}

function inferGuideLayoutType(features) {
  return /ROCS|Robotically Optimized Casting System/i.test(normalizeFeatureText(features))
    ? 'ROCS guide train'
    : '';
}

function inferGuideUseHint(features, model = '') {
  const hints = [];
  const text = `${normalizeFeatureText(features)} ${normalizeText(model)}`;
  if (/ROCS|Robotically Optimized Casting System/i.test(text)) {
    hints.push('maximized casting distance with lighter lures');
  }
  if (/ultra-lightweight lures|BFS/i.test(text)) hints.push('finesse / lightweight lure use');
  if (/technique specific/i.test(text)) hints.push('technique-specific actions');
  return [...new Set(hints)].slice(0, 2).join(' / ');
}

function inferFeatureSellingPoints(features) {
  const points = [];
  const text = normalizeFeatureText(features);
  if (!text) return '';
  if (/Powerlux/i.test(text)) points.push('Powerlux blank technology');
  if (/\b\d+\s*-?\s*Ton graphite|solid carbon|Composite blend/i.test(text)) points.push('blank construction');
  if (/ROCS|Robotically Optimized Casting System/i.test(text)) points.push('ROCS guide train');
  if (/Titanium|Zirconium|Zirconia|stainless steel guides|aluminum oxide/i.test(text)) points.push('guide components');
  if (/EVA|Winn|cork|split grip|grips/i.test(text)) points.push('grip comfort');
  if (/hook keeper/i.test(text)) points.push('hook keeper');
  return points.join(' / ');
}

function inferProductTechnical(item, variant = null) {
  const features = item.features || [];
  const text = [item.description, ...features].map((value) => normalizeText(value)).join(' ');
  const terms = [];
  const add = (term) => {
    if (!terms.includes(term)) terms.push(term);
  };

  const powerlux = [...text.matchAll(/Powerlux[®™]?\s*(1000|500|200|100)\b/gi)]
    .map((match) => match[1])
    .sort((a, b) => Number(b) - Number(a));
  for (const number of [...new Set(powerlux)]) add(`Powerlux® ${number}`);
  if (/\bROCS[™®]?\b|Robotically Optimized Casting System/i.test(text)) add('ROCS™');
  if (/\bIntraCarbon[™®]?\b/i.test(text)) add('IntraCarbon™');
  if (/\bCCRS[™®]?\b|Carbon Constructed Reel Seat/i.test(text)) add('CCRS™');
  const pieces = String(variant?.specs?.['Number of Pieces'] || variant?.specs?.Pieces || '').trim();
  if (
    item.model === 'Beast™ Casting Rod' &&
    pieces === '2' &&
    /2 piece ferrule locking mechanism.*select models/i.test(text)
  ) {
    add('2 piece ferrule locking mechanism');
  }

  return terms.join(' / ');
}

function formatFitStyleTags(tags) {
  const order = ['bass', '溪流', '海鲈', '根钓', '岸投', '船钓', '旅行'];
  return order.filter((tag) => tags.includes(tag)).join(',');
}

function hasTravelContext(text, variants = []) {
  const hasThreePlusVariant = variants.some((variant) => {
    const pieces = normalizeText(variant.specs?.['Number of Pieces'] || variant.specs?.Pieces);
    const match = pieces.match(/\b([3-9]|10)\b/);
    return match && Number(match[1]) >= 3;
  });
  if (hasThreePlusVariant) return true;
  const hasTwoPieceOnly = /\b2[- ]?(?:pc|pcs|piece)\b|\btwo[- ]piece\b/.test(text);
  return /\btravel\b|\bmobile\b|\bpack\s*rod\b|\bmulti[- ]?piece\b|telescopic|多节|多節|振出|旅行|便携/i.test(text) && !hasTwoPieceOnly;
}

function inferFitStyleTags(item) {
  const modelText = normalizeText(item.model).toLowerCase();
  const text = [
    normalizeText(item.model),
    normalizeText(item.alias),
    normalizeText(item.type_tips),
    normalizeText(item.description),
    normalizeFeatureText(item.features),
    ...(item.variants || []).flatMap((variant) => [
      normalizeText(variant.sku),
      normalizeText(variant.title),
    ]),
  ]
    .join(' ')
    .toLowerCase();

  if (text.includes('ice')) return '';
  if (text.includes('muskie') && !text.includes('bass')) return '';
  const tags = [];
  if (
    [
      'max',
      'vendetta',
      'veritas',
      'vengeance',
      'fantasista',
      'zenon',
      'winch',
      'ike signature',
      'hunter shryock',
    ].some((cue) => modelText.includes(cue))
  ) {
    tags.push('bass');
  } else if (
    [
      'bass',
      'bfs',
      'bait finesse',
      'finesse',
      'frog',
      'flipping',
      'pitching',
      'crankbait',
      'reaction bait',
      'power fishing',
      'swimbaits for bass',
      'texas',
      'down shot',
    ].some((cue) => text.includes(cue))
  ) {
    tags.push('bass');
  }
  if (hasTravelContext(text, item.variants || [])) tags.push('旅行');
  return formatFitStyleTags(tags);
}

function inferExtraSpecFromFeatures(features) {
  const feature = (features || []).find((item) =>
    /\b\d+\s*-?\s*Ton graphite|Powerlux|solid carbon|Composite blend|IntraCarbon|carbon cross wrapped/i.test(item),
  );
  return feature ? `Feature: ${normalizeText(feature)}` : '';
}

function buildExtraSpec2(upcNote, reelSeat) {
  return [upcNote, reelSeat ? `Reel Seat: ${reelSeat}` : ''].filter(Boolean).join('; ');
}

function parseProductJson(html, sourceUrl) {
  const match = html.match(/let mntn_product_data = (\{.*?\});/s);
  if (!match) {
    throw new Error(`product JSON missing: ${sourceUrl}`);
  }
  return JSON.parse(match[1]);
}

function parseVariantMetafields(html) {
  const match = html.match(
    /<script type="application\/json" id="ProductVariantsMetafields">\s*([\s\S]*?)\s*<\/script>/i,
  );
  if (!match) return new Map();
  const parsed = JSON.parse(match[1]);
  return new Map(Object.entries(parsed || {}));
}

function parseVariantSpecs($) {
  const specsById = new Map();
  $('[data-variant-spec-clone]').each((_, el) => {
    const id = normalizeText($(el).attr('data-variant-spec-clone'));
    if (!id) return;
    const specs = {};
    $(el)
      .find('li.data-field')
      .each((__, li) => {
        const parts = $(li)
          .find('p')
          .map((___, p) => normalizeText($(p).text()))
          .get()
          .filter(Boolean);
        if (parts.length >= 2) specs[parts[0].replace(/:$/, '')] = parts[1];
      });
    specsById.set(id, specs);
  });
  return specsById;
}

function extractFeatures($) {
  const features = [];
  $('.product__accordion .accordion-item').each((_, itemEl) => {
    const item = $(itemEl);
    const title = normalizeText(item.find('.accordion-header__text').first().text());
    if (!/^features$/i.test(title)) return;
    const content = item.find('.accordion-content').first();
    const listItems = content
      .find('li')
      .map((__, li) => normalizeText($(li).text()))
      .get()
      .filter(Boolean);
    if (listItems.length) {
      features.push(...listItems);
      return;
    }
    const text = normalizeText(content.text());
    if (text) features.push(text);
  });
  return [...new Set(features)];
}

function mergeSpecs(...sources) {
  const merged = {};
  for (const source of sources) {
    for (const [key, value] of Object.entries(source || {})) {
      const normalized = decodeHtml(value);
      if (normalized) merged[key] = normalized;
    }
  }
  return merged;
}

function parseDetailHtml(html, sourceUrl) {
  const product = parseProductJson(html, sourceUrl);
  const $ = cheerio.load(html);
  const metafieldsById = parseVariantMetafields(html);
  const specsById = parseVariantSpecs($);
  const description = stripHtml(product.description);
  const title = normalizeText(product.title);
  const features = extractFeatures($);

  const variants = (product.variants || []).map((variant) => {
    const id = String(variant.id);
    const metaSpecs = metafieldsById.get(id) || {};
    const cloneSpecs = specsById.get(id) || {};
    const specs = mergeSpecs(metaSpecs, cloneSpecs);
    const modelNumber = normalizeText(specs['Model #'] || variant.sku || variant.public_title || variant.title);
    const imageUrl = variant?.featured_image?.src ? toAbsoluteUrl(variant.featured_image.src) : '';
    return {
      id,
      sku: modelNumber,
      item_code: normalizeText(variant.sku),
      barcode: normalizeText(variant.barcode),
      title: normalizeText(variant.public_title || variant.title),
      price: priceFromCents(variant.price),
      featured_image: imageUrl,
      specs,
    };
  });

  return {
    model: title,
    model_year: extractYear(title),
    alias: buildAlias(extractYear(title), title),
    type_tips: normalizeText(product.type),
    source_url: sourceUrl,
    description,
    features,
    main_image_url: toAbsoluteUrl(product.featured_image || ''),
    variants,
  };
}

async function fetchListItems({ force = false } = {}) {
  ensureDirs();
  const seen = new Set();
  const items = [];

  for (let page = 1; page <= 20; page += 1) {
    const pageUrl = page === 1 ? START_URL : `${BASE_URL}/collections/rods?page=${page}&sort_by=created-descending`;
    const cacheFile = path.join(LIST_CACHE_DIR, `page_${String(page).padStart(2, '0')}.html`);
    let html = '';
    if (!force && fs.existsSync(cacheFile)) {
      html = fs.readFileSync(cacheFile, 'utf8');
    } else {
      html = await getWithRetry(pageUrl);
      fs.writeFileSync(cacheFile, html, 'utf8');
      await sleep(250);
    }

    const $ = cheerio.load(html);
    const pageItems = [];
    $('product-card').each((_, cardEl) => {
      const card = $(cardEl);
      const href = normalizeText(card.find('a[href*="/collections/rods/products/"]').first().attr('href'));
      if (!href || href.includes('/products/giftcard')) return;
      const fullUrl = toAbsoluteUrl(href.split('?')[0]);
      if (seen.has(fullUrl)) return;
      seen.add(fullUrl);
      const title = normalizeText(card.find('h1, h2, .product-card__title').first().text());
      pageItems.push({ source_url: fullUrl, handle: handleFromUrl(fullUrl), title });
    });

    if (!pageItems.length) break;
    items.push(...pageItems);
  }

  const listPath = path.join(CACHE_DIR, 'abu_rod_list_items.json');
  fs.writeFileSync(listPath, JSON.stringify(items, null, 2), 'utf8');
  console.log(`[list] ${items.length} product URLs -> ${listPath}`);
  return items;
}

function readListItems() {
  const listPath = path.join(CACHE_DIR, 'abu_rod_list_items.json');
  if (!fs.existsSync(listPath)) {
    throw new Error(`list cache missing: ${listPath}. Run --stage=list first.`);
  }
  return JSON.parse(fs.readFileSync(listPath, 'utf8'));
}

async function fetchDetails({ force = false, start = 0, limit = Infinity } = {}) {
  ensureDirs();
  const items = readListItems();
  const slice = items.slice(start, Number.isFinite(limit) ? start + limit : undefined);
  const failures = [];

  for (let i = 0; i < slice.length; i += 1) {
    const item = slice[i];
    const index = start + i;
    const cacheFile = path.join(DETAIL_CACHE_DIR, `${String(index + 1).padStart(3, '0')}_${item.handle}.html`);
    if (!force && fs.existsSync(cacheFile)) {
      console.log(`[detail] cached ${index + 1}/${items.length} ${item.handle}`);
      continue;
    }

    try {
      const html = await getWithRetry(item.source_url);
      fs.writeFileSync(cacheFile, html, 'utf8');
      console.log(`[detail] fetched ${index + 1}/${items.length} ${item.handle}`);
      await sleep(350);
    } catch (error) {
      failures.push({ item, message: error.message });
      console.error(`[detail] failed ${item.source_url}: ${error.message}`);
    }
  }

  if (failures.length) {
    const failurePath = path.join(CACHE_DIR, 'detail_failures.json');
    fs.writeFileSync(failurePath, JSON.stringify(failures, null, 2), 'utf8');
    throw new Error(`${failures.length} detail pages failed. See ${failurePath}`);
  }
}

function findDetailCacheFile(index, handle) {
  const preferred = path.join(DETAIL_CACHE_DIR, `${String(index + 1).padStart(3, '0')}_${handle}.html`);
  if (fs.existsSync(preferred)) return preferred;
  const match = fs
    .readdirSync(DETAIL_CACHE_DIR)
    .find((name) => name.endsWith(`_${handle}.html`));
  return match ? path.join(DETAIL_CACHE_DIR, match) : '';
}

function downloadImage(url, filename) {
  if (!url) return '';
  const outPath = path.join(IMAGE_DIR, filename);
  if (!fs.existsSync(outPath)) {
    execFileSync('curl', ['-L', '-A', HTTP_CONFIG.headers['User-Agent'], '--max-time', '45', '-o', outPath, url], {
      stdio: 'ignore',
    });
  }
  return `${STATIC_PREFIX}${encodeURIComponent(filename)}`;
}

function imageFilename(model, imageUrl) {
  const parsed = imageUrl ? new URL(imageUrl) : null;
  const ext = parsed ? path.extname(parsed.pathname) || '.jpg' : '.jpg';
  return `${sanitizeFilename(model)}_main${ext}`;
}

function buildRows(normalized) {
  const now = new Date().toISOString();
  const rodRows = [];
  const detailRows = [];

  normalized.forEach((item, index) => {
    const rodId = `ABR${1000 + index}`;
    const imageUrl = item.main_image_url || item.variants.find((v) => v.featured_image)?.featured_image || '';
    const imageCdn = imageUrl ? downloadImage(imageUrl, imageFilename(item.model, imageUrl)) : '';
    const prices = item.variants.map((v) => v.price).filter(Boolean);
    const priceRange = prices.length ? [...new Set(prices)].join(' / ') : '';
    const fitStyleTags = item.fit_style_tags || inferFitStyleTags(item);
    item.fit_style_tags = fitStyleTags;

    rodRows.push({
      id: rodId,
      brand_id: BRAND_IDS.ABU_GARCIA,
      model: item.model,
      model_cn: '',
      model_year: item.model_year,
      alias: item.alias,
      type_tips: '',
      fit_style_tags: fitStyleTags,
      images: imageCdn,
      created_at: now,
      updated_at: now,
      series_positioning: '',
      main_selling_points: item.description,
      official_reference_price: priceRange,
      market_status: '在售',
      Description: item.description,
      player_positioning: '',
      player_selling_points: inferFeatureSellingPoints(item.features),
    });

    item.images = imageCdn;
    item.fit_style_tags = fitStyleTags;

    item.variants.forEach((variant) => {
      const specs = variant.specs || {};
      const type = inferType(item.type_tips, variant.sku, variant.title);
      const lineRating = normalizeLineRating(specs['Line Rating']);
      const guideType = normalizeText(specs['Guide Type']);
      const gripType = inferGripType(item.features);
      const reelSeat = inferReelSeatPosition(item.features);
      const featureSellingPoints = inferFeatureSellingPoints(item.features);
      const upcNote = variant.barcode ? `UPC: ${variant.barcode}` : '';
      detailRows.push({
        id: `ABRD${10000 + detailRows.length}`,
        rod_id: rodId,
        TYPE: type,
        SKU: variant.sku,
        POWER: normalizePower(specs['Rod Power'] || specs.Power),
        'TOTAL LENGTH': normalizeText(specs['Rod Length']),
        Action: normalizeText(specs['Rod Action'] || specs.Action),
        PIECES: normalizeText(specs['Number of Pieces']),
        CLOSELENGTH: '',
        WEIGHT: '',
        'Tip Diameter': '',
        'LURE WEIGHT': '',
        'Line Wt N F': lineRating,
        'PE Line Size': '',
        'Handle Length': '',
        'Reel Seat Position': '',
        'CONTENT CARBON': '',
        'Market Reference Price': variant.price,
        AdminCode: variant.item_code,
        'Service Card': '',
        ' Jig Weight': '',
        'Squid Jig Size': '',
        'Sinker Rating': '',
        created_at: now,
        updated_at: now,
        'LURE WEIGHT (oz)': '',
        'Sale Price': '',
        'Joint Type': '',
        'Code Name': buildCodeName(variant, specs),
        'Fly Line': '',
        'Grip Type': gripType,
        'Reel Size': '',
        guide_layout_type: inferGuideLayoutType(item.features),
        guide_use_hint: inferGuideUseHint(item.features, item.model),
        hook_keeper_included: inferHookKeeperIncluded(item.features),
        sweet_spot_lure_weight_real: '',
        official_environment: '',
        player_environment: '',
        player_positioning: '',
        player_selling_points: featureSellingPoints,
        Description: item.description,
        product_technical: variant.product_technical || inferProductTechnical(item, variant),
        'Extra Spec 1': guideType ? `Guide Type: ${guideType}` : inferExtraSpecFromFeatures(item.features),
        'Extra Spec 2': buildExtraSpec2(upcNote, reelSeat),
      });
      variant.product_technical = variant.product_technical || inferProductTechnical(item, variant);
    });
  });

  return { rodRows, detailRows };
}

function exportFromCache() {
  ensureDirs();
  const items = readListItems();
  const normalized = [];
  const missing = [];

  items.forEach((item, index) => {
    const cacheFile = findDetailCacheFile(index, item.handle);
    if (!cacheFile) {
      missing.push(item);
      return;
    }
    const detail = parseDetailHtml(fs.readFileSync(cacheFile, 'utf8'), item.source_url);
    normalized.push(detail);
  });

  if (missing.length) {
    throw new Error(`${missing.length} detail cache files missing. Run --stage=details to complete cache.`);
  }

  const { rodRows, detailRows } = buildRows(normalized);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(normalized, null, 2), 'utf8');

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rodRows, { header: HEADERS.rodMaster }), SHEET_NAMES.rod);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(detailRows, { header: HEADERS.rodDetail }),
    SHEET_NAMES.rodDetail,
  );
  XLSX.writeFile(wb, OUTPUT_FILE);
  execFileSync('python3', [SHADE_SCRIPT], { stdio: 'inherit' });

  console.log(`[export] wrote ${OUTPUT_JSON}`);
  console.log(`[export] wrote ${OUTPUT_FILE}`);
  console.log(`[export] masters=${rodRows.length} details=${detailRows.length}`);
}

function parseArgs(argv) {
  const args = {
    stage: 'all',
    force: false,
    start: 0,
    limit: Infinity,
  };

  for (const arg of argv) {
    if (arg === '--force') args.force = true;
    else if (arg.startsWith('--stage=')) args.stage = arg.split('=')[1];
    else if (arg.startsWith('--start=')) args.start = Number(arg.split('=')[1]);
    else if (arg.startsWith('--limit=')) args.limit = Number(arg.split('=')[1]);
  }

  if (!['all', 'list', 'details', 'export'].includes(args.stage)) {
    throw new Error(`unknown stage: ${args.stage}`);
  }
  if (!Number.isFinite(args.start) || args.start < 0) args.start = 0;
  if (!Number.isFinite(args.limit) || args.limit <= 0) args.limit = Infinity;
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.stage === 'list') {
    await fetchListItems(args);
    return;
  }
  if (args.stage === 'details') {
    await fetchDetails(args);
    return;
  }
  if (args.stage === 'export') {
    exportFromCache();
    return;
  }

  await fetchListItems(args);
  await fetchDetails(args);
  exportFromCache();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
