// pages/AnglerSay/AnglerSay.js
// 引入服务和工具
const apiService = require('../../services/api.js');
const AuthService = require('../../services/auth.js');
const tempUrlManager = require('../../utils/tempUrlManager.js');
const { formatRichTextContent, parseRichTextPayload } = require('../../utils/richTextFormatter.js');
const tagConfig = require('../../components/post-Evaluation/gearSageTagConfig.js');

const HOME_FEED_CACHE_KEY = 'home_feed_cache_v2';
const HOME_FEED_CACHE_TTL = 5 * 60 * 1000; // 5分钟兜底缓存
const INITIAL_CHUNK_SIZE = 12;
const CHUNK_APPEND_DELAY = 32;
const LAYOUT_MODE = {
    LIST: 'list',
    WATERFALL: 'waterfall'
};
const LAYOUT_MODE_STORAGE_KEY = 'home_layout_mode_v1';
const WATERFALL_DEFAULT_RATIO = 0.75; // 宽高比（width/height）默认值
const WATERFALL_COLUMN_WIDTH = 345; // 估算列宽（rpx）用于高度平衡
const WATERFALL_TEXT_LINE_HEIGHT = 26; // 文案估算行高
// 瀑布流高度预设
const WATERFALL_HEIGHT_PRESET = {
    S: 0.86,  // 短卡：在原估算高度基础上略缩
    M: 1.0,   // 中卡：原估算高度
    L: 1.24   // 长卡：略拉高
};

// 最小错位阈值：避免两列高度“刚好一样”看着别扭
const WATERFALL_MIN_DIFF = 40; // rpx，可按实际效果微调
const MAX_WATERFALL_TITLE_LENGTH = 16;

const TOPIC_CATEGORY = {
    RECOMMEND: 0,
    EXPERIENCE: 1,
    QUESTION: 2,
    CATCH: 3,
    TRIP: 4
};

const TOPIC_CATEGORY_LABELS = {
    [TOPIC_CATEGORY.RECOMMEND]: '好物速报',
    [TOPIC_CATEGORY.EXPERIENCE]: '长测评',
    [TOPIC_CATEGORY.QUESTION]: '讨论提问',
    [TOPIC_CATEGORY.CATCH]: '鱼获展示',
    [TOPIC_CATEGORY.TRIP]: '钓行分享'
};

const USAGE_YEAR_LABELS = {
    love_at_first_sight: '一见钟情',
    '1_month': '1个月',
    '1_3_months': '1-3个月',
    '3_12_months': '3-12个月',
    '1_year_plus': '1年以上'
};

const USAGE_FREQUENCY_LABELS = {
    essential: '出钓必备',
    several_times_week: '每周多次',
    once_week: '每周一次',
    several_times_month: '每月多次',
    once_month: '每月一次',
    several_times_year: '每年多次'
};

const RECOMMEND_SUMMARY_LABELS = {
    strongly_recommend: '强烈推荐，明显超出预期',
    recommend: '值得推荐，整体满意',
    soso: '有亮点，但不一定适合所有人',
    not_recommend: '不太推荐，实际体验一般'
};

const QUESTION_TYPE_LABELS = {
    ask: '提问',
    discuss: '讨论',
    recommend: '求推荐',
    avoid_pitfall: '求避坑',
    chat_with_photos: '晒图闲聊'
};


const GEAR_CATEGORY_LABELS = {
    rod: '竿',
    reel: '轮',
    bait: '饵',
    line: '线',
    hook: '钩',
    other: '其他'
};

const GEAR_CATEGORY_ORDER = ['rod', 'reel', 'bait', 'line', 'hook', 'other'];

const BASE_FILTER_TABS = [
    {
        key: 'all',
        label: '全部',
        subFilters: [
            { key: 'latest', label: '最新发布', isDefault: true },
            { key: 'weekly_hot', label: '一周最热', description: '按点赞与评论热度排序' }
        ]
    },
 
    {
        key: 'post-Experience',
        label: '长测评',
        subFilters: [
            { key: 'all', label: '全部', isDefault: true }
        ]
    },
    {
        key: 'post-Recommend',
        label: '好物速报',
        subFilters: [
            { key: 'all', label: '全部', isDefault: true }
        ]
    },
    {
        key: 'post-Question',
        label: '讨论&提问',
        subFilters: [
            { key: 'latest', label: '最新发布', isDefault: true },
            { key: 'weekly_hot', label: '一周最热' },
            { key: 'waiting_reply', label: '待回复的讨论' }
        ]
    }
    ,
    {
        key: 'post-Catch',
        label: '鱼获展示',
        subFilters: [
            { key: 'latest', label: '最新发布', isDefault: true },
            { key: 'weekly_hot', label: '一周最热' }
        ]
    },
    {
        key: 'post-Trip',
        label: '钓行分享',
        subFilters: [
            { key: 'latest', label: '最新发布', isDefault: true },
            { key: 'weekly_hot', label: '一周最热' }
        ]
    }
];

const createInitialFilterTabs = () => BASE_FILTER_TABS.map(tab => ({
    ...tab,
    subFilters: Array.isArray(tab.subFilters) ? tab.subFilters.map(sub => ({ ...sub })) : []
}));

