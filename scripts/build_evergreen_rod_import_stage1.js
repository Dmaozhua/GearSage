const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const { BRAND_IDS, HEADERS, SHEET_NAMES } = require('./gear_export_schema');

const BASE_URL = 'https://www.evergreen-fishing.com';
const ENTRY_URLS = [
  `${BASE_URL}/freshwater/`,
  `${BASE_URL}/saltwater/`,
  `${BASE_URL}/trout/`,
];
const EXTRA_PRODUCT_URLS = [
  `${BASE_URL}/news_html/inspirare_aurora.php`,
  `${BASE_URL}/news_html/inspirare_aurora71mh.php`,
];

const OUTPUT_DIR = path.join(__dirname, '../GearSage-client/pkgGear/data_raw');
const EXCEL_PATH = path.join(OUTPUT_DIR, 'evergreen_rod_import.xlsx');
const NORMALIZED_PATH = path.join(OUTPUT_DIR, 'evergreen_rod_normalized.json');
const REPORT_PATH = path.join(OUTPUT_DIR, 'evergreen_rod_field_completion_report.json');
const IMAGE_DIR = '/Users/tommy/Pictures/images/evergreen_rods';
const OLD_IMAGE_DIR = '/Users/tommy/Pictures/images_old_copy/evergreen_rods';
const STATIC_IMAGE_BASE = 'https://static.gearsage.club/gearsage/Gearimg/images/evergreen_rods';

const BRAND_ID = BRAND_IDS.EVERGREEN;
const ROD_PREFIX = 'ER';
const ROD_DETAIL_PREFIX = 'ERD';
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const imageReport = { local_existing: 0, old_copy: 0, downloaded: 0, unresolved: 0 };
const DISCONTINUED_NOTICE_RE = /\s*※?\s*当製品の生産は終了いたしました。\s*/g;
const SUCCESSOR_LINK_RE = /\s*当ロッドの後継機種・[^。]*?はコチラ→\s*/g;

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

function stripModelPrefix(value, model) {
  const text = normalizeText(value);
  const modelText = normalizeText(model);
  if (modelText && text.startsWith(modelText)) {
    return normalizeText(text.slice(modelText.length));
  }
  return text;
}

function cleanOfficialDisplayText(value, model = '') {
  const original = normalizeText(value);
  if (!original) return '';
  let text = original
    .replace(DISCONTINUED_NOTICE_RE, ' ')
    .replace(SUCCESSOR_LINK_RE, ' ');
  text = normalizeText(text);
  if (text !== original) text = stripModelPrefix(text, model);
  return text;
}

function isModelOnlyText(value, model) {
  const text = normalizeText(value);
  return Boolean(text && normalizeText(model) && text === normalizeText(model));
}

function absoluteUrl(raw, base = `${BASE_URL}/`) {
  const value = normalizeText(raw);
  if (!value) return '';
  try {
    return new URL(value, base).toString();
  } catch (_) {
    return '';
  }
}

function sanitizeFileName(text) {
  const file = normalizeText(text)
    .toLowerCase()
    .replace(/[\s\-–—/\\|+&.,'"`~!@#$%^*(){}\[\]:;<>?=]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return file || 'evergreen_rod';
}

function firstToken(value) {
  return normalizeText(value).split(/\s+/)[0] || '';
}

function normalizeSkuToken(value) {
  return normalizeText(value).replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}

function extractSkuFromModel(model) {
  const parts = normalizeSkuToken(model).split(/\s+/).filter(Boolean);
  const skuParts = [];
  for (const part of parts) {
    if (/^[A-Za-z0-9+./<>-]+$/.test(part)) {
      skuParts.push(part);
      continue;
    }
    break;
  }
  return skuParts.join('') || firstToken(normalizeSkuToken(model));
}

function skuKey(value) {
  return firstToken(value)
    .toUpperCase()
    .replace(/[＜<].*?[＞>]/g, '')
    .replace(/\/.*$/g, '')
    .replace(/-LTD$/g, '')
    .replace(/[^A-Z0-9]+/g, '');
}

function parsePriceNumber(text) {
  const v = normalizeText(text);
  if (!v) return '';
  const m = v.match(/[\d,]+(?:\.\d+)?/);
  return m ? m[0] : '';
}

function extractOzRange(value) {
  const text = normalizeText(value);
  const m = text.match(/\(([^)]*oz[^)]*)\)/i);
  return m ? m[1] : '';
}

function extractCarbonPercent(material) {
  const text = normalizeText(material);
  const m = text.match(/カーボン繊維\s*(\d+(?:\.\d+)?)\s*%/);
  return m ? m[1] : '';
}

function splitLineRange(lineRange) {
  const text = normalizeText(lineRange);
  if (!text) return { lineWt: '', peLine: '' };
  const pe = text.match(/PE\s*[\d.]+(?:\s*[～~\-]\s*[\d.]+)?\s*号?/i);
  const peLine = pe ? normalizeText(pe[0].replace(/\s+/g, '')) : '';
  let lineWt = text;
  if (peLine) {
    lineWt = normalizeText(text.replace(/\/?\s*PE\s*[\d.]+(?:\s*[～~\-]\s*[\d.]+)?\s*号?/i, ''));
  }
  return { lineWt, peLine };
}

function normalizeLength(value, unit) {
  const text = normalizeText(value);
  if (!text) return '';
  if (/[a-zA-ZｍmＭ]/.test(text)) return text;
  return `${text}${unit}`;
}

