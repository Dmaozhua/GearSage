/**
 * 防抖工具类 - 用于处理按钮连续点击和UI交互问题
 * 适用于保存、发送、提交等操作按钮
 */

class DebounceManager {
  constructor() {
    // 存储各个操作的防抖状态
    this.debounceStates = new Map();
  }

  /**
   * 检查操作是否正在进行中
   * @param {string} key - 操作标识符
   * @returns {boolean} 是否正在进行中
   */
  isProcessing(key) {
    return this.debounceStates.get(key) || false;
  }

  /**
   * 设置操作状态
   * @param {string} key - 操作标识符
   * @param {boolean} processing - 是否正在处理
   */
  setProcessing(key, processing) {
    this.debounceStates.set(key, processing);
  }

  /**
   * 执行防抖操作
   * @param {string} key - 操作标识符
   * @param {Function} operation - 要执行的操作函数
   * @param {Object} options - 配置选项
   * @param {string} options.loadingTitle - 加载提示文字
   * @param {boolean} options.showLoading - 是否显示加载动画
   * @param {boolean} options.maskLoading - 是否启用蒙层
   * @param {Function} options.onStart - 开始时的回调
   * @param {Function} options.onComplete - 完成时的回调
   * @param {Function} options.onError - 错误时的回调
   * @returns {Promise} 操作结果
   */
  async execute(key, operation, options = {}) {
    // 默认配置
    const config = {
      loadingTitle: '处理中...',
      showLoading: true,
      maskLoading: true,
      onStart: null,
      onComplete: null,
      onError: null,
      ...options
    };

    // 检查是否正在处理中
    if (this.isProcessing(key)) {
      console.log(`[DebounceManager] 操作 ${key} 正在进行中，忽略重复请求`);
      return Promise.resolve(false);
    }

    try {
      // 设置处理状态
      this.setProcessing(key, true);
      
      // 显示加载状态
      if (config.showLoading) {
        wx.showLoading({
          title: config.loadingTitle,
          mask: config.maskLoading
        });
      }

      // 执行开始回调
      if (config.onStart && typeof config.onStart === 'function') {
        config.onStart();
      }

      console.log(`[DebounceManager] 开始执行操作: ${key}`);
      
      // 执行实际操作
      const result = await operation();
      
      console.log(`[DebounceManager] 操作 ${key} 执行成功`);
      
      // 执行完成回调
      if (config.onComplete && typeof config.onComplete === 'function') {
        config.onComplete(result);
      }
      
      return result;
      
    } catch (error) {
      console.error(`[DebounceManager] 操作 ${key} 执行失败:`, error);
      
      // 执行错误回调
      if (config.onError && typeof config.onError === 'function') {
        config.onError(error);
      } else {
        // 默认错误处理
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
      
      throw error;
      
    } finally {
      // 隐藏加载状态
      if (config.showLoading) {
        wx.hideLoading();
      }
      
      // 重置处理状态
      this.setProcessing(key, false);
      
      console.log(`[DebounceManager] 操作 ${key} 状态已重置`);
    }
  }

  /**
   * 清除指定操作的状态
   * @param {string} key - 操作标识符
   */
  clear(key) {
    this.debounceStates.delete(key);
    console.log(`[DebounceManager] 已清除操作 ${key} 的状态`);
  }

  /**
   * 清除所有操作状态
   */
  clearAll() {
    this.debounceStates.clear();
    console.log('[DebounceManager] 已清除所有操作状态');
  }

  /**
   * 获取所有正在进行的操作
   * @returns {Array} 正在进行的操作列表
   */
  getProcessingOperations() {
    const processing = [];
    for (const [key, value] of this.debounceStates.entries()) {
      if (value) {
        processing.push(key);
      }
    }
    return processing;
  }
}

// 创建全局实例
const debounceManager = new DebounceManager();

/**
 * 页面级防抖混入对象
 * 可以在页面的Page()配置中使用
 */
const debouncePageMixin = {
  data: {
    // 防抖状态数据
    _debounceStates: {}
  },

  /**
   * 页面卸载时清理防抖状态
   */
  onUnload() {
    // 清理当前页面的防抖状态
    debounceManager.clearAll();
  },

  /**
   * 执行防抖操作（页面级方法）
   * @param {string} key - 操作标识符
   * @param {Function} operation - 要执行的操作函数
   * @param {Object} options - 配置选项
   */
  async executeWithDebounce(key, operation, options = {}) {
    // 更新页面状态
    const stateKey = `_debounceStates.${key}`;
    this.setData({
      [stateKey]: true
    });

    try {
      const result = await debounceManager.execute(key, operation, {
        onComplete: () => {
          // 重置页面状态
          this.setData({
            [stateKey]: false
          });
        },
        onError: () => {
          // 重置页面状态
          this.setData({
            [stateKey]: false
          });
        },
        ...options
      });
      
      return result;
    } catch (error) {
      // 确保页面状态被重置
      this.setData({
        [stateKey]: false
      });
      throw error;
    }
  },

  /**
   * 检查操作是否正在进行中（页面级方法）
   * @param {string} key - 操作标识符
   * @returns {boolean}
   */
  isDebounceProcessing(key) {
    return this.data._debounceStates[key] || false;
  }
};

/**
 * 简化的防抖函数，适用于简单场景
 * @param {string} key - 操作标识符
 * @param {Function} operation - 要执行的操作函数
 * @param {Object} options - 配置选项
 * @returns {Promise} 操作结果
 */
function debounce(key, operation, options = {}) {
  return debounceManager.execute(key, operation, options);
}

/**
 * 检查操作是否正在进行中
 * @param {string} key - 操作标识符
 * @returns {boolean}
 */
function isProcessing(key) {
  return debounceManager.isProcessing(key);
}

module.exports = {
  DebounceManager,
  debounceManager,
  debouncePageMixin,
  debounce,
  isProcessing
};