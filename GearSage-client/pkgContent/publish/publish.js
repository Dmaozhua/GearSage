// pages/publish/publish.js
const apiService = require('../../services/api.js');

function isRemoteAsset(url) {
  return /^https?:\/\//.test(String(url || '')) || String(url || '').startsWith('cloud://');
}

function splitUploadQueue(images = []) {
  const normalized = Array.isArray(images) ? images.filter(Boolean) : [];
  return {
    pending: normalized.filter(img => !isRemoteAsset(img)),
    existing: normalized.filter(img => isRemoteAsset(img))
  };
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 导航栏配置
    statusBarHeight: 0,
    navBarHeight: 0,
    
    // 夜间模式
    containerClass: '',
    
    // 表单数据
    formData: {
      type: 'bz_topic_category_rod',
      title: '测试钓竿体验分享',
      purchaseDate: '2024-01-15',
      frequency: '每周3-5',
      environment: '主要在湖库作钓，目标鱼种为鲫鱼、鲤鱼、草鱼等常见淡水鱼类',
      mainContent: '这是一款非常不错的钓竿，手感轻盈，调性适中。在湖库作钓时表现优异，抛投精准，中鱼后腰力十足。适合钓鲫鱼、鲤鱼等常见鱼种，饵重范围在5-20g之间效果最佳。购买动机是想要一款性价比高的综合竿，使用后确实没有失望。',
      mainImages: [],
      receiptImages: [],
      recommend: ['手感轻盈，长时间作钓不累手', '调性适中，适合多种鱼情', '性价比很高，值得推荐'],
      usageYears: '2年',
      castingScore: 3.5,
      durabilityScore: 4.5,
      costScore: 3.5,
      id: null // 草稿ID，第一次保存后会被赋值
    },
    
    // 初始表单数据（用于检测变化）
    initialFormData: {},
    
    // 本地草稿相关字段已删除
    
    // 选择器数据
    typeOptions: ['竿', '轮', '线', '饵', '其他'],
    typeIndex: 0,  // 默认选择'竿'
    
    frequencyOptions1: ['每天', '每周', '每月'],
    frequencyIndex1: 1,  // 默认选择'每周'
    
    frequencyOptions2: ['1-2', '3-5', '6及以上'],
    frequencyIndex2: 1,  // 默认选择'3-5'
    
    environmentOptions: ['管理场', '湖库','江河','溪流', '海水'],
    
    usageYearsOptions: ['2年', '3年', '4年', '5年及以上'],
    usageYearsIndex: 0,  // 默认选择'2年'
    
    scoreOptions: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'],
    castingScoreIndex: 4,  // 默认选择'8'
    durabilityScoreIndex: 4,  // 默认选择'8'
    costScoreIndex: 4,  // 默认选择'8'
    
    // 图片相关
    maxImages: 4,
    
    // 表单验证错误
    errors: {},
    
    // 提交状态
    submitting: false,
    
    // 保存草稿状态
    savingDraft: false,
    
    // 内容提示
    contentPlaceholder: '可描述目标鱼种、常用饵重范围、购买动机、使用心得等',
    showPlaceholder: false,
    
    // 提示折叠状态
    tipsExpanded: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log('publish页面加载，参数:', options);
    
    // 初始化导航栏高度
    this.initNavBarHeight();
    
    // 初始化主题模式
    this.initThemeMode();
    
    // 初始化表单数据
    this.initFormData();
    
    // 检查并加载服务器草稿
    await this.loadServerDraft();
  },
  
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 页面卸载时不需要再处理保存草稿逻辑
    // 因为用户已经通过其他方式（如自定义导航栏返回按钮）处理了
    console.log('页面卸载');
  },

  /**
   * 初始化表单数据
   */
  initFormData() {
    // 设置今天的日期作为最大可选日期
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    
    // 保存初始表单数据
    const initialData = JSON.parse(JSON.stringify(this.data.formData));
    
    this.setData({
      today: todayStr,
      initialFormData: initialData
    });
  },

  /**
   * 从服务器加载草稿数据
   */
  async loadServerDraft() {
    try {
      console.log('[发布页面] 开始检查服务器草稿');
      const response = await apiService.getTmpTopic();
      
      if (response && response.id) {
        console.log('[发布页面] 发现服务器草稿，开始加载:', response);
        
        const draftData = response;
        const formData = { ...this.data.formData };
        
        // 映射草稿数据到表单数据
        if (draftData.title) formData.title = draftData.title;
        if (draftData.content) formData.mainContent = draftData.content;
        if (draftData.categoryKey) formData.type = draftData.categoryKey;
        if (draftData.environment) formData.environment = draftData.environment;
        if (draftData.usagePeriod) formData.usageYears = draftData.usagePeriod;
        if (draftData.usageRate) formData.frequency = draftData.usageRate;
        if (draftData.castingRate !== undefined) formData.castingScore = draftData.castingRate;
        if (draftData.worthRate !== undefined) formData.costScore = draftData.worthRate;
        if (draftData.lifeRate !== undefined) formData.durabilityScore = draftData.lifeRate;
        if (draftData.id) formData.id = draftData.id;
        
        // 处理图片数据
        if (draftData.contentImages) {
          const imageArray = draftData.contentImages.split(',').filter(img => img.trim());
          formData.mainImages = imageArray;
        }
        
        if (draftData.receipt) {
          const receiptArray = draftData.receipt.split(',').filter(img => img.trim());
          formData.receiptImages = receiptArray;
        }
        
        // 处理推荐理由
        if (draftData.recommendReason) {
          try {
            const recommendArray = JSON.parse(draftData.recommendReason);
            if (Array.isArray(recommendArray)) {
              formData.recommend = recommendArray;
            }
          } catch (e) {
            console.warn('[发布页面] 推荐理由JSON解析失败:', e);
          }
        }
        
        // 更新表单数据
        this.setData({ formData });
        
        // 更新相关的选择器索引
        this.updateSelectorsFromFormData();
        
        console.log('[发布页面] 服务器草稿加载完成');
      } else {
        console.log('[发布页面] 服务器无草稿数据');
      }
    } catch (error) {
      console.error('[发布页面] 加载服务器草稿失败:', error);
      // 加载草稿失败不影响正常使用，只记录错误
    }
  },
  
  /**
   * 根据表单数据更新选择器索引
   */
  updateSelectorsFromFormData() {
    const { formData } = this.data;
    
    // 更新装备类型索引
    const typeMap = {
      'bz_topic_category_rod': 0,
      'bz_topic_category_reel': 1,
      'bz_topic_category_bait': 2,
      'bz_topic_category_line': 3,
      'bz_topic_category_hook': 4,
      'bz_topic_category_other': 5
    };
    const typeIndex = typeMap[formData.type] !== undefined ? typeMap[formData.type] : 0;
    
    // 更新使用年限索引
    const usageYearsIndex = this.data.usageYearsOptions.indexOf(formData.usageYears);
    
    // 更新频率索引
    const frequencyParts = formData.frequency.split('');
    if (frequencyParts.length >= 2) {
      const freq1 = frequencyParts[0] + frequencyParts[1];
      const freq2 = frequencyParts[2] + (frequencyParts[3] || '');
      
      const frequencyIndex1 = this.data.frequencyOptions1.indexOf(freq1);
      const frequencyIndex2 = this.data.frequencyOptions2.indexOf(freq2);
      
      this.setData({
        frequencyIndex1: frequencyIndex1 >= 0 ? frequencyIndex1 : 1,
        frequencyIndex2: frequencyIndex2 >= 0 ? frequencyIndex2 : 1
      });
    }
    
    this.setData({
      typeIndex: typeIndex,
      usageYearsIndex: usageYearsIndex >= 0 ? usageYearsIndex : 0
    });
  },

  /**
   * 检测表单内容是否有变化（相对于空表单）
   */
  hasFormChanged() {
    const { formData } = this.data;
    
    // 检查是否有内容变化
    const hasContent = 
      formData.type.trim() !== '' ||
      formData.title.trim() !== '' ||
      formData.purchaseDate !== '' ||
      formData.frequency !== '' ||
      formData.environment.trim().length > 0 ||
      formData.mainContent.trim() !== '' ||
      formData.mainImages.length > 0 ||
      formData.receiptImages.length > 0 ||
      formData.recommend.some(item => item && item.trim().length > 0) ||
      formData.usageYears !== '' ||
      formData.castingScore !== 8 ||
      formData.durabilityScore !== 8 ||
      formData.costScore !== 8;
    
    return hasContent;
  },

  /**
   * 检测是否需要保存草稿
   */
  needSaveDraft() {
    // 只有当表单有内容变化时才需要保存草稿
    return this.hasFormChanged();
  },

  /**
   * 处理页面退出
   */
  handlePageExit() {
    console.log('handlePageExit被调用');
    console.log('是否需要保存草稿:', this.needSaveDraft());
    
    // 标记页面已处理返回事件，防止自定义导航栏执行默认返回
    this._backHandled = true;
    
    if (!this.needSaveDraft()) {
      // 没有需要保存的内容，直接退出
      console.log('没有需要保存的内容，直接退出');
      this.exitPage();
      return;
    }
    
    // 有内容需要保存，询问是否保存草稿
    console.log('有内容需要保存，弹出询问对话框');
    wx.showModal({
      title: '保存草稿',
      content: '检测到您有未保存的内容，是否保存为草稿？',
      confirmText: '是',
      cancelText: '否',
      success: (res) => {
        if (res.confirm) {
          console.log('用户选择保存草稿');
          this.onSaveDraft(); // 调用API保存草稿
        } else {
          console.log('用户选择不保存草稿');
        }
        this.exitPage();
      },
      fail: () => {
        // 如果弹窗失败，重置标记
        this._backHandled = false;
      }
    });
  },

  // 本地存储草稿方法已删除，现在使用API保存草稿

  /**
   * 退出页面
   */
  exitPage() {
    wx.navigateBack();
  },

  /**
   * 装备类型选择
   */
  onTypeChange(e) {
    const index = e.detail.value;
    this.setData({
      typeIndex: index,
      'formData.type': this.data.typeOptions[index]
    });
    this.clearError('type');
  },

  /**
   * 标题输入
   */
  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    });
    this.clearError('title');
  },

  /**
   * 购入日期选择
   */
  onPurchaseDateChange(e) {
    this.setData({
      'formData.purchaseDate': e.detail.value
    });
    this.clearError('purchaseDate');
  },

  /**
   * 使用频次第一个选择器
   */
  onFrequency1Change(e) {
    const index = e.detail.value;
    this.setData({
      frequencyIndex1: index
    });
    this.updateFrequency();
  },

  /**
   * 使用频次第二个选择器
   */
  onFrequency2Change(e) {
    const index = e.detail.value;
    this.setData({
      frequencyIndex2: index
    });
    this.updateFrequency();
  },

  /**
   * 更新组合频次
   */
  updateFrequency() {
    const { frequencyIndex1, frequencyIndex2, frequencyOptions1, frequencyOptions2 } = this.data;
    if (frequencyIndex1 >= 0 && frequencyIndex2 >= 0) {
      const frequency = `${frequencyOptions1[frequencyIndex1]}${frequencyOptions2[frequencyIndex2]}小时`;
      this.setData({
        'formData.frequency': frequency
      });
      this.clearError('frequency');
    }
  },

  /**
   * 使用环境复选框点击
   */
  /**
   * 使用环境输入
   */
  onEnvironmentInput(e) {
    const value = e.detail.value;
    this.setData({
      'formData.environment': value
    });
    this.clearError('environment');
  },

  /**
   * 主要内容输入
   */
  onMainContentInput(e) {
    const value = e.detail.value;
    this.setData({
      'formData.mainContent': value,
      showPlaceholder: value.length === 0
    });
    this.clearError('mainContent');
  },

  /**
   * 主要内容获得焦点
   */
  onMainContentFocus() {
    this.setData({
      showPlaceholder: false
    });
  },

  /**
   * 主要内容失去焦点
   */
  onMainContentBlur() {
    this.setData({
      showPlaceholder: this.data.formData.mainContent.length === 0
    });
  },

  /**
   * 使用年限选择
   */
  onUsageYearsChange(e) {
    const index = e.detail.value;
    this.setData({
      usageYearsIndex: index,
      'formData.usageYears': this.data.usageYearsOptions[index]
    });
    this.clearError('usageYears');
  },

  /**
   * 星级评分触摸开始
   */
  onStarTouchStart(e) {
    this.updateStarRating(e);
  },

  /**
   * 星级评分触摸移动
   */
  onStarTouchMove(e) {
    this.updateStarRating(e);
  },

  /**
   * 星级评分触摸结束
   */
  onStarTouchEnd(e) {
    // 触摸结束时不需要额外处理
  },

  /**
   * 更新星级评分
   */
  updateStarRating(e) {
    const { type } = e.currentTarget.dataset;
    const touch = e.touches[0];
    const query = wx.createSelectorQuery();
    
    query.select('.stars-container').boundingClientRect((rect) => {
      if (!rect) return;
      
      const x = touch.clientX - rect.left;
      const starWidth = rect.width / 5;
      const starIndex = Math.floor(x / starWidth);
      const starProgress = (x % starWidth) / starWidth;
      
      let score;
      if (starProgress < 0.5) {
        // 半星：x.5分
        score = starIndex + 0.5;
      } else {
        // 整星：x分
        score = starIndex + 1;
      }
      
      // 限制评分范围在0.5-5之间
      score = Math.max(0.5, Math.min(5, score));
      
      this.setData({
        [`formData.${type}`]: score
      });
      this.clearError(type);
    }).exec();
  },

  /**
   * 推荐理由输入
   */
  onRecommendInput(e) {
    const { index } = e.currentTarget.dataset;
    const value = e.detail.value;
    const recommend = [...this.data.formData.recommend];
    recommend[index] = value;
    this.setData({
      'formData.recommend': recommend
    });
    this.clearError('recommend');
  },

  /**
   * 添加推荐理由
   */
  onAddRecommend() {
    const recommend = [...this.data.formData.recommend];
    if (recommend.length < 5) {
      recommend.push('');
      this.setData({
        'formData.recommend': recommend
      });
    } else {
      wx.showToast({
        title: '最多只能添加5条推荐理由',
        icon: 'none'
      });
    }
  },

  /**
   * 删除推荐理由
   */
  onDeleteRecommend(e) {
    const { index } = e.currentTarget.dataset;
    const recommend = [...this.data.formData.recommend];
    if (recommend.length > 1) {
      recommend.splice(index, 1);
      this.setData({
        'formData.recommend': recommend
      });
    }
  },

  /**
   * 选择图片
   */
  async onChooseImage() {
    const imageUploadUtils = require('../../utils/imageUploadUtils');
    const { mainImages, maxImages } = this.data.formData;
    const remainingCount = maxImages - mainImages.length;
    
    if (remainingCount <= 0) {
      wx.showToast({
        title: `最多只能上传${maxImages}张图片`,
        icon: 'none'
      });
      return;
    }
    
    try {
      // 使用优化后的图片选择和上传工具
      const fileIDs = await imageUploadUtils.chooseAndUploadImages({
        count: remainingCount,
        prefix: 'posts',
        showLoading: true
      });
      
      if (!fileIDs || fileIDs.length === 0) {
        return;
      }
      
      // 更新表单数据
      const updatedImages = [...this.data.formData.mainImages, ...fileIDs];
      this.setData({
        'formData.mainImages': updatedImages
      });
      
      // 保存草稿
      this.onSaveDraft();
      
      wx.showToast({
        title: '图片上传成功',
        icon: 'success'
      });
      
      // 清除错误提示
      this.clearError('mainImages');
    } catch (error) {
      wx.hideLoading();
      console.error('选择图片失败:', error);
      wx.showToast({
        title: '选择图片失败',
        icon: 'none'
      });
    }
  },

  /**
   * 预览图片
   */
  onPreviewImage(e) {
    const { index } = e.currentTarget.dataset;
    const { mainImages } = this.data.formData;
    
    wx.previewImage({
      current: mainImages[index],
      urls: mainImages
    });
  },

  /**
   * 删除图片
   */
  onDeleteImage(e) {
    const { index } = e.currentTarget.dataset;
    const { mainImages } = this.data.formData;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          const newImages = mainImages.filter((_, i) => i !== index);
          this.setData({
            'formData.mainImages': newImages
          });
        }
      }
    });
  },

  /**
   * 选择购买凭证图片
   */
  async onChooseReceiptImage() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      });
      
      if (res.tempFiles && res.tempFiles.length > 0) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const receiptImages = [...this.data.formData.receiptImages];
        receiptImages.push(tempFilePath);
        
        this.setData({
          'formData.receiptImages': receiptImages
        });
        
        // 清除相关错误
        this.clearError('receiptImages');
      }
    } catch (error) {
      console.error('选择购买凭证图片失败:', error);
      wx.showToast({
        title: '选择图片失败',
        icon: 'none'
      });
    }
  },

  /**
   * 预览购买凭证图片
   */
  onPreviewReceiptImage(e) {
    const { index } = e.currentTarget.dataset;
    const current = this.data.formData.receiptImages[index];
    
    wx.previewImage({
      current: current,
      urls: this.data.formData.receiptImages
    });
  },

  /**
   * 删除购买凭证图片
   */
  onDeleteReceiptImage(e) {
    const { index } = e.currentTarget.dataset;
    const receiptImages = [...this.data.formData.receiptImages];
    receiptImages.splice(index, 1);
    
    this.setData({
      'formData.receiptImages': receiptImages
    });
    
    // 清除相关错误
    this.clearError('receiptImages');
  },

  /**
   * 清除错误信息
   */
  clearError(field) {
    const errors = { ...this.data.errors };
    delete errors[field];
    this.setData({ errors });
  },

  /**
   * 设置错误信息
   */
  setError(field, message) {
    this.setData({
      [`errors.${field}`]: message
    });
  },

  /**
   * 验证表单
   */
  validateForm() {
    const { formData } = this.data;
    const errors = {};
    
    // 验证装备类型
    if (!formData.type) {
      errors.type = '请选择装备类型';
    }
    
    // 验证标题
    if (!formData.title || formData.title.trim().length === 0) {
      errors.title = '请输入标题';
    } else if (formData.title.length > 50) {
      errors.title = '标题不能超过50个字符';
    }
    
    // 验证购入日期
    if (!formData.purchaseDate) {
      errors.purchaseDate = '请选择购入日期';
    }
    
    // 验证使用频次
    if (!formData.frequency) {
      errors.frequency = '请选择使用频次';
    }
    
    // 验证使用环境
    if (!formData.environment || formData.environment.trim().length === 0) {
      errors.environment = '请填写使用环境';
    }
    
    // 验证主要内容
    if (!formData.mainContent || formData.mainContent.trim().length === 0) {
      errors.mainContent = '请输入主要内容';
    } else if (formData.mainContent.length > 200) {
      errors.mainContent = '主要内容不能超过200个字符';
    }
    
    // 验证图片
    if (!formData.mainImages || formData.mainImages.length === 0) {
      errors.mainImages = '请至少上传一张图片';
    }
    
    // 验证推荐理由
    const validRecommends = formData.recommend.filter(item => item && item.trim().length > 0);
    if (validRecommends.length === 0) {
      errors.recommend = '请至少填写一条推荐理由';
    }
    
    // 验证
    if (!formData.usageYears) {
      errors.usageYears = '请选择使用年限';
    }
    
    // 验证评分
    if (!formData.castingScore && formData.castingScore !== 0) {
      errors.castingScore = '请选择抛投评分';
    }
    
    if (!formData.durabilityScore && formData.durabilityScore !== 0) {
      errors.durabilityScore = '请选择耐用性评分';
    }
    
    if (!formData.costScore && formData.costScore !== 0) {
      errors.costScore = '请选择性价比评分';
    }
    
    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  /**
   * 生成唯一ID
   */
  generateId() {
    return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * 提交表单
   */
  async onSubmit() {
    if (this.data.submitting) {
      return;
    }
    
    // 检查登录状态
    const AuthService = require('../../services/auth.js');
    try {
      await AuthService.ensureLogin();
    } catch (error) {
      console.log('用户取消登录');
      return;
    }
    
    // 验证表单
    if (!this.validateForm()) {
      wx.showToast({
        title: '请检查表单信息',
        icon: 'none'
      });
      return;
    }
    
    try {
      this.setData({ submitting: true });
      wx.showLoading({ title: '发布中...' });
      
      // 准备提交数据
      const { formData } = this.data;
      const imageUploadUtils = require('../../utils/imageUploadUtils');
      // 上传图片到独立后台
      console.log('开始上传图片到独立后台');
      const cloudImages = [];
      const cloudReceiptImages = [];
      const mainImageQueue = splitUploadQueue(formData.mainImages);
      const receiptImageQueue = splitUploadQueue(formData.receiptImages);
      
      if (mainImageQueue.pending.length > 0) {
        wx.showLoading({ title: '上传图片中...', mask: true });
        
        // 批量上传图片
        const fileIDs = await imageUploadUtils.batchUploadImages(mainImageQueue.pending, 'posts');
        
        // 合并已有的远程图片和新上传的图片
        cloudImages.push(...mainImageQueue.existing, ...fileIDs);
      } else {
        // 所有图片已经是远程路径
        cloudImages.push(...formData.mainImages);
      }
      
      if (receiptImageQueue.pending.length > 0) {
        wx.showLoading({ title: '上传购买凭证中...', mask: true });
        
        // 批量上传购买凭证图片
        const receiptFileIDs = await imageUploadUtils.batchUploadImages(receiptImageQueue.pending, 'receipts');
        
        // 合并已有的远程图片和新上传的图片
        cloudReceiptImages.push(...receiptImageQueue.existing, ...receiptFileIDs);
      } else {
        // 所有图片已经是远程路径
        cloudReceiptImages.push(...formData.receiptImages);
      }
      
      console.log('主要图片上传完成:', cloudImages);
      console.log('购买凭证图片上传完成:', cloudReceiptImages);
      
      // 计算使用年限数值
      const usageYearsMap = {
        '2年': 2,
        '3年': 3,
        '4年': 4,
        '5年': 5,
        '5年以上': 6
      };
      
      // 过滤有效的推荐理由
      const validRecommends = formData.recommend.filter(item => item && item.trim().length > 0);
      
      // 获取用户信息
      const AuthService = require('../../services/auth.js');
      const userInfo = AuthService.userInfo || {};
      
      // 确保评分字段是数字类型
      const castingScore = typeof formData.castingScore === 'number' ? formData.castingScore : parseFloat(formData.castingScore) || 0;
      const durabilityScore = typeof formData.durabilityScore === 'number' ? formData.durabilityScore : parseFloat(formData.durabilityScore) || 0;
      const costScore = typeof formData.costScore === 'number' ? formData.costScore : parseFloat(formData.costScore) || 0;
      
      // 创建新数据，使用API文档要求的字段格式
      const newData = {
        title: formData.title,
        content: formData.mainContent,
        contentImages: cloudImages.join(','), // 图片路径用逗号分隔
        coverImg: cloudImages.length > 0 ? cloudImages[0] : null,
        categoryKey: null,
        receipt: cloudReceiptImages.join(','), // 购买凭证图片路径用逗号分隔
        castingRate: parseFloat(castingScore.toFixed(1)),
        worthRate: parseFloat(costScore.toFixed(1)),
        lifeRate: parseFloat(durabilityScore.toFixed(1)),
        usagePeriod: formData.usageYears,
        usageRate: formData.frequency,
        recommendReason: JSON.stringify(validRecommends),
        id: formData.id
      };
      
      // 发布帖子到服务器
      const publishResult = await this.addToDataFile(newData);
      
      // 本地草稿逻辑已删除
      
      wx.hideLoading();
      wx.showToast({
        title: Number(publishResult && publishResult.status) === 1 ? '已提交审核' : '发布成功',
        icon: 'success',
        duration: 2000
      });
      
      // 延迟跳转
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
      
    } catch (error) {
      console.error('发布失败:', error);
      wx.showToast({
        title: '发布失败',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
      wx.hideLoading();
    }
  },

  // 保存草稿方法
  async onSaveDraft() {
    if (this.data.savingDraft || this.data.submitting) {
      return;
    }
    
    // 检查登录状态
    const AuthService = require('../../services/auth.js');
    try {
      await AuthService.ensureLogin();
    } catch (error) {
      console.log('用户取消登录');
      return;
    }
    
    // 基本验证 - 草稿只需要标题和内容
    const { formData } = this.data;
    if (!formData.title || !formData.title.trim()) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      });
      return;
    }
    
    if (!formData.mainContent || !formData.mainContent.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }
    
    try {
      this.setData({ savingDraft: true });
      wx.showLoading({ title: '保存草稿中...' });
      
      // 准备草稿数据
      const imageUploadUtils = require('../../utils/imageUploadUtils');
      const cloudImages = [];
      const cloudReceiptImages = [];
      
      // 检查主图片是否需要上传到独立后台
      const mainImageQueue = splitUploadQueue(formData.mainImages);
      
      if (mainImageQueue.pending.length > 0) {
        wx.showLoading({ title: '上传主图片中...', mask: true });
        
        // 批量上传图片
        const fileIDs = await imageUploadUtils.batchUploadImages(mainImageQueue.pending, 'drafts');
        
        // 合并已有的远程图片和新上传的图片
        cloudImages.push(...mainImageQueue.existing, ...fileIDs);
      } else {
        // 所有图片已经是远程路径
        cloudImages.push(...formData.mainImages);
      }
      
      // 检查购买凭证图片是否需要上传到独立后台
      const receiptImageQueue = splitUploadQueue(formData.receiptImages);
      
      if (receiptImageQueue.pending.length > 0) {
        wx.showLoading({ title: '上传购买凭证中...', mask: true });
        
        // 批量上传购买凭证图片
        const receiptFileIDs = await imageUploadUtils.batchUploadImages(receiptImageQueue.pending, 'receipts');
        
        // 合并已有的远程图片和新上传的图片
        cloudReceiptImages.push(...receiptImageQueue.existing, ...receiptFileIDs);
      } else {
        // 所有图片已经是远程路径
        cloudReceiptImages.push(...formData.receiptImages);
      }
      
      console.log('草稿主图片上传完成:', cloudImages);
      console.log('草稿购买凭证图片上传完成:', cloudReceiptImages);
      
      // 过滤有效的推荐理由
      const validRecommends = formData.recommend.filter(item => item && item.trim().length > 0);
      
      // 构建草稿数据 - 按照API要求的格式
      // 确保评分字段是数字类型
      const castingScore = typeof formData.castingScore === 'number' ? formData.castingScore : parseFloat(formData.castingScore) || 0;
      const durabilityScore = typeof formData.durabilityScore === 'number' ? formData.durabilityScore : parseFloat(formData.durabilityScore) || 0;
      const costScore = typeof formData.costScore === 'number' ? formData.costScore : parseFloat(formData.costScore) || 0;
      
      const draftData = {
        title: formData.title,
        content: formData.mainContent,
        contentImages: cloudImages.join(','), // 图片路径用逗号分隔
        coverImg: cloudImages.length > 0 ? cloudImages[0] : null, // 使用第一张图片作为封面
        categoryKey: formData.type, // 装备类型
        receipt: cloudReceiptImages.join(','),
        castingRate: parseFloat(castingScore.toFixed(1)), // 保持小数格式
        worthRate: parseFloat(costScore.toFixed(1)), // 保持小数格式
        lifeRate: parseFloat(durabilityScore.toFixed(1)), // 保持小数格式
        usagePeriod: formData.usageYears,
        usageRate: formData.frequency, // 使用频次
        recommendReason: JSON.stringify(validRecommends), // 改为JSON数组格式
        environment: formData.environment, // 新增environment字段
        id: formData.id // 使用formData中的id值
      };
      
      // 调用保存草稿API
      console.log('[发布页面] 开始调用保存草稿API');
      console.log('[发布页面] 草稿数据:', draftData);
      
      const draftResponse = await apiService.createTopic(draftData);
      
      // API服务返回的是处理后的数据，成功时返回data字段的值或true
      if (draftResponse !== null && draftResponse !== undefined) {
        // 将返回的data值赋给id字段，并更新到formData中
        draftData.id = draftResponse;
        this.setData({
          'formData.id': draftResponse
        });
        console.log('[发布页面] 草稿保存成功，ID:', draftResponse);
        
        wx.hideLoading();
        wx.showToast({
          title: '草稿保存成功',
          icon: 'success',
          duration: 2000
        });
        
        // 更新本地草稿状态
        this.setData({
          hasDraft: true,
          initialFormData: JSON.parse(JSON.stringify(formData))
        });
        
      } else {
        console.warn('[发布页面] 草稿保存失败:', draftResponse);
        wx.showToast({
          title: '草稿保存失败',
          icon: 'none'
        });
      }
      
    } catch (error) {
      console.error('保存草稿失败:', error);
      wx.showToast({
        title: '保存草稿失败',
        icon: 'none'
      });
    } finally {
      this.setData({ savingDraft: false });
      wx.hideLoading();
    }
  },

  /**
   * 根据类型获取分类ID
   */
  getCategoryIdByType(type) {
    const categoryMap = {
      '竿': 1,
      '轮': 2,
      '线': 3,
      '饵': 4,
      '其他': 5
    };
    return categoryMap[type] || 5; // 默认为其他分类
  },

  /**
   * 格式化日期
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 添加数据到data01.js文件（模拟）
   */
  async addToDataFile(newData) {
    try {
      // 通过API将数据发送到服务器
      console.log('发布新帖子:', newData);
      const api = require('../../services/api.js');
      const response = await apiService.publishTopic(newData);
      
      if (response && (response.status === 1 || response.status === 2)) {
        console.log('帖子发布成功:', response);
        // 触发首页数据刷新
        getApp().globalData.needRefreshIndex = true;
        return response;
      } else {
        throw new Error('发布失败');
      }
      
    } catch (error) {
      console.error('发布帖子失败:', error);
      throw error;
    }
  },

  /**
   * 切换提示折叠状态
   */
  onToggleTips() {
    this.setData({
      tipsExpanded: !this.data.tipsExpanded
    });
  },



  /**
   * 重置表单
   */
  onReset() {
    wx.showModal({
      title: '确认重置',
      content: '确定要清空所有内容吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            formData: {
              type: '',
              title: '',
              purchaseDate: '',
              frequency: '',
              environment: '',
              mainContent: '',
              mainImages: [],
              receiptImages: [],
              recommend: [''],
              usageYears: '',
              castingScore: '',
              durabilityScore: '',
              costScore: '',
              id: null
            },
            typeIndex: -1,
            frequencyIndex1: -1,
            frequencyIndex2: -1,
            usageYearsIndex: -1,
            castingScoreIndex: -1,
            durabilityScoreIndex: -1,
            costScoreIndex: -1,
            errors: {},
            showPlaceholder: true
          });
        }
      }
    });
  },

  /**
   * 初始化导航栏高度
   */
  initNavBarHeight: function() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 44;
    const navBarHeight = 44; // 导航栏固定高度
    
    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight
    });
  },

  /**
   * 初始化主题模式
   */
  initThemeMode: function() {
    const app = getApp();
    const isDarkMode = app.globalData.isDarkMode || false;
    this.setData({
      containerClass: isDarkMode ? 'dark-mode' : ''
    });
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
});
