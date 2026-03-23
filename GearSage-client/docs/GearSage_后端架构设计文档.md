# GearSage 后端架构设计文档

版本：v1.0  
状态：建议拍板版 / 可直接作为 Codex 与开发协作文档  
适用范围：GearSage 独立后台、数据库、文件上传、接口规范、部署与协作流程

---

## 1. 文档目标

本文档用于定义 GearSage 独立后台的正式架构，统一以下内容：

1. 后端技术栈与运行方式  
2. 模块边界与职责划分  
3. API 设计规范与返回结构  
4. 鉴权、上传、数据库、部署方案  
5. 与前端、小程序、FinClip 的集成边界  
6. 后续 Codex / Cursor / 人工开发的协作基线

本文档的作用不是“迁移记录”，而是未来后端长期演进的设计基线。

---

## 2. 项目背景

GearSage 原始形态基于微信小程序 + 微信云开发混合实现。当前已确认：

- 微信云函数、云数据库、云存储在审核与平台能力上限制较大
- 社区/论坛形态产品更适合迁移为独立后台
- 前端未来目标是 App 化，但第一阶段不要求立刻做 FinClip 适配重构
- 当前独立后台技术路线已明确为：
  - Node.js
  - NestJS
  - PostgreSQL
  - Nginx
  - PM2

因此本项目后端的首要目标不是“做大而全的平台”，而是：

> 先构建一个可长期演进、能真正接管原小程序业务的独立后台。

---

## 3. 架构原则

### 3.1 先跑通主链路，再扩展功能
优先级固定为：

1. 服务器与部署底座
2. 用户、帖子、评论、上传
3. 鉴权与会话
4. 标签、商城、任务
5. 装备库
6. 后续推荐、运营、统计

### 3.2 渐进替换，不做大爆炸重写
第一阶段允许：

- 前端仍运行在微信小程序环境
- 页面 UI 基本不变
- 只逐步把云函数调用替换为 HTTP API

### 3.3 后端优先保持接口稳定
前端迁移期间，后端应优先保证：

- 路由路径稳定
- 返回结构统一
- 字段口径固定
- 尽量不要频繁改 API

### 3.4 独立后台必须脱离微信云开发
后端设计目标明确为：

- 不依赖 `wx.cloud`
- 不依赖微信云函数上下文
- 不依赖云数据库查询模型
- 不依赖 `cloud://` 文件模型

### 3.5 可追溯、可交接、可交给 AI 协作
所有已实现功能都必须满足：

- 可构建
- 可 curl 验证
- 可 SQL 验证
- 可回写文档
- 可交给 Codex 接力

---

## 4. 当前默认拍板决策

除非后续明确推翻，本设计文档采用以下默认决策。

### 4.1 技术栈

- 语言：TypeScript
- 运行时：Node.js
- 后端框架：NestJS
- 数据库：PostgreSQL
- 反向代理：Nginx
- 进程管理：PM2
- 对象存储：COS
- 部署环境：腾讯云轻量服务器

### 4.2 接口返回结构

统一采用：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

说明：

- `code = 0` 表示成功
- `code != 0` 表示业务错误
- HTTP 状态码仍可用于表达基础协议异常，但前端主要按业务包络判断

### 4.3 登录方案

默认采用：

- 手机号验证码登录
- Access Token + Refresh Token

第一阶段策略：

- 先采用“测试验证码模式”
- 不接真实短信服务
- 固定验证码 `123456` 用于开发测试
- 任意手机号均可用于测试登录
- 后续再替换为真实短信平台

### 4.4 第一阶段前端运行位置

第一阶段前端仍运行于：

- 微信小程序环境

但只做一件核心事情：

- 将原 cloudfunctions 调用逐步替换为独立后台 HTTP API

FinClip 适配不作为第一阶段前置条件。

### 4.5 历史数据策略

默认策略：

- 不迁移历史用户
- 不迁移历史帖子
- 不迁移历史图片 `cloud://` 文件
- 新系统从空库开始

原因：

- 当前项目仍在施工阶段
- 数据体量小
- 历史结构复杂，不值得为旧数据增加实施风险

### 4.6 上传方案

默认方案：

- 前端上传到 NestJS
- 第一阶段先落本地 `UPLOAD_DIR`
- COS 配置完成后，再切换为后端中转上传到 COS
- 后端返回 URL
- 数据库存储 URL 或 objectKey + URL 映射信息

第一阶段不采用：

