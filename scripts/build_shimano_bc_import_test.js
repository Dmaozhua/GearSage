const fs = require('fs');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = '/Users/tommy/GearSage';
const SOURCE_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import.xlsx');
const OUTPUT_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import_test.xlsx');

const SOURCE_TEST_REEL_IDS = ['SRE5058', 'SRE5025', 'SRE5026', 'SRE5054', 'SRE5028', 'SRE5033', 'SRE5004', 'SRE5002'];
const TEST_REEL_IDS = [
  'SRE5058_70',
  'SRE5058_150',
  'SRE5025',
  'SRE5026',
  'SRE5054_200',
  'SRE5054_300',
  'SRE5028',
  'SRE5033',
  'SRE5004',
  'SRE5002',
];
const MASTER_SHEET = 'reel';
const DETAIL_SHEET = 'baitcasting_reel_detail';
const HIGHLIGHT_HELPER = path.join(REPO_ROOT, 'scripts/patch_xlsx_highlights.py');

const PAGE_SPLIT_RULES = {
  SRE5058: [
    {
      new_id: 'SRE5058_70',
      model: 'SLX',
      alias: '24 SLX 70',
      image:
        'https://dassets2.shimano.com/content/dam/Shimanofish/Common/Productsrelated/cg2SHIFGlobalREEL/cg3SHIFGlobalREELBaitReel/SICPlanningProducts/Product/PRD_a075F000042PnchQAC_main.jpg/jcr:content/renditions/cq5dam.web.481.481.jpeg',
      search_terms: ['24SLX 70', 'SLX 70', 'SLX'],
      description:
        '70线杯的容线量搭配32mm的线杯直径，低弹道抛投轻量假饵的能力，这也是旧款SLX MGL被大家喜欢的原因。NEW SLX搭载了第三代MGL线杯，带来了更低惯性化，低弹道性和抛投稳定性再次提升，SVS INFINITY刹车则让你能调整到适合的刹车力。新搭载的SILENTTUNE也提升了抛投手感，搭配HAGANE机身和高耐久的碳纤维十字纹垫片，就算突然中大鱼也能立刻应战。',
      sku_prefixes: ['SLX 70', 'SLX 71'],
    },
    {
      new_id: 'SRE5058_150',
      model: 'SLX XT',
      alias: '24 SLX XT 150',
      image:
        'https://dassets2.shimano.com/content/dam/Shimanofish/Common/Productsrelated/cg2SHIFGlobalREEL/cg3SHIFGlobalREELBaitReel/SICPlanningProducts/Product/PRD_a075F00003c623mQAA_main.jpg/jcr:content/renditions/cq5dam.web.481.481.jpeg',
      search_terms: ['24SLX 150', 'SLX 150', 'SLX'],
      description:
        'SLX搭载SILENTTUNE后升级，更顺滑的收线手感，HAGANE机身则确保了机身强度，非常高性价比的一款产品。',
      sku_prefixes: ['SLX 150', 'SLX 151'],
      sku_replacements: [
        ['SLX 150', 'SLX XT 150'],
        ['SLX 151', 'SLX XT 151'],
      ],
    },
  ],
  SRE5054: [
    {
      new_id: 'SRE5054_200',
      model: 'CURADO',
      alias: '22 CURADO 200',
      image:
        'https://dassets2.shimano.com/content/dam/Shimanofish/Common/Productsrelated/cg2SHIFGlobalREEL/cg3SHIFGlobalREELBaitReel/SICPlanningProducts/Product/PRD_a075F00003rGoSwQAK_main.jpg/jcr:content/renditions/cq5dam.web.481.481.jpeg',
      search_terms: ['22 CURADO 200', 'CURADO 200', 'CURADO'],
      description:
        '搭载第三代MGL线杯后，CURADO朝着更远的抛投距离前进，加持MICROMODULE GEAR和SILENTTUNE技术后，手感也有所提升，适合大饵的200型也是你攻略巨物的好伙伴。',
      sku_prefixes: ['CURADO 200', 'CURADO 201'],
    },
    {
      new_id: 'SRE5054_300',
      model: 'CURADO',
      alias: '22 CURADO 300',
      image:
        'https://dassets2.shimano.com/content/dam/Shimanofish/Common/Productsrelated/cg2SHIFGlobalREEL/cg3SHIFGlobalREELBaitReel/SICPlanningProducts/Product/PRD_a075F00003HW4bGQAT_main.jpg/jcr:content/renditions/cq5dam.web.481.481.jpeg',
      search_terms: ['22 CURADO 300', 'CURADO 300', 'CURADO'],
      description: '汇聚SHIMANO高端技术的CURADO推出300规格。',
      sku_prefixes: ['CURADO 300', 'CURADO 301'],
    },
  ],
};

