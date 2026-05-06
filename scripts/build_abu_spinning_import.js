const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { execFileSync } = require('child_process');
const XLSX = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');
const gearDataPaths = require('./gear_data_paths');

const LIST_URL = 'https://www.abugarcia.com/collections/reels?filter.p.product_type=Spinning+Reels&sort_by=manual';
const OUTPUT_FILE = gearDataPaths.resolveDataRaw('abu_spinning_reels_import.xlsx');
const OUTPUT_JSON = gearDataPaths.resolveDataRaw('abu_spinning_reels_normalized.json');
const IMAGE_DIR = '/Users/tommy/Pictures/images/abu_reels';
const STATIC_PREFIX = 'https://static.gearsage.club/gearsage/Gearimg/images/abu_reels/';

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sanitizeFilename(name) {
  return String(name || '').replace(/[\\/*?:"<>|]/g, '_').trim();
}

function stripHtml(html) {
  const $ = cheerio.load(String(html || ''));
  return normalizeText($.text());
}

function extractYear(text) {
  const m = normalizeText(text).match(/\b(20\d{2}|\d{2})\b/);
  if (!m) return '';
  const raw = m[1];
  return raw.length === 4 ? raw : `20${raw}`;
}

function buildAlias(year, model) {
  return year ? `${year.slice(-2)} ${normalizeText(model)}` : '';
}

function extractPriceYenFromCents(cents) {
  const n = Number(cents || 0);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `¥${(n / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function extractPriceDisplay(text) {
  const normalized = normalizeText(text).replace(/[^\d.]/g, '');
  if (!normalized) return '';
  return `¥${Number(normalized).toFixed(2)}`;
}

function extractMaxDragKg(text) {
  const normalized = normalizeText(text);
  const kg = normalized.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kg) return kg[1];
  const lb = normalized.match(/(\d+(?:\.\d+)?)\s*lb/i);
  if (lb) {
    const kgValue = Math.round(Number(lb[1]) * 0.45359237 * 10) / 10;
    return String(kgValue).replace(/\.0$/, '');
  }
  return '';
}

function extractBearing(text) {
  const normalized = normalizeText(text);
  const n = normalized.match(/(\d+)/);
  return n ? `${n[1]}/0` : '';
}

function convertYardsLbToDisplay(text) {
  const normalized = normalizeText(text).replace(/\s{2,}/g, ' ').replace(/\s*\/\s*/g, '/');
  if (!normalized) return '';
  const segments = normalized
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
      if (!m) return part;
      return `${m[2]}/${m[1]}`;
    });
  return segments.join(' / ');
}

function mergeNonEmpty(...sources) {
  const merged = {};
  for (const source of sources) {
    for (const [key, value] of Object.entries(source || {})) {
      const normalized = normalizeText(value);
      if (normalized) merged[key] = normalized;
    }
  }
  return merged;
}

function downloadFile(url, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  execFileSync('curl', ['-L', '-A', 'Mozilla/5.0', '--max-time', '45', '-o', outPath, url], {
    stdio: 'ignore',
  });
}

async function fetchHtml(url) {
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 60000,
  });
  return data;
}

async function fetchListItems() {
  const html = await fetchHtml(LIST_URL);
  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();
  $('product-card').each((_, cardEl) => {
    const card = $(cardEl);
    const link = card.find('a[href*="/collections/reels/products/"]').first();
    const href = normalizeText(link.attr('href'));
    if (!href || href.includes('/products/giftcard')) return;
    const full = href.startsWith('http') ? href : `https://www.abugarcia.com${href}`;
    if (seen.has(full)) return;
    seen.add(full);
    const text = normalizeText(card.find('h1, h2, .product-card__title').first().text());
    if (!text) return;
    items.push({ href: full, text });
  });
  return items;
}

function parseShopifyProduct(html) {
  const match = html.match(/let mntn_product_data = (\{.*?\});/s);
  if (!match) return null;
  return JSON.parse(match[1]);
}

