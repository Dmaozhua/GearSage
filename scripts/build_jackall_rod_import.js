const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const { BRAND_IDS, HEADERS, SHEET_NAMES } = require('./gear_export_schema');
const gearDataPaths = require('./gear_data_paths');

const BASE_URL = 'https://www.jackall.co.jp';
const ENTRY_URL = `${BASE_URL}/bass/products/category/rod/`;

const OUTPUT_DIR = gearDataPaths.dataRawDir;
const CACHE_DIR = path.join(OUTPUT_DIR, 'jackall_rods_cache');
const CATEGORY_CACHE_DIR = path.join(CACHE_DIR, 'categories');
const DETAIL_CACHE_DIR = path.join(CACHE_DIR, 'details');
const NORMALIZED_PATH = path.join(OUTPUT_DIR, 'jackall_rod_normalized.json');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'jackall_rod_import.xlsx');
const SHADE_SCRIPT = path.join(__dirname, 'shade_jackall_rod_detail_groups.py');
const IMAGE_DIR = '/Users/tommy/Pictures/images/jackall_rods';
const OLD_IMAGE_DIR = '/Users/tommy/Pictures/images_old_copy/jackall_rods';
const STATIC_IMAGE_BASE = 'https://static.gearsage.club/gearsage/Gearimg/images/jackall_rods';
const REFRESH_IMAGES = process.argv.includes('--refresh-images');

const BRAND_ID = BRAND_IDS.JACKALL || 31;
const ROD_PREFIX = 'JR';
const ROD_DETAIL_PREFIX = 'JRD';

const HTTP_CONFIG = {
  timeout: 60000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  },
};

function normalizeText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(raw, base = BASE_URL) {
  const value = normalizeText(raw);
  if (!value) return '';
  try {
    return new URL(value, base).toString();
  } catch (_) {
    return '';
  }
}

function slugFromUrl(url) {
  const parsed = new URL(url);
  return path.basename(parsed.pathname.replace(/\/$/, '')) || 'jackall';
}