function normalizePower(rawPower, sku = '') {
  const text = normalizeText(rawPower);
  const skuText = normalizeText(sku).toUpperCase();
  const table = [
    [/トリプルエクストラヘビー/, 'XXXH'],
    [/ダブルエクストラヘビー/, 'XXH'],
    [/エクストラミディアムヘビー/, 'XMH'],
    [/エクストラヘビー/, 'XH'],
    [/ミディアムヘヴィ/, 'MH'],
    [/ミディアムヘビー/, 'MH'],
    [/ミディアムライト/, 'ML'],
    [/ウルトラライト/, 'UL'],
    [/スーパーウルトラライト/, 'SUL'],
    [/ライト プラス|ライトプラス/, 'L+'],
    [/ライト/, 'L'],
    [/ミディアム/, 'M'],
    [/ヘビー/, 'H'],
  ];
  for (const [re, value] of table) {
    if (re.test(text)) return value;
  }
  const m = skuText.match(/(XXXH|XXH|XH|XUL|SUL|UL|MH|ML|H|M|L)(?:[RFXST]|$|[-/＜<])/);
  return m ? m[1] : text;
}

function modelNamePart(model) {
  const parts = normalizeSkuToken(model).split(/\s+/).filter(Boolean);
  let index = 0;
  while (index < parts.length && /^[A-Za-z0-9+./<>-]+$/.test(parts[index])) {
    index += 1;
  }
  return normalizeText(parts.slice(index).join(' '));
}

function stripJapaneseCodeNameSuffix(value) {
  return normalizeText(value)
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/・リミテッド$/, ' リミテッド')
    .trim();
}

function normalizeEnglishCodeName(value) {
  return normalizeText(value)
    .replace(/\bAirregius\b/g, 'Air Regius')
    .replace(/\bForcegrandis\b/g, 'Force Grandis')
    .replace(/\bRedmeister\b/g, 'Red Meister')
    .replace(/\bEg\b/g, 'EG')
    .replace(/\bUt\b/g, 'UT')
    .replace(/\bMs\b/g, 'MS')
    .replace(/\bBb\b/g, 'BB')
    .replace(/\bGT\s+R\b/g, 'GT-R')
    .replace(/\bGT\s+X\b/g, 'GT-X')
    .replace(/\bGT\s+2\s+RS\b/g, 'GT2RS')
    .replace(/\bGT\s+3\s+RS\b/g, 'GT3RS')
    .trim();
}

function titleCaseFromSlug(slug) {
  const rawTokens = String(slug || '').match(/[A-Z]+(?=[A-Z][a-z]|\d|$)|[A-Z]?[a-z]+|\d+/g) || [];
  const acronym = new Map([
    ['Ags', 'AGS'],
    ['Bb', 'BB'],
    ['Dg', 'DG'],
    ['Eg', 'EG'],
    ['Ex', 'EX'],
    ['Gt', 'GT'],
    ['Hd', 'HD'],
    ['Lts', 'LTS'],
    ['m', 'M'],
    ['mh', 'MH'],
    ['ml', 'ML'],
    ['Ml', 'ML'],
    ['Ms', 'MS'],
    ['ul', 'UL'],
    ['xul', 'XUL'],
    ['Rsr', 'RSR'],
    ['Rs', 'RS'],
    ['r', 'R'],
    ['rs', 'RS'],
    ['Ss', 'SS'],
    ['Uft', 'UFT'],
    ['Ut', 'UT'],
    ['Grt', 'GRT'],
  ]);
  const tokens = rawTokens.map((token) => acronym.get(token) || token);
  const words = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (/^(DG|C|S)$/.test(token) && /^\d+$/.test(tokens[i + 1] || '')) {
      let combined = `${token}${tokens[i + 1]}`;
      if (/^(UL|ML|MH|M|L|H|XH|XXH|XXXH|AGS|UFT|GRT|SS)$/.test(tokens[i + 2] || '')) {
        combined += tokens[i + 2];
        i += 1;
      }
      words.push(combined);
      i += 1;
      continue;
    }
    if (/^\d+$/.test(token) && /^(UL|ML|MH|M|L|H|XH|XXH|XXXH|AGS|UFT|GRT|SS)$/.test(tokens[i + 1] || '')) {
      words.push(`${token}${tokens[i + 1]}`);
      i += 1;
      continue;
    }
    words.push(token);
  }
  return words.join(' ');
}

const URL_CODE_NAME_FIXES = new Map([
  ['Airregius', 'Air Regius'],
  ['Forcegrandis', 'Force Grandis'],
  ['Redmeister', 'Red Meister'],
  ['Bluemeister', 'Bluemeister'],
  ['Eg Action', 'EG Action'],
  ['Eg Moving', 'EG Moving'],
  ['Eg Swimming', 'EG Swimming'],
  ['Ut Spin', 'UT Spin'],
  ['Ms Dancer 61', 'MS Dancer 61'],
  ['Whipjerk 73', 'Whip Jerk 73'],
  ['Lashjerk 75', 'Lash Jerk 75'],
  ['Slackjerk 88', 'Slack Jerk 88'],
  ['Slackjerk 92', 'Slack Jerk 92'],
  ['Razorjerk 86', 'Razor Jerk 86'],
  ['Razorjerk 90', 'Razor Jerk 90'],
  ['Magnumjerk 710', 'Magnum Jerk 710'],
  ['Magnumjerk 84', 'Magnum Jerk 84'],
  ['Fine Seosor', 'Fine Sensor'],
  ['Multi Roler', 'Multi Roller'],
  ['Rocky Hantsman', 'Rocky Huntsman'],
  ['Bb Hitman', 'BB Hitman'],
]);

