// 测试修复received状态bug的逻辑

// 模拟_mapTaskRecord方法
function _mapTaskRecord(record) {
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
    // 来自接口17的任务：未完成，不可领取
    completed = false;
    claimable = false;
    received = false;
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
    completed, // true表示已完成
    claimable, // true表示可领取
    // 原始数据
    receivedFromAPI,
    isFromCompletedAPI,
    isFromUnfinishedAPI
  };
}

// 测试数据：用户提供的bug案例
const testData = [
  {
    "id": "1961821632620732417",
    "userId": "1947615570984300546",
    "taskFeatId": null,
    "taskFeatName": "每日登录",
    "points": 3,
    "received": false, // 已完成但未领取
    "taskFeatDesc": "每日登录后可完成任务",
    "type": 0,
    "createTime": "2025-08-31 00:01:40",
    "isCompleted": true // 来自接口15
  },
  {
    "id": "1962052427037904898",
    "userId": "1947615570984300546",
    "taskFeatId": null,
    "taskFeatName": "互动点赞",
    "points": 1,
    "received": true, // 已领取
    "taskFeatDesc": "给任意1个帖子点赞后可完成任务",
    "type": 0,
    "createTime": "2025-08-31 15:18:46",
    "isCompleted": true // 来自接口15
  }
];

// 执行测试
console.log('=== Bug修复测试 ===');
console.log('');

testData.forEach((task, index) => {
  const result = _mapTaskRecord(task);
  
  console.log(`任务 ${index + 1}: ${result.title}`);
  console.log(`  API返回的received: ${task.received}`);
  console.log(`  UI显示的received: ${result.received}`);
  console.log(`  completed: ${result.completed}`);
  console.log(`  claimable: ${result.claimable}`);
  console.log(`  按钮状态: ${result.received ? '领取' : (result.completed ? '已完成' : '去完成')}`);
  console.log(`  预期状态: ${task.received ? '已完成' : '领取'}`);
  console.log(`  状态正确: ${(task.received ? '已完成' : '领取') === (result.received ? '领取' : (result.completed ? '已完成' : '去完成'))}`);
  console.log('');
});

console.log('=== 测试总结 ===');
console.log('修复后的逻辑：');
console.log('- API返回received=false时，UI显示为可领取状态（received=true）');
console.log('- API返回received=true时，UI显示为已完成状态（completed=true）');
console.log('- 按钮文本正确显示："领取" 或 "已完成"');