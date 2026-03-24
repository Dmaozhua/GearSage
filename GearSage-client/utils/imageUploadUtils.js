// utils/imageUploadUtils.js

/**
 * Normalize any incoming image input into a usable path string.
 * Supports string path, chooseMedia tempFile object, and common custom object shapes.
 */
const normalizeImagePathInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/\\/g, '/');
  }

  if (input && typeof input === 'object') {
    const maybePath = input.tempFilePath || input.filePath || input.path || input.url || '';
    if (typeof maybePath === 'string') {
      return maybePath.trim().replace(/\\/g, '/');
    }
  }

  return '';
};

const isCloudFileID = (path) => /^cloud:\/\//i.test(path);
const isTempHttpPath = (path) => /^https?:\/\/tmp\//i.test(path);
const isRemoteHttpUrl = (path) => /^https?:\/\//i.test(path) && !isTempHttpPath(path);
const isWebPPath = (path) => /\.webp(?:\?|$)/i.test(path);

const getErrorMessage = (error) => {
  if (!error) return '';
  return error.errMsg || error.message || String(error);
};

const getWxImageInfo = (src) => {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: resolve,
      fail: reject
    });
  });
};

const getWxFileSize = (filePath) => {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().getFileInfo({
      filePath,
      success: (res) => resolve(res.size || 0),
      fail: reject
    });
  });
};

const downloadCloudFile = (fileID) => {
  return new Promise((resolve, reject) => {
    if (!wx.cloud || typeof wx.cloud.downloadFile !== 'function') {
      reject(new Error('wx.cloud.downloadFile is unavailable'));
      return;
    }

    wx.cloud.downloadFile({
      fileID,
      success: (res) => {
        if (res && res.tempFilePath) {
          resolve(res.tempFilePath);
          return;
        }
        reject(new Error('download cloud file failed: empty tempFilePath'));
      },
      fail: reject
    });
  });
};

const downloadHttpFile = (url) => {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      success: (res) => {
        if (res && res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
          resolve(res.tempFilePath);
          return;
        }
        reject(new Error(`download http file failed: status=${res && res.statusCode}`));
      },
      fail: reject
    });
  });
};

/**
 * Resolve cloud/http/image object into a processable local temp file path.
 */
const resolveProcessableImagePath = async (inputPath) => {
  const normalizedPath = normalizeImagePathInput(inputPath);
  if (!normalizedPath) {
    throw new Error('invalid image path');
  }

  if (isCloudFileID(normalizedPath)) {
    return downloadCloudFile(normalizedPath);
  }

  if (isRemoteHttpUrl(normalizedPath)) {
    return downloadHttpFile(normalizedPath);
  }

  return normalizedPath;
};

/**
 * Get image information safely.
 * @param {string|Object} src image path/object
 * @returns {Promise<{width:number,height:number,size:number,type:string,orientation:string,path:string}>}
 */
const getImageInfo = async (src) => {
  const processablePath = await resolveProcessableImagePath(src);

  let imageInfo;
  try {
    imageInfo = await getWxImageInfo(processablePath);
  } catch (firstError) {
    // Retry once without query string if URL-like local paths contain params.
    const plainPath = processablePath.split('?')[0];
    if (plainPath && plainPath !== processablePath) {
      imageInfo = await getWxImageInfo(plainPath);
    } else {
      throw firstError;
    }
  }

  let fileSize = 0;
  try {
    fileSize = await getWxFileSize(processablePath);
  } catch (fileSizeError) {
    console.warn('[ImageUtils] getFileInfo failed:', getErrorMessage(fileSizeError));
  }

  return {
    width: imageInfo.width || 0,
    height: imageInfo.height || 0,
    size: fileSize,
    type: imageInfo.type,
    orientation: imageInfo.orientation,
    path: processablePath
  };
};

/**
 * Smart image compression.
 * @param {string|Object} inputPath local/cloud/http image path
 * @param {Object} _unusedImageInfo reserved compatibility arg
 * @param {Object} options optional override: { quality, maxWidth }
 */
