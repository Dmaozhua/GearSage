// utils/tempUrlManager.js
const serverConfig = require('./serverConfig.js');

/**
 * 临时链接管理工具类
 * 解决微信小程序云存储临时链接过期导致的403错误问题
 */
class TempUrlManager {
  constructor() {
    this.cachePrefix = 'tempUrl_';
    this.backgroundCachePrefix = 'tempUrl_bg_';
    this.localImageCachePrefix = 'tempUrl_local_';
    this.DEFAULT_EXPIRY = 60 * 60 * 1000; // 1小时（与腾讯云一致）
  }

  /**
   * 获取临时访问URL
   * @param {string} fileID - 云存储文件ID
   * @param {string} type - 图片类型 ('avatar' | 'background')
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<string>} 临时访问URL
   */
  async getTempUrl(fileID, type = 'avatar', forceRefresh = false) {
    try {
      if (!fileID) {
        console.warn(`[TempUrlManager] 无效的fileID: ${fileID}`);
        return this._getDefaultImage(type);
      }

      if (!fileID.startsWith('cloud://')) {
        if (this.shouldResolveUrl(fileID)) {
          return this._getLocalUploadTempUrl(fileID, type, forceRefresh);
        }
        return fileID;
      }

      if (!this._isCloudApiAvailable()) {
        console.warn(`[TempUrlManager] wx.cloud 不可用，跳过云资源转换: ${fileID}`);
        return this._handleErrorFallback(fileID, type);
      }

      console.log(`[TempUrlManager] 获取${type}临时URL, fileID:`, fileID);
      
      const cacheKey = this._getCacheKey(fileID, type);
      const cachedData = wx.getStorageSync(cacheKey);
      const now = Date.now();
      
      // 检查缓存有效性（有效期剩余10分钟以上）
      if (!forceRefresh && cachedData && cachedData.expireTime > now + 10 * 60 * 1000) {
        console.log(`[TempUrlManager] 使用缓存${type}链接（有效期至${new Date(cachedData.expireTime).toLocaleTimeString()}）`);
        return cachedData.tempUrl;
      }
      
      // 记录刷新原因
      this._logRefreshReason(cachedData, now, type, forceRefresh);
      
      // 获取新链接
      const tempUrlRes = await wx.cloud.getTempFileURL({ fileList: [fileID] });
      
      if (tempUrlRes.fileList?.[0]?.tempFileURL) {
        const tempUrl = tempUrlRes.fileList[0].tempFileURL;
        console.log(`[TempUrlManager] 获取${type}临时URL成功`);
        
        // 缓存新链接（1小时有效期）
        const cacheData = {
          tempUrl,
          expireTime: now + this.DEFAULT_EXPIRY,
          createTime: now,
          fileID,
          type
        };
        wx.setStorageSync(cacheKey, cacheData);
        
        return tempUrl;
      }
      
      throw new Error('获取临时访问链接失败');
    } catch (error) {
      console.error(`[TempUrlManager] 获取${type}临时URL失败:`, error);
      return this._handleErrorFallback(fileID, type);
    }
  }

