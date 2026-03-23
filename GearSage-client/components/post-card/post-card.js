// components/post-card/post-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    post: {
      type: Object,
      value: {}
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
    // 点击帖子卡片
    onTapPost() {
      const { id } = this.data.post;
      wx.navigateTo({
        url: `/pkgContent/detail/detail?id=${id}`
      });
    },

    // 点赞功能
    onLike() {
      const post = this.data.post;
      const newLikeCount = post.isLiked ? post.likeCount - 1 : post.likeCount + 1;
      const newIsLiked = !post.isLiked;
      
      this.setData({
        'post.likeCount': newLikeCount,
        'post.isLiked': newIsLiked
      });

      // 触发父组件事件
      this.triggerEvent('like', {
        postId: post.id,
        isLiked: newIsLiked
      });
    }
  }
});