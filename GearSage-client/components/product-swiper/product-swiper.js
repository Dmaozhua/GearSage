// components/product-swiper/product-swiper.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 图片数组
    images: {
      type: Array,
      value: []
    },
    // 轮播高度（rpx）
    height: {
      type: Number,
      value: 800
    },
    // 是否自动播放
    autoplay: {
      type: Boolean,
      value: false
    },
    // 自动播放间隔（ms）
    interval: {
      type: Number,
      value: 3000
    },
    // 是否首尾循环（仅在下一张/上一张时起作用）
    circular: {
      type: Boolean,
      value: true
    },
    // 是否显示指示点
    showDots: {
      type: Boolean,
      value: true
    },
    // 是否显示计数器
    showCounter: {
      type: Boolean,
      value: true
    },
    // 是否显示左右按钮（默认关闭）
    showControls: {
      type: Boolean,
      value: false
    },
    // 水印
    showWatermark: {
      type: Boolean,
      value: false
    },
    watermarkText: {
      type: String,
      value: ''
    },
    // 防下载蒙层
    preventDownload: {
      type: Boolean,
      value: false
    },

    /**
     * 展示策略
     * imageMode：传给 <image> 的 mode，默认改为 aspectFill（cover）
     * display：cover | contain | auto
     *  - cover: 统一填充裁切
     *  - contain: 完整显示（会留边）
     *  - auto: 极端比例（>3 或 <1/3）时 contain，其余 cover
     */
    imageMode: {
      type: String,
      value: 'aspectFill' // 默认即 cover
    },
    display: {
      type: String,
      value: 'cover' // cover | contain | auto
    },
    // 图片行内样式的兜底
    defaultImageStyle: {
      type: String,
      value: 'width: 100%; height: 100%;'
    }
  },

  data: {
    currentIndex: 0,
    isAnimating: false,
    // 针对每张图的 mode / orientation / style
    imageComputedModes: [],
    imageOrientations: [],
    imageStyles: [],
    imageErrorStates: [],
    // 触摸滑动状态
    _startX: 0,
    _deltaX: 0,
    _swiping: false,
    _timer: null
  },

  lifetimes: {
    attached() {
      this._initArrays();
      this.initAutoplay();
    },
    detached() {
      this.clearAutoplay();
    }
  },

  observers: {
    images(newImages) {
      if (newImages && newImages.length > 0) {
        this._initArrays();
        this.reset();
        this.initAutoplay();
      } else {
        this.clearAutoplay();
      }
    },
    autoplay(v) {
      if (v) this.initAutoplay();
      else this.clearAutoplay();
    }
  },

  methods: {
    /* -------------------- 初始化 -------------------- */
    _initArrays() {
      const n = (this.properties.images || []).length;
      this.setData({
        imageComputedModes: new Array(n).fill(this.properties.imageMode || 'aspectFill'),
        imageOrientations: new Array(n).fill(''),
        imageStyles: new Array(n).fill(this.data.defaultImageStyle || 'width: 100%; height: 100%;'),
        imageErrorStates: new Array(n).fill(false)
      });
    },

    reset() {
      this.setData({ currentIndex: 0, isAnimating: false });
    },

    /* -------------------- 自动播放 -------------------- */
    initAutoplay() {
      this.clearAutoplay();
      if (!this.properties.autoplay || (this.properties.images || []).length <= 1) return;
      const loop = () => {
        this.next();
        this.data._timer = setTimeout(loop, this.properties.interval || 3000);
      };
      this.data._timer = setTimeout(loop, this.properties.interval || 3000);
    },

    clearAutoplay() {
      if (this.data._timer) {
        clearTimeout(this.data._timer);
        this.data._timer = null;
      }
    },

    /* -------------------- 切换 -------------------- */
    next() {
      const len = (this.properties.images || []).length;
      if (len <= 1) return;
      let next = this.data.currentIndex + 1;
      if (next >= len) next = this.properties.circular ? 0 : len - 1;
      this._goto(next);
    },

    prev() {
      const len = (this.properties.images || []).length;
      if (len <= 1) return;
      let prev = this.data.currentIndex - 1;
      if (prev < 0) prev = this.properties.circular ? len - 1 : 0;
      this._goto(prev);
    },

    _goto(index) {
      if (index === this.data.currentIndex) return;
      this.setData({ isAnimating: true });
      this.setData({ currentIndex: index });
      // 动画结束复位
      setTimeout(() => this.setData({ isAnimating: false }), 520);
      this.triggerEvent('change', { current: index });
    },

    onIndicatorTap(e) {
      const index = Number(e.currentTarget.dataset.index);
      if (Number.isFinite(index)) this._goto(index);
    },

    onPrevTap() { this.prev(); },
    onNextTap() { this.next(); },

    /* -------------------- 触摸滑动 -------------------- */
    onTouchStart(e) {
      if ((this.properties.images || []).length <= 1) return;
      const x = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0;
      this.data._startX = x;
      this.data._deltaX = 0;
      this.data._swiping = true;
      this.clearAutoplay();
    },

    onTouchMove(e) {
      if (!this.data._swiping) return;
      const x = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0;
      this.data._deltaX = x - this.data._startX;
      // 这里仅阻止纵向滚动时的抖动，实际位移动画已由 wrapper 负责
    },

    onTouchEnd() {
      if (!this.data._swiping) return;
      const threshold = 50; // 像素
      const dx = this.data._deltaX;
      this.data._swiping = false;
      this.data._deltaX = 0;

      if (dx > threshold) {
        this.prev();
      } else if (dx < -threshold) {
        this.next();
      } else {
        // 小于阈值不切换
      }
      // 结束后恢复自动播放
      this.initAutoplay();
    },

    /* -------------------- 图片回调 -------------------- */
    onImageLoad(e) {
      const { index } = e.currentTarget.dataset;
      const { width, height } = e.detail;
      const aspectRatio = width / height;

      const newModes = [...this.data.imageComputedModes];
      const newOrientations = [...this.data.imageOrientations];
      const newStyles = [...this.data.imageStyles];
      const newErrorStates = [...this.data.imageErrorStates];

      // 统一 cover；支持 display 开关
      let computedMode = 'aspectFill';
      const display = this.properties && this.properties.display;
      if (display === 'contain') {
        computedMode = 'aspectFit';
      } else if (display === 'auto') {
        const extreme = aspectRatio > 3 || aspectRatio < 1 / 3;
        computedMode = extreme ? 'aspectFit' : 'aspectFill';
      }

      newModes[index] = computedMode;
      newStyles[index] = 'width: 100%; height: 100%;';
      newOrientations[index] = aspectRatio >= 1 ? 'landscape' : 'portrait';
      newErrorStates[index] = false;

      this.setData({
        imageComputedModes: newModes,
        imageOrientations: newOrientations,
        imageStyles: newStyles,
        imageErrorStates: newErrorStates
      });

      this.triggerEvent('imageLoad', e.detail);
    },

    onImageError(e) {
      const { index } = e.currentTarget.dataset;
      const nextErrorStates = [...this.data.imageErrorStates];
      nextErrorStates[index] = true;
      this.setData({
        imageErrorStates: nextErrorStates
      });
      this.triggerEvent('imageError', { index, detail: e.detail });
    },

    onImageTap(e) {
      const { index, src } = e.currentTarget.dataset;
      this.triggerEvent('imageTap', {
        index,
        src,
        images: this.properties.images || []
      });
    }
  }
});
