# GearSage 我的装备功能 PRD v1

版本：v1.0  
状态：可直接交给 Codex 进入实现拆分  
适用范围：GearSage-client / GearSage-api / PostgreSQL / 小程序“我的”页 / 装备库 / 他人主页 / 求推荐发布页  
建议存放路径：`docs/GearSage_我的装备_PRD_v1.md`  
更新时间：2026-05-14

---

## 2026-05-15 展示控制变更覆盖说明

本 PRD 中关于「单件装备公开 / 私密」「他人主页展示公开装备」「`GET /mini/user/gear?userId=:id` 查询他人公开装备」的口径，已由 `docs/GearSage_我的装备_我的搭配_展示控制需求变更_v1.md` 覆盖。

当前执行口径：

1. 第一版取消单件装备公开 / 私密开关。
2. 我的装备只作为当前用户个人管理区，不直接展示到他人主页。
3. `user_gear_items.is_public` 若已落地，仅保留为 deprecated 兼容字段，新逻辑不得依赖它做主页展示判断。
4. 他人主页只展示用户主动选择「展示到主页」且状态正常的代表搭配，最多 3 套。
5. 求推荐发布页仍可从我的装备选择当前已有装备，不受主页展示状态影响。

除以上展示控制口径外，装备库添加、个人管理、重复添加拦截、软删除、求推荐复用等主干设计继续有效。

## 一、文档目标

本文档用于定义 GearSage 新增 **我的装备** 功能的第一版可落地方案，并同时明确：

1. 产品定位与边界
2. 用户可添加的装备类型与字段
3. 小程序前端入口、页面结构和交互规则
4. 后端数据库表、接口、DTO 与返回结构
5. 与装备库、他人主页、求推荐发布页的联动方式
6. Codex / 后端 / 前端的实施顺序和验收标准

本文档不是“收藏夹”方案，也不是“装备炫耀墙”方案。第一版核心目标是：

> 用户可以从装备库把自己真实拥有或常用的装备添加到个人装备档案，并在自己的页面管理、在他人主页有限展示、在求推荐发布时作为上下文复用。

---

## 二、当前基线与设计约束

### 2.1 当前已经存在的能力

当前项目已经具备以下能力，本功能必须复用，不要重做：

#### A. 装备库

当前装备库第一版已接入独立后台，前端主要页面包括：

- `pkgGear/pages/list/list.js`
- `pkgGear/pages/detail/detail.js`
- `pkgGear/pages/compare/compare.js`

当前已存在接口：

- `GET /mini/gear/brands?type=reels|rods|lures`
- `GET /mini/gear/list`
- `GET /mini/gear/detail`

当前装备库统一表结构为：

- `gear_brands`
- `gear_master`
- `gear_variants`

装备库当前应继续优先读取 PostgreSQL，不要回退到微信云开发。

#### B. 用户与他人主页

当前已有：

- `GET /auth/me`
- `GET /mini/user/info?id=:id`
- `POST /mini/user/update`

当前他人主页已经作为独立页面存在，页面路径口径为：

- `pkgContent/user-profile/user-profile.*`

他人主页定位是帮助用户判断对方经验画像与可信度，不是泛社交主页。

#### C. 求推荐

当前求推荐继续挂在 `讨论&提问` 下，核心口径：

- `questionType = recommend`
- `recommendMeta` 作为 topic 增量 JSON 字段
- `recommendMeta.currentGear`
- `recommendMeta.candidateOptions`

当前求推荐发布继续复用：

- `PUT /mini/topic`
- `POST /mini/topic`

### 2.2 本功能必须遵守的约束

1. 不推翻当前 `/mini/gear/*`、`/mini/user/*`、`/mini/topic*` 主链路。
2. 不重做装备库搜索、列表和详情接口。
3. 不把“我的装备”做成泛社交装备墙。
4. 不做自动推荐算法。
5. 不做装备交易、估价、二手买卖。
6. 不在第一版做复杂评分、点赞、评论、鱼获绑定。
7. 第一版只做增量表、增量接口、增量页面。
8. 新增接口继续使用统一返回结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

---

## 三、产品定位

### 3.1 功能名

建议功能名：

> 我的装备

不建议叫：

- 装备收藏
- 装备墙
- 战备库
- 炫装备

原因：

- “收藏”容易和“我感兴趣但没买”混淆。
- “装备墙”会把产品导向炫耀和泛社交。
- “我的装备”最直接，既能表达拥有，也能承接后续求推荐上下文。

### 3.2 一句话定位

