const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const { BRAND_IDS, HEADERS, SHEET_NAMES } = require('./gear_export_schema');

const BASE_URL = 'http://raidjapan.com';
const ENTRY_URL = `${BASE_URL}/?page_id=46`;
const OUTPUT_DIR = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw');
const CACHE_DIR = path.join(OUTPUT_DIR, 'raid_rods_cache');
const CATEGORY_CACHE_DIR = path.join(CACHE_DIR, 'categories');
const DETAIL_CACHE_DIR = path.join(CACHE_DIR, 'details');
const NORMALIZED_PATH = path.join(OUTPUT_DIR, 'raid_rod_normalized.json');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'raid_rod_import.xlsx');
const WHITELIST_EVIDENCE_PATH = path.join(OUTPUT_DIR, 'raid_rod_whitelist_player_evidence.json');
const RIG_PAIRING_REPORT_PATH = path.join(OUTPUT_DIR, 'raid_rod_recommended_rig_pairing_report.json');
const SHADE_SCRIPT = path.join(__dirname, 'shade_raid_rod_detail_groups.py');
const IMAGE_DIR = '/Users/tommy/Pictures/images/raid_rods';
const OLD_IMAGE_DIR = '/Users/tommy/Pictures/images_old_copy/raid_rods';
const STATIC_IMAGE_BASE = 'https://static.gearsage.club/gearsage/Gearimg/images/raid_rods';
const REFRESH_IMAGES = process.argv.includes('--refresh-images');

const BRAND_ID = BRAND_IDS.RAID_JAPAN || 54;
const ROD_PREFIX = 'RR';
const ROD_DETAIL_PREFIX = 'RRD';

