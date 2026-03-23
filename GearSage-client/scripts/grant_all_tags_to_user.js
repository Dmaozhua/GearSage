const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const tcb = require('@cloudbase/node-sdk');

const ENV_ID = process.env.TCB_ENV_ID || 'cloud1-1g9eeb3p33faac61';
const DEFAULT_USER_ID = '112e17ec69a1677701f4860778024afb';

const COL = {
  TAG_DEFINITION: 'bz_tag_definitions',
  USER_TAGS: 'bz_user_tags',
  USER_TAG_DISPLAY: 'user_tag_display_settings'
};

function now() {
  return new Date();
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function fetchAllActiveWearableTags(db) {
  const res = await db.collection(COL.TAG_DEFINITION).limit(1000).get();

  return (res.data || [])
    .map(tag => {
      const source = tag && tag.data && typeof tag.data === 'object' ? { ...tag.data, _outer_id: tag._id } : tag;
      return {
        ...source,
        id: source._id || tag._id,
        displayPriority: Number(source.display_priority ?? source.displayPriority ?? 0) || 0,
        rarityLevel: Number(source.rarity_level ?? source.rarityLevel ?? 1) || 1
      };
    })
    .filter(tag => {
      const isActive = tag.is_active === undefined && tag.isActive === undefined
        ? true
        : Boolean(tag.is_active ?? tag.isActive);
      const isWearable = tag.is_wearable === undefined && tag.isWearable === undefined
        ? true
        : Boolean(tag.is_wearable ?? tag.isWearable);
      return isActive && isWearable;
    });
}

async function fetchExistingUserTags(db, userId) {
  const queries = [
    db.collection(COL.USER_TAGS).where({ user_id: userId }).get().catch(() => ({ data: [] })),
    db.collection(COL.USER_TAGS).where({ userId }).get().catch(() => ({ data: [] })),
    db.collection(COL.USER_TAGS).limit(1000).get().catch(() => ({ data: [] }))
  ];

  const results = await Promise.all(queries);
  const map = new Map();
  results.forEach(result => {
    (result.data || []).forEach(item => {
      const source = item && item.data && typeof item.data === 'object' ? { ...item, ...item.data } : item;
      const sourceUserId = normalizeString(source.user_id || source.userId);
      const tagId = normalizeString(source.tag_id || source.tagId);
      if (sourceUserId === userId && tagId) {
        map.set(tagId, source);
      }
    });
  });
  return map;
}

function buildEquivalentLegacyTagIdSet(allTags = [], existingMap = new Map()) {
  const legacyOwnedTagIds = new Set();
  for (const [tagId] of existingMap.entries()) {
    if (tagId && !String(tagId).startsWith('tag_')) {
      legacyOwnedTagIds.add(String(tagId));
    }
  }

  const equivalentNewTagIds = new Set();
  allTags.forEach(tag => {
    const legacyDocId = normalizeString(tag.legacy_tag_doc_id || tag.legacyTagDocId);
    if (legacyDocId && legacyOwnedTagIds.has(legacyDocId)) {
      equivalentNewTagIds.add(String(tag.id));
    }
  });
  return equivalentNewTagIds;
}

async function repairNestedUserTagDocs(db, userId) {
  const res = await db.collection(COL.USER_TAGS).limit(1000).get().catch(() => ({ data: [] }));
  const nestedDocs = (res.data || []).filter(item => {
    const nested = item && item.data && typeof item.data === 'object' ? item.data : null;
    return nested && normalizeString(nested.user_id || nested.userId) === userId;
  });

  let repaired = 0;
  for (const item of nestedDocs) {
    const nested = item.data;
    const tagId = normalizeString(nested.tag_id || nested.tagId);
    const exists = await db
      .collection(COL.USER_TAGS)
      .where({ user_id: userId, tag_id: tagId })
      .limit(5)
      .get()
      .catch(() => ({ data: [] }));
    const duplicate = (exists.data || []).find(doc => doc._id !== item._id);

    if (!duplicate) {
      await db.collection(COL.USER_TAGS).add({
        ...nested
      });
    }
    await db.collection(COL.USER_TAGS).doc(item._id).remove().catch(() => null);
    repaired += 1;
  }

  return repaired;
}

async function removeEquivalentGrantedTags(db, userId, allTags = [], existingMap = new Map()) {
  const equivalentNewTagIds = buildEquivalentLegacyTagIdSet(allTags, existingMap);
  if (!equivalentNewTagIds.size) return 0;

  const res = await db.collection(COL.USER_TAGS).where({ user_id: userId }).limit(1000).get().catch(() => ({ data: [] }));
  const redundantDocs = (res.data || []).filter(item => {
    const tagId = normalizeString(item.tag_id || item.tagId);
    const obtainMethod = normalizeString(item.obtain_method || item.obtainMethod);
    return equivalentNewTagIds.has(tagId) && obtainMethod === 'manual_grant';
  });

  for (const item of redundantDocs) {
    await db.collection(COL.USER_TAGS).doc(item._id).remove().catch(() => null);
  }

  return redundantDocs.length;
}

async function fetchDisplaySetting(db, userId) {
  const queries = [
    db.collection(COL.USER_TAG_DISPLAY).where({ user_id: userId }).limit(1).get().catch(() => ({ data: [] })),
    db.collection(COL.USER_TAG_DISPLAY).where({ userId }).limit(1).get().catch(() => ({ data: [] }))
  ];
  const results = await Promise.all(queries);
  const found = results.find(result => Array.isArray(result.data) && result.data.length > 0);
  if (!found) return null;
  const item = found.data[0];
  return item && item.data && typeof item.data === 'object' ? { ...item, ...item.data } : item;
}

async function upsertDisplaySetting(db, userId, equippedTagId) {
  const current = await fetchDisplaySetting(db, userId);
  const payload = {
    user_id: userId,
    equipped_tag_id: equippedTagId || null,
    prefer_identity_in_review: true,
    prefer_fun_in_catch: true,
    updated_at: now()
  };

  if (current?._id) {
    const currentEquipped = normalizeString(current.equipped_tag_id || current.equippedTagId);
    if (currentEquipped) {
      return { action: 'kept', id: current._id, equippedTagId: currentEquipped };
    }
    await db.collection(COL.USER_TAG_DISPLAY).doc(current._id).update({ data: payload });
    return { action: 'updated', id: current._id, equippedTagId };
  }

  const addRes = await db.collection(COL.USER_TAG_DISPLAY).add({
    ...payload,
    created_at: now()
  });
  return { action: 'inserted', id: addRes.id, equippedTagId };
}

async function grantAllTagsToUser(targetUserId) {
  if (!process.env.TCB_SECRET_ID || !process.env.TCB_SECRET_KEY) {
    throw new Error('Missing TCB_SECRET_ID / TCB_SECRET_KEY in environment');
  }

  const app = tcb.init({
    env: ENV_ID,
    secretId: process.env.TCB_SECRET_ID,
    secretKey: process.env.TCB_SECRET_KEY
  });
  const db = app.database();

  const userId = normalizeString(targetUserId || DEFAULT_USER_ID);
  if (!userId) {
    throw new Error('Missing target user id');
  }

  console.log(`Using CloudBase env: ${ENV_ID}`);
  console.log(`Granting all active tags to user: ${userId}`);

  const repairedNestedDocs = await repairNestedUserTagDocs(db, userId);
  let [allTags, existingMap] = await Promise.all([
    fetchAllActiveWearableTags(db),
    fetchExistingUserTags(db, userId)
  ]);

  if (!allTags.length) {
    throw new Error('No active wearable tags found in bz_tag_definitions');
  }

  const removedEquivalentGrantedTags = await removeEquivalentGrantedTags(db, userId, allTags, existingMap);
  existingMap = await fetchExistingUserTags(db, userId);
  const equivalentNewTagIds = buildEquivalentLegacyTagIdSet(allTags, existingMap);
  const tagsToInsert = allTags.filter(tag => !existingMap.has(String(tag.id)) && !equivalentNewTagIds.has(String(tag.id)));
  let inserted = 0;

  for (const tag of tagsToInsert) {
    await db.collection(COL.USER_TAGS).add({
      user_id: userId,
      tag_id: String(tag.id),
      obtain_method: 'manual_grant',
      obtain_source_id: 'scripts/grant_all_tags_to_user',
      status: 'active',
      obtained_at: now(),
      expires_at: null,
      created_at: now(),
      updated_at: now()
    });
    inserted += 1;
  }

  const equippedTag = [...allTags].sort((a, b) => {
    const priorityDiff = b.displayPriority - a.displayPriority;
    if (priorityDiff !== 0) return priorityDiff;
    return b.rarityLevel - a.rarityLevel;
  })[0];

  const displaySetting = await upsertDisplaySetting(db, userId, equippedTag ? String(equippedTag.id) : null);

  return {
    userId,
    totalTags: allTags.length,
    repairedNestedDocs,
    removedEquivalentGrantedTags,
    alreadyOwned: existingMap.size,
    inserted,
    equippedTagId: displaySetting.equippedTagId || null,
    displaySettingAction: displaySetting.action
  };
}

async function main() {
  const targetUserId = process.argv[2] || DEFAULT_USER_ID;
  const result = await grantAllTagsToUser(targetUserId);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error('Grant all tags failed:', error);
  process.exit(1);
});
