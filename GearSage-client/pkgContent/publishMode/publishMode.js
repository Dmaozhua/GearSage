// pages/publishMode/publishMode.js
const api = require('../../services/api.js');

const TOPIC_PREVIEW_STORAGE_KEY = 'topic_preview_payload_v1';
const MODE_CONFIG = [
  {
    modeKey: 'recommend',
    title: '好物速报',
    content: '爱不释手的好物件，何不拿出来分享',
    topicCategory: 0
  },
  {
    modeKey: 'experience',
    title: '长测评',
    content: '你的宝贵经验，系统评测',
    topicCategory: 1
  },
  {
    modeKey: 'question',
    title: '讨论&提问',
    content: '发布问题召集路亚老手答疑解惑',
    topicCategory: 2
  },
  {
    modeKey: 'catch',
    title: '鱼获展示',
    content: '晒出你的高光时刻，纪录每一次心跳',
    topicCategory: 3
  },
  {
    modeKey: 'trip',
    title: '钓行分享',
    content: '记录每一次出钓的得失与感悟',
    topicCategory: 4
  }
];

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function getModeConfigByKey(modeKey) {
  return MODE_CONFIG.find(item => item.modeKey === modeKey) || null;
}

function getModeConfigByTopicCategory(topicCategory) {
  return MODE_CONFIG.find(item => Number(item.topicCategory) === Number(topicCategory)) || null;
}

function createModeInitialFormData(modeKey) {
  if (modeKey === 'experience' || modeKey === 'recommend') {
    return {
      gearCategory: 'rod'
    };
  }

  if (modeKey === 'question') {
    return {
      questionType: 'recommend',
      recommendMeta: {
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
      }
    };
  }

  return {};
}

function normalizeImages(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeObject(value, fallback = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return fallback;
}

function safeDecodeURIComponent(value) {
  if (typeof value !== 'string') {
    return '';
  }
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

function normalizeCandidateOptionLabels(value) {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
          } catch (error) {
            try {
              const cached = typeof wx !== 'undefined' && wx.getStorageSync ? wx.getStorageSync(value) : null;
              return Array.isArray(cached) ? cached : [];
            } catch (storageError) {
              return [];
            }
          }
        })()
      : [];

  return source
    .map(item => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        return String(item.label || '').trim();
      }
      return String(item || '').trim();
    })
    .filter(Boolean)
    .slice(0, 3);
}

function buildQuestionEntryPrefill(options = {}) {
  const from = String(options.from || '').trim();
  if (from !== 'gear_detail' && from !== 'gear_compare') {
    return null;
  }

  const gearCategory = String(options.gearCategory || '').trim();
  const gearItemId = Number(options.gearItemId || 0) || null;
  const gearLabel = safeDecodeURIComponent(options.gearLabel || '');
  const candidateOptions = from === 'gear_compare'
    ? normalizeCandidateOptionLabels(safeDecodeURIComponent(options.candidateOptions || ''))
    : (gearLabel ? [gearLabel] : []);
  const initialQuestionData = createModeInitialFormData('question');

  return {
    ...initialQuestionData,
    questionType: 'recommend',
    relatedGearCategory: gearCategory || '',
    relatedGearItemId: gearItemId,
    recommendMeta: {
      ...initialQuestionData.recommendMeta,
      recommendIntent: from === 'gear_compare' ? 'compare_options' : '',
      candidateOptions: [
        candidateOptions[0] || '',
        candidateOptions[1] || '',
        candidateOptions[2] || ''
      ],
      coreQuestion:
        from === 'gear_compare' && candidateOptions.length >= 2
          ? '这几个候选我已经看过参数了，但还是拿不准哪个更适合我当前场景。'
          : ''
    }
  };
}

