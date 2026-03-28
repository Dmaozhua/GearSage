const api = require('../../services/api.js');
const { buildTopicDetailView } = require('../../utils/topicDetailView.js');

const TOPIC_PREVIEW_STORAGE_KEY = 'topic_preview_payload_v1';

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    containerClass: '',
    loading: true,
    submitting: false,
    selectedMode: null,
    formattedContent: '',
    productDetail: {
      title: '',
      images: [],
      badges: [],
      usageInfo: [],
      ratingDetails: [],
      factSections: [],
      tagSections: [],
      listSections: [],
      likeCount: 0,
      commentCount: 0,
      islike: false
    }
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: windowInfo.statusBarHeight || 0
    });

    this.initThemeMode();
    this.loadPreviewData();
  },

  onShow() {
    this.initThemeMode();
  },

  initThemeMode() {
    try {
      const isDarkMode = wx.getStorageSync('isDarkMode') || false;
      this.setData({
        containerClass: isDarkMode ? 'dark' : ''
      });
    } catch (error) {
      console.warn('[postPreview] 获取主题模式失败:', error);
    }
  },

  formatTime(timeValue) {
    if (!timeValue) {
      return '';
    }

    try {
      const timestamp = typeof timeValue === 'number' ? timeValue : new Date(timeValue).getTime();
      if (!timestamp || Number.isNaN(timestamp)) {
        return '';
      }

      const diff = Date.now() - timestamp;
      if (diff < 60 * 1000) {
        return '刚刚';
      }
      if (diff < 60 * 60 * 1000) {
        return `${Math.floor(diff / (60 * 1000))}分钟前`;
      }
      if (diff < 24 * 60 * 60 * 1000) {
        return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
      }
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
    } catch (error) {
      return '';
    }
  },

  loadPreviewData() {
    try {
      const cached = wx.getStorageSync(TOPIC_PREVIEW_STORAGE_KEY);
      if (!cached || !cached.postData) {
        wx.showToast({
          title: '预览数据已失效',
          icon: 'none'
        });
        setTimeout(() => wx.navigateBack(), 1200);
        return;
      }

      const userInfo = wx.getStorageSync('userInfo') || {};
      const previewData = buildTopicDetailView(cached.postData, {
        userInfo,
        previewTime: cached.previewTime || Date.now(),
        formatTime: this.formatTime.bind(this)
      });

      this.setData({
        selectedMode: cached.selectedMode || null,
        productDetail: previewData.productDetail,
        formattedContent: previewData.formattedContent,
        loading: false
      });
    } catch (error) {
      console.error('[postPreview] 读取预览数据失败:', error);
      wx.showToast({
        title: '预览加载失败',
        icon: 'none'
      });
      setTimeout(() => wx.navigateBack(), 1200);
    }
  },

  onEditBack() {
    wx.navigateBack();
  },

  async onConfirmPublish() {
    if (this.data.submitting) {
      return;
    }

    let cached = null;
    try {
      cached = wx.getStorageSync(TOPIC_PREVIEW_STORAGE_KEY);
    } catch (error) {
      console.error('[postPreview] 获取待发布数据失败:', error);
    }

    if (!cached || !cached.postData) {
      wx.showToast({
        title: '预览数据已失效',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '发布中...' });

    try {
      console.log('[postPreview] publish payload summary:', {
        topicCategory: cached.postData.topicCategory,
        title: cached.postData.title,
        gearCategory: cached.postData.gearCategory,
        gearModel: cached.postData.gearModel,
        gearItemId: cached.postData.gearItemId,
        relatedGearCategory: cached.postData.relatedGearCategory,
        relatedGearModel: cached.postData.relatedGearModel,
        relatedGearItemId: cached.postData.relatedGearItemId
      });
      const publishResult = await api.publishTopic(cached.postData);
      wx.hideLoading();
      wx.setStorageSync('needRefreshAfterPublish', true);
      wx.removeStorageSync(TOPIC_PREVIEW_STORAGE_KEY);
      wx.showToast({
        title: Number(publishResult && publishResult.status) === 1 ? '已提交审核' : '发布成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack({ delta: 2 });
      }, 1200);
    } catch (error) {
      wx.hideLoading();
      console.error('[postPreview] 发布失败:', error);
      const message = (error && (error.msg || error.message)) ? (error.msg || error.message) : '发布失败';
      wx.showToast({
        title: message,
        icon: 'none'
      });
      this.setData({ submitting: false });
      return;
    }

    this.setData({ submitting: false });
  }
});
