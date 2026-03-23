// components/publish-recommend/publish-recommend.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 推荐理由列表
    value: {
      type: Array,
      value: ['']
    },
    // 最大推荐理由数量
    maxCount: {
      type: Number,
      value: 5
    },
    // 是否必填
    required: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    recommendList: ['']
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 初始化推荐理由列表
      this.setData({
        recommendList: this.properties.value.length > 0 ? this.properties.value : ['']
      });
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'value': function(newVal) {
      if (newVal && newVal.length > 0) {
        this.setData({
          recommendList: newVal
        });
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 推荐理由输入
     */
    onRecommendInput(e) {
      const { index } = e.currentTarget.dataset;
      const { value } = e.detail;
      const recommendList = [...this.data.recommendList];
      recommendList[index] = value;
      
      this.setData({
        recommendList
      });
      
      // 触发父组件事件
      this.triggerEvent('change', {
        value: recommendList
      });
    },

    /**
     * 添加推荐理由
     */
    addRecommend() {
      const { recommendList } = this.data;
      const { maxCount } = this.properties;
      
      if (recommendList.length >= maxCount) {
        wx.showToast({
          title: `最多添加${maxCount}条推荐理由`,
          icon: 'none'
        });
        return;
      }
      
      const newList = [...recommendList, ''];
      this.setData({
        recommendList: newList
      });
      
      // 触发父组件事件
      this.triggerEvent('change', {
        value: newList
      });
    },

    /**
     * 删除推荐理由
     */
    removeRecommend(e) {
      const { index } = e.currentTarget.dataset;
      const { recommendList } = this.data;
      
      if (recommendList.length <= 1) {
        wx.showToast({
          title: '至少保留一条推荐理由',
          icon: 'none'
        });
        return;
      }
      
      const newList = recommendList.filter((_, i) => i !== index);
      this.setData({
        recommendList: newList
      });
      
      // 触发父组件事件
      this.triggerEvent('change', {
        value: newList
      });
    },

    /**
     * 获取推荐理由数据
     */
    getValue() {
      return this.data.recommendList.filter(item => item.trim() !== '');
    },

    /**
     * 设置推荐理由数据
     */
    setValue(value) {
      this.setData({
        recommendList: value && value.length > 0 ? value : ['']
      });
    },

    /**
     * 验证推荐理由
     */
    validate() {
      const { required } = this.properties;
      const validRecommends = this.getValue();
      
      if (required && validRecommends.length === 0) {
        return {
          valid: false,
          message: '请至少填写一条推荐理由'
        };
      }
      
      return {
        valid: true,
        message: ''
      };
    }
  }
});