- 预签名直传
- STS 临时密钥直传
- 客户端分片直传

---

## 5. 总体架构

### 5.1 逻辑架构

```text
微信小程序 / FinClip / App
        ↓
      HTTPS
        ↓
     Nginx
        ↓
    NestJS API
        ↓
 PostgreSQL + Redis(预留)
        ↓
      COS
```

### 5.2 当前阶段真实运行架构

```text
客户端 / curl
   ↓
Nginx :80
   ↓
NestJS :3000
   ↓
PostgreSQL :5432
```

### 5.3 架构目标

本架构需要满足：

- 支撑社区 / 论坛主链路
- 支撑文件上传与图片展示
- 支撑用户身份体系
- 支撑管理后台与审核体系
- 可扩展到标签、商城、任务、装备库
- 可持续部署和回滚
- 可由 AI 工具协作迭代

---

## 6. 项目目录建议

当前建议使用以下目录结构：

```text
src/
  app.module.ts
  main.ts

  common/
    database.service.ts
    response/
    filters/
    guards/
    interceptors/
    decorators/
    utils/
    constants/

  config/
    env.config.ts
    jwt.config.ts
    upload.config.ts

  modules/
    app/
    auth/
    user/
    topic/
    comment/
    upload/
    tag/
    goods/
    task/
    gear/
    admin/

sql/
  init_core_tables.sql
  migrations/
```

### 6.1 目录原则

- `modules/`：业务模块
- `common/`：通用基础设施
- `config/`：配置定义
- `sql/`：数据库初始化与迁移脚本

---

## 7. 模块设计

### 7.1 app 模块
职责：

- 健康检查
- 系统信息
- 版本信息
- 环境检查

当前已落地：

- `GET /health`
- `GET /health/db`

### 7.2 auth 模块
职责：

- 登录
- 刷新 token
- 登出
- 当前用户信息
- 登录态校验

计划接口：

- `POST /auth/send-code`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

第一阶段实现建议：

- 固定测试验证码
- Access Token 有效期 2 小时
- Refresh Token 有效期 30 天
- Refresh Token 存库
- 返回结构优先兼容当前小程序：
  - `token`
  - `refreshToken`
  - `expiresIn`
  - `userInfo`

建议新增表：

- `auth_identities`
- `auth_refresh_tokens`

### 7.3 user 模块
职责：

- 用户信息查询
- 编辑资料
- 积分信息
- 用户状态

计划接口：

- `GET /mini/user/info`
- `POST /mini/user/update`
- `GET /mini/user/points`

第一阶段实现建议：

- 直接按登录态查询当前用户
- 不再以 `userId` 作为前端主调用口径

### 7.4 topic 模块
职责：

- 帖子列表
- 帖子详情
- 我的帖子
- 草稿
- 发布
- 删除
- 点赞

当前已落地：

- `GET /mini/topic/all`
- `GET /mini/topic`
- `GET /mini/topic/tmp`
- `GET /mini/topic/mine`
- `PUT /mini/topic`
- `POST /mini/topic`
- `DELETE /mini/topic`
- `POST /mini/topic/like`

状态口径：

- `status = 0` 草稿
- `status = 1` 待审核（字段保留，第一版暂不进入）
- `status = 2` 已发布
- `isDelete = 0/1`

第一阶段发布策略：

- 审核流程尚未完成
- 用户发布默认直接通过
- 因此第一版发布接口写入 `status = 2`

### 7.5 comment 模块
职责：

- 评论列表
- 发表评论
- 回复评论

计划接口：

- `GET /mini/comment`
- `PUT /mini/comment`

第一阶段建议：

- 简单树状 / 扁平列表
- 评论只需满足：
  - topicId
  - userId
  - content
  - replyCommentId（可空）
  - isVisible

### 7.6 upload 模块
职责：

- 文件接收
- 文件校验
- 上传本地 `UPLOAD_DIR` / 后续上传 COS
- 返回 URL
- 记录元数据

计划接口：

- `POST /upload/image`
- `POST /upload/avatar`
- `POST /upload/background`

建议新增表：

- `media_assets`

字段建议：

- id
- bizType
- bizId
- fileName
- fileExt
- mimeType
- fileSize
- objectKey
- url
- status
- createTime
- updateTime

### 7.7 tag 模块
职责：

- 标签定义
- 用户拥有标签
- 佩戴设置
- 发帖展示标签

计划接口：

