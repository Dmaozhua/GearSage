const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');
const cheerio = require('cheerio');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');
const gearDataPaths = require('./gear_data_paths');

const LIST_URL = 'https://www.daiwa.com/tw/product/productlist?category1=%E6%8D%B2%E7%B7%9A%E5%99%A8&category2=%E7%B4%A1%E8%BB%8A%E5%BC%8F%E6%8D%B2%E7%B7%9A%E5%99%A8';
const SITE_ORIGIN = 'https://www.daiwa.com';
const DATA_DIR = gearDataPaths.dataRawDir;
const DRY_RUN_OUTPUT_FILE = path.join(DATA_DIR, 'daiwa_spinning_reels_import_current_official_dry_run.xlsx');
const FINAL_OUTPUT_FILE = path.join(DATA_DIR, 'daiwa_spinning_reels_import.xlsx');
const OUTPUT_JSON = path.join(DATA_DIR, 'daiwa_spinning_reels_current_official_normalized.json');
const AUDIT_JSON = path.join(DATA_DIR, 'daiwa_spinning_reels_current_official_audit.json');
const AUDIT_MD = path.join(DATA_DIR, 'daiwa_spinning_reels_current_official_audit.md');
const IMAGE_DIR = '/Users/tommy/Pictures/images/daiwa_reels';
const STATIC_PREFIX = 'https://static.gearsage.club/gearsage/Gearimg/images/daiwa_reels/';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const COMMIT = process.argv.includes('--commit') || process.env.DAIWA_CURRENT_COMMIT === '1';
const FORCE_IMAGES = process.argv.includes('--force-images') || process.env.DAIWA_FORCE_IMAGES === '1';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[‐‑‒–—―－]/g, '-')
    .replace(/[＿]/g, '_')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanModelText(value) {
  return normalizeText(value)
    .replace(/^紡車式捲線器\s*/u, '')
    .replace(/\s*製造商建議零售價.*$/u, '')
    .trim();
}

