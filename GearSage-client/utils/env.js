// utils/env.js
/**
 * 环境判断工具
 */
class EnvUtil {
  static getSystemSnapshot() {
    if (typeof wx === 'undefined') {
      return {
        platform: 'node',
        system: 'node',
        brand: 'node',
        model: 'node',
        environment: 'unknown'
      };
    }

    const deviceInfo = typeof wx.getDeviceInfo === 'function' ? wx.getDeviceInfo() : {};
    const appBaseInfo = typeof wx.getAppBaseInfo === 'function' ? wx.getAppBaseInfo() : {};

    return {
      platform: deviceInfo.platform || appBaseInfo.platform || '',
      system: deviceInfo.system || '',
      brand: deviceInfo.brand || '',
      model: deviceInfo.model || '',
      environment: appBaseInfo.environment || 'unknown'
    };
  }

  /**
   * 判断是否在微信开发者工具中运行
   */
  static isDevTool() {
    try {
      const systemInfo = this.getSystemSnapshot();
      
      // 开发者工具的platform通常是'devtools'
      if (systemInfo.platform === 'devtools') {
        return true;
      }
      
      // 方法2：通过环境变量判断（如果有的话）
      if (systemInfo.environment === 'development') {
        return true;
      }
      
      // 方法3：通过用户代理字符串判断（部分情况下可用）
      if (systemInfo.system && systemInfo.system.includes('devtools')) {
        return true;
      }
      
      // 方法4：通过品牌信息判断
      if (systemInfo.brand === 'devtools') {
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('[EnvUtil] 环境判断失败，默认为真机环境:', error);
      return false;
    }
  }
  
  /**
   * 判断是否在真机环境
   */
  static isRealDevice() {
    return !this.isDevTool();
  }
  
  /**
   * 获取当前环境信息
   */
  static getEnvInfo() {
    if (typeof wx === 'undefined') {
      return {
        isDevTool: false,
        isRealDevice: true,
        platform: 'node',
        system: 'node',
        brand: 'node',
        model: 'node',
        environment: 'unknown'
      };
    }

    const isDevTool = this.isDevTool();
    const systemInfo = this.getSystemSnapshot();
    
    return {
      isDevTool,
      isRealDevice: !isDevTool,
      platform: systemInfo.platform,
      system: systemInfo.system,
      brand: systemInfo.brand,
      model: systemInfo.model,
      environment: systemInfo.environment || 'unknown'
    };
  }
  
  /**
   * 打印环境信息（用于调试）
   */
  static logEnvInfo() {
    const envInfo = this.getEnvInfo();
    console.log('[EnvUtil] 当前环境信息:', envInfo);
    console.log('[EnvUtil] 运行环境:', envInfo.isDevTool ? '微信开发者工具' : '真机设备');
    return envInfo;
  }
}

module.exports = EnvUtil;
