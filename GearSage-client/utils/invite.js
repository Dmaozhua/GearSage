const PENDING_INVITE_STORAGE_KEY = 'pending_invite_v1';

function normalizeText(value, fallback = '') {
  if (value === null || typeof value === 'undefined') {
    return fallback;
  }

  const text = String(value).trim();
  return text || fallback;
}

function getCurrentUser() {
  try {
    return wx.getStorageSync('userInfo') || {};
  } catch (error) {
    return {};
  }
}

function buildInviteCode(userId = '') {
  const normalized = normalizeText(userId, '').replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  if (!normalized) {
    return 'DYSHARE';
  }

  return `DY${normalized.slice(-6).padStart(6, '0')}`;
}

function buildInvitePayload(options = {}, userInfo = getCurrentUser()) {
  const inviterUid = normalizeText(options.inviterUid || userInfo.id || userInfo.userId, '');
  const inviterName = normalizeText(options.inviterName || userInfo.nickname || userInfo.nickName, '');
  const inviteCode = normalizeText(options.inviteCode, buildInviteCode(inviterUid));

  return {
    inviteCode,
    inviterUid,
    inviterName
  };
}

function buildInvitePath(payload = {}) {
  const inviteCode = encodeURIComponent(normalizeText(payload.inviteCode, 'DYSHARE'));
  const inviterUid = encodeURIComponent(normalizeText(payload.inviterUid, ''));
  const inviterName = encodeURIComponent(normalizeText(payload.inviterName, ''));

  const query = [`inviteCode=${inviteCode}`];
  if (inviterUid) {
    query.push(`inviterUid=${inviterUid}`);
  }
  if (inviterName) {
    query.push(`inviterName=${inviterName}`);
  }

  return `/pages/invite/index?${query.join('&')}`;
}

function savePendingInvite(payload = {}) {
  const inviteCode = normalizeText(payload.inviteCode, '');
  const inviterUid = normalizeText(payload.inviterUid, '');

  if (!inviteCode && !inviterUid) {
    return null;
  }

  const record = {
    inviteCode,
    inviterUid,
    inviterName: normalizeText(payload.inviterName, ''),
    savedAt: Date.now()
  };

  try {
    wx.setStorageSync(PENDING_INVITE_STORAGE_KEY, record);
  } catch (error) {
    return record;
  }

  return record;
}

function getPendingInvite() {
  try {
    return wx.getStorageSync(PENDING_INVITE_STORAGE_KEY) || null;
  } catch (error) {
    return null;
  }
}

function clearPendingInvite() {
  try {
    wx.removeStorageSync(PENDING_INVITE_STORAGE_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  PENDING_INVITE_STORAGE_KEY,
  normalizeText,
  getCurrentUser,
  buildInviteCode,
  buildInvitePayload,
  buildInvitePath,
  savePendingInvite,
  getPendingInvite,
  clearPendingInvite
};
