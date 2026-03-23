const { parseRichTextPayload } = require('./richTextFormatter.js');

const tagConfig = require('../components/post-Evaluation/gearSageTagConfig.js');

const TOPIC_CATEGORY = {
  RECOMMEND: 0,
  EXPERIENCE: 1,
  QUESTION: 2,
  CATCH: 3,
  TRIP: 4
};

const TOPIC_CATEGORY_LABELS = {
  [TOPIC_CATEGORY.RECOMMEND]: '好物速报',
  [TOPIC_CATEGORY.EXPERIENCE]: '长测评',
  [TOPIC_CATEGORY.QUESTION]: '讨论提问',
  [TOPIC_CATEGORY.CATCH]: '鱼获展示',
  [TOPIC_CATEGORY.TRIP]: '钓行分享'
};

const GEAR_CATEGORY_LABELS = {
  rod: '鱼竿',
  reel: '渔轮',
  bait: '鱼饵',
  line: '鱼线',
  hook: '鱼钩',
  other: '其他'
};

const USAGE_YEAR_LABELS = {
  love_at_first_sight: '一见钟情',
  '1_month': '1个月',
  '1_3_months': '1-3个月',
  '3_12_months': '3-12个月',
  '1_year_plus': '1年以上'
};

const USAGE_FREQUENCY_LABELS = {
  essential: '出钓必备',
  several_times_week: '每周多次',
  once_week: '每周一次',
  several_times_month: '每月多次',
  once_month: '每月一次',
  several_times_year: '每年多次'
};

const RECOMMEND_SUMMARY_LABELS = {
  strongly_recommend: '强烈推荐，明显超出预期',
  recommend: '值得推荐，整体满意',
  soso: '有亮点，但不一定适合所有人',
  not_recommend: '不太推荐，实际体验一般'
};

const REPURCHASE_LABELS = {
  buy_same: '会继续使用同款',
  buy_upgrade: '会考虑升级同系列',
  try_other: '可能尝试其他品牌',
  never_buy: '不会再买'
};

const QUESTION_TYPE_LABELS = {
  ask: '提问',
  discuss: '讨论',
  recommend: '求推荐',
  avoid_pitfall: '求避坑',
  chat_with_photos: '晒图闲聊'
};

const RATING_LABELS = {
  actionMatchScore: '调性匹配',
  sensitivityScore: '传导性',
  castingScore: '抛投表现',
  workmanshipScore: '做工',
  durabilityScore: '耐用性',
  retrieveFeelScore: '收线手感',
  dragScore: '卸力表现',
  smoothnessScore: '顺滑度',
  balanceScore: '轻量与平衡',
  actionScore: '动作表现',
  stabilityScore: '稳定性',
  attractionScore: '诱鱼表现',
  strengthScore: '强度表现',
  abrasionScore: '耐磨性',
  handlingScore: '顺滑与操作感',
  castabilityScore: '抛投表现',
  sharpnessScore: '锋利度',
  penetrationScore: '刺鱼效率',
  resistanceScore: '抗变形',
  coatingScore: '防锈与涂层',
  practicalityScore: '实用性',
  designScore: '设计合理性',
  costScore: '性价比'
};

function normalizeString(value, fallback = '') {
  if (value === null || typeof value === 'undefined') {
    return fallback;
  }
  const text = String(value).trim();
  return text || fallback;
}

function normalizeStringList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
}

function buildFact(label, value) {
  const text = normalizeString(value, '');
  if (!text) {
    return null;
  }
  return { label, value: text };
}

function buildTagGroup(label, items = []) {
  const normalized = normalizeStringList(items);
  if (!normalized.length) {
    return null;
  }
  return { label, items: normalized };
}

function joinDisplay(items = [], separator = '、') {
  return normalizeStringList(items).join(separator);
}

