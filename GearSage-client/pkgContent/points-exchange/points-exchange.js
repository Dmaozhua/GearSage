// pages/points-exchange/points-exchange.js
const api = require('../../services/api.js');
const auth = require('../../services/auth.js');

const TAG_EXCHANGE_MOCK_PRODUCTS = [
  {
    id: 'goods_tag_fun_almost_skunk',
    name: '差点打龟',
    goodsName: '差点打龟',
    image: '/images/icons/h28.png',
    points: 65,
    stock: 999,
    description: '轻度翻车也能优雅自嘲的社区梗标签。',
    rules: '兑换后永久获得，可在编辑资料中佩戴。',
    rarityLevel: 2,
    displayTag: {
      id: 'tag_fun_almost_skunk',
      name: '差点打龟',
      type: 'fun',
      rarityLevel: 2,
      styleKey: 'fun_blue',
      iconKey: 'splash'
    },
    reviews: []
  },
  {
    id: 'goods_tag_fun_empty_hook',
    name: '空钩上鱼',
    goodsName: '空钩上鱼',
    image: '/images/icons/h28.png',
    points: 65,
    stock: 999,
    description: '玄学时刻专属，适合把离谱好运写在脸上。',
    rules: '兑换后永久获得，可在编辑资料中佩戴。',
    rarityLevel: 2,
    displayTag: {
      id: 'tag_fun_empty_hook',
      name: '空钩上鱼',
      type: 'fun',
      rarityLevel: 2,
      styleKey: 'fun_blue',
      iconKey: 'hook'
    },
    reviews: []
  },
  {
    id: 'goods_tag_fun_pat_leg',
    name: '拍大腿',
    goodsName: '拍大腿',
    image: '/images/icons/h31.png',
    points: 85,
    stock: 300,
    description: '错过窗口期后的标准动作，懂的人自然会笑。',
    rules: '兑换后永久获得，可在编辑资料中佩戴。',
    rarityLevel: 3,
    displayTag: {
      id: 'tag_fun_pat_leg',
      name: '拍大腿',
      type: 'fun',
      rarityLevel: 3,
      styleKey: 'fun_orange',
      iconKey: 'spark'
    },
    reviews: []
  },
  {
    id: 'goods_tag_fun_poisoned',
    name: '跑过毒',
    goodsName: '跑过毒',
    image: '/images/icons/h31.png',
    points: 85,
    stock: 300,
    description: '看一眼装备就上头，适合高浓度器材党。',
    rules: '兑换后永久获得，可在编辑资料中佩戴。',
    rarityLevel: 3,
    displayTag: {
      id: 'tag_fun_poisoned',
      name: '跑过毒',
      type: 'fun',
      rarityLevel: 3,
      styleKey: 'fun_orange',
      iconKey: 'bolt'
    },
    reviews: []
  },
  {
    id: 'goods_tag_event_founder',
    name: '开服元老',
    goodsName: '开服元老',
    image: '/images/icons/h33.png',
    points: 100,
    stock: 50,
    description: '限量纪念标签，适合首批老用户佩戴。',
    rules: '限量兑换，兑完即止；兑换后永久获得。',
    rarityLevel: 4,
    displayTag: {
      id: 'tag_event_founder',
      name: '开服元老',
      type: 'event',
      rarityLevel: 4,
      styleKey: 'official_gold',
      iconKey: 'crown'
    },
    reviews: []
  }
];

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 导航栏相关
    statusBarHeight: 0,
    navBarHeight: 0,
    
    // 主题模式
    isDarkMode: false,
    
    // 用户积分
    userPoints: 0,
    
    // 当前选中的Tab
    activeTab: 0, // 0: 虚拟权益, 1: 实体礼品, 2: 商户券
    tabList: ['虚拟权益', '实体礼品', '商户券'],
    indicatorLeft: 65,
    
    // 商品列表
    productList: [],
    
    // 加载状态
    loading: true,
    
    // 模拟商品数据
    mockProducts: {
      0: TAG_EXCHANGE_MOCK_PRODUCTS,
      1: [ // 实体礼品
        {
          id: 3,
          name: '钓鱼竿套装',
          image: '/images/icons/h33.png',
          points: 5000,
          stock: 10,
          description: '专业钓鱼竿套装，包含竿身、鱼线、鱼钩等全套装备',
          rules: '包邮配送，7-15个工作日发货，每人限兑1次',
          reviews: [
            { avatar: '/images/avatar-default.png', nickname: '钓友B', rating: 5, content: '质量很好，值得兑换' }
          ]
        },
        {
          id: 4,
          name: '钓鱼工具箱',
          image: '/images/icons/h109.png',
          points: 3000,
          stock: 0,
          description: '多功能钓鱼工具箱，收纳方便',
          rules: '包邮配送，7-15个工作日发货',
          reviews: []
        }
      ],
      2: [ // 商户券
        {
          id: 5,
          name: '渔具店50元代金券',
          image: '/images/icons/h113.png',
          points: 800,
          stock: 200,
          description: '可在指定渔具店使用的50元代金券',
          rules: '有效期30天，单笔消费满100元可用，不可叠加使用',
          reviews: [
            { avatar: '/images/avatar-default.png', nickname: '钓友C', rating: 4, content: '很实用的券' }
          ]
        }
      ]
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取导航栏高度信息
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    });
    
    this.initThemeMode();
    this.loadUserPoints();
    this.loadProducts();
  },

  onShow() {
    this.initThemeMode();
  },

  /**
   * 初始化主题模式
   */
  initThemeMode() {
    const app = getApp();
    const appDarkMode = app && app.globalData ? app.globalData.isDarkMode : undefined;
    const storedDarkMode = wx.getStorageSync('isDarkMode');
    const isDarkMode = typeof appDarkMode === 'boolean' ? appDarkMode : !!storedDarkMode;
    this.setData({ isDarkMode });
  },

  /**
   * 加载用户积分
   */
  async loadUserPoints() {
    try {
      // 调用接口18获取真实用户积分
      const userPoints = await api.getUserPoints();
      this.setData({
        userPoints: (userPoints !== undefined && userPoints !== null) ? userPoints : 2500
      });
    } catch (error) {
      console.error('[积分商城] 获取用户积分失败:', error);
      // 如果接口调用失败，使用默认值
      this.setData({
        userPoints: 2500
      });
    }
  },

  /**
   * 加载商品列表
   */
  async loadProducts() {
    try {
      this.setData({ loading: true });
      
      // 如果是虚拟权益页签，调用API获取数据
      if (this.data.activeTab === 0) {
        console.log('[积分商城] 开始加载虚拟权益商品列表');
        const apiProducts = await api.getGoodsList(this.data.activeTab);
        console.log('[积分商城] API返回的商品数据:', apiProducts);
        
        // 处理API返回的数据格式
        const formattedProducts = Array.isArray(apiProducts) ? apiProducts.map(item => ({
          id: item.id,
          name: item.goodsName || (item.displayTag && item.displayTag.name) || '',
          goodsName: item.goodsName || (item.displayTag && item.displayTag.name) || '',
          image: item.image || item.imageUrl || '/images/icons/h28.png',
          points: item.points || item.needPoints,
          stock: item.stock || item.quantity || 0,
          description: item.description || item.desc || '',
          rules: item.rules || item.exchangeRules || '兑换规则详见商品详情',
          reviews: item.reviews || [],
          rarityLevel: item.rarityLevel || ((item.displayTag && item.displayTag.rarityLevel) || 1),
          displayTag: item.displayTag || item.tagDefinition || null
        })) : [];
        
        this.setData({
          productList: formattedProducts,
          loading: false
        });
        
        console.log('[积分商城] 虚拟权益商品列表加载完成，共', formattedProducts.length, '个商品');
      } else {
        // 其他页签使用模拟数据
        const products = this.data.mockProducts[this.data.activeTab] || [];
        this.setData({
          productList: products,
          loading: false
        });
      }
    } catch (error) {
      console.error('[积分商城] 加载商品列表失败:', error);
      
      // 如果API调用失败，回退到使用模拟数据
      const products = this.data.mockProducts[this.data.activeTab] || [];
      this.setData({
        productList: products,
        loading: false
      });
      
      // 显示错误提示
      wx.showToast({
        title: '加载商品失败，显示默认数据',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * Tab切换
   */
  onTabChange(e) {
    const index = e.currentTarget.dataset.index;
    
    // 如果点击的是实体礼品或商户券，显示准备中提示
    if (index === 1 || index === 2) {
      const tabName = this.data.tabList[index];
      wx.showToast({
        title: `${tabName}页面正在准备中`,
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    if (index !== this.data.activeTab) {
      // 计算指示器位置 - 根据实际tab宽度和间距调整
      let indicatorLeft = 0;
      if (index === 0) {
        indicatorLeft = 32; // 第一个tab的中心位置
      } else if (index === 1) {
        indicatorLeft = 152; // 第二个tab的中心位置
      } else if (index === 2) {
        indicatorLeft = 272; // 第三个tab的中心位置
      }
      
      this.setData({
        activeTab: index,
        indicatorLeft: indicatorLeft,
        loading: true
      });
      
      // 加载商品数据
      setTimeout(() => {
        this.loadProducts();
      }, 300);
    }
  },

  /**
   * 商品卡片点击
   */
  onProductTap(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${productId}&tab=${this.data.activeTab}`
    });
  },

  /**
   * 立即兑换
   */
  onExchange(e) {
    // 安全地阻止事件冒泡
    if (e && e.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const product = e.currentTarget.dataset.product;
    if (!product || product.stock <= 0) {
      return;
    }
    
    if (this.data.userPoints < product.points) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      });
      return;
    }
    
    // 显示兑换确认弹窗
    this.showExchangeModal(product);
  },

  /**
   * 显示兑换确认弹窗
   */
  showExchangeModal(product) {
    wx.showModal({
      title: '确认兑换',
      content: `确定要用 ${product.points} 积分兑换「${product.name}」吗？\n\n兑换后将扣除 ${product.points} 积分，当前积分：${this.data.userPoints}`,
      confirmText: '确认兑换',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.executeExchange(product);
        }
      }
    });
  },

  /**
   * 执行兑换
   */
  async executeExchange(product) {
    wx.showLoading({
      title: '兑换中...'
    });
    
    try {
      // 如果是虚拟权益页签，调用真实的兑换接口
      if (this.data.activeTab === 0) {
        console.log('[积分商城] 开始兑换虚拟权益商品:', product.name, 'ID:', product.id);
        
        // 调用兑换接口
        const result = await api.redeemGoods(product.id);
        console.log('[积分商城] 兑换接口返回结果:', result);
        
        wx.hideLoading();
        
        // 调用接口18获取最新积分
        try {
          const pointsResult = await api.getUserPoints();
          const newPoints = (pointsResult !== undefined && pointsResult !== null) ? pointsResult : (this.data.userPoints - product.points);
          this.setData({
            userPoints: newPoints
          });
          
          // 显示兑换成功提示
          wx.showModal({
            title: '恭喜！兑换成功！',
            content: `成功兑换「${product.name}」\n消耗积分：${product.points}\n剩余积分：${newPoints}`,
            showCancel: false,
            confirmText: '确定'
          });
        } catch (pointsError) {
          console.error('[积分商城] 获取积分失败，使用本地计算:', pointsError);
          // 如果获取积分失败，使用本地计算作为备用方案
          const newPoints = this.data.userPoints - product.points;
          this.setData({
            userPoints: newPoints
          });
          
          // 显示兑换成功提示
          wx.showModal({
            title: '恭喜！兑换成功！',
            content: `成功兑换「${product.name}」\n消耗积分：${product.points}\n剩余积分：${newPoints}`,
            showCancel: false,
            confirmText: '确定'
          });
        }
        
        // 重新加载商品列表以获取最新库存
        await this.loadProducts();
        
        console.log('[积分商城] 虚拟权益兑换完成');
      } else {
        // 其他页签使用模拟兑换逻辑
        setTimeout(async () => {
          wx.hideLoading();
          
          // 调用接口18获取最新积分
          try {
            const pointsResult = await api.getUserPoints();
            const newPoints = (pointsResult !== undefined && pointsResult !== null) ? pointsResult : (this.data.userPoints - product.points);
            this.setData({
              userPoints: newPoints
            });
            
            // 显示兑换成功提示
            wx.showModal({
              title: '恭喜！兑换成功！',
              content: `成功兑换「${product.name}」\n消耗积分：${product.points}\n剩余积分：${newPoints}`,
              showCancel: false,
              confirmText: '确定'
            });
          } catch (pointsError) {
            console.error('[积分商城] 获取积分失败，使用本地计算:', pointsError);
            // 如果获取积分失败，使用本地计算作为备用方案
            const newPoints = this.data.userPoints - product.points;
            this.setData({
              userPoints: newPoints
            });
            
            // 显示兑换成功提示
            wx.showModal({
              title: '恭喜！兑换成功！',
              content: `成功兑换「${product.name}」\n消耗积分：${product.points}\n剩余积分：${newPoints}`,
              showCancel: false,
              confirmText: '确定'
            });
          }
          
          // 更新商品库存
          const productList = this.data.productList.map(item => {
            if (item.id === product.id) {
              return {
                ...item,
                stock: item.stock - 1
              };
            }
            return item;
          });
          
          this.setData({
            productList: productList
          });
        }, 1500);
      }
    } catch (error) {
      console.error('[积分商城] 兑换失败:', error);
      wx.hideLoading();
      
      // 显示兑换失败提示
      wx.showModal({
        title: '兑换失败',
        content: error.message || '网络异常，请稍后重试',
        showCancel: false,
        confirmText: '确定'
      });
    }
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '积分兑换 - 钓友说',
      path: '/pkgContent/points-exchange/points-exchange'
    };
  }
});
