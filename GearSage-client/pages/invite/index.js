const auth = require('../../services/auth.js');
const {
  normalizeText,
  getCurrentUser,
  buildInvitePayload,
  buildInvitePath,
  savePendingInvite,
  getPendingInvite
} = require('../../utils/invite.js');

const BENEFITS = [
  {
    title: '带着邀请码进入',
    description: '好友点开卡片后，会自动带上你的邀请参数进入小程序。'
  },
  {
    title: '会话和朋友圈都能发',
    description: '按钮适合发给好友，右上角菜单适合分享到朋友圈。'
  },
  {
    title: '后续链路可继续扩展',
    description: '当前已经把邀请关系保存到本地，后面接活动或积分也更顺手。'
  }
];

const STEPS = [
  '打开邀请页，生成你的个人邀请卡。',
  '点击“邀请好友”发给朋友，或用右上角菜单发朋友圈。',
  '好友点开后会把邀请码带进小程序，本地也会记住这次邀请。'
];

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    containerClass: '',
    isLoggedIn: false,
    currentUserName: '',
    inviteCard: {
      inviteCode: 'DYSHARE',
      inviterUid: '',
      inviterName: ''
    },
    incomingInvite: null,
    benefits: BENEFITS,
    steps: STEPS,
    shareTipText: '登录后会自动绑定你的个人邀请码；右上角菜单也可发朋友圈。',
    primaryActionText: '先登录再邀请'
  },

  onLoad(options) {
    this.initNavbarMetrics();
    this.initThemeMode();
    this.enablePageShare();
    this.refreshPageState(options);
  },

  onShow() {
    this.initThemeMode();
    this.refreshPageState();
  },

  initNavbarMetrics() {
    const app = getApp();
    let statusBarHeight = app.globalData.statusBarHeight || 0;
    let navBarHeight = app.globalData.navBarHeight || 44;

    if (!statusBarHeight || !navBarHeight) {
      try {
        const systemInfo = wx.getSystemInfoSync();
        statusBarHeight = statusBarHeight || systemInfo.statusBarHeight || 20;

        if (!navBarHeight) {
          const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
          navBarHeight = menuButton && systemInfo.statusBarHeight != null
            ? menuButton.height + (menuButton.top - systemInfo.statusBarHeight) * 2
            : 44;
        }
      } catch (error) {
        statusBarHeight = statusBarHeight || 20;
        navBarHeight = navBarHeight || 44;
      }
    }

    this.setData({
      statusBarHeight,
      navBarHeight
    });
  },

  initThemeMode() {
    try {
      const app = getApp();
      this.setData({
        containerClass: app.globalData.isDarkMode ? 'dark' : ''
      });
    } catch (error) {
      this.setData({
        containerClass: ''
      });
    }
  },

  enablePageShare() {
    if (typeof wx.showShareMenu !== 'function') {
      return;
    }

    const options = {
      withShareTicket: true
    };

    if (wx.canIUse && wx.canIUse('showShareMenu.menus')) {
      options.menus = ['shareAppMessage', 'shareTimeline'];
    }

    wx.showShareMenu(options);
  },

  parseLaunchOptions(options = {}) {
    const parsedOptions = { ...options };
    const scene = normalizeText(options.scene, '');

    if (!scene) {
      return parsedOptions;
    }

    try {
      const decodedScene = decodeURIComponent(scene);
      decodedScene.split('&').forEach((segment) => {
        if (!segment) {
          return;
        }

        const parts = segment.split('=');
        const key = normalizeText(parts[0], '');
        const value = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('=')) : '';

        if (!key || typeof parsedOptions[key] !== 'undefined') {
          return;
        }

        parsedOptions[key] = value;
      });
    } catch (error) {
      console.warn('[invite] parse scene failed:', error);
    }

    return parsedOptions;
  },

  buildIncomingInvite(options = {}, currentUser = {}) {
    const inviteCode = normalizeText(options.inviteCode, '');
    const inviterUid = normalizeText(options.inviterUid, '');
    const inviterName = normalizeText(options.inviterName, '');
    const currentUserId = normalizeText(currentUser.id || currentUser.userId, '');

    if (!inviteCode && !inviterUid) {
      return null;
    }

    if (currentUserId && inviterUid && currentUserId === inviterUid) {
      return null;
    }

    return {
      inviteCode,
      inviterUid,
      inviterName
    };
  },

  refreshPageState(options) {
    const currentUser = getCurrentUser() || {};
    const parsedOptions = options ? this.parseLaunchOptions(options) : {};
    const inviteCard = buildInvitePayload({}, currentUser);
    const incomingInvite = this.buildIncomingInvite(parsedOptions, currentUser);
    const pendingInvite = incomingInvite || getPendingInvite();
    const currentUserName = normalizeText(currentUser.nickname || currentUser.nickName, '钓友');
    const isLoggedIn = Boolean(normalizeText(currentUser.id || currentUser.userId, ''));

    if (incomingInvite) {
      savePendingInvite(incomingInvite);
    }

    this.setData({
      isLoggedIn,
      currentUserName,
      inviteCard,
      incomingInvite: pendingInvite || null,
      shareTipText: isLoggedIn
        ? '点击“邀请好友”发会话，右上角菜单可发朋友圈。'
        : '登录后会自动绑定你的个人邀请码；右上角菜单也可发朋友圈。',
      primaryActionText: pendingInvite
        ? '收下邀请并去看看'
        : (isLoggedIn ? '去个人中心看看' : '先登录再邀请')
    });
  },

  buildInviteQuery(payload = {}) {
    const inviteCode = encodeURIComponent(normalizeText(payload.inviteCode, 'DYSHARE'));
    const inviterUid = encodeURIComponent(normalizeText(payload.inviterUid, ''));
    const inviterName = encodeURIComponent(normalizeText(payload.inviterName, ''));
    const query = [`inviteCode=${inviteCode}`];

    if (inviterUid) {
      query.push(`inviterUid=${inviterUid}`);
    }

    if (inviterName) {
      query.push(`inviterName=${inviterName}`);
    }

    return query.join('&');
  },

  buildShareConfig() {
    const payload = this.data.inviteCard || {};
    const inviterName = normalizeText(payload.inviterName || this.data.currentUserName, '钓友');

    return {
      title: `${inviterName}邀请你来钓友说聊装备和鱼获`,
      path: buildInvitePath(payload),
      imageUrl: '/images/share.png'
    };
  },

  onShareAppMessage() {
    return this.buildShareConfig();
  },

  onShareTimeline() {
    return {
      title: '来钓友说一起聊装备和鱼获',
      query: this.buildInviteQuery(this.data.inviteCard || {}),
      imageUrl: '/images/share.png'
    };
  },

  onCopyInviteCode() {
    wx.setClipboardData({
      data: normalizeText(this.data.inviteCard.inviteCode, 'DYSHARE'),
      success: () => {
        wx.showToast({
          title: '邀请码已复制',
          icon: 'success'
        });
      }
    });
  },

  async onAcceptInvite() {
    if (this.data.incomingInvite) {
      savePendingInvite(this.data.incomingInvite);
    }

    if (!this.data.isLoggedIn) {
      try {
        await auth.ensureLogin();
      } catch (error) {
        return;
      }
      this.refreshPageState();
    }

    const hasIncomingInvite = Boolean(this.data.incomingInvite);
    wx.showToast({
      title: hasIncomingInvite ? '邀请已保存' : '去完善资料吧',
      icon: 'success'
    });

    setTimeout(() => {
      if (hasIncomingInvite) {
        wx.switchTab({
          url: '/pages/index/index'
        });
        return;
      }

      wx.switchTab({
        url: '/pages/profile/profile'
      });
    }, 450);
  }
});
