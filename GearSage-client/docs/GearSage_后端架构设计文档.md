# GearSage 后端架构设计文档

版本：v1.2  
状态：持续维护中 / 已按 2026-03-25 P1 上传与静态资源链路现状同步  
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

本文档不是迁移日志，而是未来后端长期演进的设计基线。

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

### 4.1 技术栈
- 语言：TypeScript
- 运行时：Node.js
- 后端框架：NestJS
- 数据库：PostgreSQL
- 反向代理：Nginx
- 进程管理：PM2
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

### 4.3 登录方案
默认采用：

- 手机号验证码登录
- Access Token + Refresh Token

第一阶段策略：

- 先采用测试验证码模式
- 固定验证码 `123456`
- 不接真实短信服务
- 任意手机号均可用于测试登录

### 4.4 第一阶段前端运行位置
第一阶段前端仍运行于微信小程序环境，只逐步把云开发调用替换为独立后台 HTTP API。FinClip 适配不作为第一阶段前置条件。

### 4.5 历史数据策略
默认策略：

- 不迁移历史用户
- 不迁移历史帖子
- 不迁移历史图片 `cloud://` 文件
- 新系统从空库开始

### 4.6 当前上传与静态资源方案（正式）
当前正式执行方案如下：

#### 上传写入方式
- 前端上传到 NestJS
- NestJS 接收 multipart/form-data
- 文件写入**腾讯云轻量对象存储挂载目录**

#### 存储路径
- 挂载根目录：`/lhcos-data`
- 业务上传目录：`/lhcos-data/gearsage`
- 分类子目录：
  - `/lhcos-data/gearsage/topic`
  - `/lhcos-data/gearsage/avatar`
  - `/lhcos-data/gearsage/background`

#### 静态资源访问方式
- 静态域名：`https://static.gearsage.club`
- 当前执行路线：**A 路线（服务器 Nginx 静态映射）**
- 访问基础路径：`https://static.gearsage.club/gearsage`

#### 明确不采用
当前第一阶段不采用：

- COS SDK 直连上传
- 前端直传
- STS 临时密钥
- 预签名上传
- CDN 独立优化

说明：
- 当前方案不是最终极致方案，但已经满足第一阶段“先跑通上传链路”的目标
- 后续如果访问量或维护性要求提高，再评估升级为更标准的对象存储直出架构

---

## 5. 总体架构

### 5.1 当前阶段真实运行架构
```text
微信小程序
   ↓
https://api.gearsage.club
   ↓
Nginx :443
   ↓
NestJS :3000
   ↓
PostgreSQL :5432

上传文件
   ↓
NestJS /upload/*
   ↓
/lhcos-data/gearsage/*
   ↓
Nginx static.gearsage.club
   ↓
https://static.gearsage.club/gearsage/*
```

### 5.2 未来逻辑架构（保留）
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
  对象存储 / CDN（后续可升级）
```

---

## 6. 项目目录建议

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

---

## 7. 模块设计

### 7.1 app 模块
已落地：

- `GET /health`
- `GET /health/db`

### 7.2 auth 模块
已落地接口：

- `POST /auth/send-code`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### 7.3 user 模块
已落地接口：

- `GET /mini/user/info`
- `POST /mini/user/update`
- `GET /mini/user/points`

### 7.4 topic 模块
已落地接口：

- `GET /mini/topic/all`
- `GET /mini/topic`
- `GET /mini/topic/tmp`
- `GET /mini/topic/mine`
- `PUT /mini/topic`
- `POST /mini/topic`
- `DELETE /mini/topic`
- `POST /mini/topic/like`

### 7.5 comment 模块
已落地接口：

- `GET /mini/comment`
- `PUT /mini/comment`
- `POST /mini/comment/like`
- `DELETE /mini/comment`

### 7.6 upload 模块
当前已落地接口：

- `POST /upload`
- `POST /upload/image`
- `POST /upload/avatar`
- `POST /upload/background`

#### 当前实现细节
- 使用 `multer`
- 使用 `@nestjs/platform-express`
- 上传文件通过 `UploadService` 写入挂载目录
- 根据分类写入不同子目录
- 返回最终静态 URL

#### 当前环境变量
```env
UPLOAD_DRIVER=mounted_storage
UPLOAD_DIR=/lhcos-data/gearsage
UPLOAD_BASE_URL=https://static.gearsage.club/gearsage
```

#### 当前返回示例
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "fileName": "1774422069167-c0w69lbu.txt",
    "category": "topic",
    "relativePath": "topic/1774422069167-c0w69lbu.txt",
    "localPath": "/lhcos-data/gearsage/topic/1774422069167-c0w69lbu.txt",
    "url": "https://static.gearsage.club/gearsage/topic/1774422069167-c0w69lbu.txt",
    "size": 20,
    "mimeType": "text/plain"
  }
}
```

