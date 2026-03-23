// pages/env-test/env-test.js
const EnvUtil = require('../../utils/env.js');
const auth = require('../../services/auth.js');

Page({
  data: {
    envInfo: {},
    loginResult: null,
    loading: false
  },

  onLoad() {
    this.loadEnvInfo();
  },

  /**
   * 加载环境信息
   */
  loadEnvInfo() {
    const envInfo = EnvUtil.getEnvInfo();
    this.setData({ envInfo });
    console.log('[EnvTest] 环境信息:', envInfo);
  },

  /**
   * 测试登录功能
   */
  async testLogin() {
    if (this.data.loading) return;
    
    try {
      this.setData({ loading: true, loginResult: null });
      
      wx.showLoading({ title: '测试登录中...' });
      
      const result = await auth.login();
      
      this.setData({ 
        loginResult: {
          success: true,
          data: result,
          message: '登录成功'
        }
      });
      
      wx.showToast({
        title: '登录测试成功',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('[EnvTest] 登录测试失败:', error);
      
      this.setData({ 
        loginResult: {
          success: false,
          error: error,
          message: error.message || '登录失败'
        }
      });
      
      wx.showToast({
        title: '登录测试失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  },

  /**
   * 清除登录状态
   */
  clearLogin() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    auth.userInfo = null;
    auth.isAdmin = false;
    
    this.setData({ loginResult: null });
    
    wx.showToast({
      title: '已清除登录状态',
      icon: 'success'
    });
  },

  /**
   * 刷新环境信息
   */
  refreshEnvInfo() {
    this.loadEnvInfo();
    wx.showToast({
      title: '已刷新',
      icon: 'success'
    });
  }
});