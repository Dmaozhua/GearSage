# 微信小程序服务端迁移到微信云开发（CloudBase）实施指南

> 本方案已经把你当前 `fxm-community` 模块中的小程序接口逻辑迁移为 **1 个云函数路由（miniApi）**，可直接在微信云开发环境部署。

## 1. 本次已完成的代码迁移范围

已把以下 Spring Boot REST 接口迁移到云函数 action：

- 用户：`/mini/user/*`
- 帖子：`/mini/topic/*`
- 评论：`/mini/comment/*`
- 任务成就：`/mini/taskFeat/*`
- 标签：`/mini/tag/*`
- 积分商品：`/mini/goods/*`

迁移后调用方式统一为：

```js
wx.cloud.callFunction({
  name: 'miniApi',
  data: { action: 'topic.all', payload: { title: '...' } }
})
```

---

## 2. 云开发资源准备

1. 打开微信开发者工具 -> 云开发 -> 开通环境（建议新建 `prod`、`test` 两个环境）。
2. 记录环境 ID（如：`cloud1-xxxx`）。
3. 小程序端初始化：
   ```js
   wx.cloud.init({ env: '你的环境ID', traceUser: true });
   ```

---

## 3. 数据库迁移（MySQL -> 云数据库）

## 3.1 需要创建的集合（collection）

在云数据库中创建：

- `bz_mini_user`
- `bz_mini_topic`
- `bz_topic_like`
- `bz_topic_comment`
- `bz_tag`
- `bz_user_tag`
- `bz_mini_task_feat`
- `bz_mini_task_feat_record`
- `bz_points_goods`

## 3.2 数据导入建议流程

1. 从 MySQL 导出 CSV（按表导出）。
2. 把主键 `id` 转换为云数据库 `_id`（推荐字符串，保持和旧 ID 一致）。
3. 所有外键字段改为引用 `_id`：例如 `topicId/userId/tagId/taskFeatId`。
4. 时间字段建议转为 ISO 字符串或毫秒时间戳。
5. 在云开发控制台批量导入 JSON/CSV。

> 强烈建议先导入基础表（用户/标签/任务配置），再导入业务表（帖子/评论/点赞/记录）。

---

## 4. 部署云函数

目录：`wechat-cloud/cloudfunctions/miniApi`

操作：

1. 在微信开发者工具中右键 `miniApi` -> “上传并部署：云端安装依赖”。
2. 云函数配置内存建议：`512MB`；超时建议：`20s`。
3. 首次部署后，在云函数测试中执行：
   ```json
   { "action": "user.login", "payload": { "nickName": "测试用户" } }
   ```

返回 `code = 200` 说明函数正常。

---

## 5. 小程序前端改造步骤

## 5.1 替换网络层

把你原先 `https://xxx/mini/...` 的请求，替换成 `wx.cloud.callFunction`。

可直接使用本次新增适配层：

- `wechat-cloud/miniprogram-adapter/api.js`

示例：

```js
import { miniTopicApi } from '@/wechat-cloud/miniprogram-adapter/api';

const list = await miniTopicApi.list({ title: '路亚' });
```

## 5.2 登录态改造

- 原服务端用 Sa-Token；
- 云开发下建议直接使用 `OPENID` 作为服务端身份来源（云函数里已实现）。

因此前端不再需要维护后端 token（如确需兼容可保留本地 token 字段，仅做 UI 标记）。

---

## 6. action 与旧接口映射表

- `user.login` -> `POST /mini/user/login`
- `user.info` -> `GET /mini/user/info`
- `user.update` -> `POST /mini/user/update`
- `user.points` -> `GET /mini/user/points`
- `topic.new` -> `PUT /mini/topic`
- `topic.update` -> `POST /mini/topic`
- `topic.delete` -> `DELETE /mini/topic`
- `topic.get` -> `GET /mini/topic`
- `topic.all` -> `GET /mini/topic/all`
- `topic.mine` -> `GET /mini/topic/mine`
- `topic.tmp` -> `GET /mini/topic/tmp`
- `topic.like` -> `POST /mini/topic/like`
- `comment.list` -> `GET /mini/comment`
- `comment.add` -> `PUT /mini/comment`
- `task.batchAdd` -> `PUT /mini/taskFeat`
- `task.list` -> `GET /mini/taskFeat`
- `task.receive` -> `POST /mini/taskFeat`
- `task.unfinish` -> `GET /mini/taskFeat/unfinish`
- `tag.batchAdd` -> `PUT /mini/tag/batch`
- `tag.usable` -> `GET /mini/tag/usable`
- `tag.used` -> `GET /mini/tag/used`
- `tag.changeUse` -> `POST /mini/tag/used`
- `goods.list` -> `GET /mini/goods`
- `goods.redeem` -> `POST /mini/goods`

---

## 7. 上线前核对清单（非常关键）

1. 云数据库权限规则已配置（禁止前端直写核心表，仅云函数可写）。
2. 所有集合建立必要索引：
   - `bz_mini_user.openId`
   - `bz_mini_topic.userId/status/isDelete`
   - `bz_topic_like.topicId/userId`
   - `bz_topic_comment.topicId/replayCommentId`
   - `bz_mini_task_feat_record.userId/taskFeatId/createTime`
3. 压测 `topic.all`、`topic.get`、`goods.redeem`。
4. 商品兑换流程需要开启事务（生产建议升级为 `runTransaction` 版本，避免并发超卖）。
5. 配置云监控告警（错误数、耗时、调用量）。

---

## 8. 迁移策略建议（最稳）

- 第 1 周：双轨运行（线上 Java 服务 + 云函数灰度）；
- 第 2 周：10% 用户切云函数；
- 第 3 周：50% 用户切云函数；
- 第 4 周：全量切换并下线旧公网接口。

---

## 9. 你接下来要做的两件事

1. 按本指南先在测试环境导入一份小数据并部署 `miniApi`；
2. 把小程序请求层替换为 `miniprogram-adapter/api.js`，先验证登录、发帖、点赞、评论、兑换商品闭环。

如果你愿意，我下一步可以继续给你：

- 一份 **可直接粘贴到云开发控制台的数据库权限规则**；
- 一份 **goods.redeem 的事务版实现**（防超卖，适合正式环境）。
