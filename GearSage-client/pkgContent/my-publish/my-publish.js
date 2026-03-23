// pages/my-publish/my-publish.js
const api = require('../../services/api.js');
const dateFormatter = require('../../utils/date-format.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 导航栏相关数据
    statusBarHeight: 0,
    navBarHeight: 0,
    
    // 当前选中的标签
    activeTab: 2, // 0: 未通过, 1: 审核中, 2: 已发布（默认选中已发布）
    
    // 帖子数据
    pendingPosts: [],      // 待审核帖子 (status: 1)
    publishedPosts: [],    // 已发布帖子 (status: 2)
    notpassedPosts: [],    // 未通过帖子 (status: 3)
    
    // 统计数据
    pendingCount: 0,
    publishedCount: 0,
    notpassedCount: 0,
    
    // 分页数据
    pendingPage: 1,
    publishedPage: 1,
    notpassedPage: 1,
    hasMore: true,
    
    // 加载状态
    loading: true,
    
    // 主题模式
    containerClass: ''
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
    
    // 加载数据
    this.loadData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 刷新数据，强制重新加载避免重复显示
    this.loadData(true);
    
    // 同步主题模式
    this.initThemeMode();
    
    // 通知自定义导航栏更新主题
    const customNavbar = this.selectComponent('#custom-navbar');
    if (customNavbar && customNavbar.updateTheme) {
      customNavbar.updateTheme();
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadData(true);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.loadMoreData();
  },

  /**
   * 初始化主题模式
   */
  initThemeMode() {
    try {
      const app = getApp();
      const isDarkMode = app.globalData.isDarkMode || false;
      this.setData({
        containerClass: isDarkMode ? 'dark-mode' : ''
      });
    } catch (error) {
      console.error('初始化主题模式失败:', error);
    }
  },

  /**
   * 加载数据
   */
  async loadData(refresh = false) {
    this.setData({ loading: true });
    
    try {
      // 根据当前选中的标签加载对应数据
      if (this.data.activeTab === 0) {
        // 加载未通过数据 (status: 3)
        await this.loadNotpassedPosts(refresh);
      } else if (this.data.activeTab === 1) {
        // 加载审核中数据 (status: 1)
        await this.loadPendingPosts(refresh);
      } else if (this.data.activeTab === 2) {
        // 加载已发布数据 (status: 2)
        await this.loadPublishedPosts(refresh);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
      if (refresh) {
        wx.stopPullDownRefresh();
      }
    }
  },

  /**
   * 加载审核中的帖子 (status: 1)
   */
  async loadPendingPosts(refresh = false) {
    try {
      const params = {
        page: refresh ? 1 : this.data.pendingPage,
        limit: 10
      };
      
      const response = await api.getUserPosts(1, params); // status: 1 待审核
      
      // API直接返回数据数组，不需要检查success字段
      if (response && Array.isArray(response)) {
        const newPosts = response;
        // 格式化时间
        const formattedPosts = newPosts.map(post => ({
          ...post,
          createTime: dateFormatter.formatTime(post.createTime)
        }));
        
        const pendingPosts = refresh ? formattedPosts : [...this.data.pendingPosts, ...formattedPosts];
        
        this.setData({
          pendingPosts,
          pendingCount: pendingPosts.length, // 使用合并后的数据总长度
          pendingPage: refresh ? 2 : this.data.pendingPage + 1,
          hasMore: newPosts.length >= 10 // 如果返回数据少于10条，说明没有更多数据了
        });
      } else {
        throw new Error('获取数据失败');
      }
    } catch (error) {
      console.error('加载审核中帖子失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  /**
   * 加载已发布的帖子 (status: 2)
   */
  async loadPublishedPosts(refresh = false) {
    try {
      const params = {
        page: refresh ? 1 : this.data.publishedPage,
        limit: 10
      };
      
      const response = await api.getUserPosts(2, params); // status: 2 已发布
      
      // API直接返回数据数组，不需要检查success字段
      if (response && Array.isArray(response)) {
        const newPosts = response;
        // 格式化时间
        const formattedPosts = newPosts.map(post => ({
          ...post,
          createTime: dateFormatter.formatTime(post.createTime)
        }));
        
        const publishedPosts = refresh ? formattedPosts : [...this.data.publishedPosts, ...formattedPosts];
        
        this.setData({
          publishedPosts,
          publishedCount: publishedPosts.length, // 使用合并后的数据总长度
          publishedPage: refresh ? 2 : this.data.publishedPage + 1,
          hasMore: newPosts.length >= 10 // 如果返回数据少于10条，说明没有更多数据了
        });
      } else {
        throw new Error('获取数据失败');
      }
    } catch (error) {
      console.error('加载已发布帖子失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  /**
   * 加载未通过的帖子 (status: 3)
   */
  async loadNotpassedPosts(refresh = false) {
    try {
      const params = {
        page: refresh ? 1 : this.data.notpassedPage,
        limit: 10
      };
      
      const response = await api.getUserPosts(4, params); // status: 4 审核驳回
      
      // API直接返回数据数组，不需要检查success字段
      if (response && Array.isArray(response)) {
        const newPosts = response;
        // 格式化时间
        const formattedPosts = newPosts.map(post => ({
          ...post,
          createTime: dateFormatter.formatTime(post.createTime)
        }));
        
        const notpassedPosts = refresh ? formattedPosts : [...this.data.notpassedPosts, ...formattedPosts];
        
        this.setData({
          notpassedPosts,
          notpassedCount: notpassedPosts.length, // 使用合并后的数据总长度
          notpassedPage: refresh ? 2 : this.data.notpassedPage + 1,
          hasMore: newPosts.length >= 10 // 如果返回数据少于10条，说明没有更多数据了
        });
      } else {
        throw new Error('获取数据失败');
      }
    } catch (error) {
      console.error('加载未通过帖子失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  /**
   * 加载更多数据
   */
  async loadMoreData() {
    if (!this.data.hasMore) return;
    
    try {
      if (this.data.activeTab === 0) {
        // 加载更多未通过的帖子
        await this.loadNotpassedPosts();
      } else if (this.data.activeTab === 1) {
        // 加载更多审核中的帖子
        await this.loadPendingPosts();
      } else if (this.data.activeTab === 2) {
        // 加载更多已发布的帖子
        await this.loadPublishedPosts();
      }
    } catch (error) {
      console.error('加载更多数据失败:', error);
    }
  },

  /**
   * 标签切换
   */
  onTabChange(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    this.setData({ activeTab: tab });
    
    // 切换页签时加载对应数据
    this.loadData(true); // refresh = true，重新加载数据
  },

  /**
   * 点击帖子
   */
  onPostTap(e) {
    const post = e.currentTarget.dataset.post;
    console.log('查看帖子详情:', post);
    
    // 跳转到帖子详情页
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${post.id}`
    });
  },

  /**
   * 编辑帖子
   */
  onEditPost(e) {
    e.stopPropagation();
    const post = e.currentTarget.dataset.post;
    console.log('编辑帖子:', post);
    
    wx.navigateTo({
      url: `/pages/edit-post/edit-post?id=${post.id}`
    });
  },

  /**
   * 删除帖子
   */
  onDeletePost(e) {
    e.stopPropagation();
    const post = e.currentTarget.dataset.post;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这篇帖子吗？删除后无法恢复。',
      confirmText: '删除',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          this.deletePost(post);
        }
      }
    });
  },

  /**
   * 执行删除帖子
   */
  async deletePost(post) {
    try {
      wx.showLoading({ title: '删除中...' });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 从列表中移除
      if (post.status === 'pending') {
        const pendingPosts = this.data.pendingPosts.filter(p => p.id !== post.id);
        this.setData({
          pendingPosts,
          pendingCount: pendingPosts.length
        });
      } else {
        const publishedPosts = this.data.publishedPosts.filter(p => p.id !== post.id);
        this.setData({
          publishedPosts,
          publishedCount: publishedPosts.length
        });
      }
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('删除帖子失败:', error);
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
});