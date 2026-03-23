// utils/date-format.js

/**
 * 时间格式化工具类
 */
class DateFormatter {
  /**
   * 格式化日期为 YYYY-MM-DD
   */
  static formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * 格式化日期时间为 YYYY-MM-DD HH:mm:ss
   */
  static formatDateTime(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 格式化时间为 HH:mm
   */
  static formatTime(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  }

  /**
   * 相对时间格式化（如：刚刚、5分钟前、1小时前等）
   */
  static formatRelativeTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = now - targetDate;
    
    // 如果是未来时间，返回具体时间
    if (diffMs < 0) {
      return this.formatDateTime(date);
    }
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSeconds < 60) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 30) {
      return `${diffDays}天前`;
    } else if (diffMonths < 12) {
      return `${diffMonths}个月前`;
    } else {
      return `${diffYears}年前`;
    }
  }

  /**
   * 智能时间格式化
   * 今天：显示时间
   * 昨天：显示"昨天 HH:mm"
   * 本年：显示"MM-DD HH:mm"
   * 往年：显示"YYYY-MM-DD"
   */
  static formatSmartTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const targetDate = new Date(date);
    
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDay = now.getDate();
    
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const targetDay = targetDate.getDate();
    
    // 同一天
    if (nowYear === targetYear && nowMonth === targetMonth && nowDay === targetDay) {
      return this.formatTime(date);
    }
    
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (targetYear === yesterday.getFullYear() && 
        targetMonth === yesterday.getMonth() && 
        targetDay === yesterday.getDate()) {
      return `昨天 ${this.formatTime(date)}`;
    }
    
    // 同一年
    if (nowYear === targetYear) {
      const month = String(targetMonth + 1).padStart(2, '0');
      const day = String(targetDay).padStart(2, '0');
      return `${month}-${day} ${this.formatTime(date)}`;
    }
    
    // 不同年
    return this.formatDate(date);
  }

  /**
   * 计算使用时长（年月日）
   */
  static calculateUsageDuration(purchaseDate) {
    if (!purchaseDate) return '';
    
    const now = new Date();
    const purchase = new Date(purchaseDate);
    
    let years = now.getFullYear() - purchase.getFullYear();
    let months = now.getMonth() - purchase.getMonth();
    let days = now.getDate() - purchase.getDate();
    
    if (days < 0) {
      months--;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const parts = [];
    if (years > 0) parts.push(`${years}年`);
    if (months > 0) parts.push(`${months}个月`);
    if (days > 0 && years === 0) parts.push(`${days}天`);
    
    return parts.join('') || '不足1天';
  }

  /**
   * 获取星期几
   */
  static getWeekday(date) {
    if (!date) return '';
    
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const d = new Date(date);
    return weekdays[d.getDay()];
  }

  /**
   * 判断是否为今天
   */
  static isToday(date) {
    if (!date) return false;
    
    const now = new Date();
    const targetDate = new Date(date);
    
    return now.getFullYear() === targetDate.getFullYear() &&
           now.getMonth() === targetDate.getMonth() &&
           now.getDate() === targetDate.getDate();
  }

  /**
   * 判断是否为本周
   */
  static isThisWeek(date) {
    if (!date) return false;
    
    const now = new Date();
    const targetDate = new Date(date);
    
    // 获取本周一的日期
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    
    // 获取本周日的日期
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return targetDate >= monday && targetDate <= sunday;
  }

  /**
   * 格式化发布时间（用于帖子列表）
   */
  static formatPostTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = now - targetDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    // 24小时内显示相对时间
    if (diffHours < 24) {
      return this.formatRelativeTime(date);
    }
    
    // 超过24小时显示智能时间
    return this.formatSmartTime(date);
  }
}

module.exports = DateFormatter;