- `GET /mini/tag/usable`
- `GET /mini/tag/used`
- `POST /mini/tag/used`

### 7.8 goods 模块
职责：

- 商品列表
- 积分兑换
- 商品上下架
- 库存

计划接口：

- `GET /mini/goods`
- `POST /mini/goods`

### 7.9 task 模块
职责：

- 任务定义
- 任务记录
- 领奖
- 任务统计

计划接口：

- `GET /mini/taskFeat`
- `GET /mini/taskFeat/unfinish`
- `POST /mini/taskFeat`

### 7.10 gear 模块
职责：

- 品牌列表
- 装备搜索
- 装备详情
- 相关推荐帖子

计划接口：

- `GET /mini/gear/list`
- `GET /mini/gear/search`
- `GET /mini/gear/detail`

### 7.11 admin 模块（第二阶段）
职责：

- 管理员登录
- 帖子审核
- 评论管理
- 用户封禁/禁言
- 标签配置
- 商品配置
- 任务配置
- 装备导入

---

## 8. API 设计规范

### 8.1 返回结构

成功：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

业务未找到：

```json
{
  "code": 404,
  "message": "topic not found",
  "data": null
}
```

参数错误：

```json
{
  "code": 400,
  "message": "topicId is invalid",
  "data": null
}
```

### 8.2 路由命名约定

沿用当前兼容策略：

- 业务接口继续保留 `/mini/*`
- 登录接口采用 `/auth/*`

原因：

- 最小化前端改造成本
- 渐进替换云函数

### 8.3 DTO 与校验

全局启用：

- `ValidationPipe`
- `whitelist: true`
- `transform: true`

约定：

- 所有写接口必须使用 DTO
- 所有 query 参数需在 controller 校验
- service 不直接信任原始 body

---

## 9. 数据库设计原则

### 9.1 当前数据库
PostgreSQL

### 9.2 设计原则

1. 主业务表名尽量保持当前语义
2. 字段口径保持稳定
3. 能 JSON 的复杂结构先用 JSONB
4. 不为旧云数据库脏数据背包袱
5. 先满足当前业务，再考虑范式优化

### 9.3 当前已落地核心表

- `bz_mini_user`
- `bz_mini_topic`
- `bz_topic_comment`
- `bz_topic_like`

### 9.4 建议后续新增表

- `auth_identities`
- `auth_refresh_tokens`
- `media_assets`
- `admin_users`
- `admin_roles`
- `admin_operation_logs`

---

## 10. 鉴权设计

### 10.1 登录形态

第一阶段：

- 手机号 + 测试验证码
- 登录即注册
- 任意手机号可用于测试登录

第二阶段：

- 接真实短信平台

### 10.2 Token 设计

#### Access Token
- 格式：JWT
- 有效期：2 小时
- 用途：接口鉴权

#### Refresh Token
- 格式：随机字符串或 JWT
- 有效期：30 天
- 用途：刷新 Access Token
- 必须存库
- 支持主动失效

### 10.3 第一阶段建议实现

#### 登录
```json
POST /auth/login
{
  "phone": "13800000000",
  "code": "123456"
}
```

#### 返回
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "xxx",
    "refreshToken": "xxx",
    "expiresIn": 7200,
    "userInfo": {}
  }
}
```

### 10.4 为什么不用 wx.login 作为主链路

原因：

- 未来不局限于微信小程序
- 后端需要独立用户体系
- App / FinClip / Web 都需要统一登录方式
- 微信授权能力可以作为补充，不作为唯一基础

---

## 11. 上传与 COS 设计

### 11.1 第一阶段方案

采用：

> 前端上传到 NestJS。COS 尚未配置完成前，先落本地 `UPLOAD_DIR`；COS 配置完成后，再切换为后端中转上传到 COS。

### 11.2 上传链路

```text
前端选择文件
   ↓
