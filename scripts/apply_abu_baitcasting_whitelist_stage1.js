const path = require('path');
const XLSX = require('./node_modules/xlsx');

const IMPORT_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_baitcasting_reel_import.xlsx');

function n(v) {
  return String(v || '').trim();
}

function includes(model, ...parts) {
  const text = n(model).toLowerCase();
  return parts.some((p) => text.includes(String(p).toLowerCase()));
}

function getMasterUpdate(model) {
  if (includes(model, 'Black Max')) {
    return {
      series_positioning: '基础入门主力',
      player_positioning: '入门泛用路亚',
      player_selling_points: '价格友好 / 结构简单 / 日常泛用',
    };
  }
  if (includes(model, 'Max™ SX Flipping Switch')) {
    return {
      series_positioning: '入门重障碍主力',
      player_positioning: 'flipping / pitching / cover',
      player_selling_points: '翻转开关 / 近岸重障碍 / 入门重装',
    };
  }
  if (includes(model, 'Max™ SX Winch')) {
    return {
      series_positioning: '入门低速卷阻主力',
      player_positioning: 'crankbait / moving bait',
      player_selling_points: '低速比 / 慢收稳定 / moving bait 友好',
    };
  }
  if (includes(model, 'Max™ Elite Rocket')) {
    return {
      series_positioning: 'Max高速搜索主力',
      player_positioning: '高速搜索取向',
      player_selling_points: '9.0 高速比 / 快速回线 / search bait 友好',
    };
  }
  if (includes(model, 'Max™ Predator')) {
    return {
      series_positioning: '重载大饵主力',
      player_positioning: 'big bait / large fish',
      player_selling_points: '大线杯 / 高拖力 / 大鱼和大饵取向',
    };
  }
  if (includes(model, 'Beast™ 300')) {
    return {
      series_positioning: '重载大饵旗舰',
      player_positioning: 'A-rig / swimbait / 大型鱼',
      player_selling_points: '30lb 拖力 / 大型低姿态 / 8英寸级 swimbait 取向',
    };
  }
  if (includes(model, 'Beast™ 200')) {
    return {
      series_positioning: '重载大饵主力',
      player_positioning: 'swimbait / heavy duty',
      player_selling_points: '大拖力 / 易掌握 / 6英寸级 swimbait 取向',
    };
  }
  if (includes(model, 'BFS', 'Zenon™ LTX BFS', 'Revo® X BFS')) {
    return {
      series_positioning: 'BFS 精细特化',
      player_positioning: '超轻饵精细玩法',
      player_selling_points: '浅线杯 / 轻量刹车 / 轻饵抛投效率高',
    };
  }
  if (includes(model, 'Ike Signature')) {
    return {
      series_positioning: '签名竞技主力',
      player_positioning: '泛用竞技取向',
      player_selling_points: 'Mike Iaconelli 签名 / 泛用覆盖广 / 竞技感明确',
    };
  }
  if (includes(model, 'Inshore')) {
    return {
      series_positioning: '近海主力',
      player_positioning: 'inshore / 轻近海',
      player_selling_points: '耐腐蚀 / 大型 EVA 握丸 / 近海大扭矩',
    };
  }
  if (includes(model, 'Zenon™ MG-LTX')) {
    return {
      series_positioning: '超轻精细旗舰',
      player_positioning: '高端 finesse',
      player_selling_points: '4.5oz 超轻 / 精细抛投 / 高端手感取向',
    };
  }
  if (includes(model, 'Zenon™ X Low Profile')) {
    return {
      series_positioning: '轻量全能高端',
      player_positioning: '轻量到重饵泛用',
      player_selling_points: '紧凑机身 / 铝主齿 / 轻重饵跨度大',
    };
  }
  if (includes(model, 'Revo® SX-SS')) {
    return {
      series_positioning: '跳投障碍高端主力',
      player_positioning: 'skipping / pitching / flipping',
      player_selling_points: '浅线杯 / skipping 特化 / 重障碍控线更强',
    };
  }
  if (includes(model, 'Revo® Rocket', 'Rocket Low Profile', 'SX Rocket')) {
    return {
      series_positioning: '高速搜索主力',
      player_positioning: '快节奏搜索取向',
      player_selling_points: '超高速比 / 快速回线 / search bait 友好',
    };
  }
  if (includes(model, 'Revo® SX Low Profile')) {
    return {
      series_positioning: '中高端全能主力',
      player_positioning: '泛用竞技 / 鲈鱼主力',
      player_selling_points: 'X2-Cräftic 框架 / 高拖力 / 全能 workhorse',
    };
  }
  if (includes(model, 'Revo® STX Low Profile')) {
    return {
      series_positioning: '高端全能主力',
      player_positioning: '精度与力量兼顾',
      player_selling_points: '铝框 + 侧板 / 高拖力 / 刹车调校空间大',
    };
  }
  if (includes(model, 'Revo® X Low Profile')) {
    return {
      series_positioning: '全能主力',
      player_positioning: '淡水泛用主力',
      player_selling_points: 'C6 碳框 / 综合性能均衡 / 适用面广',
    };
  }
  if (includes(model, 'Max™ DLC', 'Max™ Toro DLC')) {
    return {
      series_positioning: '入门计数器主力',
      player_positioning: '船钓 / 拖钓 / 深水',
      player_selling_points: '数字计米 / DTT 警报 / 稳定实用',
    };
  }
  if (includes(model, 'Line Counter')) {
    return {
      series_positioning: '经典计数器主力',
      player_positioning: '拖钓 / 深水 / 船钓',
      player_selling_points: '机械或数字计数 / 稳定大物取向 / 船钓友好',
    };
  }
  if (includes(model, 'Carp')) {
    return {
      series_positioning: '鲤鱼大物主力',
      player_positioning: 'carp / 淡水大物',
      player_selling_points: '鼓轮经典结构 / 长线容量 / 大物持久战',
    };
  }
  if (includes(model, 'Catfish')) {
    return {
      series_positioning: '鲶鱼大物主力',
      player_positioning: 'catfish / 淡水大物',
      player_selling_points: '扭矩稳定 / 大线容量 / 鲶鱼实战取向',
    };
  }
  if (includes(model, 'Striper')) {
    return {
      series_positioning: '条纹鲈大物主力',
      player_positioning: 'striper / 淡海水大物',
      player_selling_points: '鼓轮大扭矩 / 强拖力 / striper 取向',
    };
  }
  if (includes(model, 'Pro Rocket', 'CS Pro Rocket')) {
    return {
      series_positioning: '远投大物主力',
      player_positioning: '远投 / 大水面大物',
      player_selling_points: '长投能力强 / 鼓轮经典结构 / 大水面取向',
    };
  }
  if (includes(model, '7000', 'C3 Round', 'C4 Round', 'SX Round', 'STX Round', 'S Round')) {
    return {
      series_positioning: '经典鼓轮主力',
      player_positioning: '淡水大物 / 鼓轮泛用',
      player_selling_points: '经典鼓轮结构 / 长线容量 / 扭矩稳定',
    };
  }
  if (includes(model, 'Max™ X Low Profile', 'Max™ 4 Low Profile', 'Max™ Pro Low Profile', 'Max™ SX Low Profile')) {
    return {
      series_positioning: '入门进阶主力',
      player_positioning: '淡水泛用路亚',
      player_selling_points: '低姿态易上手 / 日常泛用 / 性价比明确',
    };
  }
  return {
    series_positioning: '泛用主力',
    player_positioning: '淡水泛用',
    player_selling_points: '结构均衡 / 使用面广 / 日常泛用',
  };
}

