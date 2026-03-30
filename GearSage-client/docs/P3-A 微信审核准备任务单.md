# P3-A 微信审核准备任务单

版本：v1.0  
状态：当前执行版  
适用对象：Tommy / Codex / 后端 / 前端 / 合规准备

---

## 一、阶段定义

P3 不再作为一个大而宽的阶段整体推进，而是拆成两个子阶段：

- **P3-A：微信审核准备**
- **P3-B：产品深化**

当前立即执行的是：

> **P3-A：微信审核准备**

原因：
- 当前最大的上线不确定性，不在产品功能，而在主体、备案、安全评估、审核能力、短信与后台。
- 这些事项已经变成“微信审核前置条件”，不能再后置。

---

## 二、P3-A 总目标

在不暂停项目的前提下，先把 GearSage 需要提交微信审核的“最小合规包”准备出来，并完成一次正式审核尝试。

P3-A 的完成标准不是“微信一定通过”，而是：

1. 具备提交审核的最小合规条件
2. 能解释内容生产、内容审核、用户治理和风险控制
3. 审核失败后也能无缝切到下一分支，而不是推倒重来

---

## 三、P3-A 执行原则

### 原则 1：先做最小合规包，不追求大而全
先把“能提审”做出来，而不是先把后台和运营系统做成完整平台。

### 原则 2：技术与制度同时准备
不能只接接口，不写制度；也不能只写文档，不做技术闭环。

### 原则 3：继续本地推进，不依赖外网联调
当前外网联调已暂停，P3-A 继续以本地环境为主。

### 原则 4：不停止产品推进，但产品深化让位于审核前置事项
任务/商城/装备库继续保持小步推进，但不抢占审核准备主线。

---

## 四、P3-A 任务分组

## A 组：主体与备案

### A1 个体工商户主体
目标：
- 个体户申请通过
- 明确最终小程序主体为个体户

输出物：
- 个体户主体信息
- 营业执照
- 法人/经营者信息
- 小程序主体一致性说明

状态：
- 进行中 / 等待审批
- 2026-03-28 已新增《个体户主体与营业执照材料清单》

优先级：
- 最高

---

### A2 域名与备案策略
目标：
- 明确正式环境是否继续放中国内地
- 如果是，则启动 ICP 备案
- 若备案未完成，则暂停以正式内地域名做微信公网联调

输出物：
- 备案材料清单
- 域名归属与主体对应关系
- 正式环境域名策略说明

状态：
- 待执行
- 2026-03-28 已新增《腾讯云备案准备清单》

优先级：
- 最高

说明：
如果正式环境继续用中国内地服务器，这件事必须前置。

---

## B 组：合规资料包

### B1 隐私政策
目标：
- 形成可公开展示、可提审的隐私政策

至少覆盖：
- 收集哪些信息
- 为什么收集
- 如何使用
- 如何保存
- 如何删除
- 联系方式

输出物：
- 隐私政策最终文案

优先级：
- 最高

---

### B2 用户协议
目标：
- 形成平台规则与用户责任说明

至少覆盖：
- 账号使用规则
- 发帖/评论规则
- 禁止内容
- 违规处理
- 平台免责边界

输出物：
- 用户协议最终文案

优先级：
- 最高

---

### B3 账号注销说明
目标：
- 形成用户可理解、可执行的账号注销与数据删除说明

输出物：
- 注销说明文案
- 产品内注销入口设计稿（最低可说明）

优先级：
- 高

---

### B4 联系方式 / 举报入口
目标：
- 明确平台联系方式、举报路径、申诉方式

输出物：
- 联系邮箱/微信/手机号等
- 举报入口设计
- 申诉说明

优先级：
- 高

---

## C 组：安全评估准备包

### C1 平台治理制度
目标：
- 写出最小可提交的治理制度说明

至少覆盖：
- 内容审核制度
- 用户投诉举报受理机制
- 风险处置机制
- 审核记录留存说明
- 信息安全责任人说明

输出物：
- 安全评估准备文档第一版

优先级：
- 最高

---

### C2 内容与账号处置流程
目标：
- 明确“发现违规内容后怎么处理”

至少覆盖：
- 待审核
- 通过
- 驳回
- 删除/下架
- 举报处理
- 用户封禁 / 解封
- 审核备注与日志

输出物：
- 状态流转图
- 处置流程说明

优先级：
- 高

---

