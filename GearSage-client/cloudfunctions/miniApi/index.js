const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const R = {
  ok(data, msg = 'success') {
    return { code: 200, msg, data };
  },
  fail(msg = 'fail', code = 500) {
    return { code, msg, data: null };
  }
};

const COL = {
  USER: 'bz_mini_user',
  USER_INVITE: 'bz_user_invite_relation',
  TOPIC: 'bz_mini_topic',
  TOPIC_LIKE: 'bz_topic_like',
  COMMENT: 'bz_topic_comment',
  TAG: 'bz_tag',
  USER_TAG: 'bz_user_tag',
  TAG_DEFINITION: 'bz_tag_definitions',
  USER_TAGS: 'bz_user_tags',
  USER_TAG_DISPLAY: 'user_tag_display_settings',
  TASK: 'bz_mini_task_feat',
  TASK_RECORD: 'bz_mini_task_feat_record',
  GOODS: 'bz_points_goods',
  GEAR_BRAND: 'bz_gear_brand',
  GEAR_ITEM: 'bz_gear_item',
  RATE_BRAND: 'bz_rate_brand',
  RATE_REEL: 'bz_rate_reel',
  RATE_SPINNING_REEL_DETAIL: 'bz_rate_spinning_reel_detail',
  RATE_BAITCASTING_REEL_DETAIL: 'bz_rate_baitcasting_reel_detail',
  RATE_ROD: 'bz_rate_rod',
  RATE_SPINNING_ROD_DETAIL: 'bz_rate_spinning_rod_detail',
  RATE_CASTING_ROD_DETAIL: 'bz_rate_casting_rod_detail',
  RATE_LURE: 'bz_rate_lure',
  RATE_HARD_LURE_DETAIL: 'bz_rate_hard_lure_detail',
  RATE_SOFT_LURE_DETAIL: 'bz_rate_soft_lure_detail'
};

const INVITE_REWARD_POINTS = 30;
const INVITEE_REWARD_POINTS = 0;
const INVITE_DAILY_REWARD_LIMIT = 10;
const INVITE_BIND_LOGIN_DAY_LIMIT = 1;

const TOPIC_CATEGORY = {
  RECOMMEND: 0,
  EXPERIENCE: 1,
  QUESTION: 2,
  CATCH: 3,
  TRIP: 4
};

const TAG_TYPE = {
  IDENTITY: 'identity',
  FUN: 'fun',
  EVENT: 'event',
  OFFICIAL: 'official'
};

