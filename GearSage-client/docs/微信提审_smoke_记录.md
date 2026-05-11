# 微信提审 smoke 记录

日期：2026-05-09  
阶段：P3-A 微信小程序提审 5 天收口期  
目标：确认审核员可打开、可理解、可测试、可确认 UGC 治理能力。

---

## 一、验证范围

本轮 smoke 分两层：

1. `remote` 当前已部署环境：验证微信提审可访问性与现有审核后台主链路。
2. 本地本轮新增代码：验证新增举报闭环 `/mini/report -> /admin/reports -> handle`。

说明：

- 本轮代码已在本地完成构建与 smoke。
- `remote` 环境尚未自动部署本地新增举报接口，因此 `remote` 记录只覆盖当前已部署能力。
- 部署后需按本文末尾“部署后补测项”补跑举报链路。

---

## 二、remote 环境 smoke

基础地址：

- `https://api.gearsage.club`
- `https://static.gearsage.club/gearsage`

### 2.1 服务可访问

| 检查项 | 结果 |
| --- | --- |
| `GET /health` | 通过，HTTP 200，`code=0` |
| `GET /health/db` | 通过，HTTP 200，数据库 `gearsage`，用户 `gearsage_app` |
| `HEAD /admin-console/` | 通过，HTTP 200，返回 `text/html` |

### 2.2 小程序公开浏览

| 检查项 | 结果 |
| --- | --- |
| `GET /mini/topic/all?limit=1` | 通过，返回公开帖子，首条 `status=2` |
| `GET /mini/gear/brands?type=reels` | 通过，返回 3 条品牌数据 |

结论：

- 游客可访问公开内容与装备库基础接口。
- 首页公开列表仍只返回已发布内容。

### 2.3 登录链路

| 检查项 | 结果 |
| --- | --- |
| `POST /auth/send-code` | 通过，当前 remote 返回测试模式验证码 |
| `POST /auth/login` | 通过，HTTP 201，`code=0`，返回 token |
| `GET /mini/topic/mine?status=1` | 通过，HTTP 200，`code=0` |

结论：

- remote 登录链路可用。
- 提审前如正式短信已可用，应确认 `SMS_TEST_MODE=false` 并补一次真实短信验证。

### 2.4 审核后台现有能力

| 检查项 | 结果 |
| --- | --- |
| `POST /admin/auth/login` | 通过 |
| `GET /admin/auth/me` | 通过 |
| `GET /admin/review/topics?status=pending&limit=3` | 通过，返回 3 条 |
| `GET /admin/review/comments?status=all&limit=3` | 通过，返回 3 条 |
| `GET /admin/users?status=all&limit=3` | 通过，返回 3 条 |
| `GET /admin/logs?limit=3` | 通过，返回 3 条 |
| `GET /admin/rules` | 通过，返回 1 条 |

结论：

- 当前 remote 已具备管理员登录、帖子审核、评论处理、用户管理、日志、规则查看能力。
- `/admin-console/` 可被审核员打开。

---

## 三、本地新增举报链路 smoke

本地地址：

- `http://127.0.0.1:3025`

本地验证结果：

| 检查项 | 结果 |
| --- | --- |
| 后端 `npm run build` | 通过 |
| 本地服务启动 | 通过，自动映射 `/mini/report` 与 `/admin/reports/*` |
| `POST /auth/send-code` | 通过，测试模式返回验证码 |
| `POST /auth/login` | 通过 |
| `POST /mini/report` | 通过，生成 `reportId=1` |
| `GET /admin/reports?status=pending&limit=5` | 通过，能看到待处理举报 |
| `POST /admin/reports/1/handle` | 通过，返回 `status=handled` |

结论：

- 举报帖子/评论/用户共用的后端治理链路已具备。
- 举报理由已接入 `report_reason` 文本审核并写入 `moderation_records`。
- 后台处理动作已写入 `admin_operation_logs`。

---

## 四、小程序手工回归路径

真机或开发者工具切 `remote` 后按以下路径回归：

1. 游客打开首页。
2. 进入装备库，浏览装备列表和详情。
3. 点击发布/评论/求推荐，确认弹出登录要求。
4. 登录后发求推荐，上传图片。
5. 发布后提示“已提交审核”。
6. 我的发布查看“待审核”。
7. 后台通过该帖子。
8. 首页可见该帖子。
9. 进入详情发表评论。
10. 举报帖子、举报评论、举报用户。
11. 后台进入“举报处理”查看并处理。

---

## 五、部署后补测项

本轮新增举报接口部署到 `remote` 后必须补测：

1. `POST /mini/report`：帖子举报、评论举报、用户举报。
2. `GET /admin/reports`：后台举报列表。
3. `POST /admin/reports/:id/handle`：标记处理。
4. `POST /admin/reports/:id/reject`：驳回无效举报。
5. `/admin-console/` 页面“举报处理”页可访问并能执行动作。

---

## 六、当前结论

当前 remote 基础链路与审核后台现有能力可访问；本轮新增举报闭环在本地已构建和 smoke 通过。部署后补跑举报链路即可进入正式提审前最后真机回归。

---

## 七、2026-05-09 首页装备工具化收口验证

本轮变更范围：

- `pages/index/index`
- `pages/gear-tab/index`
- `pages/profile/profile`
- `pkgContent/articlePage/articlePage`
- `app.json` tabBar