const smartCompressImage = async (inputPath, _unusedImageInfo, options = {}) => {
  const normalizedInputPath = normalizeImagePathInput(inputPath);
  if (!normalizedInputPath) {
    console.warn('[ImageUtils] invalid image path, skip compression:', inputPath);
    return inputPath;
  }

  let processablePath = normalizedInputPath;
  try {
    processablePath = await resolveProcessableImagePath(normalizedInputPath);
  } catch (resolveError) {
    console.warn('[ImageUtils] resolve path failed, fallback to original:', getErrorMessage(resolveError));
  }

  try {
    const app = getApp();
    const globalConfig = app ? app.globalData.imageUploadConfig || {} : {};

    let width = 0;
    let size = 0;
    const skipImageInfoProbe = isWebPPath(processablePath);
    if (!skipImageInfoProbe) {
      try {
        const imageInfo = await getImageInfo(processablePath);
        width = imageInfo.width || 0;
        size = imageInfo.size || 0;
      } catch (imageInfoError) {
        // getImageInfo can fail on some special image formats/paths in mini-program runtime.
        // We still try to compress/upload with safe defaults instead of aborting.
        console.warn('[ImageUtils] getImageInfo failed, fallback to default compression:', {
          path: processablePath,
          error: getErrorMessage(imageInfoError)
        });
      }
    } else {
      console.log('[ImageUtils] skip getImageInfo probe for webp source:', processablePath);
    }

    let quality = Number(options.quality) > 0
      ? options.quality
      : (globalConfig.compressionQuality || 80);

    let targetWidth = Number(width) > 0 ? width : undefined;

    if (size > 2 * 1024 * 1024) {
      quality = Number(options.quality) > 0 ? options.quality : 60;
      targetWidth = Math.min(width || 1200, options.maxWidth || globalConfig.maxWidth || 1200);
    } else if (size > 500 * 1024) {
      quality = Number(options.quality) > 0 ? options.quality : 75;
      targetWidth = Math.min(width || 1500, options.maxWidth || globalConfig.maxWidth || 1500);
    } else if (Number(options.maxWidth) > 0) {
      targetWidth = Math.min(width || options.maxWidth, options.maxWidth);
    }

    return await new Promise((resolve) => {
      const compressOptions = {
        src: processablePath,
        quality,
        success: (res) => {
          console.log('[ImageUtils] compress success:', res.tempFilePath);
          resolve(res.tempFilePath);
        },
        fail: (error) => {
          console.error('[ImageUtils] compress failed, fallback original:', error);
          resolve(processablePath);
        }
      };

      if (Number(targetWidth) > 0) {
        compressOptions.compressedWidth = targetWidth;
      }

      wx.compressImage(compressOptions);
    });
  } catch (error) {
    console.error('[ImageUtils] smart compression error:', error);
    return processablePath;
  }
};

/**
 * WebP support check.
 */
const compareVersion = (v1, v2) => {
  const arr1 = String(v1 || '').split('.').map((n) => Number(n) || 0);
  const arr2 = String(v2 || '').split('.').map((n) => Number(n) || 0);

  for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
    const n1 = arr1[i] || 0;
    const n2 = arr2[i] || 0;
    if (n1 !== n2) return n1 - n2;
  }
  return 0;
};

const checkWebPSupport = () => {
  const { SDKVersion } = wx.getSystemInfoSync();
  return compareVersion(SDKVersion, '2.10.0') >= 0;
};

const buildUploadPath = (prefix) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const ext = 'jpg';

  if (typeof prefix === 'string' && /\.(jpg|jpeg|png|webp|gif)$/i.test(prefix)) {
    return prefix;
  }

  const finalPrefix = prefix || 'posts';
  return `${finalPrefix}/${timestamp}-${random}.${ext}`;
};

/**
 * Upload local image file to standalone backend.
 * @param {string|Object} filePath
 * @param {string} prefix
 * @returns {Promise<string>} remote file url
 */
const uploadToBackend = async (filePath, prefix = 'posts') => {
  const api = require('../services/api.js');
  const normalizedInputPath = normalizeImagePathInput(filePath);
  if (!normalizedInputPath) {
    throw new Error('upload file path is empty');
  }

  if (isCloudFileID(normalizedInputPath) || isRemoteHttpUrl(normalizedInputPath)) {
    return normalizedInputPath;
  }

  const uploadFilePath = await resolveProcessableImagePath(normalizedInputPath);
  const normalizedPrefix = String(prefix || 'posts').toLowerCase();
  const endpointMap = {
    avatar: '/upload/avatar',
    background: '/upload/background'
  };
  const endpoint = endpointMap[normalizedPrefix] || '/upload/image';
  const uploadRes = await api.uploadFile(uploadFilePath, {
    bizType: normalizedPrefix,
    objectKeyHint: buildUploadPath(prefix)
  }, endpoint);
  return uploadRes && uploadRes.url ? uploadRes.url : '';
};

const uploadToCloud = (...args) => uploadToBackend(...args);