const TAG_DISPLAY_STRATEGY = {
  SMART: 'smart',
  FIXED: 'fixed'
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

const TAG_DISPLAY_CATEGORY = {
  IDENTITY: 'identity',
  FUN: 'fun',
  BEHAVIOR: 'behavior',
  OFFICIAL: 'official'
};

const TAG_DISPLAY_CATEGORY_META = {
  [TAG_DISPLAY_CATEGORY.IDENTITY]: {
    key: TAG_DISPLAY_CATEGORY.IDENTITY,
    label: '身份',
    displayLabel: '身份标签',
    description: '代表你的钓鱼偏好与身份侧写'
  },
  [TAG_DISPLAY_CATEGORY.FUN]: {
    key: TAG_DISPLAY_CATEGORY.FUN,
    label: '娱乐',
    displayLabel: '娱乐标签',
    description: '更有圈内黑话感，适合轻松内容'
  },
  [TAG_DISPLAY_CATEGORY.BEHAVIOR]: {
    key: TAG_DISPLAY_CATEGORY.BEHAVIOR,
    label: '经历',
    displayLabel: '经历标签',
    description: '记录活跃、成就与长期参与痕迹'
  },
  [TAG_DISPLAY_CATEGORY.OFFICIAL]: {
    key: TAG_DISPLAY_CATEGORY.OFFICIAL,
    label: '官方',
    displayLabel: '官方标签',
    description: '来自认证、活动或官方发放'
  }
};

const TAG_PRIORITY_BY_TOPIC = {
  [TOPIC_CATEGORY.RECOMMEND]: ['identity', 'equipped', 'behavior', 'fun', 'official'],
  [TOPIC_CATEGORY.EXPERIENCE]: ['official', 'identity', 'equipped', 'behavior', 'fun'],
  [TOPIC_CATEGORY.QUESTION]: ['equipped', 'identity', 'fun', 'behavior', 'official'],
  [TOPIC_CATEGORY.CATCH]: ['equipped', 'fun', 'behavior', 'identity', 'official'],
  [TOPIC_CATEGORY.TRIP]: ['official', 'identity', 'behavior', 'equipped', 'fun']
};

const TAG_PREVIEW_TOPIC_ITEMS = [
  { key: 'recommend', label: '好物速报', topicCategory: TOPIC_CATEGORY.RECOMMEND },
  { key: 'experience', label: '长测评', topicCategory: TOPIC_CATEGORY.EXPERIENCE },
  { key: 'question', label: '讨论&提问', topicCategory: TOPIC_CATEGORY.QUESTION },
  { key: 'catch', label: '鱼获展示', topicCategory: TOPIC_CATEGORY.CATCH },
  { key: 'trip', label: '钓行分享', topicCategory: TOPIC_CATEGORY.TRIP }
];

const TOPIC_KEY_BY_CATEGORY = {
  [TOPIC_CATEGORY.RECOMMEND]: 'recommend',
  [TOPIC_CATEGORY.EXPERIENCE]: 'experience',
  [TOPIC_CATEGORY.QUESTION]: 'question',
  [TOPIC_CATEGORY.CATCH]: 'catch',
  [TOPIC_CATEGORY.TRIP]: 'trip'
};

const RECOMMENDATION_SUMMARY_SCORE_RULES = [
  { score: 10, values: ['A. 强烈推荐，明显超出预期', '强烈推荐', '明显超出预期'] },
  { score: 7, values: ['B. 值得推荐，整体满意', '值得推荐', '整体满意'] },
  { score: 4, values: ['C. 勉强可用，但不太推荐', '勉强可用，但不太推荐', '勉强可用'] },
  { score: 0, values: ['D. 不推荐，存在明显问题', '不推荐，存在明显问题', '不推荐'] }
];

const REPURCHASE_SCORE_RULES = [
  { score: 10, values: ['A 会继续使用同款', '会继续使用同款'] },
  { score: 8, values: ['B 会考虑升级同系列', '会考虑升级同系列'] },
  { score: 5, values: ['C 可能尝试其他品牌', '可能尝试其他品牌'] },
  { score: 0, values: ['D 不会再买', '不会再买'] }
];

const ACTION = {
  SIGN_IN: 249, // 首次登录
  EDIT_AVATAR: 250,
  EDIT_PROFILE: 251,
  CHECK_IN: 248, // 暂映射为累计登录3天，需确认每日签到逻辑
  DAILY_LOGIN: 255, // 每日登录
  SHARE_APP: 246,
  
  // 单次互动类（推测值）
  LIKE_INTERACTION: 254,    // 互动点赞
  COMMENT_INTERACTION: 253, // 互动评论
  POST_INTERACTION: 252,    // 发布帖子

  // 成就类
  COMMENT_MASTER: 245,
  LIKE_MASTER: 244,
  POST_MASTER: 241,
  LOGIN_7_DAYS: 243,
  LOGIN_21_DAYS: 242,
  INVITE_MASTER: 240,
  ACHIEVEMENT_MASTER: 239,

  // 兼容旧字符串（如果某些地方仍使用）
  LEGACY_SIGN_IN: 'ACTION_TYPE_SIGN_IN',
  LEGACY_CHECK_IN: 'ACTION_TYPE_CHECK_IN'
};


const DEFAULT_AVATAR_URL = 'https://anglertest.xyz/avatar/avatar.png';

function hasCustomAvatar(avatarUrl = '') {
  const avatar = String(avatarUrl || '').trim();
  if (!avatar) return false;
  if (avatar === DEFAULT_AVATAR_URL) return false;
  // 兼容微信默认头像资源
  if (avatar.includes('/mmopen/vi_32/')) return false;
  return true;
}

const TASK_CONFIG = {
  // 成就类（累积型，增强 userId 兼容性）
  [ACTION.POST_MASTER]: { 
    target: 5, 
    collection: COL.TOPIC, 
    query: (userId) => _.or([{ userId }, { user_id: userId }])
  },
  [ACTION.COMMENT_MASTER]: { 
    target: 20, 
    collection: COL.COMMENT, 
    query: (userId) => _.and([
      _.or([{ userId }, { user_id: userId }]),
      { isVisible: 1 }
    ])
  },
  [ACTION.LIKE_MASTER]: { 
    target: 30, 
    collection: COL.TOPIC_LIKE, 
    query: (userId) => _.or([{ userId }, { user_id: userId }])
  },

  [ACTION.INVITE_MASTER]: {
    target: 1,
    collection: COL.USER_INVITE,
    query: (userId) => ({
      inviterUserId: userId,
      status: 'bound'
    })
  },

  // 单次互动类（触发即完成，但需要检查记录是否存在）
  [ACTION.POST_INTERACTION]: {
    target: 1,
    collection: COL.TOPIC,
    query: (userId) => _.or([{ userId }, { user_id: userId }]),
    dailyWindowByTaskType: true
  },
  [ACTION.COMMENT_INTERACTION]: {
    target: 1,
    collection: COL.COMMENT,
    query: (userId) => _.and([
      _.or([{ userId }, { user_id: userId }]),
      { isVisible: 1 }
    ]),
    dailyWindowByTaskType: true
  },
  [ACTION.LIKE_INTERACTION]: {
    target: 1,
    collection: COL.TOPIC_LIKE,
    query: (userId) => _.or([{ userId }, { user_id: userId }]),
    dailyWindowByTaskType: true
  },

  // 完善资料任务（检查昵称是否非默认）
  [ACTION.EDIT_PROFILE]: { 
    check: async (userId) => {
      const user = await db.collection(COL.USER).doc(userId).get().then(res => res.data).catch(() => null);
      if (!user) return false;
      
      const nickName = String(user.nickName || '').trim();
      // 默认昵称模式：钓友说+序号，或微信默认的“微信用户”
      const isDefault = !nickName || 
                        nickName === '微信用户' || 
                        /^钓友说 \d+$/.test(nickName);
      
      const isCompleted = !isDefault;
      
      console.log(`[EDIT_PROFILE] Check for ${userId}: nickName="${nickName}", isDefault=${isDefault}, result=${isCompleted}`);
      return isCompleted;
    }
  },
  // 更换头像（头像不为空且非默认头像）
  [ACTION.EDIT_AVATAR]: {
    check: async (userId) => {
      const user = await db.collection(COL.USER).doc(userId).get().then(res => res.data).catch(() => null);
      if (!user) return false;
      return hasCustomAvatar(user.avatarUrl);
    }
  },
  // 首次登录（只要用户存在即算完成条件，等待领取）
  [ACTION.SIGN_IN]: {
    check: async (userId) => {
      return true; // 只要能调用接口，说明已登录
    }
  },
  // 每日登录（只要今天登录过）
  [ACTION.DAILY_LOGIN]: {
    check: async (userId) => {
      const user = await db.collection(COL.USER).doc(userId).get().then(res => res.data).catch(() => null);
      if (!user || !user.lastAuthTime) return false;
      const last = new Date(user.lastAuthTime);
      const today = startOfToday();
      return last >= today;
    }
  },
  // 累计登录（如3天、5天）
  [ACTION.CHECK_IN]: {
    getProgress: async (userId, task) => {
      const user = await db.collection(COL.USER).doc(userId).get().then(res => res.data).catch(() => null);
      if (!user) return { currentCount: 0, targetCount: resolveTaskTargetCount(task, 3) };
      const target = resolveTaskTargetCount(task, 3);
      return { currentCount: Number(user.totalLoginDays || 0), targetCount: target };
    }
  },
  // 连续登录7天
  [ACTION.LOGIN_7_DAYS]: {
    getProgress: async (userId, task) => {
      const user = await db.collection(COL.USER).doc(userId).get().then(res => res.data).catch(() => null);
      if (!user) return { currentCount: 0, targetCount: resolveTaskTargetCount(task, 7) };
      const target = resolveTaskTargetCount(task, 7);
      return { currentCount: Number(user.continuousLoginDays || 0), targetCount: target };
    }
  },
  // 连续登录21天
  [ACTION.LOGIN_21_DAYS]: {
    getProgress: async (userId, task) => {
      const user = await db.collection(COL.USER).doc(userId).get().then(res => res.data).catch(() => null);
      if (!user) return { currentCount: 0, targetCount: resolveTaskTargetCount(task, 21) };
      const target = resolveTaskTargetCount(task, 21);
      return { currentCount: Number(user.continuousLoginDays || 0), targetCount: target };
    }
  }
};

async function calculateTaskProgress(userId, task) {
  const actionType = task.actionType || task.action_type;
  const config = TASK_CONFIG[actionType];
  
  // 1. 如果没有配置，或者是触发型任务且不在记录表中（调用者保证），默认为未开始
  if (!config) {
    return { currentCount: 0, targetCount: 1, completed: false, progress: 0 };
  }

  // 2. 如果配置了自定义检查函数 (check)，用于非累积型但有状态的任务
  if (config.check) {
    const isConditionMet = await config.check(userId, task);
    return { 
      currentCount: isConditionMet ? 1 : 0, 
      targetCount: 1, 
      completed: isConditionMet, 
      progress: isConditionMet ? 100 : 0 
    };
  }

  // 2.1 如果配置了进度函数，返回可展示的 current/target
  if (config.getProgress) {
    const progressRes = await config.getProgress(userId, task);
    const currentCount = Number(progressRes?.currentCount || 0);
    const targetCount = resolveTaskTargetCount(task, Number(progressRes?.targetCount || 1));
    const completed = currentCount >= targetCount;
    const progress = Math.min(100, Math.floor((currentCount / targetCount) * 100));
    return { currentCount, targetCount, completed, progress };
  }

  // 3. 累积型任务，查询集合统计数量
  let where = config.query(userId);
  if (config.dailyWindowByTaskType && Number(task?.type) === 0) {
    const { start, end } = getDailyTaskRefreshWindow();
    where = _.and([
      where,
      { createTime: _.gte(start).and(_.lt(end)) }
    ]);
  }

  const countRes = await db.collection(config.collection).where(where).count();
  const currentCount = countRes.total;
  const targetCount = config.target || resolveTaskTargetCount(task, 1);
  const completed = currentCount >= targetCount;
  const progress = Math.min(100, Math.floor((currentCount / targetCount) * 100));

  return { currentCount, targetCount, completed, progress };
}

function now() { return new Date(); }
function startOfToday() { const d = new Date(); d.setHours(0,0,0,0); return d; }
function endOfToday() { const d = new Date(); d.setHours(23,59,59,999); return d; }

const DAILY_TASK_REFRESH_HOUR = 2;

function getDailyTaskRefreshWindow(reference = now()) {
  const base = new Date(reference);
  const start = new Date(base);
  start.setHours(DAILY_TASK_REFRESH_HOUR, 0, 0, 0);

  // 凌晨 2 点前仍属于上一任务日
  if (base < start) {
    start.setDate(start.getDate() - 1);
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function isRecordInDailyTaskWindow(record = {}, reference = now()) {
  if (!record.createTime) return false;
  const createTime = new Date(record.createTime);
  const { start, end } = getDailyTaskRefreshWindow(reference);
  return createTime >= start && createTime < end;
}


function dateDiffInDays(older, newer) {
  const a = new Date(older);
  const b = new Date(newer);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

async function updateUserLoginStats(user = {}) {
  const today = startOfToday();
  const lastAuth = user.lastAuthTime ? new Date(user.lastAuthTime) : null;

  let totalLoginDays = Number(user.totalLoginDays || 0);
  let continuousLoginDays = Number(user.continuousLoginDays || 0);

  // 首次初始化（兼容历史用户）
  if (!lastAuth) {
    totalLoginDays = Math.max(totalLoginDays, 1);
    continuousLoginDays = Math.max(continuousLoginDays, 1);
  } else {
    const diffDays = dateDiffInDays(lastAuth, today);
    if (diffDays >= 1) {
      totalLoginDays += 1;
      continuousLoginDays = diffDays === 1 ? (continuousLoginDays + 1) : 1;
    }
  }

  const patch = {
    lastAuthTime: now(),
    totalLoginDays,
    continuousLoginDays
  };

  await db.collection(COL.USER).doc(user._id).update({ data: patch });
  return { ...user, ...patch };
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function unwrapNestedDataRecord(record = {}) {
  if (record && isPlainObject(record.data)) {
    return {
      ...record.data,
      _id: firstDefined(record.data._id, record._id),
      id: firstDefined(record.data.id, record.id)
    };
  }
  return record;
}

function uniqueValues(values = []) {
  return [...new Set(values.filter(v => v !== undefined && v !== null && v !== ''))];
}

function resolveTaskTargetCount(task = {}, fallback = 1) {
  const candidate = firstDefined(
    task.targetCount,
    task.target_count,
    task.taskTarget,
    task.task_target,
    task.conditionCount,
    task.condition_count,
    task.taskNum,
    task.task_num,
    task.target,
    task.count,
    task.num,
    fallback
  );
  const normalized = Number(candidate);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback;
}

function normalizeInviteText(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text || fallback;
}

function buildInviteCodeFromUserId(userId = '') {
  const normalized = normalizeInviteText(userId, '').replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  if (!normalized) {
    return 'DYSHARE';
  }

  return `DY${normalized.slice(-6).padStart(6, '0')}`;
}

function normalizeInvitePayload(payload = {}) {
  return {
    inviteCode: normalizeInviteText(payload.inviteCode, '').toUpperCase(),
    inviterUid: normalizeInviteText(payload.inviterUid, ''),
    inviterName: normalizeInviteText(payload.inviterName, '')
  };
}

function canBindInviteForUser(user = {}) {
  const totalLoginDays = Number(user.totalLoginDays || 0);
  return totalLoginDays <= INVITE_BIND_LOGIN_DAY_LIMIT;
}

function normalizeIdentifierValues(values = []) {
  const variants = [];
  values.forEach(value => {
    if (value === undefined || value === null || value === '') return;
    variants.push(value);

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed && trimmed !== value) variants.push(trimmed);
      const asNumber = Number(trimmed);
      if (!Number.isNaN(asNumber) && String(asNumber) === trimmed) variants.push(asNumber);
    }

    variants.push(String(value));
  });
  return uniqueValues(variants);
}

function normalizeUserTagRecord(userTag = {}) {
  return {
    ...userTag,
    id: userTag._id,
    userId: firstDefined(userTag.userId, userTag.user_id, userTag.userID),
    tagId: firstDefined(userTag.tagId, userTag.tag_id),
    isUse: Number(firstDefined(userTag.isUse, userTag.is_use, 0)) || 0,
    isValid: Number(firstDefined(userTag.isValid, userTag.is_valid, 1)) || 0
  };
}

function normalizeTagRecord(tag = {}) {
  return {
    ...tag,
    id: tag._id,
    rarityLevel: Number(firstDefined(tag.rarityLevel, tag.rarity_level, 1)) || 1
  };
}

async function getUserTagsByUserIdentifiers(userIdentifiers = []) {
  const ids = normalizeIdentifierValues(userIdentifiers);
  if (!ids.length) return [];

  const queries = [
    db.collection(COL.USER_TAG).where({ userId: _.in(ids) }).get(),
    db.collection(COL.USER_TAG).where({ user_id: _.in(ids) }).get(),
    db.collection(COL.USER_TAG).where({ userID: _.in(ids) }).get()
  ];

  const results = await Promise.all(queries.map(query => query.catch(() => ({ data: [] }))));
  const map = new Map();
  results.forEach(res => {
    (res.data || []).forEach(item => {
      if (item && item._id) map.set(item._id, normalizeUserTagRecord(item));
    });
  });

  console.log('[miniApi] getUserTagsByUserIdentifiers identifiers:', ids, 'resolved:', map.size);

  return [...map.values()];
}

async function getInviteRelationByInviteeUserId(inviteeUserId) {
  const res = await db.collection(COL.USER_INVITE)
    .where({ inviteeUserId })
    .limit(1)
    .get()
    .catch(() => ({ data: [] }));
  return res.data && res.data.length ? res.data[0] : null;
}

async function getUserByInviteIdentifier(identifier) {
  const normalized = normalizeInviteText(identifier, '');
  if (!normalized) {
    return null;
  }

  const byDocId = await db.collection(COL.USER).doc(normalized).get().catch(() => null);
  if (byDocId && byDocId.data && byDocId.data.status === 0) {
    return byDocId.data;
  }

  const byOpenId = await db.collection(COL.USER)
    .where({ openId: normalized, status: 0 })
    .limit(1)
    .get()
    .catch(() => ({ data: [] }));
  if (byOpenId.data && byOpenId.data.length) {
    return byOpenId.data[0];
  }

  return null;
}

async function ensureUserInviteCode(user = {}) {
  if (!user || !user._id) {
    return user;
  }

  const inviteCode = normalizeInviteText(user.inviteCode, buildInviteCodeFromUserId(user._id));
  const patch = {};

  if (inviteCode !== user.inviteCode) {
    patch.inviteCode = inviteCode;
  }
  if (user.inviteSuccessCount === undefined) {
    patch.inviteSuccessCount = 0;
  }
  if (user.inviteRewardPoints === undefined) {
    patch.inviteRewardPoints = 0;
  }
  if (user.inviteRewardCount === undefined) {
    patch.inviteRewardCount = 0;
  }

  if (Object.keys(patch).length) {
    patch.updateTime = now();
    await db.collection(COL.USER).doc(user._id).update({ data: patch }).catch(() => null);
  }

  return {
    ...user,
    ...patch,
    inviteCode
  };
}

async function resolveInviterByInvitePayload(payload = {}) {
  const normalizedPayload = normalizeInvitePayload(payload);
  let inviterByUid = null;
  let inviterByCode = null;

  if (normalizedPayload.inviterUid) {
    inviterByUid = await getUserByInviteIdentifier(normalizedPayload.inviterUid);
  }

  if (normalizedPayload.inviteCode) {
    const res = await db.collection(COL.USER)
      .where({
        inviteCode: normalizedPayload.inviteCode,
        status: 0
      })
      .limit(1)
      .get()
      .catch(() => ({ data: [] }));
    inviterByCode = res.data && res.data.length ? res.data[0] : null;
  }

  if (inviterByUid && inviterByCode && String(inviterByUid._id) !== String(inviterByCode._id)) {
    return null;
  }

  return inviterByUid || inviterByCode || null;
}

async function countInviterRewardedToday(inviterUserId) {
  const { start, end } = getDailyTaskRefreshWindow();
  const res = await db.collection(COL.USER_INVITE)
    .where({
      inviterUserId,
      rewardStatus: 'granted',
      rewardTime: _.gte(start).and(_.lt(end))
    })
    .count()
    .catch(() => ({ total: 0 }));
  return Number(res.total || 0);
}

async function bindInviteForUser(user = {}, payload = {}, options = {}) {
  const normalizedPayload = normalizeInvitePayload(payload);
  const allowExistingUser = options.allowExistingUser === true;

  if (!normalizedPayload.inviteCode && !normalizedPayload.inviterUid) {
    return { bound: false, reason: 'empty_payload' };
  }

  const loginUser = await ensureUserInviteCode(user);
  if (!loginUser || !loginUser._id) {
    return { bound: false, reason: 'missing_user' };
  }

  if (loginUser.invitedByUserId) {
    return {
      bound: false,
      reason: 'already_bound',
      inviterUserId: loginUser.invitedByUserId
    };
  }

  const existingRelation = await getInviteRelationByInviteeUserId(loginUser._id);
  if (existingRelation) {
    return {
      bound: false,
      reason: 'already_bound',
      inviterUserId: existingRelation.inviterUserId
    };
  }

  if (!allowExistingUser && !canBindInviteForUser(loginUser)) {
    return { bound: false, reason: 'not_new_user' };
  }

  const inviterCandidate = await resolveInviterByInvitePayload(normalizedPayload);
  if (!inviterCandidate || !inviterCandidate._id) {
    return { bound: false, reason: 'inviter_not_found' };
  }

  const inviter = await ensureUserInviteCode(inviterCandidate);
  if (String(inviter._id) === String(loginUser._id)) {
    return { bound: false, reason: 'self_invite' };
  }

  if (normalizedPayload.inviteCode && inviter.inviteCode !== normalizedPayload.inviteCode) {
    return { bound: false, reason: 'invite_code_mismatch' };
  }

  const rewardedToday = await countInviterRewardedToday(inviter._id);
  const inviterPoints = rewardedToday >= INVITE_DAILY_REWARD_LIMIT ? 0 : INVITE_REWARD_POINTS;
  const inviteePoints = INVITEE_REWARD_POINTS;
  const rewardStatus = inviterPoints > 0 ? 'granted' : 'capped';
  const relation = {
    inviterUserId: inviter._id,
    inviterOpenId: inviter.openId || '',
    inviterName: normalizeInviteText(inviter.nickName, normalizedPayload.inviterName || ''),
    inviteeUserId: loginUser._id,
    inviteeOpenId: loginUser.openId || '',
    inviteeName: normalizeInviteText(loginUser.nickName, ''),
    inviteCode: inviter.inviteCode,
    status: 'bound',
    rewardStatus,
    inviterRewardPoints: inviterPoints,
    inviteeRewardPoints: inviteePoints,
    bindSource: 'login',
    bindTime: now(),
    rewardTime: inviterPoints > 0 || inviteePoints > 0 ? now() : null,
    createTime: now(),
    updateTime: now()
  };

  const addRes = await db.collection(COL.USER_INVITE).add({ data: relation });

  await db.collection(COL.USER).doc(loginUser._id).update({
    data: {
      invitedByUserId: inviter._id,
      inviteCodeUsed: inviter.inviteCode,
      inviteBoundAt: now(),
      updateTime: now(),
      ...(inviteePoints > 0
        ? {
            points: _.inc(inviteePoints),
            inviteeRewardPoints: _.inc(inviteePoints),
            lastPointsTime: now()
          }
        : {})
    }
  });

  const inviterPatch = {
    inviteSuccessCount: _.inc(1),
    updateTime: now()
  };

  if (inviterPoints > 0) {
    inviterPatch.points = _.inc(inviterPoints);
    inviterPatch.inviteRewardPoints = _.inc(inviterPoints);
    inviterPatch.inviteRewardCount = _.inc(1);
    inviterPatch.lastPointsTime = now();
  }

  await db.collection(COL.USER).doc(inviter._id).update({ data: inviterPatch });

  await checkAndAddRecord(inviter.openId, ACTION.INVITE_MASTER).catch(() => null);

  return {
    bound: true,
    relationId: addRes._id,
    inviterUserId: inviter._id,
    inviteCode: inviter.inviteCode,
    rewardStatus,
    inviterRewardPoints: inviterPoints,
    inviteeRewardPoints: inviteePoints
  };
}

async function getTagsByAnyIds(tagIds = []) {
  const ids = normalizeIdentifierValues(tagIds);
  if (!ids.length) return [];

  const cmd = db.command;
  const map = new Map();

  const byDocId = await db.collection(COL.TAG).where({ _id: cmd.in(ids) }).get().catch(() => ({ data: [] }));
  (byDocId.data || []).forEach(tag => map.set(tag._id, tag));

  const missing = ids.filter(id => ![...map.values()].some(tag => String(tag._id) === String(id) || String(tag.id) === String(id)));
  if (missing.length) {
    const byLegacyId = await db.collection(COL.TAG).where({ id: cmd.in(missing) }).get().catch(() => ({ data: [] }));
    (byLegacyId.data || []).forEach(tag => map.set(tag._id, tag));
  }

  // 终极兜底：如果还有 ID 未匹配，且看起来像是精度丢失的数字（19位，末尾00），尝试全量拉取 Tag 进行模糊匹配
  // 这种场景通常发生在 bz_points_goods 等表存了 Number 类型的 tagId，导致读取时精度丢失
  const stillMissing = ids.filter(id => ![...map.values()].some(tag => String(tag._id) === String(id) || String(tag.id) === String(id)));
  if (stillMissing.length) {
    console.log('[miniApi] getTagsByAnyIds still has missing ids, trying lossy recovery:', stillMissing);
    try {
      // 假设 Tag 总数不多，取前 1000 个进行内存匹配
      const allTags = await db.collection(COL.TAG).limit(1000).get();
      allTags.data.forEach(tag => {
        if (tag.id) {
          // 将 tag.id 转为数字（模拟精度丢失），看是否与 missing id 匹配
          const tagNum = Number(tag.id);
          const tagNumStr = String(tagNum);
          
          stillMissing.forEach(missingId => {
            // 如果 missingId 本身就是精度丢失后的字符串（如 "195...00"），或者就是那个数字
            if (String(missingId) === tagNumStr) {
              console.log(`[miniApi] recovered tag ${tag._id} from lossy id ${missingId}`);
              map.set(tag._id, tag);
            }
          });
        }
      });
    } catch (e) {
      console.error('[miniApi] lossy recovery failed:', e);
    }
  }

  return [...map.values()].map(normalizeTagRecord);
}

function isBehaviorTagSubType(subType) {
  return ['achievement', 'milestone', 'record', 'tracker', 'habit'].includes(normalizeString(subType, '') || '');
}

function isOfficialTagSubType(subType) {
  return ['honor', 'founder', 'certification', 'official', 'signed', 'resident'].includes(normalizeString(subType, '') || '');
}

function buildFallbackTagStyleKey(type, rarityLevel, subType = '') {
  const normalizedType = normalizeString(type, TAG_TYPE.FUN) || TAG_TYPE.FUN;
  const normalizedRarity = normalizeNumber(rarityLevel, 1, { min: 1, max: 5, integer: true });
  const normalizedSubType = normalizeString(subType, '') || '';

  if (isOfficialTagSubType(normalizedSubType)) {
    return normalizedRarity >= 4 ? 'official_gold' : 'official_dark';
  }

  if (isBehaviorTagSubType(normalizedSubType)) {
    if (normalizedRarity >= 4) return 'behavior_gold';
    if (normalizedRarity >= 3) return 'behavior_orange';
    if (normalizedRarity >= 2) return 'behavior_blue';
    return 'behavior_slate';
  }

  if (normalizedType === TAG_TYPE.IDENTITY) {
    if (normalizedRarity >= 4) return 'identity_gold';
    if (normalizedRarity >= 3) return 'identity_orange';
    if (normalizedRarity >= 2) return 'identity_blue';
    return 'identity_slate';
  }

  if (normalizedType === TAG_TYPE.EVENT) {
    if (normalizedRarity >= 4) return 'event_gold';
    if (normalizedRarity >= 3) return 'event_orange';
    return 'event_blue';
  }

  if (normalizedType === TAG_TYPE.OFFICIAL) {
    return normalizedRarity >= 4 ? 'official_gold' : 'official_dark';
  }

  if (normalizedRarity >= 4) return 'fun_gold';
  if (normalizedRarity >= 3) return 'fun_orange';
  if (normalizedRarity >= 2) return 'fun_blue';
  return 'fun_slate';
}

function normalizeTagDefinitionRecord(tag = {}) {
  const source = unwrapNestedDataRecord(tag);
  const type = normalizeString(firstDefined(source.type, source.tag_type), TAG_TYPE.FUN) || TAG_TYPE.FUN;
  const subType = normalizeString(firstDefined(source.subType, source.sub_type), '');
  const rarityLevel = normalizeNumber(firstDefined(source.rarityLevel, source.rarity_level), 1, { min: 1, max: 5, integer: true });
  const credibilityWeight = normalizeNumber(firstDefined(source.credibilityWeight, source.credibility_weight), 0, { min: 0 });
  const normalized = {
    ...source,
    id: firstDefined(source._id, source.id),
    code: normalizeString(source.code, ''),
    name: normalizeString(firstDefined(source.name, source.tagName), ''),
    type,
    subType,
    rarityLevel,
    styleKey: normalizeString(firstDefined(source.styleKey, source.style_key), '') || buildFallbackTagStyleKey(type, rarityLevel, subType),
    iconKey: normalizeString(firstDefined(source.iconKey, source.icon_key), ''),
    sourceType: normalizeString(firstDefined(source.sourceType, source.source_type), 'system') || 'system',
    isRedeemable: normalizeBoolean(firstDefined(source.isRedeemable, source.is_redeemable), false),
    isWearable: normalizeBoolean(firstDefined(source.isWearable, source.is_wearable), true),
    isActive: normalizeBoolean(firstDefined(source.isActive, source.is_active), true),
    displayPriority: normalizeNumber(firstDefined(source.displayPriority, source.display_priority), rarityLevel, { min: 0 }),
    credibilityWeight,
    sceneScope: firstDefined(source.sceneScope, source.scene_scope, null),
    description: normalizeString(source.description, ''),
    createdAt: firstDefined(source.createdAt, source.created_at, source.createTime, source.create_time),
    updatedAt: firstDefined(source.updatedAt, source.updated_at, source.updateTime, source.update_time)
  };

  normalized.isAuthoritative = credibilityWeight > 0 || type === TAG_TYPE.OFFICIAL || isOfficialTagSubType(subType);
  return normalized;
}

function normalizeOwnedTagStatus(value) {
  const normalized = normalizeString(value, '');
  if (normalized === 'active' || normalized === 'expired' || normalized === 'revoked') {
    return normalized;
  }
  return 'active';
}

function normalizeUserOwnedTagRecord(userTag = {}, source = 'new') {
  const isLegacy = source === 'legacy';
  const isValid = Number(firstDefined(userTag.isValid, userTag.is_valid, 1)) || 0;
  const isUse = Number(firstDefined(userTag.isUse, userTag.is_use, 0)) || 0;
  return {
    ...userTag,
    id: firstDefined(userTag._id, userTag.id),
    userId: firstDefined(userTag.userId, userTag.user_id, userTag.userID),
    tagId: firstDefined(userTag.tagId, userTag.tag_id),
    obtainMethod: normalizeString(firstDefined(userTag.obtainMethod, userTag.obtain_method), isLegacy ? 'legacy' : 'system') || 'system',
    obtainSourceId: firstDefined(userTag.obtainSourceId, userTag.obtain_source_id, null),
    status: isLegacy ? (isValid === 1 ? 'active' : 'revoked') : normalizeOwnedTagStatus(firstDefined(userTag.status, 'active')),
    obtainedAt: firstDefined(userTag.obtainedAt, userTag.obtained_at, userTag.getTime, userTag.createTime, userTag.created_at),
    expiresAt: firstDefined(userTag.expiresAt, userTag.expires_at, null),
    createdAt: firstDefined(userTag.createdAt, userTag.created_at, userTag.createTime),
    updatedAt: firstDefined(userTag.updatedAt, userTag.updated_at, userTag.updateTime),
    isEquipped: isLegacy ? isUse === 1 : normalizeBoolean(firstDefined(userTag.isEquipped, userTag.is_equipped), false),
    isLegacy
  };
}

function normalizeTagDisplaySettingsRecord(settings = {}) {
  const displayStrategy = normalizeTagDisplayStrategy(firstDefined(settings.displayStrategy, settings.display_strategy), TAG_DISPLAY_STRATEGY.SMART);
  const mainTagId = firstDefined(settings.mainTagId, settings.main_tag_id, settings.equippedTagId, settings.equipped_tag_id, null);
  const postTagMode = normalizePostTagMode(
    firstDefined(settings.postTagMode, settings.post_tag_mode),
    displayStrategy === TAG_DISPLAY_STRATEGY.FIXED ? POST_TAG_MODE.MAIN : POST_TAG_MODE.SMART
  );
  const customPostTags = normalizeCustomPostTags(firstDefined(settings.customPostTags, settings.custom_post_tags, null));
  return {
    ...settings,
    id: firstDefined(settings._id, settings.id),
    userId: firstDefined(settings.userId, settings.user_id),
    mainTagId,
    equippedTagId: mainTagId,
    displayStrategy,
    postTagMode,
    customPostTags,
    preferIdentityInReview: normalizeBoolean(firstDefined(settings.preferIdentityInReview, settings.prefer_identity_in_review), true),
    preferFunInCatch: normalizeBoolean(firstDefined(settings.preferFunInCatch, settings.prefer_fun_in_catch), true),
    updatedAt: firstDefined(settings.updatedAt, settings.updated_at, settings.updateTime)
  };
}

function normalizeTagDisplayStrategy(value, fallback = TAG_DISPLAY_STRATEGY.SMART) {
  const normalized = normalizeString(value, fallback);
  return normalized === TAG_DISPLAY_STRATEGY.FIXED ? TAG_DISPLAY_STRATEGY.FIXED : TAG_DISPLAY_STRATEGY.SMART;
}

function normalizePostTagMode(value, fallback = POST_TAG_MODE.SMART) {
  const normalized = normalizeString(value, fallback);
  if ([POST_TAG_MODE.MAIN, POST_TAG_MODE.SMART, POST_TAG_MODE.CUSTOM, POST_TAG_MODE.HIDDEN].includes(normalized)) {
    return normalized;
  }
  return fallback;
}

function normalizeCustomTagRef(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = normalizeString(value, null, { trim: true });
  if (!normalized) return null;
  if ([CUSTOM_TAG_REF.MAIN, CUSTOM_TAG_REF.SMART, CUSTOM_TAG_REF.HIDDEN].includes(normalized)) {
    return normalized;
  }
  return String(normalized);
}

function normalizeCustomPostTags(value) {
  const source = isPlainObject(value) ? value : {};
  const result = {};
  ['recommend', 'experience', 'question', 'catch', 'trip'].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = normalizeCustomTagRef(source[key]);
    }
  });
  return result;
}