const JAPANESE_CODE_NAME_MAP = new Map([
  ['ウォーガゼル', 'War Gazelle'],
  ['スーパースティード', 'Super Steed'],
  ['コブラ', 'Cobra'],
  ['ブラックレイブンエクストリーム', 'Black Raven Extreme'],
  ['スタリオン', 'Stallion'],
  ['スーパーレイブン', 'Super Raven'],
  ['グランドコブラ', 'Grand Cobra'],
  ['ジャイアントディアウルフ', 'Giant Dire Wolf'],
  ['クーガーエリート7', 'Cougar Elite 7'],
  ['ディアウルフワイルド7', 'Dire Wolf Wild 7'],
  ['ラピッドガンナー', 'Rapid Gunner'],
  ['スーパースタリオン', 'Super Stallion'],
  ['グランドスタリオン', 'Grand Stallion'],
  ['ヴェロキラプター', 'Velociraptor'],
  ['ストライダー', 'Strider'],
  ['インクレディブルセンサー・デルジェスUL', 'Incredible Sensor Delges UL'],
  ['インクレディブルセンサー・デルジェス', 'Incredible Sensor Delges'],
  ['ビースティンガーエクストリーム', 'Beastinger Extreme'],
  ['インクレディブルセンサー・ガルネリウス', 'Incredible Sensor Galnerius'],
  ['スパイダースピン', 'Spider Spin'],
  ['LLキャロライナスペシャル', 'LL Carolina Special'],
  ['マーシャルイーグル', 'Marshall Eagle'],
  ['アルエット', 'Alouette'],
  ['ライトニングストライク', 'Lightning Strike'],
  ['カンタータ', 'Cantata'],
  ['ユミハリ', 'Yumihari'],
  ['ファイアソード', 'Fire Sword'],
  ['スカイソード', 'Sky Sword'],
  ['シルヴァ', 'Silva'],
  ['スローン', 'Throne'],
  ['ウィロー', 'Willow'],
  ['ブラックガーディアン', 'Black Guardian'],
  ['ハイド アンド シーク', 'Hide and Seek'],
  ['クイックセンシズ', 'Quick Senses'],
  ['ガルサ', 'Garza'],
  ['フリーウィル', 'Free Will'],
  ['スパークショット', 'Sparkshot'],
  ['フィールディンスター・ベイトフィネス', 'Fieldin Star Bait Finesse'],
  ['BF フィールディンスター・ベイトフィネス', 'Fieldin Star Bait Finesse'],
  ['シューティンスター', 'Shooting Star'],
  ['マスターアーチャー56', 'Master Archer 56'],
  ['スピットファイア', 'Spitfire'],
  ['リアルジャーカー', 'Real Jerker'],
  ['スロージャーカー', 'Slow Jerker'],
  ['ロングフォールジャーカー', 'Long Fall Jerker'],
  ['ハイピッチジャーカーライト', 'High Pitch Jerker Light'],
  ['ハイピッチジャーカー', 'High Pitch Jerker'],
  ['スピンジャーカーライト', 'Spin Jerker Light'],
  ['スピンジャーカー', 'Spin Jerker'],
  ['ソードティップマスターC', 'Sword Tip Master C'],
  ['ソードティップマスターS', 'Sword Tip Master S'],
  ['フェザージャーク', 'Feather Jerk'],
  ['スラックマスター', 'Slack Master'],
  ['ストリームウィップ', 'Stream Whip'],
  ['マイティスラッガー', 'Mighty Slugger'],
  ['スウィープマスター', 'Sweep Master'],
  ['ファイナルウィップ', 'Final Whip'],
  ['エースアタッカー', 'Ace Attacker'],
  ['ハープーン', 'Harpoon'],
  ['ディープセンスC', 'Deep Sense C'],
  ['ディープセンスS', 'Deep Sense S'],
  ['トゥイッギー', 'Twiggy'],
  ['スーパートゥイッギー', 'Super Twiggy'],
  ['サンダーショット', 'Thunder Shot'],
  ['リライアンス', 'Reliance'],
  ['マニューバー', 'Maneuver'],
  ['プロスペクター', 'Prospector'],
]);

function codeNameFromJapaneseName(namePart) {
  const clean = stripJapaneseCodeNameSuffix(namePart);
  if (!clean) return '';
  for (const [jp, en] of JAPANESE_CODE_NAME_MAP.entries()) {
    if (clean === jp) return en;
    if (clean.startsWith(jp)) {
      const suffix = normalizeText(clean.slice(jp.length))
        .replace(/オーロラ\s*エディション/g, 'Aurora Edition');
      const joiner = /^[0-9A-Za-z]/.test(suffix) && !/[CS]$/.test(en) ? ' ' : '';
      return `${en}${joiner}${suffix}`;
    }
  }
  return '';
}

function codeNameFromSourceUrl(sourceUrl) {
  const url = normalizeText(sourceUrl);
  if (!url) return '';
  const fileName = path.basename(url.split('?')[0], '.html');
  if (!fileName.startsWith('The')) return '';
  const base = fileName.slice(3);
  const english = normalizeEnglishCodeName(titleCaseFromSlug(base));
  return URL_CODE_NAME_FIXES.get(english) || english;
}

function deriveCodeName(product, item) {
  return codeNameFromSourceUrl(product.source_url) || codeNameFromJapaneseName(modelNamePart(product.model)) || item.sku;
}

function summarizeOfficialDescription(description, model = '') {
  const text = stripModelPrefix(cleanOfficialDisplayText(description, model), model);
  if (!text) return '';
  const first = text
    .split(/(?<=[。.!！?？])\s+/)
    .map((part) => normalizeText(part))
    .find((part) => part.length >= 8);
  return (first || text).slice(0, 180);
}

function inferRodType(sku, oldType = '') {
  const text = normalizeText(sku).toUpperCase();
  const direct = text.match(/(?:^|[-_])([CS])\d{2}/);
  if (direct) return direct[1];
  if (/^[A-Z]+C[-_]/.test(text) || /-C\d/.test(text)) return 'C';
  if (/^[A-Z]+S[-_]/.test(text) || /-S\d/.test(text)) return 'S';
  return normalizeText(oldType);
}