function getDetailUpdate(model) {
  const update = {
    body_material: '',
    body_material_tech: '',
    gear_material: '',
    usage_environment: '',
    drag_click: '',
    fit_style_tags: '',
    min_lure_weight_hint: '',
    handle_style: '单摇臂',
    MAX_DURABILITY: '',
  };

  if (includes(model, 'Black Max')) {
    return {
      ...update,
      body_material: '石墨',
      body_material_tech: 'Graphite body and sideplates / MagTrax',
      gear_material: '黄铜',
      usage_environment: '淡水路亚',
      fit_style_tags: '入门,泛用,岸钓',
      min_lure_weight_hint: '约 7g+',
    };
  }
  if (includes(model, 'Flipping Switch')) {
    return {
      ...update,
      body_material: '石墨',
      body_material_tech: 'A-Sym body / MagTrax / flipping switch',
      gear_material: '黄铜',
      usage_environment: '淡水路亚',
      fit_style_tags: '翻转,重障碍,cover',
      min_lure_weight_hint: '约 10g+',
    };
  }
  if (includes(model, 'Max™ SX Low Profile', 'Max™ X Low Profile')) {
    return {
      ...update,
      body_material: '石墨',
      body_material_tech: 'A-Sym body / MagTrax',
      gear_material: '黄铜',
      usage_environment: '淡水路亚',
      fit_style_tags: '泛用,入门进阶,鲈鱼',
      min_lure_weight_hint: '约 7g+',
    };
  }
  if (includes(model, 'Max™ Pro Low Profile')) {
    return {
      ...update,
      body_material: '石墨',
      body_material_tech: 'A-Sym body / Carbon Matrix / MagTrax',
      gear_material: '黄铜',
      usage_environment: '淡水路亚',
      drag_click: '1',
      fit_style_tags: '泛用,进阶,鲈鱼',
      min_lure_weight_hint: '约 7g+',
    };
  }
  if (includes(model, 'Winch')) {
    return {
      ...update,
      body_material: '石墨',
      body_material_tech: 'A-Sym body / low gear',
      gear_material: '黄铜',
      usage_environment: '淡水路亚',
      fit_style_tags: '低速,crankbait,moving bait',
      min_lure_weight_hint: '约 10g+',
    };
  }
  if (includes(model, 'Elite Rocket')) {
    return {
      ...update,
      body_material: 'C6 碳',
      body_material_tech: 'A-Sym body / Carbon Matrix / Rocket',
      gear_material: '黄铜',
      usage_environment: '淡水路亚',
      fit_style_tags: '高速,搜索,快收',
      min_lure_weight_hint: '约 7g+',
    };
  }
  if (includes(model, 'Predator')) {
    return {
      ...update,
      body_material: 'C6 碳',
      body_material_tech: 'Power Stack Carbon Matrix / MagTrax',
      gear_material: '黄铜',
      usage_environment: '淡水大物',
      fit_style_tags: 'big bait,大鱼,重载',
      min_lure_weight_hint: '约 20g+',
      MAX_DURABILITY: '高',
    };
  }
  if (includes(model, 'Beast™ 300')) {
    return {
      ...update,
      body_material: 'X2-Cräftic 铝',
      body_material_tech: 'A-Symmetric body / Power Stack Carbon Matrix / Infini brake',
      gear_material: '黄铜',
      usage_environment: '淡水大物',
      drag_click: '1',
      fit_style_tags: 'A-rig,swimbait,big bait,大型鱼',
      min_lure_weight_hint: '约 28g+',
      MAX_DURABILITY: '高',
    };
  }
  if (includes(model, 'Beast™ 200')) {
    return {
      ...update,
      body_material: 'X2-Cräftic 铝',
      body_material_tech: 'A-Symmetric body / Power Stack Carbon Matrix / IVCB-6',
      gear_material: '黄铜',
      usage_environment: '淡水大物',
      fit_style_tags: 'swimbait,big bait,heavy duty',
      min_lure_weight_hint: '约 20g+',
      MAX_DURABILITY: '高',
    };
  }
  if (includes(model, 'Revo® X BFS', 'Zenon™ LTX BFS')) {
    return {
      ...update,
      body_material: includes(model, 'Zenon') ? 'X2-Cräftic 铝' : 'C6 碳',
      body_material_tech: includes(model, 'Zenon') ? 'BFS concept spool / MagTrax BFS / CeramiLite' : 'BFS concept spool / BFS MagTrax',
      gear_material: includes(model, 'Zenon') ? '航空级铝' : '',
      usage_environment: '淡水路亚',
      fit_style_tags: 'BFS,轻饵,finesse',
      min_lure_weight_hint: includes(model, 'Zenon') ? '约 1g+' : '约 2g+',
    };
  }
  if (includes(model, 'Ike Signature')) {
    return {
      ...update,
      body_material: '石墨',
      body_material_tech: 'Carbon Matrix / Infini brake',
      gear_material: '',
      usage_environment: '淡水路亚',
      drag_click: '1',
      fit_style_tags: '竞技,泛用,签名款',
      min_lure_weight_hint: '约 7g+',
    };
  }
  if (includes(model, 'Inshore')) {
    return {
      ...update,
      body_material: 'X2-Cräftic 合金',
      body_material_tech: 'HPCR / D2 Gear Design / saltwater corrosion protection',
      gear_material: '',
      usage_environment: '海水路亚',
      fit_style_tags: '近海,咸淡水,海鲈',
      min_lure_weight_hint: '约 10g+',
      MAX_DURABILITY: '高',
    };
  }
  if (includes(model, 'Zenon™ MG-LTX')) {
    return {
      ...update,
      body_material: 'X-Mag 合金 / C6 碳',
      body_material_tech: 'SLC spool / CeramiLite / IVCB-4',
      gear_material: '',
      usage_environment: '淡水路亚',
      fit_style_tags: 'finesse,轻量,高端',
      min_lure_weight_hint: '约 2g+',
    };
  }
  if (includes(model, 'Zenon™ X Low Profile')) {
    return {
      ...update,
      body_material: 'X2-Cräftic 合金 / C6 碳',
      body_material_tech: 'IVCB-4 / Compact bent handle',
      gear_material: '航空级铝',
      usage_environment: '淡水路亚',
      fit_style_tags: '轻量,全能,heavy jig',
      min_lure_weight_hint: '约 5g+',
    };
  }
  if (includes(model, 'Revo® SX-SS')) {
    return {
      ...update,
      body_material: 'X2-Cräftic 合金',
      body_material_tech: 'EXD / IVCB-6 / shallow spool',
      gear_material: '',
      usage_environment: '淡水路亚',
      fit_style_tags: 'skipping,pitching,flipping,cover',
      min_lure_weight_hint: '约 5g+',
    };
  }
  if (includes(model, 'Revo® X Low Profile')) {
    return {
      ...update,
      body_material: 'C6 碳',
      body_material_tech: 'EXD / MagTrax / Carbon Matrix',
      gear_material: '',
      usage_environment: '淡水路亚',
      fit_style_tags: '全能,鲈鱼,泛用',
      min_lure_weight_hint: '约 7g+',
    };
  }
  if (includes(model, 'Revo® SX Low Profile', 'Revo® STX Low Profile')) {
    return {
      ...update,
      body_material: 'X2-Cräftic 合金',
      body_material_tech: 'EXD / IVCB-6 / Power Stack Carbon Matrix',
      gear_material: '',
      usage_environment: '淡水路亚',
      fit_style_tags: includes(model, 'STX') ? '高端,全能,竞技' : 'workhorse,全能,鲈鱼',
      min_lure_weight_hint: '约 7g+',
      MAX_DURABILITY: '高',
    };
  }
  if (includes(model, 'Revo® Rocket', 'SX Rocket')) {
    return {
      ...update,
      body_material: 'X2-Cräftic 合金',
      body_material_tech: 'EXD / IVCB-6 / high gear',
      gear_material: '',
      usage_environment: '淡水路亚',
      fit_style_tags: '高速,搜索,快收',
      min_lure_weight_hint: '约 7g+',
    };
  }
  if (includes(model, 'DLC', 'Line Counter')) {
    return {
      ...update,
      body_material: includes(model, 'Toro') ? '' : '',
      body_material_tech: includes(model, 'digital', 'DLC') ? 'Digital line counter / DTT warning' : 'Mechanical line counter / synchronized level wind',
      gear_material: includes(model, 'DLC') ? '黄铜' : '',
      usage_environment: '船钓 / 拖钓',
      fit_style_tags: includes(model, 'Toro') || includes(model, 'Max™ DLC') ? '计数器,船钓,深水' : '计数器,拖钓,深水',
      min_lure_weight_hint: '',
      MAX_DURABILITY: '高',
    };
  }
  if (includes(model, 'Carp')) {
    return {
      ...update,
      body_material: '铝',
      body_material_tech: '6 pin centrifugal / synchronized level wind',
      gear_material: '',
      usage_environment: '淡水大物',
      fit_style_tags: 'carp,鼓轮,大物',
      min_lure_weight_hint: '',
      MAX_DURABILITY: '高',
    };
  }
  if (includes(model, 'Catfish')) {
    return {
      ...update,
      body_material: '铝',
      body_material_tech: '6 pin centrifugal / synchronized level wind',
      gear_material: '',
      usage_environment: '淡水大物',
      fit_style_tags: 'catfish,鼓轮,大物',
      min_lure_weight_hint: '',
      MAX_DURABILITY: '高',
    };
  }
  if (includes(model, 'Striper')) {
    return {
      ...update,
      body_material: '',
      body_material_tech: '6 pin centrifugal / synchronized level wind',
      gear_material: '',
      usage_environment: '淡海水大物',
      fit_style_tags: 'striper,鼓轮,大物',
      min_lure_weight_hint: '',
      MAX_DURABILITY: '高',
    };
  }
  if (includes(model, 'Pro Rocket', 'CS Pro Rocket')) {
    return {
      ...update,
      body_material: '铝',
      body_material_tech: '6 pin centrifugal / synchronized level wind / Carbon Matrix',
      gear_material: '黄铜',
      usage_environment: '淡海水大物',
      fit_style_tags: '远投,鼓轮,大水面',
      min_lure_weight_hint: '',
      MAX_DURABILITY: '高',
    };
  }
  if (includes(model, '7000')) {
    return {
      ...update,
      body_material: '',
      body_material_tech: '4 pin centrifugal / synchronized level wind',
      gear_material: '黄铜',
      usage_environment: '淡水大物',
      fit_style_tags: '大水面,鼓轮,大物',
      min_lure_weight_hint: '',
      MAX_DURABILITY: '高',
    };
  }
  if (includes(model, 'SX Round', 'STX Round', 'S Round', 'C4 Round', 'C3 Round')) {
    return {
      ...update,
      body_material: '',
      body_material_tech: includes(model, 'C4') ? 'Carbon Matrix / 6 pin centrifugal / synchronized level wind' : 'Carbon Matrix / synchronized level wind',
      gear_material: includes(model, 'C4') ? '' : '',
      usage_environment: '淡水大物',
      fit_style_tags: '鼓轮,经典,大物',
      min_lure_weight_hint: '',
      MAX_DURABILITY: '高',
    };
  }
  return update;
}