function getTagDisplayCategory(tag = {}) {
  const type = normalizeString(tag.type, TAG_TYPE.FUN) || TAG_TYPE.FUN;
  const subType = normalizeString(tag.subType, '');

  if (type === TAG_TYPE.OFFICIAL || isOfficialTagSubType(subType)) return TAG_DISPLAY_CATEGORY.OFFICIAL;
  if (type === TAG_TYPE.IDENTITY) return TAG_DISPLAY_CATEGORY.IDENTITY;
  if (type === TAG_TYPE.EVENT || isBehaviorTagSubType(subType)) return TAG_DISPLAY_CATEGORY.BEHAVIOR;
  return TAG_DISPLAY_CATEGORY.FUN;
}

function getTagDisplayCategoryMeta(category) {
  return TAG_DISPLAY_CATEGORY_META[category] || TAG_DISPLAY_CATEGORY_META[TAG_DISPLAY_CATEGORY.FUN];
}

function getTagSourceLabel(tag = {}) {
  const obtainMethod = normalizeString(firstDefined(tag.obtainMethod, tag.obtain_method), '');
  const sourceType = normalizeString(firstDefined(tag.sourceType, tag.source_type), '');

  if (['redeem', 'exchange', 'shop', 'legacy'].includes(obtainMethod) || sourceType === 'shop') return '积分兑换';
  if (['event', 'activity', 'campaign'].includes(obtainMethod) || sourceType === 'event') return '活动获得';
  if (['official', 'staff'].includes(obtainMethod) || sourceType === 'official') return '官方发放';
  return '系统授予';
}

function getTagRarityLabel(rarityLevel) {
  const level = normalizeNumber(rarityLevel, 1, { min: 1, max: 5, integer: true });
  return `R${level}`;
}

function createDisplayTagPayload(tag = {}, extra = {}) {
  if (!tag || !normalizeString(tag.name, '')) {
    return null;
  }

  const type = normalizeString(tag.type, TAG_TYPE.FUN) || TAG_TYPE.FUN;
  const subType = normalizeString(tag.subType, '');
  const displayCategory = getTagDisplayCategory(tag);
  const displayCategoryMeta = getTagDisplayCategoryMeta(displayCategory);

  return {
    id: firstDefined(tag.id, tag._id),
    code: normalizeString(tag.code, ''),
    name: normalizeString(tag.name, ''),
    type,
    subType,
    rarityLevel: normalizeNumber(tag.rarityLevel, 1, { min: 1, max: 5, integer: true }),
    styleKey: normalizeString(tag.styleKey, '') || buildFallbackTagStyleKey(type, tag.rarityLevel, subType),
    iconKey: normalizeString(tag.iconKey, ''),
    isAuthoritative: Boolean(tag.isAuthoritative || normalizeNumber(tag.credibilityWeight, 0, { min: 0 }) > 0 || type === TAG_TYPE.OFFICIAL || isOfficialTagSubType(subType)),
    credibilityWeight: normalizeNumber(tag.credibilityWeight, 0, { min: 0 }),
    displayCategory,
    displayCategoryLabel: displayCategoryMeta.label,
    displayLabel: displayCategoryMeta.displayLabel,
    rarityLabel: getTagRarityLabel(tag.rarityLevel),
    sourceLabel: getTagSourceLabel(tag),
    isMainTag: Boolean(extra.isMainTag),
    isEquipped: Boolean(extra.isEquipped || extra.isMainTag)
  };
}

function isOwnedTagActive(userTag = {}) {
  if (!userTag || userTag.status !== 'active') return false;
  if (!userTag.expiresAt) return true;
  const expiresAt = new Date(userTag.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) return true;
  return expiresAt.getTime() > Date.now();
}

function sortTagCandidates(tags = []) {
  return [...tags].sort((a, b) => {
    const priorityDiff = normalizeNumber(b.displayPriority, 0) - normalizeNumber(a.displayPriority, 0);
    if (priorityDiff !== 0) return priorityDiff;

    const credibilityDiff = normalizeNumber(b.credibilityWeight, 0) - normalizeNumber(a.credibilityWeight, 0);
    if (credibilityDiff !== 0) return credibilityDiff;

    const rarityDiff = normalizeNumber(b.rarityLevel, 0) - normalizeNumber(a.rarityLevel, 0);
    if (rarityDiff !== 0) return rarityDiff;

    const timeA = new Date(firstDefined(a.obtainedAt, a.createdAt, a.updatedAt, 0)).getTime() || 0;
    const timeB = new Date(firstDefined(b.obtainedAt, b.createdAt, b.updatedAt, 0)).getTime() || 0;
    return timeB - timeA;
  });
}

async function getLegacyUserTagsByUserIdentifiers(userIdentifiers = []) {
  const ids = normalizeIdentifierValues(userIdentifiers);
  if (!ids.length) return [];

  const queries = [
    db.collection(COL.USER_TAG).where({ userId: _.in(ids) }).get(),
    db.collection(COL.USER_TAG).where({ user_id: _.in(ids) }).get(),
    db.collection(COL.USER_TAG).where({ userID: _.in(ids) }).get()
  ];

  const results = await Promise.all(queries.map(query => query.catch(() => ({ data: [] }))));
  const map = new Map();
  results.forEach(res => {
    (res.data || []).forEach(item => {
      if (item && item._id) {
        map.set(item._id, normalizeUserOwnedTagRecord(normalizeUserTagRecord(item), 'legacy'));
      }
    });
  });

  return [...map.values()];
}

async function getUserOwnedTagsByUserIdentifiers(userIdentifiers = []) {
  const ids = normalizeIdentifierValues(userIdentifiers);
  if (!ids.length) return [];

  const queries = [
    db.collection(COL.USER_TAGS).where({ user_id: _.in(ids) }).get(),
    db.collection(COL.USER_TAGS).where({ userId: _.in(ids) }).get()
  ];

  const results = await Promise.all(queries.map(query => query.catch(() => ({ data: [] }))));
  const map = new Map();
  results.forEach(res => {
    (res.data || []).forEach(item => {
      if (item && item._id) map.set(item._id, normalizeUserOwnedTagRecord(item));
    });
  });

  if (!map.size) {
    const legacy = await getLegacyUserTagsByUserIdentifiers(ids);
    legacy.forEach(item => {
      if (item && item.id) map.set(`legacy:${item.id}`, item);
    });
  }

  return [...map.values()];
}

async function getTagDefinitionsByAnyIds(tagIds = []) {
  const ids = normalizeIdentifierValues(tagIds);
  if (!ids.length) return [];

  const cmd = db.command;
  const map = new Map();

  const byDocId = await db.collection(COL.TAG_DEFINITION).where({ _id: cmd.in(ids) }).get().catch(() => ({ data: [] }));
  (byDocId.data || []).forEach(tag => {
    if (tag && tag._id) map.set(String(tag._id), normalizeTagDefinitionRecord(tag));
  });

  const missing = ids.filter(id => !map.has(String(id)));
  if (missing.length) {
    const byCode = await db.collection(COL.TAG_DEFINITION).where({ code: cmd.in(missing.map(String)) }).get().catch(() => ({ data: [] }));
    (byCode.data || []).forEach(tag => {
      if (tag && tag._id) map.set(String(tag._id), normalizeTagDefinitionRecord(tag));
    });
  }

  const stillMissing = ids.filter(id => ![...map.values()].some(tag => String(tag.id) === String(id) || String(tag.code) === String(id)));
  if (stillMissing.length) {
    const legacyTags = await getTagsByAnyIds(stillMissing);
    legacyTags.forEach(tag => {
      if (tag && tag.id) {
        map.set(String(tag.id), normalizeTagDefinitionRecord(tag));
      }
    });
  }

  return [...map.values()];
}

async function getUserTagDisplaySettingsByUserIdentifiers(userIdentifiers = []) {
  const ids = normalizeIdentifierValues(userIdentifiers);
  if (!ids.length) return normalizeTagDisplaySettingsRecord({});

  const queries = [
    db.collection(COL.USER_TAG_DISPLAY).where({ user_id: _.in(ids) }).limit(1).get(),
    db.collection(COL.USER_TAG_DISPLAY).where({ userId: _.in(ids) }).limit(1).get()
  ];

  const results = await Promise.all(queries.map(query => query.catch(() => ({ data: [] }))));
  const found = results.find(res => Array.isArray(res.data) && res.data.length > 0);
  if (found) {
    return normalizeTagDisplaySettingsRecord(found.data[0]);
  }

  const legacyOwnedTags = await getLegacyUserTagsByUserIdentifiers(ids);
  const equippedLegacyTag = legacyOwnedTags.find(item => item.isEquipped);
  return normalizeTagDisplaySettingsRecord({
    user_id: ids[0],
    main_tag_id: equippedLegacyTag ? String(equippedLegacyTag.tagId) : null
  });
}

function mergeOwnedTagsWithDefinitions(ownedTags = [], definitions = [], settings = {}) {
  const definitionMap = new Map();
  definitions.forEach(tag => {
    if (!tag) return;
    if (tag.id) definitionMap.set(String(tag.id), tag);
    if (tag.code) definitionMap.set(String(tag.code), tag);
  });

  const mainTagId = settings.mainTagId ? String(settings.mainTagId) : '';

  return ownedTags
    .filter(isOwnedTagActive)
    .map(ownedTag => {
      const definition = definitionMap.get(String(ownedTag.tagId));
      if (!definition || !definition.isActive || !definition.isWearable) {
        return null;
      }

      const isMainTag = mainTagId
        ? String(definition.id) === mainTagId || String(definition.code) === mainTagId
        : Boolean(ownedTag.isEquipped);
      const displayCategory = getTagDisplayCategory(definition);
      const displayCategoryMeta = getTagDisplayCategoryMeta(displayCategory);

      return {
        ...definition,
        userTagId: ownedTag.id,
        tagId: definition.id,
        obtainMethod: ownedTag.obtainMethod,
        obtainSourceId: ownedTag.obtainSourceId,
        status: ownedTag.status,
        obtainedAt: ownedTag.obtainedAt,
        expiresAt: ownedTag.expiresAt,
        isMainTag,
        isEquipped: isMainTag,
        displayCategory,
        displayCategoryLabel: displayCategoryMeta.label,
        displayLabel: displayCategoryMeta.displayLabel,
        displayCategoryDescription: displayCategoryMeta.description,
        sourceLabel: getTagSourceLabel({ ...definition, ...ownedTag }),
        rarityLabel: getTagRarityLabel(definition.rarityLevel),
        displayTag: createDisplayTagPayload({ ...definition, ...ownedTag }, { isMainTag })
      };
    })
    .filter(Boolean);
}

