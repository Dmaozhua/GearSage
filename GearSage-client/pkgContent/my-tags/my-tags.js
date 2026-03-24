const api = require('../../services/api.js');
const auth = require('../../services/auth.js');
const tempUrlManager = require('../../utils/tempUrlManager.js');
const tagProfileView = require('../../utils/tagProfileView.js');

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    containerClass: '',
    isDarkMode: false,
    isLoading: false,
    loadingText: '加载中...',
    userInfo: {
      avatar: '',
      avatarUrl: '',
      nickname: '',
      mainDisplayTag: null
    },
    ownedTags: [],
    tagGroupTabs: [],
    activeTagGroup: 'all',
    visibleTagGroups: [],
    previewByPostType: [],
    mainTagId: null,
    postTagMode: tagProfileView.POST_TAG_MODE.SMART,
    postTagModeTitle: '',
    postTagModeDescription: ''
  },

  onLoad() {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    });
    this.initThemeMode();
    this.loadBaseUserInfo();
  },

  onShow() {
    this.initThemeMode();
    this.loadTagPageData();
    const customNavbar = this.selectComponent('#custom-navbar');
    if (customNavbar && customNavbar.updateTheme) {
      customNavbar.updateTheme();
    }
  },

  initThemeMode() {
    try {
      const app = getApp();
      const isDarkMode = app.globalData.isDarkMode || false;
      this.setData({
        isDarkMode,
        containerClass: isDarkMode ? 'dark' : ''
      });
    } catch (error) {
      console.error('[MyTags] 初始化主题失败:', error);
    }
  },

  loadBaseUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || auth.getCurrentUser() || {};
    this.setData({
      userInfo: {
        ...this.data.userInfo,
        avatar: userInfo.avatar || '',
        avatarUrl: userInfo.avatarUrl || '',
        nickname: userInfo.nickname || userInfo.nickName || '钓友',
        mainDisplayTag: userInfo.equippedDisplayTag || userInfo.mainDisplayTag || null
      }
    });
    this.refreshUserAvatar(userInfo);
  },

  async refreshUserAvatar(userInfo = {}) {
    try {
      const avatarSource = userInfo.avatarUrl || userInfo.avatar || '';
      if (avatarSource) {
        const avatarUrl = await tempUrlManager.getTempUrl(avatarSource, 'avatar');
        this.setData({
          'userInfo.avatarUrl': avatarUrl
        });
      }
    } catch (error) {
      console.error('[MyTags] 刷新头像失败:', error);
    }
  },

  async loadTagPageData() {
    try {
      this.setData({
        isLoading: true,
        loadingText: '加载标签中...'
      });

      const tagState = await api.getTagDisplaySettings({ silent: true });
      const mainTagId = tagState && tagState.mainTagId ? String(tagState.mainTagId) : null;
      const postTagMode = tagProfileView.normalizePostTagMode(
        tagState && (tagState.postTagMode || (tagState.settings && tagState.settings.postTagMode)),
        tagProfileView.POST_TAG_MODE.SMART
      );
      const customPostTags = tagProfileView.normalizeCustomPostTags(
        (tagState && tagState.customPostTags) || (tagState && tagState.settings && tagState.settings.customPostTags) || {}
      );
      const ownedTags = tagProfileView.normalizeWardrobeTags(tagState && tagState.ownedTags ? tagState.ownedTags : [], {
        mainTagId
      });
      const selectedOwnedTag = ownedTags.find(tag => tag.isMainTag) || null;
      const currentMainTag = tagState && tagState.mainTag
        ? tagState.mainTag
        : (selectedOwnedTag ? (selectedOwnedTag.displayTag || null) : null);
      const previewSettings = {
        mainTagId,
        postTagMode,
        customPostTags
      };

      this.setData({
        ownedTags,
        mainTagId,
        postTagMode,
        postTagModeTitle: tagProfileView.getPostTagModeTitle(postTagMode),
        postTagModeDescription: tagProfileView.getPostTagModeDescription(postTagMode),
        tagGroupTabs: tagProfileView.buildTagGroupTabs(ownedTags),
        visibleTagGroups: tagProfileView.buildVisibleTagGroups(ownedTags, this.data.activeTagGroup),
        previewByPostType: tagState && Array.isArray(tagState.previewByPostType) && tagState.previewByPostType.length
          ? tagState.previewByPostType
          : tagProfileView.buildPreviewByPostType(ownedTags, previewSettings),
        'userInfo.mainDisplayTag': currentMainTag
      });

      const cachedUser = wx.getStorageSync('userInfo') || {};
      wx.setStorageSync('userInfo', {
        ...cachedUser,
        equippedDisplayTag: currentMainTag,
        mainDisplayTag: currentMainTag,
        userTag: currentMainTag ? currentMainTag.name : '',
        userTagRarity: currentMainTag ? currentMainTag.rarityLevel : 1,
        tagDisplayStrategy: postTagMode,
        postTagMode
      });
    } catch (error) {
      console.error('[MyTags] 加载标签数据失败:', error);
      wx.showToast({
        title: '加载标签失败',
        icon: 'none'
      });
    } finally {
      this.setData({
        isLoading: false
      });
    }
  },

  onTagGroupChange(e) {
    const activeTagGroup = e.currentTarget.dataset.group || 'all';
    this.setData({
      activeTagGroup,
      visibleTagGroups: tagProfileView.buildVisibleTagGroups(this.data.ownedTags || [], activeTagGroup)
    });
  },

  onOpenTagManager() {
    wx.navigateTo({
      url: '/pkgContent/tag-manager/tag-manager'
    });
  }
});