### C3 用户身份与记录留存说明
目标：
- 能清楚回答“你怎么识别用户、如何留痕、如何追溯”

输出物：
- 用户账号机制说明
- 日志留存说明
- 审核记录说明

优先级：
- 高

---

## D 组：审核能力技术接入

### D1 文本审核第一版
建议：
- 第一版接入腾讯云内容安全

目标：
- 对发帖、评论、昵称、个人资料等文本做审核

输出物：
- 技术接入方案
- 字段接入清单
- 命中后的状态流转说明

优先级：
- 最高

当前进度：
- 2026-03-27 已输出《内容审核接入方案》v2.0
- 当前已明确：
  - 腾讯云内容安全为第一版主供应商
  - 审核能力直接嵌入 `user / topic / comment / upload` 现有链路
  - 不改动当前 `{ code, message, data }` 返回结构
  - 不改动当前上传路径口径
- 2026-03-27 第一轮代码实施已完成：
  - 已新增 `moderation` 服务与腾讯云 provider 封装
  - 已完成 `topic / comment / user / upload` 四条接入点
  - 已补 `moderation_records / moderation_rules` 及审核字段
- 2026-03-28 第一轮本地联调已通过：
  - `/health/db` 已确认连接本地 `gearsage / tommy`
  - `moderation_rules` 本地关键词规则生效
  - 正常评论可通过并写入 `bz_topic_comment`
  - 命中违禁词评论返回 `403 Forbidden`
  - `moderation_records` 已成功记录 `pass / reject`
  - 当前腾讯云真实审核尚未验证，原因是未配置真实密钥
- 2026-03-30 已接入腾讯云内容安全真实 Biztype 映射：
  - 控制台应用：
    - `appName=gearsage`
    - `appId=2038611796071288832`
  - 文本审核固定映射：
    - `comment_content -> comment_content`
    - `topic_title / topic_content -> topic_publish`
    - `user_nickname -> nickname_input`
    - `user_bio -> user_bio`
  - 图片审核固定映射：
    - `topic_image -> topic_image`
    - `avatar_image -> avatar_image`
    - `background_image -> background_image`
  - 当前口径：
    - 继续沿用现有 `moderation.service / moderation.tencent.service`
    - 先打通真实文本审核
    - 图片审核已接入同一 provider，待真实密钥补齐后一起联调
    - 环境变量仅依赖：
      - `TENCENT_MODERATION_SECRET_ID`
      - `TENCENT_MODERATION_SECRET_KEY`
- 2026-03-30 已修复腾讯云 API v3 签名头格式错误：
  - 用户本地真实联调已定位：
    - `provider = tencent_text`
    - `result = review`
    - `riskLevel = provider_error`
    - `riskReason = AuthFailure.InvalidAuthorization: SignatureMethod should be TC3-HMAC-SHA256`
  - 根因确认：
    - `src/modules/moderation/moderation.tencent.service.ts` 的 `Authorization` 头格式不符合腾讯云 API v3 标准
    - 旧实现为错误的逗号拼接格式
  - 已完成调整：
    - 改为标准 TC3 v3 头签名格式：
      - `TC3-HMAC-SHA256 Credential=..., SignedHeaders=..., Signature=...`
    - 继续沿用现有 provider，不引入腾讯云官方 SDK
  - 当前口径：
    - 先继续复测真实文本审核
    - 文本打通后再补图片真实联调
- 2026-03-31 腾讯云真实文本审核第一轮已打通：
  - 最新 `moderation_records` 已确认：
    - `provider = tencent_text`
    - `result = pass`
    - `riskLevel = Normal|score=0`
    - `requestId = a609b17d-dc5f-46ad-8767-c34e98ff439f`
  - 当前确认通过场景：
    - `comment_content`
  - 2026-03-31 同轮本地继续验证通过：
    - `topic_publish`
      - `topic_title` 与 `topic_content` 均已写入 `moderation_records`
      - `provider = tencent_text`
      - `result = pass`
      - `targetType = topic`
      - `targetId = 2`
      - 业务表 `bz_mini_topic.id=2` 已写入且 `status = 1`
      - `GET /mini/topic/mine?status=1` 可看到该帖，前端“待审核”表现与审核记录一致
    - `nickname_input`
      - `scene = user_nickname`
      - `provider = tencent_text`
      - `result = pass`
      - `targetType = user`
      - `targetId = 2`
      - 业务表 `bz_mini_user.nickName` 已更新
      - `GET /auth/me` 返回昵称与数据库一致
    - `user_bio`
      - `scene = user_bio`
      - `provider = tencent_text`
      - `result = pass`
      - `targetType = user`
      - `targetId = 2`
      - 业务表 `bz_mini_user.bio` 已更新为最新值
      - `GET /auth/me` 返回简介与数据库一致
