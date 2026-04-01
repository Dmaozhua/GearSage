// pages/detail/detail.js
const dateFormatter = require('../../utils/date-format.js');
const { data01 } = require('../data/data01.js');
const api = require('../../services/api.js');
const { formatRichTextContent, parseRichTextPayload } = require('../../utils/richTextFormatter.js');
const { buildTopicDetailView: buildTopicDetailViewModel } = require('../../utils/topicDetailView.js');
const tempUrlManager = require('../../utils/tempUrlManager.js');
const Permission = require('../../utils/permission.js');

const HOME_FEED_CACHE_KEYS = ['home_feed_cache_v2', 'home_feed_cache_v1'];

const TOPIC_CATEGORY = {
  RECOMMEND: 0,
  EXPERIENCE: 1,
  QUESTION: 2,
  CATCH: 3,
  TRIP: 4
};

const TOPIC_CATEGORY_LABELS = {
  [TOPIC_CATEGORY.RECOMMEND]: '好物速报',
  [TOPIC_CATEGORY.EXPERIENCE]: '长测评',
  [TOPIC_CATEGORY.QUESTION]: '讨论提问',
  [TOPIC_CATEGORY.CATCH]: '鱼获展示',
  [TOPIC_CATEGORY.TRIP]: '钓行分享'
};

const USAGE_YEAR_LABELS = {
  love_at_first_sight: '一见钟情',
  '1_month': '1个月',
  '1_3_months': '1-3个月',
  '3_12_months': '3-12个月',
  '1_year_plus': '1年以上'
};

const USAGE_FREQUENCY_LABELS = {
  essential: '出钓必备',
  several_times_week: '每周多次',
  once_week: '每周一次',
  several_times_month: '每月多次',
  once_month: '每月一次',
  several_times_year: '每年多次'
};

const RECOMMEND_SUMMARY_LABELS = {
  strongly_recommend: '强烈推荐，明显超出预期',
  recommend: '值得推荐，整体满意',
  soso: '有亮点，但不一定适合所有人',
  not_recommend: '不太推荐，实际体验一般'
};

const QUESTION_TYPE_LABELS = {
  ask: '提问',
  discuss: '讨论',
  recommend: '求推荐',
  avoid_pitfall: '求避坑',
  chat_with_photos: '晒图闲聊'
};

const RATING_LABELS = {
  actionMatchScore: '调性匹配',
  sensitivityScore: '传导性',
  castingScore: '抛投表现',
  workmanshipScore: '做工',
  durabilityScore: '耐用性',
  retrieveFeelScore: '收线手感',
  dragScore: '卸力表现',
  smoothnessScore: '顺滑度',
  balanceScore: '轻量与平衡',
  actionScore: '动作表现',
  stabilityScore: '稳定性',
  attractionScore: '诱鱼表现',
  strengthScore: '强度表现',
  abrasionScore: '耐磨性',
  handlingScore: '顺滑与操作感',
  castabilityScore: '抛投表现',
  sharpnessScore: '锋利度',
  penetrationScore: '刺鱼效率',
  resistanceScore: '抗变形',
  coatingScore: '防锈与涂层',
  practicalityScore: '实用性',
  designScore: '设计合理性',
  costScore: '性价比'
};

const RECOMMEND_OPTION_PREFIXES = ['A', 'B', 'C'];

const RECOMMEND_ANSWER_GENERIC_CONCLUSION_OPTIONS = [
  { id: 'buy_safe', label: '这预算建议先保守买' },
  { id: 'save_more', label: '这预算建议再攒一点' },
  { id: 'no_upgrade', label: '现在不建议升级' },
  { id: 'need_more_info', label: '还缺信息，建议补充' }
];

const RECOMMEND_ANSWER_BASIS_OPTIONS = [
  { id: 'long_term_used', label: '我长期用过这个 / 这类产品' },
  { id: 'short_term_used', label: '我短期用过' },
  { id: 'used_similar_products', label: '我没用过这款，但用过同定位多个产品' },
  { id: 'spec_based', label: '我主要按参数和定位给建议' }
];

const RECOMMEND_ANSWER_SCENE_OPTIONS = [
  { id: 'wild_river', label: '野河' },
  { id: 'reservoir', label: '水库' },
  { id: 'stream', label: '溪流' },
  { id: 'inshore', label: '近海' },
  { id: 'urban_river', label: '城市河道' },
  { id: 'mixed', label: '综合' }
];

const RECOMMEND_ANSWER_FIT_REASON_OPTIONS = [
  { id: 'fit_budget', label: '更贴楼主预算' },
  { id: 'fit_scene', label: '更适合楼主场景' },
  { id: 'fit_beginner', label: '更适合新手' },
  { id: 'more_versatile', label: '泛用性更高' },
  { id: 'more_tolerant', label: '容错更高' },
  { id: 'upgrade_space', label: '升级空间更合理' },
  { id: 'lower_total_cost', label: '配套成本更低' },
  { id: 'more_reliable', label: '更耐用 / 更省心' },
  { id: 'fit_stage', label: '更符合楼主当前阶段' }
];

const RECOMMEND_ANSWER_NOT_RECOMMEND_OPTIONS = [
  { id: 'over_budget', label: '超预算' },
  { id: 'too_specialized', label: '太专用' },
  { id: 'not_beginner_friendly', label: '新手不友好' },
  { id: 'limited_gain', label: '提升感知没那么大' },
  { id: 'low_scene_usage', label: '对楼主场景利用率不高' },
  { id: 'higher_maintenance', label: '后期成本更高' },
  { id: 'risk_over_reward', label: '风险比收益更大' }
];

const RECOMMEND_ANSWER_RISK_OPTIONS = [
  { id: 'weight_subjective', label: '重量 / 手感见仁见智' },
  { id: 'durability_depends', label: '长期耐久还要看使用强度' },
  { id: 'conservative', label: '这条建议更偏保守' },
  { id: 'step_up', label: '这条建议更偏一步到位' },
  { id: 'not_ultra_feel', label: '如果你特别追求极致手感，这个未必满足' },
  { id: 'other', label: '其他' }
];

const RECOMMEND_ANSWER_BUDGET_CHANGE_OPTIONS = [
  { id: 'go_higher', label: '如果预算再高一点，我会换另一个方向' },
  { id: 'keep_core_lower', label: '如果预算再低一点，我会优先保留核心性能' },
  { id: 'current_enough', label: '当前预算已经够，不建议再上' },
  { id: 'budget_tight', label: '当前预算偏紧，建议先降低预期' }
];

function buildOptionLabelMap(options = []) {
  return options.reduce((acc, item) => {
    acc[item.id] = item.label;
    return acc;
  }, {});
}

const RECOMMEND_ANSWER_CONCLUSION_LABELS = {
  prefer_a: '更推荐 A',
  prefer_b: '更推荐 B',
  prefer_c: '更推荐 C',
  ...buildOptionLabelMap(RECOMMEND_ANSWER_GENERIC_CONCLUSION_OPTIONS)
};
const RECOMMEND_ANSWER_BASIS_LABELS = buildOptionLabelMap(RECOMMEND_ANSWER_BASIS_OPTIONS);
const RECOMMEND_ANSWER_SCENE_LABELS = buildOptionLabelMap(RECOMMEND_ANSWER_SCENE_OPTIONS);
const RECOMMEND_ANSWER_FIT_REASON_LABELS = buildOptionLabelMap(RECOMMEND_ANSWER_FIT_REASON_OPTIONS);
const RECOMMEND_ANSWER_NOT_RECOMMEND_LABELS = buildOptionLabelMap(RECOMMEND_ANSWER_NOT_RECOMMEND_OPTIONS);
const RECOMMEND_ANSWER_RISK_LABELS = buildOptionLabelMap(RECOMMEND_ANSWER_RISK_OPTIONS);
const RECOMMEND_ANSWER_BUDGET_CHANGE_LABELS = buildOptionLabelMap(RECOMMEND_ANSWER_BUDGET_CHANGE_OPTIONS);

function buildRecommendAnswerConclusionOptions(candidateOptions = []) {
  const preferredOptions = normalizeAnswerList(candidateOptions)
    .slice(0, 3)
    .map((item, index) => ({
      id: `prefer_${String.fromCharCode(97 + index)}`,
      label: `更推荐 ${RECOMMEND_OPTION_PREFIXES[index]}`
    }));

  return preferredOptions.concat(RECOMMEND_ANSWER_GENERIC_CONCLUSION_OPTIONS);
}

function normalizeAnswerText(value, fallback = '') {
  if (value === null || typeof value === 'undefined') {
    return fallback;
  }
  const text = String(value).trim();
  return text || fallback;
}

function normalizeAnswerList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeAnswerText(item, '')).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function getRecommendAnswerConclusionLabel(value, candidateOptions = []) {
  const normalizedValue = normalizeAnswerText(value, '');
  if (!normalizedValue) {
    return '';
  }

  if (normalizedValue === 'prefer_a' || normalizedValue === 'prefer_b' || normalizedValue === 'prefer_c') {
    const optionIndex = {
      prefer_a: 0,
      prefer_b: 1,
      prefer_c: 2
    }[normalizedValue];
    const optionKey = RECOMMEND_OPTION_PREFIXES[optionIndex];
    const hasOption = Boolean(normalizeAnswerList(candidateOptions)[optionIndex]);
    return hasOption ? `更推荐 ${optionKey}` : `更推荐 ${optionKey}`;
  }

  return RECOMMEND_ANSWER_CONCLUSION_LABELS[normalizedValue] || normalizedValue;
}

function joinAnswerLabels(values, labelMap) {
  return normalizeAnswerList(values)
    .map((item) => labelMap[item] || item)
    .filter(Boolean)
    .join('、');
}

function createEmptyRecommendAnswerForm() {
  return {
    answerConclusion: '',
    recommendedOption: ['', '', ''],
    answerBasis: '',
    myScene: [],
    fitReasons: [],
    freeReasonText: '',
    notRecommendReasons: [],
    riskNotePreset: '',
    riskNoteText: '',
    budgetChangeAdvice: ''
  };
}

function normalizeRecommendAnswerMeta(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const recommendedOption = Array.isArray(source.recommendedOption)
    ? source.recommendedOption.map((item) => normalizeAnswerText(item, '')).filter(Boolean).slice(0, 3)
    : [];

  return {
    ...createEmptyRecommendAnswerForm(),
    ...source,
    recommendedOption,
    myScene: normalizeAnswerList(source.myScene).slice(0, 2),
    fitReasons: normalizeAnswerList(source.fitReasons).slice(0, 3),
    notRecommendReasons: normalizeAnswerList(source.notRecommendReasons).slice(0, 2),
    answerConclusion: normalizeAnswerText(source.answerConclusion, ''),
    answerBasis: normalizeAnswerText(source.answerBasis, ''),
    freeReasonText: normalizeAnswerText(source.freeReasonText, ''),
    riskNotePreset: normalizeAnswerText(source.riskNotePreset || source.riskNote, ''),
    riskNoteText: normalizeAnswerText(source.riskNoteText, ''),
    budgetChangeAdvice: normalizeAnswerText(source.budgetChangeAdvice, '')
  };
}

function buildRecommendAnswerSummary(meta, candidateOptions = []) {
  const normalized = normalizeRecommendAnswerMeta(meta);
  const parts = [];
  const conclusion = getRecommendAnswerConclusionLabel(normalized.answerConclusion, candidateOptions);
  const fitReasonText = joinAnswerLabels(normalized.fitReasons, RECOMMEND_ANSWER_FIT_REASON_LABELS);

  if (conclusion) {
    parts.push(conclusion);
  }
  if (fitReasonText) {
    parts.push(fitReasonText);
  }
  if (normalized.freeReasonText) {
    parts.push(normalized.freeReasonText);
  }

  return parts.join('；').slice(0, 180);
}

