// utils/imageUtils.js

/**
 * 图片处理工具函数
 */

/**
 * 压缩图片（原本设计为同时转换为WebP格式，但由于微信小程序API限制，现在只进行压缩）
 * @param {string} tempFilePath 临时文件路径
 * @param {number} quality 压缩质量(0-100)
 * @returns {Promise<string>} 压缩后的临时文件路径
 */
const compressAndConvertToWebP = (tempFilePath, quality = 80) => {
  return new Promise((resolve, reject) => {
    // 先压缩图片
    wx.compressImage({
      src: tempFilePath,
      quality,
      success: (compressRes) => {
        const compressedPath = compressRes.tempFilePath;
        console.log('图片压缩成功:', compressedPath);
        
        // 使用canvas将图片转换为WebP格式
        convertToWebP(compressedPath)
          .then(webpPath => {
            console.log('转换为WebP格式成功:', webpPath);
            resolve(webpPath);
          })
          .catch(error => {
            console.error('转换为WebP格式失败:', error);
            // 如果转换失败，至少返回压缩后的图片
            resolve(compressedPath);
          });
      },
      fail: (error) => {
        console.error('图片压缩失败:', error);
        reject(error);
      }
    });
  });
};

/**
 * 原本设计为将图片转换为WebP格式，但由于微信小程序API限制，现在直接返回原图
 * @param {string} imagePath 图片路径
 * @returns {Promise<string>} 原始图片路径
 */
const convertToWebP = (imagePath) => {
  return new Promise((resolve, reject) => {
    try {
      // 由于微信小程序环境限制，无法直接转换为WebP格式
      // 我们将使用普通的canvas绘制方法，然后导出为普通图片格式
      console.log('开始转换图片格式');
      
      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          const { width, height } = imageInfo;
          console.log('图片信息获取成功:', width, 'x', height);
          
          // 由于微信小程序环境限制，我们将直接返回压缩后的图片，不进行WebP转换
          console.log('微信小程序环境限制，跳过WebP转换，直接使用压缩后的图片');
          resolve(imagePath);
        },
        fail: (error) => {
          console.error('获取图片信息失败:', error);
          // 如果获取信息失败，返回原图
          resolve(imagePath);
        }
      });
    } catch (error) {
      console.error('图片转换过程中发生错误:', error);
      // 发生任何错误，返回原图
      resolve(imagePath);
    }
  });
};

/**
 * 生成云存储路径
 * @param {string} prefix 前缀
 * @returns {string} 云存储路径
 */
const generateCloudPath = (prefix = 'avatar') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  // 由于我们不再转换为WebP格式，使用jpg作为扩展名
  return `${prefix}/${timestamp}-${random}.jpg`;
};

module.exports = {
  compressAndConvertToWebP,
  convertToWebP,
  generateCloudPath
};