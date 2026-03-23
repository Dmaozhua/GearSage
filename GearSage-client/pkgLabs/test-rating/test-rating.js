// pages/test-rating/test-rating.js
Page({
  data: {
    testItems: [
      { id: 1, rating: 3.7, description: '测试3.7分' },
      { id: 2, rating: 5.0, description: '测试5.0分' },
      { id: 3, rating: 2.5, description: '测试2.5分' },
      { id: 4, rating: 0.0, description: '测试0.0分' },
      { id: 5, rating: 10.0, description: '测试10.0分' }
    ]
  },

  onLoad: function() {
    // 页面加载时执行
    console.log('测试页面加载完成');
  }
});