// utils/imageUtils.js

const compressAndConvertToWebP = (tempFilePath, quality = 80) => {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: tempFilePath,
      quality,
      success: (compressRes) => {
        const compressedPath = compressRes.tempFilePath;
        convertToWebP(compressedPath)
          .then(webpPath => resolve(webpPath))
          .catch(() => resolve(compressedPath));
      },
      fail: (error) => reject(error)
    });
  });
};

const convertToWebP = (imagePath) => {
  return new Promise((resolve) => {
    try {
      wx.getImageInfo({
        src: imagePath,
        success: () => resolve(imagePath),
        fail: () => resolve(imagePath)
      });
    } catch (error) {
      resolve(imagePath);
    }
  });
};

const generateCloudPath = (prefix = 'avatar') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}/${timestamp}-${random}.jpg`;
};

module.exports = {
  compressAndConvertToWebP,
  convertToWebP,
  generateCloudPath
};