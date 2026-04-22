const path = require('path');
const XLSX = require('xlsx');

const IMPORT_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_spinning_reels_import.xlsx');

const MASTER_HEADERS = [
  'id', 'brand_id', 'model', 'model_cn', 'model_year', 'alias',
  'type_tips', 'type', 'images', 'created_at', 'updated_at',
  'series_positioning', 'main_selling_points', 'official_reference_price', 'market_status',
  'Description', 'market_reference_price', 'player_positioning', 'player_selling_points',
];

const DETAIL_HEADERS = [
  'id', 'reel_id', 'SKU', 'GEAR RATIO', 'DRAG', 'MAX DRAG', 'WEIGHT',
  'spool_diameter_per_turn_mm', 'spool_diameter_mm', 'Nylon_no_m', 'Nylon_lb_m', 'fluorocarbon_no_m',
  'fluorocarbon_lb_m', 'pe_no_m', 'cm_per_turn', 'handle_length_mm', 'bearing_count_roller',
  'body_material', 'body_material_tech', 'gear_material', 'handle_knob_type', 'official_environment',
  'line_capacity_display', 'market_reference_price', 'product_code', 'created_at', 'updated_at',
  'drag_click', 'spool_depth_normalized', 'gear_ratio_normalized', 'brake_type_normalized',
  'fit_style_tags', 'min_lure_weight_hint', 'is_compact_body', 'handle_style',
  'MAX_DURABILITY', 'type', 'is_sw_edition', 'variant_description', 'Description',
  'player_environment', 'is_handle_double', 'EV_link', 'Specs_link', 'spool_weight_g',
];

const MASTER_UPDATES = {
  ARE1000: {
    series_positioning: '重型全水域主力',
    player_positioning: '大饵大鱼全水域',
    player_selling_points: '高拖力 / 大型掠食鱼取向 / 淡海水都能用',
  },
  ARE1001: {
    series_positioning: '签名中高端主力',
    player_positioning: '泛用竞技取向',
    player_selling_points: 'Mike Iaconelli 签名 / 铝机身 / 技法覆盖广',
  },
  ARE1002: {
    series_positioning: 'Max高端入门',
    player_positioning: '轻量进阶入门',
    player_selling_points: '轻量 C6 机身 / 9+1 轴承 / 性价比高',
  },
  ARE1003: {
    series_positioning: 'Max中端入门',
    player_positioning: '轻量基础进阶',
    player_selling_points: '轻量紧凑 / 6+1 轴承 / 通用路亚友好',
  },
  ARE1004: {
    series_positioning: 'Max基础入门',
    player_positioning: '基础入门泛用',
    player_selling_points: '结构简单 / 预算友好 / 日常泛用',
  },
  ARE1005: {
    series_positioning: 'Max进阶主力',
    player_positioning: '基础进阶泛用',
    player_selling_points: 'Carbon Matrix drag / 7+1 轴承 / 轻量泛用',
  },
  ARE1006: {
    series_positioning: '轻量高端主力',
    player_positioning: '高端轻量灵敏泛用',
    player_selling_points: '超轻紧凑 / 顺滑灵敏 / 高端淡海水泛用',
  },
  ARE1007: {
    series_positioning: 'Revo全能主力',
    player_positioning: '淡海水泛用主力',
    player_selling_points: '紧凑机身 / 广谱适配 / 鲈鱼到泛用都能打',
  },
  ARE1008: {
    series_positioning: 'Revo中高端主力',
    player_positioning: '淡海水中高端泛用',
    player_selling_points: '更高规格 Revo 主线 / 顺滑耐用 / 淡海水兼容',
  },
  ARE1009: {
    series_positioning: '低速扭矩主力',
    player_positioning: '卷阻饵与慢检索',
    player_selling_points: '4.8 低速比 / 慢收稳定 / crankbait和swimbait友好',
  },
  ARE1010: {
    series_positioning: '高速搜索主力',
    player_positioning: '快节奏搜索取向',
    player_selling_points: '7.6 高速比 / 快收高效率 / 搜索饵快速回线友好',
  },
  ARE1011: {
    series_positioning: '老款Max主力',
    player_positioning: '基础泛用入门',
    player_selling_points: '老款 Pro Max / Graphite frame / 基础耐用',
  },
};