- 2026-03-28 已补本地发帖待审核开关：
  - `MODERATION_TEXT_REVIEW_ENABLED=true` 时，发帖 `PASS` 结果也进入 `status=1`
  - 当前本地 `.env.local` 已启用该开关
  - 小程序发布成功提示已调整为“已提交审核”
  - “我的发布”已恢复 `待审核` 页签用于查看 `status=1` 内容
- 2026-03-28 审核后台 v0 已补“恢复显示”入口：
  - 已新增 `POST /admin/review/topics/:id/restore`
  - “已驳回/下架”列表中的帖子可执行“恢复显示”
  - 恢复后帖子回到 `status=2 + isDelete=0`
  - 后台日志会新增 `topic_restore`

---

### D2 图片审核第一版
建议：
- 第一版接入腾讯云内容安全

目标：
- 对头像、背景图、帖子图片做审核

输出物：
- 图片审核方案
- 上传前 / 上传后审核策略
- 违规图片处理逻辑

优先级：
- 最高

当前进度：
- 已并入 D1 第一轮代码实施
- 当前图片审核已接入 `upload.service.ts`
- 当前口径：
  - `PASS` 正常返回上传结果
  - `REJECT / REVIEW` 第一轮统一阻断上传
- 2026-03-31 腾讯云真实图片审核第一轮已打通：
  - `topic_image`
    - `POST /upload/image` 已返回成功与本地 URL
    - `moderation_records.scene = topic_image`
    - `provider = tencent_image`
    - `result = pass`
    - `requestId` 已落库
    - `media_assets.bizType = topic` 对应记录已写入，`moderationStatus = pass`
  - `avatar_image`
    - `POST /upload/avatar` 已返回成功与本地 URL
    - `moderation_records.scene = avatar_image`
    - `provider = tencent_image`
    - `result = pass`
    - `requestId` 已落库
    - `media_assets.bizType = avatar` 对应记录已写入，`moderationStatus = pass`
  - `background_image`
    - `POST /upload/background` 已返回成功与本地 URL
    - `moderation_records.scene = background_image`
    - `provider = tencent_image`
    - `result = pass`
    - `requestId` 已落库
    - `media_assets.bizType = background` 对应记录已写入，`moderationStatus = pass`
  - 当前结论：
    - 3 个图片场景均已真实命中腾讯云 provider
    - `moderation_records`、`media_assets`、上传接口返回三层数据已对齐
  - 当前阶段结论：
    - 腾讯云真实内容审核第一轮本地验证已完成
    - 已验证通过的 7 个场景：
      - `comment_content`
      - `topic_publish`
      - `nickname_input`
      - `user_bio`
      - `topic_image`
      - `avatar_image`
      - `background_image`
    - 当前确认：
      - `moderation_records` 已有真实 `tencent_text / tencent_image` 留痕
      - 业务表状态与审核结果一致
      - `media_assets` 审核字段与上传结果一致
      - 前端表现与数据库状态一致
    - 本项可视为 P3-A 中“真实内容审核能力”第一轮完成
    - 后续不再重复扩大同类验证轮次

---

### D3 审核命中策略
目标：
- 明确接口命中后，产品怎么表现

至少要有：
- 阻断
- 待人工审核
- 允许通过
- 提示文案

输出物：
- 审核状态机说明
- 前后端交互口径

优先级：
- 高

当前进度：
- 第一轮已按当前方案落地基础状态机：
  - 用户昵称 / 简介：`PASS` 保存，`REJECT/REVIEW` 阻断
  - 评论：`PASS` 直接展示，`REVIEW` 入库但不展示，`REJECT` 阻断
  - 帖子发布：`PASS -> status=2`，`REVIEW -> status=1`，`REJECT` 阻断
  - 上传图片：`PASS` 返回，`REJECT/REVIEW` 阻断

---

## E 组：审核后台 v0

### E1 管理员登录
目标：
- 后台可登录

### E2 帖子审核列表
目标：
- 查看待审核帖子
- 通过 / 驳回 / 删除

