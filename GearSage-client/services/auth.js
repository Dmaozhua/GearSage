// services/auth.js
const api = require('./api.js');
const EnvUtil = require('../utils/env.js');
const { getPendingInvite, clearPendingInvite } = require('../utils/invite.js');

/**
 * 用户认证服务
 */
class AuthService {
  constructor() {
    this.userInfo = null;
    this.isAdmin = false;
    // 防止重复弹出登录提示的锁
    this._loginPromptOpen = false;
  }

  normalizeAuthResponse(authRes) {
    if (!authRes) {
      throw new Error('登录响应数据为空');
    }

    if (typeof authRes === 'string') {
      const token = authRes;
      return {
        token,
        userInfo: {
          id: 'user_' + Date.now(),
          nickname: '钓鱼爱好者',
          avatar: '',
          isAdmin: false
        }
      };
    }

    if (authRes.token) {
      const userInfo = authRes.userInfo ? authRes.userInfo : {
        id: authRes.id,
        nickname: authRes.nickName,
        bio: authRes.bio,
        avatar: authRes.avatarUrl,
        background: authRes.background,
        shipAddress: authRes.shipAddress,
        status: authRes.status,
        points: authRes.points,
        level: authRes.level,
        openId: authRes.openId,
        inviteCode: authRes.inviteCode,
        invitedByUserId: authRes.invitedByUserId,
        inviteSuccessCount: authRes.inviteSuccessCount,
        inviteRewardPoints: authRes.inviteRewardPoints,
        isAdmin: authRes.isAdmin || false
      };
      return { token: authRes.token, userInfo };
    }

    if (authRes.data) {
      return {
        token: authRes.data.token,
        userInfo: {
          id: authRes.data.id,
          nickname: authRes.data.nickName,
          bio: authRes.data.bio,
          avatar: authRes.data.avatarUrl,
          background: authRes.data.background,
          shipAddress: authRes.data.shipAddress,
          status: authRes.data.status,
          points: authRes.data.points,
          level: authRes.data.level,
          openId: authRes.data.openId,
          inviteCode: authRes.data.inviteCode,
          invitedByUserId: authRes.data.invitedByUserId,
          inviteSuccessCount: authRes.data.inviteSuccessCount,
          inviteRewardPoints: authRes.data.inviteRewardPoints,
          isAdmin: authRes.data.isAdmin || false
        }
      };
    }

    throw new Error('未获取到有效的登录凭据');
  }

  persistAuthResult(authResult, options = {}) {
    if (!authResult) {
      return null;
    }

    const { triggerHomeRefresh = true } = options;

    wx.setStorageSync('token', authResult.token);
    wx.setStorageSync('userInfo', authResult.userInfo);
    console.log('[AuthService] 用户信息已保存到本地存储');
    // 清除手动退出标记，恢复静默登录能力
    try {
      wx.removeStorageSync('manualLogout');
      console.log('[AuthService] 已清除手动退出标记');
    } catch (e) {
      console.warn('[AuthService] 清除手动退出标记失败:', e);
    }

    if (triggerHomeRefresh) {
      try {
        wx.setStorageSync('needRefreshAfterLogin', true);
      } catch (e) {
        console.warn('[AuthService] 设置登录后刷新标记失败:', e);
      }
    }

    this.userInfo = authResult.userInfo;
    this.isAdmin = authResult.userInfo.isAdmin || false;

    console.log('[AuthService] 用户ID:', authResult.userInfo.id);
    console.log('[AuthService] 登录完成，用户权限:', this.isAdmin ? '管理员' : '普通用户');

    return authResult;
  }

  /**
   * 登录方法（wxLogin的别名）
   */
  async login() {
    console.log('[AuthService] 开始执行登录流程');
    return await this.wxLogin();
  }

