// pages/test-duplicate/test-duplicate.js
Page({
  data: {
    formData: {
      title: '',
      content: '',
      mainImages: []
    },
    errors: {}
  },

  onLoad() {
    console.log('重复图片检测测试页面加载');
  },

  onChooseImage(e) {
    console.log('选择图片事件:', e.detail);
    this.setData({
      'formData.mainImages': e.detail.value
    });
  },

  onDeleteImage(e) {
    console.log('删除图片事件:', e.detail);
    this.setData({
      'formData.mainImages': e.detail.value
    });
  },

  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    });
  },

  onContentInput(e) {
    this.setData({
      'formData.content': e.detail.value
    });
  }
});