### E3 评论审核列表
目标：
- 查看评论
- 删除 / 恢复 / 标记

### E4 用户处理
目标：
- 封禁
- 解封

### E5 审核备注与日志
目标：
- 记录谁在什么时间做了什么处理

### E6 简单违禁词配置
目标：
- 有一套最低可用黑名单词

输出物：
- 审核后台 v0 功能清单
- 最小页面流
- 后台接口清单

优先级：
- 最高

说明：
审核后台 v0 是 P3-A 的关键项，不能后置。

当前进度：
- 2026-03-27 已输出《审核后台 v0 方案》v2.0
- 当前已明确：
  - 审核后台后端继续放在 `GearSage-api`
  - 第一版走最小治理后台，不新开大而全平台
  - 以 `admin_users / admin_operation_logs / moderation_rules` 为最小数据底座
- 2026-03-28 第一轮代码实施已完成：
  - 已新增 `src/modules/admin/*` 最小治理接口
  - 已新增：
    - `POST /admin/auth/login`
    - `POST /admin/auth/logout`
    - `GET /admin/auth/me`
    - `GET /admin/review/topics`
    - `GET /admin/review/topics/:id`
    - `POST /admin/review/topics/:id/pass|reject|remove`
    - `GET /admin/review/comments`
    - `GET /admin/review/comments/:id`
    - `POST /admin/review/comments/:id/pass|reject|remove`
    - `GET /admin/users`
    - `GET /admin/users/:id`
    - `POST /admin/users/:id/ban|unban`
    - `GET /admin/logs`
    - `GET /admin/rules`
    - `POST /admin/rules`
    - `DELETE /admin/rules/:id`
  - 已补：
    - `admin_users`
    - `admin_operation_logs`
    - `ADMIN_JWT_SECRET / ADMIN_DEFAULT_USERNAME / ADMIN_DEFAULT_PASSWORD`
  - 已同步打通：
    - 用户封禁后立即在小程序 JWT guard 生效
    - 评论 / 帖子新建审核记录会回写真实 `targetId`
- 2026-03-28 第一轮本地 smoke 已通过：
  - 管理员默认账号登录正常
  - `/admin/auth/me` 正常
  - 帖子审核列表、评论审核列表、用户列表、日志列表、规则列表可正常返回
  - 规则新增、帖子通过、用户封禁/解封、日志留痕均已验证
  - 本地 smoke 产生的测试黑名单词已删除，测试用户状态已恢复；操作日志保留作为留痕
- 2026-03-28 最小前端 / 页面层第一轮已完成：
  - 未新开独立后台前端仓库
  - 已在 `GearSage-api/admin-ui` 落地极简静态单页
  - 当前入口：
    - `/admin-console/`
  - 当前已具备最小页面：
    - 登录页
    - 待审核帖子列表
    - 评论审核列表
    - 用户管理页
    - 日志页
    - 规则页
  - 页面层当前口径：
    - 直接消费现有 `/admin/*` 接口
    - 不引入大而全中后台框架
    - 继续沿用 `{ code, message, data }`
  - 本地静态页 smoke 已通过：
    - `http://127.0.0.1:3015/admin-console/` 可正常返回 HTML
    - `/admin-console/app.js`、`/admin-console/styles.css` 可正常访问

---

## F 组：正式短信接入

### F1 测试验证码模式退出
目标：
- 从固定验证码切到真实短信验证码

建议：
- 第一版使用腾讯云短信

### F2 风控基础
目标：
- 至少具备手机号、验证码发送频率限制

输出物：
- 短信接入方案
- 发送频率限制规则
- 登录失败提示策略

优先级：
- 最高

当前进度：
- 2026-03-27 已输出《正式短信接入最小改造面》
- 当前已明确：
  - 正式短信第一版使用腾讯云短信
  - 最小改造只集中在 `send-code` / `login`
  - `refresh / logout / me` 不推翻
- 2026-03-28 正式短信接入第一轮代码实施已完成：
  - 后端已新增：
    - `auth_sms_codes` 表
    - `src/modules/auth/sms.service.ts`
    - `src/modules/auth/sms.tencent.service.ts`
  - `AuthService.sendCode()` 已从固定返回测试码切到：
    - 数据库验证码记录
    - 最小控频
    - `SMS_TEST_MODE` 测试模式
    - 腾讯云短信 provider 骨架
  - `AuthService.login()` 已从固定 `123456` 校验切到：
    - 校验 `auth_sms_codes`
    - 命中后标记验证码为 `used`
  - 当前口径：
    - 本地默认仍可通过 `SMS_TEST_MODE=true` 联调
    - `send-code / login / me / refresh / logout` 路径与 `{ code, message, data }` 结构保持不变