  /**
   * 微信登录
   */
  async wxLogin() {
    console.log('[AuthService] 开始微信登录流程');
    const envInfo = EnvUtil.getEnvInfo();
    console.log('[AuthService] 当前运行环境:', envInfo.isDevTool ? '微信开发者工具' : '真机设备');

    try {
      // 统一使用真实的微信登录code（不再区分开发工具和真机环境）
      console.log('[AuthService] 正在获取真实微信登录code...');
      const loginRes = await this.getWxLoginCode().catch(err => {
        console.error('[AuthService] getWxLoginCode promise rejected:', err);
        throw err;
      });
      const loginCode = loginRes.code;
      console.log('[AuthService] 成功获取微信登录code:', loginCode);
      const pendingInvite = getPendingInvite();
      const loginPayload = {
        code: loginCode,
        ...(pendingInvite || {})
      };
      
      // 发送到后端换取token
      console.log('[AuthService] 正在向后端发送登录请求，使用code:', loginCode);
      const authRes = await api.post('/mini/user/login', loginPayload);
      console.log('[AuthService] 后端登录验证成功，响应数据:', authRes);

      // 验证响应数据的有效性
      if (!authRes) {
        throw new Error('登录响应数据为空');
      }
      
      console.log('[AuthService] 登录响应数据验证通过');
      
      const standardAuthRes = this.normalizeAuthResponse(authRes);
      this.persistAuthResult(standardAuthRes, { triggerHomeRefresh: true });
      clearPendingInvite();
      return standardAuthRes;
    } catch (error) {
      console.error('[AuthService] 微信登录失败:', error);
      throw error;
    }
  }

  async silentLogin() {
    console.log('[AuthService] 开始静默刷新登录状态');
    try {
      const loginRes = await this.getWxLoginCode();
      const authRes = await api.post('/mini/user/login', { code: loginRes.code }, {
        silent: true,
        skipAuthRetry: true,
        skipErrorToast: true,
        allowDuplicateRequests: true
      });
      const standardAuthRes = this.normalizeAuthResponse(authRes);
      this.persistAuthResult(standardAuthRes, { triggerHomeRefresh: false });
      return standardAuthRes;
    } catch (error) {
      console.error('[AuthService] 静默刷新token失败:', error);
      throw error;
    }
  }

  /**
   * 获取微信登录code
   */
  getWxLoginCode() {
    console.log('[AuthService] 调用wx.login()获取登录code');
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          console.log('[AuthService] wx.login()调用成功，获得code:', res.code);
          resolve(res);
        },
        fail: (error) => {
          console.error('[AuthService] wx.login()调用失败:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * 获取用户信息
   * 注意：wx.getUserProfile已被微信官方回收（2022年10月25日起）
   * 现在只会返回默认头像和"微信用户"昵称
   * 建议使用头像昵称填写能力替代
   */
  async getUserProfile() {
    return new Promise((resolve, reject) => {
      // 检查基础库版本兼容性
      if (wx.getUserProfile) {
        wx.getUserProfile({
          desc: '用于完善用户资料',
          success: (res) => {
            console.log('[AuthService] getUserProfile返回数据:', res.userInfo);
            // 由于接口已被回收，这里会返回匿名数据
            resolve(res.userInfo);
          },
          fail: (error) => {
            console.error('[AuthService] getUserProfile调用失败:', error);
            reject(error);
          }
        });
      } else {
        reject(new Error('当前微信版本不支持getUserProfile接口'));
      }
    });
  }

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    console.log('[AuthService] 检查用户登录状态');
    // 如果存在手动退出标记，直接视为未登录
    try {
      const manualLogout = wx.getStorageSync('manualLogout');
      if (manualLogout) {
        console.log('[AuthService] 检测到手动退出标记，返回未登录状态');
        return false;
      }
    } catch (e) {
      console.warn('[AuthService] 读取手动退出标记失败:', e);
    }
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.userInfo = userInfo;
      this.isAdmin = userInfo.isAdmin || false;
      console.log('[AuthService] 用户已登录，用户ID:', userInfo.id, '权限:', this.isAdmin ? '管理员' : '普通用户');
      return true;
    }
    
    console.log('[AuthService] 用户未登录');
    return false;
  }

