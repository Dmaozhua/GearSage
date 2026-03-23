// pages/debounce-test/debounce-test.js
const { debouncePageMixin, debounce } = require('../../utils/debounceUtils.js');

Page(Object.assign({}, debouncePageMixin, {
  /**
   * 页面的初始数据
   */
  data: Object.assign({}, debouncePageMixin.data, {
    testResults: [],
    counter: 0
  }),

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('[DebounceTest] 页面加载');
  },

  /**
   * 测试基本防抖功能
   */
  async testBasicDebounce() {
    try {
      await debounce('basicTest', async () => {
        // 模拟异步操作
        await this.simulateAsyncOperation(1000);
        
        this.addTestResult('基本防抖测试', '成功', '操作完成');
        return { success: true };
      }, {
        loadingTitle: '基本测试中...',
        onComplete: (result) => {
          console.log('[DebounceTest] 基本测试完成:', result);
        }
      });
    } catch (error) {
      this.addTestResult('基本防抖测试', '失败', error.message);
    }
  },

  /**
   * 测试页面混入防抖功能
   */
  async testPageMixinDebounce() {
    await this.executeWithDebounce('mixinTest', async () => {
      // 模拟异步操作
      await this.simulateAsyncOperation(1500);
      
      this.addTestResult('页面混入测试', '成功', '使用页面混入方法完成');
      return { success: true, message: '页面混入测试成功' };
    }, {
      loadingTitle: '页面混入测试中...',
      onComplete: (result) => {
        wx.showToast({
          title: result.message,
          icon: 'success'
        });
      },
      onError: (error) => {
        this.addTestResult('页面混入测试', '失败', error.message);
      }
    });
  },

  /**
   * 测试连续点击防抖
   */
  async testContinuousClick() {
    const clickCount = this.data.counter + 1;
    this.setData({ counter: clickCount });
    
    await this.executeWithDebounce('continuousTest', async () => {
      // 模拟处理逻辑
      await this.simulateAsyncOperation(800);
      
      this.addTestResult('连续点击测试', '成功', `第${clickCount}次点击被处理`);
      return { success: true };
    }, {
      loadingTitle: '处理点击中...',
      onComplete: () => {
        wx.showToast({
          title: `处理了第${clickCount}次点击`,
          icon: 'success'
        });
      }
    });
  },

  /**
   * 测试错误处理
   */
  async testErrorHandling() {
    await this.executeWithDebounce('errorTest', async () => {
      // 模拟操作
      await this.simulateAsyncOperation(500);
      
      // 故意抛出错误
      throw new Error('这是一个测试错误');
    }, {
      loadingTitle: '错误测试中...',
      onComplete: () => {
        this.addTestResult('错误处理测试', '意外成功', '不应该到达这里');
      },
      onError: (error) => {
        this.addTestResult('错误处理测试', '成功', `正确捕获错误: ${error.message}`);
      }
    });
  },

  /**
   * 测试组件按钮事件
   */
  async onComponentButtonTap(e) {
    const { resolve, reject } = e.detail;
    
    try {
      // 模拟异步操作
      await this.simulateAsyncOperation(1200);
      
      this.addTestResult('组件按钮测试', '成功', '组件防抖按钮工作正常');
      
      // 通知组件操作成功
      resolve({ success: true, message: '组件测试成功' });
      
    } catch (error) {
      this.addTestResult('组件按钮测试', '失败', error.message);
      reject(error);
    }
  },

  /**
   * 清空测试结果
   */
  clearResults() {
    this.setData({
      testResults: [],
      counter: 0
    });
  },

  /**
   * 添加测试结果
   */
  addTestResult(testName, status, message) {
    const result = {
      id: Date.now(),
      testName,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    const results = [...this.data.testResults, result];
    this.setData({ testResults: results });
  },

  /**
   * 模拟异步操作
   */
  simulateAsyncOperation(delay = 1000) {
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  },

  /**
   * 检查防抖状态
   */
  checkDebounceStatus() {
    const states = this.data._debounceStates;
    const activeOperations = Object.keys(states).filter(key => states[key]);
    
    if (activeOperations.length > 0) {
      wx.showToast({
        title: `正在进行: ${activeOperations.join(', ')}`,
        icon: 'none',
        duration: 2000
      });
    } else {
      wx.showToast({
        title: '当前没有进行中的操作',
        icon: 'none'
      });
    }
  }
}));