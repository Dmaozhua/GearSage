// constants/usage-env.js

/**
 * 使用环境常量
 */
const USAGE_ENVIRONMENTS = {
  // 淡水环境
  FRESHWATER: {
    label: '淡水环境',
    environments: [
      { value: 'lake', label: '湖泊', icon: '🏞️', description: '大型淡水湖泊，水域开阔' },
      { value: 'reservoir', label: '水库', icon: '🏔️', description: '人工水库，水位相对稳定' },
      { value: 'river', label: '江河', icon: '🏞️', description: '流动的江河水域' },
      { value: 'stream', label: '溪流', icon: '🏞️', description: '小型溪流，水流湍急' },
      { value: 'pond', label: '池塘', icon: '🏞️', description: '小型池塘，水域较小' },
      { value: 'canal', label: '运河', icon: '🚢', description: '人工运河水道' },
      { value: 'wetland', label: '湿地', icon: '🌾', description: '湿地环境，生态丰富' }
    ]
  },
  
  // 海水环境
  SALTWATER: {
    label: '海水环境',
    environments: [
      { value: 'offshore', label: '近海', icon: '🌊', description: '近岸海域，水深适中' },
      { value: 'deep_sea', label: '深海', icon: '🌊', description: '远海深水区域' },
      { value: 'bay', label: '海湾', icon: '🏖️', description: '海湾内侧，相对平静' },
      { value: 'estuary', label: '河口', icon: '🏞️', description: '河流入海口，咸淡水交汇' },
      { value: 'reef', label: '礁石区', icon: '🪨', description: '礁石丰富的海域' },
      { value: 'beach', label: '海滩', icon: '🏖️', description: '沙滩或岩石海岸' },
      { value: 'pier', label: '码头', icon: '🚢', description: '港口码头区域' },
      { value: 'breakwater', label: '防波堤', icon: '🌊', description: '防波堤附近水域' }
    ]
  },
  
  // 特殊环境
  SPECIAL: {
    label: '特殊环境',
    environments: [
      { value: 'ice_fishing', label: '冰钓', icon: '❄️', description: '冰面钓鱼' },
      { value: 'night_fishing', label: '夜钓', icon: '🌙', description: '夜间钓鱼' },
      { value: 'boat_fishing', label: '船钓', icon: '⛵', description: '船上钓鱼' },
      { value: 'kayak_fishing', label: '皮划艇钓', icon: '🛶', description: '皮划艇钓鱼' },
      { value: 'wade_fishing', label: '涉水钓', icon: '🦵', description: '站在水中钓鱼' },
      { value: 'urban_fishing', label: '城市钓点', icon: '🏙️', description: '城市内的钓鱼点' }
    ]
  }
};

/**
 * 水深分类
 */
const WATER_DEPTH = {
  SHALLOW: { value: 'shallow', label: '浅水区', range: '0-2米', icon: '🏊‍♂️' },
  MEDIUM: { value: 'medium', label: '中水区', range: '2-10米', icon: '🏊‍♀️' },
  DEEP: { value: 'deep', label: '深水区', range: '10米以上', icon: '🤿' }
};

/**
 * 水流情况
 */
const WATER_FLOW = {
  STILL: { value: 'still', label: '静水', description: '无明显水流' },
  SLOW: { value: 'slow', label: '缓流', description: '水流缓慢' },
  MEDIUM: { value: 'medium', label: '中流', description: '水流适中' },
  FAST: { value: 'fast', label: '急流', description: '水流湍急' }
};

/**
 * 水质情况
 */
const WATER_QUALITY = {
  CLEAR: { value: 'clear', label: '清澈', description: '水质清澈透明' },
  SLIGHTLY_TURBID: { value: 'slightly_turbid', label: '微浑', description: '轻微浑浊' },
  TURBID: { value: 'turbid', label: '浑浊', description: '水质浑浊' },
  MUDDY: { value: 'muddy', label: '泥浆', description: '泥浆状水质' }
};

/**
 * 天气条件
 */
const WEATHER_CONDITIONS = {
  SUNNY: { value: 'sunny', label: '晴天', icon: '☀️' },
  CLOUDY: { value: 'cloudy', label: '多云', icon: '☁️' },
  OVERCAST: { value: 'overcast', label: '阴天', icon: '☁️' },
  RAINY: { value: 'rainy', label: '雨天', icon: '🌧️' },
  WINDY: { value: 'windy', label: '大风', icon: '💨' },
  FOGGY: { value: 'foggy', label: '雾天', icon: '🌫️' }
};