> 我的装备是用户从 GearSage 装备库认领 / 添加自己真实拥有或常用装备的个人档案。

### 3.3 第一版核心价值

#### A. 个人资料补强

用户主页不仅显示头像、昵称、简介和标签，还能显示“这个人平时用什么装备”。这比粉丝数更适合 GearSage。

#### B. 求推荐提效

用户发求推荐时，可以从“我的装备”里选择当前已有装备，自动填入 `recommendMeta.currentGear` 或 `recommendMeta.currentGearItems`，减少重复手写。

#### C. 装备库反向活跃

装备库不只是查参数，也可以变成用户个人经验资产的入口。用户在装备详情页看到某个装备，可以直接点击“加入我的装备”。

---

## 四、第一版范围

### 4.1 第一版支持的装备类型

第一版只支持三类：

| 中文 | 内部值 | 装备库 type 建议映射 |
|---|---|---|
| 鱼轮 | `reel` | `reels` / `reel` |
| 鱼竿 | `rod` | `rods` / `rod` |
| 常用饵 | `lure` | `lures` / `lure` |

说明：

- 后端统一存 `reel / rod / lure`。
- 调装备库列表 / 品牌接口时，如现有接口需要 `reels / rods / lures`，由 service 做映射。
- 第一版不要做鱼线、钩子、配件、钓箱、穿搭。

### 4.2 第一版必须支持

1. “我的”页出现 `我的装备` 入口卡片。
2. 用户可以进入“我的装备”管理页。
3. 用户可以按 `鱼轮 / 鱼竿 / 常用饵` 分类查看自己的装备。
4. 用户可以从装备库搜索并添加装备。
5. 用户可以从装备详情页点击 `加入我的装备`。
6. 用户可以选择具体子型号 / SKU / variant。
7. 用户可以编辑：
   - 使用状态
   - 是否公开
   - 备注
   - 排序
8. 用户可以删除自己的装备。
9. 自己查看时展示公开 + 私密装备。
10. 他人查看时只展示公开装备。
11. 求推荐发布页可以从“我的装备”选择当前已有装备。

### 4.3 第一版明确不做

1. 装备评分。
2. 装备点赞。
3. 装备评论。
4. 装备交易。
5. 装备估价。
6. 装备鱼获绑定。
7. 装备使用时长统计。
8. 装备自动推荐。
9. 根据装备判断用户水平。
10. 复杂隐私分组。
11. 公开装备墙瀑布流。
12. 装备图片二次上传。
13. 用户自建装备库主数据。

---

## 五、用户故事

### 5.1 自己管理装备

作为登录用户，我希望能在“我的”页面看到“我的装备”，并能维护我的鱼轮、鱼竿和常用饵。

验收：

- 登录后可进入“我的装备”。
- 可查看三个分类。
- 分类数量准确。
- 空状态有明确引导。

### 5.2 从装备库添加装备

作为用户，我希望在装备库详情页看到“加入我的装备”，点一下即可把当前装备加入自己的装备档案。

验收：

- 装备详情页有入口。
- 如果当前装备有多个变体，要求选择具体 SKU 后再保存。
- 保存后按钮状态变为“已加入”或提示“已加入我的装备”。

### 5.3 搜索添加装备

作为用户，我希望在“我的装备”页直接搜索装备库，然后添加到自己的装备。

验收：

- 可以搜索装备库。
- 可以选择分类、品牌、装备、子型号。
- 保存成功后回到对应分类列表。

### 5.4 他人主页展示公开装备

作为浏览者，我希望在他人主页看到对方公开的常用装备，帮助我判断这个人是什么类型的玩家。

验收：

- 他人主页只展示 `isPublic = true` 的装备。
- 不展示用户设为私密的装备。
- 没有公开装备时不强行展示空模块。

### 5.5 求推荐复用已有装备

作为发求推荐的用户，我希望从“我的装备”里选当前已有装备，自动带入求推荐上下文。

验收：

- 求推荐发布页可以选择“从我的装备选择”。
- 选中后可生成 `recommendMeta.currentGear` 或 `recommendMeta.currentGearItems`。
- 不影响现有手动输入 currentGear。

---

## 六、页面与交互设计

## 6.1 “我的”页入口

### 入口位置

建议放在当前普通用户菜单区中，优先放在：

```text
我的发布
我的装备
编辑标签
编辑个人信息
主题颜色
关于
退出登录
```

### 卡片展示

建议展示：

```text
我的装备
鱼轮 2｜鱼竿 3｜常用饵 8
查看 / 编辑
```

