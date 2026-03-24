// pages/edit-profile/edit-profile.js
const api = require('../../services/api.js');
const auth = require('../../services/auth.js');
const tempUrlManager = require('../../utils/tempUrlManager.js');
const { debouncePageMixin } = require('../../utils/debounceUtils.js');
const tagProfileView = require('../../utils/tagProfileView.js');

function normalizeEditProfileUserInfo(rawUser = {}) {
  const user = rawUser && typeof rawUser === 'object' ? rawUser : {};
  const avatar = user.avatarUrl || user.avatar || '';
  const backgroundImage = user.backgroundImage || user.background || '';
  const displayTag = user.displayTag && typeof user.displayTag === 'object'
    ? user.displayTag
    : (user.equippedDisplayTag && typeof user.equippedDisplayTag === 'object' ? user.equippedDisplayTag : null);

  return {
    ...user,
    avatar,
    avatarUrl: user.avatarUrl || avatar,
    nickname: user.nickname || user.nickName || '',
    nickName: user.nickName || user.nickname || '',
    background: user.background || backgroundImage,
    backgroundImage,
    backgroundImageUrl: user.backgroundImageUrl || backgroundImage,
    displayTag,
    userTag: displayTag ? displayTag.name : (user.userTag || ''),
    userTagRarity: displayTag ? displayTag.rarityLevel : (user.userTagRarity || 1)
  };
}

