const api = require('../../services/api.js');
const dateFormatter = require('../../utils/date-format.js');

function buildNavigateUrl(message = {}) {
  const type = message.type || '';
  const extra = message.extra && typeof message.extra === 'object' ? message.extra : {};
  const topicId = extra.topicId || message.targetId || '';

  if (type === 'topic_rejected') {
    return topicId ? `/pkgContent/publishMode/publishMode?fromDraft=true&mode=edit&draftId=${topicId}` : '/pkgContent/my-publish/my-publish';
  }

  if (type === 'topic_removed') {
    return '/pkgContent/my-publish/my-publish';
  }

  if (type === 'topic_approved' || type === 'topic_restored' || type === 'comment_received' || type === 'like_received') {
    return topicId ? `/pkgContent/detail/detail?id=${topicId}` : '/pkgContent/my-publish/my-publish';
  }

  return '';
}

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    containerClass: '',
    loading: true,
    unreadCount: 0,
    messages: []
  },

  onLoad() {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 0,
      navBarHeight: app.globalData.navBarHeight || 44
    });
    this.initThemeMode();
    this.loadMessages();
  },

  onShow() {
    this.initThemeMode();
    this.loadMessages();
  },

  initThemeMode() {
    try {
      const isDarkMode = wx.getStorageSync('isDarkMode') || false;
      this.setData({
        containerClass: isDarkMode ? 'dark' : ''
      });
    } catch (error) {
      console.warn('[message-center] 获取主题模式失败:', error);
    }
  },

  async loadMessages() {
    this.setData({ loading: true });
    try {
      const result = await api.getMessages({
        page: 1,
        limit: 50
      });
      const list = Array.isArray(result.list) ? result.list : [];
      this.setData({
        unreadCount: Number(result.unreadCount || 0),
        messages: list.map(item => ({
          ...item,
          displayTime: dateFormatter.formatTime(item.createTime),
          navigateUrl: buildNavigateUrl(item)
        }))
      });
    } catch (error) {
      console.error('[message-center] 加载消息失败:', error);
      wx.showToast({
        title: '加载消息失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async onMarkAllRead() {
    if (this.data.unreadCount <= 0) {
      return;
    }

    try {
      await api.readAllMessages();
      wx.showToast({
        title: '已全部标记已读',
        icon: 'success'
      });
      this.loadMessages();
    } catch (error) {
      console.error('[message-center] 全部已读失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  async onMessageTap(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) {
      return;
    }

    try {
      if (!item.isRead) {
        await api.readMessage(item.id);
      }
    } catch (error) {
      console.warn('[message-center] 标记已读失败，继续跳转:', error);
    }

    const type = item.type || '';
    const extra = item.extra && typeof item.extra === 'object' ? item.extra : {};
    const topicId = Number(extra.topicId || item.targetId || 0);

    if (type === 'topic_rejected' && topicId > 0) {
      try {
        const topicDetail = await api.getTopicDetail(topicId);
        if (!topicDetail || Number(topicDetail.status) !== 0) {
          wx.showToast({
            title: '这条驳回草稿已失效',
            icon: 'none'
          });
          this.loadMessages();
          return;
        }
      } catch (error) {
        console.warn('[message-center] 驳回消息跳转前校验失败:', error);
        wx.showToast({
          title: '这条驳回草稿已失效',
          icon: 'none'
        });
        this.loadMessages();
        return;
      }
    }

    const navigateUrl = item.navigateUrl || buildNavigateUrl(item);
    if (!navigateUrl) {
      wx.showToast({
        title: '当前消息暂无跳转目标',
        icon: 'none'
      });
      this.loadMessages();
      return;
    }

    wx.navigateTo({
      url: navigateUrl,
      fail: (error) => {
        console.error('[message-center] 跳转失败:', error);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });

    this.loadMessages();
  }
});