function sanitizeFilename(name) {
  return normalizeText(name).replace(/[\\/*?:"<>|]/g, '_').trim();
}

function absoluteUrl(url) {
  const raw = normalizeText(url);
  if (!raw) return '';
  try {
    return new URL(raw, SITE_ORIGIN).toString();
  } catch {
    return raw;
  }
}

function detectExtension(url) {
  const lower = String(url || '').toLowerCase();
  if (lower.includes('.png')) return '.png';
  if (lower.includes('.webp')) return '.webp';
  if (lower.includes('.jpeg')) return '.jpeg';
  return '.jpg';
}

function buildStableDaiwaSpinningDetailId(masterId, sku, index = 0) {
  const normalizedMasterId = normalizeText(masterId);
  const normalizedSku = normalizeText(sku).toUpperCase();
  const hash = crypto
    .createHash('sha1')
    .update(`${normalizedMasterId}::${normalizedSku || index}`)
    .digest('hex')
    .slice(0, 10)
    .toUpperCase();
  return `DRED${normalizedMasterId.replace(/^DRE/, '')}_${hash}`;
}

function extractYear(text) {
  const value = normalizeText(text);
  const match = value.match(/(?:^|\s)(20\d{2}|\d{2})(?=[A-Z]|[A-Z\s])/i) || value.match(/\b(20\d{2})\b/);
  if (!match) return '';
  const raw = match[1];
  return raw.length === 4 ? raw : `20${raw}`;
}

function buildAlias(year, model) {
  return year ? `${year.slice(-2)} ${normalizeText(model)}` : '';
}

function normalizePrice(value) {
  const digits = normalizeText(value).replace(/[^\d]/g, '');
  if (!digits) return '';
  return `¥${Number(digits).toLocaleString('en-US')}`;
}

function cleanSpecValue(value) {
  const text = normalizeText(value);
  return text === '-' ? '' : text;
}

function priceRangeFromRows(rows) {
  const prices = rows
    .map((row) => normalizeText(row.specs.price).replace(/[^\d]/g, ''))
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);
  if (prices.length === 0) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `¥${min.toLocaleString('en-US')}` : `¥${min.toLocaleString('en-US')} - ¥${max.toLocaleString('en-US')}`;
}

function normalizeCapacity(value) {
  const normalized = normalizeText(value);
  if (!normalized || normalized === '-' || /^No\.?$/i.test(normalized)) return '';
  return normalized
    .replace(/_/g, ' / ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s*-\s*/g, '-')
    .trim();
}

function normalizeSku(sku, model) {
  let text = normalizeText(sku)
    .replace(/[。．.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const modelText = normalizeText(model);
  const upperModel = modelText.toUpperCase();

  if (upperModel.includes('SALTIGA')) {
    text = text.replace(/\bSoltiga\b/gi, 'SALTIGA');
  }
  if (upperModel.includes('CERTATE')) {
    text = text.replace(/\b(?:Seltate|Sertate)\b/gi, 'CERTATE');
  }
  if (upperModel.includes('REVROS')) {
    text = text.replace(/\b(?:Revlos|Rebros)\b/gi, 'REVROS');
  }
  if (upperModel.includes('EMERALDAS')) {
    text = text.replace(/\bEmeraldus\b/gi, 'EMERALDAS');
  }
  if (modelText.includes('月下美人')) {
    text = text.replace(/\b(?:Moonbeam|Tsukishibijin)\b/gi, '月下美人');
  }
  if (upperModel.includes('WORLD SPIN')) {
    text = text.replace(/世界旋轉/gi, 'WORLD SPIN').replace(/\bWorldspin\b/gi, 'WORLD SPIN');
  }
  if (upperModel.includes('FINESURF')) {
    text = text
      .replace(/\bfine\s+surf\s+35\b/gi, 'FINESURF 35')
      .replace(/\bHosoit\b/gi, '細糸')
      .replace(/\bftite\b/gi, '太糸');
  }
  if (upperModel.includes('LONGBEAM')) {
    text = text.replace(/^長(?:光束|樑|梁)\s*35/i, 'LONGBEAM 35');
  }
  if (upperModel.includes('AORIMATIC')) {
    text = text.replace(/Aorimatic/gi, 'AORIMATIC').replace(/^(\d{2})(?=AORIMATIC\b)/, '$1 ');
  }
  if (upperModel.includes('CROSSCAST')) {
    text = text.replace(/\bCrosscast\b/gi, 'CROSSCAST');
  }
  if (upperModel.includes('CREST')) {
    text = text.replace(/\bCrest\b/gi, 'CREST');
  }
  if (upperModel.includes('TAMAN MONSTER')) {
    text = text.replace(/\bTaman Monster\b/gi, 'TAMAN MONSTER');
  }
  if (upperModel.includes('LEGAL')) {
    text = text.replace(/\bRegal\b/gi, 'REGAL').replace(/\s+PE\s+Tsuki\b/gi, ' 附PE線');
  }
  return text;
}

function normalizeHandleKnobType(value) {
  const text = normalizeText(value);
  if (text === '我是 Shapelite。') return 'I 型轻量';
  if (text === 'T 型燈') return 'T 型轻量';
  if (text === 'I 型燈') return 'I 型轻量';
  if (text === 'EVA 圓燈') return 'EVA 圆型轻量';
  return text;
}

function buildLineCapacityDisplay(specs) {
  const parts = [];
  if (specs.nylon_no_m) parts.push(`Nylon(号-m) ${specs.nylon_no_m}`);
  if (specs.nylon_lb_m) parts.push(`Nylon(lb-m) ${specs.nylon_lb_m}`);
  if (specs.fluorocarbon_no_m) parts.push(`Fluoro(号-m) ${specs.fluorocarbon_no_m}`);
  if (specs.fluorocarbon_lb_m) parts.push(`Fluoro(lb-m) ${specs.fluorocarbon_lb_m}`);
  if (specs.pe_no_m) parts.push(`PE(号-m) ${specs.pe_no_m}`);
  return parts.join(' / ');
}

function parseBearing(value) {
  const text = normalizeText(value);
  const paren = text.match(/\(([^)]+)\)/);
  if (paren) return normalizeText(paren[1]);
  return text;
}

function isDaiwaDoubleHandleSku(sku) {
  const text = normalizeText(sku).toUpperCase();
  return /(?:^|[-\s])DH(?:$|[-\s]|PG$|HG$|XH$|XG$)/.test(text) || /DH$/.test(text);
}

function getDaiwaSpinningHandleStyle(sku) {
  return isDaiwaDoubleHandleSku(sku) ? '双摇臂' : '单摇臂';
}

function isDaiwaCompactBodySku(sku) {
  const text = normalizeText(sku).toUpperCase();
  return /(?:^|\s)(?:FC\s*)?LT[0-9A-Z]+-C[A-Z]*(?:-[A-Z]+)*$/.test(text) || /\bFC\s*LT/.test(text);
}

function getSpoolDepthNormalized(sku) {
  const text = normalizeText(sku).toUpperCase();
  const token = (text.match(/\b(?:FC\s*)?LT\s*\d+[A-Z-]*/i) || text.match(/\b\d{3,5}[A-Z-]*/i) || [''])[0]
    .replace(/\s+/g, '');
  if (/SSS/.test(token)) return '特超浅线杯';
  if (/SS/.test(token)) return '超浅线杯';
  if (/(?:\d|-)S(?:-|$|[A-Z])/.test(token)) return '浅线杯';
  if (/MS/.test(token)) return '中浅线杯';
  if (/(?:\d|-)M(?:-|$|[A-Z])/.test(token)) return '中线杯';
  if (/\d{3,5}D(?:-|$|[A-Z])/.test(token)) return '深杯';
  return '标准';
}

function getGearRatioNormalized(value) {
  const ratio = Number(normalizeText(value).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(ratio)) return '';
  if (ratio <= 5.0) return '低速比';
  if (ratio >= 6.2) return '高速比';
  return '中速比';
}

function getOfficialEnvironment(model, sku) {
  const text = `${normalizeText(model)} ${normalizeText(sku)}`.toUpperCase();
  if (/SALTIGA|SW|BG|TAMAN|SURF|WINDSURF|FINESURF|LONGBEAM|CROSSCAST|AORIMATIC|EMERALDAS|月下美人/.test(text)) {
    return '海水路亚';
  }
  if (/TATULA/.test(text)) return '淡水路亚';
  return '淡海水泛用';
}

function getPlayerEnvironment(model, sku) {
  const text = `${normalizeText(model)} ${normalizeText(sku)}`.toUpperCase();
  if (/SALTIGA|CERTATE SW|BG SW|TAMAN/.test(text)) return '海水重型路亚';
  if (/SURF|WINDSURF|FINESURF|LONGBEAM|CROSSCAST/.test(text)) return '海水远投';
  if (/EMERALDAS|AORIMATIC/.test(text)) return '海水木虾';
  if (/月下美人/.test(text)) return '轻盐 / 近海';
  if (/TATULA/.test(text)) return '淡水路亚';
  return '淡海水泛用';
}

function isSwEdition(model, sku) {
  const text = `${normalizeText(model)} ${normalizeText(sku)}`.toUpperCase();
  return /\bSW\b/.test(text) ? '1' : '0';
}

function getSectionText($, headingText) {
  const heading = $('h2,h3').filter((_, el) => normalizeText($(el).text()).includes(headingText)).first();
  if (!heading.length) return '';
  const chunks = [];
  let node = heading.next();
  while (node.length && !/^h[23]$/i.test(node[0].tagName || '')) {
    const text = normalizeText(node.text());
    if (text) chunks.push(text);
    node = node.next();
  }
  return chunks.join(' ');
}

function extractDescription($) {
  const stopHeadings = new Set(['DAIWA 技術', '產品詳情', '線杯對應表', '附件', 'VIDEO', '發售月份', '產品規格', '固定連結', '使用說明書']);
  const chunks = [];
  $('h2,h3').each((_, el) => {
    const text = normalizeText($(el).text());
    if (!text) return;
    if (stopHeadings.has(text)) return false;
    if (/^■/.test(text)) return;
    if (!chunks.includes(text)) chunks.push(text);
    return false;
  });
  $('div.text').each((_, el) => {
    const text = normalizeText($(el).text());
    if (!text || text.length < 30) return;
    if (/PdfString|ScrollLeft|ScrollRight|DisplayWith/.test(text)) return;
    if (!chunks.includes(text)) chunks.push(text);
    return false;
  });
  return chunks.join(' / ').slice(0, 500);
}

function extractManualLink($) {
  const manualHeading = $('h2,h3').filter((_, el) => normalizeText($(el).text()).includes('使用說明書')).first();
  const links = [];
  if (manualHeading.length) {
    let node = manualHeading.next();
    while (node.length && !/^h[23]$/i.test(node[0].tagName || '')) {
      node.find('a[href*=".pdf"]').each((_, a) => links.push(absoluteUrl($(a).attr('href'))));
      if (node.is('a[href*=".pdf"]')) links.push(absoluteUrl(node.attr('href')));
      node = node.next();
    }
  }
  if (links.length) return links[0];
  const fallback = $('a[href*=".pdf"]').filter((_, a) => {
    const text = normalizeText($(a).text());
    const href = normalizeText($(a).attr('href'));
    return !/spool|graph|線杯/i.test(`${text} ${href}`);
  }).first();
  return fallback.length ? absoluteUrl(fallback.attr('href')) : '';
}

function extractProductCards(html) {
  const $ = cheerio.load(html);
  const cards = [];
  const seen = new Set();
  $('a[href^="/tw/product/"]').each((_, a) => {
    const href = normalizeText($(a).attr('href'));
    const text = normalizeText($(a).text());
    if (!/\/tw\/product\/[a-z0-9]+$/i.test(href) || !text.includes('紡車式捲線器')) return;
    const url = absoluteUrl(href);
    if (seen.has(url)) return;
    seen.add(url);
    const model = cleanModelText(text);
    const img = $(a).find('img').attr('src') || $(a).find('source').attr('srcset') || '';
    const priceText = (text.match(/製造商建議零售價\s*(.+)$/u) || [])[1] || '';
    cards.push({
      url,
      pageToken: path.basename(new URL(url).pathname),
      model,
      listText: text,
      imageUrl: absoluteUrl(img),
      listPriceText: normalizeText(priceText),
    });
  });
  return cards;
}

function mapSpecHeader(header, value, specs, rawSpecs) {
  const key = normalizeText(header);
  const rawValue = normalizeText(value);
  const normalized = cleanSpecValue(value);
  rawSpecs[key] = rawValue;
  if (!normalized) return;
  if (key.includes('齒輪比')) specs.gear_ratio = normalized;
  else if (key.includes('標準自重')) specs.weight_g = normalized;
  else if (key.includes('捲線長度')) specs.cm_per_turn = normalized;
  else if (key.includes('最大拉力')) specs.max_drag_kg = normalized;
  else if (key.includes('PE')) specs.pe_no_m = normalizeCapacity(normalized);
  else if (key.includes('尼龍') && key.includes('lb')) specs.nylon_lb_m = normalizeCapacity(normalized);
  else if (key.includes('尼龍') && key.includes('號')) specs.nylon_no_m = normalizeCapacity(normalized);
  else if ((key.includes('氟碳') || key.includes('碳氟')) && key.includes('lb')) specs.fluorocarbon_lb_m = normalizeCapacity(normalized);
  else if ((key.includes('氟碳') || key.includes('碳氟')) && key.includes('號')) specs.fluorocarbon_no_m = normalizeCapacity(normalized);
  else if (key.includes('握把臂長')) specs.handle_length_mm = normalized;
  else if (key.includes('軸承') && key.includes('滾珠') && key.includes('滾柱')) specs.bearing_count_roller = parseBearing(normalized);
  else if (key.includes('線杯尺寸') || key.includes('直徑mm')) specs.spool_diameter_mm = normalized;
  else if (key.includes('旋鈕規格')) specs.handle_knob_type = normalizeHandleKnobType(normalized);
  else if (key.includes('旋鈕更換尺寸')) specs.handle_knob_exchange_size = normalized;
  else if (key.includes('本體材質')) specs.body_material = normalized;
  else if (key.includes('本體結構')) specs.body_material_tech = normalized;
  else if (key.includes('齒輪材質')) specs.gear_material = normalized;
  else if (key.includes('實用耐力')) specs.max_durability_kg = normalized;
  else if (key.includes('製造商建議零售價')) specs.price = normalizePrice(normalized);
  else if (key === 'JAN') specs.product_code = normalized;
}

function extractSpecRows($) {
  let bestTable = null;
  let bestScore = 0;
  $('table').each((_, table) => {
    const headers = $(table).find('tr').first().find('th,td').map((__, cell) => normalizeText($(cell).text())).get();
    const joined = headers.join(' ');
    let score = 0;
    if (headers[0] && /^(物品|品名|ITEM)$/i.test(headers[0])) score += 2;
    if (joined.includes('齒輪比')) score += 4;
    if (joined.includes('標準自重')) score += 4;
    if (joined.includes('捲線長度')) score += 4;
    if (joined.includes('最大拉力')) score += 3;
    if (joined.includes('製造商建議零售價')) score += 2;
    if (joined.includes('JAN')) score += 2;
    if (score > bestScore) {
      bestScore = score;
      bestTable = table;
    }
  });
  if (!bestTable || bestScore < 8) return [];
  const table = $(bestTable);
  const rows = table.find('tr').toArray();
  if (rows.length < 2) return [];
  const headers = $(rows[0]).find('th,td').map((_, cell) => normalizeText($(cell).text())).get();
  return rows.slice(1).map((tr, index) => {
    const cells = $(tr).find('th,td').map((_, cell) => normalizeText($(cell).text())).get();
    if (cells.every((cell) => !cell)) return null;
    const sku = normalizeText(cells[0]);
    const specs = {};
    const rawSpecs = {};
    headers.forEach((header, cellIndex) => mapSpecHeader(header, cells[cellIndex], specs, rawSpecs));
    return { sku, rawSku: sku, specs, rawSpecs, rowIndex: index };
  }).filter(Boolean);
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  return res.text();
}

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function downloadImage(url, outPath) {
  if (!url || (!FORCE_IMAGES && fs.existsSync(outPath))) return;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const data = await fetchBuffer(url);
  fs.writeFileSync(outPath, data);
}

function toImageCdnUrl(card) {
  const filename = `${sanitizeFilename(card.model)}_main${detectExtension(card.imageUrl)}`;
  return `${STATIC_PREFIX}${encodeURIComponent(filename)}`;
}

function toImagePath(card) {
  const filename = `${sanitizeFilename(card.model)}_main${detectExtension(card.imageUrl)}`;
  return path.join(IMAGE_DIR, filename);
}

function buildRows(products) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const reelRows = [];
  const detailRows = [];

  products.forEach((product, index) => {
    const masterId = `DRE${String(1000 + index).padStart(4, '0').slice(-4)}`;
    const firstSku = product.variants[0]?.sku || '';
    const modelYear = extractYear(firstSku) || extractYear(product.model) || '';
    const officialPrice = priceRangeFromRows(product.variants) || product.listPriceText;
    const description = normalizeText(product.description);
    reelRows.push({
      id: masterId,
      brand_id: BRAND_IDS.DAIWA,
      model: product.model,
      model_cn: '',
      model_year: modelYear,
      alias: buildAlias(modelYear, product.model),
      type_tips: '',
      type: 'spinning',
      images: toImageCdnUrl(product),
      created_at: now,
      updated_at: now,
      series_positioning: '',
      main_selling_points: description,
      official_reference_price: officialPrice,
      market_status: '在售',
      Description: description,
      market_reference_price: '',
      player_positioning: '',
      player_selling_points: '',
    });

    product.variants.forEach((variant, variantIndex) => {
      const specs = variant.specs || {};
      const sku = normalizeText(variant.sku);
      detailRows.push({
        id: buildStableDaiwaSpinningDetailId(masterId, sku, variantIndex),
        reel_id: masterId,
        SKU: sku,
        'GEAR RATIO': specs.gear_ratio || '',
        DRAG: '',
        'MAX DRAG': specs.max_drag_kg || '',
        WEIGHT: specs.weight_g || '',
        spool_diameter_per_turn_mm: '',
        spool_diameter_mm: specs.spool_diameter_mm || '',
        Nylon_no_m: specs.nylon_no_m || '',
        Nylon_lb_m: specs.nylon_lb_m || '',
        fluorocarbon_no_m: specs.fluorocarbon_no_m || '',
        fluorocarbon_lb_m: specs.fluorocarbon_lb_m || '',
        pe_no_m: specs.pe_no_m || '',
        cm_per_turn: specs.cm_per_turn || '',
        handle_length_mm: specs.handle_length_mm || '',
        bearing_count_roller: specs.bearing_count_roller || '',
        body_material: specs.body_material || '',
        body_material_tech: specs.body_material_tech || '',
        gear_material: specs.gear_material || '',
        handle_knob_type: specs.handle_knob_type || '',
        official_environment: getOfficialEnvironment(product.model, sku),
        line_capacity_display: buildLineCapacityDisplay(specs),
        market_reference_price: specs.price || '',
        product_code: specs.product_code || '',
        created_at: now,
        updated_at: now,
        drag_click: '',
        spool_depth_normalized: getSpoolDepthNormalized(sku),
        gear_ratio_normalized: getGearRatioNormalized(specs.gear_ratio),
        brake_type_normalized: '',
        fit_style_tags: '',
        min_lure_weight_hint: '',
        is_compact_body: isDaiwaCompactBodySku(sku) ? '是' : '',
        handle_style: getDaiwaSpinningHandleStyle(sku),
        MAX_DURABILITY: specs.max_durability_kg || '',
        type: 'spinning',
        is_sw_edition: isSwEdition(product.model, sku),
        variant_description: '',
        Description: '',
        player_environment: getPlayerEnvironment(product.model, sku),
        is_handle_double: isDaiwaDoubleHandleSku(sku) ? '1' : '0',
        EV_link: '',
        Specs_link: product.manualLink || '',
      });
    });
  });

  return { reelRows, detailRows };
}

function writeWorkbook(filePath, reelRows, detailRows) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reelRows, { header: HEADERS.reelMaster }), SHEET_NAMES.reel);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows, { header: HEADERS.spinningReelDetail }), SHEET_NAMES.spinningReelDetail);
  XLSX.writeFile(wb, filePath);
}

