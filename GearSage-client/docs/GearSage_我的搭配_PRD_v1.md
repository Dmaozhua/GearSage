# GearSage 我的搭配 PRD v1

版本：v1.0  
状态：可直接交给 Codex 进入实现拆分  
适用范围：GearSage-client / GearSage-api / PostgreSQL / 小程序「我的装备」/ 他人主页 / 求推荐发布页  
建议路径：`docs/GearSage_我的搭配_PRD_v1.md`  
更新时间：2026-05-14

---

## 一、文档目标

本文档用于在《GearSage_我的装备_PRD_v1.md》基础上，继续扩展装备库个人侧能力：新增 **「我的搭配」**。

前一版「我的装备」解决的是：

> 用户可以把装备库里的鱼竿、渔轮、鱼饵添加到自己的个人装备档案中。

本功能继续解决下一层问题：

> 用户可以把自己已添加的鱼竿、渔轮、鱼饵组合成真实使用中的常用搭配，并用于个人主页展示、求推荐上下文和后续内容关联。

核心判断：

- 「我的装备」是零件库。
- 「我的搭配」是使用方式。
- GearSage 真正需要沉淀的不是“我有多少装备”，而是“我怎么搭、在哪用、钓什么、别人能不能参考我”。

---

## 二、当前基线与必须遵守的约束

### 2.1 已有基础能力

当前 GearSage 已有以下基础链路，本文档不推翻、不重做：

#### 装备库接口

```text
GET /mini/gear/brands
GET /mini/gear/list
GET /mini/gear/detail
```

#### 我的装备接口

来源：《GearSage_我的装备_PRD_v1.md》

```text
GET    /mini/user/gear
POST   /mini/user/gear
PUT    /mini/user/gear/:id
DELETE /mini/user/gear/:id
```

#### 用户与他人主页接口

```text
GET /auth/me
GET /mini/user/info?id=:id
```

#### 求推荐主链路

```text
PUT  /mini/topic
POST /mini/topic
GET  /mini/topic
GET  /mini/topic/all
```

求推荐继续使用：

```text
questionType = recommend
recommendMeta = JSON object
```

### 2.2 必须遵守的实现约束

1. 不重写 `/mini/gear/*`。
2. 不重写 `/mini/topic*`。
3. 不重写 `/mini/user/info` 主链路。
4. 不回退微信云开发 / `wx.cloud`。
5. 不把「我的搭配」做成装备墙、排行榜、炫耀系统。
6. 不做自动推荐算法。
7. 不做“AI 替你选”。
8. 不做交易、估价、装备评分、点赞、评论。
9. 继续采用统一返回结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

---

## 三、产品定位

### 3.1 功能名称

正式名称建议：

```text
我的搭配
```

不建议叫：

```text
装备墙
我的套装墙
装备秀
装备仓库
```

原因：

- 「我的搭配」更轻。
- 不暗示炫耀。
- 不要求必须是一整套完整装备。
- 更接近钓鱼玩家真实表达方式。

### 3.2 一句话定义

> 用户可以从自己已添加的装备中，选择鱼竿、渔轮、鱼饵组合成常用搭配，并填写目标鱼、使用场景、备注和公开状态。

### 3.3 核心价值

#### 对用户自己

- 记录自己常用的竿轮饵组合。
- 发求推荐时不用反复手动输入当前装备。
- 后续发帖、长测评、求推荐反馈时可以复用。

#### 对其他用户

- 浏览他人主页时，更快判断这个人主要玩什么。
- 判断对方回答是否和自己场景相似。
- 比单纯看“他有多少装备”更有参考价值。

#### 对 GearSage

- 把装备库从“查参数”推进到“真实使用关系”。
- 把他人主页从“个人资料”推进到“经验画像”。
- 把求推荐从“文字描述”推进到“结构化上下文”。

---

## 四、第一版功能范围

## 4.1 本期必须做

### A. 用户可以新建一个搭配

用户从「我的装备」进入「我的搭配」，点击新增。

最低字段：

```text
搭配名称
鱼竿
渔轮
常用鱼饵
目标鱼
使用场景
备注
公开 / 私密
```

### B. 搭配只能选择自己已添加的装备

搭配内的鱼竿、渔轮、鱼饵必须来自当前用户的 `user_gear_items`。

不允许：

- 直接从装备库主表跳过「我的装备」加入搭配。
- 选择别人的 `user_gear_items`。
- 选择已经软删除的 `user_gear_items`。

原因：

- 「我的搭配」应该建立在用户个人装备档案之上。
- 这样求推荐、他人主页、未来发帖关联都能复用同一套用户装备关系。

### C. 每个搭配最多 1 根鱼竿

规则：

```text
rod <= 1
```

第一版不做一套多竿、多支备用竿。

### D. 每个搭配最多 1 个渔轮

规则：

```text
reel <= 1
```

第一版不做一套多轮、多备用轮。

### E. 每个搭配可以选择多个鱼饵

规则：

```text
lure <= 20
```

说明：

- 鱼饵不同于竿轮，天然是多选。
- 但第一版必须加上限，避免把一个搭配变成无限饵盒。
- 如果后续要做「我的饵盒」，应单独设计，不要把「我的搭配」做得过重。

### F. 可以填写搭配名称

字段：

```text
name
```

规则：

```text
2 ~ 30 个中文字符，或 2 ~ 60 个英文/数字字符
```

示例：

```text
野河翘嘴常用
城市河道轻饵
水库远投泛用
鲈鱼小饵搜索
```

### G. 可以填写目标鱼

字段：

