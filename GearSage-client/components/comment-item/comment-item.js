// components/comment-item/comment-item.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    comment: {
      type: Object,
      value: {}
    },
    isAdmin: {
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
    // 点赞评论
    onLikeComment() {
      const comment = this.data.comment;
      const newLikeCount = comment.isLiked ? comment.likeCount - 1 : comment.likeCount + 1;
      const newIsLiked = !comment.isLiked;
      
      this.setData({
        'comment.likeCount': newLikeCount,
        'comment.isLiked': newIsLiked
      });

      // 触发父组件事件
      this.triggerEvent('likeComment', {
        commentId: comment.id,
        isLiked: newIsLiked
      });
    },

    // 回复评论
    onReplyComment() {
      this.triggerEvent('replyComment', {
        commentId: this.data.comment.id,
        username: this.data.comment.username
      });
    },

    // 删除评论（管理员功能）
    onDeleteComment() {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条评论吗？',
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent('deleteComment', {
              commentId: this.data.comment.id
            });
          }
        }
      });
    }
  }
});