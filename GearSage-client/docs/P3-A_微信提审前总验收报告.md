# P3-A 微信提审前总验收报告

验收日期：2026-05-12  
验收环境：remote 正式服 API + 审核后台；微信开发者工具 CLI 预览尝试  
结论：**阻断提审**。本轮不改功能、不改接口、不扩后台；仅做 remote smoke 与资料整理。

---

## 一、阅读依据

本轮按以下文档收口，不继续扩大 P3-A 内容审核或后台范围：

- `docs/P3-A_内容审核与后台验收报告.md`
  - 该报告结论为 P3-A 内容审核与审核后台 v0 已通过，本轮只引用其“内容审核 + 后台 v0 已具备技术依据”的结论，不继续扩审核功能。
- `docs/P3-A 微信审核准备任务单.md`
  - 当前第一优先组明确为恢复 `remote` 环境全链路 smoke、整理微信提审资料包；P3-A 不是继续做功能，而是形成最小合规包并尝试提审。
- `docs/内容审核接入方案.md`
  - 第一版约束为不改 `{ code, message, data }`，不改上传路径，审核嵌入 `user / topic / comment / upload` 主链路，并写入 `moderation_records`。
- `docs/审核后台 v0 方案.md`
  - 审核后台 v0 只覆盖管理员登录、帖子审核、评论审核、用户封禁/解封、举报处理、日志、简单规则，不做大后台或 RBAC。
- `docs/小程序页面切接口清单.md`
  - 当前首页、装备库 tab、装备详情、登录、发布、评论、上传、举报入口均已切到独立后台接口。
- `docs/正式短信接入最小改造面.md`
  - 鉴权主链保持 `send-code -> login -> me -> refresh -> logout`，路径与返回结构不变；remote 当前仍为测试验证码模式。

---

## 二、测试环境

| 项 | 值 |
| --- | --- |
| API 域名 | `https://api.gearsage.club` |
| 静态资源域名 | `https://static.gearsage.club/gearsage` |
| 数据库健康检查 | `gearsage / gearsage_app` |
| 审核后台地址 | `https://api.gearsage.club/admin-console/` |
| 小程序 AppID | `wxfcaffa2a2c398e9c` |
| 小程序基础库 | `3.14.2` |
| 小程序版本号 | 提审候选版本，尚未上传微信后台生成正式版本号；本次报告标记为 `P3-A-pre-submit-2026-05-12` |
| 微信开发者工具 | 已安装，进程版本显示 `2.01.2510280`；CLI preview 未完成 |

---

## 三、测试账号

| 类型 | 账号 |
| --- | --- |
| 小程序用户 A | `19967820569`，用户 ID `28` |
| 小程序用户 B | `19867820569`，用户 ID `29` |
| 验证码模式 | remote 当前 `SMS_TEST_MODE=true`，`send-code` 返回测试验证码 `123456` |
| 审核后台账号 | `admin` |
| 审核后台密码 | 不写入仓库文档；提审资料中应通过微信后台安全字段填写 |

---

## 四、通过项

| 验收项 | 结果 |
| --- | --- |
| `GET /health` | 通过，HTTP 200，`code=0` |
| `GET /health/db` | 通过，HTTP 200，数据库为 `gearsage`，用户为 `gearsage_app` |
| 审核后台静态页 | 通过，`HEAD /admin-console/` HTTP 200，`text/html` |
| 管理员登录 / `admin/auth/me` | 通过，账号 `admin` 可登录并读取管理员态 |
| 登录链路 | 通过，`send-code -> login -> auth/me -> refresh -> logout` 可用 |
| 首页 API | 通过，`GET /mini/topic/all?limit=3`、`GET /mini/gear/list?type=reels&page=1&pageSize=3` 可返回 |
| 装备库 tab API | 通过，`GET /mini/gear/brands?type=reels`、`GET /mini/gear/list` 可返回 |
| 装备详情 | 通过，使用列表首项 `DRE1000` 可读取 `GET /mini/gear/detail` |
| 上传发帖图片 | 通过，`POST /upload/image` 返回静态资源 URL，HEAD 200 |
| 上传头像 | 通过，`POST /upload/avatar` 返回静态资源 URL，HEAD 200 |
| 上传背景图 | 通过，`POST /upload/background` 返回静态资源 URL，HEAD 200 |
| 昵称 / 简介 / 头像 / 背景图更新 | 通过，`POST /mini/user/update` 成功保存 |
| 评论发布与后台下架 | 通过，评论 ID `34` 已发布，后台 `remove` 后 `status=9 / isVisible=0` |
| 后台驳回后不公开展示 | 通过，测试帖 ID `46` 驳回后 `status=0`，非作者详情返回 `code=404` |
| 举报入口 | 通过，测试举报 ID `1` 创建成功，后台详情可见 `report_reason` 审核记录，已驳回关闭 |
| 用户封禁 / 解封 | 通过，用户 B 封禁后 `auth/me` 返回 401，解封后状态恢复 `0` |
| `moderation_records` 留痕 | 通过可验证部分：帖子 `topic_title/topic_content`、评论 `comment_content`、举报 `report_reason` 均可在后台详情读取审核记录 |
| `admin_operation_logs` 留痕 | 通过，已验证 `topic_reject / comment_remove / report_reject / user_ban / user_unban` |

