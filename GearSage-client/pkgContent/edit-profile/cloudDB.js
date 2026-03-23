// services/cloudDB.js

class CloudDBService {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    if (wx.cloud) {
      this.db = wx.cloud.database();
    } else {
      console.warn('云开发未初始化');
    }
  }

  getDB() {
    if (!this.db) {
      this.init();
    }
    return this.db;
  }

  async updateUserInfo(userId, updateData) {
    try {
      const db = this.getDB();
      const res = await db.collection('users').doc(userId).update({
        data: {
          ...updateData,
          updateTime: new Date()
        }
      });
      return res;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }

  async uploadFile(filePath, cloudPath) {
    try {
      const res = await wx.cloud.uploadFile({
        filePath,
        cloudPath
      });
      return res.fileID;
    } catch (error) {
      console.error('上传文件失败:', error);
      throw error;
    }
  }
}

module.exports = new CloudDBService();