const wb = XLSX.readFile(IMPORT_FILE, { cellStyles: false });
const masters = XLSX.utils.sheet_to_json(wb.Sheets.reel, { defval: '' });
const details = XLSX.utils.sheet_to_json(wb.Sheets.baitcasting_reel_detail, { defval: '' });

const modelByReelId = new Map(masters.map((row) => [row.id, row.model]));

for (const row of masters) {
  Object.assign(row, getMasterUpdate(row.model));
}

for (const row of details) {
  const model = modelByReelId.get(row.reel_id) || '';
  Object.assign(row, getDetailUpdate(model));
}

wb.Sheets.reel = XLSX.utils.json_to_sheet(masters, { header: [
  'id', 'brand_id', 'model', 'model_cn', 'model_year', 'alias',
  'type_tips', 'type', 'images', 'created_at', 'updated_at',
  'series_positioning', 'main_selling_points', 'official_reference_price', 'market_status',
  'Description', 'market_reference_price', 'player_positioning', 'player_selling_points',
] });

wb.Sheets.baitcasting_reel_detail = XLSX.utils.json_to_sheet(details, { header: [
  'id', 'reel_id', 'SKU', 'GEAR RATIO', 'MAX DRAG', 'WEIGHT',
  'spool_diameter_per_turn_mm', 'Nylon_lb_m', 'fluorocarbon_lb_m', 'pe_no_m',
  'cm_per_turn', 'handle_length_mm', 'bearing_count_roller',
  'market_reference_price', 'product_code', 'created_at', 'updated_at',
  'spool_diameter_mm', 'spool_width_mm', 'spool_weight_g', 'handle_knob_type',
  'handle_knob_exchange_size', 'body_material', 'gear_material',
  'battery_capacity', 'battery_charge_time', 'continuous_cast_count',
  'usage_environment', 'DRAG', 'Nylon_no_m', 'fluorocarbon_no_m',
  'drag_click', 'spool_depth_normalized', 'gear_ratio_normalized',
  'brake_type_normalized', 'fit_style_tags', 'min_lure_weight_hint',
  'is_compact_body', 'handle_style', 'MAX_DURABILITY', 'type',
] });

XLSX.writeFile(wb, IMPORT_FILE);
console.log(`Updated ${IMPORT_FILE}`);
