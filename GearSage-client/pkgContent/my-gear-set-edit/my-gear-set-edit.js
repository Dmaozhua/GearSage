const api = require('../../services/api.js');
const auth = require('../../services/auth.js');
const { getInitialDarkMode, subscribeThemeChange, unsubscribeThemeChange } = require('../../utils/theme.js');

const ROLE_LABELS = {
  rod: '鱼竿',
  reel: '渔轮',
  lure: '常用饵'
};

function normalizeNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function splitTags(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/[，,、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinTags(value) {
  return (Array.isArray(value) ? value : []).map((item) => String(item || '').trim()).filter(Boolean).join('、');
}

function getErrorPayload(error) {
  return (error && error.data && typeof error.data === 'object') ? error.data : (error || {});
}

Page({
  data: {
    navBarHeight: 44,
    isDarkMode: false,
    mode: 'create',
    id: 0,
    loading: true,
    saving: false,
    gearItems: [],
    rods: [],
    reels: [],
    lures: [],
    selectedLureIds: {},
    form: {
      name: '',
      rodItemId: 0,
      reelItemId: 0,
      lureItemIds: [],
      targetFishText: '',
      useSceneText: '',
      note: '',
      showOnProfile: false,
      compatibilityOverrides: {}
    }
  },

  onLoad(options = {}) {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const mode = options.mode === 'edit' ? 'edit' : 'create';
    this.setData({
      navBarHeight: (windowInfo.statusBarHeight || 0) + 44,
      isDarkMode: getInitialDarkMode(),
      mode,
      id: normalizeNumber(options.id)
    });

    this.themeListener = ({ theme } = {}) => {
      this.setData({ isDarkMode: theme === 'dark' });
    };
    subscribeThemeChange(this.themeListener);

    this.bootstrap();
  },

  onUnload() {
    unsubscribeThemeChange(this.themeListener);
  },

  async bootstrap() {
    try {
      await auth.ensureLogin();
    } catch (error) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateBack();
      return;
    }

    this.setData({ loading: true });
    try {
      await this.loadUserGear();
      if (this.data.mode === 'edit') {
        await this.loadGearSet();
      }
      this.setData({ loading: false });
    } catch (error) {
      console.error('[my-gear-set-edit] bootstrap failed:', error);
      this.setData({ loading: false });
      wx.showToast({ title: api.getErrorMessage(error, '加载失败'), icon: 'none' });
    }
  },

  async loadUserGear() {
    const payload = await api.getUserGear({}, { silent: true });
    const gearItems = (payload.items || []).map((item) => ({
      ...item,
      typeLabel: ROLE_LABELS[item.gearType] || '装备',
      selected: false,
      label: item.displayName || item.variantLabel || item.gearModel || '未命名装备',
      ownershipText: this.getOwnershipText(item.ownershipStatus),
      usageText: item.usageStatusText || ''
    }));
    this.setData({
      gearItems,
      rods: gearItems.filter((item) => item.gearType === 'rod'),
      reels: gearItems.filter((item) => item.gearType === 'reel'),
      lures: gearItems.filter((item) => item.gearType === 'lure')
    });
  },

  async loadGearSet() {
    const detail = await api.getUserGearSetDetail(this.data.id, { silent: true });
    const items = Array.isArray(detail.items) ? detail.items : [];
    const rod = items.find((item) => item.role === 'rod');
    const reel = items.find((item) => item.role === 'reel');
    const lureItemIds = items
      .filter((item) => item.role === 'lure')
      .map((item) => normalizeNumber(item.userGearItemId))
      .filter(Boolean);
    this.setData({
      form: {
        name: detail.name || '',
        rodItemId: rod ? normalizeNumber(rod.userGearItemId) : 0,
        reelItemId: reel ? normalizeNumber(reel.userGearItemId) : 0,
        lureItemIds,
        targetFishText: joinTags(detail.targetFish),
        useSceneText: joinTags(detail.useScene),
        note: detail.note || '',
        showOnProfile: detail.showOnProfile === true || detail.isPublic === true,
        compatibilityOverrides: (detail.extra && detail.extra.compatibilityOverrides) || {}
      },
      selectedLureIds: this.buildSelectedLureIds(lureItemIds)
    });
    this.refreshSelectionState();
  },

  buildSelectedLureIds(ids = []) {
    return ids.reduce((acc, id) => {
      if (id) acc[id] = true;
      return acc;
    }, {});
  },

  refreshSelectionState() {
    const { rodItemId, reelItemId } = this.data.form;
    const selectedLureIds = this.data.selectedLureIds || {};
    this.setData({
      rods: this.data.rods.map((item) => ({ ...item, selected: Number(item.id) === Number(rodItemId) })),
      reels: this.data.reels.map((item) => ({ ...item, selected: Number(item.id) === Number(reelItemId) })),
      lures: this.data.lures.map((item) => ({ ...item, selected: Boolean(selectedLureIds[Number(item.id)]) }))
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field || '';
    if (!field) return;
    this.setData({
      [`form.${field}`]: e.detail.value || ''
    });
  },

  onProfileDisplayChange(e) {
    this.setData({ 'form.showOnProfile': Boolean(e.detail.value) });
  },

  onSelectSingle(e) {
    const role = e.currentTarget.dataset.role || '';
    const id = normalizeNumber(e.currentTarget.dataset.id);
    if (role !== 'rod' && role !== 'reel') return;
    const field = role === 'rod' ? 'rodItemId' : 'reelItemId';
    const nextValue = Number(this.data.form[field]) === id ? 0 : id;
    this.setData({
      [`form.${field}`]: nextValue,
      'form.compatibilityOverrides': {}
    });
    this.refreshSelectionState();
  },

  onToggleLure(e) {
    const id = normalizeNumber(e.currentTarget.dataset.id);
    if (!id) return;
    const selectedLureIds = { ...(this.data.selectedLureIds || {}) };
    if (selectedLureIds[id]) {
      delete selectedLureIds[id];
    } else {
      const count = Object.keys(selectedLureIds).length;
      if (count >= 20) {
        wx.showToast({ title: '最多选择 20 个鱼饵', icon: 'none' });
        return;
      }
      selectedLureIds[id] = true;
    }
    const lureItemIds = Object.keys(selectedLureIds).map((key) => Number(key)).filter(Boolean);
    this.setData({
      selectedLureIds,
      'form.lureItemIds': lureItemIds
    });
    this.refreshSelectionState();
  },

  buildPayload(overrides = {}) {
    const form = this.data.form || {};
    return {
      name: String(form.name || '').trim(),
      rodItemId: normalizeNumber(form.rodItemId) || undefined,
      reelItemId: normalizeNumber(form.reelItemId) || undefined,
      lureItemIds: Array.isArray(form.lureItemIds) ? form.lureItemIds : [],
      targetFish: splitTags(form.targetFishText).slice(0, 3),
      useScene: splitTags(form.useSceneText).slice(0, 3),
      note: String(form.note || '').trim(),
      showOnProfile: form.showOnProfile === true,
      compatibilityOverrides: {
        ...(form.compatibilityOverrides || {}),
        ...(overrides || {})
      }
    };
  },

  validateBeforeSave(payload) {
    if (!payload.name || payload.name.length < 2) {
      wx.showToast({ title: '请填写搭配名称', icon: 'none' });
      return false;
    }
    if (!payload.rodItemId && !payload.reelItemId && !payload.lureItemIds.length && !payload.note) {
      wx.showToast({ title: '请选择装备，或写下这套搭配的备注', icon: 'none' });
      return false;
    }
    return true;
  },

  getOwnershipText(status) {
    if (status === 'wishlist') return '想买';
    if (status === 'sold') return '已出掉';
    return '已拥有';
  },

  async onSave() {
    const payload = this.buildPayload();
    if (!this.validateBeforeSave(payload)) return;
    await this.submitPayload(payload);
  },

  async submitPayload(payload) {
    this.setData({ saving: true });
    try {
      if (this.data.mode === 'edit') {
        await api.updateUserGearSet(this.data.id, payload, { silent: true, skipErrorToast: true });
      } else {
        await api.createUserGearSet(payload, { silent: true, skipErrorToast: true });
      }
      this.setData({ saving: false });
      wx.showToast({ title: '已保存', icon: 'success' });
      wx.navigateBack();
    } catch (error) {
      this.setData({ saving: false });
      if (this.isCompatibilityUnknown(error)) {
        await this.askManualCompatibility(payload, error);
        return;
      }
      console.error('[my-gear-set-edit] save failed:', error);
      wx.showToast({ title: api.getErrorMessage(error, '保存失败'), icon: 'none' });
    }
  },

  isCompatibilityUnknown(error) {
    const payload = getErrorPayload(error);
    return payload.reason === 'compatibility_type_unknown'
      || (payload.data && payload.data.reason === 'compatibility_type_unknown');
  },

  async askManualCompatibility(payload, error) {
    const response = getErrorPayload(error);
    const data = response.data || {};
    const missing = data.missing || [];
    const overrides = {};

    try {
      if (missing.includes('rodHandleType')) {
        overrides.rodHandleType = await this.chooseAction('确认鱼竿类型', ['直柄竿', '枪柄竿'], ['spinning', 'casting']);
      }
      if (missing.includes('reelSubtype')) {
        overrides.reelSubtype = await this.chooseAction('确认渔轮类型', ['纺车轮', '水滴轮', '鼓轮'], ['spinning', 'baitcasting', 'drum']);
      }
    } catch (cancelled) {
      wx.showToast({ title: '已取消保存', icon: 'none' });
      return;
    }

    const nextPayload = {
      ...payload,
      compatibilityOverrides: {
        ...(payload.compatibilityOverrides || {}),
        ...overrides
      }
    };
    this.setData({
      'form.compatibilityOverrides': nextPayload.compatibilityOverrides
    });
    await this.submitPayload(nextPayload);
  },

  chooseAction(title, itemList, values) {
    return new Promise((resolve, reject) => {
      wx.showActionSheet({
        alertText: title,
        itemList,
        success: (res) => resolve(values[res.tapIndex]),
        fail: reject
      });
    });
  }
});
