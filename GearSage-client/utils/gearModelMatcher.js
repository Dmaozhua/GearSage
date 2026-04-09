const searchData = require('../pkgGear/searchData/Data.js');

const CATEGORY_TO_TYPE_MAP = {
  rod: 'rod',
  reel: 'reel',
  bait: 'lure',
  line: 'line',
};

const MAX_MATCH_CANDIDATE_COUNT = 20;
const MAX_SUGGESTION_COUNT = 8;

function resolveGearSearchType(gearCategory) {
  return CATEGORY_TO_TYPE_MAP[gearCategory] || '';
}

function mapSuggestions(items) {
  return items.slice(0, MAX_SUGGESTION_COUNT).map((item, index) => ({
    id: index,
    name: item.name,
    sourceId: item.sourceId,
  }));
}

function getDefaultSuggestions(items) {
  const uniqueItems = [];
  const seen = new Set();

  for (const item of items) {
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    uniqueItems.push({
      name,
      sourceId: item.id ?? null,
    });
    if (uniqueItems.length >= MAX_MATCH_CANDIDATE_COUNT) {
      break;
    }
  }

  return mapSuggestions(uniqueItems);
}

function getGearModelSuggestions(gearCategory, keyword = '') {
  const mappedType = resolveGearSearchType(gearCategory);
  if (!mappedType) {
    return [];
  }

  const typeItems = Array.isArray(searchData)
    ? searchData.filter((item) => item && item.type === mappedType)
    : [];

  const normalizedKeyword = String(keyword || '').trim().toLowerCase();
  if (!normalizedKeyword) {
    return getDefaultSuggestions(typeItems);
  }

  const tokens = normalizedKeyword.split(/\s+/);
  const matches = new Map();

  for (const item of typeItems) {
    if (matches.size >= MAX_MATCH_CANDIDATE_COUNT) {
      break;
    }

    const name = typeof item.name === 'string' ? item.name : '';
    const alias = typeof item.alias === 'string' ? item.alias : '';
    const typeTips = typeof item.type_tips === 'string' ? item.type_tips : '';

    const lowerName = name.toLowerCase();
    const lowerAlias = alias.toLowerCase();
    const lowerTypeTips = typeTips.toLowerCase();

    if (name && tokens.every((token) => lowerName.includes(token))) {
      matches.set(name, {
        name,
        sourceId: item.id ?? null,
      });
    }
    if (alias && tokens.every((token) => lowerAlias.includes(token))) {
      matches.set(alias, {
        name: alias,
        sourceId: item.id ?? null,
      });
    }
    if (typeTips && tokens.every((token) => lowerTypeTips.includes(token))) {
      matches.set(typeTips, {
        name: typeTips,
        sourceId: item.id ?? null,
      });
    }
  }

  return mapSuggestions(Array.from(matches.values()));
}

function getAllGearModelSuggestions(keyword = '') {
  const items = Array.isArray(searchData) ? searchData : [];
  const normalizedKeyword = String(keyword || '').trim().toLowerCase();

  if (!normalizedKeyword) {
    return getDefaultSuggestions(items);
  }

  const tokens = normalizedKeyword.split(/\s+/);
  const matches = new Map();

  for (const item of items) {
    if (matches.size >= MAX_MATCH_CANDIDATE_COUNT) {
      break;
    }

    const name = typeof item.name === 'string' ? item.name : '';
    const alias = typeof item.alias === 'string' ? item.alias : '';
    const typeTips = typeof item.type_tips === 'string' ? item.type_tips : '';

    const lowerName = name.toLowerCase();
    const lowerAlias = alias.toLowerCase();
    const lowerTypeTips = typeTips.toLowerCase();

    if (name && tokens.every((token) => lowerName.includes(token))) {
      matches.set(`name:${name}`, {
        name,
        sourceId: item.id ?? null,
      });
    }
    if (alias && tokens.every((token) => lowerAlias.includes(token))) {
      matches.set(`alias:${alias}`, {
        name: alias,
        sourceId: item.id ?? null,
      });
    }
    if (typeTips && tokens.every((token) => lowerTypeTips.includes(token))) {
      matches.set(`tips:${typeTips}`, {
        name: typeTips,
        sourceId: item.id ?? null,
      });
    }
  }

  return mapSuggestions(Array.from(matches.values()));
}

module.exports = {
  resolveGearSearchType,
  getGearModelSuggestions,
  getAllGearModelSuggestions,
};
