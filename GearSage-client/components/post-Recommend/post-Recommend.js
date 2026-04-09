const { validateWithRules } = require('../../utils/postValidators');
const { getInitialDarkMode, subscribeThemeChange, unsubscribeThemeChange } = require('../../utils/theme');
const { resolveGearSearchType, getGearModelSuggestions } = require('../../utils/gearModelMatcher');
const tagConfig = require('../post-Evaluation/gearSageTagConfig.js');

const TOTAL_STEPS = 3;
const MAX_ENVIRONMENTS = 5;
const MAX_SCENE_CUSTOM_LENGTH = 10;
const CHINESE_ONLY_REGEXP = /[^\u4e00-\u9fa5]/g;

const USAGE_DURATION_OPTIONS = [
  { value: 'love_at_first_sight', name: '一见钟情' },
  { value: '1_month', name: '1个月' },
  { value: '1_3_months', name: '1–3个月' },
  { value: '3_12_months', name: '3–12个月' },
  { value: '1_year_plus', name: '1年以上' }
];

const USAGE_FREQUENCY_OPTIONS = [
  { value: 'essential', name: '出钓必备' },
  { value: 'several_times_week', name: '每周 多次' },
  { value: 'once_week', name: '每周 一次' },
  { value: 'several_times_month', name: '每月 多次' },
  { value: 'once_month', name: '每月 一次' },
  { value: 'several_times_year', name: '每年 多次' }
];

const SUMMARY_OPTIONS = [
    
        { value: 'strongly_recommend', label: '强烈推荐，明显超出预期' },
        { value: 'recommend', label: '值得推荐，整体满意' },
        { value: 'soso', label: '有一定亮点，但不一定适合所有人' },
        { value: 'not_recommend', label: '不太推荐，实际体验一般' }
      
];

const FIXED_BUDGET_OPTIONS = [
  { id: '入门预算', label: '入门预算' },
  { id: '主流价位', label: '主流价位' },
  { id: '进阶预算', label: '进阶预算' },
  { id: '高端预算', label: '高端预算' },
  { id: '旗舰体验', label: '旗舰体验' }
];

const FIXED_USAGE_OPTIONS = [
  { id: '入门友好', label: '入门友好' },
  { id: '泛用性强', label: '泛用性强' },
  { id: '进阶升级', label: '进阶升级' },
  { id: '场景专用', label: '场景专用' },
  { id: '老手向', label: '老手向' },
  { id: '极致体验', label: '极致体验' },
  { id: '性价比优先', label: '性价比优先' }
];

const SHARE_REASON_OPTIONS = [
  '最近新入手，初体验很好',
  '用了一段时间，发现很稳',
  '某个场景特别好用',
  '性价比超出预期',
  '搭配后体验明显提升',
  '冷门但值得关注',
  '不确定算不算神物，想和大家交流'
];

const RECOMMEND_REASON_OPTIONS = [
  '性价比高',
  '入门友好',
  '泛用性强',
  '手感出色',
  '抛投省力',
  '稳定耐用',
  '做工扎实',
  '细节到位',
  '场景适配强',
  '搭配灵活',
  '超出预期',
  '值得一试'
];

const CONTENT_PLACEHOLDER = '为什么想分享它;它在哪个场景下特别有价值;它最打动你的点是什么;它适合什么人立刻关注一下';
const WRITING_TIPS = [
  '可以写写：',
  '你为什么会买它或开始用它',
  '它最常出现在哪些场景里',
  '它最打动你的地方是什么',
  '它适合哪类钓友关注或尝试',
  '有没有什么地方和你原本预期不一样。'
];

const createDefaultTags = () => ({
  scene: [],
  customScene: [],
  budget: [],
  usage: [],
  shareReasons: []
});

const sanitizeChineseText = (value, maxLength) => {
  const normalized = typeof value === 'string' ? value.replace(CHINESE_ONLY_REGEXP, '') : '';
  return normalized.slice(0, maxLength);
};