### 空状态

如果用户还没有添加装备：

```text
还没有添加装备
从装备库添加你正在用的鱼轮、鱼竿和常用饵
[去添加]
```

---

## 6.2 我的装备页

### 建议路径

```text
pkgContent/my-gear/my-gear.*
```

### 页面结构

```text
顶部：我的装备
统计：鱼轮 X｜鱼竿 Y｜常用饵 Z
Tab：鱼轮 / 鱼竿 / 常用饵
列表：装备卡片
底部或右上角：添加装备
```

### 装备卡片字段

第一版卡片建议展示：

- 装备图片
- 展示名称
- 品牌名
- 子型号 / SKU
- 使用状态
- 公开状态
- 备注首行
- 编辑入口

示例：

```text
C6IM 702M
鱼竿｜常用｜公开
备注：野河翘嘴常用
```

---

## 6.3 添加装备页 / 弹层

### 建议路径

```text
pkgContent/my-gear-edit/my-gear-edit.*
```

也可以第一版先做成 `my-gear` 内的弹层，但更建议独立页面，后续编辑更清楚。

### 添加流程

```text
选择分类
→ 搜索装备库
→ 选择装备主型号
→ 选择具体子型号 / SKU
→ 填写状态 / 备注 / 是否公开
→ 保存
```

### 表单字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `gearType` | 是 | `reel / rod / lure` |
| `gearMasterId` | 是 | 关联 `gear_master.id` |
| `gearVariantId` | 否 | 如果有稳定 variant id，则保存 |
| `variantKey` | 否 | 当前对比池也用该口径，可兼容 |
| `variantLabel` | 否 | SKU / 子型号展示名 |
| `displayName` | 是 | 默认由品牌 + 型号 + SKU 生成，可编辑 |
| `usageStatus` | 是 | 常用 / 备用 / 已闲置 |
| `isPublic` | 是 | 是否展示到他人主页 |
| `note` | 否 | 用户备注 |

### 使用状态枚举

| 中文 | 内部值 | 说明 |
|---|---|---|
| 常用 | `frequent` | 当前经常使用 |
| 备用 | `backup` | 偶尔使用或备用 |
| 已闲置 | `idle` | 已经不常用，但仍拥有 |

第一版不做“已售出 / 想买 / 候选”。

---

## 6.4 装备详情页入口

### 入口位置

建议放在装备详情页 CTA 区域，与已有“去求推荐”区分：

```text
[加入我的装备]
[看完参数还是纠结？去求推荐]
```

如果当前装备已添加：

```text
[已加入我的装备]
```

点击已加入按钮时可以进入对应编辑页。

### 行为规则

1. 用户未登录：跳转登录。
2. 用户已登录但未选具体 SKU：如果该装备有多个变体，先要求选择 SKU。
3. 已添加相同 `gearMasterId + variantKey`：不重复添加，提示“已在我的装备中”。
4. 添加成功：toast 提示，并更新按钮状态。

---

## 6.5 他人主页展示

### 展示位置

建议放在他人主页“基础信息 + 统计信息”之后，“最近内容”之前。

### 模块标题

```text
常用装备
```

### 展示规则

1. 只展示 `isPublic = true`。
2. 每类最多展示 3 条。
3. 优先展示 `usageStatus = frequent`。
4. 再按 `sortOrder`、`updateTime` 排序。
5. 没有公开装备时不展示该模块。

### 展示样式

```text
常用装备
鱼轮：阿德 BRF、Vanquish C3000
鱼竿：C6IM 702M
常用饵：X-80、VIB 10g、软虫
```

第一版不要做瀑布流。

---

## 6.6 求推荐发布页联动

### 入口

在求推荐发布页的“当前已有装备”字段下增加：

```text
[从我的装备选择]
```

### 选择方式

弹出选择页或底部弹层：

```text
鱼轮 / 鱼竿 / 常用饵
多选，最多 5 件
```

### 写入字段

为了兼容现有 `recommendMeta.currentGear` 字符串，第一版建议同时支持两种方式：

```json
{
  "recommendMeta": {
    "currentGear": "C6IM 702M + 阿德 BRF，常用 X-80 / VIB",
    "currentGearItems": [
      {
        "userGearItemId": 1,
        "gearType": "rod",
        "gearMasterId": "ROD1000",
        "gearVariantId": "RODVAR1000",
        "variantKey": "702M",
        "label": "C6IM 702M",
        "source": "user_gear"
      },
      {
        "userGearItemId": 2,
        "gearType": "reel",
        "gearMasterId": "REEL1000",
        "variantKey": "BRF",
        "label": "阿德 BRF",
        "source": "user_gear"
      }
    ]
  }
}
```