const MASTER_EXTRA_HEADERS = [
  'market_reference_price',
  'player_positioning',
  'player_selling_points',
];

const DETAIL_EXTRA_HEADERS = [
  'variant_description',
  'Description',
  'EV_link',
  'Specs_link',
  'drag_click',
  'handle_knob_material',
  'handle_hole_spec',
  'body_material_tech',
  'main_gear_material',
  'main_gear_size',
  'minor_gear_material',
  'player_environment',
  'is_handle_double',
];

const SUBVARIANT_SENSITIVE_FIELDS = new Set([
  'spool_weight_g',
  'spool_axis_type',
  'spool_diameter_mm',
  'spool_width_mm',
  'handle_hole_spec',
  'handle_knob_exchange_size',
  'custom_spool_compatibility',
  'custom_knob_compatibility',
  'main_gear_size',
]);

const YELLOW_FILL = {
  patternType: 'solid',
  fgColor: { rgb: 'FFF59D' },
  bgColor: { rgb: 'FFF59D' },
};

const FORCE_WRITE_DETAIL_KEYS = [
  'EV_link',
  'Specs_link',
  'usage_environment',
  'drag_click',
  'knob_size',
  'handle_style',
  'handle_hole_spec',
  'handle_knob_exchange_size',
  'handle_knob_type',
  'handle_knob_material',
  'knob_bearing_spec',
  'custom_spool_compatibility',
  'custom_knob_compatibility',
];

