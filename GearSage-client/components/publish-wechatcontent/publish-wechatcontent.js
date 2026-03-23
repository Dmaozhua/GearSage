// components/publish-wechatcontent/publish-wechatcontent.js
const imageSignature = require('../../utils/imageSignature');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 表单数据
    formData: {
      type: Object,
      value: {}
    },
    // 错误信息
    errors: {
      type: Object,
      value: {}
    },
    // 最大图片数量
    maxImages: {
      type: Number,
      value: 9
    },
    // 最小图片数量
    minImages: {
      type: Number,
      value: 0
    },
    // 标题占位符
    titlePlaceholder: {
      type: String,
      value: '请输入标题...'
    },
    // 内容占位符
    contentPlaceholder: {
      type: String,
      value: '分享你的想法...'
    },
    writingTips: {
      type: Array,
      value: []
    },
    // 是否必填
    required: {
      type: Boolean,
      value: false
    },
    // 标题最大长度
    maxTitleLength: {
      type: Number,
      value: 50
    },
    // 内容最大长度
    maxContentLength: {
      type: Number,
      value: 1000
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isDarkMode: false,
    // 图片特征值映射 {fileID: signature}
    imageSignatures: {}
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.initThemeMode();
      
      // 监听全局主题变化
      const app = getApp();
      if (app.globalData.themeChangeListeners) {
        app.globalData.themeChangeListeners.push(() => {
          this.setData({
            isDarkMode: app.globalData.isDarkMode || false
          });
        });
      }
    },
    
    detached() {
      // 清理监听器
      const app = getApp();
      if (app.globalData.themeChangeListeners) {
        const index = app.globalData.themeChangeListeners.findIndex(listener => 
          listener.toString().includes('isDarkMode')
        );
        if (index > -1) {
          app.globalData.themeChangeListeners.splice(index, 1);
        }
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化主题模式
     */
    initThemeMode() {
      const app = getApp();
      this.setData({
        isDarkMode: app.globalData.isDarkMode || false
      });
    },
    /**
     * 标题输入
     */
    onTitleInput(e) {
      const { value } = e.detail;
      
      // 触发父组件事件
      this.triggerEvent('titleinput', {
        value: value
      });
    },

    /**
     * 内容输入
     */
    onContentInput(e) {
      const { value } = e.detail;
      
      // 触发父组件事件
      this.triggerEvent('maincontentinput', {
        value: value
      });
    },

    /**
     * 内容变化（text-editor 组件事件）
     */
    onContentChange(e) {
      const { value } = e.detail;
      
      // 触发父组件事件
      this.triggerEvent('maincontentinput', {
        value: value
      });
    },

    /**
     * 选择图片
     */
    async onChooseImage() {
      const imageUploadUtils = require('../../utils/imageUploadUtils');
      const { formData, maxImages } = this.properties;
      const imageList = formData.mainImages || [];
      const remainingCount = maxImages - imageList.length;
      
      if (remainingCount <= 0) {
        wx.showToast({
          title: `最多只能上传${maxImages}张图片`,
          icon: 'none'
        });
        return;
      }
      
      try {
        // 1) 选择图片（获取临时路径）
        const tempFilePaths = await new Promise((resolve, reject) => {
          wx.chooseImage({
            count: remainingCount,
            success: (res) => resolve(res.tempFilePaths),
            fail: reject
          });
        });
        
        if (!tempFilePaths || tempFilePaths.length === 0) {
          return;
        }
        
        // 2) 计算新图片的特征值
        const newSignatures = [];
        let hasSimilarImages = false;
        
        for (const tempFilePath of tempFilePaths) {
          try {
            const signature = await imageSignature.calculateImageSignature(tempFilePath);
            newSignatures.push({ tempFilePath, signature });
            
            // 3) 检查是否与已有图片相似
            if (imageSignature.checkSimilarImages(signature, this.data.imageSignatures)) {
              hasSimilarImages = true;
            }
          } catch (error) {
            console.error('计算图片特征值失败:', error);
            // 即使特征值计算失败，也允许上传
            newSignatures.push({ tempFilePath, signature: null });
          }
        }
        
        // 4) 上传图片到云存储
        const fileIDs = await imageUploadUtils.uploadImages(
          tempFilePaths.map(item => typeof item === 'string' ? item : item.tempFilePath),
          { prefix: 'posts', showLoading: true }
        );
        
        if (!fileIDs || fileIDs.length === 0) {
          return;
        }
        
        // 5) 绑定 fileID 与 signature
        const updatedSignatures = { ...this.data.imageSignatures };
        fileIDs.forEach((fileID, index) => {
          const signatureData = newSignatures[index];
          if (signatureData && signatureData.signature) {
            updatedSignatures[fileID] = signatureData.signature;
          }
        });
        
        // 6) 更新图片列表并通知父组件（保持原有事件接口不变）
        const newImageList = [...imageList, ...fileIDs];
        
        this.triggerEvent('chooseimage', {
          value: newImageList
        });
        
        // 更新组件内部的 formData 视图和 signatures
        this.setData({
          'formData.mainImages': newImageList,
          imageSignatures: updatedSignatures
        });
        
        // 7) 提示相似图片（不阻止上传）
        if (hasSimilarImages) {
          wx.showToast({
            title: '有相似图片，建议优化',
            icon: 'none',
            duration: 3000
          });
        } else {
          wx.showToast({
            title: '图片上传成功',
            icon: 'success'
          });
        }
      } catch (error) {
        console.error('选择图片失败:', error);
        wx.showToast({
          title: '图片上传失败',
          icon: 'none'
        });
      }
    },

    /**
     * 验证图片数量
     */
    validateImages() {
      const { formData, minImages, maxImages } = this.properties;
      const imageList = formData.mainImages || [];
      const imageCount = imageList.length;
      
      if (imageCount < minImages) {
        return {
          valid: false,
          message: `至少需要上传${minImages}张图片`
        };
      }
      
      if (imageCount > maxImages) {
        return {
          valid: false,
          message: `最多只能上传${maxImages}张图片`
        };
      }
      
      return {
        valid: true,
        message: ''
      };
    },

    /**
     * 预览图片
     */
    onPreviewImage(e) {
      const { index } = e.currentTarget.dataset;
      const { formData } = this.properties;
      const imageList = formData.mainImages || [];
      
      wx.previewImage({
        current: imageList[index],
        urls: imageList
      });
    },

    /**
     * 删除图片
     */
    onDeleteImage(e) {
      const { index } = e.currentTarget.dataset;
      const { formData } = this.properties;
      const imageList = formData.mainImages || [];
      
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这张图片吗？',
        success: (res) => {
          if (res.confirm) {
            const newImageList = imageList.filter((_, i) => i !== index);
            const deletedFileID = imageList[index];
            
            // 更新特征值数据（删除对应 fileID 的 signature）
            const updatedSignatures = { ...this.data.imageSignatures };
            if (deletedFileID && updatedSignatures[deletedFileID]) {
              delete updatedSignatures[deletedFileID];
            }
            
            // 触发父组件事件
            this.triggerEvent('deleteimage', {
              value: newImageList,
              index: index
            });
            
            // 更新内部状态
            this.setData({
              'formData.mainImages': newImageList,
              imageSignatures: updatedSignatures
            });
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
          }
        }
      });
    }
  }
});