- 2026-03-28 正式短信第一轮本地联调已通过：
  - 使用临时本地实例 `3016` 验证了：
    - `POST /auth/send-code` 可写入 `auth_sms_codes`
    - `POST /auth/login` 可校验验证码并签发 token
    - `GET /auth/me` 可在新 token 下正常返回用户信息
    - 60 秒发送间隔控频生效
    - 验证码成功登录后会标记为 `used`
  - 当前结论：
    - 正式短信第一轮的“测试模式 + 数据库存储 + 登录校验 + 最小控频”链路已打通
    - 你本地常驻 `3001` 若仍跑旧进程，需重启后再切回正式联调
- 2026-03-28 已新增《真实短信资质与签名模板准备清单》：
  - 当前不继续扩大短信代码改造面
  - 后续真实短信推进以前置资质、签名、模板准备为主

---

## G 组：审核资料与提审准备

### G1 小程序审核资料包
目标：
- 形成一份可提交审核的材料集合

包括：
- 产品简介
- 功能说明
- 审核说明
- 测试账号
- 审核后台说明
- 内容审核说明
- 举报与处理说明

当前进度：
- 2026-03-28 已新增《微信审核资料包清单》
- 当前口径：
  - 先整理最小可提交资料包
  - 与当前已完成功能、审核后台、内容审核真实状态保持一致

优先级：
- 高

---

### G2 微信审核尝试
目标：
- 在最小合规包就绪后，正式提审一次

输出物：
- 审核提交记录
- 驳回 / 通过结果
- 驳回原因归档
- 下一步分支判断

优先级：
- 高

---

## 五、P3-A 的当前执行顺序

### 第一优先组（立刻开始）
1. 个体户主体
2. ICP 备案策略与材料
3. 隐私政策 / 用户协议 / 注销说明
4. 安全评估准备包
5. 内容审核第一版接入
6. 审核后台 v0
7. 正式短信接入

### 第二优先组（紧接着）
8. 审核资料包整理
9. 微信审核尝试一次

### 第三优先组（根据结果分支）
10. 如果通过：继续小程序
11. 如果不通过：进入 FinClip 路线

---

## 六、P3-A 期间不作为第一优先级的事项

以下事项继续保留，但不抢主线：

- 商标结果等待
- Logo 终稿
- Android Studio / Xcode 深学
- Android / iOS 商店正式上架细节
- 大规模装备数据扩张
- 任务/商城更深层产品打磨
- 大而全后台

说明：
这些事情都重要，但现在最先决定“微信这条路还能不能继续”的，不是它们。

---

## 七、Codex 执行边界

Codex 当前在 P3-A 内最适合接手：

1. 腾讯云内容安全接入方案与代码
2. 审核后台 v0 的最小接口与页面骨架
3. 审核状态机梳理
4. 正式短信接入代码准备
5. 小程序页面内举报/审核状态显示所需接口改造
6. 文档回写与资料整理辅助

Codex 当前不应优先推进：

- 外网联调
- 海外环境迁移
- 前端壳重写
- 原生 / Flutter 重做
- 大规模数据采集系统

---

## 八、P3-A 完成标准

满足以下条件，P3-A 视为完成：

- 个体户主体明确
- 备案路径明确并已启动或完成
- 隐私政策 / 用户协议 / 注销说明完成
- 安全评估准备包第一版完成
- 文本 / 图片审核第一版可跑通
- 审核后台 v0 可用
- 正式短信验证码可用
- 微信审核资料包可提交
- 已正式尝试一次微信审核

---

## 九、P3-A 之后怎么走

### 如果微信审核通过
进入：
- 小程序正式上线准备
- P3-B 产品深化继续推进

### 如果微信审核不通过
进入：
- FinClip 路线
- 继续复用当前小程序前端与独立后台
- 不推翻现有系统

---

## 十、当前一句话结论

P3-A 不是继续做功能，而是：

> **把微信审核所需的最小合规包做出来，并完成一次正式审核尝试。**

---

## 十一、最新实施记录

