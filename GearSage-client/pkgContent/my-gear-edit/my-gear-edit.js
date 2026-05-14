const api = require('../../services/api.js');
const auth = require('../../services/auth.js');
const { getInitialDarkMode, subscribeThemeChange, unsubscribeThemeChange } = require('../../utils/theme.js');

const TYPE_OPTIONS = [
  { key: 'reel', label: '鱼轮', apiType: 'reels' },
  { key: 'rod', label: '鱼竿', apiType: 'rods' },
  { key: 'lure', label: '常用饵', apiType: 'lures' }
];

const STATUS_OPTIONS = [
  { key: 'frequent', label: '常用' },
  { key: 'backup', label: '备用' },
  { key: 'idle', label: '已闲置' }
];

function safeDecode(value) {
  const text = String(value || '');
  try {
    return decodeURIComponent(text);
  } catch (error) {
    return text;
  }
}

function normalizeText(value) {
  return String(value || '').trim();
}

function toApiType(gearType) {
  const option = TYPE_OPTIONS.find((item) => item.key === gearType);
  return option ? option.apiType : 'reels';
}

function toGearType(value) {
  const text = normalizeText(value);
  if (text === 'rods') return 'rod';
  if (text === 'lures') return 'lure';
  if (text === 'reels') return 'reel';
  return TYPE_OPTIONS.some((item) => item.key === text) ? text : 'reel';
}

