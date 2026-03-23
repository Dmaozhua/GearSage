# 微信小程序分享功能说明

## 1. 当前已实现的内容

本次分享能力已经从“方案设计”落到了可运行代码，当前包含 4 条链路：

### 1.1 帖子详情页分享

已在帖子详情页实现：

- 会话分享：`onShareAppMessage`
- 朋友圈分享：`onShareTimeline`
- 页面配置开启：`enableShareAppMessage`、`enableShareTimeline`
- 分享来源参数回流：支持 `shareType`、`sharerUid`
- 原生分享按钮：底部按钮使用 `open-type="share"`

当前帖子分享路径：

```text
/pkgContent/detail/detail?id={postId}&shareType=post&sharerUid={userId}
```

朋友圈分享使用 `query`：

```text
id={postId}&shareType=timeline&sharerUid={userId}
```

对应代码位置：

- `pkgContent/detail/detail.js`
- `pkgContent/detail/detail.json`

### 1.2 朋友圈轻量落地页

新增轻量预览页，专门用于承接朋友圈分享，避免直接把复杂详情页暴露给单页模式。

已实现：

- 轻量页分享给好友
- 轻量页分享到朋友圈
- 打开时解析 `id`、`shareType`、`sharerUid`
- 通过帖子详情接口拉取数据并渲染精简内容
- 支持继续跳转到完整帖子详情页

当前轻量页路径：

```text
/pages/timeline-preview/index?id={postId}&shareType=timelinePreview&sharerUid={userId}
```

从轻量页跳完整详情时使用：

```text
/pkgContent/detail/detail?id={postId}&shareType=timelineLanding&sharerUid={userId}
```

对应代码位置：

- `pages/timeline-preview/index.js`
- `pages/timeline-preview/index.json`

### 1.3 邀请分享页

新增独立邀请页，用来承接“邀请新用户”场景，而不是和普通帖子分享混在一起。

已实现：

- 自动生成邀请参数：`inviteCode`、`inviterUid`、`inviterName`
- 邀请页会话分享
- 邀请页朋友圈分享
- 打开邀请页时解析 query 和 `scene`
- 本地暂存待绑定邀请参数
- 用户登录后自动把邀请参数带给服务端

邀请页路径：

```text
/pages/invite/index?inviteCode={inviteCode}&inviterUid={userId}&inviterName={nickname}
```

对应代码位置：

- `pages/invite/index.js`
- `pages/invite/index.json`
- `utils/invite.js`

### 1.4 邀请绑定与奖励服务端闭环

服务端已经补齐邀请新用户的核心闭环：

- 登录时接收邀请参数
- 新用户首登时自动尝试绑定邀请关系
- 同一用户只能绑定一次邀请人
- 禁止自己邀请自己
- 邀请关系写入数据库
- 邀请人积分奖励幂等发放
- 按日限制奖励次数
- 邀请任务可计入任务系统

对应代码位置：

- `cloudfunctions/miniApi/index.js`
- `services/auth.js`
- `services/api.js`

---

## 2. 页面与参数约定

### 2.1 帖子详情分享参数

| 参数 | 说明 |
| --- | --- |
| `id` | 帖子 ID |
| `shareType` | 分享来源类型，当前可能是 `post`、`timeline`、`timelinePreview`、`timelineLanding` |
| `sharerUid` | 分享者用户 ID |

### 2.2 邀请分享参数

| 参数 | 说明 |
| --- | --- |
| `inviteCode` | 邀请码，前后端共用的主识别字段 |
| `inviterUid` | 邀请人用户 ID |
| `inviterName` | 邀请人昵称 |

### 2.3 `scene` 兼容

邀请页和朋友圈轻量页都兼容从 `scene` 解参，逻辑是：

1. 读取 `options.scene`
2. `decodeURIComponent`
3. 按 `key=value&key=value` 方式拆分
4. 合并回页面参数对象

这意味着后续如果接入小程序码，也可以沿用当前参数协议。

---

## 3. 前端实现说明

### 3.1 帖子详情页

详情页主要实现点：

- `buildSharePath()`：构造会话分享路径
- `buildShareQuery()`：构造朋友圈分享 query
- `buildTimelinePreviewPath()`：构造朋友圈轻量页入口
- `onShareAppMessage()`：返回标题、路径、封面图
- `onShareTimeline()`：返回标题、query、封面图

当前右上角分享入口不是直接触发原生面板，而是弹出操作菜单，用来：

- 进入朋友圈轻量预览
- 复制帖子路径
- 提示使用底部原生分享按钮

### 3.2 邀请页

邀请页主要实现点：

- `buildInvitePayload()`：生成邀请参数
- `buildInvitePath()`：生成邀请路径
- `savePendingInvite()`：本地缓存待绑定邀请
- `getPendingInvite()`：读取待绑定邀请
- `clearPendingInvite()`：登录成功后清理缓存

### 3.3 登录透传邀请参数

在 `services/auth.js` 中，微信登录流程已修改为：

1. `wx.login()` 获取 `code`
2. 读取本地 `pendingInvite`
3. 组装登录参数
4. 调用 `/mini/user/login`
5. 登录成功后清理本地待绑定邀请

登录请求结构：

```json
{
  "code": "wx-login-code",
  "inviteCode": "DYABC123",
  "inviterUid": "user_xxx",
  "inviterName": "钓友A"
}
```

---