const getSelectedSceneCount = (formData) => {
  const environments = Array.isArray(formData.environments) ? formData.environments.length : 0;
  const customSceneCount = formData.customScene ? 1 : 0;
  return environments + customSceneCount;
};

const RECOMMEND_STEP_RULES = {
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
        { type: 'required', message: '请选择使用时长' },
      ],
    },
    {
      field: 'usageFrequency',
      validators: [
        { type: 'required', message: '请选择使用频率', trim: true },
      ],
    },
    {
      field: 'environments',
      validators: [
        {
          type: 'custom',
          message: '请选择使用场景',
          validate: (_value, formData) => {
            const total = getSelectedSceneCount(formData);
            if (total < 1) {
              return '至少选择1个使用场景';
            }
            if (total > MAX_ENVIRONMENTS) {
              return '使用场景最多选择5个';
            }
            return true;
          }
        }
      ]
    }
  ],
  2: [
    {
      field: 'summary',
      validators: [
        { type: 'required', message: '请选择一句话总结' },
      ],
    },
    {
      field: 'shareReasons',
      getValue: (formData) => ((formData.tags || {}).shareReasons || []),
      validators: [
        {
          type: 'custom',
          message: '请选择分享理由',
          validate: (value) => {
            if (!Array.isArray(value) || value.length < 1) {
              return '请至少选择1个分享理由';
            }
            if (value.length > 2) {
              return '分享理由最多选择2个';
            }
            return true;
          }
        }
      ]
    },
    {
      field: 'pros',
      validators: [
        {
          type: 'custom',
          message: '请选择推荐理由',
          validate: (value) => {
            if (!Array.isArray(value) || value.length < 2) {
              return '推荐理由至少选择2个';
            }
            if (value.length > 4) {
              return '推荐理由最多选择4个';
            }
            return true;
          }
        }
      ]
    }
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
        { type: 'minLength', value: 50, message: '内容不能少于50字', trim: true },
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
};

const RECOMMEND_FORM_RULES = [
  ...RECOMMEND_STEP_RULES[1],
  ...RECOMMEND_STEP_RULES[2],
  ...RECOMMEND_STEP_RULES[3],
  {
    field: 'mainImages',
    validators: [
      { type: 'maxItems', value: 9, message: '最多只能上传9张图片' },
    ],
  },
];