const enrichment = {
  SRE5058_70: {
    master: {
      model_year: { value: '2024', source: 'whitelist' },
      alias: { value: '24 SLX 70', source: 'whitelist' },
      series_positioning: { value: '泛用入门', source: 'whitelist' },
      main_selling_points: { value: 'MGL III / 紧凑机身 / 入门泛用', source: 'whitelist' },
      player_positioning: { value: '泛用入门水滴轮', source: 'whitelist' },
      player_selling_points: { value: '性价比高 / MGL III / 泛用覆盖', source: 'whitelist' },
    },
    detail: {
      handle_style: { value: '单摇臂', source: 'whitelist' },
      handle_hole_spec: { value: 'M7', source: 'whitelist' },
      knob_bearing_spec: { value: 'SHG-740ZZ / HRCB-740ZHi', source: 'whitelist' },
      custom_knob_compatibility: { value: '24 SLX Custom Handle Knob / Handle Knob Bearing upgrade', source: 'whitelist' },
      usage_environment: { value: '淡水泛用', source: 'whitelist' },
      player_environment: { value: '淡水泛用', source: 'whitelist' },
    },
  },
  SRE5058_150: {
    master: {
      model_year: { value: '2024', source: 'whitelist' },
      alias: { value: '24 SLX 150', source: 'whitelist' },
      series_positioning: { value: '泛用入门', source: 'whitelist' },
      main_selling_points: { value: 'HAGANE机身 / SILENTTUNE / 高性价比', source: 'whitelist' },
      player_positioning: { value: '泛用入门水滴轮', source: 'whitelist' },
      player_selling_points: { value: '入门友好 / 更强容线量 / 泛用覆盖', source: 'whitelist' },
    },
    detail: {
      handle_style: { value: '单摇臂', source: 'whitelist' },
      handle_hole_spec: { value: 'M7', source: 'whitelist' },
      knob_bearing_spec: { value: 'SHG-740ZZ / HRCB-740ZHi', source: 'whitelist' },
      custom_knob_compatibility: { value: '24 SLX Custom Handle Knob / Handle Knob Bearing upgrade', source: 'whitelist' },
      usage_environment: { value: '淡水泛用', source: 'whitelist' },
      player_environment: { value: '淡水泛用', source: 'whitelist' },
    },
  },
  SRE5025: {
    master: {
      model_cn: { value: '阿德巴兰 BFS', source: 'whitelist' },
      model_year: { value: '2022', source: 'whitelist' },
      alias: { value: '22 Aldebaran BFS', source: 'whitelist' },
      market_reference_price: { value: '49900JPY', source: 'whitelist' },
      series_positioning: { value: '极致BFS', source: 'whitelist' },
      main_selling_points: { value: 'FTB / 超轻量线杯 / 轻饵特化', source: 'whitelist' },
      player_positioning: { value: 'BFS轻饵特化旗舰', source: 'whitelist' },
      player_selling_points: { value: '超轻线杯 / FTB / 轻饵上限高', source: 'whitelist' },
    },
    detail: {
      handle_style: { value: '单摇臂', source: 'whitelist' },
      drag_click: { value: '1', source: 'whitelist' },
      spool_weight_g: { value: '6.7', source: 'whitelist', apply_scope: 'shared_variants' },
      handle_hole_spec: { value: 'M7', source: 'whitelist' },
      knob_size: { value: 'S size / lightweight slim knob', source: 'whitelist' },
      handle_knob_exchange_size: { value: 'HKC-23VAN / 轻量握丸规格', source: 'whitelist' },
      handle_knob_type: { value: 'lightweight slim knob', source: 'whitelist' },
      knob_bearing_spec: { value: '4x7x2.5（stock）', source: 'whitelist' },
      custom_spool_compatibility: { value: 'Genuine Spool 22 ALDEBARAN BFS / Avail Microcast Spool 22ALD22R', source: 'whitelist' },
      custom_knob_compatibility: { value: 'Handle Knob Cap Set S size / Custom Handle Knob', source: 'whitelist' },
      body_material: { value: 'Magnesium', source: 'whitelist' },
      body_material_tech: { value: 'HAGANE 机身', source: 'whitelist' },
      usage_environment: { value: '溪流 / 轻盐近岸', source: 'whitelist' },
      player_environment: { value: 'BFS / 溪流 / 轻盐', source: 'whitelist' },
    },
  },
  SRE5026: {
    master: {
      model_cn: { value: '阿德巴兰 MGL', source: 'whitelist' },
      model_year: { value: '2018', source: 'whitelist' },
      alias: { value: '18 Aldebaran MGL', source: 'whitelist' },
      market_reference_price: { value: '49500JPY', source: 'whitelist' },
      series_positioning: { value: '轻量泛用技巧', source: 'whitelist' },
      main_selling_points: { value: '浅溝轻量线杯 / 轻饵泛用 / 低姿态机身', source: 'whitelist' },
      player_positioning: { value: '轻量技巧泛用', source: 'whitelist' },
      player_selling_points: { value: '低姿态轻量 / MGL线杯 / 技巧泛用', source: 'whitelist' },
    },
    detail: {
      handle_style: { value: '单摇臂', source: 'whitelist' },
      spool_weight_g: { value: '10.5', source: 'whitelist', apply_scope: 'shared_variants' },
      handle_hole_spec: { value: 'M7', source: 'whitelist' },
      knob_size: { value: 'S size / lightweight slim knob', source: 'whitelist' },
      handle_knob_exchange_size: { value: 'S size / lightweight slim knob', source: 'whitelist' },
      handle_knob_type: { value: 'lightweight slim knob', source: 'whitelist' },
      knob_bearing_spec: { value: '4x7x2.5（stock）', source: 'whitelist' },
      custom_spool_compatibility: { value: 'Genuine Spool 18 ALDEBARAN MGL', source: 'whitelist' },
      custom_knob_compatibility: { value: 'Handle Knob Cap Set S size / Custom Handle Knob', source: 'whitelist' },
      body_material: { value: 'Magnesium', source: 'whitelist' },
      body_material_tech: { value: 'HAGANE 机身', source: 'whitelist' },
      usage_environment: { value: '淡水技巧', source: 'whitelist' },
      player_environment: { value: '轻量泛用 / 技巧', source: 'whitelist' },
    },
  },
  SRE5002: {
    master: {
      model_year: { value: '2022', source: 'whitelist' },
      alias: { value: '22 Exsence DC', source: 'whitelist' },
      market_reference_price: { value: '83400JPY', source: 'whitelist' },
      series_positioning: { value: '海鲈远投特化', source: 'whitelist' },
      main_selling_points: { value: '4x8 DC Exsence Tune / 海鲈远投 / PE 线路亚', source: 'whitelist' },
      player_positioning: { value: '海鲈DC远投特化', source: 'whitelist' },
      player_selling_points: { value: '海鲈PE适配 / DC调校 / 远投性能', source: 'whitelist' },
    },
    detail: {
      handle_style: { value: '单摇臂', source: 'whitelist' },
      drag_click: { value: '1', source: 'whitelist' },
      official_environment: { value: '海水路亚', source: 'official' },
      usage_environment: { value: '海鲈近岸 / 港湾', source: 'whitelist' },
      fit_style_tags: { value: '海水近岸 / 远投 / 快收方向', source: 'official' },
      is_sw_edition: { value: '是', source: 'official' },
      handle_hole_spec: { value: 'M7', source: 'whitelist' },
      knob_bearing_spec: { value: '4x7x2.5（stock）', source: 'whitelist' },
      custom_spool_compatibility: { value: 'Genuine Spool 22 EXSENCE DC', source: 'whitelist' },
      handle_knob_type: { value: 'EVA', source: 'whitelist' },
      handle_knob_material: { value: 'EVA', source: 'whitelist' },
      body_material: { value: 'Aluminum alloy', source: 'whitelist' },
      body_material_tech: { value: 'HAGANE 机身', source: 'whitelist' },
      player_environment: { value: '海鲈', source: 'whitelist' },
    },
  },
  SRE5004: {
    master: {
      model_cn: { value: '安塔列斯 DC MD', source: 'whitelist' },
      model_year: { value: '2023', source: 'whitelist' },
      alias: { value: '23 Antares DC MD', source: 'whitelist' },
      market_reference_price: { value: '62000JPY', source: 'whitelist' },
      series_positioning: { value: '巨物旗舰', source: 'whitelist' },
      main_selling_points: { value: 'MGL III / 4x8 DC MD Tune / 巨物强化', source: 'whitelist' },
      player_positioning: { value: '巨物远投旗舰', source: 'whitelist' },
      player_selling_points: { value: '4x8 DC MD Tune / 巨物向 / 宽线杯', source: 'whitelist' },
    },
    detail: {
      handle_style: { value: '单摇臂', source: 'whitelist' },
      handle_hole_spec: { value: 'M7', source: 'whitelist' },
      knob_bearing_spec: { value: '4x7x2.5（stock）', source: 'whitelist' },
      custom_spool_compatibility: { value: 'Genuine Spool 23 ANTARES DC MD', source: 'whitelist' },
      body_material: { value: 'Magnesium', source: 'whitelist' },
      body_material_tech: { value: 'HAGANE 机身', source: 'whitelist' },
      main_gear_material: { value: 'Brass', source: 'whitelist' },
      usage_environment: { value: '重饵 / 巨物', source: 'whitelist' },
      player_environment: { value: '重饵 / 巨物', source: 'whitelist' },
    },
  },
  SRE5028: {
    master: {
      model_year: { value: '2020', source: 'whitelist' },
      alias: { value: '20 Metanium', source: 'whitelist' },
      market_reference_price: { value: '48200JPY', source: 'whitelist' },
      series_positioning: { value: '泛用技巧', source: 'whitelist' },
      main_selling_points: { value: 'CORESOLID / MGL III / 轻量泛用', source: 'whitelist' },
      player_positioning: { value: '轻量泛用旗舰', source: 'whitelist' },
      player_selling_points: { value: 'CORESOLID / 轻量机身 / 泛用上限高', source: 'whitelist' },
    },
    detail: {
      handle_style: { value: '单摇臂', source: 'whitelist' },
      drag_click: { value: '0', source: 'manual_confirmed' },
      spool_weight_g: { value: '11.32', source: 'whitelist' },
      handle_hole_spec: { value: 'M7', source: 'whitelist' },
      handle_knob_exchange_size: { value: 'HKC-20MT', source: 'whitelist' },
      knob_bearing_spec: { value: '4x7x2.5（stock）', source: 'whitelist' },
      custom_spool_compatibility: { value: 'Genuine Spool 20 Metanium / 22 Metanium SHALLOW EDITION / Avail Microcast Spool 20MT24R, 20MT42R', source: 'whitelist' },
      custom_knob_compatibility: { value: 'Handle Knob Cap HKC-20MT / Custom Handle Knob', source: 'whitelist' },
      body_material: { value: 'Magnesium', source: 'whitelist' },
      body_material_tech: { value: 'CORESOLID BODY / 一体成型', source: 'whitelist' },
      main_gear_material: { value: 'Brass', source: 'official' },
      usage_environment: { value: '淡水泛用', source: 'whitelist' },
      player_environment: { value: '淡水泛用 / 技巧', source: 'whitelist' },
    },
  },
  SRE5033: {
    master: {
      model_cn: { value: '班塔姆', source: 'whitelist' },
      model_year: { value: '2022', source: 'whitelist' },
      alias: { value: '22 Bantam', source: 'whitelist' },
      market_reference_price: { value: '42600JPY', source: 'whitelist' },
      series_positioning: { value: '强力泛用', source: 'whitelist' },
      main_selling_points: { value: '35mm线杯 / CORESOLID / 黄铜齿轮', source: 'whitelist' },
      player_positioning: { value: '刚性强力泛用', source: 'whitelist' },
      player_selling_points: { value: '高刚性机身 / 黄铜主齿 / 卷感扎实', source: 'whitelist' },
    },
    detail: {
      handle_style: { value: '单摇臂', source: 'whitelist' },
      spool_weight_g: { value: '12.09', source: 'whitelist', apply_scope: 'shared_variants' },
      handle_hole_spec: { value: 'M7', source: 'whitelist' },
      knob_bearing_spec: { value: 'SHG-740ZZ / HRCB-740ZHi', source: 'whitelist' },
      custom_spool_compatibility: { value: 'Genuine Spool 22 Bantam', source: 'whitelist' },
      custom_knob_compatibility: { value: 'Handle Knob Bearing upgrade (+2BB)', source: 'whitelist' },
      body_material: { value: 'Aluminum alloy', source: 'whitelist' },
      body_material_tech: { value: 'CORE SOLID / HAGANE 机身', source: 'whitelist' },
      main_gear_material: { value: 'Brass', source: 'whitelist' },
      usage_environment: { value: '淡水强力泛用', source: 'whitelist' },
      player_environment: { value: '强力泛用', source: 'whitelist' },
    },
  },
  SRE5054_200: {
    master: {
      model_cn: { value: '库拉多', source: 'whitelist' },
      model_year: { value: '2022', source: 'whitelist' },
      alias: { value: '22 CURADO 200', source: 'whitelist' },
      market_reference_price: { value: '33300JPY', source: 'whitelist' },
      series_positioning: { value: '重饵泛用', source: 'whitelist' },
      main_selling_points: { value: 'MGL III线杯 / MICROMODULE GEAR / SILENTTUNE', source: 'whitelist' },
      player_positioning: { value: '重饵泛用', source: 'whitelist' },
      player_selling_points: { value: '200尺寸 / 卷感顺滑 / 重饵覆盖', source: 'whitelist' },
    },
    detail: {
      handle_style: { value: '单摇臂', source: 'whitelist' },
      handle_hole_spec: { value: 'M7', source: 'whitelist' },
      knob_bearing_spec: { value: 'SHG-740ZZ / HRCB-740ZHi', source: 'whitelist' },
      custom_knob_compatibility: { value: 'Handle Knob Bearing upgrade (+4BB)', source: 'whitelist' },
      handle_knob_type: { value: 'Paddle', source: 'whitelist' },
      body_material: { value: 'Aluminum alloy', source: 'whitelist' },
      body_material_tech: { value: 'HAGANE 机身', source: 'whitelist' },
      main_gear_material: { value: 'Brass', source: 'whitelist' },
      usage_environment: { value: '淡水重饵', source: 'whitelist' },
      player_environment: { value: '重饵 / 泛用', source: 'whitelist' },
    },
  },
  SRE5054_300: {
    master: {
      model_cn: { value: '库拉多', source: 'whitelist' },
      model_year: { value: '2022', source: 'whitelist' },
      alias: { value: '22 CURADO 300', source: 'whitelist' },
      market_reference_price: { value: '33300JPY', source: 'whitelist' },
      series_positioning: { value: '巨物泛用', source: 'whitelist' },
      main_selling_points: { value: '300尺寸 / 巨物覆盖 / 高端技术下放', source: 'whitelist' },
      player_positioning: { value: '重饵巨物泛用', source: 'whitelist' },
      player_selling_points: { value: '300尺寸 / 巨物覆盖 / 容线量更大', source: 'whitelist' },
    },
    detail: {
      handle_style: { value: '单摇臂', source: 'whitelist' },
      handle_hole_spec: { value: 'M7', source: 'whitelist' },
      knob_bearing_spec: { value: 'SHG-740ZZ / HRCB-740ZHi', source: 'whitelist' },
      custom_knob_compatibility: { value: 'Handle Knob Bearing upgrade (+4BB)', source: 'whitelist' },
      handle_knob_type: { value: 'Paddle', source: 'whitelist' },
      body_material: { value: 'Aluminum alloy', source: 'whitelist' },
      body_material_tech: { value: 'HAGANE 机身', source: 'whitelist' },
      main_gear_material: { value: 'Brass', source: 'whitelist' },
      usage_environment: { value: '重饵 / 巨物', source: 'whitelist' },
      player_environment: { value: '重饵 / 巨物', source: 'whitelist' },
    },
  },
};