```text
targetFish: string[]
```

规则：

```text
最多 3 个
```

建议预设：

```text
鲈鱼
翘嘴
鳜鱼
黑鱼
马口 / 溪流小型鱼
海鲈
综合泛用
其他
```

### H. 可以填写使用场景

字段：

```text
useScene: string[]
```

规则：

```text
最多 3 个
```

建议预设：

```text
野河
城市河道
水库
溪流
近海
黑坑 / 管理场
综合不固定
其他
```

### I. 可以填写备注

字段：

```text
note
```

规则：

```text
可选
最多 200 字
```

备注示例：

```text
5g~12g 小饵用得最多，主要打早晚窗口。
这套偏轻，风大时不太舒服。
野河翘嘴和小鲈鱼都能兼顾。
```

### J. 可以设置公开 / 私密

字段：

```text
isPublic: boolean
```

规则：

```text
自己查看：公开 + 私密都可见
别人查看：只返回公开搭配
```

### K. 他人主页展示公开搭配摘要

他人主页不展示完整装备仓库，只展示公开搭配摘要。

建议第一版最多展示：

```text
3 个公开搭配
```

每个卡片展示：

```text
搭配名称
鱼竿 + 渔轮
常用鱼饵前 3 个
目标鱼
使用场景
```

示例：

```text
常用搭配

野河翘嘴常用
C6IM 702M + 阿德 BRF
常用饵：X-80、VIB 7g、小铅笔
场景：野河 / 城市河道
目标鱼：翘嘴 / 鲈鱼
```

### L. 求推荐发布页可以从「我的搭配」选择当前已有装备

求推荐发布页的 `currentGear` 来源增加：

```text
从我的装备选择
从我的搭配选择
```

选择某个搭配后，写入 `recommendMeta`：

```json
{
  "currentGear": "野河翘嘴常用：C6IM 702M + 阿德 BRF；常用饵：X-80、VIB 7g、小铅笔",
  "currentGearSet": {
    "userGearSetId": 1,
    "name": "野河翘嘴常用",
    "targetFish": ["翘嘴", "鲈鱼"],
    "useScene": ["野河", "城市河道"],
    "items": [
      {
        "role": "rod",
        "userGearItemId": 101,
        "label": "C6IM 702M"
      },
      {
        "role": "reel",
        "userGearItemId": 102,
        "label": "阿德 BRF"
      },
      {
        "role": "lure",
        "userGearItemId": 201,
        "label": "X-80"
      }
    ],
    "source": "user_gear_set"
  },
  "currentGearItems": [
    {
      "userGearItemId": 101,
      "gearType": "rod",
      "label": "C6IM 702M",
      "source": "user_gear"
    },
    {
      "userGearItemId": 102,
      "gearType": "reel",
      "label": "阿德 BRF",
      "source": "user_gear"
    }
  ]
}
```

说明：

- `currentGear` 继续保留为可读文本，兼容现有求推荐展示。
- `currentGearSet` 用于结构化沉淀。
- `currentGearItems` 用于兼容前一版「我的装备」。

---

## 五、第一版明确不做

本期不做：

```text
鱼线管理
前导线管理
鱼钩管理
钓组管理
饵盒系统
装备搭配评分
自动判断搭配好坏
AI 推荐最佳搭配
装备墙瀑布流
装备搭配点赞 / 评论
装备搭配排行榜
装备交易 / 估价
购买凭证认证
复杂信誉分
```

原因：

- 当前目标是把「个人装备 -> 常用搭配 -> 主页展示 -> 求推荐上下文」跑通。
- 不要把第一版拖成装备社交平台或智能导购系统。

---

## 六、搭配兼容性规则

本期必须加入最基础的竿轮搭配限制。

### 6.1 术语定义

#### 鱼竿手柄类型

```text
spinning_rod = 直柄竿
casting_rod  = 枪柄竿
unknown      = 未识别
```

#### 渔轮类型

```text
spinning_reel    = 纺车轮
baitcasting_reel = 水滴轮
drum_reel        = 鼓轮
unknown          = 未识别
```

系统内部建议枚举：

```text
rodHandleType: spinning | casting | unknown
reelSubtype: spinning | baitcasting | drum | unknown
```

### 6.2 基础兼容规则

| 鱼竿 | 允许搭配 | 禁止搭配 |
|---|---|---|
| 直柄竿 | 纺车轮 | 水滴轮、鼓轮 |
| 枪柄竿 | 水滴轮、鼓轮 | 纺车轮 |

也就是：

```text
直柄竿必须搭配纺车轮
枪柄竿必须搭配水滴轮或鼓轮
```

### 6.3 保存时必须校验

用户点击保存搭配时，后端必须校验。

不允许只在前端提示。

原因：

- 前端提示可以改善体验。
- 后端校验才能保证数据干净。

### 6.4 不兼容时的提示文案

#### 直柄竿 + 水滴轮 / 鼓轮

```text
这套搭配不兼容：直柄竿应搭配纺车轮，不能搭配水滴轮或鼓轮。
```

#### 枪柄竿 + 纺车轮

```text
这套搭配不兼容：枪柄竿应搭配水滴轮或鼓轮，不能搭配纺车轮。
```

### 6.5 类型无法识别时怎么处理

现实中装备库数据可能存在：

- 鱼竿没有明确直柄 / 枪柄字段。
- 渔轮没有明确 `spinning / baitcasting / drum` 字段。
- 用户添加的是历史数据或字段缺失数据。

第一版处理口径：

> 不允许静默保存 unknown 搭配。若系统无法判断类型，必须让用户手动选择一次类型后再保存。