function buildAudit(products, reelRows, detailRows, warnings) {
  const detailFields = [
    'GEAR RATIO', 'MAX DRAG', 'WEIGHT', 'spool_diameter_mm', 'Nylon_no_m', 'Nylon_lb_m',
    'fluorocarbon_no_m', 'fluorocarbon_lb_m', 'pe_no_m', 'cm_per_turn', 'handle_length_mm',
    'bearing_count_roller', 'body_material', 'body_material_tech', 'gear_material', 'handle_knob_type',
    'official_environment', 'line_capacity_display', 'market_reference_price', 'product_code',
    'spool_depth_normalized', 'gear_ratio_normalized', 'is_compact_body', 'handle_style',
    'MAX_DURABILITY',
    'is_sw_edition', 'player_environment', 'is_handle_double', 'Specs_link',
  ];
  const masterFields = ['model_year', 'alias', 'images', 'main_selling_points', 'official_reference_price', 'Description'];
  const detailCoverage = Object.fromEntries(detailFields.map((field) => [
    field,
    `${detailRows.filter((row) => normalizeText(row[field])).length}/${detailRows.length}`,
  ]));
  const masterCoverage = Object.fromEntries(masterFields.map((field) => [
    field,
    `${reelRows.filter((row) => normalizeText(row[field])).length}/${reelRows.length}`,
  ]));
  const rowCountsByProduct = products.map((product, index) => ({
    id: reelRows[index].id,
    model: product.model,
    sku_count: product.variants.length,
    url: product.url,
  }));
  return {
    source: LIST_URL,
    generated_at: new Date().toISOString(),
    committed_to_formal_import: COMMIT,
    master_count: reelRows.length,
    detail_count: detailRows.length,
    master_coverage: masterCoverage,
    detail_coverage: detailCoverage,
    row_counts_by_product: rowCountsByProduct,
    warnings,
  };
}

