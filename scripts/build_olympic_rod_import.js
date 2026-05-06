const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const { BRAND_IDS, HEADERS, SHEET_NAMES } = require('./gear_export_schema');

const BASE_URL = 'https://olympic-co-ltd.jp';
const LINEUPS = [
  {
    key: 'blackbass',
    url: `${BASE_URL}/fishing/blackbass_lineup/`,
    officialEnvironment: 'Black Bass',
    playerEnvironment: '淡水 / Bass',
    typeTips: 'Black Bass',
  },
  {
    key: 'areatrout',
    url: `${BASE_URL}/fishing/areatrout_lineup/`,
    officialEnvironment: 'Area Trout',
    playerEnvironment: '淡水 / 管釣鱒魚',
    typeTips: 'Area Trout',
  },
];

const OUTPUT_DIR = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw');
const CACHE_DIR = path.join(OUTPUT_DIR, 'olympic_rods_cache');
const LINEUP_CACHE_DIR = path.join(CACHE_DIR, 'lineups');
const DETAIL_CACHE_DIR = path.join(CACHE_DIR, 'details');
const NORMALIZED_PATH = path.join(OUTPUT_DIR, 'olympic_rod_normalized.json');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'olympic_rod_import.xlsx');
const SHADE_SCRIPT = path.join(__dirname, 'shade_olympic_rod_detail_groups.py');
const APPLY_RIG_PAIRING_SCRIPT = path.join(__dirname, 'apply_olympic_rod_recommended_rig_pairing_stage2.js');
const APPLY_PLAYER_FIELDS_SCRIPT = path.join(__dirname, 'apply_olympic_rod_player_fields_stage3.py');
const APPLY_FIT_STYLE_TAGS_SCRIPT = path.join(__dirname, 'apply_olympic_rod_fit_style_tags_stage4.py');
const APPLY_PRODUCT_TECHNICAL_SCRIPT = path.join(__dirname, 'apply_olympic_rod_product_technical_stage5.py');
const IMAGE_DIR = '/Users/tommy/Pictures/images/olympic_rods';
const OLD_IMAGE_DIR = '/Users/tommy/Pictures/images_old_copy/olympic_rods';
const STATIC_IMAGE_BASE = 'https://static.gearsage.club/gearsage/Gearimg/images/olympic_rods';
const REFRESH_IMAGES = process.argv.includes('--refresh-images');

const BRAND_ID = BRAND_IDS.OLYMPIC || 113;
const ROD_PREFIX = 'OR';
const ROD_DETAIL_PREFIX = 'ORD';

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
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTitleSuffix(title) {
  return normalizeText(String(title || '').split('–')[0].split('&#8211;')[0]);
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
  return path.basename(parsed.pathname.replace(/\/$/, ''));
}