前端弹窗示例：

```text
系统暂时无法识别这根竿是直柄还是枪柄。
请选择后再保存：
[直柄竿] [枪柄竿]
```

```text
系统暂时无法识别这个渔轮类型。
请选择后再保存：
[纺车轮] [水滴轮] [鼓轮]
```

手动选择后写入本次搭配的 `extra.compatibilityOverrides`，不直接污染装备库主数据。

示例：

```json
{
  "compatibilityOverrides": {
    "rodHandleType": "casting",
    "reelSubtype": "baitcasting",
    "source": "user_manual"
  }
}
```

说明：

- 手动选择只用于该用户的搭配校验。
- 不直接改 `gear_master` 或 `gear_variants`。
- 后续如果装备库字段补全，再由系统优先使用装备库字段。

### 6.6 类型推导建议

后端建议新增两个 helper：

```ts
resolveRodHandleType(userGearItem): 'spinning' | 'casting' | 'unknown'
resolveReelSubtype(userGearItem): 'spinning' | 'baitcasting' | 'drum' | 'unknown'
```

建议读取来源优先级：

```text
1. user_gear_items.extra.manualSubtype / compatibilityOverrides
2. gear_variants.raw_json
3. gear_master.raw_json
4. gear_master.type
5. variant_label / display_name / type_tips 的关键词兜底
```

鱼竿关键词兜底：

```text
spinning / 直柄 / 纺车 / SPINNING -> spinning
casting / 枪柄 / CASTING / bait finesse / BFS -> casting
```

渔轮关键词兜底：

```text
spinning / 纺车 -> spinning
baitcasting / 水滴 / 两轴 -> baitcasting
drum / 鼓轮 / conventional -> drum
```

注意：

- 关键词兜底只作为弱兜底。
- 能读结构字段时，不要优先用名称猜。
- 若判断不稳定，宁可返回 `unknown`，交给用户手动选择。

---

## 七、关于用户疯狂添加装备 / 疯狂创建搭配的限制

### 7.1 结论

需要限制，但不要做“真假拥有认证”。

正确策略是：

> 限制数量、限制节奏、限制公开展示，不强行证明用户是否真的拥有。

原因：

- 你无法可靠判断用户是不是真的拥有某件装备。
- 强制购买凭证会大幅增加使用门槛。
- 但完全不限制会让个人主页变成无意义仓库，影响他人判断。
- GearSage 要沉淀的是可信经验，不是“谁把装备库全点了一遍”。

### 7.2 我的装备数量限制

第一版建议限制如下：

| 类型 | 上限 |
|---|---:|
| 鱼竿 | 30 |
| 渔轮 | 30 |
| 鱼饵 | 120 |
| 总装备数 | 180 |

说明：

- 对真实普通用户足够。
- 鱼饵上限高于竿轮，因为鱼饵天然更多。
- 如果后续出现真实高阶用户不够用，再单独扩展「饵盒」或提高上限。

### 7.3 添加节奏限制

建议第一版服务端限制：

```text
每个用户每天最多新增 50 件我的装备
其中鱼竿最多 15
渔轮最多 15
鱼饵最多 40
```

超过后提示：

```text
今天添加装备较多，建议先整理常用装备，明天再继续添加。
```

说明：

- 这不是风控封禁。
- 只是防止短时间批量遍历装备库。

### 7.4 我的搭配数量限制

第一版建议：

| 项目 | 上限 |
|---|---:|
| 单用户有效搭配总数 | 30 |
| 单用户公开搭配数 | 12 |
| 他人主页默认展示 | 3 |
| 单个搭配鱼饵数量 | 20 |
| 每日新建搭配数 | 10 |
| 每日编辑搭配次数 | 50 |

超过有效搭配总数时提示：

```text
我的搭配最多保留 30 个。建议删除不常用搭配后再新增。
```

超过公开搭配数时提示：

```text
公开搭配最多 12 个。建议只公开最有代表性的搭配。
```

超过单个搭配鱼饵数时提示：

```text
一个搭配最多选择 20 个常用饵。更多鱼饵后续可在饵盒功能中管理。
```

### 7.5 他人主页展示限制

他人主页第一版只展示：

```text
最多 3 个公开搭配摘要
```

不展示完整装备仓库。

如果用户公开搭配很多，只展示排序靠前的 3 个。

建议文案：

```text
常用搭配
展示对方公开的代表性搭配
```

不要写：

```text
他的全部装备
他的全部搭配
装备资产
```

### 7.6 是否需要标记异常用户

第一版不做封禁、不做风控分、不做后台处罚。

可以做轻量提示：

当用户装备数接近上限时：

```text
你添加的装备较多，建议只保留真实拥有或常用装备，方便别人更准确理解你的经验背景。
```

当公开搭配较多时：

```text
公开搭配建议保留最有代表性的几套，展示过多反而会降低参考价值。
```

### 7.7 为什么不做购买凭证认证

第一版不做购买凭证认证。

原因：

- 上传凭证会显著降低转化。
- 用户可能二手购买、朋友送、已出掉、试用过，很难标准化。
- 装备搭配本质是经验表达，不是资产证明。
- 当前更应该通过求推荐回答、被采纳、长测评、反馈沉淀来建立可信度。

---

## 八、数据模型设计

## 8.1 新增表：`user_gear_sets`

用途：保存用户创建的「我的搭配」主记录。

建议 SQL：

