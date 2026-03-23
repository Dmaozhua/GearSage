const TOPIC_CATEGORY = {
  RECOMMEND: 0,
  EXPERIENCE: 1,
  QUESTION: 2,
  CATCH: 3,
  TRIP: 4
};

const POST_TAG_MODE = {
  MAIN: 'main',
  SMART: 'smart',
  CUSTOM: 'custom',
  HIDDEN: 'hidden'
};

const CUSTOM_TAG_REF = {
  MAIN: '__main__',
  SMART: '__smart__',
  HIDDEN: '__hidden__'
};

// Legacy alias kept for pages that still import DISPLAY_STRATEGY.
const DISPLAY_STRATEGY = {
  SMART: POST_TAG_MODE.SMART,
  FIXED: POST_TAG_MODE.MAIN
};

const GROUP_META = {
  identity: {
    key: 'identity',
    label: '身份',
    displayLabel: '身份标签',
    description: '代表你的钓鱼偏好、器材方向和内容身份。'
  },
  fun: {
    key: 'fun',
    label: '梗图',
    displayLabel: '娱乐标签',
    description: '更轻松的钓鱼圈黑话，适合让内容更有社区味道。'
  },
  behavior: {
    key: 'behavior',
    label: '经历',
    displayLabel: '经历标签',
    description: '记录长期活跃、里程碑和真实参与痕迹。'
  },
  official: {
    key: 'official',
    label: '官方',
    displayLabel: '官方标签',
    description: '来自认证、活动、官方发放或特殊荣誉。'
  }
};

const GROUP_ORDER = ['identity', 'fun', 'behavior', 'official'];

const TOPIC_META = [
  { key: 'recommend', label: '好物速报', topicCategory: TOPIC_CATEGORY.RECOMMEND },
  { key: 'experience', label: '长测评', topicCategory: TOPIC_CATEGORY.EXPERIENCE },
  { key: 'question', label: '讨论&提问', topicCategory: TOPIC_CATEGORY.QUESTION },
  { key: 'catch', label: '鱼获展示', topicCategory: TOPIC_CATEGORY.CATCH },
  { key: 'trip', label: '钓行分享', topicCategory: TOPIC_CATEGORY.TRIP }
];

const TOPIC_META_MAP = TOPIC_META.reduce((acc, item) => {
  acc[item.key] = item;
  acc[item.topicCategory] = item;
  return acc;
}, {});

const SMART_PRIORITY_BY_TOPIC = {
  [TOPIC_CATEGORY.RECOMMEND]: ['identity', 'behavior', 'fun', 'official'],
  [TOPIC_CATEGORY.EXPERIENCE]: ['official', 'identity', 'behavior', 'fun'],
  [TOPIC_CATEGORY.QUESTION]: ['identity', 'fun', 'behavior', 'official'],
  [TOPIC_CATEGORY.CATCH]: ['fun', 'behavior', 'identity', 'official'],
  [TOPIC_CATEGORY.TRIP]: ['official', 'identity', 'behavior', 'fun']
};

function normalizeSubType(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePostTagMode(value, fallback = POST_TAG_MODE.SMART) {
  const normalized = String(value || '').trim().toLowerCase();
  if ([POST_TAG_MODE.MAIN, POST_TAG_MODE.SMART, POST_TAG_MODE.CUSTOM, POST_TAG_MODE.HIDDEN].includes(normalized)) {
    return normalized;
  }
  if (normalized === 'fixed') return POST_TAG_MODE.MAIN;
  return fallback;
}

function normalizeStrategy(value) {
  return normalizePostTagMode(value, POST_TAG_MODE.SMART);
}

function normalizeCustomTagRef(value) {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if ([CUSTOM_TAG_REF.MAIN, CUSTOM_TAG_REF.SMART, CUSTOM_TAG_REF.HIDDEN].includes(normalized)) {
    return normalized;
  }
  return normalized;
}

function normalizeCustomPostTags(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const result = {};
  ['recommend', 'experience', 'question', 'catch', 'trip'].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = normalizeCustomTagRef(source[key]);
    }
  });
  return result;
}

function isBehaviorLikeSubType(subType) {
  return ['achievement', 'milestone', 'record', 'tracker', 'habit'].includes(normalizeSubType(subType));
}

