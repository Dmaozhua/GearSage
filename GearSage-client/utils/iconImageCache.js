const STORAGE_PREFIX = 'tagIconCache_';
const memoryCache = new Map();
const inflightCache = new Map();

function buildStorageKey(url = '') {
  return `${STORAGE_PREFIX}${String(url).replace(/[^a-zA-Z0-9]/g, '_')}`;
}

function isRemoteLike(url = '') {
  return /^(https?:|cloud:|\/)/.test(String(url || ''));
}

function getFileInfo(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager && wx.getFileSystemManager();
    if (fs && typeof fs.getFileInfo === 'function') {
      fs.getFileInfo({
        filePath,
        success: resolve,
        fail: reject
      });
      return;
    }

    wx.getFileInfo({
      filePath,
      success: resolve,
      fail: reject
    });
  });
}

async function isLocalFileAvailable(filePath = '') {
  if (!filePath) return false;
  try {
    await getFileInfo(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function downloadRemoteFile(url) {
  if (String(url).startsWith('cloud://')) {
    if (!(wx.cloud && typeof wx.cloud.downloadFile === 'function')) {
      return Promise.resolve('');
    }
    return wx.cloud.downloadFile({ fileID: url }).then(res => res.tempFilePath || '');
  }

  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
          resolve(res.tempFilePath);
          return;
        }
        reject(new Error(`download failed: ${res.statusCode}`));
      },
      fail: reject
    });
  });
}

function saveTempFile(tempFilePath) {
  return new Promise((resolve) => {
    wx.saveFile({
      tempFilePath,
      success: (res) => resolve(res.savedFilePath || tempFilePath),
      fail: () => resolve(tempFilePath)
    });
  });
}

async function resolveStoredPath(url) {
  const mem = memoryCache.get(url);
  if (mem && await isLocalFileAvailable(mem)) {
    return mem;
  }

  const storageKey = buildStorageKey(url);
  const stored = wx.getStorageSync(storageKey);
  const storedPath = stored && stored.localPath ? stored.localPath : '';
  if (storedPath && await isLocalFileAvailable(storedPath)) {
    memoryCache.set(url, storedPath);
    return storedPath;
  }

  if (storedPath) {
    wx.removeStorageSync(storageKey);
  }

  return '';
}

async function cacheRemoteImage(url = '') {
  if (!url || !isRemoteLike(url)) return url;

  const cachedPath = await resolveStoredPath(url);
  if (cachedPath) return cachedPath;

  if (inflightCache.has(url)) {
    return inflightCache.get(url);
  }

  const task = (async () => {
    const tempFilePath = await downloadRemoteFile(url);
    if (!tempFilePath) return '';

    const localPath = await saveTempFile(tempFilePath);
    const finalPath = localPath || tempFilePath || url;

    memoryCache.set(url, finalPath);
    wx.setStorageSync(buildStorageKey(url), {
      url,
      localPath: finalPath,
      updatedAt: Date.now()
    });

    return finalPath;
  })().catch(() => '').finally(() => {
    inflightCache.delete(url);
  });

  inflightCache.set(url, task);
  return task;
}

module.exports = {
  cacheRemoteImage
};
