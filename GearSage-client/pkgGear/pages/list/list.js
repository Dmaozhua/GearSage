const app = getApp();
const apiService = require('../../../services/api');

const QUERY_PAGE_SIZE = 20;

Page({
  data: {
    navBarHeight: 0,
    title: '装备列表',
    currentType: '',
    list: [],
    allList: [],
    brandsMap: {},
    isDarkMode: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
    isRefreshing: false,
    searchKeyword: '',
    activeFilters: {},
    isSearchMode: false
  },

  normalizeSearchTarget(item) {
    return [
      item.displayName,
      item.model,
      item.model_cn,
      item.alias,
      item.type_tips,
      item.family,
      item.familyId
    ]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean)
      .join(' ');
  },

  applyDerivedRecommendations(list = [], derivedRecommendations = []) {
    const keywords = (Array.isArray(derivedRecommendations) ? derivedRecommendations : [])
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return [];
        }
        return [item.id, item.name]
          .map((value) => String(value || '').trim().toLowerCase())
          .filter(Boolean);
      })
      .flat();

    if (!keywords.length) {
      return list;
    }

    const filteredList = list.filter((item) => {
      const target = this.normalizeSearchTarget(item);
      return keywords.some((keyword) => target.includes(keyword));
    });

    return filteredList;
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    const navBarHeight = systemInfo.statusBarHeight + 44;
    const isDarkMode = app.globalData.isDarkMode;
    this.setData({ isDarkMode });

    this.themeListener = (isDark) => this.setData({ isDarkMode: isDark });
    if (app.globalData.themeListeners) {
      app.globalData.themeListeners.push(this.themeListener);
    }

    this.setData({
      navBarHeight,
      title: options.title || '装备列表',
      currentType: options.type || 'reels'
    });

    this.initData();
  },

  onUnload() {
    if (app.globalData.themeListeners && this.themeListener) {
      const index = app.globalData.themeListeners.indexOf(this.themeListener);
      if (index > -1) app.globalData.themeListeners.splice(index, 1);
    }
  },

  async initData() {
    await this.loadBrands();
    await this.loadData(true);
  },

  async loadBrands() {
    try {
      const res = await apiService.getGearBrands(this.data.currentType);
      const brandsMap = {};
      (Array.isArray(res) ? res : []).forEach((b) => { brandsMap[String(b.id)] = b.name; });
      this.setData({ brandsMap });
      if (this.data.list.length > 0) this.updateListWithBrands();
    } catch (e) {
      console.error('[List Page] Load brands failed:', e);
    }
  },

  updateListWithBrands() {
    const list = this.data.list.map((item) => ({
      ...item,
      brandName: this.data.brandsMap[item.brand_id] || ''
    }));
    const allList = this.data.allList.map((item) => ({
      ...item,
      brandName: this.data.brandsMap[item.brand_id] || ''
    }));
    this.setData({ list, allList });
  },

  normalizeItem(item) {
    let imageUrl = '/images/default-gear.png';
    if (item.images) {
      let images = item.images;
      if (typeof images === 'string') images = images.split(',');
      if (Array.isArray(images) && images[0]) imageUrl = images[0].trim();
    }

    const displayName = item.model_year ? `${item.model_year} ${item.model}` : item.model;
    return {
      ...item,
      imageUrl,
      displayName,
      brandName: item.brand_name || this.data.brandsMap[String(item.brand_id)] || ''
    };
  },

  finishSearchUI() {
    const searchComp = this.selectComponent('.gear-search-filter');
    if (searchComp && searchComp.finishSearch) {
      searchComp.finishSearch();
    }
  },

  async onSearch(e) {
    const query = e.detail.query;
    if (!query) return;

    console.log('[List Page] onSearch trigger:', {
      type: this.data.currentType,
      query
    });

    this.setData({ searchKeyword: query, page: 1, hasMore: false, isSearchMode: true });
    wx.showLoading({ title: '搜索中...' });

    try {
      const list = await this.queryGearData(query, {});
      this.setData({ list, allList: list, activeFilters: {}, isSearchMode: true, hasMore: false });

      if (!list.length) {
        wx.showToast({ title: '未找到相关数据', icon: 'none' });
      }
    } catch (error) {
      console.error('[List Page] search error:', error);
      wx.showToast({ title: '搜索失败，请稍后再试', icon: 'none' });
    } finally {
      wx.hideLoading();
      this.finishSearchUI();
    }
  },

  onFilter(e) {
    const filters = e.detail.filters || {};
    const derivedRecommendations = Array.isArray(e.detail.derivedKeywords) ? e.detail.derivedKeywords : [];
    const selectedRecommendation = e.detail.selectedRecommendation && typeof e.detail.selectedRecommendation === 'object'
      ? e.detail.selectedRecommendation
      : null;
    // Use searchText from event if available (to sync with component input), otherwise use local state
    const query = e.detail.searchText !== undefined ? e.detail.searchText : (this.data.searchKeyword || '').trim();
    const hasFilters = Object.keys(filters).length > 0;

    console.log('[List Page] onFilter trigger:', {
      type: this.data.currentType,
      searchKeyword: query,
      filters,
      derivedRecommendations,
      selectedRecommendation
    });

    // Update local keyword state to match component
    this.setData({ searchKeyword: query });

    if (!query && !hasFilters) {
      this.setData({ activeFilters: {}, isSearchMode: false });
      this.loadData(true);
      return;
    }

    wx.showLoading({ title: '筛选中...' });
    this.queryGearData(query, filters)
      .then((list) => {
        const recommendationFilters = selectedRecommendation
          ? [selectedRecommendation]
          : derivedRecommendations;
        const finalList = !query && this.data.currentType === 'lures' && recommendationFilters.length > 0
          ? this.applyDerivedRecommendations(list, recommendationFilters)
          : list;
        this.setData({ activeFilters: filters, list: finalList, allList: finalList, isSearchMode: true, hasMore: false });
        if (!finalList.length) {
          wx.showToast({ title: '未找到相关数据', icon: 'none' });
        }
      })
      .catch((error) => {
        console.error('[List Page] filter error:', error);
        wx.showToast({ title: '筛选失败，请稍后再试', icon: 'none' });
      })
      .finally(() => wx.hideLoading());
  },

  async queryGearData(keyword = '', filters = {}) {
    console.log('[List Page] queryGearData params:', {
      type: this.data.currentType,
      keyword,
      filters
    });
    const response = await apiService.getGearList({
      type: this.data.currentType,
      page: 1,
      pageSize: QUERY_PAGE_SIZE * 5,
      keyword,
      ...filters
    });
    const allData = response && Array.isArray(response.list) ? response.list : [];

    console.log('[List Page] queryGearData result:', {
      total: allData.length,
      keyword,
      filters
    });

    return allData.map((item) => this.normalizeItem(item));
  },

  async loadData(reset = false) {
    if (this.data.isSearchMode && !reset) return;
    if (this.data.isLoading || (!this.data.hasMore && !reset)) return;

    this.setData({ isLoading: true });
    if (reset) {
      this.setData({ list: [], allList: [], page: 1, hasMore: true, isSearchMode: false, searchKeyword: '', activeFilters: {} });
    }

    wx.showLoading({ title: '加载中...' });

    const { page, pageSize } = this.data;

    try {
      const res = await apiService.getGearList({
        type: this.data.currentType,
        page,
        pageSize
      });

      const data = (res.list || []).map((item) => this.normalizeItem(item));
      const hasMore = !!res.hasMore;
      const nextList = reset ? data : this.data.list.concat(data);

      this.setData({
        list: nextList,
        allList: nextList,
        page: page + 1,
        hasMore,
        isLoading: false
      });
    } catch (e) {
      console.error('[List Page] loadData error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ isLoading: false });
    }

    wx.hideLoading();
  },

  onReachBottom() {
    if (!this.data.isSearchMode && this.data.hasMore) {
      this.loadData(false);
    }
  },

  goToDetail(e) {
    const { id, type } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pkgGear/pages/detail/detail?id=${id}&type=${type}` });
  }
});