function buildRecommendAnswerDisplay(meta, candidateOptions = []) {
  const normalized = normalizeRecommendAnswerMeta(meta);
  const riskPresetLabel =
    RECOMMEND_ANSWER_RISK_LABELS[normalized.riskNotePreset] || normalized.riskNotePreset;
  const riskNote = [riskPresetLabel, normalized.riskNoteText].filter(Boolean).join('；');

  return {
    ...normalized,
    answerConclusionLabel: getRecommendAnswerConclusionLabel(
      normalized.answerConclusion,
      candidateOptions
    ),
    recommendedOptionText: normalized.recommendedOption.join('、'),
    answerBasisLabel:
      RECOMMEND_ANSWER_BASIS_LABELS[normalized.answerBasis] || normalized.answerBasis,
    mySceneText: joinAnswerLabels(normalized.myScene, RECOMMEND_ANSWER_SCENE_LABELS),
    fitReasonsText: joinAnswerLabels(normalized.fitReasons, RECOMMEND_ANSWER_FIT_REASON_LABELS),
    notRecommendReasonsText: joinAnswerLabels(
      normalized.notRecommendReasons,
      RECOMMEND_ANSWER_NOT_RECOMMEND_LABELS,
    ),
    riskNote,
    budgetChangeAdviceLabel:
      RECOMMEND_ANSWER_BUDGET_CHANGE_LABELS[normalized.budgetChangeAdvice] ||
      normalized.budgetChangeAdvice,
  };
}

function buildSelectedMap(values = []) {
  return normalizeAnswerList(values).reduce((acc, item) => {
    acc[item] = true;
    return acc;
  }, {});
}

function buildOptionView(options = [], selectedMap = {}) {
  return (Array.isArray(options) ? options : []).map((item) => ({
    ...item,
    selected: Boolean(selectedMap[item.id]),
  }));
}

