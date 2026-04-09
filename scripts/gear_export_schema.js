const BRAND_IDS = {
    SHIMANO: 1,
    DAIWA: 2,
    MEGABASS: 7,
};

const SHEET_NAMES = {
    reel: 'reel',
    spinningReelDetail: 'spinning_reel_detail',
    baitcastingReelDetail: 'baitcasting_reel_detail',
    rod: 'rod',
    rodDetail: 'rod_detail',
    lure: 'lure',
    hardbaitLureDetail: 'hardbait_lure_detail',
    metalLureDetail: 'metal_lure_detail',
    softLureDetail: 'soft_lure_detail',
    wireLureDetail: 'wire_lure_detail',
    jigLureDetail: 'jig_lure_detail',
    line: 'line',
    lineDetail: 'line_detail',
};

const HEADERS = {
    reelMaster: [
        'id', 'brand_id', 'model', 'model_cn', 'model_year', 'alias',
        'type_tips', 'type', 'images', 'created_at', 'updated_at',
        'series_positioning', 'main_selling_points', 'official_reference_price', 'market_status',
    ],
    spinningReelDetail: [
        'id', 'reel_id', 'SKU', 'GEAR RATIO', 'DRAG', 'MAX DRAG', 'WEIGHT',
        'spool_diameter_per_turn_mm', 'Nylon_no_m', 'Nylon_lb_m', 'fluorocarbon_no_m',
        'fluorocarbon_lb_m', 'pe_no_m', 'cm_per_turn', 'handle_length_mm', 'bearing_count_roller',
        'market_reference_price', 'product_code', 'created_at', 'updated_at',
        'drag_click', 'spool_depth_normalized', 'gear_ratio_normalized', 'brake_type_normalized',
        'fit_style_tags', 'min_lure_weight_hint', 'is_compact_body', 'handle_style',
        'MAX_DURABILITY',
    ],
    baitcastingReelDetail: [
        'id', 'reel_id', 'SKU', 'GEAR RATIO', 'MAX DRAG', 'WEIGHT',
        'spool_diameter_per_turn_mm', 'Nylon_lb_m', 'fluorocarbon_lb_m', 'pe_no_m',
        'cm_per_turn', 'handle_length_mm', 'bearing_count_roller',
        'market_reference_price', 'product_code', 'created_at', 'updated_at',
        'spool_diameter_mm', 'spool_width_mm', 'handle_knob_type',
        'handle_knob_exchange_size', 'body_material', 'gear_material',
        'battery_capacity', 'battery_charge_time', 'continuous_cast_count',
        'usage_environment', 'DRAG', 'Nylon_no_m', 'fluorocarbon_no_m',
        'drag_click', 'spool_depth_normalized', 'gear_ratio_normalized',
        'brake_type_normalized', 'fit_style_tags', 'min_lure_weight_hint',
        'is_compact_body', 'handle_style', 'MAX_DURABILITY',
    ],
    rodMaster: [
        'id', 'brand_id', 'model', 'model_cn', 'model_year', 'alias',
        'type_tips', 'images', 'created_at', 'updated_at', 'Description',
    ],
    rodDetail: [
        'id', 'rod_id', 'TYPE', 'SKU', 'TOTAL LENGTH', 'Action', 'PIECES',
        'CLOSELENGTH', 'WEIGHT', 'Tip Diameter', 'LURE WEIGHT', 'Line Wt N F',
        'PE Line Size', 'Handle Length', 'Reel Seat Position', 'CONTENT CARBON',
        'Market Reference Price', 'AdminCode', 'Service Card', ' Jig Weight',
        'Squid Jig Size', 'Sinker Rating', 'created_at', 'updated_at', 'POWER',
        'LURE WEIGHT (oz)', 'Sale Price', 'Joint Type', 'Code Name', 'Fly Line',
        'Grip Type', 'Reel Size', 'Description', 'Extra Spec 1', 'Extra Spec 2',
    ],
    lureMaster: [
        'id', 'brand_id', 'model', 'model_cn', 'model_year', 'alias',
        'type_tips', 'system', 'water_column', 'action', 'images', 'created_at', 'updated_at', 'description',
    ],
};

module.exports = {
    BRAND_IDS,
    SHEET_NAMES,
    HEADERS,
};
