const { getInitialDarkMode, subscribeThemeChange, unsubscribeThemeChange } = require('../../utils/theme');
const { resolveGearSearchType, getGearModelSuggestions } = require('../../utils/gearModelMatcher');

const QUESTION_TYPES = [
  { id: 'recommend', label: '求推荐' },
  { id: 'ask', label: '提问' },
  { id: 'discuss', label: '讨论' },
  { id: 'chat_with_photos', label: '晒图闲聊' }
];

const GEAR_CATEGORIES = [
  { id: 'rod', label: '鱼竿' },
  { id: 'reel', label: '渔轮' },
  { id: 'bait', label: '鱼饵' },
  { id: 'line', label: '鱼线' },
  { id: 'hook', label: '钩子/配件' },
  { id: 'combo', label: '整套搭配' },
  { id: 'other', label: '其他' }
];

const RECOMMEND_INTENT_OPTIONS = [
  { id: 'first_set', label: '第一套入门' },
  { id: 'fill_gap', label: '已有一套，想补一个空位' },
  { id: 'replace_old', label: '旧装备用久了想替换' },
  { id: 'upgrade', label: '已有装备，想升级进阶' },
  { id: 'compare_options', label: '二选一 / 三选一' },
  { id: 'full_combo', label: '整套求配' }
];

const BUDGET_RANGE_OPTIONS = [
  { id: 'under_300', label: '300 以内' },
  { id: '300_500', label: '300~500' },
  { id: '500_800', label: '500~800' },
  { id: '800_1200', label: '800~1200' },
  { id: '1200_1800', label: '1200~1800' },
  { id: '1800_2500', label: '1800~2500' },
  { id: '2500_4000', label: '2500~4000' },
  { id: '4000_plus', label: '4000+' }
];

const BUDGET_FLEXIBLE_OPTIONS = [
  { id: 'hard_limit', label: '预算基本卡死' },
  { id: 'slightly_flexible', label: '可上浮一点' },
  { id: 'accept_used', label: '可接受二手' },
  { id: 'new_only', label: '只看全新' }
];

const TARGET_FISH_OPTIONS = [
  { id: 'largemouth_bass', label: '鲈鱼' },
  { id: 'topmouth_culter', label: '翘嘴' },
  { id: 'mandarin_fish', label: '鳜鱼' },
  { id: 'snakehead', label: '黑鱼' },
  { id: 'stream_small_fish', label: '马口 / 溪流小型鱼' },
  { id: 'seabass', label: '海鲈' },
  { id: 'all_round', label: '综合泛用' },
  { id: 'other', label: '其他' }
];

const USE_SCENE_OPTIONS = [
  { id: 'wild_river', label: '野河' },
  { id: 'reservoir', label: '水库' },
  { id: 'stream', label: '溪流' },
  { id: 'inshore', label: '近海' },
  { id: 'urban_river', label: '城市河道' },
  { id: 'managed_water', label: '黑坑 / 管理场' },
  { id: 'mixed', label: '综合不固定' }
];

const CARE_PRIORITY_OPTIONS = [
  { id: 'value_for_money', label: '性价比' },
  { id: 'versatile', label: '泛用' },
  { id: 'lightweight', label: '轻量' },
  { id: 'long_cast', label: '远投' },
  { id: 'smooth', label: '顺滑' },
  { id: 'durable', label: '耐用' },
  { id: 'beginner_friendly', label: '新手友好' },
  { id: 'fish_control', label: '控鱼 / 腰力' },
  { id: 'sensitive', label: '细腻手感' },
  { id: 'appearance', label: '做工颜值' },
  { id: 'resale', label: '保值' }
];

const AVOID_POINT_OPTIONS = [
  { id: 'too_heavy', label: '不想太重' },
  { id: 'too_expensive', label: '不想太贵' },
  { id: 'too_delicate', label: '不想太娇气' },
  { id: 'too_specialized', label: '不想太专用' },
  { id: 'hard_to_use', label: '不想难上手' },
  { id: 'high_maintenance', label: '不想后期维护麻烦' },
  { id: 'picky_line_bait', label: '不想太挑线 / 挑饵' },
  { id: 'other', label: '其他' }
];

