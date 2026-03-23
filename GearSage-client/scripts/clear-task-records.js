const tcb = require('@cloudbase/node-sdk');

// 使用环境变量中的密钥
// 如果未设置环境变量，请在运行脚本前设置：
// Windows PowerShell:
// $env:TCB_SECRET_ID="你的SecretId"
// $env:TCB_SECRET_KEY="你的SecretKey"
const app = tcb.init({
  env: process.env.TCB_ENV_ID || 'cloud1-1g9eeb3p33faac61', // 您的云开发环境ID
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY
});

const db = app.database();
const _ = db.command;
const COL_TASK_RECORD = 'bz_mini_task_feat_record';

async function main() {
  if (!process.env.TCB_SECRET_ID || !process.env.TCB_SECRET_KEY) {
    console.error('错误：未设置环境变量 TCB_SECRET_ID 和 TCB_SECRET_KEY');
    console.error('请先设置环境变量（使用之前同步装备数据时的密钥）：');
    console.error('PowerShell: $env:TCB_SECRET_ID="..."; $env:TCB_SECRET_KEY="..."');
    process.exit(1);
  }

  try {
    console.log(`正在检查集合 ${COL_TASK_RECORD} ...`);
    
    // 获取当前记录总数
    const countRes = await db.collection(COL_TASK_RECORD).count();
    const total = countRes.total;
    
    if (total === 0) {
      console.log('集合为空，无需清理。');
      return;
    }

    console.log(`发现 ${total} 条任务记录，准备开始清理...`);
    
    // 循环删除，直到清空
    let deletedCount = 0;
    while (true) {
      // 每次最多删除 1000 条（云函数限制，或者 SDK 限制）
      // 使用 where({ _id: _.neq(null) }) 匹配所有文档，规避空查询限制
      const res = await db.collection(COL_TASK_RECORD).where({
        _id: _.neq(null)
      }).remove();
      
      if (res.deleted === 0) {
        break;
      }
      
      deletedCount += res.deleted;
      console.log(`已删除 ${deletedCount} / ${total} 条记录...`);
      
      if (deletedCount >= total) {
        break;
      }
    }
    
    console.log('清理完成！所有用户的任务进度已重置。');
    console.log(`共删除了 ${deletedCount} 条任务记录。`);
    
  } catch (err) {
    console.error('清理过程中出错:', err);
  }
}

main();
