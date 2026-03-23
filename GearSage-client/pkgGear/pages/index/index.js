// pkgGear/pages/index/index.js
const app = getApp();

Page({
  data: {
    navBarHeight: 0,
    isDarkMode: false
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    // const navBarHeight = statusBarHeight + 44; // Standard nav bar height
    // this.setData({ navBarHeight });
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height + statusBarHeight;
    this.setData({ navBarHeight });

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

  navigateTo(e) {
    const type = e.currentTarget.dataset.type;
    const title = e.currentTarget.dataset.title;
    wx.navigateTo({
      url: `/pkgGear/pages/list/list?type=${type}&title=${title}`
    });
  }
});