const SHIMANO_SUPPORT_SEARCH_URL = 'https://www.shimanofishingservice.jp/price.php';
const SHIMANO_SUPPORT_BASE_URL = 'https://www.shimanofishingservice.jp/';
const supportLinkCache = new Map();

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toAbsoluteUrl(base, maybeRelative) {
  const text = normalizeText(maybeRelative);
  if (!text) return '';
  try {
    return new URL(text, base).href;
  } catch (error) {
    return text;
  }
}

function postShimanoSupportSearch(searchText) {
  const term = normalizeText(searchText);
  if (!term) return '';
  return execFileSync(
    'curl',
    [
      '-L',
      '-A',
      'Mozilla/5.0',
      '-X',
      'POST',
      SHIMANO_SUPPORT_SEARCH_URL,
      '--data',
      `prc=&cmd=search&sid=jp&search_text=${encodeURIComponent(term)}`,
    ],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
}

function extractShimanoSupportLinks(html, productCode) {
  const code = normalizeText(productCode);
  if (!code || !html) return { EV_link: '', Specs_link: '' };

  const codePattern = escapeRegExp(code);
  const exactBlock = new RegExp(
    `<span class="table-name_heading">([^<]+)</span>[\\s\\S]*?<p class="table_td table-code">${codePattern}</p>[\\s\\S]*?<a href="([^"]*parts_price\\.php\\?scode=${codePattern}[^"]*)"[^>]*>[\\s\\S]*?<a href="([^"]*manual[^"]+\\.pdf)"`,
    'i'
  );
  const match = html.match(exactBlock);
  if (match) {
    return {
      EV_link: toAbsoluteUrl(SHIMANO_SUPPORT_BASE_URL, match[2]),
      Specs_link: toAbsoluteUrl(SHIMANO_SUPPORT_BASE_URL, match[3]),
    };
  }

  const fallbackEv = (html.match(/href="([^"]*parts_price\.php\?scode=[^"]+)"/i) || [])[1] || '';
  const fallbackSpecs = (html.match(/href="([^"]*manual[^"]+\.pdf)"/i) || [])[1] || '';
  return {
    EV_link: toAbsoluteUrl(SHIMANO_SUPPORT_BASE_URL, fallbackEv),
    Specs_link: toAbsoluteUrl(SHIMANO_SUPPORT_BASE_URL, fallbackSpecs),
  };
}

function resolveShimanoSupportLinks(row) {
  const productCode = normalizeText(row.product_code);
  const sku = normalizeText(row.SKU);
  const fallbackTerms = getFallbackSearchTerms(row);
  const cacheKey = productCode || `sku:${sku}` || `fallback:${fallbackTerms.join('|')}`;
  if (!cacheKey) return { EV_link: '', Specs_link: '' };
  if (supportLinkCache.has(cacheKey)) return supportLinkCache.get(cacheKey);

  let links = { EV_link: '', Specs_link: '' };

  // Shimano support site is product-code oriented; use SKU only as a fallback.
  if (productCode && productCode !== '-') {
    try {
      const html = postShimanoSupportSearch(productCode);
      links = extractShimanoSupportLinks(html, productCode);
    } catch (error) {
      links = { EV_link: '', Specs_link: '' };
    }
  }

  if ((!links.EV_link && !links.Specs_link) && sku) {
    try {
      const html = postShimanoSupportSearch(sku);
      if (productCode || htmlHasSkuLikeTitle(html, sku)) {
        links = extractShimanoSupportLinks(html, productCode || sku);
      }
    } catch (error) {
      links = { EV_link: '', Specs_link: '' };
    }
  }

  if (!links.EV_link && !links.Specs_link) {
    for (const term of fallbackTerms) {
      try {
        const html = postShimanoSupportSearch(term);
        if (productCode || htmlHasSkuLikeTitle(html, sku || term)) {
          links = extractShimanoSupportLinks(html, productCode || sku || term);
        }
        if (links.EV_link || links.Specs_link) break;
      } catch (error) {
        links = { EV_link: '', Specs_link: '' };
      }
    }
  }

  supportLinkCache.set(cacheKey, links);
  return links;
}

function ensureHeaders(rows, headers) {
  for (const row of rows) {
    for (const header of headers) {
      if (!(header in row)) row[header] = '';
    }
  }
}

function encodeColumn(index) {
  let s = '';
  let n = index;
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function buildSheet(rows, headers, highlightedCells) {
  const aoa = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ''))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  return ws;
}