  /**
   * 批量获取临时访问URL
   * @param {Array} fileList - 文件列表 [{fileID, type}]
   * @returns {Promise<Object>} 文件ID到URL的映射
   */
  async getBatchTempUrls(fileList) {
    const result = {};
    const needRefreshList = [];
    const now = Date.now();
    console.log('[TempUrlManager] 批量获取临时URL，请求文件数=', Array.isArray(fileList) ? fileList.length : 0);

    // 检查缓存
    for (const item of fileList) {
      const { fileID, type = 'avatar' } = item;
      if (!fileID) {
        result[fileID] = this._getDefaultImage(type);
        continue;
      }
      if (this.shouldResolveUrl(fileID)) {
        needRefreshList.push(item);
        continue;
      }
      if (!String(fileID).startsWith('cloud://')) {
        result[fileID] = fileID || this._getDefaultImage(type);
        continue;
      }

      if (!this._isCloudApiAvailable()) {
        result[fileID] = this._getDefaultImage(type);
        continue;
      }

      const cacheKey = this._getCacheKey(fileID, type);
      const cachedData = wx.getStorageSync(cacheKey);

      if (cachedData && cachedData.expireTime > now + 10 * 60 * 1000) {
        result[fileID] = cachedData.tempUrl;
      } else {
        needRefreshList.push(item);
      }
    }

    // 批量刷新需要更新的链接（按50个/批进行分批请求，避免超过云API限制）
    if (needRefreshList.length > 0) {
      try {
        const MAX_BATCH = 50;
        // 建立fileID到原始项的映射，便于按返回的fileID定位缓存类型
        const idToItemMap = new Map();
        needRefreshList.forEach(item => idToItemMap.set(item.fileID, item));
        console.log('[TempUrlManager] 缓存命中数量=', Object.keys(result).length, '需要刷新数量=', needRefreshList.length);

        const localUploadItems = needRefreshList.filter(item => this.shouldResolveUrl(item.fileID));
        const cloudItems = needRefreshList.filter(item => !this.shouldResolveUrl(item.fileID));

        if (localUploadItems.length) {
          const localResults = await Promise.all(localUploadItems.map(async (item) => {
            try {
              const tempUrl = await this._getLocalUploadTempUrl(item.fileID, item.type, false);
              return { fileID: item.fileID, tempUrl };
            } catch (error) {
              console.error('[TempUrlManager] 本地上传图转临时文件失败:', item.fileID, error);
              return { fileID: item.fileID, tempUrl: this._getDefaultImage(item.type) };
            }
          }));

          localResults.forEach((item) => {
            result[item.fileID] = item.tempUrl;
          });
        }

        if (!cloudItems.length) {
          return result;
        }

        // 分批处理
        for (let i = 0; i < cloudItems.length; i += MAX_BATCH) {
          const batch = cloudItems.slice(i, i + MAX_BATCH);
          const batchFileIDs = batch.map(b => b.fileID);
          const batchIndex = Math.floor(i / MAX_BATCH) + 1;
          console.log(`[TempUrlManager] 发起批次 ${batchIndex} 请求，文件数=${batchFileIDs.length}`);

          // 发起当前批次请求
          const tempUrlRes = await wx.cloud.getTempFileURL({ fileList: batchFileIDs });

          if (tempUrlRes && Array.isArray(tempUrlRes.fileList)) {
            console.log(`[TempUrlManager] 批次 ${batchIndex} 返回条目数=`, tempUrlRes.fileList.length);
            tempUrlRes.fileList.forEach(urlItem => {
              const fileID = urlItem.fileID;
              const originalItem = idToItemMap.get(fileID);
              if (!originalItem) return;

              if (urlItem.tempFileURL) {
                const cacheKey = this._getCacheKey(originalItem.fileID, originalItem.type);
                // 缓存新链接
                const cacheData = {
                  tempUrl: urlItem.tempFileURL,
                  expireTime: now + this.DEFAULT_EXPIRY,
                  createTime: now,
                  fileID: originalItem.fileID,
                  type: originalItem.type
                };
                wx.setStorageSync(cacheKey, cacheData);

                result[originalItem.fileID] = urlItem.tempFileURL;
              } else {
                // 返回条目无URL，回退默认图
                result[originalItem.fileID] = this._getDefaultImage(originalItem.type);
              }
            });
          }
        }
      } catch (error) {
        console.error('[TempUrlManager] 批量获取临时URL失败:', error);
        // 为失败的项目设置默认图片
        needRefreshList.forEach(item => {
          result[item.fileID] = this._getDefaultImage(item.type);
        });
      }
    }

    return result;
  }

