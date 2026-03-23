// services/api.js
const EnvUtil = require('../utils/env.js');

const OFFLINE_QUEUE_STORAGE_KEY = 'api_offline_queue';
const REQUEST_LOCK_EXEMPT_METHODS = ['GET'];
const PROD_BASE_URL = 'https://api.gearsage.club';
const DEV_BASE_URL = 'http://127.0.0.1:3001';

const BASE_URL = EnvUtil.isDevTool() ? DEV_BASE_URL : PROD_BASE_URL;

// 统一使用真实接口（不再区分开发工具和真机环境）
const MOCK_MODE = false;

console.log('[API] 环境检测结果:', EnvUtil.getEnvInfo());
console.log('[API] 模拟模式状态:', MOCK_MODE ? '启用（开发者工具）' : '禁用（真机设备）');

// 已脱离云函数分流，/mini/* 统一直连独立后台。
const CLOUD_ACTION_MAP = {};

function parseUrlAndQuery(url = '') {
  const [path, queryString = ''] = String(url).split('?');
  const query = {};
  if (queryString) {
    queryString.split('&').forEach(pair => {
      if (!pair) return;
      const [rawKey, rawValue = ''] = pair.split('=');
      if (!rawKey) return;
      const key = decodeURIComponent(rawKey);
      const value = decodeURIComponent(rawValue);
      query[key] = value;
    });
  }
  return { path, query };
}