const DETAIL_BY_REEL = {
  ARE1000: {
    official_environment: '淡海水泛用',
    player_environment: '大饵 / 大型掠食鱼 / 全水域',
    body_material: 'X2-Cräftic alloy',
    body_material_tech: 'A-SYM body / Power Stack Carbon Matrix Drag / Rocket Line Management',
    is_sw_edition: '0',
    fit_style_tags: '大饵,重载,全水域,大型鱼',
    min_lure_weight_hint: '约 20g+',
  },
  ARE1001: {
    official_environment: '淡海水泛用',
    player_environment: '泛用 / 竞技',
    body_material: 'aluminum frame',
    body_material_tech: 'machined gear system',
    is_sw_edition: '0',
    fit_style_tags: '泛用,竞技,签名款',
    min_lure_weight_hint: '约 5g+',
  },
  ARE1002: {
    official_environment: '淡海水泛用',
    player_environment: '轻量泛用',
    body_material: 'C6 carbon',
    body_material_tech: 'A-SYM body / CNC Machined Gear System / Carbon Matrix Drag',
    is_sw_edition: '0',
    fit_style_tags: '轻量,泛用,入门进阶',
    min_lure_weight_hint: '约 3g+',
  },
  ARE1003: {
    official_environment: '淡海水泛用',
    player_environment: '轻量泛用',
    body_material: 'graphite',
    body_material_tech: 'V-Rotor / V-Spool / Rocket Line Management',
    is_sw_edition: '0',
    fit_style_tags: '轻量,泛用,入门',
    min_lure_weight_hint: '约 3g+',
  },
  ARE1004: {
    official_environment: '淡海水泛用',
    player_environment: '基础泛用',
    body_material: 'graphite',
    body_material_tech: 'A-SYM body / V-Rotor / Rocket Line Management',
    is_sw_edition: '0',
    fit_style_tags: '入门,泛用,预算友好',
    min_lure_weight_hint: '约 3g+',
  },
  ARE1005: {
    official_environment: '淡海水泛用',
    player_environment: '基础进阶泛用',
    body_material: 'graphite',
    body_material_tech: 'Carbon Matrix Drag / Rocket Line Management',
    is_sw_edition: '0',
    fit_style_tags: '进阶,泛用,预算友好',
    min_lure_weight_hint: '约 3g+',
  },
  ARE1006: {
    official_environment: '淡海水泛用',
    player_environment: '高端轻量灵敏泛用',
    body_material: 'X-Cräftic',
    body_material_tech: 'A-SYM body / V-Rotor / Carbon Matrix Drag',
    is_sw_edition: '0',
    fit_style_tags: '高端,轻量,紧凑,泛用',
    min_lure_weight_hint: '约 2g+',
  },
  ARE1007: {
    official_environment: '淡海水泛用',
    player_environment: '鲈鱼 / 泛用',
    body_material: 'A-SYM body',
    body_material_tech: 'AM-G gear / V-Rotor / Rocket Line Management',
    is_sw_edition: '0',
    fit_style_tags: '鲈鱼,泛用,全能主力',
    min_lure_weight_hint: '约 5g+',
  },
  ARE1008: {
    official_environment: '淡海水泛用',
    player_environment: '鲈鱼 / 泛用',
    body_material: 'A-SYM body',
    body_material_tech: 'AM-G gear / V-Rotor / Rocket Line Management',
    is_sw_edition: '0',
    fit_style_tags: '鲈鱼,泛用,中高端,全能',
    min_lure_weight_hint: '约 5g+',
  },
  ARE1009: {
    official_environment: '淡海水泛用',
    player_environment: '卷阻饵 / 慢收搜索',
    body_material: 'A-SYM body',
    body_material_tech: 'low gear / AM-G gear',
    is_sw_edition: '0',
    fit_style_tags: '低速,卷阻饵,crankbait,swimbait',
    min_lure_weight_hint: '约 7g+',
  },
  ARE1010: {
    official_environment: '淡海水泛用',
    player_environment: '快节奏搜索',
    body_material: 'A-SYM body',
    body_material_tech: '7.6 high gear / Rocket Line Management',
    is_sw_edition: '0',
    fit_style_tags: '高速,搜索,快收,search bait',
    min_lure_weight_hint: '约 5g+',
  },
  ARE1011: {
    official_environment: '淡海水泛用',
    player_environment: '基础泛用',
    body_material: 'graphite',
    body_material_tech: 'Rocket Line Management',
    is_sw_edition: '0',
    fit_style_tags: '入门,基础,泛用',
    min_lure_weight_hint: '约 3g+',
  },
};

const wb = XLSX.readFile(IMPORT_FILE, { cellStyles: false });
const masters = XLSX.utils.sheet_to_json(wb.Sheets.reel, { defval: '' });
const details = XLSX.utils.sheet_to_json(wb.Sheets.spinning_reel_detail, { defval: '' });

for (const row of masters) {
  if (MASTER_UPDATES[row.id]) Object.assign(row, MASTER_UPDATES[row.id]);
}

for (const row of details) {
  if (DETAIL_BY_REEL[row.reel_id]) {
    Object.assign(row, DETAIL_BY_REEL[row.reel_id]);
  }
  row.handle_style = '单摇臂';
  row.is_handle_double = '0';
}

wb.Sheets.reel = XLSX.utils.json_to_sheet(masters, { header: MASTER_HEADERS });
wb.Sheets.spinning_reel_detail = XLSX.utils.json_to_sheet(details, { header: DETAIL_HEADERS });

XLSX.writeFile(wb, IMPORT_FILE);
console.log(`Updated ${IMPORT_FILE}`);