Page(Object.assign({}, debouncePageMixin, {
  /**
   * 页面的初始数据
   */
  data: Object.assign({}, debouncePageMixin.data, {
    // 导航栏相关
    statusBarHeight: 0,
    navBarHeight: 0,
    
    // 主题相关
    containerClass: '',
    
    // 用户信息
    userInfo: {
      avatar: '',
      nickname: '',
      bio: '',
      userTag: '',
      backgroundImage: '' // 添加背景图字段
    },
    
    // 简介长度
    introductionLength: 0,
    
    // 标签相关
    availableTags: [],
    
    // 地址相关
    addresses: [],
    
    // 保存状态
    saving: false,
    
    // Loading组件相关
    isLoading: false,
    loadingText: '加载中...',
    showNetworkLoading: false,
    networkLoadingText: '网络请求中...',
    
    // 标签选择状态
    noTagSelected: false,
    
    // 文本框相关状态
    textareaSelectionStart: -1,
    textareaSelectionEnd: -1,
    textareaFocus: false,
    isFocusing: false,
    
    // 编辑状态标志
    isEditing: false,
    hasUserInteracted: false,
    // 保存按钮可用性（根据昵称是否为空或超长禁用保存）
    canSave: true,
    
    // 初始状态记录
    initialUserState: {
      nickname: '',
      bio: '',
      avatar: '',
      backgroundImage: '', // 添加背景图字段
      shipAddress: '',
      addresses: [],
      userTag: '',
      userTagId: null,
      noTagSelected: false
    }
  }),

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
    this._skipNextShowReload = true;
    
    this.loadUserInfo();
    this.loadAddresses();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (this._skipNextShowReload) {
      console.log('[EditProfile] 页面显示 - 跳过首次 onShow 重复加载');
      this._skipNextShowReload = false;
      this.initThemeMode();
      const customNavbar = this.selectComponent('#custom-navbar');
      if (customNavbar && customNavbar.updateTheme) {
        customNavbar.updateTheme();
      }
      return;
    }

    // 如果用户正在编辑或已经有交互，不重新加载数据，避免覆盖用户的修改
    if (!this.data.isEditing && !this.data.hasUserInteracted) {
      console.log('[EditProfile] 页面显示 - 首次加载，重新获取数据');
      this.loadUserInfo();
      this.loadAddresses();
    } else {
      console.log('[EditProfile] 页面显示 - 用户正在编辑，保持当前数据不变');
      // 只更新地址数据（因为地址可能在其他页面被修改）
      this.loadAddresses();
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
   * 初始化主题模式
   */
  initThemeMode() {
    try {
      const app = getApp();
      const isDarkMode = app.globalData.isDarkMode || false;
      this.setData({
        containerClass: isDarkMode ? 'dark' : ''
      });
    } catch (error) {
      console.error('初始化主题模式失败:', error);
    }
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    try {
      // 显示页面加载状态
      this.setData({
        isLoading: true,
        loadingText: '加载用户信息...'
      });
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await auth.refreshUserInfo();
      const userInfo = normalizeEditProfileUserInfo(auth.getCurrentUser());
      if (userInfo) {
        const avatar = userInfo.avatar || '/images/default-avatar.png';
        const nickname = userInfo.nickname || '';
        const bio = userInfo.bio || '';
        const mainDisplayTag = userInfo.displayTag || null;
        const userTag = mainDisplayTag ? mainDisplayTag.name : (userInfo.userTag || '');
        const backgroundImage = userInfo.backgroundImage || '/images/缺省页_上传中.png';
        
        // 设置用户信息
        this.setData({
          userInfo: {
            avatar: avatar,
            nickname: nickname,
            bio: bio,
            userTag: userTag,
            userTagRarity: mainDisplayTag ? mainDisplayTag.rarityLevel : (userInfo.userTagRarity || 1),
            displayTag: mainDisplayTag,
            backgroundImage: backgroundImage
          },
          introductionLength: bio.length,
          noTagSelected: !userTag || userTag === '',
          // 记录初始用户状态
          'initialUserState.nickname': nickname,
          'initialUserState.bio': bio,
          'initialUserState.avatar': avatar,
          'initialUserState.backgroundImage': backgroundImage
        });
        
        // 刷新图片临时链接
        this.refreshUserImages({
          avatar: avatar,
          backgroundImage: backgroundImage
        });
      }
      
      // 隐藏加载状态
      this.setData({
        isLoading: false
      });
      
    } catch (error) {
      console.error('加载用户信息失败:', error);
      this.setData({
        isLoading: false
      });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  /**
   * 更新选中的标签
   */
  updateSelectedTag(currentTag) {
    const availableTags = this.data.availableTags.map(tag => ({
      ...tag,
      selected: String(tag.tagId || tag.id || tag.resolvedId) === String(currentTag)
    }));
    this.setData({ availableTags }, () => this.refreshTagWardrobeView());
  },

  refreshTagWardrobeView() {
    const selectedTagId = this.data.noTagSelected
      ? null
      : (((this.data.availableTags.find(tag => tag.selected) || {}).tagId)
        || ((this.data.availableTags.find(tag => tag.selected) || {}).resolvedId)
        || null);
    const normalizedTags = tagProfileView.normalizeWardrobeTags(this.data.availableTags, {
      equippedTagId: selectedTagId
    });
    const selectedTag = normalizedTags.find(tag => tag.isSelected) || null;

    this.setData({
      availableTags: normalizedTags,
      tagGroupTabs: tagProfileView.buildTagGroupTabs(normalizedTags),
      visibleTagGroups: tagProfileView.buildVisibleTagGroups(normalizedTags, this.data.activeTagGroup),
      previewByPostType: tagProfileView.buildPreviewByPostType(normalizedTags, this.data.displayStrategy),
      strategyDescription: tagProfileView.getStrategyDescription(this.data.displayStrategy),
      'userInfo.userTag': selectedTag ? selectedTag.name : '',
      'userInfo.userTagRarity': selectedTag ? selectedTag.rarityLevel : 1,
      'userInfo.displayTag': selectedTag ? (selectedTag.displayTag || null) : null
    });
  },

  /**
   * 加载标签数据
   */
  async loadTags() {
    try {
      console.log('[EditProfile] 开始加载标签数据...');
      
      // 显示网络请求loading
      this.setData({
        showNetworkLoading: true,
        networkLoadingText: '加载标签数据...'
      });
      
      console.log('[EditProfile] 准备调用标签接口...');
      const [usableTags, tagState] = await Promise.all([
        api.getTagWardrobe(),
        api.getTagDisplaySettings()
      ]);
      console.log('[EditProfile] api.getTagWardrobe() 返回数据:', usableTags);
      console.log('[EditProfile] 获取到的用户标签:', tagState);

      const equippedTagId = tagState && tagState.equippedTagId ? String(tagState.equippedTagId) : null;
      const displayStrategy = tagState && tagState.displayStrategy
        ? tagState.displayStrategy
        : tagProfileView.DISPLAY_STRATEGY.SMART;
      const availableTags = tagProfileView.normalizeWardrobeTags(
        (usableTags || []).filter(tag => tag.status !== 'revoked' && tag.isActive !== false),
        { equippedTagId }
      );
      const currentTag = availableTags.find(tag => tag.isSelected) || null;

      this.setData({
        availableTags,
        displayStrategy,
        noTagSelected: !currentTag,
        'userInfo.userTag': currentTag ? currentTag.name : '',
        'userInfo.userTagRarity': currentTag ? currentTag.rarityLevel : 1,
        'userInfo.displayTag': currentTag ? currentTag.displayTag : null,
        'initialUserState.userTag': currentTag ? currentTag.name : '',
        'initialUserState.userTagId': currentTag ? currentTag.resolvedId : null,
        'initialUserState.noTagSelected': !currentTag,
        'initialUserState.displayStrategy': displayStrategy
      });
      this.refreshTagWardrobeView();
      
      // 隐藏网络请求loading
      this.setData({
        showNetworkLoading: false
      });
      
    } catch (error) {
      console.error('[EditProfile] 加载标签数据失败:', error);
      // 隐藏网络请求loading
      this.setData({
        showNetworkLoading: false
      });
      // 如果接口失败，使用默认标签数据
      console.log('[EditProfile] 使用默认标签数据');
      wx.showToast({
        title: '加载标签失败',
        icon: 'none'
      });
    }
  },

  /**
   * 刷新用户图片（头像和背景图）
   */
  async refreshUserImages(userInfo) {
    try {
      console.log('[EditProfile] 开始刷新用户图片');
      
      const imagePromises = [];
      const normalizedUserInfo = normalizeEditProfileUserInfo(userInfo);
      const avatarSource = normalizedUserInfo.avatar || '';
      const backgroundSource = normalizedUserInfo.backgroundImage || '';
      
      // 处理头像
      if (avatarSource) {
        imagePromises.push(
          tempUrlManager.getTempUrl(avatarSource, 'avatar').then(avatarUrl => {
            console.log('[EditProfile] 头像临时URL获取成功');
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
            console.log('[EditProfile] 背景图临时URL获取成功');
            this.setData({
              'userInfo.backgroundImage': backgroundSource,
              'userInfo.backgroundImageUrl': backgroundUrl
            });
          })
        );
      }
      
      // 并行处理所有图片
      await Promise.all(imagePromises);
      console.log('[EditProfile] 用户图片刷新完成');
    } catch (error) {
      console.error('[EditProfile] 刷新用户图片失败:', error);
    }
  },

  /**
   * 处理图片加载错误
   */
  async handleImageError(e) {
    try {
      const type = e.currentTarget.dataset.type;
      console.log(`[EditProfile] ${type}图片加载失败，尝试重新获取链接`);
      
      const userInfo = this.data.userInfo;
      if (!userInfo) return;
      
      let fileID = null;
      if (type === 'background') {
        fileID = userInfo.backgroundImage;
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
        
        console.log(`[EditProfile] ${type}图片链接已重新获取`);
      }
    } catch (error) {
      console.error('[EditProfile] 处理图片错误失败:', error);
    }
  },

  /**
   * 选择头像 - 使用微信头像昵称填写能力
   */
  onChooseAvatar(e) {
    console.log('[EditProfile] 选择头像事件:', e);
    
    const { avatarUrl } = e.detail;
    if (avatarUrl) {
      // 显示临时头像
      this.setData({
        'userInfo.avatar': avatarUrl,
        isEditing: true,
        hasUserInteracted: true
      });
      
      // 上传头像到独立后台
      this.uploadAvatar(avatarUrl);
      
      console.log('[EditProfile] 头像已更新，准备上传到独立后台:', avatarUrl);
    } else {
      wx.showToast({
        title: '获取头像失败',
        icon: 'none'
      });
    }
  },

  /**
   * 上传头像到独立后台
   */
  async uploadAvatar(filePath) {
    try {
      // 显示网络请求loading
      this.setData({
        showNetworkLoading: true,
        networkLoadingText: '处理中...'
      });
      
      // 引入优化后的图片上传工具
      const imageUploadUtils = require('../../utils/imageUploadUtils');
      
      // 1. 智能压缩图片
      console.log('[EditProfile] 开始智能压缩图片');
      this.setData({
        networkLoadingText: '压缩图片中...'
      });
      const imageInfo = await imageUploadUtils.getImageInfo(filePath);
      const compressedPath = await imageUploadUtils.smartCompressImage(filePath, imageInfo, {
        quality: 80,  // 头像质量可以适当高一些
        maxWidth: 400, // 头像尺寸限制
        maxHeight: 400
      });
      console.log('[EditProfile] 图片智能压缩完成:', compressedPath);
      
      // 2. 上传到独立后台
      this.setData({
        networkLoadingText: '上传中...'
      });
      console.log('[EditProfile] 开始上传到独立后台');
      const fileID = await imageUploadUtils.uploadToBackend(compressedPath, 'avatar');
      console.log('[EditProfile] 上传成功，头像地址:', fileID);
      
      // 3. 更新用户信息
      this.setData({
        'userInfo.avatar': fileID
      });
      
      // 4. 使用TempUrlManager获取临时访问链接用于显示
      const tempUrl = await tempUrlManager.getTempUrl(fileID, 'avatar');
      console.log('[EditProfile] 获取临时访问链接成功:', tempUrl);
      
      // 更新显示的头像URL（同时保存独立后台地址到用户信息）
      this.setData({
        'userInfo.avatarUrl': tempUrl
      });
      
      // 隐藏网络请求loading
      this.setData({
        showNetworkLoading: false
      });
      
      wx.showToast({
        title: '头像更新成功',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('上传头像失败:', error);
      // 隐藏网络请求loading
      this.setData({
        showNetworkLoading: false
      });
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },

  /**
   * 选择背景图
   */
  onChooseBackground() {
    console.log('[EditProfile] 选择背景图');
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        console.log('[EditProfile] 选择背景图成功:', tempFilePath);
        
        // 显示临时背景图
        this.setData({
          'userInfo.backgroundImage': tempFilePath,
          isEditing: true,
          hasUserInteracted: true
        });
        
        // 上传背景图到独立后台
        this.uploadBackground(tempFilePath);
      },
      fail: (error) => {
        console.error('[EditProfile] 选择背景图失败:', error);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 上传背景图到独立后台
   */
  async uploadBackground(filePath) {
    try {
      // 显示网络请求loading
      this.setData({
        showNetworkLoading: true,
        networkLoadingText: '处理背景图中...'
      });
      
      // 引入优化后的图片上传工具
      const imageUploadUtils = require('../../utils/imageUploadUtils');
      
      // 1. 智能压缩图片
      console.log('[EditProfile] 开始智能压缩背景图');
      this.setData({
        networkLoadingText: '压缩背景图中...'
      });
      const imageInfo = await imageUploadUtils.getImageInfo(filePath);
      const compressedPath = await imageUploadUtils.smartCompressImage(filePath, imageInfo, {
        quality: 75,  // 背景图质量可以稍低一些
        maxWidth: 800, // 背景图尺寸限制
        maxHeight: 600
      });
      console.log('[EditProfile] 背景图智能压缩完成:', compressedPath);
      
      // 2. 上传到独立后台
      this.setData({
        networkLoadingText: '上传背景图中...'
      });
      console.log('[EditProfile] 开始上传背景图到独立后台');
      const fileID = await imageUploadUtils.uploadToBackend(compressedPath, 'background');
      console.log('[EditProfile] 背景图上传成功，背景图地址:', fileID);
      
      // 3. 更新用户信息
      this.setData({
        'userInfo.backgroundImage': fileID
      });
      
      // 4. 使用TempUrlManager获取临时访问链接用于显示
      const tempUrl = await tempUrlManager.getTempUrl(fileID, 'background');
      console.log('[EditProfile] 获取背景图临时访问链接成功:', tempUrl);
      
      // 更新显示的背景图URL（但保存fileID到用户信息）
      this.setData({
        'userInfo.backgroundImageUrl': tempUrl
      });
      
      // 隐藏网络请求loading
      this.setData({
        showNetworkLoading: false
      });
      
      wx.showToast({
        title: '背景图更新成功',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('上传背景图失败:', error);
      // 隐藏网络请求loading
      this.setData({
        showNetworkLoading: false
      });
      wx.showToast({
        title: '背景图上传失败',
        icon: 'none'
      });
    }
  },

  /**
   * 昵称输入
   */
  onNicknameInput(e) {
    const value = e.detail.value || '';
    let nextValue = value;
    // 超长截断并提示
    if (nextValue.length > 12) {
      nextValue = nextValue.slice(0, 12);
      wx.showToast({
        title: '昵称最多12个字符',
        icon: 'none'
      });
    }

    const canSave = nextValue.trim().length > 0 && nextValue.length <= 12;

    this.setData({
      'userInfo.nickname': nextValue,
      isEditing: true,
      hasUserInteracted: true,
      canSave
    });
  },

  /**
   * 自我介绍输入
   */
  onIntroductionInput(e) {
    const value = e.detail.value;
    this.setData({
      'userInfo.bio': value,
      introductionLength: value.length,
      isEditing: true,
      hasUserInteracted: true
    });
  },

  /**
   * 处理文本框焦点事件 - 将光标定位到文本末尾
   */
  handleTextareaFocus(e) {
    console.log('[EditProfile] 文本框获得焦点');
    
    // 防止重复触发
    if (this.data.isFocusing) {
      return;
    }
    
    // 设置聚焦状态锁
    this.setData({ isFocusing: true });
    
    // 获取当前文本内容
    const currentText = this.data.userInfo.bio || '';
    const textLength = currentText.length;
    
    // 直接设置光标位置到末尾，不需要重新聚焦
    this.setData({
      textareaSelectionEnd: textLength // 将光标设置到文本末尾
    });
    console.log('[EditProfile] 光标已定位到文本末尾，位置:', textLength);
    
    // 处理键盘遮挡问题
    setTimeout(() => {
      this.scrollToTextarea();
    }, 200);
    
    // 解锁聚焦状态
    setTimeout(() => {
      this.setData({ isFocusing: false });
    }, 300);
  },

  /**
   * 滚动到文本框位置，避免键盘遮挡
   */
  scrollToTextarea() {
    try {
      // 创建查询对象
      const query = wx.createSelectorQuery().in(this);
      
      // 查询文本框位置
      query.select('.edit-textarea').boundingClientRect((rect) => {
        if (rect) {
          // 获取系统信息
          const windowInfo = typeof wx.getWindowInfo === 'function'
            ? wx.getWindowInfo()
            : wx.getSystemInfoSync();
          const windowHeight = windowInfo.windowHeight;
          
          // 计算需要滚动的距离
          // 文本框底部距离屏幕顶部的距离
          const textareaBottom = rect.top + rect.height;
          
          // 预留键盘高度（大约屏幕高度的40%）
          const keyboardHeight = windowHeight * 0.4;
          
          // 如果文本框会被键盘遮挡，则滚动页面
          if (textareaBottom > (windowHeight - keyboardHeight)) {
            const scrollTop = textareaBottom - (windowHeight - keyboardHeight) + 50; // 额外留50px空间
            
            wx.pageScrollTo({
              scrollTop: scrollTop,
              duration: 300
            });
            
            console.log('[EditProfile] 页面已滚动，避免键盘遮挡，滚动距离:', scrollTop);
          }
        }
      });
      
      query.exec();
    } catch (error) {
      console.error('[EditProfile] 滚动处理失败:', error);
    }
  },

  /**
   * 处理文本框失去焦点事件
   */
  handleTextareaBlur(e) {
    console.log('[EditProfile] 文本框失去焦点');
    
    // 重置状态
    this.setData({
      textareaSelectionEnd: -1,
      isFocusing: false
    });
  },

  /**
   * 选择标签
   */
  onTagSelect(e) {
    const tagId = e.currentTarget.dataset.tagId;
    const availableTags = this.data.availableTags.map(tag => {
      if ((tag.tagId || tag.id || tag.resolvedId) == tagId) {
        // 选中当前标签（重复点击不取消选中）
        return { ...tag, selected: true };
      } else {
        // 其他标签取消选中
        return { ...tag, selected: false };
      }
    });
    
    this.setData({
      availableTags,
      noTagSelected: false,
      isEditing: true,
      hasUserInteracted: true
    }, () => this.refreshTagWardrobeView());
  },

  /**
   * 选择无标签
   */
  onNoTagSelect() {
    // 取消所有标签的选中状态
    const availableTags = this.data.availableTags.map(tag => ({
      ...tag,
      selected: false
    }));
    
    this.setData({
      availableTags,
      'userInfo.userTag': '',
      'userInfo.userTagRarity': 1,
      'userInfo.displayTag': null,
      noTagSelected: true,
      isEditing: true,
      hasUserInteracted: true
    }, () => this.refreshTagWardrobeView());
  },

  onTagGroupChange(e) {
    this.setData({
      activeTagGroup: e.currentTarget.dataset.group || 'all'
    }, () => this.refreshTagWardrobeView());
  },

  onStrategyChange(e) {
    const strategy = tagProfileView.normalizeStrategy(e.currentTarget.dataset.strategy);
    if (strategy === this.data.displayStrategy) return;

    this.setData({
      displayStrategy: strategy,
      isEditing: true,
      hasUserInteracted: true
    }, () => this.refreshTagWardrobeView());
  },

  /**
   * 编辑地址
   */
  onEditAddress(e) {
    const addressId = e.currentTarget.dataset.addressId;
    console.log('编辑地址:', addressId);
    
    // TODO: 跳转到地址编辑页面
    wx.showToast({
      title: '地址编辑功能开发中',
      icon: 'none'
    });
  },

  /**
   * 添加新地址
   */
  onAddAddress() {
    console.log('添加新地址');
    
    // 检查是否已经有地址
    if (this.data.addresses.length > 0) {
      // 如果已经有地址，提示用户只能保持一个地址
      wx.showModal({
        title: '替换地址',
        content: '当前只能保持一个收货地址，添加新地址将替换现有地址，是否继续？',
        success: (res) => {
          if (res.confirm) {
            // 用户确认替换，调用微信小程序获取用户地址接口
            this.getWechatAddress();
          }
        }
      });
    } else {
      // 如果没有地址，直接调用微信小程序获取用户地址接口
      this.getWechatAddress();
    }
  },

  /**
   * 取消编辑
   */
  onCancel() {
    // 重置编辑状态
    this.setData({
      isEditing: false,
      hasUserInteracted: false
    });
    
    wx.navigateBack();
  },

  /**
   * 检测用户信息是否发生变化
   */
  hasUserInfoChanged() {
    const current = this.data.userInfo;
    const initial = this.data.initialUserState;
    
    const currentNickname = current.nickname || '';
    const currentBio = current.bio || '';
    const currentAvatar = current.avatar || '';
    const currentBackgroundImage = current.backgroundImage || '';
    const currentShipAddress = this.getDefaultAddress();
    
    const initialNickname = initial.nickname || '';
    const initialBio = initial.bio || '';
    const initialAvatar = initial.avatar || '';
    const initialBackgroundImage = initial.backgroundImage || '';
    const initialShipAddress = initial.shipAddress || '';
    
    console.log('[EditProfile] 用户信息变化检测:');
    console.log('[EditProfile] 当前昵称:', currentNickname, '初始昵称:', initialNickname);
    console.log('[EditProfile] 当前简介:', currentBio, '初始简介:', initialBio);
    console.log('[EditProfile] 当前头像:', currentAvatar, '初始头像:', initialAvatar);
    console.log('[EditProfile] 当前背景图:', currentBackgroundImage, '初始背景图:', initialBackgroundImage);
    console.log('[EditProfile] 当前收货地址:', currentShipAddress, '初始收货地址:', initialShipAddress);
    
    const nicknameChanged = currentNickname !== initialNickname;
    const bioChanged = currentBio !== initialBio;
    const avatarChanged = currentAvatar !== initialAvatar;
    const backgroundImageChanged = currentBackgroundImage !== initialBackgroundImage;
    
    // 特殊处理地址变化检测：考虑地址操作历史
    let shipAddressChanged = currentShipAddress !== initialShipAddress;
    
    // 如果当前和初始都为空，检查是否有地址操作历史
    if (!shipAddressChanged && currentShipAddress === '' && initialShipAddress === '') {
      // 检查是否有地址被添加过又删除了
      const hasAddressHistory = this.data.hasAddressOperations || false;
      if (hasAddressHistory) {
        shipAddressChanged = true;
        console.log('[EditProfile] 检测到地址操作历史，标记为已变化');
      }
    }
    
    console.log('[EditProfile] 变化检测结果: 昵称:', nicknameChanged, '简介:', bioChanged, '头像:', avatarChanged, '背景图:', backgroundImageChanged, '收货地址:', shipAddressChanged);
    
    const changed = nicknameChanged || bioChanged || avatarChanged || backgroundImageChanged || shipAddressChanged;
    
    let type = '';
    if (nicknameChanged) type += '昵称 ';
    if (bioChanged) type += '简介 ';
    if (avatarChanged) type += '头像 ';
    if (backgroundImageChanged) type += '背景图 ';
    if (shipAddressChanged) type += '收货地址 ';
    
    console.log('[EditProfile] 用户信息整体变化:', changed, '变化类型:', type.trim());
    
    return {
      changed,
      type: type.trim() || 'userInfo'
    };
  },

  /**
   * 检测标签是否发生变化
   */
  hasTagChanged() {
    const currentNoTagSelected = this.data.noTagSelected;
    const currentUserTagId = this.data.noTagSelected
      ? null
      : (((this.data.availableTags.find(tag => tag.selected) || {}).tagId)
        || ((this.data.availableTags.find(tag => tag.selected) || {}).resolvedId)
        || null);
    const currentDisplayStrategy = this.data.displayStrategy;
    
    const initialNoTagSelected = this.data.initialUserState.noTagSelected;
    const initialUserTagId = this.data.initialUserState.userTagId || null;
    const initialDisplayStrategy = this.data.initialUserState.displayStrategy || tagProfileView.DISPLAY_STRATEGY.SMART;
    
    console.log('[EditProfile] 标签变化检测:');
    console.log('[EditProfile] 当前无标签状态:', currentNoTagSelected, '初始无标签状态:', initialNoTagSelected);
    console.log('[EditProfile] 当前标签ID:', currentUserTagId, '初始标签ID:', initialUserTagId);
    
    const noTagStateChanged = currentNoTagSelected !== initialNoTagSelected;
    const tagSelectionChanged = String(currentUserTagId || '') !== String(initialUserTagId || '');
    const displayStrategyChanged = currentDisplayStrategy !== initialDisplayStrategy;
    
    console.log('[EditProfile] 标签变化检测结果: 无标签状态变化:', noTagStateChanged, '标签选择变化:', tagSelectionChanged, '展示策略变化:', displayStrategyChanged);
    
    const changed = noTagStateChanged || tagSelectionChanged || displayStrategyChanged;
    
    let type = '';
    if (noTagStateChanged) type += '无标签状态 ';
    if (tagSelectionChanged) type += '标签选择 ';
    if (displayStrategyChanged) type += '展示策略 ';
    
    console.log('[EditProfile] 标签整体变化:', changed, '变化类型:', type.trim());
    
    return {
      changed,
      type: type.trim() || 'tag'
    };
  },

  /**
   * 保存用户信息
   */
  async onSave() {
    // 表单验证
    if (!this.validateForm()) {
      return;
    }
    
    // 使用防抖工具执行保存操作
    await this.executeWithDebounce('saveUserInfo', async () => {
      // 显示网络请求loading
      this.setData({
        showNetworkLoading: true,
        networkLoadingText: '保存中...'
      });
      
      // 当前头像字段保存独立后台返回地址
      const avatarFileID = this.data.userInfo.avatar;
      console.log('[EditProfile] 保存用户信息，头像地址:', avatarFileID);
      
      const updateData = {
        nickName: this.data.userInfo.nickname,
        bio: this.data.userInfo.bio,
        avatarUrl: avatarFileID,
        background: this.data.userInfo.backgroundImage, // 添加背景图字段
        shipAddress: this.getDefaultAddress()
      };
      
      // 检测用户信息是否发生变化，只有变化时才调用API
      console.log('[EditProfile] 开始检测用户信息变化...');
      const userInfoChangeResult = this.hasUserInfoChanged();
      console.log('[EditProfile] 用户信息变化检测结果:', userInfoChangeResult);
      
      if (userInfoChangeResult.changed) {
        console.log('[EditProfile] 用户信息发生变化，调用更新接口，变化类型:', userInfoChangeResult.type);
        await api.updateUserInfo(updateData);
      } else {
        console.log('[EditProfile] 用户信息未发生变化，跳过API调用');
      }
      
      // 只有在信息发生变化时才更新本地存储
      console.log('[EditProfile] 最终保存判断: 用户信息变化=', userInfoChangeResult.changed);
      if (userInfoChangeResult.changed) {
        console.log('[EditProfile] 检测到变化，开始保存用户信息到本地存储');
        // 更新本地存储和auth服务缓存
        await this.saveUserInfo({
          nickName: updateData.nickName,
          nickname: updateData.nickName,
          bio: updateData.bio,
          avatar: avatarFileID,
          avatarUrl: this.data.userInfo.avatarUrl,
          background: this.data.userInfo.backgroundImage,
          backgroundImage: this.data.userInfo.backgroundImage,
          backgroundImageUrl: this.data.userInfo.backgroundImageUrl || this.data.userInfo.backgroundImage
        });

        console.log('[EditProfile] 本地存储已更新');
      } else {
        console.log('[EditProfile] 无变化，跳过本地存储和云数据库更新');
      }
      
      // 根据是否有变化显示不同的提示和返回操作
      console.log('[EditProfile] 准备显示提示信息...');
      if (userInfoChangeResult.changed) {
        console.log('[EditProfile] 显示保存成功提示');
        
        // 隐藏网络请求loading
        this.setData({
          showNetworkLoading: false
        });
        
        // 重置编辑状态
        this.setData({
          isEditing: false,
          hasUserInteracted: false
        });
        
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        
        return { success: true, message: '保存成功' };
      } else {
        console.log('[EditProfile] 显示无变化提示');
        
        // 隐藏网络请求loading
        this.setData({
          showNetworkLoading: false
        });
        
        wx.showToast({
          title: '无变化，无需保存',
          icon: 'none'
        });
        
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        
        return { success: true, message: '无变化，无需保存' };
      }
    }, {
      loadingTitle: '保存中...',
      showLoading: false,
      maskLoading: true,
      onComplete: (result) => {
        if (result && result.success) {
          wx.showToast({
            title: result.message,
            icon: result.message === '保存成功' ? 'success' : 'none'
          });
        }
      },
      onError: (error) => {
        console.error('保存失败:', error);
        // 隐藏网络请求loading
        this.setData({
          showNetworkLoading: false
        });
        wx.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 保存用户信息到本地存储和auth服务
   */
  async saveUserInfo(updateData) {
    try {
      // 获取当前用户信息
      const currentUser = auth.getCurrentUser() || {};
      
      // 合并更新数据
      const updatedUser = { ...currentUser, ...updateData };
      
      // 更新本地存储
      wx.setStorageSync('userInfo', updatedUser);
      
      // 更新auth服务中的用户信息缓存
      auth.userInfo = updatedUser;
      
      return updatedUser;
    } catch (error) {
      console.error('保存用户信息失败:', error);
      throw error;
    }
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { nickname, bio } = this.data.userInfo;
    
    if (!nickname || nickname.trim().length === 0) {
      wx.showToast({
        title: '请输入昵称，最大12个字符',
        icon: 'none'
      });
      return false;
    }
    
    if (nickname.length > 12) {
      wx.showToast({
        title: '昵称最多12个字符',
        icon: 'none'
      });
      return false;
    }
    
    if (bio && bio.length > 200) {
      wx.showToast({
        title: '自我介绍不能超过200个字符',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  /**
   * 加载收货地址
   */
  loadAddresses() {
    try {
      const addresses = wx.getStorageSync('userAddresses') || [];
      console.log('[EditProfile] 从本地存储加载地址:', addresses);
      
      // 对地址进行排序，默认地址排在最前面
      const sortedAddresses = this.sortAddressesByDefault(addresses);
      
      // 只在页面首次加载时记录初始状态（当initialUserState.shipAddress为undefined时）
      // 或者当用户没有进行任何编辑操作时
      if (this.data.initialUserState.shipAddress === undefined || (!this.data.isEditing && !this.data.hasUserInteracted)) {
        const initialShipAddress = this.getDefaultAddressFromList(sortedAddresses);
        console.log('[EditProfile] 记录初始收货地址状态:', initialShipAddress);
        
        this.setData({ 
          addresses: sortedAddresses,
          // 只在首次加载时记录初始收货地址状态
          'initialUserState.shipAddress': initialShipAddress
        });
      } else {
        // 非首次加载或用户正在编辑，只更新地址列表，不更新初始状态
        console.log('[EditProfile] 更新地址列表，保持初始状态不变');
        this.setData({ 
          addresses: sortedAddresses
        });
      }
    } catch (error) {
      console.error('加载收货地址失败:', error);
    }
  },

  /**
   * 按默认地址排序
   */
  sortAddressesByDefault(addresses) {
    return addresses.sort((a, b) => {
      // 默认地址排在前面
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      // 如果都是默认或都不是默认，按ID排序
      return a.id - b.id;
    });
  },

  /**
   * 获取默认收货地址
   */
  getDefaultAddress() {
    const defaultAddress = this.data.addresses.find(addr => addr.isDefault);
    if (defaultAddress) {
      const addressDetail = `${defaultAddress.province}${defaultAddress.city}${defaultAddress.district}${defaultAddress.detail}`;
      return `${defaultAddress.receiverName},${defaultAddress.receiverPhone},${addressDetail}`;
    }
    return '';
  },

  /**
   * 从地址列表中获取默认收货地址
   */
  getDefaultAddressFromList(addresses) {
    const defaultAddress = addresses.find(addr => addr.isDefault);
    if (defaultAddress) {
      const addressDetail = `${defaultAddress.province}${defaultAddress.city}${defaultAddress.district}${defaultAddress.detail}`;
      return `${defaultAddress.receiverName},${defaultAddress.receiverPhone},${addressDetail}`;
    }
    return '';
  },

  /**
   * 获取微信地址
   */
  getWechatAddress() {
    console.log('调用微信获取地址接口');
    
    wx.chooseAddress({
      success: (res) => {
        console.log('微信地址获取成功:', res);
        
        // 将微信地址转换为本地地址格式
        const newAddress = {
          id: Date.now(),
          receiverName: res.userName,
          receiverPhone: res.telNumber,
          province: res.provinceName,
          city: res.cityName,
          district: res.countyName,
          street: res.streetName || '',
          detail: res.detailInfo,
          postalCode: res.postalCode || '',
          nationalCode: res.nationalCode || '',
          isDefault: this.data.addresses.length === 0 // 第一个地址设为默认
        };
        
        this.saveAddress(newAddress);
      },
      fail: (err) => {
         console.error('微信地址获取失败:', err);
         
         // 处理不同的失败情况
         if (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize no response')) {
           wx.showToast({
             title: '需要地址权限才能添加',
             icon: 'none',
             duration: 2000
           });
         } else if (err.errMsg.includes('requiredPrivateInfos')) {
           wx.showModal({
             title: '配置错误',
             content: '小程序未正确配置地址权限，请联系开发者',
             showCancel: false
           });
         } else {
           wx.showToast({
             title: '获取地址失败',
             icon: 'none',
             duration: 2000
           });
         }
       }
    });
  },



  /**
   * 保存地址
   */
  saveAddress(newAddress) {
    try {
      let sortedAddresses;
      
      // 检查是否已经有地址，如果有则替换现有地址
      if (this.data.addresses.length > 0) {
        // 如果已经有地址，则替换现有地址，保持只有一个地址
        const updatedAddress = {
          ...newAddress,
          id: this.data.addresses[0].id, // 保持ID不变
          isDefault: true // 设为默认地址
        };
        sortedAddresses = [updatedAddress]; // 只保留一个地址
        
        wx.showToast({
          title: '地址更新成功',
          icon: 'success'
        });
      } else {
        // 如果没有地址，则添加新地址
        sortedAddresses = [newAddress]; // 直接使用新地址作为唯一地址
        
        wx.showToast({
          title: '地址添加成功',
          icon: 'success'
        });
      }
      
      // 保存到本地存储
      wx.setStorageSync('userAddresses', sortedAddresses);
      
      // 更新页面数据（不更新初始状态，保持变化检测的准确性）
      this.setData({ 
        addresses: sortedAddresses,
        hasAddressOperations: true, // 标记有地址操作历史
        isEditing: true,
        hasUserInteracted: true
      });
      
      console.log('地址保存成功:', newAddress);
    } catch (error) {
      console.error('保存地址失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  /**
   * 删除地址
   */
  deleteAddress(e) {
    const addressId = parseInt(e.currentTarget.dataset.addressId);
    console.log('删除地址ID:', addressId, '类型:', typeof addressId);
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个收货地址吗？',
      success: (res) => {
        if (res.confirm) {
          this.performDeleteAddress(addressId);
        }
      }
    });
  },

  /**
   * 执行删除地址
   */
  performDeleteAddress(addressId) {
    console.log('执行删除地址ID:', addressId, '当前地址列表:', this.data.addresses);
    console.log('[EditProfile] 删除前初始地址状态:', this.data.initialUserState.shipAddress);
    
    try {
      const addresses = this.data.addresses.filter(addr => addr.id !== addressId);
      console.log('删除后地址列表:', addresses);
      
      // 只有当还有地址时，才检查是否需要设置默认地址
      if (addresses.length > 0) {
        const hasDefault = addresses.some(addr => addr.isDefault);
        if (!hasDefault) {
          addresses[0].isDefault = true;
        }
      }
      
      const sortedAddresses = this.sortAddressesByDefault(addresses);
      const currentAddress = this.getDefaultAddressFromList(sortedAddresses);
      
      console.log('[EditProfile] 删除后当前地址状态:', currentAddress);
      console.log('[EditProfile] 删除操作地址变化检测: 初始=', this.data.initialUserState.shipAddress, '当前=', currentAddress);
      
      wx.setStorageSync('userAddresses', sortedAddresses);
      
      // 更新页面数据（不更新初始状态，保持变化检测的准确性）
      this.setData({ 
        addresses: sortedAddresses,
        hasAddressOperations: true, // 标记有地址操作历史
        isEditing: true,
        hasUserInteracted: true
      });
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('删除地址失败:', error);
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    }
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

  /**
   * 设置默认地址
   */
  setDefaultAddress(e) {
    const addressId = parseInt(e.currentTarget.dataset.addressId);
    console.log('设置默认地址ID:', addressId, '类型:', typeof addressId);
    
    try {
      const addresses = this.data.addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }));
      
      const sortedAddresses = this.sortAddressesByDefault(addresses);
      
      wx.setStorageSync('userAddresses', sortedAddresses);
      
      // 更新页面数据（不更新初始状态，保持变化检测的准确性）
      this.setData({ 
        addresses: sortedAddresses,
        hasAddressOperations: true, // 标记有地址操作历史
        isEditing: true,
        hasUserInteracted: true
      });
      
      wx.showToast({
        title: '设置成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('设置默认地址失败:', error);
      wx.showToast({
        title: '设置失败',
        icon: 'none'
      });
    }
  }
}));