function forceCellValue(ws, headers, rowIndex, key, value) {
  const colIndex = headers.indexOf(key);
  if (colIndex === -1) return;
  const ref = `${encodeColumn(colIndex)}${rowIndex}`;
  ws[ref] = { t: 's', v: String(value ?? '') };
}

function toRefs(highlightedCells) {
  return highlightedCells.map(({ rowIndex, colIndex }) => `${encodeColumn(colIndex)}${rowIndex}`);
}

function extractSkuSpecFamily(sku) {
  const text = normalizeText(sku).toUpperCase();
  const families = [];
  const sizeMap = {
    '70': '70',
    '71': '70',
    '30': '30',
    '31': '30',
    '100': '100',
    '101': '100',
    '150': '150',
    '151': '150',
    '200': '200',
    '201': '200',
  };
  const m = text.match(/\b(30|31|70|71|100|101|150|151|200|201)(?:HG|XG|PG)?\b/);
  if (m) families.push(sizeMap[m[1]]);
  if (text.includes('BFS')) families.push('BFS');
  const unique = [...new Set(families)];
  return unique.join('|');
}

function shouldApplyDetailField(fieldKey, meta, row, reelVariantRows) {
  if (!SUBVARIANT_SENSITIVE_FIELDS.has(fieldKey)) return true;
  if (meta.apply_scope === 'shared_variants') return true;
  if (meta.apply_scope === 'series_fallback') return true;
  if (meta.sku_match && normalizeText(row.SKU).toUpperCase().includes(normalizeText(meta.sku_match).toUpperCase())) return true;
  if (meta.sku_matches && meta.sku_matches.some((token) => normalizeText(row.SKU).toUpperCase().includes(normalizeText(token).toUpperCase()))) return true;
  if (meta.sku_match || meta.sku_matches) return false;
  return true;
}

