const api = require('../../services/api.js');
const auth = require('../../services/auth.js');
const { getInitialDarkMode, subscribeThemeChange, unsubscribeThemeChange } = require('../../utils/theme.js');

const GEAR_TABS = [
  { key: 'reel', label: '鱼轮' },
  { key: 'rod', label: '鱼竿' },
  { key: 'lure', label: '常用饵' }
];

function normalizeNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeSummary(summary = {}) {
  return {
    reel: normalizeNumber(summary.reel),
    rod: normalizeNumber(summary.rod),
    lure: normalizeNumber(summary.lure),
    total: normalizeNumber(summary.total)
  };
}

function buildSummaryText(summary = {}) {
  return `鱼轮 ${normalizeNumber(summary.reel)}｜鱼竿 ${normalizeNumber(summary.rod)}｜常用饵 ${normalizeNumber(summary.lure)}`;
}

function buildTabs(summary = {}) {
  return GEAR_TABS.map((item) => ({
    ...item,
    count: normalizeNumber(summary[item.key])
  }));
}

function getTypeLabel(gearType) {
  const matched = GEAR_TABS.find((item) => item.key === gearType);
  return matched ? matched.label : '装备';
}

Page({
  data: {
    navBarHeight: 44,
    isDarkMode: false,
    loading: true,
    activeType: 'reel',
    tabs: buildTabs(),
    summary: normalizeSummary(),
    summaryText: buildSummaryText(),
    items: [],
    visibleItems: [],
    emptyText: '还没有添加装备'
  },

  onLoad(options = {}) {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      navBarHeight: (windowInfo.statusBarHeight || 0) + 44,
      isDarkMode: getInitialDarkMode(),
      activeType: options.gearType || 'reel'
    });

    this.themeListener = ({ theme } = {}) => {
      this.setData({ isDarkMode: theme === 'dark' });
    };
    subscribeThemeChange(this.themeListener);
  },

  onShow() {
    this.loadUserGear();
  },

  onUnload() {
    unsubscribeThemeChange(this.themeListener);
  },

  async loadUserGear() {
    try {
      await auth.ensureLogin();
    } catch (error) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/profile/profile' }) });
      return;
    }

    this.setData({ loading: true });
    try {
      const payload = await api.getUserGear({}, { silent: true });
      const summary = normalizeSummary(payload.summary);
      const items = (payload.items || []).map((item) => ({
        ...item,
        typeLabel: getTypeLabel(item.gearType),
        publicText: item.isPublic ? '公开' : '私密',
        notePreview: String(item.note || '').trim().split('\n')[0]
      }));
      this.setData({
        loading: false,
        summary,
        tabs: buildTabs(summary),
        summaryText: buildSummaryText(summary),
        items
      });
      this.refreshVisibleItems();
    } catch (error) {
      console.error('[my-gear] load failed:', error);
      this.setData({ loading: false });
      wx.showToast({ title: api.getErrorMessage(error, '加载装备失败'), icon: 'none' });
    }
  },

  refreshVisibleItems() {
    const activeType = this.data.activeType;
    const visibleItems = (this.data.items || []).filter((item) => item.gearType === activeType);
    this.setData({
      visibleItems,
      emptyText: `还没有添加${getTypeLabel(activeType)}`
    });
  },

  onTabChange(e) {
    const type = e.currentTarget.dataset.type || 'reel';
    this.setData({ activeType: type }, () => this.refreshVisibleItems());
  },

  onAddGear() {
    wx.navigateTo({
      url: `/pkgContent/my-gear-edit/my-gear-edit?mode=create&gearType=${this.data.activeType}`
    });
  },

  onEditGear(e) {
    const id = Number(e.currentTarget.dataset.id || 0);
    if (!id) return;
    wx.navigateTo({
      url: `/pkgContent/my-gear-edit/my-gear-edit?mode=edit&id=${id}`
    });
  },

  onTogglePublic(e) {
    const id = Number(e.currentTarget.dataset.id || 0);
    const item = (this.data.items || []).find((entry) => Number(entry.id) === id);
    if (!item) return;

    this.updateItem(id, {
      isPublic: !item.isPublic
    });
  },

  async updateItem(id, patch) {
    try {
      await api.updateUserGear(id, patch, { silent: true });
      await this.loadUserGear();
    } catch (error) {
      console.error('[my-gear] update failed:', error);
      wx.showToast({ title: api.getErrorMessage(error, '更新失败'), icon: 'none' });
    }
  },

  onDeleteGear(e) {
    const id = Number(e.currentTarget.dataset.id || 0);
    if (!id) return;

    wx.showModal({
      title: '删除装备',
      content: '删除后可从装备库重新添加。',
      confirmText: '删除',
      confirmColor: '#8f4d42',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await api.deleteUserGear(id, { silent: true });
          wx.showToast({ title: '已删除', icon: 'success' });
          await this.loadUserGear();
        } catch (error) {
          console.error('[my-gear] delete failed:', error);
          wx.showToast({ title: api.getErrorMessage(error, '删除失败'), icon: 'none' });
        }
      }
    });
  }
});
