// pages/login/login.js
const api = require('../../services/api.js');
const auth = require('../../services/auth.js');
const { getPendingInvite, clearPendingInvite } = require('../../utils/invite.js');

Page({
  data: {
    phone: '',
    code: '',
    countdown: 0,
    loading: false,
    isFormValid: false,
    fromRoute: ''
  },

  onLoad(options) {
    if (options.fromRoute) {
      this.setData({
        fromRoute: decodeURIComponent(options.fromRoute)
      });
    }
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
        skipErrorToast: false
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
        title: error.message || '发送失败',
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
        title: error.message || '登录失败，请重试',
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
