const app = getApp();
const searchData = require('../../searchData/Data.js');
const defData = require('../../searchData/defData.js');
const { getRecommendationCoverage } = require('../../utils/gearSearchIndex');

const TYPE_MAP = {
  reels: 'reel',
  rods: 'rod',
  lures: 'lure',
  reel: 'reel',
  rod: 'rod',
  lure: 'lure'
};

const ACTIVE_FILTER_SUPPORT = {
  reel: {
    brands: true,
    types: true,
    options: false,
    brakeSys: false
  },
  rod: {
    brands: true,
    types: false
  },
  lure: {
    brands: true,
    system: true,
    water_column: true,
    action: true
  }
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
    getDerivedRecommendations(selectedFilters = this.data.selectedFilters) {
      const { mappedType } = this.data;
      const typeConfig = defData.find((item) => item.type === mappedType);

      if (!typeConfig) return [];

      let ruleKey = '';
      if (mappedType === 'lure') ruleKey = 'derive_family_rules';
      else if (mappedType === 'reel') ruleKey = 'derive_family_reels';
      else if (mappedType === 'rod') ruleKey = 'derive_family_rods';

      const rules = typeConfig[ruleKey] || [];
      const familyMap = {};
      (typeConfig.family || []).forEach(f => { familyMap[f.id] = f; });

      const matchedKeywords = new Map();

      for (const rule of rules) {
        let isMatch = true;

        for (const [key, value] of Object.entries(rule.if)) {
          const userVal = selectedFilters[key];

          if (!userVal || (Array.isArray(userVal) && userVal.length === 0)) {
            isMatch = false;
            break;
          }

          const userValues = Array.isArray(userVal) ? userVal : [userVal];

          if (Array.isArray(value)) {
            const hasIntersection = userValues.some(uv => value.includes(uv));
            if (!hasIntersection) {
              isMatch = false;
              break;
            }
          } else if (!userValues.includes(value)) {
            isMatch = false;
            break;
          }
        }

        if (isMatch && rule.then && Array.isArray(rule.then)) {
          rule.then.forEach(id => {
            if (familyMap[id] && !matchedKeywords.has(id)) {
              const coverage = getRecommendationCoverage(mappedType, {
                id,
                name: familyMap[id].zh || id
              });
              matchedKeywords.set(id, {
                id,
                name: familyMap[id].zh || id,
                covered: coverage.covered,
                matchCount: coverage.matchCount
              });
            }
          });
        }
      }

      return Array.from(matchedKeywords.values());
    },

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

      const support = ACTIVE_FILTER_SUPPORT[type] || {};

      const mapOptions = (arr, idKey, nameKey) => (arr || []).map((item) => ({
        id: item[idKey],
        name: item[nameKey]
      }));

      const filters = [];

      if ((type === 'reel' || type === 'rod') && support.types && typeConfig.types) {
        filters.push({ key: 'types', label: '类别', options: mapOptions(typeConfig.types, 'type', 'name') });
      }

      if (type === 'reel') {
        if (support.options && typeConfig.options) {
          filters.push({ key: 'options', label: '功能特点', options: mapOptions(typeConfig.options, 'type', 'name') });
        }
        if (support.brakeSys && typeConfig.brakeSys) {
          filters.push({ key: 'brakeSys', label: '刹车系统', options: mapOptions(typeConfig.brakeSys, 'type', 'name') });
        }
      }

      if (type === 'lure') {
        if (support.system && typeConfig.system) {
          filters.push({ key: 'system', label: '类别', options: mapOptions(typeConfig.system, 'id', 'zh') });
        }
        if (support.water_column && typeConfig.water_column) {
          filters.push({ key: 'water_column', label: '水层', options: mapOptions(typeConfig.water_column, 'id', 'zh') });
        }
        if (support.action && typeConfig.action) {
          filters.push({ key: 'action', label: '主要动作', options: mapOptions(typeConfig.action, 'id', 'zh') });
        }
      }

      if (support.brands && typeConfig.brands) {
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
      this.setData({ recommendations: this.getDerivedRecommendations() });
    },

    selectRecommendation(e) {
      const id = e.currentTarget.dataset.id;
      const name = e.currentTarget.dataset.name;
      const covered = e.currentTarget.dataset.covered;
      if (!covered) {
        wx.showToast({
          title: '当前数据暂未覆盖该推荐词',
          icon: 'none'
        });
        return;
      }
      this.setData({ 
        isExpanded: false,
        recommendations: []
      });
      this.triggerEvent('filter', {
        filters: this.data.selectedFilters,
        searchText: '',
        selectedRecommendation: id ? { id, name: name || id } : null
      });
    },

    resetFilter() {
      this.setData({ selectedFilters: {}, recommendations: [] });
    },

    applyFilter() {
      this.setData({ isExpanded: false });
      const derivedKeywords = this.getDerivedRecommendations();
      this.triggerEvent('filter', { 
        filters: this.data.selectedFilters,
        searchText: this.data.searchText,
        derivedKeywords
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
