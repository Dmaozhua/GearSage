// components/debounce-button/debounce-button.js
const { debounce } = require('../../utils/debounceUtils.js');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 按钮文本
    text: {
      type: String,
      value: '确定'
    },
    // 加载中的文本
    loadingText: {
      type: String,
      value: '处理中...'
    },
    // 按钮类型
    type: {
      type: String,
      value: 'primary' // primary, default, warn
    },
    // 按钮大小
    size: {
      type: String,
      value: 'default' // default, mini
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 防抖操作的唯一标识符
    debounceKey: {
      type: String,
      value: ''
    },
    // 加载提示文字
    loadingTitle: {
      type: String,
      value: '处理中...'
    },
    // 是否显示加载动画
    showLoading: {
      type: Boolean,
      value: true
    },
    // 是否启用蒙层
    maskLoading: {
      type: Boolean,
      value: true
    },
    // 自定义样式类
    customClass: {
      type: String,
      value: ''
    },
    // 是否为朴素按钮
    plain: {
      type: Boolean,
      value: false
    },
    // 按钮形状
    shape: {
      type: String,
      value: 'square' // square, round
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isProcessing: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 按钮点击事件处理
     */
    async onButtonTap() {
      const { debounceKey, loadingTitle, showLoading, maskLoading } = this.data;
      
      // 如果没有设置debounceKey，直接触发事件
      if (!debounceKey) {
        this.triggerEvent('tap');
        return;
      }

      // 使用防抖工具执行操作
      try {
        await debounce(
          debounceKey,
          async () => {
            // 触发自定义事件，让父组件处理具体的业务逻辑
            return new Promise((resolve, reject) => {
              this.triggerEvent('tap', {
                resolve,
                reject
              });
            });
          },
          {
            loadingTitle,
            showLoading,
            maskLoading,
            onStart: () => {
              this.setData({ isProcessing: true });
            },
            onComplete: () => {
              this.setData({ isProcessing: false });
            },
            onError: () => {
              this.setData({ isProcessing: false });
            }
          }
        );
      } catch (error) {
        console.error('[DebounceButton] 操作执行失败:', error);
      }
    },


  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件实例被放入页面节点树后执行
    },
    
    detached() {
      // 组件实例被从页面节点树移除后执行
      this.setData({ isProcessing: false });
    }
  }
});