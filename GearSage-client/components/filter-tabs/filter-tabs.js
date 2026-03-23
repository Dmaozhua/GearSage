const DEFAULT_COLLAPSE_THRESHOLD = 7;

Component({
  properties: {
    filters: {
      type: Array,
      value: []
    },
    currentFilter: {
      type: String,
      value: ''
    },
    currentSubFilter: {
      type: String,
      value: ''
    },
    collapseThreshold: {
      type: Number,
      value: DEFAULT_COLLAPSE_THRESHOLD
    },
    enableCollapse: {
      type: Boolean,
      value: true
    },
    themeClass: {
      type: String,
      value: ''
    },
    // 新增：是否在切换一级筛选时重置二级到默认
    resetSubOnPrimaryChange: {
      type: Boolean,
      value: true
    },
    // 新增：接收当前布局模式（list / waterfall）以确定切换方向与图标
    layoutMode: {
      type: String,
      value: 'list'
    }
  },

  data: {
    visibleSubFilters: [],
    hasMoreSubFilters: false,
    isSubExpanded: false,
    // 新增：二级筛选可见性，默认隐藏
    isSubVisible: false,
    totalSubFilters: []
  },

  observers: {
    'filters,currentFilter,currentSubFilter,isSubExpanded,collapseThreshold,enableCollapse': function(filters, currentFilter, currentSubFilter) {
      this.updateDisplayedSubFilters(filters, currentFilter, currentSubFilter);
    }
  },

  methods: {
    updateDisplayedSubFilters(filters, currentFilter, currentSubFilter) {
      const threshold = Number(this.data.collapseThreshold) || DEFAULT_COLLAPSE_THRESHOLD;
      const enableCollapse = Boolean(this.data.enableCollapse);
      const activeFilter = Array.isArray(filters) ? filters.find(item => item && item.key === currentFilter) : null;
      const subFilters = activeFilter && Array.isArray(activeFilter.subFilters) ? activeFilter.subFilters : [];
      const hasMore = enableCollapse && subFilters.length > threshold;

      let displayed = subFilters;
      if (!this.data.isSubExpanded && hasMore) {
        displayed = subFilters.slice(0, threshold);
        if (currentSubFilter) {
          const activeSub = subFilters.find(item => item && item.key === currentSubFilter);
          if (activeSub && !displayed.some(item => item && item.key === activeSub.key)) {
            displayed = displayed.concat(activeSub);
          }
        }
      }

      this.setData({
        visibleSubFilters: displayed,
        hasMoreSubFilters: hasMore,
        totalSubFilters: subFilters
      });
    },

    onFilterTap(event) {
      const { key } = event.currentTarget.dataset;
      if (!key || key === this.data.currentFilter) {
        return;
      }

      const filters = this.data.filters || [];
      const activeFilter = filters.find(item => item && item.key === key) || {};
      const subFilters = Array.isArray(activeFilter.subFilters) ? activeFilter.subFilters : [];
      let nextSubKey = this.data.currentSubFilter;
      let subChanged = false;

      if (subFilters.length === 0) {
        nextSubKey = '';
        subChanged = this.data.currentSubFilter !== '';
      } else if (this.data.resetSubOnPrimaryChange) {
        const defaultSub = subFilters.find(item => item && item.isDefault) || subFilters[0];
        nextSubKey = defaultSub ? defaultSub.key : '';
        subChanged = nextSubKey !== this.data.currentSubFilter;
      } else if (!subFilters.some(item => item && item.key === nextSubKey)) {
        const defaultSub = subFilters.find(item => item && item.isDefault) || subFilters[0];
        nextSubKey = defaultSub ? defaultSub.key : '';
        subChanged = true;
      }

      this.setData({ isSubExpanded: false });

      this.triggerEvent('filterchange', {
        key,
        subKey: nextSubKey,
        subChanged
      });
    },

    onSubFilterTap(event) {
      const { key } = event.currentTarget.dataset;
      if (!key || key === this.data.currentSubFilter) {
        return;
      }

      this.triggerEvent('subfilterchange', {
        key,
        parentKey: this.data.currentFilter
      });
    },

    // 切换二级筛选显示/收起
    toggleSubFilters() {
      const nextVisible = !this.data.isSubVisible;
      // 当收起时同时重置展开状态；展开逻辑保留（可按需再扩展）
      const nextExpanded = nextVisible ? this.data.isSubExpanded : false;

      this.setData({
        isSubVisible: nextVisible,
        isSubExpanded: nextExpanded
      });

      this.triggerEvent('toggle', {
        visible: nextVisible,
        expanded: nextExpanded,
        parentKey: this.data.currentFilter
      });
    },

    // 新增：布局切换按钮点击
    onLayoutToggleTap() {
      const current = (this.data.layoutMode || 'list').trim();
      const nextMode = current === 'waterfall' ? 'list' : 'waterfall';
      this.triggerEvent('layouttoggle', {
        mode: nextMode,
        parentKey: this.data.currentFilter
      });
    }
  }
});