POST /upload/*
   ↓
NestJS 校验文件
   ↓
上传到本地 `UPLOAD_DIR` 或 COS
   ↓
返回 URL / objectKey
```

### 11.3 为什么选后端中转

原因：

- 当前用户量极小
- 架构更容易控制
- 更容易做鉴权、命名、业务关联
- 更容易接入审核
- 避免前端直传带来的临时密钥复杂度

### 11.4 后续演进

第二阶段可考虑：

- STS 临时密钥
- 预签名上传
- 大文件分片上传

---

## 12. 部署与运行设计

### 12.1 当前部署方式

- Nginx 监听 80 / 443
- NestJS 监听 3000
- PostgreSQL 本地 5432
- PM2 托管进程

当前 API 基础地址：

```text
https://api.gearsage.club
```

当前 Nginx 站点配置：

```text
/etc/nginx/conf.d/gearsage-api.conf
```

当前 HTTPS 证书路径：

```text
/etc/nginx/ssl/api.gearsage.club/api.gearsage.club_bundle.crt
/etc/nginx/ssl/api.gearsage.club/api.gearsage.club.key
```

当前小程序 request 合法域名：

```text
api.gearsage.club
```

### 12.2 当前项目目录

```text
/srv/gearsage-api
```

### 12.3 构建与重启标准流程

```bash
npm run build
pm2 restart gearsage-api
```

### 12.4 健康检查标准流程

```bash
curl http://127.0.0.1:3001/health
curl http://127.0.0.1:3001/health/db
curl https://api.gearsage.club/health
curl https://api.gearsage.club/health/db
```

### 12.5 数据库验证标准流程

```bash
psql "postgresql://..." -c "SELECT ..."
```

---

## 13. 日志与可观测性设计

### 13.1 当前阶段最小要求

必须具备：

- 启动日志
- 构建成功验证
- curl 验证
- SQL 验证

### 13.2 后续建议

后续可逐步增加：

- 请求日志
- 错误日志
- 操作审计日志
- 上传日志
- 后台操作日志

---

## 14. 协作流程设计（给 Codex / Cursor / 人工）

### 14.1 施工总流程

每次修改必须按下面顺序：

1. 先读施工记录文档
2. 明确本次改动目标
3. 修改代码
4. 构建
5. PM2 重启
6. curl 验证
7. SQL 验证（如涉及数据库）
8. 回写施工记录文档

### 14.2 AI 协作边界

Codex / Cursor 可负责：

- DTO / Controller / Service
- SQL 初始化脚本
- 评论模块
- 鉴权模块骨架
- 上传模块骨架
- 用户模块骨架

AI 不应擅自修改：

- 表名
- 路由路径
- 返回格式
- 已完成接口的行为口径
- 技术栈

### 14.3 当前真实状态文档

后续施工时，以以下文档为准：

- 《独立后台迁移计划（设计 + 施工记录 + 标准流程）》
- 《GearSage 后端架构设计文档》
- `docs/小程序api.md`

建议前者偏施工，后者偏设计，`docs/小程序api.md` 负责补充现有小程序接口与字段契约。

---

## 15. 当前实施状态与路线图

### 已完成

- 服务器基础环境
- Nest + PostgreSQL 打通
- 健康检查
- 帖子模块第一版主链路

### 当前正在做

- 鉴权模块第一版联调
- 用户 / 评论 / 上传第一版联调
- 小程序主链路切离云开发

### 下一阶段优先级

#### P0
- 鉴权模块第一版
- 用户模块最小可用版
- 评论模块最小可用版
- 上传模块第一版（本地 `UPLOAD_DIR`）

#### P1
- COS 接入
- 前端继续切帖子 / 评论 / 用户接口

#### P2
- 标签
- 商城
- 任务
- 装备库

---

## 16. 当前已知风险

### 16.1 终端 heredoc 易出错
已经多次出现：

- `cat > file <<'EOF'` 输入被污染
- 返回结果与下一条命令串在一起
- 文件被意外写坏

解决原则：

- 每次 `cat <<'EOF'` 必须整段复制
- 最后一行必须独立 `EOF`
- 复杂修改优先让 Codex 输出文件内容，再一次性覆盖

### 16.2 前端接口切换尚未开始
风险：

- 后端已逐步成型
- 前端若不及时逐页切换，会出现“后端能用但业务未落地”的假象

### 16.3 鉴权未落地前不宜做用户态复杂逻辑
例如：

- isLike 联动真实当前用户
- 删除帖子校验“只能删自己的”
- 评论作者权限控制

这些应在 auth 模块完成后再补。

---

## 17. 最终目标

本架构的最终目标不是“继续维护一个半云开发项目”，而是：

> 构建一个真正独立、可持续演进、可接 App、可接管理后台、可交给 AI 工具持续协作的 GearSage 后端。

具体标准为：

- 所有主业务均由 NestJS 接管
- 所有媒体上传脱离微信云开发
- 所有身份体系脱离微信云函数登录
- 前端逐步只保留运行时能力，不再依赖云开发
- 文档可持续维护，后续所有修改都可追溯