```sql
CREATE TABLE IF NOT EXISTS user_gear_sets (
  id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NOT NULL,

  name VARCHAR(80) NOT NULL,
  target_fish JSONB NOT NULL DEFAULT '[]'::jsonb,
  use_scene JSONB NOT NULL DEFAULT '[]'::jsonb,
  note TEXT,

  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,

  compatibility_status VARCHAR(20) NOT NULL DEFAULT 'valid',
  compatibility_message VARCHAR(255),

  cover_image_url TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,

  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delete_time TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_gear_sets_user
  ON user_gear_sets(user_id, is_deleted, sort_order, update_time DESC);

CREATE INDEX IF NOT EXISTS idx_user_gear_sets_public
  ON user_gear_sets(user_id, is_public, is_deleted, sort_order, update_time DESC);
```

### 字段说明

| 字段 | 说明 |
|---|---|
| `user_id` | 搭配所属用户 |
| `name` | 搭配名称 |
| `target_fish` | 目标鱼数组 |
| `use_scene` | 使用场景数组 |
| `note` | 用户备注 |
| `is_public` | 是否公开展示 |
| `sort_order` | 用户自定义排序 |
| `compatibility_status` | 当前搭配兼容性状态 |
| `compatibility_message` | 不兼容或人工选择说明 |
| `cover_image_url` | 可选封面，第一版可用鱼竿或渔轮主图兜底 |
| `extra` | 扩展字段 |
| `is_deleted` | 软删除 |

### `compatibility_status` 建议枚举

```text
valid
invalid
manual_confirmed
```

说明：

- `valid`：系统自动判断兼容。
- `manual_confirmed`：系统无法识别，用户手动选择类型后判断兼容。
- `invalid`：理论上不应保存成功，除非未来做历史数据保留。第一版遇到 invalid 直接拒绝保存。

---

## 8.2 新增表：`user_gear_set_items`

用途：保存搭配与「我的装备」之间的关系。

建议 SQL：

```sql
CREATE TABLE IF NOT EXISTS user_gear_set_items (
  id BIGSERIAL PRIMARY KEY,

  set_id BIGINT NOT NULL REFERENCES user_gear_sets(id),
  user_id BIGINT NOT NULL,
  user_gear_item_id BIGINT NOT NULL REFERENCES user_gear_items(id),

  gear_type VARCHAR(20) NOT NULL CHECK (gear_type IN ('rod', 'reel', 'lure')),
  role VARCHAR(20) NOT NULL CHECK (role IN ('rod', 'reel', 'lure')),

  gear_master_id VARCHAR(64),
  gear_variant_id VARCHAR(64),
  variant_key VARCHAR(128),
  variant_label VARCHAR(255),
  display_name_snapshot VARCHAR(255),
  image_url_snapshot TEXT,

  sort_order INTEGER NOT NULL DEFAULT 0,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,

  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delete_time TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_gear_set_items_set
  ON user_gear_set_items(set_id, is_deleted, sort_order);

CREATE INDEX IF NOT EXISTS idx_user_gear_set_items_user
  ON user_gear_set_items(user_id, is_deleted);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_gear_set_one_rod
  ON user_gear_set_items(set_id)
  WHERE gear_type = 'rod' AND is_deleted = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_gear_set_one_reel
  ON user_gear_set_items(set_id)
  WHERE gear_type = 'reel' AND is_deleted = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_gear_set_unique_item
  ON user_gear_set_items(set_id, user_gear_item_id)
  WHERE is_deleted = FALSE;
```

### 为什么用关系表

不建议把 rod / reel / lure 直接塞进 `user_gear_sets.extra`。

原因：

- 后续要分页、排序、过滤、求推荐复用。
- 后续可能扩展鱼线、前导、钩子。
- 关系表更容易做权限校验和软删除。
- 可以保存展示快照，避免装备库名称变动影响历史搭配可读性。

---

## 九、后端接口设计

## 9.1 获取我的搭配列表

```text
GET /mini/user/gear-sets
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `userId` | string/number | 否 | 不传则查当前登录用户 |
| `page` | number | 否 | 默认 1 |
| `limit` | number | 否 | 默认 20，最大 50 |
| `summaryOnly` | boolean | 否 | 他人主页摘要时可传 true |

### 权限规则

```text
查自己：返回公开 + 私密
查别人：只返回 is_public = true
```

### 返回示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "野河翘嘴常用",
        "targetFish": ["翘嘴", "鲈鱼"],
        "useScene": ["野河", "城市河道"],
        "note": "5g~12g 小饵用得最多",
        "isPublic": true,
        "compatibilityStatus": "valid",
        "items": [
          {
            "role": "rod",
            "userGearItemId": 101,
            "gearType": "rod",
            "displayName": "C6IM 702M",
            "imageUrl": ""
          },
          {
            "role": "reel",
            "userGearItemId": 102,
            "gearType": "reel",
            "displayName": "阿德 BRF",
            "imageUrl": ""
          },
          {
            "role": "lure",
            "userGearItemId": 201,
            "gearType": "lure",
            "displayName": "X-80",
            "imageUrl": ""
          }
        ],
        "createTime": "2026-05-14T00:00:00.000Z",
        "updateTime": "2026-05-14T00:00:00.000Z"
      }
    ],
    "limits": {
      "maxSets": 30,
      "maxPublicSets": 12,
      "maxLuresPerSet": 20
    }
  }
}
```

---

## 9.2 获取单个搭配详情

```text
GET /mini/user/gear-sets/:id
```

权限：

```text
本人：可查看公开 + 私密
他人：只能查看公开
```

若无权限：

```json
{
  "code": 403,
  "message": "无权查看该搭配",
  "data": null
}
```

