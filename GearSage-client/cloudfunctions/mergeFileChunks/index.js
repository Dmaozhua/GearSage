// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

/**
 * 合并文件分片
 * 接收参数：
 * - fileIDs: 分片文件ID数组
 * - cloudPath: 合并后的文件路径
 * 返回：
 * - fileID: 合并后的文件ID
 */
exports.main = async (event, context) => {
  const { fileIDs, cloudPath } = event;
  
  if (!fileIDs || !fileIDs.length || !cloudPath) {
    return {
      success: false,
      error: '参数错误：缺少fileIDs或cloudPath'
    };
  }
  
  try {
    console.log(`开始合并${fileIDs.length}个分片文件到${cloudPath}`);
    
    // 初始化云存储和数据库
    const storage = cloud.storage();
    
    // 下载所有分片
    const chunkBuffers = [];
    for (let i = 0; i < fileIDs.length; i++) {
      console.log(`下载分片${i+1}/${fileIDs.length}: ${fileIDs[i]}`);
      
      const result = await storage.downloadFile({
        fileID: fileIDs[i]
      });
      
      chunkBuffers.push(result.fileContent);
    }
    
    // 合并分片
    console.log('合并所有分片...');
    const mergedBuffer = Buffer.concat(chunkBuffers);
    
    // 上传合并后的文件
    console.log(`上传合并后的文件: ${cloudPath}`);
    const uploadResult = await storage.uploadFile({
      cloudPath,
      fileContent: mergedBuffer
    });
    
    // 删除分片文件
    console.log('清理分片文件...');
    const deletePromises = fileIDs.map(fileID => {
      return storage.deleteFile({
        fileList: [fileID]
      });
    });
    
    await Promise.all(deletePromises);
    
    console.log('文件合并完成:', uploadResult.fileID);
    return {
      success: true,
      fileID: uploadResult.fileID
    };
  } catch (error) {
    console.error('合并文件失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};