#### 当前已验证
- `/upload/image` 已通过 curl 验证
- 返回 URL 已可通过浏览器 / curl 访问

#### 当前仍建议补充验证
- `/upload/avatar`
- `/upload/background`
- 小程序真实头像 / 背景图 / 发布页图片联调

### 7.7 tag 模块
计划接口：

- `GET /mini/tag/usable`
- `GET /mini/tag/used`
- `POST /mini/tag/used`

### 7.8 goods 模块
计划接口：

- `GET /mini/goods`
- `POST /mini/goods`

### 7.9 task 模块
计划接口：

- `GET /mini/taskFeat`
- `GET /mini/taskFeat/unfinish`
- `POST /mini/taskFeat`

### 7.10 gear 模块
计划接口：

- `GET /mini/gear/brands?type=reels|rods|lures`
- `GET /mini/gear/list`
- `GET /mini/gear/detail`

当前阶段要求：
- 已完成列表页 / 详情页 / 相关推荐第一版切换
- 当前仍不要求整块迁完数据库落表

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

### 8.2 路由命名约定
- 业务接口继续保留 `/mini/*`
- 登录接口采用 `/auth/*`
- 上传接口采用 `/upload/*`

### 8.3 DTO 与校验
全局启用：

- `ValidationPipe`
- `whitelist: true`
- `transform: true`

---

## 9. 数据库设计原则

### 9.1 当前数据库
PostgreSQL

### 9.2 当前已落地核心表
- `bz_mini_user`
- `bz_mini_topic`
- `bz_topic_comment`
- `bz_topic_like`
- `auth_identities`
- `auth_refresh_tokens`
- `bz_upload_asset`

### 9.3 建议后续新增表
- `admin_users`
- `admin_roles`
- `admin_operation_logs`

---

## 10. 鉴权设计

当前正式策略：

- 手机号 + 测试验证码
- Access Token + Refresh Token
- 登录即注册
- 后续再接真实短信

---

## 11. 上传与静态资源设计（正式）

### 11.1 当前正式方案
上传采用：

> 前端上传到 NestJS，NestJS 将文件写入腾讯云轻量对象存储挂载目录，再由 Nginx 静态域名映射提供访问。

### 11.2 路径约定
- 挂载根目录：`/lhcos-data`
- 上传目录：`/lhcos-data/gearsage`
- 访问根 URL：`https://static.gearsage.club/gearsage`

### 11.3 Nginx 静态映射
当前静态站点配置文件：

```text
/etc/nginx/conf.d/gearsage-static.conf
```

其核心职责：

- `server_name static.gearsage.club`
- 80 跳转 443
- 443 加载证书
- `root /lhcos-data`
- `try_files $uri =404`

### 11.4 为什么采用 A 路线
原因：

- 轻量对象存储已实际挂载到服务器
- 当前控制台侧直连对象存储自定义域名配置路径复杂，不适合作为此时阻塞项
- 当前阶段最重要的是让上传链路先跑通
- 服务器静态映射已经足够支撑第一阶段需求

### 11.5 后续可选升级方向
后续若需要更标准方案，可评估：

- 静态域名改为对象存储直出
- 对象存储 SDK 直连
- CDN 前置
- 上传鉴权与临时密钥体系

