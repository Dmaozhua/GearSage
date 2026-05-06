// pkgGear/pages/detail/detail.js
const app = getApp();
const apiService = require('../../../services/api');
const { techGlossary: reelTechGlossary } = require('../../utils/官网解释_text_simple');
const { techGlossary: rodTechGlossary } = require('../../utils/官网解释_text_simple_rod');

const COMPARE_STORAGE_KEY = 'gear_compare_pool_v1';
const MAX_COMPARE_ITEMS = 3;
const SERIES_COLUMN_WIDTH = 190;
const SERIES_ROW_HEIGHT = 72;
const SERIES_MAX_BODY_HEIGHT = 548;
const BOOLEAN_DISPLAY_FIELDS = new Set(['is_sw_edition', 'is_handle_double', 'is_compact_body']);
const HIDDEN_DETAIL_FIELDS = new Set([
  'custom_spool_compatibility',
  'custom_knob_compatibility',
  'body_material_tech',
  'product_technical',
  'guide_layout_type',
  'Extra Spec 1',
  'Extra Spec 2',
  'handle_knob_exchange_size',
  'main_selling_points',
  'main_gear_material',
  'usage_environment'
]);
const LINK_DISPLAY_FIELDS = {
  Specs_link: '说明书',
  EV_link: '爆炸图'
};
const CORE_FIELDS_BY_TYPE = {
  reels: [
    'SKU',
    'GEAR RATIO',
    'WEIGHT',
    'MAX DRAG',
    'cm_per_turn',
    'line_capacity_display',
    'spool_diameter_mm',
    'spool_depth_normalized',
    'brake_type_normalized',
    'size_family'
  ],
  rods: ['SKU', 'TYPE', 'POWER', 'TOTAL LENGTH', 'Action', 'LURE WEIGHT', 'Line Wt N F', 'PE Line Size', 'PIECES'],
  lures: ['SKU', 'TYPE', 'Length', 'Weight', 'Buoyancy', 'Range', 'Hook'],
  line: ['SKU', 'SIZE NO.', 'LENGTH(m)', 'MAX STRENGTH(lb)', 'MAX STRENGTH(kg)', 'COLOR', 'Market Reference Price'],
  hook: ['size', 'type', 'subType', 'quantityPerPack', 'coating']
};

const SPEC_GROUPS_BY_TYPE = {
  reels: [
    { title: '基础识别', fields: ['SKU', 'size_family'] },
    { title: '核心性能', fields: ['GEAR RATIO', 'WEIGHT', 'MAX DRAG', 'DRAG', 'cm_per_turn'] },
    {
      title: '线杯与线量',
      fields: [
        'spool_diameter_mm',
        'spool_width_mm',
        'spool_depth_normalized',
        'spool_diameter_per_turn_mm',
        'Nylon_lb_m',
        'Nylon_no_m',
        'fluorocarbon_lb_m',
        'fluorocarbon_no_m',
        'pe_no_m',
        'line_capacity_display'
      ]
    },
    { title: '制动与结构', fields: ['brake_type_normalized', 'handle_length_mm'] }
  ],
  rods: [
    { title: '基础识别', fields: ['SKU'] },
    {
      title: '核心性能',
      fields: ['TOTAL LENGTH', 'Action', 'LURE WEIGHT', 'Line Wt N F', 'PE Line Size']
    },
    {
      title: '结构规格',
      fields: ['PIECES', 'CLOSELENGTH', 'Tip Diameter', 'Handle Length', 'CONTENT CARBON', 'Reel Seat Position']
    },
    { title: '补充信息', fields: ['Service Card', 'Jig Weight', 'Squid Jig Size', 'Sinker Rating'] }
  ],
  lures: [
    { title: '基础识别', fields: ['SKU', 'TYPE'] },
    { title: '核心规格', fields: ['Length', 'Weight', 'Buoyancy', 'Range', 'Hook'] }
  ],
  line: [
    { title: '基础识别', fields: ['SKU', 'COLOR'] },
    {
      title: '核心规格',
      fields: ['SIZE NO.', 'LENGTH(m)', 'MAX STRENGTH(lb)', 'MAX STRENGTH(kg)', 'AVG STRENGTH(lb)', 'AVG STRENGTH(kg)']
    },
    {
      title: '补充信息',
      fields: ['Market Reference Price', 'AdminCode']
    }
  ],
  hook: [
    { title: '基础识别', fields: ['size', 'type', 'subType'] },
    { title: '核心规格', fields: ['quantityPerPack', 'coating', 'gapWidth'] },
    { title: '补充信息', fields: ['price', 'status', 'brand'] }
  ]
};