Page({

    /**
     * 页面的初始数据
     */
    data: {
      // 评分类型映射配置
      ratingTypeMap: {
        '调性': { key: 'actionScore', label: '调性' },
        '传导性': { key: 'sensitivityScore', label: '传导性' },
        '抛投性能': { key: 'castingScore', label: '抛投性能' },
        '做工': { key: 'workmanshipScore', label: '做工' },
        '耐用性': { key: 'durabilityScore', label: '耐用性' },
        '速比': { key: 'gearRatioScore', label: '速比' },
        '卸力': { key: 'dragScore', label: '卸力' },
        '顺滑度': { key: 'smoothnessScore', label: '顺滑度' },
        '重量': { key: 'weightScore', label: '重量' },
        '稳定性': { key: 'stabilityScore', label: '稳定性' },
        '声 / 光 / 震动': { key: 'attractionScore', label: '声 / 光 / 震动' },
        '拉力': { key: 'strengthScore', label: '拉力' },
        '延伸率': { key: 'stretchScore', label: '延伸率' },
        '耐磨': { key: 'abrasionScore', label: '耐磨' },
        '线径': { key: 'diameterScore', label: '线径' },
        '锋利度': { key: 'sharpnessScore', label: '锋利度' },
        '抗扭曲': { key: 'resistanceScore', label: '抗扭曲' },
        '涂层': { key: 'coatingScore', label: '涂层' },
        '形状设计': { key: 'designScore', label: '形状设计' },
        '实用性': { key: 'practicalityScore', label: '实用性' },
        '美观度': { key: 'appearanceScore', label: '美观度' },
        '性价比': { key: 'costScore', label: '性价比' }
      },
      // 装备分类映射配置
      gearCategoryMap: {
        'rod': '鱼竿',
        'reel': '渔轮', 
        'bait': '鱼饵',
        'line': '鱼线',
        'hook': '鱼钩',
        'other': '其他'
      },
      // 常用环境映射配置
      environmentMap: {
        'managed': '管理场',
        'lake': '湖库',
        'river': '江河',
        'stream': '溪流',
        'sea': '近海'
      },
      // 导航栏相关数据
      statusBarHeight: 0,
      navBarHeight: 0,
      
      // 主题模式
      containerClass: '',
      
      postId: '',
      loading: true,
      commentLoading: false,
      showCommentInput: false,
      commentEditorMode: 'normal',
      commentContent: '',
      canSendComment: false,
      acceptedRecommendAnswer: null,
      recommendAnswers: [],
      normalComments: [],
      recommendAnswerForm: createEmptyRecommendAnswerForm(),
      recommendAnswerErrors: {},
      recommendAnswerConclusionOptions: buildRecommendAnswerConclusionOptions(),
      recommendAnswerBasisOptions: RECOMMEND_ANSWER_BASIS_OPTIONS,
      recommendAnswerMySceneOptions: buildOptionView(RECOMMEND_ANSWER_SCENE_OPTIONS),
      recommendAnswerFitReasonOptions: buildOptionView(RECOMMEND_ANSWER_FIT_REASON_OPTIONS),
      recommendAnswerNotRecommendOptions: buildOptionView(RECOMMEND_ANSWER_NOT_RECOMMEND_OPTIONS),
      recommendAnswerRiskOptions: RECOMMEND_ANSWER_RISK_OPTIONS,
      recommendAnswerBudgetChangeOptions: RECOMMEND_ANSWER_BUDGET_CHANGE_OPTIONS,
      replyTo: null,
      replyToCommentId: null,
      replyToUserId: null,
      replyToUsername: '',
      totalCommentCount: 0,
      isTopicOwner: false,
      isAdmin: false,
      showAdminPanel: false,
      notFound: false,
      refresherTriggered: false,
      shareSourceType: '',
      shareSourceUserId: '',
      productDetail: {
        id: 1,
        name: 'DAIWA 达瓦 STEEZ A TW 2023款',
        equipmentName: 'DAIWA 达瓦 STEEZ A TW 2023款',
        price: 3699,
        images: [
          '/images/tab/路亚轮.png',
          '/images/tab/路亚轮 (1).png',
          '/images/tab/钓鱼.png'
        ],
        userAvatar: '/images/tab/路亚轮.png',
        userName: '钓鱼达人小王',
        userTag: 'LV.6 资深钓鱼玩家',
        usageYears: 1.5,
        castingRating: 9.2,
        brakingRating: 8.8,
        durabilityRating: 9.0,
        valueRating: 7.5,
        experience: '使用了一年多，整体表现非常出色。抛投性能优秀，制动系统精准，手感舒适。特别适合长时间使用，手腕不会有太大负担。唯一的缺点可能是价格偏高，但考虑到其性能和耐用性，还是值得投资的。',
        description: '使用了一年多，整体表现非常出色。抛投性能优秀，制动系统精准，手感舒适。特别适合长时间使用，手腕不会有太大负担。',
        recommendations: [
          '抛投性能非常出色，即使初学者也能快速上手',
          '制动系统精准可靠，应对各种鱼种都游刃有余',
          '手感舒适，长时间使用不会有明显疲劳感',
          '做工精细，各部件衔接紧密，使用寿命长'
        ],
        usageScenes: [
          '/images/tab/钓鱼.png',
          '/images/tab/钓鱼 (1).png'
        ],
        usageSceneDescription: '实际使用中，无论是在淡水湖泊还是近海区域都表现出了卓越的性能。尤其是在应对大型鱼类时，制动系统的精准度和可靠性给我留下了深刻印象。',
        likes: 128,
        likeCount: 128,
        commentCount: 18,
        isLiked: false,
        viewCount: 256,
        createTime: '2024-01-15 10:30:00',
        createTimeFormatted: '2天前',
        purchaseTime: '2023-06-15',
        purchaseTimeFormatted: '2023年6月15日',
        usageDuration: '7个月',
        usageFrequency: '每周2-3次',
        usageEnvironment: '淡水湖泊',
        targetFish: '鲈鱼、黑鱼',
        status: 'approved',
        statusText: '已审核',
        comments: [
          {
            id: 1,
            avatar: '/images/tab/路亚轮.png',
            userName: '渔夫老张',
            content: '确实非常好用，我也买了一个，用了7个月了，手感依旧很好！',
            time: '2小时前',
            createTimeFormatted: '2小时前',
            likeCount: 5,
            isLiked: false
          },
          {
            id: 2,
            avatar: '/images/tab/路亚轮 (1).png',
            userName: '路亚专家',
            content: '价格确实有点贵，但是用过之后觉得物有所值，推荐入手！',
            time: '3小时前',
            createTimeFormatted: '3小时前',
            likeCount: 8,
            isLiked: true
          }
        ]
      },
      isLiked: false,
      comments: []
    },
  
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
      // 获取导航栏高度信息
      const app = getApp()
      this.setData({
        statusBarHeight: app.globalData.statusBarHeight,
        navBarHeight: app.globalData.navBarHeight
      })
      
      // 初始化主题模式
      this.initThemeMode();
      this.enablePageShare();

      const launchOptions = this.parseLaunchOptions(options);
      const postId = launchOptions.id || launchOptions.postId || '';
      // 接收从首页传递的初始点赞状态
      const incomingIslike = (launchOptions.islike === 'true' || launchOptions.islike === true || launchOptions.islike === 1 || launchOptions.islike === '1');
      
      // 先用传入的状态初始化，避免首屏闪烁/错误
      if (launchOptions && typeof launchOptions.islike !== 'undefined') {
        this.setData({
          'productDetail.islike': incomingIslike,
          'productDetail.isLiked': incomingIslike
        });
        console.log('[详情页] 接收首页传入的islike:', incomingIslike);
      }
      
      this.setData({
        postId: postId,
        shareSourceType: this.normalizeString(launchOptions.shareType, ''),
        shareSourceUserId: this.normalizeString(launchOptions.sharerUid, '')
      });

      if (launchOptions.shareType || launchOptions.sharerUid) {
        console.log('[详情页] 接收到分享来源参数:', {
          shareType: launchOptions.shareType || '',
          sharerUid: launchOptions.sharerUid || ''
        });
      }

      if (!postId) {
        wx.showToast({
          title: '缺少帖子ID',
          icon: 'none'
        });
        this.setData({
          loading: false,
          notFound: true
        });
        return;
      }

      this._skipNextShowReload = true;
      this.loadDetailPage(postId);
      this.checkAdminPermission();
    },

    async loadDetailPage(postId) {
      const detailLoaded = await this.loadProductDetail(postId);
      if (!detailLoaded) {
        return false;
      }
      await this.loadComments(postId);
      this.increaseViewCount(postId);
      return true;
    },

    parseLaunchOptions(options = {}) {
      const parsedOptions = { ...options };
      const scene = this.normalizeString(options.scene, '');

      if (!scene) {
        return parsedOptions;
      }

      try {
        const decodedScene = decodeURIComponent(scene);
        decodedScene.split('&').forEach(segment => {
          if (!segment) {
            return;
          }

          const [rawKey, rawValue = ''] = segment.split('=');
          const key = this.normalizeString(rawKey, '');
          if (!key || typeof parsedOptions[key] !== 'undefined') {
            return;
          }

          parsedOptions[key] = decodeURIComponent(rawValue);
        });
      } catch (error) {
        console.warn('[详情页] 解析 scene 参数失败:', error);
      }

      return parsedOptions;
    },

    enablePageShare() {
      if (typeof wx.showShareMenu !== 'function') {
        return;
      }

      const options = {
        withShareTicket: true
      };

      if (wx.canIUse && wx.canIUse('showShareMenu.menus')) {
        options.menus = ['shareAppMessage', 'shareTimeline'];
      }

      wx.showShareMenu(options);
    },

    getCurrentUserId() {
      try {
        const userInfo = wx.getStorageSync('userInfo') || {};
        return this.normalizeString(userInfo.id || userInfo.userId || '', '');
      } catch (error) {
        console.warn('[详情页] 获取当前用户信息失败:', error);
        return '';
      }
    },

    getLikeCacheKey() {
      const userId = this.getCurrentUserId();
      return `likeCache_${userId || 'guest'}`;
    },

    buildShareTitle() {
      const { productDetail } = this.data;
      const title = this.normalizeString(productDetail.title || productDetail.name, '');
      const categoryLabel = this.normalizeString(productDetail.topicCategoryLabel, '');

      if (title && categoryLabel) {
        return `${categoryLabel}｜${title}`;
      }

      if (title) {
        return title;
      }

      return '钓友说';
    },

    buildShareImage() {
      const { productDetail } = this.data;
      const firstImage = Array.isArray(productDetail.images) ? this.normalizeString(productDetail.images[0], '') : '';
      return firstImage || '/images/share.png';
    },

    buildSharePath() {
      const { productDetail, postId } = this.data;
      const topicId = this.normalizeString(productDetail.id || postId, '');
      const sharerUid = this.getCurrentUserId();
      const query = [`id=${encodeURIComponent(topicId)}`, 'shareType=post'];

      if (sharerUid) {
        query.push(`sharerUid=${encodeURIComponent(sharerUid)}`);
      }

      return `/pkgContent/detail/detail?${query.join('&')}`;
    },

    buildTimelinePreviewPath() {
      const { productDetail, postId } = this.data;
      const topicId = this.normalizeString(productDetail.id || postId, '');
      const sharerUid = this.getCurrentUserId();
      const query = [`id=${encodeURIComponent(topicId)}`, 'shareType=timelinePreview'];

      if (sharerUid) {
        query.push(`sharerUid=${encodeURIComponent(sharerUid)}`);
      }

      return `/pages/timeline-preview/index?${query.join('&')}`;
    },

    buildShareQuery() {
      const { productDetail, postId } = this.data;
      const topicId = this.normalizeString(productDetail.id || postId, '');
      const sharerUid = this.getCurrentUserId();
      const query = [`id=${encodeURIComponent(topicId)}`, 'shareType=timeline'];

      if (sharerUid) {
        query.push(`sharerUid=${encodeURIComponent(sharerUid)}`);
      }

      return query.join('&');
    },

    getCommentDisabledReason() {
      return this.data.productDetail.commentDisabledReason || '帖子正在审核中，暂不支持评论';
    },

    canCurrentPostComment() {
      const post = this.data.productDetail || {};
      return Permission.canComment(post);
    },

    getLikeDisabledReason() {
      return this.data.productDetail.likeDisabledReason || '帖子正在审核中，暂不支持点赞';
    },

    canCurrentPostLike() {
      const post = this.data.productDetail || {};
      return Permission.canLikePost(post);
    },

    getShareDisabledReason() {
      return this.data.productDetail.shareDisabledReason || '帖子正在审核中，暂不支持分享';
    },

    canCurrentPostShare() {
      const post = this.data.productDetail || {};
      return Boolean(post.canShare);
    },

    updateShareMenuState() {
      if (typeof wx.showShareMenu !== 'function' || typeof wx.hideShareMenu !== 'function') {
        return;
      }

      if (this.canCurrentPostShare()) {
        this.enablePageShare();
        return;
      }

      wx.hideShareMenu({
        success: () => {
          console.log('[详情页] 当前帖子未发布，已隐藏分享菜单');
        }
      });
    },

    async resolveDetailMediaUrls(productDetail = {}) {
      try {
        const fileList = [];
        const images = Array.isArray(productDetail.images) ? productDetail.images : [];
        const userAvatar = this.normalizeString(productDetail.userAvatarUrl || productDetail.userAvatar, '');
        const verifyImage = this.normalizeString(productDetail.verifyImage, '');

        if (userAvatar && (/^cloud:\/\//.test(userAvatar) || tempUrlManager.shouldResolveUrl(userAvatar))) {
          fileList.push({ fileID: userAvatar, type: 'avatar' });
        }
        if (verifyImage && (/^cloud:\/\//.test(verifyImage) || tempUrlManager.shouldResolveUrl(verifyImage))) {
          fileList.push({ fileID: verifyImage, type: 'image' });
        }
        images.forEach((image) => {
          if (image && (/^cloud:\/\//.test(image) || tempUrlManager.shouldResolveUrl(image))) {
            fileList.push({ fileID: image, type: 'image' });
          }
        });

        if (!fileList.length) {
          return productDetail;
        }

        const fileIDToURL = await tempUrlManager.getBatchTempUrls(fileList);
        return {
          ...productDetail,
          userAvatar: fileIDToURL[userAvatar] || productDetail.userAvatar,
          userAvatarUrl: fileIDToURL[userAvatar] || productDetail.userAvatarUrl,
          verifyImage: fileIDToURL[verifyImage] || productDetail.verifyImage,
          images: images.map((image) => fileIDToURL[image] || image)
        };
      } catch (error) {
        console.error('[详情页] 处理详情媒体资源失败:', error);
        return productDetail;
      }
    },

    getShareConfig() {
      const { productDetail } = this.data;
      const title = this.normalizeString(productDetail.title || productDetail.name, 'Diaoyoushuo');
      return {
        title,
        path: this.buildSharePath(),
        imageUrl: this.buildShareImage()
      };
    },

    /**
     * 加载产品详情
     */
    /**
     * 格式化内容文本，处理JSON字符串和换行符
     */
    formatContentText(content) {
      return formatRichTextContent(content);
    },

    removeMissingPostFromCache(postId) {
      if (!postId) {
        return;
      }

      HOME_FEED_CACHE_KEYS.forEach(cacheKey => {
        try {
          const cache = wx.getStorageSync(cacheKey);
          if (!cache || !Array.isArray(cache.list) || !cache.list.length) {
            return;
          }

          const nextList = cache.list.filter(item => String(item && item.id) !== String(postId));
          if (nextList.length === cache.list.length) {
            return;
          }

          if (nextList.length) {
            wx.setStorageSync(cacheKey, {
              ...cache,
              list: nextList,
              timestamp: Date.now()
            });
          } else {
            wx.removeStorageSync(cacheKey);
          }
        } catch (error) {
          console.warn('[详情页] 清理首页缓存中的失效帖子失败:', cacheKey, error);
        }
      });
    },

    normalizeString(value, fallback = '') {
      if (value === null || typeof value === 'undefined') {
        return fallback;
      }
      const text = String(value).trim();
      return text || fallback;
    },

    normalizeStringList(value) {
      if (!value) {
        return [];
      }
      if (Array.isArray(value)) {
        return value.map(item => String(item || '').trim()).filter(Boolean);
      }
      if (typeof value === 'string') {
        return value.split(',').map(item => item.trim()).filter(Boolean);
      }
      return [];
    },

    buildFact(label, value) {
      const text = this.normalizeString(value, '');
      if (!text) {
        return null;
      }
      return { label, value: text };
    },

    buildTagGroup(label, items = []) {
      const normalized = this.normalizeStringList(items);
      if (!normalized.length) {
        return null;
      }
      return { label, items: normalized };
    },

    formatUsageYearLabel(value) {
      return USAGE_YEAR_LABELS[value] || this.normalizeString(value, '');
    },

    formatUsageFrequencyLabel(value) {
      return USAGE_FREQUENCY_LABELS[value] || this.normalizeString(value, '');
    },

    formatRecommendSummaryLabel(value) {
      return RECOMMEND_SUMMARY_LABELS[value] || this.normalizeString(value, '');
    },

    formatQuestionTypeLabel(value) {
      return QUESTION_TYPE_LABELS[value] || this.normalizeString(value, '');
    },

    getTopicCategoryLabel(value) {
      return TOPIC_CATEGORY_LABELS[Number(value)] || '帖子';
    },

    getGearCategoryLabel(value) {
      return this.data.gearCategoryMap[value] || this.normalizeString(value, '');
    },

    resolveGearDetailType(gearCategory) {
      if (gearCategory === 'rod') return 'rods';
      if (gearCategory === 'reel') return 'reels';
      if (gearCategory === 'bait') return 'lures';
      return '';
    },

    buildAuthorStatsText(stats = {}, options = {}) {
      const acceptedAnswerCount = Number(stats.acceptedAnswerCount || 0);
      const recommendAnswerCount = Number(stats.recommendAnswerCount || 0);
      const longReviewCount = Number(stats.longReviewCount || 0);
      const likeReceivedCount = Number(stats.likeReceivedCount || 0);
      const mode = this.normalizeString(options.mode, 'default');
      const pieces = [];

      if (mode === 'answer') {
        if (recommendAnswerCount > 0 || acceptedAnswerCount > 0) {
          pieces.push(`回答 ${recommendAnswerCount}`);
          if (acceptedAnswerCount > 0) {
            pieces.push(`被采纳 ${acceptedAnswerCount}`);
          }
        } else if (longReviewCount > 0) {
          pieces.push(`长测评 ${longReviewCount}`);
        }
      } else {
        if (acceptedAnswerCount > 0) {
          pieces.push(`被采纳 ${acceptedAnswerCount}`);
        }
        if (likeReceivedCount > 0) {
          pieces.push(`获赞 ${likeReceivedCount}`);
        }
        if (longReviewCount > 0) {
          pieces.push(`长测评 ${longReviewCount}`);
        }
      }

      return pieces.join(' · ');
    },

    navigateToUserProfileById(rawUserId) {
      const targetUserId = Number(rawUserId || 0);
      if (!targetUserId) {
        return;
      }

      const currentUserId = Number(this.getCurrentUserId() || 0);
      if (currentUserId && currentUserId === targetUserId) {
        wx.switchTab({
          url: '/pages/profile/profile'
        });
        return;
      }

      wx.navigateTo({
        url: `/pkgContent/user-profile/user-profile?id=${targetUserId}`
      });
    },

    onTapTopicGear(e) {
      const gearId = Number(e.currentTarget.dataset.gearId || 0);
      const gearCategory = this.normalizeString(e.currentTarget.dataset.gearCategory, '');
      const gearModel = this.normalizeString(e.currentTarget.dataset.gearModel, '');
      const gearType = this.resolveGearDetailType(gearCategory);
      if ((!gearId && !gearModel) || !gearType) {
        return;
      }

      const encodedGearModel = encodeURIComponent(gearModel);
      wx.navigateTo({
        url: `/pkgGear/pages/detail/detail?id=${gearId || ''}&type=${gearType}&gearModel=${encodedGearModel}&from=topic&postId=${this.data.postId}`
      });
    },

    onTapTopicAuthor(e) {
      const userId = Number(e.currentTarget.dataset.userId || 0);
      this.navigateToUserProfileById(userId);
    },

    onTapCommentAuthor(e) {
      const userId = Number(e.currentTarget.dataset.userId || 0);
      this.navigateToUserProfileById(userId);
    },

    formatCatchMeasure(label, value, isSecret, isEstimated, unit) {
      if (isSecret) {
        return `${label}保密`;
      }
      const text = this.normalizeString(value, '');
      if (!text) {
        return '';
      }
      return `${text}${unit}${isEstimated ? '（目测）' : ''}`;
    },

    buildRatingDetails(ratings = []) {
      return (Array.isArray(ratings) ? ratings : []).map(item => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const key = this.normalizeString(item.key || item.name, '');
        const score = Number(item.score || 0);
        if (!key || score <= 0) {
          return null;
        }
        return {
          key,
          label: RATING_LABELS[key] || this.normalizeString(item.label || item.name, key),
          score,
          percentage: Math.max(0, Math.min(100, score * 20))
        };
      }).filter(Boolean);
    },

    buildTopicDetailView(postData = {}, parsedContent = { html: '', text: '' }) {
      const topicCategory = Number(postData.topicCategory);
      const tags = postData.tags && typeof postData.tags === 'object' ? postData.tags : {};
      const contentText = parsedContent.text || '';
      const images = this.normalizeStringList(postData.images);
      const usageInfo = [];
      const factSections = [];
      const listSections = [];
      const tagSections = [];

      const pushFactSection = (title, items) => {
        const normalized = (items || []).filter(Boolean);
        if (normalized.length) {
          factSections.push({ title, items: normalized });
        }
      };

      const pushListSection = (title, items) => {
        const normalized = this.normalizeStringList(items);
        if (normalized.length) {
          listSections.push({ title, items: normalized });
        }
      };

      const pushTagSection = (title, groups) => {
        const normalized = (groups || []).filter(Boolean);
        if (normalized.length) {
          tagSections.push({ title, groups: normalized });
        }
      };

      if (topicCategory === TOPIC_CATEGORY.RECOMMEND || topicCategory === TOPIC_CATEGORY.EXPERIENCE) {
        const usageYear = this.formatUsageYearLabel(postData.usageYear);
        const usageFrequency = this.formatUsageFrequencyLabel(postData.usageFrequency);
        if (usageYear) {
          usageInfo.push({ label: '使用时长', value: usageYear });
        }
        if (usageFrequency) {
          usageInfo.push({ label: '使用频率', value: usageFrequency });
        }
      }

      if (topicCategory === TOPIC_CATEGORY.RECOMMEND) {
        pushFactSection('核心信息', [
          this.buildFact('装备分类', this.getGearCategoryLabel(postData.gearCategory)),
          this.buildFact('装备型号', postData.gearModel),
          this.buildFact('一句话总结', this.formatRecommendSummaryLabel(postData.summary)),
          this.buildFact('使用场景', this.normalizeStringList(postData.environments).join('、')),
          this.buildFact('自定义场景', postData.customScene)
        ]);
        pushListSection('推荐理由', postData.pros);
        pushTagSection('标签信息', [
          this.buildTagGroup('预算倾向', tags.budget ? [tags.budget] : []),
          this.buildTagGroup('使用倾向', tags.usage),
          this.buildTagGroup('分享理由', tags.shareReasons)
        ]);
      }

      if (topicCategory === TOPIC_CATEGORY.EXPERIENCE) {
        pushFactSection('核心信息', [
          this.buildFact('装备分类', this.getGearCategoryLabel(postData.gearCategory)),
          this.buildFact('装备型号', postData.gearModel),
          this.buildFact('一句话总结', postData.summary),
          this.buildFact('回购意愿', postData.repurchase),
          this.buildFact('验证图片', postData.verifyImage ? '已上传' : ''),
          this.buildFact('使用场景', this.normalizeStringList(postData.environments).join('、')),
          this.buildFact('自定义场景', postData.customScene),
          this.buildFact('自定义适合人群', postData.customFit),
          this.buildFact('自定义不适合人群', postData.customUnfit)
        ]);
        pushListSection('优点说明', postData.pros);
        pushListSection('缺点说明', postData.cons);
        pushListSection('常用搭配', postData.comboGear);
        pushListSection('对比对象', postData.compareGear);
        pushTagSection('标签信息', [
          this.buildTagGroup('预算倾向', tags.budget ? [tags.budget] : []),
          this.buildTagGroup('使用倾向', tags.usage),
          this.buildTagGroup('适合人群', tags.fit),
          this.buildTagGroup('不适合人群', tags.unfit),
          this.buildTagGroup('适配场景', tags.fitContextTags),
          this.buildTagGroup('适配玩法', tags.fitTechniqueTags),
          this.buildTagGroup('对比定位', tags.compareProfile),
          this.buildTagGroup('对比购买结论', tags.compareBuyDecision),
          this.buildTagGroup('入手建议', tags.purchaseAdvice),
          this.buildTagGroup('购买定位', tags.buyStage),
          this.buildTagGroup('补充参数', tags.supplementParams)
        ]);
        pushFactSection('补充说明', [
          this.buildFact('搭配说明', postData.comboDesc),
          this.buildFact('对比说明', postData.compareDesc)
        ]);
      }

      if (topicCategory === TOPIC_CATEGORY.QUESTION) {
        pushFactSection('提问信息', [
          this.buildFact('问题类型', this.formatQuestionTypeLabel(postData.questionType)),
          this.buildFact('关联分类', this.getGearCategoryLabel(postData.relatedGearCategory)),
          this.buildFact('关联型号', postData.relatedGearModel),
          this.buildFact('回复模式', postData.quickReplyOnly ? '仅快答' : '开放讨论')
        ]);
      }

      if (topicCategory === TOPIC_CATEGORY.CATCH) {
        pushFactSection('鱼获信息', [
          this.buildFact('位置标签', postData.locationTag),
          this.buildFact('长度', this.formatCatchMeasure('长度', postData.length, postData.isLengthSecret, postData.isLengthEstimated, 'cm')),
          this.buildFact('重量', this.formatCatchMeasure('重量', postData.weight, postData.isWeightSecret, postData.isWeightEstimated, 'kg'))
        ]);
      }

      if (topicCategory === TOPIC_CATEGORY.TRIP) {
        const targetFish = [...this.normalizeStringList(postData.targetFish)];
        const customTargetFish = this.normalizeString(postData.customTargetFish, '');
        if (customTargetFish) {
          targetFish.push(customTargetFish);
        }

        pushFactSection('钓行信息', [
          this.buildFact('钓行结果', postData.tripResult),
          this.buildFact('目标鱼', targetFish.join('、')),
          this.buildFact('季节', postData.season),
          this.buildFact('天气', postData.weather),
          this.buildFact('水域类型', postData.waterType),
          this.buildFact('主要钓点', postData.mainSpot),
          this.buildFact('作钓时间', postData.fishingTime),
          this.buildFact('钓组说明', postData.rigDescription)
        ]);
        pushTagSection('状态与环境', [
          this.buildTagGroup('钓行总结', postData.tripStatus),
          this.buildTagGroup('环境感受', postData.envFeelings),
          this.buildTagGroup('主要钓组/饵型', postData.rigs)
        ]);
      }

      const badges = [
        this.getTopicCategoryLabel(topicCategory),
        topicCategory === TOPIC_CATEGORY.RECOMMEND || topicCategory === TOPIC_CATEGORY.EXPERIENCE
          ? this.getGearCategoryLabel(postData.gearCategory)
          : '',
        topicCategory === TOPIC_CATEGORY.QUESTION ? this.formatQuestionTypeLabel(postData.questionType) : ''
      ].filter(Boolean);

      const authorDisplayTag = postData.displayTag || (postData.author && postData.author.displayTag) || null;
      return {
        id: postData.id || postData._id,
        topicCategory,
        topicCategoryLabel: this.getTopicCategoryLabel(topicCategory),
        name: postData.title || '无标题',
        title: postData.title || '无标题',
        images,
        userAvatar: postData.avatarUrl,
        userAvatarUrl: postData.avatarUrl,
        userName: postData.nickName,
        nickName: postData.nickName,
        authorDisplayTag,
        userTag: authorDisplayTag ? authorDisplayTag.name : postData.tagName,
        tagName: authorDisplayTag ? authorDisplayTag.name : postData.tagName,
        userTagRarity: authorDisplayTag ? authorDisplayTag.rarityLevel : postData.tagRarityLevel,
        tagRarityLevel: authorDisplayTag ? authorDisplayTag.rarityLevel : postData.tagRarityLevel,
        likeCount: Number(postData.likeCount || 0),
        commentCount: Number(postData.commentCount || 0),
        isLiked: Boolean(postData.isLike),
        islike: Boolean(postData.isLike),
        createTime: postData.publishTime || postData.createTime,
        createTimeFormatted: postData.publishTime ? this.formatTime(postData.publishTime) : '',
        usageInfo,
        badges,
        ratingDetails: this.buildRatingDetails(postData.ratings),
        factSections,
        listSections,
        tagSections,
        hasContent: Boolean(contentText),
        contentText
      };
    },
    
    async loadProductDetail(id) {
      console.log('加载产品ID:', id);
      
      try {
        if (!id) {
          this.setData({
            loading: false,
            notFound: true,
            isTopicOwner: false
          });
          return false;
        }

        this.setData({
          loading: true,
          notFound: false
        });

        // 调用API获取话题详情
        const apiService = require('../../services/api.js');
        
        const postData = await apiService.getTopicDetail(id);
        
        console.log('[详情页] API返回的原始数据:', postData);
          console.log('[详情页] 原始islike值:', postData.islike, '类型:', typeof postData.islike);
        
        if (postData) {
          const previewData = buildTopicDetailViewModel(postData, {
            formatTime: this.formatTime.bind(this)
          });
          const nextProductDetail = await this.resolveDetailMediaUrls(previewData.productDetail);
          const currentUserId = this.getCurrentUserId();
          const nextCachedStatus = this.getCachedLikeStatus(nextProductDetail.id);

          if (nextCachedStatus !== null) {
            nextProductDetail.islike = nextCachedStatus;
            nextProductDetail.isLiked = nextCachedStatus;
          }

          nextProductDetail.authorStatsText = this.buildAuthorStatsText(
            nextProductDetail.authorStats,
            { mode: 'topic' }
          );

          this.setData({
            productDetail: nextProductDetail,
            formattedContent: previewData.formattedContent,
            isTopicOwner: Boolean(
              currentUserId &&
              this.normalizeString(nextProductDetail.userId, '') === currentUserId
            ),
            loading: false,
            notFound: false
          });
          if (Array.isArray(this.data.comments) && this.data.comments.length > 0) {
            this.syncCommentSections(this.data.comments);
          }
          this.updateShareMenuState();
          return true;

          const parsedContent = parseRichTextPayload(postData.content);
          const formattedContent = parsedContent.html;
          const contentText = parsedContent.text || (typeof postData.content === 'string' ? postData.content : '');
          const subQuestion = parsedContent.subQuestion || postData.subQuestion || '';

          // 解析评分项
          let ratingItems = [];
          // 解析环境场景
          let environmentTags = [];
          const environmentMap = {
            'managed': '管理场',
            'sea': '近海',
            'lake': '湖库',
            'river': '江河',
            'stream': '溪流'
          };
          
          try {
            // 解析 rates 字段
            if (postData.rates) {
              try {
                if (typeof postData.rates === 'string') {
                  ratingItems = JSON.parse(postData.rates);
                } else if (Array.isArray(postData.rates)) {
                  ratingItems = postData.rates;
                }
                console.log('[详情页] 解析的评分项:', ratingItems);
              } catch (rateError) {
                console.error('解析 rates 失败:', rateError);
              }
            }
            
            // 解析 environment 字段
            if (postData.environment) {
              try {
                const envList = postData.environment.split(',');
                environmentTags = envList.map(env => {
                  const trimmedEnv = env.trim();
                  return {
                    key: trimmedEnv,
                    name: environmentMap[trimmedEnv] || trimmedEnv
                  };
                });
                console.log('[详情页] 解析的环境场景:', environmentTags);
              } catch (envError) {
                console.error('解析 environment 失败:', envError);
              }
            }
          } catch (e) {
            console.error('解析 subQuestion 失败:', e);
          }
          
          // 将API返回数据转换为页面所需格式，按照用户要求的字段映射
          const authorDisplayTag = postData.displayTag || (postData.author && postData.author.displayTag) || null;
          const normalizedImages = Array.isArray(postData.images)
            ? postData.images
            : (postData.contentImages ? postData.contentImages.split(',').filter(Boolean) : []);
          const normalizedPros = Array.isArray(postData.pros)
            ? postData.pros
            : (postData.recommendReason ? this.parseRecommendReason(postData.recommendReason) : []);
          const normalizedEnvironments = Array.isArray(postData.environments)
            ? postData.environments
            : (typeof postData.environment === 'string'
              ? postData.environment.split(',').map(item => item.trim()).filter(Boolean)
              : []);
          const normalizedUsageYear = postData.usageYear || postData.usagePeriod || '';
          const normalizedUsageFrequency = postData.usageFrequency || postData.usageRate || postData.usage_rate || '';
          const productDetail = {
            id: postData._id || postData.id,
            name: postData.title,
            title: postData.title, // product-title对应title
            equipmentName: postData.title,
            subQuestion: subQuestion, // 添加 subQuestion 字段
            ratingItems: ratingItems, // 添加评分项数组
            environmentTags: environmentTags, // 添加环境场景标签
            price: postData.price,
            images: normalizedImages,
            contentImages: normalizedImages,
            userAvatar: postData.avatarUrl, // user-avatar对应avatarUrl
            userAvatarUrl: postData.avatarUrl,
            userName: postData.nickName, // user-name对应nickName
            nickName: postData.nickName,
            authorDisplayTag,
            userTag: authorDisplayTag ? authorDisplayTag.name : postData.tagName,
            tagName: authorDisplayTag ? authorDisplayTag.name : postData.tagName,
            userTagRarity: authorDisplayTag ? authorDisplayTag.rarityLevel : postData.tagRarityLevel,
            tagRarityLevel: authorDisplayTag ? authorDisplayTag.rarityLevel : postData.tagRarityLevel,
            usageYears: normalizedUsageYear,
            usage_period: normalizedUsageYear,
            usage_rate: normalizedUsageFrequency,
            castingRating: postData.castingRate, // 抛投评分对应castingRate
            casting_rate: postData.castingRate,
            brakingRating: postData.lifeRate, // 耐用性评分对应lifeRate
            durabilityRating: postData.lifeRate,
            life_rate: postData.lifeRate,
            valueRating: postData.worthRate, // 性价比评分对应worthRate
            worth_rate: postData.worthRate,
            experience: contentText,
            content: contentText,
            recommend_reason: JSON.stringify(normalizedPros),
            description: postData.description,
            recommendations: normalizedPros,
            usageScenes: normalizedEnvironments.slice(0, 2),
            usageSceneDescription: postData.customScene || postData.environment || normalizedEnvironments.join('、'),
            likes: postData.likes,
            likeCount: postData.likeCount || postData.likes || 0,
            commentCount: postData.commentCount || postData.comments || 0,
            isLiked: postData.isLiked,
            islike: Boolean(postData.islike === true || postData.islike === 'true' || postData.islike === 1 || postData.islike === '1'),  // 添加新的点赞状态字段
            viewCount: postData.viewCount,
            createTime: postData.createTime,
            createTimeFormatted: postData.createTimeFormatted,
            purchaseTime: postData.purchaseDate,
            purchaseTimeFormatted: postData.purchaseDate,
            usageDuration: postData.usageDuration,
            usageFrequency: normalizedUsageFrequency,
            usageEnvironment: normalizedEnvironments.join('、') || postData.environment,
            targetFish: Array.isArray(postData.targetFish) ? postData.targetFish.join('、') : postData.targetFish || '',
            status: 'approved',
            statusText: '已审核'
          };
          
          // 解析gearCategory字段（装备分类）
          if (postData.gearCategory && Array.isArray(postData.gearCategory)) {
            const gearLabels = postData.gearCategory.map(categoryId => {
              return this.data.gearCategoryMap[categoryId] || categoryId;
            }).filter(label => label); // 过滤掉无效的分类
            productDetail.gearCategoryText = gearLabels.join('、');
          } else {
            productDetail.gearCategoryText = '';
          }
          
          // 解析environment字段（使用环境）
          if (postData.environment && typeof postData.environment === 'string') {
            // 处理逗号分隔的字符串格式，如"sea,lake,stream"
            const environmentIds = postData.environment.split(',').map(id => id.trim()).filter(id => id);
            const environmentLabels = environmentIds.map(envId => {
              return this.data.environmentMap[envId] || envId;
            }).filter(label => label); // 过滤掉无效的环境
            productDetail.environmentLabels = environmentLabels;
            productDetail.usageSceneDescription = environmentLabels.join('、');
          } else if (postData.environment && Array.isArray(postData.environment)) {
            // 兼容数组格式
            const environmentLabels = postData.environment.map(envId => {
              return this.data.environmentMap[envId] || envId;
            }).filter(label => label);
            productDetail.environmentLabels = environmentLabels;
            productDetail.usageSceneDescription = environmentLabels.join('、');
          } else {
            productDetail.environmentLabels = [];
            productDetail.usageSceneDescription = '';
          }
          
          // 解析rates字段（新的评分数据格式）
          if (postData.rates) {
            try {
              const ratesData = typeof postData.rates === 'string' ? JSON.parse(postData.rates) : postData.rates;
              console.log('[详情页] 解析rates数据:', ratesData);
              
              // 转换为组件可用的格式
              productDetail.ratingDetails = ratesData.map(item => {
                const ratingConfig = this.data.ratingTypeMap[item.name];
                return {
                  key: ratingConfig ? ratingConfig.key : item.name,
                  label: ratingConfig ? ratingConfig.label : item.name,
                  score: parseFloat(item.score) || 0,
                  percentage: (parseFloat(item.score) || 0) * 20 // 转换为百分比（5分制转100%）
                };
              }).filter(item => item.score > 0); // 过滤掉无效评分
              
              console.log('[详情页] 转换后的评分详情:', productDetail.ratingDetails);
            } catch (error) {
              console.error('[详情页] 解析rates字段失败:', error);
              productDetail.ratingDetails = [];
            }
          } else {
            productDetail.ratingDetails = [];
          }
          
          console.log('转换后的产品详情:', productDetail);
          
          // 检查本地缓存，覆盖API返回的islike状态以确保最新状态
          const cachedStatus = this.getCachedLikeStatus(productDetail.id);
          if (cachedStatus !== null) {
            console.log('[详情页] 发现本地缓存islike状态:', cachedStatus, '覆盖API返回状态:', productDetail.islike);
            productDetail.islike = cachedStatus;
            productDetail.isLiked = cachedStatus;
          }
          
          this.setData({
            productDetail: productDetail,
            formattedContent: formattedContent,
            loading: false,
            notFound: false
          });
          return true;
        } else {
          console.error('未找到对应的帖子数据');
          wx.showToast({
            title: '帖子不存在或已删除',
            icon: 'none'
          });
          this.setData({
            loading: false,
            notFound: true,
            isTopicOwner: false,
            comments: [],
            totalCommentCount: 0
          });
          this.removeMissingPostFromCache(id);
          return false;
        }
      } catch (error) {
        console.error('加载帖子详情失败:', error);
        const isNotFound = Number(error && error.code) === 404;
        wx.showToast({
          title: isNotFound ? '帖子不存在或已删除' : '加载失败',
          icon: 'none'
        });
        this.setData({
          loading: false,
          notFound: isNotFound,
          isTopicOwner: isNotFound ? false : this.data.isTopicOwner,
          comments: isNotFound ? [] : this.data.comments,
          totalCommentCount: isNotFound ? 0 : this.data.totalCommentCount
        });
        if (isNotFound) {
          this.removeMissingPostFromCache(id);
        }
        return false;
      }
    },

    async loadPostDetail(postId) {
      // 暂时取消API调用，使用现有的loadProductDetail方法
      console.log('loadPostDetail方法已禁用，使用loadProductDetail代替');
    },

    isRecommendQuestionTopic() {
      return Boolean(
        this.data.productDetail &&
        Number(this.data.productDetail.topicCategory) === TOPIC_CATEGORY.QUESTION &&
        this.data.productDetail.questionType === 'recommend'
      );
    },

    isCurrentUserTopicOwner() {
      const currentUserId = this.normalizeString(this.getCurrentUserId(), '');
      const topicUserId = this.normalizeString(
        this.data.productDetail && this.data.productDetail.userId,
        ''
      );
      return Boolean(currentUserId && topicUserId && currentUserId === topicUserId);
    },

    getTopicCandidateOptions() {
      const source =
        this.data &&
        this.data.productDetail &&
        Array.isArray(this.data.productDetail.recommendCandidateOptions)
          ? this.data.productDetail.recommendCandidateOptions
          : [];
      return normalizeAnswerList(source).slice(0, 3);
    },

    refreshRecommendAnswerOptionViews(formValue) {
      const form = normalizeRecommendAnswerMeta(formValue);
      const candidateOptions = this.getTopicCandidateOptions();
      this.setData({
        recommendAnswerConclusionOptions: buildRecommendAnswerConclusionOptions(candidateOptions),
        recommendAnswerMySceneOptions: buildOptionView(
          RECOMMEND_ANSWER_SCENE_OPTIONS,
          buildSelectedMap(form.myScene)
        ),
        recommendAnswerFitReasonOptions: buildOptionView(
          RECOMMEND_ANSWER_FIT_REASON_OPTIONS,
          buildSelectedMap(form.fitReasons)
        ),
        recommendAnswerNotRecommendOptions: buildOptionView(
          RECOMMEND_ANSWER_NOT_RECOMMEND_OPTIONS,
          buildSelectedMap(form.notRecommendReasons)
        )
      });
    },

    resetCommentEditor(mode = 'normal') {
      const recommendAnswerForm = createEmptyRecommendAnswerForm();
      this.setData({
        showCommentInput: false,
        commentEditorMode: mode,
        commentContent: '',
        canSendComment: false,
        replyTo: null,
        replyToCommentId: null,
        replyToUserId: null,
        replyToUsername: '',
        recommendAnswerForm,
        recommendAnswerErrors: {}
      });
      this.refreshRecommendAnswerOptionViews(recommendAnswerForm);
    },

    openCommentEditor(mode = 'normal') {
      const recommendAnswerForm = createEmptyRecommendAnswerForm();
      this.setData({
        showCommentInput: true,
        commentEditorMode: mode,
        commentContent: '',
        canSendComment: mode === 'recommend_answer',
        replyTo: null,
        replyToCommentId: null,
        replyToUserId: null,
        replyToUsername: '',
        recommendAnswerForm,
        recommendAnswerErrors: {}
      });
      this.refreshRecommendAnswerOptionViews(recommendAnswerForm);
    },

    buildLoadedCommentItem(comment = {}) {
      const recommendAnswerMeta = normalizeRecommendAnswerMeta(comment.recommendAnswerMeta);
      const candidateOptions = this.getTopicCandidateOptions();
      return {
        id: comment.id,
        userId: comment.userId,
        userAvatar: comment.userAvatarUrl || '/images/default-avatar.png',
        displayTag: comment.displayTag || null,
        authorStats: comment.authorStats || null,
        authorIdentityText: this.buildAuthorStatsText(comment.authorStats, {
          mode: comment.commentType === 'recommend_answer' ? 'answer' : 'default'
        }),
        tagName: comment.displayTag ? comment.displayTag.name : (comment.tagName || ''),
        tagRarityLevel: comment.displayTag ? comment.displayTag.rarityLevel : (comment.tagRarityLevel || 0),
        username: comment.userName || '匿名用户',
        content: comment.content,
        commentType: comment.commentType || 'normal',
        recommendAnswerMeta,
        recommendAnswerDisplay:
          comment.commentType === 'recommend_answer'
            ? buildRecommendAnswerDisplay(recommendAnswerMeta, candidateOptions)
            : null,
        time: comment.createTime,
        createTimeFormatted: this.formatTime(comment.createTime),
        likeCount: comment.likeCount || 0,
        isLiked: comment.isLiked || false,
        isAccepted: false,
        acceptedAt: '',
        acceptedAtFormatted: '',
        acceptedByUserId: null,
        replayCommentId: comment.replayCommentId,
        replayUserId: comment.replayUserId,
        replies: []
      };
    },

    syncCommentSections(comments = []) {
      const acceptedAnswerId = Number(this.data.productDetail && this.data.productDetail.acceptedAnswerId || 0);
      const acceptedAt = this.normalizeString(
        this.data.productDetail && this.data.productDetail.acceptedAt,
        ''
      );
      const acceptedByUserId = Number(
        this.data.productDetail && this.data.productDetail.acceptedByUserId || 0
      ) || null;
      let acceptedRecommendAnswer = null;
      const recommendAnswers = [];
      const normalComments = [];

      (comments || []).forEach((comment) => {
        if (comment && comment.commentType === 'recommend_answer') {
          const isAccepted = acceptedAnswerId > 0 && Number(comment.id) === acceptedAnswerId;
          const nextComment = {
            ...comment,
            isAccepted,
            acceptedAt: isAccepted ? acceptedAt : '',
            acceptedAtFormatted: isAccepted && acceptedAt ? this.formatTime(acceptedAt) : '',
            acceptedByUserId: isAccepted ? acceptedByUserId : null
          };
          if (isAccepted && !acceptedRecommendAnswer) {
            acceptedRecommendAnswer = nextComment;
            return;
          }
          recommendAnswers.push(nextComment);
          return;
        }
        normalComments.push(comment);
      });

      this.setData({
        acceptedRecommendAnswer,
        recommendAnswers,
        normalComments
      });
    },

    async onAcceptRecommendAnswer(e) {
      const commentId = Number(
        e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.commentId
      );
      const topicId = Number(this.data.productDetail.id || this.data.postId || 0);

      if (!topicId || !commentId) {
        wx.showToast({
          title: '采纳对象无效',
          icon: 'none'
        });
        return;
      }

      if (!this.isCurrentUserTopicOwner()) {
        wx.showToast({
          title: '只有楼主可以采纳',
          icon: 'none'
        });
        return;
      }

      if (this._acceptRecommendAnswerPending) {
        return;
      }

      wx.showModal({
        title: '采纳这条回答？',
        content: '采纳后，这条回答会被置顶展示。你后续仍可补充购买反馈。',
        confirmText: '确认采纳',
        success: async (res) => {
          if (!res.confirm) {
            return;
          }

          this._acceptRecommendAnswerPending = true;
          try {
            wx.showLoading({
              title: '采纳中...'
            });
            await api.acceptRecommendAnswer(topicId, commentId);
            await this.loadDetailPage(topicId);
            wx.hideLoading();
            wx.showToast({
              title: '已采纳主回答',
              icon: 'success'
            });
          } catch (error) {
            wx.hideLoading();
            console.error('采纳回答失败:', error);
            wx.showToast({
              title: api.getErrorMessage(error, '采纳失败'),
              icon: 'none'
            });
          } finally {
            this._acceptRecommendAnswerPending = false;
          }
        }
      });
    },

    onRecommendAnswerSingleSelect(e) {
      const field = e.currentTarget.dataset.field || '';
      const value = e.currentTarget.dataset.value || '';
      if (!field) {
        return;
      }

      const nextForm = {
        ...normalizeRecommendAnswerMeta(this.data.recommendAnswerForm),
        [field]: value
      };
      this.setData({
        recommendAnswerForm: nextForm,
        [`recommendAnswerErrors.${field}`]: ''
      });
    },

    onRecommendAnswerMultiSelect(e) {
      const field = e.currentTarget.dataset.field || '';
      const value = e.currentTarget.dataset.value || '';
      const max = Number(e.currentTarget.dataset.max || 0);
      if (!field || !value || !max) {
        return;
      }

      const currentForm = normalizeRecommendAnswerMeta(this.data.recommendAnswerForm);
      const currentValues = normalizeAnswerList(currentForm[field]);
      const existed = currentValues.includes(value);
      const nextValues = existed
        ? currentValues.filter((item) => item !== value)
        : currentValues.concat(value).slice(0, max);

      if (!existed && currentValues.length >= max) {
        wx.showToast({
          title: `最多选择 ${max} 项`,
          icon: 'none'
        });
        return;
      }

      const nextForm = {
        ...currentForm,
        [field]: nextValues
      };
      this.setData({
        recommendAnswerForm: nextForm,
        [`recommendAnswerErrors.${field}`]: ''
      });
      this.refreshRecommendAnswerOptionViews(nextForm);
    },

    onRecommendAnswerInput(e) {
      const field = e.currentTarget.dataset.field || '';
      if (!field) {
        return;
      }

      const value = e.detail.value || '';
      const nextForm = {
        ...normalizeRecommendAnswerMeta(this.data.recommendAnswerForm),
        [field]: value
      };
      this.setData({
        recommendAnswerForm: nextForm,
        [`recommendAnswerErrors.${field}`]: ''
      });
    },

    onRecommendOptionInput(e) {
      const index = Number(e.currentTarget.dataset.index || 0);
      const value = e.detail.value || '';
      const currentForm = normalizeRecommendAnswerMeta(this.data.recommendAnswerForm);
      const recommendedOption = Array.isArray(currentForm.recommendedOption)
        ? currentForm.recommendedOption.slice(0, 3)
        : [];
      while (recommendedOption.length < 3) {
        recommendedOption.push('');
      }
      recommendedOption[index] = value;
      this.setData({
        recommendAnswerForm: {
          ...currentForm,
          recommendedOption
        }
      });
    },

    validateRecommendAnswerForm() {
      const form = normalizeRecommendAnswerMeta(this.data.recommendAnswerForm);
      const errors = {};

      if (!form.answerConclusion) {
        errors.answerConclusion = '请选择你的结论';
      }
      if (!form.answerBasis) {
        errors.answerBasis = '请选择你的参考背景';
      }
      if (!form.fitReasons.length) {
        errors.fitReasons = '至少选择 1 个适合原因';
      }

      this.setData({
        recommendAnswerErrors: errors
      });
      return Object.keys(errors).length === 0;
    },

    buildRecommendAnswerPayload() {
      const form = normalizeRecommendAnswerMeta(this.data.recommendAnswerForm);
      const candidateOptions = this.getTopicCandidateOptions();
      const payloadMeta = {
        ...form,
        recommendedOption: form.recommendedOption.filter(Boolean).slice(0, 3)
      };

      return {
        topicId: this.data.productDetail.id || this.data.postId,
        content: buildRecommendAnswerSummary(payloadMeta, candidateOptions) || '给楼主的规范推荐',
        commentType: 'recommend_answer',
        recommendAnswerMeta: payloadMeta,
        replayCommentId: null,
        replayUserId: null
      };
    },

    async loadComments(postId) {
      try {
        if (!postId || this.data.notFound) {
          this.setData({
            comments: [],
            totalCommentCount: 0,
            commentLoading: false
          });
          return [];
        }

        this.setData({ commentLoading: true });
        console.log('开始加载评论，帖子ID:', postId);
        
        const apiService = require('../../services/api.js');
        const comments = await apiService.getTopicComments(postId);
        
        console.log('评论加载成功:', comments);
        
        // 处理评论数据格式
        const formattedComments = Array.isArray(comments)
          ? comments.map((comment) => {
              console.log('原始评论数据:', comment);
              const formatted = this.buildLoadedCommentItem(comment);
              console.log('格式化后评论数据:', formatted);
              return formatted;
            })
          : [];
        
        // 构建树形结构
        const treeComments = this.buildCommentTree(formattedComments);
        
        // 计算总评论数（包括回复）
        const totalCommentCount = this.calculateTotalComments(treeComments);
        
        const mergedTreeComments = this.mergeCommentLikeCache(treeComments);

        this.setData({
          comments: mergedTreeComments,
          totalCommentCount: totalCommentCount,
          commentLoading: false
        });
        this.syncCommentSections(mergedTreeComments);
        return mergedTreeComments;
      } catch (error) {
        console.error('加载评论失败:', error);
        wx.showToast({
          title: '加载评论失败',
          icon: 'none'
        });
        // 如果API调用失败，使用静态评论数据作为备用
        this.setData({
          comments: this.data.productDetail.comments || []
        });
        this.syncCommentSections(this.data.productDetail.comments || []);
        return this.data.productDetail.comments || [];
      } finally {
        this.setData({ commentLoading: false });
      }
    },

    updateCommentLikeState(commentId, payload = {}) {
      const targetId = Number(commentId);
      if (!targetId) {
        return;
      }

      const nextComments = (this.data.comments || []).map((comment) => {
        if (Number(comment.id) === targetId) {
          return {
            ...comment,
            isLiked: Boolean(payload.isLike),
            likeCount: Number(payload.likeCount || 0)
          };
        }

        if (Array.isArray(comment.replies) && comment.replies.length) {
          return {
            ...comment,
            replies: comment.replies.map((reply) => {
              if (Number(reply.id) !== targetId) {
                return reply;
              }
              return {
                ...reply,
                isLiked: Boolean(payload.isLike),
                likeCount: Number(payload.likeCount || 0)
              };
            })
          };
        }

        return comment;
      });

      this.setData({
        comments: nextComments,
        'productDetail.comments': nextComments
      });
      this.syncCommentSections(nextComments);
    },

    getCommentLikeCacheKey() {
      const userId = this.getCurrentUserId();
      return `commentLikeCache_${userId || 'guest'}`;
    },

    getCachedCommentLikeStatus(commentId) {
      try {
        const targetId = String(commentId || '');
        if (!targetId) {
          return null;
        }

        const cache = wx.getStorageSync(this.getCommentLikeCacheKey()) || {};
        const cached = cache[targetId];
        const oneDay = 24 * 60 * 60 * 1000;
        if (cached && (Date.now() - cached.ts) < oneDay) {
          return !!cached.isLiked;
        }
        return null;
      } catch (error) {
        console.warn('[详情页] 读取评论点赞缓存失败:', error);
        return null;
      }
    },

    cacheCommentLikeStatus(commentId, isLiked) {
      try {
        const targetId = String(commentId || '');
        if (!targetId) {
          return;
        }

        const cacheKey = this.getCommentLikeCacheKey();
        const cache = wx.getStorageSync(cacheKey) || {};
        if (isLiked) {
          cache[targetId] = {
            isLiked: true,
            ts: Date.now()
          };
        } else {
          delete cache[targetId];
        }
        wx.setStorageSync(cacheKey, cache);
      } catch (error) {
        console.warn('[详情页] 写入评论点赞缓存失败:', error);
      }
    },

    mergeCommentLikeCache(comments = []) {
      return (comments || []).map((comment) => {
        const cachedStatus = this.getCachedCommentLikeStatus(comment.id);
        const nextComment = cachedStatus === null
          ? { ...comment }
          : { ...comment, isLiked: cachedStatus };

        if (Array.isArray(comment.replies) && comment.replies.length) {
          nextComment.replies = comment.replies.map((reply) => {
            const replyCachedStatus = this.getCachedCommentLikeStatus(reply.id);
            if (replyCachedStatus === null) {
              return reply;
            }
            return {
              ...reply,
              isLiked: replyCachedStatus
            };
          });
        }

        return nextComment;
      });
    },

    // 构建评论树形结构
    buildCommentTree(comments) {
      const commentMap = new Map();
      const rootComments = [];
      
      // 先将所有评论放入Map中，以id为键
      comments.forEach(comment => {
        commentMap.set(comment.id, comment);
      });
      
      // 遍历评论，构建树形结构
      comments.forEach(comment => {
        if (comment.replayCommentId && commentMap.has(comment.replayCommentId)) {
          // 如果有父评论ID且父评论存在，则添加到父评论的replies数组中
          const parentComment = commentMap.get(comment.replayCommentId);
          parentComment.replies.push(comment);
        } else {
          // 否则作为根评论
          rootComments.push(comment);
        }
      });
      
      return rootComments;
    },

    // 计算总评论数（包括回复）
    calculateTotalComments(comments) {
      let total = 0;
      comments.forEach(comment => {
        total += 1; // 主评论
        if (comment.replies && comment.replies.length > 0) {
          total += comment.replies.length; // 回复数
        }
      });
      return total;
    },

    checkAdminPermission() {
      // 从认证服务获取管理员权限
      const authService = require('../../services/auth.js');
      const isAdmin = authService.isAdmin || false;
      this.setData({
        isAdmin: isAdmin
      });
    },

    async increaseViewCount(postId) {
      // 暂时取消API调用，只更新本地浏览量
      console.log('增加浏览量:', postId);
      const currentViewCount = this.data.productDetail.viewCount;
      this.setData({
        'productDetail.viewCount': currentViewCount + 1
      });
    },

    /**
     * 格式化时间
     * @param {string} timeStr - 时间字符串
     * @returns {string} 格式化后的时间
     */
    formatTime(timeStr) {
      if (!timeStr) return '';
      
      try {
        const date = new Date(timeStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 60) {
          return minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
        } else if (hours < 24) {
          return `${hours}小时前`;
        } else if (days < 7) {
          return `${days}天前`;
        } else {
          return dateFormatter.formatDate(date, 'MM-dd');
        }
      } catch (error) {
        console.error('时间格式化失败:', error);
        return timeStr;
      }
    },

    /**
     * 解析推荐理由JSON字符串
     * @param {string} recommendReasonStr - JSON字符串格式的推荐理由数组
     * @returns {Array} 解析后的推荐理由数组
     */
    parseRecommendReason(recommendReasonStr) {
      // 如果已经是数组，直接返回
      if (Array.isArray(recommendReasonStr)) {
        return recommendReasonStr;
      }

      // 非字符串直接返回空数组
      if (typeof recommendReasonStr !== 'string') {
        return [];
      }

      const str = recommendReasonStr.trim();
      if (!str) return [];

      // 如果看起来是JSON（以 [ 或 { 开始），按JSON解析
      const looksLikeJSON = (str[0] === '[' || str[0] === '{');
      if (looksLikeJSON) {
        try {
          const parsed = JSON.parse(str);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
          // JSON格式但解析失败，退回到逗号分隔或单值；不报警以兼容历史数据
        }
      }

      // CSV 兼容：按逗号分割并清洗
      if (str.includes(',')) {
        return str.split(',').map(item => item.trim()).filter(Boolean);
      }

      // 单值字符串
      return [str];
    },

    // 新增：读取本地点赞缓存（带TTL），返回 true/false 或 null（不存在/过期）
    getCachedLikeStatus(topicId) {
      try {
        const key = this.getLikeCacheKey();
        const cache = wx.getStorageSync(key) || {};
        const cached = cache[topicId];
        const ONE_DAY = 24 * 60 * 60 * 1000;
        if (cached && (Date.now() - cached.ts) < ONE_DAY) {
          return !!cached.islike;
        }
        return null;
      } catch (e) {
        console.warn('[详情页] 读取本地点赞缓存失败:', e);
        return null;
      }
    },

    /**
     * 返回上一页
     */
    goBack: function () {
      wx.navigateBack({
        delta: 1
      });
    },
  
    /**
     * 点赞操作
     */
    toggleLike: async function () {
      // 检查登录状态
      const AuthService = require('../../services/auth.js');
      try {
        await AuthService.ensureLogin();
      } catch (error) {
        console.log('用户取消登录');
        return;
      }
      
      const isLiked = !this.data.productDetail.isLiked;
      const likes = this.data.productDetail.likeCount + (isLiked ? 1 : -1);
      
      this.setData({
        'productDetail.isLiked': isLiked,
        'productDetail.likeCount': likes,
        'productDetail.likes': likes
      });
      
      wx.showToast({
        title: isLiked ? '点赞成功' : '取消点赞',
        icon: 'success'
      });
    },

    onLike: async function() {
        if (!this.canCurrentPostLike()) {
            wx.showToast({
                title: this.getLikeDisabledReason(),
                icon: 'none'
            });
            return;
        }

        if (this._topicLikePending) {
            return;
        }

        // 检查登录状态
        const AuthService = require('../../services/auth.js');
        try {
            await AuthService.ensureLogin();
        } catch (error) {
            console.log('用户取消登录');
            return;
        }
        
        const topicId = this.data.productDetail.id;
        console.log('点赞话题:', topicId);
        
        try {
            this._topicLikePending = true;
            // 调用点赞接口
            const apiService = require('../../services/api.js');
            const result = await apiService.likeTopic(topicId);
            console.log('点赞结果:', result);
            
            // 更新本地数据
            const productDetail = this.data.productDetail;
            if (result && result.isLike === true) {
                // 点赞成功
                productDetail.likeCount = Number(result.likeCount || ((productDetail.likeCount || 0) + 1));
                productDetail.likes = productDetail.likeCount;
                productDetail.islike = true;
                productDetail.isLiked = true;
                try {
                    const pages = getCurrentPages();
                    const prevPage = pages.length > 1 ? pages[pages.length - 2] : null;
                    if (prevPage && typeof prevPage.cacheLikeStatus === 'function') {
                        prevPage.cacheLikeStatus(productDetail.id, true);
                    } else {
                        const key = this.getLikeCacheKey();
                        const cache = wx.getStorageSync(key) || {};
                        cache[productDetail.id] = { islike: true, ts: Date.now() };
                        wx.setStorageSync(key, cache);
                    }
                    // 同步更新上一页列表中的对应项（状态与数量）
                    if (prevPage && prevPage.data && Array.isArray(prevPage.data.originList)) {
                        const updated = prevPage.data.originList.slice();
                        const idx = updated.findIndex(i => i.id == productDetail.id);
                        if (idx !== -1) {
                            updated[idx] = { ...updated[idx], islike: true, likeCount: productDetail.likeCount };
                            prevPage.setData({ originList: updated });
                        }
                    }
                } catch (e) { console.warn('[详情页] 回写首页点赞缓存失败:', e); }
                wx.showToast({
                    title: '点赞成功',
                    icon: 'success'
                });
            } else {
                // 取消点赞
                productDetail.likeCount = Math.max(Number(result && result.likeCount ? result.likeCount : (productDetail.likeCount || 0) - 1), 0);
                productDetail.likes = productDetail.likeCount;
                productDetail.islike = false;
                productDetail.isLiked = false;
                try {
                    const pages = getCurrentPages();
                    const prevPage = pages.length > 1 ? pages[pages.length - 2] : null;
                    if (prevPage && typeof prevPage.cacheLikeStatus === 'function') {
                        prevPage.cacheLikeStatus(productDetail.id, false);
                    } else {
                        const key = this.getLikeCacheKey();
                        const cache = wx.getStorageSync(key) || {};
                        delete cache[productDetail.id];
                        wx.setStorageSync(key, cache);
                    }
                    // 同步更新上一页列表中的对应项（状态与数量）
                    if (prevPage && prevPage.data && Array.isArray(prevPage.data.originList)) {
                        const updated = prevPage.data.originList.slice();
                        const idx = updated.findIndex(i => i.id == productDetail.id);
                        if (idx !== -1) {
                            updated[idx] = { ...updated[idx], islike: false, likeCount: productDetail.likeCount };
                            prevPage.setData({ originList: updated });
                        }
                    }
                } catch (e) { console.warn('[详情页] 回写首页点赞缓存失败:', e); }
                wx.showToast({
                    title: '已取消点赞',
                    icon: 'none'
                });
            }
            
            console.log('[详情页] 映射后的islike值:', productDetail.islike, '类型:', typeof productDetail.islike);
            
            this.setData({
              productDetail: productDetail
            });
        } catch (error) {
            console.error('点赞失败:', error);
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            });
        } finally {
            this._topicLikePending = false;
        }
    },

    onLikePost() {
      this.toggleLike();
    },
  
    /**
     * 分享操作
     */
    onShareAppMessage: function () {
      if (!this.canCurrentPostShare()) {
        return {
          title: '帖子审核中',
          path: '/pages/index/index'
        };
      }

      return {
        ...this.getShareConfig()
      };
    },

    onShareTimeline: function () {
      if (!this.canCurrentPostShare()) {
        return {
          title: '帖子审核中',
          query: ''
        };
      }

      const { productDetail } = this.data;
      return {
        title: this.normalizeString(productDetail.title || productDetail.name, 'Diaoyoushuo'),
        query: this.buildShareQuery(),
        imageUrl: this.buildShareImage()
      };
    },

    onNavbarShareTap() {
      if (!this.canCurrentPostShare()) {
        wx.showToast({
          title: this.getShareDisabledReason(),
          icon: 'none'
        });
        return;
      }

      const sharePath = this.buildSharePath();

      wx.showActionSheet({
        itemList: ['朋友圈轻量预览', '复制帖子路径', '会话分享提示'],
        success: (res) => {
          if (res.tapIndex === 0) {
            wx.navigateTo({
              url: this.buildTimelinePreviewPath()
            });
            return;
          }

          if (res.tapIndex === 1) {
            wx.setClipboardData({
              data: sharePath,
              success: () => {
                wx.showToast({
                  title: '帖子路径已复制',
                  icon: 'success'
                });
              }
            });
            return;
          }

          wx.showToast({
            title: '底部按钮发好友，右上角菜单发朋友圈',
            icon: 'none'
          });
        }
      });
      return;

      wx.showToast({
        title: '请点击底部分享按钮或使用右上角菜单',
        icon: 'none'
      });
    },

    /**
     * 分享按钮点击事件
     */
    onShareTap: function() {
      if (!this.canCurrentPostShare()) {
        wx.showToast({
          title: this.getShareDisabledReason(),
          icon: 'none'
        });
        return;
      }

      this.onNavbarShareTap();
      return;

      wx.showActionSheet({
        itemList: ['分享给朋友', '分享到朋友圈', '复制链接'],
        success: (res) => {
          switch(res.tapIndex) {
            case 0:
              // 分享给朋友 - 触发小程序分享
              wx.showToast({
                title: '请使用右上角分享',
                icon: 'none'
              });
              break;
            case 1:
              // 分享到朋友圈
              wx.showToast({
                title: '朋友圈分享功能开发中',
                icon: 'none'
              });
              break;
            case 2:
              // 复制链接
              wx.setClipboardData({
                data: `钓友说 - ${this.data.productDetail.name}`,
                success: () => {
                  wx.showToast({
                    title: '链接已复制',
                    icon: 'success'
                  });
                }
              });
              break;
          }
        }
      });
    },

    // 评论相关功能
    async onShowCommentInput() {
      if (!this.canCurrentPostComment()) {
        wx.showToast({
          title: this.getCommentDisabledReason(),
          icon: 'none'
        });
        return;
      }

      // 检查登录状态
      const AuthService = require('../../services/auth.js');
      try {
        await AuthService.ensureLogin();
      } catch (error) {
        console.log('用户取消登录');
        return;
      }
      
      console.log('显示评论输入框');
      this.openCommentEditor('normal');
    },

    async onShowRecommendAnswerInput() {
      if (!this.canCurrentPostComment()) {
        wx.showToast({
          title: this.getCommentDisabledReason(),
          icon: 'none'
        });
        return;
      }

      const AuthService = require('../../services/auth.js');
      try {
        await AuthService.ensureLogin();
      } catch (error) {
        console.log('用户取消登录');
        return;
      }

      this.openCommentEditor('recommend_answer');
    },

    onHideCommentInput() {
      this.resetCommentEditor(this.data.commentEditorMode || 'normal');
      
      // 隐藏键盘
      wx.hideKeyboard();
    },

    onCommentInput(e) {
      const content = e.detail.value;
      this.setData({
        commentContent: content,
        canSendComment: content && content.trim().length > 0
      });
    },

    async onPublishComment() {
      if (!this.canCurrentPostComment()) {
        wx.showToast({
          title: this.getCommentDisabledReason(),
          icon: 'none'
        });
        return;
      }

      const isRecommendAnswer = this.data.commentEditorMode === 'recommend_answer';
      const content = this.data.commentContent.trim();

      if (!isRecommendAnswer) {
        if (!content) {
          wx.showToast({
            title: '请输入评论内容',
            icon: 'none'
          });
          return;
        }

        if (content.length > 200) {
          wx.showToast({
            title: '评论内容不能超过200字',
            icon: 'none'
          });
          return;
        }
      } else if (!this.validateRecommendAnswerForm()) {
        wx.showToast({
          title: '请补全规范回答',
          icon: 'none'
        });
        return;
      }

      try {
        // 显示加载状态
        wx.showLoading({
          title: '发布中...'
        });
        
        // 构建请求参数
        const commentData = isRecommendAnswer
          ? this.buildRecommendAnswerPayload()
          : {
              topicId: this.data.productDetail.id || this.data.postId,
              content: content,
              commentType: 'normal',
              replayCommentId: this.data.replyToCommentId || null,
              replayUserId: this.data.replyToUserId || null
            };
        
        console.log('发送评论请求:', commentData);
        
        // 调用API接口
        const response = await api.addComment(commentData);
        
        console.log('评论接口响应:', response);
        
        if (response === true || (response && response.code === 200)) {
          // 隐藏评论输入框并清空状态
          this.setData({
            commentContent: '',
            showCommentInput: false,
            commentEditorMode: 'normal',
            replyTo: null,
            replyToCommentId: null,
            replyToUserId: null,
            replyToUsername: '',
            canSendComment: false,
            recommendAnswerForm: createEmptyRecommendAnswerForm(),
            recommendAnswerErrors: {}
          });
          this.refreshRecommendAnswerOptionViews(createEmptyRecommendAnswerForm());
          
          wx.hideLoading();
          wx.showToast({
            title: isRecommendAnswer ? '回答发布成功' : '评论发布成功',
            icon: 'success'
          });
          
          // 重新加载评论列表以更新树形结构
          const postId = this.data.productDetail.id || this.data.postId;
          if (postId) {
            await this.loadComments(postId);
            
            // 同步更新首页列表中的评论数
            const pages = getCurrentPages();
            const prevPage = pages.length > 1 ? pages[pages.length - 2] : null;
            if (prevPage && prevPage.data && Array.isArray(prevPage.data.originList)) {
              const updated = prevPage.data.originList.slice();
              const index = updated.findIndex(item => item.id == postId);
              if (index !== -1) {
                updated[index] = {
                  ...updated[index],
                  commentCount: (updated[index].commentCount || 0) + 1
                };
                prevPage.setData({ originList: updated });
                console.log('[详情页] 已同步更新首页评论数:', updated[index].commentCount);
              }
            }
          }
        } else {
          throw new Error(api.getErrorMessage(response, '发布失败'));
        }
        
      } catch (error) {
        wx.hideLoading();
        wx.showToast({
          title: api.getErrorMessage(error, '评论内容不符合社区规范，请修改后重试'),
          icon: 'none'
        });
        console.error('发布评论失败:', error);
      }
    },

    async onLikeComment(e) {
      // 检查登录状态
      const AuthService = require('../../services/auth.js');
      try {
        await AuthService.ensureLogin();
      } catch (error) {
        console.log('用户取消登录');
        return;
      }
      
      const commentId = Number(
        (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.commentId)
        || (e.detail && e.detail.commentId)
        || 0
      );

      if (!commentId) {
        wx.showToast({
          title: '评论ID无效',
          icon: 'none'
        });
        return;
      }

      if (!this._commentLikePending) {
        this._commentLikePending = new Set();
      }

      if (this._commentLikePending.has(commentId)) {
        return;
      }

      try {
        this._commentLikePending.add(commentId);
        const result = await api.likeComment(commentId);
        this.cacheCommentLikeStatus(commentId, result.isLike);
        this.updateCommentLikeState(commentId, result);
        wx.showToast({
          title: result.isLike ? '点赞成功' : '已取消点赞',
          icon: 'none'
        });
      } catch (error) {
        console.error('评论点赞失败:', error);
        wx.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        });
      } finally {
        this._commentLikePending.delete(commentId);
      }
    },

    onReplyToComment(e) {
      const commentId = e.currentTarget.dataset.commentId;
      const userId = e.currentTarget.dataset.userId;
      const username = e.currentTarget.dataset.username;
      
      console.log('回复评论 - commentId:', commentId);
      console.log('回复评论 - userId:', userId);
      console.log('回复评论 - username:', username);
      console.log('回复评论 - dataset:', e.currentTarget.dataset);
      
      this.setData({
        showCommentInput: true,
        commentEditorMode: 'normal',
        replyToCommentId: commentId,
        replyToUserId: userId,
        replyToUsername: username,
        replyTo: { id: commentId, username: username },
        recommendAnswerErrors: {},
        canSendComment: Boolean(this.data.commentContent && this.data.commentContent.trim().length > 0)
      });
    },

    onReplyComment(e) {
      const commentId = e.currentTarget.dataset.id;
      const comment = this.data.comments.find(c => c.id === commentId);
      if (comment) {
        this.setData({
          showCommentInput: true,
          commentEditorMode: 'normal',
          replyTo: comment
        });
      }
    },

    onDeleteComment(e) {
      const commentId = e.currentTarget.dataset.id;
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条评论吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              wx.showLoading({ title: '删除中...' });
              await api.deleteComment(commentId);

              const postId = this.data.productDetail.id || this.data.postId;
              if (postId) {
                await this.loadComments(postId);
              }

              const pages = getCurrentPages();
              const prevPage = pages.length > 1 ? pages[pages.length - 2] : null;
              if (prevPage && prevPage.data && Array.isArray(prevPage.data.originList)) {
                const updated = prevPage.data.originList.slice();
                const index = updated.findIndex(item => item.id == postId);
                if (index !== -1) {
                  updated[index] = {
                    ...updated[index],
                    commentCount: Math.max((updated[index].commentCount || 0) - 1, 0)
                  };
                  prevPage.setData({ originList: updated });
                  console.log('[详情页] 删除评论后同步更新首页评论数:', updated[index].commentCount);
                }
              }

              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            } catch (error) {
              wx.hideLoading();
              console.error('删除评论失败:', error);
              wx.showToast({
                title: (error && (error.msg || error.message)) || '删除失败',
                icon: 'none'
              });
            }
          }
        }
      });
    },

    onPreviewImage(e) {
      const clickedSrc = e.currentTarget.dataset.src;
      const urls = this.data.productDetail.images;
      
      // 检查图片路径是否有效
      if (!clickedSrc || !urls || urls.length === 0) {
        wx.showToast({
          title: '图片加载失败',
          icon: 'none'
        });
        return;
      }
      
      // 过滤有效的图片URL
      const validUrls = urls.filter(url => url && url.trim() !== '');
      
      if (validUrls.length === 0) {
        wx.showToast({
          title: '暂无可预览的图片',
          icon: 'none'
        });
        return;
      }
      
      // 找到点击图片在数组中的索引，确保预览从正确的图片开始
      const currentIndex = validUrls.findIndex(url => url === clickedSrc);
      const currentImage = currentIndex >= 0 ? clickedSrc : validUrls[0];
      
      wx.previewImage({
        current: currentImage,
        urls: validUrls,
        fail: (err) => {
          console.error('图片预览失败:', err);
          wx.showToast({
            title: '图片预览失败',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 产品轮播图片点击事件
     */
    onProductImageClick(e) {
      const { index, src, images } = e.detail;
      
      // 检查图片数组是否有效
      if (!images || images.length === 0) {
        wx.showToast({
          title: '暂无可预览的图片',
          icon: 'none'
        });
        return;
      }
      
      // 过滤有效的图片URL
      const validUrls = images.filter(url => url && url.trim() !== '');
      
      if (validUrls.length === 0) {
        wx.showToast({
          title: '暂无可预览的图片',
          icon: 'none'
        });
        return;
      }
      
      // 确保当前图片在有效URL列表中
      const currentImage = validUrls.includes(src) ? src : validUrls[0];
      
      wx.previewImage({
        current: currentImage,
        urls: validUrls,
        fail: (err) => {
          console.error('图片预览失败:', err);
          wx.showToast({
            title: '图片预览失败',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 轮播切换事件
     */
    onSwiperChange(e) {
      const { current } = e.detail;
      console.log('轮播切换到第', current + 1, '张图片');
    },

    onSharePost() {
      wx.showShareMenu({
        withShareTicket: true
      });
    },

    onShowAdminPanel() {
      if (this.data.isAdmin) {
        this.setData({
          showAdminPanel: true
        });
      }
    },

    onHideAdminPanel() {
      this.setData({
        showAdminPanel: false
      });
    },

    onAdminAction(e) {
      const action = e.currentTarget.dataset.action;
      const postId = this.data.postId;
      
      switch (action) {
        case 'approve':
          wx.showToast({
            title: '帖子已审核通过',
            icon: 'success'
          });
          break;
        case 'delete':
          wx.showModal({
            title: '确认删除',
            content: '确定要删除这个帖子吗？',
            success: (res) => {
              if (res.confirm) {
                wx.showToast({
                  title: '帖子已删除',
                  icon: 'success'
                });
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              }
            }
          });
          break;
        case 'pin':
          wx.showToast({
            title: '帖子已置顶',
            icon: 'success'
          });
          break;
        case 'unpin':
          wx.showToast({
            title: '已取消置顶',
            icon: 'success'
          });
          break;
      }
      
      this.setData({
        showAdminPanel: false
      });
    },
  
    /**
     * 关注用户
     */
    followUser: async function () {
      // 检查登录状态
      const AuthService = require('../../services/auth.js');
      try {
        await AuthService.ensureLogin();
      } catch (error) {
        console.log('用户取消登录');
        return;
      }
      
      wx.showToast({
        title: '关注成功',
        icon: 'success',
        duration: 2000
      });
    },
  
    /**
     * 添加评论
     */
    addComment: function () {
      wx.showToast({
        title: '评论功能开发中',
        icon: 'none',
        duration: 2000
      });
    },
  
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
  
    },
  
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
      // 同步主题模式
      this.initThemeMode();
      
      // 通知自定义导航栏更新主题
      const customNavbar = this.selectComponent('#custom-navbar');
      if (customNavbar && customNavbar.updateTheme) {
        customNavbar.updateTheme();
      }

      if (this._skipNextShowReload) {
        this._skipNextShowReload = false;
        return;
      }
      
      // 确保返回后再次展示页面时，详情数据与点赞状态与服务端保持一致
      if (this.data.postId && !this.data.notFound) {
        this.loadDetailPage(this.data.postId);
      }
    },
  
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
  
    },
  
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
  
    },
  
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
      console.log('开始下拉刷新');
      this.setData({
        refresherTriggered: true
      });
      
      // 重新加载帖子详情和评论数据
      this.loadDetailPage(this.data.postId).finally(() => {
        this.setData({
          refresherTriggered: false
        });
        console.log('下拉刷新完成');
      });
    },

    onRefresherPulling: function() {
      console.log('正在下拉...');
    },

    onRefresherAbort: function() {
      console.log('下拉刷新被中止');
      this.setData({
        refresherTriggered: false
      });
    },

    onRefresherRestore: function() {
      console.log('下拉刷新恢复');
    },
  
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
  
    },

    /**
     * 初始化主题模式
     */
    initThemeMode: function() {
      try {
        const app = getApp();
        const isDarkMode = app.globalData.isDarkMode || false;
        this.setData({
          containerClass: isDarkMode ? 'dark' : ''
        });
      } catch (error) {
        console.error('初始化主题模式失败:', error);
      }
    }
  })
