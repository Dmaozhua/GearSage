// pages/test-cloud/test-cloud.js
Page({
  data: {
    result: '未调用云函数',
    loading: false
  },

  onLoad: function (options) {
    // 页面加载时执行
  },

  // 测试云函数调用
  testCloudFunction: function() {
    this.setData({
      loading: true,
      result: '正在调用云函数...'
    });

    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[测试页面] 云函数调用成功:', res);
        this.setData({
          result: JSON.stringify(res.result, null, 2),
          loading: false
        });
      },
      fail: err => {
        console.error('[测试页面] 云函数调用失败:', err);
        this.setData({
          result: '云函数调用失败: ' + JSON.stringify(err, null, 2),
          loading: false
        });
      }
    });
  }
})