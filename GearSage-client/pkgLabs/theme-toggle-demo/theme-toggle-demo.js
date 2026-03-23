// pages/theme-toggle-demo/theme-toggle-demo.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isDarkMode: false,
    componentSize: 60
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取当前主题状态
    const app = getApp();
    this.setData({
      isDarkMode: app.globalData.isDarkMode || false
    });
  },

  /**
   * 主题切换事件处理
   */
  onThemeToggle(e) {
    console.log('主题切换:', e.detail.isDarkMode);
    
    const app = getApp();
    const newDarkMode = app.toggleThemeMode();
    
    this.setData({
      isDarkMode: newDarkMode
    });
    
    wx.showToast({
      title: newDarkMode ? '夜间模式' : '白天模式',
      icon: 'success'
    });
  },

  /**
   * 调整组件大小
   */
  onSizeChange(e) {
    this.setData({
      componentSize: parseInt(e.detail.value)
    });
  },

  /**
   * 手动切换主题（用于测试）
   */
  toggleTheme() {
    this.setData({
      isDarkMode: !this.data.isDarkMode
    });
  }
});