// pages/about-page/about-page.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 导航栏相关数据
    statusBarHeight: 0,
    navBarHeight: 0,
    
    // 主题模式
    containerClass: '',
    
    // 页面标题
    pageTitle: '',
    
    // 内容类型
    contentType: '',
    
    // 内容数据
    contentData: null
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
    
    // 初始化主题模式
    this.initThemeMode();
    
    // 获取内容类型
    const { type } = options;
    if (type) {
      this.setData({ contentType: type });
      this.loadContent(type);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 同步主题模式
    this.initThemeMode();
    
    // 通知自定义导航栏更新主题
    const customNavbar = this.selectComponent('#custom-navbar');
    if (customNavbar && customNavbar.updateTheme) {
      customNavbar.updateTheme();
    }
  },

  /**
   * 初始化主题模式
   */
  initThemeMode() {
    try {
      const app = getApp();
      const isDarkMode = app.globalData.isDarkMode || false;
      this.setData({
        containerClass: isDarkMode ? 'dark' : ''
      });
    } catch (error) {
      console.error('初始化主题模式失败:', error);
    }
  },

  /**
   * 加载内容
   */
  loadContent(type) {
    try {
      let pageTitle = '';
      let contentData = null;
      
      // 根据类型加载不同内容
      switch (type) {
        case 'about':
          pageTitle = '关于小程序';
          try {
            // 导入关于小程序的内容
            const aboutApp = require('./data/关于小程序.js');
            contentData = aboutApp.data.formattedContent;
            console.log('加载关于小程序内容成功');
          } catch (err) {
            console.error('加载关于小程序内容失败:', err);
            wx.showToast({
              title: '加载内容失败',
              icon: 'none'
            });
          }
          break;
        case 'audit':
          pageTitle = '关于审核';
          try {
            // 导入关于审核的内容
            const aboutAudit = require('./data/关于审核.js');
            contentData = aboutAudit.data.auditContent;
            console.log('加载关于审核内容成功');
          } catch (err) {
            console.error('加载关于审核内容失败:', err);
            wx.showToast({
              title: '加载内容失败',
              icon: 'none'
            });
          }
          break;
        default:
          pageTitle = '关于';
          break;
      }
      
      this.setData({
        pageTitle,
        contentData
      });
    } catch (error) {
      console.error('加载内容失败:', error);
      wx.showToast({
        title: '加载内容失败',
        icon: 'none'
      });
    }
  }
});