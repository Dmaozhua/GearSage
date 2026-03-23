// components/theme-toggle/theme-toggle.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否为夜间模式
    isDarkMode: {
      type: Boolean,
      value: false,
      observer: 'onThemeChange'
    },
    // 动画大小
    size: {
      type: Number,
      value: 60
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 动画状态
    isAnimating: false,
    // SVG变换样式
    svgTransform: '',
    // 星星动画延迟
    starDelays: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
    // 当前主题颜色
    currentColors: {
      background: '#F0E3C5',
      yellow: '#F6CE41',
      orange: '#F0863C',
      red: '#F15F4A',
      brown: '#6B5138'
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 主题变化观察者
     */
    onThemeChange(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.animateThemeChange(newVal);
      }
    },

    /**
     * 执行主题切换动画
     */
    animateThemeChange(isDark) {
      if (this.data.isAnimating) return;
      
      this.setData({
        isAnimating: true
      });

      // 计算新的颜色主题
      const newColors = this.calculateThemeColors(isDark);
      
      // 执行旋转动画
      this.setData({
        svgTransform: 'transform: rotateY(180deg); transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);'
      });

      // 延迟更新颜色以配合旋转动画
      setTimeout(() => {
        this.setData({
          currentColors: newColors
        });
      }, 300);

      // 星星动画
      this.animateStars();

      // 重置动画状态
      setTimeout(() => {
        this.setData({
          isAnimating: false,
          svgTransform: 'transform: rotateY(0deg); transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);'
        });
      }, 600);
    },

    /**
     * 计算主题颜色
     */
    calculateThemeColors(isDark) {
      const dayColors = {
        background: '#F0E3C5',
        yellow: '#F6CE41',
        orange: '#F0863C',
        red: '#F15F4A',
        brown: '#6B5138'
      };

      if (!isDark) {
        return dayColors;
      }

      // 夜间模式颜色计算（简化版的lighten + invert效果）
      return {
        // background: '#2A1F0F',
        // yellow: '#B8A05E',
        // orange: '#B85A23',
        // red: '#B83A25',
        // brown: '#8B6F56'
        background: '#000000',
        yellow: '#00008B',
        orange: '#C0C0C0',
        red: '#B0C4DE',
        brown: '#B0C4DE'
      };
    },

    /**
     * 星星动画
     */
    animateStars() {
      // 触发星星动画的CSS类
      this.setData({
        starAnimationClass: 'star-animate'
      });

      setTimeout(() => {
        this.setData({
          starAnimationClass: ''
        });
      }, 1000);
    },

    /**
     * 组件点击事件
     */
    onTap() {
      this.triggerEvent('themeToggle', {
        isDarkMode: !this.properties.isDarkMode
      });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 初始化颜色
      const colors = this.calculateThemeColors(this.properties.isDarkMode);
      this.setData({
        currentColors: colors
      });
    }
  }
});