---

## 9.3 新建搭配

```text
POST /mini/user/gear-sets
```

### 请求体

```json
{
  "name": "野河翘嘴常用",
  "rodItemId": 101,
  "reelItemId": 102,
  "lureItemIds": [201, 202, 203],
  "targetFish": ["翘嘴", "鲈鱼"],
  "useScene": ["野河", "城市河道"],
  "note": "5g~12g 小饵用得最多",
  "isPublic": true,
  "compatibilityOverrides": {
    "rodHandleType": "spinning",
    "reelSubtype": "spinning"
  }
}
```

### 校验规则

必须校验：

1. 当前用户已登录。
2. `name` 非空且长度合法。
3. `rodItemId` 必须存在、属于当前用户、未删除、`gear_type = rod`。
4. `reelItemId` 必须存在、属于当前用户、未删除、`gear_type = reel`。
5. `lureItemIds` 必须全部存在、属于当前用户、未删除、`gear_type = lure`。
6. 鱼竿最多 1 个。
7. 渔轮最多 1 个。
8. 鱼饵最多 20 个。
9. 竿轮兼容性必须通过。
10. 若 `isPublic = true`，所有被选中的 `user_gear_items.is_public` 必须为 `true`。
11. 不超过用户搭配数量限制。
12. 不超过每日新建限制。

### 为什么公开搭配要求内部装备也公开

如果某个用户把鱼竿设为私密，却把包含这根竿的搭配设为公开，会造成隐私语义混乱。

第一版规则：

> 公开搭配只能包含公开装备。若包含私密装备，则只能保存为私密搭配，或先把对应装备改为公开。

提示文案：

```text
公开搭配中包含私密装备。请先将相关装备设为公开，或把该搭配保存为私密。
```

### 不兼容返回示例

```json
{
  "code": 409,
  "message": "这套搭配不兼容：直柄竿应搭配纺车轮，不能搭配水滴轮或鼓轮。",
  "data": {
    "reason": "rod_reel_incompatible",
    "rodHandleType": "spinning",
    "reelSubtype": "baitcasting"
  }
}
```

### 超过数量限制返回示例

```json
{
  "code": 409,
  "message": "我的搭配最多保留 30 个。建议删除不常用搭配后再新增。",
  "data": {
    "reason": "gear_set_limit_exceeded",
    "limit": 30
  }
}
```

---

## 9.4 编辑搭配

```text
PUT /mini/user/gear-sets/:id
```

允许编辑：

```text
name
rodItemId
reelItemId
lureItemIds
targetFish
useScene
note
isPublic
sortOrder
```

规则：

- 只能编辑自己的搭配。
- 编辑时重新校验所有装备归属、公开性、兼容性和数量上限。
- 编辑后更新 `update_time`。
- 若替换竿轮导致不兼容，拒绝保存。

---

## 9.5 删除搭配

```text
DELETE /mini/user/gear-sets/:id
```

规则：

- 只能删除自己的搭配。
- 软删除 `user_gear_sets`。
- 同时软删除对应 `user_gear_set_items`。
- 不删除 `user_gear_items`。

