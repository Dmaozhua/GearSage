// pages/text-editor-test/text-editor-test.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    testValue1: '这是一个测试文本，用来验证文本编辑器组件的基本功能。',
    testValue2: '这是一个很长的测试文本，用来验证文本编辑器组件在处理长文本时的表现。这个文本会超过预览模式的字符限制，所以应该会显示展开/收起按钮。让我们继续添加更多的内容来测试组件的功能。这个组件应该能够正确处理长文本的预览和编辑功能，同时保持良好的用户体验。'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('文本编辑器测试页面加载');
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('文本编辑器测试页面渲染完成');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 处理第一个文本编辑器的变化
   */
  onTextChange1(e) {
    console.log('文本编辑器1变化:', e.detail);
    this.setData({
      testValue1: e.detail.value
    });
  },

  /**
   * 处理第二个文本编辑器的变化
   */
  onTextChange2(e) {
    console.log('文本编辑器2变化:', e.detail);
    this.setData({
      testValue2: e.detail.value
    });
  }
})