const { validateWithRules } = require('../../utils/postValidators');
const { chooseAndUploadImages } = require('../../utils/imageUploadUtils');
const { getInitialDarkMode, subscribeThemeChange, unsubscribeThemeChange } = require('../../utils/theme');

const CATCH_FORM_RULES = [
  {
    field: 'title',
    validators: [
      { type: 'required', message: '请给这次鱼获起个标题吧', trim: true },
      { type: 'maxLength', value: 30, message: '标题不能超过30个字符' }
    ]
  },
  {
    field: 'images',
    validators: [
      { type: 'required', message: '至少需要上传1张图片' },
      { type: 'minItems', value: 1, message: '至少需要上传1张图片' },
      { type: 'maxItems', value: 9, message: '最多只能上传9张图片' }
    ]
  },
  {
    field: 'locationTag',
    validators: [
      { type: 'required', message: '请选择标点' }
    ]
  }
];

Component({
  properties: {
    initialData: {
      type: Object,
      value: {}
    }
  },

  data: {
    isDarkMode: false,
    locationDrawerVisible: false,
    formData: {
      title: '',
      images: [],
      locationTag: '',
      length: '',
      isLengthSecret: false,
      isLengthEstimated: false,
      weight: '',
      isWeightSecret: false,
      isWeightEstimated: false
    },
    errors: {
      title: '',
      images: '',
      locationTag: ''
    },
    defaultTitles: [
      '今天这条有点意思',
      'Duang的一口',
      '又来交作业了',
      '今日战报',
      '这条鱼你给打几分',
      '这波不亏',
      '挑战全网',
      '解锁新鱼种'
    ],
    locationTags: [
      '自家菜地',
      '家门口',
      '保密',
      '超市水产区',
      '太平洋',
      '泡枸杞的保温杯',
      '下水道',
      '梦中标点',
      '神秘水域',
      '不方便透露',
      '朋友说不能发',
      '地图上没有',
      '导航导不到',
      '海洋馆',
      '杰里米·瓦德的旁边',
      '空军基地',
      '空军一号鞋盒里',
      '空军一号专卖店',
      'VIP解锁钓点',
      '限时体验',
      '正在加载中...',
      '信号不太好',
      '已删除',
      '系统升级中',
      '权限不足',
      '未成年人禁止',
      '隐藏关卡',
      '老板的养殖场',
      '河神指定的位置',
      '老婆不让说',
      '老公不让说',
      '被鱼拉过去的',
      '跟着白条走的',
      '鱼自己跳上来的地方',
      '评论后解锁',
      '点赞后解锁'
    ].map(item => item.startsWith('#') ? item : `#${item}`)
  },

  lifetimes: {
    attached() {
      this.initThemeMode();
      this._themeChangeHandler = subscribeThemeChange(({ theme }) => {
        this.setData({ isDarkMode: theme === 'dark' });
      });

      if (this.properties.initialData) {
        const initialData = { ...this.properties.initialData };
        if (initialData.locationTag) {
          initialData.locationTag = this.normalizeLocationTag(initialData.locationTag);
        }
        this.setData({
          formData: { ...this.data.formData, ...initialData }
        });
      }
    },
    detached() {
      unsubscribeThemeChange(this._themeChangeHandler);
      this._themeChangeHandler = null;
    }
  },

  methods: {
    initThemeMode() {
      this.setData({ isDarkMode: getInitialDarkMode() });
    },

    normalizeLocationTag(value) {
      const text = String(value || '').trim();
      if (!text) {
        return '';
      }
      return text.startsWith('#') ? text : `#${text}`;
    },

    updateFormField(field, value, errorField) {
      const updates = {
        [`formData.${field}`]: value
      };

      if (errorField) {
        updates[`errors.${errorField}`] = '';
      }

      this.setData(updates, () => {
        this.triggerEvent('datachange', { field, value });
      });
    },

    updateFormFields(fields, clearedErrors = []) {
      const updates = {};
      Object.keys(fields).forEach((field) => {
        updates[`formData.${field}`] = fields[field];
      });
      clearedErrors.forEach((field) => {
        updates[`errors.${field}`] = '';
      });

      this.setData(updates, () => {
        Object.keys(fields).forEach((field) => {
          this.triggerEvent('datachange', { field, value: fields[field] });
        });
      });
    },

    normalizeMeasureValue(value) {
      let normalized = String(value || '').replace(/[^\d.]/g, '');
      const parts = normalized.split('.');
      if (parts.length > 2) {
        normalized = `${parts[0]}.${parts.slice(1).join('')}`;
      }
      return normalized.slice(0, 10);
    },

    onTitleInput(e) {
      this.updateFormField('title', e.detail.value, 'title');
    },

    onDefaultTitleSelect(e) {
      this.updateFormField('title', e.currentTarget.dataset.value, 'title');
    },

    onOpenLocationDrawer() {
      this.setData({ locationDrawerVisible: true });
    },

    onCloseLocationDrawer() {
      this.setData({ locationDrawerVisible: false });
    },

    onLocationTagSelect(e) {
      const value = e.currentTarget.dataset.value || '';
      this.updateFormField('locationTag', this.normalizeLocationTag(value), 'locationTag');
    },

    onLengthInput(e) {
      this.updateFormField('length', this.normalizeMeasureValue(e.detail.value));
    },

    onLengthSecretChange(e) {
      const checked = Boolean(e.detail.value);
      this.updateFormFields({
        isLengthSecret: checked,
        isLengthEstimated: checked ? false : this.data.formData.isLengthEstimated
      });
    },

    onLengthEstimatedChange(e) {
      const checked = Boolean(e.detail.value);
      this.updateFormFields({
        isLengthEstimated: checked,
        isLengthSecret: checked ? false : this.data.formData.isLengthSecret
      });
    },

    onWeightInput(e) {
      this.updateFormField('weight', this.normalizeMeasureValue(e.detail.value));
    },

    onWeightSecretChange(e) {
      const checked = Boolean(e.detail.value);
      this.updateFormFields({
        isWeightSecret: checked,
        isWeightEstimated: checked ? false : this.data.formData.isWeightEstimated
      });
    },

    onWeightEstimatedChange(e) {
      const checked = Boolean(e.detail.value);
      this.updateFormFields({
        isWeightEstimated: checked,
        isWeightSecret: checked ? false : this.data.formData.isWeightSecret
      });
    },

    async onChooseImage() {
      try {
        const currentCount = this.data.formData.images.length;
        const count = 9 - currentCount;
        if (count <= 0) return;

        const fileIDs = await chooseAndUploadImages({
          count,
          prefix: 'catch',
          showLoading: true
        });

        if (!Array.isArray(fileIDs) || fileIDs.length === 0) return;

        const newImages = [...this.data.formData.images, ...fileIDs];
        this.updateFormField('images', newImages, 'images');
      } catch (error) {
        console.error('上传图片失败:', error);
        wx.showToast({ title: '上传图片失败', icon: 'none' });
      }
    },

    onDeleteImage(e) {
      const index = Number(e.currentTarget.dataset.index);
      const images = [...this.data.formData.images];
      images.splice(index, 1);
      this.updateFormField('images', images);
    },

    onPreviewImage(e) {
      const src = e.currentTarget.dataset.src;
      wx.previewImage({
        current: src,
        urls: this.data.formData.images
      });
    },

    onSubmit() {
      const { formData } = this.data;
      const result = validateWithRules(formData, CATCH_FORM_RULES);

      if (!result.isValid) {
        this.setData({ errors: result.errors });
        wx.showToast({ title: '请检查必填项', icon: 'none' });
        return;
      }

      this.triggerEvent('submit', {
        formData: {
          ...formData,
          topicCategory: 3
        }
      });
    }
  }
});
