const app = getApp();


const QUERY_PAGE_SIZE = 20;

function escapeRegExp(input) {
  return String(input || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
    this.loadBrands();
    this.loadData(true);
  },

  async loadBrands() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('bz_rate_brand').limit(100).get();
      const brandsMap = {};
      (res.data || []).forEach((b) => { brandsMap[b.id] = b.name; });
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
      brandName: this.data.brandsMap[item.brand_id] || ''
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
    // Use searchText from event if available (to sync with component input), otherwise use local state
    const query = e.detail.searchText !== undefined ? e.detail.searchText : (this.data.searchKeyword || '').trim();
    const hasFilters = Object.keys(filters).length > 0;

    console.log('[List Page] onFilter trigger:', {
      type: this.data.currentType,
      searchKeyword: query,
      filters
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
        this.setData({ activeFilters: filters, list, allList: list, isSearchMode: true, hasMore: false });
        if (!list.length) {
          wx.showToast({ title: '未找到相关数据', icon: 'none' });
        }
      })
      .catch((error) => {
        console.error('[List Page] filter error:', error);
        wx.showToast({ title: '筛选失败，请稍后再试', icon: 'none' });
      })
      .finally(() => wx.hideLoading());
  },

  getCollectionName() {
    const { currentType } = this.data;
    if (currentType === 'reels') return 'bz_rate_reel';
    if (currentType === 'rods') return 'bz_rate_rod';
    if (currentType === 'lures') return 'bz_rate_lure';
    return '';
  },

  buildWhereClause(db, keyword = '', filters = {}) {
    const _ = db.command;
    const conditions = [];
    const trimmedKeyword = String(keyword || '').trim();
    const normalizeFilterValues = (value) => {
      const list = Array.isArray(value) ? value : [value];
      return list
        .map((item) => (typeof item === 'string' ? item.trim() : item))
        .filter((item) => item !== undefined && item !== null && item !== '');
    };
    const pushCondition = (field, value) => {
      const values = normalizeFilterValues(value);
      if (!values.length) return;
      if (values.length === 1) {
        conditions.push({ [field]: values[0] });
        return;
      }
      conditions.push({ [field]: _.in(values) });
    };

    if (trimmedKeyword) {
      const tokens = trimmedKeyword.split(/\s+/);
      const tokenConditions = tokens.map((token) => {
        const tokenReg = db.RegExp({
          regexp: escapeRegExp(token),
          options: 'i'
        });
        
        const orClauses = [
          { model: tokenReg },
          { model_cn: tokenReg },
          { model_year: tokenReg },
          { alias: tokenReg },
          { type_tips: tokenReg }
        ];
        
        const numToken = Number(token);
        if (!isNaN(numToken)) {
          orClauses.push({ model_year: numToken });
        }

        return _.or(orClauses);
      });
      
      if (tokenConditions.length > 0) {
        conditions.push(...tokenConditions);
      }
    }

    const brandValues = normalizeFilterValues(filters.brands);
    if (brandValues.length > 0) {
      const candidates = [];
      const seen = {};
      const pushBrandCandidate = (candidate) => {
        const marker = `${typeof candidate}:${candidate}`;
        if (seen[marker]) return;
        seen[marker] = true;
        candidates.push(candidate);
      };

      brandValues.forEach((brand) => {
        pushBrandCandidate(brand);
        const brandIdNum = Number(brand);
        if (!Number.isNaN(brandIdNum)) {
          pushBrandCandidate(brandIdNum);
          pushBrandCandidate(String(brandIdNum));
        }
      });

      if (candidates.length === 1) {
        conditions.push({ brand_id: candidates[0] });
      } else {
        conditions.push({ brand_id: _.in(candidates) });
      }
    }
    pushCondition('type', filters.types);
    pushCondition('system', filters.system);
    pushCondition('water_column', filters.water_column);
    pushCondition('action', filters.action);
    pushCondition('options', filters.options);
    pushCondition('brakeSys', filters.brakeSys);


    if (!conditions.length) return {};
    if (conditions.length === 1) return conditions[0];
    return _.and(conditions);
  },

  async queryGearData(keyword = '', filters = {}) {
    const collectionName = this.getCollectionName();
    if (!collectionName) return [];

    const db = wx.cloud.database();
    const where = this.buildWhereClause(db, keyword, filters);
    let allData = [];
    let page = 0;

    console.log('[List Page] queryGearData params:', {
      collectionName,
      keyword,
      filters,
      where
    });

    while (true) {
      const res = await db.collection(collectionName)
        .where(where)
        .orderBy('id', 'asc')
        .skip(page * QUERY_PAGE_SIZE)
        .limit(QUERY_PAGE_SIZE)
        .get();

      const chunk = res.data || [];
      allData = allData.concat(chunk);

      if (chunk.length < QUERY_PAGE_SIZE) break;
      page += 1;
      if (page >= 50) {
        console.warn('[List Page] queryGearData reached safety page limit', { page, total: allData.length });
        break;
      }
    }

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
    const db = wx.cloud.database();
    const collectionName = this.getCollectionName();

    if (!collectionName) {
      this.setData({ isLoading: false });
      wx.hideLoading();
      return;
    }

    try {
      const res = await db.collection(collectionName)
        .orderBy('id', 'asc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      const data = (res.data || []).map((item) => this.normalizeItem(item));
      const hasMore = data.length === pageSize;
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