- 2026-03-28 内容审核第一轮本地联调已通过：
  - 本地 API 已确认连接 `gearsage / tommy`
  - `moderation_rules` 本地关键词规则生效
  - 正常评论可通过并写入 `bz_topic_comment`
  - 命中违禁词评论返回 `403 Forbidden`
  - `moderation_records` 已成功记录 `pass / reject`
- 2026-03-28 审核后台 v0 第一轮后端实施已完成：
  - 管理员登录、帖子审核、评论管理、用户封禁/解封、审核日志、黑名单词配置已落地
  - `npm run build` 已通过
  - 临时本地 `3014` smoke 已通过
- 2026-03-28 审核后台 v0 最小前端/页面层已完成：
  - `/admin-console/` 可本地访问
  - 已落地登录页、待审核帖子、评论审核、用户管理、日志页、规则页
 - 2026-03-28 审核后台 v0 第一轮易用性修正已完成：
  - 已通过帖子列表不再显示“通过”按钮
  - `已驳回/下架` 筛选已可检索到管理员下架的帖子
  - 帖子详情抽屉已支持预览用户上传图片
- 2026-03-28 已修复待审核帖子仍可评论的问题：
  - 当前口径：仅 `status=2` 的已发布帖子允许评论
  - 后端评论接口已增加帖子状态硬校验
  - 详情页已关闭待审核帖评论入口，并显示“帖子正在审核中，暂不支持评论”
- 2026-03-28 已补齐待审核帖互动边界：
  - 当前口径：`status=1` 待审核帖子不可评论、不可点赞、不可分享
  - 后端已增加待审核帖点赞拦截
  - 详情页已同步关闭点赞与分享入口，并隐藏分享菜单
- 2026-03-28 已优化封禁账号登录提示：
  - 客户端登录页已将 `user banned` 映射为“账号已被禁用”
  - 不改动当前后端返回结构 `{ code, message, data }`
- 2026-03-28 已修复待审核帖图片展示误判问题：
  - 结论：`download-guard` 发黑不是设计要求，而是详情页在待审核帖上错误启用了已发布内容的保护展示
  - 详情页鱼获轮播已调整为：
    - 仅 `status=2` 已发布帖子显示“禁止下载”水印与保护层
    - `status=1` 待审核帖子按正常图片查看体验展示
  - `product-swiper` 已补图片加载失败占位，避免用户误以为上传失败
  - 鱼获详情轮播点击预览事件已修正，可直接预览用户自己上传的图片
- 2026-03-28 已修复本地环境上传图片返回外网静态域名的问题：
  - 根因：本地 `.env.local` 未显式覆盖 `UPLOAD_BASE_URL`，导致启动时继续继承 `.env` 中的 `https://static.gearsage.club/gearsage`
  - 当前本地环境已显式固定：
    - `UPLOAD_BASE_URL=http://127.0.0.1:3001/uploads`
  - 客户端 `tempUrlManager` 已补本地模式兼容：
    - 对历史 `https://static.gearsage.club/gearsage/*` 图片，自动映射为本地 `/uploads/*` 下载显示
  - 当前口径：
    - 本地联调上传与显示统一走本机资源
    - 不再把“外网静态域名不可达”误判为上传失败
- 2026-03-28 已修复审核后台帖子图片预览空链接问题：
  - 后端 `admin-review` 详情接口已统一归一帖子图片列表
  - 当前会同时兼容：
    - `images` 字符串数组
    - `extra.contentImages`
    - `extra.coverImg`
    - `extra.verifyImage`
    - 对象结构中的 `url/src/fileID/fileId/path/tempFileURL`
  - 审核后台前端抽屉也已增加二次兜底解析，点击“查看原图”不应再跳转空地址
- 2026-03-28 已优化审核拒绝场景的客户端提示与登录态处理：
  - `services/api.js` 已区分审核型 `403` 与鉴权型 `401/403`
  - 评论命中审核规则后不再被误踢下线
  - 帖子发布、评论发布、资料编辑已统一提示“内容不符合社区规范，请修改后重试”
  - `edit-profile` 已补页面内失败捕获，不再在业务提示后额外弹一次“系统异常”