Page({

    // 用于存储完整的钓友说数据，配合分页展示
    fullAnglerList: [],
    currentAnglerPageIndex: 0,

    /**
     * 页面的初始数据
     */
    data: {
        // 导航栏相关数据
        statusBarHeight: 0,
        navBarHeight: 0,
        currentFilter: 'all',  // 当前选中的筛选选项，默认为全部
        subFilter: 'latest', // 当前选中的二级筛选选项
        containerClass: '', // 夜间模式容器类名
        filterTabs: createInitialFilterTabs(),
        layoutMode: LAYOUT_MODE.LIST,
        listScrollTop: 0,
        waterfallScrollTop: 0,
        originList: [],
        waterfallColumns: {
            left: [],
            right: []
        },
        waterfallColumnHeights: [0, 0],
        isWaterfallLoading: false,
        
        // 轮播图相关数据
        currentNavbarColor: '#BDC3C7', // 当前导航栏颜色
        currentTextColor: '#000000', // 当前文字颜色
        functionNavHeight: 0, // 功能导航区域高度
        
        // 文章相关数据
        articles: [],
        loading: false,

        // 默认列表渲染直接使用 originList
        topics: [], // 话题列表数据
        showSkeleton: true,
        skeletonRows: [0, 1, 2, 3, 4, 5],
        isInitialRenderComplete: false,
        chunkSize: INITIAL_CHUNK_SIZE,
        lastUpdatedAt: 0,
        anglerHasMore: false,
        isPullRefreshing: false,
        activeMorePostId: ''
    },

    /**
     * 格式化文本内容，处理JSON字符串和换行符
     */
    formatContentText(content) {
        return formatRichTextContent(content);
    },

    normalizeStringList(value) {
        if (!value) {
            return [];
        }
        if (Array.isArray(value)) {
            return value.map(item => String(item || '').trim()).filter(Boolean);
        }
        if (typeof value === 'string') {
            return value.split(',').map(item => item.trim()).filter(Boolean);
        }
        return [];
    },

    normalizeDisplayText(value, fallback = '') {
        if (value === null || typeof value === 'undefined') {
            return fallback;
        }
        const text = String(value).trim();
        return text || fallback;
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

    getCurrentUserId() {
        try {
            const userInfo = wx.getStorageSync('userInfo') || {};
            return this.normalizeDisplayText(userInfo.id || userInfo.userId, '');
        } catch (error) {
            return '';
        }
    },

    getLikeCacheKey() {
        const userId = this.getCurrentUserId();
        return `likeCache_${userId || 'guest'}`;
    },

    findTopicById(postId) {
        const normalizedPostId = this.normalizeDisplayText(postId, '');
        if (!normalizedPostId) {
            return null;
        }

        return (this.data.originList || []).find((item) => this.normalizeDisplayText(item.id || item._id, '') === normalizedPostId) || null;
    },

    buildPostShareTitle(item = {}) {
        const title = this.normalizeDisplayText(item.title || item.name, '');
        const topicCategory = Number(item.topicCategory);
        const categoryLabel = this.normalizeDisplayText(
            item.topicCategoryLabel,
            Number.isNaN(topicCategory) ? '' : this.getTopicCategoryLabel(topicCategory)
        );

        if (title && categoryLabel) {
            return `${categoryLabel}｜${title}`;
        }

        return title || '钓友说';
    },

    buildPostShareImage(item = {}) {
        const displayImages = Array.isArray(item.displayImages) ? item.displayImages : [];
        const images = displayImages.length ? displayImages : this.normalizeStringList(item.images);
        return this.normalizeDisplayText(images[0], '/images/share.png');
    },

    buildPostSharePath(item = {}) {
        const postId = this.normalizeDisplayText(item.id || item._id, '');
        const sharerUid = this.getCurrentUserId();
        const query = [`id=${encodeURIComponent(postId)}`, 'shareType=post'];

        if (sharerUid) {
            query.push(`sharerUid=${encodeURIComponent(sharerUid)}`);
        }

        return `/pkgContent/detail/detail?${query.join('&')}`;
    },

    buildTimelinePreviewPath(item = {}) {
        const postId = this.normalizeDisplayText(item.id || item._id, '');
        const sharerUid = this.getCurrentUserId();
        const query = [`id=${encodeURIComponent(postId)}`, 'shareType=timelinePreview'];

        if (sharerUid) {
            query.push(`sharerUid=${encodeURIComponent(sharerUid)}`);
        }

        return `/pages/timeline-preview/index?${query.join('&')}`;
    },

    getHomeShareConfig() {
        return {
            title: '钓友说｜看真实装备体验和钓获分享',
            path: '/pages/index/index',
            imageUrl: '/images/share.png'
        };
    },

    getPostShareConfig(postId) {
        const item = this.findTopicById(postId);
        if (!item) {
            return this.getHomeShareConfig();
        }

        return {
            title: this.buildPostShareTitle(item),
            path: this.buildPostSharePath(item),
            imageUrl: this.buildPostShareImage(item)
        };
    },

    closeMoreMenu() {
        if (!this.data.activeMorePostId) {
            return;
        }

        this.setData({
            activeMorePostId: ''
        });
    },

    onMoreMenuShareTap() {
        this.closeMoreMenu();
    },

    onMoreMenuTimelinePreview(e) {
        const postId = this.normalizeDisplayText(e.currentTarget.dataset.id, '');
        const item = this.findTopicById(postId);
        this.closeMoreMenu();

        if (!item) {
            wx.showToast({
                title: '帖子信息未找到',
                icon: 'none'
            });
            return;
        }

        wx.navigateTo({
            url: this.buildTimelinePreviewPath(item)
        });
    },

    onMoreMenuCopyPath(e) {
        const postId = this.normalizeDisplayText(e.currentTarget.dataset.id, '');
        const item = this.findTopicById(postId);
        this.closeMoreMenu();

        if (!item) {
            wx.showToast({
                title: '帖子信息未找到',
                icon: 'none'
            });
            return;
        }

        wx.setClipboardData({
            data: this.buildPostSharePath(item),
            success: () => {
                wx.showToast({
                    title: '帖子路径已复制',
                    icon: 'success'
                });
            }
        });
    },

    onMoreMenuFavoriteTap() {
        this.closeMoreMenu();
        wx.showToast({
            title: '收藏功能开发中',
            icon: 'none'
        });
    },

    onMoreMenuReportTap() {
        this.closeMoreMenu();
        wx.showToast({
            title: '举报功能开发中',
            icon: 'none'
        });
    },

    noop() {
        // 占位方法，用于阻止事件冒泡。
    },

    formatUsageYearLabel(value) {
        return USAGE_YEAR_LABELS[value] || this.normalizeDisplayText(value, '');
    },

    formatUsageFrequencyLabel(value) {
        return USAGE_FREQUENCY_LABELS[value] || this.normalizeDisplayText(value, '');
    },

    formatRecommendSummaryLabel(value) {
        return RECOMMEND_SUMMARY_LABELS[value] || this.normalizeDisplayText(value, '');
    },

    getTagGroupDefinition(groupKey, gearCategory) {
        const globalGroups = Array.isArray(tagConfig.globalGroups) ? tagConfig.globalGroups : [];
        const categoryGroups = ((tagConfig.categoryGroups || {})[gearCategory] || []);
        return globalGroups.find(group => group.groupKey === groupKey)
            || categoryGroups.find(group => group.groupKey === groupKey)
            || null;
    },

    getTagGroupOptions(groupKey, gearCategory) {
        const group = this.getTagGroupDefinition(groupKey, gearCategory);
        if (!group) {
            return [];
        }
        if (Array.isArray(group.options) && group.options.length) {
            return group.options;
        }
        if (group.categoryOptions && gearCategory && Array.isArray(group.categoryOptions[gearCategory])) {
            return group.categoryOptions[gearCategory];
        }
        return [];
    },

    mapTopicTagLabel(groupKey, value, gearCategory) {
        const text = this.normalizeDisplayText(value, '');
        if (!text) {
            return '';
        }
        const matched = this.getTagGroupOptions(groupKey, gearCategory).find(option => option.id === text);
        return matched ? this.normalizeDisplayText(matched.label, text) : text;
    },

    mapTopicTagList(groupKey, values, gearCategory) {
        return this.normalizeStringList(values)
            .map(item => this.mapTopicTagLabel(groupKey, item, gearCategory))
            .filter(Boolean);
    },

    formatQuestionTypeLabel(value) {
        return QUESTION_TYPE_LABELS[value] || this.normalizeDisplayText(value, '');
    },

    getTopicCategoryLabel(topicCategory) {
        return TOPIC_CATEGORY_LABELS[topicCategory] || '帖子';
    },

    getGearCategoryLabel(key) {
        return GEAR_CATEGORY_LABELS[key] || '';
    },

    formatLocationTagDisplay(value) {
        const text = this.normalizeDisplayText(value, '');
        if (!text) {
            return '';
        }
        return text.startsWith('#') ? text : `#${text}`;
    },

    formatCatchMeasure(value, isSecret, isEstimated, unit) {
        if (isSecret) {
            return `♾️${unit}`;
        }
        const text = this.normalizeDisplayText(value, '');
        if (!text) {
            return '';
        }
        return `${text}${unit}${isEstimated ? '（目测）' : ''}`;
    },

    formatExperienceGradeLabel(value) {
        return this.formatRecommendSummaryLabel(value);
    },

    buildRecommendReasonTags(item = {}) {
        const gearCategory = this.normalizeDisplayText(item.gearCategory, '');
        const shareReasons = this.mapTopicTagList('shareReasons', item.tags && item.tags.shareReasons, gearCategory).slice(0, 1);
        const pros = this.normalizeStringList(item.pros).slice(0, 1);
        return [...shareReasons, ...pros].filter(Boolean).slice(0, 2);
    },

    buildExperienceKeyTags(item = {}) {
        const gearCategory = this.normalizeDisplayText(item.gearCategory, '');
        const tags = [];
        const pushTag = (value) => {
            const text = this.normalizeDisplayText(value, '');
            if (text && !tags.includes(text)) {
                tags.push(text);
            }
        };
        this.mapTopicTagList('fit', item.tags && item.tags.fit, gearCategory).slice(0, 1).forEach(pushTag);
        this.mapTopicTagList('purchaseAdvice', item.tags && item.tags.purchaseAdvice, gearCategory).slice(0, 1).forEach(pushTag);
        this.mapTopicTagList('compareProfile', item.tags && item.tags.compareProfile, gearCategory).slice(0, 1).forEach(pushTag);
        return tags.slice(0, 2);
    },

    buildTripMetaText(item = {}) {
        const weatherSeason = [
            this.normalizeDisplayText(item.season, ''),
            this.normalizeDisplayText(item.weather, '')
        ].filter(Boolean).slice(0, 2).join(' / ');
        const parts = [
            this.normalizeDisplayText(item.waterType, ''),
            weatherSeason
        ].filter(Boolean);
        return parts.join(' · ');
    },

    buildUserMeta(item = {}, topicCategory) {
        if (topicCategory === TOPIC_CATEGORY.RECOMMEND || topicCategory === TOPIC_CATEGORY.EXPERIENCE) {
            const usageYear = this.formatUsageYearLabel(item.usageYear);
            if (usageYear) {
                return { prefix: '已使用', text: usageYear };
            }
        }

        if (topicCategory === TOPIC_CATEGORY.QUESTION) {
            return { prefix: '', text: this.formatQuestionTypeLabel(item.questionType) || this.getTopicCategoryLabel(topicCategory) };
        }

        if (topicCategory === TOPIC_CATEGORY.CATCH) {
            return { prefix: '', text: this.formatLocationTagDisplay(item.locationTag) || this.getTopicCategoryLabel(topicCategory) };
        }

        if (topicCategory === TOPIC_CATEGORY.TRIP) {
            return { prefix: '', text: this.normalizeDisplayText(item.tripResult, this.getTopicCategoryLabel(topicCategory)) };
        }

        return { prefix: '', text: this.getTopicCategoryLabel(topicCategory) };
    },

    buildTopicMeta(item = {}, topicCategory, gearCategoryKeys = []) {
        if (topicCategory === TOPIC_CATEGORY.RECOMMEND || topicCategory === TOPIC_CATEGORY.EXPERIENCE) {
            const gearLabels = gearCategoryKeys.map(key => this.getGearCategoryLabel(key)).filter(Boolean);
            const metaParts = [
                gearLabels[0] || '',
                this.normalizeDisplayText(item.gearModel, '')
            ].filter(Boolean);
            return metaParts.join(' · ');
        }

        if (topicCategory === TOPIC_CATEGORY.QUESTION) {
            const metaParts = [
                this.getGearCategoryLabel(item.relatedGearCategory),
                this.normalizeDisplayText(item.relatedGearModel, '')
            ].filter(Boolean);
            return metaParts.join(' · ');
        }

        if (topicCategory === TOPIC_CATEGORY.CATCH) {
            const metaParts = [
                this.formatCatchMeasure(item.length, item.isLengthSecret, item.isLengthEstimated, 'cm'),
                this.formatCatchMeasure(item.weight, item.isWeightSecret, item.isWeightEstimated, 'kg')
            ].filter(Boolean);
            return metaParts.join(' / ');
        }

        if (topicCategory === TOPIC_CATEGORY.TRIP) {
            return this.buildTripMetaText(item);
        }

        return '';
    },

    buildTopicCardTags(item = {}, topicCategory, gearCategoryKeys = []) {
        const tags = [];
        const pushTag = (value) => {
            const text = this.normalizeDisplayText(value, '');
            if (text && !tags.includes(text)) {
                tags.push(text);
            }
        };

        gearCategoryKeys.slice(0, 1).forEach(key => pushTag(this.getGearCategoryLabel(key)));

        if (topicCategory === TOPIC_CATEGORY.RECOMMEND) {
            this.buildRecommendReasonTags(item).forEach(pushTag);
        } else if (topicCategory === TOPIC_CATEGORY.EXPERIENCE) {
            pushTag(this.formatExperienceGradeLabel(item.summary));
            this.buildExperienceKeyTags(item).forEach(pushTag);
        } else if (topicCategory === TOPIC_CATEGORY.QUESTION) {
            pushTag(this.formatQuestionTypeLabel(item.questionType));
            if (item.quickReplyOnly) {
                pushTag('仅快答');
            }
        } else if (topicCategory === TOPIC_CATEGORY.CATCH) {
            pushTag(this.formatLocationTagDisplay(item.locationTag));
        } else if (topicCategory === TOPIC_CATEGORY.TRIP) {
            pushTag(this.normalizeDisplayText(item.tripResult, ''));
            this.normalizeStringList(item.targetFish).slice(0, 1).forEach(pushTag);
        }

        if (!tags.length) {
            pushTag(this.getTopicCategoryLabel(topicCategory));
        }

        return tags.slice(0, 3);
    },

    buildTopicDescription(item = {}, topicCategory, plainContent = '') {
        const contentText = this.normalizeDisplayText(plainContent, '');

        if (topicCategory === TOPIC_CATEGORY.RECOMMEND) {
            return this.formatRecommendSummaryLabel(item.summary)
                || this.normalizeStringList(item.pros)[0]
                || contentText
                || '分享这件值得关注的装备体验。';
        }

        if (topicCategory === TOPIC_CATEGORY.EXPERIENCE) {
            const gearCategory = this.normalizeDisplayText(item.gearCategory, '');
            return this.formatRecommendSummaryLabel(item.summary)
                || this.mapTopicTagList('pros', item.tags && item.tags.pros, gearCategory)[0]
                || this.normalizeStringList(item.pros)[0]
                || contentText
                || '这是一篇长测评，包含体验、评分与适配信息。';
        }

        if (topicCategory === TOPIC_CATEGORY.QUESTION) {
            return contentText
                || this.normalizeDisplayText(item.relatedGearModel, '')
                || '发起一个问题或讨论，等待更多钓友参与。';
        }

        if (topicCategory === TOPIC_CATEGORY.CATCH) {
            return this.buildTopicMeta(item, topicCategory)
                || '记录这次鱼获的地点和关键尺寸信息。';
        }

        if (topicCategory === TOPIC_CATEGORY.TRIP) {
            const summary = [
                this.normalizeStringList(item.rigs).join('、'),
                contentText
            ].filter(Boolean).join(' · ');
            return summary || '分享这次钓行的结果、状态和环境。';
        }

        return contentText || '暂无内容';
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 获取导航栏高度信息
        const app = getApp()
        this.setData({
            statusBarHeight: app.globalData.statusBarHeight,
            navBarHeight: app.globalData.navBarHeight
        })
        this.enablePageShare();
        
        // 初始化性能与节流参数
        this._ttiMarks = { start: Date.now(), logged: false };
        this._pendingAnglers = [];
        this._chunkCursor = 0;
        this._chunkTimer = null;
        this._currentRenderSource = 'init';
        this._shouldTrimAnglers = false;
        this._isChunkAppending = false;
        this._waterfallColumns = { left: [], right: [] };
        this._waterfallHeights = [0, 0];
        this._listScrollTop = 0;
        this._waterfallScrollTop = 0;
        this._loadAnglerPromise = null;
        this._isLoadingAnglerData = false;

        // 初始化主题模式
        this.initThemeMode();

        // 初始化布局模式
        this.initLayoutMode();

        // 使用本地缓存兜底首屏
        this.renderCachedHomeFeed();

        // 加载钓友说数据
        this.loadAnglerData();

        // 计算功能导航区域高度
        this.calculateFunctionNavHeight();

        console.log('[首页] 页面加载完成');
    },

    /**
     * 计算功能导航区域高度（约占屏幕高度的18%）
     */
    calculateFunctionNavHeight() {
        const app = getApp();
        const cachedInfo = app.globalData.systemInfo;

        if (cachedInfo && cachedInfo.screenHeight) {
            const functionNavHeight = Math.floor(cachedInfo.screenHeight * 0.18);
            this.setData({
                functionNavHeight
            });
            return;
        }

        if (this._systemInfoLoading) {
            return;
        }

        this._systemInfoLoading = true;
        wx.getSystemInfo({
            success: (res) => {
                app.globalData.systemInfo = res;
                const functionNavHeight = Math.floor(res.screenHeight * 0.18);
                this.setData({
                    functionNavHeight
                });
            },
            fail: (error) => {
                console.warn('[首页] 异步获取系统信息失败:', error);
            },
            complete: () => {
                this._systemInfoLoading = false;
            }
        });
    },

    /**
     * 使用本地缓存渲染首屏兜底
     */
    renderCachedHomeFeed() {
        try {
            const cache = wx.getStorageSync(HOME_FEED_CACHE_KEY);
            if (cache && Array.isArray(cache.list) && cache.list.length) {
                const isExpired = cache.timestamp ? (Date.now() - cache.timestamp > HOME_FEED_CACHE_TTL) : false;
                if (isExpired) {
                    console.log('[首页] 本地首页缓存已过期，跳过使用并清理');
                    wx.removeStorageSync(HOME_FEED_CACHE_KEY);
                    return;
                }

                console.log('[首页] 使用本地缓存渲染首屏数据:', cache.list.length, '条');
                this.fullAnglerList = cache.list.slice();
                const updatedFilterTabs = this.buildFilterTabsWithData(this.fullAnglerList);
                const resolvedSubFilter = this.ensureValidSubFilter(this.data.currentFilter, this.data.subFilter, updatedFilterTabs);
                const updatePayload = { filterTabs: updatedFilterTabs };

                if (cache.timestamp) {
                    updatePayload.lastUpdatedAt = cache.timestamp;
                }

                if (resolvedSubFilter !== this.data.subFilter) {
                    updatePayload.subFilter = resolvedSubFilter;
                }

                this.setData(updatePayload, () => {
                    this.applyFilters({ source: 'cache' });
                });
            }
        } catch (error) {
            console.warn('[首页] 读取首屏缓存失败:', error);
        }
    },

    /**
     * 将数据拆分为小块逐步渲染
     */
    queueAnglerListRender(list, { source = 'network' } = {}) {
        if (!Array.isArray(list)) {
            console.warn('[首页] 列表数据格式异常，无法渲染');
            return;
        }

        const dedupedList = this.dedupePostsById(list, `queue:${source}`);
        this.clearChunkTimer();
        this._currentRenderSource = source;
        this._pendingAnglers = dedupedList.slice();
        this._chunkCursor = 0;
        this._shouldTrimAnglers = false;
        this._isChunkAppending = false;
        this._waterfallColumns = { left: [], right: [] };
        this._waterfallHeights = [0, 0];
        this._listScrollTop = 0;
        this._waterfallScrollTop = 0;

        const shouldResetList = !String(source).includes('avatar');
        const resetPayload = {
            waterfallColumns: {
                left: [],
                right: []
            },
            waterfallColumnHeights: [0, 0],
            anglerHasMore: false,
            isWaterfallLoading: false,
            listScrollTop: 0,
            waterfallScrollTop: 0
        };

        if (shouldResetList) {
            resetPayload.originList = [];
        }

        if (!dedupedList.length) {
            this.setData({
                ...resetPayload,
                showSkeleton: false,
                isInitialRenderComplete: true
            });
            return;
        }

        const shouldShowSkeleton = shouldResetList && !this.data.originList.length;
        this.setData({
            ...resetPayload,
            showSkeleton: shouldShowSkeleton,
            isInitialRenderComplete: !shouldShowSkeleton
        }, () => {
            this.renderNextChunk();
        });
    },

    /**
     * 渲染下一批数据
     */
    renderNextChunk() {
        if (!Array.isArray(this._pendingAnglers)) {
            return;
        }

        if (this._isChunkAppending) {
            return;
        }

        const total = this._pendingAnglers.length;
        if (this._chunkCursor >= total) {
            this.clearChunkTimer();
            if (this._shouldTrimAnglers && this.data.originList.length > total) {
                this.setData({
                    originList: this.data.originList.slice(0, total),
                    anglerHasMore: false,
                    isWaterfallLoading: false
                });
            } else if (this.data.anglerHasMore || this.data.isWaterfallLoading) {
                this.setData({
                    anglerHasMore: false,
                    isWaterfallLoading: false
                });
            }
            return;
        }

        this._isChunkAppending = true;
        const chunkSize = this.data.chunkSize || INITIAL_CHUNK_SIZE;
        const nextItems = this._pendingAnglers.slice(this._chunkCursor, this._chunkCursor + chunkSize);
        if (!nextItems.length) {
            this._isChunkAppending = false;
            if (this.data.anglerHasMore || this.data.isWaterfallLoading) {
                this.setData({
                    anglerHasMore: false,
                    isWaterfallLoading: false
                });
            }
            return;
        }

        const update = {};
        const baseIndex = this._chunkCursor;
        const newCursor = this._chunkCursor + nextItems.length;
        const hasMore = newCursor < total;
        nextItems.forEach((item, idx) => {
            update[`originList[${baseIndex + idx}]`] = item;
        });

        if (baseIndex === 0 && this.data.showSkeleton) {
            update.showSkeleton = false;
            update.isInitialRenderComplete = true;
            this.markFirstInteractive(this._currentRenderSource);
        }

        this._chunkCursor = newCursor;
        update.anglerHasMore = hasMore;
        update.isWaterfallLoading = this.data.layoutMode === LAYOUT_MODE.WATERFALL && hasMore;

        const waterfallUpdate = this.prepareWaterfallAppend(nextItems, baseIndex === 0);
        if (waterfallUpdate) {
            update['waterfallColumns.left'] = waterfallUpdate.columns.left;
            update['waterfallColumns.right'] = waterfallUpdate.columns.right;
            update.waterfallColumnHeights = waterfallUpdate.heights;
        }

        this.setData(update, () => {
            this.clearChunkTimer();
            this._isChunkAppending = false;
            if (hasMore) {
                this._chunkTimer = setTimeout(() => this.renderNextChunk(), CHUNK_APPEND_DELAY);
            } else {
                if (this._shouldTrimAnglers && this.data.originList.length > total) {
                    this.setData({ originList: this.data.originList.slice(0, total) });
                }
                if (this.data.isWaterfallLoading) {
                    this.setData({ isWaterfallLoading: false });
                }
            }
        });
    },

    /**
     * 清理渲染定时器
     */
    clearChunkTimer() {
        if (this._chunkTimer) {
            clearTimeout(this._chunkTimer);
            this._chunkTimer = null;
        }
    },

    /**
     * 初始化布局模式
     */
    initLayoutMode() {
        try {
            const storedMode = wx.getStorageSync(LAYOUT_MODE_STORAGE_KEY);
            if (storedMode && Object.values(LAYOUT_MODE).includes(storedMode)) {
                this.setData({ layoutMode: storedMode });
            }
        } catch (error) {
            console.warn('[首页] 读取布局偏好失败:', error);
        }
    },

    /**
     * 记录首屏可交互时间
     */
    markFirstInteractive(source) {
        if (!this._ttiMarks || this._ttiMarks.logged) {
            return;
        }
        const elapsed = Date.now() - (this._ttiMarks.start || Date.now());
        console.log(`[首页][TTI] 首次可交互(${source})耗时 ${elapsed}ms`);
        this._ttiMarks.logged = true;
    },

    /**
     * 切换布局模式
     */
    onLayoutModeChange(e) {
        const currentDs = (e && e.currentTarget && e.currentTarget.dataset) || {};
        const targetDs = (e && e.target && e.target.dataset) || {};
        const validModes = Object.values(LAYOUT_MODE);
        const datasetCandidates = [];

        if (currentDs.mode !== undefined) {
            datasetCandidates.push(String(currentDs.mode).trim().toLowerCase());
        }
        if (targetDs.mode !== undefined) {
            datasetCandidates.push(String(targetDs.mode).trim().toLowerCase());
        }

        let rawMode = datasetCandidates.find(mode => validModes.includes(mode));

        if (!rawMode && datasetCandidates.length) {
            rawMode = datasetCandidates[0];
        }

        let mode = rawMode;

        if (mode === this.data.layoutMode) {
            let alternative = null;

            if (datasetCandidates.length > 1) {
                alternative = datasetCandidates.find(item => item !== mode && validModes.includes(item)) || null;
            }

            if (!alternative) {
                alternative = validModes.find(candidate => candidate !== this.data.layoutMode) || null;
            }

            if (alternative && alternative !== mode) {
                mode = alternative;
            }
        }

        if (!mode || !validModes.includes(mode)) {
            mode = this.data.layoutMode === LAYOUT_MODE.WATERFALL ? LAYOUT_MODE.LIST : LAYOUT_MODE.WATERFALL;
        }

        if (mode === this.data.layoutMode) {
            return;
        }

        const update = { layoutMode: mode };

        if (mode === LAYOUT_MODE.WATERFALL) {
            const cached = this.getCachedWaterfallState();
            if (cached && cached.hasContent) {
                if (cached.shouldSyncColumns) {
                    update['waterfallColumns.left'] = cached.columns.left;
                    update['waterfallColumns.right'] = cached.columns.right;
                }
                if (cached.shouldSyncHeights) {
                    update.waterfallColumnHeights = cached.heights.slice();
                }
            } else if (Array.isArray(this.data.originList) && this.data.originList.length) {
                const rebuilt = this.prepareWaterfallAppend(this.data.originList || [], true);

                if (rebuilt && (rebuilt.columns.left.length > 0 || rebuilt.columns.right.length > 0)) {
                    update['waterfallColumns.left'] = rebuilt.columns.left;
                    update['waterfallColumns.right'] = rebuilt.columns.right;
                    update.waterfallColumnHeights = rebuilt.heights.slice();
                } else {
                    console.warn('[首页][瀑布流] 无法重建瀑布流列，保留现有数据');
                }
            }
            update.waterfallScrollTop = this._waterfallScrollTop || 0;
            update.isWaterfallLoading = this.data.anglerHasMore;
        } else {
            update.listScrollTop = typeof this._listScrollTop === 'number' ? this._listScrollTop : 0;
            update.isWaterfallLoading = false;
        }
        this.setData(update, () => {
            try {
                wx.setStorageSync(LAYOUT_MODE_STORAGE_KEY, mode);
            } catch (error) {
                console.warn('[首页] 写入布局偏好失败:', error);
            }
        });
    },

    /**
     * 获取缓存的瀑布流列数据
     */
    getCachedWaterfallState() {
        const memoryColumns = (this._waterfallColumns && typeof this._waterfallColumns === 'object')
            ? this._waterfallColumns
            : null;
        const memoryHeights = Array.isArray(this._waterfallHeights) && this._waterfallHeights.length === 2
            ? this._waterfallHeights
            : null;
        const dataColumns = this.data && this.data.waterfallColumns && typeof this.data.waterfallColumns === 'object'
            ? this.data.waterfallColumns
            : null;
        const dataHeights = this.data && Array.isArray(this.data.waterfallColumnHeights) && this.data.waterfallColumnHeights.length === 2
            ? this.data.waterfallColumnHeights
            : null;

        const checkHasContent = (columns) => {
            if (!columns) {
                return false;
            }
            const leftHas = Array.isArray(columns.left) && columns.left.length > 0;
            const rightHas = Array.isArray(columns.right) && columns.right.length > 0;
            return leftHas || rightHas;
        };

        if (checkHasContent(memoryColumns)) {
            const heights = memoryHeights ? memoryHeights.slice() : [0, 0];
            const shouldSyncColumns = !dataColumns
                || !Array.isArray(dataColumns.left)
                || !Array.isArray(dataColumns.right);
            const shouldSyncHeights = !dataHeights
                || dataHeights.length !== 2;
            return {
                source: 'memory',
                hasContent: true,
                columns: {
                    left: Array.isArray(memoryColumns.left) ? memoryColumns.left.slice() : [],
                    right: Array.isArray(memoryColumns.right) ? memoryColumns.right.slice() : []
                },
                heights,
                shouldSyncColumns,
                shouldSyncHeights
            };
        }

        if (checkHasContent(dataColumns)) {
            return {
                source: 'data',
                hasContent: true,
                columns: {
                    left: Array.isArray(dataColumns.left) ? dataColumns.left.slice() : [],
                    right: Array.isArray(dataColumns.right) ? dataColumns.right.slice() : []
                },
                heights: dataHeights ? dataHeights.slice() : [0, 0],
                shouldSyncColumns: false,
                shouldSyncHeights: false
            };
        }

        return {
            source: 'empty',
            hasContent: false,
            columns: {
                left: [],
                right: []
            },
            heights: [0, 0],
            shouldSyncColumns: false,
            shouldSyncHeights: false
        };
    },

    /**
     * 记录列表滚动位置
     */
    onListScroll(e) {
        if (e && e.detail && typeof e.detail.scrollTop === 'number') {
            this._listScrollTop = e.detail.scrollTop;
        }
    },

    /**
     * 记录瀑布流滚动位置
     */
    onWaterfallScroll(e) {
        if (e && e.detail && typeof e.detail.scrollTop === 'number') {
            this._waterfallScrollTop = e.detail.scrollTop;
        }
    },

    /**
     * 列表触底加载
     */
    onListReachBottom() {
        this.loadNextAnglerPage();
    },

    /**
     * 瀑布流触底加载
     */
    onWaterfallReachBottom() {
        this.loadNextAnglerPage();
    },

    /**
     * 加载下一批钓友说数据（用于列表和瀑布流的触底加载）
     */
    loadNextAnglerPage() {
        if (!Array.isArray(this._pendingAnglers) || !this._pendingAnglers.length) {
            return;
        }

        if (this._chunkCursor >= this._pendingAnglers.length) {
            if (this.data.anglerHasMore || this.data.isWaterfallLoading) {
                this.setData({ anglerHasMore: false, isWaterfallLoading: false });
            }
            return;
        }

        this.clearChunkTimer();
        this.renderNextChunk();
    },

    /**
     * 准备瀑布流列数据
     */
    prepareWaterfallAppend(items, reset = false) {
        if (!Array.isArray(items)) {
            console.warn('[首页][瀑布流] prepareWaterfallAppend: items不是数组', items);
            return null;
        }

                let columns = this._waterfallColumns && typeof this._waterfallColumns === 'object'
            ? {
                left: Array.isArray(this._waterfallColumns.left) ? this._waterfallColumns.left.slice() : [],
                right: Array.isArray(this._waterfallColumns.right) ? this._waterfallColumns.right.slice() : []
            }
            : { left: [], right: [] };

        let heights = Array.isArray(this._waterfallHeights) && this._waterfallHeights.length === 2
            ? this._waterfallHeights.slice()
            : [0, 0];

        if (reset) {
            columns = { left: [], right: [] };
            heights = [0, 0];
        }

        let hasAppend = false;
        let processedCount = 0;

        items.forEach((originItem) => {
            const meta = this.createWaterfallCardMeta(originItem);
            if (!meta) return;

            let { estimatedHeight, cardData } = meta;

            // 当前已经排好的全局索引（0-based）
            const globalIndex = (columns.left.length + columns.right.length);

            // 1) 根据全局索引决定高度档（首行+后续节奏）
            const presetType = this.getWaterfallHeightPreset(globalIndex);
            if (presetType) {
                cardData._hType = presetType;
                estimatedHeight = this.applyHeightPreset(estimatedHeight, presetType);
                // 同步缩放可视占位高度，让交错效果在 UI 生效
                const scale = WATERFALL_HEIGHT_PRESET[presetType] || 1.0;
                const baseRatio = (typeof cardData.imageRatio === 'number' && cardData.imageRatio > 0) ? cardData.imageRatio : WATERFALL_DEFAULT_RATIO;
                const basePlaceholder = Math.max(60, Math.round((1 / baseRatio) * 1000) / 10);
                const scaledPlaceholder = Math.max(60, Math.min(170, Math.round(basePlaceholder * 10 * scale) / 10));
                cardData.placeholderRatio = scaledPlaceholder;
            }

            // 2) 默认放到当前更矮的一列
            let targetColumnIndex = heights[0] <= heights[1] ? 0 : 1;

            // 3) 轻微纠偏：避免出现“卡数不同但两列高度几乎相等”的违和情况
            //    如果这个选择会让两列高度差 < WATERFALL_MIN_DIFF，则尝试另一列
            const nextHeights = heights.slice();
            nextHeights[targetColumnIndex] += estimatedHeight;
            const diffAfter = Math.abs(nextHeights[0] - nextHeights[1]);

            if (diffAfter < WATERFALL_MIN_DIFF) {
                const altIndex = targetColumnIndex === 0 ? 1 : 0;
                const altNextHeights = heights.slice();
                altNextHeights[altIndex] += estimatedHeight;
                const altDiffAfter = Math.abs(altNextHeights[0] - altNextHeights[1]);

                // 如果另一列能形成更明显一点的高低差，就用另一列
                if (altDiffAfter > diffAfter) {
                    targetColumnIndex = altIndex;
                }
            }

            const targetKey = targetColumnIndex === 0 ? 'left' : 'right';
            columns[targetKey].push(cardData);
            heights[targetColumnIndex] += estimatedHeight;

            hasAppend = true;
            processedCount++;
        });

        this._waterfallColumns = {
            left: columns.left.slice(),
            right: columns.right.slice()
        };
        this._waterfallHeights = heights.slice();

        if (!hasAppend && !reset) {
            return null;
        }

        return {
            columns: {
                left: this._waterfallColumns.left.slice(),
                right: this._waterfallColumns.right.slice()
            },
            heights: this._waterfallHeights.slice()
        };
    },

    /**
     * 根据全局索引返回高度档（确保有节奏而非纯随机）
     */
    getWaterfallHeightPreset(globalIndex) {
        if (globalIndex === 0) return 'L'; // 首卡：高，主打
        if (globalIndex === 1) return 'S'; // 第二卡：短，制造首行错位

        // 从第3个开始做一个简单循环节奏：M -> S -> L -> S ...
        const mod = globalIndex % 4;
        if (mod === 0) return 'M';
        if (mod === 1) return 'S';
        if (mod === 2) return 'L';
        return 'S';
    },

    /**
     * 应用高度预设到估算高度
     */
    applyHeightPreset(baseHeight, presetType) {
        const scale = WATERFALL_HEIGHT_PRESET[presetType] || 1.0;
        return baseHeight * scale;
    },

    /**
     * 构建瀑布流卡片数据
     */
    createWaterfallCardMeta(item) {
        if (!item || typeof item !== 'object') {
            return null;
        }

        const cover = this.resolveWaterfallCover(item);
        const ratio = this.resolveWaterfallRatio(item, cover);
        const placeholderRatio = Math.max(60, Math.round((1 / ratio) * 1000) / 10);
        const title = (item.title || item.productName || '').trim();
        const shortTitle = title ? this.truncateText(title, MAX_WATERFALL_TITLE_LENGTH) : '';
        const tags = this.extractWaterfallTags(item);
        const eyebrow = item.topicCategory === TOPIC_CATEGORY.QUESTION
            ? (item.topicCategoryLabel || '')
            : item.topicCategory === TOPIC_CATEGORY.TRIP
                ? (item.tripResult || item.topicCategoryLabel || '')
                : item.productMeta || item.userMetaText || '';
        const summary = item.topicCategory === TOPIC_CATEGORY.CATCH
            ? (item.locationTag || item.catchMetrics || '')
            : item.description || '';
        const estimatedHeight = this.calculateWaterfallHeight({
            ratio,
            textLength: shortTitle.length + summary.length,
            tagCount: tags.length
        });

        const cardData = {
            id: item.id,
            cover,
            hasCover: Boolean(cover),
            placeholderRatio,
            imageRatio: ratio,
            placeholderTitle: shortTitle || '钓友说',
            title: shortTitle,
            eyebrow: this.truncateText(eyebrow, 22),
            summary: this.truncateText(summary, 34),
            userName: item.userName || '匿名用户',
            avatarUrl: item.avatarUrl || item.avatar || '/images/avatar-default.png',
            tags,
            islike: Boolean(item.islike === true || item.islike === 'true' || item.islike === 1 || item.islike === '1'),
            likeCount: typeof item.likeCount === 'number' ? item.likeCount : (item.likes || 0),
            commentCount: typeof item.commentCount === 'number' ? item.commentCount : (item.comments || 0)
        };
        return { estimatedHeight, cardData };
    },

    resolveWaterfallCover(item) {
        if (!item) {
            return '';
        }
        let src = '';
        let source = 'none';
        if (item.coverImg && item.coverImg.trim()) {
            src = item.coverImg.trim();
            source = 'coverImg';
        } else if (Array.isArray(item.displayImages) && item.displayImages.length) {
            src = item.displayImages[0];
            source = 'displayImages[0]';
        } else if (Array.isArray(item.images) && item.images.length) {
            src = item.images[0];
            source = 'images[0]';
        }
        return src;
    },

    resolveWaterfallRatio(item, cover) {
        let ratio = WATERFALL_DEFAULT_RATIO;
        let source = 'default';
        if (item && typeof item.coverImgRatio === 'number' && item.coverImgRatio > 0) {
            ratio = item.coverImgRatio;
            source = 'coverImgRatio';
        } else if (item && item.coverImgWidth && item.coverImgHeight && item.coverImgHeight > 0) {
            ratio = item.coverImgWidth / item.coverImgHeight;
            source = 'coverImgWidth/Height';
        } else if (item && item.imageWidth && item.imageHeight && item.imageHeight > 0) {
            ratio = item.imageWidth / item.imageHeight;
            source = 'imageWidth/Height';
        } else if (!cover) {
            source = 'default(no cover)';
        }
        return ratio;
    },

    calculateWaterfallHeight({ ratio, textLength, tagCount }) {
        const safeRatio = typeof ratio === 'number' && ratio > 0 ? ratio : WATERFALL_DEFAULT_RATIO;
        const imageHeight = WATERFALL_COLUMN_WIDTH / safeRatio;
        const titleLines = Math.min(2, Math.max(1, Math.ceil((textLength || 0) / 12)));
        const tagLines = tagCount > 2 ? 2 : tagCount > 0 ? 1 : 0;
        const contentHeight = 120 + (titleLines * WATERFALL_TEXT_LINE_HEIGHT) + (tagLines * (WATERFALL_TEXT_LINE_HEIGHT - 4));
        const total = imageHeight + contentHeight;
        return total;
    },

    extractWaterfallTags(item) {
        if (Array.isArray(item.cardTags) && item.cardTags.length) {
            return item.cardTags.slice(0, 3);
        }

        const tags = [];
        if (Array.isArray(item.gearCategoryKeys) && item.gearCategoryKeys.length) {
            item.gearCategoryKeys.slice(0, 2).forEach(key => {
                const label = GEAR_CATEGORY_LABELS[key];
                if (label) {
                    tags.push(label);
                }
            });
        }

        if (!tags.length && item.topicCategory !== undefined) {
            switch (item.topicCategory) {
                case TOPIC_CATEGORY.EXPERIENCE:
                    tags.push('体验');
                    break;
                case TOPIC_CATEGORY.QUESTION:
                    tags.push('讨论');
                    break;
                case TOPIC_CATEGORY.CATCH:
                    tags.push('鱼获');
                    break;
                case TOPIC_CATEGORY.TRIP:
                    tags.push('钓行');
                    break;
                default:
                    tags.push('推荐');
                    break;
            }
        }

        if (!tags.length && item.userMetaText) {
            tags.push(String(item.userMetaText).slice(0, 6));
        }

        return tags;
    },

    truncateText(text, maxLength) {
        if (!text) {
            return '';
        }
        if (text.length <= maxLength) {
            return text;
        }
        return text.slice(0, maxLength - 1) + '…';
    },

    /**
     * 缓存最新的首页数据
     */
    persistHomeFeedCache(list) {
        try {
            const payload = {
                list,
                timestamp: Date.now()
            };
            wx.setStorageSync(HOME_FEED_CACHE_KEY, payload);
            this.setData({ lastUpdatedAt: payload.timestamp });
        } catch (error) {
            console.warn('[首页] 写入首屏缓存失败:', error);
        }
    },

    normalizeGearCategories(rawCategory) {
        // 将各种来源的分类值统一归一化为标准键：rod/reel/bait/line/hook/other
        // 支持数组、字符串（逗号/空格分隔或 JSON 数组）、对象（取 values）等输入形式
        const extractArray = (input) => {
            if (!input) return [];

            if (Array.isArray(input)) {
                return input.map(item => String(item).trim()).filter(Boolean);
            }

            if (typeof input === 'string') {
                const trimmed = input.trim();
                if (!trimmed) return [];

                // 若是 JSON 数组字符串，优先解析
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        return parsed.map(item => String(item).trim()).filter(Boolean);
                    }
                } catch (error) {
                    // ignore json parse error
                }

                // 否则按逗号/空格分隔
                return trimmed.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
            }

            if (typeof input === 'object') {
                return Object.values(input).map(item => String(item).trim()).filter(Boolean);
            }

            return [];
        };

        const rawList = extractArray(rawCategory);
        if (!rawList.length) return [];

        const CANONICALS = ['rod', 'reel', 'bait', 'line', 'hook', 'other'];
        const aliasToCanonical = new Map();

        // 构建别名映射（包含常见中文别名与历史前缀）
        const register = (canonical, aliases) => {
            aliases.forEach(a => aliasToCanonical.set(a.toLowerCase(), canonical));
        };

        register('rod', ['rod', '竿', '杆', '鱼竿', 'bz_topic_category_rod', 'topic_category_rod', 'gear_category_rod']);
        register('reel', ['reel', '轮', '渔轮', '纺车轮', '鼓轮', 'bz_topic_category_reel', 'topic_category_reel', 'gear_category_reel']);
        register('bait', ['bait', '饵', '鱼饵', '路亚饵', 'bz_topic_category_bait', 'topic_category_bait', 'gear_category_bait']);
        register('line', ['line', '线', '鱼线', 'bz_topic_category_line', 'topic_category_line', 'gear_category_line']);
        register('hook', ['hook', '钩', '鱼钩', 'bz_topic_category_hook', 'topic_category_hook', 'gear_category_hook']);
        register('other', ['other', '其他', '其它', 'bz_topic_category_other', 'topic_category_other', 'gear_category_other']);

        const stripKnownPrefixes = (s) => {
            // 统一为小写并将连字符替换为下划线后去除常见前缀
            const base = String(s).trim().toLowerCase().replace(/[\s-]+/g, '_');
            const stripped = base.replace(/^(bz_)?(topic_)?(gear_)?category_/, '');
            return stripped;
        };

        const resultSet = new Set();
        rawList.forEach(item => {
            const original = String(item).trim();
            if (!original) return;

            const lower = original.toLowerCase();
            const compact = lower.replace(/[\s-]+/g, '_');
            const stripped = stripKnownPrefixes(original);

            // 1) 直接精确匹配别名
            let canonical = aliasToCanonical.get(lower) || aliasToCanonical.get(compact) || aliasToCanonical.get(stripped);

            // 2) 若是去前缀后恰好是标准键
            if (!canonical && CANONICALS.includes(stripped)) {
                canonical = stripped;
            }

            // 3) 中文关键字包含匹配
            if (!canonical) {
                if (original.includes('竿') || original.includes('杆')) canonical = 'rod';
                else if (original.includes('轮')) canonical = 'reel';
                else if (original.includes('饵')) canonical = 'bait';
                else if (original.includes('线')) canonical = 'line';
                else if (original.includes('钩')) canonical = 'hook';
                else if (original.includes('其他') || original.includes('其它')) canonical = 'other';
            }

            // 4) 保底：若本身就是标准键
            if (!canonical && CANONICALS.includes(lower)) {
                canonical = lower;
            }

            if (canonical && CANONICALS.includes(canonical)) {
                resultSet.add(canonical);
            }
        });

        // 按固定顺序输出，避免 UI 抖动
        return CANONICALS.filter(k => resultSet.has(k));
    },

    normalizeTimestampValue(value) {
        if (!value && value !== 0) {
            return 0;
        }

        if (typeof value === 'number') {
            return value;
        }

        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) {
                return 0;
            }

            const normalized = trimmed.replace('T', ' ').split('.')[0].replace(/-/g, '/');
            const parsed = new Date(normalized).getTime();
            if (!Number.isNaN(parsed)) {
                return parsed;
            }

            const isoParsed = Date.parse(trimmed);
            return Number.isNaN(isoParsed) ? 0 : isoParsed;
        }

        return 0;
    },

    getPublishTimestamp(rawItem = {}) {
        const candidates = [
            rawItem.publishTimestamp,
            rawItem.publishTime,
            rawItem.createTime,
            rawItem.updateTime
        ];

        for (const candidate of candidates) {
            const ts = this.normalizeTimestampValue(candidate);
            if (ts) {
                return ts;
            }
        }

        return 0;
    },

    computeHeatScore(item = {}) {
        const likeCount = Number(item.likeCount || item.likes || 0);
        const commentCount = Number(item.commentCount || item.comments || 0);
        const viewCount = Number(item.viewCount || item.views || 0);
        return likeCount * 2 + commentCount * 3 + Math.floor(viewCount / 10);
    },

    buildFilterTabsWithData(list = []) {
        const tabs = createInitialFilterTabs();
        const recommendSet = new Set();
        const experienceSet = new Set();
        let questionWaitingCount = 0;

        list.forEach(item => {
            if (!item || typeof item !== 'object') {
                return;
            }

            const topicCategory = Number(item.topicCategory);
            const gearKeys = Array.isArray(item.gearCategoryKeys) ? item.gearCategoryKeys : [];

            if (topicCategory === TOPIC_CATEGORY.RECOMMEND) {
                gearKeys.forEach(key => recommendSet.add(key));
            } else if (topicCategory === TOPIC_CATEGORY.EXPERIENCE) {
                gearKeys.forEach(key => experienceSet.add(key));
            } else if (topicCategory === TOPIC_CATEGORY.QUESTION) {
                if (Number(item.commentCount || 0) === 0) {
                    questionWaitingCount += 1;
                }
            }
        });

        // 始终使用固定类别顺序构建二级筛选，确保恒定显示“竿、轮、饵、线、钩、其他”
        const toSubFilters = () => {
            return [
                { key: 'all', label: '全部', isDefault: true },
                ...GEAR_CATEGORY_ORDER.map(key => ({ key, label: GEAR_CATEGORY_LABELS[key] || key }))
            ];
        };

        return tabs.map(tab => {
            if (tab.key === 'post-Recommend') {
                return { ...tab, subFilters: toSubFilters() };
            }

            if (tab.key === 'post-Experience') {
                return { ...tab, subFilters: toSubFilters() };
            }

            if (tab.key === 'post-Question') {
                return {
                    ...tab,
                    subFilters: tab.subFilters.map(sub => {
                        if (sub.key === 'waiting_reply') {
                            return {
                                ...sub,
                                badge: questionWaitingCount ? String(questionWaitingCount) : ''
                            };
                        }
                        return { ...sub, badge: '' };
                    })
                };
            }

            return tab;
        });
    },

    ensureValidSubFilter(primaryKey, candidateKey, filterTabs = this.data.filterTabs) {
        const filter = Array.isArray(filterTabs) ? filterTabs.find(item => item && item.key === primaryKey) : null;
        const subFilters = filter && Array.isArray(filter.subFilters) ? filter.subFilters : [];

        if (!subFilters.length) {
            return '';
        }

        if (candidateKey && subFilters.some(item => item && item.key === candidateKey)) {
            return candidateKey;
        }

        const defaultSub = subFilters.find(item => item && item.isDefault) || subFilters[0];
        return defaultSub ? defaultSub.key : '';
    },

    sortByPublishTime(list = []) {
        return list.slice().sort((a, b) => {
            const tsA = a.publishTimestamp || this.getPublishTimestamp(a);
            const tsB = b.publishTimestamp || this.getPublishTimestamp(b);
            return tsB - tsA;
        });
    },

    sortByHeat(list = []) {
        return list.slice().sort((a, b) => {
            const scoreA = this.computeHeatScore(a);
            const scoreB = this.computeHeatScore(b);
            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }
            const tsA = a.publishTimestamp || this.getPublishTimestamp(a);
            const tsB = b.publishTimestamp || this.getPublishTimestamp(b);
            return tsB - tsA;
        });
    },

    logDuplicatePostIds(list = [], label = 'unknown') {
        if (!Array.isArray(list) || !list.length) {
            return [];
        }

        const grouped = new Map();
        list.forEach((item, index) => {
            const rawId = item && (item.id || item._id);
            const id = rawId === null || typeof rawId === 'undefined' ? '' : String(rawId);
            if (!id) {
                return;
            }
            if (!grouped.has(id)) {
                grouped.set(id, []);
            }
            grouped.get(id).push({
                index,
                title: item && item.title ? item.title : '',
                topicCategory: item && item.topicCategory,
                gearModel: item && item.gearModel ? item.gearModel : '',
                publishTime: item && (item.publishTime || item.createTime || '')
            });
        });

        const duplicates = Array.from(grouped.entries())
            .filter(([, entries]) => entries.length > 1)
            .map(([id, entries]) => ({ id, entries }));

        if (duplicates.length) {
            console.warn(`[首页] 发现重复帖子ID (${label})，共 ${duplicates.length} 组:`, duplicates);
        }

        return duplicates;
    },

    dedupePostsById(list = [], label = 'unknown') {
        if (!Array.isArray(list) || !list.length) {
            return [];
        }

        this.logDuplicatePostIds(list, label);

        const seen = new Set();
        return list.filter((item, index) => {
            const rawId = item && (item.id || item._id);
            const id = rawId === null || typeof rawId === 'undefined' ? '' : String(rawId);
            if (!id) {
                return true;
            }
            if (seen.has(id)) {
                console.warn('[首页] 渲染前去重，忽略重复帖子:', {
                    label,
                    id,
                    index,
                    title: item && item.title ? item.title : '',
                    topicCategory: item && item.topicCategory
                });
                return false;
            }
            seen.add(id);
            return true;
        });
    },

    buildFilteredAnglers(primaryKey, subKey) {
        const sourceList = Array.isArray(this.fullAnglerList) ? this.fullAnglerList : [];
        let filtered = sourceList;

        switch (primaryKey) {
            case 'post-Recommend':
                filtered = sourceList.filter(item => Number(item.topicCategory) === TOPIC_CATEGORY.RECOMMEND);
                break;
            case 'post-Experience':
                filtered = sourceList.filter(item => Number(item.topicCategory) === TOPIC_CATEGORY.EXPERIENCE);
                break;
            case 'post-Question':
                filtered = sourceList.filter(item => Number(item.topicCategory) === TOPIC_CATEGORY.QUESTION);
                break;
            case 'post-Catch':
                filtered = sourceList.filter(item => Number(item.topicCategory) === TOPIC_CATEGORY.CATCH);
                break;
            case 'post-Trip':
                filtered = sourceList.filter(item => Number(item.topicCategory) === TOPIC_CATEGORY.TRIP);
                break;
            default:
                filtered = sourceList;
        }

        if (!subKey) {
            return this.sortByPublishTime(filtered);
        }

        switch (subKey) {
            case 'latest':
                return this.sortByPublishTime(filtered);
            case 'weekly_hot':
                return this.sortByHeat(filtered);
            case 'waiting_reply':
                return this.sortByPublishTime(filtered.filter(item => Number(item.commentCount || 0) === 0));
            case 'all':
                return this.sortByPublishTime(filtered);
            default:
                return this.sortByPublishTime(filtered.filter(item => Array.isArray(item.gearCategoryKeys) && item.gearCategoryKeys.includes(subKey)));
        }
    },

    applyFilters({ source = 'filter' } = {}) {
        if (!Array.isArray(this.fullAnglerList)) {
            console.warn('[首页] 当前没有可用的数据用于筛选');
            return;
        }

        const filteredList = this.dedupePostsById(
            this.buildFilteredAnglers(this.data.currentFilter, this.data.subFilter),
            `applyFilters:${source}:${this.data.currentFilter}:${this.data.subFilter}`
        );
        console.log('[首页] 应用筛选结果:', {
            source,
            currentFilter: this.data.currentFilter,
            subFilter: this.data.subFilter,
            count: filteredList.length,
            preview: filteredList.slice(0, 5).map(item => ({
                id: item && item.id,
                title: item && item.title,
                topicCategory: item && item.topicCategory
            }))
        });
        // 在瀑布流布局下，应用筛选前清空瀑布列与高度，避免沿用旧列数据导致展示未筛选的内容
        if (this.data.layoutMode === LAYOUT_MODE.WATERFALL) {
            this._waterfallColumns = { left: [], right: [] };
            this._waterfallHeights = [0, 0];
            this.setData({
                waterfallColumns: { left: [], right: [] },
                waterfallColumnHeights: [0, 0]
            });
        }
        this.setData({ showSkeleton: false });
        this.queueAnglerListRender(filteredList, { source });
    },

    /**
     * 转换云存储头像为临时可访问地址
     */
    async resolveAvatarTempUrls(anglerList) {
        try {
            const cloudAvatars = anglerList.filter(item => item.avatar && item.avatar.startsWith('cloud://'));
            if (!cloudAvatars.length) {
                return anglerList;
            }

            const fileList = cloudAvatars.map(item => ({
                fileID: item.avatar,
                type: 'avatar'
            }));

            const fileIDToURL = await tempUrlManager.getBatchTempUrls(fileList);
            return anglerList.map(item => {
                if (item.avatar && item.avatar.startsWith('cloud://') && fileIDToURL[item.avatar]) {
                    return {
                        ...item,
                        avatarUrl: fileIDToURL[item.avatar]
                    };
                }
                return item;
            });
        } catch (error) {
            console.error('[首页] 获取云存储头像临时访问URL失败:', error);
            return anglerList;
        }
    },

    async resolveListMediaUrls(anglerList) {
        try {
            const fileList = [];
            anglerList.forEach((item) => {
                const avatar = item.avatarUrl || item.avatar || '';
                const coverImg = item.coverImg || '';
                const images = Array.isArray(item.images) ? item.images : [];

                if (avatar && (/^cloud:\/\//.test(avatar) || tempUrlManager.shouldResolveUrl(avatar))) {
                    fileList.push({ fileID: avatar, type: 'avatar' });
                }
                if (coverImg && (/^cloud:\/\//.test(coverImg) || tempUrlManager.shouldResolveUrl(coverImg))) {
                    fileList.push({ fileID: coverImg, type: 'image' });
                }
                images.forEach((image) => {
                    if (image && (/^cloud:\/\//.test(image) || tempUrlManager.shouldResolveUrl(image))) {
                        fileList.push({ fileID: image, type: 'image' });
                    }
                });
            });

            if (!fileList.length) {
                return anglerList;
            }

            const fileIDToURL = await tempUrlManager.getBatchTempUrls(fileList);
            return anglerList.map((item) => {
                const avatar = item.avatarUrl || item.avatar || '';
                const images = Array.isArray(item.images) ? item.images : [];
                const nextImages = images.map((image) => fileIDToURL[image] || image);
                const nextCoverImg = fileIDToURL[item.coverImg] || item.coverImg;
                const nextAvatar = fileIDToURL[avatar] || avatar;

                return {
                    ...item,
                    avatar: nextAvatar || item.avatar,
                    avatarUrl: nextAvatar || item.avatarUrl,
                    coverImg: nextCoverImg,
                    images: nextImages,
                    displayImages: nextImages.slice(0, 3)
                };
            });
        } catch (error) {
            console.error('[首页] 处理列表媒体资源失败:', error);
            return anglerList;
        }
    },

    /**
     * 加载所有话题
     */
    async loadTopics() {
        try {
            console.log('[首页] 开始获取话题列表');
            const apiStart = Date.now();
            const response = await apiService.getAllTopics();
            console.log('[首页][性能] getAllTopics 耗时', Date.now() - apiStart, 'ms');
            
            console.log('[首页] API返回的原始数据:', response);
            
            if (response && Array.isArray(response)) {
                this.setData({
                    topics: response
                });
                console.log('[首页] 话题列表获取成功:', response.length + '条话题');
            } else {
                console.warn('[首页] 话题列表获取失败:', response);
            }
        } catch (error) {
            console.error('[首页] 获取话题列表异常:', error);
        }
    },

    /**
     * 加载钓友说数据
     */
    async loadAnglerData(options = {}) {
        const { silent = false, source = 'network' } = options;
        if (this._isLoadingAnglerData) {
            console.log('[首页][性能] loadAnglerData 正在执行，跳过重复触发，source=', source);
            return;
        }
        this._isLoadingAnglerData = true;
        const totalStart = Date.now();

        try {
            const isLoggedIn = AuthService.checkLoginStatus();
            if (!isLoggedIn) {
                wx.setStorageSync('needRefreshAfterLogin', true);
            } else {
                wx.removeStorageSync('needRefreshAfterLogin');
            }
        } catch (e) {
            console.warn('[首页] 记录登录状态用于刷新失败:', e);
        }

        const requestToken = Date.now();
        this._activeRequestToken = requestToken;

        try {
            console.log('[首页] 开始加载话题数据');
            const response = await apiService.getAllTopics();

            if (response && Array.isArray(response)) {
                const anglerList = response.map(item => {
                    const hasAverageRate = (typeof item.averageRate !== 'undefined' && item.averageRate !== null);
                    const averageRating = hasAverageRate ? Number(parseFloat(item.averageRate).toFixed(1)) : 0;
                    const images = this.normalizeStringList(item.images);
                    const displayImages = images.slice(0, 3);

                    const parsedContent = parseRichTextPayload(item.content || '');
                    const plainContent = parsedContent.text || (item.content || '');

                    const rawTopicCategory = Number(item.topicCategory);
                    const normalizedTopicCategory = Number.isInteger(rawTopicCategory) ? rawTopicCategory : TOPIC_CATEGORY.RECOMMEND;
                    const gearCategoryKeys = this.normalizeGearCategories(item.gearCategory);
                    const publishTimestamp = this.getPublishTimestamp(item);
                    const topicCategoryLabel = this.getTopicCategoryLabel(normalizedTopicCategory);
                    const userMeta = this.buildUserMeta(item, normalizedTopicCategory);
                    const productMeta = this.buildTopicMeta(item, normalizedTopicCategory, gearCategoryKeys);
                    const descriptionText = this.buildTopicDescription(item, normalizedTopicCategory, plainContent);
                    const cardTags = this.buildTopicCardTags(item, normalizedTopicCategory, gearCategoryKeys);
                    const reasonTags = this.buildRecommendReasonTags(item);
                    const gradeLabel = this.formatExperienceGradeLabel(item.summary);
                    const experienceKeyTags = this.buildExperienceKeyTags(item);
                    const fitTag = this.mapTopicTagList('fit', item.tags && item.tags.fit, item.gearCategory || '')[0] || '';
                    const advantageTag = this.mapTopicTagList('pros', item.tags && item.tags.pros, item.gearCategory || '')[0]
                        || this.normalizeStringList(item.pros)[0]
                        || '';
                    const targetFishTags = [
                        ...this.normalizeStringList(item.targetFish),
                        this.normalizeDisplayText(item.customTargetFish, '')
                    ].filter(Boolean);
                    const tripMetaText = this.buildTripMetaText(item);
                    const tripRigText = this.normalizeStringList(item.rigs).slice(0, 2).join(' · ');
                    const catchMetrics = this.buildTopicMeta(item, TOPIC_CATEGORY.CATCH);
                    const locationTagDisplay = this.formatLocationTagDisplay(item.locationTag);

                    const authorDisplayTag = item.displayTag || (item.author && item.author.displayTag) || null;
                    const mappedItem = {
                        id: item.id || item._id,
                        userName: item.nickName || '匿名用户',
                        authorDisplayTag,
                        userTag: authorDisplayTag ? authorDisplayTag.name : item.tagName,
                        userTagRarity: authorDisplayTag ? authorDisplayTag.rarityLevel : (item.tagRarityLevel || 1),
                        avatar: item.avatarUrl || '/images/avatar-default.png',
                        avatarUrl: item.avatarUrl || 'https://anglertest.xyz/avatar/avatar.png',
                        userMetaPrefix: userMeta.prefix,
                        userMetaText: userMeta.text,
                        productName: item.title || '无标题',
                        title: item.title || '无标题',
                        topicCategoryLabel,
                        coverImg: item.coverImg || '',
                        price: '0',
                        description: descriptionText,
                        content: plainContent || descriptionText,
                        formattedDescription: this.formatContentText(descriptionText),
                        subQuestion: parsedContent.subQuestion || item.subQuestion || '',
                        images,
                        displayImages,
                        productMeta,
                        cardTags,
                        rating: averageRating,
                        showRating: normalizedTopicCategory === TOPIC_CATEGORY.EXPERIENCE && averageRating > 0,
                        likes: Number(item.likeCount || 0),
                        comments: Number(item.commentCount || 0),
                        likeCount: Number(item.likeCount || 0),
                        commentCount: Number(item.commentCount || 0),
                        islike: Boolean(item.isLike === true),
                        topicCategory: normalizedTopicCategory,
                        gearCategoryKeys,
                        publishTimestamp,
                        usageYear: item.usageYear || '',
                        usageFrequency: item.usageFrequency || '',
                        summary: item.summary || '',
                        pros: this.normalizeStringList(item.pros),
                        cons: this.normalizeStringList(item.cons),
                        tags: item.tags || {},
                        gearCategory: item.gearCategory || '',
                        gearModel: item.gearModel || '',
                        questionType: item.questionType || '',
                        relatedGearCategory: item.relatedGearCategory || '',
                        relatedGearModel: item.relatedGearModel || '',
                        quickReplyOnly: Boolean(item.quickReplyOnly),
                        locationTag: item.locationTag || '',
                        locationTagDisplay,
                        length: item.length || '',
                        isLengthSecret: Boolean(item.isLengthSecret),
                        isLengthEstimated: Boolean(item.isLengthEstimated),
                        weight: item.weight || '',
                        isWeightSecret: Boolean(item.isWeightSecret),
                        isWeightEstimated: Boolean(item.isWeightEstimated),
                        tripResult: item.tripResult || '',
                        tripStatus: this.normalizeStringList(item.tripStatus),
                        targetFish: targetFishTags,
                        customTargetFish: item.customTargetFish || '',
                        rigs: this.normalizeStringList(item.rigs),
                        waterType: item.waterType || '',
                        season: item.season || '',
                        weather: item.weather || '',
                        mainSpot: item.mainSpot || '',
                        fishingTime: item.fishingTime || '',
                        averageRate: averageRating,
                        recommendationScore: Number(item.recommendationScore || 0),
                        reasonTags,
                        gradeLabel,
                        experienceKeyTags,
                        fitTag,
                        advantageTag,
                        relatedGearText: this.buildTopicMeta(item, TOPIC_CATEGORY.QUESTION),
                        catchMetrics,
                        tripMetaText,
                        tripRigText
                    };

                    return mappedItem;
                });

                const mergedList = this.mergeLikeCache(anglerList);
                const dedupedMergedList = this.dedupePostsById(mergedList, `loadAnglerData:merged:${source}`);

                if (this._activeRequestToken !== requestToken) {
                    console.log('[首页] 检测到新的加载任务，忽略过期结果');
                    return;
                }

                this.fullAnglerList = dedupedMergedList;

                const updatedFilterTabs = this.buildFilterTabsWithData(dedupedMergedList);
                const resolvedSubFilter = this.ensureValidSubFilter(this.data.currentFilter, this.data.subFilter, updatedFilterTabs);
                const updatePayload = { filterTabs: updatedFilterTabs };

                if (resolvedSubFilter !== this.data.subFilter) {
                    updatePayload.subFilter = resolvedSubFilter;
                }

                if (dedupedMergedList.length) {
                    this.persistHomeFeedCache(dedupedMergedList);
                }

                this.setData(updatePayload, () => {
                    this.applyFilters({ source });
                });
                console.log('[首页][性能] 首页首轮可渲染耗时', Date.now() - totalStart, 'ms');

                const mediaStart = Date.now();
                this.resolveListMediaUrls(dedupedMergedList).then((hydratedList) => {
                    console.log('[首页][性能] 媒体资源处理耗时', Date.now() - mediaStart, 'ms');
                    if (this._activeRequestToken !== requestToken || !Array.isArray(hydratedList)) {
                        return;
                    }
                    const dedupedHydratedList = this.dedupePostsById(hydratedList, `loadAnglerData:avatar:${source}`);
                    const hasMediaUpdate = dedupedHydratedList.some((item, index) => {
                        const prev = dedupedMergedList[index];
                        return prev && item && (
                            prev.avatarUrl !== item.avatarUrl ||
                            prev.coverImg !== item.coverImg
                        );
                    });
                    if (!hasMediaUpdate) {
                        return;
                    }
                    this.fullAnglerList = dedupedHydratedList;
                    this.persistHomeFeedCache(dedupedHydratedList);
                    this.applyFilters({ source: `${source}-media` });
                }).catch((avatarError) => {
                    console.warn('[首页] 媒体资源异步处理失败:', avatarError);
                });
                const hydratedList = dedupedMergedList;

                console.log('[首页] 话题数据加载成功，共', hydratedList.length, '条数据');
            } else {
                console.warn('[首页] 话题数据为空');
                if (!silent) {
                    wx.showToast({
                        title: '暂无数据',
                        icon: 'none'
                    });
                }
                this.fullAnglerList = [];
                const resetTabs = this.buildFilterTabsWithData([]);
                this.setData({ filterTabs: resetTabs }, () => {
                    this.queueAnglerListRender([], { source });
                });
            }
        } catch (error) {
            console.error('[首页] 加载话题数据失败:', error);
            if (!silent) {
                wx.showToast({
                    title: '数据加载失败',
                    icon: 'none'
                });
            }
            if (!this.data.originList.length) {
                this.setData({ showSkeleton: false, filterTabs: this.buildFilterTabsWithData([]) });
            }
        } finally {
            this._isLoadingAnglerData = false;
        }
    },

    /**
     * 同步显示列表中的数据到完整列表
     */
    updateFullAnglerListItem(id, newItem) {
        if (!Array.isArray(this.fullAnglerList) || this.fullAnglerList.length === 0) {
            return;
        }

        const targetIndex = this.fullAnglerList.findIndex(item => item.id == id);
        if (targetIndex === -1) {
            return;
        }

        this.fullAnglerList[targetIndex] = {
            ...this.fullAnglerList[targetIndex],
            ...newItem
        };
    },

    /**
     * 顶部筛选组件一级选项变化
     */
    onFilterTabsChange(e) {
        const { key, subKey } = e.detail || {};
        if (!key) {
            return;
        }

        const resolvedSubFilter = this.ensureValidSubFilter(key, subKey);
        if (key === this.data.currentFilter && resolvedSubFilter === this.data.subFilter) {
            return;
        }

        this.setData({
            currentFilter: key,
            subFilter: resolvedSubFilter
        }, () => {
            this.applyFilters({ source: 'filter' });
        });
    },

    /**
     * 顶部筛选组件二级选项变化
     */
    onFilterTabsSubChange(e) {
        const { key } = e.detail || {};
        if (!key) {
            return;
        }

        const resolvedSubFilter = this.ensureValidSubFilter(this.data.currentFilter, key);
        if (resolvedSubFilter === this.data.subFilter) {
            return;
        }

        this.setData({
            subFilter: resolvedSubFilter
        }, () => {
            this.applyFilters({ source: 'filter' });
        });
    },

    /**
     * 顶部筛选组件布局切换按钮
     */
    onFilterTabsLayoutToggle(e) {
        const mode = (e && e.detail && e.detail.mode) || '';
        // 复用现有的 onLayoutModeChange 逻辑，构造 dataset 传入
        const syntheticEvent = {
            currentTarget: { dataset: { mode } },
            target: { dataset: { mode } }
        };
        this.onLayoutModeChange(syntheticEvent);
    },

    /**
     * 顶部筛选组件展开状态变化
     */
    onFilterTabsToggle(e) {
        const { expanded, parentKey } = e.detail || {};
        console.log('[首页] 二级筛选切换展开状态:', parentKey, expanded);
    },

    /**
     * 查看帖子详情
     */
    viewAnglerDetail: async function(e) {
        // 检查登录状态
        const AuthService = require('../../services/auth.js');
        try {
            await AuthService.ensureLogin();
        } catch (error) {
            console.log('用户取消登录');
            return;
        }
        
        const postId = e.detail.id || e.currentTarget.dataset.id;
        
        // 查找当前帖子的点赞状态，传递给详情页
        const anglerList = this.data.originList;
        const currentItem = anglerList.find(item => item.id == postId);
        const islike = currentItem ? currentItem.islike : false;
        
        console.log('[首页] 跳转详情页 - ID:', postId, 'islike:', islike);
        
        wx.navigateTo({
            url: `/pkgContent/detail/detail?id=${postId}&islike=${islike}`
        });
    },

    /**
     * 搜索框点击事件
     */
    onSearchTap: function() {
        console.log('点击搜索框');
        wx.navigateTo({
            url: '/pkgContent/search/search'
        });
    },

    /**
     * 点赞事件
     */
    onLike: async function(e) {
        if (this._topicLikePending) {
            return;
        }

        // 检查登录状态
        const AuthService = require('../../services/auth.js');
        try {
            await AuthService.ensureLogin();
        } catch (error) {
            console.log('用户取消登录');
            return;
        }
        
        const topicId = e.currentTarget.dataset.id;
        console.log('点赞话题:', topicId);
        
        try {
            this._topicLikePending = true;
            // 调用点赞接口
            const result = await apiService.likeTopic(topicId);
            console.log('点赞结果:', result);
            
            // 更新本地数据
            const anglerList = this.data.originList;
            const index = anglerList.findIndex(item => item.id == topicId);
            
            if (index !== -1) {
                const updatedList = [...anglerList];
                const item = { ...updatedList[index] }; // 创建深拷贝确保状态不被覆盖
                
                if (result && result.isLike === true) {
                    // 点赞成功
                    item.likeCount = Number(result.likeCount || ((item.likeCount || 0) + 1));
                    item.islike = true;
                    // 缓存点赞状态到本地存储
                    this.cacheLikeStatus(topicId, true);
                    wx.showToast({
                        title: '点赞成功',
                        icon: 'success'
                    });
                } else {
                    // 取消点赞
                    item.likeCount = Math.max(Number(result && result.likeCount ? result.likeCount : (item.likeCount || 0) - 1), 0);
                    item.islike = false;
                    // 从本地存储移除点赞状态
                    this.cacheLikeStatus(topicId, false);
                    wx.showToast({
                        title: '已取消点赞',
                        icon: 'none'
                    });
                }

                updatedList[index] = item;
                this.updateFullAnglerListItem(topicId, item);

                console.log('[首页] 点赞操作后的islike状态:', item.islike, '类型:', typeof item.islike);

                this.setData({
                    originList: updatedList
                }, () => {
                    if (this.data.subFilter === 'weekly_hot') {
                        this.applyFilters({ source: 'filter' });
                    }
                });
            }
        } catch (error) {
            console.error('点赞失败:', error);
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            });
        } finally {
            this._topicLikePending = false;
        }
    },

    /**
     * 评论事件
     */
    onComment: async function(e) {
        // 检查登录状态
        const AuthService = require('../../services/auth.js');
        try {
            await AuthService.ensureLogin();
        } catch (error) {
            console.log('用户取消登录');
            return;
        }
        
        const postId = e.currentTarget.dataset.id;
        console.log('点击评论按钮，跳转到帖子详情:', postId);
        // 跳转到帖子详情页面
        wx.navigateTo({
            url: `/pkgContent/detail/detail?id=${postId}`
        });
    },

    /**
     * 更多操作事件
     */
    onMore: async function(e) {
        // 检查登录状态
        const AuthService = require('../../services/auth.js');
        try {
            await AuthService.ensureLogin();
        } catch (error) {
            console.log('用户取消登录');
            return;
        }
        
        const postId = e.currentTarget.dataset.id;
        console.log('更多操作:', postId);
        const normalizedPostId = this.normalizeDisplayText(postId, '');
        this.setData({
            activeMorePostId: this.data.activeMorePostId === normalizedPostId ? '' : normalizedPostId
        });
    },

    /**
     * 加载文章数据
     */
    loadArticles: function() {
        this.setData({
            loading: true,
            showNoResults: false
        });
        
        try {
            // 记录开始加载时间，用于性能统计
            const startTime = Date.now();
            
            // 动态加载文章数据
            const articleData = [];
            
            // 尝试读取textData目录下的所有文章文件
            // 由于小程序的安全限制，我们无法直接列出目录内容
            // 所以我们使用一个足够大的范围来尝试加载文章
            const maxArticleNumber = 50; // 设置一个足够大的数字来尝试加载文章
            
            for (let i = 1; i <= maxArticleNumber; i++) {
                try {
                    // 动态构建require路径
                    const articleModule = require(`../../data/textData/article${i}.js`);
                    // 检查导出方式，支持多种导出格式
                    let currentArticle;
                    if (articleModule.fishingData) {
                        currentArticle = articleModule.fishingData;
                    } else if (articleModule.default) {
                        currentArticle = articleModule.default;
                    } else {
                        currentArticle = articleModule;
                    }
                    // 将文章数据和对应的ID一起存储
                    articleData.push({id: i, data: currentArticle});
                    console.log(`成功加载文章: article${i}.js`);
                } catch (e) {
                    // 如果连续5个文件都加载失败，则认为已经没有更多文章了
                    if (i > 5 && articleData.length === 0) {
                        console.log('没有找到任何文章文件，停止尝试加载');
                        break;
                    }
                    // 如果已经加载了一些文章，并且连续5个文件都加载失败，则认为已经加载完所有文章
                    if (articleData.length > 0 && i - articleData.length >= 5) {
                        console.log('已加载所有可用文章文件，停止尝试加载');
                        break;
                    }
                    console.log(`尝试加载article${i}.js：文件不存在或格式不正确`);
                }
            }
            
            // 如果没有加载到任何文章，使用默认数据
            if (articleData.length === 0) {
                console.log('未能加载任何文章，使用默认数据');
                // 文章1数据
                const article1 = {
                    "title": "春季路亚鲈鱼技巧与找鱼方式全解析",
                    "author": "AImPhish",
                    "publishDate": "2025-02-15",
                    "content": "",
                    "children": [
                        {
                            "title": "引言",
                            "content": "春季是路亚鲈鱼的黄金季节，尤其是对于淡水鲈鱼（大口鲈、大口黑鲈）来说，这一时期鲈鱼的活性高，觅食积极，是钓获大鱼的最佳时机。本报告将全面分析春季路亚鲈鱼的技巧和找鱼方式，帮助钓友在春季钓鲈鱼时取得更好的成绩。",
                            "children": []
                        }
                    ]
                };
                articleData.push({id: 1, data: article1});
                
                // 显示提示信息
                wx.showToast({
                    title: '使用默认文章数据',
                    icon: 'none',
                    duration: 2000
                });
            } else {
                console.log(`成功加载了${articleData.length}篇文章`);
            }
            
            // 对文章数据进行排序（按ID或日期）
            articleData.sort((a, b) => {
                // 如果有publishDate字段，按日期排序（新的在前）
                if (a.data.publishDate && b.data.publishDate) {
                    return new Date(b.data.publishDate) - new Date(a.data.publishDate);
                }
                return 0; // 保持原有顺序
            });
            
            // 处理文章数据
            const articles = articleData.map((fishingDataWithId, index) => {
                const fishingData = fishingDataWithId.data;
                const articleId = fishingDataWithId.id;
                // 检查文章格式，适配新旧两种格式
                if (fishingData.content !== undefined) {
                    // 新格式使用 content 属性
                    return {
                        id: articleId,
                        meta: {
                            title: fishingData.title || "无标题",
                            author: fishingData.author || "未知作者",
                            publishDate: fishingData.publishDate || "未知日期"
                        },
                        text: fishingData.content, // 将 content 映射到 text
                        children: fishingData.children || [],
                        previewText: fishingData.children && fishingData.children.length > 0 ? 
                                    fishingData.children[0].content.substring(0, 50) + '...' : ''
                    };
                } else if (fishingData.text !== undefined) {
                    // 旧格式使用 text 属性
                    return {
                        id: articleId,
                        meta: {
                            title: fishingData.title || "无标题",
                            author: fishingData.author || "未知作者",
                            publishDate: fishingData.publishDate || "未知日期"
                        },
                        text: fishingData.text,
                        children: fishingData.children || [],
                        previewText: fishingData.text.substring(0, 50) + '...'
                    };
                } else {
                    // 如果两种属性都不存在，提供默认值
                    return {
                        id: articleId,
                        meta: {
                            title: fishingData.title || "无标题",
                            author: fishingData.author || "未知作者",
                            publishDate: fishingData.publishDate || "未知日期"
                        },
                        text: "",
                        children: fishingData.children || [],
                        previewText: ''
                    };
                }
            });
            
            // 计算加载时间
             const loadTime = Date.now() - startTime;
             console.log(`文章加载完成，共加载${articles.length}篇文章，耗时${loadTime}ms`);
             
             this.setData({
                 articles: articles,
                 loading: false
             });
            
            // 显示加载成功提示
            if (articles.length > 0) {
                wx.showToast({
                    title: `已加载${articles.length}篇文章`,
                    icon: 'success',
                    duration: 1500
                });
            }
            
        } catch (error) {
            console.error("加载文章失败:", error);
            this.setData({
                loading: false
            });
            wx.showToast({
                title: '加载文章失败',
                icon: 'none'
            });
        }
    },

    /**
     * 跳转到文章详情
     */
    navigateToArticlePage: async function(e) {
        // 检查登录状态
        const AuthService = require('../../services/auth.js');
        try {
            await AuthService.ensureLogin();
        } catch (error) {
            console.log('用户取消登录');
            return;
        }
        
        const articleId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pkgContent/articlePage/articlePage?articleId=${articleId}`
        });
    },

    /**
     * 发布按钮点击事件
     */
    onPublish: async function() {
        // 检查登录状态
        const AuthService = require('../../services/auth.js');
        try {
            await AuthService.ensureLogin();
        } catch (error) {
            // 如果已有登录弹窗在显示，避免重复提示
            if (error && error.message === 'LoginPromptAlreadyOpen') {
                return;
            }
            console.log('用户取消登录');
            return;
        }
        
        // 跳转到新的发布模式选择页面
        wx.navigateTo({
            url: '/pkgContent/publishMode/publishMode'
        });
    },

    /**
     * 初始化主题模式
     */
    initThemeMode: function() {
        const app = getApp();
        const isDarkMode = app.globalData.isDarkMode || false;
        this.setData({
            containerClass: isDarkMode ? 'dark-mode' : ''
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        this.calculateFunctionNavHeight();
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        console.log('AnglerSay页面onShow开始');
        // 同步主题模式状态
        this.initThemeMode();
        
        // 通知自定义导航栏更新主题
        const customNavbar = this.selectComponent('#custom-navbar');
        console.log('获取自定义导航栏组件:', customNavbar);
        if (customNavbar && customNavbar.updateTheme) {
            console.log('调用updateTheme方法');
            customNavbar.updateTheme();
        } else {
            console.log('未找到自定义导航栏组件或updateTheme方法');
        }
        
        // 通知轮播图组件更新主题
        const bannerCarousel = this.selectComponent('#banner-carousel');
        if (bannerCarousel && bannerCarousel.updateTheme) {
            bannerCarousel.updateTheme();
        }
        
        // 通知功能导航组件更新主题
        const functionNav = this.selectComponent('#functionNav');
        if (functionNav && functionNav.updateTheme) {
            functionNav.updateTheme();
        }
        
        // 列表状态处理逻辑
        if (!this.data.originList || this.data.originList.length === 0) {
            console.log('[首页] 列表为空，重新加载数据');
            if (!this._isLoadingAnglerData) {
                this.loadAnglerData();
            }
        } else {
            console.log('[首页] 列表已存在，叠加本地点赞缓存以确保状态不丢失');
            try {
                const updatedList = this.mergeLikeCache(this.data.originList);
                updatedList.forEach(item => {
                    this.updateFullAnglerListItem(item.id, item);
                });
                this.setData({ originList: updatedList });
                console.log('[首页] 已叠加本地点赞缓存');

                // 如果当前是瀑布流布局，同步瀑布列中的点赞状态与计数
                // if (this.data.layoutMode === LAYOUT_MODE.WATERFALL) {
                //     console.log('[首页][瀑布流] 同步点赞状态并重建列数据');
                //     const rebuilt = this.prepareWaterfallAppend(updatedList, true);
                //     if (rebuilt) {
                //         this.setData({
                //             waterfallColumns: rebuilt.columns,
                //             waterfallColumnHeights: rebuilt.heights
                //         });
                //         console.log('[首页][瀑布流] 列已同步，卡片点赞状态就绪');
                //     } else {
                //         console.log('[首页][瀑布流] 重建结果为空或无需更新');
                //     }
                // }
            } catch (e) {
                console.warn('[首页] 叠加本地点赞缓存失败:', e);
            }
            console.log('[首页] 点赞状态刷新流程完成');
        }
        
        // 登录完成后的一次性刷新：未登录加载过则在登录后重新拉取带islike的数据
        try {
            const isLoggedIn = AuthService.checkLoginStatus();
            const needRefresh = wx.getStorageSync('needRefreshAfterLogin');
            if (isLoggedIn && needRefresh) {
                console.log('[首页] 检测到登录完成，触发一次列表刷新以获取服务端islike');
                this.loadAnglerData();
                wx.removeStorageSync('needRefreshAfterLogin');
            }
            const needRefreshAfterPublish = wx.getStorageSync('needRefreshAfterPublish');
            if (needRefreshAfterPublish) {
                console.log('[首页] 检测到发帖完成，刷新首页列表');
                this.loadAnglerData();
                wx.removeStorageSync('needRefreshAfterPublish');
            }
        } catch (e) { console.warn('[首页] 登录后刷新检查失败:', e); }
        
        console.log('AnglerSay页面onShow结束');
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        this.clearChunkTimer();
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        this.clearChunkTimer();
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    async onPullDownRefresh() {
        this.setData({ isPullRefreshing: true });
        try {
            console.log('[首页] 开始下拉刷新');

            // 重新加载钓友说数据（基于话题接口）
            this._ttiMarks = { start: Date.now(), logged: false };
            await this.loadAnglerData({ silent: true, source: 'refresh' });

            console.log('[首页] 下拉刷新完成');
        } catch (error) {
            console.error('[首页] 下拉刷新失败:', error);
        } finally {
            // 停止下拉刷新动画
            wx.stopPullDownRefresh();
            this.setData({ isPullRefreshing: false });
        }
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {
        if (this.data.anglerHasMore) {
            this.loadNextAnglerPage();
        }
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage(res) {
        const postId = this.normalizeDisplayText(res && res.target && res.target.dataset ? res.target.dataset.id : '', '');
        if (postId) {
            return this.getPostShareConfig(postId);
        }

        return this.getHomeShareConfig();
    },

    onShareTimeline() {
        const homeShare = this.getHomeShareConfig();
        return {
            title: homeShare.title,
            query: 'shareType=home',
            imageUrl: homeShare.imageUrl
        };
    },

    onShareButtonTap() {
        this.closeMoreMenu();
    },

    /**
     * 轮播图导航栏颜色变化事件
     */
    onNavbarColorChange(e) {
        const { backgroundColor, textColor } = e.detail;
        
        // 更新数据
        this.setData({
            currentNavbarColor: backgroundColor,
            currentTextColor: textColor
        });
        
        // 获取导航栏组件实例并更新颜色
        const navbar = this.selectComponent('#custom-navbar');
        if (navbar) {
            navbar.setData({
                backgroundColor: backgroundColor,
                textColor: textColor
            });
        }
    },

    /**
     * 轮播图切换事件
     */
    onBannerChange(e) {
        const { current, item } = e.detail;
        console.log('轮播图切换到:', current, item);
    },

    /**
     * 轮播图点击事件
     */
    onBannerTap(e) {
        const { index, item } = e.detail;
        console.log('点击轮播图:', index, item);
        
        // 根据轮播图配置的链接进行跳转
        if (item.link) {
            wx.navigateTo({
                url: item.link
            });
        }
    },

    /**
     * 功能导航点击事件
     */
    onFunctionTap: async function(e) {
        const { item, id } = e.detail;
        console.log('功能导航点击:', item);

        // 登录拦截：功能导航统一需登录（若后续有公共项，可加入白名单）
        try {
            const AuthService = require('../../services/auth.js');
            await AuthService.ensureLogin();
        } catch (error) {
            // 如果已有登录弹窗在显示，避免重复提示
            if (error && error.message === 'LoginPromptAlreadyOpen') {
                return;
            }
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        // 可以在这里添加统计埋点
        this.trackFunctionClick(id);
        
        // 处理特定功能的跳转逻辑
        if (id === 'discover') {
            // 跳转到文章页面
            wx.navigateTo({
                url: '/pkgContent/articlePage/articlePage'
            }).catch(() => {
                wx.showToast({
                    title: '页面跳转失败',
                    icon: 'none'
                });
            });
            return;
        }

        // 其他功能：统一使用功能项的path进行跳转
        if (item && item.path) {
            wx.navigateTo({
                url: item.path
            }).catch(() => {
                wx.showToast({ title: '页面跳转失败', icon: 'none' });
            });
        } else {
            wx.showToast({ title: '功能开发中', icon: 'none' });
        }
    },

    /**
     * 更多功能点击事件
     */
    onMoreTap(e) {
        console.log('更多功能点击');
        wx.navigateTo({
            url: '/pages/function-list/function-list'
        }).catch(() => {
            wx.showToast({
                title: '功能开发中',
                icon: 'none'
            });
        });
    },

    /**
     * 首页刷新事件处理
     */
    onRefreshHome(e) {
        const { action } = e.detail;
        console.log('[首页] 接收到刷新事件:', action);
        
        if (action === 'refresh_angler_list') {
            console.log('[首页] 开始刷新帖子列表');
            this.loadAnglerData();
            
            // 显示刷新提示
            wx.showToast({
                title: '刷新成功',
                icon: 'success',
                duration: 1500
            });
        }
    },

    /**
     * 分享事件
     */
    onShare(e) {
        const { title, path } = e.detail;
        console.log('分享事件:', title, path);
        
        // 可以在这里处理分享逻辑
        return {
            title: title || '钓友说 - 专业的钓鱼交流平台',
            path: path || '/pages/index/index'
        };
    },

    /**
     * 统计功能点击
     */
    trackFunctionClick(functionId) {
        // 这里可以添加数据统计逻辑
        console.log('功能点击统计:', functionId);
    },

    /**
     * 缓存点赞状态到本地存储
     */
    cacheLikeStatus(topicId, isLike) {
        try {
            const key = this.getLikeCacheKey();
            const cache = wx.getStorageSync(key) || {};
            if (isLike) {
                cache[topicId] = { islike: true, ts: Date.now() };
            } else {
                delete cache[topicId];
            }
            wx.setStorageSync(key, cache);
        } catch (e) {
            console.warn('[首页] 缓存点赞状态失败:', e);
        }
    },

    /**
     * 合并本地缓存的点赞状态
     */
    mergeLikeCache(anglerList) {
        try {
            const key = this.getLikeCacheKey();
            const cache = wx.getStorageSync(key) || {};
            const ONE_DAY = 24 * 60 * 60 * 1000;
            const now = Date.now();

            return anglerList.map(item => {
                const cached = cache[item.id];
                
                // 如果API返回的已经是true，则保留API状态（最权威）
                if (item.islike === true) {
                    return item;
                }
                
                // 如果API返回false/undefined，但缓存中有有效的true状态，则使用缓存
                if (cached && now - cached.ts < ONE_DAY && cached.islike === true) {
                    return { ...item, islike: true };
                }
                
                // 其他情况保持原状
                return item;
            });
        } catch (e) {
            console.warn('[首页] 合并点赞缓存失败:', e);
            return anglerList;
        }
    },

    
})