const RECOMMENDED_RIG_PAIRING_BY_CODE = {
  'GX-65ML+C-ST': {
    value: 'Light Texas Rig / Leaderless Down Shot / Free Rig / Neko Rig / Backslide No Sinker / No Sinker / Finesse Cover Jig',
    source: 'official_description',
    evidence: 'Official text lists light Texas, leaderless down shot, free rig, Neko, high-specific-gravity backslide, stickbait no sinker, and Egu-Dama Type Cover.',
  },
  'GX-67MHC-ST': {
    value: 'Heavy Down Shot / Free Rig / Light Texas Rig / Backslide No Sinker / Heavy Neko Rig / Small Rubber Jig',
    source: 'official_description',
    evidence: 'Official text lists heavy drop shot, free rig, light Texas, light backslide worm, heavy Neko, and Egu-Dama Type Cover/Level.',
  },
  'GX-70M+C': {
    value: 'Vibration / Spinnerbait / Shad Tail Worm / Light Texas Rig / Free Rig / No Sinker / Crawler Bait',
    source: 'official_description',
    evidence: 'Official text says highest utility across lure/rig types, open-area winding, worming, light cover, and up to 1oz DODGE.',
  },
  'GX-70HC-ST': {
    value: 'Light Texas Rig / Free Rig / Neko Rig / Small Rubber Jig / Backslide No Sinker',
    source: 'official_plus_conservative',
    evidence: 'Official text defines heavy-cover bait finesse and light rigs; exact rig names are conservatively aligned with same THE MAXX family official descriptions.',
  },
  'GXT-70HC-ST': {
    value: 'Light Texas Rig / Free Rig / Neko Rig / Small Rubber Jig / Backslide No Sinker / Vibration',
    source: 'official_plus_conservative',
    evidence: 'Official text says worming-special, lighter rigs than THE MAXX, broader upper rig weight, and partial moving-bait support.',
  },
  'GX-70H+C': {
    value: 'Big Bait / Swimbait / Rubber Jig / Texas Rig / Alabama Rig',
    source: 'official_description',
    evidence: 'Official text lists big bait, swimbait, rubber jig, Texas rig, and Bama-st with Muscle Wire / Ghost Wire Next Level plus Fishroller.',
  },
  'GX-71XHC-ST': {
    value: 'Alabama Rig / Swimbait / Rubber Jig / Heavy Texas Rig',
    source: 'official_plus_whitelist',
    evidence: 'Official text says weighted lures/rigs with thick line; TackleDB samples support Ghost Wire/Fishroller, Fullswing, rubber jig, and heavy worming usage.',
  },
  'GX-72MH+C': {
    value: 'Swim Jig / Spinnerbait / Chatterbait / Vibration / Crankbait / Topwater Plug / Crawler Bait / Rubber Jig / Sinker Rig / Backslide No Sinker / Shad Tail Worm',
    source: 'official_description',
    evidence: 'Official text lists swim jig, wire baits, vibration, crankbait, DODGE-class topwater, rubber jig, sinker rigs, backslide high-specific-gravity worms, and shad-tail worms.',
  },
  'GX-59XLS-AS': {
    value: 'Down Shot / Neko Rig / Jighead Rig / Small Rubber Jig',
    source: 'official_plus_conservative',
    evidence: 'Official text says lightweight finesse rigs overall, with XL specializing in one-point shaking; exact rig names are conservative Bass finesse staples.',
  },
  'GX-59ULS-AS': {
    value: 'Down Shot / Neko Rig / Jighead Rig / Small Rubber Jig',
    source: 'official_plus_conservative',
    evidence: 'Official text says lightweight finesse rigs overall, with UL specializing in faster cover-side finesse presentations.',
  },
  'GX-61ULS-ST': {
    value: 'Down Shot / Neko Rig / Jighead Rig / Small Rubber Jig',
    source: 'official_description',
    evidence: 'Official text says wide worm/rig coverage and 2.5g, 3.5g, sometimes 5g sinker worming.',
  },
  'GX-61LS': {
    value: 'Neko Rig / Down Shot / Jighead Rig / Shad / Small Topwater Plug',
    source: 'official_plus_conservative',
    evidence: 'Official text says finesse rig operation, accuracy, utility, and reaction-style operation; exact rig names are conservative finesse staples.',
  },
  'GX-64LS-ST': {
    value: 'Down Shot / Jighead Rig / No Sinker / Neko Rig / Jighead Wacky / Mid Strolling Jighead / Hover Strolling / Small Rubber Jig / Bug Lure / Shad / Minnow / Small Topwater Plug / I-shaped Plug',
    source: 'official_description',
    evidence: 'Official text lists down shot, jighead, no sinker, Neko, jighead wacky, hobast, small rubber jig, bug worms, shad, minnow, small topwater, and I-shaped plugs.',
  },
  'GX-64LS-STMD': {
    value: 'Mid Strolling Jighead / Hover Strolling / Surface Twitch Rig',
    source: 'official_description',
    evidence: 'Official text describes PE-ready mid-strolling and says long regular solid tip works for mid-st, hobast, and surface twitch methods.',
  },
  'GX-67MLS-PMD': {
    value: 'Power Mid Strolling Jighead / Mid Strolling Jighead / Shad / Minnow',
    source: 'official_description',
    evidence: 'Official text calls PMD power mid-strolling and lists jighead mid-layer swimming, heavy jighead power mid-strolling, and small shad/minnow compatibility.',
  },
  'GA-62BF': {
    value: 'Small Rubber Jig / Neko Rig / Down Shot / Small Plug',
    source: 'official_description',
    evidence: 'Official text lists 1/16oz-class small rubber jig, Neko, down shot, and around-5g light plug.',
  },
  'GA-64MLC': {
    value: 'Jerkbait / Crankbait / Vibration / Popper / Pencil Bait / Spinnerbait',
    source: 'official_description',
    evidence: 'Official text says Black Viper is focused on jerkbait and also covers crankbait, vibration, popper, pencil bait, and wire bait.',
  },
  'GA-65PBF': {
    value: 'Neko Rig / Small Rubber Jig / Small Plug',
    source: 'official_description',
    evidence: 'Official text lists straight-worm Neko rigs, small rubber jigs, and sub-10g plugging.',
  },
  'GA-67MHTC': {
    value: 'Frog / Topwater Plug / Crawler Bait / Chatterbait / Spinnerbait / Crankbait',
    source: 'official_description',
    evidence: 'Official text says PE frog operation first, then Scratch/Bulltank topwater, DODGE/G.i topwater, chatter/spinnerbait, and heavy-resistance hard plugs.',
  },
  'GA-610MC': {
    value: 'Minnow / Vibration / Crankbait / Spinnerbait / No Sinker / Neko Rig',
    source: 'official_plus_whitelist',
    evidence: 'Official text says 7-14g moving baits first and same-weight worming; TackleDB samples support Level Minnow, Level Vibe, Drive Shad, smoraba, and worm usage.',
  },
  'GA-610MHC': {
    value: 'Chatterbait / Spinnerbait / Vibration / Rubber Jig / Texas Rig / Swimbait',
    source: 'official_plus_whitelist',
    evidence: 'Official text says 10-20g moving/soft baits; TackleDB samples support bladed jig, rubber jig, Fullswing, and related power-soft use.',
  },
  'GA-70MGC': {
    value: 'Crankbait / Vibration / Spinnerbait / Buzzbait / Chatterbait / Big Bait / Swimbait / Crawler Bait',
    source: 'official_description',
    evidence: 'Official text lists shallow-to-deep crankbait, vibration, spinnerbait, buzzbait, chatterbait, medium big bait/swimbait, DODGE-class crawler bait.',
  },
  'GA-72HC': {
    value: 'Rubber Jig / Texas Rig / Heavy Carolina Rig / No Sinker / Spinnerbait / Chatterbait / Deep Crankbait',
    source: 'official_description',
    evidence: 'Official text says cover worming, heavy Carolina, high-specific-gravity worm long-distance game, heavyweight moving bait, and high-resistance winding.',
  },
  'GA-74XHC': {
    value: 'Big Bait / Big Plug / Swimbait / S-shaped Bait / Crawler Bait / Rubber Jig / Texas Rig',
    source: 'official_description',
    evidence: 'Official text says 2oz-class big bait, big plug, swimbait, S-shaped bait, big crawler bait, rubber jig, and Texas rig.',
  },
  'GA-75XXHC': {
    value: 'Big Bait / Swimbait / Swimming Jig',
    source: 'official_description',
    evidence: 'Official text says first Raid Japan big-bait dedicated rod, 5oz+ big bait/swimbait, and delicate big bait or swimming jig use.',
  },
  'GA-61ULS-ST': {
    value: 'Down Shot / Neko Rig / Jighead Rig / No Sinker / Small Rubber Jig',
    source: 'official_plus_conservative',
    evidence: 'Official text says light rigs are indispensable and this is an offensive finesse rod; exact rig names are conservative Bass finesse staples.',
  },
  'GA-63LS': {
    value: 'Small Rubber Jig / Neko Rig / Jighead Wacky / Jighead Rig / Shad / Minnow / Small Topwater Plug',
    source: 'official_description',
    evidence: 'Official text lists small rubber jig, Neko, jighead wacky, jighead, 7g-class shad, minnow, and top lure.',
  },
  'GA-65MS': {
    value: 'Surface Worming / Minnow / Shad / Vibration / Small Topwater Plug / Light Power Finesse / Hovering Rubber Jig / Swim Jig',
    source: 'official_description',
    evidence: 'Official text lists PE surface worming, minnow, shad, vibration, small topwater, light power finesse/light hanging, Micro DODGE, Egu-Dama Type Level, Level Vibe Boost, and Head Swimmer Libero.',
  },
  'GA-67L+S': {
    value: 'Neko Rig / Down Shot / Jighead Rig / Shad / Minnow / Small Topwater Plug',
    source: 'official_plus_conservative',
    evidence: 'Official text says broad finesse rig/finesse plugging outside extreme finesse; exact rig names are conservative finesse staples.',
  },
  'GA-611MLS-ST': {
    value: 'Shad / Minnow / Metal Vibration / Neko Rig / Jighead Rig',
    source: 'official_plus_whitelist',
    evidence: 'Official text says light plugging, worming, and metal-lure reaction game; TackleDB samples support vibration, minnow, shad, and worm use.',
  },
  'GA-70HS-ST': {
    value: 'Hanging Rubber Jig / Power Finesse Jig / Cover Suspended Rig',
    source: 'official_description',
    evidence: 'Official text says dedicated hanging rod and specifically names Egu-Dama Type Level with PE1.5-2.0 for cover hanging.',
  },
  'GA-74ML+S': {
    value: 'No Sinker / Neko Rig / Jighead Wacky / Mid Strolling Jighead / Shad / Minnow / Vibration',
    source: 'official_description',
    evidence: 'Official text lists no sinker, Neko, JHW, jighead mid-strolling, small-to-medium plugs, Level Shad, Level Minnow, and Level Vibe Boost.',
  },
};