function normalizeOptionalNumber(value) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return null;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function normalizeTopicTags(tags = {}) {
  const source = tags && typeof tags === 'object' ? tags : {};
  return {
    budget: normalizeString(source.budget, ''),
    usage: normalizeStringList(source.usage),
    shareReasons: normalizeStringList(source.shareReasons),
    fit: normalizeStringList(source.fit),
    unfit: normalizeStringList(source.unfit),
    pros: normalizeStringList(source.pros),
    cons: normalizeStringList(source.cons),
    fitContextTags: normalizeStringList(source.fitContextTags),
    fitTechniqueTags: normalizeStringList(source.fitTechniqueTags),
    compareProfile: normalizeStringList(source.compareProfile),
    compareBuyDecision: normalizeStringList(source.compareBuyDecision),
    purchaseAdvice: normalizeStringList(source.purchaseAdvice),
    buyStage: normalizeStringList(source.buyStage),
    supplementParams: normalizeStringList(source.supplementParams)
  };
}

function formatUsageYearLabel(value) {
  return USAGE_YEAR_LABELS[value] || normalizeString(value, '');
}

function formatUsageFrequencyLabel(value) {
  return USAGE_FREQUENCY_LABELS[value] || normalizeString(value, '');
}

function formatRecommendSummaryLabel(value) {
  return RECOMMEND_SUMMARY_LABELS[value] || normalizeString(value, '');
}

function formatRepurchaseLabel(value) {
  return REPURCHASE_LABELS[value] || normalizeString(value, '');
}

function formatQuestionTypeLabel(value) {
  return QUESTION_TYPE_LABELS[value] || normalizeString(value, '');
}

function getTopicCategoryLabel(value) {
  return TOPIC_CATEGORY_LABELS[Number(value)] || '帖子';
}

function getGearCategoryLabel(value) {
  return GEAR_CATEGORY_LABELS[value] || normalizeString(value, '');
}

function getTagGroupDefinition(groupKey, gearCategory) {
  const globalGroups = Array.isArray(tagConfig.globalGroups) ? tagConfig.globalGroups : [];
  const categoryGroups = ((tagConfig.categoryGroups || {})[gearCategory] || []);
  return globalGroups.find((group) => group.groupKey === groupKey)
    || categoryGroups.find((group) => group.groupKey === groupKey)
    || null;
}

function getTagGroupOptions(groupKey, gearCategory) {
  const group = getTagGroupDefinition(groupKey, gearCategory);
  if (!group) {
    return [];
  }
  if (Array.isArray(group.options) && group.options.length) {
    return group.options;
  }
  if (group.categoryOptions && gearCategory && Array.isArray(group.categoryOptions[gearCategory])) {
    return group.categoryOptions[gearCategory];
  }
  return [];
}

function mapTopicTagLabel(groupKey, value, gearCategory) {
  const text = normalizeString(value, '');
  if (!text) {
    return '';
  }
  const matched = getTagGroupOptions(groupKey, gearCategory).find((option) => option.id === text);
  return matched ? normalizeString(matched.label, text) : text;
}

function mapTopicTagList(groupKey, values, gearCategory) {
  return normalizeStringList(values)
    .map((item) => mapTopicTagLabel(groupKey, item, gearCategory))
    .filter(Boolean);
}

function formatLocationTagDisplay(value) {
  const text = normalizeString(value, '');
  if (!text) {
    return '';
  }
  return text.startsWith('#') ? text : `#${text}`;
}

function formatCatchMeasure(label, value, isSecret, isEstimated, unit) {
  if (isSecret) {
    return `♾️${unit}`;
  }
  const text = normalizeString(value, '');
  if (!text) {
    return '';
  }
  return `${text}${unit}${isEstimated ? '（目测）' : ''}`;
}

function buildRatingDetails(ratings = []) {
  return (Array.isArray(ratings) ? ratings : []).map(item => {
    if (!item || typeof item !== 'object') {
      return null;
    }
    const key = normalizeString(item.key || item.name, '');
    const score = Number(item.score || 0);
    if (!key || score <= 0) {
      return null;
    }
    return {
      key,
      label: RATING_LABELS[key] || normalizeString(item.label || item.name, key),
      score,
      percentage: Math.max(0, Math.min(100, score * 10))
    };
  }).filter(Boolean);
}