当前**不要求**立即升级。

---

## 12. 部署与运行设计

### 12.1 当前部署方式
- API 域名：`https://api.gearsage.club`
- 静态域名：`https://static.gearsage.club`
- API Nginx 配置：`/etc/nginx/conf.d/gearsage-api.conf`
- 静态资源 Nginx 配置：`/etc/nginx/conf.d/gearsage-static.conf`
- NestJS 监听：`3000`
- PostgreSQL 本地：`5432`
- PM2 托管服务：`gearsage-api`

### 12.2 常用部署命令
```bash
git pull origin main
npm install
npm run build
pm2 restart gearsage-api --update-env
curl https://api.gearsage.club/health
```

### 12.3 上传链路验证命令
```bash
curl -X POST http://127.0.0.1:3000/upload/image -F "file=@/tmp/test-upload.txt"
curl -k https://static.gearsage.club/gearsage/topic/文件名
```

---

## 13. 协作流程设计（给 Codex / Cursor / 人工）

### 13.1 当前 P1 开发前必须知道的事实
Codex / Cursor 必须明确：

- P0 已完成第一版收口
- P1 不再是“是否能上传”，而是“如何收口上传与继续迁移业务模块”
- 上传当前依赖轻量对象存储挂载目录
- 静态域名由服务器 Nginx 提供
- 不允许把当前上传方案改回旧路径
- 不允许擅自引入另一套未拍板的上传架构

### 13.2 当前适合交给 AI 的 P1 任务
- `upload/avatar` / `upload/background` 收口
- 上传工具命名统一
- 非 P0 云开发残留清理
- 标签 / 商城 / 任务接口切换
- 装备库迁移方案输出
- 文档回写

---

## 14. 当前阶段路线图

### 已完成
- 服务器基础环境
- API 域名与 HTTPS
- 静态资源域名与 HTTPS
- P0 五条主链路
- P1 上传与静态资源链路
- P1 标签 / 虚拟权益第一版接口
- P1 任务第一版接口
- P1 装备库第一版接口与页面切换
- P1 装备库 `Excel -> PostgreSQL` 导入链第一版
- 非 P0 历史云开发死代码第一轮清理

### 当前正在做
- 后续阶段任务规划
- 任务链路从第一版最小可用继续扩充业务规则
- 装备库筛选与搜索细节继续收口

### 下一阶段优先级
#### P1-A
- `avatar/background` 与发布页图片真链路联调复核
- 标签页 / 虚拟权益页签联调复核
- 回写文档

#### P1-B
- 清理非 P0 云开发残留
- 切标签 / 商城 / 任务接口

#### P1-C
- 装备库迁移拆分方案
- 新接口契约建议
- 历史 `cloud://` 资源清退评估

---

## 15. 当前已知风险

### 15.1 上传路径曾判断错误
曾短暂误用：

```text
/lhcos-data/data/gearsage
```

正确路径现已拍板为：

```text
/lhcos-data/gearsage
```

### 15.2 当前静态资源仍经过服务器
当前方案优先解决“能用”，并非最终极致性能方案。未来若图片访问量明显增大，应重新评估是否升级为对象存储直出/CDN。

### 15.3 装备库仍是下一块高复杂度区域
装备库主页面虽然已完成第一版脱云，且当前已补上 `Excel -> PostgreSQL` 导入链与 gear 正式表结构，但仍有两类复杂度待继续处理：

- `rate/excel` 仍是维护源，后续要持续维护导入脚本与表结构兼容
- 搜索 / 推荐 / 更细筛选字段还没有完全补齐长期方案

---

## 16. 最终目标

本架构的最终目标不是继续维护一个半云开发项目，而是：

> 构建一个真正独立、可持续演进、可接 App、可接管理后台、可交给 AI 工具持续协作的 GearSage 后端。

当前阶段的现实成果已经证明：

- 独立后台已接管核心业务
- 上传链路与静态资源链路已跑通
- 后续重点不再是“能否脱离云开发”，而是“如何持续收口并扩展到剩余模块”