function isOfficialLikeSubType(subType) {
  return ['honor', 'founder', 'certification', 'official', 'signed', 'resident'].includes(normalizeSubType(subType));
}

function normalizeDisplayCategory(tag = {}) {
  if (tag.displayCategory && GROUP_META[tag.displayCategory]) {
    return tag.displayCategory;
  }

  const type = String(tag.type || '').trim().toLowerCase();
  const subType = normalizeSubType(tag.subType || tag.sub_type);

  if (type === 'official' || isOfficialLikeSubType(subType)) return 'official';
  if (type === 'identity') return 'identity';
  if (type === 'fun') return 'fun';
  if (type === 'event' || isBehaviorLikeSubType(subType)) return 'behavior';
  return 'fun';
}

function getSourceLabel(tag = {}) {
  if (tag.sourceLabel) return tag.sourceLabel;

  const obtainMethod = String(tag.obtainMethod || tag.obtain_method || '').trim().toLowerCase();
  const sourceType = String(tag.sourceType || tag.source_type || '').trim().toLowerCase();

  if (['redeem', 'exchange', 'shop', 'legacy'].includes(obtainMethod) || sourceType === 'shop') {
    return '积分兑换';
  }
  if (['event', 'activity', 'campaign'].includes(obtainMethod) || sourceType === 'event') {
    return '活动获得';
  }
  if (['official', 'staff'].includes(obtainMethod) || sourceType === 'official') {
    return '官方发放';
  }
  return '系统授予';
}

function getRarityLabel(level) {
  const rarity = Math.max(1, Math.min(5, Number(level) || 1));
  return `R${rarity}`;
}

function sortTags(tags = []) {
  return [...tags].sort((a, b) => {
    const priorityDiff = (Number(b.displayPriority) || 0) - (Number(a.displayPriority) || 0);
    if (priorityDiff !== 0) return priorityDiff;

    const credibilityDiff = (Number(b.credibilityWeight) || 0) - (Number(a.credibilityWeight) || 0);
    if (credibilityDiff !== 0) return credibilityDiff;

    const rarityDiff = (Number(b.rarityLevel) || 0) - (Number(a.rarityLevel) || 0);
    if (rarityDiff !== 0) return rarityDiff;

    const timeA = new Date(a.obtainedAt || a.createdAt || a.updatedAt || 0).getTime() || 0;
    const timeB = new Date(b.obtainedAt || b.createdAt || b.updatedAt || 0).getTime() || 0;
    return timeB - timeA;
  });
}

function buildDisplayTagPayload(tag = {}, extra = {}) {
  if (!tag) return null;
  const resolvedId = String(tag.tagId || tag.resolvedId || tag.id || '');
  const displayCategory = normalizeDisplayCategory(tag.displayTag || tag);
  const displayMeta = GROUP_META[displayCategory] || GROUP_META.fun;
  const hasExplicitMainTag = Object.prototype.hasOwnProperty.call(extra, 'isMainTag');
  const isMainTag = hasExplicitMainTag
    ? Boolean(extra.isMainTag)
    : Boolean(tag.isMainTag || tag.isSelected || tag.isEquipped);

  return {
    id: resolvedId || String((tag.displayTag && tag.displayTag.id) || tag.id || ''),
    code: String(tag.code || (tag.displayTag && tag.displayTag.code) || ''),
    name: String(tag.name || (tag.displayTag && tag.displayTag.name) || ''),
    type: String(tag.type || (tag.displayTag && tag.displayTag.type) || 'fun').toLowerCase(),
    subType: String(tag.subType || tag.sub_type || (tag.displayTag && tag.displayTag.subType) || ''),
    rarityLevel: Number(tag.rarityLevel || (tag.displayTag && tag.displayTag.rarityLevel) || 1) || 1,
    styleKey: String(tag.styleKey || (tag.displayTag && tag.displayTag.styleKey) || ''),
    iconKey: String(tag.iconKey || (tag.displayTag && tag.displayTag.iconKey) || ''),
    isAuthoritative: Boolean(tag.isAuthoritative || (tag.displayTag && tag.displayTag.isAuthoritative)),
    displayCategory,
    displayCategoryLabel: displayMeta.label,
    displayLabel: displayMeta.displayLabel,
    rarityLabel: getRarityLabel(tag.rarityLevel || (tag.displayTag && tag.displayTag.rarityLevel)),
    sourceLabel: getSourceLabel(tag),
    isMainTag,
    isEquipped: isMainTag
  };
}