测试数据说明：

- 测试标记：`pre-submit-gate-1778588399716`
- 测试帖 ID `45` 曾被公开详情读取为 `status=2`，后为避免正式服公开污染，已后台下架清理为 `status=9 / isDelete=1`。
- 用户 B 已解封。

---

## 五、失败项

| 失败项 | 证据 | 影响 |
| --- | --- | --- |
| 发帖未进入待审核 | 用户 A 调用 `POST /mini/topic` 发起求推荐，返回 `status=2`，不是预期 `status=1` | 阻断。当前 remote 会让审核通过的 UGC 直接公开，无法满足本轮“发帖进入待审核 -> 后台通过后公开”的提审前总闸门口径 |
| 待审核帖不可评论 / 点赞未能完成当前轮验证 | 因新发帖没有进入 `status=1`，无法对新内容验证待审核互动边界 | 阻断项的派生未完成项；需修正 remote 审核开关后补测 |
| 后台通过后公开展示未能按真实待审核流验证 | 对测试帖 ID `45` 执行 `pass` 返回 `status=2` 且公开可见，但该帖执行前已经是 `status=2` | 只能证明后台 `pass` 接口可用，不能证明“待审核 -> 通过 -> 公开”的完整流 |
| 微信开发者工具 CLI 预览未完成 | 执行 `cli preview --project /Users/tommy/GearSage/GearSage-client` 后，工具提示服务端口关闭；确认开启后仍 `wait IDE port timeout` | 真机 / 开发者工具视角未完成，不应直接提审 |
| 用户资料 / 图片类 `moderation_records` 远端直读未完成 | 当前 admin v0 未暴露 `user` / `media_asset` 审核记录查询；本机 `.env` 指向本地 DB，不能直连 remote DB 验证 | 非单独阻断，但提审前应补一条只读 SQL 或后台只读证据；本轮已通过上传与资料更新 API、静态资源访问验证 |

---

## 六、是否阻断提审

**阻断。**

阻断原因不是代码编译或后台不可用，而是 remote 正式服当前状态不符合提审前总闸门口径：

1. 新发求推荐内容直接进入 `status=2` 公开展示。
2. 因没有进入 `status=1`，无法完成“待审核不可评论 / 不可点赞 / 后台通过后公开”的核心闭环验收。
3. 微信开发者工具 / 真机验收未完成。

---

## 七、微信后台审核说明草稿

GearSage 是一个面向路亚钓鱼用户的装备资料查询、参数对比与装备经验交流工具。用户可在游客状态浏览装备库、装备详情和公开内容；发布求推荐、装备经验、评论、举报等操作需要手机号验证码登录。

内容治理说明：

1. 用户昵称、简介、发帖标题、发帖正文、评论、举报理由接入文本审核。
2. 头像、背景图、发帖图片接入图片审核。
3. 审核记录写入 `moderation_records`，后台处理动作写入 `admin_operation_logs`。
4. 审核后台地址为 `https://api.gearsage.club/admin-console/`，可处理帖子通过/驳回/下架、评论下架、举报处理、用户封禁/解封。
5. 举报入口覆盖内容、评论、用户，举报理由会进入文本审核并进入后台处理列表。

审核员建议测试路径：

1. 打开小程序首页，浏览装备库和装备详情。
2. 使用测试手机号登录。
3. 发起一条求推荐并上传图片。
4. 确认发布后进入待审核，不对其他用户公开。
5. 使用审核后台通过该内容。
6. 回到小程序确认内容公开可见并可评论。
7. 举报内容或评论，在后台查看并处理举报。

后台账号：

- 账号：`admin`
- 密码：请在微信后台审核资料的安全字段中填写，不写入公开仓库文档。

---

## 八、下一步建议

当前**不建议上传代码并提交审核**。

建议先完成以下最小动作后再提交：

1. 在 remote 正式服确认发帖人工审核开关符合提审口径，使新发 UGC 进入 `status=1` 待审核。
2. 重启 / 部署后补跑：
   - 发起求推荐
   - 上传发帖图片
   - 发帖进入待审核
   - 非作者不可见
   - 待审核不可评论 / 点赞
   - 后台通过后公开
   - 后台驳回后不公开
3. 在微信开发者工具或真机中切到 remote 环境，手工确认首页、装备库 tab、装备详情、发布、上传、待审核、后台通过后公开展示。
4. 补一条 remote 只读证据，确认 `user_nickname / user_bio / avatar_image / background_image / topic_image` 在 `moderation_records` 或 `media_assets` 中有留痕。

以上补测通过后，再上传代码并提交微信审核。