返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": true
}
```

---

## 9.6 搭配排序

第一版可选。

```text
POST /mini/user/gear-sets/sort
```

请求：

```json
{
  "ids": [3, 1, 2]
}
```

说明：

- 若本期前端不做拖拽排序，可先不实现。
- 默认按 `sort_order ASC, update_time DESC`。

---

## 十、前端页面设计

## 10.1 我的页入口

在「我的」页面里，建议入口：

```text
我的装备
```

进入后页面结构：

```text
我的装备｜我的搭配
```

或者在「我的装备」页内做二级 tab：

```text
装备｜搭配
```

第一版建议：

```text
我的装备页内增加「搭配」Tab
```

原因：

- 不增加太多我的页入口。
- 用户能理解：先添加装备，再创建搭配。

---

## 10.2 我的搭配列表页

每个搭配卡片展示：

```text
搭配名称
鱼竿 + 渔轮
常用饵：前 3 个，超出显示“等 N 个”
目标鱼
使用场景
公开 / 私密状态
编辑 / 删除
```

空状态：

```text
还没有搭配
先把常用鱼竿、渔轮、鱼饵添加到我的装备，再组合成常用搭配。
[去添加装备]
```

如果已有装备但无搭配：

```text
把你的鱼竿、渔轮和常用饵组合起来，发求推荐时可以一键带入。
[新建搭配]
```

---

## 10.3 新建 / 编辑搭配页

字段顺序建议：

```text
1. 搭配名称
2. 选择鱼竿
3. 选择渔轮
4. 选择常用饵
5. 目标鱼
6. 使用场景
7. 备注
8. 是否公开
9. 保存
```

### 选择鱼竿

只展示：

```text
当前用户 user_gear_items 中 gear_type = rod 且未删除的记录
```

若为空：

```text
你还没有添加鱼竿。请先从装备库添加到我的装备。
[去添加鱼竿]
```

### 选择渔轮

只展示：

```text
当前用户 user_gear_items 中 gear_type = reel 且未删除的记录
```

若为空：

```text
你还没有添加渔轮。请先从装备库添加到我的装备。
[去添加渔轮]
```

### 选择常用饵

只展示：

```text
当前用户 user_gear_items 中 gear_type = lure 且未删除的记录
```

支持多选，最多 20 个。

---

## 10.4 前端兼容性提示

前端在用户选择鱼竿和渔轮后，可立即做一次本地提示。

但最终以后端保存校验为准。

### 兼容时

可以轻提示：

```text
竿轮类型匹配
```

也可以不提示，避免打扰。

### 不兼容时

显示红色提示：

```text
直柄竿应搭配纺车轮，当前渔轮可能不适合。
```

保存按钮可以禁用，或点击保存后以后端错误为准。

建议第一版：

```text
前端显示提示 + 保存时后端最终拦截
```

---

## 10.5 他人主页展示

他人主页新增模块：

```text
常用搭配
```

展示规则：

```text
只展示公开搭配
最多展示 3 个
没有公开搭配则不展示该模块
```

卡片示例：

```text
野河翘嘴常用
C6IM 702M + 阿德 BRF
常用饵：X-80、VIB 7g、小铅笔
场景：野河 / 城市河道
目标鱼：翘嘴 / 鲈鱼
```

注意：

- 不显示“他有 180 件装备”。
- 不显示完整装备仓库。
- 不做装备墙瀑布流。
- 不展示私密搭配。

---

## 10.6 求推荐发布页接入

在求推荐发布页的「当前已有装备」区域增加入口：

```text
从我的装备选择
从我的搭配选择
```

用户选择搭配后，页面展示：

```text
当前已有搭配：野河翘嘴常用
C6IM 702M + 阿德 BRF
常用饵：X-80、VIB 7g、小铅笔
```

发布时写入：

```text
recommendMeta.currentGear
recommendMeta.currentGearSet
recommendMeta.currentGearItems
```

### 推荐文案

```text
选择我的搭配后，别人能更快理解你现在用的竿轮饵组合。
```

---

## 十一、隐私与权限规则

### 11.1 查看规则

```text
本人：可查看全部搭配
他人：只可查看公开搭配
```

### 11.2 编辑规则

```text
只能编辑自己的搭配
不能编辑别人的搭配
```

### 11.3 删除规则

```text
只能删除自己的搭配
删除为软删除
```

### 11.4 公开搭配内的装备公开性

规则：

```text
公开搭配只能包含公开装备
私密搭配可以包含公开或私密装备
```

原因：

- 避免用户以为某件装备私密，但通过公开搭配泄露出去。

### 11.5 求推荐中的公开性

如果用户在求推荐发布页主动选择私密搭配并发布，则视为用户主动把该搭配内容写入求推荐帖。

前端需要提示：

```text
你选择的搭配包含私密装备。发布求推荐后，帖子中会展示这些装备信息。
```

按钮：

```text
取消
确认带入
```

说明：

- 这是用户主动发布内容，不等同于他人主页公开展示。
- 第一版必须给出提示，避免误操作。

---

## 十二、后端业务规则汇总

### 12.1 创建 / 编辑搭配校验顺序

建议顺序：

```text
1. 校验登录态
2. 校验搭配是否属于当前用户
3. 校验字段长度和数组数量
4. 校验每日创建 / 编辑限制
5. 校验用户搭配总数限制
6. 校验所有 userGearItemId 存在且属于当前用户
7. 校验 gear_type 是否正确
8. 校验公开搭配不包含私密装备
9. 解析鱼竿手柄类型
10. 解析渔轮类型
11. 如果 unknown，要求手动选择类型
12. 校验竿轮兼容性
13. 事务写入 user_gear_sets 和 user_gear_set_items
```

### 12.2 事务要求

创建和编辑搭配必须使用事务。

原因：

- 主表和关系表需要保持一致。
- 编辑时通常要软删除旧关系再插入新关系。
- 避免出现搭配主表成功但 items 丢失。

### 12.3 删除行为

删除搭配：

```text
user_gear_sets.is_deleted = true
user_gear_sets.delete_time = now()
user_gear_set_items.is_deleted = true
user_gear_set_items.delete_time = now()
```

不删除：

```text
user_gear_items
gear_master
gear_variants
```

### 12.4 删除我的装备时的联动

如果某个 `user_gear_item` 已经被搭配引用，用户删除该装备时有两种实现方式。

第一版建议：

```text
允许删除我的装备，同时将相关搭配标记为需要修复。
```

具体规则：

- 删除 `user_gear_item` 时，不自动删除整个搭配。
- 后端在获取搭配时，如果发现 item 已删除，则返回：

```json
{
  "missingItems": [
    {
      "role": "reel",
      "userGearItemId": 102,
      "displayNameSnapshot": "阿德 BRF"
    }
  ],
  "needsRepair": true
}
```

前端显示：

```text
这套搭配中的部分装备已被删除，请编辑修复。
```

若 `needsRepair = true`：

- 自己可见。
- 他人主页不展示该搭配。
- 求推荐发布页不可选择该搭配。

### 12.5 为什么不直接阻止删除装备

不建议第一版阻止用户删除装备。

原因：

- 用户可能真的已经出掉 / 不想保留。
- 强行阻止删除会造成体验问题。
- 让搭配进入“待修复”比自动删除更安全。

---

## 十三、接口错误码与提示建议

| 场景 | HTTP / code | message |
|---|---:|---|
| 未登录 | 401 | 请先登录 |
| 编辑别人搭配 | 403 | 无权编辑该搭配 |
| 查看别人私密搭配 | 403 | 无权查看该搭配 |
| 搭配不存在 | 404 | 搭配不存在或已删除 |
| 名称为空 | 400 | 请填写搭配名称 |
| 鱼饵超过上限 | 400 | 一个搭配最多选择 20 个常用饵 |
| 选择了别人的装备 | 403 | 只能选择自己的装备 |
| 装备类型不匹配 | 400 | 请选择正确类型的装备 |
| 竿轮不兼容 | 409 | 这套搭配不兼容：xxx |
| 类型无法识别且未手动选择 | 400 | 请先确认鱼竿或渔轮类型 |
| 超过搭配数量上限 | 409 | 我的搭配最多保留 30 个 |
| 超过公开搭配上限 | 409 | 公开搭配最多 12 个 |
| 公开搭配包含私密装备 | 409 | 公开搭配中包含私密装备 |
| 每日新增过多 | 429 | 今天新增搭配较多，明天再继续整理 |

---

## 十四、Smoke Test 最短路径

### 14.1 后端 Smoke Test

准备两个测试用户：

```text
User A
User B
```

准备 User A 的我的装备：

```text
鱼竿：直柄竿 A
鱼竿：枪柄竿 B
渔轮：纺车轮 A
渔轮：水滴轮 B
渔轮：鼓轮 C
鱼饵：X-80
鱼饵：VIB 7g
```

测试路径：

1. User A 新建「直柄竿 A + 纺车轮 A」搭配，成功。
2. User A 新建「直柄竿 A + 水滴轮 B」搭配，失败。
3. User A 新建「枪柄竿 B + 水滴轮 B」搭配，成功。
4. User A 新建「枪柄竿 B + 鼓轮 C」搭配，成功。
5. User A 新建「枪柄竿 B + 纺车轮 A」搭配，失败。
6. User A 新建包含 21 个鱼饵的搭配，失败。
7. User A 新建公开搭配，其中包含私密装备，失败。
8. User A 新建私密搭配，User B 查询不可见。
9. User A 新建公开搭配，User B 查询可见。
10. User B 尝试编辑 User A 的搭配，失败。
11. User A 删除搭配，再查列表不可见。
12. User A 从求推荐发布页选择某个搭配，`recommendMeta.currentGearSet` 写入成功。

### 14.2 前端 Smoke Test

1. 我的页可进入「我的装备」。
2. 「我的装备」页可切到「我的搭配」。
3. 无装备时展示空状态并引导添加装备。
4. 有装备时可新建搭配。
5. 鱼竿选择器只展示鱼竿。
6. 渔轮选择器只展示渔轮。
7. 鱼饵选择器只展示鱼饵且支持多选。
8. 不兼容竿轮组合会展示提示并无法保存。
9. 保存成功后列表展示搭配卡。
10. 编辑后列表刷新。
11. 删除后列表移除。
12. 他人主页只展示公开搭配摘要。
13. 求推荐发布页可从「我的搭配」选择当前已有装备。

---

## 十五、详细验收标准

### 15.1 数据库验收

- [ ] `user_gear_sets` 表存在。
- [ ] `user_gear_set_items` 表存在。
- [ ] `user_gear_sets` 支持软删除。
- [ ] `user_gear_set_items` 支持软删除。
- [ ] 单个搭配最多 1 条 `rod` 关系。
- [ ] 单个搭配最多 1 条 `reel` 关系。
- [ ] 同一个搭配不能重复加入同一个 `user_gear_item`。
- [ ] 常用索引已建立。

### 15.2 后端接口验收

- [ ] `GET /mini/user/gear-sets` 可返回当前用户全部搭配。
- [ ] `GET /mini/user/gear-sets?userId=:id` 查询别人时只返回公开搭配。
- [ ] `POST /mini/user/gear-sets` 可创建合法搭配。
- [ ] `PUT /mini/user/gear-sets/:id` 可编辑自己的搭配。
- [ ] `DELETE /mini/user/gear-sets/:id` 可软删除自己的搭配。
- [ ] 不能编辑或删除别人的搭配。
- [ ] 不能选择别人的装备创建搭配。
- [ ] 不能选择已删除装备创建搭配。
- [ ] 直柄竿 + 纺车轮通过。
- [ ] 直柄竿 + 水滴轮失败。
- [ ] 直柄竿 + 鼓轮失败。
- [ ] 枪柄竿 + 水滴轮通过。
- [ ] 枪柄竿 + 鼓轮通过。
- [ ] 枪柄竿 + 纺车轮失败。
- [ ] 未识别类型时要求用户手动确认。
- [ ] 数量上限生效。
- [ ] 每日新增限制生效。

### 15.3 前端验收

- [ ] 我的装备页有「我的搭配」入口。
- [ ] 可以新建搭配。
- [ ] 可以编辑搭配。
- [ ] 可以删除搭配。
- [ ] 可以设置公开 / 私密。
- [ ] 不兼容搭配有明确提示。
- [ ] 他人主页可展示公开搭配摘要。
- [ ] 他人主页不展示私密搭配。
- [ ] 求推荐发布页可选择我的搭配。
- [ ] 选择搭配后可正确回填当前已有装备。

### 15.4 回归验收

- [x] `/mini/gear/brands` 不受影响，本期未修改该控制器 / service。
- [x] `/mini/gear/list` 不受影响，本期未修改该控制器 / service。
- [x] `/mini/gear/detail` 不受影响，本期未修改该控制器 / service。
- [x] `/mini/user/gear` 主链路不重写，仅新增轻量数量限制。
- [x] `/mini/user/info` 不受影响，前端他人主页改为额外请求公开搭配摘要。
- [x] `/mini/topic` 发布求推荐不受影响，仅在 `recommendMeta` 内增量写入 `currentGearSet`。
- [x] 不新增 `wx.cloud` 主链路。
- [x] `npm run build` 通过。

### 15.5 2026-05-14 本地自测记录

- [x] PostgreSQL 已检查 `user_gear_sets / user_gear_set_items` 表存在。
- [x] PostgreSQL 已检查常用索引、单竿 / 单轮 / 同搭配同装备唯一索引存在。
- [x] PostgreSQL 已检查 `is_deleted / delete_time` 软删除字段存在。
- [x] `GET /mini/user/gear-sets` 已验证本人可见公开 + 私密，他人只可见公开。
- [x] `POST /mini/user/gear-sets` 已验证直柄竿 + 纺车轮成功、枪柄竿 + 水滴轮成功、枪柄竿 + 鼓轮成功。
- [x] `POST /mini/user/gear-sets` 已验证直柄竿 + 水滴轮失败、枪柄竿 + 纺车轮失败。
- [x] `POST /mini/user/gear-sets` 已验证 21 个鱼饵失败。
- [x] `POST /mini/user/gear-sets` 已验证公开搭配包含私密装备失败。
- [x] `POST /mini/user/gear-sets` 已验证选择他人 `user_gear_items` 失败。
- [x] `POST /mini/user/gear-sets` 已验证类型无法识别时返回 `compatibility_type_unknown`，携带手动确认后可保存。
- [x] `PUT /mini/user/gear-sets/:id` 已验证可编辑本人搭配。
- [x] `DELETE /mini/user/gear-sets/:id` 已验证软删除 set 与 set_items。
- [x] 小程序 `pkgContent/my-gear` 已接入“我的搭配”Tab。
- [x] 小程序 `pkgContent/my-gear-set-edit` 已接入新建、编辑、删除、公开 / 私密相关交互。
- [x] 他人主页已改为最多 3 个公开搭配摘要，不展示装备墙。
- [x] 求推荐发布页已支持从“我的搭配”写入 `recommendMeta.currentGearSet/currentGearItems/currentGear`。
- [x] 微信开发者工具 CLI `preview` 编译通过，总包体 `2.9 MB`。

---

## 十六、实施顺序建议

### 第一刀：后端数据结构与接口

1. 新增 `user_gear_sets`。
2. 新增 `user_gear_set_items`。
3. 新增 gear set service / controller。
4. 实现创建、查询、编辑、删除。
5. 实现数量限制。
6. 实现竿轮兼容性校验。
7. curl 或本地接口测试通过。

### 第二刀：我的装备页接入

1. 我的装备页增加「搭配」Tab。
2. 新增搭配列表。
3. 新增搭配编辑页。
4. 接入选择鱼竿、渔轮、鱼饵。
5. 接入公开 / 私密。
6. 接入删除。

### 第三刀：他人主页展示

1. 他人主页请求公开搭配摘要。
2. 最多展示 3 个公开搭配。
3. 无公开搭配不展示模块。

### 第四刀：求推荐发布页接入

1. 当前已有装备区域增加「从我的搭配选择」。
2. 选择搭配后写入 `recommendMeta.currentGearSet`。
3. 详情页确认可正常展示 `currentGear` 可读文本。

### 第五刀：文档回写

实现后必须同步更新：

```text
小程序页面切接口清单.md
独立后台迁移计划_施工记录版.md
GearSage_我的装备_PRD_v1.md
GearSage_求推荐模块_PRD_v1.md
对应验收清单 / smoke test 清单
```

---

## 十七、给 Codex 的执行提示

可以直接把下面这段交给 Codex：

```text
请先阅读 docs/GearSage_我的装备_PRD_v1.md 和 docs/GearSage_我的搭配_PRD_v1.md。