function typeTipsFromType(type) {
  if (type === 'C') return 'casting';
  if (type === 'S') return 'spinning';
  return '';
}

function pickMainImage($, pageUrl) {
  const officialProduct = [];
  $('img[src]').each((_, img) => {
    const src = absoluteUrl($(img).attr('src'), pageUrl);
    if (!src) return;
    if (!/images_set02\/goods_images\/goods_detail\//i.test(src)) return;
    if (/features|resizeimg|btn_|banner|bg_/i.test(src)) return;
    officialProduct.push(src);
  });
  if (officialProduct[0]) return officialProduct[0];

  const specialPageImages = [];
  $('img[src]').each((_, img) => {
    const src = absoluteUrl($(img).attr('src'), pageUrl);
    if (!src) return;
    if (!/news_html\/inspirare_aurora/i.test(src)) return;
    if (/obi|logo|icon|btn|banner/i.test(src)) return;
    specialPageImages.push(src);
  });
  if (specialPageImages[0]) return specialPageImages[0];

  const strictMain = [];
  $('img[src]').each((_, img) => {
    const src = absoluteUrl($(img).attr('src'), pageUrl);
    if (/news_html\/img\/.+_main\.(jpg|jpeg|png|webp)$/i.test(src)) strictMain.push(src);
  });
  if (strictMain[0]) return strictMain[0];

  const mediumMain = [];
  $('img[src]').each((_, img) => {
    const src = absoluteUrl($(img).attr('src'), pageUrl);
    if (/news_html\/img\/.+_m\.(jpg|jpeg|png|webp)$/i.test(src)) mediumMain.push(src);
  });
  if (mediumMain[0]) return mediumMain[0];

  const productLike = [];
  $('img[src]').each((_, img) => {
    const src = absoluteUrl($(img).attr('src'), pageUrl);
    if (!/news_html\/img\//i.test(src)) return;
    if (/banner|blank|grip|logo|sns|prostaff/i.test(src)) return;
    productLike.push(src);
  });
  return productLike[0] || '';
}

function extractDescription($, table) {
  const parts = [];
  if (table && table.length) {
    let node = table.prev();
    while (node && node.length && parts.length < 5) {
      const text = normalizeText(node.text());
      if (text.length >= 20 && !/受付時間|PAGE TOP|お問い合わせ|製品情報詳細/.test(text)) {
        parts.unshift(text);
      }
      node = node.prev();
    }
  }

  if (parts.length === 0) {
    $('p,div').each((_, el) => {
      if (parts.length >= 4) return false;
      const text = normalizeText($(el).text());
      if (text.length >= 30 && !/受付時間|PAGE TOP|お問い合わせ|製品情報詳細/.test(text)) {
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
  if (!table.length) return { rawSpecs, table };

  table.find('tr').each((_, tr) => {
    const cells = $(tr)
      .find('th,td')
      .map((__, cell) => normalizeText($(cell).text()))
      .get()
      .filter(Boolean);
    for (let i = 0; i + 1 < cells.length; i += 2) {
      if (cells[i] && cells[i + 1] && !rawSpecs[cells[i]]) rawSpecs[cells[i]] = cells[i + 1];
    }
  });
  return { rawSpecs, table };
}

function extractCategoryKind(entryUrl) {
  if (entryUrl.includes('/freshwater/')) return 'freshwater';
  if (entryUrl.includes('/saltwater/')) return 'saltwater';
  if (entryUrl.includes('/trout/')) return 'trout';
  return '';
}

function inferPlayerFields(item) {
  const text = `${item.model} ${item.category_title || ''} ${item.description || ''}`.toLowerCase();
  const modelText = `${item.model} ${item.category_title || ''}`.toLowerCase();
  const sku = firstToken(item.model).toUpperCase();
  const kind = item.entry_kind;
  const lureWeight = normalizeText(item.specs['適合ルアー'] || item.specs['ルアー範囲']);
  const maxGramMatch = lureWeight.match(/[～~-]\s*(\d+(?:\.\d+)?)\s*g/i) || lureWeight.match(/(\d+(?:\.\d+)?)\s*g/i);
  const maxGram = maxGramMatch ? Number(maxGramMatch[1]) : 0;
  const type = item.type;

  let environment = '';
  let positioning = '';
  let selling = '';

  if (kind === 'freshwater') {
    environment = '淡水 / Bass';
    if (/frog|フロッグ/i.test(text)) {
      positioning = 'Frog / 強障礙';
      selling = 'Frog 與重障礙場景更明確 / 粗線控魚與障礙區拔魚更有餘量';
    } else if (/big bait|ビッグベイト|ジャイアント|grand|x{2,3}h/i.test(text) || maxGram >= 84) {
      positioning = '大餌 / 強力';
      selling = '大餌與強力路線更明確 / 腰力、拋投與控魚餘量更高';
    } else if (/solid|st\b|ソリッド|ネコ|ライトリグ|フィネス/i.test(text) || /UL|L/.test(sku) || maxGram <= 10) {
      positioning = '精細輕餌';
      selling = '輕餌與精細釣組更順手 / 小型路亞、軟餌操作和咬口感知更直接';
    } else if (/worm|ワーム|jig|ジグ|texas|テキサス|bottom|底/i.test(text)) {
      positioning = '軟餌 / 底操';
      selling = '軟餌與底部操作更順手 / 讀底、障礙感知和刺魚反應更清楚';
    } else {
      positioning = type === 'S' ? '直柄泛用' : '槍柄泛用';
      selling = 'Bass 泛用路線更明確 / 硬餌、軟餌與搜索技法切換更自然';
    }
  } else if (kind === 'trout') {
    environment = '鱒魚 / 管釣';
    positioning = maxGram && maxGram <= 5 ? '精細輕餌' : '鱒魚泛用';
    selling = '鱒魚場景更明確 / 小型路亞操控、細線控魚與連續拋投更穩定';
  } else if (/zephyr|ゼファー|zags|シーバス/i.test(modelText)) {
    environment = '海鱸 / 岸投 / 遠投';
    positioning = '中大型拋投';
    selling = '海鱸岸投路線更明確 / 遠投覆蓋、控線和硬餌操作更穩';
  } else if (/スキッドロウ|squidlaw|nims|nimc|オフショアディープエギング|ロングフォール・エギング/i.test(text)) {
    environment = '木蝦 / 烏賊';
    positioning = '精細專項';
    selling = '木蝦節奏與控餌更明確 / 抽竿、看線和補刺反應更清楚';
  } else if (/タイラバ|鯛ラバ|tairaba/i.test(text)) {
    environment = '船釣 / 鯛魚 / Casting Tairaba';
    positioning = '專項技法';
    selling = '拋投鯛魚路線更明確 / 船上拋投、斜向搜索和穩定回收更順手';
  } else if (/rock|ロック|根魚|ハードロック/i.test(text)) {
    environment = '岩魚 / 海水路亞';
    positioning = '精細底操';
    selling = '岩礁底操路線更明確 / 貼底控線、避障和中魚後拉離結構更直接';
  } else if (/light game|ライトゲーム|アジ|メバル|ソルティセンセーション|psss|psmc|psms/i.test(text)) {
    environment = '輕型海水 / 精細';
    positioning = '精細輕餌';
    selling = '輕型海水路線更明確 / 小餌、細線與敏感咬口判斷更直接';
  } else {
    environment = '船釣 / 鐵板';
    positioning = /slow|スロー|long fall|ロングフォール/i.test(text) ? '慢鐵 / 船釣' : '船釣 / 鐵板';
    selling = '船釣鐵板路線更明確 / 抽停節奏、負荷控制和深場控線更穩';
  }

  let guideUse = 'Bass 泛用：出線順暢、兼容多種線徑，軟餌、硬餌、移動餌切換更自然。';
  if (/大餌|強力|障礙|Frog/.test(positioning)) {
    guideUse = '強力/大餌：粗線、大餌出線和拋投後控線更穩，重障礙或大餌場景更容易壓制魚。';
  } else if (/精細|輕餌|鱒魚/.test(positioning) || /輕型海水/.test(environment)) {
    guideUse = '輕線精細：小餌低負荷出線更順，竿尖訊號與細線控線更清楚，咬口更容易判斷。';
  } else if (/岸投|海鱸/.test(environment)) {
    guideUse = '岸投遠投：PE 線出線更順、線弧更穩，長竿反覆拋投和迎風控線更穩定。';
  } else if (/木蝦/.test(environment)) {
    guideUse = '木蝦用：PE 線出線與抽竿後回線控制更穩，連續跳蝦、看線和補刺更清楚。';
  } else if (/岩魚/.test(environment)) {
    guideUse = '岩礁底操：貼底控線和出線更穩，讀底、避障與中魚後拉離結構更直接。';
  } else if (/鯛魚|Tairaba/.test(environment)) {
    guideUse = '船上拋投鯛魚：拋投後線弧與回收張力更穩，斜向搜索、觸底判斷和補刺更清楚。';
  } else if (/船釣|鐵板/.test(environment)) {
    guideUse = '鐵板/船釣：垂直控線與負荷更穩，抽停、下沉咬口感知和長時間搏魚更直接。';
  } else if (/軟餌|底操/.test(positioning)) {
    guideUse = '軟餌底操：線到竿尖的直接感更強，讀底、感知障礙和小口刺魚更清楚。';
  }

  let guideLayout = '';
  if (/kガイド|k guide|fuji|sic|チタンフレーム|ステンレスフレーム/i.test(text)) {
    guideLayout = 'Fuji/K 系防纏導環：出線穩定，PE 線拋投與控線更不易亂';
  }

  return { environment, positioning, selling, guideUse, guideLayout };
}

async function getWithRetry(url, maxAttempts = 3) {
  let lastError = null;
  for (let i = 1; i <= maxAttempts; i += 1) {
    try {
      return await axios.get(url, HTTP_CONFIG);
    } catch (error) {
      lastError = error;
      if (i < maxAttempts) await new Promise((resolve) => setTimeout(resolve, i * 800));
    }
  }
  throw lastError;
}

async function downloadImage(url, model) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const base = sanitizeFileName(model);
  const urlExt = url ? (path.extname(new URL(url).pathname) || '.jpg').toLowerCase() : '';
  const candidateExts = [...new Set([urlExt, ...IMAGE_EXTENSIONS].filter(Boolean))];

  if (url) {
    const fileName = `${base}${urlExt || '.jpg'}`;
    const filePath = path.join(IMAGE_DIR, fileName);
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      imageReport.local_existing += 1;
      return `${STATIC_IMAGE_BASE}/${fileName}`;
    }
    const response = await axios.get(url, { ...HTTP_CONFIG, responseType: 'stream' });
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    imageReport.downloaded += 1;
    return `${STATIC_IMAGE_BASE}/${fileName}`;
  }

  for (const ext of candidateExts) {
    const fileName = `${base}${ext}`;
    if (fs.existsSync(path.join(IMAGE_DIR, fileName))) {
      imageReport.local_existing += 1;
      return `${STATIC_IMAGE_BASE}/${fileName}`;
    }
  }

  for (const ext of candidateExts) {
    const fileName = `${base}${ext}`;
    const oldPath = path.join(OLD_IMAGE_DIR, fileName);
    if (fs.existsSync(oldPath)) {
      fs.copyFileSync(oldPath, path.join(IMAGE_DIR, fileName));
      imageReport.old_copy += 1;
      return `${STATIC_IMAGE_BASE}/${fileName}`;
    }
  }

  imageReport.unresolved += 1;
  return '';
}

async function discoverCategoryUrls() {
  const urls = [];
  const seen = new Set();
  for (const entryUrl of ENTRY_URLS) {
    const { data } = await getWithRetry(entryUrl);
    const $ = cheerio.load(data);
    $('a[href*="goods_list_22rod.php"]').each((_, a) => {
      const url = absoluteUrl($(a).attr('href'), entryUrl);
      if (!url || seen.has(url)) return;
      seen.add(url);
      urls.push({ url, entry_url: entryUrl, entry_kind: extractCategoryKind(entryUrl) });
    });
  }
  return urls;
}

function extractCategoryTitle($) {
  const candidates = [
    $('h1').first().text(),
    $('h2').first().text(),
    $('title').first().text().replace(/^.* - /, ''),
  ];
  return normalizeText(candidates.find((v) => normalizeText(v)) || '');
}

function parseSpecRows($, category) {
  const rows = [];
  $('table').each((_, table) => {
    const trList = $(table).find('tr').toArray();
    if (trList.length < 2) return;
    const headers = $(trList[0])
      .find('th,td')
      .map((__, cell) => normalizeText($(cell).text()))
      .get();
    if (!headers.some((h) => /製品名|全長|標準自重/.test(h))) return;

    trList.slice(1).forEach((tr) => {
      const cells = $(tr)
        .find('th,td')
        .map((__, cell) => normalizeText($(cell).text()))
        .get();
      const link = $(tr).find('a[href*="/goods_list/"][href$=".html"]').first();
      const model = normalizeText(link.text());
      const sourceUrl = absoluteUrl(link.attr('href'), category.url);
      const thumbnailUrl = absoluteUrl(link.find('img').first().attr('src') || $(tr).find('img').first().attr('src'), category.url);
      if (!model || !sourceUrl) return;

      const specs = {};
      for (let i = 1; i < headers.length; i += 1) {
        specs[headers[i]] = cells[i] || '';
      }
      const price = parsePriceNumber((cells[0] || '').replace(model, ''));
      specs['価格'] = price;

      rows.push({
        model,
        source_url: sourceUrl,
        category_url: category.url,
        entry_url: category.entry_url,
        entry_kind: category.entry_kind,
        thumbnail_url: thumbnailUrl,
        specs,
      });
    });
  });
  return rows;
}

function parseSpecialProduct($, url) {
  const body = normalizeText($('body').text());
  let model = '';
  let endMarker = '';
  if (url.includes('inspirare_aurora71mh')) {
    model = 'IRSC-71MH-Aurora スーパースタリオンRS オーロラ エディション';
    endMarker = '第2弾スーパースタリンRSオーロラエディション';
  } else {
    model = 'IRSC-66M-Aurora コブラRS オーロラ エディション';
    endMarker = '第1弾コブラRSオーロラエディション';
  }

  function pick(re) {
    const m = body.match(re);
    return m ? normalizeText(m[1]) : '';
  }

  const specs = {
    '全長': pick(/●全長：([^●]+?)(?:\s+●|$)/),
    '標準自重': pick(/●自重(?:（予定）)?：([^●]+?)(?:\s+●|$)/),
    'パワー': pick(/●パワー：([^●]+?)(?:\s+●|$)/),
    '適合ルアー': pick(/●適合ルアー：([^●]+?)(?:\s+●|$)/),
    '適合ライン': pick(/●適合ライン：([^●]+?)(?:\s+●|$)/),
    '仕舞寸法': pick(/●仕舞寸法：([^●]+?)(?:\s+●|$)/),
    '継数': pick(/●継数：([^●]+?)(?:\s+●|$)/),
    '価格': parsePriceNumber(pick(/メーカー希望小売価格：([^●]+?)(?:\s|$)/)),
  };

  const mainImageUrl = pickMainImage($, url);
  const start = body.indexOf(firstToken(model));
  const end = endMarker ? body.indexOf(endMarker, start) : -1;
  const description =
    start >= 0
      ? normalizeText(body.slice(start, end > start ? end : start + 2200))
      : body;

  return {
    model,
    source_url: url,
    category_url: `${BASE_URL}/goods_list/goods_list_22rod.php?vctt_no=1&vcts_no=66&r=2&s_no=66`,
    entry_url: `${BASE_URL}/freshwater/`,
    entry_kind: 'freshwater',
    category_title: 'インスピラーレ（RS/GT/スペシャル）',
    thumbnail_url: mainImageUrl,
    main_image_url: mainImageUrl,
    description,
    specs,
    special_page: true,
  };
}

async function fetchProductDetail(product) {
  const { data } = await getWithRetry(product.source_url);
  const $ = cheerio.load(data);
  const { rawSpecs, table } = parseSpecTable($);
  const description = cleanOfficialDisplayText(extractDescription($, table), product.model);
  const mainImageUrl = pickMainImage($, product.source_url) || product.thumbnail_url || '';
  if (product.special_page) {
    const special = parseSpecialProduct($, product.source_url);
    return {
      ...product,
      model: special.model,
      specs: { ...(product.specs || {}), ...special.specs },
      detail_specs: special.specs,
      description: cleanOfficialDisplayText(special.description || description, special.model || product.model),
      main_image_url: special.main_image_url || mainImageUrl,
      raw_data_hash: crypto.createHash('sha256').update(data).digest('hex'),
      scraped_at: new Date().toISOString(),
    };
  }
  return {
    ...product,
    detail_specs: rawSpecs,
    description,
    main_image_url: mainImageUrl,
    raw_data_hash: crypto.createHash('sha256').update(data).digest('hex'),
    scraped_at: new Date().toISOString(),
  };
}

function readExistingWorkbook() {
  if (!fs.existsSync(EXCEL_PATH)) return { rodRows: [], detailRows: [] };
  const wb = XLSX.readFile(EXCEL_PATH);
  return {
    rodRows: XLSX.utils.sheet_to_json(wb.Sheets[SHEET_NAMES.rod], { defval: '' }),
    detailRows: XLSX.utils.sheet_to_json(wb.Sheets[SHEET_NAMES.rodDetail], { defval: '' }),
  };
}

function normalizeItem(product, existingRod, existingDetail) {
  const sku = extractSkuFromModel(product.model);
  const mergedSpecs = { ...(product.specs || {}), ...(product.detail_specs || {}) };
  const line = splitLineRange(mergedSpecs['適合ライン'] || mergedSpecs['ライン範囲']);
  const type = inferRodType(sku, existingDetail.TYPE);
  const description = cleanOfficialDisplayText(
    product.description || existingRod.Description || '',
    product.model || existingRod.model || ''
  );
  const player = inferPlayerFields({
    ...product,
    specs: mergedSpecs,
    type,
    description,
  });

  return {
    sku,
    type,
    type_tips: typeTipsFromType(type) || normalizeText(existingRod.type_tips),
    description,
    specs: mergedSpecs,
    line,
    player,
  };
}

async function buildImportRows(products) {
  const { rodRows: oldRodRows, detailRows: oldDetailRows } = readExistingWorkbook();
  const oldRodQueues = new Map();
  const oldDetailByRodId = new Map();
  oldRodRows.forEach((row) => {
    const key = skuKey(extractSkuFromModel(row.model));
    if (!oldRodQueues.has(key)) oldRodQueues.set(key, []);
    oldRodQueues.get(key).push(row);
  });
  oldDetailRows.forEach((row) => oldDetailByRodId.set(normalizeText(row.rod_id), row));

  const rodRows = [];
  const detailRows = [];
  const normalized = [];
  const appended = [];
  const changedSkus = [];

  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    const key = skuKey(extractSkuFromModel(product.model));
    const oldRod = (oldRodQueues.get(key) || []).shift() || {};
    const oldDetail = oldDetailByRodId.get(normalizeText(oldRod.id)) || {};
    const item = normalizeItem(product, oldRod, oldDetail);
    const image = await downloadImage(product.main_image_url, product.model);
    const codeName = deriveCodeName(product, item);

    const rodId = `${ROD_PREFIX}${1000 + index}`;
    const detailId = `${ROD_DETAIL_PREFIX}${10000 + index}`;
    if (!oldRod.id) appended.push({ sku: item.sku, model: product.model, source_url: product.source_url });
    if (normalizeText(oldDetail.SKU) && normalizeText(oldDetail.SKU) !== item.sku) {
      changedSkus.push({ id: detailId, from: oldDetail.SKU, to: item.sku });
    }

    const modelDescription = cleanOfficialDisplayText(item.description, product.model);
    const oldMainSellingPoints = cleanOfficialDisplayText(oldRod.main_selling_points, product.model);
    const mainSellingPoints =
      oldMainSellingPoints && !isModelOnlyText(oldMainSellingPoints, product.model)
        ? oldMainSellingPoints
        : summarizeOfficialDescription(modelDescription, product.model);
    rodRows.push({
      id: rodId,
      brand_id: BRAND_ID,
      model: product.model,
      model_cn: oldRod.model_cn || '',
      model_year: oldRod.model_year || '',
      alias: oldRod.alias || '',
      type_tips: item.type_tips,
      images: image,
      created_at: oldRod.created_at || '',
      updated_at: oldRod.updated_at || '',
      series_positioning: oldRod.series_positioning || '',
      main_selling_points: mainSellingPoints,
      official_reference_price: oldRod.official_reference_price || '',
      market_status: oldRod.market_status || '',
      Description: modelDescription,
      player_positioning: item.player.environment,
      player_selling_points: item.player.selling,
    });

    detailRows.push({
      id: detailId,
      rod_id: rodId,
      TYPE: item.type,
      SKU: item.sku,
      POWER: normalizePower(item.specs['パワー'], item.sku) || oldDetail.POWER || '',
      'TOTAL LENGTH': normalizeLength(item.specs['全長'] || item.specs['全長（m）'], 'm'),
      Action: oldDetail.Action || '',
      PIECES: normalizeText(item.specs['継数'] || oldDetail.PIECES),
      CLOSELENGTH: normalizeLength(item.specs['仕舞寸法(cm)'] || item.specs['仕舞寸法'], 'cm'),
      WEIGHT: normalizeLength(item.specs['標準自重(g)'] || item.specs['標準自重'] || item.specs['自重'], 'g'),
      'Tip Diameter': oldDetail['Tip Diameter'] || '',
      'LURE WEIGHT': normalizeText(item.specs['適合ルアー'] || item.specs['ルアー範囲'] || item.specs['ルアーウエイト']),
      'Line Wt N F': item.line.lineWt,
      'PE Line Size': item.line.peLine,
      'Handle Length': oldDetail['Handle Length'] || '',
      'Reel Seat Position': oldDetail['Reel Seat Position'] || '',
      'CONTENT CARBON': extractCarbonPercent(item.specs['使用材料']) || oldDetail['CONTENT CARBON'] || '',
      'Market Reference Price': parsePriceNumber(item.specs['価格'] || oldDetail['Market Reference Price']),
      AdminCode: oldDetail.AdminCode || '',
      'Service Card': oldDetail['Service Card'] || '',
      ' Jig Weight': oldDetail[' Jig Weight'] || '',
      'Squid Jig Size': oldDetail['Squid Jig Size'] || '',
      'Sinker Rating': oldDetail['Sinker Rating'] || '',
      created_at: oldDetail.created_at || '',
      updated_at: oldDetail.updated_at || '',
      'LURE WEIGHT (oz)': extractOzRange(item.specs['適合ルアー'] || item.specs['ルアー範囲']) || oldDetail['LURE WEIGHT (oz)'] || '',
      'Sale Price': oldDetail['Sale Price'] || '',
      'Joint Type': oldDetail['Joint Type'] || '',
      'Code Name': codeName || oldDetail['Code Name'] || '',
      'Fly Line': oldDetail['Fly Line'] || '',
      'Grip Type': oldDetail['Grip Type'] || '',
      'Reel Size': oldDetail['Reel Size'] || '',
      guide_layout_type: item.player.guideLayout,
      guide_use_hint: item.player.guideUse,
      hook_keeper_included: '',
      sweet_spot_lure_weight_real: '',
      official_environment: '',
      player_environment: item.player.environment,
      player_positioning: item.player.positioning,
      player_selling_points: item.player.selling,
      Description: item.description,
      'Extra Spec 1': oldDetail['Extra Spec 1'] || '',
      'Extra Spec 2': oldDetail['Extra Spec 2'] || '',
    });

    normalized.push({
      brand: 'Evergreen',
      kind: 'rod',
      model: product.model,
      model_year: '',
      source_url: product.source_url,
      category_url: product.category_url,
      entry_kind: product.entry_kind,
      main_image_url: product.main_image_url,
      images: image,
      description: item.description,
      variants: [
        {
          sku: item.sku,
          type: item.type,
          power: normalizePower(item.specs['パワー'], item.sku),
          code_name: codeName,
          specs: item.specs,
          description: item.description,
        },
      ],
      raw_data_hash: product.raw_data_hash,
      scraped_at: product.scraped_at,
    });
  }

  return { rodRows, detailRows, normalized, report: { appended, changedSkus } };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const categoryUrls = await discoverCategoryUrls();
  const productMap = new Map();

  for (const category of categoryUrls) {
    const { data } = await getWithRetry(category.url);
    const $ = cheerio.load(data);
    const categoryTitle = extractCategoryTitle($);
    const specRows = parseSpecRows($, category);
    specRows.forEach((row) => {
      if (!productMap.has(row.source_url)) {
        productMap.set(row.source_url, { ...row, category_title: categoryTitle });
      }
    });
    console.log(`[evergreen_rod] discovery ${category.entry_kind} ${specRows.length}: ${category.url}`);
  }

  for (const url of EXTRA_PRODUCT_URLS) {
    if (!productMap.has(url)) {
      productMap.set(url, {
        source_url: url,
        category_url: `${BASE_URL}/goods_list/goods_list_22rod.php?vctt_no=1&vcts_no=66&r=2&s_no=66`,
        entry_url: `${BASE_URL}/freshwater/`,
        entry_kind: 'freshwater',
        category_title: 'インスピラーレ（RS/GT/スペシャル）',
        specs: {},
        special_page: true,
      });
    }
  }

  const discovered = [...productMap.values()];
  const fetched = [];
  const concurrency = 4;
  for (let i = 0; i < discovered.length; i += concurrency) {
    const chunk = discovered.slice(i, i + concurrency);
    const results = await Promise.allSettled(chunk.map((product) => fetchProductDetail(product)));
    results.forEach((result, idx) => {
      const product = chunk[idx];
      if (result.status === 'fulfilled') {
        fetched.push(result.value);
      } else {
        console.warn(`[evergreen_rod] detail failed ${product.source_url}: ${result.reason.message}`);
        fetched.push({ ...product, description: '', main_image_url: '', detail_specs: {}, raw_data_hash: '', scraped_at: new Date().toISOString() });
      }
    });
    console.log(`[evergreen_rod] details ${Math.min(i + concurrency, discovered.length)}/${discovered.length}`);
  }

  const { rodRows, detailRows, normalized, report } = await buildImportRows(fetched);
  fs.writeFileSync(NORMALIZED_PATH, JSON.stringify(normalized, null, 2), 'utf8');

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rodRows, { header: HEADERS.rodMaster }), SHEET_NAMES.rod);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows, { header: HEADERS.rodDetail }), SHEET_NAMES.rodDetail);
  XLSX.writeFile(wb, EXCEL_PATH);

  const coverage = {};
  for (const [sheet, rows] of Object.entries({ rod: rodRows, rod_detail: detailRows })) {
    coverage[sheet] = {};
    Object.keys(rows[0] || {}).forEach((key) => {
      coverage[sheet][key] = rows.filter((row) => normalizeText(row[key])).length;
    });
  }

  const finalReport = {
    entry_urls: ENTRY_URLS,
    category_count: categoryUrls.length,
    discovered_count: discovered.length,
    imported_master_count: rodRows.length,
    imported_detail_count: detailRows.length,
    appended: report.appended,
    changed_skus: report.changedSkus,
    image_report: imageReport,
    coverage,
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(finalReport, null, 2), 'utf8');

  console.log(JSON.stringify(finalReport, null, 2));
  console.log(`[evergreen_rod] wrote ${NORMALIZED_PATH}`);
  console.log(`[evergreen_rod] wrote ${EXCEL_PATH}`);
  console.log(`[evergreen_rod] wrote ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error('[evergreen_rod] fatal:', error);
  process.exit(1);
});