const SPEC_LAYERS_BY_TYPE = {
  reels: [
    {
      title: '官网参数',
      subtitle: '厂家公布的装备参数规格。',
      fields: [
        'SKU',
        'GEAR RATIO',
        'WEIGHT',
        'MAX DRAG',
        'DRAG',
        'cm_per_turn',
        'spool_diameter_mm',
        'spool_width_mm',
        'spool_diameter_per_turn_mm',
        'Nylon_lb_m',
        'Nylon_no_m',
        'fluorocarbon_lb_m',
        'fluorocarbon_no_m',
        'pe_no_m',
        'handle_length_mm',
        'bearing_count_roller',
        'body_material',
        'official_environment',
        'handle_knob_type',
        'handle_knob_material',
        'market_reference_price',
        'product_code',
        'battery_capacity',
        'battery_charge_time',
        'continuous_cast_count',
        'Specs_link',
        'EV_link'
      ]
    },
    {
      title: 'GearSage 整理',
      subtitle: '把原始参数转成更容易筛选和比较的判断。',
      fields: [
        'type_tips',
        'fit_style_tags',
        'size_family',
        'spool_depth_normalized',
        'gear_ratio_normalized',
        'brake_type_normalized',
        'handle_style',
        'is_sw_edition',
        'is_handle_double',
        'is_compact_body',
        'series_positioning',
        'main_selling_points'
      ]
    },
    {
      title: '深度玩家数据',
      subtitle: '来自用户沉淀数据，*不能保证数据完全准确。',
      fields: [
        'player_environment',
        'player_positioning',
        'player_selling_points',
        'drag_click',
        'min_lure_weight_hint',
        'knob_bearing_spec',
        'knob_size',
        'gear_material',
        'spool_weight_g',
        'usage_environment'
      ]
    }
  ],
  rods: [
    {
      title: '官网参数',
      subtitle: '厂家公布的装备参数规格。',
      fields: [
        'SKU',
        'TYPE',
        'TOTAL LENGTH',
        'WEIGHT',
        'POWER',
        'Action',
        'LURE WEIGHT',
        'LURE WEIGHT (oz)',
        'Line Wt N F',
        'PE Line Size',
        'PIECES',
        'CLOSELENGTH',
        'Tip Diameter',
        'Handle Length',
        'CONTENT CARBON',
        'Reel Seat Position',
        'Grip Type',
        'Joint Type',
        'Code Name',
        'Service Card',
        'Jig Weight',
        'Squid Jig Size',
        'Sinker Rating',
        'official_environment',
        'official_reference_price',
        'market_status',
        'Specs_link',
        'EV_link'
      ]
    },
    {
      title: 'GearSage 整理',
      subtitle: '把原始参数转成更容易筛选和比较的判断。',
      fields: [
        'type_tips',
        'fit_style_tags',
        'guide_use_hint',
        'recommended_rig_pairing',
        'solidTip',
        'series_positioning',
        'main_selling_points'
      ]
    },
    {
      title: '深度玩家数据',
      subtitle: '来自用户沉淀数据，*不能保证数据完全准确。',
      fields: ['player_environment', 'player_positioning', 'player_selling_points', 'min_lure_weight_hint', 'hook_keeper_included']
    }
  ],
  lures: [
    {
      title: '官网参数',
      subtitle: '厂家公布的装备参数规格。',
      fields: ['SKU', 'TYPE', 'Length', 'Weight', 'Buoyancy', 'Range', 'Hook']
    },
    {
      title: 'GearSage 整理',
      subtitle: '把原始参数转成更容易筛选和比较的判断。',
      fields: ['system', 'water_column', 'action', 'family', 'type_tips', 'fit_style_tags']
    },
    {
      title: '深度玩家数据',
      subtitle: '来自用户沉淀数据，*不能保证数据完全准确。',
      fields: ['player_positioning', 'player_selling_points']
    }
  ],
  line: [
    {
      title: '官网参数',
      subtitle: '厂家公布的装备参数规格。',
      fields: [
        'SKU',
        'COLOR',
        'SIZE NO.',
        'LENGTH(m)',
        'MAX STRENGTH(lb)',
        'MAX STRENGTH(kg)',
        'AVG STRENGTH(lb)',
        'AVG STRENGTH(kg)',
        'Market Reference Price'
      ]
    },
    {
      title: 'GearSage 整理',
      subtitle: '把原始参数转成更容易筛选和比较的判断。',
      fields: ['type_tips', 'fit_style_tags']
    },
    {
      title: '深度玩家数据',
      subtitle: '来自用户沉淀数据，*不能保证数据完全准确。',
      fields: ['player_positioning', 'player_selling_points']
    }
  ],
  hook: [
    {
      title: '官网参数',
      subtitle: '厂家公布的装备参数规格。',
      fields: ['sku', 'size', 'type', 'subType', 'quantityPerPack', 'coating', 'gapWidth', 'price', 'status', 'brand']
    },
    {
      title: 'GearSage 整理',
      subtitle: '把原始参数转成更容易筛选和比较的判断。',
      fields: ['type_tips', 'fit_style_tags']
    },
    {
      title: '深度玩家数据',
      subtitle: '来自用户沉淀数据，*不能保证数据完全准确。',
      fields: ['player_positioning', 'player_selling_points']
    }
  ]
};

