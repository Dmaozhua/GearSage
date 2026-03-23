const { validateWithRules } = require('../../utils/postValidators');
const { chooseAndUploadImages } = require('../../utils/imageUploadUtils');
const { getInitialDarkMode, subscribeThemeChange, unsubscribeThemeChange } = require('../../utils/theme');

const CUSTOM_FISH_PATTERN = /^[\u4e00-\u9fa5]{1,8}$/;

const TRIP_FORM_RULES = [
  {
    field: 'title',
    validators: [
      { type: 'required', message: '请输入标题', trim: true },
      { type: 'maxLength', value: 30, message: '标题不能超过30个字符' }
    ]
  },
  {
    field: 'tripResult',
    validators: [
      { type: 'required', message: '请选择钓行结果' }
    ]
  },
  {
    field: 'targetFish',
    getValue(formData) {
      return {
        selected: formData.targetFish || [],
        custom: formData.customTargetFish || ''
      };
    },
    validators: [
      {
        type: 'custom',
        validate(value) {
          const selected = Array.isArray(value.selected) ? value.selected : [];
          const custom = typeof value.custom === 'string' ? value.custom.trim() : '';

          if (!selected.length && !custom) {
            return '请选择目标鱼或输入自定义鱼种';
          }

          if (custom && !CUSTOM_FISH_PATTERN.test(custom)) {
            return '自定义鱼种只能输入中文，最多8个字';
          }

          if (selected.length + (custom ? 1 : 0) > 3) {
            return '目标鱼最多选择3个';
          }

          return true;
        }
      }
    ]
  },
  {
    field: 'season',
    validators: [
      { type: 'required', message: '请选择季节' }
    ]
  },
  {
    field: 'weather',
    validators: [
      { type: 'required', message: '请选择天气情况' }
    ]
  },
  {
    field: 'waterType',
    validators: [
      { type: 'required', message: '请选择水域类型' }
    ]
  },
  {
    field: 'mainSpot',
    validators: [
      { type: 'required', message: '请选择主要钓点' }
    ]
  },
  {
    field: 'fishingTime',
    validators: [
      { type: 'required', message: '请选择作钓时间' }
    ]
  },
  {
    field: 'rigs',
    validators: [
      { type: 'required', message: '请选择主要钓组/饵型' }
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
    formData: {
      title: '',
      tripResult: '',
      tripStatus: [],
      targetFish: [],
      customTargetFish: '',
      season: '',
      weather: '',
      waterType: '',
      mainSpot: '',
      fishingTime: '',
      envFeelings: [],
      rigs: [],
      rigDescription: '',
      content: '',
      images: []
    },
    errors: {
      title: '',
      tripResult: '',
      targetFish: '',
      season: '',
      weather: '',
      waterType: '',
      mainSpot: '',
      fishingTime: '',
      rigs: ''
    },
    titlePlaceholder: '鱼到底在想什么？',
    titleDefaults: [
      '鱼到底在想什么？',
      '一天都在和障碍较劲',
      '找到鱼了，就是不肯吃',
      '窗口期来得太突然',
      '打龟，但不是没收获',
      '今天只认一种饵'
    ],
    tripResults: [
      '打龟了',
      '爆连',
      '有几口但没打中',
      '只中了一两条',
      '稳定出鱼',
      '有鱼但不大',
      '有惊喜',
      '大的跑了',
      '全都不大'
    ],
    tripStatuses: [
      '磨了一天鱼',
      '只吃无铅',
      '只给反应饵',
      '找不到鱼',
      '拔了一天草',
      '全在障碍里',
      '只追不咬',
      '就没看见鱼',
      'Duang 的一口',
      '窗口期很短',
      '有口但抓不住',
      '只在特定结构出鱼',
      '鱼在，就是不开口'
    ],
    targetFishOptions: [
      '鲈鱼',
      '鳜鱼',
      '黑鱼',
      '翘嘴',
      '马口',
      '溪哥',
      '罗非',
      '狗鱼',
      '鲤鱼',
      '军鱼',
      '鲶鱼',
      '青稍',
      '红眼',
      '鲫鱼',
      '黑头',
      '黄鱼',
      '海鲈',
      '鲳鱼',
      '沙塘鳢'
    ],
    seasons: ['春', '夏', '秋', '冬', '不好说'],
    weathers: ['晴', '阴', '小雨', '大雨后', '侧风', '闷热', '降温', '回暖', '阴转晴'],
    waterTypes: ['溪流', '江河', '水库', '湖泊', '近海', '黑坑', '练竿塘', '野塘', '城市河道', '港湾'],
    mainSpots: [
      '岸边浅滩',
      '深浅交界',
      '障碍边',
      '草区边缘',
      '回水湾',
      '明水区',
      '石头区',
      '桥墩附近',
      '闸口/进出水口',
      '贴岸结构',
      '开阔水面',
      '阴影区'
    ],
    fishingTimes: ['清晨', '上午', '中午', '下午', '傍晚', '夜钓', '全天'],
    envFeelings: ['舒服', '闷', '燥热', '小雨', '有雾', '多云', '有点冷', '风大', '水流缓', '水流急', '水浑', '水清'],
    rigOptions: [
      '无铅',
      '德州',
      '铅头钩',
      '倒钓',
      '亮片',
      'VIB',
      '米诺',
      '波爬',
      '铅笔',
      '胖子',
      '软饵',
      '跳底',
      '匀速',
      '抽停',
      '搜索',
      '拖底',
      '贴结构'
    ]
  },

  lifetimes: {
    attached() {
      this.initThemeMode();
      this._themeChangeHandler = subscribeThemeChange(({ theme }) => {
        this.setData({ isDarkMode: theme === 'dark' });
      });

      const randomIdx = Math.floor(Math.random() * this.data.titleDefaults.length);
      this.setData({ titlePlaceholder: this.data.titleDefaults[randomIdx] });

      if (this.properties.initialData) {
        this.setData({
          formData: { ...this.data.formData, ...this.properties.initialData }
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

    sanitizeCustomTargetFish(value) {
      return (value || '')
        .replace(/\s+/g, '')
        .replace(/[^\u4e00-\u9fa5]/g, '')
        .slice(0, 8);
    },

    toggleMultiValue(field, value, options = {}) {
      const { max, errorField, maxMessage, extraCount = 0 } = options;
      const currentValues = this.data.formData[field] || [];
      let nextValues;

      if (currentValues.includes(value)) {
        nextValues = currentValues.filter(item => item !== value);
      } else {
        if (max && currentValues.length + extraCount >= max) {
          wx.showToast({ title: maxMessage, icon: 'none' });
          return;
        }
        nextValues = [...currentValues, value];
      }

      this.updateFormField(field, nextValues, errorField);
    },

    onTitleInput(e) {
      this.updateFormField('title', e.detail.value, 'title');
    },

    onTitleFocus() {},

    onDefaultTitleSelect(e) {
      this.updateFormField('title', e.currentTarget.dataset.value, 'title');
    },

    onTripResultSelect(e) {
      this.updateFormField('tripResult', e.currentTarget.dataset.value, 'tripResult');
    },

    onTripStatusSelect(e) {
      this.toggleMultiValue('tripStatus', e.currentTarget.dataset.value, {
        max: 2,
        maxMessage: '状态最多选择2个'
      });
    },

    onTargetFishSelect(e) {
      const extraCount = this.data.formData.customTargetFish ? 1 : 0;
      this.toggleMultiValue('targetFish', e.currentTarget.dataset.value, {
        max: 3,
        errorField: 'targetFish',
        maxMessage: '目标鱼最多选择3个',
        extraCount
      });
    },

    onCustomTargetFishInput(e) {
      const value = this.sanitizeCustomTargetFish(e.detail.value);
      const hasExistingCustom = Boolean(this.data.formData.customTargetFish);
      const selectedCount = Array.isArray(this.data.formData.targetFish) ? this.data.formData.targetFish.length : 0;

      if (!hasExistingCustom && value && selectedCount >= 3) {
        wx.showToast({ title: '目标鱼最多选择3个', icon: 'none' });
        return;
      }

      this.updateFormField('customTargetFish', value, 'targetFish');
    },

    onSeasonSelect(e) {
      this.updateFormField('season', e.currentTarget.dataset.value, 'season');
    },

    onWeatherSelect(e) {
      this.updateFormField('weather', e.currentTarget.dataset.value, 'weather');
    },

    onWaterTypeSelect(e) {
      this.updateFormField('waterType', e.currentTarget.dataset.value, 'waterType');
    },

    onMainSpotSelect(e) {
      this.updateFormField('mainSpot', e.currentTarget.dataset.value, 'mainSpot');
    },

    onFishingTimeSelect(e) {
      this.updateFormField('fishingTime', e.currentTarget.dataset.value, 'fishingTime');
    },

    onEnvFeelingSelect(e) {
      this.toggleMultiValue('envFeelings', e.currentTarget.dataset.value, {
        max: 3,
        maxMessage: '环境感受最多选择3个'
      });
    },

    onRigSelect(e) {
      this.toggleMultiValue('rigs', e.currentTarget.dataset.value, {
        errorField: 'rigs'
      });
    },

    onRigDescriptionInput(e) {
      this.updateFormField('rigDescription', e.detail.value);
    },

    onContentInput(e) {
      this.updateFormField('content', e.detail.value);
    },

    async onChooseImage() {
      try {
        const currentCount = this.data.formData.images.length;
        const count = 9 - currentCount;
        if (count <= 0) return;

        const fileIDs = await chooseAndUploadImages({
          count,
          prefix: 'trip',
          showLoading: true
        });

        if (!Array.isArray(fileIDs) || fileIDs.length === 0) return;

        const newImages = [...this.data.formData.images, ...fileIDs];
        this.updateFormField('images', newImages);
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
      const result = validateWithRules(formData, TRIP_FORM_RULES);

      if (!result.isValid) {
        this.setData({ errors: result.errors });
        wx.showToast({ title: '请检查必填项', icon: 'none' });
        return;
      }

      this.triggerEvent('submit', {
        formData: {
          ...formData,
          topicCategory: 4
        }
      });
    }
  }
});