const GUIDE_USE_HINT_BY_CODE = {
  'GX-65ML+C-ST':
    '轻量 cover 打撃：低弹道投放 Light Texas、Free Rig、Neko 与 backslide no sinker 时出线要直接，短竿轻量化设定利于近距离控线、快速刺鱼和减少力量传递损失。',
  'GX-67MHC-ST':
    '近距離吊るし/cover finesse：solid tip 负责轻中量 rig 的精密投放与咬口读取，强 belly/butt 配合导环出线稳定性，便于 heavy down shot、free rig、small rubber jig 在硬 cover 中挂鱼后快速拉出。',
  'GX-70M+C':
    '高精度泛用：12-14lb FC 下可在 open water 巻物、worming 与 light cover 间切换；导环出线重点是让 vibration、spinnerbait、no sinker、free rig 到 1oz crawler bait 都保持投距和线弧稳定。',
  'GX-70HC-ST':
    'Heavy-cover bait finesse：light rig 入 cover 时需要低阻出线和清楚的 solid-tip 反馈；适合 Light Texas、Free Rig、Neko、Small Rubber Jig 这类轻量钓组精准落点、吃口后立即控鱼。',
  'GXT-70HC-ST':
    'Worming 特化扩展：轻量化与 solid tip 让更轻 rig 也能细腻控底，同时增强 butt power 承接上限更高的 rig weight；导环使用重点是 cover 打撃与少量 moving bait 切换时线弧稳定。',
  'GX-70H+C':
    '横向大饵 + 纵向 power game：big bait、swimbait 与 Alabama Rig 抛投时要稳定释放粗线，切到 Rubber Jig / Texas Rig 进 cover 时也要保留控底和强制控鱼余量。',
  'GX-71XHC-ST':
    '重饵精细操作：XH 负载下仍要让 Alabama Rig、swimbait、rubber jig 这类有体积的 lure/rig 顺畅出线；导环和 solid tip 的重点是粗线下保持操作集中力，而不是只追求硬拉。',
  'GX-72MH+C':
    '岸钓强泛用：长握把和上扬 tip 平衡利于远投与 slack line 控制；从 Swim Jig、wire bait、vibration、crank 到 rubber jig、sinker rig、backslide worm 都要兼顾 moving bait 搜索和 bottom worming 切换。',
  'GX-59XLS-AS':
    '一点シェイク精细：细线小 rig 的出线要轻、反馈要干净；Down Shot、Neko、Jighead、Small Rubber Jig 在定点慢诱时，solid tip 应帮助维持微小线弧和轻咬判断。',
  'GX-59ULS-AS':
    'Cover-side finesse 快节奏：轻量 finesse rig 投向 cover 周边时要顺畅出线并快速回收线弧；比 XL 更偏短节奏投放、控线和连续打点。',
  'GX-61ULS-ST':
    'UL light rig 宽容度：2.5-5g sinker worming 与 under-weight rig 都需要顺滑出线和清楚竿尖反馈；导环使用重点是轻线下兼顾投距、控底和大鱼搏斗时的缓冲。',
  'GX-61LS':
    'Finesse utility：用于 Neko、Down Shot、Jighead 与小型 plug 时，导环需要兼顾轻 rig 精准投放和反应式操作的线弧控制，适合短距离高精度打点和快速节奏切换。',
  'GX-64LS-ST':
    '全域 finesse：FC4-5lb 与 PE0.6+leader 都能覆盖，长一节 solid tip 利于 bottom shake、mid/hober strolling、small plug 操作；导环重点是细线出线、slack line 控制和轻量 plug 振动反馈。',
  'GX-64LS-STMD':
    'PE mid-strolling 专用：长 regular solid tip 需要让 PE 细线在连续高频 shake 中保持顺滑出线，同时用柔韧 taper 吸收 PE 低伸度，降低脱钩和断线风险。',
  'GX-67MLS-PMD':
    'Power mid-strolling：较重 jighead 与 5-6.5inch worm 中层游动时，导环要帮助稳定 slack line 节奏和レンジ控制；同一设定可兼顾小型 shad/minnow 的反应操作。',
  'GA-62BF':
    'Real bait finesse：1/16oz small rubber jig、Neko、Down Shot 与 5g light plug 需要轻量投放和直接底感；full tubular blank 下导环重点是低惯性出线、shaking 操作和短距精度。',
  'GA-64MLC':
    'Jerkbait / hard plug：80-120mm jerkbait 是核心，导环出线要稳定支持抽停节奏和短竿连续 rod work；兼顾 crank、vibration、popper、pencil、spinnerbait 时保持巻き感和线弧稳定。',
  'GA-65PBF':
    'Power bait finesse：Neko、Small Rubber Jig 与 10g 以下 plug 之间切换时，导环要兼顾轻量投放、solid tip 反馈和 cover 周边控线，适合填补普通 BFS 与标准 bait tackle 之间的空档。',
  'GA-67MHTC':
    'Frog / topwater operation：PE frog 出线和强力 hookset 是核心；同时要支持 DODGE、G.i、chatter、spinnerbait、重阻力 crank 等移动饵，导环需兼顾 PE 顺滑通过和高负荷强度。',
  'GA-610MC':
    '7-14g moving bait 泛用：minnow、vibration、crank、spinnerbait 是主轴，导环出线应让弓形 bend 带出稳定投感；切到同重量 worming 时仍能保持控线和咬口判断。',
  'GA-610MHC':
    '10-20g power versatile：chatter、spinnerbait、vibration 与 rubber jig、Texas、swimbait 之间切换，导环要支撑更粗线和更大 lure weight，同时保留 casting/hookset 的直接感。',
  'GA-70MGC':
    'Glass composite hard-plug：crank、vibration、wire bait 和 crawler bait 需要稳定出线与水阻反馈；导环使用重点是长短距离抛投精度、巻き节奏和 hardbait泳层维持。',
  'GA-72HC':
    'Heavy versatile：Rubber Jig、Texas、Heavy Carolina 与 high-density worm 要求 cover/远投控底，spinnerbait、chatter、deep crank 则要求稳定巻き；导环重点是粗线出线和软硬饵切换。',
  'GA-74XHC':
    '2oz class big bait：big bait、big plug、swimbait、S-shaped bait 抛投时要分散负载、稳定粗线出线，并保留细腻 slack 操作；切到 rubber jig / Texas cover 攻略时也要能快速控鱼。',
  'GA-75XXHC':
    '5oz+ big bait 专用：长时间 big bait / swimbait 抛投需要稳定粗线和高负荷出线，dead-slow big bait 与 swimming jig 操作时要能保留细微阻力变化和疲劳控制。',
  'GA-61ULS-ST':
    '喰わせ light rig：极细腻 solid tip 与 soft grip 操作适合 Down Shot、Neko、Jighead、No Sinker；导环重点是细线顺滑、轻咬反馈和 zero-finger style 下的微操作。',
  'GA-63LS':
    'Light game utility：Small Rubber Jig、Neko、Jighead Wacky、Jighead 与 7g 级 shad/minnow/topwater 都要兼容；导环应兼顾轻量 rig 控底和小型 plug 搜索的线弧稳定。',
  'GA-65MS':
    'PE light power finesse：PE0.8-1.2 surface worming、light plugging、軽吊るし都需要 knot clearance；TOP-belly #5 PKTSG 设定重点是 PE+leader 通过顺畅，并兼顾 Micro DODGE、Level Vibe Boost、Head Swimmer Libero。',
  'GA-67L+S':
    'One-spinning shore utility：finesse rig 与 finesse plug 都覆盖，FC4-5lb 偏操作、PE0.8 偏远投；导环使用重点是不同线组下保持近距精度、远投线弧和轻量 plug 反馈。',
  'GA-611MLS-ST':
    'Long-distance finesse/plug：6ft11 solid tip 要在远投后仍保持 Shad、Minnow、Metal Vibration、worming 的操作感；导环针对 FC/PE 双线组，重点是投距、line mending 和远端 bite 判断。',
  'GA-70HS-ST':
    'Power Nose 吊るし：PE1.5-2.0 + 太 fluorocarbon leader 操作 Egu-Dama Type Level 时，导环要让 PE 与 leader 顺畅通过，并能承受重 cover 中挂线、中层诱鱼和强制拔鱼。',
  'GA-74ML+S':
    'Long-shooting shore spin：No Sinker、Neko、JHW、mid-strolling 与 shad/minnow/vibration 都以远投后可控为前提；导环重点是长距离 line mending、trace/range control 和小型 plug 振动反馈。',
};

