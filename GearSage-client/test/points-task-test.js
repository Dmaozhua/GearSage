// Points界面任务分类测试文件
// 测试接口15、17整合和type分类功能

// 模拟接口15返回的已完成任务数据
const mockCompletedTasks = [
  {
    id: 1,
    taskFeatName: '每日签到',
    taskFeatDesc: '完成每日签到任务',
    points: 10,
    received: true, // 可领取
    type: 0, // 每日任务
    progress: 100
  },
  {
    id: 2,
    taskFeatName: '完善资料',
    taskFeatDesc: '完善个人资料信息',
    points: 50,
    received: false, // 已领取
    type: 1, // 更多任务
    progress: 100
  },
  {
    id: 3,
    taskFeatName: '发布达人',
    taskFeatDesc: '发布5篇优质内容',
    points: 100,
    received: true, // 可领取
    type: 2, // 成就
    progress: 100,
    currentCount: 5,
    targetCount: 5
  }
];

// 模拟接口17返回的未完成任务数据
const mockUnfinishedTasks = [
  {
    id: 4,
    taskFeatName: '发表帖子',
    taskFeatDesc: '发布一篇关于路亚装备的分享',
    points: 30,
    received: false,
    type: 0, // 每日任务
    progress: 0
  },
  {
    id: 5,
    taskFeatName: '邀请好友',
    taskFeatDesc: '邀请3位好友加入钓友说',
    points: 100,
    received: false,
    type: 1, // 更多任务
    progress: 30,
    currentCount: 1,
    targetCount: 3
  },
  {
    id: 6,
    taskFeatName: '评论专家',
    taskFeatDesc: '发布20条有效评论',
    points: 80,
    received: false,
    type: 2, // 成就
    progress: 75,
    currentCount: 15,
    targetCount: 20
  }
];

// 模拟_mapTaskRecord方法
function mockMapTaskRecord(record) {
  const title = record.taskFeatName || record.name || record.title || '任务';
  const description = record.taskFeatDesc || record.description || '';
  const points = Number(record.points || record.point || 0);
  const current = Number(record.currentCount || record.current || 0);
  const target = Number(record.targetCount || record.target || 0);
  const progress = record.progress != null ? Number(record.progress) : (target > 0 ? Math.min(100, Math.round((current / target) * 100)) : (record.completed ? 100 : 0));

  // 任务状态逻辑
  const isFromCompletedAPI = record.isCompleted === true;
  const isFromUnfinishedAPI = record.isCompleted === false;
  const received = !!(record.received);
  
  let completed = false;
  let claimable = false;
  
  if (isFromCompletedAPI) {
    completed = true;
    claimable = received;
  } else if (isFromUnfinishedAPI) {
    completed = false;
    claimable = false;
  }

  return {
    id: record.id,
    title,
    description,
    points,
    progress,
    received,
    claimable,
    completed,
    currentCount: current,
    targetCount: target,
    isFromCompletedAPI,
    isFromUnfinishedAPI,
    type: record.type
  };
}

// 测试任务分类功能
function testTaskClassification() {
  console.log('=== 测试任务分类功能 ===');
  
  // 合并任务列表，标记任务状态
  const allTasks = [
    ...mockCompletedTasks.map(task => ({ ...task, isCompleted: true })),
    ...mockUnfinishedTasks.map(task => ({ ...task, isCompleted: false }))
  ];
  
  console.log('合并后的任务列表:', allTasks);
  
  // 映射任务数据
  const mappedTasks = allTasks.map(mockMapTaskRecord);
  
  // 根据type字段分类任务
  const daily = mappedTasks.filter(item => Number(item.type) === 0);
  const more = mappedTasks.filter(item => Number(item.type) === 1);
  const achievements = mappedTasks.filter(item => Number(item.type) === 2);
  
  console.log('\n=== 分类结果 ===');
  console.log('每日任务 (type: 0):', daily);
  console.log('更多任务 (type: 1):', more);
  console.log('成就列表 (type: 2):', achievements);
  
  // 验证分类结果
  console.log('\n=== 验证结果 ===');
  console.log(`每日任务数量: ${daily.length} (期望: 2)`);
  console.log(`更多任务数量: ${more.length} (期望: 2)`);
  console.log(`成就数量: ${achievements.length} (期望: 2)`);
  
  // 验证任务状态
  console.log('\n=== 任务状态验证 ===');
  daily.forEach(task => {
    console.log(`${task.title}: completed=${task.completed}, claimable=${task.claimable}, received=${task.received}`);
  });
  
  more.forEach(task => {
    console.log(`${task.title}: completed=${task.completed}, claimable=${task.claimable}, received=${task.received}`);
  });
  
  achievements.forEach(task => {
    console.log(`${task.title}: completed=${task.completed}, claimable=${task.claimable}, received=${task.received}`);
  });
  
  return { daily, more, achievements };
}

// 测试领取功能
function testClaimFunction() {
  console.log('\n=== 测试领取功能 ===');
  
  const { daily, more, achievements } = testTaskClassification();
  const allTasks = [...daily, ...more, ...achievements];
  
  // 找到可领取的任务
  const claimableTasks = allTasks.filter(task => task.claimable);
  console.log('可领取的任务:', claimableTasks.map(t => ({ id: t.id, title: t.title, points: t.points })));
  
  // 找到已完成但不可领取的任务
  const completedButNotClaimable = allTasks.filter(task => task.completed && !task.claimable);
  console.log('已完成但不可领取的任务:', completedButNotClaimable.map(t => ({ id: t.id, title: t.title, reason: '已领取' })));
  
  // 找到未完成的任务
  const incompleteTasks = allTasks.filter(task => !task.completed);
  console.log('未完成的任务:', incompleteTasks.map(t => ({ id: t.id, title: t.title, progress: t.progress })));
}

// 运行测试
if (require.main === module) {
  testTaskClassification();
  testClaimFunction();
}

module.exports = {
  testTaskClassification,
  testClaimFunction,
  mockCompletedTasks,
  mockUnfinishedTasks
};