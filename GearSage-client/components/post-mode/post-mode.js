// https://codepen.io/ykadosh/pen/ZEJLapj
const MAX_VISIBILITY = 3;
const tempUrlCache = new Map();

Component({
  properties: {
    // You can pass in card data from the parent page
    initialCards: {
      type: Array,
      value: []
    },
    backgroundImages: {
      type: Array,
      value: []
    }
  },

  data: {
    active: 0,
    cards: [],
    cardData: [], // Internal data storage
    resolvedBackgroundImages: []
  },

  observers: {
    backgroundImages(backgroundImages) {
      this.resolveBackgroundImages(backgroundImages);
    }
  },

  lifetimes: {
    attached: function() {
      // Initialization logic when the component is attached to the page
      this.setupCarousel();
      this.resolveBackgroundImages(this.properties.backgroundImages);
    }
  },

  methods: {
    getResolvedBackgroundImages(backgroundImages = []) {
      return backgroundImages.map((src) => {
        if (typeof src === 'string' && src.indexOf('cloud://') === 0) {
          return tempUrlCache.get(src) || '';
        }
        return src;
      });
    },

    setupCarousel() {
      // Use passed-in data or generate default data
      let initialData = this.properties.initialCards;
      if (!initialData || initialData.length === 0) {
        initialData = [...new Array(10)].map((_, i) => ({
          title: `Card ${i + 1}`,
          content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
        }));
      }

      const activeIndex = Math.max(0, Math.floor(initialData.length / 2));
      this.setData({
        cardData: initialData,
        active: activeIndex // Start from the middle
      }, () => {
        if (typeof wx !== 'undefined' && wx.nextTick) {
          wx.nextTick(() => this.updateCardStyles());
        } else {
          this.updateCardStyles();
        }
      });
    },

    updateCardStyles() {
      const { active, cardData } = this.data;
      const backgroundImages = this.data.resolvedBackgroundImages.length
        ? this.data.resolvedBackgroundImages
        : this.properties.backgroundImages;
      const count = cardData.length;
  
      const updatedCards = cardData.map((item, i) => {
        const offset = (active - i) / 3;
        const absOffset = Math.abs(offset);
        const direction = Math.sign(active - i);
  
        const depth = Math.min(absOffset, MAX_VISIBILITY);
        const isActive = i === active;
        const opacity = absOffset >= MAX_VISIBILITY ? '0' : '1';
        const display = absOffset > MAX_VISIBILITY ? 'none' : 'block';
        const pointerEvents = isActive ? 'auto' : 'none'; // Only active card is interactive
  
        // Use px values to be compatible with WXSS; tuned for portrait mode
        // Adjusted for wider cards (520rpx)
        const rotateY = offset * 45; // slightly more rotation
        const translateZ = -200 * depth; // deeper z-depth
        const translateX = direction * -100; // more spacing
        const scale = 1 - 0.2 * depth; // more scaling difference
  
        const transform = `
          translateX(${translateX}px)
          translateZ(${translateZ}px)
          rotateY(${rotateY}deg)
          scale(${scale})`;
  
        const filter = isActive ? 'none' : `blur(${depth * 4}px) brightness(${1 - depth * 0.3})`;
        const cardBgColor = 'transparent'; // Let CSS handle background
        const backgroundImage = backgroundImages[i] ? `url(${backgroundImages[i]})` : 'none';
  
        const style = `
          transform: ${transform};
          filter: ${filter};
          opacity: ${opacity};
          display: ${display};
          pointer-events: ${pointerEvents};
          z-index: ${isActive ? 10 : 10 - Math.ceil(depth * 10)};
        `;
  
        const cardStyle = `
          background-image: ${backgroundImage};
        `;
  
        return {
          ...item,
          style: style,
          cardStyle: cardStyle,
          isActive: isActive
        };
      });
  
      this.setData({
        cards: updatedCards
      });
    },

    async resolveBackgroundImages(backgroundImages = []) {
      if (!Array.isArray(backgroundImages) || backgroundImages.length === 0) {
        this.setData({ resolvedBackgroundImages: [] }, () => {
          this.updateCardStyles();
        });
        return;
      }

      const cloudFileIDs = backgroundImages.filter(src => typeof src === 'string' && src.indexOf('cloud://') === 0);
      const cachedBackgroundImages = this.getResolvedBackgroundImages(backgroundImages);

      if (cloudFileIDs.length === 0) {
        this.setData({ resolvedBackgroundImages: backgroundImages }, () => {
          this.updateCardStyles();
        });
        return;
      }

      const unresolvedFileIDs = cloudFileIDs.filter(fileID => !tempUrlCache.has(fileID));

      this.setData({ resolvedBackgroundImages: cachedBackgroundImages }, () => {
        this.updateCardStyles();
      });

      if (unresolvedFileIDs.length === 0) {
        return;
      }

      if (!wx.cloud || !wx.cloud.getTempFileURL) {
        console.warn('[post-mode] wx.cloud.getTempFileURL unavailable, fallback to original sources');
        this.setData({ resolvedBackgroundImages: cachedBackgroundImages }, () => {
          this.updateCardStyles();
        });
        return;
      }

      try {
        const { fileList = [] } = await wx.cloud.getTempFileURL({
          fileList: unresolvedFileIDs
        });

        fileList.forEach((item) => {
          if (item && item.fileID) {
            tempUrlCache.set(item.fileID, item.tempFileURL || item.tempFileUrl || item.fileID);
          }
        });

        const resolvedBackgroundImages = this.getResolvedBackgroundImages(backgroundImages);

        this.setData({ resolvedBackgroundImages }, () => {
          this.updateCardStyles();
        });
      } catch (error) {
        console.error('[post-mode] resolveBackgroundImages failed:', error);
        this.setData({ resolvedBackgroundImages: cachedBackgroundImages }, () => {
          this.updateCardStyles();
        });
      }
    },
  
    // Add touch gesture handlers for swipe navigation
    onTouchStart(e) {
      if (!e.touches || !e.touches[0]) return;
      this._touchStartX = e.touches[0].clientX;
      this._touchDeltaX = 0;
    },
  
    onTouchMove(e) {
      if (!this._touchStartX || !e.touches || !e.touches[0]) return;
      this._touchDeltaX = e.touches[0].clientX - this._touchStartX;
    },
  
    onTouchEnd() {
      const threshold = 50; // px
      const deltaX = this._touchDeltaX || 0;
      if (deltaX > threshold) {
        this.handlePrev();
      } else if (deltaX < -threshold) {
        this.handleNext();
      }
      this._touchStartX = null;
      this._touchDeltaX = 0;
    },
    handlePrev() {
      if (this.data.active > 0) {
        this.setData({
          active: this.data.active - 1
        });
        this.updateCardStyles();
      }
    },

    handleNext() {
      if (this.data.active < this.data.cardData.length - 1) {
        this.setData({
          active: this.data.active + 1
        });
        this.updateCardStyles();
      }
    },

    // Method to allow parent to trigger a refresh
    refreshLayout() {
      this.updateCardStyles();
    },

    // Handle card tap event
    onCardTap(e) {
      const index = Number(e.currentTarget.dataset.index);
      if (!Number.isInteger(index)) {
        return;
      }
      
      // If clicking the already active card, trigger selection
      if (this.data.active === index) {
        this.triggerEvent('cardselect', {
          index: index,
          card: this.data.cardData[index]
        });
      } else {
        // Otherwise just scroll to it
        this.setData({
          active: index
        });
        this.updateCardStyles();
      }
    }
  }
});