function getTagPriorityForTopic(topicCategory, settings = {}) {
  if (normalizeTagDisplayStrategy(settings.displayStrategy, TAG_DISPLAY_STRATEGY.SMART) === TAG_DISPLAY_STRATEGY.FIXED) {
    return ['equipped', 'official', 'identity', 'behavior', 'fun'];
  }

  const defaultPriority = ['equipped', 'identity', 'behavior', 'fun', 'official'];
  const priority = TAG_PRIORITY_BY_TOPIC[Number(topicCategory)] || defaultPriority;
  return priority;
}

function resolveSmartDisplayTagForTopic(tagItems = [], topicCategory) {
  if (!Array.isArray(tagItems) || !tagItems.length) return null;

  const buckets = {
    [TAG_DISPLAY_CATEGORY.OFFICIAL]: sortTagCandidates(tagItems.filter(item => item.displayCategory === TAG_DISPLAY_CATEGORY.OFFICIAL)),
    [TAG_DISPLAY_CATEGORY.IDENTITY]: sortTagCandidates(tagItems.filter(item => item.displayCategory === TAG_DISPLAY_CATEGORY.IDENTITY)),
    [TAG_DISPLAY_CATEGORY.BEHAVIOR]: sortTagCandidates(tagItems.filter(item => item.displayCategory === TAG_DISPLAY_CATEGORY.BEHAVIOR)),
    [TAG_DISPLAY_CATEGORY.FUN]: sortTagCandidates(tagItems.filter(item => item.displayCategory === TAG_DISPLAY_CATEGORY.FUN))
  };

  const priority = TAG_PRIORITY_BY_TOPIC[Number(topicCategory)] || ['identity', 'behavior', 'fun', 'official'];
  for (const token of priority) {
    const candidate = buckets[token] && buckets[token][0];
    if (candidate) {
      return createDisplayTagPayload(candidate, { isMainTag: Boolean(candidate.isMainTag) });
    }
  }

  return null;
}

function resolveDisplayTagForTopic(tagItems = [], topicCategory, settings = {}) {
  if (!Array.isArray(tagItems) || !tagItems.length) return null;

  const mainTag = tagItems.find(item => item.isMainTag) || null;
  const mainTagPayload = mainTag ? createDisplayTagPayload(mainTag, { isMainTag: true }) : null;
  const postTagMode = normalizePostTagMode(settings.postTagMode, POST_TAG_MODE.SMART);
  const smartTagPayload = resolveSmartDisplayTagForTopic(tagItems, topicCategory);

  if (postTagMode === POST_TAG_MODE.MAIN) {
    return mainTagPayload;
  }

  if (postTagMode === POST_TAG_MODE.SMART) {
    return smartTagPayload || mainTagPayload;
  }

  if (postTagMode === POST_TAG_MODE.HIDDEN) {
    return null;
  }

  const topicKey = TOPIC_KEY_BY_CATEGORY[Number(topicCategory)];
  const hasCustomRef = Boolean(topicKey)
    && isPlainObject(settings.customPostTags)
    && Object.prototype.hasOwnProperty.call(settings.customPostTags, topicKey);
  const customRef = topicKey ? normalizeCustomTagRef(settings.customPostTags && settings.customPostTags[topicKey]) : null;

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

  const matchedTag = tagItems.find(item => String(item.tagId) === String(customRef) || String(item.code) === String(customRef));
  if (!matchedTag) {
    return mainTagPayload;
  }
  return createDisplayTagPayload(matchedTag, { isMainTag: Boolean(matchedTag.isMainTag) });
}

function buildGroupedTagSummary(tagItems = []) {
  const groups = Object.values(TAG_DISPLAY_CATEGORY).map((category) => {
    const meta = getTagDisplayCategoryMeta(category);
    const tags = sortTagCandidates(tagItems.filter(item => item.displayCategory === category))
      .map(tag => ({
        ...tag,
        displayTag: createDisplayTagPayload(tag, { isEquipped: tag.isEquipped })
      }));

    return {
      key: meta.key,
      label: meta.label,
      displayLabel: meta.displayLabel,
      description: meta.description,
      count: tags.length,
      tags
    };
  });

  return [
    {
      key: 'all',
      label: '全部',
      displayLabel: '全部标签',
      description: '按展示方式整理你的全部标签',
      count: tagItems.length,
      tags: sortTagCandidates(tagItems).map(tag => ({
        ...tag,
        displayTag: createDisplayTagPayload(tag, { isEquipped: tag.isEquipped })
      }))
    },
    ...groups
  ];
}

function buildPreviewByPostType(tagItems = [], settings = {}) {
  return TAG_PREVIEW_TOPIC_ITEMS.map((item) => {
    const displayTag = resolveDisplayTagForTopic(tagItems, item.topicCategory, settings);
    return {
      ...item,
      displayTag,
      tagName: displayTag ? displayTag.name : '',
      categoryLabel: displayTag ? displayTag.displayLabel : ''
    };
  });
}

async function getUserTagProfileByUserIdentifiers(userIdentifiers = []) {
  const ids = normalizeIdentifierValues(userIdentifiers);
  if (!ids.length) {
    return {
      settings: normalizeTagDisplaySettingsRecord({}),
      mainTag: null,
      equippedTag: null,
      ownedTags: [],
      groupedTags: [],
      previewByPostType: [],
      displayTagByTopic: () => null
    };
  }

  const [ownedTags, settings] = await Promise.all([
    getUserOwnedTagsByUserIdentifiers(ids),
    getUserTagDisplaySettingsByUserIdentifiers(ids)
  ]);
  const definitions = await getTagDefinitionsByAnyIds(ownedTags.map(item => item.tagId));
  const mergedTags = mergeOwnedTagsWithDefinitions(ownedTags, definitions, settings);
  const mainTag = mergedTags.find(item => item.isMainTag) || null;
  const mainTagPayload = mainTag ? createDisplayTagPayload(mainTag, { isMainTag: true }) : null;

  return {
    settings,
    mainTag: mainTagPayload,
    equippedTag: mainTagPayload,
    ownedTags: sortTagCandidates(mergedTags),
    groupedTags: buildGroupedTagSummary(mergedTags),
    previewByPostType: buildPreviewByPostType(mergedTags, settings),
    displayTagByTopic(topicCategory) {
      return resolveDisplayTagForTopic(mergedTags, topicCategory, settings);
    }
  };
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function normalizeString(value, fallback = null, { trim = true } = {}) {
  if (typeof value !== 'string') return fallback;
  const normalized = trim ? value.trim() : value;
  return normalized === '' ? fallback : normalized;
}

function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return fallback;
}

function normalizeStringArray(value, { unique = true, maxItems = null } = {}) {
  if (!Array.isArray(value)) return [];
  const list = value
    .map(item => normalizeString(item, null))
    .filter(Boolean);
  const normalized = unique ? uniqueValues(list) : list;
  return typeof maxItems === 'number' ? normalized.slice(0, maxItems) : normalized;
}

function normalizeImages(value) {
  return normalizeStringArray(value, { maxItems: 9 });
}

function normalizeSingleTagValue(value) {
  if (typeof value === 'string') return normalizeString(value, null);
  if (Array.isArray(value)) return normalizeString(value[0], null);
  return null;
}

function normalizeRatingItem(item = {}) {
  if (!isPlainObject(item)) return null;
  const key = normalizeString(item.key, null);
  const name = normalizeString(item.name, null);
  const score = Number(item.score);
  if (!key && !name) return null;
  return {
    key: key || name,
    name: name || key,
    score: Number.isFinite(score) ? score : 0
  };
}

function normalizeRatings(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeRatingItem).filter(Boolean);
}

function normalizeNumber(value, fallback = 0, { min = null, max = null, integer = false } = {}) {
  let normalized = Number(value);
  if (!Number.isFinite(normalized)) normalized = Number(fallback);
  if (!Number.isFinite(normalized)) normalized = 0;
  if (typeof min === 'number' && normalized < min) normalized = min;
  if (typeof max === 'number' && normalized > max) normalized = max;
  return integer ? Math.round(normalized) : normalized;
}

function normalizeOptionalNumber(value, { min = null, max = null, integer = false } = {}) {
  if (value === undefined || value === null || value === '') return null;
  return normalizeNumber(value, 0, { min, max, integer });
}

function roundScore(value, precision = 1) {
  const normalized = normalizeNumber(value, 0);
  const factor = 10 ** precision;
  return Math.round(normalized * factor) / factor;
}

function resolveOptionScore(value, rules = []) {
  const text = normalizeString(value, '');
  if (!text) return 0;
  for (const rule of rules) {
    if (rule.values.some(candidate => candidate === text || text.includes(candidate) || candidate.includes(text))) {
      return rule.score;
    }
  }
  return 0;
}

function normalizeSummaryScoreValue(value) {
  const text = normalizeString(value, '');
  if (!text) return '';
  switch (text) {
    case 'strongly_recommend':
      return '强烈推荐';
    case 'recommend':
      return '值得推荐';
    case 'soso':
      return '勉强可用';
    case 'not_recommend':
      return '不推荐';
    default:
      return text;
  }
}

function normalizeRepurchaseScoreValue(value) {
  const text = normalizeString(value, '');
  if (!text) return '';
  switch (text) {
    case 'buy_same':
      return '会继续使用同款';
    case 'buy_upgrade':
      return '会考虑升级同系列';
    case 'try_other':
      return '可能尝试其他品牌';
    case 'never_buy':
      return '不会再买';
    default:
      return text;
  }
}

function calculateAverageRatingScore(ratings = []) {
  const list = Array.isArray(ratings)
    ? ratings
      .map(item => normalizeNumber(item?.score, 0, { min: 1, max: 10 }))
      .filter(score => score > 0)
    : [];
  if (!list.length) return 0;
  return roundScore(list.reduce((acc, score) => acc + score, 0) / list.length, 1);
}

function calculateRecommendationScore(topic = {}) {
  if (normalizeTopicCategory(topic.topicCategory) !== TOPIC_CATEGORY.EXPERIENCE) return 0;
  const summaryScore = resolveOptionScore(normalizeSummaryScoreValue(topic.summary), RECOMMENDATION_SUMMARY_SCORE_RULES);
  const averageRatingScore = calculateAverageRatingScore(topic.ratings);
  const repurchaseScore = resolveOptionScore(normalizeRepurchaseScoreValue(topic.repurchase), REPURCHASE_SCORE_RULES);
  return roundScore(summaryScore * 0.5 + averageRatingScore * 0.3 + repurchaseScore * 0.2, 1);
}

function buildTopicBackendFields(topic = {}, existingTopic = {}) {
  const recommendationScore = calculateRecommendationScore(topic);
  return {
    contentQualityScore: normalizeNumber(firstDefined(existingTopic.contentQualityScore, topic.contentQualityScore), 0, { min: 0 }),
    engagementScore: normalizeNumber(firstDefined(existingTopic.engagementScore, topic.engagementScore), 0, { min: 0 }),
    credibilityScore: normalizeNumber(firstDefined(existingTopic.credibilityScore, topic.credibilityScore), 0, { min: 0 }),
    recommendationScore,
    knowledgeScore: normalizeNumber(firstDefined(existingTopic.knowledgeScore, topic.knowledgeScore), 0, { min: 0 }),
    sampleCount: normalizeNumber(firstDefined(existingTopic.sampleCount, topic.sampleCount), 0, { min: 0, integer: true })
  };
}

function normalizeRecommendTags(tags = {}) {
  const source = isPlainObject(tags) ? tags : {};
  return {
    scene: normalizeStringArray(source.scene, { maxItems: 5 }),
    customScene: normalizeStringArray(source.customScene, { maxItems: 1 }),
    budget: normalizeSingleTagValue(source.budget),
    usage: normalizeStringArray(source.usage, { maxItems: 2 }),
    shareReasons: normalizeStringArray(source.shareReasons, { maxItems: 2 })
  };
}

function normalizeExperienceTags(tags = {}) {
  const source = isPlainObject(tags) ? tags : {};
  return {
    fit: normalizeStringArray(source.fit, { maxItems: 3 }),
    unfit: normalizeStringArray(source.unfit, { maxItems: 3 }),
    pros: normalizeStringArray(source.pros, { maxItems: 3 }),
    cons: normalizeStringArray(source.cons, { maxItems: 3 }),
    budget: normalizeSingleTagValue(source.budget),
    usage: normalizeStringArray(source.usage, { maxItems: 2 }),
    fitContextTags: normalizeStringArray(source.fitContextTags, { maxItems: 3 }),
    fitTechniqueTags: normalizeStringArray(source.fitTechniqueTags, { maxItems: 3 }),
    compareProfile: normalizeStringArray(source.compareProfile),
    compareBuyDecision: normalizeStringArray(source.compareBuyDecision),
    purchaseAdvice: normalizeStringArray(source.purchaseAdvice),
    buyStage: normalizeStringArray(source.buyStage),
    supplementParams: normalizeStringArray(source.supplementParams)
  };
}

function normalizeTopicTagsByCategory(topicCategory, tags) {
  if (topicCategory === TOPIC_CATEGORY.RECOMMEND) return normalizeRecommendTags(tags);
  if (topicCategory === TOPIC_CATEGORY.EXPERIENCE) return normalizeExperienceTags(tags);
  return null;
}