  /**
   * 获取当前用户信息
   */
  getCurrentUser() {
    if (!this.userInfo) {
      this.userInfo = wx.getStorageSync('userInfo');
    }
    return this.userInfo;
  }

  /**
   * 检查管理员权限
   */
  checkAdminPermission() {
    return this.isAdmin;
  }

  /**
   * 退出登录
   */
  logout() {
    console.log('[AuthService] 用户退出登录');
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    // 设置手动退出标记，阻止后续的静默登录刷新
    try {
      wx.setStorageSync('manualLogout', true);
      console.log('[AuthService] 已设置手动退出标记');
    } catch (e) {
      console.warn('[AuthService] 设置手动退出标记失败:', e);
    }
    this.userInfo = null;
    this.isAdmin = false;

    // 退出后返回首页
    try {
      wx.switchTab({
        url: '/pages/index/index'
      });
      console.log('[AuthService] 已清除本地登录信息');
      console.log('[AuthService] 已跳转到首页');
    } catch (e) { /* ignore */ }
  }

  /**
   * 刷新用户信息
   */
  async refreshUserInfo() {
    console.log('[AuthService] 开始刷新用户信息...');
    try {
      const localUserInfo = wx.getStorageSync('userInfo') || {};
      const userId = localUserInfo.id || this.userInfo?.id;
      if (!userId) {
        throw new Error('缺少用户ID，无法刷新用户信息');
      }

      const res = await api.get('/mini/user/info', { data: { id: userId } });
      const userInfo = res && res.data ? res.data : res;
      console.log('[AuthService] 获取到最新用户信息:', userInfo);
      wx.setStorageSync('userInfo', userInfo);
      this.userInfo = userInfo;
      this.isAdmin = userInfo.isAdmin || false;
      console.log('[AuthService] 用户信息已更新到本地存储');
    } catch (error) {
      console.error('[AuthService] 刷新用户信息失败:', error);
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(updateData) {
    console.log('[AuthService] 更新用户信息，数据:', updateData);
    try {
      const res = await api.post('/mini/user/update', updateData);
      const userInfo = res && res.data ? res.data : res;
      // 更新本地信息
      const updatedUserInfo = {
        ...(this.userInfo || {}),
        ...userInfo
      };
      this.userInfo = updatedUserInfo;
      wx.setStorageSync('userInfo', updatedUserInfo);
      console.log('[AuthService] 更新后的用户信息:', updatedUserInfo);
    } catch (error) {
      console.error('[AuthService] 更新用户信息失败:', error);
    }
  }

  /**
   * 确保用户登录
   */
  async ensureLogin() {
    console.log('[AuthService] 确保用户已登录');
    const isLoggedIn = this.checkLoginStatus();
    if (!isLoggedIn) {
      // 显示登录提示
      console.log('[AuthService] 用户未登录，显示登录提示框');
      // 如果已有登录提示在进行，直接忽略以避免重复弹窗
      if (this._loginPromptOpen) {
        console.log('[AuthService] 登录提示已打开，跳过重复弹窗');
        throw new Error('LoginPromptAlreadyOpen');
      }
      this._loginPromptOpen = true;
      const confirmLogin = await this.showLoginModal().finally(() => {
        this._loginPromptOpen = false;
      });
      if (confirmLogin) {
        console.log('[AuthService] 用户确认登录，开始登录流程');
        return await this.wxLogin();
      } else {
        console.log('[AuthService] 用户取消登录');
        throw new Error('UserCancelledLogin');
      }
    }
    console.log('[AuthService] 用户已登录，返回用户信息');
    return this.userInfo || wx.getStorageSync('userInfo');
  }

  /**
   * 显示登录提示对话框
   */
  showLoginModal() {
    return new Promise((resolve) => {
      wx.showModal({
        title: '登录提示',
        content: '该操作需要登录，是否现在登录？',
        success(res) {
          resolve(res.confirm);
        },
        fail() {
          resolve(false);
        }
      });
    });
  }
}

module.exports = new AuthService();
