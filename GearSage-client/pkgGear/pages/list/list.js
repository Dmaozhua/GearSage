const app = getApp();
const apiService = require('../../../services/api');
const {
  enrichGearItemWithSearchData,
  filterGearListByKeyword,
  filterGearListByRecommendations
} = require('../../utils/gearSearchIndex');

const QUERY_PAGE_SIZE = 20;
const SEARCH_QUERY_PAGE_SIZE = 500;
const COMPARE_STORAGE_KEY = 'gear_compare_pool_v1';

Page({
  data: {
    navBarHeight: 0,
    title: '装备列表',
    currentType: '',
    list: [],
    allList: [],
    brandsMap: {},
    brandOptions: [],
    isDarkMode: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
    isRefreshing: false,
    searchKeyword: '',
    activeFilters: {},
    isSearchMode: false,
    compareCount: 0
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

  onShow() {
    this.syncCompareState();
  },

  async initData() {
    await this.loadBrands();
    await this.loadData(true);
  },

  async loadBrands() {
    try {
      const res = await apiService.getGearBrands(this.data.currentType);
      const brandsMap = {};
      const brandOptions = (Array.isArray(res) ? res : []).map((b) => {
        const id = String(b.id || '').trim();
        const name = String(b.name || '').trim();
        if (id && name) {
          brandsMap[id] = name;
        }
        return { id, name };
      }).filter((item) => item.id && item.name);
      this.setData({ brandsMap, brandOptions });
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
    const normalizedItem = {
      ...item,
      imageUrl,
      displayName,
      brandName: item.brand_name || this.data.brandsMap[String(item.brand_id)] || '',
      summaryTags: this.buildSummaryTags(item),
      compareHint: this.buildCompareHint(item)
    };

    return enrichGearItemWithSearchData(normalizedItem, this.data.currentType);
  },

  normalizeText(value) {
    return String(value || '').trim();
  },

  buildSummaryTags(item) {
    const tags = [];
    const pushTag = (value) => {
      const text = this.normalizeText(value);
      if (text && !tags.includes(text)) {
        tags.push(text);
      }
    };

    const traitTags =
      item &&
      item.compare_profile &&
      Array.isArray(item.compare_profile.fitStyleTags)
        ? item.compare_profile.fitStyleTags
        : item && item.gsc_traits && Array.isArray(item.gsc_traits.fitStyleTags)
          ? item.gsc_traits.fitStyleTags
          : [];

    traitTags.forEach(pushTag);

    if (this.data.currentType === 'reels') {
      pushTag(item.type);
      pushTag(item.type_tips);
      pushTag(item.alias);
    } else if (this.data.currentType === 'rods') {
      pushTag(item.type);
      pushTag(item.action);
      pushTag(item.type_tips);
    } else if (this.data.currentType === 'line') {
      pushTag(item.type_tips);
      pushTag(item.alias);
    } else if (this.data.currentType === 'hook') {
      pushTag(item.type_tips);
      pushTag(item.alias);
    } else {
      pushTag(item.system);
      pushTag(item.water_column);
      pushTag(item.action);
    }

    return tags.slice(0, 3);
  },

  buildCompareHint(item) {
    const warningHints =
      item &&
      item.compare_profile &&
      Array.isArray(item.compare_profile.warningHints)
        ? item.compare_profile.warningHints
        : item && item.gsc_traits && Array.isArray(item.gsc_traits.compareWarnings)
          ? item.gsc_traits.compareWarnings
          : [];
    if (warningHints.length > 0) {
      return this.normalizeText(warningHints[0]);
    }

    if (this.data.currentType === 'lures') {
      return '当前以详情理解和筛选收敛为主';
    }

    if (this.data.currentType === 'line') {
      return '当前以规格浏览和内容关联为主，正式对比后置处理';
    }

    if (this.data.currentType === 'hook') {
      return '当前以规格查看和内容关联为主，正式对比后置处理';
    }

    const subtype = this.normalizeText(item.type);
    if (subtype) {
      return `${subtype}子型号后续可直接进入同类对比`;
    }

    return '先在详情里选子型号，再放进同类对比';
  },

  getCompareItems() {
    const stored = wx.getStorageSync(COMPARE_STORAGE_KEY);
    return Array.isArray(stored) ? stored : [];
  },

  syncCompareState() {
    const compareItems = this.getCompareItems();
    const compareCount = compareItems.filter((item) => item && item.gearType === this.data.currentType).length;
    this.setData({ compareCount });
  },

  onClearComparePool() {
    wx.removeStorageSync(COMPARE_STORAGE_KEY);
    this.syncCompareState();
    wx.showToast({
      title: '已清空对比池',
      icon: 'none'
    });
  },

  onCompareAction() {
    if (this.data.compareCount >= 2) {
      wx.navigateTo({
        url: '/pkgGear/pages/compare/compare'
      });
      return;
    }

    this.onClearComparePool();
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
          ? filterGearListByRecommendations(list, recommendationFilters)
          : list;
        this.setData({ activeFilters: filters, list: finalList, allList: finalList, isSearchMode: true, hasMore: false });
        if (!finalList.length) {
          wx.showToast({
            title: selectedRecommendation ? '当前数据暂未覆盖该推荐词' : '未找到相关数据',
            icon: 'none'
          });
        }
      })
      .catch((error) => {
        console.error('[List Page] filter error:', error);
        wx.showToast({ title: '筛选失败，请稍后再试', icon: 'none' });
      })
      .finally(() => wx.hideLoading());
  },

  async queryGearData(keyword = '', filters = {}) {
    const trimmedKeyword = String(keyword || '').trim();
    console.log('[List Page] queryGearData params:', {
      type: this.data.currentType,
      keyword: trimmedKeyword,
      filters
    });
    const response = await apiService.getGearList({
      type: this.data.currentType,
      page: 1,
      pageSize: SEARCH_QUERY_PAGE_SIZE,
      ...filters
    });
    const allData = response && Array.isArray(response.list) ? response.list : [];
    const normalizedList = allData.map((item) => this.normalizeItem(item));
    const finalList = trimmedKeyword
      ? filterGearListByKeyword(normalizedList, trimmedKeyword)
      : normalizedList;

    console.log('[List Page] queryGearData result:', {
      total: finalList.length,
      keyword: trimmedKeyword,
      filters
    });

    return finalList;
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
