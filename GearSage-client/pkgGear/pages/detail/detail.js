// pkgGear/pages/detail/detail.js
const app = getApp();

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

  normalizeText(value) {
    return String(value || '').trim();
  },

  escapeRegExp(value = '') {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  buildGearModelCandidates(gearModel = '') {
    const raw = this.normalizeText(gearModel);
    if (!raw) {
      return [];
    }

    const candidates = [];
    const push = (value) => {
      const text = this.normalizeText(value);
      if (text && !candidates.includes(text)) {
        candidates.push(text);
      }
    };

    push(raw);

    const yearMatch = raw.match(/^(\d{2,4})\s+(.+)$/);
    if (yearMatch) {
      push(yearMatch[2]);
    }

    const chinese = raw.match(/[\u4e00-\u9fa5]+/g);
    if (chinese && chinese.length) {
      push(chinese.join(''));
    }

    const alphaNumeric = raw
      .replace(/[\u4e00-\u9fa5]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (alphaNumeric) {
      push(alphaNumeric);
    }

    if (yearMatch) {
      const tail = this.normalizeText(yearMatch[2]);
      const tailAlphaNumeric = tail
        .replace(/[\u4e00-\u9fa5]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const tailChinese = tail.match(/[\u4e00-\u9fa5]+/g);
      if (tailAlphaNumeric) {
        push(tailAlphaNumeric);
      }
      if (tailChinese && tailChinese.length) {
        push(tailChinese.join(''));
      }
    }

    return candidates;
  },

  async queryFirstDoc(collection, query) {
    const result = await collection.where(query).limit(1).get();
    return result && Array.isArray(result.data) && result.data.length ? result.data[0] : null;
  },

  async findGearMasterRecord(db, collectionName, id, gearModel) {
    const collection = db.collection(collectionName);
    const numericId = Number(id);

    if (id) {
      const byDocId = await collection.doc(String(id)).get().then(res => res.data || null).catch(() => null);
      if (byDocId) {
        return byDocId;
      }
    }

    if (Number.isFinite(numericId) && numericId > 0) {
      const byNumericId = await this.queryFirstDoc(collection, { id: numericId }).catch(() => null);
      if (byNumericId) {
        return byNumericId;
      }
    }

    const candidates = this.buildGearModelCandidates(gearModel);
    if (!candidates.length) {
      return null;
    }

    for (const candidate of candidates) {
      const exactModel = await this.queryFirstDoc(collection, { model: candidate }).catch(() => null);
      if (exactModel) {
        return exactModel;
      }

      const exactModelCn = await this.queryFirstDoc(collection, { model_cn: candidate }).catch(() => null);
      if (exactModelCn) {
        return exactModelCn;
      }
    }

    for (const candidate of candidates) {
      const pattern = this.escapeRegExp(candidate);
      const byModelLike = await this.queryFirstDoc(collection, {
        model: db.RegExp({
          regexp: pattern,
          options: 'i'
        })
      }).catch(() => null);
      if (byModelLike) {
        return byModelLike;
      }

      const byModelCnLike = await this.queryFirstDoc(collection, {
        model_cn: db.RegExp({
          regexp: pattern,
          options: 'i'
        })
      }).catch(() => null);
      if (byModelCnLike) {
        return byModelCnLike;
      }
    }

    return null;
  },

  async loadDetail(id, type, gearModel = '') {
    this.setData({ isLoading: true });
    const db = wx.cloud.database();
    
    try {
      // 1. Fetch Master Record
      let collectionName = '';
      if (type === 'reels') collectionName = 'bz_rate_reel';
      else if (type === 'rods') collectionName = 'bz_rate_rod';
      else if (type === 'lures') collectionName = 'bz_rate_lure';

      if (!collectionName) throw new Error('Unknown type');

      const item = await this.findGearMasterRecord(db, collectionName, id, gearModel);
      if (!item) throw new Error('Item not found');

      // Process Master Item (Images, Name)
      // detail-image: Enlarge (handled in WXML/WXSS, here just ensure URL)
      // detail-name: model_year + model + model_cn
      let detailName = item.model || '';
      if (item.model_year) detailName = `${item.model_year} ${detailName}`;
      if (item.model_cn) detailName = `${detailName} ${item.model_cn}`;
      
      // Image
      let mainImage = '/images/empty.png';
      if (item.images) {
         let images = item.images;
         if (typeof images === 'string') {
            images = images.split(',');
         }
         if (Array.isArray(images) && images.length > 0 && images[0]) {
            mainImage = images[0].trim();
         }
      }

      // 2. Fetch Details (Variants)
      let variants = [];
      let columns = [];

      if (type === 'reels') {
        // Reel Logic
        let detailCollection = '';
        if (item.type === 'spinning') detailCollection = 'bz_rate_spinning_reel_detail';
        else if (item.type === 'baitcasting') detailCollection = 'bz_rate_baitcasting_reel_detail';
        
        if (detailCollection) {
          variants = await this.fetchAllVariants(detailCollection, { reel_id: item.id });
          columns = this.generateDynamicColumns(variants);
        }
      } else if (type === 'rods') {
         // Rod Logic
         const detailCollection = 'bz_rate_rod_detail';
         variants = await this.fetchAllVariants(detailCollection, { rod_id: item.id });
         console.log('Rod Variants:', variants);
         columns = this.generateDynamicColumns(variants);
      } else {
        // Lures or others - use miniApi fallback or empty
         try {
            const apiRes = await wx.cloud.callFunction({
                name: 'miniApi',
                data: { action: 'gear.detail', payload: { id, category: type } }
            });
            if (apiRes.result && apiRes.result.code === 200) {
                variants = apiRes.result.data.variants || [];
                // Generate columns dynamically for API response too if possible
                columns = this.generateDynamicColumns(variants);
            }
         } catch(e) {
             console.error('MiniApi fallback failed', e);
         }
      }

      // Fetch Brand Name
      let brandName = '';
      if (item.brand_id) {
          const brandRes = await db.collection('bz_rate_brand').doc(item.brand_id + '').get().catch(async () => {
              return await db.collection('bz_rate_brand').where({ id: parseInt(item.brand_id) }).get().then(r => ({ data: r.data[0] }));
          });
          if (brandRes.data) brandName = brandRes.data.name;
      }

      this.setData({
        item: {
            ...item,
            variants,
            mainImage,
            detailName,
            brand_name: brandName
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
      const res = await wx.cloud.callFunction({
        name: 'miniApi',
        data: {
          action: 'topic.all',
          payload: {
            debugSource: 'gear-detail-related',
            topicCategory: tab.type,
            gearCategory,
            gearModel,
            gearItemId,
            limit: 5
          }
        }
      });

      if (res.result.code === 200) {
        console.log('[gear detail] fetchRelatedPosts result:', (res.result.data || []).map(post => ({
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
          [`relatedPosts.${typeKey}`]: Array.isArray(res.result.data) ? res.result.data : []
        });
      } else {
        console.warn('[gear detail] fetchRelatedPosts non-200:', res.result);
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

  async fetchAllVariants(collectionName, query) {
    const db = wx.cloud.database();
    const MAX_LIMIT = 20;
    
    try {
      const countResult = await db.collection(collectionName).where(query).count();
      const total = countResult.total;
      
      if (total === 0) return [];
      
      const batchTimes = Math.ceil(total / MAX_LIMIT);
      const tasks = [];
      
      for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection(collectionName)
          .where(query)
          .skip(i * MAX_LIMIT)
          .limit(MAX_LIMIT)
          .get();
        tasks.push(promise);
      }
      
      if (tasks.length > 0) {
        const results = await Promise.all(tasks);
        return results.reduce((acc, cur) => acc.concat(cur.data), []);
      }
      return [];
    } catch (e) {
      console.error('Fetch variants failed:', e);
      return [];
    }
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
