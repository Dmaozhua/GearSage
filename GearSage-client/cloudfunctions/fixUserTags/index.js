const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const COL = {
  TAG: 'bz_tag',
  USER_TAG: 'bz_user_tag',
  GOODS: 'bz_points_goods'
};

exports.main = async (event, context) => {
  console.log('开始执行 Tag ID 修复脚本...');

  // 1. 获取所有 Tag，构建多种映射关系
  const MAX_TAG_LIMIT = 1000;
  const tagResult = await db.collection(COL.TAG).limit(MAX_TAG_LIMIT).get();
  const allTags = tagResult.data || [];
  
  console.log(`获取到 ${allTags.length} 个 Tag 基础数据`);

  const exactMap = new Map();
  const lossyMap = new Map();

  allTags.forEach(tag => {
    if (tag._id) exactMap.set(String(tag._id), tag._id);
    if (tag.id) {
      const strId = String(tag.id);
      exactMap.set(strId, tag._id);
      const numId = Number(strId);
      if (!Number.isNaN(numId)) {
        lossyMap.set(numId, tag._id);
      }
    }
  });

  // 定义需要修复的集合及其字段
  const targets = [
    { collection: COL.USER_TAG, field: 'tagId' },
    { collection: COL.GOODS, field: 'tagId' }, // 新增对商品表的修复
    { collection: COL.GOODS, field: 'tag_id' } // 兼容旧字段
  ];

  let totalStats = {};

  for (const target of targets) {
    console.log(`正在处理集合: ${target.collection}, 字段: ${target.field}`);
    const stats = await fixCollection(target.collection, target.field, exactMap, lossyMap);
    totalStats[`${target.collection}.${target.field}`] = stats;
  }

  return {
    msg: 'All collections processed',
    details: totalStats
  };
};

async function fixCollection(collectionName, fieldName, exactMap, lossyMap) {
  const BATCH_SIZE = 100;
  let offset = 0;
  let updatedCount = 0;
  let totalProcessed = 0;

  while (true) {
    const { data: items } = await db.collection(collectionName)
      .skip(offset)
      .limit(BATCH_SIZE)
      .get();

    if (items.length === 0) break;

    const tasks = [];

    for (const item of items) {
      let needsUpdate = false;
      let newValue = null;
      let matchType = '';

      const rawValue = item[fieldName];

      if (rawValue) {
        const strRaw = String(rawValue);
        if (exactMap.has(strRaw)) {
          const targetId = exactMap.get(strRaw);
          if (targetId !== rawValue) {
            newValue = targetId;
            needsUpdate = true;
            matchType = 'exact/string_convert';
          }
        } 
        else if (typeof rawValue === 'number' && lossyMap.has(rawValue)) {
          const targetId = lossyMap.get(rawValue);
          if (targetId !== rawValue) {
            newValue = targetId;
            needsUpdate = true;
            matchType = 'lossy_number_recovery';
          }
        }
      }

      if (needsUpdate && newValue) {
        console.log(`[Fix] ${collectionName}(${item._id}).${fieldName}: ${rawValue} -> ${newValue} (${matchType})`);
        tasks.push(
          db.collection(collectionName).doc(item._id).update({
            data: {
              [fieldName]: newValue
            }
          })
        );
      }
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
      updatedCount += tasks.length;
    }

    totalProcessed += items.length;
    offset += BATCH_SIZE;
    console.log(`[${collectionName}] 已扫描 ${totalProcessed} 条，修复 ${updatedCount} 条`);
  }

  return { totalProcessed, updatedCount };
}