/**
 * 季节分类
 */
const SEASONS = {
  SPRING: { value: 'spring', label: '春季', months: [3, 4, 5], icon: '🌸' },
  SUMMER: { value: 'summer', label: '夏季', months: [6, 7, 8], icon: '☀️' },
  AUTUMN: { value: 'autumn', label: '秋季', months: [9, 10, 11], icon: '🍂' },
  WINTER: { value: 'winter', label: '冬季', months: [12, 1, 2], icon: '❄️' }
};

/**
 * 获取所有使用环境（扁平化）
 */
function getAllEnvironments() {
  const allEnvironments = [];
  
  Object.values(USAGE_ENVIRONMENTS).forEach(category => {
    allEnvironments.push(...category.environments);
  });
  
  return allEnvironments;
}

/**
 * 根据value获取环境信息
 */
function getEnvironmentByValue(value) {
  const allEnvironments = getAllEnvironments();
  return allEnvironments.find(env => env.value === value);
}

/**
 * 获取环境分类列表（用于选择器）
 */
function getEnvironmentsForPicker() {
  return Object.entries(USAGE_ENVIRONMENTS).map(([key, category]) => ({
    label: category.label,
    value: key,
    children: category.environments
  }));
}

/**
 * 搜索环境
 */
function searchEnvironments(keyword) {
  if (!keyword) return [];
  
  const allEnvironments = getAllEnvironments();
  const lowerKeyword = keyword.toLowerCase();
  
  return allEnvironments.filter(env => 
    env.label.includes(keyword) || 
    env.value.toLowerCase().includes(lowerKeyword) ||
    env.description.includes(keyword)
  );
}

/**
 * 热门钓鱼环境
 */
const POPULAR_ENVIRONMENTS = [
  'lake',        // 湖泊
  'reservoir',   // 水库
  'river',       // 江河
  'offshore',    // 近海
  'bay',         // 海湾
  'reef',        // 礁石区
  'pier',        // 码头
  'boat_fishing' // 船钓
];

/**
 * 获取热门环境列表
 */
function getPopularEnvironments() {
  return POPULAR_ENVIRONMENTS.map(value => getEnvironmentByValue(value)).filter(Boolean);
}

/**
 * 根据当前季节获取推荐环境
 */
function getRecommendedEnvironmentsBySeason() {
  const currentMonth = new Date().getMonth() + 1;
  let currentSeason = null;
  
  Object.values(SEASONS).forEach(season => {
    if (season.months.includes(currentMonth)) {
      currentSeason = season;
    }
  });
  
  // 根据季节推荐不同的钓鱼环境
  const seasonRecommendations = {
    spring: ['lake', 'reservoir', 'river', 'bay'],
    summer: ['offshore', 'deep_sea', 'night_fishing', 'boat_fishing'],
    autumn: ['lake', 'reservoir', 'offshore', 'reef'],
    winter: ['reservoir', 'bay', 'pier', 'ice_fishing']
  };
  
  if (currentSeason) {
    const recommended = seasonRecommendations[currentSeason.value] || [];
    return recommended.map(value => getEnvironmentByValue(value)).filter(Boolean);
  }
  
  return getPopularEnvironments();
}

/**
 * 获取当前季节
 */
function getCurrentSeason() {
  const currentMonth = new Date().getMonth() + 1;
  
  for (let season of Object.values(SEASONS)) {
    if (season.months.includes(currentMonth)) {
      return season;
    }
  }
  
  return SEASONS.SPRING; // 默认返回春季
}

module.exports = {
  USAGE_ENVIRONMENTS,
  WATER_DEPTH,
  WATER_FLOW,
  WATER_QUALITY,
  WEATHER_CONDITIONS,
  SEASONS,
  POPULAR_ENVIRONMENTS,
  getAllEnvironments,
  getEnvironmentByValue,
  getEnvironmentsForPicker,
  searchEnvironments,
  getPopularEnvironments,
  getRecommendedEnvironmentsBySeason,
  getCurrentSeason
};