const RECOMMEND_USAGE_FREQUENCY_OPTIONS = [
  { id: 'essential', label: '出钓必备 / 高频使用' },
  { id: 'weekly_once', label: '每周一次左右' },
  { id: 'monthly_several', label: '每月几次' },
  { id: 'occasional', label: '偶尔玩玩' }
];

const QUESTION_TIPS_MAP = {
  ask: [
    '适合场景：遇到具体困难，想知道如何解决',
    '描述清楚问题发生在哪个环节、你已经试过什么，会更容易收到有针对性的回复。'
  ],
  discuss: [
    '适合场景：交流观点、分享经验、引发思考',
    '把你想讨论的核心观点先说清楚，大家更容易接住你的讨论方向。'
  ],
  recommend: [
    '这次会优先帮你把“求推荐”信息结构化，不用一开始就写很长正文。',
    '先把预算、鱼种、场景、在意点和核心纠结说清楚，推荐质量会高很多。'
  ],
  chat_with_photos: [
    '适合场景：晒图、讲故事、轻松聊天',
    '有图有故事会更容易激发互动。'
  ]
};

const CONTENT_PLACEHOLDER_MAP = {
  ask: '请详细描述你遇到的问题...',
  discuss: '说说你想发起讨论的观点...',
  recommend: '还有什么背景补充，可以写在这里。比如候选型号的使用顾虑、已有装备细节、作钓习惯等。',
  chat_with_photos: '配上故事和想聊的话题，会更容易引发互动...'
};

function createEmptyRecommendMeta() {
  return {
    recommendIntent: '',
    budgetRange: '',
    budgetFlexible: '',
    targetFish: [],
    useScene: [],
    carePriorities: [],
    avoidPoints: [],
    currentGear: '',
    candidateOptions: ['', '', ''],
    usageFrequency: '',
    coreQuestion: ''
  };
}

function normalizeRecommendIntent(value, legacyCurrentStage = '') {
  const text = String(value || '').trim();
  const legacyText = String(legacyCurrentStage || '').trim();
  const source = text || legacyText;

  if (!source) {
    return '';
  }

  const aliasMap = {
    strengthen_existing: 'fill_gap',
    beginner_no_gear: 'first_set',
    one_set_fill_gap: 'fill_gap',
    multi_set_upgrade: 'upgrade',
    replace_old: 'replace_old',
    first_set: 'first_set',
    fill_gap: 'fill_gap',
    upgrade: 'upgrade',
    compare_options: 'compare_options',
    full_combo: 'full_combo'
  };

  return aliasMap[source] || source;
}

function normalizeRecommendMeta(value) {
  const source = value && typeof value === 'object' ? value : {};
  const candidateOptions = Array.isArray(source.candidateOptions) ? source.candidateOptions.slice(0, 3) : [];
  while (candidateOptions.length < 3) {
    candidateOptions.push('');
  }

  return {
    ...createEmptyRecommendMeta(),
    ...source,
    recommendIntent: normalizeRecommendIntent(source.recommendIntent, source.currentStage),
    targetFish: Array.isArray(source.targetFish) ? source.targetFish.filter(Boolean).slice(0, 3) : [],
    useScene: Array.isArray(source.useScene) ? source.useScene.filter(Boolean).slice(0, 2) : [],
    carePriorities: Array.isArray(source.carePriorities) ? source.carePriorities.filter(Boolean).slice(0, 3) : [],
    avoidPoints: Array.isArray(source.avoidPoints) ? source.avoidPoints.filter(Boolean).slice(0, 3) : [],
    candidateOptions: candidateOptions.map((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        return String(item.label || '').trim();
      }
      return String(item || '').trim();
    })
  };
}

function buildLabelMap(options = []) {
  return options.reduce((acc, item) => {
    acc[item.id] = item.label;
    return acc;
  }, {});
}

const GEAR_CATEGORY_LABEL_MAP = buildLabelMap(GEAR_CATEGORIES);
const BUDGET_RANGE_LABEL_MAP = buildLabelMap(BUDGET_RANGE_OPTIONS);
const USE_SCENE_LABEL_MAP = buildLabelMap(USE_SCENE_OPTIONS);
const TARGET_FISH_LABEL_MAP = buildLabelMap(TARGET_FISH_OPTIONS);