function reorderDetailHeaders(headers) {
  const filtered = headers.filter((header) => header !== 'gear_material');
  const bodyIndex = filtered.indexOf('body_material');
  const techIndex = filtered.indexOf('body_material_tech');

  if (bodyIndex !== -1 && techIndex !== -1 && techIndex !== bodyIndex + 1) {
    filtered.splice(techIndex, 1);
    filtered.splice(bodyIndex + 1, 0, 'body_material_tech');
  }

  return filtered;
}

function matchPageSplitRule(sourceId, sku) {
  const rules = PAGE_SPLIT_RULES[sourceId] || [];
  const text = normalizeText(sku);
  if (!text) return null;
  return (
    rules.find((rule) =>
      (rule.sku_prefixes || []).some((prefix) => text.startsWith(prefix))
    ) || null
  );
}

function getFallbackSearchTerms(row) {
  const splitRules = Object.values(PAGE_SPLIT_RULES).flat();
  const splitRule = splitRules.find((rule) => rule.new_id === row.reel_id);
  return splitRule?.search_terms || [];
}

function buildSkuSearchTokens(sku) {
  const text = normalizeText(sku).toUpperCase();
  if (!text) return [];
  return [...new Set([text, text.replace(/\s+/g, '')])];
}

function htmlHasSkuLikeTitle(html, sku) {
  const tokens = buildSkuSearchTokens(sku);
  if (!tokens.length || !html) return false;
  const titles = [...html.matchAll(/<span class="table-name_heading">([^<]+)<\/span>/gi)].map((m) =>
    normalizeText(m[1]).toUpperCase().replace(/\s+/g, '')
  );
  return titles.some((title) => tokens.some((token) => title.includes(token.replace(/\s+/g, ''))));
}

