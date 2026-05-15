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

function getOwnershipText(status) {
  if (status === 'wishlist') return '想买';
  if (status === 'sold') return '已出掉';
  return '已拥有';
}

Page({
  data: {
    navBarHeight: 44,
    isDarkMode: false,
    loading: true,
    activePanel: 'gear',
    activeType: 'reel',
    tabs: buildTabs(),
    summary: normalizeSummary(),
    summaryText: buildSummaryText(),
    items: [],
    visibleItems: [],
    gearSets: [],
    setSummaryText: '搭配 0｜主页展示 0',
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
    this.loadPageData();
  },

  onUnload() {
    unsubscribeThemeChange(this.themeListener);
  },

  async loadPageData() {
    try {
      await auth.ensureLogin();
    } catch (error) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/profile/profile' }) });
      return;
    }

    this.setData({ loading: true });
    await Promise.all([
      this.loadUserGear(false),
      this.loadGearSets(false)
    ]);
    this.setData({ loading: false });
  },

  async loadUserGear(setLoading = true) {
    if (setLoading) {
      this.setData({ loading: true });
    }
    try {
      const payload = await api.getUserGear({}, { silent: true });
      const summary = normalizeSummary(payload.summary);
      const items = (payload.items || []).map((item) => ({
        ...item,
        typeLabel: getTypeLabel(item.gearType),
        ownershipText: getOwnershipText(item.ownershipStatus),
        notePreview: String(item.note || '').trim().split('\n')[0]
      }));
      this.setData({
        summary,
        tabs: buildTabs(summary),
        summaryText: buildSummaryText(summary),
        items
      });
      this.refreshVisibleItems();
    } catch (error) {
      console.error('[my-gear] load failed:', error);
      wx.showToast({ title: api.getErrorMessage(error, '加载装备失败'), icon: 'none' });
    } finally {
      if (setLoading) {
        this.setData({ loading: false });
      }
    }
  },

  async loadGearSets(setLoading = true) {
    if (setLoading) {
      this.setData({ loading: true });
    }
    try {
      const payload = await api.getUserGearSets({}, { silent: true });
      const gearSets = (payload.items || []).map((item) => this.normalizeGearSet(item));
      const total = Number(payload.summary && payload.summary.total ? payload.summary.total : gearSets.length);
      const profileShowingCount = Number(
        payload.summary && payload.summary.profileShowing
          ? payload.summary.profileShowing
          : gearSets.filter((item) => item.profileDisplayStatus === 'showing').length
      );
      this.setData({
        gearSets,
        setSummaryText: `搭配 ${total}｜主页展示 ${profileShowingCount}`
      });
    } catch (error) {
      console.error('[my-gear] load sets failed:', error);
      wx.showToast({ title: api.getErrorMessage(error, '加载搭配失败'), icon: 'none' });
    } finally {
      if (setLoading) {
        this.setData({ loading: false });
      }
    }
  },

  normalizeGearSet(item = {}) {
    const summary = item.summary || {};
    const lures = Array.isArray(summary.lures) ? summary.lures : [];
    const lureText = lures.map((entry) => entry.label || entry.displayName || '').filter(Boolean).join('、');
    const lureCount = Number(summary.lureCount || lures.length || 0);
    return {
      ...item,
      showOnProfile: item.showOnProfile === true || item.isPublic === true,
      profileDisplayStatus: item.profileDisplayStatus || (item.showOnProfile || item.isPublic ? 'showing' : 'not_displayed'),
      profileStatusText: item.profileStatusText || this.getProfileStatusText(item.profileDisplayStatus || (item.showOnProfile || item.isPublic ? 'showing' : 'not_displayed')),
      profileBlockedText: this.buildProfileBlockedText(item.profileBlockedReasons),
      metaText: [summary.rod && summary.rod.label, summary.reel && summary.reel.label].filter(Boolean).join(' + '),
      lureText: lureText ? `${lureText}${lureCount > 3 ? ` 等${lureCount}个` : ''}` : '',
      tagText: [
        ...(Array.isArray(item.targetFish) ? item.targetFish : []),
        ...(Array.isArray(item.useScene) ? item.useScene : [])
      ].filter(Boolean).slice(0, 6).join(' / '),
      notePreview: String(item.note || '').trim().split('\n')[0]
    };
  },

  getProfileStatusText(status) {
    if (status === 'showing') return '主页展示中';
    if (status === 'invalid') return '展示异常';
    return '未展示';
  },

  buildProfileBlockedText(reasons = []) {
    const labels = {
      rod_deleted: '鱼竿已删除',
      reel_deleted: '渔轮已删除',
      lure_deleted: '常用饵已删除',
      gear_item_deleted: '装备已删除',
      gear_item_not_owned: '包含非已拥有装备',
      gear_master_hidden: '装备库记录不可用',
      gear_variant_missing: '子型号记录异常',
      invalid_rod_reel_combo: '竿轮搭配不兼容',
      profile_missing_main_gear: '缺少鱼竿或渔轮',
      profile_limit_exceeded: '主页最多展示 3 套代表搭配'
    };
    return (Array.isArray(reasons) ? reasons : [])
      .map((reason) => labels[reason] || '')
      .filter(Boolean)
      .slice(0, 2)
      .join('，');
  },

  refreshVisibleItems() {
    const activeType = this.data.activeType;
    const visibleItems = (this.data.items || []).filter((item) => item.gearType === activeType);
    this.setData({
      visibleItems,
      emptyText: `还没有添加${getTypeLabel(activeType)}`
    });
  },

  onPanelChange(e) {
    const panel = e.currentTarget.dataset.panel || 'gear';
    this.setData({ activePanel: panel });
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

  onAddSet() {
    wx.navigateTo({
      url: '/pkgContent/my-gear-set-edit/my-gear-set-edit?mode=create'
    });
  },

  onEditSet(e) {
    const id = Number(e.currentTarget.dataset.id || 0);
    if (!id) return;
    wx.navigateTo({
      url: `/pkgContent/my-gear-set-edit/my-gear-set-edit?mode=edit&id=${id}`
    });
  },

  onToggleSetProfile(e) {
    const id = Number(e.currentTarget.dataset.id || 0);
    const item = (this.data.gearSets || []).find((entry) => Number(entry.id) === id);
    if (!item) return;
    this.updateSet(id, { showOnProfile: !item.showOnProfile });
  },

  async updateSet(id, patch) {
    try {
      await api.updateUserGearSet(id, patch, { silent: true });
      await this.loadGearSets();
    } catch (error) {
      console.error('[my-gear] update set failed:', error);
      wx.showToast({ title: api.getErrorMessage(error, '更新搭配失败'), icon: 'none' });
    }
  },

  onDeleteSet(e) {
    const id = Number(e.currentTarget.dataset.id || 0);
    if (!id) return;

    wx.showModal({
      title: '删除搭配',
      content: '只会删除这组搭配，不会删除我的装备。',
      confirmText: '删除',
      confirmColor: '#8f4d42',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await api.deleteUserGearSet(id, { silent: true });
          wx.showToast({ title: '已删除', icon: 'success' });
          await this.loadGearSets();
        } catch (error) {
          console.error('[my-gear] delete set failed:', error);
          wx.showToast({ title: api.getErrorMessage(error, '删除搭配失败'), icon: 'none' });
        }
      }
    });
  },

  onEditGear(e) {
    const id = Number(e.currentTarget.dataset.id || 0);
    if (!id) return;
    wx.navigateTo({
      url: `/pkgContent/my-gear-edit/my-gear-edit?mode=edit&id=${id}`
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
