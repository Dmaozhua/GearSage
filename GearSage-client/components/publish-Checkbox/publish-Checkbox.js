Component({
  data: {
    isDarkMode: false,
    checkboxItems: [
      {
        id: 'rod',
        label: '鱼竿',
        icon: '/images/icons/publis/竿.png',
        checked: true  // 默认选中第一个选项
      },
      {
        id: 'reel',
        label: '渔轮',
        icon: '/images/icons/publis/轮.png',
        checked: false
      },
      {
        id: 'bait',
        label: '假饵',
        icon: '/images/icons/publis/饵.png',
        checked: false
      },
      {
        id: 'line',
        label: '鱼线',
        icon: '/images/icons/publis/线.png',
        checked: false
      },
      {
        id: 'hook',
        label: '鱼钩',
        icon: '/images/icons/publis/钩.png',
        checked: false
      },
      {
        id: 'other',
        label: '其他',
        icon: '/images/icons/publis/其他.png',
        checked: false
      }
    ]
  },

  lifetimes: {
    attached: function() {
      this.initThemeMode();
      // 监听全局主题变化
      const app = getApp();
      if (app.onThemeChange) {
        app.onThemeChange((isDarkMode) => {
          this.setData({ isDarkMode });
          this.updateIcons(isDarkMode);
        });
      }
    },
    
    detached: function() {
      // 组件销毁时清理监听器
      const app = getApp();
      if (app.offThemeChange) {
        app.offThemeChange();
      }
    }
  },

  methods: {
    /**
     * 获取图标路径
     */
    getIconPath: function(id, isDarkMode, checked) {
      const nameMapping = {
        'rod': '竿',
        'reel': '轮',
        'bait': '饵',
        'line': '线',
        'hook': '钩',
        'other': '其他'
      };
      
      const name = nameMapping[id];
      if (!name) return '';

      // 夜间模式且未选中时，使用夜间图标
      // 其他情况（白天模式 或 夜间模式下选中）使用正常图标
      if (isDarkMode && !checked) {
        return `/images/icons/${name}-夜晚.png`;
      } else {
        return `/images/icons/publis/${name}.png`;
      }
    },

    /**
     * 更新列表项的图标
     */
    updateItemsIcons: function(items) {
      const { isDarkMode } = this.data;
      return items.map(item => ({
        ...item,
        icon: this.getIconPath(item.id, isDarkMode, item.checked)
      }));
    },

    onCheckboxTap: function(e) {
      const itemId = e.currentTarget.dataset.id;
      const checkboxItems = this.data.checkboxItems;
      
      // 单选模式：只有点击的项被选中，其他项取消选中
      let updatedItems = checkboxItems.map(item => {
        return {
          ...item,
          checked: item.id === itemId
        };
      });

      // 更新图标
      updatedItems = this.updateItemsIcons(updatedItems);

      this.setData({
        checkboxItems: updatedItems
      });

      // 触发事件，返回选中的项（单选模式下只有一个）
      const selectedItem = updatedItems.find(item => item.checked);
      this.triggerEvent('checkboxChange', {
        selectedItem: selectedItem,
        selectedItems: [selectedItem]  // 保持兼容性
      });

      console.log('Selected item:', selectedItem);
    },

    getSelectedItems: function() {
      return this.data.checkboxItems.filter(item => item.checked);
    },

    getSelectedItem: function() {
      return this.data.checkboxItems.find(item => item.checked);
    },

    setSelectedItems: function(selectedIds) {
      const checkboxItems = this.data.checkboxItems;
      let updatedItems = checkboxItems.map(item => ({
        ...item,
        checked: selectedIds.includes(item.id)
      }));

      // 更新图标
      updatedItems = this.updateItemsIcons(updatedItems);

      this.setData({
        checkboxItems: updatedItems
      });
    },

    setSelectedItem: function(selectedId) {
      const checkboxItems = this.data.checkboxItems;
      let updatedItems = checkboxItems.map(item => ({
        ...item,
        checked: item.id === selectedId
      }));

      // 更新图标
      updatedItems = this.updateItemsIcons(updatedItems);

      this.setData({
        checkboxItems: updatedItems
      });
    },

    clearAllSelections: function() {
      const checkboxItems = this.data.checkboxItems;
      let updatedItems = checkboxItems.map(item => ({
        ...item,
        checked: false
      }));

      // 更新图标
      updatedItems = this.updateItemsIcons(updatedItems);

      this.setData({
        checkboxItems: updatedItems
      });
    },

    initThemeMode: function() {
      const app = getApp();
      const isDarkMode = app.globalData.isDarkMode || false;
      this.setData({
        isDarkMode: isDarkMode
      });
      // 初始化时也要更新图标
      const updatedItems = this.updateItemsIcons(this.data.checkboxItems);
      this.setData({
        checkboxItems: updatedItems
      });
    },

    updateIcons: function(isDarkMode) {
      // 这里的 updateIcons 是为了响应主题变化的
      // 原来的参数 isDarkMode 是传入的新的 mode
      // 但 this.data.isDarkMode 可能还没更新，所以这里要小心
      // 不过 initThemeMode 里已经 setData 了
      
      // 为了安全起见，我们重新基于传入的 isDarkMode 计算
      const updatedItems = this.data.checkboxItems.map(item => ({
        ...item,
        icon: this.getIconPath(item.id, isDarkMode, item.checked)
      }));

      this.setData({
        checkboxItems: updatedItems
      });
    }
  }
});