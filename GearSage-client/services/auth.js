const api = require('./api.js');
const { getPendingInvite, clearPendingInvite } = require('../utils/invite.js');

class AuthService {
  constructor() {
    this.userInfo = null;
    this.isAdmin = false;
    this._loginPromptOpen = false;
  }

  normalizeAuthResponse(authRes) {
    const payload = authRes && authRes.data ? authRes.data : authRes;
    if (!payload) {
      throw new Error('登录响应数据为空');
    }

    const token = payload.token || payload.accessToken;
    const refreshToken = payload.refreshToken || '';
    const rawUser = payload.userInfo || payload.user || payload;

    if (!token || !rawUser) {
      throw new Error('未获取到有效的登录凭据');
    }

    return {
      token,
      refreshToken,
      userInfo: {
        id: rawUser.id,
        phone: rawUser.phone || '',
        nickname: rawUser.nickname || rawUser.nickName || '',
        nickName: rawUser.nickName || rawUser.nickname || '',
        bio: rawUser.bio || '',
        avatar: rawUser.avatar || rawUser.avatarUrl || '',
        avatarUrl: rawUser.avatarUrl || rawUser.avatar || '',
        background: rawUser.background || rawUser.backgroundImage || '',
        backgroundImage: rawUser.backgroundImage || rawUser.background || '',
        shipAddress: rawUser.shipAddress || '',
        status: rawUser.status || 0,
        points: rawUser.points || 0,
        level: rawUser.level || 1,
        inviteCode: rawUser.inviteCode || '',
        invitedByUserId: rawUser.invitedByUserId || null,
        inviteSuccessCount: rawUser.inviteSuccessCount || 0,
        inviteRewardPoints: rawUser.inviteRewardPoints || 0,
        isAdmin: !!rawUser.isAdmin
      }
    };
  }

  persistAuthResult(authResult, options = {}) {
    if (!authResult) {
      return null;
    }

    const { triggerHomeRefresh = true } = options;

    wx.setStorageSync('token', authResult.token);
    wx.setStorageSync('refreshToken', authResult.refreshToken || '');
    wx.setStorageSync('userInfo', authResult.userInfo);

    try {
      wx.removeStorageSync('manualLogout');
    } catch (error) {
      console.warn('[AuthService] 清除手动退出标记失败:', error);
    }

    if (triggerHomeRefresh) {
      try {
        wx.setStorageSync('needRefreshAfterLogin', true);
      } catch (error) {
        console.warn('[AuthService] 设置登录后刷新标记失败:', error);
      }
    }

    this.userInfo = authResult.userInfo;
    this.isAdmin = !!authResult.userInfo.isAdmin;
    return authResult;
  }

  async login() {
    return new Promise((resolve, reject) => {
      wx.navigateTo({
        url: '/pages/login/login',
        events: {
          loginSuccess: (authRes) => {
            resolve(authRes);
          }
        },
        fail: (err) => {
          console.error('[AuthService] 跳转登录页失败:', err);
          reject(new Error('NavigationFailed'));
        }
      });
    });
  }

  async silentLogin() {
    const refreshToken = wx.getStorageSync('refreshToken');
    if (!refreshToken) {
      throw new Error('RefreshTokenMissing');
    }

    const authRes = await api.post('/auth/refresh', { refreshToken }, {
      silent: true,
      skipAuthRetry: true,
      skipErrorToast: true,
      allowDuplicateRequests: true
    });

    const standardAuthRes = this.normalizeAuthResponse(authRes);
    this.persistAuthResult(standardAuthRes, { triggerHomeRefresh: false });
    return standardAuthRes;
  }

  async getUserProfile() {
    return Promise.reject(new Error('当前版本已改为手机号登录'));
  }

  checkLoginStatus() {
    try {
      const manualLogout = wx.getStorageSync('manualLogout');
      if (manualLogout) {
        return false;
      }
    } catch (error) {
      console.warn('[AuthService] 读取手动退出标记失败:', error);
    }

    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token && userInfo && userInfo.id) {
      this.userInfo = userInfo;
      this.isAdmin = !!userInfo.isAdmin;
      return true;
    }

    return false;
  }

  getCurrentUser() {
    if (!this.userInfo) {
      this.userInfo = wx.getStorageSync('userInfo');
    }
    return this.userInfo;
  }

  checkAdminPermission() {
    return this.isAdmin;
  }

  async logout() {
    const refreshToken = wx.getStorageSync('refreshToken');

    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }, {
          silent: true,
          skipAuthRetry: true,
          skipErrorToast: true
        });
      }
    } catch (error) {
      console.warn('[AuthService] 服务端登出失败，继续清理本地状态:', error);
    }

    wx.removeStorageSync('token');
    wx.removeStorageSync('refreshToken');
    wx.removeStorageSync('userInfo');
    try {
      wx.setStorageSync('manualLogout', true);
    } catch (error) {
      console.warn('[AuthService] 设置手动退出标记失败:', error);
    }

    this.userInfo = null;
    this.isAdmin = false;

    try {
      wx.switchTab({ url: '/pages/index/index' });
    } catch (_error) {
      // noop
    }
  }

  async refreshUserInfo() {
    try {
      const userInfo = await api.get('/auth/me', {
        silent: true,
        skipErrorToast: true
      });
      if (userInfo && userInfo.id) {
        const currentToken = wx.getStorageSync('token');
        const currentRefreshToken = wx.getStorageSync('refreshToken');
        this.persistAuthResult({
          token: currentToken,
          refreshToken: currentRefreshToken,
          userInfo
        }, { triggerHomeRefresh: false });
      }
    } catch (error) {
      console.error('[AuthService] 刷新用户信息失败:', error);
    }
  }

  async updateUserInfo(updateData) {
    const userInfo = await api.post('/mini/user/update', updateData);
    const updatedUserInfo = {
      ...(this.userInfo || {}),
      ...(userInfo && userInfo.data ? userInfo.data : userInfo)
    };
    this.userInfo = updatedUserInfo;
    this.isAdmin = !!updatedUserInfo.isAdmin;
    wx.setStorageSync('userInfo', updatedUserInfo);
    return updatedUserInfo;
  }

  async ensureLogin() {
    const isLoggedIn = this.checkLoginStatus();
    if (!isLoggedIn) {
      if (this._loginPromptOpen) {
        throw new Error('LoginPromptAlreadyOpen');
      }

      this._loginPromptOpen = true;
      const confirmLogin = await this.showLoginModal().finally(() => {
        this._loginPromptOpen = false;
      });

      if (!confirmLogin) {
        throw new Error('UserCancelledLogin');
      }

      return this.login();
    }

    return this.userInfo || wx.getStorageSync('userInfo');
  }

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