function buildDraftFormDataFromTopic(topic = {}) {
  const modeConfig = getModeConfigByTopicCategory(topic.topicCategory);
  const modeKey = modeConfig ? modeConfig.modeKey : 'experience';
  const base = {
    id: topic.id || null,
    title: topic.title || '',
    mainContent: topic.content || '',
    mainImages: normalizeImages(topic.images),
    rejectReason: topic.rejectReason || ''
  };

  if (modeKey === 'question') {
    const recommendMeta = normalizeObject(topic.recommendMeta, {});
    return {
      ...createModeInitialFormData(modeKey),
      ...base,
      questionType: topic.questionType || 'recommend',
      relatedGearCategory: topic.relatedGearCategory || '',
      relatedGearModel: topic.relatedGearModel || '',
      relatedGearItemId: topic.relatedGearItemId || null,
      quickReplyOnly: Boolean(topic.quickReplyOnly),
      recommendMeta: {
        ...createModeInitialFormData(modeKey).recommendMeta,
        ...recommendMeta,
        targetFish: Array.isArray(recommendMeta.targetFish) ? recommendMeta.targetFish : [],
        useScene: Array.isArray(recommendMeta.useScene) ? recommendMeta.useScene : [],
        carePriorities: Array.isArray(recommendMeta.carePriorities) ? recommendMeta.carePriorities : [],
        avoidPoints: Array.isArray(recommendMeta.avoidPoints) ? recommendMeta.avoidPoints : [],
        candidateOptions: Array.isArray(recommendMeta.candidateOptions)
          ? recommendMeta.candidateOptions.slice(0, 3)
          : ['', '', '']
      }
    };
  }

  if (modeKey === 'catch') {
    return {
      id: topic.id || null,
      title: topic.title || '',
      images: normalizeImages(topic.images),
      locationTag: topic.locationTag || '',
      length: topic.length || '',
      isLengthSecret: Boolean(topic.isLengthSecret),
      isLengthEstimated: Boolean(topic.isLengthEstimated),
      weight: topic.weight || '',
      isWeightSecret: Boolean(topic.isWeightSecret),
      isWeightEstimated: Boolean(topic.isWeightEstimated),
      rejectReason: topic.rejectReason || ''
    };
  }

  if (modeKey === 'trip') {
    return {
      id: topic.id || null,
      title: topic.title || '',
      tripResult: topic.tripResult || '',
      tripStatus: Array.isArray(topic.tripStatus) ? topic.tripStatus : [],
      targetFish: Array.isArray(topic.targetFish) ? topic.targetFish : [],
      customTargetFish: topic.customTargetFish || '',
      season: topic.season || '',
      weather: topic.weather || '',
      waterType: topic.waterType || '',
      mainSpot: topic.mainSpot || '',
      fishingTime: topic.fishingTime || '',
      envFeelings: Array.isArray(topic.envFeelings) ? topic.envFeelings : [],
      rigs: Array.isArray(topic.rigs) ? topic.rigs : [],
      rigDescription: topic.rigDescription || '',
      content: topic.content || '',
      images: normalizeImages(topic.images),
      rejectReason: topic.rejectReason || ''
    };
  }

  if (modeKey === 'recommend') {
    return {
      ...createModeInitialFormData(modeKey),
      ...base,
      gearCategory: topic.gearCategory || 'rod',
      gearModel: topic.gearModel || '',
      gearItemId: topic.gearItemId || null,
      usageYear: topic.usageYear || '',
      usageFrequency: topic.usageFrequency || '',
      environments: Array.isArray(topic.environments) ? topic.environments : [],
      customScene: topic.customScene || '',
      summary: topic.summary || '',
      pros: Array.isArray(topic.pros) ? topic.pros : [],
      tags: {
        scene: Array.isArray(topic.tags && topic.tags.scene) ? topic.tags.scene : [],
        customScene: Array.isArray(topic.tags && topic.tags.customScene) ? topic.tags.customScene : [],
        budget: topic.tags && topic.tags.budget ? [topic.tags.budget].flat().filter(Boolean) : [],
        usage: Array.isArray(topic.tags && topic.tags.usage) ? topic.tags.usage : [],
        shareReasons: Array.isArray(topic.tags && topic.tags.shareReasons) ? topic.tags.shareReasons : []
      }
    };
  }

  const tags = normalizeObject(topic.tags);
  return {
    ...createModeInitialFormData(modeKey),
    ...base,
    gearCategory: topic.gearCategory || 'rod',
    gearModel: topic.gearModel || '',
    gearItemId: topic.gearItemId || null,
    usageYear: topic.usageYear || '',
    usageFrequency: topic.usageFrequency || '',
    verifyImage: topic.verifyImage || '',
    environments: Array.isArray(topic.environments) ? topic.environments : [],
    customScene: topic.customScene || '',
    ratings: Array.isArray(topic.ratings) ? topic.ratings : normalizeObject(topic.ratings, {}),
    summary: topic.summary || '',
    repurchase: topic.repurchase || '',
    pros: Array.isArray(topic.pros) ? topic.pros : [],
    cons: Array.isArray(topic.cons) ? topic.cons : [],
    tags: {
      fit: Array.isArray(tags.fit) ? tags.fit : [],
      unfit: Array.isArray(tags.unfit) ? tags.unfit : [],
      pros: Array.isArray(tags.pros) ? tags.pros : [],
      cons: Array.isArray(tags.cons) ? tags.cons : [],
      budget: tags.budget ? [tags.budget].flat().filter(Boolean) : [],
      usage: Array.isArray(tags.usage) ? tags.usage : [],
      fitContextTags: Array.isArray(tags.fitContextTags) ? tags.fitContextTags : [],
      fitTechniqueTags: Array.isArray(tags.fitTechniqueTags) ? tags.fitTechniqueTags : [],
      compareProfile: Array.isArray(tags.compareProfile) ? tags.compareProfile : [],
      compareBuyDecision: Array.isArray(tags.compareBuyDecision) ? tags.compareBuyDecision : [],
      purchaseAdvice: Array.isArray(tags.purchaseAdvice) ? tags.purchaseAdvice : [],
      buyStage: Array.isArray(tags.buyStage) ? tags.buyStage : [],
      supplementParams: Array.isArray(tags.supplementParams) ? tags.supplementParams : []
    },
    customFit: topic.customFit || '',
    customUnfit: topic.customUnfit || '',
    comboGear: Array.isArray(topic.comboGear) ? topic.comboGear : [],
    comboDesc: topic.comboDesc || '',
    compareGear: Array.isArray(topic.compareGear) ? topic.compareGear : [],
    compareDesc: topic.compareDesc || ''
  };
}

