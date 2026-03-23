const api = require('../../services/api.js');
const auth = require('../../services/auth.js');
const tempUrlManager = require('../../utils/tempUrlManager.js');
const tagProfileView = require('../../utils/tagProfileView.js');

function cloneCustomPostTags(customPostTags = {}) {
  return {
    ...tagProfileView.normalizeCustomPostTags(customPostTags)
  };
}

function serializeCustomPostTags(customPostTags = {}) {
  const normalized = tagProfileView.normalizeCustomPostTags(customPostTags);
  const sorted = {};
  Object.keys(normalized).sort().forEach((key) => {
    sorted[key] = normalized[key];
  });
  return JSON.stringify(sorted);
}

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    containerClass: '',
    userInfo: {
      avatar: '',
      avatarUrl: '',
      nickname: '',
      displayTag: null
    },
    availableTags: [],
    tagGroupTabs: [],
    visibleTagGroups: [],
    activeTagGroup: 'all',
    mainTagId: null,
    postTagMode: tagProfileView.POST_TAG_MODE.SMART,
    customPostTags: {},
    previewByPostType: [],
    customTopicConfigs: [],
    modeOptions: tagProfileView.buildModeOptions(),
    currentModeTitle: '',
    strategyDescription: '',
    selectionTarget: 'main',
    showFixedTagPicker: false,
    fixedTagPickerTopicKey: '',
    fixedTagPickerTopicTitle: '',
    fixedTagPickerSelectedId: '',
    selectionTargetLabel: '主标签',
    initialTagState: {
      mainTagId: null,
      postTagMode: tagProfileView.POST_TAG_MODE.SMART,
      customPostTags: {}
    },
    isLoading: false,
    loadingText: '加载中...',
    showNetworkLoading: false,
    networkLoadingText: '处理中...'
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
    this.loadTagManagerData();
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
        containerClass: isDarkMode ? 'dark' : ''
      });
    } catch (error) {
      console.error('[TagManager] 初始化主题失败:', error);
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
        displayTag: userInfo.mainDisplayTag || userInfo.equippedDisplayTag || null
      }
    });
    this.refreshUserAvatar(userInfo);
  },

  async refreshUserAvatar(userInfo = {}) {
    try {
      if (userInfo.avatar && String(userInfo.avatar).startsWith('cloud://')) {
        const avatarUrl = await tempUrlManager.getTempUrl(userInfo.avatar, 'avatar');
        this.setData({
          'userInfo.avatarUrl': avatarUrl
        });
      }
    } catch (error) {
      console.error('[TagManager] 刷新头像失败:', error);
    }
  },

  getSelectionTargetLabel(target = 'main') {
    if (target === 'main') return '主标签';
    const topic = tagProfileView.TOPIC_META.find(item => item.key === target);
    return topic ? `${topic.label}标签` : '标签';
  },

  getCurrentTargetRef() {
    if (this.data.selectionTarget === 'main') {
      return this.data.mainTagId;
    }
    return tagProfileView.normalizeCustomTagRef(this.data.customPostTags[this.data.selectionTarget]);
  },

  buildVisibleGroups(tags) {
    const currentTargetRef = this.getCurrentTargetRef();
    const isMainTarget = this.data.selectionTarget === 'main';
    return tagProfileView.buildVisibleTagGroups(tags, this.data.activeTagGroup).map((group) => ({
      ...group,
      tags: group.tags.map((tag) => ({
        ...tag,
        isTargetSelected: isMainTarget
          ? tag.isMainTag
          : String(currentTargetRef || '') !== ''
            && String(tag.resolvedId || '') === String(currentTargetRef)
      }))
    }));
  },

  refreshTagManagerView() {
    const normalizedTags = tagProfileView.normalizeWardrobeTags(this.data.availableTags, {
      mainTagId: this.data.mainTagId
    });
    const settings = {
      mainTagId: this.data.mainTagId,
      postTagMode: this.data.postTagMode,
      customPostTags: this.data.customPostTags
    };
    const mainTag = normalizedTags.find(tag => tag.isMainTag) || null;
    const customTopicConfigs = tagProfileView.buildCustomTopicConfigs(normalizedTags, settings);
    const activeFixedTopic = this.data.fixedTagPickerTopicKey;
    const activeFixedConfig = activeFixedTopic
      ? customTopicConfigs.find(item => item.key === activeFixedTopic)
      : null;

    this.setData({
      availableTags: normalizedTags,
      tagGroupTabs: tagProfileView.buildTagGroupTabs(normalizedTags),
      visibleTagGroups: this.buildVisibleGroups(normalizedTags),
      previewByPostType: tagProfileView.buildPreviewByPostType(normalizedTags, settings),
      customTopicConfigs,
      currentModeTitle: tagProfileView.getPostTagModeTitle(this.data.postTagMode),
      strategyDescription: tagProfileView.getPostTagModeDescription(this.data.postTagMode),
      selectionTargetLabel: this.getSelectionTargetLabel(this.data.selectionTarget),
      fixedTagPickerSelectedId: activeFixedConfig && activeFixedConfig.isFixedTag ? activeFixedConfig.fixedTagId : '',
      'userInfo.displayTag': mainTag ? (mainTag.displayTag || null) : null
    });
  },

  async loadTagManagerData() {
    try {
      this.setData({
        isLoading: true,
        loadingText: '加载标签中...'
      });

      const [usableTags, tagState] = await Promise.all([
        api.getTagWardrobe(),
        api.getTagDisplaySettings()
      ]);

      const mainTagId = tagState && tagState.mainTagId ? String(tagState.mainTagId) : null;
      const postTagMode = tagProfileView.normalizePostTagMode(
        tagState && (tagState.postTagMode || (tagState.settings && tagState.settings.postTagMode)),
        tagProfileView.POST_TAG_MODE.SMART
      );
      const customPostTags = cloneCustomPostTags(
        (tagState && tagState.customPostTags) || (tagState && tagState.settings && tagState.settings.customPostTags) || {}
      );
      const availableTags = tagProfileView.normalizeWardrobeTags(
        (usableTags || []).filter(tag => tag.status !== 'revoked' && tag.isActive !== false),
        { mainTagId }
      );

      this.setData({
        availableTags,
        mainTagId,
        postTagMode,
        customPostTags,
        selectionTarget: 'main',
        showFixedTagPicker: false,
        fixedTagPickerTopicKey: '',
        fixedTagPickerTopicTitle: '',
        fixedTagPickerSelectedId: '',
        initialTagState: {
          mainTagId,
          postTagMode,
          customPostTags: cloneCustomPostTags(customPostTags)
        }
      });
      this.refreshTagManagerView();
    } catch (error) {
      console.error('[TagManager] 加载标签失败:', error);
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
    this.setData({
      activeTagGroup: e.currentTarget.dataset.group || 'all'
    }, () => this.refreshTagManagerView());
  },

  onModeChange(e) {
    const nextMode = tagProfileView.normalizePostTagMode(
      e.currentTarget.dataset.mode,
      this.data.postTagMode
    );
    if (nextMode === this.data.postTagMode) return;

    this.setData({
      postTagMode: nextMode,
      selectionTarget: 'main',
      showFixedTagPicker: false,
      fixedTagPickerTopicKey: '',
      fixedTagPickerTopicTitle: '',
      fixedTagPickerSelectedId: ''
    }, () => this.refreshTagManagerView());
  },

  onSelectMainTarget() {
    this.setData({
      selectionTarget: 'main'
    }, () => this.refreshTagManagerView());
  },

  onSelectCustomTopic(e) {
    const topicKey = e.currentTarget.dataset.topicKey;
    if (!topicKey) return;
    this.setData({
      selectionTarget: topicKey
    }, () => this.refreshTagManagerView());
  },

  onCustomRuleChange(e) {
    const topicKey = e.currentTarget.dataset.topicKey;
    const ref = tagProfileView.normalizeCustomTagRef(e.currentTarget.dataset.ref);
    if (!topicKey) return;

    this.setData({
      customPostTags: {
        ...this.data.customPostTags,
        [topicKey]: ref
      },
      showFixedTagPicker: false,
      fixedTagPickerTopicKey: '',
      fixedTagPickerTopicTitle: '',
      fixedTagPickerSelectedId: ''
    }, () => this.refreshTagManagerView());
  },

  onOpenFixedTagPicker(e) {
    const topicKey = e.currentTarget.dataset.topicKey;
    if (!topicKey) return;

    const topicMeta = tagProfileView.TOPIC_META.find(item => item.key === topicKey);
    const currentRef = tagProfileView.normalizeCustomTagRef(this.data.customPostTags[topicKey]);
    const fixedTagId = currentRef && ![
      tagProfileView.CUSTOM_TAG_REF.MAIN,
      tagProfileView.CUSTOM_TAG_REF.SMART,
      tagProfileView.CUSTOM_TAG_REF.HIDDEN
    ].includes(currentRef)
      ? String(currentRef)
      : '';

    this.setData({
      showFixedTagPicker: true,
      fixedTagPickerTopicKey: topicKey,
      fixedTagPickerTopicTitle: topicMeta ? topicMeta.label : '选择固定标签',
      fixedTagPickerSelectedId: fixedTagId
    });
  },

  onCloseFixedTagPicker() {
    this.setData({
      showFixedTagPicker: false,
      fixedTagPickerTopicKey: '',
      fixedTagPickerTopicTitle: '',
      fixedTagPickerSelectedId: ''
    });
  },

  onSelectFixedTag(e) {
    const tagId = e.currentTarget.dataset.tagId;
    const topicKey = this.data.fixedTagPickerTopicKey;
    if (!tagId || !topicKey) return;

    this.setData({
      customPostTags: {
        ...this.data.customPostTags,
        [topicKey]: String(tagId)
      },
      showFixedTagPicker: false,
      fixedTagPickerTopicKey: '',
      fixedTagPickerTopicTitle: '',
      fixedTagPickerSelectedId: ''
    }, () => this.refreshTagManagerView());
  },

  noop() {},

  onWardrobeSelect(e) {
    const tagId = e.currentTarget.dataset.tagId;
    if (!tagId) return;

    if (this.data.selectionTarget === 'main') {
      this.setData({
        mainTagId: String(tagId)
      }, () => this.refreshTagManagerView());
      return;
    }

    this.setData({
      customPostTags: {
        ...this.data.customPostTags,
        [this.data.selectionTarget]: String(tagId)
      }
    }, () => this.refreshTagManagerView());
  },

  onClearMainTag() {
    this.setData({
      mainTagId: null,
      selectionTarget: 'main'
    }, () => this.refreshTagManagerView());
  },

  hasTagChanged() {
    return String(this.data.initialTagState.mainTagId || '') !== String(this.data.mainTagId || '')
      || this.data.initialTagState.postTagMode !== this.data.postTagMode
      || serializeCustomPostTags(this.data.initialTagState.customPostTags) !== serializeCustomPostTags(this.data.customPostTags);
  },

  async onSave() {
    if (!this.hasTagChanged()) {
      wx.showToast({
        title: '没有新的改动',
        icon: 'none'
      });
      return;
    }

    try {
      this.setData({
        showNetworkLoading: true,
        networkLoadingText: '保存中...'
      });

      await api.setTagDisplay({
        mainTagId: this.data.mainTagId,
        postTagMode: this.data.postTagMode,
        customPostTags: this.data.customPostTags
      });

      const selectedMainTag = this.data.availableTags.find(tag => tag.isMainTag) || null;
      const mainDisplayTag = selectedMainTag ? (selectedMainTag.displayTag || null) : null;
      const cachedUser = wx.getStorageSync('userInfo') || auth.getCurrentUser() || {};
      const nextUser = {
        ...cachedUser,
        equippedDisplayTag: mainDisplayTag,
        mainDisplayTag,
        userTag: mainDisplayTag ? mainDisplayTag.name : '',
        userTagRarity: mainDisplayTag ? mainDisplayTag.rarityLevel : 1,
        tagDisplayStrategy: this.data.postTagMode,
        postTagMode: this.data.postTagMode
      };
      wx.setStorageSync('userInfo', nextUser);
      auth.userInfo = nextUser;

      this.setData({
        initialTagState: {
          mainTagId: this.data.mainTagId,
          postTagMode: this.data.postTagMode,
          customPostTags: cloneCustomPostTags(this.data.customPostTags)
        }
      });

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 800);
    } catch (error) {
      console.error('[TagManager] 保存失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    } finally {
      this.setData({
        showNetworkLoading: false
      });
    }
  },

  onCancel() {
    wx.navigateBack();
  }
});
