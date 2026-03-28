// pages/publishMode/publishMode.js
const api = require('../../services/api.js');

const TOPIC_PREVIEW_STORAGE_KEY = 'topic_preview_payload_v1';

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    selectedMode: null,
    showModeSelection: true,
    formData: {},
    publishScrollIntoView: '',
    lastSelectedIndex: 1, // 记录用户上次选择的模式索引，默认为长测评
    isDarkMode: false, // 夜间模式状态
    postModes: [
      {
        title: '好物速报',
        content: '爱不释手的好物件，何不拿出来分享'
      },
      {
        title: '长测评',
        content: '你的宝贵经验，系统评测'
      },
      {
        title: '讨论&提问',
        content: '发布问题召集路亚老手答疑解惑'
      },
      {
        title: '鱼获展示',
        content: '晒出你的高光时刻，纪录每一次心跳'
      },
      {
        title: '钓行分享',
        content: '记录每一次出钓的得失与感悟'
      }
    ],
    backgroundImages: [
      'https://anglertest.xyz/Banner/banner1.jpg',
      'https://anglertest.xyz/Banner/banner2.jpg',
      'https://anglertest.xyz/Banner/banner3.webp'
    ]
  },

  onLoad: function (options) {
    // 获取系统信息
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: windowInfo.statusBarHeight
    });
  },

  onShow: function () {
    // Refresh the layout of post-mode component when the page is shown
    if (this.data.showModeSelection) {
      const postModeComponent = this.selectComponent('#post-mode');
      if (postModeComponent) {
        // 设置卡片位置为上次选择的索引
        postModeComponent.setData({
          active: this.data.lastSelectedIndex
        });
        postModeComponent.refreshLayout();
      }
    }
    
    // 同步主题模式
    this.initThemeMode();
  },

  // 处理返回按钮
  handlePageExit() {
    wx.navigateBack();
  },

  // 处理卡片选择事件
  onCardSelect(e) {
    const { index, card } = e.detail;
    const selectedMode = this.data.postModes[index];
    
    this.setData({
      selectedMode: selectedMode,
      showModeSelection: false,
      lastSelectedIndex: index, // 记录选择的索引
      formData: {
        gearCategory: 'rod'
      }
    });
    
    console.log('选中的模式:', selectedMode);
    console.log('[publishMode] onCardSelect index=', index, 'card=', card, 'init formData.gearCategory=rod');
  },

  // 返回模式选择
  backToModeSelection() {
    this.setData({
      showModeSelection: true,
      selectedMode: null,
      formData: {} // 清空表单数据
    });
    wx.nextTick(() => {
      const postModeComponent = this.selectComponent('#post-mode');
      if (postModeComponent) {
        // 设置卡片位置为上次选择的索引
        postModeComponent.setData({
          active: this.data.lastSelectedIndex
        });
        postModeComponent.refreshLayout();
      }
    });
  },

  // 表单数据变化处理
  onFormDataChange(e) {
    const { field, value } = e.detail;
    this.setData({
      [`formData.${field}`]: value
    });
    console.log('[publishMode] onFormDataChange field=', field, 'value=', value);
  },

  handleFormScrollToTop() {
    this.setData({
      publishScrollIntoView: ''
    });

    setTimeout(() => {
      this.setData({
        publishScrollIntoView: 'publish-form-top-anchor'
      });

      setTimeout(() => {
        if (this.data.publishScrollIntoView === 'publish-form-top-anchor') {
          this.setData({
            publishScrollIntoView: ''
          });
        }
      }, 80);
    }, 0);
  },

  // 长测评提交
  onSubmitExperience(e) {
    const formData = this.extractSubmitFormData(e.detail);
    console.log('长测评提交数据:', formData);
    this.openPreview('experience', formData);
  },

  // 好物速报提交
  onSubmitRecommend(e) {
    const formData = this.extractSubmitFormData(e.detail);
    console.log('好物速报提交数据:', formData);
    this.openPreview('recommend', formData);
  },

  // 求助问答提交
  onSubmitQuestion(e) {
    const formData = this.extractSubmitFormData(e.detail);
    console.log('求助问答提交数据:', formData);
    this.openPreview('question', formData);
  },

  // 鱼获展示提交
  onSubmitCatch(e) {
    const formData = this.extractSubmitFormData(e.detail);
    console.log('鱼获展示提交数据:', formData);
    this.openPreview('catch', formData);
  },

  // 钓行分享提交
  onSubmitTrip(e) {
    const formData = this.extractSubmitFormData(e.detail);
    console.log('钓行分享提交数据:', formData);
    this.openPreview('trip', formData);
  },

  openPreview(type, formData) {
    const postData = this.buildPostData(type, formData);
    const selectedMode = this.data.selectedMode || null;

    try {
      wx.setStorageSync(TOPIC_PREVIEW_STORAGE_KEY, {
        postData,
        selectedMode,
        previewTime: Date.now()
      });
    } catch (error) {
      console.error('[publishMode] 写入预览缓存失败:', error);
      wx.showToast({
        title: '进入预览失败',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pkgContent/postPreview/postPreview'
    });
  },

  // 统一提交方法
  submitPost(type, formData) {
    // 构建提交数据
    const postData = this.buildPostData(type, formData);
    
    // 调用API提交数据
    api.publishTopic(postData).then(res => {
      wx.hideLoading();
      
      // 提交成功
      wx.showToast({
        title: Number(res && res.status) === 1 ? '已提交审核' : '发布成功',
        icon: 'success',
        duration: 2000
      });
      
      // 延迟返回首页
      setTimeout(() => {
        wx.navigateBack({
          delta: 2 // 返回到首页
        });
      }, 2000);
    }).catch(err => {
      wx.hideLoading();
      console.error('发布失败:', err);
      
      const message = api.getErrorMessage(err, '发布内容不符合社区规范，请修改后重试');
      wx.showToast({
        title: message,
        icon: 'error',
        duration: 2000
      });
    });
  },

  extractSubmitFormData(detail) {
    if (detail && typeof detail === 'object' && detail.formData && typeof detail.formData === 'object') {
      return detail.formData;
    }
    return detail && typeof detail === 'object' ? detail : {};
  },

  // 初始化主题模式
  initThemeMode() {
    try {
      const isDarkMode = wx.getStorageSync('isDarkMode') || false;
      this.setData({
        isDarkMode: isDarkMode
      });
    } catch (error) {
      console.error('获取主题模式失败:', error);
    }
  },

  // 构建提交数据
  buildPostData(type, formData) {
    const postData = {
      ...formData,
      topicCategory: this.getTopicCategory(type)
    };

    console.log('最终提交给API的数据:', postData);
    return postData;
  },

  getTopicCategory(type) {
    if (type === 'experience') return 1;
    if (type === 'question') return 2;
    if (type === 'catch') return 3;
    if (type === 'trip') return 4;
    return 0;
  }
});
