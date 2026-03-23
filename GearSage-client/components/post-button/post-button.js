Component({
  properties: {
    text: { type: String, value: '发布' },
    icon: { type: String, value: '/images/icons/post1.png' },
    iconDark: { type: String, value: '/images/icons/post1-夜晚.png' },
    icon1: { type: String, value: '/images/icons/post2.png' },
    icon1Dark: { type: String, value: '/images/icons/post2-夜晚.png' }
  },
  data: {
    letters: [],
    isHovered: false,
    isDarkMode: false
  },
  lifetimes: {
    attached() {
      this.initTextAnimation();
      this.initThemeMode();
    }
  },
  pageLifetimes: {
    show() {
      this.initThemeMode();
    }
  },
  methods: {
    initTextAnimation() {
      const text = this.data.text || '';
      const len = text.length || 1;
      const step = 360 / len;
      const radius = 74; // 旋转半径
      
      const letters = text.split('').map((ch, idx) => {
        const deg = idx * step;
        const rad = deg * Math.PI / 180;
        const x = Math.sin(rad) * radius;
        const y = -Math.cos(rad) * radius;
        return { ch, idx, deg, x, y };
      });
      
      this.setData({ letters });
    },
    initThemeMode() {
      const app = getApp();
      const isDarkMode = app.globalData.isDarkMode || false;
      this.setData({
        isDarkMode: isDarkMode
      });
    },
    onTap() { this.triggerEvent('tap'); },
    onTouchStart() { this.setData({ isHovered: true }); },
    onTouchEnd() { this.setData({ isHovered: false }); }
  }
})