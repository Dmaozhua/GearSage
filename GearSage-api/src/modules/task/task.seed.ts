export type TaskSeed = {
  id: string;
  type: number;
  actionType: string;
  name: string;
  taskFeatDesc: string;
  points: number;
  targetCount: number;
  sort: number;
};

export const TASK_SEEDS: TaskSeed[] = [
  {
    id: 'task_daily_login',
    type: 0,
    actionType: 'daily_login',
    name: '每日登录',
    taskFeatDesc: '每天登录 GearSage 一次',
    points: 5,
    targetCount: 1,
    sort: 10,
  },
  {
    id: 'task_daily_post',
    type: 0,
    actionType: 'post_interaction',
    name: '今日发帖',
    taskFeatDesc: '今天发布 1 篇帖子',
    points: 15,
    targetCount: 1,
    sort: 20,
  },
  {
    id: 'task_daily_comment',
    type: 0,
    actionType: 'comment_interaction',
    name: '今日评论',
    taskFeatDesc: '今天发表 1 条评论',
    points: 10,
    targetCount: 1,
    sort: 30,
  },
  {
    id: 'task_daily_like',
    type: 0,
    actionType: 'like_interaction',
    name: '今日点赞',
    taskFeatDesc: '今天点赞 1 次内容',
    points: 5,
    targetCount: 1,
    sort: 40,
  },
  {
    id: 'task_more_profile',
    type: 1,
    actionType: 'edit_profile',
    name: '完善资料',
    taskFeatDesc: '设置昵称、简介或头像，完成一次资料完善',
    points: 20,
    targetCount: 1,
    sort: 50,
  },
  {
    id: 'task_more_invite',
    type: 1,
    actionType: 'invite_master',
    name: '邀请一位好友',
    taskFeatDesc: '成功邀请 1 位好友加入 GearSage',
    points: 50,
    targetCount: 1,
    sort: 60,
  },
  {
    id: 'task_achievement_post',
    type: 2,
    actionType: 'post_master',
    name: '发帖达人',
    taskFeatDesc: '累计发布 5 篇帖子',
    points: 100,
    targetCount: 5,
    sort: 100,
  },
  {
    id: 'task_achievement_comment',
    type: 2,
    actionType: 'comment_master',
    name: '评论达人',
    taskFeatDesc: '累计发表 20 条评论',
    points: 150,
    targetCount: 20,
    sort: 110,
  },
  {
    id: 'task_achievement_like',
    type: 2,
    actionType: 'like_master',
    name: '点赞达人',
    taskFeatDesc: '累计点赞 30 次帖子',
    points: 150,
    targetCount: 30,
    sort: 120,
  },
];