Page({
  data: {
    isExpanded: false,
    navBarHeight: 0,
    title: '装备详情',
    item: {},
    columns: [],
    gearType: '',
    isDarkMode: false,
    selectedVariantKey: '',
    selectedVariant: {},
    variantOptions: [],
    showVariantFloat: false,
    variantFloatThreshold: 0,
    coreSpecs: [],
    techTerms: [],
    specSections: [],
    sectionCopy: {},
    infoTags: [],
    seriesDescription: '',
    variantDescription: '',
    isSeriesDescriptionExpanded: false,
    isVariantDescriptionExpanded: false,
    firstColumn: null,
    scrollColumns: [],
    seriesBodyWidth: 0,
    seriesBodyHeight: 0,
    compareCount: 0,
    isCurrentVariantCompared: false,
    canCompare: false,
    fieldLabels: {
      SKU: '子型号',
      sku: '子型号',
      'GEAR RATIO': '速比',
      DRAG: '实用卸力(kg)',
      'MAX DRAG': '最大卸力(kg)',
      WEIGHT: '自重(g)',
      fluorocarbon_no_m: '氟碳线(号-m)',
      fluorocarbon_lb_m: '氟碳线(lb-m)',
      pe_no_m: 'PE线(号-m)',
      cm_per_turn: '收线长(cm/圈)',
      spool_diameter_per_turn_mm: '线杯径/一转(mm)',
      spool_diameter_mm: '线杯直径φ(mm)',
      spool_width_mm: '线杯宽度(mm)',
      spool_depth_normalized: '线杯深度',
      brake_type_normalized: '刹车类型',
      size_family: '线杯尺寸',
      Nylon_no_m: '尼龙线(号-m)',
      Nylon_lb_m: '尼龙线(lb-m)',
      handle_length_mm: '手把长(mm)',
      'TOTAL LENGTH': '全长(m)',
      POWER: '硬度',
      Action: '调性',
      PIECES: '节数',
      CLOSELENGTH: '收纳长(cm)',
      'Tip Diameter': '先径(mm)',
      'LURE WEIGHT': '饵重(g)',
      'LURE WEIGHT (oz)': '饵重(oz)',
      'Line Wt N F': '尼/氟线(lb)',
      'PE Line Size': 'PE线(号)',
      'Handle Length': '手把长(mm)',
      'Grip Type': '握把类型',
      'CONTENT CARBON': '含碳量(%)',
      'Joint Type': '插节形式',
      'Code Name': '代号',
      'Service Card': '首保价(元)',
      'Jig Weight': '铁板重量',
      'Squid Jig Size': '木虾(号)',
      'Sinker Rating': '铅坠(号)',
      TYPE: '类别',
      'Reel Seat Position': '轮座位置',
      Length: '长度(mm)',
      Weight: '重量(g)',
      Buoyancy: '浮力',
      Range: '泳层',
      Hook: '钩型',
      COLOR: '颜色',
      'SIZE NO.': '线号',
      'LENGTH(m)': '长度(m)',
      'MAX STRENGTH(lb)': '最大强度(lb)',
      'MAX STRENGTH(kg)': '最大强度(kg)',
      'AVG STRENGTH(lb)': '平均强度(lb)',
      'AVG STRENGTH(kg)': '平均强度(kg)',
      'Market Reference Price': '官网标注价格',
      market_reference_price: '官网标注价格',
      product_code: '产品代码',
      battery_capacity: '电池容量',
      battery_charge_time: '充电时间',
      continuous_cast_count: '连续抛投次数',
      AdminCode: '编码',
      sku: '子型号',
      subType: '子类',
      gapWidth: '钩门宽度',
      coating: '涂层',
      size: '尺寸',
      quantityPerPack: '每包数量',
      price: '价格',
      status: '状态',
      brand: '品牌',
      type_tips: '类型标签',
      fit_style_tags: '适用风格',
      line_capacity_display: '线容量',
      bearing_count_roller: '轴承数',
      body_material: '机身材质',
      body_material_tech: '机身技术',
      product_technical: '核心技术',
      gear_material: '大齿材质',
      handle_knob_type: '握丸样式',
      handle_knob_material: '握丸材质',
      handle_knob_exchange_size: '握丸型号/尺寸',
      knob_bearing_spec: '握丸轴承规格',
      knob_size: '握丸尺寸',
      spool_weight_g: '原厂线杯重量(g)',
      drag_click: '原厂卸力报警',
      usage_environment: '主要使用环境',
      official_environment: '环境定位',
      gear_ratio_normalized: '速比',
      handle_style: '手把形式',
      is_sw_edition: 'SW 版本',
      is_handle_double: '双摇臂',
      is_compact_body: '精巧机身',
      series_positioning: '系列定位',
      main_selling_points: '主要卖点',
      guide_use_hint: '推荐方向',
      recommended_rig_pairing: '推荐搭配',
      player_environment: '玩家场景',
      player_positioning: '玩家定位',
      player_selling_points: '玩家看点',
      hook_keeper_included: '挂钩器',
      official_reference_price: '官方参考价',
      market_status: '市场状态',
      Description: '说明',
      min_lure_weight_hint: '启抛重量参考',
      solidTip: '实心竿稍',
      system: '系统',
      water_column: '泳层',
      action: '动作',
      family: '饵型家族',
      EV_link: '爆炸图',
      Specs_link: '说明书'
    },
    ignoredFields: [
      'created_at', 'updated_at',
      'market_reference_price', 'product_code', 'AdminCode',
      'Market Reference Price', 'brand_id', 'reel_id', 'rod_id',
      'lure_id', 'line_id', 'hookId', 'id', '_id', '_openid', 'images', 'model',
      'model_cn', 'model_year', 'type', 'description', 'Description',
      'official_specs', 'gsc_traits', 'compare_profile',
      '__key', '__displayName', '__secondaryLabel', '__displayValues'
    ],
    relatedTabs: [
      { id: 'experience', label: '长测评', type: 1 },
      { id: 'recommend', label: '好物速报', type: 0 },
      { id: 'question', label: '讨论&提问', type: 2 }
    ],
    currentRelatedTab: 0,
    relatedPosts: {
      experience: [],
      recommend: [],
      question: []
    },
    showBackToPost: false,
    sourcePostId: '',
    loadingRelated: false,
    activeTechTooltipKey: '',
    activeTechTermInfo: null,
    isLoading: true
  },

  resolveTopicGearCategory(type) {
    if (type === 'rods') return 'rod';
    if (type === 'reels') return 'reel';
    if (type === 'lures') return 'bait';
    if (type === 'line') return 'line';
    if (type === 'hook') return 'hook';
    return '';
  },

  onLoad(options) {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const statusBarHeight = windowInfo.statusBarHeight;
    const navBarHeight = statusBarHeight + 44;

    const isDarkMode = app.globalData.isDarkMode;
    this.setData({ isDarkMode });

    this.themeListener = (isDark) => {
      this.setData({ isDarkMode: isDark });
    };
    if (app.globalData.themeListeners) {
      app.globalData.themeListeners.push(this.themeListener);
    }

    const id = options.id;
    const type = options.type;
    const gearModel = options.gearModel ? decodeURIComponent(options.gearModel) : '';
    const variantKey = options.variantKey ? decodeURIComponent(options.variantKey) : '';
    const showBackToPost = options.from === 'topic' && !!options.postId;
    const sourcePostId = options.postId || '';

    this.setData({
      navBarHeight,
      gearType: type || '',
      showBackToPost,
      sourcePostId
    });

    this.loadDetail(id, type, gearModel, variantKey);
  },

  onShow() {
    this.syncCompareState();
  },

  onUnload() {
    if (app.globalData.themeListeners && this.themeListener) {
      const index = app.globalData.themeListeners.indexOf(this.themeListener);
      if (index > -1) {
        app.globalData.themeListeners.splice(index, 1);
      }
    }
  },

  normalizeText(value) {
    return String(value || '').trim();
  },

  hasValue(value) {
    return value !== undefined && value !== null && String(value).trim() !== '';
  },

  getFieldLabel(key) {
    return this.data.fieldLabels[key] || key;
  },

  getFieldValue(record, key) {
    if (!record || typeof record !== 'object') return '';
    const keyCandidates = this.resolveFieldCandidates(key);
    const sources = [record, record.official_specs, record.gsc_traits, record.compare_profile];

    for (const source of sources) {
      if (!source || typeof source !== 'object') continue;
      for (const candidate of keyCandidates) {
        if (!Object.prototype.hasOwnProperty.call(source, candidate)) continue;
        const rawValue = source[candidate];
        const normalized = this.normalizeFieldValue(rawValue, key);
        if (normalized) {
          return normalized;
        }
      }
    }

    return '';
  },

  getFieldValueFromSources(sources, key) {
    const keyCandidates = this.resolveFieldCandidates(key);
    for (const source of sources) {
      if (!source || typeof source !== 'object') continue;
      for (const candidate of keyCandidates) {
        if (!Object.prototype.hasOwnProperty.call(source, candidate)) continue;
        const normalized = this.normalizeFieldValue(source[candidate], key);
        if (normalized) {
          return normalized;
        }
      }
    }
    return '';
  },

  resolveFieldCandidates(key) {
    const aliases = {
      fit_style_tags: ['fit_style_tags', 'fitStyleTags'],
      spool_depth_normalized: ['spool_depth_normalized', 'spoolDepthNormalized', 'lineCupDepth'],
      brake_type_normalized: ['brake_type_normalized', 'brakeTypeNormalized'],
      size_family: ['size_family', 'sizeFamily'],
      min_lure_weight_hint: ['min_lure_weight_hint', 'minLureWeightHint'],
      type_tips: ['type_tips', 'typeTips'],
      water_column: ['water_column', 'waterColumn'],
      gear_material: ['gear_material', 'main_gear_material'],
      gear_ratio_normalized: ['gear_ratio_normalized', 'gearRatioNormalized'],
      is_sw_edition: ['is_sw_edition', 'isSwEdition'],
      is_handle_double: ['is_handle_double', 'isHandleDouble'],
      is_compact_body: ['is_compact_body', 'isCompactBody'],
      hook_keeper_included: ['hook_keeper_included', 'hookKeeperIncluded'],
      description: ['description', 'Description'],
      Description: ['Description', 'description']
    };
    return aliases[key] || [key];
  },

  normalizeFieldValue(value, key = '') {
    if (key === 'TYPE' && this.data.gearType === 'rods') {
      const text = value === 0 ? '0' : this.normalizeText(value);
      const upper = text.toUpperCase();
      if (upper === 'C') return '枪柄';
      if (upper === 'S') return '直柄';
      return text;
    }
    if (key === 'drag_click') {
      const text = value === 0 ? '0' : this.normalizeText(value);
      if (!text) return '';
      if (text === '1') return '自带';
      if (text === '0') return '无';
      return text;
    }
    if (key === 'hook_keeper_included') {
      const text = value === 0 ? '0' : this.normalizeText(value);
      return text === '1' ? '自带' : '';
    }
    if (BOOLEAN_DISPLAY_FIELDS.has(key)) {
      const text = value === 0 ? '0' : this.normalizeText(value);
      return text === '1' ? '是' : '-';
    }
    if (Array.isArray(value)) {
      const items = value.map((item) => this.normalizeText(item)).filter(Boolean);
      return items.length ? items.join(' / ') : '';
    }
    if (value && typeof value === 'object') {
      return '';
    }
    return value === 0 ? '0' : this.normalizeText(value);
  },

  formatSpecValue(value) {
    return this.hasValue(value) ? String(value) : '-';
  },

  buildTagText(label, value) {
    const text = this.normalizeText(value);
    if (!text) return '';
    return label ? `${label}${text}` : text;
  },

  buildInfoTags(item) {
    const tags = [];
    const pushTag = (text) => {
      const normalized = this.normalizeText(text);
      if (normalized && !tags.includes(normalized)) {
        tags.push(normalized);
      }
    };

    const traitTags = item && item.gsc_traits && Array.isArray(item.gsc_traits.fitStyleTags)
      ? item.gsc_traits.fitStyleTags
      : [];
    traitTags.forEach(pushTag);

    pushTag(this.buildTagText('', item.model_year));

    if (this.data.gearType === 'reels') {
      if (!traitTags.length) {
        pushTag(this.buildTagText('', item.type_tips));
      }
      if (tags.length < 4) {
        pushTag(this.buildTagText(' ', item.alias));
      }
    } else if (this.data.gearType === 'rods') {
      pushTag(this.buildTagText('', item.type));
      pushTag(this.buildTagText('调性 ', item.action));
      pushTag(this.buildTagText('', item.type_tips));
    } else if (this.data.gearType === 'line') {
      pushTag(this.buildTagText('', item.type_tips));
      pushTag(this.buildTagText(' ', item.alias));
    } else if (this.data.gearType === 'hook') {
      pushTag(this.buildTagText('', item.type_tips));
      pushTag(this.buildTagText(' ', item.alias));
    } else {
      pushTag(this.buildTagText('', item.system));
      pushTag(this.buildTagText('', item.water_column));
      pushTag(this.buildTagText('', item.action));
    }

    return tags.slice(0, 4);
  },

  resolveVariantName(variant, index) {
    if (this.data.gearType === 'hook') {
      return this.getFieldValue(variant, 'size') || this.getFieldValue(variant, 'sku') || `尺寸 ${index + 1}`;
    }
    return this.getFieldValue(variant, 'SKU') || this.getFieldValue(variant, 'sku') || `子型号 ${index + 1}`;
  },

  buildVariantSecondaryLabel(variant) {
    const parts = [];
    const pushPart = (field) => {
      const value = this.getFieldValue(variant, field);
      if (!value) return;
      parts.push(`${this.getFieldLabel(field)} ${value}`);
    };

    if (this.data.gearType === 'reels') {
      pushPart('GEAR RATIO');
      pushPart('WEIGHT');
    } else if (this.data.gearType === 'rods') {
      pushPart('TOTAL LENGTH');
      pushPart('Action');
    } else if (this.data.gearType === 'line') {
      pushPart('SIZE NO.');
      pushPart('MAX STRENGTH(lb)');
    } else if (this.data.gearType === 'hook') {
      pushPart('type');
      pushPart('subType');
      pushPart('quantityPerPack');
      pushPart('coating');
    } else {
      pushPart('Length');
      pushPart('Weight');
    }

    return parts.slice(0, 2).join(' / ');
  },

  decorateVariants(variants) {
    return (Array.isArray(variants) ? variants : []).map((variant, index) => ({
      ...variant,
      __displayValues: this.buildVariantDisplayValues(variant),
      __key: String(variant.id || variant.SKU || variant.sku || index),
      __displayName: this.resolveVariantName(variant, index),
      __secondaryLabel: this.buildVariantSecondaryLabel(variant)
    }));
  },

  buildVariantDisplayValues(variant) {
    return Object.keys(variant || {}).reduce((acc, key) => {
      const value = this.normalizeFieldValue(variant[key], key);
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});
  },

  findVariantByKey(variants, key) {
    return (variants || []).find((variant) => variant.__key === key) || null;
  },

  getDescriptionText(record) {
    return this.getFieldValueFromSources([record, record && record.official_specs], 'description');
  },

  splitTechTerms(value) {
    return this.normalizeText(value)
      .split(/\s*[\/／]\s*/)
      .map((term) => this.normalizeText(term))
      .filter(Boolean)
      .filter((term, index, terms) => terms.indexOf(term) === index);
  },

  getTechFieldKey() {
    if (this.data.gearType === 'rods') return 'product_technical';
    if (this.data.gearType === 'reels') return 'body_material_tech';
    return '';
  },

  getTechGlossary() {
    if (this.data.gearType === 'rods') return rodTechGlossary;
    if (this.data.gearType === 'reels') return reelTechGlossary;
    return {};
  },

  normalizeTechLookupKey(value) {
    return this.normalizeText(value)
      .toLowerCase()
      .replace(/[™®]/g, '')
      .replace(/[＋+]/g, '+')
      .replace(/[（）()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  getTechGlossaryEntry(term) {
    const key = this.normalizeText(term);
    const glossary = this.getTechGlossary();
    if (!key || !glossary) return null;
    if (glossary[key]) return glossary[key];

    const lookupKey = this.normalizeTechLookupKey(key);
    const matchedKey = Object.keys(glossary).find((entryKey) => this.normalizeTechLookupKey(entryKey) === lookupKey);
    return matchedKey ? glossary[matchedKey] : null;
  },

  buildTechTerms(record) {
    const techFieldKey = this.getTechFieldKey();
    if (!techFieldKey) return [];
    const rawValue = this.getFieldValue(record, techFieldKey);
    return this.splitTechTerms(rawValue).map((term, index) => {
      const entry = this.getTechGlossaryEntry(term) || {};
      const simpleText = this.normalizeText(entry.text_simple);
      const detailText = this.normalizeText(entry.text);
      return {
        key: `tech-${index}-${term}`,
        name: term,
        simpleText,
        detailText,
        hasInfo: !!(simpleText || detailText)
      };
    });
  },

  formatCoreSpecValue(field, value) {
    const text = this.normalizeText(value);
    if (field === 'size_family') {
      return text.replace(/级$/, '');
    }
    return text;
  },

  buildCoreSpecs(record, columns) {
    if (!record || typeof record !== 'object') return [];

    const preferredFields = CORE_FIELDS_BY_TYPE[this.data.gearType] || [];
    const specs = preferredFields
      .map((field) => ({
        key: field,
        label: this.getFieldLabel(field),
        value: this.formatCoreSpecValue(field, this.getFieldValue(record, field))
      }))
      .filter((item) => this.hasValue(item.value));

    if (specs.length > 0) {
      return specs;
    }

    return (columns || [])
      .slice(0, 6)
      .map((column) => ({
        key: column.key,
        label: column.label,
        value: this.formatCoreSpecValue(column.key, this.getFieldValue(record, column.key))
      }))
      .filter((item) => this.hasValue(item.value));
  },

  buildMergedSpecRecord(item, selectedVariant) {
    const master = item || {};
    const variant = selectedVariant || {};
    return {
      ...master,
      ...variant,
      official_specs: {
        ...(master.official_specs || {}),
        ...(variant.official_specs || {})
      },
      gsc_traits: {
        ...(master.gsc_traits || {}),
        ...(variant.gsc_traits || {})
      },
      compare_profile: {
        ...(master.compare_profile || {}),
        ...(variant.compare_profile || {})
      }
    };
  },

  buildSpecSources(item, selectedVariant) {
    const master = item || {};
    const variant = selectedVariant || {};
    return {
      official: [
        variant.official_specs,
        master.official_specs,
        variant,
        master
      ],
      gsc: [
        variant.gsc_traits,
        master.gsc_traits,
        variant.compare_profile,
        master.compare_profile,
        variant,
        master
      ],
      player: [
        variant,
        master
      ]
    };
  },

  getTechTooltip(field, value) {
    const entry = field === this.getTechFieldKey()
      ? this.getTechGlossaryEntry(value)
      : null;
    const text = entry ? this.normalizeText(entry.text_simple || entry.text) : '';
    const key = `${field}:${this.normalizeText(value)}`;
    return text ? { key, text } : null;
  },

  shouldHideDetailField(field, record) {
    if (HIDDEN_DETAIL_FIELDS.has(field)) {
      return true;
    }

    if (field === 'is_compact_body' && this.data.gearType === 'reels') {
      const reelType = this.normalizeText(record && record.type).toLowerCase();
      return reelType !== 'spinning';
    }

    const hiddenBaitcastingFields = new Set(['handle_style', 'is_sw_edition', 'is_handle_double']);
    if (!hiddenBaitcastingFields.has(field) || this.data.gearType !== 'reels') {
      return false;
    }
    const reelType = this.normalizeText(record && record.type).toLowerCase();
    return reelType === 'baitcasting' || reelType === 'drum' || reelType === 'conventional';
  },

  buildLayerItems(fields, sources, usedFields, record) {
    const items = [];
    fields.forEach((field) => {
      if (this.shouldHideDetailField(field, record)) {
        usedFields.add(field);
        return;
      }
      const fieldSources = field === 'min_lure_weight_hint'
        ? sources.concat(record.gsc_traits, record.compare_profile)
        : sources;
      const value = this.getFieldValueFromSources(fieldSources, field);
      if (!this.hasValue(value)) return;
      usedFields.add(field);
      const displayValue = this.formatCoreSpecValue(field, value);
      const tooltip = this.getTechTooltip(field, displayValue);
      items.push({
        key: field,
        label: this.getFieldLabel(field),
        value: LINK_DISPLAY_FIELDS[field] ? '跳转' : displayValue,
        isLink: !!LINK_DISPLAY_FIELDS[field],
        url: LINK_DISPLAY_FIELDS[field] ? value : '',
        hasTooltip: !!tooltip,
        tooltipKey: tooltip ? tooltip.key : '',
        tooltipText: tooltip ? tooltip.text : ''
      });
    });
    return items;
  },

  buildSpecSections(item, selectedVariant, columns) {
    const record = this.buildMergedSpecRecord(item, selectedVariant);
    if (!record || typeof record !== 'object') return [];

    const layerConfig = SPEC_LAYERS_BY_TYPE[this.data.gearType] || [];
    const layerSources = this.buildSpecSources(item, selectedVariant);
    const sourceKeyByTitle = {
      '官网参数': 'official',
      'GearSage 整理': 'gsc',
      '深度玩家数据': 'player'
    };
    const usedFields = new Set();
    const sections = layerConfig
      .map((group) => {
        const sourceKey = sourceKeyByTitle[group.title] || 'official';
        const items = this.buildLayerItems(group.fields || [], layerSources[sourceKey] || [], usedFields, record);
        return {
          title: group.title,
          subtitle: group.subtitle || '',
          items
        };
      })
      .filter((section) => section.items.length > 0);

    const groupConfig = SPEC_GROUPS_BY_TYPE[this.data.gearType] || [];
    groupConfig.forEach((group) => {
      (group.fields || []).forEach((field) => usedFields.add(field));
    });

    const remainingItems = (columns || [])
      .filter((column) => !usedFields.has(column.key))
      .filter((column) => !this.shouldHideDetailField(column.key, record))
      .map((column) => ({
        key: column.key,
        label: column.label,
        value: this.getFieldValueFromSources([record.official_specs, record], column.key)
      }))
      .filter((item) => this.hasValue(item.value));

    if (remainingItems.length > 0) {
      sections.push({
        title: '其他参数',
        subtitle: '暂未归入固定层级的补充字段。',
        items: remainingItems
      });
    }

    return sections;
  },

  buildDetailViewState(item, variants, selectedVariantKey) {
    const columns = this.generateDynamicColumns(variants, item);
    const selectedVariant = this.findVariantByKey(variants, selectedVariantKey) || variants[0] || null;
    const displayRecord = this.buildMergedSpecRecord(item, selectedVariant);
    const seriesDescription = this.getDescriptionText(item);
    const selectedVariantDescription = this.getDescriptionText(selectedVariant);
    const variantDescription = selectedVariantDescription && selectedVariantDescription !== seriesDescription
      ? selectedVariantDescription
      : '';
    const scrollColumns = columns.slice(1);
    const seriesBodyWidth = (columns[0] ? 180 : 0) + scrollColumns.length * SERIES_COLUMN_WIDTH;
    const seriesBodyHeight = this.getSeriesBodyHeight((variants || []).length, false);

    return {
      columns,
      firstColumn: columns[0] || null,
      scrollColumns,
      seriesBodyWidth,
      seriesBodyHeight,
      selectedVariantKey: selectedVariant ? selectedVariant.__key : '',
      selectedVariant: selectedVariant || {},
      variantOptions: (variants || []).map((variant) => ({
        key: variant.__key,
        label: variant.__displayName,
        secondary: variant.__secondaryLabel
      })),
      sectionCopy: this.buildSectionCopy(),
      coreSpecs: this.buildCoreSpecs(displayRecord, columns),
      techTerms: this.buildTechTerms(displayRecord),
      specSections: this.buildSpecSections(item, selectedVariant, columns),
      infoTags: this.buildInfoTags(item),
      seriesDescription,
      variantDescription,
      canCompare: ['reels', 'rods'].includes(this.data.gearType) && !!selectedVariant
    };
  },

  getSeriesBodyHeight(variantCount, isExpanded) {
    const visibleVariantCount = isExpanded ? variantCount : Math.min(variantCount, 4);
    return Math.min(visibleVariantCount * SERIES_ROW_HEIGHT, SERIES_MAX_BODY_HEIGHT);
  },

  noop() {
    return false;
  },

  buildSectionCopy() {
    if (this.data.gearType === 'hook') {
      return {
        variantTitle: '选尺寸',
        variantSubtitle: '同款鱼钩通常先按尺寸选，再看钩型、涂层和一包数量。',
        coreTitle: '基本参数',
        coreSubtitle: '',
        specTitle: '完整参数',
        specSubtitle: '',
        seriesTitle: '子型号列表',
        seriesSubtitle: '子型号数据横向对比。'
      };
    }

    if (this.data.gearType === 'line') {
      return {
        variantTitle: '选线号规格',
        variantSubtitle: '先确定线号、长度和强度，后面的参数按这个规格切换。',
        coreTitle: '基本参数',
        coreSubtitle: '',
        specTitle: '完整参数',
        specSubtitle: '',
        seriesTitle: '子型号列表',
        seriesSubtitle: '子型号数据横向对比。'
      };
    }

    return {
      variantTitle: '具体型号',
      variantSubtitle: '选择型号，切换显示具体参数。',
      coreTitle: '基本参数',
      coreSubtitle: '',
      specTitle: '完整参数',
      specSubtitle: '',
      seriesTitle: '子型号列表',
      seriesSubtitle: '子型号数据横向对比。'
    };
  },

  async loadDetail(id, type, gearModel = '', variantKey = '') {
    this.setData({ isLoading: true });

    try {
      const item = await apiService.getGearDetail({
        id,
        type,
        gearModel
      });
      if (!item) throw new Error('Item not found');

      let detailName = item.displayName || item.model || '';
      if (!detailName) {
        detailName = item.model || '';
        if (item.model_year) detailName = `${item.model_year} ${detailName}`;
        if (item.model_cn) detailName = `${detailName} ${item.model_cn}`;
      }

      const images = Array.isArray(item.images) ? item.images : [];
      const mainImage = images[0] || item.imageUrl || '/images/empty.png';
      const variants = this.decorateVariants(item.variants || []);
      const selectedVariantKey = this.normalizeText(variantKey) || (variants[0] ? variants[0].__key : '');
      const viewState = this.buildDetailViewState(item, variants, selectedVariantKey);

      this.setData({
        item: {
          ...item,
          variants,
          mainImage,
          detailName,
          brand_name: item.brand_name || ''
        },
        title: item.model,
        isSeriesDescriptionExpanded: false,
        isVariantDescriptionExpanded: false,
        ...viewState
      }, () => {
        this.scheduleMeasureVariantFloat();
      });

      this.syncCompareState();
      this.fetchRelatedPosts();
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false }, () => {
        this.scheduleMeasureVariantFloat();
      });
    }
  },

  onVariantSelect(e) {
    const selectedVariantKey = e.currentTarget.dataset.key;
    if (!selectedVariantKey || selectedVariantKey === this.data.selectedVariantKey) return;

    const viewState = this.buildDetailViewState(
      this.data.item,
      this.data.item.variants || [],
      selectedVariantKey
    );

    this.setData({
      isExpanded: false,
      isVariantDescriptionExpanded: false,
      activeTechTooltipKey: '',
      activeTechTermInfo: null,
      ...viewState
    });

    this.syncCompareState();
  },

  scheduleMeasureVariantFloat() {
    const runMeasure = () => this.measureVariantFloatThreshold();
    if (wx.nextTick) {
      wx.nextTick(runMeasure);
      return;
    }
    setTimeout(runMeasure, 0);
  },

  measureVariantFloatThreshold() {
    if (!this.data.variantOptions.length) {
      this.setData({
        showVariantFloat: false,
        variantFloatThreshold: 0
      });
      return;
    }

    const query = wx.createSelectorQuery().in(this);
    query.select('#variantSelectorAnchor').boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec((res) => {
      const rect = res && res[0];
      const viewport = res && res[1];
      if (!rect) return;

      const scrollTop = this.lastPageScrollTop || (viewport && viewport.scrollTop) || 0;
      const threshold = Math.max(0, scrollTop + rect.top - this.data.navBarHeight);
      const showVariantFloat = scrollTop > threshold;
      this.setData({
        variantFloatThreshold: threshold,
        showVariantFloat
      });
    });
  },

  onPageScroll(e) {
    const scrollTop = (e && e.scrollTop) || 0;
    this.lastPageScrollTop = scrollTop;

    const shouldShow =
      this.data.variantOptions.length > 0 &&
      this.data.variantFloatThreshold > 0 &&
      scrollTop > this.data.variantFloatThreshold;

    if (shouldShow !== this.data.showVariantFloat) {
      this.setData({ showVariantFloat: shouldShow });
    }
  },

  toggleSeriesDescription() {
    this.setData({
      isSeriesDescriptionExpanded: !this.data.isSeriesDescriptionExpanded
    });
  },

  toggleVariantDescription() {
    this.setData({
      isVariantDescriptionExpanded: !this.data.isVariantDescriptionExpanded
    });
  },

  onTechTermTap(e) {
    const key = this.normalizeText(e.currentTarget.dataset.key);
    if (!key) return;
    const nextKey = this.data.activeTechTooltipKey === key ? '' : key;
    const activeTechTermInfo = nextKey
      ? (this.data.techTerms || []).find((term) => term.key === nextKey) || null
      : null;
    this.setData({
      activeTechTooltipKey: nextKey,
      activeTechTermInfo
    });
  },

  hideTechTooltip() {
    if (!this.data.activeTechTooltipKey) return;
    this.setData({
      activeTechTooltipKey: '',
      activeTechTermInfo: null
    });
  },

  onSpecLinkTap(e) {
    const url = this.normalizeText(e.currentTarget.dataset.url);
    if (!url) {
      wx.showToast({ title: '暂无链接', icon: 'none' });
      return;
    }

    if (/\.(pdf)(\?|#|$)/i.test(url)) {
      wx.showLoading({ title: '打开中' });
      wx.downloadFile({
        url,
        success: (res) => {
          if (res.statusCode === 200 && res.tempFilePath) {
            wx.openDocument({
              filePath: res.tempFilePath,
              showMenu: true,
              fail: () => this.copySpecLink(url)
            });
            return;
          }
          this.copySpecLink(url);
        },
        fail: () => this.copySpecLink(url),
        complete: () => wx.hideLoading()
      });
      return;
    }

    if (/\.(png|jpe?g|webp)(\?|#|$)/i.test(url)) {
      wx.previewImage({
        urls: [url],
        current: url,
        fail: () => this.copySpecLink(url)
      });
      return;
    }

    this.copySpecLink(url);
  },

  copySpecLink(url) {
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'none' });
      }
    });
  },

  toggleExpand() {
    const nextExpanded = !this.data.isExpanded;
    this.setData({
      isExpanded: nextExpanded,
      seriesBodyHeight: this.getSeriesBodyHeight((this.data.item.variants || []).length, nextExpanded)
    });
  },

  getCompareItems() {
    const stored = wx.getStorageSync(COMPARE_STORAGE_KEY);
    return Array.isArray(stored) ? stored : [];
  },

  saveCompareItems(items) {
    wx.setStorageSync(COMPARE_STORAGE_KEY, items);
  },

  buildCompareEntry() {
    const { item, selectedVariant, gearType, canCompare } = this.data;
    if (!canCompare || !item || !selectedVariant || !selectedVariant.__key) return null;

    const compareGroup = this.normalizeText(item.type || item.system || gearType);
    const compareGroupLabel = compareGroup || gearType;

    return {
      key: `${gearType}:${item.id}:${selectedVariant.__key}`,
      gearType,
      compareGroup,
      compareGroupLabel,
      masterId: this.normalizeText(item.id),
      masterName: this.normalizeText(item.detailName || item.model),
      brandName: this.normalizeText(item.brand_name),
      variantKey: selectedVariant.__key,
      variantLabel: this.normalizeText(selectedVariant.__displayName),
      imageUrl: item.mainImage || '',
      addedAt: Date.now()
    };
  },

  syncCompareState() {
    const compareItems = this.getCompareItems();
    const currentEntry = this.buildCompareEntry();
    const scopedCount = compareItems.filter((item) => item && item.gearType === this.data.gearType).length;
    this.setData({
      compareCount: scopedCount,
      isCurrentVariantCompared: !!(currentEntry && compareItems.some((item) => item.key === currentEntry.key))
    });
  },

  onToggleCompare() {
    if (!this.data.canCompare) {
      wx.showToast({
        title: this.data.gearType === 'lures'
          ? '鱼饵先看参数和经验内容'
          : this.data.gearType === 'line'
            ? '鱼线先看规格和经验内容'
            : this.data.gearType === 'hook'
              ? '鱼钩先看尺寸和经验内容'
            : '当前还没有可对比的子型号',
        icon: 'none'
      });
      return;
    }

    const entry = this.buildCompareEntry();
    if (!entry) return;

    const compareItems = this.getCompareItems();
    const scopedItems = compareItems.filter((item) => item && item.gearType === entry.gearType);
    const existingIndex = compareItems.findIndex((item) => item.key === entry.key);

    if (existingIndex >= 0) {
      compareItems.splice(existingIndex, 1);
      this.saveCompareItems(compareItems);
      this.syncCompareState();
      wx.showToast({
        title: '已移出对比池',
        icon: 'none'
      });
      return;
    }

    if (scopedItems.length > 0) {
      const baseItem = scopedItems[0];
      if (baseItem.compareGroup && entry.compareGroup && baseItem.compareGroup !== entry.compareGroup) {
        wx.showToast({
          title: '先放同子类候选进对比池',
          icon: 'none'
        });
        return;
      }
    }

    if (scopedItems.length >= MAX_COMPARE_ITEMS) {
      wx.showToast({
        title: '第一版最多先放 3 个候选',
        icon: 'none'
      });
      return;
    }

    compareItems.push(entry);
    this.saveCompareItems(compareItems);
    this.syncCompareState();
    wx.showToast({
      title: '已加入对比池',
      icon: 'none'
    });
  },

  onGoCompare() {
    if (this.data.compareCount < 2) {
      wx.showToast({
        title: '至少 2 个候选再开始对比',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pkgGear/pages/compare/compare?type=${this.data.gearType}`
    });
  },

  async fetchRelatedPosts() {
    const { item, currentRelatedTab, relatedTabs } = this.data;
    const gearModel = String(item.model || '').trim();
    const gearItemId = this.normalizeText(item.id) || null;
    const gearCategory = this.resolveTopicGearCategory(this.data.gearType);
    if (!gearModel && gearItemId === null) return;

    const tab = relatedTabs[currentRelatedTab];
    const typeKey = tab.id;

    this.setData({ loadingRelated: true });
    console.log('[gear detail] fetchRelatedPosts query:', {
      topicCategory: tab.type,
      gearType: this.data.gearType,
      gearCategory,
      gearModel,
      gearItemId
    });

    try {
      const res = await apiService.getAllTopics({
        topicCategory: tab.type,
        gearCategory,
        gearModel,
        gearItemId,
        limit: 5
      });

      if (Array.isArray(res)) {
        this.setData({
          [`relatedPosts.${typeKey}`]: res
        });
      }
    } catch (e) {
      console.error('Fetch related posts failed', e);
      this.setData({
        [`relatedPosts.${typeKey}`]: []
      });
    } finally {
      this.setData({ loadingRelated: false });
    }
  },

  onRelatedTabChange(e) {
    const index = e.currentTarget.dataset.index;
    if (index === this.data.currentRelatedTab) return;

    this.setData({ currentRelatedTab: index }, () => {
      const tab = this.data.relatedTabs[index];
      if (this.data.relatedPosts[tab.id].length === 0) {
        this.fetchRelatedPosts();
      }
    });
  },

  onRelatedPostTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: `/pkgContent/detail/detail?id=${id}`
      });
    }
  },

  onBackToSourcePost() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1
      });
      return;
    }

    if (this.data.sourcePostId) {
      wx.navigateTo({
        url: `/pkgContent/detail/detail?id=${this.data.sourcePostId}`
      });
    }
  },

  onGoRecommend() {
    const gearCategory = this.resolveTopicGearCategory(this.data.gearType);
    const gearItemId = this.normalizeText(this.data.item && this.data.item.id);
    const detailName = String((this.data.item && (this.data.item.detailName || this.data.item.model)) || '').trim();
    const brandName = String((this.data.item && this.data.item.brand_name) || '').trim();
    const gearLabel = [brandName, detailName].filter(Boolean).join(' ').trim() || detailName;

    if (!gearCategory || !gearItemId) {
      wx.showToast({
        title: '暂时无法带入这件装备',
      icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pkgContent/publishMode/publishMode?from=gear_detail&gearCategory=${encodeURIComponent(gearCategory)}&gearItemId=${gearItemId}&gearLabel=${encodeURIComponent(gearLabel)}`
    });
  },

  generateDynamicColumns(variants, item = {}) {
    if (!variants || variants.length === 0) return [];

    const keys = new Set();
    variants.forEach((variant) => {
      Object.keys(variant).forEach((key) => {
        if (variant[key] !== null && variant[key] !== undefined && variant[key] !== '') {
          keys.add(key);
        }
      });
    });

    const columns = [];

    keys.forEach((key) => {
      if (this.data.gearType === 'hook' && key === 'sku') {
        return;
      }
      if (this.shouldHideDetailField(key, item)) {
        return;
      }
      if (!this.data.ignoredFields.includes(key)) {
        columns.push({
          key,
          label: this.getFieldLabel(key),
          isLink: !!LINK_DISPLAY_FIELDS[key]
        });
      }
    });

    const preferredOrder = [
      'SKU', 'GEAR RATIO', 'DRAG', 'MAX DRAG', 'WEIGHT',
      'TOTAL LENGTH', 'Action', 'PIECES', 'Length', 'Weight', 'Buoyancy',
      'SIZE NO.', 'LENGTH(m)', 'MAX STRENGTH(lb)', 'MAX STRENGTH(kg)', 'COLOR', 'Market Reference Price', 'AdminCode',
      'sku', 'type', 'subType', 'size', 'quantityPerPack', 'coating', 'gapWidth', 'price', 'status',
      'spool_diameter_mm', 'spool_width_mm', 'spool_depth_normalized', 'brake_type_normalized', 'size_family',
      'spool_diameter_per_turn_mm', 'cm_per_turn',
      'Nylon_lb_m', 'Nylon_no_m', 'fluorocarbon_lb_m', 'fluorocarbon_no_m', 'pe_no_m',
      'handle_length_mm',
      'Specs_link', 'EV_link'
    ];

    columns.sort((a, b) => {
      const hookOrder = ['size', 'type', 'subType', 'quantityPerPack', 'coating', 'gapWidth', 'price', 'status'];
      if (this.data.gearType === 'hook') {
        const hookIndexA = hookOrder.indexOf(a.key);
        const hookIndexB = hookOrder.indexOf(b.key);
        if (hookIndexA !== -1 && hookIndexB !== -1) return hookIndexA - hookIndexB;
        if (hookIndexA !== -1) return -1;
        if (hookIndexB !== -1) return 1;
        if (a.key === 'sku') return 1;
        if (b.key === 'sku') return -1;
      }

      const indexA = preferredOrder.indexOf(a.key);
      const indexB = preferredOrder.indexOf(b.key);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      return a.label.localeCompare(b.label);
    });

    return columns;
  }
});
