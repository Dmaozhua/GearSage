// constants/fish-species.js

/**
 * 目标鱼种类常量
 */
const FISH_SPECIES = {
  // 淡水路亚鱼种
  FRESHWATER: {
    label: '淡水鱼种',
    species: [
      { value: 'bass', label: '鲈鱼', icon: '🐟' },
      { value: 'pike', label: '梭鱼', icon: '🐠' },
      { value: 'perch', label: '鲈鲈', icon: '🐟' },
      { value: 'catfish', label: '鲶鱼', icon: '🐱' },
      { value: 'carp', label: '鲤鱼', icon: '🐟' },
      { value: 'crucian_carp', label: '鲫鱼', icon: '🐟' },
      { value: 'grass_carp', label: '草鱼', icon: '🐟' },
      { value: 'silver_carp', label: '鲢鱼', icon: '🐟' },
      { value: 'bighead_carp', label: '鳙鱼', icon: '🐟' },
      { value: 'mandarin_fish', label: '桂鱼', icon: '🐟' },
      { value: 'snakehead', label: '黑鱼', icon: '🐍' },
      { value: 'yellow_catfish', label: '黄颡鱼', icon: '🐱' },
      { value: 'tilapia', label: '罗非鱼', icon: '🐟' },
      { value: 'trout', label: '鳟鱼', icon: '🐟' },
      { value: 'salmon', label: '三文鱼', icon: '🐟' }
    ]
  },
  
  // 海水路亚鱼种
  SALTWATER: {
    label: '海水鱼种',
    species: [
      { value: 'sea_bass', label: '海鲈鱼', icon: '🐟' },
      { value: 'tuna', label: '金枪鱼', icon: '🐟' },
      { value: 'mackerel', label: '鲭鱼', icon: '🐟' },
      { value: 'spanish_mackerel', label: '鲅鱼', icon: '🐟' },
      { value: 'pomfret', label: '鲳鱼', icon: '🐟' },
      { value: 'red_snapper', label: '红鲷', icon: '🔴' },
      { value: 'grouper', label: '石斑鱼', icon: '🐟' },
      { value: 'flounder', label: '比目鱼', icon: '🐟' },
      { value: 'cod', label: '鳕鱼', icon: '🐟' },
      { value: 'yellowtail', label: '黄尾鱼', icon: '🟡' },
      { value: 'barracuda', label: '梭子鱼', icon: '🐟' },
      { value: 'shark', label: '鲨鱼', icon: '🦈' },
      { value: 'ray', label: '鳐鱼', icon: '🐟' },
      { value: 'marlin', label: '马林鱼', icon: '🐟' },
      { value: 'sailfish', label: '旗鱼', icon: '🐟' }
    ]
  },
  
  // 特殊鱼种
  SPECIAL: {
    label: '特殊鱼种',
    species: [
      { value: 'eel', label: '鳗鱼', icon: '🐍' },
      { value: 'squid', label: '鱿鱼', icon: '🦑' },
      { value: 'octopus', label: '章鱼', icon: '🐙' },
      { value: 'crab', label: '螃蟹', icon: '🦀' },
      { value: 'shrimp', label: '虾', icon: '🦐' },
      { value: 'lobster', label: '龙虾', icon: '🦞' },
      { value: 'other', label: '其他', icon: '❓' }
    ]
  }
};

/**
 * 获取所有鱼种列表（扁平化）
 */
function getAllFishSpecies() {
  const allSpecies = [];
  
  Object.values(FISH_SPECIES).forEach(category => {
    allSpecies.push(...category.species);
  });
  
  return allSpecies;
}

/**
 * 根据value获取鱼种信息
 */
function getFishSpeciesByValue(value) {
  const allSpecies = getAllFishSpecies();
  return allSpecies.find(species => species.value === value);
}

/**
 * 获取鱼种分类列表（用于选择器）
 */
function getFishSpeciesForPicker() {
  return Object.entries(FISH_SPECIES).map(([key, category]) => ({
    label: category.label,
    value: key,
    children: category.species
  }));
}

/**
 * 搜索鱼种
 */
function searchFishSpecies(keyword) {
  if (!keyword) return [];
  
  const allSpecies = getAllFishSpecies();
  const lowerKeyword = keyword.toLowerCase();
  
  return allSpecies.filter(species => 
    species.label.includes(keyword) || 
    species.value.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * 热门鱼种（根据路亚钓鱼的热门程度排序）
 */
const POPULAR_FISH_SPECIES = [
  'bass',           // 鲈鱼
  'sea_bass',       // 海鲈鱼
  'pike',           // 梭鱼
  'snakehead',      // 黑鱼
  'mandarin_fish',  // 桂鱼
  'catfish',        // 鲶鱼
  'perch',          // 鲈鲈
  'mackerel',       // 鲭鱼
  'spanish_mackerel', // 鲅鱼
  'grouper'         // 石斑鱼
];

/**
 * 获取热门鱼种列表
 */
function getPopularFishSpecies() {
  return POPULAR_FISH_SPECIES.map(value => getFishSpeciesByValue(value)).filter(Boolean);
}

/**
 * 鱼种难度等级
 */
const FISH_DIFFICULTY = {
  'bass': 'medium',
  'sea_bass': 'medium',
  'pike': 'hard',
  'snakehead': 'medium',
  'mandarin_fish': 'medium',
  'catfish': 'easy',
  'perch': 'easy',
  'mackerel': 'medium',
  'spanish_mackerel': 'medium',
  'grouper': 'hard',
  'tuna': 'expert',
  'marlin': 'expert',
  'sailfish': 'expert',
  'shark': 'expert'
};

/**
 * 获取鱼种难度
 */
function getFishDifficulty(value) {
  return FISH_DIFFICULTY[value] || 'medium';
}

/**
 * 难度等级标签
 */
const DIFFICULTY_LABELS = {
  'easy': '简单',
  'medium': '中等',
  'hard': '困难',
  'expert': '专家级'
};

/**
 * 获取难度标签
 */
function getDifficultyLabel(difficulty) {
  return DIFFICULTY_LABELS[difficulty] || '中等';
}

module.exports = {
  FISH_SPECIES,
  POPULAR_FISH_SPECIES,
  FISH_DIFFICULTY,
  DIFFICULTY_LABELS,
  getAllFishSpecies,
  getFishSpeciesByValue,
  getFishSpeciesForPicker,
  searchFishSpecies,
  getPopularFishSpecies,
  getFishDifficulty,
  getDifficultyLabel
};