// components/post-Experience/post-Experience.js
const { validateWithRules } = require('../../utils/postValidators');
const { chooseAndUploadImages } = require('../../utils/imageUploadUtils');
const { getInitialDarkMode, subscribeThemeChange, unsubscribeThemeChange } = require('../../utils/theme');
const { resolveGearSearchType, getGearModelSuggestions, getAllGearModelSuggestions } = require('../../utils/gearModelMatcher');
const tagConfig = require('../post-Evaluation/gearSageTagConfig.js');

const TOTAL_STEPS = 4;
const MAX_ENVIRONMENTS = 5;
const MAX_CUSTOM_CHINESE_LENGTH = 10;
const MAX_ADVANCED_DESC_LENGTH = 200;
const WHITESPACE_REGEXP = /[\s\u00A0]+/g;
const CHINESE_ONLY_REGEXP = /[^\u4e00-\u9fa5]/g;

function createDefaultExperienceTags() {
  return {
    scene: [],
    customScene: [],
    fit: [],
    unfit: [],
    pros: [],
    cons: [],
    budget: [],
    usage: [],
    fitContextTags: [],
    fitTechniqueTags: [],
    compareProfile: [],
    compareBuyDecision: [],
    purchaseAdvice: [],
    buyStage: [],
    supplementParams: []
  };
}

function normalizeExperienceTags(tags = {}) {
  const source = tags && typeof tags === 'object' && !Array.isArray(tags) ? tags : {};
  const normalizeList = (value, maxCount = 99) => {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter(Boolean).slice(0, maxCount);
  };
  const normalizeSingleSelect = (value) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean).slice(0, 1);
    }
    return value ? [value] : [];
  };

  return {
    ...createDefaultExperienceTags(),
    ...source,
    scene: normalizeList(source.scene, MAX_ENVIRONMENTS),
    customScene: normalizeList(source.customScene, 1),
    fit: normalizeList(source.fit, 3),
    unfit: normalizeList(source.unfit, 3),
    pros: normalizeList(source.pros, 3),
    cons: normalizeList(source.cons, 3),
    budget: normalizeSingleSelect(source.budget),
    usage: normalizeList(source.usage, 2),
    fitContextTags: normalizeList(source.fitContextTags, 3),
    fitTechniqueTags: normalizeList(source.fitTechniqueTags, 3),
    compareProfile: normalizeList(source.compareProfile, 3),
    compareBuyDecision: normalizeList(source.compareBuyDecision, 3),
    purchaseAdvice: normalizeSingleSelect(source.purchaseAdvice),
    buyStage: normalizeSingleSelect(source.buyStage),
    supplementParams: normalizeList(source.supplementParams, 5)
  };
}

const EXPERIENCE_STEP_RULES = {
  1: [
    {
      field: 'gearCategory',
      validators: [
        { type: 'required', message: '请选择装备分类', trim: true },
      ],
    },
    {
      field: 'usageYear',
      validators: [
        { type: 'required', message: '请选择使用年限' },
      ],
    },
    {
      field: 'usageFrequency',
      validators: [
        { type: 'required', message: '请选择使用频率', trim: true },
      ],
    },
    {
      field: 'verifyImage',
      validators: [
        { type: 'required', message: '请上传验证图片' },
      ],
    },
    {
      field: 'environments',
      validators: [
        { type: 'required', message: '请选择使用场景' },
        { type: 'minItems', value: 1, message: '至少选择1个使用场景' },
        { type: 'maxItems', value: 5, message: '使用场景最多选择5个' },
      ],
    },
    {
      field: 'tags',
      validators: [
        {
          type: 'custom',
          message: '请选择预算倾向',
          validate: (tags) => {
            return tags && tags.budget && tags.budget.length === 1;
          }
        },
        {
          type: 'custom',
          message: '请选择使用倾向（1-2个）',
          validate: (tags) => {
            return tags && tags.usage && tags.usage.length >= 1 && tags.usage.length <= 2;
          }
        }
      ]
    },
  ],
  2: [
    {
      field: 'ratings',
      validators: [
        {
          type: 'custom',
          message: '请完成所有维度的评分',
          validate: (value, _formData, context) => {
            const keys = context.ratingKeys || [];
            if (!keys.length) {
              return true;
            }
            if (!value) {
              return false;
            }
            return keys.every((key) => Number(value[key]) > 0);
          },
        },
      ],
    },
    {
      field: 'summary',
      validators: [
        { type: 'required', message: '请选择一句话总结' },
      ],
    },
    {
      field: 'repurchase',
      validators: [
        { type: 'required', message: '请选择回购意愿' },
      ],
    },
    {
      field: 'pros',
      validators: [],
    },
    {
      field: 'cons',
      validators: [],
    },
    {
      field: 'tags',
      validators: [
        {
          type: 'custom',
          message: '请选择标签',
          validate: (value, formData) => {
            let gearCategory = formData.gearCategory;
            if (Array.isArray(gearCategory)) gearCategory = gearCategory[0];
            if (!gearCategory) return true;

            const categoryGroups = tagConfig.categoryGroups[gearCategory] || [];
            const globalGroups = tagConfig.globalGroups || [];
            // Step2 只校验当前页面可选标签：适合/不适合人群 + 装备优缺点
            const visibleGlobalKeys = new Set(['fit', 'unfit']);
            const visibleCategoryKeys = new Set(['pros', 'cons']);
            const allGroups = [
              ...globalGroups.filter(g => visibleGlobalKeys.has(g.groupKey)),
              ...categoryGroups.filter(g => visibleCategoryKeys.has(g.groupKey))
            ].filter(g => g.enabled !== false && g.clientDisplay?.showOnPublish !== false);

            for (const group of allGroups) {
              const min = group.minSelect || (group.required ? 1 : 0);
              if (min > 0) {
                const selectedTags = (value && value[group.groupKey]) ? value[group.groupKey] : [];
                if (selectedTags.length < min) {
                  return `请至少选择${min}个${group.label}`;
                }
              }
            }
            return true;
          },
        },
      ],
    },
  ],
  3: [
    {
      field: 'title',
      validators: [
        { type: 'required', message: '请输入标题', trim: true },
        { type: 'maxLength', value: 20, message: '标题不能超过20个字符' },
      ],
    },
    {
      field: 'mainContent',
      validators: [
        { type: 'required', message: '请输入主体内容', trim: true },
        { type: 'minLength', value: 100, message: '内容不能少于100字', trim: true },
        { type: 'maxLength', value: 1000, message: '内容不能超过1000字' },
      ],
    },
    {
      field: 'mainImages',
      validators: [
        { type: 'minItems', value: 1, message: '至少需要上传1张图片' },
      ],
    },
  ],
  4: [] // Step 4: 进阶信息，全部选填
};

