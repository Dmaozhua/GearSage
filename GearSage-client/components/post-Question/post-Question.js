const { getInitialDarkMode, subscribeThemeChange, unsubscribeThemeChange } = require('../../utils/theme');
const { resolveGearSearchType, getGearModelSuggestions } = require('../../utils/gearModelMatcher');

const QUESTION_TYPES = [
  { id: 'ask', label: '提问' },
  { id: 'discuss', label: '讨论' },
  { id: 'recommend', label: '求推荐' },
  { id: 'avoid_pitfall', label: '求避坑' },
  { id: 'chat_with_photos', label: '晒图闲聊' }
];

const GEAR_CATEGORIES = [
  { id: 'rod', label: '鱼竿' },
  { id: 'reel', label: '渔轮' },
  { id: 'bait', label: '鱼饵' },
  { id: 'line', label: '鱼线' },
  { id: 'hook', label: '鱼钩' },
  { id: 'other', label: '其他' }
];

const QUESTION_TIPS_MAP = {
  ask: [
    '适合场景： 遇到具体困难，想知道如何解决',
    '你可以这样提问：',
    '你遇到了什么问题？（请尽量具体描述）',
    '问题发生在什么场景下？（如时间、地点、环境等）',
    '你已经尝试过哪些解决办法？',
    '你最想得到什么样的建议？',
    '小贴士：描述得越详细，大家越能给出有针对性的帮助。'
  ],
  discuss: [
    '适合场景： 交流观点、分享经验、引发思考',
    '你可以这样发起讨论：',
    '你想聊的核心观点是什么？',
    '你为什么会有这个看法？（背后的原因或经历）',
    '你更希望听到大家分享类似经历，还是表达不同立场？',
    '小贴士：明确你的讨论方向，能让交流更深入。'
  ],
  recommend: [
    '适合场景： 买前纠结、搭配方案、装备升级',
    '为了让推荐更精准，请提供以下信息：',
    '你的预算是多少？',
    '主要使用场景是什么？（如野钓、黑坑、海钓等）',
    '目标鱼种是什么？',
    '你现在已经拥有哪些装备？',
    '你更看重性价比、泛用性还是极致体验？',
    '小贴士：信息越详细，推荐越贴合你的需求！'
  ],
  avoid_pitfall: [
    '适合场景： 担心踩坑、想了解某款装备的真实口碑',
    '你可以这样提问：',
    '你目前正在考虑哪几款装备？',
    '你最担心的问题是什么？（如质量、性能、售后等）',
    '你的预算和使用场景是怎样的？',
    '你想避开哪些具体的坑？（例如容易断杆、太重等）',
    '小贴士：列出备选款式和疑虑，大家帮你一起排雷。'
  ],
  chat_with_photos: [
    '适合场景： 晒渔获、分享故事、活跃气氛',
    '晒出你的图片，并和大家聊聊：',
    '这张图背后有什么有趣的故事？',
    '你想和大家聊什么话题？',
    '这次经历中你最想分享的点是什么？',
    '小贴士：一张好图配一个好故事，更能引发共鸣！'
  ]
};

const CONTENT_PLACEHOLDER_MAP = {
  ask: '请详细描述你遇到的问题...',
  discuss: '说说你想发起讨论的观点...',
  recommend: '补充预算、场景和已有装备，会更方便大家推荐...',
  avoid_pitfall: '把你的备选装备和顾虑写清楚，大家更容易帮你排雷...',
  chat_with_photos: '配上故事和想聊的话题，会更容易引发互动...'
};

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
    formData: {
      questionType: '',
      relatedGearCategory: '',
      relatedGearModel: '',
      relatedGearItemId: null,
      quickReplyOnly: false,
      title: '',
      mainContent: '',
      mainImages: []
    },
    errors: {},
    contentPlaceholder: CONTENT_PLACEHOLDER_MAP.ask,
    writingTips: QUESTION_TIPS_MAP.ask,
    canSelectGearModel: false,
    gearModelOptions: [],
    showGearModelOptions: false
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
        questionType: initialData.questionType || '',
        relatedGearCategory: initialData.relatedGearCategory || '',
        relatedGearModel: initialData.relatedGearModel || '',
        relatedGearItemId: initialData.relatedGearItemId || null,
        quickReplyOnly: Boolean(initialData.quickReplyOnly)
      };

      this.setData({
        formData: nextFormData
      });
      this.refreshQuestionTypePresentation(nextFormData.questionType);
    },

    refreshQuestionTypePresentation(typeValue) {
      const type = typeValue || this.data.formData.questionType || 'ask';
      this.setData({
        contentPlaceholder: CONTENT_PLACEHOLDER_MAP[type] || CONTENT_PLACEHOLDER_MAP.ask,
        writingTips: QUESTION_TIPS_MAP[type] || QUESTION_TIPS_MAP.ask
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
        'formData.relatedGearItemId': null
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
      const relatedGearItemId = Number(e.currentTarget.dataset.sourceId || 0) || null;
      this.setData({
        'formData.relatedGearModel': relatedGearModel,
        'formData.relatedGearItemId': relatedGearItemId,
        showGearModelOptions: false
      });
      this.triggerEvent('datachange', { field: 'relatedGearModel', value: relatedGearModel });
      this.triggerEvent('datachange', { field: 'relatedGearItemId', value: relatedGearItemId });
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
      const submitData = {
        topicCategory: 2,
        title: formData.title || '',
        content: formData.mainContent || '',
        images: Array.isArray(formData.mainImages) ? formData.mainImages : [],
        questionType: formData.questionType || '',
        relatedGearCategory: formData.relatedGearCategory || '',
        relatedGearModel: formData.relatedGearModel || '',
        relatedGearItemId: formData.relatedGearItemId || null,
        quickReplyOnly: Boolean(formData.quickReplyOnly)
      };
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

      if (!formData.questionType) {
        errors.questionType = '请选择类型';
      }

      if (!formData.title || !formData.title.trim()) {
        errors.title = '请输入标题';
      } else if (formData.title.length > 20) {
        errors.title = '标题不能超过20个字符';
      }

      if (!formData.mainContent || !formData.mainContent.trim()) {
        errors.mainContent = '请输入内容';
      } else if (formData.mainContent.trim().length < 10) {
        errors.mainContent = '内容不能少于10字';
      } else if (formData.mainContent.length > 1000) {
        errors.mainContent = '内容不能超过1000字';
      }

      if ((formData.mainImages || []).length > 9) {
        errors.mainImages = '最多只能上传9张图片';
      }

      this.setData({ errors });
      return Object.keys(errors).length === 0;
    }
  }
});
