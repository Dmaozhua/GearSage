const api = require('../../services/api.js');
const tempUrlManager = require('../../utils/tempUrlManager.js');
const dateFormatter = require('../../utils/date-format.js');
const { getInitialDarkMode, subscribeThemeChange, unsubscribeThemeChange } = require('../../utils/theme.js');

const TOPIC_CATEGORY_LABELS = {
  0: '好物速报',
  1: '长测评',
  2: '讨论&提问',
  3: '鱼获展示',
  4: '钓行分享'
};

const QUESTION_TYPE_LABELS = {
  recommend: '求推荐',
  ask: '提问',
  discuss: '讨论',
  chat_with_photos: '晒图闲聊'
};

const ANSWER_CONCLUSION_LABELS = {
  prefer_a: '更推荐 A',
  prefer_b: '更推荐 B',
  buy_safe: '建议先保守买',
  save_more: '建议再攒一点',
  no_upgrade: '现在不建议升级',
  need_more_info: '建议先补充信息',
};

function normalizeNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeUser(payload = {}) {
  const user = payload && typeof payload === 'object' ? payload : {};
  const avatar = user.avatarUrl || user.avatar || '';
  const background = user.backgroundImage || user.background || '';
  return {
    id: normalizeNumber(user.id),
    nickName: user.nickName || user.nickname || '匿名钓友',
    avatarUrl: avatar,
    avatar: avatar,
    backgroundImage: background,
    background: background,
    bio: user.bio || '',
    displayTag: user.displayTag || null,
  };
}

function formatTopicBadge(topic = {}) {
  const topicCategory = normalizeNumber(topic.topicCategory);
  const questionType = String(topic.questionType || '').trim();
  if (topicCategory === 2 && questionType) {
    return QUESTION_TYPE_LABELS[questionType] || questionType;
  }
  return TOPIC_CATEGORY_LABELS[topicCategory] || '帖子';
}

function buildTopicMeta(topic = {}) {
  const likeCount = normalizeNumber(topic.likeCount);
  const commentCount = normalizeNumber(topic.commentCount);
  const pieces = [];
  if (likeCount > 0) {
    pieces.push(`获赞 ${likeCount}`);
  }
  if (commentCount > 0) {
    pieces.push(`评论 ${commentCount}`);
  }
  return pieces.join(' · ');
}