function normalizeWardrobeTags(tags = [], options = {}) {
  const hasExplicitMainTag = Object.prototype.hasOwnProperty.call(options, 'mainTagId')
    || Object.prototype.hasOwnProperty.call(options, 'equippedTagId');
  const mainTagId = options.mainTagId == null
    ? (options.equippedTagId == null ? null : String(options.equippedTagId))
    : String(options.mainTagId);

  return sortTags(
    (Array.isArray(tags) ? tags : [])
      .filter(Boolean)
      .map((tag) => {
        const resolvedId = String(
          tag.tagId
          || (tag.displayTag && tag.displayTag.id)
          || tag.resolvedId
          || tag.id
          || ''
        );
        const displayCategory = normalizeDisplayCategory(tag.displayTag || tag);
        const displayMeta = GROUP_META[displayCategory] || GROUP_META.fun;
        const isMainTag = mainTagId
          ? resolvedId === mainTagId || String(tag.id || '') === mainTagId || String(tag.code || '') === mainTagId
          : hasExplicitMainTag
            ? false
            : !!tag.isMainTag || !!tag.isSelected || !!tag.selected || !!tag.isEquipped;
        const displayTag = buildDisplayTagPayload(tag.displayTag || tag, { isMainTag });

        return {
          ...tag,
          resolvedId,
          displayTag,
          displayCategory,
          displayLabel: tag.displayLabel || displayMeta.displayLabel,
          displayCategoryLabel: tag.displayCategoryLabel || displayMeta.label,
          displayCategoryDescription: tag.displayCategoryDescription || displayMeta.description,
          sourceLabel: getSourceLabel(tag),
          rarityLabel: getRarityLabel(tag.rarityLevel || (displayTag && displayTag.rarityLevel)),
          isMainTag,
          isEquipped: isMainTag,
          isSelected: isMainTag,
          selected: isMainTag
        };
      })
  );
}

function buildTagGroupTabs(tags = []) {
  const counts = GROUP_ORDER.reduce((acc, key) => {
    acc[key] = tags.filter(tag => tag.displayCategory === key).length;
    return acc;
  }, {});

  return [
    { key: 'all', label: '全部', count: tags.length },
    ...GROUP_ORDER.map((key) => ({
      key,
      label: GROUP_META[key].label,
      count: counts[key]
    }))
  ];
}

function buildVisibleTagGroups(tags = [], activeKey = 'all') {
  const keys = activeKey === 'all' ? GROUP_ORDER : [activeKey];
  return keys
    .filter((key) => GROUP_META[key])
    .map((key) => {
      const groupTags = tags.filter(tag => tag.displayCategory === key);
      return {
        ...GROUP_META[key],
        count: groupTags.length,
        tags: groupTags
      };
    })
    .filter(group => group.count > 0);
}

function findTagByRef(tags = [], ref) {
  if (!ref) return null;
  const normalizedRef = String(ref);
  return (Array.isArray(tags) ? tags : []).find(tag => {
    return String(tag.resolvedId || tag.tagId || tag.id || '') === normalizedRef
      || String(tag.code || '') === normalizedRef
      || String((tag.displayTag && tag.displayTag.id) || '') === normalizedRef
      || String((tag.displayTag && tag.displayTag.code) || '') === normalizedRef;
  }) || null;
}

function resolveSmartDisplayTagForTopic(tags = [], topicCategory) {
  if (!Array.isArray(tags) || !tags.length) return null;

  const buckets = {
    identity: sortTags(tags.filter(tag => tag.displayCategory === 'identity')),
    fun: sortTags(tags.filter(tag => tag.displayCategory === 'fun')),
    behavior: sortTags(tags.filter(tag => tag.displayCategory === 'behavior')),
    official: sortTags(tags.filter(tag => tag.displayCategory === 'official'))
  };

  const priority = SMART_PRIORITY_BY_TOPIC[Number(topicCategory)] || ['identity', 'behavior', 'fun', 'official'];
  for (let index = 0; index < priority.length; index += 1) {
    const key = priority[index];
    if (buckets[key] && buckets[key].length) {
      const candidate = buckets[key][0];
      return candidate.displayTag || buildDisplayTagPayload(candidate, { isMainTag: candidate.isMainTag });
    }
  }

  return null;
}

