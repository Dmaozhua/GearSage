/**
 * Image signature and similarity utilities.
 */

const {
  normalizeImagePathInput,
  resolveProcessableImagePath
} = require('./imageUploadUtils');

const getWxImageInfo = (src) => {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: resolve,
      fail: reject
    });
  });
};

const getWxFileInfo = (filePath) => {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().getFileInfo({
      filePath,
      success: resolve,
      fail: reject
    });
  });
};

const toSizeRange = (size) => {
  const sizeKB = Math.round((size || 0) / 1024);
  return Math.floor(sizeKB / 10) * 10;
};

/**
 * Calculate a coarse image signature for dedupe/similarity checks.
 * Falls back to size-only signature when image metadata can't be parsed.
 */
const calculateImageSignature = async (inputPath) => {
  const normalizedInputPath = normalizeImagePathInput(inputPath);
  if (!normalizedInputPath) {
    throw new Error('invalid image path for signature');
  }

  const processablePath = await resolveProcessableImagePath(normalizedInputPath);

  try {
    const [imageInfo, fileInfo] = await Promise.all([
      getWxImageInfo(processablePath),
      getWxFileInfo(processablePath).catch(() => ({ size: 0 }))
    ]);

    const width = imageInfo.width || 0;
    const height = imageInfo.height || 0;
    const size = fileInfo.size || 0;
    const aspectRatio = width > 0 && height > 0
      ? Math.round((width / height) * 1000) / 1000
      : 0;

    return {
      width,
      height,
      aspectRatio,
      sizeRange: toSizeRange(size),
      originalSize: size
    };
  } catch (imageError) {
    console.warn('[ImageSignature] getImageInfo failed, fallback to size-only signature:', imageError);

    const fileInfo = await getWxFileInfo(processablePath).catch(() => ({ size: 0 }));
    const size = fileInfo.size || 0;

    return {
      width: 0,
      height: 0,
      aspectRatio: 0,
      sizeRange: toSizeRange(size),
      originalSize: size
    };
  }
};

/**
 * Compare two signatures and determine if they are similar.
 */
const isSignatureSimilar = (sig1, sig2) => {
  if (!sig1 || !sig2) {
    return false;
  }

  const hasValidDims1 = sig1.width > 0 && sig1.height > 0;
  const hasValidDims2 = sig2.width > 0 && sig2.height > 0;

  // 1) exact dimensions match
  if (hasValidDims1 && hasValidDims2 && sig1.width === sig2.width && sig1.height === sig2.height) {
    return true;
  }

  // 2) near dimensions + similar aspect ratio
  if (hasValidDims1 && hasValidDims2 && Math.abs(sig1.aspectRatio - sig2.aspectRatio) < 0.01) {
    const widthDiff = Math.abs(sig1.width - sig2.width) / Math.max(sig1.width, sig2.width);
    const heightDiff = Math.abs(sig1.height - sig2.height) / Math.max(sig1.height, sig2.height);

    if (widthDiff <= 0.1 && heightDiff <= 0.1) {
      return true;
    }
  }

  // 3) same size bucket + close aspect ratio
  if (sig1.sizeRange > 0 && sig1.sizeRange === sig2.sizeRange) {
    if (sig1.aspectRatio > 0 && sig2.aspectRatio > 0 && Math.abs(sig1.aspectRatio - sig2.aspectRatio) < 0.05) {
      return true;
    }
  }

  return false;
};

/**
 * Check whether any existing signature is similar to new signature.
 */
const checkSimilarImages = (newSignature, existingSignatures) => {
  if (!newSignature || !existingSignatures) {
    return false;
  }

  const existingSignatureList = Object.values(existingSignatures || {});
  for (let i = 0; i < existingSignatureList.length; i++) {
    if (isSignatureSimilar(newSignature, existingSignatureList[i])) {
      return true;
    }
  }

  return false;
};

module.exports = {
  calculateImageSignature,
  isSignatureSimilar,
  checkSimilarImages
};
