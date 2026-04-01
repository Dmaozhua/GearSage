const app = getApp();
const apiService = require('../../../services/api');

const COMPARE_STORAGE_KEY = 'gear_compare_pool_v1';
const CORE_FIELDS_BY_TYPE = {
  reels: ['SKU', 'GEAR RATIO', 'WEIGHT', 'MAX DRAG', 'DRAG', 'cm_per_turn', 'spool_diameter_per_turn_mm'],
  rods: ['SKU', 'TOTAL LENGTH', 'Action', 'LURE WEIGHT', 'Line Wt N F', 'PE Line Size', 'PIECES', 'CLOSELENGTH']
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
  ]
};

Page({
  data: {
    navBarHeight: 0,
    isDarkMode: false,
    isLoading: true,
    compareItems: [],
    compareCards: [],
    compareTitle: '装备对比',
    compareType: '',
    compareCount: 0,
    compareWarnings: [],
    compareInsights: [],
    coreRows: [],
    specSections: [],
    showAllSpecs: false,
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
      type: '类别',
      system: '体系',
      action: '动作'
    }
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const navBarHeight = windowInfo.statusBarHeight + 44;
    const isDarkMode = app.globalData.isDarkMode;
    this.setData({ navBarHeight, isDarkMode });

    this.themeListener = (isDark) => this.setData({ isDarkMode: isDark });
    if (app.globalData.themeListeners) {
      app.globalData.themeListeners.push(this.themeListener);
    }
  },

  onShow() {
    this.loadCompareData();
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

  getCompareItems() {
    const stored = wx.getStorageSync(COMPARE_STORAGE_KEY);
    return Array.isArray(stored) ? stored : [];
  },

  saveCompareItems(items) {
    wx.setStorageSync(COMPARE_STORAGE_KEY, items);
  },

  resolveTopicGearCategory(type) {
    if (type === 'rods') return 'rod';
    if (type === 'reels') return 'reel';
    if (type === 'lures') return 'bait';
    return '';
  },

  resolveCompareTitle(type) {
    if (type === 'rods') return '鱼竿对比';
    if (type === 'reels') return '渔轮对比';
    return '装备对比';
  },

  resolveVariantName(variant, index) {
    return this.getFieldValue(variant, 'SKU') || this.getFieldValue(variant, 'sku') || `子型号 ${index + 1}`;
  },

  decorateVariants(variants) {
    return (Array.isArray(variants) ? variants : []).map((variant, index) => ({
      ...variant,
      __key: String(variant.id || variant.SKU || variant.sku || index),
      __displayName: this.resolveVariantName(variant, index)
    }));
  },

  findSelectedVariant(variants, entry) {
    if (!entry) return variants[0] || null;
    const byKey = variants.find((variant) => variant.__key === entry.variantKey);
    if (byKey) return byKey;
    const byLabel = variants.find((variant) => variant.__displayName === entry.variantLabel);
    return byLabel || variants[0] || null;
  },

  async hydrateCompareCard(entry) {
    try {
      const detail = await apiService.getGearDetail({
        id: entry.masterId,
        type: entry.gearType
      });
      if (!detail) return null;

      const variants = this.decorateVariants(detail.variants || []);
      const selectedVariant = this.findSelectedVariant(variants, entry);
      if (!selectedVariant) return null;

      const images = Array.isArray(detail.images) ? detail.images : [];
      const imageUrl = images[0] || detail.imageUrl || entry.imageUrl || '/images/default-gear.png';
      const masterLabel = this.normalizeText(detail.displayName || detail.model);
      const brandName = this.normalizeText(detail.brand_name || entry.brandName);
      const compareGroup = this.normalizeText(detail.type || detail.system || entry.compareGroup);

      return {
        ...entry,
        imageUrl,
        brandName,
        masterLabel,
        selectedVariant,
        compareGroup,
        compareGroupLabel: compareGroup || entry.compareGroupLabel || '',
        compareLabel: [brandName, selectedVariant.__displayName].filter(Boolean).join(' ').trim(),
        detail
      };
    } catch (error) {
      console.error('[gear compare] hydrateCompareCard failed:', error);
      return null;
    }
  },

  buildCompareWarnings(compareCards) {
    const warnings = [];
    const typeSet = [...new Set(compareCards.map((item) => item.gearType).filter(Boolean))];
    if (typeSet.length > 1) {
      warnings.push('当前候选里混入了不同装备类型。第一版对比只适合同类型候选。');
    }

    const groupSet = [...new Set(compareCards.map((item) => item.compareGroup).filter(Boolean))];
    if (groupSet.length > 1) {
      warnings.push('这几项的子类方向并不完全一致，先确认是不是把不同用途的候选放到一起了。');
    }

    return warnings;
  },

  buildCompareRows(fields, compareCards) {
    return fields
      .map((field) => {
        const values = compareCards.map((card) => this.getFieldValue(card.selectedVariant, field));
        const normalizedValues = values.filter((value) => this.hasValue(value));
        const uniqueValues = [...new Set(normalizedValues)];
        return {
          key: field,
          label: this.getFieldLabel(field),
          values,
          hasValue: normalizedValues.length > 0,
          isDifferent: uniqueValues.length > 1
        };
      })
      .filter((row) => row.hasValue);
  },

  buildSpecSections(compareType, compareCards) {
    const groupConfig = SPEC_GROUPS_BY_TYPE[compareType] || [];
    return groupConfig
      .map((group) => {
        const rows = this.buildCompareRows(group.fields, compareCards);
        return {
          title: group.title,
          rows,
          visibleDiffCount: rows.filter((row) => row.isDifferent).length
        };
      })
      .filter((section) => section.rows.length > 0);
  },

  buildCompareInsights(compareCards, coreRows, warnings) {
    const insights = [];

    const diffCoreLabels = coreRows.filter((row) => row.isDifferent).map((row) => row.label);
    if (diffCoreLabels.length > 0) {
      insights.push(`这几个候选最值得先看的差异是 ${diffCoreLabels.slice(0, 4).join(' / ')}。`);
    } else {
      insights.push('当前候选在核心参数上差异不大，可以继续结合手感、场景和帖子经验判断。');
    }

    if (!warnings.length && compareCards.length >= 2) {
      insights.push('这页只负责把差异摊开，不会替你直接下购买结论。看完还纠结，再带着候选去求推荐会更有效。');
    }

    const groups = [...new Set(compareCards.map((item) => item.compareGroupLabel).filter(Boolean))];
    if (groups.length === 1) {
      insights.push(`当前候选都属于「${groups[0]}」方向，更适合做同类收敛式比较。`);
    }

    return insights.slice(0, 3);
  },

  async loadCompareData() {
    this.setData({ isLoading: true });

    const compareItems = this.getCompareItems().slice(0, 3);
    if (!compareItems.length) {
      this.setData({
        isLoading: false,
        compareItems: [],
        compareCards: [],
        compareCount: 0,
        compareWarnings: [],
        compareInsights: [],
        coreRows: [],
        specSections: [],
        compareType: '',
        compareTitle: '装备对比'
      });
      return;
    }

    const compareType = this.normalizeText(compareItems[0].gearType) || 'reels';
    const compareCards = (await Promise.all(compareItems.map((item) => this.hydrateCompareCard(item)))).filter(Boolean);
    const warnings = this.buildCompareWarnings(compareCards);
    const coreRows = this.buildCompareRows(CORE_FIELDS_BY_TYPE[compareType] || [], compareCards);
    const specSections = this.buildSpecSections(compareType, compareCards);
    const insights = this.buildCompareInsights(compareCards, coreRows, warnings);

    this.setData({
      isLoading: false,
      compareItems,
      compareCards,
      compareCount: compareCards.length,
      compareWarnings: warnings,
      compareInsights: insights,
      coreRows,
      specSections,
      compareType,
      compareTitle: this.resolveCompareTitle(compareType)
    });
  },

  toggleShowAllSpecs() {
    this.setData({
      showAllSpecs: !this.data.showAllSpecs
    });
  },

  onRemoveCompareItem(e) {
    const key = e.currentTarget.dataset.key;
    if (!key) return;
    const nextItems = this.getCompareItems().filter((item) => item.key !== key);
    this.saveCompareItems(nextItems);
    wx.showToast({
      title: '已移除候选',
      icon: 'none'
    });
    this.loadCompareData();
  },

  onClearCompareItems() {
    wx.removeStorageSync(COMPARE_STORAGE_KEY);
    wx.showToast({
      title: '已清空对比池',
      icon: 'none'
    });
    this.loadCompareData();
  },

  onOpenDetail(e) {
    const id = e.currentTarget.dataset.id;
    const type = e.currentTarget.dataset.type;
    if (!id || !type) return;
    wx.navigateTo({
      url: `/pkgGear/pages/detail/detail?id=${id}&type=${type}`
    });
  },

  onGoRecommend() {
    if (this.data.compareCards.length < 2) {
      wx.showToast({
        title: '至少 2 个候选再去求推荐',
        icon: 'none'
      });
      return;
    }

    const candidateOptions = this.data.compareCards.map((item) => item.compareLabel).filter(Boolean);
    const first = this.data.compareCards[0];
    const gearCategory = this.resolveTopicGearCategory(this.data.compareType);

    wx.navigateTo({
      url: `/pkgContent/publishMode/publishMode?from=gear_compare&gearCategory=${encodeURIComponent(gearCategory)}&gearItemId=${Number(first.masterId || 0)}&candidateOptions=${encodeURIComponent(JSON.stringify(candidateOptions))}`
    });
  }
});
