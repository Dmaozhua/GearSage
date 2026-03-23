// components/svg-loading/svg-loading.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示加载动画
    spinning: {
      type: Boolean,
      value: true
    },
    // 加载文本
    text: {
      type: String,
      value: '加载中...'
    },
    // 是否显示文本
    showText: {
      type: Boolean,
      value: true
    },
    // 加载器大小
    size: {
      type: String,
      value: 'default' // small, default, large
    },
    // 自定义样式类
    customClass: {
      type: String,
      value: ''
    },
    // 自定义样式
    customStyle: {
      type: String,
      value: ''
    },
    // 颜色主题
    color: {
      type: String,
      value: '#FF6700'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 开始加载
    startLoading() {
      this.setData({
        spinning: true
      });
    },
    
    // 停止加载
    stopLoading() {
      this.setData({
        spinning: false
      });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件实例进入页面节点树时执行
    },
    
    detached() {
      // 组件实例被从页面节点树移除时执行
    }
  }
});