// services/cloudDB.js

/**
 * 云数据库操作服务
 */
class CloudDBService {
  constructor() {
    this.db = null;
    this.init();
  }

  /**
   * 初始化云数据库
   */
  init() {
    if (wx.cloud) {
      this.db = wx.cloud.database();
    } else {
      console.warn('云开发未初始化');
    }
  }

  /**
   * 获取数据库实例
   */
  getDB() {
    if (!this.db) {
      this.init();
    }
    return this.db;
  }

  // ========== 帖子相关操作 ==========
  
  /**
   * 获取帖子列表
   */
  async getPosts(options = {}) {
    try {
      const db = this.getDB();
      let query = db.collection('posts');
      
      // 添加查询条件
      if (options.status) {
        query = query.where({ status: options.status });
      }
      
      // 排序
      if (options.orderBy) {
        query = query.orderBy(options.orderBy, options.order || 'desc');
      } else {
        query = query.orderBy('createTime', 'desc');
      }
      
      // 分页
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.skip) {
        query = query.skip(options.skip);
      }
      
      const res = await query.get();
      return res.data;
    } catch (error) {
      console.error('获取帖子列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取帖子详情
   */
  async getPostDetail(postId) {
    try {
      const db = this.getDB();
      const res = await db.collection('posts').doc(postId).get();
      return res.data;
    } catch (error) {
      console.error('获取帖子详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建帖子
   */
  async createPost(postData) {
    try {
      const db = this.getDB();
      const res = await db.collection('posts').add({
        data: {
          ...postData,
          createTime: new Date(),
          updateTime: new Date(),
          status: 'pending', // 待审核
          likeCount: 0,
          commentCount: 0,
          viewCount: 0
        }
      });
      return res;
    } catch (error) {
      console.error('创建帖子失败:', error);
      throw error;
    }
  }

  /**
   * 更新帖子
   */
  async updatePost(postId, updateData) {
    try {
      const db = this.getDB();
      const res = await db.collection('posts').doc(postId).update({
        data: {
          ...updateData,
          updateTime: new Date()
        }
      });
      return res;
    } catch (error) {
      console.error('更新帖子失败:', error);
      throw error;
    }
  }

  /**
   * 删除帖子
   */
  async deletePost(postId) {
    try {
      const db = this.getDB();
      const res = await db.collection('posts').doc(postId).remove();
      return res;
    } catch (error) {
      console.error('删除帖子失败:', error);
      throw error;
    }
  }

  // ========== 评论相关操作 ==========
  
  /**
   * 获取评论列表
   */
  async getComments(postId, options = {}) {
    try {
      const db = this.getDB();
      let query = db.collection('comments').where({ postId });
      
      // 排序
      query = query.orderBy('createTime', options.order || 'asc');
      
      // 分页
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.skip) {
        query = query.skip(options.skip);
      }
      
      const res = await query.get();
      return res.data;
    } catch (error) {
      console.error('获取评论列表失败:', error);
      throw error;
    }
  }

  /**
   * 创建评论
   */
  async createComment(commentData) {
    try {
      const db = this.getDB();
      const res = await db.collection('comments').add({
        data: {
          ...commentData,
          createTime: new Date(),
          likeCount: 0
        }
      });
      
      // 更新帖子评论数
      await this.updatePost(commentData.postId, {
        commentCount: db.command.inc(1)
      });
      
      return res;
    } catch (error) {
      console.error('创建评论失败:', error);
      throw error;
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId, postId) {
    try {
      const db = this.getDB();
      const res = await db.collection('comments').doc(commentId).remove();
      
      // 更新帖子评论数
      await this.updatePost(postId, {
        commentCount: db.command.inc(-1)
      });
      
      return res;
    } catch (error) {
      console.error('删除评论失败:', error);
      throw error;
    }
  }

  // ========== 点赞相关操作 ==========
  
  /**
   * 点赞帖子
   */
  async likePost(postId, userId) {
    try {
      const db = this.getDB();
      
      // 检查是否已点赞
      const likeRes = await db.collection('likes')
        .where({ postId, userId, type: 'post' })
        .get();
      
      if (likeRes.data.length > 0) {
        throw new Error('已经点赞过了');
      }
      
      // 添加点赞记录
      await db.collection('likes').add({
        data: {
          postId,
          userId,
          type: 'post',
          createTime: new Date()
        }
      });
      
      // 更新帖子点赞数
      await this.updatePost(postId, {
        likeCount: db.command.inc(1)
      });
      
      return true;
    } catch (error) {
      console.error('点赞帖子失败:', error);
      throw error;
    }
  }

  /**
   * 取消点赞帖子
   */
  async unlikePost(postId, userId) {
    try {
      const db = this.getDB();
      
      // 删除点赞记录
      await db.collection('likes')
        .where({ postId, userId, type: 'post' })
        .remove();
      
      // 更新帖子点赞数
      await this.updatePost(postId, {
        likeCount: db.command.inc(-1)
      });
      
      return true;
    } catch (error) {
      console.error('取消点赞失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否点赞了帖子
   */
  async checkUserLiked(postId, userId) {
    try {
      const db = this.getDB();
      const res = await db.collection('likes')
        .where({ postId, userId, type: 'post' })
        .get();
      
      return res.data.length > 0;
    } catch (error) {
      console.error('检查点赞状态失败:', error);
      return false;
    }
  }

  // ========== 文件上传 ==========
  
  /**
   * 上传单个文件
   */
  async uploadFile(filePath, cloudPath) {
    try {
      const res = await wx.cloud.uploadFile({
        filePath,
        cloudPath
      });
      return res.fileID;
    } catch (error) {
      console.error('上传文件失败:', error);
      throw error;
    }
  }

  /**
   * 批量上传图片
   */
  async uploadImages(imagePaths) {
    try {
      const uploadTasks = imagePaths.map((path, index) => {
        const cloudPath = `uploads/${Date.now()}-${index}`;
        return this.uploadFile(path, cloudPath);
      });
      
      const fileIDs = await Promise.all(uploadTasks);
      return fileIDs;
    } catch (error) {
      console.error('批量上传图片失败:', error);
      throw error;
    }
  }
}

module.exports = new CloudDBService();