function buildRecommendTitle(formData = {}) {
  const recommendMeta = normalizeRecommendMeta(formData.recommendMeta);
  const candidateLabels = recommendMeta.candidateOptions.filter(Boolean);

  if (candidateLabels.length >= 2) {
    return `【求推荐】${candidateLabels[0]}和${candidateLabels[1]}怎么选`.slice(0, 40);
  }

  const budgetLabel = BUDGET_RANGE_LABEL_MAP[recommendMeta.budgetRange] || '';
  const sceneLabel = USE_SCENE_LABEL_MAP[recommendMeta.useScene[0]] || '';
  const fishLabel = TARGET_FISH_LABEL_MAP[recommendMeta.targetFish[0]] || '';
  const gearLabel = GEAR_CATEGORY_LABEL_MAP[formData.relatedGearCategory] || '装备';

  return `【求推荐】${budgetLabel}${sceneLabel}${fishLabel}${gearLabel}怎么选`
    .replace(/【求推荐】/, '【求推荐】')
    .slice(0, 40);
}

function toggleMultiValue(currentList = [], value, maxCount) {
  const normalized = Array.isArray(currentList) ? currentList.filter(Boolean) : [];
  const index = normalized.indexOf(value);
  if (index >= 0) {
    normalized.splice(index, 1);
    return normalized;
  }
  if (normalized.length >= maxCount) {
    return normalized;
  }
  normalized.push(value);
  return normalized;
}

function buildSelectedMap(values = []) {
  return (Array.isArray(values) ? values : []).reduce((acc, item) => {
    acc[item] = true;
    return acc;
  }, {});
}

function buildOptionView(options = [], selectedMap = {}) {
  return (Array.isArray(options) ? options : []).map((item) => ({
    ...item,
    selected: Boolean(selectedMap[item.id])
  }));
}

