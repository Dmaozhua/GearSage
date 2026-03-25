// app.js
const tempUrlManager = require('./utils/tempUrlManager.js');
const api = require('./services/api.js');

App({
  onLaunch: function () {
    // 小程序启动时执行的逻辑
    console.log('小程序启动了')

    // 初始化全局错误提示节流标记
    this._lastGlobalErrorToast = 0

    console.log('[App] 当前版本已切换为独立后台，不再初始化 wx.cloud');
    this.syncApiServerTarget()
    
    // 获取设备信息，计算自定义导航栏高度
    this.initNavBarInfo()
    
    // 初始化主题模式
    this.initThemeMode()
    
    // 初始化图片上传工具配置
    this.initImageUploadConfig()
    
    // 检查登录状态
    this.checkLoginSession()
    
    // 初始化临时链接管理器
    this.initTempUrlManager()
  },

  onShow: function() {
    // 小程序从后台进入前台时也检查登录状态
    this.checkLoginSession();
    
    // 恢复定时刷新
    this.resumeTempUrlRefresh();
  },
  
  onHide: function() {
    // 小程序进入后台时暂停定时刷新
    this.pauseTempUrlRefresh();
  },

  onError(error) {
    console.error('[App] 捕获到全局错误:', error);
    this.reportGlobalError('onError', error);
    this.notifyGlobalError();
  },

  onUnhandledRejection(res) {
    console.error('[App] 捕获到未处理的Promise拒绝:', res);
    this.reportGlobalError('onUnhandledRejection', res);
    this.notifyGlobalError();
  },
  
  /**
   * 检查登录会话状态
   */
  checkLoginSession() {
    try {
      const token = wx.getStorageSync('token');
      
      // 如果没有token，说明用户未登录，无需检查session
      if (!token) {
        console.log('[App] 用户未登录，跳过session检查');
        return;
      }
      
      
      console.log('[App] 开始检查登录会话状态...');
      this.globalData.lastSessionCheckTime = Date.now();

      console.log('[App] 独立后台模式下跳过 wx.checkSession，由 access token / refresh token 接管会话');
    } catch (error) {
      console.error('[App] 检查登录会话状态失败:', error);
    }
  },

  reportGlobalError(type, error) {
    try {
      if (typeof wx !== 'undefined' && typeof wx.getRealtimeLogManager === 'function') {
        const logManager = wx.getRealtimeLogManager();
        if (logManager && typeof logManager.error === 'function') {
          const payload = this.formatGlobalErrorPayload(error);
          logManager.error(`[${type}]`, payload);
        }
      }
    } catch (logError) {
      console.error('[App] 上报全局错误失败:', logError);
    }
  },

  formatGlobalErrorPayload(error) {
    if (error && error.stack) {
      return `${error.message || error.toString()}\n${error.stack}`;
    }
    if (typeof error === 'object') {
      try {
        return JSON.stringify(error);
      } catch (stringifyError) {
        return String(error);
      }
    }
    return String(error);
  },

  notifyGlobalError() {
    if (typeof wx === 'undefined' || typeof wx.showToast !== 'function') {
      return;
    }
    const now = Date.now();
    if (this._lastGlobalErrorToast && now - this._lastGlobalErrorToast < 3000) {
      return;
    }
    this._lastGlobalErrorToast = now;
    wx.showToast({
      title: '系统异常，请稍后再试',
      icon: 'none',
      duration: 3000
    });
  },

  syncApiServerTarget() {
    try {
      const currentTarget = api.getCurrentServerTarget();
      this.globalData.apiServerTarget = currentTarget.key;
      this.globalData.apiServerBaseUrl = currentTarget.baseUrl;
      this.globalData.apiServerLabel = currentTarget.label;
      console.log('[App] 当前接口服务器目标:', currentTarget);
      return currentTarget;
    } catch (error) {
      console.error('[App] 同步接口服务器目标失败:', error);
      return null;
    }
  },

  setApiServerTarget(targetKey, options = {}) {
    const result = api.setCurrentServerTarget(targetKey, options);
    this.syncApiServerTarget();
    return result;
  },

  toggleApiServerTarget(options = {}) {
    const result = api.toggleServerTarget(options);
    this.syncApiServerTarget();
    return result;
  },

  /**
   * 跳转到个人中心并显示登录提示
   */
  navigateToProfileWithLoginPrompt() {
    console.log('[App] 开始跳转到profile页面');
    
    // 显示用户友好的提示信息
    wx.showToast({
      title: '登录会话已过期',
      icon: 'none',
      duration: 2000
    });
    
    // 延迟跳转，确保toast显示完成
    setTimeout(() => {
      // 首先尝试switchTab
      wx.switchTab({
        url: '/pages/profile/profile',
        success: () => {
          console.log('[App] switchTab跳转到profile页面成功');
        },
        fail: (err) => {
          console.error('[App] switchTab跳转到profile页面失败:', err);
          
          // 如果switchTab失败，尝试使用reLaunch
          wx.reLaunch({
            url: '/pages/profile/profile',
            success: () => {
              console.log('[App] reLaunch跳转到profile页面成功');
            },
            fail: (reLaunchErr) => {
              console.error('[App] reLaunch跳转到profile页面也失败:', reLaunchErr);
              
              // 如果所有跳转方式都失败，显示手动跳转提示
              wx.showModal({
                title: '会话过期',
                content: '请手动切换到"我的"页面重新登录',
                showCancel: false,
                confirmText: '知道了'
              });
            }
          });
        }
      });
    }, 500);
  },

  /**
   * 初始化主题模式
   */
  initThemeMode() {
    try {
      const isDarkMode = wx.getStorageSync('isDarkMode') || false;
      this.globalData.isDarkMode = isDarkMode;
      this.setTabBarTheme(isDarkMode);
      console.log('主题模式初始化完成:', isDarkMode ? '夜间模式' : '白天模式');
    } catch (error) {
      console.error('初始化主题模式失败:', error);
      this.globalData.isDarkMode = false;
    }
  },

  /**
   * 设置TabBar主题
   */
  setTabBarTheme(isDarkMode) {
    try {
      if (isDarkMode) {
        // 夜间模式TabBar样式
        wx.setTabBarStyle({
          color: '#888888',
          selectedColor: '#4a9eff',
          backgroundColor: '#1e1e1e',
          borderStyle: 'white'
        });
      } else {
        // 白天模式TabBar样式
        wx.setTabBarStyle({
          color: '#7A7E83',
          selectedColor: '#3cc51f',
          backgroundColor: '#ffffff',
          borderStyle: 'black'
        });
      }
    } catch (error) {
      console.error('设置TabBar主题失败:', error);
    }
  },

  /**
   * 切换主题模式
   */
  toggleThemeMode() {
    try {
      console.log('开始切换主题模式 - 当前模式:', this.globalData.isDarkMode);
      const newDarkMode = !this.globalData.isDarkMode;
      console.log('新的主题模式:', newDarkMode);
      
      this.globalData.isDarkMode = newDarkMode;
      console.log('globalData.isDarkMode已更新为:', this.globalData.isDarkMode);
      
      wx.setStorageSync('isDarkMode', newDarkMode);
      console.log('主题模式已保存到本地存储');
      
      this.setTabBarTheme(newDarkMode);
      console.log('TabBar主题已更新');
      
      // 通知所有主题监听器
      this.notifyThemeListeners(newDarkMode);
      
      console.log('主题模式切换完成:', newDarkMode ? '夜间模式' : '白天模式');
      return newDarkMode;
    } catch (error) {
      console.error('切换主题模式失败:', error);
      return this.globalData.isDarkMode;
    }
  },

  /**
   * 通知所有主题监听器
   */
  notifyThemeListeners(isDarkMode) {
    try {
      if (this.globalData.themeListeners && this.globalData.themeListeners.length > 0) {
        console.log('通知主题监听器数量:', this.globalData.themeListeners.length);
        this.globalData.themeListeners.forEach((listener, index) => {
          try {
            if (typeof listener === 'function') {
              listener(isDarkMode);
            }
          } catch (error) {
            console.error(`主题监听器 ${index} 执行失败:`, error);
          }
        });
      } else {
        console.log('没有注册的主题监听器');
      }
    } catch (error) {
      console.error('通知主题监听器失败:', error);
    }
  },

  /**
   * 初始化导航栏信息
   */
  initNavBarInfo() {
    try {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync()
      // 获取胶囊按钮位置信息
      const menuButton = wx.getMenuButtonBoundingClientRect()
      
      // 状态栏高度
      const statusBarHeight = systemInfo.statusBarHeight || 0
      
      // 导航栏高度 = 胶囊按钮高度 + (胶囊按钮top - 状态栏高度) * 2
      const navBarHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2
      
      // 胶囊按钮信息
      const menuButtonInfo = {
        width: menuButton.width,
        height: menuButton.height,
        top: menuButton.top,
        right: menuButton.right,
        bottom: menuButton.bottom,
        left: menuButton.left
      }
      
      // 保存到全局数据
      this.globalData.statusBarHeight = statusBarHeight
      this.globalData.navBarHeight = navBarHeight
      this.globalData.menuButtonInfo = menuButtonInfo
      this.globalData.systemInfo = systemInfo
      
      console.log('导航栏信息初始化完成:', {
        statusBarHeight,
        navBarHeight,
        menuButtonInfo
      })
    } catch (error) {
      console.error('获取设备信息失败:', error)
      // 设置默认值
      this.globalData.statusBarHeight = 20
      this.globalData.navBarHeight = 44
      this.globalData.menuButtonInfo = {}
    }
  },
  
  /**
   * 初始化临时链接管理器
   */
  initTempUrlManager() {
    try {
      console.log('[App] 初始化临时链接管理器');
      
      // 启动时清理过期缓存
      tempUrlManager.cleanExpiredCache();
      
      // 设置定时刷新（每30分钟）
      this.startTempUrlRefresh();
      
      console.log('[App] 临时链接管理器初始化完成');
    } catch (error) {
      console.error('[App] 临时链接管理器初始化失败:', error);
    }
  },

  /**
   * 开始定时刷新临时链接
   */
  startTempUrlRefresh() {
    // 清除可能存在的旧定时器
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // 每30分钟静默刷新一次链接
    this.refreshTimer = setInterval(() => {
      console.log('[App] 执行定时刷新临时链接');
      tempUrlManager.silentRefreshAll().catch(error => {
        console.error('[App] 定时刷新临时链接失败:', error);
      });
    }, 30 * 60 * 1000); // 30分钟
    
    console.log('[App] 定时刷新已启动（30分钟间隔）');
  },

  /**
   * 暂停定时刷新
   */
  pauseTempUrlRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('[App] 定时刷新已暂停');
    }
  },

  /**
   * 恢复定时刷新
   */
  resumeTempUrlRefresh() {
    if (!this.refreshTimer) {
      this.startTempUrlRefresh();
      console.log('[App] 定时刷新已恢复');
    }
  },

  /**
   * 初始化图片上传工具配置
   */
  initImageUploadConfig() {
    try {
      // 设置默认的图片上传配置
      this.globalData.imageUploadConfig = {
        maxConcurrent: 3,  // 最大并发上传数
        compressionQuality: 75,  // 默认压缩质量
        maxWidth: 1200,  // 默认最大宽度
        maxHeight: 1200,  // 默认最大高度
        enableWebP: true,  // 是否启用WebP转换
        chunkSize: 4 * 1024 * 1024,  // 分片大小，4MB
        chunkConcurrent: 2  // 分片并发数
      }
      console.log('图片上传工具配置初始化完成');
    } catch (error) {
      console.error('初始化图片上传工具配置失败:', error);
    }
  },
  
  globalData: {
    // 全局数据
    userInfo: null,
    // 主题模式
    isDarkMode: false,
    // 草稿状态
    hasDraft: false,
    // 显示登录提示标志
    showLoginPrompt: false,
    // 上次session检查时间
    lastSessionCheckTime: 0,
    // 主题监听器列表
    themeListeners: [],
    // 导航栏相关信息
    statusBarHeight: 0,
    navBarHeight: 0,
    menuButtonInfo: {},
    systemInfo: {},
    // 图片上传配置
    imageUploadConfig: {},
    // 当前接口服务器目标
    apiServerTarget: '',
    apiServerBaseUrl: '',
    apiServerLabel: ''
  }
})
