// pkgGear/pages/detail/detail.js
const app = getApp();
const apiService = require('../../../services/api');

const COMPARE_STORAGE_KEY = 'gear_compare_pool_v1';
const MAX_COMPARE_ITEMS = 3;

const CORE_FIELDS_BY_TYPE = {
  reels: ['SKU', 'GEAR RATIO', 'WEIGHT', 'MAX DRAG', 'DRAG', 'cm_per_turn', 'spool_diameter_per_turn_mm'],
  rods: ['SKU', 'TOTAL LENGTH', 'Action', 'LURE WEIGHT', 'Line Wt N F', 'PE Line Size', 'PIECES', 'CLOSELENGTH'],
  lures: ['SKU', 'TYPE', 'Length', 'Weight', 'Buoyancy', 'Range', 'Hook']
};

const SPEC_GROUPS_BY_TYPE = {
  reels: [
    { title: '基础识别', fields: ['SKU'] },
    { title: '核心性能', fields: ['GEAR RATIO', 'WEIGHT', 'MAX DRAG', 'DRAG', 'cm_per_turn'] },
    {
      title: '线杯与线量',
      fields: ['spool_diameter_per_turn_mm', 'Nylon_lb_m', 'Nylon_no_m', 'fluorocarbon_lb_m', 'fluorocarbon_no_m', 'pe_no_m']
    },
    { title: '结构补充', fields: ['handle_length_mm'] }
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
  ]
};

const SERIES_HINTS_BY_TYPE = {
  reels: '先看线杯深浅、速比和自重，再回头判断卸力与收线节奏，更容易排除不适合自己的候选。',
  rods: '先确认长度、强度、调性和饵重区间，再看节数与收纳长度，通常能更快看清使用方向。',
  lures: '鱼饵第一版仍以筛选和详情理解为主，正式对比页后置处理。'
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
    infoTags: [],
    seriesInsights: [],
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
      Hook: '钩型'
    },
    ignoredFields: [
      'created_at', 'updated_at', 'bearing_count_roller',
      'market_reference_price', 'product_code', 'AdminCode',
      'Market Reference Price', 'brand_id', 'reel_id', 'rod_id',
      'lure_id', 'id', '_id', '_openid', 'images', 'model',
      'model_cn', 'model_year', 'type', 'description',
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
    return this.normalizeText(record[key]);
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

    pushTag(this.buildTagText('', item.model_year));

    if (this.data.gearType === 'reels') {
      pushTag(this.buildTagText('', item.type));
      pushTag(this.buildTagText('', item.type_tips));
      pushTag(this.buildTagText('别名 ', item.alias));
    } else if (this.data.gearType === 'rods') {
      pushTag(this.buildTagText('', item.type));
      pushTag(this.buildTagText('调性 ', item.action));
      pushTag(this.buildTagText('', item.type_tips));
    } else {
      pushTag(this.buildTagText('', item.system));
      pushTag(this.buildTagText('', item.water_column));
      pushTag(this.buildTagText('', item.action));
    }

    return tags.slice(0, 4);
  },

  resolveVariantName(variant, index) {
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

  buildSpecSections(record, columns) {
    if (!record || typeof record !== 'object') return [];

    const groupConfig = SPEC_GROUPS_BY_TYPE[this.data.gearType] || [];
    const usedFields = new Set();
    const sections = groupConfig
      .map((group) => {
        const items = group.fields
          .map((field) => ({
            key: field,
            label: this.getFieldLabel(field),
            value: this.getFieldValue(record, field)
          }))
          .filter((item) => this.hasValue(item.value));

        items.forEach((item) => usedFields.add(item.key));
        return {
          title: group.title,
          items
        };
      })
      .filter((section) => section.items.length > 0);

    const remainingItems = (columns || [])
      .filter((column) => !usedFields.has(column.key))
      .map((column) => ({
        key: column.key,
        label: column.label,
        value: this.getFieldValue(record, column.key)
      }))
      .filter((item) => this.hasValue(item.value));

    if (remainingItems.length > 0) {
      sections.push({
        title: '其他规格',
        items: remainingItems
      });
    }

    return sections;
  },

  detectVariantDiffFields(variants) {
    const groupedFields = (SPEC_GROUPS_BY_TYPE[this.data.gearType] || []).reduce((acc, group) => {
      return acc.concat(group.fields || []);
    }, []);
    const candidates = [
      ...(CORE_FIELDS_BY_TYPE[this.data.gearType] || []),
      ...groupedFields
    ];

    return [...new Set(candidates)].filter((field) => {
      const values = (variants || [])
        .map((variant) => this.getFieldValue(variant, field))
        .filter((value) => this.hasValue(value));
      return values.length > 1 && new Set(values).size > 1;
    });
  },

  buildSeriesInsights(item, variants) {
    const insights = [];

    if (variants.length <= 1) {
      insights.push('当前系列已收录的子型号还不多，后续补齐后会更适合做完整对比。');
    } else {
      const diffFields = this.detectVariantDiffFields(variants);
      if (diffFields.length > 0) {
        const labels = diffFields.slice(0, 4).map((field) => this.getFieldLabel(field));
        insights.push(`这个系列当前最值得先看的差异是 ${labels.join(' / ')}。`);
      } else {
        insights.push('当前已收录的子型号之间，核心差异不算大，可以优先按使用场景和手感偏好继续排除。');
      }
    }

    if (this.hasValue(item.type_tips)) {
      insights.push(`系列定位可先按“${this.normalizeText(item.type_tips)}”来理解，再回头看细参数。`);
    }

    if (SERIES_HINTS_BY_TYPE[this.data.gearType]) {
      insights.push(SERIES_HINTS_BY_TYPE[this.data.gearType]);
    }

    return insights.slice(0, 3);
  },

  buildDetailViewState(item, variants, selectedVariantKey) {
    const columns = this.generateDynamicColumns(variants);
    const selectedVariant = this.findVariantByKey(variants, selectedVariantKey) || variants[0] || null;
    const displayRecord = selectedVariant || item || {};

    return {
      columns,
      selectedVariantKey: selectedVariant ? selectedVariant.__key : '',
      selectedVariant: selectedVariant || {},
      variantOptions: (variants || []).map((variant) => ({
        key: variant.__key,
        label: variant.__displayName,
        secondary: variant.__secondaryLabel
      })),
      coreSpecs: this.buildCoreSpecs(displayRecord, columns),
      specSections: this.buildSpecSections(displayRecord, columns),
      infoTags: this.buildInfoTags(item),
      seriesInsights: this.buildSeriesInsights(item, variants),
      canCompare: this.data.gearType !== 'lures' && !!selectedVariant
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
      masterId: Number(item.id),
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
        title: this.data.gearType === 'lures' ? '鱼饵正式对比页后置' : '当前还没有可加入对比的子型号',
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
    const gearItemId = Number(item.id || 0) || null;
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
    const gearItemId = Number((this.data.item && this.data.item.id) || 0);
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
      'spool_diameter_per_turn_mm', 'cm_per_turn',
      'Nylon_lb_m', 'Nylon_no_m', 'fluorocarbon_lb_m', 'fluorocarbon_no_m', 'pe_no_m',
      'handle_length_mm'
    ];

    columns.sort((a, b) => {
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