function buildQueryString(params = {}) {
  return Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeTopicResponse(topic = {}) {
  if (!topic || typeof topic !== 'object') {
    return topic;
  }

  const images = normalizeArray(topic.images);
  const receiptImages = normalizeArray(topic.receiptImages || topic.receipt);
  const recommendReasonValue = Array.isArray(topic.recommendReason)
    ? JSON.stringify(topic.recommendReason)
    : (typeof topic.recommendReason === 'string' ? topic.recommendReason : JSON.stringify([]));

  return {
    ...topic,
    images,
    contentImages: topic.contentImages || images.join(','),
    coverImg: topic.coverImg || images[0] || '',
    receipt: typeof topic.receipt === 'string' ? topic.receipt : receiptImages.join(','),
    recommendReason: recommendReasonValue,
    islike: topic.isLike === true,
    author: topic.author || {
      id: topic.userId || '',
      name: topic.nickName || '',
      avatar: topic.avatarUrl || '',
      level: topic.level || 1,
      displayTag: topic.displayTag || null
    },
    publisher: topic.publisher || {
      id: topic.userId || '',
      nickName: topic.nickName || '',
      avatarUrl: topic.avatarUrl || '',
      level: topic.level || 1
    }
  };
}

function buildTopicPayload(topicData = {}) {
  const images = normalizeArray(topicData.contentImages || topicData.images);
  const receiptImages = normalizeArray(topicData.receipt);
  const recommendReason = (() => {
    if (typeof topicData.recommendReason === 'string') {
      return topicData.recommendReason;
    }
    if (Array.isArray(topicData.recommend)) {
      return JSON.stringify(topicData.recommend.filter(Boolean));
    }
    return JSON.stringify([]);
  })();

  return {
    id: topicData.id || undefined,
    topicCategory: Number.isFinite(Number(topicData.topicCategory)) ? Number(topicData.topicCategory) : 1,
    title: topicData.title || '',
    content: topicData.content || '',
    images,
    extra: {
      categoryKey: topicData.categoryKey || '',
      environment: topicData.environment || '',
      usagePeriod: topicData.usagePeriod || '',
      usageRate: topicData.usageRate || '',
      castingRate: topicData.castingRate,
      worthRate: topicData.worthRate,
      lifeRate: topicData.lifeRate,
      contentImages: images.join(','),
      coverImg: images[0] || '',
      receipt: receiptImages.join(','),
      recommendReason
    }
  };
}

function normalizeCloudPayload(action, payload = {}) {
  const nextPayload = { ...payload };

  if (action === 'topic.mine' && typeof nextPayload.status === 'string' && /^\d+$/.test(nextPayload.status)) {
    nextPayload.status = Number(nextPayload.status);
  }

  if (action === 'topic.like' && nextPayload.id && !nextPayload.topicId) {
    nextPayload.topicId = nextPayload.id;
  }
  if (action === 'goods.redeem' && nextPayload.id && !nextPayload.goodsId) {
    nextPayload.goodsId = nextPayload.id;
  }
  // task.receive 入参兼容：保留原始 id，避免误判为 recordId 导致服务端只按记录查询

  return nextPayload;
}

const TAG_GOODS_MOCK_DATA = [
  {
    id: 'goods_tag_fun_almost_skunk',
    goodsName: '差点打龟',
    image: '/images/icons/h28.png',
    points: 65,
    stock: 999,
    description: '轻度翻车也能优雅自嘲的社区梗标签。',
    rules: '兑换后永久获得，可在编辑资料中佩戴。',
    rarityLevel: 2,
    displayTag: {
      id: 'tag_fun_almost_skunk',
      code: 'fun_almost_skunk',
      name: '差点打龟',
      type: 'fun',
      rarityLevel: 2,
      styleKey: 'fun_blue',
      iconKey: 'splash',
      isAuthoritative: false
    }
  },
  {
    id: 'goods_tag_fun_empty_hook',
    goodsName: '空钩上鱼',
    image: '/images/icons/h28.png',
    points: 65,
    stock: 999,
    description: '玄学时刻专属，适合把离谱好运写在脸上。',
    rules: '兑换后永久获得，可在编辑资料中佩戴。',
    rarityLevel: 2,
    displayTag: {
      id: 'tag_fun_empty_hook',
      code: 'fun_empty_hook',
      name: '空钩上鱼',
      type: 'fun',
      rarityLevel: 2,
      styleKey: 'fun_blue',
      iconKey: 'hook',
      isAuthoritative: false
    }
  },
  {
    id: 'goods_tag_fun_pat_leg',
    goodsName: '拍大腿',
    image: '/images/icons/h31.png',
    points: 85,
    stock: 300,
    description: '错过窗口期后的标准动作，懂的人自然会笑。',
    rules: '兑换后永久获得，可在编辑资料中佩戴。',
    rarityLevel: 3,
    displayTag: {
      id: 'tag_fun_pat_leg',
      code: 'fun_pat_leg',
      name: '拍大腿',
      type: 'fun',
      rarityLevel: 3,
      styleKey: 'fun_orange',
      iconKey: 'spark',
      isAuthoritative: false
    }
  },
  {
    id: 'goods_tag_fun_poisoned',
    goodsName: '跑过毒',
    image: '/images/icons/h31.png',
    points: 85,
    stock: 300,
    description: '看一眼装备就上头，适合高浓度器材党。',
    rules: '兑换后永久获得，可在编辑资料中佩戴。',
    rarityLevel: 3,
    displayTag: {
      id: 'tag_fun_poisoned',
      code: 'fun_poisoned',
      name: '跑过毒',
      type: 'fun',
      rarityLevel: 3,
      styleKey: 'fun_orange',
      iconKey: 'bolt',
      isAuthoritative: false
    }
  },
  {
    id: 'goods_tag_event_founder',
    goodsName: '开服元老',
    image: '/images/icons/h33.png',
    points: 100,
    stock: 50,
    description: '限量纪念标签，适合首批老用户佩戴。',
    rules: '限量兑换，兑完即止；兑换后永久获得。',
    rarityLevel: 4,
    displayTag: {
      id: 'tag_event_founder',
      code: 'event_founder',
      name: '开服元老',
      type: 'event',
      rarityLevel: 4,
      styleKey: 'official_gold',
      iconKey: 'crown',
      isAuthoritative: true
    }
  }
];

/**
 * 网络请求封装
 */
class ApiService {
  constructor() {
    // 用于管理多个并发请求的loading状态
    this.loadingCount = 0;
    this.loadingTimer = null;
    this.isHandlingAuthError = false;
    this.inflightLocks = new Map();
    this.pendingAuthQueue = [];
    this.refreshPromise = null;
    this.refreshingToken = false;
    this.offlineQueue = this.loadOfflineQueue();
    this.processingOfflineQueue = false;
    this.networkConnected = true;

    this.initNetworkListeners();
  }

  /**
   * 通用请求方法
   */
  request(options) {
    const requestOptions = { ...options };
    requestOptions.method = (requestOptions.method || 'GET').toUpperCase();
    requestOptions.data = requestOptions.data || {};
    requestOptions.header = requestOptions.header || {};

    const fullUrl = `${BASE_URL}${requestOptions.url}`;
    const isSilent = requestOptions.silent === true;
    const skipErrorToast = requestOptions.skipErrorToast === true;
    const skipAuthRetry = requestOptions.skipAuthRetry === true;
    const allowDuplicateRequests = requestOptions.allowDuplicateRequests === true;
    const shouldLock = this.shouldLockRequest(requestOptions) && !allowDuplicateRequests;
    const lockKey = shouldLock ? (requestOptions.idempotentKey || this.getRequestKey(requestOptions)) : null;
    const requestStartedAt = Date.now();

    console.log('[API] 发起网络请求:');
    console.log('[API] 请求方法:', requestOptions.method);
    console.log('[API] 请求地址:', fullUrl);
    console.log('[API] 请求参数:', requestOptions.data);
    console.log('[API] 请求头(不含动态Token):', requestOptions.header);
    if (shouldLock) {
      console.log('[API] 请求锁Key:', lockKey);
    }

    if (shouldLock && this.inflightLocks.has(lockKey)) {
      console.log('[API] 检测到重复请求，复用进行中的结果');
      return this.inflightLocks.get(lockKey);
    }

    if (!isSilent) {
      this.showLoading();
    }

    if (MOCK_MODE) {
      console.log('[API] 当前为模拟模式，返回模拟数据');
      const mockPromise = this.mockRequest(requestOptions);
      if (shouldLock) {
        const wrappedMockPromise = mockPromise.finally(() => {
          this.inflightLocks.delete(lockKey);
        });
        this.inflightLocks.set(lockKey, wrappedMockPromise);
        return wrappedMockPromise;
      }
      return mockPromise;
    }

    const requestPromise = new Promise((resolve, reject) => {
      const finalize = () => {
        if (!isSilent) {
          this.hideLoading();
        }
      };

      const attempt = (fromRetry = false) => {
        const { path: requestPath, query: queryPayload } = parseUrlAndQuery(requestOptions.url);
        const cloudActionKey = `${requestOptions.method} ${requestPath}`;
        const cloudAction = CLOUD_ACTION_MAP[cloudActionKey];
        const attemptStartedAt = Date.now();

        // 提取统一的成功回调逻辑
        const handleSuccess = (res) => {
          const elapsed = Date.now() - attemptStartedAt;
          console.log('[API] 请求响应成功:');
          console.log('[API] 响应状态码:', res.statusCode);
          console.log('[API] 响应数据:', res.data);

          console.log('[API][性能] 本次请求耗时:', elapsed, 'ms');
          const isAuthError = res.statusCode === 401 || res.statusCode === 403;
          const isLoginRequest =
            requestOptions.url.includes('/auth/login') ||
            requestOptions.url.includes('/auth/refresh') ||
            requestOptions.url.includes('/auth/send-code') ||
            requestOptions.url.includes('/auth/logout');

          if (isAuthError && !skipAuthRetry && !isLoginRequest) {
            if (fromRetry) {
              finalize();
              this.handleAuthError(res.statusCode);
              reject(res);
              return;
            }

            // 如果存在手动退出标记，则不进入刷新队列，直接按未登录处理
            try {
              const manualLogout = wx.getStorageSync('manualLogout');
              if (manualLogout) {
                console.log('[API] 未登录（手动退出），跳过刷新队列');
                finalize();
                reject(new Error('ManualLogoutActive'));
                return;
              }
            } catch (e) {
              console.warn('[API] 读取手动退出标记失败:', e);
            }

            console.log('[API] 检测到认证失败，加入刷新队列');
            this.enqueueAuthRetry({
              retry: () => attempt(true),
              reject: (error) => {
                finalize();
                reject(error);
              }
            });
            return;
          }

          if (res.statusCode === 200) {
            const responseData = res.data || {};
            const businessCode = responseData.code;

            if (businessCode === 0 || businessCode === 200) {
              finalize();
              // 修复：当 data 为 0 或 false 时，不应该回退到 responseData
              resolve(responseData.data !== undefined ? responseData.data : responseData);
              return;
            }

            if ((businessCode === 401 || businessCode === 403) && !skipAuthRetry && !isLoginRequest) {
              if (fromRetry) {
                finalize();
                this.handleAuthError(businessCode);
                reject(responseData);
                return;
              }

              // 如果存在手动退出标记，则不进入刷新队列，直接按未登录处理
              try {
                const manualLogout = wx.getStorageSync('manualLogout');
                if (manualLogout) {
                  console.log('[API] 未登录（手动退出），跳过刷新队列');
                  finalize();
                  reject(new Error('ManualLogoutActive'));
                  return;
                }
              } catch (e) {
                console.warn('[API] 读取手动退出标记失败:', e);
              }

              console.log('[API] 业务层认证失败，加入刷新队列');
              this.enqueueAuthRetry({
                retry: () => attempt(true),
                reject: (error) => {
                  finalize();
                  reject(error);
                }
              });
              return;
            }

            finalize();
            if (!skipErrorToast) {
              wx.showToast({
                title: responseData.msg || responseData.message || '请求失败',
                icon: 'none'
              });
            }
            reject(responseData);
            return;
          }

          finalize();
          if (!skipErrorToast) {
            wx.showToast({
              title: '网络请求失败',
              icon: 'none'
            });
          }
          reject(res);
        };

        // 提取统一的失败回调逻辑
        const handleFail = (err) => {
          const elapsed = Date.now() - attemptStartedAt;
          console.log('[API] 网络请求失败:', err);

          console.log('[API][性能] 本次请求失败耗时:', elapsed, 'ms');
          const shouldQueueOffline = this.shouldQueueOfflineRequest(requestOptions, err);
          if (shouldQueueOffline) {
            this.enqueueOfflineRequest(requestOptions);
          }

          finalize();

          if (!skipErrorToast) {
            wx.showToast({
              title: shouldQueueOffline ? '网络异常，已加入重试队列' : '网络连接失败',
              icon: 'none'
            });
          }

          reject(err);
        };

        if (cloudAction) {
          const mergedPayload = {
            ...queryPayload,
            ...(requestOptions.data || {})
          };
          const payload = normalizeCloudPayload(cloudAction, mergedPayload);
          console.log(`[API] 路由重定向: ${cloudActionKey} -> Cloud Action: ${cloudAction}`);

          // [改造点] 2. 调用云函数
          const cloudCallStartedAt = Date.now();
          wx.cloud.callFunction({
            name: 'miniApi', // 你的云函数主入口名称
            data: {
              action: cloudAction,
              payload
            }
          }).then(res => {
            console.log(`[API][性能] 云函数 [${cloudAction}] 调用耗时:`, Date.now() - cloudCallStartedAt, 'ms');
            console.log(`[API] 云函数 [${cloudAction}] 调用成功，结果预览:`, res);
            if (cloudAction === 'topic.all' && res.result && res.result.data && res.result.data.length > 0) {
                console.log('[API-DEBUG] 第一条帖子数据:', res.result.data[0]);
                console.log('[API-DEBUG] 包含用户信息:', {
                    publisher: res.result.data[0].publisher,
                    nickName: res.result.data[0].nickName,
                    avatarUrl: res.result.data[0].avatarUrl,
                    _debug_userId: res.result.data[0]._debug_userId,
                    _debug_hasPublisher: res.result.data[0]._debug_hasPublisher
                });
            }

            // 构造一个这就好比 wx.request 返回的 res 结构，以便复用后面的处理逻辑
            const mockRes = {
              statusCode: 200,
              data: res.result || {} // 云函数返回的结果在 result 字段中
            };

            // 调用原本的成功处理逻辑
            handleSuccess(mockRes);
          }).catch(err => {
            console.log(`[API][性能] 云函数 [${cloudAction}] 调用失败耗时:`, Date.now() - cloudCallStartedAt, 'ms');
            console.error('[API] 云函数调用失败:', err);
            // 构造一个这就好比 wx.request 失败的 err 结构
            handleFail(err);
          });

          return; // 结束，不再执行下面的 wx.request
        }

        const requestHeaders = {
          'Content-Type': 'application/json',
          'Authorization': wx.getStorageSync('token') ? `Bearer ${wx.getStorageSync('token')}` : '',
          'clientid': 'wx_mini',
          ...requestOptions.header
        };

        console.log('[API] 实际发送请求头:', requestHeaders);

        wx.request({
          url: fullUrl,
          method: requestOptions.method,
          data: requestOptions.data,
          header: requestHeaders,
          success: handleSuccess,
          fail: handleFail
        });
      };

      attempt();
    });

    const wrappedPromise = requestPromise.finally(() => {
      console.log('[API][性能] 请求总耗时:', Date.now() - requestStartedAt, 'ms', `${requestOptions.method} ${requestOptions.url}`);
      if (shouldLock) {
        this.inflightLocks.delete(lockKey);
      }
    });

    if (shouldLock) {
      this.inflightLocks.set(lockKey, wrappedPromise);
    }

    return wrappedPromise;
  }

  shouldLockRequest(options) {
    const method = (options.method || 'GET').toUpperCase();
    return !REQUEST_LOCK_EXEMPT_METHODS.includes(method);
  }

  getRequestKey(options) {
    const method = (options.method || 'GET').toUpperCase();
    const url = options.url || '';
    const data = options.data ? JSON.stringify(options.data) : '';
    const headers = { ...(options.header || {}) };
    delete headers.Authorization;
    delete headers.authorization;
    return `${method}|${url}|${data}|${JSON.stringify(headers)}`;
  }

  getOfflineRequestKey(options) {
    const method = (options.method || 'GET').toUpperCase();
    const url = options.url || '';
    const data = options.data ? JSON.stringify(options.data) : '';
    return `${method}|${url}|${data}`;
  }

  enqueueAuthRetry(context) {
    this.pendingAuthQueue.push(context);

    if (this.refreshPromise) {
      return;
    }

    this.refreshingToken = true;
    this.refreshPromise = this.beginTokenRefresh()
      .then(() => {
        const queue = this.pendingAuthQueue.splice(0);
        console.log('[API] Token刷新成功，重放请求数量:', queue.length);
        queue.forEach(item => {
          try {
            item.retry();
          } catch (error) {
            console.error('[API] 重放挂起请求失败:', error);
            item.reject(error);
          }
        });
      })
      .catch((error) => {
        if (error && error.message === 'ManualLogoutActive') {
          console.log('[API] 已手动退出，跳过刷新Token及认证错误处理');
        } else {
          console.error('[API] 刷新Token失败:', error);
        }
        const queue = this.pendingAuthQueue.splice(0);
        queue.forEach(item => {
          try {
            item.reject(error);
          } catch (err) {
            console.error('[API] 挂起请求回调失败:', err);
          }
        });
        // 手动退出时不触发认证错误处理（不弹toast、不跳转）
        if (!error || error.message !== 'ManualLogoutActive') {
          this.handleAuthError(401);
        }
      })
      .finally(() => {
        this.refreshPromise = null;
        this.refreshingToken = false;
      });
  }

  beginTokenRefresh() {
    console.log('[API] 开始刷新Token');
    return new Promise((resolve, reject) => {
      try {
        // 如果存在手动退出标记，则跳过静默登录刷新
        try {
          const manualLogout = wx.getStorageSync('manualLogout');
          if (manualLogout) {
            console.log('[API] 检测到手动退出标记，跳过静默登录刷新');
            reject(new Error('ManualLogoutActive'));
            return;
          }
        } catch (e) {
          console.warn('[API] 读取手动退出标记失败:', e);
        }

        const auth = require('./auth.js');
        const refreshFn = auth && auth.silentLogin;
        if (typeof refreshFn !== 'function') {
          reject(new Error('Auth service unavailable'));
          return;
        }
        const result = refreshFn.call(auth);
        if (result && typeof result.then === 'function') {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  loadOfflineQueue() {
    if (typeof wx === 'undefined' || !wx.getStorageSync) {
      return [];
    }
    try {
      const queue = wx.getStorageSync(OFFLINE_QUEUE_STORAGE_KEY);
      return Array.isArray(queue) ? queue : [];
    } catch (error) {
      console.error('[API] 读取离线队列失败:', error);
      return [];
    }
  }

  saveOfflineQueue() {
    if (typeof wx === 'undefined' || !wx.setStorageSync) {
      return;
    }
    try {
      wx.setStorageSync(OFFLINE_QUEUE_STORAGE_KEY, this.offlineQueue);
    } catch (error) {
      console.error('[API] 保存离线队列失败:', error);
    }
  }

  initNetworkListeners() {
    if (typeof wx === 'undefined') {
      return;
    }
    try {
      if (wx.getNetworkType) {
        wx.getNetworkType({
          success: (res) => {
            this.networkConnected = res.networkType !== 'none';
            if (this.networkConnected) {
              this.processOfflineQueue();
            }
          },
          fail: () => {
            this.networkConnected = true;
          }
        });
      }

      if (wx.onNetworkStatusChange) {
        wx.onNetworkStatusChange((res) => {
          this.handleNetworkStatusChange(res);
        });
      }
    } catch (error) {
      console.error('[API] 初始化网络状态监听失败:', error);
      this.networkConnected = true;
    }
  }

  handleNetworkStatusChange(res) {
    let isConnected = true;
    if (res && typeof res.isConnected === 'boolean') {
      isConnected = res.isConnected;
    } else if (res && typeof res.networkType === 'string') {
      isConnected = res.networkType !== 'none';
    }
    this.networkConnected = isConnected;
    console.log('[API] 网络状态变化:', this.networkConnected ? '在线' : '离线');
    if (this.networkConnected) {
      this.processOfflineQueue();
    }
  }

  shouldQueueOfflineRequest(options, err) {
    if (options.preventOfflineQueue) {
      return false;
    }
    const method = (options.method || 'GET').toUpperCase();
    if (REQUEST_LOCK_EXEMPT_METHODS.includes(method)) {
      return false;
    }
    if ((options.url || '').includes('/auth/login')) {
      return false;
    }

    if (!this.networkConnected) {
      return true;
    }

    const message = err && typeof err.errMsg === 'string' ? err.errMsg.toLowerCase() : '';
    return message.includes('timeout') || message.includes('fail') || message.includes('abort');
  }

  enqueueOfflineRequest(options) {
    const offlineKey = this.getOfflineRequestKey(options);
    if (this.offlineQueue.some(item => item.offlineKey === offlineKey)) {
      console.log('[API] 离线队列中已存在相同请求，跳过');
      return;
    }

    const sanitizedHeader = { ...(options.header || {}) };
    delete sanitizedHeader.Authorization;
    delete sanitizedHeader.authorization;

    const queueItem = {
      url: options.url,
      method: (options.method || 'GET').toUpperCase(),
      data: options.data || {},
      header: sanitizedHeader,
      offlineKey,
      timestamp: Date.now()
    };

    this.offlineQueue.push(queueItem);
    if (this.offlineQueue.length > 100) {
      this.offlineQueue.shift();
    }
    this.saveOfflineQueue();
    console.log('[API] 离线请求入队，当前队列长度:', this.offlineQueue.length);
  }

  async processOfflineQueue() {
    if (this.processingOfflineQueue || !this.networkConnected || this.offlineQueue.length === 0) {
      return;
    }

    this.processingOfflineQueue = true;
    console.log('[API] 开始重放离线请求，数量:', this.offlineQueue.length);

    while (this.offlineQueue.length > 0 && this.networkConnected) {
      const requestConfig = this.offlineQueue[0];
      try {
        await this.request({
          url: requestConfig.url,
          method: requestConfig.method,
          data: requestConfig.data,
          header: requestConfig.header,
          silent: true,
          preventOfflineQueue: true,
          skipErrorToast: true,
          allowDuplicateRequests: true
        });
        this.offlineQueue.shift();
        this.saveOfflineQueue();
        console.log('[API] 离线请求重放成功，剩余:', this.offlineQueue.length);
      } catch (error) {
        console.error('[API] 离线请求重放失败:', error);
        break;
      }
    }

    this.processingOfflineQueue = false;
  }

  /**
   * GET请求
   */
  get(url, options = {}) {
    const { data = {}, headers = {}, header = {}, ...restOptions } = options;
    return this.request({
      url,
      method: 'GET',
      data,
      header: { ...headers, ...header },
      ...restOptions
    });
  }

  /**
   * POST请求
   */
  post(url, data = {}, options = {}) {
    const { headers = {}, header = {}, ...restOptions } = options;
    return this.request({
      url,
      method: 'POST',
      data,
      header: { ...headers, ...header },
      ...restOptions
    });
  }

  /**
   * PUT请求
   */
  put(url, data = {}, options = {}) {
    const { headers = {}, header = {}, ...restOptions } = options;
    return this.request({
      url,
      method: 'PUT',
      data,
      header: { ...headers, ...header },
      ...restOptions
    });
  }

  /**
   * DELETE请求
   */
  delete(url, options = {}) {
    const { data = {}, headers = {}, header = {}, ...restOptions } = options;
    return this.request({
      url,
      method: 'DELETE',
      data,
      header: { ...headers, ...header },
      ...restOptions
    });
  }

  /**
   * 显示loading动画
   */
  showLoading() {
    this.loadingCount++;
    
    // 只有第一个请求时才显示loading动画
    if (this.loadingCount === 1) {
      wx.showLoading({
        title: '加载中...',
        mask: true // 防止触摸穿透
      });
      
      // 设置超时自动隐藏loading（30秒）
      this.loadingTimer = setTimeout(() => {
        this.forceHideLoading();
        wx.showToast({
          title: '请求超时',
          icon: 'none'
        });
      }, 30000);
    }
  }

  /**
   * 隐藏loading动画
   */
  hideLoading() {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    
    // 只有所有请求都完成时才隐藏loading动画
    if (this.loadingCount === 0) {
      wx.hideLoading();
      
      // 清除超时定时器
      if (this.loadingTimer) {
        clearTimeout(this.loadingTimer);
        this.loadingTimer = null;
      }
    }
  }

  /**
   * 强制隐藏loading动画（用于超时处理）
   */
  forceHideLoading() {
    this.loadingCount = 0;
    wx.hideLoading();
    
    // 清除超时定时器
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = null;
    }
  }

  /**
   * 处理认证错误（401未授权，403授权过期）
   */
  handleAuthError(statusCode) {
    console.log(`[API] 处理认证错误，状态码: ${statusCode}`);
    
    // 防止重复处理
    if (this.isHandlingAuthError) {
      console.log('[API] 正在处理认证错误，跳过重复处理');
      return;
    }
    this.isHandlingAuthError = true;
    
    try {
      // 清除本地存储的token和用户信息
      wx.removeStorageSync('token');
      wx.removeStorageSync('refreshToken');
      wx.removeStorageSync('userInfo');
      console.log('[API] 已清除本地存储的登录信息');
      
      // 清除auth服务中的登录状态
      const auth = require('./auth.js');
      if (auth) {
        auth.userInfo = null;
        auth.isAdmin = false;
        console.log('[API] 已清除auth服务中的登录状态');
      }
      
      // 设置全局标志，通知profile页面显示登录提示
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.showLoginPrompt = true;
        console.log('[API] 已设置全局登录提示标志');
      }
      
      // 显示用户友好的提示信息
      wx.showToast({
        title: '登录已过期，请重新登录',
        icon: 'none',
        duration: 2000
      });
      
      // 延迟跳转，确保toast显示完成
      setTimeout(() => {
        this.navigateToProfile();
      }, 500);
      
    } catch (error) {
      console.error('[API] 处理认证错误时发生异常:', error);
    } finally {
      // 重置处理标志
      setTimeout(() => {
        this.isHandlingAuthError = false;
      }, 3000);
    }
  }
  
  /**
   * 跳转到profile页面的方法，包含多种重试机制
   */
  navigateToProfile() {
    console.log('[API] 开始跳转到profile页面');
    
    // 首先尝试switchTab
    wx.switchTab({
      url: '/pages/profile/profile',
      success: () => {
        console.log('[API] switchTab跳转到profile页面成功');
      },
      fail: (err) => {
        console.error('[API] switchTab跳转到profile页面失败:', err);
        
        // 如果switchTab失败，尝试使用reLaunch
        wx.reLaunch({
          url: '/pages/profile/profile',
          success: () => {
            console.log('[API] reLaunch跳转到profile页面成功');
          },
          fail: (reLaunchErr) => {
            console.error('[API] reLaunch跳转到profile页面也失败:', reLaunchErr);
            
            // 如果所有跳转方式都失败，尝试使用navigateTo
            wx.navigateTo({
              url: '/pages/profile/profile',
              success: () => {
                console.log('[API] navigateTo跳转到profile页面成功');
              },
              fail: (navigateErr) => {
                console.error('[API] 所有跳转方式都失败:', navigateErr);
                // 最后的备选方案：显示手动跳转提示
                wx.showModal({
                  title: '登录过期',
                  content: '请手动切换到"我的"页面重新登录',
                  showCancel: false,
                  confirmText: '知道了'
                });
              }
            });
          }
        });
      }
    });
  }

  /**
   * 模拟请求方法
   */
  mockRequest(options) {
    return new Promise((resolve, reject) => {
      // 模拟网络延迟
      setTimeout(() => {
        // 隐藏loading动画（仅非静默请求）
        const isSilent = options.silent === true;
        if (!isSilent) {
          this.hideLoading();
        }
        
        try {
          const mockData = this.getMockData(options.url, options.method);
          resolve(mockData);
        } catch (error) {
          reject(error);
        }
      }, 300 + Math.random() * 700); // 300-1000ms随机延迟
    });
  }

  /**
   * 获取模拟数据
   */
  getMockData(url, method) {
    const { path, query } = parseUrlAndQuery(url);
    // 微信登录（匹配真实接口路径）
    if (url === '/mini/user/login' && method === 'POST') {
      return {
        token: 'mock_token_' + Date.now(),
        id: 'user_001',
        nickName: '钓鱼爱好者',
        bio: '热爱钓鱼的开发者',
        avatarUrl: 'https://via.placeholder.com/100x100',
        shipAddress: '',
        status: 1,
        points: 100,
        level: 1,
        openId: 'mock_openid_' + Date.now(),
        isAdmin: false
      };
    }
    
    // 兼容旧的登录接口路径
    if (url === '/auth/wx-login' && method === 'POST') {
      return {
        token: 'mock_token_' + Date.now(),
        userInfo: {
          id: 'user_001',
          nickname: '钓鱼爱好者',
          avatar: 'https://via.placeholder.com/100x100',
          isAdmin: false
        }
      };
    }
    
    // 用户退出登录
    if (url === '/mini/user/logout' && method === 'POST') {
      return {
        code: 200,
        message: '退出登录成功'
      };
    }
    
    // 更新用户信息
    if (url === '/mini/user/update' && method === 'POST') {
      return {
        code: 200,
        message: '用户信息更新成功',
        data: {
          id: 'user_001',
          nickName: '钓鱼爱好者',
          bio: '热爱钓鱼的开发者',
          avatarUrl: 'https://via.placeholder.com/100x100',
          shipAddress: '北京市朝阳区'
        }
      };
    }
    
    // 获取所有可用标签
    if (url === '/mini/tag/usable' && method === 'GET') {
      return {
        code: 200,
        data: [
          {
            id: 'ut_101',
            userTagId: 'ut_101',
            tagId: 'tag_identity_stream',
            name: '溪流路亚',
            type: 'identity',
            subType: 'scene',
            rarityLevel: 2,
            styleKey: 'identity_blue',
            iconKey: 'stream',
            description: '常在溪流路亚场景分享内容',
            displayPriority: 80,
            isEquipped: false,
            displayTag: {
              id: 'tag_identity_stream',
              name: '溪流路亚',
              type: 'identity',
              rarityLevel: 2,
              styleKey: 'identity_blue',
              iconKey: 'stream',
              isAuthoritative: true
            }
          },
          {
            id: 'ut_102',
            userTagId: 'ut_102',
            tagId: 'tag_fun_almost_skunk',
            name: '差点打龟',
            type: 'fun',
            subType: 'meme',
            rarityLevel: 2,
            styleKey: 'fun_blue',
            iconKey: 'splash',
            description: '差一点就空军，懂的都懂',
            displayPriority: 40,
            isEquipped: true,
            displayTag: {
              id: 'tag_fun_almost_skunk',
              name: '差点打龟',
              type: 'fun',
              rarityLevel: 2,
              styleKey: 'fun_blue',
              iconKey: 'splash',
              isAuthoritative: false,
              isEquipped: true
            }
          },
          {
            id: 'ut_103',
            userTagId: 'ut_103',
            tagId: 'tag_fun_empty_hook',
            name: '空钩上鱼',
            type: 'fun',
            subType: 'meme',
            rarityLevel: 2,
            styleKey: 'fun_blue',
            iconKey: 'hook',
            description: '离谱到有点玄学',
            displayPriority: 38,
            isEquipped: false,
            displayTag: {
              id: 'tag_fun_empty_hook',
              name: '空钩上鱼',
              type: 'fun',
              rarityLevel: 2,
              styleKey: 'fun_blue',
              iconKey: 'hook',
              isAuthoritative: false
            }
          },
          {
            id: 'ut_104',
            userTagId: 'ut_104',
            tagId: 'tag_fun_pat_leg',
            name: '拍大腿',
            type: 'fun',
            subType: 'meme',
            rarityLevel: 3,
            styleKey: 'fun_orange',
            iconKey: 'spark',
            description: '错过窗口期后的标准动作',
            displayPriority: 52,
            isEquipped: false,
            displayTag: {
              id: 'tag_fun_pat_leg',
              name: '拍大腿',
              type: 'fun',
              rarityLevel: 3,
              styleKey: 'fun_orange',
              iconKey: 'spark',
              isAuthoritative: false
            }
          },
          {
            id: 'ut_105',
            userTagId: 'ut_105',
            tagId: 'tag_fun_poisoned',
            name: '跑过毒',
            type: 'fun',
            subType: 'meme',
            rarityLevel: 3,
            styleKey: 'fun_orange',
            iconKey: 'bolt',
            description: '看过一次就忍不住想下单',
            displayPriority: 50,
            isEquipped: false,
            displayTag: {
              id: 'tag_fun_poisoned',
              name: '跑过毒',
              type: 'fun',
              rarityLevel: 3,
              styleKey: 'fun_orange',
              iconKey: 'bolt',
              isAuthoritative: false
            }
          },
          {
            id: 'ut_106',
            userTagId: 'ut_106',
            tagId: 'tag_event_founder',
            name: '开服元老',
            type: 'event',
            subType: 'founder',
            rarityLevel: 4,
            styleKey: 'official_gold',
            iconKey: 'crown',
            description: '小程序开服早期纪念标签',
            displayPriority: 90,
            isEquipped: false,
            displayTag: {
              id: 'tag_event_founder',
              name: '开服元老',
              type: 'event',
              rarityLevel: 4,
              styleKey: 'official_gold',
              iconKey: 'crown',
              isAuthoritative: true
            }
          }
        ]
      };
    }
    
    // 获取当前主标签与帖子展示偏好
    if (url === '/mini/tag/used' && method === 'GET') {
      return {
        code: 200,
        data: {
          mainTagId: 'tag_fun_almost_skunk',
          mainTag: {
            id: 'tag_fun_almost_skunk',
            name: '差点打龟',
            type: 'fun',
            rarityLevel: 2,
            styleKey: 'fun_blue',
            iconKey: 'splash',
            isAuthoritative: false,
            isMainTag: true,
            isEquipped: true
          },
          equippedTagId: 'tag_fun_almost_skunk',
          equippedTag: {
            id: 'tag_fun_almost_skunk',
            name: '差点打龟',
            type: 'fun',
            rarityLevel: 2,
            styleKey: 'fun_blue',
            iconKey: 'splash',
            isAuthoritative: false,
            isMainTag: true,
            isEquipped: true
          },
          postTagMode: 'smart',
          customPostTags: {
            experience: '__smart__',
            catch: '__hidden__'
          },
          ownedTags: [
            {
              id: 'ut_102',
              userTagId: 'ut_102',
              tagId: 'tag_fun_almost_skunk',
              name: '差点打龟',
              type: 'fun',
              rarityLevel: 2,
              styleKey: 'fun_blue',
              iconKey: 'splash',
              displayCategory: 'fun',
              displayLabel: '娱乐标签',
              sourceLabel: '积分兑换',
              isMainTag: true,
              isEquipped: true,
              displayTag: {
                id: 'tag_fun_almost_skunk',
                name: '差点打龟',
                type: 'fun',
                rarityLevel: 2,
                styleKey: 'fun_blue',
                iconKey: 'splash',
                isAuthoritative: false,
                isMainTag: true,
                isEquipped: true
              }
            }
          ],
          previewByPostType: [
            { key: 'recommend', label: '好物速报', topicCategory: 0, displayTag: null },
            { key: 'experience', label: '长测评', topicCategory: 1, displayTag: null },
            { key: 'question', label: '讨论&提问', topicCategory: 2, displayTag: null },
            { key: 'catch', label: '鱼获展示', topicCategory: 3, displayTag: null },
            { key: 'trip', label: '钓行分享', topicCategory: 4, displayTag: null }
          ],
          settings: {
            mainTagId: 'tag_fun_almost_skunk',
            postTagMode: 'smart',
            customPostTags: {
              experience: '__smart__',
              catch: '__hidden__'
            }
          }
        }
      };
    }
    
    // 设置用户主标签与展示方式
    if (url === '/mini/tag/used' && method === 'POST') {
      const mainTagId = Object.prototype.hasOwnProperty.call(options.data || {}, 'mainTagId')
        ? options.data.mainTagId
        : options.data.equippedTagId;
      const postTagMode = options.data.postTagMode || 'smart';
      const customPostTags = options.data.customPostTags || {};
      return {
        code: 200,
        message: '标签佩戴已更新',
        data: {
          mainTagId,
          mainTag: mainTagId ? {
            id: mainTagId,
            name: '差点打龟',
            type: 'fun',
            rarityLevel: 2,
            styleKey: 'fun_blue',
            isAuthoritative: false,
            isMainTag: true,
            isEquipped: true
          } : null,
          equippedTagId: mainTagId,
          equippedTag: mainTagId ? {
            id: mainTagId,
            name: '差点打龟',
            type: 'fun',
            rarityLevel: 2,
            styleKey: 'fun_blue',
            isAuthoritative: false,
            isMainTag: true,
            isEquipped: true
          } : null,
          postTagMode,
          customPostTags,
          settings: {
            mainTagId,
            postTagMode,
            customPostTags
          }
        }
      };
    }

    if (path === '/mini/goods' && method === 'GET') {
      const type = Number(query.type || 0);
      return {
        code: 200,
        data: type === 0 ? TAG_GOODS_MOCK_DATA : []
      };
    }

    if (path === '/mini/goods' && method === 'POST') {
      return {
        code: 200,
        message: '兑换成功',
        data: true
      };
    }
    
    // 默认返回空数据
    return {};
  }

  /**
   * 文件上传
   */
  uploadFile(filePath, formData = {}, endpoint = '/upload/image') {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${BASE_URL}${endpoint}`,
        filePath,
        name: 'file',
        formData,
        header: {
          'Authorization': wx.getStorageSync('token') ? `Bearer ${wx.getStorageSync('token')}` : ''
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            resolve(data.data);
          } else {
            reject(data);
          }
        },
        fail: reject
      });
    });
  }

  // ========== 帖子相关接口 ==========
  
  /**
   * 获取帖子列表
   */
  getPosts(params = {}) {
    return this.get('/posts', params);
  }

  /**
   * 获取帖子详情
   */
  getPostDetail(postId) {
    return this.get(`/posts/${postId}`);
  }

  /**
   * 创建帖子
   */
  createPost(postData) {
    return this.post('/posts', postData);
  }

  /**
   * 更新帖子
   */
  updatePost(postId, postData) {
    return this.put(`/posts/${postId}`, postData);
  }

  /**
   * 点赞帖子
   */
  likePost(postId) {
    return this.post(`/posts/${postId}/like`);
  }

  /**
   * 取消点赞帖子
   */
  unlikePost(postId) {
    return this.delete(`/posts/${postId}/like`);
  }

  // ========== 评论相关接口 ==========
  
  /**
   * 获取评论列表
   */
  getComments(postId, params = {}) {
    return this.get(`/posts/${postId}/comments`, params);
  }

  /**
   * 创建评论
   */
  createComment(postId, commentData) {
    return this.post(`/posts/${postId}/comments`, commentData);
  }

  /**
   * 点赞评论
   */
  likeComment(commentId) {
    return this.post(`/comments/${commentId}/like`);
  }

  /**
   * 删除评论
   */
  deleteComment(commentId) {
    return this.delete(`/comments/${commentId}`);
  }

  /**
   * 添加新评论（小程序专用接口）
   */
  addComment(commentData) {
    const payload = {
      topicId: Number(commentData.topicId),
      content: commentData.content,
      replayCommentId: commentData.replayCommentId || null,
      replayUserId: commentData.replayUserId || null
    };
    return this.put('/mini/comment', payload).then(result => result === true || !!result);
  }

  /**
   * 根据帖子ID查询评论列表（小程序专用接口）
   */
  getTopicComments(topicId) {
    return this.get(`/mini/comment?topicId=${topicId}`);
  }

  // ========== 管理员相关接口 ==========
  
  /**
   * 获取待审核帖子
   */
  getPendingPosts(params = {}) {
    return this.get('/admin/posts/pending', params);
  }

  /**
   * 审核帖子
   */
  auditPost(postId, status) {
    return this.put(`/admin/posts/${postId}/audit`, { status });
  }

  /**
   * 删除帖子
   */
  deletePost(postId) {
    return this.delete(`/admin/posts/${postId}`);
  }

  /**
   * 置顶帖子
   */
  pinPost(postId) {
    return this.put(`/admin/posts/${postId}/pin`);
  }

  /**
   * 取消置顶
   */
  unpinPost(postId) {
    return this.put(`/admin/posts/${postId}/unpin`);
  }

  // ========== 用户相关接口 ==========
  
  /**
   * 用户退出登录
   */
  logout() {
    // 云函数方案下使用 OPENID 识别身份，无服务端登出接口。
    // 保持 Promise 形态，兼容调用方 await api.logout()。
    return Promise.resolve({ success: true });
  }

  /**
   * 更新用户信息
   */
  updateUserInfo(userInfo) {
    return this.post('/mini/user/update', userInfo);
  }

  // ========== 标签相关接口 ==========
  
  /**
   * 获取当前所有可用标签
   */
  getTagWardrobe(options = {}) {
    return this.get('/mini/tag/usable', options);
  }

  /**
   * 获取用户当前佩戴的标签与展示偏好
   */
  getTagDisplaySettings(options = {}) {
    return this.get('/mini/tag/used', options);
  }

  /**
   * 更新用户当前佩戴的标签与展示偏好
   */
  setTagDisplay(payload = {}) {
    const mainTagId = payload.mainTagId === '' || payload.mainTagId === null || payload.mainTagId === undefined
      ? (
        payload.equippedTagId === '' || payload.equippedTagId === null || payload.equippedTagId === undefined
          ? null
          : payload.equippedTagId
      )
      : payload.mainTagId;
    return this.post('/mini/tag/used', {
      mainTagId,
      equippedTagId: mainTagId,
      postTagMode: payload.postTagMode || payload.displayStrategy,
      customPostTags: payload.customPostTags,
      displayStrategy: payload.postTagMode || payload.displayStrategy,
      preferIdentityInReview: payload.preferIdentityInReview,
      preferFunInCatch: payload.preferFunInCatch
    });
  }

  getUsableTags(options = {}) {
    return this.getTagWardrobe(options);
  }

  getUsedTags(options = {}) {
    return this.getTagDisplaySettings(options);
  }

  setUserTag(tagId) {
    return this.setTagDisplay({ mainTagId: tagId });
  }

  // ==================== 话题相关接口 ====================
  
  /**
   * 获取所有话题
   * @param {Object} params - 筛选条件（可选）
   * @param {string} params.title - 话题标题筛选
   * @param {string} params.nickName - 用户昵称筛选
   * @returns {Promise} 返回话题列表
   */
  getAllTopics(params = {}) {
    const normalizedParams = { ...params };
    if (normalizedParams.limit === undefined || normalizedParams.limit === null || normalizedParams.limit === '') {
      normalizedParams.limit = 12;
    }
    return this.get('/mini/topic/all', { data: normalizedParams }).then(list => {
      return Array.isArray(list) ? list.map(normalizeTopicResponse) : [];
    });
  }

  /**
   * 新建话题
   * @param {Object} topicData - 话题数据
   * @returns {Promise} 返回创建结果
   */
  createTopic(topicData) {
    const payload = buildTopicPayload({
      ...topicData,
      topicCategory: 1,
      categoryKey: topicData.categoryKey || topicData.type || ''
    });
    return this.put('/mini/topic', payload).then(result => {
      return result && result.id ? result.id : result;
    });
  }

  /**
   * 获取当前用户临时帖子
   * @returns {Promise} 返回临时帖子数据
   */
  getTmpTopic() {
    return this.get('/mini/topic/tmp').then(result => {
      return result ? normalizeTopicResponse(result) : result;
    });
  }

  /**
   * 获取话题详情
   * @param {string} topicId - 话题ID
   * @returns {Promise} 返回话题详情
   */
  /**
   * 获取指定id帖子详情
   * @param {string} topicId 帖子ID
   * @returns {Promise} 返回帖子详情
   */
  getTopicDetail(topicId) {
    return this.get(`/mini/topic?topicId=${topicId}`).then(result => {
      return result ? normalizeTopicResponse(result) : result;
    });
  }

  /**
   * 发布帖子
   * @param {Object} topicData 帖子数据
   * @returns {Promise} 返回发布结果
   */
  publishTopic(topicData) {
    const payload = buildTopicPayload({
      ...topicData,
      topicCategory: 1,
      categoryKey: topicData.categoryKey || topicData.type || ''
    });
    return this.post('/mini/topic', payload).then(result => !!(result && result.id));
  }

  /**
   * 获取当前登录用户帖子列表
   * @param {number} status - 帖子状态 1:待审核 2:审核已发布 4:审核驳回
   * @param {object} params - 其他查询参数
   */
  getUserPosts(status, params = {}) {
    const queryString = buildQueryString({
      status,
      ...(params || {})
    });
    return this.get(`/mini/topic/mine?${queryString}`).then(list => {
      return Array.isArray(list) ? list.map(normalizeTopicResponse) : [];
    });
  }

  /**
   * 给话题点赞
   * @param {string|number} topicId - 话题ID
   * @returns {Promise} 返回点赞结果，true表示点赞成功，false表示取消点赞
   */
  likeTopic(topicId) {
    return this.post('/mini/topic/like', { topicId }).then(result => !!(result && result.isLike));
  }

  /**
   * 获取商店标签列表
   */
  getPointsTagList() {
    return this.get('/mini/tag/points');
  }

  /**
   * 兑换商店中的标签
   */
  redeemPointsTag(id) {
    return this.post('/mini/tag/redeem', { id });
  }

  /**
   * 获取商品列表
   * @param {number} type - 商品类型
   */
  getGoodsList(type) {
    return this.get(`/mini/goods?type=${type}`);
  }

  /**
   * 兑换商品
   * @param {string} id - 商品ID
   */
  redeemGoods(id) {
    return this.post('/mini/goods', { id });
  }

  // 获取当前用户任务/成就列表（接口15）
  getTaskFeatList() {
    return this.get('/mini/taskFeat');
  }

  // 领取任务/成就积分（接口16）
  claimTaskFeat(id) {
    return this.post('/mini/taskFeat', { id });
  }

  // 获取未完成的任务特征列表（接口17）
  getUnfinishedTaskFeatList() {
    return this.get('/mini/taskFeat/unfinish');
  }

  // 获取用户积分（接口18）
  getUserPoints() {
    return this.get('/mini/user/points');
  }

  bindInvite(payload = {}) {
    return this.post('/mini/invite/bind', payload);
  }

  getInviteSummary() {
    return this.get('/mini/invite/summary');
  }

  /**
   * 模拟认证错误（开发测试专用）
   * @param {number} statusCode - 401 或 403
   */
  simulateAuthError(statusCode = 401) {
    try {
      console.log(`[API] 模拟触发认证错误: ${statusCode}`);
      // 直接走统一认证错误处理流程，覆盖到清理、本地标志及跳转
      this.handleAuthError(statusCode);
    } catch (e) {
      console.error('[API] 模拟认证错误失败:', e);
    }
  }
}

module.exports = new ApiService();