function splitRowsByOfficialPage(masterRows, detailRows) {
  const splitMasterRows = [];
  const splitDetailRows = [];

  for (const row of masterRows) {
    const rules = PAGE_SPLIT_RULES[row.id] || [];
    if (!rules.length) {
      splitMasterRows.push({ ...row });
      continue;
    }
    for (const rule of rules) {
      const cloned = { ...row, id: rule.new_id };
      if (rule.model) cloned.model = rule.model;
      if (rule.alias) cloned.alias = rule.alias;
      if (rule.image) cloned.images = rule.image;
      if (rule.description) cloned.Description = rule.description;
      splitMasterRows.push(cloned);
    }
  }

  for (const row of detailRows) {
    const rule = matchPageSplitRule(row.reel_id, row.SKU);
    if (!rule) {
      splitDetailRows.push({ ...row });
      continue;
    }
    const cloned = { ...row, reel_id: rule.new_id };
    for (const [from, to] of rule.sku_replacements || []) {
      if (normalizeText(cloned.SKU).startsWith(from)) {
        cloned.SKU = normalizeText(cloned.SKU).replace(from, to);
      }
    }
    splitDetailRows.push(cloned);
  }

  return { masterRows: splitMasterRows, detailRows: splitDetailRows };
}

function main() {
  const srcWb = XLSX.readFile(SOURCE_FILE);
  const sourceMasterRows = XLSX.utils.sheet_to_json(srcWb.Sheets[MASTER_SHEET], { defval: '' })
    .filter((row) => SOURCE_TEST_REEL_IDS.includes(row.id));
  const sourceDetailRows = XLSX.utils.sheet_to_json(srcWb.Sheets[DETAIL_SHEET], { defval: '' })
    .filter((row) => SOURCE_TEST_REEL_IDS.includes(row.reel_id));
  const { masterRows, detailRows } = splitRowsByOfficialPage(sourceMasterRows, sourceDetailRows);

  const masterHeaders = XLSX.utils.sheet_to_json(srcWb.Sheets[MASTER_SHEET], { header: 1, defval: '' })[0] || [];
  const detailHeaders = XLSX.utils.sheet_to_json(srcWb.Sheets[DETAIL_SHEET], { header: 1, defval: '' })[0] || [];

  const finalMasterHeaders = [...masterHeaders];
  for (const header of MASTER_EXTRA_HEADERS) {
    if (!finalMasterHeaders.includes(header)) finalMasterHeaders.push(header);
  }

  const finalDetailHeaders = [...detailHeaders];
  for (const header of DETAIL_EXTRA_HEADERS) {
    if (!finalDetailHeaders.includes(header)) finalDetailHeaders.push(header);
  }
  const orderedDetailHeaders = reorderDetailHeaders(finalDetailHeaders);

  ensureHeaders(masterRows, finalMasterHeaders);
  ensureHeaders(detailRows, orderedDetailHeaders);

  const masterHighlightedCells = [];
  const detailHighlightedCells = [];

  masterRows.sort((a, b) => TEST_REEL_IDS.indexOf(a.id) - TEST_REEL_IDS.indexOf(b.id));
  detailRows.sort((a, b) => {
    const ai = TEST_REEL_IDS.indexOf(a.reel_id);
    const bi = TEST_REEL_IDS.indexOf(b.reel_id);
    if (ai !== bi) return ai - bi;
    return normalizeText(a.id).localeCompare(normalizeText(b.id));
  });

  detailRows.forEach((row) => {
    row.drag_click = '';
    row.is_compact_body = '';
  });

  detailRows.forEach((row) => {
    const links = resolveShimanoSupportLinks(row);
    row.EV_link = links.EV_link;
    row.Specs_link = links.Specs_link;
  });

  masterRows.forEach((row, idx) => {
    row.player_positioning = '';
    row.player_selling_points = '';
    const cfg = enrichment[row.id] || {};
    const fields = cfg.master || {};
    for (const [key, meta] of Object.entries(fields)) {
      row[key] = meta.value;
      if (meta.source === 'whitelist') {
        masterHighlightedCells.push({
          rowIndex: idx + 2,
          colIndex: finalMasterHeaders.indexOf(key),
        });
      }
    }
  });

  detailRows.forEach((row, idx) => {
    delete row.gear_material;
    const cfg = enrichment[row.reel_id] || {};
    const fields = cfg.detail || {};
    const reelVariantRows = detailRows.filter((variantRow) => variantRow.reel_id === row.reel_id);
    for (const [key, meta] of Object.entries(fields)) {
      if (!shouldApplyDetailField(key, meta, row, reelVariantRows)) continue;
      row[key] = meta.value;
      if (meta.source === 'whitelist') {
        detailHighlightedCells.push({
          rowIndex: idx + 2,
          colIndex: orderedDetailHeaders.indexOf(key),
        });
      }
    }
  });

  const wb = XLSX.utils.book_new();
  const masterSheet = buildSheet(masterRows, finalMasterHeaders, masterHighlightedCells);
  const detailSheet = buildSheet(detailRows, orderedDetailHeaders, detailHighlightedCells);

  detailRows.forEach((row, idx) => {
    const excelRow = idx + 2;
    const cfg = enrichment[row.reel_id] || {};
    const fields = cfg.detail || {};

    for (const key of FORCE_WRITE_DETAIL_KEYS) {
      if (fields[key]) {
        forceCellValue(detailSheet, orderedDetailHeaders, excelRow, key, fields[key].value);
      }
    }

    if (row.reel_id === 'SRE5002') {
      forceCellValue(detailSheet, orderedDetailHeaders, excelRow, 'official_environment', fields.official_environment ? fields.official_environment.value : row.official_environment);
      forceCellValue(detailSheet, orderedDetailHeaders, excelRow, 'usage_environment', fields.usage_environment ? fields.usage_environment.value : row.usage_environment);
      forceCellValue(detailSheet, orderedDetailHeaders, excelRow, 'fit_style_tags', fields.fit_style_tags ? fields.fit_style_tags.value : row.fit_style_tags);
      forceCellValue(detailSheet, orderedDetailHeaders, excelRow, 'is_sw_edition', fields.is_sw_edition ? fields.is_sw_edition.value : row.is_sw_edition);
    }
  });

  XLSX.utils.book_append_sheet(wb, masterSheet, MASTER_SHEET);
  XLSX.utils.book_append_sheet(wb, detailSheet, DETAIL_SHEET);
  XLSX.writeFile(wb, OUTPUT_FILE, { cellStyles: true });

  const highlightPayload = {
    sheets: [
      { sheet_xml: 'xl/worksheets/sheet1.xml', refs: toRefs(masterHighlightedCells) },
      { sheet_xml: 'xl/worksheets/sheet2.xml', refs: toRefs(detailHighlightedCells) },
    ],
  };

  const highlightPayloadPath = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import_test_highlights.json');
  fs.writeFileSync(highlightPayloadPath, JSON.stringify(highlightPayload, null, 2), 'utf8');

  const patchResult = spawnSync('python3', [HIGHLIGHT_HELPER, OUTPUT_FILE, highlightPayloadPath], {
    encoding: 'utf8',
  });
  if (patchResult.status !== 0) {
    throw new Error(`highlight patch failed: ${patchResult.stderr || patchResult.stdout}`);
  }

  const summary = {
    output: OUTPUT_FILE,
    reel_count: masterRows.length,
    detail_count: detailRows.length,
    highlighted_master_cells: masterHighlightedCells.length,
    highlighted_detail_cells: detailHighlightedCells.length,
    highlight_payload: highlightPayloadPath,
  };
  fs.writeFileSync(
    gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import_test_summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  console.log(`Wrote ${OUTPUT_FILE}`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