  /**
   * 后台静默刷新所有有效链接
   */
  async silentRefreshAll() {
    try {
      console.log('[TempUrlManager] 后台静默刷新所有链接');
      const storage = wx.getStorageInfoSync();
      const now = Date.now();
      
      for (const key of storage.keys) {
        if (key.startsWith(this.cachePrefix) || key.startsWith(this.backgroundCachePrefix)) {
          const cachedData = wx.getStorageSync(key);
          
          if (cachedData?.expireTime > now) {
            try {
              await this.getTempUrl(cachedData.fileID, cachedData.type, true);
              console.log(`[TempUrlManager] 静默刷新成功: ${cachedData.fileID}`);
            } catch (e) {
              console.warn(`[TempUrlManager] 静默刷新失败: ${cachedData.fileID}`, e);
            }
          }
        }
      }
    } catch (error) {
      console.error('[TempUrlManager] 静默刷新出错:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache() {
    try {
      const storage = wx.getStorageInfoSync();
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const key of storage.keys) {
        if (key.startsWith(this.cachePrefix) || key.startsWith(this.backgroundCachePrefix)) {
          const cachedData = wx.getStorageSync(key);
          
          if (!cachedData || cachedData.expireTime <= now) {
            wx.removeStorageSync(key);
            cleanedCount++;
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`[TempUrlManager] 清理过期缓存 ${cleanedCount} 条`);
      }
    } catch (error) {
      console.error('[TempUrlManager] 清理缓存失败:', error);
    }
  }

  /**
   * 清理用户相关缓存
   * @param {string} userId - 用户ID
   */
  cleanUserCache(userId) {
    try {
      const storage = wx.getStorageInfoSync();
      let cleanedCount = 0;
      
      for (const key of storage.keys) {
        if ((key.startsWith(this.cachePrefix) || key.startsWith(this.backgroundCachePrefix)) && 
            key.includes(userId)) {
          wx.removeStorageSync(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`[TempUrlManager] 清理用户${userId}缓存 ${cleanedCount} 条`);
      }
    } catch (error) {
      console.error('[TempUrlManager] 清理用户缓存失败:', error);
    }
  }

  // --- 私有方法 ---

  shouldResolveUrl(url) {
    return this._isLocalUploadUrl(url) || this._shouldRewriteStaticUploadUrl(url);
  }
  
  /**
   * 生成缓存键
   */
  _getCacheKey(fileID, type) {
    const prefix = type === 'background' ? this.backgroundCachePrefix : this.cachePrefix;
    return `${prefix}${fileID.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  _getLocalCacheKey(url) {
    return `${this.localImageCachePrefix}${String(url || '').replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  _isCloudApiAvailable() {
    return !!(wx.cloud && typeof wx.cloud.getTempFileURL === 'function');
  }

  _isLocalUploadUrl(url) {
    return /^http:\/\/127\.0\.0\.1(?::\d+)?\/uploads\//i.test(String(url || ''));
  }

  _isStaticUploadUrl(url) {
    return /^https:\/\/static\.gearsage\.club\/gearsage\//i.test(String(url || ''));
  }

  _shouldRewriteStaticUploadUrl(url) {
    return this._isStaticUploadUrl(url) && serverConfig.getCurrentTargetKey() === 'local';
  }

  _resolveDownloadUrl(url) {
    const rawUrl = String(url || '');
    if (this._shouldRewriteStaticUploadUrl(rawUrl)) {
      return rawUrl.replace(/^https:\/\/static\.gearsage\.club\/gearsage\//i, 'http://127.0.0.1:3001/uploads/');
    }
    return rawUrl;
  }

  async _getLocalUploadTempUrl(url, type = 'image', forceRefresh = false) {
    const cacheKey = this._getLocalCacheKey(url);
    const cachedData = wx.getStorageSync(cacheKey);
    const now = Date.now();

    if (!forceRefresh && cachedData && cachedData.expireTime > now + 10 * 60 * 1000 && cachedData.tempUrl) {
      return cachedData.tempUrl;
    }

    const downloadUrl = this._resolveDownloadUrl(url);

    const downloadRes = await new Promise((resolve, reject) => {
      wx.downloadFile({
        url: downloadUrl,
        success: resolve,
        fail: reject
      });
    });

    if (!(downloadRes && downloadRes.statusCode >= 200 && downloadRes.statusCode < 300 && downloadRes.tempFilePath)) {
      throw new Error(`download local upload failed: url=${downloadUrl}; status=${downloadRes && downloadRes.statusCode}`);
    }

    const cacheData = {
      tempUrl: downloadRes.tempFilePath,
      expireTime: now + this.DEFAULT_EXPIRY,
      createTime: now,
      fileID: url,
      type
    };
    wx.setStorageSync(cacheKey, cacheData);
    return downloadRes.tempFilePath;
  }

  /**
   * 记录刷新原因
   */
  _logRefreshReason(cachedData, now, type, forceRefresh) {
    if (forceRefresh) {
      console.log(`[TempUrlManager] 强制刷新${type}链接`);
    } else if (!cachedData) {
      console.log(`[TempUrlManager] 首次获取${type}链接`);
    } else if (cachedData.expireTime <= now) {
      console.log(`[TempUrlManager] ${type}链接已过期，过期时间: ${new Date(cachedData.expireTime).toLocaleTimeString()}`);
    } else {
      console.log(`[TempUrlManager] ${type}链接即将过期，剩余时间: ${Math.round((cachedData.expireTime - now) / 60000)}分钟`);
    }
  }

  /**
   * 错误回退处理
   */
  _handleErrorFallback(fileID, type) {
    // 尝试删除可能损坏的缓存
    const cacheKey = this._getCacheKey(fileID, type);
    wx.removeStorageSync(cacheKey);
    
    // 返回默认图片
    return this._getDefaultImage(type);
  }

  /**
   * 获取默认图片
   */
  _getDefaultImage(type) {
    return type === 'background' 
      ? '/images/缺省页_上传中.png'
      : '/images/default-avatar.png';
  }
}

// 单例导出
module.exports = new TempUrlManager();
