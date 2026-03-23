// components/admin-panel/admin-panel.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    post: {
      type: Object,
      value: {}
    },
    visible: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 关闭面板
    onClose() {
      this.triggerEvent('close');
    },

    // 审核通过
    onApprove() {
      wx.showModal({
        title: '确认操作',
        content: '确定要审核通过这篇帖子吗？',
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent('approve', {
              postId: this.data.post.id
            });
          }
        }
      });
    },

    // 审核拒绝
    onReject() {
      wx.showModal({
        title: '确认操作',
        content: '确定要拒绝这篇帖子吗？',
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent('reject', {
              postId: this.data.post.id
            });
          }
        }
      });
    },

    // 删除帖子
    onDelete() {
      wx.showModal({
        title: '危险操作',
        content: '确定要删除这篇帖子吗？此操作不可恢复！',
        confirmColor: '#ff4757',
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent('delete', {
              postId: this.data.post.id
            });
          }
        }
      });
    },

    // 置顶帖子
    onPin() {
      const action = this.data.post.isPinned ? 'unpin' : 'pin';
      const actionText = this.data.post.isPinned ? '取消置顶' : '置顶';
      
      wx.showModal({
        title: '确认操作',
        content: `确定要${actionText}这篇帖子吗？`,
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent(action, {
              postId: this.data.post.id
            });
          }
        }
      });
    },

    // 阻止冒泡
    onPanelTap() {
      // 阻止事件冒泡
    }
  }
});