function calculateAverageRating(ratings = []) {
  const list = buildRatingDetails(ratings);
  if (!list.length) return 0;
  const total = list.reduce((sum, item) => sum + Number(item.score || 0), 0);
  return Math.round((total / list.length) * 10) / 10;
}

function buildTopicDetailView(postData = {}, options = {}) {
  const parsedContent = parseRichTextPayload(postData.content || '');
  const topicCategory = Number(postData.topicCategory);
  const gearCategory = normalizeString(postData.gearCategory, '');
  const tags = normalizeTopicTags(postData.tags);
  const mappedEnvironments = mapTopicTagList('scene', postData.environments, gearCategory);
  const mappedBudget = mapTopicTagLabel('budget', tags.budget, gearCategory);
  const mappedUsage = mapTopicTagList('usage', tags.usage, gearCategory);
  const mappedFit = mapTopicTagList('fit', tags.fit, gearCategory);
  const mappedUnfit = mapTopicTagList('unfit', tags.unfit, gearCategory);
  const mappedGearPros = mapTopicTagList('pros', tags.pros, gearCategory);
  const mappedGearCons = mapTopicTagList('cons', tags.cons, gearCategory);
  const fitDisplayList = [...mappedFit];
  const unfitDisplayList = [...mappedUnfit];
  const customFitText = normalizeString(postData.customFit, '');
  const customUnfitText = normalizeString(postData.customUnfit, '');
  if (customFitText) {
    fitDisplayList.push(customFitText);
  }
  if (customUnfitText) {
    unfitDisplayList.push(customUnfitText);
  }
  const mappedFitContext = mapTopicTagList('fitContextTags', tags.fitContextTags, gearCategory);
  const mappedFitTechnique = mapTopicTagList('fitTechniqueTags', tags.fitTechniqueTags, gearCategory);
  const mappedCompareProfile = mapTopicTagList('compareProfile', tags.compareProfile, gearCategory);
  const mappedCompareBuyDecision = mapTopicTagList('compareBuyDecision', tags.compareBuyDecision, gearCategory);
  const mappedPurchaseAdvice = mapTopicTagList('purchaseAdvice', tags.purchaseAdvice, gearCategory);
  const mappedBuyStage = mapTopicTagList('buyStage', tags.buyStage, gearCategory);
  const mappedSupplementParams = mapTopicTagList('supplementParams', tags.supplementParams, gearCategory);
  const customSceneText = normalizeString(postData.customScene, '');
  const environmentItems = [...mappedEnvironments];
  if (customSceneText) {
    environmentItems.push(customSceneText);
  }
  const summaryDisplay = formatRecommendSummaryLabel(postData.summary);
  const repurchaseDisplay = formatRepurchaseLabel(postData.repurchase);
  const contentText = parsedContent.text || '';
  const images = normalizeStringList(postData.images);
  const usageInfo = [];
  const factSections = [];
  const listSections = [];
  const tagSections = [];
  const locationTagDisplay = formatLocationTagDisplay(postData.locationTag);
  const userInfo = options.userInfo || {};
  const formatTime = typeof options.formatTime === 'function' ? options.formatTime : null;
  const authorDisplayTag = postData.displayTag || (postData.author && postData.author.displayTag) || options.displayTag || null;

  const pushFactSection = (title, items) => {
    const normalized = (items || []).filter(Boolean);
    if (normalized.length) {
      factSections.push({ title, items: normalized });
    }
  };

  const pushListSection = (title, items) => {
    const normalized = normalizeStringList(items);
    if (normalized.length) {
      listSections.push({ title, items: normalized });
    }
  };

  const pushTagSection = (title, groups) => {
    const normalized = (groups || []).filter(Boolean);
    if (normalized.length) {
      tagSections.push({ title, groups: normalized });
    }
  };

  if (topicCategory === TOPIC_CATEGORY.RECOMMEND || topicCategory === TOPIC_CATEGORY.EXPERIENCE) {
    const usageYear = formatUsageYearLabel(postData.usageYear);
    const usageFrequency = formatUsageFrequencyLabel(postData.usageFrequency);
    if (usageYear) {
      usageInfo.push({ label: '使用时长', value: usageYear });
    }
    if (usageFrequency) {
      usageInfo.push({ label: '使用频率', value: usageFrequency });
    }
  }

  if (topicCategory === TOPIC_CATEGORY.RECOMMEND) {
    pushFactSection('核心信息', [
      buildFact('装备分类', getGearCategoryLabel(gearCategory)),
      buildFact('装备型号', postData.gearModel),
      buildFact('一句话总结', summaryDisplay),
      buildFact('使用场景', mappedEnvironments.join('、')),
      buildFact('自定义场景', postData.customScene)
    ]);
    pushListSection('推荐理由', postData.pros);
    pushTagSection('标签信息', [
      buildTagGroup('预算倾向', mappedBudget ? [mappedBudget] : []),
      buildTagGroup('使用倾向', mappedUsage),
      buildTagGroup('分享理由', tags.shareReasons)
    ]);
  }

  if (topicCategory === TOPIC_CATEGORY.EXPERIENCE) {
    pushFactSection('核心信息', [
      buildFact('装备分类', getGearCategoryLabel(gearCategory)),
      buildFact('装备型号', postData.gearModel),
      buildFact('一句话总结', summaryDisplay),
      buildFact('推荐等级', summaryDisplay),
      buildFact('再次选择意愿', repurchaseDisplay),
      buildFact('验证图片', postData.verifyImage ? '已上传' : ''),
      buildFact('使用场景', mappedEnvironments.join('、')),
      buildFact('自定义场景', postData.customScene)
    ]);
    pushListSection('装备优点', mappedGearPros);
    pushListSection('优点补充说明', postData.pros);
    pushListSection('装备缺点', mappedGearCons);
    pushListSection('缺点补充说明', postData.cons);
    pushTagSection('标签信息', [
      buildTagGroup('预算倾向', mappedBudget ? [mappedBudget] : []),
      buildTagGroup('使用倾向', mappedUsage),
      buildTagGroup('适合人群', fitDisplayList),
      buildTagGroup('不适合人群', unfitDisplayList),
      buildTagGroup('适配场景', mappedFitContext),
      buildTagGroup('适配玩法', mappedFitTechnique),
      buildTagGroup('对比定位', mappedCompareProfile),
      buildTagGroup('对比购买结论', mappedCompareBuyDecision),
      buildTagGroup('入手建议', mappedPurchaseAdvice),
      buildTagGroup('购买定位', mappedBuyStage),
      buildTagGroup('补充参数', mappedSupplementParams)
    ]);
    pushFactSection('进阶信息', [
      buildFact('常用搭配', normalizeStringList(postData.comboGear).join('、')),
      buildFact('搭配说明', postData.comboDesc),
      buildFact('对比对象', normalizeStringList(postData.compareGear).join('、')),
      buildFact('对比定位', mappedCompareProfile.join('、')),
      buildFact('对比购买结论', mappedCompareBuyDecision.join('、')),
      buildFact('对比说明', postData.compareDesc),
      buildFact('入手建议', mappedPurchaseAdvice.join('、')),
      buildFact('购买定位', mappedBuyStage.join('、')),
      buildFact('参数补充', mappedSupplementParams.join('、'))
    ]);
  }

  if (topicCategory === TOPIC_CATEGORY.QUESTION) {
    pushFactSection('提问信息', [
      buildFact('问题类型', formatQuestionTypeLabel(postData.questionType)),
      buildFact('关联分类', getGearCategoryLabel(postData.relatedGearCategory)),
      buildFact('关联型号', postData.relatedGearModel),
      buildFact('回复模式', postData.quickReplyOnly ? '仅快答' : '开放讨论')
    ]);
  }

  if (topicCategory === TOPIC_CATEGORY.CATCH) {
    pushFactSection('鱼获信息', [
      buildFact('标点', locationTagDisplay),
      buildFact('长度', formatCatchMeasure('长度', postData.length, postData.isLengthSecret, postData.isLengthEstimated, 'cm')),
      buildFact('重量', formatCatchMeasure('重量', postData.weight, postData.isWeightSecret, postData.isWeightEstimated, 'kg'))
    ]);
  }

  if (topicCategory === TOPIC_CATEGORY.TRIP) {
    const targetFish = [...normalizeStringList(postData.targetFish)];
    const customTargetFish = normalizeString(postData.customTargetFish, '');
    if (customTargetFish) {
      targetFish.push(customTargetFish);
    }

    pushFactSection('钓行信息', [
      buildFact('钓行结果', postData.tripResult),
      buildFact('目标鱼', targetFish.join('、')),
      buildFact('季节', postData.season),
      buildFact('天气', postData.weather),
      buildFact('水域类型', postData.waterType),
      buildFact('主要钓点', postData.mainSpot),
      buildFact('作钓时间', postData.fishingTime),
      buildFact('钓组说明', postData.rigDescription)
    ]);
    pushTagSection('状态与环境', [
      buildTagGroup('钓行总结', postData.tripStatus),
      buildTagGroup('环境感受', postData.envFeelings),
      buildTagGroup('主要钓组/饵型', postData.rigs)
    ]);
  }

  const badges = [
    getTopicCategoryLabel(topicCategory),
    topicCategory === TOPIC_CATEGORY.RECOMMEND || topicCategory === TOPIC_CATEGORY.EXPERIENCE
      ? getGearCategoryLabel(postData.gearCategory)
      : '',
    topicCategory === TOPIC_CATEGORY.QUESTION ? formatQuestionTypeLabel(postData.questionType) : ''
  ].filter(Boolean);

  const createTime = postData.publishTime || postData.createTime || options.previewTime || null;
  const averageRate = calculateAverageRating(postData.ratings);
  const targetFish = [...normalizeStringList(postData.targetFish)];
  const customTargetFish = normalizeString(postData.customTargetFish, '');
  if (customTargetFish) {
    targetFish.push(customTargetFish);
  }
  const environments = mappedEnvironments;
  const pros = normalizeStringList(postData.pros);
  const cons = normalizeStringList(postData.cons);
  const comboGear = normalizeStringList(postData.comboGear);
  const compareGear = normalizeStringList(postData.compareGear);
  const envFeelings = normalizeStringList(postData.envFeelings);
  const rigs = normalizeStringList(postData.rigs);
  const tripStatus = normalizeStringList(postData.tripStatus);
  const catchLengthText = formatCatchMeasure('长度', postData.length, postData.isLengthSecret, postData.isLengthEstimated, 'cm');
  const catchWeightText = formatCatchMeasure('重量', postData.weight, postData.isWeightSecret, postData.isWeightEstimated, 'kg');
  const catchBodyTypeText = [catchLengthText, catchWeightText].filter(Boolean).join(' / ');

  return {
    formattedContent: parsedContent.html,
    productDetail: {
      id: postData.id || postData._id || 'preview',
      topicCategory,
      topicCategoryLabel: getTopicCategoryLabel(topicCategory),
      name: postData.title || '无标题',
      title: postData.title || '无标题',
      images,
      userAvatar: postData.avatarUrl || userInfo.avatar || '/images/default-avatar.png',
      userAvatarUrl: postData.avatarUrl || userInfo.avatar || '/images/default-avatar.png',
      userName: postData.nickName || userInfo.nickname || '当前用户',
      nickName: postData.nickName || userInfo.nickname || '当前用户',
      authorDisplayTag,
      userTag: authorDisplayTag ? authorDisplayTag.name : (postData.tagName || options.tagName || ''),
      tagName: authorDisplayTag ? authorDisplayTag.name : (postData.tagName || options.tagName || ''),
      userTagRarity: authorDisplayTag ? authorDisplayTag.rarityLevel : (postData.tagRarityLevel || options.tagRarityLevel || 1),
      tagRarityLevel: authorDisplayTag ? authorDisplayTag.rarityLevel : (postData.tagRarityLevel || options.tagRarityLevel || 1),
      likeCount: Number(postData.likeCount || 0),
      commentCount: Number(postData.commentCount || 0),
      isLiked: Boolean(postData.isLike),
      islike: Boolean(postData.isLike),
      createTime,
      createTimeFormatted: createTime && formatTime ? formatTime(createTime) : '',
      usageInfo,
      badges,
      ratingDetails: buildRatingDetails(postData.ratings),
      factSections,
      listSections,
      tagSections,
      hasContent: Boolean(contentText),
      contentText,
      averageRate,
      recommendationScore: Number(postData.recommendationScore || 0),
      summaryDisplay,
      summary: summaryDisplay,
      rawSummary: postData.summary,
      gearCategory: gearCategory,
      gearCategoryLabel: getGearCategoryLabel(gearCategory),
      gearModel: postData.gearModel,
      gearItemId: normalizeOptionalNumber(postData.gearItemId),
      usagePeriod: formatUsageYearLabel(postData.usagePeriod || postData.usageYear),
      usageFrequency: formatUsageFrequencyLabel(postData.usageFrequency),
      environments,
      environmentItems,
      environmentsText: joinDisplay(environmentItems),
      customScene: postData.customScene,
      tags: tags,
      pros,
      prosItems: mappedGearPros,
      prosText: joinDisplay(mappedGearPros),
      prosSupplementItems: pros,
      prosSupplementText: joinDisplay(pros, '\n'),
      cons,
      consItems: mappedGearCons,
      consText: joinDisplay(mappedGearCons),
      consSupplementItems: cons,
      consSupplementText: joinDisplay(cons, '\n'),
      repurchase: repurchaseDisplay,
      rawRepurchase: postData.repurchase,
      verifyImage: postData.verifyImage,
      comboGear,
      comboGearText: joinDisplay(comboGear),
      compareGear,
      compareGearText: joinDisplay(compareGear),
      comboDesc: postData.comboDesc,
      compareDesc: postData.compareDesc,
      questionType: postData.questionType,
      questionTypeLabel: formatQuestionTypeLabel(postData.questionType),
      relatedGearCategory: postData.relatedGearCategory,
      relatedGearCategoryLabel: getGearCategoryLabel(postData.relatedGearCategory),
      relatedGearModel: postData.relatedGearModel,
      relatedGearItemId: normalizeOptionalNumber(postData.relatedGearItemId),
      quickReplyOnly: Boolean(postData.quickReplyOnly),
      locationTag: postData.locationTag,
      locationTagDisplay,
      length: postData.length,
      weight: postData.weight,
      catchLengthText,
      catchWeightText,
      catchBodyTypeText,
      isLengthSecret: postData.isLengthSecret,
      isLengthEstimated: postData.isLengthEstimated,
      isWeightSecret: postData.isWeightSecret,
      isWeightEstimated: postData.isWeightEstimated,
      tripResult: postData.tripResult,
      tripStatus,
      tripStatusText: joinDisplay(tripStatus),
      targetFish,
      targetFishText: joinDisplay(targetFish),
      customTargetFish: postData.customTargetFish,
      season: postData.season,
      weather: postData.weather,
      waterType: postData.waterType,
      mainSpot: postData.mainSpot,
      fishingTime: postData.fishingTime,
      envFeelings,
      envFeelingsText: joinDisplay(envFeelings),
      rigs,
      rigsText: joinDisplay(rigs),
      rigDescription: postData.rigDescription,
      fitItems: fitDisplayList,
      fitText: joinDisplay(fitDisplayList),
      unfitItems: unfitDisplayList,
      unfitText: joinDisplay(unfitDisplayList),
      shareReasonsText: joinDisplay(tags.shareReasons),
      budgetText: mappedBudget,
      usageTagItems: mappedUsage,
      usageTagsText: joinDisplay(mappedUsage),
      fitContextText: joinDisplay(mappedFitContext),
      fitTechniqueText: joinDisplay(mappedFitTechnique),
      compareProfileText: joinDisplay(mappedCompareProfile),
      compareBuyDecisionText: joinDisplay(mappedCompareBuyDecision),
      purchaseAdviceText: joinDisplay(mappedPurchaseAdvice),
      buyStageText: joinDisplay(mappedBuyStage),
      supplementParamsText: joinDisplay(mappedSupplementParams)
    }
  };
}

module.exports = {
  buildTopicDetailView,
  TOPIC_CATEGORY
};
