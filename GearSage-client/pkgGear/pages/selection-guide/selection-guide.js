const app = getApp();
const apiService = require('../../../services/api');

const COMPARE_STORAGE_KEY = 'gear_compare_pool_v1';
const PREFILL_STORAGE_KEY = 'recommend_prefill_from_selection';

const TARGET_FISH_OPTIONS = ['鲈鱼', '翘嘴', '鳜鱼', '黑鱼', '马口'];
const USE_SCENE_OPTIONS = ['野河', '水库', '管理场', '溪流', '海水'];
const TECHNIQUE_OPTIONS = [
  { id: 'unknown', label: '不确定' },
  { id: 'softbait', label: '软饵' },
  { id: 'hardbait', label: '硬饵' },
  { id: 'allround', label: '先泛用' }
];
const CARE_PRIORITY_OPTIONS = ['泛用', '轻量', '耐用', '远投', '手感'];
const DEFAULT_FORM = {
  gearCategory: 'rod',
  rodType: 'casting',
  power: 'M',
  budgetMin: '',
  budgetMax: '1200',
  budgetFlexible: 'slightly_up',
  targetFish: ['鲈鱼'],
  useScene: ['野河'],
  technique: ['unknown'],
  carePriorities: ['泛用'],
  avoidPoints: [],
  source: 'gear_list',
  limit: 6
};

function buildOptionViews(options, selected, keyName = 'label') {
  const selectedValues = Array.isArray(selected) ? selected : [];
  return options.map((option) => {
    const value = typeof option === 'object' ? option.id || option.label : option;
    return {
      ...(typeof option === 'object' ? option : { [keyName]: option }),
      value,
      active: selectedValues.includes(value)
    };
  });
}

