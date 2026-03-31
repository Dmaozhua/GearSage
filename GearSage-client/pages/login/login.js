// pages/login/login.js
const api = require('../../services/api.js');
const auth = require('../../services/auth.js');
const { getPendingInvite, clearPendingInvite } = require('../../utils/invite.js');
const EnvUtil = require('../../utils/env.js');

function resolveLoginErrorMessage(error) {
  const responseMessage = error && error.data && (error.data.message || error.data.msg);
  const rawMessage = responseMessage || (error && error.message) || '';
  const normalized = String(rawMessage || '').trim().toLowerCase();

  if (normalized === 'user banned') {
    return '账号已被禁用';
  }

  if (normalized === 'verification code expired') {
    return '验证码已过期，请重新获取';
  }

  if (normalized === 'verification code invalid') {
    return '验证码错误，请重新输入';
  }

  if (normalized === 'verification code not found') {
    return '请先获取验证码';
  }

  return rawMessage || '登录失败，请重试';
}

function resolveSendCodeErrorMessage(error) {
  const responseMessage = error && error.data && (error.data.message || error.data.msg);
  const rawMessage = responseMessage || (error && error.message) || '';
  return rawMessage || '发送失败，请稍后重试';
}

Page({
  data: {
    phone: '',
    code: '',
    countdown: 0,
    loading: false,
    isFormValid: false,
    fromRoute: '',
    showServerDebug: false,
    apiServerTarget: '',
    apiServerBaseUrl: '',
    apiServerLabel: ''
  },

  onLoad(options) {
    if (options.fromRoute) {
      this.setData({
        fromRoute: decodeURIComponent(options.fromRoute)
      });
    }

    this.syncServerDebugState();
  },

  noop() {},

  onPhoneInput(e) {
    if (this.data.loading) return;
    const phone = e.detail.value;
    this.setData({ 
      phone,
      isFormValid: this.validateForm(phone, this.data.code)
    });
  },

  onCodeInput(e) {
    if (this.data.loading) return;
    const code = e.detail.value;
    this.setData({ 
      code,
      isFormValid: this.validateForm(this.data.phone, code)
    });
  },

  validateForm(phone, code) {
    return /^1\d{10}$/.test(phone) && code.length >= 4;
  },

  async onSendCode() {
    if (this.data.countdown > 0 || this.data.loading) return;
    
    const { phone } = this.data;
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '发送中...' });
      await api.post('/auth/send-code', { phone }, {
        skipAuthRetry: true,
        skipErrorToast: true,
        silent: true
      });
      wx.hideLoading();
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      });
      
      this.startCountdown();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: resolveSendCodeErrorMessage(error),
        icon: 'none'
      });
    }
  },

  startCountdown() {
    this.setData({ countdown: 60 });
    this.timer = setInterval(() => {
      if (this.data.countdown > 0) {
        this.setData({ countdown: this.data.countdown - 1 });
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  },

  onUnload() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },

  syncServerDebugState() {
    try {
      const app = getApp();
      const currentTarget = app && typeof app.syncApiServerTarget === 'function'
        ? app.syncApiServerTarget()
        : api.getCurrentServerTarget();

      if (!currentTarget) {
        return;
      }

      this.setData({
        showServerDebug: EnvUtil.isDevTool(),
        apiServerTarget: currentTarget.key,
        apiServerBaseUrl: currentTarget.baseUrl,
        apiServerLabel: currentTarget.label
      });
    } catch (error) {
      console.error('[Login] 同步服务器调试状态失败:', error);
    }
  },

  onSwitchToLocalServer() {
    this.confirmSwitchServer('local');
  },

  onSwitchToRemoteServer() {
    this.confirmSwitchServer('remote');
  },

  confirmSwitchServer(targetKey) {
    const targetMap = {
      local: '本机服务器',
      remote: '外网服务器'
    };
    const nextLabel = targetMap[targetKey] || targetKey;

    if (this.data.apiServerTarget === targetKey) {
      wx.showToast({
        title: `当前已是${nextLabel}`,
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '切换接口服务器',
      content: `将切换到${nextLabel}，并清理当前登录态，是否继续？`,
      success: (res) => {
        if (!res.confirm) {
          return;
        }

        try {
          const app = getApp();
          if (app && typeof app.setApiServerTarget === 'function') {
            app.setApiServerTarget(targetKey);
          } else {
            api.setCurrentServerTarget(targetKey);
          }
          this.syncServerDebugState();
        } catch (error) {
          console.error('[Login] 切换接口服务器失败:', error);
          wx.showToast({
            title: '切换失败',
            icon: 'none'
          });
        }
      }
    });
  },

  async onLogin() {
    if (!this.data.isFormValid || this.data.loading) return;
    if (this._loginTask) return this._loginTask;

    const { phone, code } = this.data;
    const pendingInvite = getPendingInvite();

    this._loginTask = this.executeLogin({
      phone,
      code,
      pendingInvite
    });

    return this._loginTask;
  },

  async executeLogin({ phone, code, pendingInvite }) {
    this.setData({ loading: true });

    try {
      const authRes = await api.post('/auth/login', {
        phone,
        code,
        ...(pendingInvite || {})
      }, {
        skipAuthRetry: true,
        silent: true,
        preventOfflineQueue: true,
        idempotentKey: `auth-login:${phone}`
      });

      const standardAuthRes = auth.normalizeAuthResponse(authRes);
      auth.persistAuthResult(standardAuthRes, { triggerHomeRefresh: true });
      clearPendingInvite();

      try {
        const latestUser = await api.get('/auth/me', {
          silent: true,
          skipErrorToast: true
        });
        if (latestUser && latestUser.id) {
          auth.persistAuthResult({
            token: standardAuthRes.token,
            refreshToken: standardAuthRes.refreshToken,
            userInfo: {
              ...standardAuthRes.userInfo,
              ...latestUser
            }
          }, { triggerHomeRefresh: true });
        }
      } catch (e) {
        console.warn('[Login] 获取最新用户信息失败', e);
      }

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      const eventChannel = this.getOpenerEventChannel();
      if (eventChannel && typeof eventChannel.emit === 'function') {
        eventChannel.emit('loginSuccess', standardAuthRes);
      }

      setTimeout(() => {
        if (getCurrentPages().length > 1) {
          wx.navigateBack();
        } else {
          wx.switchTab({ url: '/pages/index/index' });
        }

        const app = getApp();
        if (app && app.globalData) {
          app.globalData.loginSuccess = true;
        }
      }, 1500);
    } catch (error) {
      console.error('[Login] 登录失败', error);
      wx.showToast({
        title: resolveLoginErrorMessage(error),
        icon: 'none'
      });
    } finally {
      this._loginTask = null;
      this.setData({ loading: false });
    }
  },

  onCancel() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  }
});