function resolveDisplayTagForTopic(tags = [], topicCategory, settings = {}) {
  if (!Array.isArray(tags) || !tags.length) return null;

  const mainTag = tags.find(tag => tag.isMainTag) || null;
  const mainTagPayload = mainTag ? (mainTag.displayTag || buildDisplayTagPayload(mainTag, { isMainTag: true })) : null;
  const postTagMode = normalizePostTagMode(settings.postTagMode || settings.displayStrategy, POST_TAG_MODE.SMART);
  const customPostTags = normalizeCustomPostTags(settings.customPostTags);
  const smartTagPayload = resolveSmartDisplayTagForTopic(tags, topicCategory);

  if (postTagMode === POST_TAG_MODE.MAIN) {
    return mainTagPayload;
  }

  if (postTagMode === POST_TAG_MODE.SMART) {
    return smartTagPayload || mainTagPayload;
  }

  if (postTagMode === POST_TAG_MODE.HIDDEN) {
    return null;
  }

  const topicMeta = TOPIC_META_MAP[Number(topicCategory)];
  const hasCustomRef = Boolean(topicMeta) && Object.prototype.hasOwnProperty.call(customPostTags, topicMeta.key);
  const customRef = topicMeta ? normalizeCustomTagRef(customPostTags[topicMeta.key]) : null;

  if (!hasCustomRef) {
    return mainTagPayload;
  }
  if (!customRef || customRef === CUSTOM_TAG_REF.HIDDEN) {
    return null;
  }
  if (customRef === CUSTOM_TAG_REF.MAIN) {
    return mainTagPayload;
  }
  if (customRef === CUSTOM_TAG_REF.SMART) {
    return smartTagPayload || mainTagPayload;
  }

  const matchedTag = findTagByRef(tags, customRef);
  if (!matchedTag) {
    return mainTagPayload;
  }
  return matchedTag.displayTag || buildDisplayTagPayload(matchedTag, { isMainTag: matchedTag.isMainTag });
}

function buildPreviewByPostType(tags = [], settings = {}) {
  return TOPIC_META.map((item) => {
    const displayTag = resolveDisplayTagForTopic(tags, item.topicCategory, settings);
    return {
      ...item,
      displayTag,
      tagName: displayTag ? displayTag.name : '',
      categoryLabel: displayTag ? displayTag.displayLabel : ''
    };
  });
}

function getPostTagModeTitle(mode) {
  switch (normalizePostTagMode(mode)) {
    case POST_TAG_MODE.MAIN:
      return '使用主标签';
    case POST_TAG_MODE.CUSTOM:
      return '自定义模式';
    case POST_TAG_MODE.HIDDEN:
      return '不显示标签';
    case POST_TAG_MODE.SMART:
    default:
      return '智能推荐';
  }
}

function getPostTagModeDescription(mode) {
  switch (normalizePostTagMode(mode)) {
    case POST_TAG_MODE.MAIN:
      return '主页、帖子和回复都使用主标签；主标签为空时不展示任何标签。';
    case POST_TAG_MODE.CUSTOM:
      return '每种类型帖子单独指定标签，主页展示主标签。';
    case POST_TAG_MODE.HIDDEN:
      return '只在主页中展示主标签。';
    case POST_TAG_MODE.SMART:
    default:
      return '帖子和回复系统智能匹配标签，无则显示主标签。';
  }
}

function getStrategyDescription(mode) {
  return getPostTagModeDescription(mode);
}

function getStrategyTitle(mode) {
  return getPostTagModeTitle(mode);
}

