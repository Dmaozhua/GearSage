// components/banner-carousel/banner-carousel.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 轮播图数据
    bannerList: {
      type: Array,
      value: []
    },
    // 轮播图高度
    height: {
      type: Number,
      value: 400
    },
    // 是否显示指示点
    showDots: {
      type: Boolean,
      value: false
    },
    // 是否显示自定义指示器
    showCustomDots: {
      type: Boolean,
      value: true
    },
    // 指示点颜色
    dotColor: {
      type: String,
      value: 'rgba(255, 255, 255, 0.4)'
    },
    // 激活指示点颜色
    activeDotColor: {
      type: String,
      value: 'rgba(255, 255, 255, 0.9)'
    },
    // 是否自动播放（默认关闭，需要用户主动切换）
    autoplay: {
      type: Boolean,
      value: false
    },
    // 自动播放间隔
    interval: {
      type: Number,
      value: 5000
    },
    // 切换动画时长
    duration: {
      type: Number,
      value: 500
    },
    // 是否循环播放
    circular: {
      type: Boolean,
      value: true
    },
    // 是否启用导航栏颜色变化
    enableNavbarColorChange: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    currentIndex: 0,
    isLoading: true,
    loadedImages: 0,
    isDarkMode: false
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.initBanner();
      this.initThemeMode();
    },
    
    detached() {
      // 清理定时器等资源
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 初始化轮播图
     */
    initBanner() {
      if (this.data.bannerList.length === 0) {
        this.loadDefaultBanners();
      } else {
        this.updateNavbarColor(0);
      }
    },

    /**
     * 加载默认轮播图数据
     */
    async loadDefaultBanners() {
      try {
        // 使用测试图片地址
        const defaultBanners = [
          {
            id: 1,
            imageUrl: 'https://anglertest.xyz/Banner/banner1.jpg',
            title: '钓友装备推荐',
            subtitle: '发现更多优质渔具',
            // backgroundColor:'#BDC3C7',
            link: ''
          },
          {
            id: 2,
            imageUrl: 'https://anglertest.xyz/Banner/banner2.jpg',
            title: '钓技分享',
            subtitle: '学习专业钓鱼技巧',

            link: ''
          },
          {
            id: 3,
            imageUrl: 'https://anglertest.xyz/Banner/banner3.webp',
            title: '钓点推荐',
            subtitle: '探索最佳钓鱼地点',

            link: ''
          },
          {
            id: 4,
            imageUrl: 'https://anglertest.xyz/Banner/banner4.jpg',
            title: '鱼饵推荐',
            subtitle: '探索最佳钓鱼地点',

            link: ''
          }
        ];
        
        this.setData({
          bannerList: defaultBanners
        });
        
        // 更新导航栏颜色
        this.updateNavbarColor(0);
        
      } catch (error) {
        console.error('加载轮播图数据失败:', error);
      }
    },

    /**
     * 轮播图切换事件
     */
    onSwiperChange(e) {
      const currentIndex = e.detail.current;
      this.setData({
        currentIndex
      });
      
      // 更新导航栏颜色
      this.updateNavbarColor(currentIndex);
      
      // 触发外部事件
      this.triggerEvent('change', {
        current: currentIndex,
        item: this.data.bannerList[currentIndex]
      });
    },

    /**
     * 点击指示器
     */
    onDotTap(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({
        currentIndex: index
      });
      this.updateNavbarColor(index);
    },

    /**
     * 点击轮播图
     */
    onBannerTap(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.bannerList[index];
      
      this.triggerEvent('tap', {
        index,
        item
      });
    },

    /**
     * 图片加载完成
     */
    onImageLoad(e) {
      const loadedImages = this.data.loadedImages + 1;
      this.setData({
        loadedImages,
        isLoading: loadedImages < this.data.bannerList.length
      });
    },

    /**
     * 图片加载失败
     */
    onImageError(e) {
      console.error('轮播图图片加载失败:', e);
      this.triggerEvent('imageError', e);
    },

    /**
     * 更新导航栏颜色
     */
    updateNavbarColor(index) {
      if (!this.data.enableNavbarColorChange) return;
      
      const currentBanner = this.data.bannerList[index];
      if (!currentBanner) return;
      
      // 获取当前轮播图的主色调
      const backgroundColor = currentBanner.backgroundColor || '#BDC3C7';
      
      // 计算半透明颜色
      const transparentColor = this.hexToRgba(backgroundColor, 0.8);
      
      // 通知父组件更新导航栏颜色
      this.triggerEvent('navbarColorChange', {
        backgroundColor: transparentColor,
        textColor: this.getContrastColor(backgroundColor)
      });
    },

    /**
     * 将十六进制颜色转换为rgba
     */
    hexToRgba(hex, alpha = 1) {
      // 移除#号
      hex = hex.replace('#', '');
      
      // 解析RGB值
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    /**
     * 根据背景色获取对比文字颜色
     */
    getContrastColor(hexColor) {
      // 移除#号
      hexColor = hexColor.replace('#', '');
      
      // 解析RGB值
      const r = parseInt(hexColor.substr(0, 2), 16);
      const g = parseInt(hexColor.substr(2, 2), 16);
      const b = parseInt(hexColor.substr(4, 2), 16);
      
      // 计算亮度
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      // 根据亮度返回对比色
      return brightness > 128 ? '#000000' : '#ffffff';
    },

    /**
     * 手动切换到指定索引
     */
    switchTo(index) {
      if (index >= 0 && index < this.data.bannerList.length) {
        this.setData({
          currentIndex: index
        });
        this.updateNavbarColor(index);
      }
    },

    /**
     * 获取当前轮播图信息
     */
    getCurrentBanner() {
      return this.data.bannerList[this.data.currentIndex];
    },

    /**
     * 初始化主题模式
     */
    initThemeMode() {
      const app = getApp();
      const isDarkMode = app.globalData.isDarkMode || false;
      this.setData({
        isDarkMode: isDarkMode
      });
    },

    /**
     * 更新主题模式
     */
    updateTheme() {
      this.initThemeMode();
    }
  }
});