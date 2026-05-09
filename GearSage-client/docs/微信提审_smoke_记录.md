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
