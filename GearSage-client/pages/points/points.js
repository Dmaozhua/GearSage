// pages/points/points.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showSkeleton: true,
    userPoints: 0,
    currentTab: 0, // 0: 积分, 1: 成就
    tabs: ['积分', '成就'],
    dailyTasks: [],
    moreTasks: [],
    achievements: [],
    isDarkMode: false,
    completedTasksCount: 0,
    totalTasksCount: 0
  },

  /**
   * 数字格式化过滤器
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.checkDarkMode();
    this.calculateTaskProgress();
  },

  /**
   * 计算任务完成进度
   */
  calculateTaskProgress() {
    const dailyTasks = this.data.dailyTasks || [];
    const completedTasks = dailyTasks.filter(task => task.claimable || task.received || task.completed);
    this.setData({
      completedTasksCount: completedTasks.length,
      totalTasksCount: dailyTasks.length
    });
  },

  // 加载任务/成就列表（接口15）
  async loadTaskFeatList() {
    try {
      const api = require('../../services/api.js');
      
      // 并行获取已完成任务（接口15）和未完成任务（接口17）
      const [completedRes, unfinishedRes] = await Promise.all([
        api.getTaskFeatList(),
        api.getUnfinishedTaskFeatList()
      ]);
      
      // 处理已完成任务数据
      const completedList = Array.isArray(completedRes) ? completedRes : (completedRes && (completedRes.list || completedRes.records || completedRes.data)) || [];
      // 处理未完成任务数据
      const unfinishedList = Array.isArray(unfinishedRes) ? unfinishedRes : (unfinishedRes && (unfinishedRes.list || unfinishedRes.records || unfinishedRes.data)) || [];
      
      // 合并任务列表，标记任务状态
      const allTasks = [
        ...completedList.map(task => ({ ...task, isCompleted: true })),
        ...unfinishedList.map(task => ({ ...task, isCompleted: false }))
      ];
      
      console.log('合并后的任务列表:', allTasks);
      
      const mapFn = this._mapTaskRecord.bind(this);
      
      // 根据type字段分类任务
      // type: 0 -> 每日任务
      const daily = allTasks.filter(item => Number(item.type) === 0).map(mapFn);
      // type: 1 -> 更多任务
      const more = allTasks.filter(item => Number(item.type) === 1).map(mapFn);
      // type: 2 -> 成就列表
      const achievements = allTasks.filter(item => Number(item.type) === 2).map(mapFn);
      
      console.log('分类后的任务:', { daily, more, achievements });
      
      this.setData({ 
        dailyTasks: daily, 
        moreTasks: more, 
        achievements: achievements,
        showSkeleton: false
      });
      
      this.calculateTaskProgress();
    } catch (error) {
      console.error('加载任务列表失败:', error);
      this.setData({ showSkeleton: false });
    }
  },

  // 加载未完成的任务特征列表（接口17）- 保留此方法用于单独调用
  async loadUnfinishedTaskFeatList() {
    try {
      const api = require('../../services/api.js');
      const res = await api.getUnfinishedTaskFeatList();
      const list = Array.isArray(res) ? res : (res && (res.list || res.records || res.data)) || [];
      console.log('未完成任务列表:', list);
      return list;
    } catch (error) {
      console.error('加载未完成任务列表失败:', error);
      return [];
    }
  },

  // 规范化任务记录为前端展示用结构
  _mapTaskRecord(record) {
    const title = record.taskFeatName || record.name || record.title || '任务';
    const description = record.taskFeatDesc || record.description || '';
    const points = Number(record.points || record.point || 0);
    const current = Number(record.currentCount || record.current || 0);
    const target = Number(record.targetCount || record.target || 0);
    const progress = record.progress != null ? Number(record.progress) : (target > 0 ? Math.min(100, Math.round((current / target) * 100)) : (record.completed ? 100 : 0));

    // 任务状态逻辑优化
    const isFromCompletedAPI = record.isCompleted === true; // 来自接口15（已完成任务）
    const isFromUnfinishedAPI = record.isCompleted === false; // 来自接口17（未完成任务）
    
    // 根据接口文档：received为false表示已完成但未领取（可领取状态），received为true表示已领取
    const receivedFromAPI = !!(record.received);
    
    // 任务完成状态判断
    let completed = false;
    let claimable = false;
    let received = false; // 用于UI显示的received状态
    
    if (isFromCompletedAPI) {
      // 来自接口15的任务：已完成，根据received字段判断是否可领取
      completed = true;
      claimable = !receivedFromAPI; // received为false时可领取
      received = claimable; // UI中received为true表示可领取
    } else if (isFromUnfinishedAPI) {
      // 来自接口17的任务：根据后端实时计算结果判断
      // 兼容：部分任务在历史数据已达标时会返回 progress=100/isCompleted=true，但尚未写入任务记录
      const reachedTarget = !!record.isCompleted || !!record.completed || progress >= 100;
      completed = reachedTarget;
      claimable = reachedTarget;
      received = reachedTarget;
    } else {
      // 兼容旧逻辑
      const isAlreadyClaimed = !!(record.isReceived || record.receiveStatus === 2 || record.status === 3);
      const canClaim = !!(record.canReceive || record.claimable || record.receiveStatus === 1 || record.status === 2 || record.completed === true);
      completed = isAlreadyClaimed || canClaim;
      claimable = canClaim && !isAlreadyClaimed;
      received = claimable;
    }

    return {
      id: record.id,
      title,
      description,
      points,
      progress,
      // 展示控制
      received, // true表示可领取
      claimable, // 可领取且未被领取过
      completed, // 任务是否完成
      // 成就专用字段
      currentCount: current,
      targetCount: target,
      // 任务来源标识
      isFromCompletedAPI,
      isFromUnfinishedAPI,
      raw: record,
      type: record.type
    };
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    this.checkDarkMode();
    // 进入积分页需登录；取消登录后返回首页，避免停留在积分页签
    try {
      const AuthService = require('../../services/auth.js');
      await AuthService.ensureLogin();
      
      this.setData({ showSkeleton: true });

      // 已登录则拉取任务/成就列表和积分
      this.loadUserPoints();
      this.loadTaskFeatList();
    } catch (error) {
      console.log('[积分] 用户未登录或取消登录，返回首页');
      try {
        wx.switchTab({ url: '/pages/index/index' });
      } catch (e) {
        // 兜底：如果切换失败，仍保持当前页，但不显示数据
        this.setData({
          showSkeleton: true,
          userPoints: '-',
          dailyTasks: [],
          moreTasks: [],
          achievements: []
        });
      }
    }
  },

  // 加载用户积分（接口18）
  async loadUserPoints() {
    try {
      const api = require('../../services/api.js');
      const userPoints = await api.getUserPoints();
      this.setData({
        userPoints: (userPoints !== undefined && userPoints !== null) ? userPoints : 0
      });
    } catch (error) {
      console.error('[积分页面] 获取用户积分失败:', error);
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 模拟刷新数据
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 检查夜间模式
   */
  checkDarkMode() {
    const app = getApp();
    const appDarkMode = app && app.globalData ? app.globalData.isDarkMode : undefined;
    const storedDarkMode = wx.getStorageSync('isDarkMode');
    const isDark = typeof appDarkMode === 'boolean' ? appDarkMode : !!storedDarkMode;
    this.setData({
      isDarkMode: isDark
    });
  },

  /**
   * 完成任务
   */
  async completeTask(e) {
    const taskId = e.currentTarget.dataset.id;
    
    try {
      const api = require('../../services/api.js');
      const response = await api.post('/mini/user/tasks/complete', { taskId });
      
      if (response && response.code === 200) {
        const tasks = this.data.dailyTasks.map(task => {
          if (task.id === taskId && !task.completed) {
            return {
              ...task,
              completed: true,
              progress: 100
            };
          }
          return task;
        });
        
        this.setData({
          dailyTasks: tasks,
          userPoints: response.userPoints || this.data.userPoints
        });
        
        wx.showToast({
          title: '任务完成！',
          icon: 'success'
        });
        
        // 重新计算任务进度
        this.calculateTaskProgress();
      }
    } catch (error) {
      console.error('完成任务失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  /**
   * 编辑个人资料
   */
  editProfile() {
    wx.navigateTo({
      url: '/pkgContent/edit-profile/edit-profile'
    });
  },

  /**
   * 分享应用
   */
  shareApp() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    wx.showToast({
      title: '请点击右上角分享',
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 显示积分规则
   */
  showPointsRules() {
    wx.showModal({
      title: '积分规则',
      content: '1. 每日签到可获得10积分\n2. 发布帖子可获得20积分\n3. 评论互动可获得5积分\n4. 分享内容可获得15积分\n5. 完成每日任务可获得额外积分\n\n积分可用于兑换各种奖励，快来参与吧！',
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#4A90E2'
    });
  },

  /**
   * 显示常见问题
   */
  showFAQ() {
    wx.showModal({
      title: '常见问题',
      content: 'Q: 积分如何获得？\nA: 通过完成每日任务、发布内容、互动评论等方式获得。\n\nQ: 积分有什么用？\nA: 可以兑换各种奖励和特权。\n\nQ: 积分会过期吗？\nA: 积分永久有效，不会过期。\n\nQ: 如何查看积分明细？\nA: 在积分页面可以查看详细的积分记录。',
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#4A90E2'
    });
  },

  onInviteFriends() {
    wx.navigateTo({
      url: '/pages/invite/index'
    });
  },

  /**
   * 跳转到积分兑换页面
   */
  onExchangeEntry() {
    wx.navigateTo({
      url: '/pkgContent/points-exchange/points-exchange'
    });
  },

  /**
   * 切换页签
   */
  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentTab: index
    });
  },

  /**
   * 刷新页面
   */



  // 任务按钮点击：领取/去完成
  async onTaskButtonTap(e) {
    const taskId = e.currentTarget.dataset.id;
    const section = e.currentTarget.dataset.section; // 'daily' | 'more' | 'achievement'
    const dailyTasks = (this.data.dailyTasks || []).slice();
    const moreTasks = (this.data.moreTasks || []).slice();
    const achievements = (this.data.achievements || []).slice();

    // 在三个列表中查找对应任务
    const findTask = (arr) => arr.find(t => String(t.id) === String(taskId));
    let task = findTask(dailyTasks) || findTask(moreTasks) || findTask(achievements);
    if (!task) return;

    // 如果claimable为true，表示任务可领取，调用接口16
    if (task.claimable) {
      // 调用接口16领取积分
      try {
        const api = require('../../services/api.js');
        const result = await api.claimTaskFeat(task.id);
        const ok = result === true || result?.data === true || result?.success === true || result?.code === 200;
        if (ok) {
          // 本地更新状态
          const update = (arr) => arr.map(it => it.id === task.id ? { ...it, received: false, claimable: false, completed: true } : it);
          const newDaily = update(dailyTasks);
          const newMore = update(moreTasks);
          const newAchievements = update(achievements);
          
          // 调用接口18获取最新积分
          try {
            const pointsResult = await api.getUserPoints();
            const newPoints = pointsResult || ((this.data.userPoints || 0) + (task.points || 0));
            this.setData({ 
              dailyTasks: newDaily, 
              moreTasks: newMore, 
              achievements: newAchievements,
              userPoints: newPoints 
            });
          } catch (pointsError) {
            console.error('[积分页面] 获取积分失败，使用本地计算:', pointsError);
            // 如果获取积分失败，使用本地计算作为备用方案
            const newPoints = (this.data.userPoints || 0) + (task.points || 0);
            this.setData({ 
              dailyTasks: newDaily, 
              moreTasks: newMore, 
              achievements: newAchievements,
              userPoints: newPoints 
            });
          }
          
          this.calculateTaskProgress();
          wx.showToast({ title: '领取成功', icon: 'success' });
        } else {
          wx.showToast({ title: '领取失败', icon: 'none' });
        }
      } catch (err) {
        console.error('领取任务失败:', err);
        wx.showToast({ title: '领取失败', icon: 'none' });
      }
      return;
    }

    // 如果任务已完成但未领取，提示用户
    if (task.completed && !task.received) {
      // wx.showToast({ title: '任务已完成，请等待可领取状态', icon: 'none' });
      return;
    }

    // 去完成：根据任务类型可引导到不同页面，这里先统一跳转到首页
    wx.switchTab({ url: '/pages/index/index' });
  },
});
