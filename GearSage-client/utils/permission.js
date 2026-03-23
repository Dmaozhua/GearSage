// utils/permission.js
const auth = require('../services/auth.js');

/**
 * 权限管理工具类
 */
class Permission {
  /**
   * 检查是否为管理员
   */
  static isAdmin() {
    return auth.checkAdminPermission();
  }

  /**
   * 检查用户是否已登录
   */
  static isLoggedIn() {
    return auth.checkLoginStatus();
  }

  /**
   * 获取当前用户ID
   */
  static getCurrentUserId() {
    const userInfo = auth.getCurrentUser();
    return userInfo ? userInfo.id : null;
  }

  /**
   * 检查是否为帖子作者
   */
  static isPostAuthor(post) {
    const currentUserId = this.getCurrentUserId();
    return currentUserId && post.userId === currentUserId;
  }

  /**
   * 检查是否为评论作者
   */
  static isCommentAuthor(comment) {
    const currentUserId = this.getCurrentUserId();
    return currentUserId && comment.userId === currentUserId;
  }

  /**
   * 检查是否可以编辑帖子
   * 规则：只有帖子作者可以编辑自己的帖子
   */
  static canEditPost(post) {
    return this.isPostAuthor(post);
  }

  /**
   * 检查是否可以删除帖子
   * 规则：管理员可以删除任何帖子，用户只能删除自己的帖子
   */
  static canDeletePost(post) {
    return this.isAdmin() || this.isPostAuthor(post);
  }

  /**
   * 检查是否可以删除评论
   * 规则：管理员可以删除任何评论，用户只能删除自己的评论
   */
  static canDeleteComment(comment) {
    return this.isAdmin() || this.isCommentAuthor(comment);
  }

  /**
   * 检查是否可以审核帖子
   * 规则：只有管理员可以审核
   */
  static canAuditPost() {
    return this.isAdmin();
  }

  /**
   * 检查是否可以置顶帖子
   * 规则：只有管理员可以置顶
   */
  static canPinPost() {
    return this.isAdmin();
  }

  /**
   * 检查是否可以发布帖子
   * 规则：已登录用户都可以发布
   */
  static canCreatePost() {
    return this.isLoggedIn();
  }

  /**
   * 检查是否可以评论
   * 规则：已登录用户都可以评论
   */
  static canComment() {
    return this.isLoggedIn();
  }

  /**
   * 检查是否可以点赞
   * 规则：已登录用户都可以点赞
   */
  static canLike() {
    return this.isLoggedIn();
  }

  /**
   * 检查是否可以访问管理后台
   * 规则：只有管理员可以访问
   */
  static canAccessAdmin() {
    return this.isAdmin();
  }

  /**
   * 检查帖子是否可见
   * 规则：
   * - 已审核通过的帖子对所有人可见
   * - 待审核的帖子只对作者和管理员可见
   * - 被拒绝的帖子只对作者可见
   */
  static canViewPost(post) {
    if (post.status === 'approved') {
      return true;
    }
    
    if (post.status === 'pending') {
      return this.isAdmin() || this.isPostAuthor(post);
    }
    
    if (post.status === 'rejected') {
      return this.isPostAuthor(post);
    }
    
    return false;
  }

  /**
   * 获取用户角色标识
   */
  static getUserRole() {
    if (!this.isLoggedIn()) {
      return 'guest';
    }
    
    if (this.isAdmin()) {
      return 'admin';
    }
    
    return 'user';
  }

  /**
   * 检查功能权限
   */
  static checkPermission(action, target = null) {
    switch (action) {
      case 'create_post':
        return this.canCreatePost();
      
      case 'edit_post':
        return target ? this.canEditPost(target) : false;
      
      case 'delete_post':
        return target ? this.canDeletePost(target) : false;
      
      case 'audit_post':
        return this.canAuditPost();
      
      case 'pin_post':
        return this.canPinPost();
      
      case 'create_comment':
        return this.canComment();
      
      case 'delete_comment':
        return target ? this.canDeleteComment(target) : false;
      
      case 'like':
        return this.canLike();
      
      case 'access_admin':
        return this.canAccessAdmin();
      
      case 'view_post':
        return target ? this.canViewPost(target) : false;
      
      default:
        return false;
    }
  }

  /**
   * 权限检查装饰器（用于页面跳转前检查）
   */
  static requirePermission(action, target = null) {
    return new Promise((resolve, reject) => {
      if (!this.checkPermission(action, target)) {
        const messages = {
          'create_post': '请先登录后再发布帖子',
          'edit_post': '您没有权限编辑此帖子',
          'delete_post': '您没有权限删除此帖子',
          'audit_post': '您没有管理员权限',
          'pin_post': '您没有管理员权限',
          'create_comment': '请先登录后再评论',
          'delete_comment': '您没有权限删除此评论',
          'like': '请先登录后再点赞',
          'access_admin': '您没有管理员权限',
          'view_post': '您没有权限查看此帖子'
        };
        
        const message = messages[action] || '权限不足';
        
        wx.showToast({
          title: message,
          icon: 'none'
        });
        
        reject(new Error(message));
      } else {
        resolve(true);
      }
    });
  }

  /**
   * 引导用户登录
   */
  static async promptLogin() {
    try {
      await auth.ensureLogin();
      return true;
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  }
}

// 导出类和实例
module.exports = Permission;
module.exports.instance = new Permission();

// 为了向后兼容，也可以直接调用静态方法
module.exports.isAdmin = Permission.isAdmin;
module.exports.isLoggedIn = Permission.isLoggedIn;
module.exports.getCurrentUserId = Permission.getCurrentUserId;
module.exports.checkPermission = Permission.checkPermission;