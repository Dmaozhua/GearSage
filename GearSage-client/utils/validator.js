// utils/validator.js

/**
 * 表单验证工具类
 */
class Validator {
  /**
   * 验证装备使用时长（必须大于等于2年）
   */
  static validateUsageDuration(purchaseTime) {
    if (!purchaseTime) {
      return {
        valid: false,
        message: '请选择购入时间'
      };
    }

    const purchaseDate = new Date(purchaseTime);
    const currentDate = new Date();
    const diffTime = currentDate - purchaseDate;
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);

    if (diffYears < 2) {
      return {
        valid: false,
        message: '装备使用时间必须大于等于2年才能发布'
      };
    }

    return {
      valid: true,
      message: '验证通过'
    };
  }

  /**
   * 验证装备名称
   */
  static validateEquipmentName(name) {
    if (!name || name.trim().length === 0) {
      return {
        valid: false,
        message: '请输入装备名称'
      };
    }

    if (name.trim().length < 2) {
      return {
        valid: false,
        message: '装备名称至少2个字符'
      };
    }

    if (name.trim().length > 50) {
      return {
        valid: false,
        message: '装备名称不能超过50个字符'
      };
    }

    return {
      valid: true,
      message: '验证通过'
    };
  }

  /**
   * 验证使用频次
   */
  static validateUsageFrequency(frequency) {
    if (!frequency || frequency.trim().length === 0) {
      return {
        valid: false,
        message: '请选择使用频次'
      };
    }

    const validFrequencies = ['每天', '每周', '每月', '偶尔使用', '很少使用'];
    if (!validFrequencies.includes(frequency)) {
      return {
        valid: false,
        message: '请选择有效的使用频次'
      };
    }

    return {
      valid: true,
      message: '验证通过'
    };
  }

  /**
   * 验证使用环境
   */
  static validateUsageEnvironment(environment) {
    if (!environment || environment.trim().length === 0) {
      return {
        valid: false,
        message: '请选择使用环境'
      };
    }

    return {
      valid: true,
      message: '验证通过'
    };
  }

  /**
   * 验证目标鱼种
   */
  static validateTargetFish(targetFish) {
    if (!targetFish || targetFish.trim().length === 0) {
      return {
        valid: false,
        message: '请选择目标鱼种'
      };
    }

    return {
      valid: true,
      message: '验证通过'
    };
  }

  /**
   * 验证装备图片
   */
  static validateEquipmentImages(images) {
    if (!images || images.length === 0) {
      return {
        valid: false,
        message: '请至少上传一张装备图片'
      };
    }

    if (images.length > 9) {
      return {
        valid: false,
        message: '最多只能上传9张图片'
      };
    }

    return {
      valid: true,
      message: '验证通过'
    };
  }

  /**
   * 验证评论内容
   */
  static validateCommentContent(content) {
    if (!content || content.trim().length === 0) {
      return {
        valid: false,
        message: '请输入评论内容'
      };
    }

    if (content.trim().length < 2) {
      return {
        valid: false,
        message: '评论内容至少2个字符'
      };
    }

    if (content.trim().length > 500) {
      return {
        valid: false,
        message: '评论内容不能超过500个字符'
      };
    }

    return {
      valid: true,
      message: '验证通过'
    };
  }

  /**
   * 验证手机号
   */
  static validatePhone(phone) {
    if (!phone) {
      return {
        valid: false,
        message: '请输入手机号'
      };
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return {
        valid: false,
        message: '请输入正确的手机号'
      };
    }

    return {
      valid: true,
      message: '验证通过'
    };
  }

  /**
   * 验证邮箱
   */
  static validateEmail(email) {
    if (!email) {
      return {
        valid: false,
        message: '请输入邮箱'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        message: '请输入正确的邮箱格式'
      };
    }

    return {
      valid: true,
      message: '验证通过'
    };
  }

  /**
   * 验证帖子完整性
   */
  static validatePost(postData) {
    const validations = [
      this.validateEquipmentName(postData.equipmentName),
      this.validateUsageDuration(postData.purchaseTime),
      this.validateUsageFrequency(postData.usageFrequency),
      this.validateUsageEnvironment(postData.usageEnvironment),
      this.validateTargetFish(postData.targetFish),
      this.validateEquipmentImages(postData.images)
    ];

    for (let validation of validations) {
      if (!validation.valid) {
        return validation;
      }
    }

    return {
      valid: true,
      message: '验证通过'
    };
  }

  /**
   * 敏感词检测（简单版本）
   */
  static checkSensitiveWords(content) {
    const sensitiveWords = [
      '垃圾', '骗子', '假货', '劣质', '坑人',
      '政治', '反动', '暴力', '色情', '赌博'
    ];

    for (let word of sensitiveWords) {
      if (content.includes(word)) {
        return {
          valid: false,
          message: `内容包含敏感词：${word}`
        };
      }
    }

    return {
      valid: true,
      message: '内容检测通过'
    };
  }
}

module.exports = Validator;