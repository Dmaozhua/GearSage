// components/function-nav/function-nav.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 功能列表数据
    functionList: {
      type: Array,
      value: []
    },
    // 是否显示标题
    showTitle: {
      type: Boolean,
      value: true
    },
    // 标题文字
    title: {
      type: String,
      value: '功能导航'
    },
    // 是否显示更多按钮
    showMoreButton: {
      type: Boolean,
      value: false
    },
    // 容器高度（rpx）
    containerHeight: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    defaultFunctionList: [
      {
        id: 'gear-library',
        name: '装备库',
        desc: '装备基本信息库',
        icon: '/images/icons/publis/轮.png',
        iconDark: '/images/icons/轮-夜晚.png',
        badge: 'New',
        badgeType: 'new',
        path: '/pkgGear/pages/index/index',
        disabled: false
      },
      {
        id: 'discover',
        name: '文章',
        desc: '探索历史&流行',
        icon: '/images/icons/文章.png',
        iconDark: '/images/icons/文章-夜晚.png',
        badge: '',
        badgeType: '',
        path: '/pages/discover/discover',
        disabled: false
      },
      {
        id: 'points-mall',
        name: '积分商城',
        desc: '获取积分兑好礼',
        icon: '/images/icons/商城.png',
        iconDark: '/images/icons/商城-夜晚.png',
        badge: '热',
        badgeType: 'hot',
        path: '/pkgContent/points-exchange/points-exchange',
        disabled: false
      },
      {
        id: 'more',
        name: '更多功能',
        desc: '*敬请期待*',
        icon: '/images/icons/更多.png',
        iconDark: '/images/icons/更多-夜晚.png',
        badge: '',
        badgeType: '',
        path: '',
        disabled: false
      }
    ],
    isDarkMode: false
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.initFunctionList();
      this.initThemeMode();
    },
    
    detached() {
      // 清理资源
    }
  },

  /**
   * 页面生命周期
   */
  pageLifetimes: {
    show() {
      // 页面显示时同步主题模式
      this.initThemeMode();
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 初始化功能列表
     */
    initFunctionList() {
      // 如果没有传入功能列表，使用默认数据
      if (!this.data.functionList || this.data.functionList.length === 0) {
        this.setData({
          functionList: this.data.defaultFunctionList
        });
      }
    },

    /**
     * 功能卡片点击事件
     */
    onFunctionTap(e) {
      const item = e.currentTarget.dataset.item;
      
      if (item.disabled) {
        return;
      }

      // 触发外部事件
      this.triggerEvent('functionTap', {
        item: item,
        id: item.id
      });

      // 根据功能类型执行不同操作
      this.handleFunctionAction(item);
    },

    /**
     * 更多按钮点击事件
     */
    onMoreTap() {
      this.triggerEvent('moreTap', {});
      
      // 默认跳转到功能大全页面
      wx.navigateTo({
        url: '/pages/function-list/function-list'
      }).catch(() => {
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
      });
    },

    /**
     * 处理功能操作
     */
    handleFunctionAction(item) {
      switch (item.id) {
        case 'share':
          this.handleShare();
          // 触发首页刷新事件
          this.triggerEvent('refreshHome', {
            action: 'refresh_angler_list'
          });
          break;
        case 'discover':
          // discover功能的跳转逻辑由外部页面处理，这里不执行任何操作
          break;
        case 'points-mall':
          // 统一由外部页面处理登录与跳转，这里不做操作
          break;
        case 'favorites':
          // 统一由外部页面处理登录与跳转，这里不做操作
          break;
        case 'tools':
          // 统一由外部页面处理登录与跳转，这里不做操作
          break;
        case 'community':
          // 统一由外部页面处理登录与跳转，这里不做操作
          break;
        default:
          // 统一由外部页面处理登录与跳转，这里不做操作
          break;
      }
    },

    /**
     * 处理分享功能
     */
    handleShare() {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
      
      // 触发分享事件
      this.triggerEvent('share', {
        title: '钓友说 - 专业的钓鱼交流平台',
        path: '/pages/index/index'
      });
    },

    /**
     * 页面跳转
     */
    navigateToPage(path) {
      if (!path) {
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
        return;
      }

      wx.navigateTo({
        url: path
      }).catch(() => {
        // 如果跳转失败，可能是tabBar页面
        wx.switchTab({
          url: path
        }).catch(() => {
          wx.showToast({
            title: '页面不存在',
            icon: 'none'
          });
        });
      });
    },

    /**
     * 更新功能列表
     */
    updateFunctionList(newList) {
      this.setData({
        functionList: newList
      });
    },

    /**
     * 添加功能项
     */
    addFunction(functionItem) {
      const currentList = this.data.functionList;
      currentList.push(functionItem);
      this.setData({
        functionList: currentList
      });
    },

    /**
     * 移除功能项
     */
    removeFunction(functionId) {
      const currentList = this.data.functionList.filter(item => item.id !== functionId);
      this.setData({
        functionList: currentList
      });
    },

    /**
     * 设置功能项状态
     */
    setFunctionStatus(functionId, disabled) {
      const currentList = this.data.functionList.map(item => {
        if (item.id === functionId) {
          return { ...item, disabled };
        }
        return item;
      });
      this.setData({
        functionList: currentList
      });
    },

    /**
     * 获取功能项
     */
    getFunction(functionId) {
      return this.data.functionList.find(item => item.id === functionId);
    },

    /**
     * 刷新组件
     */
    refresh() {
      this.initFunctionList();
    },

    /**
     * 初始化主题模式
     */
    initThemeMode() {
      const app = getApp();
      const isDarkMode = app.globalData.isDarkMode || false;
      this.setData({
        isDarkMode: isDarkMode
      });
    },

    /**
     * 更新主题
     */
    updateTheme() {
      this.initThemeMode();
    },

    /**
     * 外部调用：同步主题模式
     */
    syncThemeMode() {
      this.initThemeMode();
    }
  }
});