静态验证结果：

| 检查项 | 结果 |
| --- | --- |
| `app.json` / 首页 JSON / 装备库 tab JSON 解析 | 通过 |
| `node -c pages/index/index.js` | 通过 |
| `node -c pages/gear-tab/index.js` | 通过 |
| `node -c pages/profile/profile.js` | 通过 |
| `node -c pkgContent/articlePage/articlePage.js` | 通过 |
| tabBar 配置 | 通过，当前为“首页 / 装备库 / 我的” |
| tabBar 图标文件存在性 | 通过 |
| 首页与装备经验页旧文案扫描 | 通过，未检出“积分商城 / 文章合集 / 更多文章 / 论坛 / 社区 / 发帖 / type=reels / banner-carousel” |

微信开发者工具 CLI 预览：

- 已尝试执行 `cli preview --project /Users/tommy/GearSage/GearSage-client`
- 结果：未完成
- 原因：本机微信开发者工具服务端口未能在 CLI 流程中成功启动，返回 `wait IDE port timeout`

需真机 / 开发者工具补测：

1. 首页首屏显示 `GearSage`、`路亚装备资料库与经验交流`、搜索框、Hero 功能卡。
2. 首页无轮播 banner、无瀑布/传统排列切换、无积分商城、无更多入口。
3. 底部 tab 显示“首页 / 装备库 / 我的”。
4. 点击底部“装备库”，停留在 `pages/gear-tab/index`，可看到装备分类、搜索入口、装备对比入口、最近更新装备。
5. 首页搜索进入装备库 tab 并聚焦搜索，不默认进入 `type=reels`。
6. 首页“装备经验”入口和目标页标题均显示“装备经验”，不显示“文章 / 文章合集 / 更多文章”。
7. “我的”页可看到积分入口，点击进入积分页。

---

## 八、2026-05-09 发布与审核状态闭环收口验证

本轮变更范围：

- `pkgContent/publishMode/publishMode`

静态验收结果：

| 检查项 | 结果 |
| --- | --- |
| 首页悬浮发布三选项进入 `publishMode` | 已收口，`intent=recommend/experience/question` 会直接进入对应发布表单 |
| `intent=recommend` | 进入“讨论&提问”表单，并默认 `questionType=recommend` |
| `intent=experience` | 进入“长测评”发布表单 |
| `intent=question` | 进入“讨论&提问”表单，并默认 `questionType=ask` |
| 发布成功提示 | 已确认 `postPreview` 与 `publishMode` 兜底提交均为“已提交审核” |
| 发布后状态 | 后端按内容审核结果写入：`REVIEW` 或人工审核开关开启时为 `status=1`，`PASS` 且未强制人工审核时为 `status=2` |
| 导航栏右侧“更多” | 已移除 `custom-navbar` 默认“更多”，避免装备库 tab 等页面出现无明确用途的右上角入口 |
| 详情页标题文案 | 已将详情页导航标题从“帖子详情”收口为“装备交流详情”，同页可见状态文案不再使用“帖子” |
| 详情页分享按钮 | 已移除 `pkgContent/detail` 顶部导航栏右侧分享图标，并隐藏底部 `share-btn`，提审主路径不再暴露该入口 |
| 装备卡片进详情 | 已修复首页与装备库 tab 装备卡片详情跳转 `type`，统一传当前装备大类，避免详情页子型号与核心技术模块走错分支 |
| 装备库 tab 搜索 | 已收口为分类搜索入口，不再在 `pages/gear-tab/index` 内执行第二套搜索；关键词统一跳转到 `pkgGear/pages/list` 用既有列表搜索逻辑承接 |
| 发布类型收口 | `publishMode` 新发布入口仅展示“求推荐 / 装备经验 / 提问”；首页“最新求推荐与提问”默认 3 条，“装备经验精选”承接 UGC 内容，查看更多为页内展开/收起 |
| 积分页提审文案 | 已移除积分页底部操作区；任务标题/描述在后端返回与前端展示层均收口为“内容”语境，并隐藏邀请类任务；积分兑换页仅展示“虚拟权益” |
| 我的发布待审核 | 已确认 `getUserPosts(1)` 加载 `status=1`，前端显示“待审核” |
| 待审核公开展示 | 已确认公开列表 `GET /mini/topic/all` 仅返回 `status=2` |
| 待审核互动 | 已确认详情页与后端均限制非 `status=2` 内容评论、点赞、分享 |
| 驳回提示 | 已确认后台驳回回 `status=0`，写入 `rejectReason`，我的发布草稿页显示“未通过原因” |
| 下架提示 | 已确认后台下架写入 `topic_removed` 消息，内容从公开列表移除 |

需真机 / 开发者工具补测：

1. 从首页右下角发布入口分别选择“发起求推荐 / 发布装备经验 / 提一个装备问题”。
2. 确认三类入口均直接进入对应表单，填写、预览、提交不报错。
3. 开启 `MODERATION_TEXT_REVIEW_ENABLED=true` 的环境下提交一条内容，确认提示“已提交审核”。
4. 在“我的发布 -> 待审核”看到新内容。
5. 用另一账号确认首页公开列表不可见该待审核内容，详情不可评论、不可点赞。
6. 后台通过后，确认首页公开列表可见并可评论。
7. 后台驳回后，确认作者“我的发布 -> 草稿”显示“未通过”与驳回原因。
