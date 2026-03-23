# 钓友说小程序 API（当前代码实装盘点）

本文档按“当前小程序代码里实际调用/映射到的接口”整理，包含：
- `/mini/*` 路由：在小程序侧由 [api.js](file:///d:/Xiaochengxu/Diaoyoushuo/services/api.js) 根据 `CLOUD_ACTION_MAP` 自动转为云函数 `miniApi` 调用
- 直接 `wx.cloud.callFunction`：未走 `/mini/*` 映射、直接按 action 调用
- 少量“代码里有调用但未在仓库找到实现/映射”的接口：标记为“待确认”

## 0. 通用约定

### 0.1 真实调用方式

当命中映射（method + path）时，小程序不会发 HTTP 请求，而是调用：

```js
wx.cloud.callFunction({
  name: 'miniApi',
  data: { action: '<action>', payload: { ... } }
})
```

对应云函数入口：[miniApi/index.js](file:///d:/Xiaochengxu/Diaoyoushuo/cloudfunctions/miniApi/index.js)

### 0.2 返回包络（Envelope）

云函数 `miniApi` 的统一返回：

```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

- `code=200`：成功
- `code!=200`：失败，`data` 为 `null`

### 0.3 分页格式（miniApi 实装）

目前仅部分列表接口支持分页，统一采用：
- 请求参数：`page`（从 1 开始），`limit`（1~100）
- 返回：`data` 直接是数组（不返回 `total` / `hasMore`）

示例（以 `GET /mini/topic/all` 为例）：

请求：
```json
{ "page": 1, "limit": 20 }
```

返回：
```json
{ "code": 200, "msg": "success", "data": [ /* items */ ] }
```

### 0.4 登录判断（miniApi 实装）

`miniApi` 的“登录”本质是：云端能通过 `wxContext.OPENID` 在 `bz_mini_user` 找到状态正常的用户记录。
- 需要登录的接口：内部调用 `getLoginUserOrThrow(wxContext.OPENID)`；未登录时通常会返回 `code=500`，`msg=用户不存在或状态异常`
- 不需要登录的接口：不调用 `getLoginUserOrThrow`

## 1. 用户与登录

### 1.1 POST /mini/user/login

- 方法：POST
- 路径：/mini/user/login
- 云函数 action：user.login
- 是否需要登录：否
- 请求参数：
  - `code: string` 微信登录 code（小程序侧来自 `wx.login()`）
  - 可选：`inviteCode?: string`、`inviterUid?: string`、`inviterName?: string`
- 返回结构：
  - `data.token: string` 固定为 `cloud-openid-auth`（用于兼容小程序侧 auth 逻辑）
  - `data.id: string` 用户ID（等于 `_id`）
  - `data.openId: null`（服务端返回时置空）
  - 其余：用户信息（昵称、头像、积分、等级、邀请字段等）
- 错误码：
  - `200` 成功
  - `500` 失败（示例：`(0101403)当前用户已封禁或注销`）
- 分页格式：无

### 1.2 GET /mini/user/info

- 方法：GET
- 路径：/mini/user/info
- 云函数 action：user.info
- 是否需要登录：否（按用户 id 查询）
- 请求参数：
  - `id: string` 用户ID
- 返回结构：
  - `data: User`（包含 `id` 字段）
- 错误码：
  - `200` 成功
  - `500` 失败（如：doc 不存在会抛异常）
- 分页格式：无

### 1.3 POST /mini/user/update

- 方法：POST
- 路径：/mini/user/update
- 云函数 action：user.update
- 是否需要登录：是
- 请求参数（可选字段按需传）：
  - `avatarUrl?: string`
  - `nickName?: string`
  - `bio?: string`
  - `shipAddress?: string`
  - `background?: string`
- 返回结构：
  - `data: true`
- 错误码：
  - `200` 成功
  - `500` 未登录 / 用户状态异常
- 分页格式：无

### 1.4 GET /mini/user/points

- 方法：GET
- 路径：/mini/user/points
- 云函数 action：user.points
- 是否需要登录：是
- 请求参数：无
- 返回结构：
  - `data: number` 用户积分
- 错误码：
  - `200` 成功
  - `500` 未登录 / 用户状态异常
- 分页格式：无

## 2. 邀请

### 2.1 POST /mini/invite/bind

- 方法：POST
- 路径：/mini/invite/bind
- 云函数 action：invite.bind
- 是否需要登录：是
- 请求参数：
  - `inviteCode?: string`（会被自动转大写）
  - `inviterUid?: string`
  - `inviterName?: string`
- 返回结构（成功/失败都返回 `200`，以 `data.bound` 判定）：
  - `data.bound: boolean`
  - `data.reason?: string` 失败原因：`empty_payload` / `already_bound` / `not_new_user` / `inviter_not_found` / `self_invite` / `invite_code_mismatch`
  - `data.inviterUserId?: string`
  - `data.inviteCode?: string`
  - `data.rewardStatus?: "granted"|"capped"`
  - `data.inviterRewardPoints?: number`
  - `data.inviteeRewardPoints?: number`
- 错误码：
  - `200` 成功（含 “绑定失败但正常返回” 的情况）
  - `500` 未登录 / 用户状态异常
- 分页格式：无

### 2.2 GET /mini/invite/summary

- 方法：GET
- 路径：/mini/invite/summary
- 云函数 action：invite.summary
- 是否需要登录：是
- 请求参数：无
- 返回结构：
  - `data.inviteCode: string`
  - `data.invitedByUserId: string`
  - `data.inviteSuccessCount: number`
  - `data.inviteRewardPoints: number`
  - `data.inviteRewardCount: number`
  - `data.inviterDailyRewardLimit: number`
  - `data.inviterRewardPoints: number`
  - `data.inviteeRewardPoints: number`
  - `data.recentInvites: Array<{ id, inviteeUserId, inviteeName, rewardStatus, inviterRewardPoints, createTime }>`
- 错误码：
  - `200` 成功
  - `500` 未登录 / 用户状态异常
- 分页格式：无（固定返回最近 5 条）

## 3. 帖子（topic）

帖子字段量较大，核心结构建议以现有规范为准：[topic_api.md](file:///d:/Xiaochengxu/Diaoyoushuo/%E8%AF%B4%E6%98%8E/topic_api.md)。
这里仅给出接口级别的参数入口与分页规则。

### 3.1 PUT /mini/topic（保存草稿）

- 方法：PUT
- 路径：/mini/topic
- 云函数 action：topic.new
- 是否需要登录：是
- 请求参数：`TopicPayload`（至少包含 `topicCategory`, `title`，其余按不同模式传）
- 返回结构：
  - `data: string` 新草稿/草稿记录的 `_id`
- 错误码：
  - `200` 成功
  - `400` 参数缺失/校验失败（来自 `validateTopicPayload` 的失败会以异常形式抛出，最终可能表现为 `500`）
  - `500` 未登录 / 服务端异常
- 分页格式：无

### 3.2 POST /mini/topic（发布/更新发布）

- 方法：POST
- 路径：/mini/topic
- 云函数 action：topic.update
- 是否需要登录：是
- 请求参数：
  - `id?: string` 草稿 id（传则发布该草稿；不传则直接创建并发布）
  - 其余：`TopicPayload`
- 返回结构：
  - `data: boolean` `true` 表示发布/更新成功；`false` 常见于“草稿不存在或不处于可发布状态”
- 错误码：
  - `200` 成功
  - `500` 未登录 / 服务端异常
- 分页格式：无

### 3.3 DELETE /mini/topic（删除）

- 方法：DELETE
- 路径：/mini/topic
- 云函数 action：topic.delete
- 是否需要登录：是
- 请求参数：
  - `id: string` 帖子 id
- 返回结构：
  - `data: true`
- 错误码：
  - `200` 成功
  - `500` 未登录 / 服务端异常
- 分页格式：无

### 3.4 GET /mini/topic（详情）

- 方法：GET
- 路径：/mini/topic
- 云函数 action：topic.get
- 是否需要登录：是
- 请求参数：
  - `topicId: string`
- 返回结构：
  - `data: TopicDetail`（带聚合字段：作者信息、展示标签、是否点赞等）
- 错误码：
  - `200` 成功
  - `400` 缺少 `topicId`
  - `404` 帖子不存在/已删除
  - `500` 未登录 / 服务端异常
- 分页格式：无

### 3.5 GET /mini/topic/all（列表）

- 方法：GET
- 路径：/mini/topic/all
- 云函数 action：topic.all
- 是否需要登录：是
- 请求参数：
  - `page?: number` 默认 1
  - `limit?: number` 默认 20（服务端会 clamp 到 1~100）
  - `topicCategory?: number`
  - `questionType?: string`（仅问答/讨论类场景用到）
  - `title?: string` 标题模糊搜索
  - 装备筛选（用于装备详情页的“关联帖子”）：
    - `gearCategory?: string`
    - `gearModel?: string`
    - `gearItemId?: number`
  - `debugSource?: string` 仅用于日志
- 返回结构：
  - `data: TopicListItem[]`
- 错误码：
  - `200` 成功
  - `500` 未登录 / 服务端异常
- 分页格式：
  - 请求：`page + limit`
  - 返回：数组；不含 total

### 3.6 GET /mini/topic/mine（我的帖子）

- 方法：GET
- 路径：/mini/topic/mine
- 云函数 action：topic.mine
- 是否需要登录：是
- 请求参数：
  - `page?: number` 默认 1
  - `limit?: number` 默认 20（服务端会 clamp 到 1~100）
  - `status?: number`
  - `topicCategory?: number`
- 返回结构：
  - `data: TopicRecord[]`（已 normalize）
- 错误码：
  - `200` 成功
  - `500` 未登录 / 服务端异常
- 分页格式：
  - 请求：`page + limit`
  - 返回：数组；不含 total

### 3.7 GET /mini/topic/tmp（当前草稿）

- 方法：GET
- 路径：/mini/topic/tmp
- 云函数 action：topic.tmp
- 是否需要登录：是
- 请求参数：无
- 返回结构：
  - `data: TopicRecord | null` 返回最近一个草稿（`status=0`），没有则 `null`
- 错误码：
  - `200` 成功
  - `500` 未登录 / 服务端异常
- 分页格式：无

### 3.8 POST /mini/topic/like（点赞/取消点赞）

- 方法：POST
- 路径：/mini/topic/like
- 云函数 action：topic.like
- 是否需要登录：是
- 请求参数：
  - `topicId?: string` 推荐字段名
  - 兼容字段：`id?: string`（小程序侧会自动映射到 `topicId`）
- 返回结构：
  - `data: boolean` `true=点赞成功`，`false=取消点赞`
- 错误码：
  - `200` 成功
  - `400` 缺少 `topicId`
  - `404` 帖子不存在/已删除
  - `500` 未登录 / 服务端异常
- 分页格式：无

## 4. 评论

### 4.1 GET /mini/comment（评论列表）

- 方法：GET
- 路径：/mini/comment
- 云函数 action：comment.list
- 是否需要登录：否
- 请求参数：
  - `topicId: string`
  - `replayCommentId?: string`（原字段拼写为 replay；用于查询某条评论的回复）
- 返回结构：
  - `data: Comment[]`
  - 服务端会补齐字段：`id`、`nickName`、`avatarUrl`、`displayTag`、`tagName`、`tagRarityLevel` 等
- 错误码：
  - `200` 成功
  - `500` 服务端异常（如 topicId 缺失导致数据库查询异常）
- 分页格式：无（当前实现一次性返回全部，按 `createTime asc`）

### 4.2 PUT /mini/comment（新增评论）

- 方法：PUT
- 路径：/mini/comment
- 云函数 action：comment.add
- 是否需要登录：是
- 请求参数（透传存储，至少需要以下字段）：
  - `topicId: string`
  - `content: string`
  - 可选：`replayCommentId?: string`、`replayUserId?: string` 等（具体由前端传什么决定）
- 返回结构：
  - `data: true`
- 错误码：
  - `200` 成功
  - `400` 帖子不存在
  - `500` 未登录 / 服务端异常
- 分页格式：无

## 5. 标签（展示标签/衣柜/佩戴设置）

### 5.1 GET /mini/tag/usable（我的可用标签列表）

- 方法：GET
- 路径：/mini/tag/usable
- 云函数 action：tag.usable
- 是否需要登录：是
- 请求参数：无
- 返回结构：
  - `data: Array<UserOwnedTag>`
  - 每项会包含 `displayTag`（前端渲染用）
- 错误码：
  - `200` 成功
  - `500` 未登录 / 服务端异常
- 分页格式：无

### 5.2 GET /mini/tag/used（当前佩戴与展示偏好）

- 方法：GET
- 路径：/mini/tag/used
- 云函数 action：tag.used
- 是否需要登录：是
- 请求参数：无
- 返回结构（核心字段）：
  - `data.mainTagId: string|null`
  - `data.mainTag: DisplayTag|null`
  - `data.postTagMode: string`
  - `data.customPostTags: object`
  - `data.settings: { mainTagId, postTagMode, customPostTags, preferIdentityInReview, preferFunInCatch }`
  - `data.ownedTags: Array<UserOwnedTag & { displayTag }>`
  - `data.groupedTags: object`
  - `data.previewByPostType: any[]`
- 错误码：
  - `200` 成功
  - `500` 未登录 / 服务端异常
- 分页格式：无

### 5.3 POST /mini/tag/used（更新佩戴与展示偏好）

- 方法：POST
- 路径：/mini/tag/used
- 云函数 action：tag.changeUse
- 是否需要登录：是
- 请求参数：
  - `mainTagId?: string|null`（为空/空字符串表示取消佩戴）
  - 兼容字段：`equippedTagId?: string|null`、`tagId?: string|null`
  - `postTagMode?: string`
  - `customPostTags?: object`
  - `preferIdentityInReview?: boolean`
  - `preferFunInCatch?: boolean`
- 返回结构：
  - `data` 结构与 `GET /mini/tag/used` 相同（更新后的最新状态）
- 错误码：
  - `200` 成功
  - `400` 标签不存在或未拥有
  - `500` 未登录 / 服务端异常
- 分页格式：无

### 5.4 PUT /mini/tag/batch（批量写入标签定义）

- 方法：PUT
- 路径：/mini/tag/batch
- 云函数 action：tag.batchAdd
- 是否需要登录：否（当前实现未做鉴权，建议仅内部使用）
- 请求参数：
  - `tags: any[]` 每项透传写入 `bz_tag_definitions`
- 返回结构：
  - `data: true`
- 错误码：
  - `200` 成功
  - `500` 服务端异常
- 分页格式：无

## 6. 积分商城（goods）

### 6.1 GET /mini/goods（商品列表）

- 方法：GET
- 路径：/mini/goods
- 云函数 action：goods.list
- 是否需要登录：否
- 请求参数：
  - `type?: number`（可选筛选）
- 返回结构：
  - `data: Goods[]`
  - 每项会补齐：`id`、`goodsName`、`points`、`image`、`description`、`rarityLevel`、`displayTag`、`tagDefinition`
- 错误码：
  - `200` 成功
  - `500` 服务端异常
- 分页格式：无（当前实现全量返回）

### 6.2 POST /mini/goods（兑换）

- 方法：POST
- 路径：/mini/goods
- 云函数 action：goods.redeem
- 是否需要登录：是
- 请求参数：
  - `goodsId?: string` 推荐字段名
  - 兼容字段：`id?: string`（小程序侧会自动映射到 `goodsId`）
- 返回结构：
  - `data: true`
- 错误码：
  - `200` 成功
  - `400` 商品不存在 / 已下架 / 库存不足 / 商品数据异常 / 积分不足 / 标签不存在 / 已拥有该标签
  - `500` 未登录 / 服务端异常
- 分页格式：无

## 7. 任务/成就（taskFeat）

### 7.1 GET /mini/taskFeat（我的已完成/可领奖记录）

- 方法：GET
- 路径：/mini/taskFeat
- 云函数 action：task.list
- 是否需要登录：是
- 请求参数：无
- 返回结构：
  - `data: TaskRecordView[]`（服务端会把 task 定义与 record 合并，并补齐 `completed=true, progress=100`）
- 错误码：
  - `200` 成功
  - `500` 未登录 / 服务端异常
- 分页格式：无（当前实现全量返回）

### 7.2 GET /mini/taskFeat/unfinish（未完成任务列表）

- 方法：GET
- 路径：/mini/taskFeat/unfinish
- 云函数 action：task.unfinish
- 是否需要登录：是
- 请求参数：无
- 返回结构：
  - `data: TaskWithProgress[]`（包含 `currentCount/targetCount/progress/isCompleted` 等字段）
- 错误码：
  - `200` 成功
  - `500` 未登录 / 服务端异常
- 分页格式：无（当前实现全量返回）

### 7.3 POST /mini/taskFeat（领取积分）

- 方法：POST
- 路径：/mini/taskFeat
- 云函数 action：task.receive
- 是否需要登录：是
- 请求参数（多种兼容写法）：
  - 推荐：`recordId: string` 任务记录 id
  - 兼容：`id: string`（可能是 recordId，也可能是 taskId）
- 返回结构：
  - `data: true`
- 错误码：
  - `200` 成功
  - `400` 任务未达成，暂不可领取 / 记录不存在
  - `500` 未登录 / 服务端异常
- 分页格式：无

### 7.4 PUT /mini/taskFeat（批量写入任务定义）

- 方法：PUT
- 路径：/mini/taskFeat
- 云函数 action：task.batchAdd
- 是否需要登录：否（当前实现未做鉴权，建议仅内部使用）
- 请求参数：
  - `list: any[]` 每项透传写入 `bz_mini_task_feat`
- 返回结构：
  - `data: true`
- 错误码：
  - `200` 成功
  - `500` 服务端异常
- 分页格式：无

## 8. 装备库（gear，直接 action 调用）

以下接口存在于云函数 `miniApi`，但当前未在 `CLOUD_ACTION_MAP` 映射为 `/mini/*`，小程序侧主要在装备详情页直接 `callFunction` 使用。

### 8.1 CloudFunction miniApi action=gear.search

- 方法：CloudFunction
- 路径：wx.cloud.callFunction(name=miniApi, action=gear.search)
- 是否需要登录：否
- 请求参数：
  - `keyword: string`（必填，<=30）
  - `type: "reel"|"rod"|"lure"`（必填）
- 返回结构：
  - `data: any[]`（最多 100 条，按 `id asc`）
- 错误码：
  - `200` 成功
  - `400` 缺少关键词 / 关键词过长 / 无效的装备类型
- 分页格式：无（固定 limit=100）

### 8.2 CloudFunction miniApi action=gear.list

- 方法：CloudFunction
- 路径：wx.cloud.callFunction(name=miniApi, action=gear.list)
- 是否需要登录：否
- 请求参数：
  - `category?: string`（或 `type` 作为兼容字段）
- 返回结构：
  - `data: GearLite[]` 优先走 rate 表聚合后的精简列表；否则返回 `bz_gear_item` 的最多 1000 条
- 错误码：
  - `200` 成功
  - `500` 服务端异常
- 分页格式：无

### 8.3 CloudFunction miniApi action=gear.detail

- 方法：CloudFunction
- 路径：wx.cloud.callFunction(name=miniApi, action=gear.detail)
- 是否需要登录：否
- 请求参数：
  - `id: string|number`（必填）
  - `category?: string`（或 `type` 兼容字段）
- 返回结构：
  - `data: GearDetail`（若命中 rate 表，会包含 `variants` 等聚合字段）
- 错误码：
  - `200` 成功
  - `400` 缺少参数 id
  - `404` 装备不存在
- 分页格式：无

## 9. 其他云函数（非 miniApi）

### 9.1 CloudFunction login（获取 openid）

- 方法：CloudFunction
- 路径：wx.cloud.callFunction(name=login)
- 是否需要登录：否
- 请求参数：无
- 返回结构：
  - `result.openid: string`
  - `result.appid: string`
  - `result.unionid: string|null`
- 错误码：由云函数直接返回（无统一 envelope）

入口代码：[login/index.js](file:///d:/Xiaochengxu/Diaoyoushuo/cloudfunctions/login/index.js)

## 10. 待确认（代码里有调用，但未映射到 miniApi）

以下接口在小程序代码中出现调用，但：
- 未在 [api.js](file:///d:/Xiaochengxu/Diaoyoushuo/services/api.js) 的 `CLOUD_ACTION_MAP` 中映射到云函数
- 仓库内也未找到对应后端实现

请优先确认它们是否仍在使用或已废弃。

### 10.1 POST /mini/user/tasks/complete（待确认）

- 方法：POST
- 路径：/mini/user/tasks/complete
- 是否需要登录：未知（按语义应需要）
- 请求参数（来自前端调用推断）：
  - `taskId: string`
- 返回结构（来自前端使用推断）：
  - 可能包含：`code: number`、`userPoints?: number`
- 错误码：未知
- 分页格式：无

调用位置：[points.js](file:///d:/Xiaochengxu/Diaoyoushuo/pages/points/points.js#L280-L318)

### 10.2 GET /mini/search（待确认）

- 方法：GET
- 路径：/mini/search
- 是否需要登录：未知
- 请求参数（来自前端调用推断）：
  - `keyword: string`
  - `page: number`
  - `pageSize: number`
- 返回结构（来自前端使用推断）：
  - `list: any[]`
- 错误码：未知
- 分页格式：疑似 `page + pageSize`，返回 `list`

调用位置：[search.js](file:///d:/Xiaochengxu/Diaoyoushuo/pkgContent/search/search.js#L85-L118)

### 10.3 GET /mini/tag/points（待确认）

- 方法：GET
- 路径：/mini/tag/points
- 是否需要登录：未知
- 请求参数：未知
- 返回结构：未知
- 错误码：未知
- 分页格式：未知

声明位置：[api.js](file:///d:/Xiaochengxu/Diaoyoushuo/services/api.js#L1627-L1639)

### 10.4 POST /mini/tag/redeem（待确认）

- 方法：POST
- 路径：/mini/tag/redeem
- 是否需要登录：未知
- 请求参数（来自封装函数推断）：
  - `id: string`
- 返回结构：未知
- 错误码：未知
- 分页格式：无

声明位置：[api.js](file:///d:/Xiaochengxu/Diaoyoushuo/services/api.js#L1634-L1640)