Component({
  properties: {
    initialData: {
      type: Object,
      value: {}
    }
  },

  data: {
    isDarkMode: false,
    typeOptions: QUESTION_TYPES,
    gearCategoryOptions: GEAR_CATEGORIES,
    recommendIntentOptions: RECOMMEND_INTENT_OPTIONS,
    budgetRangeOptions: BUDGET_RANGE_OPTIONS,
    budgetFlexibleOptions: BUDGET_FLEXIBLE_OPTIONS,
    targetFishOptions: buildOptionView(TARGET_FISH_OPTIONS),
    useSceneOptions: buildOptionView(USE_SCENE_OPTIONS),
    carePriorityOptions: buildOptionView(CARE_PRIORITY_OPTIONS),
    avoidPointOptions: buildOptionView(AVOID_POINT_OPTIONS),
    recommendUsageFrequencyOptions: RECOMMEND_USAGE_FREQUENCY_OPTIONS,
    formData: {
      questionType: 'recommend',
      relatedGearCategory: '',
      relatedGearModel: '',
      relatedGearItemId: null,
      quickReplyOnly: false,
      title: '',
      mainContent: '',
      mainImages: [],
      recommendMeta: createEmptyRecommendMeta()
    },
    errors: {},
    titlePlaceholder: '可留空，系统会帮你生成标题',
    contentPlaceholder: CONTENT_PLACEHOLDER_MAP.recommend,
    writingTips: QUESTION_TIPS_MAP.recommend,
    canSelectGearModel: false,
    gearModelOptions: [],
    showGearModelOptions: false,
    maxImages: 3,
    maxTitleLength: 40,
    maxContentLength: 300,
    coreQuestionLength: 0
  },

  lifetimes: {
    attached() {
      this.initFormData();
      this.refreshQuestionTypePresentation(this.data.formData.questionType);
      this.syncGearModelSuggestions(
        this.data.formData.relatedGearCategory,
        this.data.formData.relatedGearModel,
        false
      );
      this.initThemeMode();
      this._themeChangeHandler = subscribeThemeChange(({ theme }) => {
        this.setData({
          isDarkMode: theme === 'dark'
        });
      });
    },

    detached() {
      this.clearGearModelBlurTimer();
      unsubscribeThemeChange(this._themeChangeHandler);
      this._themeChangeHandler = null;
    }
  },

  methods: {
    clearGearModelBlurTimer() {
      if (this._gearModelBlurTimer) {
        clearTimeout(this._gearModelBlurTimer);
        this._gearModelBlurTimer = null;
      }
    },

    initFormData() {
      const initialData = this.properties.initialData || {};
      const nextFormData = {
        ...this.data.formData,
        ...initialData,
        questionType: initialData.questionType || 'recommend',
        relatedGearCategory: initialData.relatedGearCategory || '',
        relatedGearModel: initialData.relatedGearModel || '',
        relatedGearItemId: initialData.relatedGearItemId || null,
        quickReplyOnly: Boolean(initialData.quickReplyOnly),
        recommendMeta: normalizeRecommendMeta(initialData.recommendMeta)
      };

      this.setData({
        formData: nextFormData,
        coreQuestionLength: String(nextFormData.recommendMeta.coreQuestion || '').length
      });
      this.refreshQuestionTypePresentation(nextFormData.questionType);
      this.refreshRecommendOptionViews(nextFormData.recommendMeta);
    },

    refreshQuestionTypePresentation(typeValue) {
      const type = typeValue || this.data.formData.questionType || 'recommend';
      const isRecommend = type === 'recommend';
      this.setData({
        titlePlaceholder: isRecommend ? '可留空，系统会帮你生成标题' : '请输入标题...',
        contentPlaceholder: CONTENT_PLACEHOLDER_MAP[type] || CONTENT_PLACEHOLDER_MAP.ask,
        writingTips: QUESTION_TIPS_MAP[type] || QUESTION_TIPS_MAP.ask,
        maxImages: isRecommend ? 3 : 9,
        maxTitleLength: isRecommend ? 40 : 20,
        maxContentLength: isRecommend ? 300 : 1000
      });
    },

    syncGearModelSuggestions(gearCategory, keyword = '', showOptions = false) {
      const canSelectGearModel = Boolean(resolveGearSearchType(gearCategory));
      const gearModelOptions = canSelectGearModel
        ? getGearModelSuggestions(gearCategory, keyword)
        : [];

      this.setData({
        canSelectGearModel,
        gearModelOptions,
        showGearModelOptions: canSelectGearModel ? showOptions : false
      });
    },

    syncRecommendMeta(nextMeta) {
      this.setData({
        'formData.recommendMeta': nextMeta,
        coreQuestionLength: String(nextMeta.coreQuestion || '').length
      });
      this.refreshRecommendOptionViews(nextMeta);
      this.triggerEvent('datachange', { field: 'recommendMeta', value: nextMeta });
    },

    refreshRecommendOptionViews(recommendMetaValue) {
      const recommendMeta = normalizeRecommendMeta(recommendMetaValue);
      this.setData({
        targetFishOptions: buildOptionView(
          TARGET_FISH_OPTIONS,
          buildSelectedMap(recommendMeta.targetFish)
        ),
        useSceneOptions: buildOptionView(
          USE_SCENE_OPTIONS,
          buildSelectedMap(recommendMeta.useScene)
        ),
        carePriorityOptions: buildOptionView(
          CARE_PRIORITY_OPTIONS,
          buildSelectedMap(recommendMeta.carePriorities)
        ),
        avoidPointOptions: buildOptionView(
          AVOID_POINT_OPTIONS,
          buildSelectedMap(recommendMeta.avoidPoints)
        )
      });
    },

    onQuestionTypeSelect(e) {
      const questionType = e.currentTarget.dataset.value || '';
      this.setData({
        'formData.questionType': questionType,
        'errors.questionType': ''
      });
      this.refreshQuestionTypePresentation(questionType);
      this.triggerEvent('datachange', { field: 'questionType', value: questionType });
    },

    onRelatedGearCategorySelect(e) {
      const relatedGearCategory = e.currentTarget.dataset.value || '';
      this.setData({
        'formData.relatedGearCategory': relatedGearCategory,
        'formData.relatedGearModel': '',
        'formData.relatedGearItemId': null,
        'errors.relatedGearCategory': ''
      });
      this.syncGearModelSuggestions(relatedGearCategory, '', true);
      this.triggerEvent('datachange', { field: 'relatedGearCategory', value: relatedGearCategory });
      this.triggerEvent('datachange', { field: 'relatedGearModel', value: '' });
      this.triggerEvent('datachange', { field: 'relatedGearItemId', value: null });
    },

    onGearModelInput(e) {
      const relatedGearModel = e.detail.value || '';
      const relatedGearCategory = this.data.formData.relatedGearCategory;
      this.setData({
        'formData.relatedGearModel': relatedGearModel,
        'formData.relatedGearItemId': null
      });
      this.syncGearModelSuggestions(relatedGearCategory, relatedGearModel, true);
      this.triggerEvent('datachange', { field: 'relatedGearModel', value: relatedGearModel });
      this.triggerEvent('datachange', { field: 'relatedGearItemId', value: null });
    },

    onGearModelFocus() {
      this.clearGearModelBlurTimer();
      const { relatedGearCategory, relatedGearModel } = this.data.formData;
      this.syncGearModelSuggestions(relatedGearCategory, relatedGearModel, true);
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
      const relatedGearModel = e.currentTarget.dataset.name || '';
      const relatedGearItemId = e.currentTarget.dataset.sourceId ? String(e.currentTarget.dataset.sourceId).trim() : null;
      this.setData({
        'formData.relatedGearModel': relatedGearModel,
        'formData.relatedGearItemId': relatedGearItemId,
        showGearModelOptions: false
      });
      this.triggerEvent('datachange', { field: 'relatedGearModel', value: relatedGearModel });
      this.triggerEvent('datachange', { field: 'relatedGearItemId', value: relatedGearItemId });
    },

    onRecommendSingleSelect(e) {
      const field = e.currentTarget.dataset.field || '';
      const value = e.currentTarget.dataset.value || '';
      if (!field) {
        return;
      }

      const recommendMeta = normalizeRecommendMeta(this.data.formData.recommendMeta);
      const nextMeta = {
        ...recommendMeta,
        [field]: recommendMeta[field] === value ? '' : value
      };
      this.setData({
        [`errors.${field}`]: ''
      });
      this.syncRecommendMeta(nextMeta);
    },

    onRecommendMultiSelect(e) {
      const field = e.currentTarget.dataset.field || '';
      const value = e.currentTarget.dataset.value || '';
      const max = Number(e.currentTarget.dataset.max || 0);
      if (!field || !value || !max) {
        return;
      }

      const recommendMeta = normalizeRecommendMeta(this.data.formData.recommendMeta);
      const nextValues = toggleMultiValue(recommendMeta[field], value, max);
      if (Array.isArray(recommendMeta[field]) && recommendMeta[field].length >= max && nextValues.length === recommendMeta[field].length && !recommendMeta[field].includes(value)) {
        wx.showToast({
          title: `最多选择 ${max} 项`,
          icon: 'none'
        });
        return;
      }

      const nextMeta = {
        ...recommendMeta,
        [field]: nextValues
      };
      this.setData({
        [`errors.${field}`]: ''
      });
      this.syncRecommendMeta(nextMeta);
    },

    onRecommendInput(e) {
      const field = e.currentTarget.dataset.field || '';
      if (!field) {
        return;
      }
      const value = e.detail.value || '';
      const recommendMeta = normalizeRecommendMeta(this.data.formData.recommendMeta);
      const nextMeta = {
        ...recommendMeta,
        [field]: value
      };
      this.setData({
        [`errors.${field}`]: ''
      });
      this.syncRecommendMeta(nextMeta);
    },

    onCandidateOptionInput(e) {
      const index = Number(e.currentTarget.dataset.index || 0);
      const value = e.detail.value || '';
      const recommendMeta = normalizeRecommendMeta(this.data.formData.recommendMeta);
      const candidateOptions = recommendMeta.candidateOptions.slice(0, 3);
      while (candidateOptions.length < 3) {
        candidateOptions.push('');
      }
      candidateOptions[index] = value;
      this.syncRecommendMeta({
        ...recommendMeta,
        candidateOptions
      });
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

    onPreviewImage(e) {
      const index = e.detail.index;
      const images = this.data.formData.mainImages || [];
      if (!images.length) {
        return;
      }
      wx.previewImage({
        current: images[index],
        urls: images
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

    onChooseImage(e) {
      const newImageList = e.detail.value || [];
      this.setData({
        'formData.mainImages': newImageList,
        'errors.mainImages': ''
      });
      this.triggerEvent('datachange', { field: 'mainImages', value: newImageList });
    },

    onQuickReplyChange(e) {
      const quickReplyOnly = Boolean(e.detail.value);
      this.setData({
        'formData.quickReplyOnly': quickReplyOnly
      });
      this.triggerEvent('datachange', { field: 'quickReplyOnly', value: quickReplyOnly });
    },

    onSubmit() {
      if (!this.validateForm()) {
        wx.showToast({
          title: '请检查必填内容',
          icon: 'none'
        });
        return;
      }

      const formData = this.data.formData || {};
      const questionType = formData.questionType || 'recommend';
      const recommendMeta = normalizeRecommendMeta(formData.recommendMeta);
      const generatedTitle = questionType === 'recommend' && !String(formData.title || '').trim()
        ? buildRecommendTitle(formData)
        : '';
      const finalTitle = String(formData.title || '').trim() || generatedTitle || '【求推荐】想听听大家的建议';

      const submitData = {
        id: formData.id || null,
        topicCategory: 2,
        title: finalTitle,
        content: questionType === 'recommend' ? (formData.mainContent || '').trim() : (formData.mainContent || ''),
        images: Array.isArray(formData.mainImages) ? formData.mainImages : [],
        questionType,
        relatedGearCategory: formData.relatedGearCategory || '',
        relatedGearModel: formData.relatedGearModel || '',
        relatedGearItemId: formData.relatedGearItemId || null,
        quickReplyOnly: Boolean(formData.quickReplyOnly)
      };

      if (questionType === 'recommend') {
        submitData.recommendMeta = {
          ...recommendMeta,
          candidateOptions: recommendMeta.candidateOptions
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .slice(0, 3)
        };
      }

      this.triggerEvent('submit', { formData: submitData });
    },

    initThemeMode() {
      const isDarkMode = getInitialDarkMode();
      this.setData({
        isDarkMode
      });
    },

    validateForm() {
      const { formData } = this.data;
      const errors = {};
      const questionType = formData.questionType || 'recommend';
      const isRecommend = questionType === 'recommend';
      const title = String(formData.title || '').trim();
      const mainContent = String(formData.mainContent || '').trim();
      const recommendMeta = normalizeRecommendMeta(formData.recommendMeta);
      const imageLimit = isRecommend ? 3 : 9;

      if (!questionType) {
        errors.questionType = '请选择类型';
      }

      if (isRecommend) {
        if (!formData.relatedGearCategory) {
          errors.relatedGearCategory = '请选择主询问装备类型';
        }
        if (!recommendMeta.recommendIntent) {
          errors.recommendIntent = '请选择当前情况';
        }
        if (!recommendMeta.budgetRange) {
          errors.budgetRange = '请选择预算区间';
        }
        if (!recommendMeta.targetFish.length) {
          errors.targetFish = '至少选择 1 个目标鱼';
        }
        if (!recommendMeta.useScene.length) {
          errors.useScene = '至少选择 1 个使用场景';
        }
        if (!recommendMeta.carePriorities.length) {
          errors.carePriorities = '至少选择 1 个在意点';
        }
        if (!recommendMeta.coreQuestion || String(recommendMeta.coreQuestion).trim().length < 10) {
          errors.coreQuestion = '核心纠结至少写 10 个字';
        } else if (String(recommendMeta.coreQuestion).trim().length > 120) {
          errors.coreQuestion = '核心纠结不能超过 120 个字';
        }

        if (title.length > 40) {
          errors.title = '标题不能超过40个字符';
        }

        if (mainContent.length > 300) {
          errors.mainContent = '补充说明不能超过300字';
        }
      } else {
        if (!title) {
          errors.title = '请输入标题';
        } else if (title.length > 20) {
          errors.title = '标题不能超过20个字符';
        }

        if (!mainContent) {
          errors.mainContent = '请输入内容';
        } else if (mainContent.length < 10) {
          errors.mainContent = '内容不能少于10字';
        } else if (mainContent.length > 1000) {
          errors.mainContent = '内容不能超过1000字';
        }
      }

      if ((formData.mainImages || []).length > imageLimit) {
        errors.mainImages = `最多只能上传${imageLimit}张图片`;
      }

      this.setData({ errors });
      return Object.keys(errors).length === 0;
    }
  }
});