Page({
  data: {
    navBarHeight: 0,
    isDarkMode: false,
    isLoading: false,
    targetFishOptions: buildOptionViews(TARGET_FISH_OPTIONS, DEFAULT_FORM.targetFish),
    useSceneOptions: buildOptionViews(USE_SCENE_OPTIONS, DEFAULT_FORM.useScene),
    techniqueOptions: buildOptionViews(TECHNIQUE_OPTIONS, DEFAULT_FORM.technique),
    carePriorityOptions: buildOptionViews(CARE_PRIORITY_OPTIONS, DEFAULT_FORM.carePriorities),
    form: { ...DEFAULT_FORM },
    result: null,
    branches: [],
    selectedBranchKeys: [],
    emptyReason: '',
    suggestedActions: []
  },

  onLoad(options = {}) {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      navBarHeight: (app.globalData.statusBarHeight || windowInfo.statusBarHeight || 0) + (app.globalData.navBarHeight || 44),
      isDarkMode: app.globalData.isDarkMode || false,
      'form.source': options.source || 'gear_list'
    });

    this.themeListener = (isDarkMode) => this.setData({ isDarkMode });
    if (app.globalData.themeListeners) {
      app.globalData.themeListeners.push(this.themeListener);
    }
    this.refreshOptionViews();
  },

  onUnload() {
    if (app.globalData.themeListeners && this.themeListener) {
      const index = app.globalData.themeListeners.indexOf(this.themeListener);
      if (index > -1) {
        app.globalData.themeListeners.splice(index, 1);
      }
    }
  },

  normalizeText(value) {
    return String(value || '').trim();
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  onSelectSingle(e) {
    const { field, value } = e.currentTarget.dataset;
    if (!field) return;
    this.setData({
      [`form.${field}`]: value
    });
  },

  onToggleMulti(e) {
    const { field, value, max } = e.currentTarget.dataset;
    if (!field || !value) return;
    const current = Array.isArray(this.data.form[field]) ? this.data.form[field].slice() : [];
    const index = current.indexOf(value);
    if (index >= 0) {
      current.splice(index, 1);
    } else if (!max || current.length < Number(max)) {
      current.push(value);
    }
    this.setData({
      [`form.${field}`]: current
    });
    this.refreshOptionViews();
  },

  isSelected(list, value) {
    return Array.isArray(list) && list.includes(value);
  },

  refreshOptionViews() {
    this.setData({
      targetFishOptions: buildOptionViews(TARGET_FISH_OPTIONS, this.data.form.targetFish),
      useSceneOptions: buildOptionViews(USE_SCENE_OPTIONS, this.data.form.useScene),
      techniqueOptions: buildOptionViews(TECHNIQUE_OPTIONS, this.data.form.technique),
      carePriorityOptions: buildOptionViews(CARE_PRIORITY_OPTIONS, this.data.form.carePriorities)
    });
  },

  buildPayload() {
    const form = this.data.form;
    const payload = {
      ...form,
      budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined
    };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '' || payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });
    return payload;
  },

  async onGenerate() {
    if (this.data.isLoading) return;
    const payload = this.buildPayload();
    if (!payload.budgetMax || !payload.targetFish.length || !payload.useScene.length) {
      wx.showToast({ title: '预算、目标鱼和场景要先补齐', icon: 'none' });
      return;
    }

    this.setData({ isLoading: true, emptyReason: '', suggestedActions: [] });
    try {
      const result = await apiService.createSelectionRecommendation(payload);
      const branches = (result.branches || []).map((branch) => ({
        ...branch,
        isSelected: true
      }));
      this.setData({
        result,
        branches,
        selectedBranchKeys: branches.slice(0, 3).map((branch) => branch.branchKey),
        emptyReason: result.emptyReason || '',
        suggestedActions: result.suggestedActions || []
      });
    } catch (error) {
      console.error('[selection-guide] generate failed:', error);
      wx.showToast({ title: apiService.getErrorMessage(error, '生成失败'), icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  onToggleBranch(e) {
    const key = this.normalizeText(e.currentTarget.dataset.key);
    if (!key) return;
    const selected = this.data.selectedBranchKeys.slice();
    const index = selected.indexOf(key);
    if (index >= 0) {
      selected.splice(index, 1);
    } else if (selected.length < 3) {
      selected.push(key);
    } else {
      wx.showToast({ title: '最多带 3 个候选去求推荐', icon: 'none' });
      return;
    }
    this.setData({
      selectedBranchKeys: selected,
      branches: this.data.branches.map((branch) => ({
        ...branch,
        isSelected: selected.includes(branch.branchKey)
      }))
    });
  },

  getSelectedBranches() {
    const selected = this.data.selectedBranchKeys;
    const branches = this.data.branches.filter((branch) => selected.includes(branch.branchKey) && branch.primaryGear);
    return branches.length ? branches : this.data.branches.filter((branch) => branch.primaryGear).slice(0, 3);
  },

  onOpenDetail(e) {
    const branch = this.findBranch(e.currentTarget.dataset.key);
    const gear = branch && branch.primaryGear;
    if (!gear || !gear.gearItemId) return;
    const query = [
      `id=${encodeURIComponent(gear.gearItemId)}`,
      'type=rods',
      'from=selection_guide'
    ];
    if (gear.variantKey) {
      query.push(`variantKey=${encodeURIComponent(gear.variantKey)}`);
    }
    wx.navigateTo({ url: `/pkgGear/pages/detail/detail?${query.join('&')}` });
  },

  onAddCompare(e) {
    const branch = this.findBranch(e.currentTarget.dataset.key);
    if (!branch || !branch.primaryGear) return;
    this.saveCompareBranches([branch]);
    wx.showToast({ title: '已加入对比池', icon: 'none' });
  },

  onOpenEvidencePost(e) {
    const topicId = Number(e.currentTarget.dataset.topicId || 0);
    if (!topicId) return;
    wx.navigateTo({
      url: `/pkgContent/detail/detail?id=${topicId}`
    });
  },

  onCompareSelected() {
    const branches = this.getSelectedBranches();
    if (branches.length < 2) {
      wx.showToast({ title: '至少选择 2 个候选', icon: 'none' });
      return;
    }
    this.saveCompareBranches(branches);
    wx.navigateTo({ url: '/pkgGear/pages/compare/compare?type=rods&from=selection_guide' });
  },

  onAskWithSelection() {
    const branches = this.getSelectedBranches();
    if (!branches.length) {
      wx.showToast({ title: '先生成候选分支', icon: 'none' });
      return;
    }
    const basePayload = this.data.result && this.data.result.topicDraftPayload
      ? this.data.result.topicDraftPayload
      : {};
    const baseRecommendMeta = basePayload.recommendMeta || {};
    const baseSelectionSource = baseRecommendMeta.selectionSource || {};
    const selectionSessionId = this.data.result && this.data.result.sessionId
      ? String(this.data.result.sessionId)
      : String(baseSelectionSource.selectionSessionId || '');
    const candidateOptions = branches.slice(0, 3).map((branch) => ({
      gearItemId: branch.primaryGear.gearItemId,
      label: branch.primaryGear.gearLabel,
      source: 'selection_guide',
      branchKey: branch.branchKey,
      branchTitle: branch.branchTitle,
      variantKey: branch.primaryGear.variantKey || '',
      variantLabel: branch.primaryGear.variantLabel || ''
    }));
    const topicDraftPayload = {
      ...basePayload,
      questionType: 'recommend',
      relatedGearCategory: 'rod',
      recommendMeta: {
        ...baseRecommendMeta,
        recommendIntent: 'compare_options',
        targetFish: this.data.form.targetFish,
        useScene: this.data.form.useScene,
        carePriorities: this.data.form.carePriorities,
        candidateOptions,
        coreQuestion: '系统按我的预算和场景生成了几个方向，我主要纠结哪条路线更适合。',
        selectionSource: {
          ...baseSelectionSource,
          source: 'selection_guide',
          selectionSessionId,
          inputSummary: this.data.result ? this.data.result.inputSummary : '',
          branches: candidateOptions
        }
      }
    };

    wx.setStorageSync(PREFILL_STORAGE_KEY, topicDraftPayload);
    wx.navigateTo({
      url: '/pkgContent/publishMode/publishMode?from=selection_guide'
    });
  },

  saveCompareBranches(branches) {
    const current = wx.getStorageSync(COMPARE_STORAGE_KEY);
    const items = Array.isArray(current) ? current : [];
    const otherTypes = items.filter((item) => item && item.gearType !== 'rods');
    const rodItems = items.filter((item) => item && item.gearType === 'rods');
    branches.forEach((branch) => {
      const gear = branch.primaryGear;
      if (!gear || !gear.gearItemId) return;
      const variantKey = this.normalizeText(gear.variantKey) || 'master';
      const entry = {
        key: `rods:${gear.gearItemId}:${variantKey}`,
        gearType: 'rods',
        compareGroup: 'selection_guide',
        compareGroupLabel: '选型向导',
        masterId: this.normalizeText(gear.gearItemId),
        masterName: this.normalizeText(gear.gearLabel),
        brandName: this.normalizeText(gear.brandName),
        variantKey,
        variantLabel: this.normalizeText(gear.variantLabel) || '系列级推荐',
        imageUrl: '',
        source: 'selection_guide',
        branchKey: branch.branchKey,
        addedAt: Date.now()
      };
      const index = rodItems.findIndex((item) => item.key === entry.key);
      if (index >= 0) {
        rodItems[index] = entry;
      } else {
        rodItems.push(entry);
      }
    });
    wx.setStorageSync(COMPARE_STORAGE_KEY, otherTypes.concat(rodItems.slice(-3)));
  },

  findBranch(key) {
    return this.data.branches.find((branch) => branch.branchKey === key) || null;
  }
});