class UploadQueue {
  constructor(maxConcurrent = 3) {
    this.queue = [];
    this.activeCount = 0;
    this.maxConcurrent = maxConcurrent;
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.run();
    });
  }

  run() {
    while (this.activeCount < this.maxConcurrent && this.queue.length) {
      const { task, resolve, reject } = this.queue.shift();
      this.activeCount++;

      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.activeCount--;
          this.run();
        });
    }
  }
}

/**
 * Batch upload images.
 */
const batchUploadImages = async (imagePaths, prefix = 'posts', options = {}) => {
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
    return [];
  }

  const app = getApp();
  const globalConfig = app ? app.globalData.imageUploadConfig || {} : {};

  const uploadOptions = {
    maxConcurrent: options.maxConcurrent || globalConfig.maxConcurrent || 3,
    compressionQuality: options.compressionQuality || globalConfig.compressionQuality || 75,
    ...options
  };

  const uploadQueue = new UploadQueue(uploadOptions.maxConcurrent);
  const orderedFileIDs = new Array(imagePaths.length).fill(null);

  const tasks = imagePaths.map((item, index) => {
    return uploadQueue.add(async () => {
      const normalizedPath = normalizeImagePathInput(item);
      if (!normalizedPath) {
        console.warn(`[ImageUtils] skip invalid image path at index ${index}`);
        return null;
      }

      try {
        wx.showLoading({
          title: `上传图片 ${index + 1}/${imagePaths.length}`,
          mask: true
        });

        const compressedPath = await smartCompressImage(normalizedPath, null, {
          quality: uploadOptions.compressionQuality
        });

        const fileID = await uploadToBackend(compressedPath, prefix);
        orderedFileIDs[index] = fileID;
        return fileID;
      } catch (error) {
        console.error(`[ImageUtils] image ${index + 1} upload failed:`, error);
        return null;
      }
    });
  });

  await Promise.all(tasks);
  wx.hideLoading();
  return orderedFileIDs.filter((id) => id !== null);
};

const generateUploadPath = (prefix = 'posts') => {
  return buildUploadPath(prefix);
};

const generateCloudPath = (prefix = 'posts') => generateUploadPath(prefix);

/**
 * Choose images and upload.
 */
const chooseAndUploadImages = async (options = {}) => {
  const app = getApp();
  const globalConfig = app ? app.globalData.imageUploadConfig || {} : {};

  const defaultOptions = {
    count: 9,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    prefix: 'posts',
    maxConcurrent: globalConfig.maxConcurrent || 3,
    showLoading: true
  };

  const chooseOptions = { ...defaultOptions, ...options };

  try {
    if (chooseOptions.showLoading) {
      wx.showLoading({ title: '选择图片中...', mask: true });
    }

    const res = await wx.chooseMedia({
      count: chooseOptions.count,
      mediaType: ['image'],
      sizeType: chooseOptions.sizeType,
      sourceType: chooseOptions.sourceType
    });

    if (!res.tempFiles || !res.tempFiles.length) {
      if (chooseOptions.showLoading) wx.hideLoading();
      return [];
    }

    const imagePaths = res.tempFiles.map((file) => normalizeImagePathInput(file.tempFilePath)).filter(Boolean);

    if (chooseOptions.showLoading) {
      wx.showLoading({ title: '准备上传...', mask: true });
    }

    const fileIDs = await batchUploadImages(imagePaths, chooseOptions.prefix, {
      maxConcurrent: chooseOptions.maxConcurrent
    });

    if (chooseOptions.showLoading) wx.hideLoading();
    return fileIDs;
  } catch (error) {
    console.error('[ImageUtils] choose or upload failed:', error);
    if (chooseOptions.showLoading) wx.hideLoading();

    wx.showToast({
      title: '图片上传失败',
      icon: 'none'
    });

    return [];
  }
};

/**
 * Upload known temp file path list.
 */
const uploadImages = async (tempFilePaths, options = {}) => {
  const { prefix = 'posts', showLoading = true } = options;

  if (showLoading) {
    wx.showLoading({ title: '上传中...', mask: true });
  }

  try {
    const fileIDs = await batchUploadImages(tempFilePaths, prefix, options);
    if (showLoading) {
      wx.hideLoading();
    }
    return fileIDs;
  } catch (error) {
    if (showLoading) {
      wx.hideLoading();
    }
    throw error;
  }
};

module.exports = {
  smartCompressImage,
  getImageInfo,
  checkWebPSupport,
  uploadToBackend,
  uploadToCloud,
  batchUploadImages,
  uploadImages,
  chooseAndUploadImages,
  generateUploadPath,
  generateCloudPath,
  normalizeImagePathInput,
  resolveProcessableImagePath
};