function sanitizeComparableValue(value) {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeComparableValue(item));
  }
  if (value && typeof value === 'object') {
    const next = {};
    Object.keys(value).sort().forEach(key => {
      if (key === 'rejectReason') {
        return;
      }
      next[key] = sanitizeComparableValue(value[key]);
    });
    return next;
  }
  if (value === undefined || value === null) {
    return '';
  }
  return value;
}

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    selectedMode: null,
    showModeSelection: true,
    formData: {},
    publishScrollIntoView: '',
    lastSelectedIndex: 1, // 记录用户上次选择的模式索引，默认为长测评
    isDarkMode: false, // 夜间模式状态
    postModes: MODE_CONFIG,
    backgroundImages: [
      'https://anglertest.xyz/Banner/banner1.jpg',
      'https://anglertest.xyz/Banner/banner2.jpg',
      'https://anglertest.xyz/Banner/banner3.webp'
    ],
    editingDraftId: null
  },

  async onLoad(options) {
    // 获取系统信息
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: windowInfo.statusBarHeight
    });

    this.options = options || {};
    this._initialDraftSnapshot = '';
    this._backHandled = false;
    this._loadingDraft = false;

    if (this.isDraftEditingEntry(options)) {
      await this.loadDraftForEditing(options);
      return;
    }

    this.applyEntryPrefill(options);
  },

  onShow: function () {
    // Refresh the layout of post-mode component when the page is shown
    if (this.data.showModeSelection) {
      const postModeComponent = this.selectComponent('#post-mode');
      if (postModeComponent) {
        // 设置卡片位置为上次选择的索引
        postModeComponent.setData({
          active: this.data.lastSelectedIndex
        });
        postModeComponent.refreshLayout();
      }
    }
    
    // 同步主题模式
    this.initThemeMode();
  },

  // 处理返回按钮
  handlePageExit() {
    this.confirmDraftBeforeExit();
  },

  // 处理卡片选择事件
  onCardSelect(e) {
    const { index, card } = e.detail;
    const selectedMode = this.data.postModes[index];
    
    this.setData({
      selectedMode: selectedMode,
      showModeSelection: false,
      lastSelectedIndex: index, // 记录选择的索引
      formData: createModeInitialFormData(selectedMode.modeKey),
      editingDraftId: null
    });
    this.captureInitialDraftSnapshot();
    
    console.log('选中的模式:', selectedMode);
    console.log('[publishMode] onCardSelect index=', index, 'card=', card, 'init formData.gearCategory=rod');
  },

  applyEntryPrefill(options = {}) {
    const prefillFormData = buildQuestionEntryPrefill(options);
    if (!prefillFormData) {
      return;
    }

    const selectedMode = getModeConfigByKey('question') || this.data.postModes[2];
    const selectedIndex = this.data.postModes.findIndex(item => item.modeKey === 'question');

    this.setData({
      selectedMode,
      showModeSelection: false,
      lastSelectedIndex: selectedIndex >= 0 ? selectedIndex : 2,
      formData: prefillFormData,
      editingDraftId: null
    });
    this.captureInitialDraftSnapshot();
  },

  async loadDraftForEditing(options = {}) {
    try {
      this._loadingDraft = true;
      const draftId = Number(options && options.draftId ? options.draftId : 0);
      const draft = draftId > 0 ? await api.getTopicDetail(draftId) : await api.getTmpTopic();

      if (!(draft && draft.id)) {
        wx.showToast({
          title: '草稿不存在或已失效',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1200);
        return;
      }

      const selectedMode = getModeConfigByTopicCategory(draft.topicCategory) || this.data.postModes[1];
      const selectedIndex = this.data.postModes.findIndex(item => item.modeKey === selectedMode.modeKey);
      const formData = buildDraftFormDataFromTopic(draft);

      this.setData({
        selectedMode,
        showModeSelection: false,
        lastSelectedIndex: selectedIndex >= 0 ? selectedIndex : 1,
        formData,
        editingDraftId: Number(draft.id)
      });

      this.captureInitialDraftSnapshot();

      if (draft.rejectReason) {
        wx.showModal({
          title: '未通过审核',
          content: `未通过原因：${draft.rejectReason}`,
          showCancel: false,
          confirmText: '知道了'
        });
      }
    } catch (error) {
      console.error('[publishMode] 加载草稿失败:', error);
      wx.showToast({
        title: '加载草稿失败',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1200);
    } finally {
      this._loadingDraft = false;
    }
  },

  isDraftEditingEntry(options = {}) {
    return Boolean(
      (options && options.mode === 'edit') ||
      (options && options.fromDraft === 'true') ||
      Number(options && options.draftId ? options.draftId : 0) > 0
    );
  },

  getCurrentModeConfig() {
    return this.data.selectedMode || null;
  },

  getCurrentPostData() {
    const modeConfig = this.getCurrentModeConfig();
    if (!modeConfig) {
      return null;
    }

    const payload = this.buildPostData(modeConfig.modeKey, {
      ...this.data.formData,
      id: this.data.formData.id || this.data.editingDraftId || null
    });

    return payload;
  },

  getDraftSnapshot(payload = null) {
    const currentPayload = payload || this.getCurrentPostData();
    if (!currentPayload) {
      return '';
    }
    return JSON.stringify(sanitizeComparableValue(currentPayload));
  },

  captureInitialDraftSnapshot(payload = null) {
    this._initialDraftSnapshot = this.getDraftSnapshot(payload);
  },

  hasDraftChanged() {
    const currentPayload = this.getCurrentPostData();
    if (!currentPayload) {
      return false;
    }
    return this.getDraftSnapshot(currentPayload) !== this._initialDraftSnapshot;
  },

  hasMeaningfulDraftContent() {
    const currentPayload = this.getCurrentPostData();
    if (!currentPayload) {
      return false;
    }

    const checkValue = (value) => {
      if (Array.isArray(value)) {
        return value.some(item => checkValue(item));
      }
      if (value && typeof value === 'object') {
        return Object.keys(value).some(key => {
          if (['id', 'topicCategory', 'rejectReason'].includes(key)) {
            return false;
          }
          return checkValue(value[key]);
        });
      }
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      if (typeof value === 'number') {
        return value > 0;
      }
      if (typeof value === 'boolean') {
        return value === true;
      }
      return false;
    };

    return checkValue(currentPayload);
  },

  async saveCurrentDraft() {
    const currentPayload = this.getCurrentPostData();
    if (!currentPayload) {
      return null;
    }

    const savedId = await api.createTopic(currentPayload);
    const nextId = Number(savedId || currentPayload.id || 0) || null;
    const nextPayload = {
      ...currentPayload,
      id: nextId
    };

    this.setData({
      editingDraftId: nextId,
      'formData.id': nextId
    });
    this.captureInitialDraftSnapshot(nextPayload);
    return nextId;
  },

  confirmDraftBeforeExit() {
    if (this._loadingDraft) {
      return;
    }

    if (this.data.showModeSelection || !this.getCurrentModeConfig()) {
      wx.navigateBack();
      return;
    }

    if (!this.hasDraftChanged() || !this.hasMeaningfulDraftContent()) {
      wx.navigateBack();
      return;
    }

    wx.showModal({
      title: '保存草稿',
      content: '检测到你有未保存的内容，是否保存为草稿？',
      confirmText: '保存',
      cancelText: '不保存',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '保存草稿中...' });
            await this.saveCurrentDraft();
            wx.hideLoading();
            wx.showToast({
              title: '草稿已保存',
              icon: 'success'
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 400);
            return;
          } catch (error) {
            wx.hideLoading();
            console.error('[publishMode] 保存草稿失败:', error);
            wx.showToast({
              title: api.getErrorMessage(error, '保存草稿失败'),
              icon: 'none'
            });
            return;
          }
        }

        wx.navigateBack();
      }
    });
  },

  // 表单数据变化处理
  onFormDataChange(e) {
    const { field, value } = e.detail;
    this.setData({
      [`formData.${field}`]: value
    });
    console.log('[publishMode] onFormDataChange field=', field, 'value=', value);
  },

  handleFormScrollToTop() {
    this.setData({
      publishScrollIntoView: ''
    });

    setTimeout(() => {
      this.setData({
        publishScrollIntoView: 'publish-form-top-anchor'
      });

      setTimeout(() => {
        if (this.data.publishScrollIntoView === 'publish-form-top-anchor') {
          this.setData({
            publishScrollIntoView: ''
          });
        }
      }, 80);
    }, 0);
  },

  // 长测评提交
  onSubmitExperience(e) {
    const formData = this.extractSubmitFormData(e.detail);
    console.log('长测评提交数据:', formData);
    this.openPreview('experience', formData);
  },

  // 好物速报提交
  onSubmitRecommend(e) {
    const formData = this.extractSubmitFormData(e.detail);
    console.log('好物速报提交数据:', formData);
    this.openPreview('recommend', formData);
  },

  // 求助问答提交
  onSubmitQuestion(e) {
    const formData = this.extractSubmitFormData(e.detail);
    console.log('求助问答提交数据:', formData);
    this.openPreview('question', formData);
  },

  // 鱼获展示提交
  onSubmitCatch(e) {
    const formData = this.extractSubmitFormData(e.detail);
    console.log('鱼获展示提交数据:', formData);
    this.openPreview('catch', formData);
  },

  // 钓行分享提交
  onSubmitTrip(e) {
    const formData = this.extractSubmitFormData(e.detail);
    console.log('钓行分享提交数据:', formData);
    this.openPreview('trip', formData);
  },

  openPreview(type, formData) {
    const postData = this.buildPostData(type, formData);
    const selectedMode = this.data.selectedMode || null;

    try {
      wx.setStorageSync(TOPIC_PREVIEW_STORAGE_KEY, {
        postData,
        selectedMode,
        previewTime: Date.now()
      });
    } catch (error) {
      console.error('[publishMode] 写入预览缓存失败:', error);
      wx.showToast({
        title: '进入预览失败',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pkgContent/postPreview/postPreview'
    });
  },

  // 统一提交方法
  submitPost(type, formData) {
    // 构建提交数据
    const postData = this.buildPostData(type, formData);
    
    // 调用API提交数据
    api.publishTopic(postData).then(res => {
      wx.hideLoading();
      
      // 提交成功
      wx.showToast({
        title: Number(res && res.status) === 1 ? '已提交审核' : '发布成功',
        icon: 'success',
        duration: 2000
      });
      
      // 延迟返回首页
      setTimeout(() => {
        wx.navigateBack({
          delta: 2 // 返回到首页
        });
      }, 2000);
    }).catch(err => {
      wx.hideLoading();
      console.error('发布失败:', err);
      
      const message = api.getErrorMessage(err, '发布内容不符合社区规范，请修改后重试');
      wx.showToast({
        title: message,
        icon: 'error',
        duration: 2000
      });
    });
  },

  extractSubmitFormData(detail) {
    if (detail && typeof detail === 'object' && detail.formData && typeof detail.formData === 'object') {
      return detail.formData;
    }
    return detail && typeof detail === 'object' ? detail : {};
  },

  // 初始化主题模式
  initThemeMode() {
    try {
      const isDarkMode = wx.getStorageSync('isDarkMode') || false;
      this.setData({
        isDarkMode: isDarkMode
      });
    } catch (error) {
      console.error('获取主题模式失败:', error);
    }
  },

  // 构建提交数据
  buildPostData(type, formData) {
    const postData = {
      ...formData,
      topicCategory: this.getTopicCategory(type)
    };

    console.log('最终提交给API的数据:', postData);
    return postData;
  },

  getTopicCategory(type) {
    if (type === 'experience') return 1;
    if (type === 'question') return 2;
    if (type === 'catch') return 3;
    if (type === 'trip') return 4;
    return 0;
  }
});
