const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.resolve(__dirname, '../GearSage-client/pkgGear/searchData/Data.js');
const TARGET_PATH = path.resolve(__dirname, '../GearSage-client/data/gear-search-data.js');

function clearModuleCache(modulePath) {
  try {
    delete require.cache[require.resolve(modulePath)];
  } catch (error) {
    // Ignore cache misses so the script remains idempotent.
  }
}

function loadSearchData(modulePath) {
  clearModuleCache(modulePath);
  const data = require(modulePath);
  return Array.isArray(data) ? data : [];
}

function buildTypeSummary(list) {
  return list.reduce((acc, item) => {
    const type = String(item && item.type ? item.type : 'unknown').trim() || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
}

function main() {
  if (!fs.existsSync(SOURCE_PATH)) {
    throw new Error(`source search data not found: ${SOURCE_PATH}`);
  }

  const sourceContent = fs.readFileSync(SOURCE_PATH, 'utf8');
  fs.writeFileSync(TARGET_PATH, sourceContent, 'utf8');

  const sourceList = loadSearchData(SOURCE_PATH);
  const targetList = loadSearchData(TARGET_PATH);

  if (JSON.stringify(sourceList) !== JSON.stringify(targetList)) {
    throw new Error('search data sync verification failed: target content mismatch');
  }

  console.log('[sync_client_gear_search_data] source:', SOURCE_PATH);
  console.log('[sync_client_gear_search_data] target:', TARGET_PATH);
  console.log(`[sync_client_gear_search_data] rows=${sourceList.length}`);
  console.log('[sync_client_gear_search_data] type summary:', JSON.stringify(buildTypeSummary(sourceList)));
}

main();