function writeAuditMarkdown(audit) {
  const lines = [
    '# Daiwa Taiwan Spinning Reel Current Official Audit',
    '',
    `- Source: ${audit.source}`,
    `- Generated at: ${audit.generated_at}`,
    `- Committed to formal import: ${audit.committed_to_formal_import ? 'yes' : 'no'}`,
    `- Master rows: ${audit.master_count}`,
    `- Detail rows: ${audit.detail_count}`,
    '',
    '## Master Coverage',
    ...Object.entries(audit.master_coverage).map(([field, value]) => `- ${field}: ${value}`),
    '',
    '## Detail Coverage',
    ...Object.entries(audit.detail_coverage).map(([field, value]) => `- ${field}: ${value}`),
    '',
    '## Product Counts',
    ...audit.row_counts_by_product.map((item) => `- ${item.id} ${item.model}: ${item.sku_count}`),
  ];
  if (audit.warnings.length) {
    lines.push('', '## Warnings', ...audit.warnings.map((warning) => `- ${warning}`));
  }
  fs.writeFileSync(AUDIT_MD, `${lines.join('\n')}\n`);
}

async function main() {
  const warnings = [];
  console.log(`[Daiwa TW current] Fetching list: ${LIST_URL}`);
  const listHtml = await fetchText(LIST_URL);
  const cards = extractProductCards(listHtml);
  if (cards.length !== 33) warnings.push(`Expected 33 product cards, found ${cards.length}`);

  const products = [];
  for (const [index, card] of cards.entries()) {
    console.log(`[Daiwa TW current] ${index + 1}/${cards.length} ${card.model}`);
    const html = await fetchText(card.url);
    const $ = cheerio.load(html);
    const variants = extractSpecRows($).map((variant) => ({
      ...variant,
      sku: normalizeSku(variant.sku, card.model),
    }));
    if (variants.length === 0) warnings.push(`${card.model}: no spec rows found`);
    const product = {
      ...card,
      description: extractDescription($),
      productDetails: getSectionText($, '產品詳情'),
      manualLink: extractManualLink($),
      localImagePath: toImagePath(card),
      cdnImageUrl: toImageCdnUrl(card),
      variants,
    };
    products.push(product);
    try {
      await downloadImage(card.imageUrl, toImagePath(card));
    } catch (error) {
      warnings.push(`${card.model}: image download failed: ${error.message}`);
    }
  }

  const { reelRows, detailRows } = buildRows(products);
  const outputFile = COMMIT ? FINAL_OUTPUT_FILE : DRY_RUN_OUTPUT_FILE;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(products, null, 2));
  writeWorkbook(outputFile, reelRows, detailRows);
  const audit = buildAudit(products, reelRows, detailRows, warnings);
  fs.writeFileSync(AUDIT_JSON, JSON.stringify(audit, null, 2));
  writeAuditMarkdown(audit);

  console.log(`[Daiwa TW current] Wrote ${outputFile}`);
  console.log(`[Daiwa TW current] Master ${reelRows.length}, detail ${detailRows.length}`);
  if (warnings.length) {
    console.log(`[Daiwa TW current] Warnings: ${warnings.length}`);
    warnings.forEach((warning) => console.log(`- ${warning}`));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
