// pkgGear/pages/detail/detail.js
const app = getApp();
const apiService = require('../../../services/api');

const COMPARE_STORAGE_KEY = 'gear_compare_pool_v1';
const MAX_COMPARE_ITEMS = 3;
const BOOLEAN_DISPLAY_FIELDS = new Set(['is_sw_edition', 'is_handle_double']);
const LINK_DISPLAY_FIELDS = {
  EV_link: '爆炸图',
  Specs_link: '说明书'
};

const CORE_FIELDS_BY_TYPE = {
  reels: [
    'SKU',
    'GEAR RATIO',
    'WEIGHT',
    'MAX DRAG',
    'cm_per_turn',
    'spool_diameter_mm',
    'spool_depth_normalized',
    'brake_type_normalized',
    'size_family'
  ],
  rods: ['SKU', 'TOTAL LENGTH', 'Action', 'LURE WEIGHT', 'Line Wt N F', 'PE Line Size', 'PIECES', 'CLOSELENGTH'],
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
        'pe_no_m'
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
        'line_capacity_display',
        'handle_length_mm',
        'body_material',
        'handle_knob_type',
        'official_environment',
        'market_reference_price',
        'product_code',
        'EV_link',
        'Specs_link'
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
        'series_positioning',
        'main_selling_points'
      ]
    },
    {
      title: '玩家数据',
      subtitle: '来自用户沉淀数据，不能保证数据完全准确。',
      fields: ['player_environment', 'player_positioning', 'player_selling_points']
    }
  ],
  rods: [
    {
      title: '官网参数',
      subtitle: '厂家公布的装备参数规格。',
      fields: [
        'SKU',
        'TOTAL LENGTH',
        'Action',
        'LURE WEIGHT',
        'Line Wt N F',
        'PE Line Size',
        'PIECES',
        'CLOSELENGTH',
        'Tip Diameter',
        'Handle Length',
        'CONTENT CARBON',
        'Reel Seat Position',
        'Service Card',
        'Jig Weight',
        'Squid Jig Size',
        'Sinker Rating',
        'official_reference_price',
        'market_status',
        'Description',
        'EV_link',
        'Specs_link'
      ]
    },
    {
      title: 'GearSage 整理',
      subtitle: '把原始参数转成更容易筛选和比较的判断。',
      fields: [
        'type_tips',
        'fit_style_tags',
        'min_lure_weight_hint',
        'solidTip',
        'series_positioning',
        'main_selling_points'
      ]
    },
    {
      title: '玩家数据',
      subtitle: '来自用户沉淀数据，不能保证数据完全准确。',
      fields: ['player_positioning', 'player_selling_points']
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
      title: '玩家数据',
      subtitle: '来自用户沉淀数据，不能保证数据完全准确。',
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
      title: '玩家数据',
      subtitle: '来自用户沉淀数据，不能保证数据完全准确。',
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
      title: '玩家数据',
      subtitle: '来自用户沉淀数据，不能保证数据完全准确。',
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
    coreSpecs: [],
    specSections: [],
    sectionCopy: {},
    infoTags: [],
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
      size_family: '尺寸家族',
      Nylon_no_m: '尼龙线(号-m)',
      Nylon_lb_m: '尼龙线(lb-m)',
      handle_length_mm: '手把长(mm)',
      'TOTAL LENGTH': '全长(m)',
      Action: '调性',
      PIECES: '节数',
      CLOSELENGTH: '收纳长(cm)',
      'Tip Diameter': '先径(mm)',
      'LURE WEIGHT': '饵重(g)',
      'Line Wt N F': '尼/氟线(lb)',
      'PE Line Size': 'PE线(号)',
      'Handle Length': '手把长(mm)',
      'CONTENT CARBON': '含碳量(%)',
      'Service Card': '首保价(元)',
      'Jig Weight': '铁板重(g)',
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
      body_material: '机身材质',
      handle_knob_type: '手把旋钮',
      official_environment: '官方场景',
      gear_ratio_normalized: '速比归类',
      handle_style: '手把形式',
      is_sw_edition: 'SW 版本',
      is_handle_double: '双摇臂',
      series_positioning: '系列定位',
      main_selling_points: '主要卖点',
      player_environment: '玩家场景',
      player_positioning: '玩家定位',
      player_selling_points: '玩家看点',
      official_reference_price: '官方参考价',
      market_status: '市场状态',
      Description: '说明',
      min_lure_weight_hint: '轻饵提示',
      solidTip: '实心竿稍',
      system: '系统',
      water_column: '泳层',
      action: '动作',
      family: '饵型家族',
      EV_link: '爆炸图',
      Specs_link: '说明书'
    },
    ignoredFields: [
      'created_at', 'updated_at', 'bearing_count_roller',
      'market_reference_price', 'product_code', 'AdminCode',
      'Market Reference Price', 'brand_id', 'reel_id', 'rod_id',
      'lure_id', 'line_id', 'hookId', 'id', '_id', '_openid', 'images', 'model',
      'model_cn', 'model_year', 'type', 'description',
      'official_specs', 'gsc_traits', 'compare_profile',
      '__key', '__displayName', '__secondaryLabel'
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
    const showBackToPost = options.from === 'topic' && !!options.postId;
    const sourcePostId = options.postId || '';

    this.setData({
      navBarHeight,
      gearType: type || '',
      showBackToPost,
      sourcePostId
    });

    this.loadDetail(id, type, gearModel);
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
      gear_ratio_normalized: ['gear_ratio_normalized', 'gearRatioNormalized'],
      is_sw_edition: ['is_sw_edition', 'isSwEdition'],
      is_handle_double: ['is_handle_double', 'isHandleDouble']
    };
    return aliases[key] || [key];
  },

  normalizeFieldValue(value, key = '') {
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
        pushTag(this.buildTagText('别名 ', item.alias));
      }
    } else if (this.data.gearType === 'rods') {
      pushTag(this.buildTagText('', item.type));
      pushTag(this.buildTagText('调性 ', item.action));
      pushTag(this.buildTagText('', item.type_tips));
    } else if (this.data.gearType === 'line') {
      pushTag(this.buildTagText('', item.type_tips));
      pushTag(this.buildTagText('别名 ', item.alias));
    } else if (this.data.gearType === 'hook') {
      pushTag(this.buildTagText('', item.type_tips));
      pushTag(this.buildTagText('别名 ', item.alias));
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
      __key: String(variant.id || variant.SKU || variant.sku || index),
      __displayName: this.resolveVariantName(variant, index),
      __secondaryLabel: this.buildVariantSecondaryLabel(variant)
    }));
  },

  findVariantByKey(variants, key) {
    return (variants || []).find((variant) => variant.__key === key) || null;
  },

  buildCoreSpecs(record, columns) {
    if (!record || typeof record !== 'object') return [];

    const preferredFields = CORE_FIELDS_BY_TYPE[this.data.gearType] || [];
    const specs = preferredFields
      .map((field) => ({
        key: field,
        label: this.getFieldLabel(field),
        value: this.getFieldValue(record, field)
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
        value: this.getFieldValue(record, column.key)
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

  buildLayerItems(fields, sources, usedFields) {
    const items = [];
    fields.forEach((field) => {
      const value = this.getFieldValueFromSources(sources, field);
      if (!this.hasValue(value)) return;
      usedFields.add(field);
      items.push({
        key: field,
        label: this.getFieldLabel(field),
        value: LINK_DISPLAY_FIELDS[field] ? '跳转' : value,
        isLink: !!LINK_DISPLAY_FIELDS[field],
        url: LINK_DISPLAY_FIELDS[field] ? value : ''
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
      '玩家数据': 'player'
    };
    const usedFields = new Set();
    const sections = layerConfig
      .map((group) => {
        const sourceKey = sourceKeyByTitle[group.title] || 'official';
        const items = this.buildLayerItems(group.fields || [], layerSources[sourceKey] || [], usedFields);
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
    const columns = this.generateDynamicColumns(variants);
    const selectedVariant = this.findVariantByKey(variants, selectedVariantKey) || variants[0] || null;
    const displayRecord = this.buildMergedSpecRecord(item, selectedVariant);

    return {
      columns,
      firstColumn: columns[0] || null,
      scrollColumns: columns.slice(1),
      selectedVariantKey: selectedVariant ? selectedVariant.__key : '',
      selectedVariant: selectedVariant || {},
      variantOptions: (variants || []).map((variant) => ({
        key: variant.__key,
        label: variant.__displayName,
        secondary: variant.__secondaryLabel
      })),
      sectionCopy: this.buildSectionCopy(),
      coreSpecs: this.buildCoreSpecs(displayRecord, columns),
      specSections: this.buildSpecSections(item, selectedVariant, columns),
      infoTags: this.buildInfoTags(item),
      canCompare: ['reels', 'rods'].includes(this.data.gearType) && !!selectedVariant
    };
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

  async loadDetail(id, type, gearModel = '') {
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
      const viewState = this.buildDetailViewState(item, variants, variants[0] ? variants[0].__key : '');

      this.setData({
        item: {
          ...item,
          variants,
          mainImage,
          detailName,
          brand_name: item.brand_name || ''
        },
        title: item.model,
        ...viewState
      });

      this.syncCompareState();
      this.fetchRelatedPosts();
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
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
      ...viewState
    });

    this.syncCompareState();
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
    this.setData({
      isExpanded: !this.data.isExpanded
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

    if (compareItems.length > 0) {
      const baseItem = compareItems[0];
      if (baseItem.gearType !== entry.gearType) {
        wx.showToast({
          title: '第一版只支持同类型比较',
          icon: 'none'
        });
        return;
      }
      if (baseItem.compareGroup && entry.compareGroup && baseItem.compareGroup !== entry.compareGroup) {
        wx.showToast({
          title: '先放同子类候选进对比池',
          icon: 'none'
        });
        return;
      }
    }

    if (compareItems.length >= MAX_COMPARE_ITEMS) {
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
      url: '/pkgGear/pages/compare/compare'
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

  generateDynamicColumns(variants) {
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
      if (!this.data.ignoredFields.includes(key)) {
        columns.push({
          key,
          label: this.getFieldLabel(key)
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
      'handle_length_mm'
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
