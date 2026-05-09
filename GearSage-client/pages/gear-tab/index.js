const app = getApp();
const apiService = require('../../services/api.js');

const SEARCH_FOCUS_KEY = 'gear_tab_focus_search';
const CATEGORY_LIST = [
  { type: 'reels', title: '渔轮', desc: 'Reels', icon: '/images/icons/publis/轮.png' },
  { type: 'rods', title: '鱼竿', desc: 'Rods', icon: '/images/icons/publis/竿.png' },
  { type: 'lures', title: '鱼饵', desc: 'Lures', icon: '/images/icons/publis/饵.png' },
  { type: 'line', title: '鱼线', desc: 'Lines', icon: '/images/icons/publis/线.png' },
  { type: 'hook', title: '鱼钩', desc: 'Hooks', icon: '/images/icons/publis/钩.png' }
];

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    isDarkMode: false,
    focusSearch: false,
    searchKeyword: '',
    selectedSearchType: '',
    categories: CATEGORY_LIST,
    recentGearList: [],
    searchResults: [],
    isLoading: false,
    isSearching: false
  },

  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 0,
      navBarHeight: app.globalData.navBarHeight || 44,
      isDarkMode: app.globalData.isDarkMode || false
    });

    this.themeListener = (isDarkMode) => {
      this.setData({ isDarkMode });
    };
    if (app.globalData.themeListeners) {
      app.globalData.themeListeners.push(this.themeListener);
    }

    this.loadRecentGear();
  },

  onShow() {
    this.setData({ isDarkMode: app.globalData.isDarkMode || false });
    const shouldFocus = wx.getStorageSync(SEARCH_FOCUS_KEY);
    if (shouldFocus) {
      wx.removeStorageSync(SEARCH_FOCUS_KEY);
      this.setData({ focusSearch: true });
      setTimeout(() => this.setData({ focusSearch: false }), 600);
    }
  },

  onUnload() {
    if (app.globalData.themeListeners && this.themeListener) {
      const index = app.globalData.themeListeners.indexOf(this.themeListener);
      if (index > -1) {
        app.globalData.themeListeners.splice(index, 1);
      }
    }
  },

  async onPullDownRefresh() {
    await this.loadRecentGear();
    wx.stopPullDownRefresh();
  },

  normalizeStringList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean);
    return [];
  },

  normalizeText(value, fallback = '') {
    const text = String(value || '').trim();
    return text || fallback;
  },

  normalizeGearItem(item = {}, fallbackType = '') {
    const images = this.normalizeStringList(item.images);
    const type = fallbackType || item.gearType || item.type || '';
    const title = this.normalizeText(item.model)
      || this.normalizeText(item.model_cn)
      || this.normalizeText(item.name, '未命名装备');
    const brand = this.normalizeText(item.brand_name || item.brandName);
    const meta = [
      brand,
      this.normalizeText(item.model_year),
      this.normalizeText(item.type_tips || item.system || item.action)
    ].filter(Boolean).join(' · ');

    return {
      id: item.id || item.gear_id || item.masterId || '',
      type,
      title,
      meta: meta || '装备资料',
      imageUrl: images[0] || '/images/缺省页_上传中.png'
    };
  },

  async loadRecentGear() {
    if (this.data.isLoading) return;
    this.setData({ isLoading: true });
    try {
      const responses = await Promise.all(CATEGORY_LIST.map(category => (
        apiService.getGearList({ type: category.type, page: 1, pageSize: 2 }, { silent: true })
          .then(result => (result && Array.isArray(result.list) ? result.list : [])
            .map(item => this.normalizeGearItem(item, category.type)))
          .catch(error => {
            console.warn('[装备库Tab] 分类装备加载失败:', category.type, error);
            return [];
          })
      )));
      this.setData({
        recentGearList: responses.flat().slice(0, 5),
        isLoading: false
      });
    } catch (error) {
      console.error('[装备库Tab] 最近更新装备加载失败:', error);
      this.setData({ isLoading: false });
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value || '' });
  },

  onSelectSearchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ selectedSearchType: type });
  },

  async onSearchConfirm() {
    const keyword = this.normalizeText(this.data.searchKeyword);
    if (!keyword) {
      wx.showToast({ title: '请输入装备或型号', icon: 'none' });
      return;
    }
    if (!this.data.selectedSearchType) {
      wx.showToast({ title: '先选择装备分类', icon: 'none' });
      return;
    }

    this.setData({ isSearching: true, searchResults: [] });
    try {
      const result = await apiService.getGearList({
        type: this.data.selectedSearchType,
        page: 1,
        pageSize: 200
      }, { silent: true });
      const lowerKeyword = keyword.toLowerCase();
      const list = (result && Array.isArray(result.list) ? result.list : [])
        .map(item => this.normalizeGearItem(item, this.data.selectedSearchType))
        .filter(item => `${item.title} ${item.meta}`.toLowerCase().includes(lowerKeyword))
        .slice(0, 10);
      this.setData({ searchResults: list, isSearching: false });
      if (!list.length) {
        wx.showToast({ title: '当前分类未找到匹配装备', icon: 'none' });
      }
    } catch (error) {
      console.error('[装备库Tab] 搜索失败:', error);
      this.setData({ isSearching: false });
      wx.showToast({ title: '搜索失败，请稍后再试', icon: 'none' });
    }
  },

  navigateToCategory(e) {
    const type = e.currentTarget.dataset.type;
    const title = e.currentTarget.dataset.title;
    wx.navigateTo({
      url: `/pkgGear/pages/list/list?type=${type}&title=${title}`
    });
  },

  navigateToCompare() {
    wx.navigateTo({
      url: '/pkgGear/pages/compare/compare'
    });
  },

  navigateToGearDetail(e) {
    const { id, type } = e.currentTarget.dataset;
    if (!id || !type) return;
    wx.navigateTo({
      url: `/pkgGear/pages/detail/detail?id=${id}&type=${type}`
    });
  }
});
