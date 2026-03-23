// pages/rating-test/rating-test.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 当前选择的装备类型
    currentType: '竿',
    // 装备类型选项
    typeOptions: ['竿', '轮', '线', '饵', '钩', '其他'],
    typeIndex: 0,
    // 评分数据
    ratings: {
      // 鱼竿评分
      actionScore: 0,
      sensitivityScore: 0,
      castingScore: 0,
      workmanshipScore: 0,
      durabilityScore: 0,
      // 渔轮评分
      gearRatioScore: 0,
      dragScore: 0,
      smoothnessScore: 0,
      weightScore: 0,
      // 鱼饵评分
      stabilityScore: 0,
      attractionScore: 0,
      // 鱼线评分
      strengthScore: 0,
      stretchScore: 0,
      abrasionScore: 0,
      diameterScore: 0,
      // 鱼钩评分
      sharpnessScore: 0,
      resistanceScore: 0,
      coatingScore: 0,
      designScore: 0,
      // 其他评分
      practicalityScore: 0,
      appearanceScore: 0,
      costScore: 0
    },
    // 错误信息
    errors: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('rating-test页面加载');
  },

  /**
   * 装备类型选择
   */
  onTypeChange(e) {
    const index = e.detail.value;
    const type = this.data.typeOptions[index];
    this.setData({
      typeIndex: index,
      currentType: type
    });
    console.log('装备类型切换为:', type);
  },

  /**
   * 评分变化处理
   */
  onRatingChange(e) {
    const { type, score } = e.detail;
    console.log(`评分变化: ${type} = ${score}`);
    this.setData({
      [`ratings.${type}`]: score,
      [`errors.${type}`]: '' // 清除错误信息
    });
  },

  /**
   * 验证评分
   */
  validateRatings() {
    const { ratings } = this.data;
    let errors = {};
    let isValid = true;

    // 根据当前装备类型验证对应的评分维度
    const dimensionMap = {
      '竿': ['actionScore', 'sensitivityScore', 'castingScore', 'workmanshipScore', 'durabilityScore'],
      '轮': ['gearRatioScore', 'dragScore', 'smoothnessScore', 'weightScore', 'durabilityScore'],
      '饵': ['stabilityScore', 'attractionScore', 'durabilityScore', 'workmanshipScore', 'castingScore'],
      '线': ['strengthScore', 'stretchScore', 'abrasionScore', 'diameterScore', 'durabilityScore'],
      '钩': ['sharpnessScore', 'resistanceScore', 'coatingScore', 'designScore', 'durabilityScore'],
      '其他': ['practicalityScore', 'appearanceScore', 'workmanshipScore', 'durabilityScore', 'costScore']
    };

    const currentDimensions = dimensionMap[this.data.currentType] || [];
    
    currentDimensions.forEach(dimension => {
      if (!ratings[dimension] || ratings[dimension] < 0.5) {
        errors[dimension] = '请给出评分';
        isValid = false;
      }
    });

    this.setData({ errors });
    return isValid;
  },

  /**
   * 提交测试
   */
  onSubmit() {
    if (this.validateRatings()) {
      wx.showToast({
        title: '验证通过！',
        icon: 'success'
      });
      console.log('当前评分数据:', this.data.ratings);
    } else {
      wx.showToast({
        title: '请完成所有评分',
        icon: 'none'
      });
    }
  },

  /**
   * 重置评分
   */
  onReset() {
    const resetRatings = {};
    Object.keys(this.data.ratings).forEach(key => {
      resetRatings[`ratings.${key}`] = 0;
    });
    this.setData({
      ...resetRatings,
      errors: {}
    });
    wx.showToast({
      title: '已重置',
      icon: 'success'
    });
  }
});