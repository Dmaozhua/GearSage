# P3-A 内容审核与后台验收报告

验收时间：2026-05-11  
验收范围：腾讯云内容安全 API、`moderation_records`、审核后台 v0 处理闭环  
结论：通过，不阻断微信提审。

---

## 1. 测试环境

- 本地仓库：`/Users/tommy/GearSage`
- 后端服务：`GearSage-api`
- 临时 API：`http://127.0.0.1:3025`
- 数据库：PostgreSQL `gearsage`
- 数据库用户：`tommy`
- 当前日期 / 时区：2026-05-11，Asia/Shanghai
- 构建验证：`npm run build` 通过
- 启动命令：`PORT=3025 npm run start:prod`
- 内容审核配置：
  - `MODERATION_ENABLED=<set>`
  - `MODERATION_PROVIDER=<set>`
  - `MODERATION_TEXT_REVIEW_ENABLED=<set>`
  - `TENCENT_MODERATION_SECRET_ID=<set>`
  - `TENCENT_MODERATION_SECRET_KEY=<set>`

说明：报告不记录真实密钥值。

---

## 2. 测试账号

| 类型 | 账号 | 说明 |
| --- | --- | --- |
| 管理员 | `admin` | 本地默认管理员；密码取 `ADMIN_DEFAULT_PASSWORD`，未配置时为本地默认值 |
| 小程序用户 A | `19967820569` | 发帖、资料更新、规则命中测试 |
| 小程序用户 B | `19867820569` | 评论、举报、封禁 / 解封测试 |
| 图片审核用户 | `197...` | 图片上传三场景复测账号，用户 ID `7` |

---

## 3. 接口调用结果

| 验收项 | 接口 / 动作 | 结果 |
| --- | --- | --- |
| 健康检查 | `GET /health/db` | 通过，HTTP 200，数据库 `gearsage / tommy` |
| 管理员登录 | `POST /admin/auth/login` | 通过，HTTP 201，`code=0` |
| 管理员态确认 | `GET /admin/auth/me` | 通过，HTTP 200，`code=0` |
| 用户登录 | `POST /auth/send-code`、`POST /auth/login` | 通过，两个测试用户均可登录 |
| 昵称审核 | `POST /mini/user/update` | 通过，`user_nickname` 写入 `moderation_records` |
| 简介审核 | `POST /mini/user/update` | 通过，`user_bio` 写入 `moderation_records` |
| 发帖标题 / 正文审核 | `POST /mini/topic` | 通过，`topic_title/topic_content` 写入记录；正常发帖进入 `status=1` |
| 待审核公开隐藏 | `GET /mini/topic?topicId=14` | 通过，非作者返回 `code=404` |
| 待审核不可评论 | `PUT /mini/comment` | 通过，HTTP 403 |
| 待审核不可点赞 | `POST /mini/topic/like` | 通过，HTTP 403 |
| 待审核帖子列表 | `GET /admin/review/topics?status=pending` | 通过，后台可见待审核帖 |
| 帖子通过 | `POST /admin/review/topics/14/pass` | 通过，`status=2`，公开详情可见 |
| 帖子驳回 | `POST /admin/review/topics/15/reject` | 通过，退回 `status=0`，写入 `rejectReason`，作者草稿页可见“未通过” |
| 评论审核 | `PUT /mini/comment` | 通过，`comment_content` 写入记录 |
| 评论通过 | `POST /admin/review/comments/25/pass` | 通过，`status=2`、`isVisible=1` |
| 评论驳回 | `POST /admin/review/comments/24/reject` | 通过，`status=9`、`isVisible=0` |
| 评论下架 | `POST /admin/review/comments/26/remove` | 通过，`status=9`、`isVisible=0` |
| 举报理由审核 | `POST /mini/report` | 通过，`report_reason` 写入记录，生成 `user_reports.id=2` |
| 用户封禁 | `POST /admin/users/6/ban` | 通过，`status=9`，原 token 访问 `GET /auth/me` 返回 401 |
| 用户解封 | `POST /admin/users/6/unban` | 通过，`status=0` |
| 简单关键词规则 | `POST /admin/rules`、`DELETE /admin/rules/3` | 通过，命中规则的昵称更新被 HTTP 400 阻断，规则删除成功 |
| 发帖图片审核 | `POST /upload/image` | 通过，`topic_image` 命中 `tencent_image/pass` |
| 头像图片审核 | `POST /upload/avatar` | 通过，`avatar_image` 命中 `tencent_image/pass` |
| 背景图审核 | `POST /upload/background` | 通过，`background_image` 命中 `tencent_image/pass` |

