const apiService = require('../../../services/api');
const authService = require('../../../services/auth');

const GEAR_TYPE_OPTIONS = [
  { value: 'reels', label: '渔轮' },
  { value: 'rods', label: '鱼竿' },
  { value: 'lures', label: '鱼饵' },
  { value: 'other', label: '其他' }
];

function safeDecodeURIComponent(value) {
  const text = String(value || '');
  try {
    return decodeURIComponent(text);
  } catch (error) {
    return text;
  }
}

function normalizeGearType(value) {
  const raw = String(value || '').trim();
  if (raw === 'rod' || raw === 'rods') return 'rods';
  if (raw === 'lure' || raw === 'lures') return 'lures';
  if (raw === 'reel' || raw === 'reels') return 'reels';
  return 'other';
}

Page({
  data: {
    navBarHeight: 88,
    context: {},
    gearName: '',
    description: '',
    gearTypeOptions: GEAR_TYPE_OPTIONS,
    gearTypeIndex: 0,
    submitting: false
  },

  onLoad(options = {}) {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const navBarHeight = windowInfo.statusBarHeight + 44;
    const context = {
      keyword: safeDecodeURIComponent(options.keyword),
      type: normalizeGearType(safeDecodeURIComponent(options.type)),
      brand: safeDecodeURIComponent(options.brand),
      system: safeDecodeURIComponent(options.system),
      action: safeDecodeURIComponent(options.action),
      waterColumn: safeDecodeURIComponent(options.waterColumn),
      sourcePage: safeDecodeURIComponent(options.sourcePage) || 'gear_list'
    };
    const gearTypeIndex = Math.max(
      GEAR_TYPE_OPTIONS.findIndex((item) => item.value === context.type),
      0
    );

    this.setData({
      navBarHeight,
      context,
      gearName: context.keyword || '',
      gearTypeIndex
    });
  },

  onGearNameInput(e) {
    this.setData({ gearName: e.detail.value || '' });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value || '' });
  },

  onGearTypeChange(e) {
    this.setData({ gearTypeIndex: Number(e.detail.value || 0) });
  },

  validateForm() {
    const gearName = String(this.data.gearName || '').trim();
    const description = String(this.data.description || '').trim();

    if (!gearName) {
      wx.showToast({ title: '请输入希望新增的装备', icon: 'none' });
      return false;
    }
    if (gearName.length < 2) {
      wx.showToast({ title: '装备名称太短，请补充完整型号', icon: 'none' });
      return false;
    }
    if (gearName.length > 80) {
      wx.showToast({ title: '装备名称最多 80 字', icon: 'none' });
      return false;
    }
    if (description.length > 300) {
      wx.showToast({ title: '描述最多 300 字', icon: 'none' });
      return false;
    }

    return true;
  },

  async onSubmit() {
    if (this.data.submitting || !this.validateForm()) {
      return;
    }

    const context = this.data.context || {};
    const gearType = this.data.gearTypeOptions[this.data.gearTypeIndex].value;

    this.setData({ submitting: true });
    try {
      await authService.ensureLogin();
      if (typeof authService.ensureFreshAccessToken === 'function') {
        await authService.ensureFreshAccessToken();
      }
      await apiService.createGearUpdateRequest({
        gearName: String(this.data.gearName || '').trim(),
        description: String(this.data.description || '').trim(),
        gearType,
        searchKeyword: context.keyword || '',
        searchContext: {
          type: context.type || gearType,
          brand: context.brand || '',
          system: context.system || '',
          action: context.action || '',
          waterColumn: context.waterColumn || ''
        },
        sourcePage: context.sourcePage || 'gear_list'
      }, {
        skipErrorToast: true,
        allowDuplicateRequests: true
      });

      wx.showToast({ title: '已提交', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 800);
    } catch (error) {
      if (error && error.message === 'UserCancelledLogin') {
        return;
      }
      wx.showToast({
        title: apiService.getErrorMessage(error, '提交失败'),
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