const EXPERIENCE_FORM_RULES = [
  ...EXPERIENCE_STEP_RULES[1],
  ...EXPERIENCE_STEP_RULES[2],
  ...EXPERIENCE_STEP_RULES[3],
  ...EXPERIENCE_STEP_RULES[4],
  {
    field: 'mainImages',
    validators: [
      { type: 'maxItems', value: 9, message: '最多只能上传9张图片' },
    ],
  },
];
Component({
  properties: {
    // 外部传入的表单数据
    initialData: {
      type: Object,
      value: {}
    }
  },

  data: {
    currentStep: 1,
    isDarkMode: false,
    formData: {
        gearCategory: 'rod', // 默认分类为鱼竿，避免传递空值
      gearModel: '',
      gearItemId: null,
      usageYear: '2年', // 默认选中第一个选项：2年
      usageFrequency: '', // 使用频率
      verifyImage: '',
      environments: [], // 默认不选中
      customScene: '', // 自定义场景
      customFit: '', // 自定义适合人群
      customUnfit: '', // 自定义不适合人群
      title: '',
      mainContent: '',
      mainImages: [],
      ratings: {},
      summary: '',
      repurchase: '',
      pros: [''],
      cons: [''],
      tags: createDefaultExperienceTags(),
      // 进阶信息 - 常用搭配
      comboGear: [], // 搭配装备
      comboDesc: '', // 搭配说明
      // 进阶信息 - 对比信息
      compareGear: [], // 对比对象
      compareDesc: '', // 对比说明
      // 进阶信息 - 购买建议 (tags中)
      // 进阶信息 - 推荐购买阶段 (tags中)
    },
    errors: {
      gearCategory: '',
      usageYear: '',
      usageFrequency: '',
      verifyImage: '',
      environments: '',
      ratings: '',
      summary: '',
      repurchase: '',
      pros: '',
      cons: '',
      tags: '',
      comboDesc: '',
      compareDesc: ''
    },
    canSelectGearModel: true,
    gearModelOptions: [],
    showGearModelOptions: false,
    
    // 进阶信息 - 搜索相关
    comboSearchKeyword: '',
    comboSearchOptions: [],
    showComboSearchOptions: false,
    compareSearchKeyword: '',
    compareSearchOptions: [],
    showCompareSearchOptions: false,
    selectorDrawerVisible: false,
    selectorDrawerType: '',
    selectorDrawerTitle: '',
    selectorDrawerOptions: [],

    // 计算属性
    usageFrequencyText: '请选择',
    
    // 装备分类选项
    equipmentCategories: [
      { id: 'rod', label: '鱼竿' },
      { id: 'reel', label: '渔轮' },
      { id: 'bait', label: '鱼饵' },
      { id: 'line', label: '鱼线' },
      { id: 'hook', label: '鱼钩' },
      { id: 'other', label: '其他' }
    ],
    
    // 使用年限选项
    usageYears: [
      { value: '2', name: '2年' },
      { value: '3', name: '3年' },
      { value: '4', name: '4年' },
      { value: '5', name: '5年' },
      { value: '5+', name: '大于5年' }
    ],
    
    // 使用频率选项
    usageFrequencies: [
      { value: 'essential', name: '出钓必备' },
      { value: 'several_times_week', name: '每周 多次' },
      { value: 'once_week', name: '每周 一次' },
      { value: 'several_times_month', name: '每月 多次' },
      { value: 'once_month', name: '每月 一次' },
      { value: 'several_times_year', name: '每年 多次' }
    ],
    
    // 常用环境选项
    environments: [],
    budgetOptions: [],
    usageOptions: [],
    
    // 进阶信息选项
    fitContextOptions: [],
    fitTechniqueOptions: [],
    compareProfileOptions: [],
    compareBuyDecisionOptions: [],
    purchaseAdviceOptions: [],
    buyStageOptions: [],
    
    // 评分维度（根据装备分类动态设置）
    ratingDimensions: []
  },

  lifetimes: {
    attached() {
      console.log('[post-Experience] lifetimes.attached: initialData=', this.properties.initialData);
      this.initFormData();
      console.log('[post-Experience] after initFormData formData=', this.data.formData);
      const currCategory = this.data.formData.gearCategory || '';
      if (currCategory) {
        console.log('[post-Experience] init ratingDimensions with gearCategory=', currCategory);
        this.updateRatingDimensions(currCategory);
      }
      this.syncGearModelSuggestions(this.data.formData.gearCategory, this.data.formData.gearModel, false);
      
      // 加载常用环境选项
      if (currCategory) {
        this.loadEnvironmentOptions(currCategory);
      }

      this.initThemeMode();
      this._themeChangeHandler = subscribeThemeChange(({ theme }) => {
        this.setData({ isDarkMode: theme === 'dark' });
      });
    },
    detached() {
      this.clearGearModelBlurTimer();
      unsubscribeThemeChange(this._themeChangeHandler);
      this._themeChangeHandler = null;
    },
    ready() {
      this.updateEnvironmentsState(this.data.formData.environments);
    }
  },

  observers: {
    'formData.gearCategory': function(gearCategory) {
      console.log('[post-Experience] observer gearCategory=', gearCategory);
      this.updateEquipmentCategoryOptions((gearCategory || '').trim());
      if (gearCategory) {
        this.updateRatingDimensions(gearCategory); // 直接使用选中的分类
        this.loadEnvironmentOptions(gearCategory); // 加载对应的常用环境选项
      } else {
        console.log('[post-Experience] gearCategory is empty, ratingDimensions may be cleared');
      }
      this.syncGearModelSuggestions(
        gearCategory,
        this.data.formData.gearModel,
        this.data.showGearModelOptions
      );
    },
    'formData.environments': function(selectedEnvironments) {
      this.updateEnvironmentsState(selectedEnvironments);
    },
    'formData.usageFrequency': function(usageFrequency) {
      let text = '请选择';
      if (usageFrequency) {
        text = usageFrequency;
      }
      this.setData({ usageFrequencyText: text });
    }
  },

  methods: {
    sanitizeChineseText(value, maxLength = MAX_CUSTOM_CHINESE_LENGTH) {
      const normalized = typeof value === 'string'
        ? value.replace(WHITESPACE_REGEXP, '').replace(CHINESE_ONLY_REGEXP, '')
        : '';
      return normalized.slice(0, maxLength);
    },

    clearGearModelBlurTimer() {
      if (this._gearModelBlurTimer) {
        clearTimeout(this._gearModelBlurTimer);
        this._gearModelBlurTimer = null;
      }
    },

    syncGearModelSuggestions(gearCategory, keyword = '', showOptions = false) {
      const canSelectGearModel = Boolean(resolveGearSearchType(gearCategory));
      const gearModelOptions = canSelectGearModel
        ? getGearModelSuggestions(gearCategory, keyword)
        : [];

      this.setData({
        canSelectGearModel,
        gearModelOptions,
        showGearModelOptions: canSelectGearModel ? showOptions : false,
      });
    },

    getSelectorConfig(type) {
      if (type === 'usageFrequency') {
        return {
          title: '选择使用频率',
          value: this.data.formData.usageFrequency || '',
          options: this.data.usageFrequencies.map((item) => ({
            value: item.name,
            label: item.name
          }))
        };
      }

      return null;
    },

    onOpenSelectorDrawer(e) {
      const type = e.currentTarget.dataset.type || '';
      const config = this.getSelectorConfig(type);
      if (!config) {
        return;
      }

      this.setData({
        selectorDrawerVisible: true,
        selectorDrawerType: type,
        selectorDrawerTitle: config.title,
        selectorDrawerOptions: config.options.map((item) => ({
          ...item,
          selected: item.value === config.value
        }))
      });
    },

    onCloseSelectorDrawer() {
      this.setData({
        selectorDrawerVisible: false,
        selectorDrawerType: '',
        selectorDrawerTitle: '',
        selectorDrawerOptions: []
      });
    },

    onSelectorOptionSelect(e) {
      const { value } = e.currentTarget.dataset;
      if (this.data.selectorDrawerType === 'usageFrequency') {
        this.setData({
          'formData.usageFrequency': value,
          'errors.usageFrequency': ''
        });
        this.triggerEvent('datachange', { field: 'usageFrequency', value });
      }

      this.onCloseSelectorDrawer();
    },

    onGearModelInput(e) {
      const gearModel = e.detail.value || '';
      const gearCategory = this.data.formData.gearCategory;

      this.setData({
        'formData.gearModel': gearModel,
        'formData.gearItemId': null,
      });

      this.syncGearModelSuggestions(gearCategory, gearModel, true);
      this.triggerEvent('datachange', { field: 'gearModel', value: gearModel });
      this.triggerEvent('datachange', { field: 'gearItemId', value: null });
    },

    onGearModelFocus() {
      this.clearGearModelBlurTimer();
      const { gearCategory, gearModel } = this.data.formData;
      this.syncGearModelSuggestions(gearCategory, gearModel, true);
    },

    onGearModelBlur() {
      this.clearGearModelBlurTimer();
      this._gearModelBlurTimer = setTimeout(() => {
        this.setData({ showGearModelOptions: false });
        this._gearModelBlurTimer = null;
      }, 150);
    },

    onGearModelSelect(e) {
      this.clearGearModelBlurTimer();
      const gearModel = e.currentTarget.dataset.name || '';
      const gearItemId = e.currentTarget.dataset.sourceId ? String(e.currentTarget.dataset.sourceId).trim() : null;

      this.setData({
        'formData.gearModel': gearModel,
        'formData.gearItemId': gearItemId,
        showGearModelOptions: false,
      });

      this.triggerEvent('datachange', { field: 'gearModel', value: gearModel });
      this.triggerEvent('datachange', { field: 'gearItemId', value: gearItemId });
    },

    // 初始化主题模式
    initThemeMode() {
      const isDarkMode = getInitialDarkMode();
      this.setData({ isDarkMode });
    },

    updateEnvironmentsState(selectedEnvironments) {
      if (!selectedEnvironments) return;
      const maxPresetCount = this.data.formData.customScene ? MAX_ENVIRONMENTS - 1 : MAX_ENVIRONMENTS;
      const environments = this.data.environments.map(env => {
        const isSelected = selectedEnvironments.includes(env.value);
        const isDisabled = !isSelected && selectedEnvironments.length >= maxPresetCount;
        return {
          value: env.value,
          label: env.label,
          checked: isSelected,
          disabled: isDisabled
        };
      });
      this.setData({
        environments: environments
      });
    },

    // 初始化表单数据
    initFormData() {
      const initialData = this.properties.initialData;
      if (initialData && Object.keys(initialData).length > 0) {
        const normalizedInitialData = {
          ...initialData,
          tags: normalizeExperienceTags(initialData.tags)
        };
        this.setData({
          formData: { ...this.data.formData, ...normalizedInitialData }
        });
        this.updateEquipmentCategoryOptions((normalizedInitialData.gearCategory || this.data.formData.gearCategory || '').trim());
        console.log('[post-Experience] initFormData merged with initialData:', normalizedInitialData);
        console.log('[post-Experience] initFormData result formData=', this.data.formData);
      } else {
        this.updateEquipmentCategoryOptions((this.data.formData.gearCategory || '').trim());
      }
    },

    updateEquipmentCategoryOptions(gearCategory) {
      const selectedCategory = gearCategory || '';
      const nextItems = (this.data.equipmentCategories || []).map(item => ({
        ...item,
        checked: item.id === selectedCategory
      }));

      this.setData({
        equipmentCategories: nextItems
      });
    },

    // 更新评分维度
    updateRatingDimensions(gearCategory) {
      console.log('[post-Experience] updateRatingDimensions gearCategory=', gearCategory);
      let dimensions = [];
      switch (gearCategory) {
        case 'rod':
          dimensions = [
            { key: 'actionMatchScore', label: '调性匹配' },
            { key: 'sensitivityScore', label: '传导性' },
            { key: 'castingScore', label: '抛投表现' },
            { key: 'workmanshipScore', label: '做工' },
            { key: 'durabilityScore', label: '耐用性' }
          ];
          break;
        case 'reel':
          dimensions = [
            { key: 'retrieveFeelScore', label: '收线手感' },
            { key: 'dragScore', label: '卸力表现' },
            { key: 'smoothnessScore', label: '顺滑度' },
            { key: 'balanceScore', label: '轻量与平衡' },
            { key: 'durabilityScore', label: '耐用性' }
          ];
          break;
        case 'bait':
          dimensions = [
            { key: 'actionScore', label: '动作表现' },
            { key: 'stabilityScore', label: '稳定性' },
            { key: 'attractionScore', label: '诱鱼表现' },
            { key: 'durabilityScore', label: '耐撕咬' },
            { key: 'castingScore', label: '抛投表现' }
          ];
          break;
        case 'line':
          dimensions = [
            { key: 'strengthScore', label: '强度表现' },
            { key: 'abrasionScore', label: '耐磨性' },
            { key: 'handlingScore', label: '顺滑与操作感' },
            { key: 'castabilityScore', label: '抛投表现' },
            { key: 'durabilityScore', label: '耐久性' }
          ];
          break;
        case 'hook':
          dimensions = [
            { key: 'sharpnessScore', label: '锋利度' },
            { key: 'penetrationScore', label: '刺鱼效率' },
            { key: 'resistanceScore', label: '抗变形' },
            { key: 'coatingScore', label: '防锈与涂层' },
            { key: 'durabilityScore', label: '耐用性' }
          ];
          break;
        case 'other':
          dimensions = [
            { key: 'practicalityScore', label: '实用性' },
            { key: 'workmanshipScore', label: '做工' },
            { key: 'durabilityScore', label: '耐久性' },
            { key: 'designScore', label: '设计合理性' },
            { key: 'costScore', label: '性价比' }
          ];
          break;
      }
      this.setData({ ratingDimensions: dimensions });
      console.log('[post-Experience] ratingDimensions set keys=', dimensions.map(d => d.key));
    },

    // 加载常用环境选项
    loadEnvironmentOptions(gearCategory) {
      const categoryGroups = tagConfig.categoryGroups[gearCategory];
      if (!categoryGroups) {
        this.setData({
          environments: [],
          budgetOptions: [],
          usageOptions: [],
          fitContextOptions: [],
          fitTechniqueOptions: [],
          compareProfileOptions: [],
          compareBuyDecisionOptions: [],
          purchaseAdviceOptions: [],
          buyStageOptions: [],
        });
        return;
      }

      const sceneGroup = categoryGroups.find(g => g.groupKey === 'scene');
      if (sceneGroup && sceneGroup.options) {
        const environments = sceneGroup.options.map(opt => ({
          value: opt.id, // 使用 id 作为 value
          label: opt.label
        }));
        
        this.setData({ environments });
        
        // 更新选中状态
        this.updateEnvironmentsState(this.data.formData.environments);
      } else {
        this.setData({ environments: [] });
      }

      // 加载预算倾向和使用倾向选项 (Global Groups)
      const globalGroups = tagConfig.globalGroups || [];
      const budgetGroup = globalGroups.find(g => g.groupKey === 'budget');
      const usageGroup = globalGroups.find(g => g.groupKey === 'usage');
      const fitContextGroup = globalGroups.find(g => g.groupKey === 'fitContextTags');
      const fitTechniqueGroup = globalGroups.find(g => g.groupKey === 'fitTechniqueTags');
      const compareProfileGroup = globalGroups.find(g => g.groupKey === 'compareProfile');
      const compareBuyDecisionGroup = globalGroups.find(g => g.groupKey === 'compareBuyDecision');
      const purchaseAdviceGroup = globalGroups.find(g => g.groupKey === 'purchaseAdvice');
      const buyStageGroup = globalGroups.find(g => g.groupKey === 'buyStage');
      
      const resolveCategoryAwareOptions = (group) => {
        if (!group) return [];
        // 兼容旧结构: options
        if (Array.isArray(group.options) && group.options.length > 0) {
          return group.options;
        }
        // 新结构: categoryOptions[gearCategory]
        if (group.categoryOptions && typeof group.categoryOptions === 'object') {
          return group.categoryOptions[gearCategory] || [];
        }
        return [];
      };
      
      this.setData({
        budgetOptions: resolveCategoryAwareOptions(budgetGroup),
        usageOptions: resolveCategoryAwareOptions(usageGroup),
        purchaseAdviceOptions: resolveCategoryAwareOptions(purchaseAdviceGroup),
        buyStageOptions: resolveCategoryAwareOptions(buyStageGroup),
        fitContextOptions: resolveCategoryAwareOptions(fitContextGroup),
        fitTechniqueOptions: resolveCategoryAwareOptions(fitTechniqueGroup),
        compareProfileOptions: resolveCategoryAwareOptions(compareProfileGroup),
        compareBuyDecisionOptions: resolveCategoryAwareOptions(compareBuyDecisionGroup),
      });
    },

    // 自定义场景输入
    onCustomSceneInput(e) {
      const value = this.sanitizeChineseText(e.detail.value, MAX_CUSTOM_CHINESE_LENGTH);
      const currentScene = this.data.formData.customScene || '';
      const environments = this.data.formData.environments || [];
      if (!currentScene && value && environments.length >= MAX_ENVIRONMENTS) {
        wx.showToast({ title: '自定义场景会占用1个标签位，请先取消一个场景', icon: 'none' });
        return;
      }
      const tags = normalizeExperienceTags(this.data.formData.tags);
      const nextTags = { ...tags, customScene: value ? [value] : [] };
      this.setData({
        'formData.customScene': value,
        'formData.tags': nextTags,
        'errors.environments': '',
        'errors.tags': ''
      });
      this.updateEnvironmentsState(environments);
      this.triggerEvent('datachange', { field: 'customScene', value });
      this.triggerEvent('datachange', { field: 'tags', value: nextTags });
    },

    // 装备分类选择（改为单选，与post-Recommend保持一致）
    ongearCategorySelect(e) {
      const selectedItems = e.detail.selectedItems;
      console.log('[post-Experience] ongearCategorySelect selectedItems=', selectedItems);
      // 统一使用字符串格式，取第一个选中的分类
      const gearCategory = selectedItems.length > 0 ? selectedItems[0].id : '';
      console.log('[post-Experience] ongearCategorySelect gearCategory=', gearCategory);
      
      this.setData({
        'formData.gearCategory': gearCategory,
        'formData.gearModel': '',
        'formData.gearItemId': null,
        'formData.ratings': {}, // 清空评分数据
        'formData.environments': [], // Clear environments
        'formData.tags': createDefaultExperienceTags(), // Clear tags
        'errors.gearCategory': '',
        'errors.environments': '',
        'errors.tags': ''
      });
      console.log('[post-Experience] setData gearCategory done. formData.gearCategory=', this.data.formData.gearCategory);
      this.updateEquipmentCategoryOptions(gearCategory);
      
      // observers会自动调用updateRatingDimensions
      
      this.triggerEvent('datachange', { field: 'gearCategory', value: gearCategory });
      this.triggerEvent('datachange', { field: 'gearModel', value: '' });
      this.triggerEvent('datachange', { field: 'gearItemId', value: null });
      this.syncGearModelSuggestions(gearCategory, '', true);
      console.log('[post-Experience] trigger datachange for gearCategory');
    },

    // 使用年限选择
    onUsageYearSelect(e) {
      const usageYearText = e.detail.value;
      
      this.setData({
        'formData.usageYear': usageYearText,
        'errors.usageYear': ''
      });
      this.triggerEvent('datachange', { field: 'usageYear', value: usageYearText });
    },

    // 使用频率选择
    onUsageFrequencySelect(e) {
      const selectedIndex = e.detail.value;
      const selectedFrequency = this.data.usageFrequencies[selectedIndex];
      this.setData({
        'formData.usageFrequency': selectedFrequency.name,
        'errors.usageFrequency': ''
      });
      this.triggerEvent('datachange', { field: 'usageFrequency', value: selectedFrequency.name });
    },

    // 获取使用频率显示文本
    getUsageFrequencyText() {
      const { formData } = this.data;
      return formData.usageFrequency || '请选择';
    },

    // 常用环境选择切换
    onEnvironmentToggle(e) {
      const { value } = e.currentTarget.dataset;
      const { environments } = this.data.formData;
      const maxPresetCount = this.data.formData.customScene ? MAX_ENVIRONMENTS - 1 : MAX_ENVIRONMENTS;
      
      let newEnvironments;
      if (environments.includes(value)) {
        newEnvironments = environments.filter(v => v !== value);
      } else {
        if (environments.length >= maxPresetCount) {
          wx.showToast({ title: '最多选择5个使用场景', icon: 'none' });
          return;
        }
        newEnvironments = [...environments, value];
      }
      
      // Sync environments to tags.scene for validation
      const tags = normalizeExperienceTags(this.data.formData.tags);
      const newTags = { ...tags, scene: newEnvironments };

      this.setData({
        'formData.environments': newEnvironments,
        'formData.tags': newTags,
        'errors.environments': '',
        'errors.tags': ''
      });
      this.updateEnvironmentsState(newEnvironments);
      this.triggerEvent('datachange', { field: 'environments', value: newEnvironments });
      this.triggerEvent('datachange', { field: 'tags', value: newTags });
    },

    onBudgetSelect(e) {
      const { value } = e.currentTarget.dataset;
      const tags = normalizeExperienceTags(this.data.formData.tags);
      const newTags = { ...tags, budget: [value] };
      
      this.setData({
        'formData.tags': newTags,
        'errors.tags': ''
      });
      this.triggerEvent('datachange', { field: 'tags', value: newTags });
    },

    onUsageSelect(e) {
      const { value } = e.currentTarget.dataset;
      const tags = normalizeExperienceTags(this.data.formData.tags);
      const currentUsage = tags.usage || [];
      
      let newUsage;
      if (currentUsage.includes(value)) {
        newUsage = currentUsage.filter(v => v !== value);
      } else {
        if (currentUsage.length >= 2) {
          wx.showToast({ title: '最多选择2个使用倾向', icon: 'none' });
          return;
        }
        newUsage = [...currentUsage, value];
      }
      
      this.setData({
        'formData.tags': { ...tags, usage: newUsage },
        'errors.tags': ''
      });
      this.triggerEvent('datachange', { field: 'tags', value: { ...tags, usage: newUsage } });
    },

    onCustomFitChange(e) {
      const value = this.sanitizeChineseText(e.detail.value, MAX_CUSTOM_CHINESE_LENGTH);
      this.setData({
        'formData.customFit': value
      });
      this.triggerEvent('datachange', { field: 'customFit', value });
    },

    onCustomUnfitChange(e) {
      const value = this.sanitizeChineseText(e.detail.value, MAX_CUSTOM_CHINESE_LENGTH);
      this.setData({
        'formData.customUnfit': value
      });
      this.triggerEvent('datachange', { field: 'customUnfit', value });
    },

    // Step 4 Handlers
    onComboGearInput(e) {
      const value = e.detail.value || '';
      this.setData({ comboSearchKeyword: value });
      const suggestions = getAllGearModelSuggestions(value);
      this.setData({ 
        comboSearchOptions: suggestions,
        showComboSearchOptions: true 
      });
    },

    onComboGearFocus() {
      const { comboSearchKeyword } = this.data;
      const suggestions = getAllGearModelSuggestions(comboSearchKeyword || '');
      this.setData({ 
        comboSearchOptions: suggestions,
        showComboSearchOptions: true 
      });
    },

    onComboGearBlur() {
      setTimeout(() => {
        this.setData({ showComboSearchOptions: false });
      }, 150);
    },

    onComboGearSelect(e) {
      const name = e.currentTarget.dataset.name;
      const comboGear = this.data.formData.comboGear || [];
      if (!comboGear.includes(name)) {
        const newComboGear = [...comboGear, name];
        this.setData({
          'formData.comboGear': newComboGear,
          comboSearchKeyword: '',
          showComboSearchOptions: false
        });
        this.triggerEvent('datachange', { field: 'comboGear', value: newComboGear });
      } else {
        this.setData({
          comboSearchKeyword: '',
          showComboSearchOptions: false
        });
      }
    },

    onComboGearRemove(e) {
      const index = e.currentTarget.dataset.index;
      const comboGear = [...this.data.formData.comboGear];
      comboGear.splice(index, 1);
      this.setData({ 'formData.comboGear': comboGear });
      this.triggerEvent('datachange', { field: 'comboGear', value: comboGear });
    },

    onCompareGearInput(e) {
      const value = e.detail.value || '';
      this.setData({ compareSearchKeyword: value });
      const gearCategory = this.data.formData.gearCategory;
      const suggestions = getGearModelSuggestions(gearCategory, value);
      this.setData({ 
        compareSearchOptions: suggestions,
        showCompareSearchOptions: true 
      });
    },

    onCompareGearFocus() {
      const { compareSearchKeyword } = this.data;
      const gearCategory = this.data.formData.gearCategory;
      const suggestions = getGearModelSuggestions(gearCategory, compareSearchKeyword || '');
      this.setData({ 
        compareSearchOptions: suggestions,
        showCompareSearchOptions: true 
      });
    },

    onCompareGearBlur() {
      setTimeout(() => {
        this.setData({ showCompareSearchOptions: false });
      }, 150);
    },

    onCompareGearSelect(e) {
      const name = e.currentTarget.dataset.name;
      const compareGear = this.data.formData.compareGear || [];
      if (compareGear.length >= 3) {
        wx.showToast({ title: '最多选择3个对比对象', icon: 'none' });
        return;
      }
      if (!compareGear.includes(name)) {
        const newCompareGear = [...compareGear, name];
        this.setData({
          'formData.compareGear': newCompareGear,
          compareSearchKeyword: '',
          showCompareSearchOptions: false
        });
        this.triggerEvent('datachange', { field: 'compareGear', value: newCompareGear });
      } else {
        this.setData({
          compareSearchKeyword: '',
          showCompareSearchOptions: false
        });
      }
    },

    onCompareGearRemove(e) {
      const index = e.currentTarget.dataset.index;
      const compareGear = [...this.data.formData.compareGear];
      compareGear.splice(index, 1);
      this.setData({ 'formData.compareGear': compareGear });
      this.triggerEvent('datachange', { field: 'compareGear', value: compareGear });
    },

    onComboDescInput(e) {
      const value = String(e.detail.value || '').slice(0, MAX_ADVANCED_DESC_LENGTH);
      this.setData({ 'formData.comboDesc': value });
      this.triggerEvent('datachange', { field: 'comboDesc', value });
    },

    onCompareDescInput(e) {
      const value = String(e.detail.value || '').slice(0, MAX_ADVANCED_DESC_LENGTH);
      this.setData({ 'formData.compareDesc': value });
      this.triggerEvent('datachange', { field: 'compareDesc', value });
    },

    // Generic tag selection for step 4
    onTagSelect(e) {
      const { group, value, max } = e.currentTarget.dataset;
      const tags = normalizeExperienceTags(this.data.formData.tags);
      const currentTags = tags[group] || [];
      
      let newTags;
      if (currentTags.includes(value)) {
        newTags = currentTags.filter(v => v !== value);
      } else {
        if (max && currentTags.length >= max) {
          wx.showToast({ title: `最多选择${max}个`, icon: 'none' });
          return;
        }
        newTags = [...currentTags, value];
      }
      
      const updatedTags = { ...tags, [group]: newTags };
      this.setData({
        'formData.tags': updatedTags
      });
      this.triggerEvent('datachange', { field: 'tags', value: updatedTags });
    },

    onSingleTagSelect(e) {
      const { group, value } = e.currentTarget.dataset;
      if (!group) return;
      const tags = normalizeExperienceTags(this.data.formData.tags);
      const currentTags = tags[group] || [];
      const next = currentTags.includes(value) ? [] : [value];
      const updatedTags = { ...tags, [group]: next };
      this.setData({
        'formData.tags': updatedTags
      });
      this.triggerEvent('datachange', { field: 'tags', value: updatedTags });
    },

    onPurchaseAdviceSelect(e) {
      const { value } = e.currentTarget.dataset;
      const tags = normalizeExperienceTags(this.data.formData.tags);
      // Single select
      const updatedTags = { ...tags, purchaseAdvice: [value] };
      this.setData({
        'formData.tags': updatedTags
      });
      this.triggerEvent('datachange', { field: 'tags', value: updatedTags });
    },

    // 选择验证图片
    async onChooseVerifyImage() {
      try {
        // 使用优化后的图片选择和上传工具
        const fileIDs = await chooseAndUploadImages({
          count: 1,
          prefix: 'verify',
          showLoading: true
        });

        if (!Array.isArray(fileIDs) || fileIDs.length === 0) {
          return;
        }
        
        const cloudImageUrl = fileIDs[0];
        this.setData({
          'formData.verifyImage': cloudImageUrl,
          'errors.verifyImage': ''
        });
        this.triggerEvent('datachange', { field: 'verifyImage', value: cloudImageUrl });
        
        wx.showToast({
          title: '验证图片上传成功',
          icon: 'success'
        });
      } catch (error) {
        console.error('选择验证图片失败:', error);
        wx.showToast({
          title: '验证图片上传失败',
          icon: 'none'
        });
      }
    },

    // 预览验证图片
    onPreviewVerifyImage() {
      wx.previewImage({
        urls: [this.data.formData.verifyImage]
      });
    },

    // 删除验证图片
    onDeleteVerifyImage() {
      this.setData({
        'formData.verifyImage': '',
        'errors.verifyImage': ''
      });
      this.triggerEvent('datachange', { field: 'verifyImage', value: '' });
    },

    // 标题输入
    onTitleInput(e) {
      const title = e.detail.value;
      this.setData({
        'formData.title': title,
        'errors.title': ''
      });
      this.triggerEvent('datachange', { field: 'title', value: title });
    },

    // 主要内容输入
    onMainContentInput(e) {
      const mainContent = e.detail.value;
      this.setData({
        'formData.mainContent': mainContent,
        'errors.mainContent': ''
      });
      this.triggerEvent('datachange', { field: 'mainContent', value: mainContent });
    },

    // 预览图片
    onPreviewImage(e) {
      const index = e.detail.index;
      wx.previewImage({
        current: this.data.formData.mainImages[index],
        urls: this.data.formData.mainImages
      });
    },

    // 删除图片
    onDeleteImage(e) {
      const index = e.detail.index;
      let mainImages = [...this.data.formData.mainImages];
      mainImages.splice(index, 1);
      this.setData({
        'formData.mainImages': mainImages,
        'errors.mainImages': ''
      });
      this.triggerEvent('datachange', { field: 'mainImages', value: mainImages });
    },

    // 选择图片
    onChooseImage(e) {
      const newImageList = e.detail.value;
      this.setData({
        'formData.mainImages': newImageList,
        'errors.mainImages': ''
      });
      this.triggerEvent('datachange', { field: 'mainImages', value: newImageList });
    },

    // 评分点击
    // 处理评分组件的评分变化
    onRatingChange(e) {
      const ratings = e.detail.ratings;
      console.log('[post-Experience] onRatingChange detail=', e.detail);
      this.setData({
        'formData.ratings': ratings,
        'errors.ratings': ''
      });
      this.triggerEvent('datachange', { field: 'ratings', value: ratings });
    },

    onSummaryChange(e) {
      this.setData({
        'formData.summary': e.detail.value,
        'errors.summary': ''
      });
      this.triggerEvent('datachange', { field: 'summary', value: e.detail.value });
    },

    onRepurchaseChange(e) {
      this.setData({
        'formData.repurchase': e.detail.value,
        'errors.repurchase': ''
      });
      this.triggerEvent('datachange', { field: 'repurchase', value: e.detail.value });
    },

    // 优点变化
    onProsChange(e) {
      const pros = e.detail.pros;
      this.setData({
        'formData.pros': pros,
        'errors.pros': ''
      });
      this.triggerEvent('datachange', { field: 'pros', value: pros });
    },

    // 缺点变化
    onConsChange(e) {
      const cons = e.detail.cons;
      this.setData({
        'formData.cons': cons,
        'errors.cons': ''
      });
      this.triggerEvent('datachange', { field: 'cons', value: cons });
    },

    onTagsChange(e) {
      const mergedTags = normalizeExperienceTags({
        ...this.data.formData.tags,
        ...(e.detail.tags || {})
      });
      this.setData({
        'formData.tags': mergedTags,
        'errors.tags': ''
      });
      this.triggerEvent('datachange', { field: 'tags', value: mergedTags });
    },

    // 步骤点击事件
    onStepTap(e) {
      const targetStep = Number(e.currentTarget.dataset.step);
      if (!Number.isInteger(targetStep)) {
        return;
      }
      const clampedStep = Math.max(1, Math.min(targetStep, TOTAL_STEPS));
      const currentStep = this.data.currentStep;

      // 只允许点击已完成的步骤或当前步骤
      if (clampedStep <= currentStep) {
        this.setData({
          currentStep: clampedStep
        });
        this.scrollStepToTop();

        // 添加点击反馈动画
        const animation = wx.createAnimation({
          duration: 200,
          timingFunction: 'ease-out'
        });
        animation.scale(0.95).step();
        animation.scale(1).step();

        this.setData({
          [`stepAnimation${clampedStep}`]: animation.export()
        });
      }
    },

    // 上一步
    onPrevStep() {
      const prevStep = Math.max(1, this.data.currentStep - 1);
      if (prevStep !== this.data.currentStep) {
        console.log('[post-Experience] onPrevStep from', this.data.currentStep, 'to', prevStep);
        this.setData({ currentStep: prevStep });
        this.scrollStepToTop();
      }
    },

    // 下一步
    onNextStep() {
      if (this.validateCurrentStep()) {
        const nextStep = Math.min(TOTAL_STEPS, this.data.currentStep + 1);
        if (nextStep !== this.data.currentStep) {
          console.log('[post-Experience] onNextStep from', this.data.currentStep, 'to', nextStep);
          this.setData({ currentStep: nextStep });
          this.scrollStepToTop();
        }
      } else {
        wx.showToast({
          title: '请检查必填内容',
          icon: 'none'
        });
      }
    },

    scrollStepToTop() {
      this.triggerEvent('scrolltotop');
      if (typeof wx === 'undefined' || typeof wx.pageScrollTo !== 'function') {
        return;
      }
      wx.nextTick(() => {
        wx.pageScrollTo({
          scrollTop: 0,
          duration: 180
        });
      });
    },

    getValidationContext() {
      return {
        ratingKeys: (this.data.ratingDimensions || []).map((item) => item.key).filter(Boolean),
      };
    },

    handleValidationResult(result) {
      const updatedErrors = { ...this.data.errors };
      result.checkedFields.forEach((field) => {
        if (result.errors[field]) {
          updatedErrors[field] = result.errors[field];
        } else {
          // 始终保持字符串类型，避免子组件收到 null
          updatedErrors[field] = '';
        }
      });
      this.setData({ errors: updatedErrors });
      return result.isValid;
    },

    // 验证当前步骤
    validateCurrentStep() {
      const { currentStep, formData } = this.data;
      const rules = EXPERIENCE_STEP_RULES[currentStep] || [];
      const result = validateWithRules(formData, rules, this.getValidationContext());
      return this.handleValidationResult(result);
    },

    // 提交表单
    onSubmit() {
      if (this.validateForm()) {
        const formData = this.data.formData || {};
        const tags = normalizeExperienceTags(formData.tags);
        const submitData = {
          id: formData.id || null,
          topicCategory: 1,
          title: formData.title || '',
          content: formData.mainContent || '',
          images: Array.isArray(formData.mainImages) ? formData.mainImages : [],
          gearCategory: formData.gearCategory || '',
          gearModel: formData.gearModel || '',
          gearItemId: formData.gearItemId || null,
          usageYear: formData.usageYear || '',
          usageFrequency: formData.usageFrequency || '',
          verifyImage: formData.verifyImage || '',
          environments: Array.isArray(formData.environments) ? formData.environments : [],
          customScene: formData.customScene || '',
          ratings: Array.isArray(formData.ratings)
            ? formData.ratings
            : (formData.ratings && typeof formData.ratings === 'object'
              ? Object.entries(formData.ratings)
                .filter(([, score]) => score !== '' && score !== null && score !== undefined)
                .map(([key, score]) => ({ key, score: Number(score) }))
              : []),
          summary: formData.summary || '',
          repurchase: formData.repurchase || '',
          pros: Array.isArray(formData.pros) ? formData.pros.filter(Boolean) : [],
          cons: Array.isArray(formData.cons) ? formData.cons.filter(Boolean) : [],
          tags: {
            fit: Array.isArray(tags.fit) ? tags.fit : [],
            unfit: Array.isArray(tags.unfit) ? tags.unfit : [],
            pros: Array.isArray(tags.pros) ? tags.pros : [],
            cons: Array.isArray(tags.cons) ? tags.cons : [],
            budget: Array.isArray(tags.budget) ? (tags.budget[0] || '') : (tags.budget || ''),
            usage: Array.isArray(tags.usage) ? tags.usage : [],
            fitContextTags: Array.isArray(tags.fitContextTags) ? tags.fitContextTags : [],
            fitTechniqueTags: Array.isArray(tags.fitTechniqueTags) ? tags.fitTechniqueTags : [],
            compareProfile: Array.isArray(tags.compareProfile) ? tags.compareProfile : [],
            compareBuyDecision: Array.isArray(tags.compareBuyDecision) ? tags.compareBuyDecision : [],
            purchaseAdvice: Array.isArray(tags.purchaseAdvice) ? tags.purchaseAdvice : [],
            buyStage: Array.isArray(tags.buyStage) ? tags.buyStage : [],
            supplementParams: Array.isArray(tags.supplementParams) ? tags.supplementParams : []
          },
          customFit: formData.customFit || '',
          customUnfit: formData.customUnfit || '',
          comboGear: Array.isArray(formData.comboGear) ? formData.comboGear : [],
          comboDesc: formData.comboDesc || '',
          compareGear: Array.isArray(formData.compareGear) ? formData.compareGear : [],
          compareDesc: formData.compareDesc || ''
        };
        console.log('[post-Experience] submit tags summary=', {
          budget: tags.budget,
          usage: tags.usage,
          fit: tags.fit,
          unfit: tags.unfit
        });
        this.triggerEvent('submit', { formData: submitData });
      } else {
        wx.showToast({
          title: '请检查必填内容',
          icon: 'none'
        });
      }
    },

    // 验证整个表单
    validateForm() {
      const { formData } = this.data;
      const result = validateWithRules(formData, EXPERIENCE_FORM_RULES, this.getValidationContext());
      return this.handleValidationResult(result);
    },
    
  }
});