请按“增量实现”方式新增 GearSage「我的搭配」功能，不要重写现有 /mini/gear/*、/mini/user/gear、/mini/user/info、/mini/topic* 主链路。

实现顺序：
1. 后端新增 user_gear_sets / user_gear_set_items 表与迁移 SQL。
2. 新增 /mini/user/gear-sets 的 GET / POST / PUT / DELETE 接口。
3. 所有搭配只能选择当前用户自己的 user_gear_items。
4. 单个搭配最多 1 根鱼竿、1 个渔轮、20 个鱼饵。
5. 必须实现竿轮兼容性校验：直柄竿只能搭配纺车轮；枪柄竿只能搭配水滴轮或鼓轮。
6. 类型无法识别时，不要静默保存，要求前端让用户手动确认类型后再提交。
7. 加入轻量限制：我的装备总量、搭配总量、公开搭配数量、每日新增数量，不做购买凭证认证。
8. 前端在我的装备页新增“我的搭配”Tab，支持新建、编辑、删除、公开/私密。
9. 他人主页只展示公开搭配摘要，最多 3 个，不做装备墙。
10. 求推荐发布页支持从“我的搭配”选择当前已有装备，并写入 recommendMeta.currentGearSet / currentGearItems / currentGear。
11. 不新增 wx.cloud 主链路。
12. 完成后执行 npm run build，并按文档 smoke test 自测。
13. 完成后回写小程序页面切接口清单、独立后台迁移计划施工记录版、求推荐 PRD 与验收清单。
```

---

## 十八、一句话收束

「我的搭配」不是让用户证明自己有多少装备，也不是让主页变成装备秀场。

它要解决的是：

> 用户真实怎么搭、在哪用、钓什么，以及这些信息如何帮助别人更准确地理解他、回答他、参考他。

第一版只需要把这个闭环跑通：

```text
我的装备
→ 我的搭配
→ 他人主页公开摘要
→ 求推荐 currentGear 一键带入
```

做到这里，就已经比单纯“添加鱼竿 / 渔轮 / 鱼饵到列表”完整得多。