备注：首次使用 1x1 PNG 做图片 smoke 时，腾讯云返回 `InvalidParameter.ImageSizeTooSmall`；改用项目内正常尺寸图片 `/Users/tommy/GearSage/GearSage-client/images/logo/2.png` 后三类图片审核均通过。该项属于测试样本不合规，不是接口或签名缺陷。

---

## 4. 数据库验证 SQL

```sql
-- 1. 确认 9 个审核场景均有腾讯云真实 pass 记录
SELECT DISTINCT ON (scene)
  id, scene, "targetType", "targetId", "contentType",
  provider, result, "riskLevel", "riskReason", "requestId",
  "userId", "createTime"
FROM moderation_records
WHERE scene IN (
  'comment_content',
  'topic_title',
  'topic_content',
  'user_nickname',
  'user_bio',
  'report_reason',
  'topic_image',
  'avatar_image',
  'background_image'
)
  AND result = 'pass'
  AND provider IN ('tencent_text', 'tencent_image')
ORDER BY scene, id DESC;

-- 2. 验证帖子审核状态流转
SELECT id, status, "isDelete", "rejectReason", "publishTime"
FROM bz_mini_topic
WHERE id IN (14, 15)
ORDER BY id;

-- 3. 验证评论通过 / 驳回 / 下架状态
SELECT id, status, "isVisible", "topicId"
FROM bz_topic_comment
WHERE id IN (24, 25, 26)
ORDER BY id;

-- 4. 验证图片资源审核落库
SELECT "bizType", status, "moderationStatus",
  "moderationProvider", "moderationRiskLevel"
FROM media_assets
WHERE "userId" = 7
ORDER BY id DESC
LIMIT 3;

-- 5. 验证后台操作日志
SELECT id, "adminUserId", "targetType", "targetId", action, remark, "createTime"
FROM admin_operation_logs
WHERE id >= 13
ORDER BY id ASC
LIMIT 12;
```

---

## 5. moderation_records 样例

| id | scene | targetType | targetId | contentType | provider | result | riskLevel | requestId |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 76 | `user_nickname` | `user` | `5` | `text` | `tencent_text` | `pass` | `Normal|score=0` | `4b2a6123-695a-4c97-bd2b-939e15e23283` |
| 77 | `user_bio` | `user` | `5` | `text` | `tencent_text` | `pass` | `Normal|score=0` | `c6b240c8-b3f0-4c06-8ddd-9aee98ca0532` |
| 80 | `comment_content` | `comment` | `24` | `text` | `tencent_text` | `pass` | `Normal|score=0` | `a43f4f01-f674-4c8a-b322-74b5bdb9c9d6` |
| 81 | `report_reason` | `report` | `2` | `text` | `tencent_text` | `pass` | `Normal|score=0` | `7b5c6bf3-b845-47a0-ad56-7bde5918d0d4` |
| 86 | `topic_title` | `topic` | `15` | `text` | `tencent_text` | `pass` | `Normal|score=0` | `d4bee4dc-22ab-4668-a329-7fe4f2d2228c` |
| 87 | `topic_content` | `topic` | `15` | `text` | `tencent_text` | `pass` | `Normal|score=0` | `36c3a4eb-eb8e-4960-a118-917309efa8e5` |
| 88 | `topic_image` | `media_asset` | `20` | `image` | `tencent_image` | `pass` | `Normal|score=0` | `7ac77554-0de1-4838-b1d9-1910c31c7a10` |
| 89 | `avatar_image` | `media_asset` | `21` | `image` | `tencent_image` | `pass` | `Normal|score=0` | `f48ff4d2-5a88-45c2-8b34-54c80fd77b05` |
| 90 | `background_image` | `media_asset` | `22` | `image` | `tencent_image` | `pass` | `Normal|score=0` | `d94eac4a-1bf2-4e77-85e4-bd92d2392d74` |