说明：

- `currentGear` 继续用于旧 UI 与摘要展示。
- `currentGearItems` 用于后续结构化能力。
- 第一版不要求后端为 `currentGearItems` 拆独立列，可继续随 `recommendMeta` JSON 存储。

---

## 七、后端设计

## 7.1 新增模块建议

在 `GearSage-api` 中新增：

```text
src/modules/user-gear/
  user-gear.controller.ts
  user-gear.service.ts
  dto/
    create-user-gear.dto.ts
    update-user-gear.dto.ts
    list-user-gear.dto.ts
```

并在 `app.module.ts` 中注册 controller / provider。

模块名建议使用 `user-gear`，不要放进 `gear` 模块里。原因：

- `gear` 模块负责官方装备主数据。
- `user-gear` 模块负责用户与装备主数据之间的关系。
- 两者生命周期不同，权限规则也不同。

---

## 7.2 新增数据表

### 表名

```sql
user_gear_items
```

### 建表 SQL 建议

> 注意：请 Codex 先检查当前 `bz_mini_user.id`、`gear_master.id`、`gear_variants.id` 的真实类型。下面以 PostgreSQL 常见写法给出。若现有 id 类型不同，必须按现有表结构调整，不允许强行改旧表主键。

```sql
CREATE TABLE IF NOT EXISTS user_gear_items (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,

  gear_type VARCHAR(20) NOT NULL,
  gear_master_id VARCHAR(64) NOT NULL,
  gear_variant_id VARCHAR(64),
  variant_key VARCHAR(128),
  variant_label VARCHAR(255),

  display_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(120),
  gear_model VARCHAR(255),
  image_url TEXT,

  ownership_status VARCHAR(20) NOT NULL DEFAULT 'owned',
  usage_status VARCHAR(20) NOT NULL DEFAULT 'frequent',
  note TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,

  extra JSONB NOT NULL DEFAULT '{}'::jsonb,

  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delete_time TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT chk_user_gear_type CHECK (gear_type IN ('reel', 'rod', 'lure')),
  CONSTRAINT chk_user_gear_ownership CHECK (ownership_status IN ('owned')),
  CONSTRAINT chk_user_gear_usage CHECK (usage_status IN ('frequent', 'backup', 'idle'))
);
```

### 唯一约束

建议用部分唯一索引，避免软删除后无法重新添加：

```sql
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_gear_active_unique
ON user_gear_items (
  user_id,
  gear_type,
  gear_master_id,
  COALESCE(variant_key, '')
)
WHERE is_deleted = FALSE;
```

### 查询索引

```sql
CREATE INDEX IF NOT EXISTS idx_user_gear_user_type
ON user_gear_items (user_id, gear_type, is_deleted, sort_order, update_time DESC);

CREATE INDEX IF NOT EXISTS idx_user_gear_public_user
ON user_gear_items (user_id, is_public, is_deleted, gear_type, sort_order);

CREATE INDEX IF NOT EXISTS idx_user_gear_master
ON user_gear_items (gear_master_id, gear_type, is_deleted);
```

---

## 7.3 字段说明

| 字段 | 说明 |
|---|---|
| `user_id` | 当前登录用户 ID |
| `gear_type` | `reel / rod / lure` |
| `gear_master_id` | 关联 `gear_master.id` |
| `gear_variant_id` | 关联 `gear_variants.id`，若现有接口无法稳定给出，可为空 |
| `variant_key` | 当前前端对比池已有类似口径，用于兼容 SKU 定位 |
| `variant_label` | 面向用户展示的 SKU / 子型号名 |
| `display_name` | 用户侧展示名，默认自动生成，允许用户编辑 |
| `brand_name` | 品牌名快照，便于列表展示 |
| `gear_model` | 型号名快照，便于列表展示 |
| `image_url` | 装备图快照 |
| `ownership_status` | 第一版固定为 `owned` |
| `usage_status` | `frequent / backup / idle` |
| `note` | 用户备注 |
| `is_public` | 是否展示到他人主页 |
| `sort_order` | 用户自定义排序 |
| `extra` | 后续扩展 JSON |
| `is_deleted` | 软删除 |

---

## 7.4 新增接口

### 7.4.1 查询我的装备

```text
GET /mini/user/gear
```

#### Query

