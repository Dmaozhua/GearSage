Component({
  properties: {
    items: {
      type: Array,
      value: []
    },
    selectedValue: {
      type: String,
      value: ''
    }
  },

  data: {
    isDarkMode: false,
    internalSelectedValue: ''
  },

  observers: {
    'selectedValue': function(newVal) {
      this.setData({
        internalSelectedValue: newVal
      });
    }
  },

  lifetimes: {
    attached() {
      this.setData({
        internalSelectedValue: this.data.selectedValue
      });
      this.initThemeMode();
    }
  },

  methods: {
    onRadioTap(e) {
      const { value, name } = e.currentTarget.dataset;
      if (this.data.internalSelectedValue !== name) {
        this.setData({
          internalSelectedValue: name
        });
        this.triggerEvent('change', { value: name });
      }
    },

    initThemeMode: function() {
      const app = getApp();
      this.setData({
        isDarkMode: app.globalData.isDarkMode || false
      });
    }
  }
});