补充样例：关键词规则命中时，`moderation_records.id=82` 为 `scene=user_nickname`、`provider=local_rule`、`result=reject`、`riskLevel=local_rule_hit`。

---

## 6. admin_operation_logs 样例

| id | targetType | targetId | action | remark |
| --- | --- | --- | --- | --- |
| 13 | `topic` | `14` | `topic_pass` | `P3-A pass p3a-1778499676136` |
| 14 | `comment` | `25` | `comment_pass` | `P3-A comment pass p3a-1778499676136` |
| 15 | `comment` | `24` | `comment_reject` | `P3-A comment reject p3a-1778499676136` |
| 16 | `comment` | `26` | `comment_remove` | `P3-A comment remove p3a-1778499676136` |
| 17 | `user` | `6` | `user_ban` | `P3-A ban p3a-1778499676136` |
| 18 | `user` | `6` | `user_unban` | `P3-A unban p3a-1778499676136` |
| 19 | `moderation_rule` | `3` | `rule_create` | `P3-A rule p3a-1778499676136` |
| 20 | `moderation_rule` | `3` | `rule_delete` |  |
| 21 | `topic` | `15` | `topic_reject` | `未通过原因 p3a-1778499676136` |

---

## 7. 通过项

- 文本审核 6 个场景均已真实命中 `tencent_text` 并写入 `moderation_records`：
  - `comment_content`
  - `topic_title`
  - `topic_content`
  - `user_nickname`
  - `user_bio`
  - `report_reason`
- 图片审核 3 个场景均已真实命中 `tencent_image` 并写入 `moderation_records` 与 `media_assets`：
  - `topic_image`
  - `avatar_image`
  - `background_image`
- 正常发帖在当前本地配置下进入 `status=1` 待审核。
- 后台通过后帖子进入 `status=2`，并可被公开详情读取。
- 后台驳回后帖子退回 `status=0`，写入 `rejectReason`，作者草稿列表展示“未通过原因”。
- 待审核帖子不进入公开详情，对他人不可见。
- 待审核帖子不可评论、不可点赞。
- 评论通过 / 驳回 / 下架三类后台动作均可更新 `status/isVisible` 并写入日志。
- 用户封禁 / 解封闭环通过；封禁后小程序 JWT guard 会立即阻断。
- 简单关键词规则可新增、命中、删除；命中后会阻断文本提交并留痕。
- 审核后台 v0 已覆盖管理员登录、待审核帖子列表、帖子处理、评论处理、用户处理、日志、规则配置。

---

## 8. 失败项

无阻断失败项。

非阻断测试说明：

- 1x1 PNG 图片被腾讯云图片审核拒绝，原因是 `InvalidParameter.ImageSizeTooSmall`。
- 使用正常尺寸图片复测后，`topic_image / avatar_image / background_image` 均通过。
- 该问题不需要代码修复，但后续 smoke 用例应避免使用过小图片。

---

## 9. 是否阻断微信提审

不阻断。

当前 P3-A “内容审核 + 审核后台 v0”主线已具备：

- 腾讯云文本 / 图片审核真实调用能力
- 审核记录留痕
- 后台人工通过 / 驳回 / 下架处理
- 用户封禁 / 解封处理
- 关键词规则
- 审核日志
- 小程序侧待审核 / 驳回展示闭环

可作为微信提审资料中的“内容审核与平台治理能力”技术依据。

---

## 10. 下一步修复建议

1. 将图片 smoke 样本固定为正常尺寸图片，避免再次使用 1x1 PNG 造成误判。
2. 提审前保留本报告中的 SQL 样例和 RequestId，便于回答审核方关于留痕与追溯的问题。
3. 继续保持后台 v0 范围，不扩展 RBAC、大盘、批量工单或积分 / 装备库治理功能。
4. 若后续真实生产环境迁移，按同一 SQL 对生产库做只读验收，不在提审前改接口路径或返回结构。