- 2026-03-28 消息系统 v0 第一轮实施已完成：
  - 后端已新增：
    - `GET /mini/message`
    - `POST /mini/message/read`
    - `POST /mini/message/read-all`
  - 已新增 `user_messages` 表，支持最小消息中心留痕
  - 当前消息类型已接入：
    - `topic_approved`
    - `topic_rejected`
    - `topic_removed`
    - `topic_restored`
    - `comment_received`
    - `like_received`
  - `pages/profile` 已新增“消息中心”入口与未读数
  - `pkgContent/message-center` 已落地最小消息页，可查看、标记已读、全部已读、跳转详情
- 2026-03-28 驳回回草稿第一轮实施已完成：
  - 审核后台驳回帖子动作已从“直接下架”改为“回草稿”
  - 当前口径：
    - 审核驳回 -> `status=0`
    - 管理员下架 -> `status=9 + isDelete=1`
    - 恢复显示 -> `status=2 + isDelete=0`
  - `bz_mini_topic` 已新增 `rejectReason`
  - 审核后台驳回时会写入 `rejectReason`
  - 被驳回帖子会进入用户草稿链路：
    - “我的发布”草稿列表可见驳回原因
    - 可按 `draftId` 重新进入编辑页
    - 打开被驳回草稿时会弹窗提示未通过原因
- 2026-03-28 已收口待审核帖删除入口：
  - 当前第一版不处理“审核中用户主动删除”的状态竞争
  - `my-publish` 中 `待审核` 页签已隐藏删除按钮
  - 当前口径：
    - 草稿可删除
    - 待审核仅查看，不提供删除入口
    - 后续如需支持，单独按审核链路设计
- 2026-03-28 已启动草稿编辑链统一第一轮收口：
  - 用户反馈确认：当前驳回回草稿后，点击草稿仍会落回旧 `publish` 页面，导致：
    - `讨论&提问` 草稿会误落成类似旧版“长测评”UI
    - 不同发布模式字段在草稿编辑时发生串字段
    - 发布过程中左上返回没有统一的“是否保存草稿”承接
  - 当前第一轮已完成：
    - 草稿 / 驳回消息 / profile 草稿入口 已统一切回 `publishMode`
    - `publishMode` 已支持 `draftId` 加载现有草稿
    - `publishMode` 已按 `topicCategory` 反推 5 种发布模式
    - 驳回草稿打开时会直接进入对应模式的编辑器，并弹出未通过原因
    - `publishMode` 左上返回已改为离开发布页，并在有改动时提示“是否保存草稿”
    - 当前草稿保存与重新编辑，已开始与新发帖共用同一套 UI
  - 当前仍保留为后续收口项：
    - 各 `post-*` 组件的 `initialData` 细字段回填仍需逐模式补齐回归
    - 系统级返回手势/关闭页面时的保存提示仍需继续验证