function buildAcceptedAnswerSummary(item = {}) {
  const meta = item.recommendAnswerMeta && typeof item.recommendAnswerMeta === 'object'
    ? item.recommendAnswerMeta
    : {};
  const conclusion = String(meta.answerConclusion || '').trim();
  const options = Array.isArray(meta.recommendedOption)
    ? meta.recommendedOption.map((entry) => String(entry || '').trim()).filter(Boolean)
    : [];

  if (options.length) {
    return options.join(' / ');
  }

  if (conclusion) {
    return ANSWER_CONCLUSION_LABELS[conclusion] || conclusion;
  }

  return String(item.content || '').trim();
}

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    isDarkMode: false,
    loading: true,
    notFound: false,
    userId: 0,
    profile: null,
    identitySummary: '',
    summaryStats: [],
    recentTopics: [],
    recentAcceptedAnswers: [],
  },

  onLoad(options = {}) {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: windowInfo.statusBarHeight || 0,
      navBarHeight: (windowInfo.statusBarHeight || 0) + 44,
      isDarkMode: getInitialDarkMode(),
      userId: normalizeNumber(options.id || options.userId),
    });

    this.themeListener = ({ theme } = {}) => {
      this.setData({
        isDarkMode: theme === 'dark',
      });
    };
    subscribeThemeChange(this.themeListener);

    this.loadUserProfile(this.data.userId);
  },

  onUnload() {
    unsubscribeThemeChange(this.themeListener);
  },

  async loadUserProfile(userId) {
    if (!userId) {
      this.setData({
        loading: false,
        notFound: true,
      });
      return;
    }

    this.setData({
      loading: true,
      notFound: false,
    });

    try {
      const payload = await api.getUserInfo(userId);
      if (!(payload && payload.id)) {
        this.setData({
          loading: false,
          notFound: true,
        });
        return;
      }

      const profile = normalizeUser(payload);
      const resolvedProfile = await this.resolveProfileMediaUrls(profile);
      const stats = payload.stats && typeof payload.stats === 'object' ? payload.stats : payload;

      this.setData({
        loading: false,
        notFound: false,
        profile: resolvedProfile,
        identitySummary: this.buildIdentitySummary(stats),
        summaryStats: this.buildSummaryStats(stats),
        recentTopics: this.buildRecentTopics(payload.recentTopics),
        recentAcceptedAnswers: this.buildRecentAcceptedAnswers(payload.recentAcceptedAnswers),
      });
    } catch (error) {
      console.error('[user-profile] loadUserProfile failed:', error);
      this.setData({
        loading: false,
        notFound: true,
      });
      wx.showToast({
        title: api.getErrorMessage(error, '加载主页失败'),
        icon: 'none',
      });
    }
  },

  async resolveProfileMediaUrls(profile = {}) {
    try {
      const requests = [];
      const avatar = profile.avatarUrl || profile.avatar || '';
      const background = profile.backgroundImage || profile.background || '';

      if (avatar && (/^cloud:\/\//.test(avatar) || tempUrlManager.shouldResolveUrl(avatar))) {
        requests.push({ fileID: avatar, type: 'avatar' });
      }
      if (background && (/^cloud:\/\//.test(background) || tempUrlManager.shouldResolveUrl(background))) {
        requests.push({ fileID: background, type: 'background' });
      }

      if (!requests.length) {
        return profile;
      }

      const resolvedMap = await tempUrlManager.getBatchTempUrls(requests);
      return {
        ...profile,
        avatarUrl: resolvedMap[avatar] || profile.avatarUrl,
        avatar: resolvedMap[avatar] || profile.avatar,
        backgroundImage: resolvedMap[background] || profile.backgroundImage,
        background: resolvedMap[background] || profile.background,
      };
    } catch (error) {
      console.warn('[user-profile] resolveProfileMediaUrls failed:', error);
      return profile;
    }
  },

  buildIdentitySummary(stats = {}) {
    const acceptedAnswerCount = normalizeNumber(stats.acceptedAnswerCount);
    const recommendAnswerCount = normalizeNumber(stats.recommendAnswerCount);
    const longReviewCount = normalizeNumber(stats.longReviewCount);
    const pieces = [];

    if (acceptedAnswerCount > 0) {
      pieces.push(`被采纳 ${acceptedAnswerCount} 次`);
    }
    if (recommendAnswerCount > 0) {
      pieces.push(`写过 ${recommendAnswerCount} 条规范推荐`);
    }
    if (longReviewCount > 0) {
      pieces.push(`发布过 ${longReviewCount} 篇长测评`);
    }

    return pieces.join(' · ');
  },

  buildSummaryStats(stats = {}) {
    return [
      { key: 'accepted', label: '被采纳', value: normalizeNumber(stats.acceptedAnswerCount) },
      { key: 'answer', label: '求推荐回答', value: normalizeNumber(stats.recommendAnswerCount) },
      { key: 'recommend', label: '发起求推荐', value: normalizeNumber(stats.recommendPostCount) },
      { key: 'feedback', label: '已补反馈', value: normalizeNumber(stats.recommendFeedbackCount) },
    ];
  },

  buildRecentTopics(list = []) {
    return (Array.isArray(list) ? list : []).map((item) => ({
      id: normalizeNumber(item.id),
      title: item.title || '未命名帖子',
      badgeText: formatTopicBadge(item),
      topicMetaText: buildTopicMeta(item),
      publishTimeText: dateFormatter.formatSmartTime(item.publishTime || item.createTime || ''),
    }));
  },

  buildRecentAcceptedAnswers(list = []) {
    return (Array.isArray(list) ? list : []).map((item) => ({
      commentId: normalizeNumber(item.commentId),
      topicId: normalizeNumber(item.topicId),
      topicTitle: item.topicTitle || '未命名帖子',
      acceptedAtText: dateFormatter.formatSmartTime(item.acceptedAt || item.createTime || ''),
      summaryText: buildAcceptedAnswerSummary(item),
    })).filter((item) => item.topicId);
  },

  onTapTopic(e) {
    const topicId = normalizeNumber(e.currentTarget.dataset.topicId);
    if (!topicId) {
      return;
    }
    wx.navigateTo({
      url: `/pkgContent/detail/detail?id=${topicId}`,
    });
  },
});
