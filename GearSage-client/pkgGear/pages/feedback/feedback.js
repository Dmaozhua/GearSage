const apiService = require('../../../services/api');
const authService = require('../../../services/auth');
const imageUploadUtils = require('../../../utils/imageUploadUtils');

const FEEDBACK_TYPES = ['参数错误', '图片问题', '技术说明错误', '型号缺失', '权利问题', '其他'];
const GEAR_TYPE_LABELS = {
  reels: '渔轮',
  rods: '鱼竿',
  lures: '路亚饵',
  line: '鱼线',
  hook: '鱼钩'
};

Page({
  data: {
    navBarHeight: 88,
    context: {},
    gearTypeLabel: '',
    fieldOptions: [{ key: '', label: '整体资料' }],
    fieldIndex: 0,
    selectedField: { key: '', label: '整体资料' },
    feedbackTypes: FEEDBACK_TYPES,
    feedbackTypeIndex: 0,
    content: '',
    images: [],
    submitting: false
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const navBarHeight = windowInfo.statusBarHeight + 44;
    const context = wx.getStorageSync('gear_feedback_context_v1') || {};
    const fieldOptions = Array.isArray(context.fieldOptions) && context.fieldOptions.length
      ? context.fieldOptions
      : [{ key: '', label: '整体资料' }];

    this.setData({
      navBarHeight,
      context,
      gearTypeLabel: GEAR_TYPE_LABELS[context.gearType] || context.gearType || '装备',
      fieldOptions,
      selectedField: fieldOptions[0]
    });
  },

  onFieldChange(e) {
    const index = Number(e.detail.value || 0);
    this.setData({
      fieldIndex: index,
      selectedField: this.data.fieldOptions[index] || this.data.fieldOptions[0]
    });
  },

  onFeedbackTypeChange(e) {
    this.setData({
      feedbackTypeIndex: Number(e.detail.value || 0)
    });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value || '' });
  },

  async onChooseImages() {
    const restCount = Math.max(6 - this.data.images.length, 0);
    if (!restCount) {
      wx.showToast({ title: '最多上传 6 张', icon: 'none' });
      return;
    }

    const uploaded = await imageUploadUtils.chooseAndUploadImages({
      count: restCount,
      prefix: 'gear-feedback',
      showLoading: true
    });

    if (uploaded.length) {
      this.setData({
        images: this.data.images.concat(uploaded).slice(0, 6)
      });
    }
  },

  onPreviewImage(e) {
    const current = this.data.images[Number(e.currentTarget.dataset.index || 0)];
    if (!current) return;
    wx.previewImage({
      current,
      urls: this.data.images
    });
  },

  onRemoveImage(e) {
    const index = Number(e.currentTarget.dataset.index || 0);
    const nextImages = this.data.images.slice();
    nextImages.splice(index, 1);
    this.setData({ images: nextImages });
  },

  async onSubmit() {
    const content = String(this.data.content || '').trim();
    const context = this.data.context || {};
    if (!context.gearType || !context.masterId) {
      wx.showToast({ title: '缺少装备信息，请从详情页进入', icon: 'none' });
      return;
    }
    if (!content) {
      wx.showToast({ title: '请填写反馈说明', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      await authService.ensureLogin();
      const selectedField = this.data.selectedField || {};
      await apiService.submitGearFeedback({
        gearType: context.gearType,
        masterId: context.masterId,
        variantId: context.variantId || '',
        fieldKey: selectedField.key || '',
        fieldLabel: selectedField.label || '',
        feedbackType: this.data.feedbackTypes[this.data.feedbackTypeIndex],
        content,
        images: this.data.images
      });

      wx.showToast({ title: '已提交', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 600);
    } catch (error) {
      if (error && error.message === 'UserCancelledLogin') {
        return;
      }
      wx.showToast({
        title: (error && error.message) || '提交失败',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
