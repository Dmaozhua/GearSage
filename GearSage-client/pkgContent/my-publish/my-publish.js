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
    activeTab: 2, // 0: 草稿, 1: 待审核, 2: 已发布
    
    // 帖子数据
    draftPosts: [],        // 草稿帖子 (status: 0)
    pendingPosts: [],      // 待审核帖子 (status: 1)
    publishedPosts: [],    // 已发布帖子 (status: 2)
    
    // 统计数据
    draftCount: 0,
    pendingCount: 0,
    publishedCount: 0,
    
    // 分页数据
    draftPage: 1,
    pendingPage: 1,
    publishedPage: 1,
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
        await this.loadDraftPosts(refresh);
      } else if (this.data.activeTab === 1) {
        await this.loadPendingPosts(refresh);
      } else if (this.data.activeTab === 2) {
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
   * 加载待审核帖子 (status: 1)
   */
  async loadPendingPosts(refresh = false) {
    try {
      const params = {
        page: refresh ? 1 : this.data.pendingPage,
        limit: 10
      };

      const response = await api.getUserPosts(1, params);

      if (response && Array.isArray(response)) {
        const newPosts = response;
        const formattedPosts = this.formatPosts(newPosts);
        const pendingPosts = refresh ? formattedPosts : [...this.data.pendingPosts, ...formattedPosts];

        this.setData({
          pendingPosts,
          pendingCount: pendingPosts.length,
          pendingPage: refresh ? 2 : this.data.pendingPage + 1,
          hasMore: newPosts.length >= 10
        });
      } else {
        throw new Error('获取数据失败');
      }
    } catch (error) {
      console.error('加载待审核帖子失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  /**
   * 加载草稿帖子 (status: 0)
   */
  async loadDraftPosts(refresh = false) {
    try {
      const params = {
        page: refresh ? 1 : this.data.draftPage,
        limit: 10
      };
      
      const response = await api.getUserPosts(0, params);
      
      if (response && Array.isArray(response)) {
        const newPosts = response;
        const formattedPosts = this.formatPosts(newPosts);
        
        const draftPosts = refresh ? formattedPosts : [...this.data.draftPosts, ...formattedPosts];
        
        this.setData({
          draftPosts,
          draftCount: draftPosts.length,
          draftPage: refresh ? 2 : this.data.draftPage + 1,
          hasMore: newPosts.length >= 10
        });
      } else {
        throw new Error('获取数据失败');
      }
    } catch (error) {
      console.error('加载草稿帖子失败:', error);
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
      
      if (response && Array.isArray(response)) {
        const newPosts = response;
        const formattedPosts = this.formatPosts(newPosts);
        
        const publishedPosts = refresh ? formattedPosts : [...this.data.publishedPosts, ...formattedPosts];
        
        this.setData({
          publishedPosts,          
          publishedCount: publishedPosts.length,
          publishedPage: refresh ? 2 : this.data.publishedPage + 1,
          hasMore: newPosts.length >= 10
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

  formatPosts(posts = []) {
    return posts.map(post => ({
      ...post,
      createTime: dateFormatter.formatTime(post.createTime),
      publishTime: post.publishTime ? dateFormatter.formatTime(post.publishTime) : '',
      likeCount: Number(post.likeCount || post.likesCount || 0),
      commentCount: Number(post.commentCount || post.commentsCount || 0),
      viewCount: Number(post.viewCount || post.viewsCount || 0)
    }));
  },

  /**
   * 加载更多数据
   */
  async loadMoreData() {
    if (!this.data.hasMore) return;
    
    try {
      if (this.data.activeTab === 0) {
        await this.loadDraftPosts();
      } else if (this.data.activeTab === 1) {
        await this.loadPendingPosts();
      } else if (this.data.activeTab === 2) {
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
    if (Number(post.status) === 0) {
      wx.navigateTo({
        url: '/pkgContent/publish/publish'
      });
      return;
    }

    wx.navigateTo({
      url: `/pkgContent/detail/detail?id=${post.id}`
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

      await api.deleteTopic(post.id);

      if (Number(post.status) === 0) {
        const draftPosts = this.data.draftPosts.filter(p => p.id !== post.id);
        this.setData({
          draftPosts,
          draftCount: draftPosts.length
        });
      } else if (Number(post.status) === 1) {
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
