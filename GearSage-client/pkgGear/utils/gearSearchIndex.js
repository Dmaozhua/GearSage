const searchData = require('../searchData/Data.js');

const TYPE_MAP = {
  reels: 'reel',
  rods: 'rod',
  lures: 'lure',
  reel: 'reel',
  rod: 'rod',
  lure: 'lure'
};

const SEARCH_INDEX = buildSearchIndex(searchData);
const SEARCH_DATA_LIST = Array.isArray(searchData) ? searchData : [];

function buildSearchIndex(list = []) {
  return (Array.isArray(list) ? list : []).reduce((acc, item) => {
    const type = normalizeGearType(item.type);
    const id = normalizeId(item.id);
    if (!type || !id) {
      return acc;
    }
    acc[`${type}:${id}`] = item;
    return acc;
  }, {});
}

function normalizeGearType(type) {
  return TYPE_MAP[String(type || '').trim()] || '';
}

function normalizeId(value) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? String(next) : '';
}

function getSearchIndexEntry(type, id) {
  const normalizedType = normalizeGearType(type);
  const normalizedId = normalizeId(id);
  if (!normalizedType || !normalizedId) {
    return null;
  }
  return SEARCH_INDEX[`${normalizedType}:${normalizedId}`] || null;
}

function enrichGearItemWithSearchData(item = {}, type) {
  const entry = getSearchIndexEntry(type, item.id);
  return {
    ...item,
    searchIndexName: String(entry?.name || '').trim(),
    searchAlias: String(entry?.alias || '').trim(),
    searchTypeTips: String(entry?.type_tips || '').trim()
  };
}

function buildSearchTarget(item = {}) {
  return [
    item.displayName,
    item.model,
    item.modelCn,
    item.model_cn,
    item.alias,
    item.typeTips,
    item.type_tips,
    item.brandName,
    item.searchIndexName,
    item.searchAlias,
    item.searchTypeTips,
    item.family,
    item.familyId
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ');
}

function filterGearListByKeyword(list = [], keyword = '') {
  const tokens = String(keyword || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) {
    return list;
  }

  return list.filter((item) => {
    const target = buildSearchTarget(item);
    return tokens.every((token) => target.includes(token));
  });
}

function filterGearListByRecommendations(list = [], recommendations = []) {
  const keywords = (Array.isArray(recommendations) ? recommendations : [])
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return [];
      }
      return [item.id, item.name]
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean);
    })
    .flat();

  if (!keywords.length) {
    return list;
  }

  return list.filter((item) => {
    const target = buildSearchTarget(item);
    return keywords.some((keyword) => target.includes(keyword));
  });
}

function buildSearchEntryTarget(entry = {}) {
  return [
    entry.name,
    entry.alias,
    entry.type_tips
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ');
}

function getRecommendationCoverage(type, recommendation = {}) {
  const normalizedType = normalizeGearType(type);
  if (!normalizedType) {
    return {
      covered: false,
      matchCount: 0
    };
  }

  const keywords = [recommendation.id, recommendation.name]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  if (!keywords.length) {
    return {
      covered: false,
      matchCount: 0
    };
  }

  const matchCount = SEARCH_DATA_LIST.filter((entry) => {
    if (normalizeGearType(entry.type) !== normalizedType) {
      return false;
    }
    const target = buildSearchEntryTarget(entry);
    return keywords.some((keyword) => target.includes(keyword));
  }).length;

  return {
    covered: matchCount > 0,
    matchCount
  };
}

module.exports = {
  normalizeGearType,
  getSearchIndexEntry,
  enrichGearItemWithSearchData,
  buildSearchTarget,
  filterGearListByKeyword,
  filterGearListByRecommendations,
  getRecommendationCoverage
};