- 2026-03-28 已清理 `profile` 老草稿入口并调整个人中心菜单顺序：
  - `pages/profile/profile.wxml` 已移除“我的草稿”入口
  - `pages/profile/profile.js` 已移除：
    - `hasDraft`
    - `checkDraftStatus`
    - `onMyDrafts`
    - `onDraftTap`
    - `onDeleteDraft`
  - 当前普通用户在 `profile` 的菜单顺序调整为：
    - 消息中心
    - 我的发布
    - 编辑标签
    - 编辑个人信息
    - 主题颜色
    - 关于
    - 退出登录
  - 当前口径：
    - 草稿主链统一收敛到“我的发布 / 消息中心 / publishMode”
    - `profile` 不再保留独立草稿入口，避免形成第二条编辑链
 - 2026-03-28 已修复“长测评 / 好物速报草稿回填后装备类别 checkbox 不显示已选中”：
  - 根因确认：
    - `components/publish-checkbox` 之前没有真正消费外部传入的 `checkboxItems`
    - `post-Experience` / `post-Recommend` 也未把 `formData.gearCategory` 同步成 `equipmentCategories.checked`
  - 已完成调整：
    - `components/publish-checkbox` 已支持从属性同步选中态
    - `components/post-Experience/post-Experience.js` 已在初始化 / observer / 用户切换分类时同步 `equipmentCategories.checked`
    - `components/post-Recommend/post-Recommend.js` 已在初始化 / observer / 用户切换分类时同步 `equipmentCategories.checked`
  - 当前口径：
    - 长测评与好物速报保存草稿后再次打开，装备类别应保持与已保存字段一致
 - 2026-03-28 已统一“我的发布”底部统计展示：
  - `pkgContent/my-publish/my-publish.wxml` 已将表情符号统计改为文字标签：
    - `赞`
    - `评`
    - `阅`
  - 当前后端帖子列表接口未返回阅读量字段，确认不是前端显示 bug，而是接口尚未提供
 - 第一版当前口径：
    - “我的发布”中继续显示 `赞 / 评`
    - `阅` 仅在接口真实返回阅读量字段时展示，避免长期显示 `0` 误导用户
 - 2026-03-28 已收口“驳回回草稿重复生成新帖子 / 重复驳回消息”：
  - 用户联调发现：
    - 被驳回帖子再次编辑后如果直接重提，可能重复生成内容相同但 `topicId` 不同的新帖子
    - 消息中心会累计出现同一帖子多次 `topic_rejected`
  - 根因确认：
    - `post-Question` / `post-Recommend` / `post-Experience` 提交时未携带 `formData.id`
    - 驳回消息写入 `user_messages` 时未按“同用户 + 同帖子 + 同类型”替换旧记录
  - 已完成调整：
    - 上述 3 个发布组件提交时已带上草稿 `id`
    - `MessageService` 在写入 `topic_rejected` 前，会先删除同用户同帖子旧驳回消息，再写入最新一条
  - 当前口径：
    - 驳回回草稿重新提交应继续复用原 `topicId`
    - 消息中心对同一帖子只保留最新一次驳回消息
 - 2026-03-28 已收口“已通过帖子仍被旧驳回消息拉回草稿”的问题：
  - 用户联调发现：
    - 同一帖子重新提交并通过后，消息中心里仍可能看到旧的 `topic_rejected`
    - 点击后会再次进入草稿编辑页，造成“已通过帖子又被拉回审核态”的错觉
  - 已完成调整：
    - `TopicService.publishTopic()` 在草稿重提成功后，会清理该帖旧的 `topic_rejected`
    - `AdminReviewService.passTopic()` / `restoreTopic()` 也会清理该帖旧驳回消息
    - `MessageService.list()` 返回消息前，会清理“对应帖子已不处于草稿态”的陈旧驳回消息
    - `pkgContent/message-center/message-center.js` 点击驳回消息前会校验目标帖子是否仍为草稿，失效则提示并刷新列表
  - 当前口径：
    - 当对应 `topicId` 已不再是草稿时，不再继续显示或跳转旧驳回消息
 - 2026-03-28 已修复“首次发帖在审核后台系统审核为空、重提后才显示 PASS”的记录绑定问题：
  - 用户联调发现：
    - 同一帖子第一次进入后台时，“系统审核”可能为空
    - 被驳回后再次提交，后台才显示 `PASS / system_bypass / tencent_provider_disabled`
  - 根因确认：
    - 首次发帖时，文本审核记录先按 `${userId}:pending` 写入 `moderation_records`
    - 旧代码在 `TopicService.publishTopic()` 的首次插入分支里没有把这批记录重绑到真实 `topicId`
    - 重提草稿时因为已带 `dto.id`，审核记录直接写到真实 `topicId`，所以后台第二次才看得到
  - 已完成调整：
    - `src/modules/topic/topic.service.ts` 在首次插入帖子后，已补 `moderationService.relinkPendingRecords()`
  - 当前口径：
    - 新创建帖子第一次进入审核后台时，也应能看到对应的“系统审核”记录
  - 2026-03-28 已修复“草稿列表删除按钮点击穿透整卡”的交互问题：
  - 用户联调发现：点击 `我的发布 -> 草稿` 的删除按钮时，会先触发整卡点击打开草稿，再叠加删除确认框
  - 已完成调整：
    - `pkgContent/my-publish/my-publish.wxml` 的草稿删除按钮已从 `bindtap` 改为 `catchtap`
  - 当前口径：
    - 点击草稿删除按钮只触发删除确认，不再穿透打开草稿
  - 全局请求层已区分：
    - 鉴权型 `401/403`
    - 审核拒绝 / 业务拒绝型 `403`
  - 当前口径：
    - 评论命中关键词时，不再误判为登录失效并清空登录态
    - 发帖标题 / 正文命中规则时，前端明确提示“发布内容不符合社区规范，请修改后重试”
    - 修改昵称 / 简介命中规则时，前端明确提示“保存内容不符合社区规范，请修改后重试”
    - 评论命中规则时，前端明确提示“评论内容不符合社区规范，请修改后重试”
  - 编辑资料页已在页面内接住保存失败 promise，避免在明确业务提示之后再触发一次全局“系统异常”
