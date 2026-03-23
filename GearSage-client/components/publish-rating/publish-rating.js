Component({
  properties: {
    equipmentType: {
      type: String,
      value: ''
    },
    ratings: {
      type: Object,
      value: {}
    },
    errors: {
      type: String,
      value: ''
    }
  },

  data: {
    isDarkMode: false,
    currentDimensions: [],
    localRatings: {},
    availableTypes: {
      rod: [
        // { key: 'actionScore', label: '调性' },
        // { key: 'sensitivityScore', label: '传导性' },
        // { key: 'castingScore', label: '抛投' },
        // { key: 'workmanshipScore', label: '做工' },
        // { key: 'durabilityScore', label: '耐用性' }
        { key: 'actionMatchScore', label: '调性匹配' },
        { key: 'sensitivityScore', label: '传导性' },
        { key: 'castingScore', label: '抛投表现' },
        { key: 'workmanshipScore', label: '做工' },
        { key: 'durabilityScore', label: '耐用性' }
      ],
      reel: [
        // { key: 'gearRatioScore', label: '速比' },
        // { key: 'dragScore', label: '卸力' },
        // { key: 'smoothnessScore', label: '顺滑度' },
        // { key: 'weightScore', label: '重量' },
        // { key: 'durabilityScore', label: '耐用性' }
        { key: 'retrieveFeelScore', label: '收线手感' },
        { key: 'dragScore', label: '卸力表现' },
        { key: 'smoothnessScore', label: '顺滑度' },
        { key: 'balanceScore', label: '轻量与平衡' },
        { key: 'durabilityScore', label: '耐用性' }
      ],
      bait: [
        // { key: 'stabilityScore', label: '稳定性' },
        // { key: 'attractionScore', label: '声/光/震动' },
        // { key: 'durabilityScore', label: '耐撕咬' },
        // { key: 'workmanshipScore', label: '做工' },
        // { key: 'castingScore', label: '抛投性能' }
        { key: 'actionScore', label: '动作表现' },
        { key: 'stabilityScore', label: '稳定性' },
        { key: 'attractionScore', label: '诱鱼表现' },
        { key: 'durabilityScore', label: '耐撕咬' },
        { key: 'castingScore', label: '抛投表现' }
      ],
      line: [
        // { key: 'strengthScore', label: '拉力' },
        // { key: 'stretchScore', label: '延伸率' },
        // { key: 'abrasionScore', label: '耐磨' },
        // { key: 'diameterScore', label: '线径' },
        // { key: 'durabilityScore', label: '耐久性' }
        { key: 'strengthScore', label: '强度表现' },
        { key: 'abrasionScore', label: '耐磨性' },
        { key: 'handlingScore', label: '顺滑与操作感' },
        { key: 'castabilityScore', label: '抛投表现' },
        { key: 'durabilityScore', label: '耐久性' }
      ],
      hook: [
        // { key: 'sharpnessScore', label: '锋利度' },
        // { key: 'resistanceScore', label: '抗扭曲' },
        // { key: 'coatingScore', label: '涂层' },
        // { key: 'designScore', label: '形状设计' },
        // { key: 'durabilityScore', label: '耐用性' }
        { key: 'sharpnessScore', label: '锋利度' },
        { key: 'penetrationScore', label: '刺鱼效率' },
        { key: 'resistanceScore', label: '抗变形' },
        { key: 'coatingScore', label: '防锈与涂层' },
        { key: 'durabilityScore', label: '耐用性' }
      ],
      other: [
        // { key: 'practicalityScore', label: '实用性' },
        // { key: 'appearanceScore', label: '美观度' },
        // { key: 'workmanshipScore', label: '做工' },
        // { key: 'durabilityScore', label: '耐久性' },
        // { key: 'costScore', label: '性价比' }
        { key: 'practicalityScore', label: '实用性' },
        { key: 'workmanshipScore', label: '做工' },
        { key: 'durabilityScore', label: '耐久性' },
        { key: 'designScore', label: '设计合理性' },
        { key: 'costScore', label: '性价比' }
      ],
      // post-Recommend组件使用的统一评分维度
      recommend: [
        // { key: 'practicalityScore', label: '实用性' },
        // { key: 'appearanceScore', label: '美观度' },
        // { key: 'workmanshipScore', label: '做工' },
        // { key: 'emotionalValueScore', label: '情绪价值' },
        // { key: 'costScore', label: '性价比' }
        { key: 'practicalityScore', label: '实用性' },
        { key: 'designScore', label: '设计感' },
        { key: 'workmanshipScore', label: '做工' },
        { key: 'emotionalValueScore', label: '情绪价值' },
        { key: 'costScore', label: '性价比' }
      ]
    }
  },

  observers: {
    'equipmentType': function(type) {
      console.log('[publish-rating] observer equipmentType=', type);
      this.updateDimensions(type);
    },
    'ratings': function(newRatings) {
      console.log('[publish-rating] observer ratings keys=', Object.keys(newRatings || {}));
      this.setData({ localRatings: newRatings || {} });
    }
  },



  lifetimes: {
    attached: function() {
      this.setData({ localRatings: this.properties.ratings || {} });
      console.log('[publish-rating] lifetimes.attached: equipmentType=', this.properties.equipmentType, 'initial ratings keys=', Object.keys(this.properties.ratings || {}));
      this.initThemeMode();
      
      // 监听全局主题变化
      const app = getApp();
      if (app.globalData.themeChangeListeners) {
        console.log('[publish-rating] register themeChange listener');
        app.globalData.themeChangeListeners.push(() => {
          this.setData({
            isDarkMode: app.globalData.isDarkMode || false
          });
        });
      }
    },
    
    detached: function() {
      // 清理监听器
      const app = getApp();
      if (app.globalData.themeChangeListeners) {
        const index = app.globalData.themeChangeListeners.findIndex(listener => 
          listener.toString().includes('isDarkMode')
        );
        if (index > -1) {
          app.globalData.themeChangeListeners.splice(index, 1);
        }
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化主题模式
     */
    initThemeMode() {
      const app = getApp();
      this.setData({
        isDarkMode: app.globalData.isDarkMode || false
      });
    },

    updateDimensions(type) {
      const dimensions = this.data.availableTypes[type] || [];
      this.setData({ currentDimensions: dimensions });
      console.log('[publish-rating] updateDimensions type=', type, 'dimension keys=', dimensions.map(d => d.key));
    },

    handleTouchStart(e) {
      this.updateStarRating(e);
    },

    handleTouchMove(e) {
      this.updateStarRating(e);
    },

    handleTouchEnd(e) {
      this.updateStarRating(e, true);
    },

    updateStarRating(e, triggerChangeEvent = false) {
      const { type } = e.currentTarget.dataset;
      const touch = e.changedTouches[0];

      this.createSelectorQuery().select(`#${type}`).boundingClientRect(rect => {
        if (rect) {
          const starWidth = rect.width / 5;
          const relativeX = touch.pageX - rect.left;
          // 修改为10分制，最低1分
          // relativeX / starWidth -> 0~5颗星
          // * 2 -> 0~10分
          // Math.ceil -> 向上取整，保留整数分值
          const score = Math.max(1, Math.min(10, Math.ceil((relativeX / starWidth) * 2)));

          // 创建新的评分对象
          const newRatings = { ...this.properties.ratings, [type]: score };

          // 更新组件内部的 localRatings 数据以实时显示
          const updatedLocalRatings = { ...this.data.localRatings, [type]: score };
          this.setData({
            localRatings: updatedLocalRatings
          });
          console.log('[publish-rating] updateStarRating type=', type, 'score=', score);

          // 总是触发事件，让父组件更新数据
          this.triggerEvent('ratingchange', { 
            ratings: newRatings,
            type: type,
            score: score
          });
          if (triggerChangeEvent) {
            console.log('[publish-rating] ratingchange event triggered');
          }
        } else {
          console.error('Failed to get boundingClientRect for element:', type);
        }
      }).exec();
    }
  }
});