function parseVariantMetafields(html) {
  const match = html.match(/<script type="application\/json" id="ProductVariantsMetafields">\s*([\s\S]*?)\s*<\/script>/i);
  if (!match) return new Map();
  try {
    const obj = JSON.parse(match[1]);
    return new Map(Object.entries(obj || {}));
  } catch {
    return new Map();
  }
}

function parseVariantSpecs($) {
  const specsById = new Map();
  $('[data-variant-spec-clone]').each((_, el) => {
    const id = normalizeText($(el).attr('data-variant-spec-clone'));
    if (!id) return;
    const spec = {};
    $(el).find('li.data-field').each((__, li) => {
      const texts = $(li).find('p').map((___, p) => normalizeText($(p).text())).get().filter(Boolean);
      if (texts.length >= 2) spec[texts[0].replace(/:$/, '')] = texts[1];
    });
    specsById.set(id, spec);
  });
  return specsById;
}

function parseCompareTableSpecs($) {
  const specsById = new Map();
  $('.product-compare-models__table table').each((_, table) => {
    const rows = $(table).find('tr');
    if (!rows.length) return;
    const headerCells = $(rows[0]).find('th');
    if (headerCells.length < 3) return;
    const headers = headerCells
      .slice(1)
      .map((__, th) => normalizeText($(th).text()))
      .get()
      .filter(Boolean);
    if (!headers.length) return;

    rows.slice(1).each((__, tr) => {
      const row = $(tr);
      const btn = row.find('[data-variant-tab-id]').first();
      const id = normalizeText(btn.attr('data-variant-tab-id'));
      if (!id) return;
      const cells = row.find('td').slice(1, -1);
      if (!cells.length) return;
      const spec = specsById.get(id) || {};
      cells.each((i, td) => {
        const header = headers[i];
        const value = normalizeText($(td).text());
        if (header && value) spec[header] = value;
      });
      specsById.set(id, spec);
    });
  });
  return specsById;
}

async function fetchDetail(item) {
  const html = await fetchHtml(item.href);
  const $ = cheerio.load(html);
  const product = parseShopifyProduct(html);
  if (!product) throw new Error(`product JSON missing: ${item.href}`);

  const title = normalizeText(product.title);
  const description = stripHtml(product.description);
  const specsById = parseVariantSpecs($);
  const tableSpecsById = parseCompareTableSpecs($);
  const metafieldsById = parseVariantMetafields(html);
  const featuresText = [...$('.accordion__content, .rte, .product__description, [data-tab-content], .tab-content')]
    .map((el) => normalizeText($(el).text()))
    .filter((text) => text && text.length > 40)
    .filter((text) => !/Free Standard Shipping|Store Credit|See Details/i.test(text));

  const variants = (product.variants || []).map((variant) => {
    const cloneSpecs = specsById.get(String(variant.id)) || {};
    const tableSpecs = tableSpecsById.get(String(variant.id)) || {};
    const metaSpecs = metafieldsById.get(String(variant.id)) || {};
    const specs = mergeNonEmpty(cloneSpecs, tableSpecs, metaSpecs);
    return {
      id: String(variant.id),
      sku: normalizeText(metaSpecs['Model #'] || variant.title || variant.public_title || variant.option1 || ''),
      barcode: normalizeText(variant.barcode),
      price: extractPriceYenFromCents(variant.price),
      featured_image: variant?.featured_image?.src
        ? `https:${variant.featured_image.src}`
        : '',
      specs,
    };
  });

  const firstImage = product.featured_image ? `https:${product.featured_image}` : '';
  return {
    model: title,
    source_url: item.href,
    description,
    features_text: featuresText,
    product,
    main_image_url: firstImage,
    variants,
  };
}

