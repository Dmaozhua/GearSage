# GearSage API

GearSage 独立后台项目。

当前技术栈：

- Node.js
- NestJS
- PostgreSQL
- Nginx
- PM2

当前正式环境地址：

- API: `https://api.gearsage.club`

---

## 目录说明

建议本地目录：

- 前端：`/Users/tommy/GearSage/GearSage-client`
- 后端：`/Users/tommy/GearSage/GearSage-api`

当前服务器目录：

- 后端：`/srv/gearsage-api`

---

## 当前已完成模块

已落地接口：

- `GET /health`
- `GET /health/db`

帖子模块：
- `GET /mini/topic/all`
- `GET /mini/topic`
- `GET /mini/topic/tmp`
- `GET /mini/topic/mine`
- `PUT /mini/topic`
- `POST /mini/topic`
- `DELETE /mini/topic`
- `POST /mini/topic/like`

---

## 环境要求

建议版本：

- Node.js 24
- npm 10+
- Git
- macOS 终端
- SSH 可连接正式服务器

---

## 本地开发模式

当前推荐的本地开发方式：

- **后端在本机运行**
- **数据库先复用服务器 PostgreSQL**
- **通过 SSH 隧道把本机 5433 转发到服务器 5432**

这样你可以在本机改代码，不用每次都先部署到外网。

---

## 本地开发前准备

### 1. 安装依赖

进入项目目录：

```bash
cd /Users/tommy/GearSage/GearSage-api
npm install
```

### 2. 创建本地环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

然后把 `.env.local` 里的数据库密码、服务器 IP、COS 等真实信息补全。

### 3. 修改配置读取顺序

确认项目 `ConfigModule.forRoot()` 已设置：

```ts
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],
})
```

这样本地优先读取 `.env.local`。

---

## 本地启动标准流程

### 终端 A：建立数据库 SSH 隧道

```bash
ssh -L 5433:127.0.0.1:5432 root@你的服务器公网IP
```

这个终端要保持打开，不能关闭。

### 终端 B：启动本地后端

```bash
cd /Users/tommy/GearSage/GearSage-api
npm install
npm run start:dev
```

如果没有 `start:dev`，就执行：

```bash
npm run start
```

---

## 本地验证

启动后执行：

```bash
curl http://127.0.0.1:3001/health
curl http://127.0.0.1:3001/health/db
curl http://127.0.0.1:3001/mini/topic/all
```

如果都能返回，说明：

- 本机后端已运行
- 本机已连上服务器数据库
- 本地开发环境可用

如需把装备库维护 Excel 导入 PostgreSQL，执行：

```bash
cd /Users/tommy/GearSage/GearSage-api
npm run import:gear
```

当前口径：

- `rate/excel` 是装备主数据维护源
- `npm run import:gear` 负责导入：
  - `gear_brands`
  - `gear_master`
  - `gear_variants`
- `npm run import:gear` 同时会重建：
  - `GearSage-client/pkgGear/searchData/Data.js`
- gear 接口会优先读取 PostgreSQL，未导入时才回退 Excel

---

## 本地停止流程

### 停止本地后端
在运行 Nest 的终端按：

```bash
Ctrl + C
```

### 关闭数据库隧道
在 SSH 隧道终端按：

```bash
Ctrl + C
```

---

## Git 工作流

当前推荐工作流：

1. 本地修改代码
2. 本地运行与验证
3. Git 提交
4. 推送 GitHub
5. 服务器拉取代码
6. 构建并重启 PM2
7. 验证正式环境

---

## 本地提交代码

```bash
cd /Users/tommy/GearSage/GearSage-api
git add .
git commit -m "feat: xxx"
git push origin main
```

也可以使用 SourceTree 提交与推送。

---

## 正式环境发布流程

### 1. SSH 登录服务器

```bash
ssh root@你的服务器公网IP
```

### 2. 进入项目目录

```bash
cd /srv/gearsage-api
```

### 3. 拉取最新代码

```bash
git pull origin main
```

### 4. 如果依赖有变化，安装依赖

```bash
npm install
```

### 5. 构建

```bash
npm run build
```

### 6. 重启服务

```bash
pm2 restart gearsage-api
```

### 7. 验证正式环境

```bash
curl https://api.gearsage.club/health
curl https://api.gearsage.club/health/db
```

如果本次改了业务接口，也要额外验证对应接口。

---

## 服务器当前运行方式

正式环境链路：

```text
客户端 / 小程序
    ↓
https://api.gearsage.club
    ↓
Nginx :443
    ↓
NestJS :3000
    ↓
PostgreSQL :5432
```

---

## Nginx 相关

当前站点配置文件：

```text
/etc/nginx/conf.d/gearsage-api.conf
```

证书目录：

```text
/etc/nginx/ssl/api.gearsage.club/
```

常用命令：

```bash
nginx -t
systemctl restart nginx
systemctl status nginx --no-pager
```

---

## PM2 相关

当前服务名：

```text
gearsage-api
```

常用命令：

```bash
pm2 status
pm2 restart gearsage-api
pm2 logs gearsage-api
pm2 save
```

---

## PostgreSQL 相关

第一阶段开发时，本机默认通过 SSH 隧道连接服务器数据库。

数据库验证命令：

```bash
curl http://127.0.0.1:3001/health/db
```

服务器侧验证：

```bash
psql "postgresql://用户名:密码@127.0.0.1:5432/gearsage" -c "select now(), current_database(), current_user;"
```

---

## 上传与静态资源

当前执行方案：

- 前端上传到 NestJS
- NestJS 将文件写入轻量对象存储挂载目录
- 业务上传目录：`/lhcos-data/gearsage`
- 资源对外访问基址：`https://static.gearsage.club/gearsage`

当前环境变量建议：

```bash
UPLOAD_DIR=/lhcos-data/gearsage
UPLOAD_BASE_URL=https://static.gearsage.club/gearsage
GEAR_EXCEL_DIR=/Users/tommy/GearSage/GearSage-client/rate/excel
```

兼容说明：

- 若未配置 `UPLOAD_BASE_URL`，开发态仍会回退为 `http://127.0.0.1:3001/uploads/*`
- `GEAR_EXCEL_DIR` 用于 P1 装备库第一版，默认读取客户端仓库中的 Excel 源数据
- `POST /upload/image` 当前会统一落到 `topic/` 目录
- `POST /upload/avatar` 落到 `avatar/` 目录
- `POST /upload/background` 落到 `background/` 目录

---

## 开发原则

1. 不直接在服务器上做主开发
2. 所有主要修改先在本地验证
3. 每次上线前必须先本地测试
4. 每次上线后必须 curl 验证
5. 任何服务器配置变更都要回写施工记录文档

---

## 后续优先级

当前建议优先开发：

1. 评论模块
2. 鉴权模块
3. 用户模块
4. 上传模块收口
5. 非 P0 云开发残留清理
6. 前端逐页切标签 / 商城 / 任务接口

---

## 文档约定

当前项目建议同时维护以下文档：

- 《独立后台迁移计划（设计 + 施工记录 + 标准流程）》
- 《GearSage 后端架构设计文档》

前者偏施工与当前真实状态，后者偏长期架构设计。

README 只负责告诉开发者如何运行、如何发布、如何协作。