function assertTopicPayload(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeTopicCategory(value) {
  const category = Number(value);
  return Number.isInteger(category) && category >= 0 && category <= 4 ? category : TOPIC_CATEGORY.RECOMMEND;
}

function validateTopicPayload(topic = {}) {
  assertTopicPayload(normalizeString(topic.title, null) !== null, '缺少标题');
  assertTopicPayload(Number.isInteger(topic.topicCategory) && topic.topicCategory >= 0 && topic.topicCategory <= 4, '无效的帖子模式');

  switch (topic.topicCategory) {
    case TOPIC_CATEGORY.RECOMMEND:
      assertTopicPayload(normalizeString(topic.gearCategory, null) !== null, '好物速报缺少 gearCategory');
      assertTopicPayload(normalizeString(topic.usageYear, null) !== null, '好物速报缺少 usageYear');
      assertTopicPayload(normalizeString(topic.usageFrequency, null) !== null, '好物速报缺少 usageFrequency');
      assertTopicPayload(topic.environments.length > 0, '好物速报缺少 environments');
      assertTopicPayload(normalizeString(topic.summary, null) !== null, '好物速报缺少 summary');
      assertTopicPayload(topic.pros.length > 0, '好物速报缺少 pros');
      assertTopicPayload(topic.tags && topic.tags.shareReasons.length > 0, '好物速报缺少 tags.shareReasons');
      break;
    case TOPIC_CATEGORY.EXPERIENCE:
      assertTopicPayload(normalizeString(topic.gearCategory, null) !== null, '长测评缺少 gearCategory');
      assertTopicPayload(normalizeString(topic.usageYear, null) !== null, '长测评缺少 usageYear');
      assertTopicPayload(normalizeString(topic.usageFrequency, null) !== null, '长测评缺少 usageFrequency');
      assertTopicPayload(normalizeString(topic.verifyImage, null) !== null, '长测评缺少 verifyImage');
      assertTopicPayload(topic.environments.length > 0, '长测评缺少 environments');
      assertTopicPayload(topic.ratings.length > 0, '长测评缺少 ratings');
      assertTopicPayload(normalizeString(topic.summary, null) !== null, '长测评缺少 summary');
      assertTopicPayload(normalizeString(topic.repurchase, null) !== null, '长测评缺少 repurchase');
      assertTopicPayload(topic.tags && normalizeString(topic.tags.budget, null) !== null, '长测评缺少 tags.budget');
      assertTopicPayload(topic.tags && topic.tags.usage.length > 0, '长测评缺少 tags.usage');
      assertTopicPayload(topic.tags && topic.tags.fit.length > 0, '长测评缺少 tags.fit');
      assertTopicPayload(topic.tags && topic.tags.unfit.length > 0, '长测评缺少 tags.unfit');
      break;
    case TOPIC_CATEGORY.QUESTION:
      assertTopicPayload(normalizeString(topic.questionType, null) !== null, '讨论&提问缺少 questionType');
      assertTopicPayload(normalizeString(topic.content, null, { trim: true }) !== null, '讨论&提问缺少 content');
      break;
    case TOPIC_CATEGORY.CATCH:
      assertTopicPayload(topic.images.length > 0, '鱼获展示缺少 images');
      assertTopicPayload(normalizeString(topic.locationTag, null) !== null, '鱼获展示缺少 locationTag');
      break;
    case TOPIC_CATEGORY.TRIP: {
      const hasTargetFish = topic.targetFish.length > 0 || normalizeString(topic.customTargetFish, null) !== null;
      assertTopicPayload(normalizeString(topic.tripResult, null) !== null, '钓行分享缺少 tripResult');
      assertTopicPayload(topic.tripStatus.length > 0, '钓行分享缺少 tripStatus');
      assertTopicPayload(hasTargetFish, '钓行分享缺少 targetFish');
      assertTopicPayload(normalizeString(topic.season, null) !== null, '钓行分享缺少 season');
      assertTopicPayload(normalizeString(topic.weather, null) !== null, '钓行分享缺少 weather');
      assertTopicPayload(normalizeString(topic.waterType, null) !== null, '钓行分享缺少 waterType');
      assertTopicPayload(normalizeString(topic.mainSpot, null) !== null, '钓行分享缺少 mainSpot');
      assertTopicPayload(normalizeString(topic.fishingTime, null) !== null, '钓行分享缺少 fishingTime');
      assertTopicPayload(topic.rigs.length > 0, '钓行分享缺少 rigs');
      break;
    }
    default:
      break;
  }
}

function normalizeTopicPayload(payload = {}) {
  const topicCategory = normalizeTopicCategory(payload.topicCategory);
  const normalized = {
    topicCategory,
    title: normalizeString(payload.title, ''),
    content: normalizeText(payload.content, ''),
    images: normalizeImages(payload.images),
    gearCategory: null,
    gearModel: null,
    gearItemId: null,
    usageYear: null,
    usageFrequency: null,
    environments: [],
    customScene: null,
    summary: null,
    pros: [],
    tags: null,
    verifyImage: null,
    ratings: [],
    repurchase: null,
    cons: [],
    customFit: null,
    customUnfit: null,
    comboGear: [],
    comboDesc: null,
    compareGear: [],
    compareDesc: null,
    questionType: null,
    relatedGearCategory: null,
    relatedGearModel: null,
    relatedGearItemId: null,
    quickReplyOnly: false,
    locationTag: null,
    length: null,
    isLengthSecret: false,
    isLengthEstimated: false,
    weight: null,
    isWeightSecret: false,
    isWeightEstimated: false,
    tripResult: null,
    tripStatus: [],
    targetFish: [],
    customTargetFish: null,
    season: null,
    weather: null,
    waterType: null,
    mainSpot: null,
    fishingTime: null,
    envFeelings: [],
    rigs: [],
    rigDescription: null
  };

  if (topicCategory === TOPIC_CATEGORY.RECOMMEND) {
    normalized.gearCategory = normalizeString(payload.gearCategory, null);
    normalized.gearModel = normalizeString(payload.gearModel, null);
    normalized.gearItemId = normalizeOptionalNumber(payload.gearItemId, { integer: true });
    normalized.usageYear = normalizeString(payload.usageYear, null);
    normalized.usageFrequency = normalizeString(payload.usageFrequency, null);
    normalized.environments = normalizeStringArray(payload.environments, { maxItems: 5 });
    normalized.customScene = normalizeString(payload.customScene, null);
    normalized.summary = normalizeString(payload.summary, null, { trim: false });
    normalized.pros = normalizeStringArray(payload.pros);
    normalized.tags = normalizeRecommendTags(payload.tags);
  } else if (topicCategory === TOPIC_CATEGORY.EXPERIENCE) {
    normalized.gearCategory = normalizeString(payload.gearCategory, null);
    normalized.gearModel = normalizeString(payload.gearModel, null);
    normalized.gearItemId = normalizeOptionalNumber(payload.gearItemId, { integer: true });
    normalized.usageYear = normalizeString(payload.usageYear, null);
    normalized.usageFrequency = normalizeString(payload.usageFrequency, null);
    normalized.verifyImage = normalizeString(payload.verifyImage, null);
    normalized.environments = normalizeStringArray(payload.environments, { maxItems: 5 });
    normalized.customScene = normalizeString(payload.customScene, null);
    normalized.ratings = normalizeRatings(payload.ratings);
    normalized.summary = normalizeString(payload.summary, null, { trim: false });
    normalized.repurchase = normalizeString(payload.repurchase, null);
    normalized.pros = normalizeStringArray(payload.pros);
    normalized.cons = normalizeStringArray(payload.cons);
    normalized.tags = normalizeExperienceTags(payload.tags);
    normalized.customFit = normalizeString(payload.customFit, null, { trim: false });
    normalized.customUnfit = normalizeString(payload.customUnfit, null, { trim: false });
    normalized.comboGear = normalizeStringArray(payload.comboGear);
    normalized.comboDesc = normalizeString(payload.comboDesc, null, { trim: false });
    normalized.compareGear = normalizeStringArray(payload.compareGear);
    normalized.compareDesc = normalizeString(payload.compareDesc, null, { trim: false });
  } else if (topicCategory === TOPIC_CATEGORY.QUESTION) {
    normalized.questionType = normalizeString(payload.questionType, null);
    normalized.relatedGearCategory = normalizeString(payload.relatedGearCategory, null);
    normalized.relatedGearModel = normalizeString(payload.relatedGearModel, null);
    normalized.relatedGearItemId = normalizeOptionalNumber(payload.relatedGearItemId, { integer: true });
    normalized.quickReplyOnly = normalizeBoolean(payload.quickReplyOnly, false);
  } else if (topicCategory === TOPIC_CATEGORY.CATCH) {
    normalized.locationTag = normalizeString(payload.locationTag, null);
    normalized.length = normalizeString(payload.length, null);
    normalized.isLengthSecret = normalizeBoolean(payload.isLengthSecret, false);
    normalized.isLengthEstimated = normalizeBoolean(payload.isLengthEstimated, false);
    normalized.weight = normalizeString(payload.weight, null);
    normalized.isWeightSecret = normalizeBoolean(payload.isWeightSecret, false);
    normalized.isWeightEstimated = normalizeBoolean(payload.isWeightEstimated, false);
  } else if (topicCategory === TOPIC_CATEGORY.TRIP) {
    normalized.tripResult = normalizeString(payload.tripResult, null);
    normalized.tripStatus = normalizeStringArray(payload.tripStatus, { maxItems: 2 });
    normalized.targetFish = normalizeStringArray(payload.targetFish, { maxItems: 3 });
    normalized.customTargetFish = normalizeString(payload.customTargetFish, null);
    normalized.season = normalizeString(payload.season, null);
    normalized.weather = normalizeString(payload.weather, null);
    normalized.waterType = normalizeString(payload.waterType, null);
    normalized.mainSpot = normalizeString(payload.mainSpot, null);
    normalized.fishingTime = normalizeString(payload.fishingTime, null);
    normalized.envFeelings = normalizeStringArray(payload.envFeelings);
    normalized.rigs = normalizeStringArray(payload.rigs);
    normalized.rigDescription = normalizeString(payload.rigDescription, null, { trim: false });
  }

  validateTopicPayload(normalized);
  return normalized;
}

function normalizeTopicRecord(topic = {}) {
  const topicCategory = normalizeTopicCategory(topic.topicCategory);
  return {
    id: topic._id,
    _id: topic._id,
    userId: firstDefined(topic.userId, topic.user_id, null),
    topicCategory,
    title: normalizeString(topic.title, ''),
    content: normalizeText(topic.content, ''),
    images: normalizeImages(topic.images),
    gearCategory: normalizeString(topic.gearCategory, null),
    gearModel: normalizeString(topic.gearModel, null),
    gearItemId: normalizeOptionalNumber(firstDefined(topic.gearItemId, topic.gear_item_id, null), { integer: true }),
    usageYear: normalizeString(topic.usageYear, null),
    usageFrequency: normalizeString(topic.usageFrequency, null),
    environments: normalizeStringArray(topic.environments),
    customScene: normalizeString(topic.customScene, null),
    summary: normalizeString(topic.summary, null, { trim: false }),
    pros: normalizeStringArray(topic.pros),
    tags: normalizeTopicTagsByCategory(topicCategory, topic.tags),
    verifyImage: normalizeString(topic.verifyImage, null),
    ratings: normalizeRatings(topic.ratings),
    repurchase: normalizeString(topic.repurchase, null),
    cons: normalizeStringArray(topic.cons),
    customFit: normalizeString(topic.customFit, null, { trim: false }),
    customUnfit: normalizeString(topic.customUnfit, null, { trim: false }),
    comboGear: normalizeStringArray(topic.comboGear),
    comboDesc: normalizeString(topic.comboDesc, null, { trim: false }),
    compareGear: normalizeStringArray(topic.compareGear),
    compareDesc: normalizeString(topic.compareDesc, null, { trim: false }),
    questionType: normalizeString(topic.questionType, null),
    relatedGearCategory: normalizeString(topic.relatedGearCategory, null),
    relatedGearModel: normalizeString(topic.relatedGearModel, null),
    relatedGearItemId: normalizeOptionalNumber(firstDefined(topic.relatedGearItemId, topic.related_gear_item_id, null), { integer: true }),
    quickReplyOnly: normalizeBoolean(topic.quickReplyOnly, false),
    locationTag: normalizeString(topic.locationTag, null),
    length: normalizeString(topic.length, null),
    isLengthSecret: normalizeBoolean(topic.isLengthSecret, false),
    isLengthEstimated: normalizeBoolean(topic.isLengthEstimated, false),
    weight: normalizeString(topic.weight, null),
    isWeightSecret: normalizeBoolean(topic.isWeightSecret, false),
    isWeightEstimated: normalizeBoolean(topic.isWeightEstimated, false),
    tripResult: normalizeString(topic.tripResult, null),
    tripStatus: normalizeStringArray(topic.tripStatus),
    targetFish: normalizeStringArray(topic.targetFish),
    customTargetFish: normalizeString(topic.customTargetFish, null),
    season: normalizeString(topic.season, null),
    weather: normalizeString(topic.weather, null),
    waterType: normalizeString(topic.waterType, null),
    mainSpot: normalizeString(topic.mainSpot, null),
    fishingTime: normalizeString(topic.fishingTime, null),
    envFeelings: normalizeStringArray(topic.envFeelings),
    rigs: normalizeStringArray(topic.rigs),
    rigDescription: normalizeString(topic.rigDescription, null, { trim: false }),
    contentQualityScore: normalizeNumber(firstDefined(topic.contentQualityScore, 0), 0, { min: 0 }),
    engagementScore: normalizeNumber(firstDefined(topic.engagementScore, 0), 0, { min: 0 }),
    credibilityScore: normalizeNumber(firstDefined(topic.credibilityScore, 0), 0, { min: 0 }),
    recommendationScore: normalizeNumber(firstDefined(topic.recommendationScore, 0), 0, { min: 0, max: 10 }),
    knowledgeScore: normalizeNumber(firstDefined(topic.knowledgeScore, 0), 0, { min: 0 }),
    sampleCount: normalizeNumber(firstDefined(topic.sampleCount, 0), 0, { min: 0, integer: true }),
    likeCount: Number(firstDefined(topic.likeCount, 0)) || 0,
    commentCount: Number(firstDefined(topic.commentCount, 0)) || 0,
    status: Number(firstDefined(topic.status, 0)) || 0,
    isDelete: Number(firstDefined(topic.isDelete, 0)) || 0,
    createTime: firstDefined(topic.createTime, null),
    publishTime: firstDefined(topic.publishTime, null),
    updateTime: firstDefined(topic.updateTime, null)
  };
}

function buildIdMap(list = [], key = 'id') {
  return list.reduce((map, item) => {
    if (item && item[key] !== undefined && item[key] !== null && item[key] !== '') {
      map.set(String(item[key]), item);
    }
    return map;
  }, new Map());
}

async function getCollectionData(collectionName, query = {}) {
  const res = await db.collection(collectionName).where(query).limit(1000).get().catch(() => ({ data: [] }));
  return res.data || [];
}

function normalizeGearCategory(category) {
  if (!category) return '';
  const value = String(category).toLowerCase();
  if (value === 'reel' || value === 'reels') return 'reels';
  if (value === 'rod' || value === 'rods') return 'rods';
  if (value === 'lure' || value === 'lures') return 'lures';
  return value;
}

async function loadRateGearByCategory(category) {
  const normalizedCategory = normalizeGearCategory(category);
  const brands = await getCollectionData(COL.RATE_BRAND);
  const brandMap = buildIdMap(brands, 'id');

  if (normalizedCategory === 'reels') {
    const [reels, spinningDetails, baitcastingDetails] = await Promise.all([
      getCollectionData(COL.RATE_REEL),
      getCollectionData(COL.RATE_SPINNING_REEL_DETAIL),
      getCollectionData(COL.RATE_BAITCASTING_REEL_DETAIL)
    ]);
    return reels.map(item => {
      const subType = item.type || item.subType;
      const detailList = subType === 'spinning'
        ? spinningDetails.filter(d => String(d.reel_id) === String(item.id))
        : baitcastingDetails.filter(d => String(d.reel_id) === String(item.id));
      const brand = brandMap.get(String(item.brand_id));
      return {
        ...item,
        sourceId: item.id,
        category: 'reels',
        subType,
        type: subType,
        brand_name: firstDefined(item.brand_name, brand?.name, ''),
        variants: detailList
      };
    });
  }

  if (normalizedCategory === 'rods') {
    const [rods, spinningDetails, castingDetails] = await Promise.all([
      getCollectionData(COL.RATE_ROD),
      getCollectionData(COL.RATE_SPINNING_ROD_DETAIL),
      getCollectionData(COL.RATE_CASTING_ROD_DETAIL)
    ]);
    return rods.map(item => {
      const subType = item.type || item.subType;
      const detailList = subType === 'spinning'
        ? spinningDetails.filter(d => String(d.rod_id) === String(item.id))
        : castingDetails.filter(d => String(d.rod_id) === String(item.id));
      const brand = brandMap.get(String(item.brand_id));
      return {
        ...item,
        sourceId: item.id,
        category: 'rods',
        subType,
        type: subType,
        brand_name: firstDefined(item.brand_name, brand?.name, ''),
        variants: detailList
      };
    });
  }

  if (normalizedCategory === 'lures') {
    const [lures, hardDetails, softDetails] = await Promise.all([
      getCollectionData(COL.RATE_LURE),
      getCollectionData(COL.RATE_HARD_LURE_DETAIL),
      getCollectionData(COL.RATE_SOFT_LURE_DETAIL)
    ]);
    return lures.map(item => {
      const subType = item.type || item.subType;
      const detailList = subType === 'hard'
        ? hardDetails.filter(d => String(d.lure_id) === String(item.id))
        : softDetails.filter(d => String(d.lure_id) === String(item.id));
      const brand = brandMap.get(String(item.brand_id));
      return {
        ...item,
        sourceId: item.id,
        category: 'lures',
        subType,
        type: subType,
        brand_name: firstDefined(item.brand_name, brand?.name, ''),
        variants: detailList
      };
    });
  }

  return [];
}

async function getLoginUserOrThrow(openid) {
  const { data } = await db.collection(COL.USER).where({ openId: openid, status: 0 }).limit(1).get();
  if (!data.length) throw new Error('用户不存在或状态异常');
  return data[0];
}

async function checkAndAddRecord(openid, actionType) {
  const user = await getLoginUserOrThrow(openid);
  const taskRes = await db.collection(COL.TASK).where(_.or([
    { actionType },
    { action_type: actionType }
  ])).limit(1).get();
  
  if (!taskRes.data.length) {
    console.log(`[checkAndAddRecord] Task not found for actionType: ${actionType}`);
    return;
  }
  const task = taskRes.data[0];

  // 检查任务进度是否满足要求
  const { completed } = await calculateTaskProgress(user._id, task);
  console.log(`[checkAndAddRecord] Progress for ${actionType}: completed=${completed}`);
  
  if (!completed) return;

  const where = {
    userId: user._id,
    taskFeatId: task._id
  };
  if (Number(task.type) === 0) {
    const { start, end } = getDailyTaskRefreshWindow();
    where.createTime = _.gte(start).and(_.lt(end));
  }

  const existed = await db.collection(COL.TASK_RECORD).where(where).limit(1).get();
  if (existed.data.length) return;

  await db.collection(COL.TASK_RECORD).add({
    data: {
      userId: user._id,
      taskFeatId: task._id,
      taskFeatName: task.name,
      points: task.points,
      tagId: task.tagId || null,
      received: false,
      taskFeatDesc: task.taskFeatDesc || '',
      createTime: now()
    }
  });
  console.log(`[checkAndAddRecord] Added record for ${actionType}`);
}

async function loginByWeChat(openid, payload = {}) {
  const { data } = await db.collection(COL.USER).where({ openId: openid }).limit(1).get();
  if (!data.length) {
    const count = await db.collection(COL.USER).count();
    const doc = {
      openId: openid,
      unionId: payload.unionId || null,
      sessionKey: payload.sessionKey || null,
      nickName: payload.nickName || `钓友说 ${count.total + 1}`,
      avatarUrl: payload.avatarUrl || DEFAULT_AVATAR_URL,
      bio: payload.bio || '',
      background: payload.background || '',
      shipAddress: payload.shipAddress || '',
      status: 0,
      points: 0,
      level: 1,
      totalLoginDays: 1,
      continuousLoginDays: 1,
      lastAuthTime: now(),
      createTime: now(),
      updateTime: now()
    };
    const addRes = await db.collection(COL.USER).add({ data: doc });
    let loginUser = await ensureUserInviteCode({ ...doc, _id: addRes._id });
    const inviteBinding = await bindInviteForUser(loginUser, payload, { allowExistingUser: true });
    await checkAndAddRecord(openid, ACTION.SIGN_IN);
    await checkAndAddRecord(openid, ACTION.DAILY_LOGIN);
    await checkAndAddRecord(openid, ACTION.CHECK_IN);
    await checkAndAddRecord(openid, ACTION.LOGIN_7_DAYS);
    await checkAndAddRecord(openid, ACTION.LOGIN_21_DAYS);
    loginUser = await db.collection(COL.USER).doc(loginUser._id).get().then(res => res.data).catch(() => loginUser);
    loginUser = await ensureUserInviteCode(loginUser);
    return { ...loginUser, token: 'cloud-openid-auth', inviteBinding };
  }

  const user = await ensureUserInviteCode(data[0]);
  if (user.status !== 0) throw new Error('(0101403)当前用户已封禁或注销');
  const updatedUser = await updateUserLoginStats(user);
  await checkAndAddRecord(openid, ACTION.DAILY_LOGIN);
  await checkAndAddRecord(openid, ACTION.CHECK_IN);
  await checkAndAddRecord(openid, ACTION.LOGIN_7_DAYS);
  await checkAndAddRecord(openid, ACTION.LOGIN_21_DAYS);
  return { ...updatedUser, token: 'cloud-openid-auth', inviteBinding: { bound: false, reason: 'existing_user' } };
}

async function getEquippedTagProfileByUserId(userId) {
  const profile = await getUserTagProfileByUserIdentifiers([userId]);
  return profile.equippedTag || null;
}

async function getTopicPublisherUserById(userId) {
  if (!userId) return null;

  const userByIdRes = await db.collection(COL.USER).doc(userId).get().catch(() => null);
  if (userByIdRes?.data) {
    return userByIdRes.data;
  }

  const userByOpenIdRes = await db.collection(COL.USER).where({ openId: userId }).limit(1).get().catch(() => null);
  if (userByOpenIdRes?.data?.length) {
    return userByOpenIdRes.data[0];
  }

  return null;
}

async function buildDisplayTagProfileMapForUsers(userMap) {
  const canonicalUsers = new Map();
  userMap.forEach((user) => {
    if (user && user._id && !canonicalUsers.has(String(user._id))) {
      canonicalUsers.set(String(user._id), user);
    }
  });

  if (!canonicalUsers.size) {
    return new Map();
  }

  const canonicalIds = [...canonicalUsers.keys()];
  const [ownedByUserIdRes, settingsByUserIdRes] = await Promise.all([
    db.collection(COL.USER_TAGS).where({ user_id: _.in(canonicalIds) }).get().catch(() => ({ data: [] })),
    db.collection(COL.USER_TAG_DISPLAY).where({ user_id: _.in(canonicalIds) }).limit(1000).get().catch(() => ({ data: [] }))
  ]);

  const ownedByCanonical = new Map();
  const settingsByCanonical = new Map();

  (ownedByUserIdRes.data || []).forEach((item) => {
    const normalized = normalizeUserOwnedTagRecord(item);
    const canonicalId = String(normalized.userId || '');
    if (!canonicalId || !canonicalUsers.has(canonicalId)) return;
    if (!ownedByCanonical.has(canonicalId)) ownedByCanonical.set(canonicalId, []);
    ownedByCanonical.get(canonicalId).push(normalized);
  });

  (settingsByUserIdRes.data || []).forEach((item) => {
    const normalized = normalizeTagDisplaySettingsRecord(item);
    const canonicalId = String(normalized.userId || '');
    if (!canonicalId || !canonicalUsers.has(canonicalId) || settingsByCanonical.has(canonicalId)) return;
    settingsByCanonical.set(canonicalId, normalized);
  });

  const allOwnedTags = [];
  canonicalUsers.forEach((_, canonicalId) => {
    const preferred = ownedByCanonical.get(canonicalId) || [];
    if (preferred.length) allOwnedTags.push(...preferred);
  });

  const definitions = await getTagDefinitionsByAnyIds(allOwnedTags.map(item => item.tagId));
  const displayTagProfileMap = new Map();

  canonicalUsers.forEach((_, canonicalId) => {
    const settings = settingsByCanonical.get(canonicalId) || normalizeTagDisplaySettingsRecord({ user_id: canonicalId });
    const ownedTags = ownedByCanonical.get(canonicalId) || [];
    const mergedTags = sortTagCandidates(mergeOwnedTagsWithDefinitions(ownedTags, definitions, settings));
    displayTagProfileMap.set(canonicalId, {
      displayTagByTopic(topicCategory) {
        return resolveDisplayTagForTopic(mergedTags, topicCategory, settings);
      }
    });
  });

  return displayTagProfileMap;
}

async function buildTopicListContext(topics = [], loginUserId) {
  const normalizedTopics = topics.map(topic => normalizeTopicRecord(topic));
  const topicIds = uniqueValues(normalizedTopics.map(item => item.id).filter(Boolean));
  const userIds = uniqueValues(normalizedTopics.map(item => item.userId).filter(Boolean));
  const likePromise = topicIds.length && loginUserId
    ? db.collection(COL.TOPIC_LIKE).where({ topicId: _.in(topicIds), userId: loginUserId }).get().catch(() => ({ data: [] }))
    : Promise.resolve({ data: [] });
  const usersByIdPromise = userIds.length
    ? db.collection(COL.USER).where({ _id: _.in(userIds) }).limit(1000).get().catch(() => ({ data: [] }))
    : Promise.resolve({ data: [] });

  const [likeRes, usersByIdRes] = await Promise.all([likePromise, usersByIdPromise]);
  const likeMap = new Set((likeRes.data || []).map(item => String(item.topicId)));
  const userMap = new Map();
  (usersByIdRes.data || []).forEach(user => {
    if (user && user._id) {
      userMap.set(String(user._id), user);
    }
  });

  const missingUserIds = userIds.filter(userId => !userMap.has(String(userId)));
  if (missingUserIds.length) {
    const usersByOpenIdRes = await db.collection(COL.USER).where({ openId: _.in(missingUserIds) }).limit(1000).get().catch(() => ({ data: [] }));
    (usersByOpenIdRes.data || []).forEach(user => {
      if (user?.openId) {
        userMap.set(String(user.openId), user);
      }
    });
  }

  const tagProfileMap = await buildDisplayTagProfileMapForUsers(userMap);

  return {
    normalizedTopics,
    likeMap,
    userMap,
    tagProfileMap
  };
}

function buildTopicListItem(topic, context) {
  const normalizedTopic = normalizeTopicRecord(topic);
  const userData = context.userMap.get(String(normalizedTopic.userId)) || null;
  const tagProfile = context.tagProfileMap.get(String(userData?._id || normalizedTopic.userId));
  const authorDisplayTag = tagProfile ? tagProfile.displayTagByTopic(normalizedTopic.topicCategory) : null;
  const publisher = userData ? {
    id: userData._id,
    nickName: firstDefined(userData.nickName, userData.nickname, userData.userName, '匿名用户'),
    avatarUrl: firstDefined(userData.avatarUrl, userData.avatar, userData.avatar_url, DEFAULT_AVATAR_URL),
    level: firstDefined(userData.level, 1),
    displayTag: authorDisplayTag
  } : {};
  const averageRate = calculateAverageRatingScore(normalizedTopic.ratings);
  const recommendationScore = normalizedTopic.topicCategory === TOPIC_CATEGORY.EXPERIENCE
    ? calculateRecommendationScore(normalizedTopic)
    : normalizedTopic.recommendationScore;

  return {
    ...normalizedTopic,
    nickName: publisher.nickName,
    avatarUrl: publisher.avatarUrl,
    level: publisher.level,
    publisher,
    author: {
      id: publisher.id || normalizedTopic.userId,
      name: publisher.nickName,
      avatar: publisher.avatarUrl,
      level: publisher.level,
      displayTag: authorDisplayTag
    },
    isLike: context.likeMap.has(String(normalizedTopic.id)),
    commentCount: Number(normalizedTopic.commentCount || 0),
    displayTag: authorDisplayTag,
    tagName: authorDisplayTag?.name,
    tagRarityLevel: authorDisplayTag?.rarityLevel,
    averageRate,
    recommendationScore
  };
}

async function topicWithExtra(topic, loginUserId) {
  const normalizedTopic = normalizeTopicRecord(topic);
  const [tagProfile, liked, commentCountRes, userData] = await Promise.all([
    getUserTagProfileByUserIdentifiers([normalizedTopic.userId]),
    db.collection(COL.TOPIC_LIKE).where({ topicId: normalizedTopic.id, userId: loginUserId }).limit(1).get().catch(() => ({ data: [] })),
    db.collection(COL.COMMENT).where({ topicId: normalizedTopic.id, isVisible: 1 }).count().catch(() => ({ total: 0 })),
    getTopicPublisherUserById(normalizedTopic.userId)
  ]);
  const authorDisplayTag = tagProfile.displayTagByTopic(normalizedTopic.topicCategory);
  const commentCount = Number(commentCountRes.total || normalizedTopic.commentCount || 0);
  const averageRate = calculateAverageRatingScore(normalizedTopic.ratings);
  const recommendationScore = normalizedTopic.topicCategory === TOPIC_CATEGORY.EXPERIENCE
    ? calculateRecommendationScore(normalizedTopic)
    : normalizedTopic.recommendationScore;

  // 获取发布者信息（兼容迁移前后字段）
  let publisherData = {};
  if (userData) {

    // 优先按用户 _id 读取


    // 兼容：部分迁移数据可能把 openId 存到了 topic.userId


    if (userData) {
      publisherData = {
        id: userData._id,
        nickName: firstDefined(userData.nickName, userData.nickname, userData.userName, '匿名用户'),
        avatarUrl: firstDefined(userData.avatarUrl, userData.avatar, userData.avatar_url, DEFAULT_AVATAR_URL),
        level: firstDefined(userData.level, 1),
        displayTag: authorDisplayTag
      };
      console.log('[miniApi] resolved publisher:', publisherData);
    } else {
      console.log('[miniApi] no user data found for topic userId:', normalizedTopic.userId);
    }
  } else {
    console.error('获取发布者信息失败', e);
  }

  return {
    ...normalizedTopic,
    nickName: publisherData.nickName,
    avatarUrl: publisherData.avatarUrl,
    level: publisherData.level,
    publisher: publisherData,    // 同时提供 publisher 对象，供前端新逻辑使用
    author: {
      id: publisherData.id || normalizedTopic.userId,
      name: publisherData.nickName,
      avatar: publisherData.avatarUrl,
      level: publisherData.level,
      displayTag: authorDisplayTag
    },
    isLike: !!liked.data.length,
    commentCount,
    displayTag: authorDisplayTag,
    tagName: authorDisplayTag?.name,
    tagRarityLevel: authorDisplayTag?.rarityLevel,
    averageRate,
    recommendationScore
  };
}

const handlers = {
  async 'user.login'(_, payload, wxContext) {
    const user = await loginByWeChat(wxContext.OPENID, payload);
    return R.ok({ ...user, id: user._id, openId: null }, '登陆成功');
  },

  async 'user.info'(_, payload) {
    const user = await db.collection(COL.USER).doc(payload.id).get();
    const normalizedUser = await ensureUserInviteCode(user.data || {});
    return R.ok({ ...normalizedUser, id: normalizedUser._id });
  },

  async 'user.all'() {
    const users = await db.collection(COL.USER).get();
    return R.ok(users.data.map(u => ({ ...u, id: u._id })));
  },

  async 'user.update'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    const oldAvatar = user.avatarUrl;
    await db.collection(COL.USER).doc(user._id).update({
      data: {
        avatarUrl: payload.avatarUrl ?? user.avatarUrl,
        nickName: payload.nickName ?? user.nickName,
        bio: payload.bio ?? user.bio,
        shipAddress: payload.shipAddress ?? user.shipAddress,
        background: payload.background ?? user.background
      }
    });
    if (payload.avatarUrl && payload.avatarUrl !== oldAvatar) await checkAndAddRecord(wxContext.OPENID, ACTION.EDIT_AVATAR);
    await checkAndAddRecord(wxContext.OPENID, ACTION.EDIT_PROFILE);
    return R.ok(true);
  },

  async 'user.points'(_, __, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    return R.ok(user.points || 0);
  },

  async 'invite.bind'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    const result = await bindInviteForUser(user, payload, { allowExistingUser: false });
    return R.ok(result);
  },

  async 'invite.summary'(_, __, wxContext) {
    const user = await ensureUserInviteCode(await getLoginUserOrThrow(wxContext.OPENID));
    const [inviteCountRes, rewardCountRes, latestInviteRes] = await Promise.all([
      db.collection(COL.USER_INVITE)
        .where({ inviterUserId: user._id, status: 'bound' })
        .count()
        .catch(() => ({ total: 0 })),
      db.collection(COL.USER_INVITE)
        .where({ inviterUserId: user._id, rewardStatus: 'granted' })
        .count()
        .catch(() => ({ total: 0 })),
      db.collection(COL.USER_INVITE)
        .where({ inviterUserId: user._id, status: 'bound' })
        .orderBy('createTime', 'desc')
        .limit(5)
        .get()
        .catch(() => ({ data: [] }))
    ]);

    return R.ok({
      inviteCode: user.inviteCode,
      invitedByUserId: user.invitedByUserId || '',
      inviteSuccessCount: Number(user.inviteSuccessCount || inviteCountRes.total || 0),
      inviteRewardPoints: Number(user.inviteRewardPoints || 0),
      inviteRewardCount: Number(user.inviteRewardCount || rewardCountRes.total || 0),
      inviterDailyRewardLimit: INVITE_DAILY_REWARD_LIMIT,
      inviterRewardPoints: INVITE_REWARD_POINTS,
      inviteeRewardPoints: INVITEE_REWARD_POINTS,
      recentInvites: (latestInviteRes.data || []).map((item) => ({
        id: item._id,
        inviteeUserId: item.inviteeUserId,
        inviteeName: item.inviteeName || '新用户',
        rewardStatus: item.rewardStatus || 'unknown',
        inviterRewardPoints: Number(item.inviterRewardPoints || 0),
        createTime: item.createTime || null
      }))
    });
  },

  async 'topic.new'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    const topicPayload = normalizeTopicPayload(payload);
    console.log('[miniApi] topic.new normalized payload:', {
      userId: user._id,
      topicCategory: topicPayload.topicCategory,
      title: topicPayload.title,
      gearCategory: topicPayload.gearCategory,
      gearModel: topicPayload.gearModel,
      gearItemId: topicPayload.gearItemId,
      relatedGearCategory: topicPayload.relatedGearCategory,
      relatedGearModel: topicPayload.relatedGearModel,
      relatedGearItemId: topicPayload.relatedGearItemId
    });
    const backendFields = buildTopicBackendFields(topicPayload);
    const addRes = await db.collection(COL.TOPIC).add({
      data: {
        ...topicPayload,
        ...backendFields,
        userId: user._id,
        status: 0,
        isDelete: 0,
        likeCount: 0,
        commentCount: 0,
        createTime: now(),
        updateTime: now()
      }
    });
    await checkAndAddRecord(wxContext.OPENID, ACTION.POST_MASTER);
    await checkAndAddRecord(wxContext.OPENID, ACTION.POST_INTERACTION);
    return R.ok(addRes._id);
  },

  async 'topic.update'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    const docId = payload.id;
    const topicPayload = normalizeTopicPayload(payload);
    console.log('[miniApi] topic.update normalized payload:', {
      userId: user._id,
      docId,
      topicCategory: topicPayload.topicCategory,
      title: topicPayload.title,
      gearCategory: topicPayload.gearCategory,
      gearModel: topicPayload.gearModel,
      gearItemId: topicPayload.gearItemId,
      relatedGearCategory: topicPayload.relatedGearCategory,
      relatedGearModel: topicPayload.relatedGearModel,
      relatedGearItemId: topicPayload.relatedGearItemId
    });
    let existingTopic = null;
    if (docId) {
      existingTopic = await db.collection(COL.TOPIC).doc(docId).get().catch(() => null);
      if (!existingTopic?.data || existingTopic.data.status !== 0) return R.ok(false);
    }
    const backendFields = buildTopicBackendFields(topicPayload, existingTopic?.data);
    const data = { ...topicPayload, ...backendFields, userId: user._id, status: 2, publishTime: now(), updateTime: now() };
    if (!docId) {
      await db.collection(COL.TOPIC).add({
        data: {
          ...data,
          isDelete: 0,
          likeCount: 0,
          commentCount: 0,
          createTime: now()
        }
      });
      return R.ok(true);
    }
    await db.collection(COL.TOPIC).doc(docId).update({ data });
    return R.ok(true);
  },

  async 'topic.delete'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    await db.collection(COL.TOPIC).where({ _id: payload.id, userId: user._id }).update({ data: { isDelete: 1, updateTime: now() } });
    return R.ok(true);
  },

  async 'topic.get'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    if (!payload.topicId) return R.fail('缺少参数 topicId', 400);
    const topic = await db.collection(COL.TOPIC).doc(payload.topicId).get().catch(() => null);
    if (!topic?.data || Number(topic.data.isDelete || 0) === 1) return R.fail('帖子不存在', 404);
    return R.ok(await topicWithExtra(topic.data, user._id));
  },

  async 'topic.all'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    const topicAllStartedAt = Date.now();
    console.log('[miniApi] topic.all called by user:', user._id, 'source:', payload?.debugSource || 'unknown');
    const page = Math.max(Number(payload?.page || 1), 1);
    const limit = Math.min(Math.max(Number(payload?.limit || 20), 1), 100);
    const topicCategory = payload?.topicCategory !== undefined && payload?.topicCategory !== null && payload?.topicCategory !== ''
      ? Number(payload.topicCategory)
      : null;
    const isQuestionCategory = topicCategory === TOPIC_CATEGORY.QUESTION;
    const where = { isDelete: 0, status: 2 };
    if (payload?.topicCategory !== undefined && payload?.topicCategory !== null && payload?.topicCategory !== '') {
      if (Number.isInteger(topicCategory)) where.topicCategory = topicCategory;
    }
    if (payload?.gearCategory) {
      if (isQuestionCategory) {
        where.relatedGearCategory = payload.gearCategory;
      } else {
        where.gearCategory = payload.gearCategory;
      }
    }
    const gearModel = normalizeString(payload?.gearModel, null);
    const gearItemId = normalizeOptionalNumber(payload?.gearItemId, { integer: true });
    console.log('[miniApi] topic.all filters:', {
      debugSource: payload?.debugSource || 'unknown',
      topicCategory,
      gearCategory: payload?.gearCategory || null,
      gearModel,
      gearItemId,
      questionType: payload?.questionType || null
    });
    if (gearItemId !== null || gearModel) {
      const queryList = [];
      const baseWhere = { ...where };
      if (isQuestionCategory) {
        if (gearItemId !== null) {
          queryList.push({
            ...baseWhere,
            relatedGearItemId: gearItemId
          });
        }
        if (gearModel) {
          queryList.push({
            ...baseWhere,
            relatedGearModel: db.RegExp({ regexp: escapeRegExp(gearModel), options: 'i' })
          });
        }
      } else {
        if (gearItemId !== null) {
          queryList.push({
            ...baseWhere,
            gearItemId
          });
        }
        if (gearModel) {
          queryList.push({
            ...baseWhere,
            gearModel: db.RegExp({ regexp: escapeRegExp(gearModel), options: 'i' })
          });
        }
      }
      if (queryList.length > 0) {
        const relatedQueryStartedAt = Date.now();
        const queryResults = await Promise.all(queryList.map(query =>
          db.collection(COL.TOPIC)
            .where(query)
            .orderBy('publishTime', 'desc')
            .limit(limit)
            .get()
            .catch(() => ({ data: [] }))
        ));
        console.log('[miniApi][性能] topic.all 关联查询耗时:', Date.now() - relatedQueryStartedAt, 'ms', 'queryCount=', queryList.length);
        const mergeStartedAt = Date.now();
        const mergedMap = new Map();
        queryResults.forEach(result => {
          (result.data || []).forEach(item => {
            if (item && item._id && !mergedMap.has(item._id)) {
              mergedMap.set(item._id, item);
            }
          });
        });
        const mergedData = [...mergedMap.values()]
          .sort((a, b) => new Date(b.publishTime || b.createTime || 0).getTime() - new Date(a.publishTime || a.createTime || 0).getTime())
          .slice((page - 1) * limit, page * limit);
        console.log('[miniApi][性能] topic.all 关联结果合并耗时:', Date.now() - mergeStartedAt, 'ms', 'mergedCount=', mergedData.length);
        console.log('[miniApi] topic.all fetched count:', mergedData.length, 'matched topics:', mergedData.map(item => ({
          id: item._id,
          title: item.title,
          topicCategory: item.topicCategory,
          gearCategory: item.gearCategory,
          gearModel: item.gearModel,
          gearItemId: item.gearItemId,
          relatedGearCategory: item.relatedGearCategory,
          relatedGearModel: item.relatedGearModel,
          relatedGearItemId: item.relatedGearItemId
        })));
        const enrichStartedAt = Date.now();
        const context = await buildTopicListContext(mergedData, user._id);
        const list = mergedData.map(t => buildTopicListItem(t, context));
        console.log('[miniApi][性能] topic.all topicWithExtra耗时:', Date.now() - enrichStartedAt, 'ms', 'count=', list.length);
        await checkAndAddRecord(wxContext.OPENID, ACTION.CHECK_IN);
        console.log('[miniApi][性能] topic.all 总耗时:', Date.now() - topicAllStartedAt, 'ms', 'source=', payload?.debugSource || 'unknown');
        return R.ok(list);
      }
    }
    if (payload?.questionType) {
      where.questionType = payload.questionType;
    }
    if (payload?.title) {
      where.title = db.RegExp({ regexp: payload.title, options: 'i' });
    }
    const mainQueryStartedAt = Date.now();
    const { data } = await db.collection(COL.TOPIC)
      .where(where)
      .orderBy('publishTime', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get();
    console.log('[miniApi][性能] topic.all 主查询耗时:', Date.now() - mainQueryStartedAt, 'ms', 'count=', data.length);
    console.log('[miniApi] topic.all fetched count:', data.length, 'matched topics:', data.map(item => ({
      id: item._id,
      title: item.title,
      topicCategory: item.topicCategory,
      gearCategory: item.gearCategory,
      gearModel: item.gearModel,
      gearItemId: item.gearItemId,
      relatedGearCategory: item.relatedGearCategory,
      relatedGearModel: item.relatedGearModel,
      relatedGearItemId: item.relatedGearItemId
    })));
    const enrichStartedAt = Date.now();
    const context = await buildTopicListContext(data, user._id);
    const list = data.map(t => buildTopicListItem(t, context));
    console.log('[miniApi][性能] topic.all topicWithExtra耗时:', Date.now() - enrichStartedAt, 'ms', 'count=', list.length);
    await checkAndAddRecord(wxContext.OPENID, ACTION.CHECK_IN);
    console.log('[miniApi][性能] topic.all 总耗时:', Date.now() - topicAllStartedAt, 'ms', 'source=', payload?.debugSource || 'unknown');
    return R.ok(list);
  },

  async 'topic.mine'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    const page = Math.max(Number(payload?.page || 1), 1);
    const limit = Math.min(Math.max(Number(payload?.limit || 20), 1), 100);
    const where = { userId: user._id, isDelete: 0 };
    if (payload?.status !== undefined && payload?.status !== null && payload?.status !== '') {
      where.status = Number(payload.status);
    }
    if (payload?.topicCategory !== undefined && payload?.topicCategory !== null && payload?.topicCategory !== '') {
      const topicCategory = Number(payload.topicCategory);
      if (Number.isInteger(topicCategory)) where.topicCategory = topicCategory;
    }
    const { data } = await db.collection(COL.TOPIC)
      .where(where)
      .orderBy('updateTime', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get();
    return R.ok(data.map(t => normalizeTopicRecord(t)));
  },

  async 'topic.tmp'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    const { data } = await db.collection(COL.TOPIC)
      .where({ userId: user._id, status: 0, isDelete: 0 })
      .orderBy('updateTime', 'desc')
      .limit(1)
      .get();
    return R.ok(data[0] ? normalizeTopicRecord(data[0]) : null);
  },

  async 'topic.like'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    if (!payload.topicId) return R.fail('缺少参数 topicId', 400);
    const topicRes = await db.collection(COL.TOPIC).doc(payload.topicId).get().catch(() => null);
    if (!topicRes?.data || Number(topicRes.data.isDelete || 0) === 1) return R.fail('帖子不存在', 404);
    const { data } = await db.collection(COL.TOPIC_LIKE).where({ topicId: payload.topicId, userId: user._id }).limit(1).get();
    if (!data.length) {
      await db.collection(COL.TOPIC_LIKE).add({ data: { topicId: payload.topicId, userId: user._id, createTime: now() } });
      await db.collection(COL.TOPIC).doc(payload.topicId).update({ data: { likeCount: (topicRes.data.likeCount || 0) + 1, updateTime: now() } });
      await checkAndAddRecord(wxContext.OPENID, ACTION.LIKE_MASTER);
      await checkAndAddRecord(wxContext.OPENID, ACTION.LIKE_INTERACTION);
      return R.ok(true);
    }
    await db.collection(COL.TOPIC_LIKE).doc(data[0]._id).remove();
    await db.collection(COL.TOPIC).doc(payload.topicId).update({ data: { likeCount: Math.max((topicRes.data.likeCount || 1) - 1, 0), updateTime: now() } });
    return R.ok(false);
  },

  async 'comment.list'(event, payload) {
    const where = { topicId: payload.topicId, isVisible: 1 };
    if (payload.replayCommentId) where.replayCommentId = payload.replayCommentId;
    const [{ data }, topicRes] = await Promise.all([
      db.collection(COL.COMMENT).where(where).orderBy('createTime', 'asc').get(),
      db.collection(COL.TOPIC).doc(payload.topicId).get().catch(() => null)
    ]);
    const topicCategory = normalizeTopicCategory(firstDefined(topicRes?.data?.topicCategory, TOPIC_CATEGORY.QUESTION));
    
    // 批量获取用户信息
    const userIds = [...new Set(data.map(c => c.userId).filter(Boolean))];
    const userMap = {};
    const displayTagMap = new Map();
    const cmd = db.command; // 使用局部变量或直接使用 db.command 避免与参数冲突

    if (userIds.length) {
      // 1. 尝试按 _id 匹配
      const byId = await db.collection(COL.USER).where({
        _id: cmd.in(userIds)
      }).limit(1000).get();
      byId.data.forEach(u => userMap[u._id] = u);
      
      // 2. 查找未匹配的 ID (可能是历史数据中的 openId)
      const missing = userIds.filter(id => !userMap[id]);
      if (missing.length) {
        const byOpenId = await db.collection(COL.USER).where({
          openId: cmd.in(missing)
        }).limit(1000).get();
        // 将 openId 映射到用户记录，注意这里 key 是 openId
        byOpenId.data.forEach(u => userMap[u.openId] = u);
      }

      await Promise.all(userIds.map(async (userId) => {
        const userRecord = userMap[userId] || {};
        const tagProfile = await getUserTagProfileByUserIdentifiers([
          userId,
          userRecord._id,
          userRecord.id,
          userRecord.openId
        ]);
        const displayTag = tagProfile.displayTagByTopic(topicCategory);
        if (displayTag) {
          displayTagMap.set(String(userId), displayTag);
        }
      }));
    }

    return R.ok(data.map(i => {
      const u = userMap[i.userId] || {};
      const nickName = firstDefined(u.nickName, u.nickname, u.userName, '匿名用户');
      const avatarUrl = firstDefined(u.avatarUrl, u.avatar, u.avatar_url, DEFAULT_AVATAR_URL);
      const displayTag = displayTagMap.get(String(i.userId)) || null;
      
      return { 
        ...i, 
        id: i._id,
        nickName,
        avatarUrl,
        // 兼容前端不同字段名引用
        userName: nickName,
        userAvatarUrl: avatarUrl,
        displayTag,
        tagName: displayTag ? displayTag.name : '',
        tagRarityLevel: displayTag ? displayTag.rarityLevel : 0
      };
    }));
  },

  async 'comment.add'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    const topic = await db.collection(COL.TOPIC).doc(payload.topicId).get().catch(() => null);
    if (!topic?.data) return R.fail('帖子不存在', 400);
    await db.collection(COL.COMMENT).add({ data: { ...payload, userId: user._id, isVisible: 1, createTime: now(), updateTime: now() } });
    await db.collection(COL.TOPIC).doc(payload.topicId).update({ data: { commentCount: (topic.data.commentCount || 0) + 1 } });
    await checkAndAddRecord(wxContext.OPENID, ACTION.COMMENT_MASTER);
    await checkAndAddRecord(wxContext.OPENID, ACTION.COMMENT_INTERACTION);
    return R.ok(true);
  },

  async 'tag.batchAdd'(_, payload) {
    await Promise.all((payload.tags || []).map(tag => db.collection(COL.TAG_DEFINITION).add({
      data: {
        ...tag,
        created_at: now(),
        updated_at: now()
      }
    })));
    return R.ok(true);
  },

  async 'tag.usable'(event, __, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    const profile = await getUserTagProfileByUserIdentifiers([user._id, user.openId, user.id]);
    return R.ok(profile.ownedTags.map(tag => ({
      ...tag,
      id: tag.userTagId,
      tagId: tag.tagId,
      displayTag: createDisplayTagPayload(tag, { isEquipped: tag.isEquipped })
    })));
  },

  async 'tag.used'(event, __, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    const profile = await getUserTagProfileByUserIdentifiers([user._id, user.openId, user.id]);
    return R.ok({
      mainTagId: profile.mainTag ? profile.mainTag.id : null,
      mainTag: profile.mainTag,
      equippedTagId: profile.mainTag ? profile.mainTag.id : null,
      equippedTag: profile.mainTag,
      postTagMode: profile.settings.postTagMode,
      customPostTags: profile.settings.customPostTags,
      settings: {
        mainTagId: profile.mainTag ? profile.mainTag.id : null,
        postTagMode: profile.settings.postTagMode,
        customPostTags: profile.settings.customPostTags,
        preferIdentityInReview: profile.settings.preferIdentityInReview,
        preferFunInCatch: profile.settings.preferFunInCatch
      },
      ownedTags: profile.ownedTags.map(tag => ({
        ...tag,
        displayTag: createDisplayTagPayload(tag, { isEquipped: tag.isEquipped })
      })),
      groupedTags: profile.groupedTags,
      previewByPostType: profile.previewByPostType
    });
  },

  async 'tag.changeUse'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    const profile = await getUserTagProfileByUserIdentifiers([user._id, user.id, user.openId]);
    const hasMainTagUpdate = Object.prototype.hasOwnProperty.call(payload || {}, 'mainTagId')
      || Object.prototype.hasOwnProperty.call(payload || {}, 'equippedTagId')
      || Object.prototype.hasOwnProperty.call(payload || {}, 'tagId');
    const requestedTagId = hasMainTagUpdate ? firstDefined(payload.mainTagId, payload.equippedTagId, payload.tagId, null) : undefined;

    let nextMainTagId = profile.settings.mainTagId || null;
    if (requestedTagId === null || requestedTagId === '') {
      nextMainTagId = null;
    } else if (requestedTagId !== undefined) {
      const matchedTag = profile.ownedTags.find(tag => String(tag.tagId) === String(requestedTagId) || String(tag.code) === String(requestedTagId));
      if (!matchedTag) return R.fail('标签不存在或未拥有', 400);
      nextMainTagId = matchedTag.tagId;
    }

    const nextPostTagMode = normalizePostTagMode(
      firstDefined(payload.postTagMode, payload.post_tag_mode),
      profile.settings.postTagMode
    );
    const nextCustomPostTags = normalizeCustomPostTags(firstDefined(payload.customPostTags, payload.custom_post_tags, profile.settings.customPostTags));
    const settingsPayload = {
      user_id: user._id,
      main_tag_id: nextMainTagId,
      equipped_tag_id: nextMainTagId,
      post_tag_mode: nextPostTagMode,
      custom_post_tags: nextCustomPostTags,
      display_strategy: nextPostTagMode === POST_TAG_MODE.MAIN ? TAG_DISPLAY_STRATEGY.FIXED : TAG_DISPLAY_STRATEGY.SMART,
      prefer_identity_in_review: firstDefined(payload.preferIdentityInReview, profile.settings.preferIdentityInReview),
      prefer_fun_in_catch: firstDefined(payload.preferFunInCatch, profile.settings.preferFunInCatch),
      updated_at: now()
    };

    if (profile.settings.id) {
      await db.collection(COL.USER_TAG_DISPLAY).doc(profile.settings.id).update({ data: settingsPayload });
    } else {
      await db.collection(COL.USER_TAG_DISPLAY).add({
        data: {
          ...settingsPayload,
          created_at: now()
        }
      });
    }

    const nextProfile = await getUserTagProfileByUserIdentifiers([user._id, user.id, user.openId]);
    return R.ok({
      mainTagId: nextProfile.mainTag ? nextProfile.mainTag.id : null,
      mainTag: nextProfile.mainTag,
      equippedTagId: nextProfile.mainTag ? nextProfile.mainTag.id : null,
      equippedTag: nextProfile.mainTag,
      postTagMode: nextProfile.settings.postTagMode,
      customPostTags: nextProfile.settings.customPostTags,
      settings: {
        mainTagId: nextProfile.mainTag ? nextProfile.mainTag.id : null,
        postTagMode: nextProfile.settings.postTagMode,
        customPostTags: nextProfile.settings.customPostTags,
        preferIdentityInReview: nextProfile.settings.preferIdentityInReview,
        preferFunInCatch: nextProfile.settings.preferFunInCatch
      },
      ownedTags: nextProfile.ownedTags.map(tag => ({
        ...tag,
        displayTag: createDisplayTagPayload(tag, { isEquipped: tag.isEquipped })
      })),
      groupedTags: nextProfile.groupedTags,
      previewByPostType: nextProfile.previewByPostType
    });
  },

  async 'goods.list'(_, payload) {
    const cmd = db.command;
    const type = payload?.type !== undefined ? Number(payload.type) : undefined;
    
    let whereClause;
    if (type !== undefined) {
      whereClause = cmd.or([
        { isAvailable: true, type },
        { is_available: 1, type }
      ]);
    } else {
      whereClause = cmd.or([
        { isAvailable: true },
        { is_available: 1 }
      ]);
    }

    const { data } = await db.collection(COL.GOODS).where(whereClause).get();
    const tagDefinitions = await getTagDefinitionsByAnyIds(
      (data || []).map(item => firstDefined(item.tagId, item.tag_id)).filter(Boolean)
    );
    const tagMap = new Map(tagDefinitions.map(tag => [String(tag.id), tag]));

    return R.ok(data.map(g => {
      const tagId = firstDefined(g.tagId, g.tag_id, null);
      const tagDefinition = tagId
        ? (tagMap.get(String(tagId)) || tagDefinitions.find(tag => String(tag.code) === String(tagId)) || null)
        : null;
      const displayTag = tagDefinition ? createDisplayTagPayload(tagDefinition) : null;
      return {
        ...g,
        id: g._id,
        goodsName: firstDefined(g.goodsName, g.goods_name, tagDefinition?.name),
        points: firstDefined(g.points, g.amount),
        image: firstDefined(g.image, g.img_url, g.imageUrl),
        description: firstDefined(g.description, g.goods_desc, tagDefinition?.description),
        rarityLevel: tagDefinition?.rarityLevel || firstDefined(g.rarityLevel, g.rarity_level),
        displayTag,
        tagDefinition
      };
    }));
  },

  async 'goods.redeem'(_, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    const goods = await db.collection(COL.GOODS).doc(payload.goodsId).get().catch(() => null);
    if (!goods?.data) return R.fail('商品不存在', 400);
    
    const g = goods.data;
    const isAvailable = g.isAvailable === true || g.is_available === 1;
    if (!isAvailable) return R.fail('商品已下架', 400);
    
    if ((g.stock || 0) <= 0) return R.fail('您来晚了～', 400);
    
    const type = Number(firstDefined(g.type, 0));
    const tagId = firstDefined(g.tagId, g.tag_id);
    
    if (type !== 0 || !tagId) return R.fail('商品数据异常', 400);
    
    const amount = firstDefined(g.amount, g.points);
    if ((user.points || 0) < amount) return R.fail('积分不足', 400);

    const matchedTags = await getTagDefinitionsByAnyIds([tagId]);
    const targetTag = matchedTags[0] || null;
    if (!targetTag || !targetTag.isActive) return R.fail('标签不存在', 400);

    const normalizedTagId = String(firstDefined(targetTag.id, tagId));
    const userTags = await getUserOwnedTagsByUserIdentifiers([user._id, user.id]);
    const owned = userTags.find(item => String(item.tagId) === normalizedTagId && item.status === 'active');
    if (owned) return R.fail('已拥有该标签', 400);

    await db.collection(COL.USER_TAGS).add({
      data: {
        user_id: user._id,
        tag_id: normalizedTagId,
        obtain_method: 'redeem',
        obtain_source_id: g._id,
        status: 'active',
        obtained_at: now(),
        expires_at: null,
        created_at: now(),
        updated_at: now()
      }
    });
    await db.collection(COL.USER).doc(user._id).update({ data: { points: (user.points || 0) - amount } });
    await db.collection(COL.GOODS).doc(g._id).update({ data: { stock: g.stock - 1 } });
    return R.ok(true);
  },

  async 'task.batchAdd'(_, payload) {
    await Promise.all((payload.list || []).map(item => db.collection(COL.TASK).add({ data: { ...item, createTime: now(), updateTime: now() } })));
    return R.ok(true);
  },

  async 'task.list'(_, __, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    console.log('[task.list] User:', user._id);
    const [recordRes, taskRes] = await Promise.all([
      db.collection(COL.TASK_RECORD).where({ userId: user._id }).orderBy('createTime', 'desc').get(),
      db.collection(COL.TASK).get()
    ]);
    const tasks = taskRes.data || [];
    const taskById = new Map(tasks.map(task => [String(task._id), task]));
    const records = (recordRes.data || []).filter(record => {
      const task = taskById.get(String(record.taskFeatId));
      if (Number(task?.type) !== 0) return true;
      return isRecordInDailyTaskWindow(record);
    });
    console.log('[task.list] Records found:', records.length);

    const taskMap = new Map(tasks.map(t => [String(t._id), t]));

    return R.ok(records.map(i => {
      const task = taskMap.get(String(i.taskFeatId)) || {};
      return {
        ...task,
        ...i,
        id: i._id,
        taskId: String(i.taskFeatId || task._id || ''),
        type: firstDefined(task.type, i.type, 0),
        name: firstDefined(task.name, i.taskFeatName),
        taskFeatName: firstDefined(i.taskFeatName, task.name),
        taskFeatDesc: firstDefined(i.taskFeatDesc, task.taskFeatDesc, task.task_feat_desc, task.description, ''),
        points: Number(firstDefined(i.points, task.points, 0)) || 0,
        completed: true,
        progress: 100
      };
    }));
  },

  async 'task.receive'(event, payload, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    // 兼容多种入参：
    // - payload.recordId: 任务记录ID
    // - payload.id: 可能是任务记录ID，也可能是任务ID
    let recordData = null;

    const candidateIds = [payload.recordId, payload.id].filter(Boolean).map(v => String(v));

    // 1) 先把候选ID当作记录ID尝试（兼容 normalizeCloudPayload 把 id 映射到 recordId 的场景）
    for (const recordId of candidateIds) {
      const record = await db.collection(COL.TASK_RECORD).doc(recordId).get().catch(() => null);
      if (record?.data && String(record.data.userId) === String(user._id)) {
        recordData = record.data;
        break;
      }
    }

    // 2) 若仍未命中，把候选ID当作任务ID，通过 taskFeatId 反查记录
    if (!recordData) {
      for (const taskId of candidateIds) {
        const taskRes = await db.collection(COL.TASK).doc(taskId).get().catch(() => null);
        const task = taskRes?.data || null;
        const where = { userId: user._id, taskFeatId: taskId };
        if (task && Number(task.type) === 0) {
          const { start, end } = getDailyTaskRefreshWindow();
          where.createTime = _.gte(start).and(_.lt(end));
        }

        const existed = await db.collection(COL.TASK_RECORD)
          .where(where)
          .orderBy('createTime', 'desc')
          .limit(1)
          .get();
        if (existed.data && existed.data.length) {
          recordData = existed.data[0];
          break;
        }
      }
    }

    // 3) 若仍无记录：把候选ID当作任务ID，任务达标则补建记录
    if (!recordData) {
      for (const taskId of candidateIds) {
        const taskRes = await db.collection(COL.TASK).doc(taskId).get().catch(() => null);
        const task = taskRes?.data || null;
        if (!task) continue;

        const { completed } = await calculateTaskProgress(user._id, task);
        if (!completed) return R.fail('任务未达成，暂不可领取', 400);

        const addRes = await db.collection(COL.TASK_RECORD).add({
          data: {
            userId: user._id,
            taskFeatId: task._id,
            taskFeatName: task.name,
            points: task.points,
            tagId: task.tagId || null,
            received: false,
            taskFeatDesc: task.taskFeatDesc || '',
            createTime: now()
          }
        });

        recordData = {
          _id: addRes._id,
          userId: user._id,
          taskFeatId: task._id,
          points: task.points,
          received: false
        };
        break;
      }
    }

    if (!recordData) return R.fail('记录不存在', 400);
    if (recordData.received) return R.ok(true);

    await db.collection(COL.TASK_RECORD).doc(recordData._id).update({ data: { received: true } });
    await db.collection(COL.USER).doc(user._id).update({ data: { points: (user.points || 0) + (recordData.points || 0) } });
    return R.ok(true);
  },

  async 'task.unfinish'(_, __, wxContext) {
    const user = await getLoginUserOrThrow(wxContext.OPENID);
    console.log('[task.unfinish] User:', user._id);
    const [taskRes, recordRes] = await Promise.all([
      db.collection(COL.TASK).get(),
      db.collection(COL.TASK_RECORD).where({ userId: user._id }).get()
    ]);
    console.log('[task.unfinish] All tasks:', taskRes.data.length);
    console.log('[task.unfinish] User records:', recordRes.data.length);

    // 使用 Set 存储已完成的任务 ID (String 类型)
    const taskById = new Map((taskRes.data || []).map(task => [String(task._id), task]));
    const done = new Set((recordRes.data || [])
      .filter(record => {
        const task = taskById.get(String(record.taskFeatId));
        if (Number(task?.type) !== 0) return true;
        return isRecordInDailyTaskWindow(record);
      })
      .map(r => String(r.taskFeatId)));
    
    // 过滤出未完成的任务 (比较时确保 ID 类型一致)
    const list = taskRes.data.filter(t => !done.has(String(t._id))).sort((a, b) => (a.sort || 0) - (b.sort || 0));
    console.log('[task.unfinish] Unfinished tasks count:', list.length);

    // 计算每个未完成任务的进度
    const listWithProgress = await Promise.all(list.map(async t => {
      const { currentCount, targetCount, progress, completed } = await calculateTaskProgress(user._id, t);
      // 如果计算结果显示已完成（例如累积型任务已达标但未领奖），则将其标记为 completed
      // 但注意：客户端通常在 task.unfinish 列表中根据 isCompleted 来区分显示
      // 如果这里 completed 为 true，客户端可能会显示“可领取”按钮
      return { 
        ...t, 
        id: t._id, 
        currentCount, 
        targetCount, 
        progress,
        isCompleted: completed, // 显式传递 isCompleted 给前端
        taskFeatDesc: firstDefined(t.taskFeatDesc, t.task_feat_desc, t.description, t.desc, '')
      };
    }));

    // 打印部分日志以供调试
    if (listWithProgress.length > 0) {
      console.log('[task.unfinish] Sample task progress:', JSON.stringify(listWithProgress[0]));
    }

    return R.ok(listWithProgress);
  },


  async 'gear.search'(_, payload) {
    const keyword = String(payload.keyword || '').trim();
    const type = String(payload.type || '').trim();

    if (!keyword) return R.fail('缺少关键词', 400);
    if (keyword.length > 30) return R.fail('关键词过长', 400);

    const typeToCollection = {
      reel: COL.RATE_REEL,
      rod: COL.RATE_ROD,
      lure: COL.RATE_LURE
    };

    const collectionName = typeToCollection[type];
    if (!collectionName) return R.fail('无效的装备类型', 400);

    const where = {
      model: db.RegExp({ regexp: keyword, options: 'i' })
    };

    const { data } = await db.collection(collectionName)
      .where(where)
      .orderBy('id', 'asc')
      .limit(100)
      .get();

    return R.ok(data || []);
  },

  async 'gear.list'(_, payload) {
    const category = payload.category || payload.type;
    const rateList = await loadRateGearByCategory(category);

    if (rateList.length) {
      // Optimize payload size: project only necessary fields for list view
      const liteList = rateList.map(item => ({
        id: String(item.sourceId),
        brand_id: item.brand_id,
        brand_name: item.brand_name,
        model: item.model,
        type: item.type,
        subType: item.subType,
        variants: (item.variants || []).map(v => ({
          images: v.images // Only keep images for thumbnail display
        }))
      }));
      return R.ok(liteList);
    }

    const query = category ? { category: normalizeGearCategory(category) } : {};
    const { data } = await db.collection(COL.GEAR_ITEM).where(query).limit(1000).get();
    return R.ok(data.map(item => ({ ...item, id: item._id, sourceId: item.id || null })));
  },

  async 'gear.detail'(_, payload) {
    const id = payload.id;
    const category = payload.category || payload.type;
    if (!id) return R.fail('缺少参数 id', 400);

    const rateList = await loadRateGearByCategory(category);
    const rateItem = rateList.find(item => String(item.sourceId) === String(id));
    if (rateItem) {
      return R.ok({ ...rateItem, id: String(rateItem.sourceId) });
    }

    const res = await db.collection(COL.GEAR_ITEM).doc(id).get().catch(() => null);
    if (!res || !res.data) return R.fail('装备不存在', 404);

    return R.ok({ ...res.data, id: res.data._id, sourceId: res.data.id || null });
  }
};

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const action = event?.action;
  if (!action || !handlers[action]) return R.fail(`未支持的 action: ${action}`, 404);

  try {
    return await handlers[action](event, event?.payload || {}, wxContext, context);
  } catch (error) {
    return R.fail(error.message || '服务器异常');
  }
};
