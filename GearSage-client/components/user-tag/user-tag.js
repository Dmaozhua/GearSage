// components/user-tag/user-tag.js
const iconImageCache = require('../../utils/iconImageCache.js');

Component({
  properties: {
    // --- Legacy Props (Keep for backward compatibility) ---
    // Simple string name
    tag: {
      type: String,
      value: ''
    },
    // Rarity override (1-5)
    rarity: {
      type: Number,
      value: 1
    },
    // Full tag object (the main data source now)
    displayTag: {
      type: Object,
      value: null
    },
    // Legacy size: 'xs', 'sm', 'md' -> maps to modes
    size: {
      type: String,
      value: 'md'
    },

    // --- New Props (GearSage System) ---
    // Display mode: 'compact' (icon/minimal), 'standard', 'extended'
    mode: {
      type: String,
      value: 'standard'
    },
    // Context: 'post', 'profile', 'comment', 'shop', 'default'
    context: {
      type: String,
      value: 'default'
    }
  },

  data: {
    viewTag: null,
    computedClass: '',
    displayName: '',
    isCompactMode: false,
    isExtendedMode: false,
    iconRenderSrc: ''
  },

  observers: {
    'tag, rarity, displayTag, size, mode, context': function () {
      this.updateViewTag();
    }
  },

  lifetimes: {
    attached() {
      this._iconLoadToken = 0;
      this.updateViewTag();
    },
    detached() {
      this._iconLoadToken = (this._iconLoadToken || 0) + 1;
    }
  },

  methods: {
    // --- Helper: Normalize Size to Mode ---
    resolveModeFromSize(size) {
      const s = String(size || '').toLowerCase();
      if (s === 'mini' || s === 'icon') return 'compact';
      if (s === 'lg' || s === 'large') return 'extended';
      return 'standard'; // keep text visible for 'xs', 'sm', 'md'
    },

    resolveIconDisplay(source = {}) {
      const iconValue = source.icon || source.iconUrl || source.icon_url || source.iconImage || source.icon_image || '';
      const iconKey = source.iconKey || source.icon_key || '';
      const isImageValue = /^(https?:|cloud:|\/)/.test(String(iconValue));
      const isImageKey = /^(https?:|cloud:|\/)/.test(String(iconKey));

      return {
        imageValue: isImageValue ? String(iconValue) : (isImageKey ? String(iconKey) : ''),
        imageIsExternal: Boolean(isImageValue || isImageKey),
        cssKey: this.normalizeIconCssKey(isImageValue ? iconKey : (isImageKey ? '' : iconKey))
      };
    },

    normalizeIconCssKey(iconKey = '') {
      const key = String(iconKey || '').toLowerCase();
      const iconClassMap = {
        stream: 'stream',
        wave: 'stream',
        splash: 'splash',
        hook: 'hook',
        spark: 'spark',
        bolt: 'bolt',
        crown: 'crest',
        trophy: 'crest',
        reel: 'reel',
        rod: 'rod',
        fish: 'fish',
        calendar: 'grid',
        gear: 'gear',
        storm: 'storm',
        leaf: 'leaf',
        fire: 'flame',
        heart: 'pulse',
        chat: 'chat',
        pen: 'pen',
        link: 'link',
        medal: 'medal'
      };

      return iconClassMap[key] || '';
    },

    // --- Helper: Normalize Display Tag Data ---
    normalizeDisplayTag() {
      const source = this.properties.displayTag || {};
      const name = source.name
        || source.tagName
        || source.tag_name
        || source.label
        || source.text
        || source.title
        || this.properties.tag
        || '';
      
      if (!name) return null;

      const rarityLevel = Number(source.rarityLevel || source.rarity || this.properties.rarity || 1) || 1;
      const iconDisplay = this.resolveIconDisplay(source);
      
      return {
        id: source.id || '',
        name,
        type: source.type || 'fun',
        subType: source.subType || source.sub_type || '',
        rarity: Math.max(1, Math.min(5, rarityLevel)), // Ensure 1-5
        styleKey: source.styleKey || source.style_key || '', // Specific style overrides
        iconKey: source.iconKey || source.icon_key || '',
        iconImage: iconDisplay.imageValue,
        iconImageIsExternal: iconDisplay.imageIsExternal,
        iconCssKey: iconDisplay.cssKey,
        meta: source.meta || source.description || source.tagDesc || source.tag_desc || '' // Extra info for extended mode
      };
    },

    updateViewTag() {
      const viewTag = this.normalizeDisplayTag();
      if (!viewTag) {
        this.setData({
          viewTag: null,
          computedClass: '',
          displayName: '',
          isCompactMode: false,
          isExtendedMode: false,
          iconRenderSrc: ''
        });
        return;
      }

      // 1. Determine Mode (Prop 'mode' takes precedence, else map from 'size')
      let effectiveMode = this.properties.mode;
      if (effectiveMode === 'standard' && this.properties.size !== 'md') {
        // If mode is default but size is specified, try to map size
        effectiveMode = this.resolveModeFromSize(this.properties.size);
      }

      // 2. Determine Context
      const ctx = this.properties.context;

      // 3. Build Classes
      const classes = [
        'gear-tag',
        `mode-${effectiveMode}`,
        `rarity-${viewTag.rarity}`,
        `type-${viewTag.type}`,
        `ctx-${ctx}`,
        viewTag.styleKey ? `style-${viewTag.styleKey}` : ''
      ];

      this.setData({
        viewTag,
        computedClass: classes.join(' '),
        displayName: viewTag.name || this.properties.tag || '',
        isCompactMode: effectiveMode === 'compact',
        isExtendedMode: effectiveMode === 'extended',
        iconRenderSrc: viewTag.iconImage || ''
      });

      this.resolveCachedIconImage(viewTag.iconImage);
    },

    async resolveCachedIconImage(iconImage) {
      const imageUrl = String(iconImage || '');
      const token = (this._iconLoadToken || 0) + 1;
      this._iconLoadToken = token;

      if (!imageUrl) {
        this.setData({ iconRenderSrc: '' });
        return;
      }

      try {
        const cachedPath = await iconImageCache.cacheRemoteImage(imageUrl);
        if (this._iconLoadToken !== token) return;
        this.setData({
          iconRenderSrc: cachedPath || (/^cloud:\/\//.test(imageUrl) ? '' : imageUrl)
        });
      } catch (error) {
        if (this._iconLoadToken !== token) return;
        this.setData({
          iconRenderSrc: /^cloud:\/\//.test(imageUrl) ? '' : imageUrl
        });
      }
    }
  }
});