| 字段 | 必填 | 说明 |
|---|---|---|
| `gearType` | 否 | `reel / rod / lure` |
| `userId` | 否 | 不传则查当前登录用户；传入则查指定用户公开装备 |
| `includePrivate` | 否 | 仅查自己时可用，默认 true |

#### 行为

- 不传 `userId`：查当前登录用户，返回公开 + 私密。
- 传 `userId = 当前登录用户`：返回公开 + 私密。
- 传 `userId != 当前登录用户`：只返回 `is_public = true`。
- 未登录访问他人公开装备：第一版可允许；如果现有鉴权中间件不方便，也可要求登录，但不要返回私密装备。

#### 返回示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "summary": {
      "reel": 2,
      "rod": 1,
      "lure": 4,
      "total": 7
    },
    "items": [
      {
        "id": 1,
        "gearType": "reel",
        "gearMasterId": "SRE1000",
        "gearVariantId": "SRED10000",
        "variantKey": "C3000SDH",
        "variantLabel": "C3000SDH",
        "displayName": "STELLA C3000SDH",
        "brandName": "Shimano",
        "gearModel": "STELLA",
        "imageUrl": "https://static.gearsage.club/...",
        "usageStatus": "frequent",
        "usageStatusText": "常用",
        "note": "野河翘嘴常用",
        "isPublic": true,
        "sortOrder": 0,
        "createTime": "2026-05-14T00:00:00.000Z",
        "updateTime": "2026-05-14T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 7.4.2 添加我的装备

```text
POST /mini/user/gear
```

#### Body

```json
{
  "gearType": "reel",
  "gearMasterId": "SRE1000",
  "gearVariantId": "SRED10000",
  "variantKey": "C3000SDH",
  "variantLabel": "C3000SDH",
  "displayName": "STELLA C3000SDH",
  "usageStatus": "frequent",
  "isPublic": true,
  "note": "野河翘嘴常用"
}
```

#### 后端校验

1. 必须登录。
2. `gearType` 必须是 `reel / rod / lure`。
3. `gearMasterId` 必须能在 `gear_master` 查到。
4. 如果传 `gearVariantId` 或 `variantKey`，需要尽量校验属于该 `gearMasterId`。
5. 重复添加返回业务错误，不新增重复数据。

#### 重复添加错误建议

```json
{
  "code": 409,
  "message": "该装备已在我的装备中",
  "data": {
    "existingId": 1
  }
}
```

若当前全局错误包络不支持业务 code，可使用 HTTP 409 + 当前错误格式，但前端需要能展示可读提示。

---

### 7.4.3 更新我的装备

```text
PUT /mini/user/gear/:id
```

#### Body

```json
{
  "displayName": "C6IM 702M",
  "usageStatus": "backup",
  "isPublic": false,
  "note": "备用竿",
  "sortOrder": 10
}
```

#### 可更新字段

- `displayName`
- `usageStatus`
- `isPublic`
- `note`
- `sortOrder`

不允许通过 update 改：

- `userId`
- `gearType`
- `gearMasterId`
- `gearVariantId`
- `variantKey`

如需换装备，删除后重新添加。

---

### 7.4.4 删除我的装备

```text
DELETE /mini/user/gear/:id
```

行为：

- 必须登录。
- 只能删除自己的装备。
- 软删除：`is_deleted = true`，写入 `delete_time`。

返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": true
}
```

---

### 7.4.5 批量排序

第一版可选。如果前端不做拖拽排序，可以先不做。

```text
POST /mini/user/gear/sort
```

Body：

```json
{
  "items": [
    { "id": 1, "sortOrder": 10 },
    { "id": 2, "sortOrder": 20 }
  ]
}
```

---

## 7.5 是否并入 `GET /mini/user/info`

第一版建议：

- 不把完整装备列表并入 `GET /mini/user/info`。
- 可以在 `GET /mini/user/info` 中只增加一个轻量摘要。

建议字段：

```json
{
  "gearSummary": {
    "reel": 2,
    "rod": 3,
    "lure": 8,
    "publicTotal": 6
  }
}
```

他人主页需要展示装备时，再调用：

```text
GET /mini/user/gear?userId=:id
```

原因：

- 装备列表是列表资源，后续可能分页、排序、分类。
- `GET /mini/user/info` 已经承载资料、统计、最近内容，继续塞完整装备会变重。

---

## 八、前端改造点

## 8.1 services/api.js

建议新增方法：

```js
getUserGear(params)
createUserGear(data)
updateUserGear(id, data)
deleteUserGear(id)
sortUserGear(items)
```

如果当前项目已有业务 service 分层，也可以新增：

```text
services/userGear.js
```

但不要绕开统一鉴权与 refresh 逻辑。

---

## 8.2 pages/profile/profile.*

新增入口：

```text
我的装备
```

展示摘要：

- 鱼轮数量
- 鱼竿数量
- 常用饵数量

页面加载时可调用：

```text
GET /mini/user/gear
```

也可以只调用 `GET /auth/me` + `gearSummary`，取决于后端是否顺手把摘要并入当前用户信息。

---

## 8.3 pkgContent/my-gear/*

新增页面：

```text
pkgContent/my-gear/my-gear.js
pkgContent/my-gear/my-gear.wxml
pkgContent/my-gear/my-gear.wxss
pkgContent/my-gear/my-gear.json
```

功能：

- 读取装备列表
- Tab 分类
- 添加入口
- 编辑入口
- 删除
- 修改公开 / 私密
- 空状态

---

## 8.4 pkgContent/my-gear-edit/*

新增页面：

```text
pkgContent/my-gear-edit/my-gear-edit.js
pkgContent/my-gear-edit/my-gear-edit.wxml
pkgContent/my-gear-edit/my-gear-edit.wxss
pkgContent/my-gear-edit/my-gear-edit.json
```

支持模式：

- `mode=create`
- `mode=edit`

### create 支持来源

```text
from=my_gear
from=gear_detail
```

从装备详情进入时，URL 可带：

```text
gearType=reel
gearMasterId=SRE1000
variantKey=C3000SDH
variantLabel=C3000SDH
```

如果参数不足，则在编辑页内继续补齐选择。

---

## 8.5 pkgGear/pages/detail/detail.*

新增按钮：

```text
加入我的装备
```

按钮状态：

- 未登录：`加入我的装备`
- 已登录未加入：`加入我的装备`
- 已加入：`已加入我的装备`

为了判断已加入，可以在详情页加载后调用：

```text
GET /mini/user/gear?gearType=reel
```

前端本地判断当前 `gearMasterId + variantKey` 是否已存在。

也可以后端后续提供轻量接口：

```text
GET /mini/user/gear/check?gearType=&gearMasterId=&variantKey=
```

但第一版不建议新增过多接口，先用列表判断即可。

---

## 8.6 pkgContent/user-profile/user-profile.*

他人主页增加 `常用装备` 模块。

请求：

```text
GET /mini/user/gear?userId=:id
```

展示规则：

- 每类最多 3 条。
- 只展示公开装备。
- 无公开装备则不展示模块。

---

## 8.7 求推荐发布组件

涉及可能文件：

- `pkgContent/publishMode/publishMode.js`
- `components/post-Question/post-Question.js`
- 相关 WXML / WXSS

在 `currentGear` 字段旁增加：

```text
从我的装备选择
```

选中后：

1. 自动生成 `recommendMeta.currentGear` 文案。
2. 同时写入 `recommendMeta.currentGearItems` 数组。
3. 用户仍可手动编辑 `currentGear` 文案。

---

## 九、数据映射规则

## 9.1 gearType 映射

| 用户装备内部值 | 装备库接口 type | 中文显示 |
|---|---|---|
| `reel` | `reels` | 鱼轮 |
| `rod` | `rods` | 鱼竿 |
| `lure` | `lures` | 常用饵 |

后端 service 内建议封装：

```ts
function toGearApiType(gearType: 'reel' | 'rod' | 'lure') {
  return {
    reel: 'reels',
    rod: 'rods',
    lure: 'lures',
  }[gearType];
}
```

## 9.2 displayName 生成规则

优先级：

1. 用户手动输入。
2. `brandName + gearModel + variantLabel`。
3. `gearModel + variantLabel`。
4. 装备库主记录 name / model。

示例：

```text
Shimano STELLA C3000SDH
C6IM 702M
Megabass X-80 SW
```

## 9.3 常用饵的展示

虽然内部类型叫 `lure`，用户侧建议显示为：

```text
常用饵
```

原因：

- “我的路亚饵”听起来偏库表。
- “常用饵”更贴近用户表达，也更适合主页展示。

---

## 十、权限与隐私规则

### 10.1 自己查看

自己查看自己的装备时：

- 展示公开装备。
- 展示私密装备。
- 可编辑。
- 可删除。

### 10.2 他人查看

他人查看用户装备时：

- 只展示公开装备。
- 不返回私密装备。
- 不展示编辑入口。
- 不展示删除入口。

### 10.3 未登录访问

第一版可以任选一种：

方案 A：允许未登录访问公开装备。  
方案 B：要求登录后访问。

建议方案 A，但如果当前鉴权中间件更容易实现方案 B，可先按方案 B 实施。无论哪种方案，都不能泄露私密装备。

---

## 十一、异常与边界情况

### 11.1 添加重复装备

判断口径：

```text
userId + gearType + gearMasterId + variantKey + isDeleted=false
```

行为：

- 不重复插入。
- 返回可读提示。
- 前端 toast：`这件装备已经在我的装备里了`。

### 11.2 装备主数据不存在

如果 `gearMasterId` 查不到：

- 返回 404。
- 前端提示：`装备不存在或已下架`。

### 11.3 variant 不存在

如果有 `variantKey` 但查不到：

- 第一版可允许保存，但要把 `variantLabel` 作为快照。
- 更严格方案是返回错误。

建议第一版：

- 如果 `gearMasterId` 存在，variant 校验失败时允许保存，但在 `extra.variantCheckStatus = "unmatched"` 中留痕。

原因：

- 当前装备库 variant 字段口径仍可能随导入链调整。
- 不应因为 SKU 小字段变化阻断用户添加。

### 11.4 装备库数据更新后

用户装备保存的是关系 + 展示快照。

展示时：

1. 优先用当前 `gear_master / gear_variants` 最新数据补齐图片、品牌、型号。
2. 如果装备库查不到，则回退用户装备表里的快照字段。
3. 回退展示时可不做特殊提示。

### 11.5 删除逻辑

删除只软删，不物理删除。后续如果要统计用户装备变化历史，可保留基础数据。

---

## 十二、与求推荐的关系

### 12.1 当前已有关系

当前求推荐已有：

- `recommendMeta.currentGear`
- `recommendMeta.candidateOptions`

“我的装备”第一版应主要服务 `currentGear`，不是 `candidateOptions`。

### 12.2 使用场景区别

| 字段 | 含义 | 来源 |
|---|---|---|
| `currentGear` | 我现在已经有什么 | 我的装备 / 手动输入 |
| `candidateOptions` | 我正在纠结买什么 | 装备详情 / 对比页 / 手动输入 |

### 12.3 推荐写入方式

从“我的装备”选择已有装备：

```json
{
  "currentGear": "C6IM 702M + 阿德 BRF，常用 X-80 / VIB",
  "currentGearItems": [
    { "userGearItemId": 1, "label": "C6IM 702M", "source": "user_gear" },
    { "userGearItemId": 2, "label": "阿德 BRF", "source": "user_gear" }
  ]
}
```

从装备详情 / 对比页进入求推荐：

```json
{
  "candidateOptions": [
    { "gearItemId": "SRE1000", "label": "STELLA C3000SDH", "source": "gear_library" }
  ]
}
```

不要混淆这两个字段。

---

## 十三、实施顺序建议

## 第一刀：后端表与接口

### 后端

1. 新增 `user_gear_items` 表。
2. 新增 `user-gear` service / controller / DTO。
3. 实现：
   - `GET /mini/user/gear`
   - `POST /mini/user/gear`
   - `PUT /mini/user/gear/:id`
   - `DELETE /mini/user/gear/:id`
4. 添加基础校验与权限控制。
5. 加入接口 smoke test。

### 验收

- 登录用户可添加装备。
- 登录用户可查询自己的装备。
- 用户不能编辑 / 删除别人的装备。
- 他人只能看到公开装备。

---

## 第二刀：我的页入口 + 我的装备管理页

### 前端

1. `profile` 增加“我的装备”入口。
2. 新增 `pkgContent/my-gear/*`。
3. 新增 `pkgContent/my-gear-edit/*`。
4. 实现列表、添加、编辑、删除。

### 验收

- 我的页可以进入。
- 三个 Tab 正常显示。
- 空状态正常。
- 添加后数量更新。
- 删除后列表更新。

---

## 第三刀：装备详情页加入我的装备

### 前端

1. `pkgGear/pages/detail/detail.*` 增加按钮。
2. 复用当前选中 variant。
3. 调 `POST /mini/user/gear`。
4. 已添加状态展示。

### 验收

- 在装备详情页可加入。
- 重复添加有提示。
- 多 SKU 装备必须带上当前选择。

---

## 第四刀：他人主页展示常用装备

### 前端

1. `pkgContent/user-profile/user-profile.*` 调 `GET /mini/user/gear?userId=:id`。
2. 增加“常用装备”模块。
3. 只展示公开装备。

### 后端

1. 确认公开过滤。
2. 可选：`GET /mini/user/info` 增加 `gearSummary`。

### 验收

- 他人主页看到公开装备。
- 私密装备不泄露。
- 没有公开装备时不展示模块。

---

## 第五刀：求推荐发布页选择我的装备

### 前端

1. 求推荐发布页 `currentGear` 增加“从我的装备选择”。
2. 支持多选。
3. 写入 `recommendMeta.currentGear` 和 `recommendMeta.currentGearItems`。

### 后端

- 无需新增求推荐接口。
- 继续随 `recommendMeta` 保存。

### 验收

- 用户可以选择已有装备。
- 发布后详情页能看到当前已有装备文案。
- 不影响手动填写。

---

## 十四、Smoke Test 清单

### 14.1 后端接口

1. 登录。
2. `GET /mini/user/gear` 返回空列表。
3. `POST /mini/user/gear` 添加鱼轮。
4. 再次 `GET /mini/user/gear` 返回 1 条。
5. 重复 `POST /mini/user/gear` 返回重复提示。
6. `PUT /mini/user/gear/:id` 修改备注、状态、公开性。
7. `GET /mini/user/gear?userId=:id` 他人视角只返回公开项。
8. `DELETE /mini/user/gear/:id` 删除。
9. 删除后再次添加同一装备成功。

### 14.2 小程序前端

1. 我的页看到“我的装备”。
2. 进入我的装备页。
3. 添加一件鱼轮。
4. 添加一根鱼竿。
5. 添加一个常用饵。
6. 编辑备注。
7. 设置某件装备为私密。
8. 他人主页只展示公开装备。
9. 装备详情页点击“加入我的装备”。
10. 求推荐发布页从我的装备选择当前已有装备。

---

## 十五、验收清单

### 15.1 产品验收

- [ ] 用户知道这个功能是“我拥有 / 常用的装备”，不是收藏。
- [ ] 用户可以低成本添加装备。
- [ ] 用户可以控制公开 / 私密。
- [ ] 他人主页展示克制，不像装备炫耀墙。
- [ ] 求推荐能复用当前已有装备。

### 15.2 后端验收

- [ ] `user_gear_items` 表已创建。
- [ ] 唯一索引防止重复添加。
- [ ] 查询自己返回公开 + 私密。
- [ ] 查询别人只返回公开。
- [ ] 更新 / 删除必须校验归属。
- [ ] 接口返回结构符合 `{ code, message, data }`。
- [ ] `npm run build` 通过。
- [ ] 本地 smoke test 通过。

### 15.3 前端验收

- [ ] 我的页入口完成。
- [ ] 我的装备页完成。
- [ ] 添加 / 编辑页完成。
- [ ] 装备详情页加入入口完成。
- [ ] 他人主页常用装备模块完成。
- [ ] 求推荐发布页选择我的装备完成。
- [ ] 登录态失效时走现有 refresh / login 流程。
- [ ] 空状态、重复添加、删除确认都有可读提示。

### 15.4 文档回写

实现完成后需更新：

- `小程序页面切接口清单.md`
- `独立后台迁移计划_施工记录版.md`
- 对应 P 阶段任务单 / 验收清单

如果求推荐发布页接入了 `currentGearItems`，同步补充：

- `GearSage_求推荐模块_PRD_v1.md`

---

## 十六、给 Codex 的执行提示

请 Codex 严格按以下原则施工：

1. 先读当前项目文档，确认现有 NestJS 结构、数据库 service、鉴权 guard 和接口返回格式。
2. 不要修改现有 `/mini/gear/*` 接口路径。
3. 不要重写装备库主数据表。
4. 新增 `user_gear_items` 表，不要把用户装备塞进 `bz_mini_user` JSON 字段。
5. 新增 `user-gear` 模块，职责是用户装备关系，不是装备主数据。
6. 所有写操作必须登录。
7. 查询他人装备必须过滤 `is_public = true`。
8. 第一版只支持 `reel / rod / lure`。
9. 第一版不做点赞、评论、评分、交易、估价、鱼获绑定。
10. 实现后必须跑：
    - `npm run build`
    - 本地接口 smoke test
    - 小程序页面最短路径验证
11. 新增接口和页面必须回写文档。

---

## 十七、一句话收束

“我的装备”第一版不是为了做热闹的装备墙，而是让用户把装备库里的真实装备认领成个人档案，并让这个档案服务主页可信度和求推荐上下文。
