const api = require('../../services/api.js');
const dateFormatter = require('../../utils/date-format.js');
const { buildTopicDetailView } = require('../../utils/topicDetailView.js');

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    containerClass: '',
    loading: true,
    notFound: false,
    postId: '',
    shareSourceType: '',
    shareSourceUserId: '',
    productDetail: {
      id: '',
      title: '',
      images: [],
      badges: [],
      userAvatarUrl: '/images/default-avatar.png',
      nickName: '钓友',
      likeCount: 0,
      commentCount: 0
    },
    previewFacts: [],
    previewTags: [],
    contentPreview: '',
    gallery: []
  },

  onLoad(options) {
    this.initNavbarMetrics();
    this.initThemeMode();
    this.enablePageShare();

    const launchOptions = this.parseLaunchOptions(options);
    const postId = this.normalizeString(launchOptions.id || launchOptions.postId, '');

    this.setData({
      postId,
      shareSourceType: this.normalizeString(launchOptions.shareType, ''),
      shareSourceUserId: this.normalizeString(launchOptions.sharerUid, '')
    });

    if (!postId) {
      this.setData({
        loading: false,
        notFound: true
      });
      return;
    }

    this.loadTopic(postId);
  },

  onShow() {
    this.initThemeMode();
  },

  initNavbarMetrics() {
    const app = getApp();
    let statusBarHeight = app.globalData.statusBarHeight || 0;
    let navBarHeight = app.globalData.navBarHeight || 44;

    if (!statusBarHeight || !navBarHeight) {
      try {
        const systemInfo = wx.getSystemInfoSync();
        statusBarHeight = statusBarHeight || systemInfo.statusBarHeight || 20;

        if (!navBarHeight) {
          const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
          navBarHeight = menuButton && systemInfo.statusBarHeight != null
            ? menuButton.height + (menuButton.top - systemInfo.statusBarHeight) * 2
            : 44;
        }
      } catch (error) {
        statusBarHeight = statusBarHeight || 20;
        navBarHeight = navBarHeight || 44;
      }
    }

    this.setData({
      statusBarHeight,
      navBarHeight
    });
  },

  initThemeMode() {
    try {
      const app = getApp();
      this.setData({
        containerClass: app.globalData.isDarkMode ? 'dark' : ''
      });
    } catch (error) {
      this.setData({
        containerClass: ''
      });
    }
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

  parseLaunchOptions(options = {}) {
    const parsedOptions = { ...options };
    const scene = this.normalizeString(options.scene, '');

    if (!scene) {
      return parsedOptions;
    }

    try {
      const decodedScene = decodeURIComponent(scene);
      decodedScene.split('&').forEach((segment) => {
        if (!segment) {
          return;
        }

        const parts = segment.split('=');
        const key = this.normalizeString(parts[0], '');
        const value = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('=')) : '';

        if (!key || typeof parsedOptions[key] !== 'undefined') {
          return;
        }

        parsedOptions[key] = value;
      });
    } catch (error) {
      console.warn('[timeline-preview] parse scene failed:', error);
    }

    return parsedOptions;
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
      return value.map((item) => this.normalizeString(item, '')).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }

    return [];
  },

  getCurrentUserId() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      return this.normalizeString(userInfo.id || userInfo.userId, '');
    } catch (error) {
      return '';
    }
  },

  formatTime(dateValue) {
    return dateFormatter.formatPostTime(dateValue);
  },

  async loadTopic(postId) {
    this.setData({
      loading: true,
      notFound: false
    });

    try {
      const response = await api.getTopicDetail(postId);
      const postData = response && response.data ? response.data : response;

      if (!postData || (!postData.id && !postData._id && !postData.title)) {
        throw new Error('missing topic');
      }

      let userInfo = {};
      try {
        userInfo = wx.getStorageSync('userInfo') || {};
      } catch (error) {
        userInfo = {};
      }

      const viewModel = buildTopicDetailView(postData, {
        userInfo,
        formatTime: this.formatTime.bind(this)
      });
      const productDetail = viewModel.productDetail || {};

      this.setData({
        loading: false,
        notFound: false,
        productDetail,
        previewFacts: this.buildPreviewFacts(productDetail),
        previewTags: this.buildPreviewTags(productDetail),
        contentPreview: this.buildContentPreview(productDetail),
        gallery: Array.isArray(productDetail.images) ? productDetail.images.slice(0, 3) : []
      });
    } catch (error) {
      console.error('[timeline-preview] load topic failed:', error);
      this.setData({
        loading: false,
        notFound: true
      });
    }
  },

  buildPreviewFacts(productDetail = {}) {
    const facts = [];
    const pushFact = (label, value) => {
      const text = this.normalizeString(value, '');
      if (text) {
        facts.push({ label, value: text });
      }
    };

    pushFact('作者', productDetail.nickName);

    switch (Number(productDetail.topicCategory)) {
      case 0:
      case 1:
        pushFact('装备分类', productDetail.gearCategoryLabel);
        pushFact('装备型号', productDetail.gearModel);
        pushFact('一句话结论', productDetail.summaryDisplay || productDetail.summary);
        pushFact('使用场景', productDetail.environmentsText);
        break;
      case 2:
        pushFact('提问类型', productDetail.questionTypeLabel);
        pushFact('关联装备', [productDetail.relatedGearCategoryLabel, productDetail.relatedGearModel].filter(Boolean).join(' / '));
        pushFact('回复模式', productDetail.quickReplyOnly ? '仅快答' : '开放讨论');
        break;
      case 3:
        pushFact('标点', productDetail.locationTagDisplay);
        pushFact('鱼体信息', productDetail.catchBodyTypeText);
        break;
      case 4:
        pushFact('钓行结果', productDetail.tripResult);
        pushFact('目标鱼', productDetail.targetFishText);
        pushFact('季节天气', [productDetail.season, productDetail.weather].filter(Boolean).join(' / '));
        break;
      default:
        break;
    }

    pushFact('互动', `${Number(productDetail.likeCount || 0)}赞 · ${Number(productDetail.commentCount || 0)}评`);
    return facts.slice(0, 6);
  },

  buildPreviewTags(productDetail = {}) {
    const tags = [];
    const appendTags = (items) => {
      this.normalizeStringList(items).forEach((item) => {
        if (tags.indexOf(item) === -1) {
          tags.push(item);
        }
      });
    };

    appendTags(productDetail.badges);
    appendTags(productDetail.environmentItems);
    appendTags(productDetail.tripStatus);
    appendTags(productDetail.fitItems);

    if (productDetail.tags && productDetail.tags.shareReasons) {
      appendTags(productDetail.tags.shareReasons);
    }

    return tags.slice(0, 6);
  },

  buildContentPreview(productDetail = {}) {
    const candidates = [
      productDetail.summaryDisplay,
      productDetail.tripResult,
      productDetail.catchBodyTypeText,
      productDetail.contentText,
      productDetail.prosSupplementText,
      productDetail.rigDescription
    ];

    const matched = candidates.find((item) => this.normalizeString(item, ''));
    const text = this.normalizeString(matched, '');

    if (!text) {
      return '';
    }

    return text.length > 96 ? `${text.slice(0, 96)}...` : text;
  },

  buildShareTitle() {
    const detail = this.data.productDetail || {};
    const categoryLabel = this.normalizeString(detail.topicCategoryLabel, '钓友说');
    const title = this.normalizeString(detail.title || detail.name, '帖子预览');
    return `${categoryLabel}｜${title}`;
  },

  buildShareImage() {
    const detail = this.data.productDetail || {};
    const firstImage = Array.isArray(detail.images) ? this.normalizeString(detail.images[0], '') : '';
    return firstImage || '/images/share.png';
  },

  buildSharePath() {
    const postId = this.normalizeString(this.data.productDetail.id || this.data.postId, '');
    const sharerUid = this.getCurrentUserId();
    const query = [`id=${encodeURIComponent(postId)}`, 'shareType=timelinePreview'];

    if (sharerUid) {
      query.push(`sharerUid=${encodeURIComponent(sharerUid)}`);
    }

    return `/pages/timeline-preview/index?${query.join('&')}`;
  },

  buildShareQuery() {
    const parts = this.buildSharePath().split('?');
    return parts.length > 1 ? parts[1] : '';
  },

  onShareAppMessage() {
    return {
      title: this.buildShareTitle(),
      path: this.buildSharePath(),
      imageUrl: this.buildShareImage()
    };
  },

  onShareTimeline() {
    return {
      title: this.buildShareTitle(),
      query: this.buildShareQuery(),
      imageUrl: this.buildShareImage()
    };
  },

  onOpenDetail() {
    const postId = this.normalizeString(this.data.productDetail.id || this.data.postId, '');
    const sharerUid = this.getCurrentUserId();
    const query = [`id=${encodeURIComponent(postId)}`, 'shareType=timelineLanding'];

    if (sharerUid) {
      query.push(`sharerUid=${encodeURIComponent(sharerUid)}`);
    }

    wx.navigateTo({
      url: `/pkgContent/detail/detail?${query.join('&')}`
    });
  },

  onBackHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
