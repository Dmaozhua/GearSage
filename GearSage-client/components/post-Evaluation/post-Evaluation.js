const tagConfig = require('./gearSageTagConfig.js');
const MAX_CUSTOM_TAG_LENGTH = 10;
const MAX_RECOMMEND_ITEM_LENGTH = 20;
const MAX_RECOMMEND_ITEM_COUNT = 3;
const WHITESPACE_REGEXP = /[\s\u00A0]+/g;
const CHINESE_ONLY_REGEXP = /[^\u4e00-\u9fa5]/g;

Component({
  properties: {
    equipmentType: {
      type: String,
      value: ''
    },
    isDarkMode: {
      type: Boolean,
      value: false
    },
    ratings: {
      type: Object,
      value: {}
    },
    pros: {
      type: Array,
      value: ['']
    },
    cons: {
      type: Array,
      value: ['']
    },
    customFit: {
      type: String,
      value: ''
    },
    customUnfit: {
      type: String,
      value: ''
    },
    tags: {
      type: Object,
      value: {}
    },
    showSummary: {
      type: Boolean,
      value: false
    },
    summary: {
      type: String,
      value: ''
    },
    repurchase: {
      type: String,
      value: ''
    },
    errors: {
      type: Object,
      value: {}
    }
  },

  data: {
    isMaxPros: false,
    isMaxCons: false,
    summaryText: '请选择',
    repurchaseText: '请选择',
    summaryOptions: [
      { value: 'strongly_recommend', label: '强烈推荐，明显超出预期' },
      { value: 'recommend', label: '值得推荐，整体满意' },
      { value: 'soso', label: '勉强可用，但不太推荐' },
      { value: 'not_recommend', label: '不推荐，存在明显问题' }
    ],
    repurchaseOptions: [
      { value: 'buy_same', label: '会继续使用同款' },
      { value: 'buy_upgrade', label: '会考虑升级同系列' },
      { value: 'try_other', label: '可能尝试其他品牌' },
      { value: 'never_buy', label: '不会再买' }
    ],
    drawerVisible: false,
    drawerType: '',
    drawerTitle: '',
    drawerGroups: [],
    selectorDrawerVisible: false,
    selectorDrawerType: '',
    selectorDrawerTitle: '',
    selectorDrawerOptions: [],
    prosDisplayTags: [],
    consDisplayTags: [],
    fitDisplayTags: [],
    unfitDisplayTags: []
  },

  observers: {
    'tags, equipmentType': function(tags, type) {
      this.updateDisplayTags();
    },
    'summary': function(val) {
      if (val) {
        const option = this.data.summaryOptions.find(opt => opt.value === val);
        this.setData({ summaryText: option ? option.label : val });
      } else {
        this.setData({ summaryText: '请选择' });
      }
    },
    'repurchase': function(val) {
      if (val) {
        const option = this.data.repurchaseOptions.find(opt => opt.value === val);
        this.setData({ repurchaseText: option ? option.label : val });
      } else {
        this.setData({ repurchaseText: '请选择' });
      }
    },
    'pros': function(pros) {
      if (pros) {
        this.setData({ isMaxPros: pros.length >= MAX_RECOMMEND_ITEM_COUNT });
      }
    },
    'cons': function(cons) {
      if (cons) {
        this.setData({ isMaxCons: cons.length >= MAX_RECOMMEND_ITEM_COUNT });
      }
    }
  },

  methods: {
    sanitizeChineseText(value, maxLength = MAX_CUSTOM_TAG_LENGTH) {
      const normalized = typeof value === 'string'
        ? value.replace(WHITESPACE_REGEXP, '').replace(CHINESE_ONLY_REGEXP, '')
        : '';
      return normalized.slice(0, maxLength);
    },

    sanitizeRecommendText(value) {
      return String(value || '').replace(WHITESPACE_REGEXP, '').slice(0, MAX_RECOMMEND_ITEM_LENGTH);
    },

    getGroupLimit(groupKey) {
      const equipmentType = this.properties.equipmentType;
      const globalGroup = (tagConfig.globalGroups || []).find((group) => group.groupKey === groupKey);
      if (globalGroup && Number(globalGroup.maxSelect) > 0) {
        return Number(globalGroup.maxSelect);
      }
      const categoryGroup = ((tagConfig.categoryGroups || {})[equipmentType] || []).find((group) => group.groupKey === groupKey);
      if (categoryGroup && Number(categoryGroup.maxSelect) > 0) {
        return Number(categoryGroup.maxSelect);
      }
      return MAX_RECOMMEND_ITEM_COUNT;
    },

    getSelectorConfig(type) {
      if (type === 'summary') {
        return {
          title: '选择一句话总结',
          value: this.properties.summary || '',
          options: this.data.summaryOptions.map((item) => ({
            value: item.value,
            label: item.label
          }))
        };
      }

      if (type === 'repurchase') {
        return {
          title: '选择回购/再次选择意愿',
          value: this.properties.repurchase || '',
          options: this.data.repurchaseOptions.map((item) => ({
            value: item.value,
            label: item.label
          }))
        };
      }

      return null;
    },

    onOpenSelectorDrawer(e) {
      const type = e.currentTarget.dataset.type || '';
      const config = this.getSelectorConfig(type);
      if (!config) {
        return;
      }

      this.setData({
        selectorDrawerVisible: true,
        selectorDrawerType: type,
        selectorDrawerTitle: config.title,
        selectorDrawerOptions: config.options.map((item) => ({
          ...item,
          selected: item.value === config.value
        }))
      });
    },

    onCloseSelectorDrawer() {
      this.setData({
        selectorDrawerVisible: false,
        selectorDrawerType: '',
        selectorDrawerTitle: '',
        selectorDrawerOptions: []
      });
    },

    onSelectorOptionSelect(e) {
      const { value } = e.currentTarget.dataset;
      const { selectorDrawerType } = this.data;

      if (selectorDrawerType === 'summary') {
        this.triggerEvent('summarychange', { value });
      }

      if (selectorDrawerType === 'repurchase') {
        this.triggerEvent('repurchasechange', { value });
      }

      this.onCloseSelectorDrawer();
    },

    onRatingChange(e) {
      this.triggerEvent('ratingchange', e.detail);
    },

    onSummaryChange(e) {
      const index = e.detail.value;
      const value = this.data.summaryOptions[index].value;
      this.triggerEvent('summarychange', { value });
    },

    onRepurchaseChange(e) {
      const index = e.detail.value;
      const value = this.data.repurchaseOptions[index].value;
      this.triggerEvent('repurchasechange', { value });
    },

    updateDisplayTags() {
      const { tags, equipmentType } = this.data;
      if (!equipmentType || !tags) return;
      
      const categoryGroups = tagConfig.categoryGroups[equipmentType];
      if (!categoryGroups) return;
      
      const globalGroups = tagConfig.globalGroups || [];
      const catGroups = categoryGroups;
      
      const getLabel = (groupKey, tagId) => {
        let group = globalGroups.find(g => g.groupKey === groupKey);
        if (!group) group = catGroups.find(g => g.groupKey === groupKey);
        if (!group) return tagId;
        const option = group.options.find(o => o.id === tagId);
        return option ? option.label : tagId;
      };

      const getTagsList = (keys) => {
        let list = [];
        keys.forEach(key => {
          if (tags[key] && Array.isArray(tags[key])) {
            tags[key].forEach(tagId => {
              list.push(getLabel(key, tagId));
            });
          }
        });
        return list;
      };
      
      // 适合人群
      const fitTagsList = getTagsList(['fit']);
      
      // 不适合人群
      const unfitTagsList = getTagsList(['unfit']);

      // 装备优点 (pros only)
      const prosTagsList = getTagsList(['pros']);
      
      // 装备缺点 (cons only)
      const consTagsList = getTagsList(['cons']);
      
      this.setData({
        fitDisplayTags: fitTagsList,
        unfitDisplayTags: unfitTagsList,
        prosDisplayTags: prosTagsList,
        consDisplayTags: consTagsList
      });
    },

    onCustomFitInput(e) {
      const value = this.sanitizeChineseText(e.detail.value, MAX_CUSTOM_TAG_LENGTH);
      const currentValue = this.properties.customFit || '';
      const selectedCount = ((this.data.tags || {}).fit || []).length;
      const limit = this.getGroupLimit('fit');
      if (!currentValue && value && selectedCount >= limit) {
        wx.showToast({ title: '适合人群标签已满，请先取消一个标签', icon: 'none' });
        return;
      }
      this.triggerEvent('customfitchange', { value });
    },

    onCustomUnfitInput(e) {
      const value = this.sanitizeChineseText(e.detail.value, MAX_CUSTOM_TAG_LENGTH);
      const currentValue = this.properties.customUnfit || '';
      const selectedCount = ((this.data.tags || {}).unfit || []).length;
      const limit = this.getGroupLimit('unfit');
      if (!currentValue && value && selectedCount >= limit) {
        wx.showToast({ title: '不适合人群标签已满，请先取消一个标签', icon: 'none' });
        return;
      }
      this.triggerEvent('customunfitchange', { value });
    },

    // 优点相关方法
    onProsInput(e) {
      const { index } = e.currentTarget.dataset;
      const value = this.sanitizeRecommendText(e.detail.value);
      const pros = [...this.data.pros];
      pros[index] = value;
      this.triggerEvent('proschange', { pros });
    },

    onAddPros() {
      if (this.data.pros.length < MAX_RECOMMEND_ITEM_COUNT) {
        const pros = [...this.data.pros, ''];
        this.triggerEvent('proschange', { pros });
      }
    },

    onDeletePros(e) {
      const { index } = e.currentTarget.dataset;
      if (this.data.pros.length > 1) {
        const pros = this.data.pros.filter((_, i) => i !== index);
        this.triggerEvent('proschange', { pros });
      }
    },

    // 缺点相关方法
    onConsInput(e) {
      const { index } = e.currentTarget.dataset;
      const value = this.sanitizeRecommendText(e.detail.value);
      const cons = [...this.data.cons];
      cons[index] = value;
      this.triggerEvent('conschange', { cons });
    },

    onAddCons() {
      if (this.data.cons.length < MAX_RECOMMEND_ITEM_COUNT) {
        const cons = [...this.data.cons, ''];
        this.triggerEvent('conschange', { cons });
      }
    },

    onDeleteCons(e) {
      const { index } = e.currentTarget.dataset;
      if (this.data.cons.length > 1) {
        const cons = this.data.cons.filter((_, i) => i !== index);
        this.triggerEvent('conschange', { cons });
      }
    },

    // 标签相关方法
    onOpenTagsDrawer(e) {
      const type = e.currentTarget.dataset.type; // 'pros', 'cons', 'fit', 'unfit'
      const equipmentType = this.properties.equipmentType;
      
      // 如果没有装备类型或配置中没有该类型，直接返回
      if (!equipmentType || !tagConfig.categoryGroups[equipmentType]) {
        wx.showToast({ title: '当前装备类型暂无标签选项', icon: 'none' });
        return;
      }

      let groups = [];
      const globalGroups = tagConfig.globalGroups || [];
      const catGroups = tagConfig.categoryGroups[equipmentType] || [];

      if (type === 'fit') {
        // 适合人群
        groups = globalGroups.filter(g => g.groupKey === 'fit');
      } else if (type === 'unfit') {
        // 不适合人群
        groups = globalGroups.filter(g => g.groupKey === 'unfit');
      } else if (type === 'pros') {
        // 装备优点：Only Category Pros
        groups = catGroups.filter(g => g.groupKey === 'pros');
      } else if (type === 'cons') {
        // 装备缺点：Only Category Cons
        groups = catGroups.filter(g => g.groupKey === 'cons');
      }
      
      // 过滤掉禁用的组
      groups = groups.filter(g => g.enabled !== false);
      
      // 根据 showOnPublish 过滤
      groups = groups.filter(g => !g.clientDisplay || g.clientDisplay.showOnPublish !== false);
      
      if (groups.length === 0) {
        wx.showToast({ title: '暂无标签选项', icon: 'none' });
        return;
      }

      let title = '';
      if (type === 'fit') title = '选择适合人群';
      else if (type === 'unfit') title = '选择不适合人群';
      else if (type === 'pros') title = '选择装备优点';
      else if (type === 'cons') title = '选择装备缺点';

      this.setData({
        drawerVisible: true,
        drawerType: type,
        drawerTitle: title,
        drawerGroups: groups
      });
    },
    
    onCloseDrawer() {
      this.setData({ drawerVisible: false });
    },
    
    onTagTap(e) {
      const { groupKey, tagId } = e.currentTarget.dataset;
      const group = this.data.drawerGroups.find(g => g.groupKey === groupKey);
      if (!group) return;
      
      const currentTags = this.data.tags || {};
      const groupTags = currentTags[groupKey] || [];
      
      const isSelected = groupTags.includes(tagId);
      let newGroupTags;
      
      if (isSelected) {
        newGroupTags = groupTags.filter(t => t !== tagId);
      } else {
        if (group.inputType === 'single') {
          newGroupTags = [tagId];
        } else {
          if (groupTags.length >= group.maxSelect) {
             wx.showToast({ title: `最多选择${group.maxSelect}个`, icon: 'none' });
             return;
          }
          newGroupTags = [...groupTags, tagId];
        }
      }
      
      const newTags = { ...currentTags, [groupKey]: newGroupTags };
      
      // Update local data and emit event
      this.setData({ tags: newTags });
      this.triggerEvent('tagschange', { tags: newTags });
    }
  }
});