function sanitizeFileName(value) {
  const base = normalizeText(value)
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[\\/*?:"<>|]/g, '_')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base || 'olympic_rod';
}

function ensureDirs() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(LINEUP_CACHE_DIR, { recursive: true });
  fs.mkdirSync(DETAIL_CACHE_DIR, { recursive: true });
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
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
      if (i < attempts) await sleep(i * 900);
    }
  }
  throw lastError;
}

async function fetchCached(url, cachePath) {
  if (fs.existsSync(cachePath)) return fs.readFileSync(cachePath, 'utf8');
  const html = await fetchText(url);
  fs.writeFileSync(cachePath, html);
  await sleep(350);
  return html;
}

async function downloadImage(url, fileName) {
  if (!url) return '';
  const extFromUrl = (path.extname(new URL(url).pathname).split('?')[0] || '.jpg').toLowerCase();
  const ext = ['.jpg', '.jpeg', '.png', '.webp'].includes(extFromUrl) ? extFromUrl : '.jpg';
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
    await sleep(250);
    return `${STATIC_IMAGE_BASE}/${path.basename(localPath)}`;
  } catch (_) {
    return '';
  }
}

function parseLineup(html, lineup) {
  const $ = cheerio.load(html);
  const productMap = new Map();
  $('.entry-content a[href*="/fishing/products/"]').each((_, a) => {
    const url = absoluteUrl($(a).attr('href'));
    if (!url) return;
    const label = normalizeText($(a).text());
    const current = productMap.get(url);
    if (current) {
      if (!current.lineup_label && label) current.lineup_label = label;
      return;
    }
    productMap.set(url, {
        url,
        lineup_key: lineup.key,
        official_environment: lineup.officialEnvironment,
        player_environment: lineup.playerEnvironment,
        type_tips: lineup.typeTips,
        lineup_label: label,
      });
  });
  return [...productMap.values()];
}

function productModelFromTitle(title) {
  const raw = stripTitleSuffix(title);
  if (raw.includes('/')) return normalizeText(raw.split('/').pop());
  return raw;
}

function extractModelYear(model) {
  const m = normalizeText(model).match(/^(\d{2})(?=\s|[A-Z]|[^\d])/i);
  return m ? Number(m[1]) : '';
}

function fallbackModelCn(lineupLabel, model) {
  const label = normalizeText(lineupLabel);
  if (!label) return '';
  const englishName = normalizeText(model).replace(/^\d{2}\s+/, '');
  if (englishName && label.endsWith(englishName)) {
    return normalizeText(label.slice(0, -englishName.length));
  }
  return label;
}

function getMainImage($) {
  const candidates = [];
  $('.entry-content img, .single-featured-image-header img').each((_, img) => {
    const src = absoluteUrl($(img).attr('src'));
    if (src) candidates.push(src);
  });
  return (
    candidates.find((src) => /\/main[_-]/i.test(src)) ||
    candidates.find((src) => !/tokuyaku|logo|icon|banner|tester|shoplist|furupo|choisu|OES|LureNews|TSURINEWS/i.test(src)) ||
    ''
  );
}

function tableToSpec($, table) {
  const headers = [];
  $(table)
    .find('tr')
    .first()
    .find('th')
    .each((_, th) => headers.push(normalizeText($(th).text())));

  const rows = [];
  $(table)
    .find('tr')
    .each((_, tr) => {
      const values = [];
      $(tr)
        .find('td')
        .each((__, td) => values.push(normalizeText($(td).text())));
      if (values.length) rows.push(values);
    });

  if (!headers.length || !rows.length) return {};
  const spec = {};
  headers.forEach((header, index) => {
    spec[header] = rows[0][index] || '';
  });
  return spec;
}

function parseLineField(raw) {
  const text = normalizeText(raw);
  if (!text) return { line: '', pe: '' };
  if (text.includes('/')) {
    const [line, pe] = text.split('/');
    return { line: normalizeText(line), pe: normalizeText(pe).replace(/^PE/i, '') };
  }
  if (/PE|号/.test(text) && !/lb/i.test(text)) return { line: '', pe: text.replace(/^PE/i, '') };
  return { line: text, pe: '' };
}

function mapSpecToDetail(spec) {
  const purePeValue = spec['LinePE(号)'] || '';
  const lineValue =
    spec['Line (lb)/PE(号)'] ||
    spec['Line(lb)/PE(号)'] ||
    spec['Line (lb) / PE(号)'] ||
    spec['Line (lb)'] ||
    spec['Line(lb)'] ||
    '';
  const line = parseLineField(lineValue);
  return {
    POWER: spec.Power || '',
    'TOTAL LENGTH': spec['Length (m)'] || spec['Length(m)'] || '',
    Action: spec.Action || '',
    WEIGHT: spec['Weight (g)'] || spec['Weight(g)'] || '',
    CLOSELENGTH: spec['Close (cm)'] || spec['Close(cm)'] || '',
    'Tip Diameter': spec['Top Dia (mm)'] || spec['Top Dia(mm)'] || '',
    PIECES: spec['Section (pcs.)'] || spec['Section(pcs.)'] || '',
    'LURE WEIGHT': spec['Lure (g)'] || spec['Lure(g)'] || '',
    'LURE WEIGHT (oz)': spec['Lure (oz)'] || spec['Lure(oz)'] || '',
    'Line Wt N F': purePeValue ? '' : line.line,
    'PE Line Size': purePeValue || line.pe,
    'Market Reference Price': spec['Price (JPY)'] || spec['Price(JPY)'] || '',
  };
}

function skuFromPartNumber($, el) {
  const clone = $(el).clone();
  clone.find('.newtext3').remove();
  return normalizeText(clone.text());
}

function inferType(modelLabel, sku) {
  const text = `${modelLabel} ${sku}`.toUpperCase();
  if (/SPINNING|SPIN/.test(text) || /GSBS|GBELPS|GVIGS|GVELS/.test(text)) return 'S';
  if (/BAIT|CAST/.test(text) || /GVIGC|GVELC/.test(text)) return 'C';
  return 'S';
}

function inferJointType(featureText, pieces, description = '') {
  if (normalizeText(pieces) === '1') return '1ピース';
  if (/グリップ脱着式/.test(description)) return 'グリップ脱着式';
  const text = normalizeText(featureText);
  if (/逆並継|スリップオーバーフェルール/i.test(text)) return '逆並継';
  if (/印籠継|スピゴットフェルール/i.test(text)) return '印籠継';
  return '';
}

function inferReelSeat(featureText, sku, model) {
  const skuText = normalizeText(sku).toUpperCase();
  const modelText = normalizeText(model).toUpperCase();
  if (modelText.includes('VIGORE')) {
    if (skuText === 'GVIGS-6102ML') return 'Olympic OP-02 carbon reel seat';
    if (skuText.includes('GVIGS')) return 'Fuji VSS reel seat';
    if (/77XH|76MH/.test(skuText)) return 'Fuji ECS17 reel seat';
    if (/71H|75M/.test(skuText)) return 'Fuji ECS16 reel seat';
  }
  if (modelText.includes('VELOCE')) {
    if (skuText.includes('74X')) return 'Fuji TCS reel seat';
    if (skuText.includes('GVELUC')) return 'Fuji ECS reel seat';
    if (skuText.includes('GVELUS')) return 'Fuji VSS reel seat';
  }
  const text = `${featureText} ${sku} ${model}`;
  if (/OP-02/.test(text)) return 'Olympic OP-02 carbon reel seat';
  if (/OP-01/.test(text)) return 'Olympic OP-01 carbon reel seat';
  if (/TCS/.test(text)) return 'Fuji TCS reel seat';
  if (/ECS/.test(text)) return 'Fuji ECS reel seat';
  if (/VSS/.test(text)) return 'Fuji VSS reel seat';
  if (/オリジナルシート|original seat/i.test(text)) return 'Olympic original reel seat';
  return '';
}

function inferGuideLayout(featureText) {
  const text = normalizeText(featureText);
  if (/チタンフレーム.*トルザイト|TORZITE.*Titanium/i.test(text)) {
    return 'チタンフレームトルザイトリングガイド：軽量化と感度を重視した導環構成';
  }
  if (/ステンレスフレーム.*SiC|SiC-S.*Kガイド/i.test(text)) {
    return 'ステンレスフレーム SiC-S / K ガイド：耐久性とライン抜けを重視した導環構成';
  }
  if (/Kガイド/i.test(text)) return 'K ガイド：PE ラインの糸絡みを抑えやすい導環構成';
  return '';
}

function inferGripType(text, localGrip) {
  const joined = `${localGrip} ${text}`;
  if (/GRIP TYPE\s*[A-Z]/i.test(joined)) return normalizeText(localGrip).replace(/^■/, '');
  if (/バールウッド/.test(joined)) return 'High grade cork / burl wood';
  if (/メープルウッド/.test(joined)) return 'High grade cork / maple wood';
  if (/コルク.*EVA|EVA.*コルク/i.test(joined)) return 'Cork / EVA';
  if (/コルク/i.test(joined)) return 'Cork';
  if (/EVA/i.test(joined)) return 'EVA';
  return '';
}

function inferPlayerPositioning(category, type, power, sku, desc) {
  const text = `${power} ${sku} ${desc}`.toUpperCase();
  if (category === 'areatrout') {
    if (/大型|大規模|遠投|ロングキャスト|沖|最長|大型狙い/.test(desc)) return '管釣中大型魚 / 遠投';
    if (/XUL|SUL|SOLID|ソリッド|マイクロ/.test(text)) return '管釣精細小餌';
    if (/L\b|フルサイズ|クランク|ミノー/.test(text)) return '管釣中大型魚 / 遠投';
    return '管釣泛用';
  }
  if (/BIG|ビッグベイト|スイムベイト|クローラー|MAX3|1-4/.test(text)) return '大餌 / 強力';
  if (/ヘビーカバー|カバーゲーム|FROG|フロッグ|パンチ|ウィードを攻略|難攻不落/.test(text)) {
    return '障礙 / 打撃';
  }
  if (/カバーベイトフィネス/.test(text)) return 'カバー精細';
  if (type === 'S') {
    if (/遠投|PEライン/.test(desc)) return '直柄遠投精細';
    return /ML|L|UL/.test(text) ? '直柄精細泛用' : '直柄泛用';
  }
  if (/バーサタイル/.test(desc)) return 'Bass 泛用 / 打撃';
  if (/巻|ハードベイト|スピナーベイト|バイブレーション|ジャークベイト/.test(desc)) return '巻物 / 搜索';
  if (/テキサス|ラバージグ|ノーシンカー/.test(desc)) return 'Bass 泛用 / 打撃';
  return 'Bass 泛用';
}

function inferPlayerSellingPoints(category, positioning) {
  if (category === 'areatrout') {
    if (/精細/.test(positioning)) return '細線小餌適配 / 管釣短咬口判斷更清楚 / 低負荷拋投更穩';
    if (/大型|遠投/.test(positioning)) return '大池和大型鱒魚更有餘量 / 中大型 spoon、crank、minnow 更容易覆蓋';
    return '管釣常用 spoon、crank 覆蓋清晰 / 細線控魚和連續拋投友好';
  }
  if (/大餌/.test(positioning)) return '大餌和強力線組承載更明確 / 適合 big bait、crawler bait 等高負荷玩法';
  if (/障礙/.test(positioning)) return '障礙區打撃更明確 / 德州、punch shot 和重 cover 控魚更有餘量';
  if (/カバー精細/.test(positioning)) return 'cover bait finesse 路線明確 / 小中型硬餌與 cover finesse 可兼顧';
  if (/遠投精細/.test(positioning)) return 'PE 遠投與輕量釣組適配 / 長距離控線和精細操作更清楚';
  if (/泛用 \/ 打撃/.test(positioning)) return '德州、橡膠 jig、無鉛等常用打撃釣組適配 / 兼顧日常搜索與定點操作';
  if (/巻物/.test(positioning)) return '巻物搜索路線清晰 / hardbait、spinnerbait、vibration 等移動餌更好搭配';
  if (/直柄/.test(positioning)) return '直柄輕量釣組適配 / neko、no sinker、蟲系和小型 plug 更容易操作';
  return 'Bass 日常泛用覆蓋較廣 / 船釣與岸釣常見場景都容易搭配';
}

function inferFitStyleTags(item) {
  const text = normalizeText([
    item.lineup_key,
    item.official_environment,
    item.type_tips,
    item.model,
    item.lineup_label,
    ...(item.variants || []).map((variant) => `${variant.sku} ${variant.description}`),
  ].join(' ')).toLowerCase();
  const tags = [];
  if (/blackbass|black bass|bass|vigore|veloce/.test(text)) tags.push('bass');
  if (/areatrout|area trout|trout|bellezza/.test(text)) tags.push('溪流');
  if (itemHasTravelFit(item)) tags.push('旅行');
  return ['bass', '溪流', '海鲈', '根钓', '岸投', '船钓', '旅行'].filter((tag) => tags.includes(tag)).join(',');
}

function itemHasTravelFit(item) {
  const text = normalizeText([item.model, item.lineup_label, item.description, item.feature_text].join(' ')).toLowerCase();
  if (/\b(travel|mobile|liberalist|crossbeat|wilderness)\b|多节|多節|振出/i.test(text)) return true;
  return (item.variants || []).some((variant) => {
    const pieces = normalizeText(variant.fields?.PIECES || variant.raw_spec?.['Section(pcs.)'] || variant.raw_spec?.['Section (pcs.)']);
    return /^\d+$/.test(pieces) && Number(pieces) >= 3 && Number(pieces) <= 10;
  });
}

function inferGuideUseHint(category, positioning) {
  if (category === 'areatrout') {
    return '管釣鱒魚：細線小餌出線更順，低負荷拋投與短咬口判斷更清楚。';
  }
  if (/大餌|障礙/.test(positioning)) {
    return 'Bass 強力：粗線和高負荷路亞出線更穩，障礙區控魚和大餌拋投更有餘量。';
  }
  if (/直柄|精細/.test(positioning)) {
    return 'Bass 精細：細線小餌出線更順，竿尖信號和短咬口判斷更直接。';
  }
  return 'Bass 泛用：出線順暢、兼容多種線徑，軟餌、硬餌和搜索場景切換更自然。';
}

function collectFeatureText($) {
  const chunks = [];
  $('.features, .feature_caption, .accordion').each((_, el) => {
    const text = normalizeText($(el).text());
    if (text && !/PAGE TOP/.test(text)) chunks.push(text);
  });
  $('table:not(.spec)').each((_, table) => {
    const text = normalizeText($(table).text());
    if (text && !/特約小売店|すさみブランド/.test(text)) chunks.push(text);
  });
  return [...new Set(chunks)].join(' ');
}

function parsePartNumberVariants($, product, featureText) {
  const variants = [];
  $('.entry-content .part_number').each((_, el) => {
    const sku = skuFromPartNumber($, el);
    if (!sku) return;
    const modelLabel = normalizeText($(el).prevAll('.model').first().text());
    const bodycopy = normalizeText($(el).nextAll('.bodycopy').first().text());
    const tip = normalizeText($(el).nextUntil('table.spec').filter('.tip').first().text());
    const grip = normalizeText($(el).nextUntil('table.spec').filter('.tip_caption').first().text());
    let table = $(el).nextAll('table.spec').first();
    if (!table.length) table = $(el).nextAll('.scroll').first().find('table.spec').first();
    const spec = tableToSpec($, table);
    const mapped = mapSpecToDetail(spec);
    const type = inferType(modelLabel, sku);
    const positioning = inferPlayerPositioning(product.lineup_key, type, mapped.POWER, sku, bodycopy);
    variants.push({
      sku,
      model_group: modelLabel,
      tip,
      grip,
      description: [tip, bodycopy].filter(Boolean).join(' '),
      raw_spec: spec,
      fields: {
        TYPE: type,
        SKU: sku,
        ...mapped,
        'Joint Type': inferJointType(featureText, mapped.PIECES, bodycopy),
        'Grip Type': inferGripType(featureText, grip),
        'Reel Seat Position': inferReelSeat(featureText, sku, product.model),
        guide_layout_type: inferGuideLayout(featureText),
        guide_use_hint: inferGuideUseHint(product.lineup_key, positioning),
        official_environment: product.official_environment,
        player_environment: product.player_environment,
        player_positioning: positioning,
        player_selling_points: inferPlayerSellingPoints(product.lineup_key, positioning),
        Description: [tip, bodycopy].filter(Boolean).join(' '),
      },
    });
  });
  return variants;
}

function parseCaptionTableVariants($, product, featureText, fallbackDescription) {
  const variants = [];
  $('.entry-content table.spec').each((_, table) => {
    const sku = normalizeText($(table).find('caption summary').first().text());
    if (!sku) return;
    const spec = tableToSpec($, table);
    const mapped = mapSpecToDetail(spec);
    const type = inferType('', sku);
    const positioning = inferPlayerPositioning(product.lineup_key, type, mapped.POWER, sku, fallbackDescription);
    variants.push({
      sku,
      model_group: type === 'S' ? 'SPINNING MODEL' : '',
      description: fallbackDescription,
      raw_spec: spec,
      fields: {
        TYPE: type,
        SKU: sku,
        ...mapped,
        'Joint Type': inferJointType(featureText, mapped.PIECES, fallbackDescription),
        'Grip Type': inferGripType(featureText, ''),
        'Reel Seat Position': inferReelSeat(featureText, sku, product.model),
        guide_layout_type: inferGuideLayout(featureText),
        guide_use_hint: inferGuideUseHint(product.lineup_key, positioning),
        official_environment: product.official_environment,
        player_environment: product.player_environment,
        player_positioning: positioning,
        player_selling_points: inferPlayerSellingPoints(product.lineup_key, positioning),
        Description: fallbackDescription,
      },
    });
  });
  return variants;
}

function parseProductDetail(html, sourceProduct) {
  const $ = cheerio.load(html);
  const title = $('title').text();
  const model = productModelFromTitle(title);
  const modelCn = normalizeText($('.products_name').first().text()) || fallbackModelCn(sourceProduct.lineup_label, model);
  const catchcopy = normalizeText($('.catchcopy').first().text());
  let bodycopy = normalizeText($('.products_name').first().nextAll('.bodycopy').first().text());
  if (!bodycopy) {
    bodycopy = normalizeText($('.entry-content > p').first().text().replace(/この製品は.*$/, ''));
  }
  const description = [catchcopy, bodycopy].filter(Boolean).join(' ');
  const featureText = collectFeatureText($);
  const product = {
    ...sourceProduct,
    model,
    model_cn: modelCn,
    model_year: extractModelYear(model),
    alias: sourceProduct.lineup_label || modelCn || model,
    main_image_url: getMainImage($),
    catchcopy,
    bodycopy,
    description,
    feature_text: featureText,
  };

  let variants = parsePartNumberVariants($, product, featureText);
  if (!variants.length) variants = parseCaptionTableVariants($, product, featureText, description);
  product.variants = variants;
  return product;
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
    const imageName = `${rodId}_${sanitizeFileName(item.model)}`;
    const imageUrl = await downloadImage(item.main_image_url, imageName);
    const masterPositioning =
      item.lineup_key === 'areatrout' ? '管釣鱒魚 / 細線小餌' : '淡水 Bass / Graphiteleader';
    const masterSelling =
      item.lineup_key === 'areatrout'
        ? 'Area trout 系列定位清晰 / spoon、crank、minnow 等管釣小餌覆蓋完整'
        : 'Black bass 系列覆蓋槍柄與直柄 / 打撃、巻物、精細和大餌路線分工明確';

    rodRows.push(
      rowFromHeaders(HEADERS.rodMaster, {
        id: rodId,
        brand_id: BRAND_ID,
        model: item.model,
        model_cn: item.model_cn,
        model_year: item.model_year,
        alias: item.alias,
        type_tips: item.type_tips,
        fit_style_tags: item.fit_style_tags || inferFitStyleTags(item),
        images: imageUrl,
        series_positioning: item.official_environment,
        main_selling_points: item.catchcopy || item.bodycopy,
        official_reference_price: item.variants
          .map((variant) => variant.fields['Market Reference Price'])
          .filter(Boolean)
          .filter((value, index, arr) => arr.indexOf(value) === index)
          .join(' / '),
        market_status: '官网展示',
        Description: item.description,
        player_positioning: masterPositioning,
        player_selling_points: masterSelling,
      }),
    );

    for (const variant of item.variants) {
      detailRows.push(
        rowFromHeaders(HEADERS.rodDetail, {
          id: `${ROD_DETAIL_PREFIX}${detailIndex}`,
          rod_id: rodId,
          ...variant.fields,
          'Code Name': variant.model_group,
          'Extra Spec 1': variant.tip || '',
          'Extra Spec 2': variant.grip || '',
        }),
      );
      detailIndex += 1;
    }
  }

  const wb = XLSX.utils.book_new();
  const rodSheet = XLSX.utils.aoa_to_sheet([HEADERS.rodMaster, ...rodRows]);
  const detailSheet = XLSX.utils.aoa_to_sheet([HEADERS.rodDetail, ...detailRows]);
  rodSheet['!cols'] = HEADERS.rodMaster.map((header) => ({ wch: header === 'Description' ? 80 : 18 }));
  detailSheet['!cols'] = HEADERS.rodDetail.map((header) => ({ wch: header === 'Description' ? 80 : 16 }));
  XLSX.utils.book_append_sheet(wb, rodSheet, SHEET_NAMES.rod);
  XLSX.utils.book_append_sheet(wb, detailSheet, SHEET_NAMES.rodDetail);
  XLSX.writeFile(wb, OUTPUT_FILE);
  execFileSync('python3', [SHADE_SCRIPT], { stdio: 'inherit' });
}

async function main() {
  ensureDirs();
  const discovered = [];
  for (const lineup of LINEUPS) {
    const html = await fetchCached(lineup.url, path.join(LINEUP_CACHE_DIR, `${lineup.key}.html`));
    discovered.push(...parseLineup(html, lineup));
  }

  const normalized = [];
  for (const product of discovered) {
    const slug = slugFromUrl(product.url);
    const html = await fetchCached(product.url, path.join(DETAIL_CACHE_DIR, `${slug}.html`));
    normalized.push(parseProductDetail(html, product));
  }

  fs.writeFileSync(NORMALIZED_PATH, `${JSON.stringify(normalized, null, 2)}\n`);
  await buildWorkbook(normalized);
  execFileSync('python3', [APPLY_FIT_STYLE_TAGS_SCRIPT], { stdio: 'inherit' });
  execFileSync('node', [APPLY_RIG_PAIRING_SCRIPT], { stdio: 'inherit' });
  execFileSync('python3', [APPLY_PLAYER_FIELDS_SCRIPT], { stdio: 'inherit' });
  execFileSync('python3', [APPLY_PRODUCT_TECHNICAL_SCRIPT], { stdio: 'inherit' });

  console.log(
    JSON.stringify(
      {
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