const CATEGORY_META = {
  '54': {
    id: '54',
    model: 'Gladiator Maximum',
    model_cn: 'GLADIATOR MAXIMUM',
    type_tips: 'Fresh Water Bass Rod',
    series_positioning: 'Fresh Water / Bass',
    player_positioning: '淡水 Bass / 特化型技法竿',
    player_selling_points: '按單一技法強化的高階 Bass 竿系，適合精細、硬餌、強力 cover 與大餌等明確場景分工。',
  },
  '52': {
    id: '52',
    model: 'Gladiator Anti',
    model_cn: 'GLADIATOR ANTI',
    type_tips: 'Fresh Water Bass Rod',
    series_positioning: 'Fresh Water / Bass',
    player_positioning: '淡水 Bass / 泛用輔助型竿系',
    player_selling_points: '以易用和高守備範圍為核心，覆蓋岸釣與船釣常見 Bass 技法，適合按子型號細分用途。',
  },
};

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
    .replace(/[⁺＋]/g, '+')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureDirs() {
  for (const dir of [OUTPUT_DIR, CACHE_DIR, CATEGORY_CACHE_DIR, DETAIL_CACHE_DIR, IMAGE_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function fetchText(url, attempts = 3) {
  let lastError = null;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const response = await axios.get(url, HTTP_CONFIG);
      return response.data;
    } catch (error) {
      lastError = error;
      if (i < attempts) await sleep(i * 800);
    }
  }
  throw lastError;
}

async function fetchCached(url, cachePath) {
  if (fs.existsSync(cachePath)) return fs.readFileSync(cachePath, 'utf8');
  const html = await fetchText(url);
  fs.writeFileSync(cachePath, html);
  await sleep(300);
  return html;
}

function cacheNameFromUrl(url) {
  const parsed = new URL(url);
  const product = parsed.searchParams.get('product');
  if (product) return String(product).replace(/[^\w.-]+/g, '_');
  const cat = parsed.searchParams.get('cat');
  if (cat) return `cat_${cat}`;
  return 'raid';
}

function sanitizeFileName(value) {
  const base = normalizeText(value)
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[\\/*?:"<>|]/g, '_')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base || 'raid_rod';
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
    await sleep(250);
    return `${STATIC_IMAGE_BASE}/${path.basename(localPath)}`;
  } catch (_) {
    return '';
  }
}

function parseSpecs(nodes, $) {
  const specs = {};
  nodes.each((_, p) => {
    const text = normalizeText($(p).text());
    const m = text.match(/^([^:：]+)[:：]\s*(.+)$/);
    if (!m) return;
    specs[normalizeText(m[1]).replace(/\.$/, '')] = normalizeText(m[2]);
  });
  return specs;
}

function parseEntryCategories($) {
  const ids = [];
  $('.rods-list a[href*="?cat="]').each((_, a) => {
    const url = absoluteUrl($(a).attr('href'));
    const id = new URL(url).searchParams.get('cat');
    if (CATEGORY_META[id]) ids.push(id);
  });
  return [...new Set(ids)];
}

function extractCategoryDescription($) {
  const paragraphs = [];
  $('#gladiator-anti-des p').each((_, p) => {
    const text = normalizeText($(p).text());
    if (text) paragraphs.push(text);
  });
  return [...new Set(paragraphs)].join('\n\n');
}

function parseCategoryPage($, categoryId) {
  const meta = CATEGORY_META[categoryId];
  const variants = [];
  $('.sub-box .sub-title').each((_, titleNode) => {
    const subTitle = normalizeText($(titleNode).text());
    $(titleNode)
      .nextAll('ul.rods-sub')
      .first()
      .find('> li')
      .each((__, li) => {
        const a = $(li).find('a[href*="?product="]').first();
        const url = absoluteUrl(a.attr('href'));
        const title = normalizeText($(li).find('p.title').first().text());
        if (!url || !title) return;
        variants.push({
          url,
          category_id: categoryId,
          series_model: meta.model,
          model_group: subTitle,
          listing_title: title,
          listing_image_url: absoluteUrl($(li).find('p.img img').first().attr('src')),
          listing_specs: parseSpecs($(li).find('.text p'), $),
        });
      });
  });

  return {
    ...meta,
    source_url: `${BASE_URL}/?cat=${categoryId}`,
    main_image_url: absoluteUrl($('.rods-detail > .mainimg img, h1.mainimg img').first().attr('src')),
    description: extractCategoryDescription($),
    variants,
  };
}

function extractDetailDescription($) {
  const clone = $('.text-area.wp-post').first().clone();
  clone.find('.back, script, style').remove();
  const paragraphs = [];
  clone.find('p').each((_, p) => {
    const text = normalizeText($(p).text());
    if (text && text !== '戻る') paragraphs.push(text);
  });
  return paragraphs.join('\n\n') || normalizeText(clone.text());
}

function parseDetailPage($, source) {
  const title =
    normalizeText($('#breadcrumb strong').last().text()) ||
    normalizeText($('title').text()).replace(/\s*\|\s*RAID JAPAN\s*$/i, '') ||
    source.listing_title;
  const detailSpecs = parseSpecs($('.rods-detail .info p'), $);
  return {
    ...source,
    title,
    sku: normalizeSku(title),
    detail_image_url: absoluteUrl($('.rods-detail > .mainimg img, h1.mainimg img').first().attr('src')) || source.listing_image_url,
    specs: { ...source.listing_specs, ...detailSpecs },
    description: extractDetailDescription($),
  };
}

function normalizeSku(title) {
  return normalizeText(title)
    .replace(/\s*【\s*/g, ' 【')
    .replace(/\s*】\s*/g, '】')
    .trim();
}

function extractCodeName(sku) {
  const text = normalizeSku(sku);
  const match = text.match(/【([^】]+)】/);
  return match ? normalizeText(match[1]) : '';
}

function extractModelCode(sku) {
  return normalizeSku(sku).replace(/\s*【[^】]+】\s*$/, '').trim();
}

function normalizePower(raw, sku) {
  const skuText = normalizeText(sku).toUpperCase().replace(/[⁺＋]/g, '+');
  const skuPower = skuText.match(/(?:^|[-\d])(?:\d{2,4})?((?:XXH|XH|MH|ML|UL|XL|L|M|H)(?:\+)?)(?=[CS]|-|$)/);
  if (skuPower) return skuPower[1] === 'XL' ? 'XUL' : skuPower[1];

  const text = normalizeText(raw).toUpperCase();
  const replacements = [
    [/DOUBLE\s+EX(?:TRA)?\.?\s+HEAVY/, 'XXH'],
    [/EX(?:TRA)?\.?\s+HEAVY/, 'XH'],
    [/TORQUFULL\s+MEDIUM\s+HEAVY/, 'MH'],
    [/MEDIUM\s+HEAVY\s+PLUS/, 'MH+'],
    [/MEDIUM\s+HEAVY/, 'MH'],
    [/MEDIUM\s+LIGHT\s+PLUS/, 'ML+'],
    [/MEDIUM\s+LIGHT/, 'ML'],
    [/MEDIUM\s+PLUS/, 'M+'],
    [/ULTRA\s+LIGHT|URTLA\s+LIGHT/, 'UL'],
    [/EXTRA\s+LIGHT/, 'XUL'],
    [/LIGHT\s+PLUS/, 'L+'],
    [/HEAVY\s+PLUS/, 'H+'],
    [/HEAVY/, 'H'],
    [/LIGHT/, 'L'],
    [/MEDIUM/, 'M'],
  ];
  for (const [pattern, value] of replacements) {
    if (pattern.test(text)) return value;
  }
  return normalizeText(raw);
}

function inferType(sku, modelGroup) {
  const text = normalizeText(`${sku} ${modelGroup}`).toUpperCase();
  if (/SPINNING/.test(text)) return 'S';
  if (/BAIT/.test(text)) return 'C';
  const code = text.match(/^[A-Z]+[-\dA-Z+]*([CS])(?:-|【|\s|$)/);
  return code ? code[1] : '';
}

function normalizeLureOz(raw) {
  return normalizeText(raw)
    .replace(/Lure\s*Wt\.?\s*[:：]?/i, '')
    .replace(/MAX\s+/gi, 'MAX')
    .replace(/・/g, '.')
    .replace(/\s*-\s*/g, '-')
    .trim();
}

function inferLureWeightGram(specs, description) {
  const direct = normalizeText(specs['Lure Wt(g)'] || specs['Lure Wt (g)'] || specs['Lure Weight(g)'] || '');
  if (direct) return direct.replace(/Lure\s*Wt\.?\s*[:：]?/i, '').trim();

  const text = normalizeText(description);
  const range = text.match(/(\d+(?:\.\d+)?)\s*g\s*[~～-]\s*(\d+(?:\.\d+)?)\s*g/i);
  if (range) return `${range[1]}-${range[2]}g`;
  return '';
}

function inferAction(specs, sku, description) {
  if (specs.Taper) return specs.Taper;
  const text = normalizeText(`${sku} ${description}`);
  if (/レギュラーファストアクション|regular fast action/i.test(text)) return 'Regular Fast';
  if (/レギュラーテーパー/.test(text)) return 'Regular';
  if (/超エクストラファースト|extra-fast taper/i.test(text)) return 'Ex. Fast';
  if (/ファーストテーパー/.test(text)) return 'Fast';
  if (/スローテーパー/.test(text)) return 'Slow';
  if (/GA-74XHC|DIFFUSER/i.test(text) && /ブランクス全体に負荷を分散|force is distributed along the entire blank/i.test(text)) {
    return 'Regular Fast';
  }
  if (/GA-74ML\+S|NAVIGATOR/i.test(text) && /ややダル|若干張りを残したTIP/.test(text)) {
    return 'Regular Fast';
  }
  if (/GA-611MLS-ST|STRIDE/i.test(text) && /30tカーボンソリッドティップ|30t carbon solid tip/i.test(text)) {
    return 'Fast (30t Solid Tip)';
  }
  return '';
}

function splitLine(raw) {
  const text = normalizeText(raw).replace(/Line\s*[:：]?/i, '');
  if (!text) return { line: '', pe: '' };
  const peMatch = text.match(/PE\s*#?\s*[0-9.]+|MAX\s*PE\s*#?\s*[0-9.]+号?|PE\s*[0-9.]+号/i);
  const pe = peMatch ? normalizeText(peMatch[0]).replace(/\s+/g, '') : '';
  let line = text;
  if (peMatch) line = normalizeText(text.replace(peMatch[0], '').replace(/[()（）&]/g, ''));
  line = line.replace(/\(\s*&?\s*BRAID(?:ED|E)?\s*\)/i, '').replace(/&BRAID(?:ED|E)?/i, '').trim();
  if (/^MAX\s*PE/i.test(text) && !/lb/i.test(text)) line = '';
  return { line, pe };
}

function cleanPrice(raw) {
  return normalizeText(raw).replace(/Price\s*[:：]?/i, '');
}

function parseYenTaxOut(price) {
  const m = normalizeText(price).match(/¥\s*([0-9,]+)/);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

function priceSummary(variants) {
  const prices = variants.map((v) => parseYenTaxOut(v.fields['Market Reference Price'])).filter((v) => Number.isFinite(v));
  if (!prices.length) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const fmt = (v) => `¥${v.toLocaleString('en-US')}`;
  return min === max ? `${fmt(min)}（税抜）` : `${fmt(min)}-${fmt(max)}（税抜）`;
}

function loadWhitelistEvidence() {
  if (!fs.existsSync(WHITELIST_EVIDENCE_PATH)) return new Map();
  try {
    const payload = JSON.parse(fs.readFileSync(WHITELIST_EVIDENCE_PATH, 'utf8'));
    const records = Array.isArray(payload.records) ? payload.records : [];
    return new Map(records.map((record) => [extractModelCode(record.sku), record]));
  } catch (_) {
    return new Map();
  }
}

function usefulWhitelist(record) {
  const tackledb = record?.whitelist?.tackledb;
  return tackledb?.status === 'matched' && Number(tackledb.hit_count || 0) >= 3;
}

function whitelistHitCount(record) {
  return Number(record?.whitelist?.tackledb?.hit_count || 0);
}

function listText(values, limit = 3) {
  return (values || []).map(normalizeText).filter(Boolean).slice(0, limit).join(' / ');
}

function signalLabel(signal) {
  const value = normalizeText(signal);
  if (/big bait|swimbait/i.test(value)) return '大餌 / swimbait';
  if (/frog|topwater/i.test(value)) return 'Frog / topwater';
  if (/moving bait|hard bait/i.test(value)) return 'moving bait / hard bait';
  if (/worm|finesse/i.test(value)) return 'worm / finesse';
  return value;
}

function whitelistSignalText(record) {
  const signals = record?.summary?.positioning_signals || [];
  const labels = [];
  for (const signal of signals) {
    const label = signalLabel(signal);
    if (label && !labels.includes(label)) labels.push(label);
  }
  return labels.slice(0, 3).join(' / ');
}

function whitelistLineHint(record) {
  const out = [];
  for (const line of record?.summary?.sample_lines || []) {
    const text = normalizeText(line);
    const lb = text.match(/([0-9.]+)\s*lb/i);
    const peGou = /PE/i.test(text) ? text.match(/([0-9.]+)\s*号/) : null;
    const peHash = /PE/i.test(text) ? text.match(/PE\s*#?\s*([0-9.]+)/i) : null;
    if (peGou) out.push(`PE${peGou[1]}号`);
    else if (peHash) out.push(`PE${peHash[1]}号`);
    else if (lb) out.push(`${lb[1]}lb`);
    if (out.length >= 3) break;
  }
  return [...new Set(out)].slice(0, 3).join(' / ');
}

function enrichPlayerSellingPoints(base, positioning, record) {
  if (!usefulWhitelist(record)) return base;
  const signals = new Set(record.summary?.positioning_signals || []);
  if (/Frog/.test(positioning)) {
    return `${base} 白名单样本中 topwater、Frog 或羽根物使用信号较明显。`;
  }
  if (/大餌/.test(positioning) && signals.has('big bait / swimbait')) {
    return `${base} 白名单样本也支持 big bait / swimbait 和大体积 moving bait 场景。`;
  }
  if (signals.has('Frog / topwater')) {
    return `${base} 白名单样本中 topwater、Frog 或羽根物使用信号较明显。`;
  }
  if (signals.has('moving bait / hard bait') && signals.has('worm / finesse')) {
    return `${base} 白名单样本显示 moving bait 与 worm / jig 兼用，适合作为泛用或技法交叉型号理解。`;
  }
  if (signals.has('worm / finesse') && /精細|finesse/i.test(positioning)) {
    return `${base} 白名单样本以轻量软饵、虫系或细线精细玩法为主。`;
  }
  return base;
}

function enrichGuideUseHint(base, record) {
  if (!usefulWhitelist(record)) return base;
  const lineHint = whitelistLineHint(record);
  return lineHint ? `${base} 白名单线组样本: ${lineHint}。` : base;
}

function whitelistExtraSpec1(record) {
  if (!usefulWhitelist(record)) return '';
  const places = listText(record.summary?.places, 3);
  return `白名单样本: TackleDB ${whitelistHitCount(record)}件${places ? `; 场景: ${places}` : ''}`;
}

function whitelistExtraSpec2(record) {
  if (!usefulWhitelist(record)) return '';
  const signals = whitelistSignalText(record);
  const lures = listText(record.summary?.sample_lures, 2);
  return [signals ? `白名单路亚信号: ${signals}` : '', lures ? `样本路亚: ${lures}` : ''].filter(Boolean).join('; ');
}

function inferPlayerPositioning(type, sku, power, description) {
  const text = normalizeText(`${sku} ${power} ${description}`).toUpperCase();
  if (/FROG/.test(text)) return 'Frog / 強障礙';
  if (/MAXX\s*LT|THE MAXX LT|フィネスカバージグ/.test(text)) return 'Bait finesse / Cover finesse';
  if (/BF|BAIT FINESSE|POWER BAIT FINESSE|PBF|FINESSE/.test(text)) return type === 'S' ? '直柄精細' : 'Bait finesse / Cover finesse';
  if (/POWER NOSE|POWER FINESSE/.test(text) && type === 'S') return 'Power finesse / Cover finesse';
  if (/STRIDE|NAVIGATOR/.test(text) && type === 'S') return '遠投 / 直柄操作';
  if (/JOKER/.test(text)) return 'Bass 泛用 / 巻物';
  if (/ENGRAVE/.test(text)) return '巻物 / Hard bait';
  if (/MAXX CHANGER/.test(text) && /バーサタイル|UTILITY|ユーティリティ|幅広く対応/.test(text)) {
    return type === 'S' ? '直柄精細泛用' : 'Bass 泛用 / 打撃';
  }
  if (/UNDERTAKER|DIFFUSER|MAXX JACK|BIG\s*BAIT|BIGBAIT|ビッグベイト|SWIMBAIT|スイムベイト|MAX\s*5OZ|5OZ|MAX\s*2OZ|2OZ/.test(text)) return '大餌 / 強力';
  if (/KING HEAVY|BALTORO|POWER THE MAXX|XH|XXH|H\+|HEAVY PLUS/.test(text)) return 'Bass 強力泛用';
  if (/JERK|HARD\s*BAIT|PLUG|CRANK|VIBRATION|WIRE\s*BAIT|SPINNER|巻|ハードベイト|JOKER/.test(text)) return '巻物 / Hard bait';
  if (type === 'S') return /UL|XUL|L|ML/.test(power) ? '直柄精細泛用' : '直柄泛用';
  return /ML|M/.test(power) ? 'Bass 泛用 / 打撃' : 'Bass 強力泛用';
}

function inferPlayerSellingPoints(positioning) {
  if (/Frog/.test(positioning)) return '浮草、蓮葉和重 cover 場景取向明確，也能兼顧重型 topwater / moving bait 的竿身操作與近距離控魚。';
  if (/Power finesse/.test(positioning)) return 'PE 線、吊るし和 cover 內精細操作取向清楚，適合用直柄完成強障礙中的細膩誘魚與控魚。';
  if (/Bait finesse/.test(positioning)) return '近距離打撃、輕量 rig 和 cover 周邊操作取向明確，適合用槍柄完成精準投放、細膩誘魚與即時控魚。';
  if (/遠投/.test(positioning)) return '遠投後仍重視細膩控線與竿尖判斷，適合大水面、河川和遠距離 light rig / plug 操作。';
  if (/finesse|精細/i.test(positioning)) return '輕量釣組、定點操作和細線小餌更好掌控，適合需要竿尖判斷與精準投放的 Bass 場景。';
  if (/泛用 \/ 巻物/.test(positioning)) return '以中輕量 moving bait 節奏控制為核心，也能兼顧同重量級軟餌打撃，適合作為 Bass 泛用搜索竿。';
  if (/巻物|Hard bait/.test(positioning)) return '硬餌搜索和節奏控制取向清楚，jerkbait、crank、vibration、wire bait 等移動餌更容易穩定操作。';
  if (/大餌/.test(positioning)) return '高負荷路亞、粗線和強障礙控魚更有餘量，適合大餌、重 cover 或需要強制主導權的場景。';
  if (/強力泛用/.test(positioning)) return '中重量級路亞、粗線和 cover 周邊更有餘量，適合強力打撃、moving bait 和泛用 power game。';
  return 'Bass 泛用覆蓋較廣，軟餌打撃、硬餌搜索和岸釣/船釣常見情境都容易搭配。';
}

function inferGuideLayout(seriesModel, categoryDescription) {
  const text = normalizeText(`${seriesModel} ${categoryDescription}`);
  if (/stainless-steel guides \(top guide is titanium frame\)|ステンレス.*TOP.*チタン/i.test(text)) {
    return 'ステンレスフレームガイド + チタンフレームトップ：コストと実用性能のバランスを重視した導環構成';
  }
  return '';
}

function inferGuideUseHint(positioning) {
  if (/Frog/.test(positioning)) return 'Frog / 強障礙：太めのラインでも出線が安定し、近距離の強いフッキングと cover からの主導権を取りやすい。';
  if (/Power finesse/.test(positioning)) return 'Power finesse：PE 線と太めリーダーの出線が安定し、吊るしや cover 內の細かい誘いから主導権を取りやすい。';
  if (/Bait finesse/.test(positioning)) return 'Bait finesse：軽量リグの低弾道キャストと cover 周りのライン処理がしやすく、近距離で掛けた後も主導権を取りやすい。';
  if (/遠投/.test(positioning)) return '遠投直柄：長い距離でもラインメンディングしやすく、light rig / plug の操作とバイト判断を保ちやすい。';
  if (/泛用 \/ 巻物/.test(positioning)) return 'Bass 泛用巻物：moving bait の一定巻きと同重量級ワーミングを切り替えやすく、キャスト精度とライン処理を両立しやすい。';
  if (/巻物|Hard bait/.test(positioning)) return 'Bass 巻物：出線が安定し、jerkbait、crank、vibration を一定テンポで操作する時のライン処理がしやすい。';
  if (/finesse|精細/i.test(positioning)) return 'Bass 精細：細線小餌の出線が滑らかで、竿先信号、短いバイト、PE 精細操作を判断しやすい。';
  if (/大餌/.test(positioning)) return 'Bass 大餌：太めのラインと高負荷ルアーの出線が安定し、big bait や swimbait の拋投と控魚に余裕を持たせやすい。';
  if (/強力泛用/.test(positioning)) return 'Bass 強力泛用：太めのラインと中重量級ルアーの出線が安定し、cover 周りの打撃と moving bait を切り替えやすい。';
  return 'Bass 泛用：出線順暢、兼容多種線徑，軟餌、硬餌和搜索場景切換更自然。';
}

function inferRecommendedRigPairing(sku) {
  const modelCode = extractModelCode(sku);
  const record = RECOMMENDED_RIG_PAIRING_BY_CODE[modelCode];
  if (record) return record.value;
  return '';
}

function inferModelGuideUseHint(sku) {
  return GUIDE_USE_HINT_BY_CODE[extractModelCode(sku)] || '';
}

const SOFT_RIG_LABELS = new Set([
  'Light Texas Rig',
  'Heavy Texas Rig',
  'Texas Rig',
  'Free Rig',
  'Neko Rig',
  'Heavy Neko Rig',
  'Down Shot',
  'Leaderless Down Shot',
  'Heavy Down Shot',
  'No Sinker',
  'Backslide No Sinker',
  'Small Rubber Jig',
  'Rubber Jig',
  'Finesse Cover Jig',
  'Jighead Rig',
  'Jighead Wacky',
  'Mid Strolling Jighead',
  'Power Mid Strolling Jighead',
  'Hover Strolling',
  'Surface Twitch Rig',
  'Hanging Rubber Jig',
  'Power Finesse Jig',
  'Cover Suspended Rig',
  'Surface Worming',
  'Shad Tail Worm',
  'Sinker Rig',
]);

const HARD_RIG_LABELS = new Set([
  'Small Plug',
  'Small Topwater Plug',
  'Topwater Plug',
  'Crawler Bait',
  'Big Plug',
  'S-shaped Bait',
  'Jerkbait',
  'Minnow',
  'Shad',
  'Crankbait',
  'Deep Crankbait',
  'Vibration',
  'Metal Vibration',
  'Spinnerbait',
  'Buzzbait',
  'Chatterbait',
  'Swim Jig',
  'Swimming Jig',
  'Swimbait',
  'Big Bait',
  'Frog',
  'Pencil Bait',
  'Popper',
  'I-shaped Plug',
  'Bug Lure',
  'Alabama Rig',
]);

function splitRigPairing(pairing) {
  return normalizeText(pairing)
    .split('/')
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function alignGuideUseHintWithRigPairing(base, pairing) {
  const items = splitRigPairing(pairing);
  const hasSoft = items.some((item) => SOFT_RIG_LABELS.has(item));
  const hasHard = items.some((item) => HARD_RIG_LABELS.has(item));
  if (!hasSoft || !hasHard) return base;
  if (/切|兼容|泛用|両立|兼顧|moving bait|worming|plug/i.test(base)) return base;
  return `${base} 软硬饵混合搭配时，重点是稳定出线并在 cover 打撃、软饵控底和移动饵搜索之间顺畅切换。`;
}

function mapVariantFields(variant, category, whitelistEvidence) {
  const specs = variant.specs || {};
  const type = inferType(variant.sku, variant.model_group);
  const power = normalizePower(specs['Power(Action)'], variant.sku);
  const line = splitLine(specs.Line || '');
  const positioning = inferPlayerPositioning(type, variant.sku, power, variant.description);
  const whitelist = whitelistEvidence.get(extractModelCode(variant.sku));
  const sellingPoints = inferPlayerSellingPoints(positioning);
  const guideUseHint = inferModelGuideUseHint(variant.sku) || inferGuideUseHint(positioning);
  const recommendedRigPairing = inferRecommendedRigPairing(variant.sku);
  return {
    TYPE: type,
    SKU: extractModelCode(variant.sku),
    POWER: power,
    'TOTAL LENGTH': specs.Length || '',
    Action: inferAction(specs, variant.sku, variant.description),
    'LURE WEIGHT': inferLureWeightGram(specs, variant.description),
    'LURE WEIGHT (oz)': normalizeLureOz(specs['Lure Wt'] || specs['Lure Wt.'] || ''),
    'Line Wt N F': line.line,
    'PE Line Size': line.pe,
    'Market Reference Price': cleanPrice(specs.Price || ''),
    'Code Name': extractCodeName(variant.sku),
    official_environment: 'Fresh Water / Bass',
    player_environment: '淡水 / Bass',
    player_positioning: positioning,
    player_selling_points: enrichPlayerSellingPoints(sellingPoints, positioning, whitelist),
    guide_layout_type: inferGuideLayout(category.model, category.description),
    guide_use_hint: alignGuideUseHintWithRigPairing(guideUseHint, recommendedRigPairing),
    recommended_rig_pairing: recommendedRigPairing,
    Description: variant.description,
    'Extra Spec 1': whitelistExtraSpec1(whitelist),
    'Extra Spec 2': whitelistExtraSpec2(whitelist),
  };
}

function rowFromHeaders(headers, values) {
  return headers.map((header) => values[header] ?? '');
}

async function collectNormalized() {
  ensureDirs();
  const entryHtml = await fetchCached(ENTRY_URL, path.join(CACHE_DIR, 'rods_entry.html'));
  const entry$ = cheerio.load(entryHtml);
  const categoryIds = parseEntryCategories(entry$);
  const categories = [];

  for (const categoryId of categoryIds) {
    const categoryUrl = `${BASE_URL}/?cat=${categoryId}`;
    const categoryHtml = await fetchCached(categoryUrl, path.join(CATEGORY_CACHE_DIR, `${categoryId}.html`));
    const category$ = cheerio.load(categoryHtml);
    const category = parseCategoryPage(category$, categoryId);
    const detailedVariants = [];
    for (const variant of category.variants) {
      const detailHtml = await fetchCached(variant.url, path.join(DETAIL_CACHE_DIR, `${cacheNameFromUrl(variant.url)}.html`));
      const detail$ = cheerio.load(detailHtml);
      detailedVariants.push(parseDetailPage(detail$, variant));
    }
    categories.push({
      ...category,
      variants: detailedVariants,
    });
  }

  return categories;
}

async function buildWorkbook(normalized) {
  const rodRows = [];
  const detailRows = [];
  const rigPairingRows = [];
  const whitelistEvidence = loadWhitelistEvidence();
  let detailIndex = 10000;

  for (let i = 0; i < normalized.length; i += 1) {
    const category = normalized[i];
    const rodId = `${ROD_PREFIX}${1000 + i}`;
    const variants = category.variants.map((variant) => ({
      ...variant,
      fields: mapVariantFields(variant, category, whitelistEvidence),
    }));
    const imageUrl = await downloadImage(category.main_image_url, `${rodId}_${sanitizeFileName(category.model)}`);

    rodRows.push(
      rowFromHeaders(HEADERS.rodMaster, {
        id: rodId,
        brand_id: BRAND_ID,
        model: category.model,
        model_cn: category.model_cn,
        alias: category.model,
        type_tips: category.type_tips,
        images: imageUrl,
        series_positioning: category.series_positioning,
        main_selling_points: normalizeText(category.description.split('\n')[0]).slice(0, 260),
        official_reference_price: priceSummary(variants),
        market_status: '官网展示',
        Description: category.description,
        player_positioning: category.player_positioning,
        player_selling_points: category.player_selling_points,
      }),
    );

    for (const variant of variants) {
      const detailId = `${ROD_DETAIL_PREFIX}${detailIndex}`;
      const modelCode = extractModelCode(variant.sku);
      const rigPairing = RECOMMENDED_RIG_PAIRING_BY_CODE[modelCode] || {};
      detailRows.push(
        rowFromHeaders(HEADERS.rodDetail, {
          id: detailId,
          rod_id: rodId,
          ...variant.fields,
        }),
      );
      rigPairingRows.push({
        id: detailId,
        rod_id: rodId,
        sku: modelCode,
        code_name: extractCodeName(variant.sku),
        recommended_rig_pairing: variant.fields.recommended_rig_pairing,
        source: rigPairing.source || 'missing',
        evidence: rigPairing.evidence || '',
        official_url: variant.url,
      });
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

  const sourceCounts = rigPairingRows.reduce((acc, row) => {
    acc[row.source] = (acc[row.source] || 0) + 1;
    return acc;
  }, {});
  fs.writeFileSync(
    RIG_PAIRING_REPORT_PATH,
    `${JSON.stringify(
      {
        field: 'recommended_rig_pairing',
        xlsx_file: OUTPUT_FILE,
        source_policy: {
          official_description: 'Directly matched official Raid Japan model Description rig/lure wording.',
          official_plus_whitelist: 'Official wording gives the use lane; TackleDB exact-SKU samples help split concrete lure/rig types.',
          official_plus_conservative: 'Official wording gives the use lane but not every rig name; conservative Bass rig names are inferred from SKU/spec/player context without adding Big Bait from power alone.',
        },
        coverage: `${rigPairingRows.filter((row) => row.recommended_rig_pairing).length}/${rigPairingRows.length}`,
        source_counts: sourceCounts,
        rows: rigPairingRows,
      },
      null,
      2,
    )}\n`,
  );

  return { masters: rodRows.length, details: detailRows.length };
}

async function main() {
  const normalized = await collectNormalized();
  fs.writeFileSync(NORMALIZED_PATH, `${JSON.stringify(normalized, null, 2)}\n`);
  const counts = await buildWorkbook(normalized);
  console.log(
    JSON.stringify(
      {
        ...counts,
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
