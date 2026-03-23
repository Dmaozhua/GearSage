// pages/exchange-success/exchange-success.js
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
    
    // 兑换信息
    productName: '',
    points: 0,
    currentTime: '',
    
    // 虚拟权益信息（如果是虚拟商品）
    virtualInfo: {
      code: '',
      validUntil: ''
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
    
    // 设置当前时间
    const now = new Date();
    const currentTime = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    this.setData({
      currentTime: currentTime
    });
    
    // 获取传递的参数
    if (options.productName && options.points) {
      this.setData({
        productName: decodeURIComponent(options.productName),
        points: parseInt(options.points)
      });
      
      // 如果是虚拟权益，生成卡密信息
      if (options.productName.includes('VIP') || options.productName.includes('券')) {
        this.generateVirtualInfo();
      }
    }
  },

  /**
   * 初始化主题模式
   */
  initThemeMode() {
    const isDarkMode = wx.getStorageSync('isDarkMode') || false;
    this.setData({ isDarkMode });
  },

  /**
   * 生成虚拟商品信息
   */
  generateVirtualInfo() {
    // 生成随机卡密
    const code = this.generateRandomCode();
    
    // 计算有效期（30天后）
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    const validUntil = validDate.toLocaleDateString('zh-CN');
    
    this.setData({
      virtualInfo: {
        code: code,
        validUntil: validUntil
      }
    });
  },

  /**
   * 生成随机卡密
   */
  generateRandomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        result += '-';
      }
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * 复制卡密
   */
  onCopyCode() {
    wx.setClipboardData({
      data: this.data.virtualInfo.code,
      success: () => {
        wx.showToast({
          title: '卡密已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 返回积分中心
   */
  onBackToPoints() {
    wx.navigateBack({
      delta: 2 // 返回到积分中心页面
    });
  },

  /**
   * 继续兑换
   */
  onContinueExchange() {
    wx.navigateBack({
      delta: 1 // 返回到兑换页面
    });
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '我在钓友说兑换了好礼品！',
      path: '/pkgContent/points-exchange/points-exchange'
    };
  }
});