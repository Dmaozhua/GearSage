// pages/profile/profile.js
const api = require('../../services/api.js');
const auth = require('../../services/auth.js');
const permission = require('../../utils/permission.js');
const dateFormatter = require('../../utils/date-format.js');
const tempUrlManager = require('../../utils/tempUrlManager.js');
const tagProfileView = require('../../utils/tagProfileView.js');

function normalizeProfileUserInfo(rawUser = {}) {
  const user = rawUser && typeof rawUser === 'object' ? rawUser : {};
  const avatar = user.avatarUrl || user.avatar || '';
  const background = user.backgroundImage || user.background || '';

  return {
    ...user,
    nickName: user.nickName || user.nickname || '',
    nickname: user.nickname || user.nickName || '',
    avatar,
    avatarUrl: user.avatarUrl || avatar,
    background,
    backgroundImage: background,
    backgroundImageUrl: user.backgroundImageUrl || background
  };
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 导航栏相关
    statusBarHeight: 0,
    navHeight: 44,
    navOpacity: 0,
    navRgb: '189, 195, 199',
    navShadow: 'none',
    navPointerEvents: 'none',
    titleOpacity: 0,
    // 用户信息
    userInfo: null,
    isLoggedIn: false,
    isAdmin: false,
    isSelf: true, // 是否查看自己的资料
    
    // 主题模式
    isDarkMode: false,
    
    // 统计数据
    stats: {
      postsCount: 0,
      likesCount: 0,
      commentsCount: 0,
      followersCount: 0
    },
    
    // 我的帖子
    myPosts: [],
    postsLoading: false,
    postsPage: 1,
    postsHasMore: true,
    
    // 当前选中的标签
    activeTab: 'posts', // posts, likes, comments
    
    messageUnreadCount: 0,
    tagDisplayStrategy: tagProfileView.DISPLAY_STRATEGY.SMART,
    tagStrategyDescription: '',
    tagGroupTabs: [],
    visibleTagGroups: [],
    previewByPostType: [],
    activeTagGroup: 'all',
    ownedTags: [],
    

    
    // 加载状态
    loading: true,
    
    // svg-loading组件相关
    isLoading: false,
    loadingText: '加载中...',
    showNetworkLoading: false,
    networkLoadingText: '网络请求中...',
    
    // Loading组件测试相关
    showLoadingTest: false,
    isTestLoading: false,
    testLoadingText: '测试加载中...',
    loadingSize: 'default',
    showLoadingText: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取导航栏高度信息
    const app = getApp()
    let statusBarHeight = app.globalData.statusBarHeight
    let navHeight = app.globalData.navBarHeight
    // 兜底：statusBarHeight
    if (!statusBarHeight || statusBarHeight <= 0) {
      try {
        const sys = wx.getSystemInfoSync();
        statusBarHeight = sys.statusBarHeight || 20;
      } catch (e) {
        statusBarHeight = 20;
      }
    }
    // 兜底：如果全局没有拿到，自行估算
    if (!navHeight || navHeight <= 0) {
      try {
        const sys = wx.getSystemInfoSync();
        const menu = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect();
        if (menu && sys && sys.statusBarHeight != null) {
          navHeight = menu.height + (menu.top - sys.statusBarHeight) * 2;
        } else {
          navHeight = 44; // 兜底
        }
      } catch (e) {
        navHeight = 44;
      }
    }
    this.setData({
      statusBarHeight: statusBarHeight,
      navHeight: navHeight,
      navPointerEvents: 'none'
    })
    
    // 初始化主题模式
    this.initThemeMode();
    this._skipNextShowRefresh = true;
    
    this.checkLoginStatus();
    
    // 监听页面滚动
    this.setupScrollListener();
    
    // 获取用户信息区域高度（用于计算滚动阈值）
    wx.nextTick(() => {
      const query = wx.createSelectorQuery();
      query.select('.background-image').boundingClientRect();
      query.exec((res) => {
        if (res && res[0]) {
          this.bannerHeightPx = res[0].height; // 像素值
        } else {
          this.bannerHeightPx = 300; // 兜底值（与说明一致）
        }
      });
    });
    
    // rAF 节流标记
    this.ticking = false;
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查是否需要显示登录提示
    const app = getApp();
    if (app.globalData.showLoginPrompt) {
      this.showLoginPrompt();
      // 重置标志
      app.globalData.showLoginPrompt = false;
    }
    
    if (this._skipNextShowRefresh) {
      console.log('[Profile] 页面显示 - 跳过首次 onShow 重复刷新');
      this._skipNextShowRefresh = false;
    } else {
      // 重新检查登录状态，处理可能的认证失效情况
      this.checkLoginStatus();
    }
    
    // 同步主题模式
    this.initThemeMode();
    
    // 通知自定义导航栏更新主题
    const customNavbar = this.selectComponent('#custom-navbar');
    if (customNavbar && customNavbar.updateTheme) {
      customNavbar.updateTheme();
    }
  },

  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    try {
      console.log('[Profile] 开始检查登录状态...');
      
      // 显示页面加载状态
      this.setData({
        isLoading: true,
        loadingText: '加载用户信息...'
      });
      
      const isLoggedIn = auth.checkLoginStatus();
      const isAdmin = permission.isAdmin();
      
      if (isLoggedIn) {
        // 优先从本地缓存读取，再静默刷新一次服务端用户资料
        let userInfo = normalizeProfileUserInfo(wx.getStorageSync('userInfo') || auth.getCurrentUser());
        console.log('[Profile] 获取到的用户信息:', userInfo);

        try {
          await auth.refreshUserInfo();
          userInfo = normalizeProfileUserInfo(auth.getCurrentUser() || wx.getStorageSync('userInfo') || userInfo);
        } catch (refreshError) {
          console.warn('[Profile] 静默刷新用户资料失败，继续使用本地缓存:', refreshError);
        }

        wx.setStorageSync('userInfo', userInfo);
        
        // 设置用户信息
        this.setData({
          isLoggedIn,
          isAdmin,
          userInfo,
          loading: false,
          isLoading: false
        });
        
        // 使用TempUrlManager获取头像和背景图的临时访问URL
        if (userInfo) {
          this.refreshUserImages(userInfo);
        }
        
        console.log('[Profile] 页面状态已更新，用户已登录');
        this.loadMessageUnreadCount();
        this.loadUserData({ skipUserRefresh: true });
      } else {
        console.log('[Profile] 用户未登录');
        this.setData({
          isLoggedIn: false,
          messageUnreadCount: 0,
          loading: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('[Profile] 检查登录状态失败:', error);
      this.setData({
        loading: false,
        isLoading: false
      });
    }
  },
  
  /**
   * 刷新用户图片（头像和背景图）
   */
  async refreshUserImages(userInfo) {
    try {
      console.log('[Profile] 开始刷新用户图片');
      
      const imagePromises = [];
      const normalizedUserInfo = normalizeProfileUserInfo(userInfo);
      const avatarSource = normalizedUserInfo.avatar || '';
      const backgroundSource = normalizedUserInfo.backgroundImage || normalizedUserInfo.background || '';
      
      // 处理头像
      if (avatarSource) {
        imagePromises.push(
          tempUrlManager.getTempUrl(avatarSource, 'avatar').then(avatarUrl => {
            console.log('[Profile] 头像临时URL获取成功');
            this.setData({
              'userInfo.avatar': avatarSource,
              'userInfo.avatarUrl': avatarUrl
            });
          })
        );
      }
      
      // 处理背景图
      if (backgroundSource) {
        imagePromises.push(
          tempUrlManager.getTempUrl(backgroundSource, 'background').then(backgroundUrl => {
            console.log('[Profile] 背景图临时URL获取成功');
            this.setData({
              'userInfo.background': backgroundSource,
              'userInfo.backgroundImage': backgroundSource,
              'userInfo.backgroundImageUrl': backgroundUrl
            });
          })
        );
      }
      
      // 并行处理所有图片
      await Promise.all(imagePromises);
      console.log('[Profile] 用户图片刷新完成');
    } catch (error) {
      console.error('[Profile] 刷新用户图片失败:', error);
    }
  },

  /**
   * 处理图片加载错误
   */
  async handleImageError(e) {
    try {
      const type = e.currentTarget.dataset.type;
      console.log(`[Profile] ${type}图片加载失败，尝试重新获取链接`);
      
      const userInfo = this.data.userInfo;
      if (!userInfo) return;
      
      let fileID = null;
      if (type === 'background') {
        fileID = userInfo.backgroundImage || userInfo.background;
      } else if (type === 'avatar') {
        fileID = userInfo.avatar || userInfo.avatarUrl;
      }
      
      if (fileID) {
        // 强制刷新临时链接 / 本地缓存文件
        const newUrl = await tempUrlManager.getTempUrl(fileID, type, true);
        
        if (type === 'background') {
          this.setData({ 'userInfo.backgroundImageUrl': newUrl });
        } else if (type === 'avatar') {
          this.setData({ 'userInfo.avatarUrl': newUrl });
        }
        
        console.log(`[Profile] ${type}图片链接已重新获取`);
      }
    } catch (error) {
      console.error('[Profile] 处理图片错误失败:', error);
    }
  },

  /**
   * 加载用户数据
   */
  async loadUserData(options = {}) {
    try {
      const { skipUserRefresh = false } = options;
      if (!skipUserRefresh) {
        await auth.refreshUserInfo();
      }
      const refreshedUserInfo = normalizeProfileUserInfo(auth.getCurrentUser() || wx.getStorageSync('userInfo'));
      if (refreshedUserInfo && refreshedUserInfo.id) {
        wx.setStorageSync('userInfo', refreshedUserInfo);
        this.setData({ userInfo: refreshedUserInfo });
        await this.refreshUserImages(refreshedUserInfo);
      }
      await this.loadUserTags();
    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
  },

  /**
   * 加载用户标签
   */
  async loadUserTags() {
    try {
      console.log('[Profile] 开始加载用户标签...');
      // 使用静默请求，避免显示Loading动画和超时提示
      const tagState = await api.getTagDisplaySettings({ silent: true });
      console.log('[Profile] 获取到的用户标签设置:', tagState);

      const currentUserInfo = normalizeProfileUserInfo(this.data.userInfo || {});
      const currentTag = tagState && (tagState.mainTag || tagState.equippedTag) ? (tagState.mainTag || tagState.equippedTag) : null;
      const displayStrategy = tagProfileView.normalizePostTagMode(
        tagState && (tagState.postTagMode || tagState.displayStrategy),
        tagProfileView.POST_TAG_MODE.SMART
      );
      const customPostTags = tagProfileView.normalizeCustomPostTags(
        (tagState && tagState.customPostTags) || (tagState && tagState.settings && tagState.settings.customPostTags) || {}
      );
      const ownedTags = tagProfileView.normalizeWardrobeTags(tagState && tagState.ownedTags ? tagState.ownedTags : [], {
        mainTagId: tagState && tagState.mainTagId ? tagState.mainTagId : null
      });
      const updatedUserInfo = {
        ...currentUserInfo,
        equippedDisplayTag: currentTag || {},
        userTag: currentTag ? currentTag.name : '',
        userTagRarity: currentTag ? currentTag.rarityLevel : 1,
        tagDisplayStrategy: displayStrategy
      };

      this.setData({
        userInfo: updatedUserInfo,
        ownedTags,
        tagDisplayStrategy: displayStrategy,
        tagStrategyDescription: tagProfileView.getStrategyDescription(displayStrategy),
        tagGroupTabs: tagProfileView.buildTagGroupTabs(ownedTags),
        visibleTagGroups: tagProfileView.buildVisibleTagGroups(ownedTags, this.data.activeTagGroup),
        previewByPostType: tagState && Array.isArray(tagState.previewByPostType) && tagState.previewByPostType.length
          ? tagState.previewByPostType
          : tagProfileView.buildPreviewByPostType(ownedTags, {
            mainTagId: tagState && tagState.mainTagId ? tagState.mainTagId : null,
            postTagMode: displayStrategy,
            customPostTags
          })
      });

      wx.setStorageSync('userInfo', updatedUserInfo);
    } catch (error) {
      console.error('[Profile] 加载用户标签失败:', error);
      // 如果接口调用失败，保持原有的默认标签
    }
  },

  onTagGroupChange(e) {
    const activeTagGroup = e.currentTarget.dataset.group || 'all';
    this.setData({
      activeTagGroup,
      visibleTagGroups: tagProfileView.buildVisibleTagGroups(this.data.ownedTags || [], activeTagGroup)
    });
  },

  /**
   * 显示登录提示
   */
  showLoginPrompt() {
    wx.showModal({
      title: '登录提示',
      content: '您的登录已过期，请重新授权登录',
      showCancel: false,
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          // 触发登录流程
          this.onLogin();
        }
      }
    });
  },

  /**
   * 微信登录
   */
  async onLogin() {
    try {
      // 显示网络请求loading
      this.setData({
        showNetworkLoading: true,
        networkLoadingText: '登录中...'
      });
      
      // 调用真实的AuthService登录
      const loginResult = await auth.login();
      console.log('[Profile] 登录结果:', loginResult);
      
      // 检查登录是否成功：如果返回了token和userInfo，则认为登录成功
      if (loginResult && loginResult.token && loginResult.userInfo) {
        // 登录成功，优先从本地存储获取最新的用户信息
        let userInfo = normalizeProfileUserInfo(auth.getCurrentUser());
        const isAdmin = permission.isAdmin();

        wx.setStorageSync('userInfo', userInfo);
        
        console.log('[Profile] 使用的用户信息:', userInfo);
        
        // 更新页面状态
        this.setData({
          isLoggedIn: true,
          isAdmin,
          userInfo,
          loading: false,
          showNetworkLoading: false
        });
        
        // 使用TempUrlManager刷新用户图片
        if (userInfo) {
          this.refreshUserImages(userInfo);
        }

        // 加载用户数据
        this.loadUserData({ skipUserRefresh: true });
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      } else {
        console.error('[Profile] 登录失败，返回数据格式不正确:', loginResult);
        throw new Error('登录失败，请重试');
      }
    } catch (error) {
      console.error('[Profile] 登录失败:', error);
      // 隐藏网络请求loading
      this.setData({
        showNetworkLoading: false
      });
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    }
  },

  /**
   * 编辑个人信息
   */
  onEditProfile() {
    console.log('编辑个人信息');
    wx.navigateTo({
      url: '/pkgContent/edit-profile/edit-profile'
    });
  },

  onMyTags() {
    wx.navigateTo({
      url: '/pkgContent/my-tags/my-tags'
    });
  },

  onInviteFriends() {
    wx.navigateTo({
      url: '/pages/invite/index'
    });
  },

  onMessageCenter() {
    wx.navigateTo({
      url: '/pkgContent/message-center/message-center'
    });
  },

  /**
   * 我的发布
   */
  onMyPublish() {
    console.log('我的发布');
    wx.navigateTo({
      url: '/pkgContent/my-publish/my-publish'
    });
  },

  async loadMessageUnreadCount() {
    if (!this.data.isLoggedIn) {
      this.setData({ messageUnreadCount: 0 });
      return;
    }

    try {
      const result = await api.getMessages({
        page: 1,
        limit: 1
      });
      this.setData({
        messageUnreadCount: Number(result && result.unreadCount ? result.unreadCount : 0)
      });
    } catch (error) {
      console.warn('[Profile] 加载未读消息数失败:', error);
    }
  },

  /**
   * 设置功能
   */
  onSettings() {
    console.log('设置功能');
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    });
  },

  /**
   * 关于功能
   */
  onAbout() {
    console.log('关于功能');
    wx.showToast({
      title: '关于功能开发中',
      icon: 'none'
    });
  },

  /**
   * 环境测试功能
   */
  onEnvTest() {
    console.log('环境测试功能');
    wx.navigateTo({
      url: '/pkgLabs/env-test/env-test'
    });
  },

  /**
   * 测试401错误处理
   */
  async test401Error() {
    try {
      console.log('[Profile] 开始测试401错误处理');
      // 设置一个无效的token来模拟认证过期
      wx.setStorageSync('token', 'invalid_token_for_test');
      // 直接触发统一认证错误处理（清理并跳转到profile，显示登录提示）
      api.simulateAuthError(401);
    } catch (error) {
      console.log('[Profile] 401错误测试完成，错误信息:', error);
    }
  },

  /**
   * 测试403错误处理
   */
  async test403Error() {
    try {
      console.log('[Profile] 开始测试403错误处理');
      // 直接调用API的模拟方法，触发统一认证错误处理流程（清理并跳转）
      api.simulateAuthError(403);
    } catch (error) {
      console.log('[Profile] 403错误测试完成，错误信息:', error);
    }
  },

  /**
   * 初始化主题模式
   */
  initThemeMode() {
    try {
      const app = getApp();
      const isDarkMode = app.globalData.isDarkMode || false;
      this.setData({ isDarkMode });
      this.applyTheme(isDarkMode);
    } catch (error) {
      console.error('初始化主题模式失败:', error);
    }
  },

  /**
   * 主题切换事件
   */
  onThemeChange(e) {
    console.log('profile页面主题切换开始 - switch值:', e.detail.value);
    
    // 使用app.js中的统一主题切换方法
    const app = getApp();
    console.log('切换前app.globalData.isDarkMode:', app.globalData.isDarkMode);
    
    const newDarkMode = app.toggleThemeMode();
    console.log('切换后newDarkMode:', newDarkMode);
    
    // 更新页面状态
    this.setData({ isDarkMode: newDarkMode });
    
    // 应用主题
    this.applyTheme(newDarkMode);
    
    // 同步自定义导航栏主题
    const customNavbar = this.selectComponent('#custom-navbar');
    console.log('profile页面获取自定义导航栏组件:', customNavbar);
    if (customNavbar && customNavbar.updateTheme) {
      console.log('profile页面调用updateTheme方法');
      customNavbar.updateTheme();
    }
    
    wx.showToast({
      title: newDarkMode ? '已切换到夜间模式' : '已切换到白天模式',
      icon: 'success'
    });
  },

  /**
   * 主题切换动画组件事件
   */
  onThemeToggle(e) {
    console.log('theme-toggle组件触发主题切换:', e.detail.isDarkMode);
    
    // 使用app.js中的统一主题切换方法
    const app = getApp();
    const newDarkMode = app.toggleThemeMode();
    
    // 更新页面状态
    this.setData({ isDarkMode: newDarkMode });
    
    // 应用主题
    this.applyTheme(newDarkMode);
    
    // 同步自定义导航栏主题
    const customNavbar = this.selectComponent('#custom-navbar');
    if (customNavbar && customNavbar.updateTheme) {
      customNavbar.updateTheme();
    }
    
    wx.showToast({
      title: newDarkMode ? '已切换到夜间模式' : '已切换到白天模式',
      icon: 'success'
    });
  },

  /**
   * 应用主题
   */
  applyTheme(isDarkMode) {
    // 获取页面容器
    const query = this.createSelectorQuery();
    query.select('.profile-container').boundingClientRect();
    query.exec((res) => {
      if (res[0]) {
        // 动态添加或移除dark类名
        const className = isDarkMode ? 'profile-container dark' : 'profile-container';
        // 注意：小程序中无法直接操作DOM，这里通过setData更新类名
        this.setData({
          containerClass: isDarkMode ? 'dark' : ''
        });
      }
    });
    
    // 更新导航栏颜色
    this.updateNavColors(isDarkMode);
  },

  /**
   * 更新导航栏颜色
   */
  updateNavColors(isDarkMode) {
    const navRgb = isDarkMode ? '26, 26, 26' : '189, 195, 199'; // 夜间模式使用深灰色
    this.setData({
      navRgb: navRgb
    });
  },

  /**
   * 管理功能
   */
  onAdmin() {
    console.log('管理功能');
    wx.showToast({
      title: '管理功能开发中',
      icon: 'none'
    });
  },

  /**
   * 退出登录
   */
  async onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 显示网络请求loading
            this.setData({
              showNetworkLoading: true,
              networkLoadingText: '退出中...'
            });
            
            // AuthService 内部会先调服务端登出，再清理本地状态
            await auth.logout();
            this.setData({
              isLoggedIn: false,
              isAdmin: false,
              userInfo: null,
              stats: {
                postsCount: 0,
                likesCount: 0,
                commentsCount: 0,
                followersCount: 0
              },
              myPosts: [],
              postsPage: 1,
              postsHasMore: true,
              showNetworkLoading: false
            });
            
            wx.showToast({
              title: '已退出登录',
              icon: 'success'
            });
          } catch (error) {
            console.error('退出登录失败:', error);
            
            // 即使服务端登出失败，也执行本地清理
            try {
              wx.removeStorageSync('token');
              wx.removeStorageSync('refreshToken');
              wx.removeStorageSync('userInfo');
            } catch (_cleanupError) {
              // noop
            }
            this.setData({
              isLoggedIn: false,
              isAdmin: false,
              userInfo: null,
              stats: {
                postsCount: 0,
                likesCount: 0,
                commentsCount: 0,
                followersCount: 0
              },
              myPosts: [],
              showNetworkLoading: false,
              postsPage: 1,
              postsHasMore: true
            });
            
            wx.showToast({
              title: '已退出登录',
              icon: 'success'
            });
          }
        }
      }
    });
  },

  /**
   * 切换标签
   */
  onTabChange(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ activeTab: tab });
    
    // 根据标签加载对应数据
    switch (tab) {
      case 'posts':
        // 已移除loadMyPosts调用
        break;
      case 'likes':
        this.loadMyLikes();
        break;
      case 'comments':
        this.loadMyComments();
        break;
    }
  },

  /**
   * 加载我的点赞
   */
  async loadMyLikes() {
    try {
      // TODO: 实现加载我的点赞逻辑
      console.log('加载我的点赞');
    } catch (error) {
      console.error('加载我的点赞失败:', error);
    }
  },

  /**
   * 加载我的评论
   */
  async loadMyComments() {
    try {
      // TODO: 实现加载我的评论逻辑
      console.log('加载我的评论');
    } catch (error) {
      console.error('加载我的评论失败:', error);
    }
  },

  /**
   * 点击帖子
   */
  onPostTap(e) {
    const { postId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pkgContent/detail/detail?id=${postId}`
    });
  },

  /**
   * 点赞帖子
   */
  async onLikePost(e) {
    const { postId, index } = e.currentTarget.dataset;
    
    try {
      const post = this.data.myPosts[index];
      const isLiked = post.isLiked;
      
      // 乐观更新UI
      const updatedPosts = [...this.data.myPosts];
      updatedPosts[index] = {
        ...post,
        isLiked: !isLiked,
        likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1
      };
      
      this.setData({ myPosts: updatedPosts });
      
      // 调用API
      if (isLiked) {
        await api.unlikePost(postId);
      } else {
        await api.likePost(postId);
      }
    } catch (error) {
      console.error('点赞失败:', error);
      
      // 恢复UI状态
      const post = this.data.myPosts[index];
      const updatedPosts = [...this.data.myPosts];
      updatedPosts[index] = {
        ...post,
        isLiked: !post.isLiked,
        likesCount: post.isLiked ? post.likesCount + 1 : post.likesCount - 1
      };
      
      this.setData({ myPosts: updatedPosts });
      
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  /**
   * 编辑帖子
   */
  onEditPost(e) {
    const { postId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pkgContent/publish/publish?id=${postId}&mode=edit`
    });
  },

  /**
   * 删除帖子
   */
  onDeletePost(e) {
    const { postId, index } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这篇帖子吗？删除后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });
            
            await api.deleteTopic(postId);
            
            // 从列表中移除
            const updatedPosts = this.data.myPosts.filter((_, i) => i !== index);
            this.setData({ myPosts: updatedPosts });
            
            // 更新统计数据
            const stats = { ...this.data.stats };
            stats.postsCount = Math.max(0, stats.postsCount - 1);
            this.setData({ stats });
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
          } catch (error) {
            console.error('删除帖子失败:', error);
            wx.showToast({
              title: error.message || '删除失败',
              icon: 'none'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  /**
   * 跳转到发布页面
   */
  onPublish() {
    if (!this.data.isLoggedIn) {
      this.onLogin();
      return;
    }
    
    wx.navigateTo({
      url: '/pkgContent/publishMode/publishMode'
    });
  },

  /**
   * 跳转到管理后台
   */
  onAdminPanel() {
    wx.showToast({
      title: '管理后台开发中',
      icon: 'none'
    });
  },

  /**
   * 设置功能
   */
  onSettings() {
    console.log('设置 - 更改暗色背景');
    wx.showToast({
      title: '暗色模式开发中',
      icon: 'none'
    });
  },

  /**
   * 关于功能
   */
  onAbout() {
    console.log('关于');
    wx.showActionSheet({
      itemList: ['关于小程序', '关于审核'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 跳转到关于小程序页面
          wx.navigateTo({
            url: '/pkgContent/about-page/about-page?type=about'
          });
        } else if (res.tapIndex === 1) {
          // 跳转到关于审核页面
          wx.navigateTo({
            url: '/pkgContent/about-page/about-page?type=audit'
          });
        }
      },
      fail: (res) => {
        console.log('用户取消选择');
      }
    });
  },

  /**
   * 跳转到设置页面
   */
  onSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  /**
   * 导航栏设置按钮点击事件
   */
  onSettingsTap() {
    this.onSettings();
  },

  // 设置滚动监听
  setupScrollListener() {
    // 初始化导航栏为透明状态
    this.setData({
      navOpacity: 0,
      titleOpacity: 0,
      navShadow: 'none'
    });
  },

  // 页面滚动事件
  onPageScroll(e) {
    const scrollTop = e.scrollTop || 0;
    
    // 使用 requestAnimationFrame 节流 setData
    if (!this.ticking) {
      this.ticking = true;
      const schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 16);
      schedule(() => {
        this.updateNavByRatio(scrollTop);
        this.ticking = false;
      });
    }
  },

  // 根据滚动位置更新导航栏状态
  updateNavByRatio(scrollTop) {
    // 计算 ratio（到达 banner 底部时为 1）
    const h = this.bannerHeightPx || 300;
    const ratio = Math.min(1, Math.max(0, scrollTop / h));
    
    // 少量抖动避免频繁 setData：只在变化明显时更新
    const newOpacity = Number(ratio.toFixed(3));
    if (Math.abs(newOpacity - this.data.navOpacity) < 0.005) return;

    const isDark = this.data.isDarkMode;
    const shadow = newOpacity > 0.02 ? (isDark ? "0 2rpx 12rpx rgba(255,255,255,0.08)" : "0 2rpx 10rpx rgba(0,0,0,0.12)") : "none";
    // 标题在接近不透明时逐渐显现
    const titleOpacity = Math.min(1, Math.max(0, (ratio - 0.3) / 0.7));

    const pe = newOpacity > 0.02 ? 'auto' : 'none';
    this.setData({
      navOpacity: newOpacity,
      titleOpacity,
      navShadow: shadow,
      navPointerEvents: pe
    });
  },

  /**
   * 导航栏演示页面
   */
  onNavbarDemo() {
    wx.navigateTo({
      url: '/pkgLabs/navbar-demo/navbar-demo'
    });
  },
  
  // Loading组件测试相关方法
  onLoadingTest() {
    this.setData({
      showLoadingTest: true,
      isTestLoading: true
    });
  },
  
  hideLoadingTest() {
    this.setData({
      showLoadingTest: false,
      isTestLoading: false
    });
  },
  
  stopPropagation() {
    // 阻止事件冒泡
  },
  
  toggleLoading() {
    const newLoadingState = !this.data.isTestLoading;
    this.setData({
      isTestLoading: newLoadingState,
      loadingText: newLoadingState ? '正在加载中...' : '已停止加载'
    });
    
    // 如果开始加载，3秒后自动停止
    if (newLoadingState) {
      setTimeout(() => {
        this.setData({
          isTestLoading: false,
          loadingText: '加载完成！'
        });
        
        // 1秒后重置文本
        setTimeout(() => {
          this.setData({
            loadingText: '测试加载中...'
          });
        }, 1000);
      }, 3000);
    }
  },
  
  changeLoadingSize() {
    const sizes = ['small', 'default', 'large'];
    const currentIndex = sizes.indexOf(this.data.loadingSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    this.setData({
      loadingSize: sizes[nextIndex]
    });
  },
  
  toggleLoadingText() {
    this.setData({
      showLoadingText: !this.data.showLoadingText
    });
  },



  /**
   * 分享功能
   */
  onShareAppMessage() {
    return {
      title: '钓友说 - 分享钓鱼装备使用体验',
      path: '/pages/invite/index',
      imageUrl: '/images/share.png'
    };
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    if (this.data.isLoggedIn) {
      this.loadUserData().finally(() => {
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    // 已移除loadMyPosts调用
  },

  /**
   * 格式化日期
   */
  formatDate(dateString) {
    return dateFormatter.formatPostTime(dateString);
  },

  /**
   * 点击头像事件
   */
  onPreviewAvatar() {
    // 检查用户是否已登录
    if (this.data.isLoggedIn) {
      // 已登录，显示用户信息获取说明
      wx.showModal({
        title: '更新个人信息',
        content: '点击"编辑资料"可以使用微信头像昵称填写能力来更新您的个人信息。',
        showCancel: true,
        cancelText: '知道了',
        confirmText: '编辑资料',
        success: (res) => {
          if (res.confirm) {
            // 跳转到编辑资料页面
            wx.navigateTo({
              url: '/pkgContent/edit-profile/edit-profile'
            });
          }
        }
      });
    } else {
      // 未登录，预览头像
      if (this.data.userInfo && this.data.userInfo.avatarUrl) {
        wx.previewImage({
          current: this.data.userInfo.avatarUrl,
          urls: [this.data.userInfo.avatarUrl]
        });
      }
    }
  },

  /**
   * 关注用户
   */
  onFollow() {
    wx.showToast({
      title: '关注功能开发中',
      icon: 'none'
    });
  },

  /**
   * 更多信息
   */
  onMoreInfo() {
    wx.showToast({
      title: '更多信息功能开发中',
      icon: 'none'
    });
  },

  /**
   * 更新用户信息
   */
  async onUpdateProfile() {
    try {
      await auth.refreshUserInfo();
      const userInfo = normalizeProfileUserInfo(auth.getCurrentUser() || wx.getStorageSync('userInfo'));
      this.setData({ userInfo });
      await this.refreshUserImages(userInfo);
      
      wx.showToast({
        title: '已刷新资料',
        icon: 'success'
      });
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
    }
  },


});