function sanitizeFileName(value) {
  const base = normalizeText(value)
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[\\/*?:"<>|]/g, '_')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base || 'jackall_rod';
}

function ensureDirs() {
  for (const dir of [OUTPUT_DIR, CACHE_DIR, CATEGORY_CACHE_DIR, DETAIL_CACHE_DIR, IMAGE_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url, attempts = 3) {
  let lastError = null;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const response = await axios.get(url, HTTP_CONFIG);
      return response.data;
    } catch (error) {
      lastError = error;
      if (i < attempts) await sleep(i * 1000);
    }
  }
  throw lastError;
}

async function fetchCached(url, cachePath) {
  if (fs.existsSync(cachePath)) return fs.readFileSync(cachePath, 'utf8');
  const html = await fetchText(url);
  fs.writeFileSync(cachePath, html);
  await sleep(500);
  return html;
}

async function downloadImage(url, fileName) {
  if (!url) return '';
  let ext = '.jpg';
  try {
    const extFromUrl = path.extname(new URL(url).pathname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(extFromUrl)) ext = extFromUrl;
  } catch (_) {
    ext = '.jpg';
  }

  const localPath = path.join(IMAGE_DIR, `${fileName}${ext}`);
  const oldPath = path.join(OLD_IMAGE_DIR, `${fileName}${ext}`);
  if (REFRESH_IMAGES && fs.existsSync(localPath)) fs.unlinkSync(localPath);
  if (fs.existsSync(localPath)) return `${STATIC_IMAGE_BASE}/${path.basename(localPath)}`;
  if (fs.existsSync(oldPath)) {
    fs.copyFileSync(oldPath, localPath);
    return `${STATIC_IMAGE_BASE}/${path.basename(localPath)}`;
  }

  try {
    const response = await axios.get(url, { ...HTTP_CONFIG, responseType: 'arraybuffer' });
    fs.writeFileSync(localPath, Buffer.from(response.data));
    await sleep(300);
    return `${STATIC_IMAGE_BASE}/${path.basename(localPath)}`;
  } catch (_) {
    return '';
  }
}

function cleanSku(value) {
  return normalizeText(value)
    .replace(/【[^】]+】/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanModelTitle(value) {
  return normalizeText(value).split('/')[0].trim();
}

function fallbackJapaneseTitle(value) {
  const parts = normalizeText(value).split('/').map((part) => normalizeText(part));
  return parts.length > 1 ? parts.slice(1).join(' / ') : '';
}

function normalizePower(raw, sku = '') {
  const skuText = normalizeText(sku).toUpperCase();
  const skuPower = skuText.match(/\d{2,4}(XUL\/L|XXXH|XXH|XH|SUL|UL\+|UL|MH\+|MH|ML\+|ML|M\+|M|H\+|H|L\+|L)/);
  if (skuPower) return skuPower[1];

  const text = normalizeText(raw).toUpperCase();
  const replacements = [
    [/EXTRA\s+HEAVY/, 'XH'],
    [/HEAVY\s*PLUS/, 'H+'],
    [/MEDIUM\s*HEAVY\s*\/\s*HEAVY/, 'MH/H'],
    [/MEDIUM\s*HEAVY\s*PLUS/, 'MH+'],
    [/MEDIUM\s*LIGHT\s*PLUS/, 'ML+'],
    [/ULTRA\s*LIGHT\s*PLUS/, 'UL+'],
    [/EXTRA\s*ULTRA\s*LIGHT/, 'XUL'],
    [/SUPER\s*ULTRA\s*LIGHT/, 'SUL'],
    [/MEDIUM\s*HEAVY/, 'MH'],
    [/MEDIUM\s*LIGHT/, 'ML'],
    [/MEDIUM\s*PLUS|MEDIUM\+/, 'M+'],
    [/LIGHT\s*PLUS|LIGHT\+/, 'L+'],
    [/LIGHT\s*FAST\s*MOVING/, 'L-FM'],
    [/LIGHT/, 'L'],
    [/MEDIUM/, 'M'],
    [/HEAVY/, 'H'],
  ];
  for (const [pattern, value] of replacements) {
    if (pattern.test(text)) return value;
  }
  return normalizeText(raw);
}

function inferType(sku, categorySlug) {
  const text = normalizeText(sku).toUpperCase();
  if (/^(RV|B|BP)[A-Z0-9Ⅱ]*-S/.test(text) || /^BP-S/.test(text)) return 'S';
  if (/^(RV|B|BP)[A-Z0-9Ⅱ]*-C/.test(text) || /^BP-C/.test(text)) return 'C';
  if (categorySlug === 'nazzy-choice') return 'C';
  return 'S';
}

function parsePieces(value) {
  const text = normalizeText(value);
  const m = text.match(/(\d+)\s*(?:pcs?|ピース)?/i);
  return m ? m[1] : text;
}

function parseCloseLength(value) {
  const text = normalizeText(value);
  const m = text.match(/仕舞寸法\s*[:：]?\s*([0-9.]+\s*cm)/i);
  return m ? m[1].replace(/\s+/g, '') : '';
}

function splitLureWeight(value) {
  const text = normalizeText(value).replace(/MAX[:：]\s*/i, 'MAX ').replace(/[•・]/g, ' ');
  if (!text) return { g: '', oz: '' };
  const grams = text.match(/\(?\s*([0-9.]+(?:\s*[-~～]\s*[0-9.]+)?\s*g)\s*\)?/i);
  const oz = text.match(/(?:MAX\s*)?[0-9/.\s]+(?:[-~～]\s*[0-9/.\s]+)?\s*oz/i);
  if (!grams && !oz && /^[0-9.]+(?:\s*[-~～]\s*[0-9.]+)?$/.test(text)) {
    return { g: `${text.replace(/\s+/g, '')}g`, oz: '' };
  }
  return {
    g: grams ? normalizeText(grams[1]).replace(/\s+/g, '') : (/g/i.test(text) ? text : ''),
    oz: oz ? normalizeText(oz[0]).replace(/\s*[-~～]\s*/g, '-') : (!/g/i.test(text) && /oz/i.test(text) ? text : ''),
  };
}

function normalizeLineRange(value) {
  const text = normalizeText(value);
  const slashRange = text.match(/^([0-9.]+)\s*[\/／]\s*([0-9.]+)\s*lb$/i);
  if (slashRange) return `${slashRange[1]}-${slashRange[2]}lb`;
  return text;
}