function describeCustomTopicRule(topicKey, tags = [], settings = {}) {
  const customPostTags = normalizeCustomPostTags(settings.customPostTags);
  const hasCustomRef = Object.prototype.hasOwnProperty.call(customPostTags, topicKey);
  const customRef = normalizeCustomTagRef(customPostTags[topicKey]);
  const topicMeta = TOPIC_META_MAP[topicKey];
  const displayTag = topicMeta
    ? resolveDisplayTagForTopic(tags, topicMeta.topicCategory, {
        postTagMode: POST_TAG_MODE.CUSTOM,
        customPostTags
      })
    : null;

  if (!hasCustomRef) {
    return {
      key: topicKey,
      label: topicMeta ? topicMeta.label : topicKey,
      value: undefined,
      valueLabel: '未单独设置',
      summary: '未单独配置时会回退主标签',
      displayTag,
      isFixedTag: false,
      fixedTagId: '',
      fixedTagName: ''
    };
  }

  if (!customRef) {
    return {
      key: topicKey,
      label: topicMeta ? topicMeta.label : topicKey,
      value: null,
      valueLabel: '不显示标签',
      summary: '该模式下帖子和回复都不展示标签',
      displayTag: null,
      isFixedTag: false,
      fixedTagId: '',
      fixedTagName: ''
    };
  }

  if (customRef === CUSTOM_TAG_REF.MAIN) {
    return {
      key: topicKey,
      label: topicMeta ? topicMeta.label : topicKey,
      value: customRef,
      valueLabel: '跟随主标签',
      summary: '帖子和回复都显示主标签',
      displayTag,
      isFixedTag: false,
      fixedTagId: '',
      fixedTagName: ''
    };
  }

  if (customRef === CUSTOM_TAG_REF.SMART) {
    return {
      key: topicKey,
      label: topicMeta ? topicMeta.label : topicKey,
      value: customRef,
      valueLabel: '智能推荐',
      summary: '按该内容模式自动挑选最合适的标签',
      displayTag,
      isFixedTag: false,
      fixedTagId: '',
      fixedTagName: ''
    };
  }

  if (customRef === CUSTOM_TAG_REF.HIDDEN) {
    return {
      key: topicKey,
      label: topicMeta ? topicMeta.label : topicKey,
      value: customRef,
      valueLabel: '不显示标签',
      summary: '该模式下帖子和回复都不展示标签',
      displayTag: null,
      isFixedTag: false,
      fixedTagId: '',
      fixedTagName: ''
    };
  }

  const matchedTag = findTagByRef(tags, customRef);
  return {
    key: topicKey,
    label: topicMeta ? topicMeta.label : topicKey,
    value: customRef,
    valueLabel: matchedTag ? matchedTag.name : '指定标签',
    summary: matchedTag ? `固定显示 ${matchedTag.name}` : '标签失效时会回退主标签',
    displayTag: matchedTag ? (matchedTag.displayTag || buildDisplayTagPayload(matchedTag)) : displayTag,
    isFixedTag: !!matchedTag,
    fixedTagId: matchedTag ? String(matchedTag.resolvedId || matchedTag.tagId || matchedTag.id || '') : String(customRef || ''),
    fixedTagName: matchedTag ? matchedTag.name : ''
  };
}

function buildCustomTopicConfigs(tags = [], settings = {}) {
  return TOPIC_META.map((item) => describeCustomTopicRule(item.key, tags, settings));
}

function buildModeOptions() {
  return [
    {
      key: POST_TAG_MODE.MAIN,
      label: '使用主标签',
      description: '所有帖子和回复都跟随主标签'
    },
    {
      key: POST_TAG_MODE.SMART,
      label: '智能推荐',
      description: '按内容模式自动挑选更合适的标签'
    },
    {
      key: POST_TAG_MODE.CUSTOM,
      label: '自定义',
      description: '分别指定 5 种帖子模式的展示标签'
    },
    {
      key: POST_TAG_MODE.HIDDEN,
      label: '不显示标签',
      description: '帖子和回复都不展示标签'
    }
  ];
}

module.exports = {
  TOPIC_CATEGORY,
  TOPIC_META,
  TOPIC_META_MAP,
  POST_TAG_MODE,
  CUSTOM_TAG_REF,
  DISPLAY_STRATEGY,
  CUSTOM_TAG_REF,
  GROUP_META,
  GROUP_ORDER,
  normalizeStrategy,
  normalizePostTagMode,
  normalizeCustomTagRef,
  normalizeCustomPostTags,
  normalizeWardrobeTags,
  buildTagGroupTabs,
  buildVisibleTagGroups,
  buildPreviewByPostType,
  buildCustomTopicConfigs,
  buildModeOptions,
  getStrategyDescription,
  getStrategyTitle,
  getPostTagModeTitle,
  getPostTagModeDescription,
  resolveDisplayTagForTopic,
  resolveSmartDisplayTagForTopic,
  normalizeDisplayCategory,
  getSourceLabel,
  getRarityLabel,
  findTagByRef,
  describeCustomTopicRule
};
