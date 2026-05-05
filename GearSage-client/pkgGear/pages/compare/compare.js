const app = getApp();
const apiService = require('../../../services/api');
const { techGlossary } = require('../../utils/官网解释_text_simple');

const COMPARE_STORAGE_KEY = 'gear_compare_pool_v1';
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
    'bearing_count_roller',
    'size_family'
  ],
  rods: ['SKU', 'TOTAL LENGTH', 'Action', 'LURE WEIGHT', 'Line Wt N F', 'PE Line Size', 'PIECES', 'CLOSELENGTH']
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
    { title: '制动与结构', fields: ['brake_type_normalized', 'handle_length_mm', 'bearing_count_roller'] }
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
    hasTechTerms: false,
    commonTechTerms: [],
    differentTechTerms: [],
    differentTechGroups: [],
    activeCompareTechKey: '',
    activeCompareTechInfo: null,
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
      spool_diameter_mm: '线杯直径φ(mm)',
      spool_width_mm: '线杯宽度(mm)',
      spool_depth_normalized: '线杯深度',
      brake_type_normalized: '刹车类型',
      bearing_count_roller: '轴承数',
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

  buildMasterLabel(detail, entry) {
    return this.normalizeText(detail && detail.model)
      || this.normalizeText(detail && detail.model_cn)
      || this.normalizeText(entry && entry.masterName)
      || '未命名装备';
  },

  formatShortYear(value) {
    const text = this.normalizeText(value);
    const match = text.match(/\d{2,4}/);
    if (!match) return '';
    return match[0].slice(-2);
  },

  buildMasterLabelWithYear(detail, masterLabel) {
    return [this.formatShortYear(detail && detail.model_year), masterLabel].filter(Boolean).join(' ');
  },

  splitTechTerms(value) {
    return this.normalizeText(value)
      .split(/\s*\/\s*/)
      .map((term) => this.normalizeText(term))
      .filter(Boolean)
      .filter((term, index, terms) => terms.indexOf(term) === index);
  },

  getTechGlossaryEntry(term) {
    const key = this.normalizeText(term);
    return (key && techGlossary && techGlossary[key]) || null;
  },

  buildTechTerms(record, keyPrefix = 'compare-tech') {
    const rawValue = this.getFieldValue(record, 'body_material_tech');
    return this.splitTechTerms(rawValue).map((term, index) => {
      const entry = this.getTechGlossaryEntry(term) || {};
      const simpleText = this.normalizeText(entry.text_simple);
      const detailText = this.normalizeText(entry.text);
      return {
        key: `${keyPrefix}-${index}-${term}`,
        name: term,
        simpleText,
        detailText,
        hasInfo: !!(simpleText || detailText)
      };
    });
  },

  normalizeCompareKey(value) {
    return this.normalizeText(value).toLowerCase();
  },

  getTechCompareGroup(card) {
    return this.normalizeCompareKey(card && (card.compareGroup || card.gearType));
  },

  canCompareTechTerms(compareCards) {
    const validCards = (compareCards || []).filter(Boolean);
    if (validCards.length < 2) return false;

    const brandKeys = [...new Set(validCards.map((card) => this.normalizeCompareKey(card.brandName)).filter(Boolean))];
    const groupKeys = [...new Set(validCards.map((card) => this.getTechCompareGroup(card)).filter(Boolean))];

    return brandKeys.length === 1 && groupKeys.length === 1;
  },

  buildTechComparison(compareCards) {
    if (!this.canCompareTechTerms(compareCards)) {
      return {
        hasTechTerms: false,
        commonTechTerms: [],
        differentTechTerms: [],
        differentTechGroups: []
      };
    }

    const termMap = {};
    const validCards = (compareCards || []).filter(Boolean);

    validCards.forEach((card) => {
      const seenTerms = [];
      (card.techTerms || []).forEach((term) => {
        const name = this.normalizeText(term.name);
        if (!name || seenTerms.includes(name)) return;
        seenTerms.push(name);

        if (!termMap[name]) {
          termMap[name] = {
            name,
            simpleText: term.simpleText,
            detailText: term.detailText,
            hasInfo: term.hasInfo,
            holders: []
          };
        } else if (!termMap[name].hasInfo && term.hasInfo) {
          termMap[name].simpleText = term.simpleText;
          termMap[name].detailText = term.detailText;
          termMap[name].hasInfo = term.hasInfo;
        }

        termMap[name].holders.push({
          key: card.key,
          label: card.selectedVariant && card.selectedVariant.__displayName,
          masterLabel: card.masterLabel
        });
      });
    });

    const allTerms = Object.values(termMap)
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
      .map((term, index) => ({
        ...term,
        key: `compare-tech-${index}-${term.name}`,
        holderCount: term.holders.length
      }));

    const commonTechTerms = allTerms.filter((term) => validCards.length > 1 && term.holderCount === validCards.length);
    const differentTechTerms = allTerms.filter((term) => term.holderCount !== validCards.length);
    const groupMap = {};
    differentTechTerms.forEach((term) => {
      const holderKey = term.holders.map((holder) => holder.key).sort().join('|');
      if (!groupMap[holderKey]) {
        groupMap[holderKey] = {
          key: `tech-diff-group-${holderKey}`,
          holderCount: term.holderCount,
          holders: term.holders,
          terms: []
        };
      }
      groupMap[holderKey].terms.push(term);
    });

    const differentTechGroups = Object.values(groupMap)
      .sort((a, b) => {
        if (b.holderCount !== a.holderCount) return b.holderCount - a.holderCount;
        const aLabel = this.normalizeText(a.holders[0] && a.holders[0].label);
        const bLabel = this.normalizeText(b.holders[0] && b.holders[0].label);
        return aLabel.localeCompare(bLabel, 'zh-Hans-CN');
      })
      .map((group) => ({
        ...group,
        terms: group.terms.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
      }));

    return {
      hasTechTerms: allTerms.length > 0,
      commonTechTerms,
      differentTechTerms,
      differentTechGroups
    };
  },

  buildSummaryTags(item) {
    const tags = [];
    const pushTag = (value) => {
      const text = this.normalizeText(value);
      if (text && !tags.includes(text)) {
        tags.push(text);
      }
    };

    const traitTags =
      item &&
      item.compare_profile &&
      Array.isArray(item.compare_profile.fitStyleTags)
        ? item.compare_profile.fitStyleTags
        : item && item.gsc_traits && Array.isArray(item.gsc_traits.fitStyleTags)
          ? item.gsc_traits.fitStyleTags
          : [];

    traitTags.forEach(pushTag);

    if (item && item.gearType === 'reels') {
      if (!traitTags.length) {
        pushTag(item.type_tips);
      }
    } else if (item && item.gearType === 'rods') {
      pushTag(item.type);
      pushTag(item.action);
      pushTag(item.type_tips);
    } else {
      pushTag(item && item.system);
      pushTag(item && item.water_column);
      pushTag(item && item.action);
    }

    return tags.slice(0, 3);
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
        const normalized = this.normalizeFieldValue(source[candidate]);
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
      min_lure_weight_hint: ['min_lure_weight_hint', 'minLureWeightHint']
    };
    return aliases[key] || [key];
  },

  normalizeFieldValue(value) {
    if (Array.isArray(value)) {
      const items = value.map((item) => this.normalizeText(item)).filter(Boolean);
      return items.length ? items.join(' / ') : '';
    }
    if (value && typeof value === 'object') {
      return '';
    }
    return this.normalizeText(value);
  },

  getCompareItems() {
    const stored = wx.getStorageSync(COMPARE_STORAGE_KEY);
    return this.normalizeCompareItems(Array.isArray(stored) ? stored : []);
  },

  saveCompareItems(items) {
    wx.setStorageSync(COMPARE_STORAGE_KEY, items);
  },

  normalizeGearType(type) {
    const normalized = this.normalizeText(type);
    if (normalized === 'reel') return 'reels';
    if (normalized === 'rod') return 'rods';
    if (normalized === 'lure' || normalized === 'bait') return 'lures';
    return normalized;
  },

  normalizeCompareEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;

    const rawKey = this.normalizeText(entry.key);
    const keyParts = rawKey.split(':');
    const recoveredMasterId = keyParts.length >= 3 ? keyParts[1] : '';
    const recoveredVariantKey = keyParts.length >= 3 ? keyParts.slice(2).join(':') : '';
    const gearType = this.normalizeGearType(entry.gearType || keyParts[0]);
    const masterId = this.normalizeText(entry.masterId) || recoveredMasterId;
    const variantKey = this.normalizeText(entry.variantKey) || recoveredVariantKey;

    if (!gearType || !masterId || !variantKey) {
      return null;
    }

    return {
      ...entry,
      key: rawKey || `${gearType}:${masterId}:${variantKey}`,
      gearType,
      masterId,
      variantKey
    };
  },

  normalizeCompareItems(items) {
    const normalizedItems = (Array.isArray(items) ? items : [])
      .map((item) => this.normalizeCompareEntry(item))
      .filter(Boolean);

    const hasChanged =
      normalizedItems.length !== items.length ||
      normalizedItems.some((item, index) => {
        const original = items[index] || {};
        return (
          item.masterId !== this.normalizeText(original.masterId) ||
          item.variantKey !== this.normalizeText(original.variantKey) ||
          item.gearType !== this.normalizeGearType(original.gearType)
        );
      });

    if (hasChanged) {
      wx.setStorageSync(COMPARE_STORAGE_KEY, normalizedItems);
    }

    return normalizedItems;
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
      const masterLabel = this.buildMasterLabel(detail, entry);
      const masterLabelWithYear = this.buildMasterLabelWithYear(detail, masterLabel);
      const brandName = this.normalizeText(detail.brand_name || entry.brandName);
      const compareGroup = this.normalizeText(detail.type || detail.system || entry.compareGroup);
      const summaryTags = this.buildSummaryTags({
        ...detail,
        gearType: entry.gearType
      });
      const techTerms = this.buildTechTerms(selectedVariant, `${entry.masterId}-${selectedVariant.__key}`);

      return {
        ...entry,
        imageUrl,
        brandName,
        masterLabel,
        masterLabelWithYear,
        selectedVariant,
        compareGroup,
        compareGroupLabel: compareGroup || entry.compareGroupLabel || '',
        summaryTags,
        techTerms,
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

    compareCards.forEach((card) => {
      const profileWarnings =
        card &&
        card.selectedVariant &&
        card.selectedVariant.compare_profile &&
        Array.isArray(card.selectedVariant.compare_profile.warningHints)
          ? card.selectedVariant.compare_profile.warningHints
          : [];
      profileWarnings.forEach((warning) => {
        const text = this.normalizeText(warning);
        if (text && !warnings.includes(text)) {
          warnings.push(text);
        }
      });
    });

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
    const compareType = this.normalizeText(compareCards[0] && compareCards[0].gearType);
    const pushInsight = (text) => {
      const normalized = this.normalizeText(text);
      if (normalized && !insights.includes(normalized)) {
        insights.push(normalized);
      }
    };

    const diffCoreLabels = coreRows.filter((row) => row.isDifferent).map((row) => row.label);
    const collectedFitTags = compareCards.reduce((acc, item) => {
      const tags =
        item &&
        item.selectedVariant &&
        item.selectedVariant.compare_profile &&
        Array.isArray(item.selectedVariant.compare_profile.fitStyleTags)
          ? item.selectedVariant.compare_profile.fitStyleTags
          : [];
      return acc.concat(tags.map((tag) => this.normalizeText(tag)).filter(Boolean));
    }, []);
    const fitTags = [...new Set(collectedFitTags)];

    if (compareType === 'reels' && warnings.length > 0) {
      pushInsight(`这组候选先别急着只比纸面参数，当前最该先确认的是：${warnings[0]}。`);
    }

    if (fitTags.length > 0) {
      pushInsight(`当前候选被归纳出的方向标签有 ${fitTags.slice(0, 4).join(' / ')}。`);
    }

    if (diffCoreLabels.length > 0) {
      pushInsight(`这几个候选最值得先看的差异是 ${diffCoreLabels.slice(0, 4).join(' / ')}。`);
    } else {
      pushInsight('当前候选在核心参数上差异不大，可以继续结合手感、场景和帖子经验判断。');
    }

    if (!warnings.length && compareCards.length >= 2) {
      pushInsight('这页只负责把差异摊开，不会替你直接下购买结论。看完还纠结，再带着候选去求推荐会更有效。');
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
        hasTechTerms: false,
        commonTechTerms: [],
        differentTechTerms: [],
        differentTechGroups: [],
        activeCompareTechKey: '',
        activeCompareTechInfo: null,
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
    const techComparison = this.buildTechComparison(compareCards);
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
      hasTechTerms: techComparison.hasTechTerms,
      commonTechTerms: techComparison.commonTechTerms,
      differentTechTerms: techComparison.differentTechTerms,
      differentTechGroups: techComparison.differentTechGroups,
      activeCompareTechKey: '',
      activeCompareTechInfo: null,
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

  onCompareTechTermTap(e) {
    const key = this.normalizeText(e.currentTarget.dataset.key);
    if (!key) return;
    const nextKey = this.data.activeCompareTechKey === key ? '' : key;
    let activeCompareTechInfo = null;
    if (nextKey) {
      activeCompareTechInfo = []
        .concat(this.data.commonTechTerms || [], this.data.differentTechTerms || [])
        .find((term) => term.key === nextKey && term.hasInfo) || null;
      if (!activeCompareTechInfo) return;
    }
    this.setData({
      activeCompareTechKey: nextKey,
      activeCompareTechInfo
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
    const gearItemId = this.normalizeText(first && first.masterId);

    if (!gearCategory || !gearItemId) {
      wx.showToast({
        title: '暂时无法带入这些候选',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pkgContent/publishMode/publishMode?from=gear_compare&gearCategory=${encodeURIComponent(gearCategory)}&gearItemId=${encodeURIComponent(gearItemId)}&candidateOptions=${encodeURIComponent(JSON.stringify(candidateOptions))}`
    });
  }
});
