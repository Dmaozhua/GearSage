Component({
  properties: {
    title: {
      type: String,
      value: '钓友说'
    },
    showBack: {
      type: Boolean,
      value: true
    },
    leftIcon: {
      type: String,
      value: ''
    },
    leftIconDark: {
      type: String,
      value: ''
    },
    backgroundColor: {
      type: String,
      value: '#ffffff'
    },
    textColor: {
      type: String,
      value: '#000000'
    },
    showSearch: {
      type: Boolean,
      value: false
    },
    searchPlaceholder: {
      type: String,
      value: '搜索商品'
    },
    showRightButton: {
      type: Boolean,
      value: false
    },
    rightButtonText: {
      type: String,
      value: '更多'
    },
    rightButtonIcon: {
      type: String,
      value: ''
    },
    rightText: {
      type: String,
      value: ''
    },
    rightIcon: {
      type: String,
      value: ''
    },
    transparent: {
      type: Boolean,
      value: false
    },
    showShadow: {
      type: Boolean,
      value: true
    },
    enableAnimation: {
      type: Boolean,
      value: true
    },
    opacity: {
      type: Number,
      value: 1
    }
  },

  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    menuButtonInfo: {},
    isDarkMode: false
  },

  lifetimes: {
    attached() {
      const app = getApp();
      this.setData({
        statusBarHeight: app.globalData.statusBarHeight,
        navBarHeight: app.globalData.navBarHeight,
        menuButtonInfo: app.globalData.menuButtonInfo,
        isDarkMode: app.globalData.isDarkMode || false
      });

      this.initThemeListener();
    },

    detached() {
      this.cleanupThemeListener();
    }
  },

  methods: {
    onBackTap() {
      wx.vibrateShort({
        type: 'light'
      });

      this.triggerEvent('back');

      setTimeout(() => {
        const currentPages = getCurrentPages();
        const currentPage = currentPages[currentPages.length - 1];

        if (currentPage && !currentPage._backHandled) {
          if (currentPages.length > 1) {
            wx.navigateBack();
          } else {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }
        }
      }, 100);
    },

    onRightButtonTap() {
      wx.vibrateShort({
        type: 'light'
      });
      this.triggerEvent('rightButtonTap');
    },

    onTitleTap() {
      this.triggerEvent('titleTap');
    },

    onSearchTap() {
      wx.vibrateShort({
        type: 'light'
      });
      this.triggerEvent('searchTap');
    },

    onLeftIconTap() {
      wx.vibrateShort({
        type: 'light'
      });
      this.triggerEvent('leftIconTap');
    },

    setOpacity(opacity) {
      this.setData({
        opacity
      });
    },

    toggleShadow(show) {
      this.setData({
        showShadow: show
      });
    },

    initThemeListener() {
      const app = getApp();

      this.onThemeChange = (isDarkMode) => {
        this.setData({
          isDarkMode
        });
      };

      if (!app.globalData.themeListeners) {
        app.globalData.themeListeners = [];
      }
      app.globalData.themeListeners.push(this.onThemeChange);

      this.themeCheckInterval = setInterval(() => {
        const isDarkMode = app.globalData.isDarkMode || false;
        if (isDarkMode !== this.data.isDarkMode) {
          this.setData({
            isDarkMode
          });
        }
      }, 1000);
    },

    cleanupThemeListener() {
      if (this.themeCheckInterval) {
        clearInterval(this.themeCheckInterval);
        this.themeCheckInterval = null;
      }

      const app = getApp();
      if (app.globalData.themeListeners && this.onThemeChange) {
        const index = app.globalData.themeListeners.indexOf(this.onThemeChange);
        if (index > -1) {
          app.globalData.themeListeners.splice(index, 1);
        }
      }
    },

    updateTheme() {
      const app = getApp();
      this.setData({
        isDarkMode: app.globalData.isDarkMode || false
      });
    }
  }
});