async function main() {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const items = await fetchListItems();
  const normalized = [];
  const reelRows = [];
  const detailRows = [];
  const now = new Date().toISOString();

  for (let idx = 0; idx < items.length; idx += 1) {
    const item = items[idx];
    const detail = await fetchDetail(item);
    const model = normalizeText(detail.model);
    const modelYear = extractYear(model);
    const alias = buildAlias(modelYear, model);

    const imageUrl = detail.main_image_url || detail.variants.find((v) => v.featured_image)?.featured_image || '';
    let imageCdn = '';
    if (imageUrl) {
      const ext = path.extname(imageUrl.split('?')[0]) || '.jpg';
      const filename = `${sanitizeFilename(model)}_main${ext}`;
      const localPath = path.join(IMAGE_DIR, filename);
      if (!fs.existsSync(localPath)) {
        try {
          downloadFile(imageUrl, localPath);
        } catch {}
      }
      imageCdn = `${STATIC_PREFIX}${encodeURIComponent(filename)}`;
    }

    const masterId = `ARE${1000 + idx}`;
    reelRows.push({
      id: masterId,
      brand_id: BRAND_IDS.ABU_GARCIA,
      model,
      model_cn: '',
      model_year: modelYear,
      alias,
      type_tips: '',
      type: 'spinning',
      images: imageCdn,
      created_at: now,
      updated_at: now,
      series_positioning: '',
      main_selling_points: detail.description,
      official_reference_price: '',
      market_status: '在售',
      Description: detail.description,
      market_reference_price: '',
      player_positioning: '',
      player_selling_points: '',
    });

    normalized.push({
      model,
      model_year: modelYear,
      alias,
      source_url: detail.source_url,
      main_image_url: imageUrl,
      images: imageCdn,
      intro_text: detail.description,
      features_text: detail.features_text,
      variants: detail.variants,
    });

    for (const variant of detail.variants) {
      const spec = variant.specs || {};
      detailRows.push({
        id: `ARED${10000 + detailRows.length}`,
        reel_id: masterId,
        SKU: variant.sku,
        'GEAR RATIO': normalizeText(spec['Gear Ratio']).replace(/:1$/, ''),
        DRAG: '',
        'MAX DRAG': extractMaxDragKg(spec['Max Drag']),
        'WEIGHT': normalizeText(spec['Weight']),
        spool_diameter_per_turn_mm: '',
        spool_diameter_mm: '',
        Nylon_no_m: '',
        Nylon_lb_m: convertYardsLbToDisplay(spec['Mono Cap (yds/lbs)'] || spec['Mono Capacity (yds/lbs)']),
        fluorocarbon_no_m: '',
        fluorocarbon_lb_m: '',
        pe_no_m: convertYardsLbToDisplay(spec['Braid Cap (yds/lbs)'] || spec['Braid Capacity (yds/lbs)']),
        cm_per_turn: '',
        handle_length_mm: '',
        bearing_count_roller: extractBearing(spec['# Ball Bearings']),
        body_material: '',
        body_material_tech: '',
        gear_material: '',
        handle_knob_type: '',
        official_environment: '',
        line_capacity_display: '',
        market_reference_price: variant.price || extractPriceDisplay(spec['Price']),
        product_code: variant.barcode,
        created_at: now,
        updated_at: now,
        drag_click: '',
        spool_depth_normalized: '',
        gear_ratio_normalized: '',
        brake_type_normalized: '',
        fit_style_tags: '',
        min_lure_weight_hint: '',
        is_compact_body: '',
        handle_style: '',
        MAX_DURABILITY: '',
        type: 'spinning',
        is_sw_edition: '',
        variant_description: '',
        Description: detail.description,
        player_environment: '',
        is_handle_double: '',
        EV_link: '',
        Specs_link: '',
        spool_weight_g: '',
      });
    }
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(normalized, null, 2), 'utf8');

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reelRows, { header: HEADERS.reelMaster }), SHEET_NAMES.reel);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows, { header: HEADERS.spinningReelDetail }), SHEET_NAMES.spinningReelDetail);
  XLSX.writeFile(wb, OUTPUT_FILE);

  console.log(`Saved ${reelRows.length} Abu spinning reels to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
