const app = getApp();
const searchData = require('../../searchData/Data.js');
const defData = require('../../searchData/defData.js');

const TYPE_MAP = {
  reels: 'reel',
  rods: 'rod',
  lures: 'lure',
  reel: 'reel',
  rod: 'rod',
  lure: 'lure'
};

const MAX_KEYWORD_LENGTH = 30;
const MULTI_SELECT_FILTER_KEYS = ['brands', 'water_column', 'action', 'brakeSys', 'options'];

Component({
  properties: {
    type: {
      type: String,
      value: 'reels',
      observer(newVal) {
        const mappedType = TYPE_MAP[newVal] || 'reel';
        this.setData({ mappedType });
        this.loadFilters(mappedType);
        this.resetUIState();
      }
    }
  },

  data: {
    isDarkMode: false,
    isExpanded: false,
    searchText: '',
    suggestions: [],
    showSuggestions: false,
    // activeTab: 'ecommerce', // Removed
    filters: [],
    selectedFilters: {},
    mappedType: 'reel',
    searchLoading: false,
    canSubmit: true,
    recommendations: []
  },

  lifetimes: {
    attached() {
      const isDarkMode = app.globalData.isDarkMode;
      const mappedType = TYPE_MAP[this.properties.type] || 'reel';
      this.setData({ isDarkMode, mappedType });

      this.themeListener = (isDark) => {
        this.setData({ isDarkMode: isDark });
      };
      if (app.globalData.themeListeners) {
        app.globalData.themeListeners.push(this.themeListener);
      }

      this.loadFilters(mappedType);
    },
    detached() {
      if (this.inputTimer) {
        clearTimeout(this.inputTimer);
      }
      if (app.globalData.themeListeners && this.themeListener) {
        const index = app.globalData.themeListeners.indexOf(this.themeListener);
        if (index > -1) {
          app.globalData.themeListeners.splice(index, 1);
        }
      }
    }
  },

  methods: {
    resetUIState() {
      this.setData({
        searchText: '',
        suggestions: [],
        showSuggestions: false,
        selectedFilters: {},
        isExpanded: false,
        searchLoading: false,
        canSubmit: true,
        recommendations: []
      });
    },

    loadFilters(type) {
      const typeConfig = defData.find((item) => item.type === type);
      if (!typeConfig) {
        this.setData({ filters: [], selectedFilters: {} });
        return;
      }

      const mapOptions = (arr, idKey, nameKey) => (arr || []).map((item) => ({
        id: item[idKey],
        name: item[nameKey]
      }));

      const filters = [];

      if (type === 'reel' || type === 'rod') {
        filters.push({ key: 'types', label: '类别', options: mapOptions(typeConfig.types, 'type', 'name') });
      }

      if (type === 'reel') {
        if (typeConfig.options) {
          filters.push({ key: 'options', label: '功能特点', options: mapOptions(typeConfig.options, 'type', 'name') });
        }
        if (typeConfig.brakeSys) {
          filters.push({ key: 'brakeSys', label: '刹车系统', options: mapOptions(typeConfig.brakeSys, 'type', 'name') });
        }
      }

      if (type === 'lure') {
        filters.push({ key: 'system', label: '类别', options: mapOptions(typeConfig.system, 'id', 'zh') });
        filters.push({ key: 'water_column', label: '水层', options: mapOptions(typeConfig.water_column, 'id', 'zh') });
        filters.push({ key: 'action', label: '主要动作', options: mapOptions(typeConfig.action, 'id', 'zh') });
      }

      if (typeConfig.brands) {
        filters.push({ key: 'brands', label: '品牌', options: mapOptions(typeConfig.brands, 'id', 'name') });
      }

      this.setData({ filters, selectedFilters: {} });
    },

    toggleFilter() {
      this.setData({ isExpanded: !this.data.isExpanded, showSuggestions: false });
    },

    onFocus() {
      const query = this.data.searchText.trim();
      if (!query) {
        this.setData({ suggestions: [], showSuggestions: false });
      }
    },

    onSearchInput(e) {
      const searchText = e.detail.value;
      this.setData({ searchText });

      if (this.inputTimer) {
        clearTimeout(this.inputTimer);
      }

      this.inputTimer = setTimeout(() => {
        const keyword = (searchText || '').trim().toLowerCase();
        if (!keyword) {
          this.setData({ suggestions: [], showSuggestions: false });
          return;
        }

        const tokens = keyword.split(/\s+/);
        
        // Find matches in both names and aliases
        const matches = new Set();
        const typeItems = searchData.filter(item => item.type === this.data.mappedType);
        
        for (const item of typeItems) {
            // Optimization: stop if we have enough unique suggestions
            if (matches.size >= 20) break;

            const name = item.name;
            const alias = item.alias || '';
            const typeTips = item.type_tips || '';
            const lowerName = name.toLowerCase();
            const lowerAlias = alias.toLowerCase();
            const lowerTypeTips = typeTips.toLowerCase();
            
            // Check if tokens match name
            if (tokens.every(token => lowerName.includes(token))) {
                matches.add(name);
            }
            
            // Check if tokens match alias
            if (alias && tokens.every(token => lowerAlias.includes(token))) {
                matches.add(alias);
            }

            // Check if tokens match type_tips
            if (typeTips && tokens.every(token => lowerTypeTips.includes(token))) {
                matches.add(typeTips);
            }
        }

        const suggestions = Array.from(matches)
          .slice(0, 8)
          .map((text, index) => ({ id: index, name: text }));

        this.setData({
          suggestions,
          showSuggestions: suggestions.length > 0
        });
      }, 180);
    },

    selectSuggestion(e) {
      const { name } = e.currentTarget.dataset;
      this.setData({ searchText: name, showSuggestions: false });
      this.submitSearch();
    },

    clearSearch() {
      this.setData({ 
        searchText: '', 
        suggestions: [], 
        showSuggestions: false 
      });
    },

    onSearchConfirm() {
      this.submitSearch();
    },

    submitSearch() {
      if (!this.data.canSubmit || this.data.searchLoading) {
        return;
      }

      const query = (this.data.searchText || '').trim();
      if (!query) {
        wx.showToast({ title: '请输入关键词', icon: 'none' });
        return;
      }

      if (query.length > MAX_KEYWORD_LENGTH) {
        wx.showToast({ title: `关键词不能超过${MAX_KEYWORD_LENGTH}字`, icon: 'none' });
        return;
      }

      this.setData({
        searchLoading: true,
        canSubmit: false,
        showSuggestions: false,
        isExpanded: false
      });

      this.triggerEvent('search', { query });
    },

    // switchTab(e) {
    //   this.setData({ activeTab: e.currentTarget.dataset.tab });
    // },

    selectFilter(e) {
      const { key, val } = e.currentTarget.dataset;
      const filterVal = val;
      const selectedFilters = { ...this.data.selectedFilters };

      if (MULTI_SELECT_FILTER_KEYS.includes(key)) {
        let currentVal = selectedFilters[key];
        
        if (filterVal === '') {
          delete selectedFilters[key];
        } else {
          if (!Array.isArray(currentVal)) {
            currentVal = [];
          } else {
            currentVal = [...currentVal];
          }

          const index = currentVal.indexOf(filterVal);
          if (index > -1) {
            currentVal.splice(index, 1);
          } else {
            currentVal.push(filterVal);
          }

          if (currentVal.length === 0) {
            delete selectedFilters[key];
          } else {
            selectedFilters[key] = currentVal;
          }
        }
      } else {
        if (filterVal === '') {
          delete selectedFilters[key];
        } else {
          selectedFilters[key] = filterVal;
        }
      }

      this.setData({ selectedFilters });
      this.checkRecommendations();
    },

    checkRecommendations() {
      const { mappedType, selectedFilters } = this.data;
      const typeConfig = defData.find((item) => item.type === mappedType);
      
      if (!typeConfig) return;

      // Determine rule key based on type (e.g., derive_family_rules for lure)
      // Assuming 'derive_family_rules' for lure, 'derive_family_reels' for reel, 'derive_family_rods' for rod
      let ruleKey = '';
      if (mappedType === 'lure') ruleKey = 'derive_family_rules';
      else if (mappedType === 'reel') ruleKey = 'derive_family_reels';
      else if (mappedType === 'rod') ruleKey = 'derive_family_rods';

      const rules = typeConfig[ruleKey] || [];
      const familyMap = {};
      (typeConfig.family || []).forEach(f => { familyMap[f.id] = f.zh; });

      const matchedKeywords = new Set();

      for (const rule of rules) {
        let isMatch = true;
        
        // Check all conditions in 'if'
        for (const [key, value] of Object.entries(rule.if)) {
          const userVal = selectedFilters[key];
          
          if (!userVal || (Array.isArray(userVal) && userVal.length === 0)) {
            isMatch = false;
            break;
          }

          const userValues = Array.isArray(userVal) ? userVal : [userVal];

          if (Array.isArray(value)) {
            // Rule allows multiple values, check if user selection is one of them
            // Match if ANY of user's selection is in Rule's allowed values
            const hasIntersection = userValues.some(uv => value.includes(uv));
            if (!hasIntersection) {
              isMatch = false;
              break;
            }
          } else {
            // Rule requires specific value
            // Match if user's selection includes this specific value
            if (!userValues.includes(value)) {
              isMatch = false;
              break;
            }
          }
        }

        if (isMatch && rule.then && Array.isArray(rule.then)) {
          rule.then.forEach(id => {
            if (familyMap[id]) {
              matchedKeywords.add(familyMap[id]);
            }
          });
        }
      }

      this.setData({ recommendations: Array.from(matchedKeywords) });
    },

    selectRecommendation(e) {
      const name = e.currentTarget.dataset.val;
      this.setData({ 
        searchText: name, 
        isExpanded: false,
        recommendations: []
      });
      this.submitSearch();
    },

    resetFilter() {
      this.setData({ selectedFilters: {}, recommendations: [] });
    },

    applyFilter() {
      this.setData({ isExpanded: false });
      this.triggerEvent('filter', { 
        filters: this.data.selectedFilters,
        searchText: this.data.searchText
      });
    },

    finishSearch() {
      this.setData({ searchLoading: false });
      setTimeout(() => {
        this.setData({ canSubmit: true });
      }, 400);
    }
  }
});
