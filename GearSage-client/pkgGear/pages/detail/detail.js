// pkgGear/pages/detail/detail.js
const app = getApp();
const apiService = require('../../../services/api');

Page({
  data: {
    isExpanded: false,
    navBarHeight: 0,
    title: '装备详情',
    item: {},
    columns: [],
    gearType: '',
    isDarkMode: false,
    fieldLabels: {
      'SKU': '型号',
      'GEAR RATIO': '速比',
      'DRAG': '实用卸力(kg)',
      'MAX DRAG': '最大卸力(kg)',
      'WEIGHT': '自重(g)',
      'fluorocarbon_no_m': '氟碳线(号-m)',
      'fluorocarbon_lb_m': '氟碳线(lb-m)',
      'pe_no_m': 'PE线(号-m)',
      'cm_per_turn': '收线长(cm/圈)',
      'spool_diameter_per_turn_mm': '线杯径/一转(mm)',
      'Nylon_no_m': '尼龙线(号-m)',
      'Nylon_lb_m': '尼龙线(lb-m)',
      'handle_length_mm': '手把长(mm)',
      // Rod fields
      'TOTAL LENGTH': '全长(m)',
      'Action': '调性',
      'PIECES': '节数',
      'CLOSELENGTH': '收纳长(cm)',
      'Tip Diameter': '先径(mm)',
      'LURE WEIGHT': '饵重(g)',
      'Line Wt N F': '尼/氟线(lb)',
      'PE Line Size': 'PE线(号)',
      'Handle Length': '手把长(mm)',
      'CONTENT CARBON': '含碳量(%)',
      'Service Card': '首保价(元)',
      'Jig Weight': '铁板重(g)',
      'Squid Jig Size': '木虾(号)',
      'Sinker Rating': '铅坠(号)',
      'TYPE':'类别',
      'Reel Seat Position':'轮座位置'
    },
    ignoredFields: [
      'created_at', 'updated_at', 'bearing_count_roller', 
      'market_reference_price', 'product_code', 'AdminCode', 
      'Market Reference Price', 'brand_id', 'reel_id', 'rod_id', 
      'lure_id', 'id', '_id', '_openid', 'images', 'model', 
      'model_cn', 'model_year', 'type', 'description'
    ],
    relatedTabs: [
      { id: 'experience', label: '长测评', type: 1 },
      { id: 'recommend', label: '好物速报', type: 0 },
      { id: 'question', label: '讨论&提问', type: 2 }
    ],
    currentRelatedTab: 0,
    relatedPosts: {
      experience: [],
      recommend: [],
      question: []
    },
    showBackToPost: false,
    sourcePostId: '',
    loadingRelated: false,
    isLoading: true
  },

  resolveTopicGearCategory(type) {
    if (type === 'rods') return 'rod';
    if (type === 'reels') return 'reel';
    if (type === 'lures') return 'bait';
    return '';
  },

  onLoad(options) {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const statusBarHeight = windowInfo.statusBarHeight;
    const navBarHeight = statusBarHeight + 44;
    
    // Initialize theme from app global data
    const isDarkMode = app.globalData.isDarkMode;
    this.setData({ isDarkMode });

    // Register theme listener
    this.themeListener = (isDark) => {
      this.setData({ isDarkMode: isDark });
    };
    if (app.globalData.themeListeners) {
      app.globalData.themeListeners.push(this.themeListener);
    }

    const id = options.id;
    const type = options.type;
    const gearModel = options.gearModel ? decodeURIComponent(options.gearModel) : '';
    const showBackToPost = options.from === 'topic' && !!options.postId;
    const sourcePostId = options.postId || '';

    this.setData({
      navBarHeight,
      gearType: type || '',
      showBackToPost,
      sourcePostId
    });
    this.loadDetail(id, type, gearModel);
  },

  onUnload() {
    // Unregister theme listener
    if (app.globalData.themeListeners && this.themeListener) {
      const index = app.globalData.themeListeners.indexOf(this.themeListener);
      if (index > -1) {
        app.globalData.themeListeners.splice(index, 1);
      }
    }
  },

  async loadDetail(id, type, gearModel = '') {
    this.setData({ isLoading: true });
    
    try {
      const item = await apiService.getGearDetail({
        id,
        type,
        gearModel
      });
      if (!item) throw new Error('Item not found');

      let detailName = item.displayName || item.model || '';
      if (!detailName) {
        detailName = item.model || '';
        if (item.model_year) detailName = `${item.model_year} ${detailName}`;
        if (item.model_cn) detailName = `${detailName} ${item.model_cn}`;
      }

      const images = Array.isArray(item.images) ? item.images : [];
      const mainImage = images[0] || item.imageUrl || '/images/empty.png';
      const variants = Array.isArray(item.variants) ? item.variants : [];
      const columns = this.generateDynamicColumns(variants);

      this.setData({
        item: {
            ...item,
            variants,
            mainImage,
            detailName,
            brand_name: item.brand_name || ''
        },
        title: item.model,
        columns
      });
      
      this.fetchRelatedPosts();

    } catch (e) {
      console.error(e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  toggleExpand() {
    this.setData({
      isExpanded: !this.data.isExpanded
    });
  },

  async fetchRelatedPosts() {
    const { item, currentRelatedTab, relatedTabs } = this.data;
    const gearModel = String(item.model || '').trim();
    const gearItemId = Number(item.id || 0) || null;
    const gearCategory = this.resolveTopicGearCategory(this.data.gearType);
    if (!gearModel && gearItemId === null) return;

    const tab = relatedTabs[currentRelatedTab];
    const typeKey = tab.id; // 'experience', 'recommend', 'question'
    
    this.setData({ loadingRelated: true });
    console.log('[gear detail] fetchRelatedPosts query:', {
      topicCategory: tab.type,
      gearType: this.data.gearType,
      gearCategory,
      gearModel,
      gearItemId
    });

    try {
      const res = await apiService.getAllTopics({
        topicCategory: tab.type,
        gearCategory,
        gearModel,
        gearItemId,
        limit: 5
      });

      if (Array.isArray(res)) {
        console.log('[gear detail] fetchRelatedPosts result:', res.map(post => ({
          id: post._id || post.id,
          title: post.title,
          gearCategory: post.gearCategory,
          gearModel: post.gearModel,
          gearItemId: post.gearItemId,
          relatedGearCategory: post.relatedGearCategory,
          relatedGearModel: post.relatedGearModel,
          relatedGearItemId: post.relatedGearItemId
        })));
        this.setData({
          [`relatedPosts.${typeKey}`]: res
        });
      }
    } catch (e) {
      console.error('Fetch related posts failed', e);
      this.setData({
        [`relatedPosts.${typeKey}`]: []
      });
    } finally {
      this.setData({ loadingRelated: false });
    }
  },

  onRelatedTabChange(e) {
    const index = e.currentTarget.dataset.index;
    if (index === this.data.currentRelatedTab) return;
    
    this.setData({ currentRelatedTab: index }, () => {
      const tab = this.data.relatedTabs[index];
      if (this.data.relatedPosts[tab.id].length === 0) {
        this.fetchRelatedPosts();
      }
    });
  },

  onRelatedPostTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: `/pkgContent/detail/detail?id=${id}`
      });
    }
  },

  onBackToSourcePost() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1
      });
      return;
    }

    if (this.data.sourcePostId) {
      wx.navigateTo({
        url: `/pkgContent/detail/detail?id=${this.data.sourcePostId}`
      });
    }
  },

  onGoRecommend() {
    const gearCategory = this.resolveTopicGearCategory(this.data.gearType);
    const gearItemId = Number(this.data.item && this.data.item.id || 0);
    const detailName = String(this.data.item && (this.data.item.detailName || this.data.item.model) || '').trim();
    const brandName = String(this.data.item && this.data.item.brand_name || '').trim();
    const gearLabel = [brandName, detailName].filter(Boolean).join(' ').trim() || detailName;

    if (!gearCategory || !gearItemId) {
      wx.showToast({
        title: '暂时无法带入这件装备',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pkgContent/publishMode/publishMode?from=gear_detail&gearCategory=${encodeURIComponent(gearCategory)}&gearItemId=${gearItemId}&gearLabel=${encodeURIComponent(gearLabel)}`
    });
  },

  generateDynamicColumns(variants) {
    if (!variants || variants.length === 0) return [];

    const keys = new Set();
    variants.forEach(v => {
        Object.keys(v).forEach(k => {
            if (v[k] !== null && v[k] !== undefined && v[k] !== '') {
                keys.add(k);
            }
        });
    });

    const { fieldLabels, ignoredFields } = this.data;
    const columns = [];

    // Filter ignored fields
    keys.forEach(key => {
        if (!ignoredFields.includes(key)) {
            columns.push({
                key: key,
                label: fieldLabels[key] || key
            });
        }
    });

    // Sort columns
    const preferredOrder = [
        'SKU', 'GEAR RATIO', 'DRAG', 'MAX DRAG', 'WEIGHT', 
        'TOTAL LENGTH', 'Action', 'PIECES', // Rods
        'spool_diameter_per_turn_mm', 'cm_per_turn',
        'Nylon_lb_m', 'Nylon_no_m', 'fluorocarbon_lb_m', 'fluorocarbon_no_m', 'pe_no_m',
        'handle_length_mm'
    ];

    columns.sort((a, b) => {
        const indexA = preferredOrder.indexOf(a.key);
        const indexB = preferredOrder.indexOf(b.key);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return a.label.localeCompare(b.label);
    });

    return columns;
  }
});
