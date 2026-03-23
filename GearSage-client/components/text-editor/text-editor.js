// components/text-editor/text-editor.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 文本内容
    value: {
      type: String,
      value: ''
    },
    // 占位符
    placeholder: {
      type: String,
      value: '请输入内容...'
    },
    tipsLines: {
      type: Array,
      value: []
    },
    // 最大长度
    maxLength: {
      type: Number,
      value: 1000
    },
    // 编辑器标题
    title: {
      type: String,
      value: '编辑内容'
    },
    // 编辑器高度（rpx）
    editorHeight: {
      type: Number,
      value: 600
    },
    // 预览模式下显示的最大字符数
    previewMaxLength: {
      type: Number,
      value: 100
    },
    // 是否自动聚焦
    autoFocus: {
      type: Boolean,
      value: true
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isDarkMode: false,
    isEditing: false,
    tempValue: '',
    showFullContent: false,
    previewText: '',
    needExpand: false,
    previewDisplayNodes: [],
    fullDisplayNodes: [],
    hasContent: false,
    showTips: false
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.initThemeMode();
      this.initData();
      
      // 监听全局主题变化
      const app = getApp();
      if (app.globalData.themeChangeListeners) {
        app.globalData.themeChangeListeners.push(() => {
          this.setData({
            isDarkMode: app.globalData.isDarkMode || false
          });
        });
      }
    },
    
    detached() {
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
   * 监听属性变化
   */
  observers: {
    'value, previewMaxLength': function(value, previewMaxLength) {
      const normalizedValue = this.normalizeText(value || '');
      this.setData({
        tempValue: normalizedValue
      });
      this.updatePreviewData(normalizedValue);
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

    /**
     * 初始化数据
     */
    initData() {
      const normalizedValue = this.normalizeText(this.properties.value || '');
      this.setData({
        tempValue: normalizedValue
      });
      this.updatePreviewData(normalizedValue);
    },

    /**
     * 更新预览数据
     */
    updatePreviewData(overrideValue) {
      const { previewMaxLength } = this.properties;
      const sourceValue = typeof overrideValue === 'string' ? overrideValue : this.properties.value || '';
      const normalizedValue = this.normalizeText(sourceValue);
      const { previewText, needExpand } = this.createPreviewText(normalizedValue, previewMaxLength);
      const shouldShowFullContent = needExpand ? this.data.showFullContent : false;

      this.setData({
        previewText,
        needExpand,
        showFullContent: shouldShowFullContent,
        previewDisplayNodes: this.createRichTextNodes(previewText),
        fullDisplayNodes: this.createRichTextNodes(normalizedValue),
        hasContent: normalizedValue.length > 0
      });
    },

    /**
     * 进入编辑模式
     */
    onEdit() {
      if (this.properties.disabled) return;

      this.setData({
        isEditing: true,
        tempValue: this.normalizeText(this.properties.value || '')
      });
      
      // 触发编辑开始事件
      this.triggerEvent('editstart', {
        value: this.properties.value
      });
    },

    /**
     * 取消编辑
     */
    onCancel() {
      this.setData({
        isEditing: false,
        tempValue: this.normalizeText(this.properties.value || '')
      });
      
      // 触发编辑取消事件
      this.triggerEvent('editcancel', {
        value: this.properties.value
      });
    },

    /**
     * 确认编辑
     */
    onConfirm() {
      const { tempValue } = this.data;
      
      this.setData({
        isEditing: false
      });

      this.updatePreviewData(tempValue);

      // 触发值变化事件
      this.triggerEvent('change', {
        value: tempValue
      });
      
      // 触发编辑完成事件
      this.triggerEvent('editend', {
        value: tempValue,
        oldValue: this.properties.value
      });
    },

    /**
     * 输入事件
     */
    onInput(e) {
      const { value } = e.detail;
      const normalizedValue = this.normalizeText(value);
      this.setData({
        tempValue: normalizedValue
      });

      // 触发输入事件
      this.triggerEvent('input', {
        value: normalizedValue
      });
    },

    /**
     * 切换展开/收起
     */
    onToggleExpand(e) {
      // 在微信小程序中，通过 catch 事件绑定来阻止冒泡
      // 这里不需要调用 stopPropagation
      
      const nextExpandState = !this.data.showFullContent;

      this.setData({
        showFullContent: nextExpandState
      });

      // 触发展开状态变化事件
      this.triggerEvent('expandchange', {
        expanded: nextExpandState
      });
    },

    /**
     * 切换提示显示
     */
    onToggleTips() {
      this.setData({
        showTips: !this.data.showTips
      });
    },

    /**
     * 获取当前值
     */
    getValue() {
      if (this.data.isEditing) {
        return this.data.tempValue;
      }

      return this.normalizeText(this.properties.value || '');
    },

    /**
     * 设置值
     */
    setValue(value) {
      const normalizedValue = this.normalizeText(value || '');
      this.setData({
        tempValue: normalizedValue
      });

      this.updatePreviewData(normalizedValue);

      if (!this.data.isEditing) {
        this.triggerEvent('change', {
          value: normalizedValue
        });
      }
    },

    /**
     * 获取编辑状态
     */
    getEditingState() {
      return this.data.isEditing;
    },

    /**
     * 强制退出编辑模式
     */
    exitEdit() {
      if (this.data.isEditing) {
        this.onCancel();
      }
    },

    /**
     * 标准化输入文本，统一换行和缩进
     */
    normalizeText(text) {
      if (typeof text !== 'string') return '';

      let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      normalized = normalized.replace(/\t/g, '    ');

      return normalized;
    },

    /**
     * 构建预览文本和展开状态
     */
    createPreviewText(text, maxLength) {
      if (!text) {
        return {
          previewText: '',
          needExpand: false
        };
      }

      const characters = Array.from(text);
      const safeMaxLength = typeof maxLength === 'number' && maxLength > 0 ? maxLength : characters.length;

      if (characters.length <= safeMaxLength) {
        return {
          previewText: text,
          needExpand: false
        };
      }

      const truncated = characters.slice(0, safeMaxLength).join('');

      return {
        previewText: `${truncated}...`,
        needExpand: true
      };
    },

    /**
     * 将纯文本转换为富文本节点，确保特殊字符正确显示
     */
    createRichTextNodes(text) {
      if (!text) {
        return [];
      }

      return [{
        name: 'pre',
        attrs: {
          class: 'preview-pre'
        },
        children: [{
          type: 'text',
          text
        }]
      }];
    }
  }
});