Page({
  data: {
    navBarHeight: 44,
    isDarkMode: false,
    mode: 'create',
    id: 0,
    typeOptions: TYPE_OPTIONS,
    statusOptions: STATUS_OPTIONS,
    gearType: 'reel',
    keyword: '',
    searchResults: [],
    selectedMaster: null,
    variantOptions: [],
    selectedVariantKey: '',
    selectedVariant: null,
    form: {
      displayName: '',
      usageStatus: 'frequent',
      isPublic: true,
      note: '',
      sortOrder: 0
    },
    searching: false,
    saving: false
  },

  onLoad(options = {}) {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const mode = options.mode === 'edit' ? 'edit' : 'create';
    this.setData({
      navBarHeight: (windowInfo.statusBarHeight || 0) + 44,
      isDarkMode: getInitialDarkMode(),
      mode,
      id: Number(options.id || 0),
      gearType: toGearType(options.gearType)
    });

    this.themeListener = ({ theme } = {}) => {
      this.setData({ isDarkMode: theme === 'dark' });
    };
    subscribeThemeChange(this.themeListener);

    if (mode === 'edit') {
      this.loadEditItem();
      return;
    }

    this.applyCreateOptions(options);
  },

  onUnload() {
    unsubscribeThemeChange(this.themeListener);
  },

  async ensureLogin() {
    try {
      await auth.ensureLogin();
      return true;
    } catch (error) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return false;
    }
  },

  async loadEditItem() {
    if (!(await this.ensureLogin())) return;

    try {
      const payload = await api.getUserGear({}, { silent: true });
      const item = (payload.items || []).find((entry) => Number(entry.id) === Number(this.data.id));
      if (!item) {
        wx.showToast({ title: '装备不存在', icon: 'none' });
        wx.navigateBack();
        return;
      }

      this.setData({
        gearType: item.gearType,
        selectedMaster: {
          id: item.gearMasterId,
          displayName: item.gearModel || item.displayName,
          brandName: item.brandName,
          imageUrl: item.imageUrl
        },
        selectedVariantKey: item.variantKey || '',
        selectedVariant: item.variantKey ? { key: item.variantKey, label: item.variantLabel || item.variantKey } : null,
        form: {
          displayName: item.displayName || '',
          usageStatus: item.usageStatus || 'frequent',
          isPublic: item.isPublic !== false,
          note: item.note || '',
          sortOrder: Number(item.sortOrder || 0)
        }
      });
    } catch (error) {
      console.error('[my-gear-edit] load edit failed:', error);
      wx.showToast({ title: api.getErrorMessage(error, '加载失败'), icon: 'none' });
    }
  },

  async applyCreateOptions(options = {}) {
    const gearMasterId = normalizeText(options.gearMasterId || options.masterId);
    const gearType = toGearType(options.gearType);
    const variantKey = safeDecode(options.variantKey || '');
    const variantLabel = safeDecode(options.variantLabel || '');
    const displayName = safeDecode(options.displayName || '');

    this.setData({
      gearType,
      selectedVariantKey: variantKey,
      selectedVariant: variantKey ? { key: variantKey, label: variantLabel || variantKey } : null,
      form: {
        ...this.data.form,
        displayName,
      }
    });

    if (gearMasterId) {
      await this.loadMasterDetail(gearMasterId, gearType, variantKey);
    } else {
      this.searchGear();
    }
  },

  onTypeChange(e) {
    const gearType = e.currentTarget.dataset.type || 'reel';
    this.setData({
      gearType,
      selectedMaster: null,
      variantOptions: [],
      selectedVariantKey: '',
      selectedVariant: null,
      searchResults: [],
      'form.displayName': ''
    });
    this.searchGear();
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value || '' });
  },

  async searchGear() {
    if (this.data.mode === 'edit') return;
    this.setData({ searching: true });
    try {
      const result = await api.getGearList({
        type: toApiType(this.data.gearType),
        page: 1,
        pageSize: 500
      }, { silent: true });
      const keyword = normalizeText(this.data.keyword).toLowerCase();
      const list = (result.list || []).map((item) => this.normalizeMaster(item));
      const filtered = keyword
        ? list.filter((item) => item.searchText.includes(keyword))
        : list.slice(0, 30);
      this.setData({ searchResults: filtered.slice(0, 50), searching: false });
    } catch (error) {
      console.error('[my-gear-edit] search failed:', error);
      this.setData({ searching: false });
      wx.showToast({ title: api.getErrorMessage(error, '搜索失败'), icon: 'none' });
    }
  },

  normalizeMaster(item = {}) {
    const images = Array.isArray(item.images)
      ? item.images
      : typeof item.images === 'string'
        ? item.images.split(',').map((entry) => entry.trim()).filter(Boolean)
        : [];
    const displayName = normalizeText(item.displayName || item.modelCn || item.model || item.name || item.id);
    const brandName = normalizeText(item.brand_name || item.brandName || '');
    return {
      ...item,
      id: normalizeText(item.id),
      displayName,
      brandName,
      imageUrl: images[0] || item.imageUrl || '/images/empty.png',
      searchText: [displayName, brandName, item.model, item.model_cn, item.alias].map((entry) => normalizeText(entry).toLowerCase()).join(' ')
    };
  },

  async onSelectMaster(e) {
    const id = e.currentTarget.dataset.id || '';
    if (!id) return;
    await this.loadMasterDetail(id, this.data.gearType, '');
  },

  async loadMasterDetail(id, gearType, preferredVariantKey = '') {
    try {
      const detail = await api.getGearDetail({
        id,
        type: toApiType(gearType)
      });
      const master = this.normalizeMaster(detail || {});
      const variants = (Array.isArray(detail && detail.variants) ? detail.variants : []).map((variant, index) => {
        const key = normalizeText(variant.variantId || variant.id || variant.SKU || variant.sku || variant.sourceKey || index);
        const label = normalizeText(variant.SKU || variant.sku || variant.variantId || key);
        return {
          ...variant,
          key,
          label
        };
      });
      const selectedVariant = variants.find((item) => item.key === preferredVariantKey) || variants[0] || null;
      const displayName = this.data.form.displayName || this.buildDisplayName(master, selectedVariant);
      this.setData({
        selectedMaster: master,
        variantOptions: variants,
        selectedVariantKey: selectedVariant ? selectedVariant.key : '',
        selectedVariant,
        searchResults: [],
        form: {
          ...this.data.form,
          displayName
        }
      });
    } catch (error) {
      console.error('[my-gear-edit] detail failed:', error);
      wx.showToast({ title: api.getErrorMessage(error, '加载装备失败'), icon: 'none' });
    }
  },

  onSelectVariant(e) {
    const key = e.currentTarget.dataset.key || '';
    const selectedVariant = (this.data.variantOptions || []).find((item) => item.key === key) || null;
    this.setData({
      selectedVariantKey: key,
      selectedVariant,
      form: {
        ...this.data.form,
        displayName: this.buildDisplayName(this.data.selectedMaster, selectedVariant)
      }
    });
  },

  buildDisplayName(master = {}, variant = null) {
    return [
      normalizeText(master.brandName),
      normalizeText(master.displayName),
      normalizeText(variant && variant.label)
    ].filter(Boolean).join(' ');
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field || '';
    if (!field) return;
    this.setData({
      [`form.${field}`]: e.detail.value || ''
    });
  },

  onStatusChange(e) {
    this.setData({ 'form.usageStatus': e.currentTarget.dataset.status || 'frequent' });
  },

  onPublicChange(e) {
    this.setData({ 'form.isPublic': Boolean(e.detail.value) });
  },

  async onSave() {
    if (!(await this.ensureLogin())) return;
    const form = this.data.form || {};

    if (!normalizeText(form.displayName)) {
      wx.showToast({ title: '请填写展示名称', icon: 'none' });
      return;
    }

    if (this.data.mode !== 'edit' && !(this.data.selectedMaster && this.data.selectedMaster.id)) {
      wx.showToast({ title: '请选择装备', icon: 'none' });
      return;
    }

    this.setData({ saving: true });
    try {
      if (this.data.mode === 'edit') {
        await api.updateUserGear(this.data.id, {
          displayName: normalizeText(form.displayName),
          usageStatus: form.usageStatus || 'frequent',
          isPublic: form.isPublic !== false,
          note: normalizeText(form.note),
          sortOrder: Number(form.sortOrder || 0)
        }, { silent: true });
      } else {
        const variant = this.data.selectedVariant || {};
        await api.createUserGear({
          gearType: this.data.gearType,
          gearMasterId: this.data.selectedMaster.id,
          gearVariantId: normalizeText(variant.variantId || ''),
          variantKey: normalizeText(variant.key || this.data.selectedVariantKey),
          variantLabel: normalizeText(variant.label || ''),
          displayName: normalizeText(form.displayName),
          usageStatus: form.usageStatus || 'frequent',
          isPublic: form.isPublic !== false,
          note: normalizeText(form.note)
        }, { silent: true });
      }

      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      console.error('[my-gear-edit] save failed:', error);
      wx.showToast({ title: api.getErrorMessage(error, '保存失败'), icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  }
});