## 4. 服务端接口说明

## 4.1 `POST /mini/user/login`

用途：

- 微信登录
- 新用户自动吃掉邀请参数
- 自动生成或补齐用户邀请码

请求参数：

```json
{
  "code": "wx-login-code",
  "inviteCode": "DYABC123",
  "inviterUid": "user_xxx",
  "inviterName": "钓友A"
}
```

当前和分享/邀请相关的返回字段：

```json
{
  "token": "token",
  "id": "user_id",
  "inviteCode": "DY000123",
  "invitedByUserId": "inviter_user_id",
  "inviteSuccessCount": 2,
  "inviteRewardPoints": 60,
  "inviteBinding": {
    "bound": true,
    "reason": "success",
    "inviterUserId": "inviter_user_id",
    "inviteCode": "DY000999",
    "rewardStatus": "granted",
    "inviterRewardPoints": 30,
    "inviteeRewardPoints": 0
  }
}
```

说明：

- 新用户登录时会尝试自动绑定邀请关系
- 老用户登录不会重复发奖励

## 4.2 `GET /mini/user/info`

用途：

- 获取用户资料
- 同时补齐并返回邀请码字段

当前和邀请相关的字段：

```json
{
  "id": "user_id",
  "inviteCode": "DY000123",
  "invitedByUserId": "inviter_user_id"
}
```

## 4.3 `POST /mini/invite/bind`

用途：

- 手动绑定邀请关系
- 一般作为自动绑定失败后的补充接口

请求参数：

```json
{
  "inviteCode": "DYABC123",
  "inviterUid": "user_xxx",
  "inviterName": "钓友A"
}
```

返回示例：

```json
{
  "bound": true,
  "relationId": "relation_id",
  "inviterUserId": "inviter_user_id",
  "inviteCode": "DY000999",
  "rewardStatus": "granted",
  "inviterRewardPoints": 30,
  "inviteeRewardPoints": 0
}
```

常见失败原因：

- `empty_payload`
- `missing_user`
- `already_bound`
- `self_invite`
- `invite_expired`
- `inviter_not_found`

## 4.4 `GET /mini/invite/summary`

用途：

- 获取当前用户的邀请码和邀请结果汇总

返回示例：

```json
{
  "inviteCode": "DY000123",
  "invitedByUserId": "",
  "inviteSuccessCount": 3,
  "inviteRewardPoints": 90,
  "inviteRewardCount": 3,
  "inviterDailyRewardLimit": 10,
  "inviterRewardPoints": 30,
  "inviteeRewardPoints": 0,
  "recentInvites": [
    {
      "id": "relation_id",
      "inviteeUserId": "invitee_id",
      "inviteeName": "新用户",
      "rewardStatus": "granted",
      "inviterRewardPoints": 30,
      "createTime": "2026-03-15T10:00:00.000Z"
    }
  ]
}
```

## 4.5 `GET /mini/topic?topicId={id}`

用途：

- 朋友圈轻量落地页拉取帖子详情

说明：

- 该接口不是新加接口，但已经作为分享链路的一部分被复用

---

## 5. 数据落库与奖励规则

### 5.1 邀请关系集合

当前邀请关系写入集合：

```text
bz_user_invite_relation
```

核心字段包括：

- `inviterUserId`
- `inviterOpenId`
- `inviterName`
- `inviteeUserId`
- `inviteeOpenId`
- `inviteeName`
- `inviteCode`
- `status`
- `rewardStatus`
- `inviterRewardPoints`
- `inviteeRewardPoints`
- `rewardTime`
- `createTime`

### 5.2 当前奖励规则

当前代码中的默认配置为：

- 邀请人奖励：`30` 积分
- 被邀请人奖励：`0` 积分
- 邀请奖励每日上限：`10` 次
- 仅允许在新用户首个登录日内绑定邀请关系

### 5.3 当前防刷约束

当前已实现的约束：

- 同一用户只能绑定一次邀请人
- 如果用户已经存在 `invitedByUserId`，不再重复绑定
- 如果邀请关系表中已存在该被邀请人，也不再重复绑定
- 自己不能邀请自己
- 奖励发放按关系记录幂等处理
- 超过日上限后关系仍可绑定，但奖励状态会标记为 `capped`

---

## 6. 对外可用接口封装

前端服务层当前已提供以下方法：

### 6.1 `services/api.js`

```javascript
api.bindInvite(payload)
api.getInviteSummary()
api.getTopicDetail(topicId)
```

### 6.2 `services/auth.js`

```javascript
auth.wxLogin()
auth.ensureLogin()
```

其中 `auth.wxLogin()` 已经自动透传本地缓存的邀请参数，不需要页面重复拼装登录请求。

---

## 7. 当前范围说明

本次已完成的是“站内分享 + 朋友圈轻量页 + 邀请新用户闭环”的第一阶段。

已实现：

- 原生会话分享
- 原生朋友圈分享
- 朋友圈轻量落地页
- 邀请分享页
- 登录自动绑定邀请
- 邀请奖励与汇总接口

暂未接入：

- 海报生成
- `getwxacodeunlimit` 小程序码生成
- 邀请明细独立页面
- 被邀请人首登奖励展示页
- 更细粒度的风控策略

后续如果继续扩展，建议优先顺序：

1. 邀请明细页
2. 邀请奖励流水
3. 小程序码/海报分享
4. 风控配置中心
