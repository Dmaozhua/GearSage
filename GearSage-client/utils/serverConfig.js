const EnvUtil = require('./env.js');

const STORAGE_KEY = 'apiServerTarget';

const SERVER_TARGETS = {
  local: {
    key: 'local',
    label: '本机服务器',
    baseUrl: 'http://127.0.0.1:3001'
  },
  remote: {
    key: 'remote',
    label: '外网服务器',
    baseUrl: 'https://api.gearsage.club'
  }
};

function getDefaultTargetKey() {
  return EnvUtil.isDevTool() ? 'local' : 'remote';
}

function canUseStorage() {
  return typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function';
}

function normalizeTargetKey(value) {
  if (typeof value !== 'string') {
    return getDefaultTargetKey();
  }
  const key = value.trim().toLowerCase();
  return SERVER_TARGETS[key] ? key : getDefaultTargetKey();
}

function getCurrentTargetKey() {
  if (!canUseStorage()) {
    return getDefaultTargetKey();
  }
  return normalizeTargetKey(wx.getStorageSync(STORAGE_KEY));
}

function getCurrentTarget() {
  return SERVER_TARGETS[getCurrentTargetKey()];
}

function setCurrentTarget(targetKey) {
  const nextKey = normalizeTargetKey(targetKey);
  if (canUseStorage()) {
    wx.setStorageSync(STORAGE_KEY, nextKey);
  }
  return SERVER_TARGETS[nextKey];
}

function clearCurrentTarget() {
  if (canUseStorage() && typeof wx.removeStorageSync === 'function') {
    wx.removeStorageSync(STORAGE_KEY);
  }
  return getCurrentTarget();
}

function getBaseUrl() {
  return getCurrentTarget().baseUrl;
}

function getTargetOptions() {
  return Object.values(SERVER_TARGETS).map(item => ({ ...item }));
}

module.exports = {
  STORAGE_KEY,
  getDefaultTargetKey,
  getCurrentTargetKey,
  getCurrentTarget,
  setCurrentTarget,
  clearCurrentTarget,
  getBaseUrl,
  getTargetOptions
};