Component({
  properties: {
    initialData: {
      type: Object,
      value: {}
    }
  },

  data: {
    currentStep: 1,
    isDarkMode: false,
    contentPlaceholder: CONTENT_PLACEHOLDER,
    writingTips: WRITING_TIPS,
    formData: {
      gearCategory: 'rod',
      gearModel: '',
      gearItemId: null,
      usageYear: '',
      usageFrequency: '',
      environments: [],
      customScene: '',
      title: '',
      mainContent: '',
      mainImages: [],
      summary: '',
      pros: [],
      tags: createDefaultTags()
    },
    errors: {
      gearCategory: '',
      usageYear: '',
      usageFrequency: '',
      environments: '',
      summary: '',
      shareReasons: '',
      pros: '',
      title: '',
      mainContent: '',
      mainImages: ''
    },
    canSelectGearModel: false,
    gearModelOptions: [],
    showGearModelOptions: false,
    equipmentCategories: [
      { id: 'rod', label: '鱼竿' },
      { id: 'reel', label: '渔轮' },
      { id: 'bait', label: '鱼饵' },
      { id: 'line', label: '鱼线' },
      { id: 'hook', label: '鱼钩' },
      { id: 'other', label: '其他' }
    ],
    usageYears: USAGE_DURATION_OPTIONS,
    usageFrequencies: USAGE_FREQUENCY_OPTIONS,
    summaryOptions: SUMMARY_OPTIONS,
    budgetOptions: FIXED_BUDGET_OPTIONS,
    usageOptions: FIXED_USAGE_OPTIONS,
    shareReasonOptions: SHARE_REASON_OPTIONS,
    recommendReasonOptions: RECOMMEND_REASON_OPTIONS,
    environments: [],
    usageFrequencyText: '请选择',
    summaryText: '请选择',
    selectorDrawerVisible: false,
    selectorDrawerType: '',
    selectorDrawerTitle: '',
    selectorDrawerOptions: []
  },

  lifetimes: {
    attached() {
      this.initFormData();
      const currCategory = this.data.formData.gearCategory || 'rod';
      this.loadEnvironmentOptions(currCategory);
      this.syncGearModelSuggestions(this.data.formData.gearCategory, this.data.formData.gearModel, false);
      this.refreshPickerText();
      this.initThemeMode();
      this._themeChangeHandler = subscribeThemeChange(({ theme }) => {
        this.setData({ isDarkMode: theme === 'dark' });
      });
    },
    detached() {
      this.clearGearModelBlurTimer();
      unsubscribeThemeChange(this._themeChangeHandler);
      this._themeChangeHandler = null;
    }
  },

  observers: {
    'formData.gearCategory': function(gearCategory) {
      const nextCategory = gearCategory || 'rod';
      this.updateEquipmentCategoryOptions((gearCategory || '').trim());
      this.loadEnvironmentOptions(nextCategory);
      this.syncGearModelSuggestions(
        gearCategory,
        this.data.formData.gearModel,
        this.data.showGearModelOptions
      );
    },
    'formData.environments, formData.customScene': function(selectedEnvironments) {
      this.updateEnvironmentsState(Array.isArray(selectedEnvironments) ? selectedEnvironments : []);
    },
    'formData.usageFrequency, formData.summary': function() {
      this.refreshPickerText();
    }
  },

  methods: {
    clearGearModelBlurTimer() {
      if (this._gearModelBlurTimer) {
        clearTimeout(this._gearModelBlurTimer);
        this._gearModelBlurTimer = null;
      }
    },

    initThemeMode() {
      const isDarkMode = getInitialDarkMode();
      this.setData({ isDarkMode });
    },

    initFormData() {
      const initialData = this.properties.initialData || {};
      const nextTags = {
        ...createDefaultTags(),
        ...(initialData.tags || {})
      };

      const nextFormData = {
        ...this.data.formData,
        ...initialData,
        pros: Array.isArray(initialData.pros) ? initialData.pros.filter(Boolean) : [],
        environments: Array.isArray(initialData.environments) ? initialData.environments : [],
        tags: {
          ...nextTags,
          scene: Array.isArray(nextTags.scene) && nextTags.scene.length
            ? nextTags.scene
            : (Array.isArray(initialData.environments) ? initialData.environments : []),
          customScene: Array.isArray(nextTags.customScene) && nextTags.customScene.length
            ? nextTags.customScene
            : (initialData.customScene ? [sanitizeChineseText(initialData.customScene, MAX_SCENE_CUSTOM_LENGTH)] : []),
          budget: Array.isArray(nextTags.budget) ? nextTags.budget.slice(0, 1) : [],
          usage: Array.isArray(nextTags.usage) ? nextTags.usage.slice(0, 2) : [],
          shareReasons: Array.isArray(nextTags.shareReasons) ? nextTags.shareReasons.slice(0, 2) : []
        },
        customScene: sanitizeChineseText(initialData.customScene || '', MAX_SCENE_CUSTOM_LENGTH)
      };

      this.setData({ formData: nextFormData });
      this.updateEquipmentCategoryOptions((nextFormData.gearCategory || '').trim());
    },

    updateEquipmentCategoryOptions(gearCategory) {
      const selectedCategory = gearCategory || '';
      const nextItems = (this.data.equipmentCategories || []).map((item) => ({
        ...item,
        checked: item.id === selectedCategory
      }));
      this.setData({ equipmentCategories: nextItems });
    },

    refreshPickerText() {
      const { usageFrequency, summary } = this.data.formData;
      const summaryOption = SUMMARY_OPTIONS.find((item) => item.value === summary);
      this.setData({
        usageFrequencyText: usageFrequency || '请选择',
        summaryText: summaryOption ? summaryOption.label : '请选择'
      });
    },

    getSelectorConfig(type) {
      if (type === 'usageFrequency') {
        return {
          title: '选择使用频率',
          value: this.data.formData.usageFrequency || '',
          options: USAGE_FREQUENCY_OPTIONS.map((item) => ({
            value: item.name,
            label: item.name
          }))
        };
      }

      if (type === 'summary') {
        return {
          title: '选择一句话总结',
          value: this.data.formData.summary || '',
          options: SUMMARY_OPTIONS.map((item) => ({
            value: item.value,
            label: item.label
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
      const { selectorDrawerType } = this.data;

      if (selectorDrawerType === 'usageFrequency') {
        this.setData({
          'formData.usageFrequency': value,
          'errors.usageFrequency': ''
        });
        this.triggerEvent('datachange', { field: 'usageFrequency', value });
      }

      if (selectorDrawerType === 'summary') {
        this.setData({
          'formData.summary': value,
          'errors.summary': ''
        });
        this.triggerEvent('datachange', { field: 'summary', value });
      }

      this.onCloseSelectorDrawer();
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

    loadEnvironmentOptions(gearCategory) {
      const categoryGroups = tagConfig.categoryGroups[gearCategory] || [];
      const sceneGroup = categoryGroups.find((group) => group.groupKey === 'scene');
      const environments = sceneGroup && Array.isArray(sceneGroup.options)
        ? sceneGroup.options.map((option) => ({ value: option.id, label: option.label }))
        : [];

      this.setData({ environments });
      this.updateEnvironmentsState(this.data.formData.environments || []);
    },

    updateEnvironmentsState(selectedValues) {
      const maxPresetCount = this.data.formData.customScene ? MAX_ENVIRONMENTS - 1 : MAX_ENVIRONMENTS;
      const environments = (this.data.environments || []).map((env) => {
        const isSelected = selectedValues.includes(env.value);
        return {
          ...env,
          checked: isSelected,
          disabled: !isSelected && selectedValues.length >= maxPresetCount
        };
      });

      this.setData({ environments });
    },

    updateTags(partialTags) {
      const nextTags = {
        ...(this.data.formData.tags || createDefaultTags()),
        ...partialTags
      };
      this.setData({ 'formData.tags': nextTags });
      this.triggerEvent('datachange', { field: 'tags', value: nextTags });
      return nextTags;
    },

    ongearCategorySelect(e) {
      const selectedItem = e.detail.selectedItem;
      const gearCategory = selectedItem ? selectedItem.id : '';
      const nextTags = {
        ...(this.data.formData.tags || createDefaultTags()),
        scene: [],
        customScene: []
      };

      this.setData({
        'formData.gearCategory': gearCategory,
        'formData.gearModel': '',
        'formData.gearItemId': null,
        'formData.environments': [],
        'formData.customScene': '',
        'formData.tags': nextTags,
        'errors.gearCategory': '',
        'errors.environments': ''
      });
      this.updateEquipmentCategoryOptions(gearCategory);

      this.syncGearModelSuggestions(gearCategory, '', true);
      this.triggerEvent('datachange', { field: 'gearCategory', value: gearCategory });
      this.triggerEvent('datachange', { field: 'gearModel', value: '' });
      this.triggerEvent('datachange', { field: 'gearItemId', value: null });
      this.triggerEvent('datachange', { field: 'environments', value: [] });
      this.triggerEvent('datachange', { field: 'customScene', value: '' });
      this.triggerEvent('datachange', { field: 'tags', value: nextTags });
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

    onUsageYearSelect(e) {
      const usageYear = e.detail.value || '';
      this.setData({
        'formData.usageYear': usageYear,
        'errors.usageYear': ''
      });
      this.triggerEvent('datachange', { field: 'usageYear', value: usageYear });
    },

    onEnvironmentToggle(e) {
      const value = e.currentTarget.dataset.value;
      const environments = Array.isArray(this.data.formData.environments) ? this.data.formData.environments : [];
      const maxPresetCount = this.data.formData.customScene ? MAX_ENVIRONMENTS - 1 : MAX_ENVIRONMENTS;
      let nextEnvironments = environments;

      if (environments.includes(value)) {
        nextEnvironments = environments.filter((item) => item !== value);
      } else {
        if (environments.length >= maxPresetCount) {
          wx.showToast({ title: `最多选择${MAX_ENVIRONMENTS}个使用场景`, icon: 'none' });
          return;
        }
        nextEnvironments = [...environments, value];
      }

      this.setData({
        'formData.environments': nextEnvironments,
        'errors.environments': ''
      });

      this.updateEnvironmentsState(nextEnvironments);
      this.updateTags({ scene: nextEnvironments });
      this.triggerEvent('datachange', { field: 'environments', value: nextEnvironments });
    },

    onCustomSceneInput(e) {
      const sanitizedValue = sanitizeChineseText(e.detail.value, MAX_SCENE_CUSTOM_LENGTH);
      const currentScene = this.data.formData.customScene || '';
      const environments = this.data.formData.environments || [];

      if (!currentScene && sanitizedValue && environments.length >= MAX_ENVIRONMENTS) {
        wx.showToast({ title: '自定义场景会占用1个标签位，请先取消一个场景', icon: 'none' });
        return;
      }

      this.setData({
        'formData.customScene': sanitizedValue,
        'errors.environments': ''
      });

      this.updateEnvironmentsState(environments);
      this.updateTags({ customScene: sanitizedValue ? [sanitizedValue] : [] });
      this.triggerEvent('datachange', { field: 'customScene', value: sanitizedValue });
    },

    onBudgetSelect(e) {
      const value = e.currentTarget.dataset.value;
      const currentBudget = ((this.data.formData.tags || {}).budget || [])[0];
      const nextBudget = currentBudget === value ? [] : [value];
      this.updateTags({ budget: nextBudget });
    },

    onUsageSelect(e) {
      const value = e.currentTarget.dataset.value;
      const currentUsage = (this.data.formData.tags || {}).usage || [];
      let nextUsage = currentUsage;

      if (currentUsage.includes(value)) {
        nextUsage = currentUsage.filter((item) => item !== value);
      } else {
        if (currentUsage.length >= 2) {
          wx.showToast({ title: '使用倾向最多选择2个', icon: 'none' });
          return;
        }
        nextUsage = [...currentUsage, value];
      }

      this.updateTags({ usage: nextUsage });
    },

    onShareReasonToggle(e) {
      const value = e.currentTarget.dataset.value;
      const currentReasons = (this.data.formData.tags || {}).shareReasons || [];
      let nextReasons = currentReasons;

      if (currentReasons.includes(value)) {
        nextReasons = currentReasons.filter((item) => item !== value);
      } else {
        if (currentReasons.length >= 2) {
          wx.showToast({ title: '分享理由最多选择2个', icon: 'none' });
          return;
        }
        nextReasons = [...currentReasons, value];
      }

      this.setData({ 'errors.shareReasons': '' });
      this.updateTags({ shareReasons: nextReasons });
    },

    onRecommendReasonToggle(e) {
      const value = e.currentTarget.dataset.value;
      const currentReasons = Array.isArray(this.data.formData.pros) ? this.data.formData.pros : [];
      let nextReasons = currentReasons;

      if (currentReasons.includes(value)) {
        nextReasons = currentReasons.filter((item) => item !== value);
      } else {
        if (currentReasons.length >= 4) {
          wx.showToast({ title: '推荐理由最多选择4个', icon: 'none' });
          return;
        }
        nextReasons = [...currentReasons, value];
      }

      this.setData({
        'formData.pros': nextReasons,
        'errors.pros': ''
      });
      this.triggerEvent('datachange', { field: 'pros', value: nextReasons });
    },

    onTitleInput(e) {
      const title = e.detail.value || '';
      this.setData({
        'formData.title': title,
        'errors.title': ''
      });
      this.triggerEvent('datachange', { field: 'title', value: title });
    },

    onMainContentInput(e) {
      const mainContent = e.detail.value || '';
      this.setData({
        'formData.mainContent': mainContent,
        'errors.mainContent': ''
      });
      this.triggerEvent('datachange', { field: 'mainContent', value: mainContent });
    },

    onChooseImage(e) {
      const newImageList = e.detail.value || [];
      this.setData({
        'formData.mainImages': newImageList,
        'errors.mainImages': ''
      });
      this.triggerEvent('datachange', { field: 'mainImages', value: newImageList });
    },

    onPreviewImage(e) {
      const index = e.detail.index;
      const { mainImages } = this.data.formData;
      if (!mainImages || !mainImages.length) {
        return;
      }
      wx.previewImage({
        current: mainImages[index],
        urls: mainImages
      });
    },

    onDeleteImage(e) {
      const index = e.detail.index;
      const mainImages = [...(this.data.formData.mainImages || [])];
      if (index >= 0 && index < mainImages.length) {
        mainImages.splice(index, 1);
        this.setData({
          'formData.mainImages': mainImages,
          'errors.mainImages': ''
        });
        this.triggerEvent('datachange', { field: 'mainImages', value: mainImages });
      }
    },

    onStepTap(e) {
      const targetStep = Number(e.currentTarget.dataset.step);
      if (!Number.isInteger(targetStep)) {
        return;
      }

      const clampedStep = Math.max(1, Math.min(targetStep, TOTAL_STEPS));
      if (clampedStep <= this.data.currentStep) {
        this.setData({ currentStep: clampedStep });
        this.scrollStepToTop();
      }
    },

    onPrevStep() {
      const prevStep = Math.max(1, this.data.currentStep - 1);
      if (prevStep !== this.data.currentStep) {
        this.setData({ currentStep: prevStep });
        this.scrollStepToTop();
      }
    },

    onNextStep() {
      if (!this.validateCurrentStep()) {
        wx.showToast({ title: '请检查必填内容', icon: 'none' });
        return;
      }

      const nextStep = Math.min(TOTAL_STEPS, this.data.currentStep + 1);
      if (nextStep !== this.data.currentStep) {
        this.setData({ currentStep: nextStep });
        this.scrollStepToTop();
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

    handleValidationResult(result) {
      const updatedErrors = { ...this.data.errors };
      result.checkedFields.forEach((field) => {
        updatedErrors[field] = result.errors[field] || '';
      });
      this.setData({ errors: updatedErrors });
      return result.isValid;
    },

    validateCurrentStep() {
      const rules = RECOMMEND_STEP_RULES[this.data.currentStep] || [];
      const result = validateWithRules(this.data.formData, rules, {});
      return this.handleValidationResult(result);
    },

    validateForm() {
      const result = validateWithRules(this.data.formData, RECOMMEND_FORM_RULES, {});
      return this.handleValidationResult(result);
    },

    onSubmit() {
      if (!this.validateForm()) {
        wx.showToast({ title: '请检查必填内容', icon: 'none' });
        return;
      }

      const formData = this.data.formData || {};
      const tags = formData.tags || {};
      const submitData = {
        id: formData.id || null,
        topicCategory: 0,
        title: formData.title || '',
        content: formData.mainContent || '',
        images: Array.isArray(formData.mainImages) ? formData.mainImages : [],
        gearCategory: formData.gearCategory || '',
        gearModel: formData.gearModel || '',
        gearItemId: formData.gearItemId || null,
        usageYear: formData.usageYear || '',
        usageFrequency: formData.usageFrequency || '',
        environments: Array.isArray(formData.environments) ? formData.environments : [],
        customScene: formData.customScene || '',
        summary: formData.summary || '',
        pros: Array.isArray(formData.pros) ? formData.pros.filter(Boolean) : [],
        tags: {
          scene: Array.isArray(tags.scene) ? tags.scene : [],
          customScene: Array.isArray(tags.customScene) ? tags.customScene : [],
          budget: Array.isArray(tags.budget) ? (tags.budget[0] || '') : (tags.budget || ''),
          usage: Array.isArray(tags.usage) ? tags.usage : [],
          shareReasons: Array.isArray(tags.shareReasons) ? tags.shareReasons : []
        }
      };
      this.triggerEvent('submit', { formData: submitData });
    }
  }
});
