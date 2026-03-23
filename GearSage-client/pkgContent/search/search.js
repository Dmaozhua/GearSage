// pages/search/search.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 导航栏相关数据
    statusBarHeight: 0,
    navBarHeight: 0,
    // 搜索相关
    searchValue: '',
    searchHistory: ['路亚轮', 'DAIWA', '钓鱼竿', '鱼饵'],
    searchResults: [],
    loading: false,
    showResults: false,
    containerClass: '' // 夜间模式容器类名
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取导航栏高度信息
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    })
    
    // 初始化主题模式
    this.initThemeMode();
    
    // 如果有传入的搜索关键词，直接搜索
    if (options.keyword) {
      this.setData({
        searchValue: decodeURIComponent(options.keyword)
      })
      this.performSearch(this.data.searchValue)
    }
  },

  /**
   * 搜索输入事件
   */
  onSearchInput(e) {
    this.setData({
      searchValue: e.detail.value
    })
  },

  /**
   * 搜索确认事件
   */
  onSearchConfirm() {
    if (this.data.searchValue.trim()) {
      this.performSearch(this.data.searchValue.trim())
    }
  },

  /**
   * 清空搜索
   */
  onClearSearch() {
    this.setData({
      searchValue: '',
      showResults: false,
      searchResults: []
    })
  },

  /**
   * 点击搜索历史
   */
  onHistoryTap(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({
      searchValue: keyword
    })
    this.performSearch(keyword)
  },

  /**
   * 执行搜索
   */
  async performSearch(keyword) {
    this.setData({ loading: true })
    
    try {
      // 调用真实搜索API
      const api = require('../../services/api.js');
      const response = await api.get('/mini/search', {
        keyword: keyword,
        page: 1,
        pageSize: 20
      });
      
      const results = response && response.list ? response.list : [];
      
      this.setData({
        searchResults: results,
        showResults: true,
        loading: false
      })
      
      // 添加到搜索历史
      this.addToHistory(keyword)
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({
        searchResults: [],
        showResults: true,
        loading: false
      })
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      })
    }
  },

  /**
   * 添加到搜索历史
   */
  addToHistory(keyword) {
    let history = this.data.searchHistory
    // 移除重复项
    history = history.filter(item => item !== keyword)
    // 添加到开头
    history.unshift(keyword)
    // 限制历史记录数量
    if (history.length > 10) {
      history = history.slice(0, 10)
    }
    
    this.setData({
      searchHistory: history
    })
  },

  /**
   * 点击搜索结果
   */
  onResultTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pkgContent/detail/detail?id=${id}`
    })
  },

  /**
   * 清空搜索历史
   */
  onClearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            searchHistory: []
          })
        }
      }
    })
  },

  /**
   * 初始化主题模式
   */
  initThemeMode: function() {
    const app = getApp();
    const isDarkMode = app.globalData.isDarkMode || false;
    console.log('Search页面主题模式:', isDarkMode ? '夜间模式' : '白天模式');
    this.setData({
      containerClass: isDarkMode ? 'dark' : ''
    });
    console.log('Search页面containerClass设置为:', this.data.containerClass);
  },

  /**
   * 页面显示时同步主题模式
   */
  onShow: function() {
    this.initThemeMode();
    
    // 通知自定义导航栏更新主题
    const customNavbar = this.selectComponent('#custom-navbar');
    if (customNavbar && customNavbar.updateTheme) {
      customNavbar.updateTheme();
    }
  }
})