function splitLine(value) {
  const text = normalizeText(value);
  if (!text) return { line: '', pe: '' };
  const pe = text.match(/PE\s*(?:MAX\s*)?#?\s*[0-9.]+(?:\s*[-~～]\s*[0-9.]+)?/i);
  if (pe) {
    const before = normalizeText(text.slice(0, pe.index).replace(/\s*[\/／]\s*$/, ''));
    let line = '';
    if (/lb/i.test(before)) line = normalizeLineRange(before);
    else if (before && !/号/.test(before) && /^[0-9.]+(?:\s*[-~～]\s*[0-9.]+)?$/.test(before)) line = `${before.replace(/\s+/g, '')}lb`;
    return {
      line,
      pe: normalizeText(pe[0]).replace(/\s+/g, ''),
    };
  }
  if (/PE|号/.test(text) && !/lb/i.test(text)) return { line: '', pe: text.replace(/\s+/g, '') };
  if (/^[0-9.]+(?:\s*[-~～]\s*[0-9.]+)?$/.test(text)) {
    return { line: `${text.replace(/\s+/g, '')}lb`, pe: '' };
  }
  const slashRange = normalizeLineRange(text);
  if (slashRange !== text) return { line: slashRange, pe: '' };
  return {
    line: pe ? normalizeText(text.replace(pe[0], '').replace(/\s*\/\s*$/, '')) : text,
    pe: pe ? normalizeText(pe[0]).replace(/\s+/g, '') : '',
  };
}

function parseSpecRows($) {
  const table = $('table').first();
  const rows = [];
  const headers = [];
  table.find('tr').first().children('th,td').each((_, cell) => headers.push(normalizeText($(cell).text())));
  if (!headers.length) return rows;

  table.find('tr').slice(1).each((_, row) => {
    const values = [];
    $(row).children('th,td').each((__, cell) => values.push(normalizeText($(cell).text())));
    if (!values.length) return;
    const spec = {};
    headers.forEach((header, index) => {
      spec[header] = values[index] || '';
    });
    const name = cleanSku(spec.Name || spec.name || '');
    if (!name || /適合表|^ー+$/.test(name)) return;
    rows.push({ ...spec, Name: name });
  });
  return rows;
}

function mapSpec(spec) {
  const lureRaw = spec['Lure Weight'] || spec.Lure || spec['Lure(g)'] || '';
  const lure = splitLureWeight(lureRaw);
  const line = splitLine(spec.Line || spec['Line(lb.)'] || '');
  const piecesRaw = spec['継数'] || spec.PCS || '';
  return {
    SKU: spec.Name || '',
    POWER: normalizePower(spec.Power || '', spec.Name || ''),
    'TOTAL LENGTH': spec['Length(ft/m)'] || spec.Length || '',
    Action: spec.Action && spec.Action !== 'ー' ? spec.Action : '',
    PIECES: parsePieces(piecesRaw),
    CLOSELENGTH: parseCloseLength(piecesRaw),
    WEIGHT: spec.Weight || spec['Weight(g)'] || '',
    'LURE WEIGHT': lure.g,
    'LURE WEIGHT (oz)': lure.oz,
    'Line Wt N F': line.line,
    'PE Line Size': line.pe,
    'Market Reference Price': spec.Price || '',
  };
}

function parseProductCategories($) {
  const out = [];
  $('.product-list__item a[href*="/bass/products/category/"]').each((_, a) => {
    const url = absoluteUrl($(a).attr('href'));
    if (!/\/products\/category\/(?:revoltage-rod|bpm|nazzy-choice)\//.test(url)) return;
    const key = slugFromUrl(url);
    out.push({
      key,
      url,
      title: normalizeText($(a).find('.product-list__title--main').first().text()),
      title_jp: normalizeText($(a).find('.product-list__title--jp').first().text()),
    });
  });
  return [...new Map(out.map((item) => [item.url, item])).values()];
}

function parseCategoryProducts($, category) {
  const out = [];
  $('.product-list__item a[href*="/bass/products/rod/"]').each((_, a) => {
    const url = absoluteUrl($(a).attr('href'));
    if (!url) return;
    out.push({
      category_key: category.key,
      category_title: category.title,
      category_title_jp: category.title_jp,
      url,
      listing_model: normalizeText($(a).find('.product-list__title--sub').first().text()),
      listing_model_jp: normalizeText($(a).find('.product-list__title--main').first().text()),
      listing_size: normalizeText($(a).find('.product-list__variation').first().text()),
    });
  });
  return out;
}

function extractModelYear($, title) {
  const text = `${normalizeText($('.label-release_date').first().text())} ${normalizeText($('.label-new').first().text())} ${title}`;
  const m = text.match(/\b(20\d{2})\b/);
  return m ? m[1] : '';
}

function extractDescription($) {
  const concept = normalizeText($('.product-concept').first().text());
  if (concept) return concept;
  const productMain = normalizeText($('.product-main').first().text());
  if (productMain) return productMain;
  return normalizeText($('.page-contents').first().text()).slice(0, 1500);
}

function collectFeatureText($) {
  const chunks = [];
  const productMain = normalizeText($('.product-main').first().text());
  if (productMain) chunks.push(productMain);
  const productConcept = normalizeText($('.product-concept').first().text());
  if (productConcept) chunks.push(productConcept);
  const spec = $('#link-spec');
  if (spec.length) {
    spec.find('.product-lineup__item').each((_, item) => {
      const title = normalizeText($(item).find('.product-lineup__desc__title, h3, h4, h5').first().text());
      const text = normalizeText($(item).text());
      if (text && !/Name\s*Length|back to SPEC/.test(text)) chunks.push([title, text].filter(Boolean).join(' '));
    });
  }
  if (!chunks.length) {
    $('.product-main, .product-spec').each((_, el) => {
      const text = normalizeText($(el).text());
      if (text) chunks.push(text);
    });
  }
  return [...new Set(chunks)].join(' ');
}

function parseLineupDescriptions($) {
  const map = new Map();
  $('#link-lineup .product-lineup__item').each((_, item) => {
    const title = cleanSku($(item).find('.product-lineup__title').first().text());
    if (!title || /適合表/.test(title)) return;
    const paragraphs = [];
    $(item)
      .find('.product-lineup__desc__text p')
      .each((__, p) => {
        const text = normalizeText($(p).text());
        if (text && !/^●/.test(text)) paragraphs.push(text);
      });
    const description = paragraphs.join(' ');
    if (description) map.set(title.toUpperCase(), description);
  });
  return map;
}

function lineupsDescriptionForSku(map, sku) {
  const key = cleanSku(sku).toUpperCase();
  if (map.has(key)) return map.get(key);
  const base = key.replace(/\/2$/, '');
  return map.get(base) || '';
}

function officialEnvironment(categoryKey) {
  if (categoryKey === 'nazzy-choice') return 'Fresh Water / Namazu';
  return 'Fresh Water / Bass';
}

function playerEnvironment(categoryKey) {
  if (categoryKey === 'nazzy-choice') return '淡水 / 鯰魚';
  return '淡水 / Bass';
}

function inferPlayerPositioning(categoryKey, type, sku, power, description) {
  const text = `${sku} ${power} ${description}`.toUpperCase();
  if (categoryKey === 'nazzy-choice') return '鯰魚トップウォーター';
  if (/BF|FINESSE|ベイトフィネス/.test(text)) return type === 'C' ? 'Bait finesse / 精細打撃' : '直柄精細';
  if (/ST|SOLID|ソリッド|パワーフィネス|POWER FINESSE/.test(text)) {
    return type === 'S' ? '直柄精細 / Cover finesse' : 'Cover finesse / 打撃';
  }
  if (/GC|GLASS|巻|クランク|CHATTER|SPINNER|VIBRATION|MOVING|FM/.test(text)) return '巻物 / 搜索';
  if (/FROG|COVER|カバー|PUNCH|H\+|XH|HEAVY|ビッグ|BIG|SWIMBAIT|SWIM BAIT/.test(text)) return '障礙 / 大餌';
  if (type === 'S') return /UL|L|ML/.test(power) ? '直柄精細泛用' : '直柄泛用';
  return /ML|M/.test(power) ? 'Bass 泛用 / 打撃' : 'Bass 強力泛用';
}

function inferPlayerSellingPoints(categoryKey, positioning) {
  if (categoryKey === 'nazzy-choice') {
    return '鯰魚トップウォーター專用 / PE 線適配 / 夜間控線與近岸控魚更明確';
  }
  if (/Bait finesse|精細打撃|Cover finesse/.test(positioning)) {
    return '精細釣組與 cover 攻略分工清楚 / 小型軟餌、輕量 jig 和定點操作更好搭配';
  }
  if (/巻物/.test(positioning)) {
    return '巻物搜索路線清楚 / crank、spinnerbait、vibration 等移動餌更容易穩定節奏';
  }
  if (/障礙|大餌/.test(positioning)) {
    return '重 cover、強力線組和高負荷路亞更有餘量 / 適合近距離控魚與大餌拋投';
  }
  if (/直柄/.test(positioning)) {
    return '直柄輕量釣組適配 / neko、no sinker、小型 plug 和 PE 精細玩法更容易操作';
  }
  return 'Bass 日常泛用覆蓋較廣 / 軟餌打撃、硬餌搜索和岸釣船釣常見場景都容易搭配';
}

function inferGuideLayout(categoryKey, type, featureText) {
  const text = normalizeText(featureText);
  if (/スパイラルガイド/.test(text)) {
    return 'スパイラルガイド：PE 線使用時の糸絡み軽減を重視した導環構成';
  }
  if (/SiCガイド|SiCガイドリング/i.test(text)) {
    if (type === 'S' && /Kガイド|LYガイド/i.test(text)) {
      return 'Fuji SiC + K/LY ガイド：軽量化と糸抜けのバランスを重視した導環構成';
    }
    return 'Fuji SiC ガイド：放熱性とライン滑りを重視した導環構成';
  }
  if (/Fujiガイド|富士工業製ガイド|Fuji.*guide/i.test(text)) {
    return 'Fuji ガイド：感度と強度のバランスを重視した導環構成';
  }
  if (/富士工業製.*ガイド|アルコナイトガイド/i.test(text)) {
    return 'Fuji アルコナイト / SiC ガイド：強度とライン滑りのバランスを重視した導環構成';
  }
  return '';
}

function inferGuideUseHint(categoryKey, positioning) {
  if (categoryKey === 'nazzy-choice') {
    return '鯰魚トップ：PE 線の出線と近距離控線が安定し、夜間のトップウォーター操作と抜き上げ前の主導権を取りやすい。';
  }
  if (/巻物/.test(positioning)) {
    return 'Bass 巻物：出線が安定し、crank、spinnerbait、vibration を一定速度で引く時のライン処理がしやすい。';
  }
  if (/障礙|大餌/.test(positioning)) {
    return 'Bass 強力：太めのラインと高負荷ルアーの出線が安定し、障礙区の控魚と大餌拋投に余裕を持たせやすい。';
  }
  if (/精細|直柄|finesse/i.test(positioning)) {
    return 'Bass 精細：細線小餌の出線が滑らかで、竿先信号、短いバイト、PE 精細操作を判断しやすい。';
  }
  return 'Bass 泛用：出線順暢、兼容多種線徑，軟餌、硬餌和搜索場景切換更自然。';
}

function inferFitStyleTags(item) {
  const text = normalizeText([
    item.category_key,
    item.category_title,
    item.model,
    item.model_cn,
    item.alias,
    item.description,
    item.feature_text,
    ...(item.variants || []).flatMap((variant) => Object.values(variant.fields || {})),
  ].join(' ')).toLowerCase();
  const tags = /nazzy|ナジー|鯰|catfish/.test(text) ? ['岸投'] : ['bass'];
  const hasThreePlus = (item.variants || []).some((variant) => {
    const pieces = normalizeText(variant.fields?.PIECES);
    const match = pieces.match(/\b([3-9]|10)\b/);
    return match && Number(match[1]) >= 3;
  });
  const hasTwoPieceOnly = /\b2[- ]?(?:pc|pcs|piece)\b|\btwo[- ]piece\b|2\s*(?:ピース|本|節|节)/.test(text);
  if (hasThreePlus || (/\btravel\b|\bmobile\b|\bpack\s*rod\b|\bmulti[- ]?piece\b|パック|モバイル|テレスコ|telescopic|多节|多節|振出|旅行|便携|携帯/i.test(text) && !hasTwoPieceOnly)) {
    tags.push('旅行');
  }
  return ['bass', '溪流', '海鲈', '根钓', '岸投', '船钓', '旅行'].filter((tag) => tags.includes(tag)).join(',');
}

function mergeTechTerms(terms) {
  const seen = new Set();
  return terms
    .map((term) => normalizeText(term))
    .filter(Boolean)
    .filter((term) => {
      if (seen.has(term)) return false;
      seen.add(term);
      return true;
    })
    .join(' / ');
}

function baseSkuForTech(sku) {
  return normalizeText(sku).replace(/\/2$/, '');
}

function inferProductTechnical(source, variant) {
  const sku = normalizeText(variant.sku);
  const baseSku = baseSkuForTech(sku);
  const type = normalizeText(variant.fields?.TYPE);
  const terms = [];

  if (source.category_key === 'revoltage-rod') {
    terms.push('富士工業社製SiCガイドリング');
    const isRevoltageTwoPiece = /2pcs|ツーピース/i.test(
      normalizeText(`${source.model || ''} ${source.listing_model || ''} ${source.url || ''}`),
    );

    const t1100Skus = isRevoltageTwoPiece
      ? new Set([
          'RVⅡ-C69L+BF',
          'RVⅡ-C66M+',
          'RVⅡ-C67MH+',
          'RVⅡ-C68MH',
          'RVⅡ-C610M',
          'RVⅡ-C71H-ST',
          'RVⅡ-C73H',
          'RVⅡ-C711H',
          'RVⅡ-S65UL',
          'RVⅡ-S65L',
          'RVⅡ-S67ML',
          'RVⅡ-S68MH+',
          'RVⅡ-S69UL+',
          'RVⅡ-S78ML+',
        ])
      : new Set([
          'RVⅡ-C67L-FM',
          'RVⅡ-C69L+BF',
          'RVⅡ-C610M',
          'RVⅡ-C66M+',
          'RVⅡ-C68MH',
          'RVⅡ-C67MH+',
          'RVⅡ-C71H-ST',
          'RVⅡ-C73H',
          'RVⅡ-C711H',
          'RVⅡ-S510SUL-ST',
          'RVⅡ-S60SUL',
          'RVⅡ-S65UL',
          'RVⅡ-S68MH+',
          'RVⅡ-S69UL+',
          'RVⅡ-S78ML+',
        ]);
    const m40xSkus = isRevoltageTwoPiece
      ? new Set(['RVⅡ-C64ML-ST', 'RVⅡ-S68MH+', 'RVⅡ-C68MH', 'RVⅡ-C71H-ST', 'RVⅡ-C711H', 'RVⅡ-S69UL+', 'RVⅡ-S61L-ST'])
      : new Set([
          'RVⅡ-C64ML-ST',
          'RVⅡ-C68MH',
          'RVⅡ-C71H-ST',
          'RVⅡ-C711H',
          'RVⅡ-S510SUL-ST',
          'RVⅡ-S61L-ST',
          'RVⅡ-S68MH+',
          'RVⅡ-S69UL+',
        ]);
    const gripJointSkus = isRevoltageTwoPiece
      ? new Set()
      : new Set([
          'RVⅡ-C67MH+',
          'RVⅡ-C68MH',
          'RVⅡ-C69L+BF',
          'RVⅡ-C610M',
          'RVⅡ-C71H-ST',
          'RVⅡ-C73H',
          'RVⅡ-C711H',
          'RVⅡ-S68MH+',
          'RVⅡ-S69UL+',
          'RVⅡ-S78ML+',
        ]);
    const solid30tSkus = isRevoltageTwoPiece
      ? new Set(['RVⅡ-S61L-ST', 'RVⅡ-C64ML-ST', 'RVⅡ-C71H-ST'])
      : new Set(['RVⅡ-S510SUL-ST', 'RVⅡ-S61L-ST', 'RVⅡ-C64ML-ST', 'RVⅡ-C71H-ST']);

    if (t1100Skus.has(baseSku)) terms.push('トレカ®T1100G');
    if (m40xSkus.has(baseSku)) terms.push('トレカ®M40X');
    if (['RVⅡ-C62L-GC', 'RVⅡ-C66ML-GC'].includes(baseSku)) {
      terms.push('UD Glass', 'グラスコンポジットブランク');
    }
    if (solid30tSkus.has(baseSku)) terms.push('30tカーボンソリッドティップ');
    if (!isRevoltageTwoPiece && baseSku === 'RVⅡ-S61UL-ST') terms.push('ロングソリッドティップ');
    if (!isRevoltageTwoPiece && baseSku === 'RVⅡ-S56XUL/L-ST') terms.push('ショートソリッドティップ');
    if (!isRevoltageTwoPiece && baseSku === 'RVⅡ-C64M+PBF') terms.push('スパイラルガイドセッティング');
    if (gripJointSkus.has(baseSku)) terms.push('グリップジョイント構造');
    if (type === 'S') {
      terms.push('Kガイド', 'LYガイド');
      if ((!isRevoltageTwoPiece && baseSku === 'RVⅡ-S510SUL-ST') || baseSku === 'RVⅡ-S68MH+') terms.push('全ガイドKガイド');
    }
    if (baseSku === 'RVⅡ-S78ML+') terms.push('ダブルロックシステム');
    if (!isRevoltageTwoPiece && baseSku === 'RVⅡ-S69UL+') terms.push('大径トップ〜第4ガイド');
  } else if (source.category_key === 'bpm') {
    const isBpNew = /^BP-/.test(sku);
    if (isBpNew) {
      terms.push('Fujiガイド', '1&ハーフ設計');
      if (type === 'C') terms.push('Fuji ECSリールシート');
      if (type === 'S') terms.push('Fuji TVSリールシート');
      if (/BP-S70L-ST|BP-C70M\+\s*ST/.test(sku)) terms.push('カーボンソリッドティップ');
    } else {
      terms.push('富士工業製アルコナイトガイド', 'SiCトップガイド');
      if (['B1-C66MLG', 'B1-C70MG', 'B2-C66MLG'].includes(sku)) terms.push('グラスコンポジットブランク');
      if (['B1-C72MH', 'B1-C70H', 'B1-C73XHSB', 'B1-S73M', 'B1-C70MG'].includes(sku)) {
        terms.push('グリップジョイント構造');
      }
    }
  } else if (source.category_key === 'nazzy-choice') {
    if (/SG/.test(sku)) {
      terms.push('スパイラルガイド', '蓄光スレッド', 'グラスコンポジットブランクス', 'ソフトティップ');
    } else {
      terms.push(
        'Fuji製オールダブルフットガイド',
        'ステンレスフレームSiCトップガイド',
        'ステンレスフレームアルコナイトガイド',
      );
      if (/CACAOBLACK/.test(sku)) terms.push('グラスコンポジットティップ', '並継構造', 'PMNST6トップガイド');
      else terms.push('グラスコンポジット素材', '並継構造');
    }
  }

  return mergeTechTerms(terms);
}

function parseProductDetail($, source) {
  const rawModel = normalizeText($('h1 .title-main').first().text()) || source.listing_model || source.category_title;
  const model = cleanModelTitle(rawModel);
  const modelCn =
    normalizeText($('h1 .title-sub').first().text()).replace(/NEW$/, '') ||
    source.listing_model_jp ||
    fallbackJapaneseTitle(rawModel) ||
    source.category_title_jp;
  const description = extractDescription($);
  const featureText = collectFeatureText($);
  const lineupDescriptions = parseLineupDescriptions($);
  const specRows = parseSpecRows($);
  const variants = specRows.map((spec) => {
    const mapped = mapSpec(spec);
    const type = inferType(mapped.SKU, source.category_key);
    const variantDescription = lineupsDescriptionForSku(lineupDescriptions, mapped.SKU) || description;
    if (!mapped.PIECES && source.category_key === 'nazzy-choice' && /2ピース|2PCS/i.test(variantDescription)) {
      mapped.PIECES = '2';
    }
    const positioning = inferPlayerPositioning(source.category_key, type, mapped.SKU, mapped.POWER, variantDescription);
    const fields = {
      TYPE: type,
      ...mapped,
      official_environment: officialEnvironment(source.category_key),
      player_environment: playerEnvironment(source.category_key),
      player_positioning: positioning,
      player_selling_points: inferPlayerSellingPoints(source.category_key, positioning),
      guide_layout_type: inferGuideLayout(source.category_key, type, featureText),
      guide_use_hint: inferGuideUseHint(source.category_key, positioning),
      Description: variantDescription,
    };
    fields.product_technical = inferProductTechnical(source, {
      sku: mapped.SKU,
      description: variantDescription,
      fields,
    });
    return {
      sku: mapped.SKU,
      product_technical: fields.product_technical,
      raw_spec: spec,
      description: variantDescription,
      fields,
    };
  });

  return {
    ...source,
    model,
    model_cn: modelCn,
    model_year: extractModelYear($, model),
    alias: source.listing_model || model,
    main_image_url: absoluteUrl($('meta[property="og:image"]').attr('content')) || absoluteUrl($('.product-main img, .page-main img').first().attr('src')),
    description,
    feature_text: featureText,
    variants,
  };
}

function rowFromHeaders(headers, values) {
  return headers.map((header) => values[header] ?? '');
}

async function buildWorkbook(normalized) {
  const rodRows = [];
  const detailRows = [];
  let detailIndex = 10000;

  for (let i = 0; i < normalized.length; i += 1) {
    const item = normalized[i];
    const rodId = `${ROD_PREFIX}${1000 + i}`;
    const imageName = `${rodId}_${sanitizeFileName(item.model || item.alias)}`;
    const imageUrl = await downloadImage(item.main_image_url, imageName);
    const officialPrice = item.variants
      .map((variant) => variant.fields['Market Reference Price'])
      .filter(Boolean)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .join(' / ');
    const isNamazu = item.category_key === 'nazzy-choice';
    const fitStyleTags = item.fit_style_tags || inferFitStyleTags(item);
    item.fit_style_tags = fitStyleTags;

    rodRows.push(
      rowFromHeaders(HEADERS.rodMaster, {
        id: rodId,
        brand_id: BRAND_ID,
        model: item.model,
        model_cn: item.model_cn,
        model_year: item.model_year,
        alias: item.alias,
        type_tips: item.category_title || 'ROD',
        fit_style_tags: fitStyleTags,
        images: imageUrl,
        series_positioning: officialEnvironment(item.category_key),
        main_selling_points: item.description.split('。').slice(0, 2).join('。').slice(0, 220),
        official_reference_price: officialPrice,
        market_status: item.model_year ? `${item.model_year} NEW MODEL` : '官网展示',
        Description: item.description,
        player_positioning: isNamazu ? '淡水鯰魚トップウォーター' : '淡水 Bass / Jackall rod',
        player_selling_points: isNamazu
          ? '鯰魚トップウォーター專用定位 / PE 線和夜間控線友好'
          : 'Bass 竿系覆蓋打撃、巻物、精細和強力路線 / 便於按技法選擇子型號',
      }),
    );

    for (const variant of item.variants) {
      detailRows.push(
        rowFromHeaders(HEADERS.rodDetail, {
          id: `${ROD_DETAIL_PREFIX}${detailIndex}`,
          rod_id: rodId,
          ...variant.fields,
        }),
      );
      detailIndex += 1;
    }
  }

  const wb = XLSX.utils.book_new();
  const rodSheet = XLSX.utils.aoa_to_sheet([HEADERS.rodMaster, ...rodRows]);
  const detailSheet = XLSX.utils.aoa_to_sheet([HEADERS.rodDetail, ...detailRows]);
  rodSheet['!cols'] = HEADERS.rodMaster.map((header) => ({ wch: header === 'Description' ? 90 : 18 }));
  detailSheet['!cols'] = HEADERS.rodDetail.map((header) => ({ wch: header === 'Description' ? 90 : 16 }));
  XLSX.utils.book_append_sheet(wb, rodSheet, SHEET_NAMES.rod);
  XLSX.utils.book_append_sheet(wb, detailSheet, SHEET_NAMES.rodDetail);
  XLSX.writeFile(wb, OUTPUT_FILE);
  execFileSync('python3', [SHADE_SCRIPT], { stdio: 'inherit' });
}

async function main() {
  ensureDirs();
  const entryHtml = await fetchCached(ENTRY_URL, path.join(CACHE_DIR, 'rod_category.html'));
  const entry$ = cheerio.load(entryHtml);
  const categories = parseProductCategories(entry$);

  const products = [];
  for (const category of categories) {
    const html = await fetchCached(category.url, path.join(CATEGORY_CACHE_DIR, `${category.key}.html`));
    const $ = cheerio.load(html);
    products.push(...parseCategoryProducts($, category));
  }

  const normalized = [];
  for (const product of products) {
    const detailHtml = await fetchCached(product.url, path.join(DETAIL_CACHE_DIR, `${slugFromUrl(product.url)}.html`));
    const $ = cheerio.load(detailHtml);
    normalized.push(parseProductDetail($, product));
  }

  fs.writeFileSync(NORMALIZED_PATH, `${JSON.stringify(normalized, null, 2)}\n`);
  await buildWorkbook(normalized);

  console.log(
    JSON.stringify(
      {
        categories: categories.length,
        products: normalized.length,
        variants: normalized.reduce((sum, item) => sum + item.variants.length, 0),
        with_images: normalized.filter((item) => item.main_image_url).length,
        output: OUTPUT_FILE,
        normalized: NORMALIZED_PATH,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
