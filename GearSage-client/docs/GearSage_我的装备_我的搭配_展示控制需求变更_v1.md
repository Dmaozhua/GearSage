# GearSage「我的装备 / 我的搭配」展示控制需求变更 v1

版本：v1.0  
状态：需求变更稿 / 可交给 Codex 按增量方式调整原 PRD  
适用范围：GearSage-client / GearSage-api / PostgreSQL / 小程序「我的装备」/「我的搭配」/ 他人主页 / 求推荐发布页  
建议路径：`docs/GearSage_我的装备_我的搭配_展示控制需求变更_v1.md`  
更新时间：2026-05-15

---

## 一、文档定位

本文档不是一个全新功能 PRD，也不是替代以下两份原始文档：

- `docs/GearSage_我的装备_PRD_v1.md`
- `docs/GearSage_我的搭配_PRD_v1.md`

本文档是上述两份 PRD 的**需求变更 / 设计补丁**，只调整其中关于以下内容的设计口径：

1. 单件装备是否需要「公开 / 私密」；
2. 搭配是否需要「公开 / 私密」；
3. 他人主页应该展示什么装备相关内容；
4. 装备与搭配之间是否需要互相校验公开性；
5. 用户疯狂添加装备 / 搭配时，应该限制哪里。

除本文明确覆盖的部分外，原始两份 PRD 的其他设计继续有效，尤其包括：

- 从装备库添加鱼竿 / 渔轮 / 鱼饵到「我的装备」；
- 从「我的装备」中选择鱼竿 / 渔轮 / 鱼饵创建「我的搭配」；
- 每套搭配最多 1 根鱼竿、1 个渔轮、多个鱼饵；
- 竿轮兼容性规则：直柄竿只能搭配纺车轮，枪柄竿只能搭配水滴轮或鼓轮；
- 我的搭配可用于求推荐发布页 `recommendMeta.currentGearSet / currentGearItems / currentGear`；
- 不做装备墙、排行榜、交易、估价、自动推荐算法；
- 不推翻现有 `/mini/gear/*`、`/mini/user/*`、`/mini/topic*` 主链路。

---

## 二、本次变更的核心结论

原设计里使用了两层可见性：

```text
装备 isPublic
搭配 isPublic
```

这个模型会产生冲突：

```text
某件装备先是公开
包含它的搭配也是公开
后来该装备改成私密
那么这套搭配到底还应不应该展示？
```

这类冲突不是靠单点补丁能彻底解决的。更好的方案是从设计上取消「单件装备公开 / 私密」这个主概念，改成：

```text
我的装备 / 我的搭配 = 个人管理区
他人主页 = 代表内容展示区
```

最终拍板：

> **第一版不再设计“每件装备公开 / 私密”。我的装备默认是用户自己的个人管理数据；他人主页只展示用户主动选择“展示到主页”的代表搭配。**

也就是说，用户不再思考：

```text
这根竿公开吗？
这个轮私密吗？
这套搭配公开吗？
```

而是只思考：

```text
这套搭配要不要展示到我的主页，作为别人了解我的代表内容？
```

---

## 三、产品语义变更

## 3.1 废弃「公开 / 私密」作为第一版主文案

第一版前端不再使用以下文案作为主交互：

```text
公开
私密
公开受限
```

改用：

```text
展示到主页
取消主页展示
主页展示中
未展示
展示异常
```

原因：

1. 钓鱼装备本身不是高敏感信息，给每件装备设置「私密」显得重；
2. 用户真实诉求不是保护秘密，而是选择哪些内容代表自己；
3. 「公开 / 私密」容易引出装备、搭配之间互相冲突的状态机；
4. 「展示到主页」更贴近 GearSage 他人主页的定位：帮助别人判断经验画像和可信度，而不是看一个人的完整仓库。

---

## 3.2 新的三层语义

### 第一层：我的装备

```text
性质：个人装备管理区
对外：默认不直接展示给他人
用途：创建搭配、发求推荐、自己管理装备状态
```

我的装备不再有 `公开 / 私密` 开关。

保留管理状态：

```text
拥有状态：已拥有 / 想买 / 已出掉
使用状态：常用 / 备用 / 闲置
备注
排序
```

### 第二层：我的搭配

```text
性质：个人搭配管理区
对外：默认不展示给他人
用途：记录真实使用组合、发求推荐时一键带入
```

我的搭配不再叫「公开 / 私密」，改为：

```text
是否展示到主页：showOnProfile
```

### 第三层：主页展示

```text
性质：代表内容展示区
对外：他人主页可见
来源：用户主动选择“展示到主页”的搭配
数量：第一版最多展示 3 套
```

他人主页不展示完整装备仓库，也不展示所有搭配。

---

## 四、对 `GearSage_我的装备_PRD_v1.md` 的变更

## 4.1 保留内容

以下内容继续有效：

1. 功能名仍为「我的装备」；
2. 第一版仍只支持：鱼竿 / 渔轮 / 常用饵；
3. 仍支持从装备库列表 / 详情页添加装备；
4. 仍支持选择具体子型号 / SKU / variant；
5. 仍支持编辑使用状态、拥有状态、备注、排序；
6. 仍支持删除自己的装备；
7. 仍作为「我的搭配」的装备来源；
8. 仍可在求推荐发布页作为当前已有装备来源。

## 4.2 替换内容：取消单件装备公开性

原 PRD 中以下设计废弃或改写：

```text
用户可以编辑装备是否公开
自己查看时展示公开 + 私密装备
他人查看时只展示公开装备
他人主页展示公开装备
user_gear_items.is_public 作为对外展示判断
GET /mini/user/gear?userId=:id 用于查询他人的公开装备
```

改为：

```text
用户不能设置单件装备公开 / 私密
我的装备只作为当前用户个人管理区
他人不能直接浏览某个用户完整装备列表
他人主页不展示散件装备列表
他人主页只展示代表搭配摘要
```

## 4.3 字段变更

### 4.3.1 `user_gear_items.is_public`

若尚未实现：

```text
不新增 user_gear_items.is_public 字段。
```

若已经实现：

```text
保留字段以降低迁移风险，但标记为 deprecated。
前端不展示。
后端不用于他人主页过滤。
新逻辑不得依赖该字段判断可见性。
```

推荐字段保留为：

```text
id
user_id
gear_type
gear_master_id
gear_variant_id
variant_key
variant_label
display_name
brand_name
gear_model
ownership_status      owned / wishlist / sold
usage_status          frequent / backup / idle
note
sort_order
is_deleted
create_time
update_time
```

说明：

- `ownership_status` 表示这件装备和用户的关系；
- `usage_status` 表示使用频率；
- 这两个都是个人管理状态，不是可见性状态。

## 4.4 接口变更

### `GET /mini/user/gear`

原设计支持：

```text
GET /mini/user/gear?userId=:id
```

用于查别人公开装备。

新设计调整为：

```text
GET /mini/user/gear
```

只查当前登录用户自己的装备。

若前端或旧代码传入 `userId`：

- `userId` 等于当前登录用户：允许返回；
- `userId` 不等于当前登录用户：第一版建议返回 `403`，或返回空数组，但不能返回对方散件装备；
- 不再提供「他人公开装备列表」能力。

### `POST /mini/user/gear`

请求体不再接收 `isPublic`。

兼容处理：

```text
如果旧前端仍传 isPublic，后端可以忽略该字段，不因该字段报错。
但返回结构中不再鼓励展示 isPublic。
```

### `PUT /mini/user/gear/:id`

不再支持修改：

```text
isPublic
```

继续支持修改：

```text
displayName
ownershipStatus
usageStatus
note
sortOrder
```

## 4.5 前端变更

### 我的装备管理页

删除或不出现：

```text
公开 / 私密开关
公开状态标签
仅自己可见标签
```

保留：

```text
装备类型
装备名称
子型号 / SKU
拥有状态
使用状态
备注
排序
删除
```

### 我的页卡片

原「我的装备」入口继续保留，但只展示管理摘要：

```text
我的装备
鱼竿 3｜渔轮 2｜常用饵 12
```

这不是他人可见内容，只是自己的管理入口。

---

## 五、对 `GearSage_我的搭配_PRD_v1.md` 的变更

## 5.1 保留内容

以下内容继续有效：

1. 功能名仍为「我的搭配」；
2. 「我的装备」是零件库，「我的搭配」是使用方式；
3. 搭配只能选择当前用户自己已添加的 `user_gear_items`；
4. 单个搭配最多 1 根鱼竿；
5. 单个搭配最多 1 个渔轮；
6. 单个搭配最多 20 个鱼饵；
7. 可填写搭配名称、目标鱼、使用场景、备注；
8. 竿轮兼容性规则继续保留：
   - 直柄竿只能搭配纺车轮；
   - 枪柄竿只能搭配水滴轮或鼓轮；
9. 可在他人主页展示代表搭配摘要；
10. 可在求推荐发布页从「我的搭配」选择当前已有装备。

## 5.2 替换内容：`isPublic` 改为 `showOnProfile`

原 PRD 中：

```text
isPublic: boolean
公开 / 私密
公开搭配只能包含公开装备
私密搭配可以包含公开或私密装备
```

改为：

```text
showOnProfile: boolean
是否展示到主页
```

语义变化：

| 旧字段 / 旧文案 | 新字段 / 新文案 | 新语义 |
|---|---|---|
| `isPublic` | `showOnProfile` | 用户是否希望这套搭配出现在他人主页 |
| 公开 | 主页展示中 | 该搭配正在作为代表搭配展示 |
| 私密 | 未展示 | 该搭配只在自己的管理区可见 |
| 公开受限 | 展示异常 | 用户想展示，但数据不满足展示条件 |

注意：

```text
showOnProfile 不是隐私字段。
它只是“是否作为主页代表内容展示”的字段。
```

## 5.3 新增计算状态：`profileDisplayStatus`

后端返回搭配时，建议增加一个计算字段：

```text
profileDisplayStatus
```

枚举：

```text
not_displayed
showing
invalid
```

含义：

| 状态 | 条件 | 自己是否可见 | 他人是否可见 |
|---|---|---|---|
| `not_displayed` | `showOnProfile = false` | 可见 | 不可见 |
| `showing` | `showOnProfile = true` 且满足展示条件 | 可见 | 可见 |
| `invalid` | `showOnProfile = true` 但不满足展示条件 | 可见，提示修复 | 不可见 |

前端展示文案：

```text
not_displayed -> 未展示
showing -> 主页展示中
invalid -> 展示异常
```

## 5.4 新增计算原因：`profileBlockedReasons`

当 `profileDisplayStatus = invalid` 时，后端建议返回：

```ts
profileBlockedReasons: string[]
```

建议原因枚举：

```text
rod_deleted
reel_deleted
lure_deleted
gear_item_deleted
gear_item_not_owned
gear_master_hidden
gear_variant_missing
invalid_rod_reel_combo
profile_limit_exceeded
```

前端可转成用户可读提示：

```text
展示异常：鱼竿已删除，请重新选择
展示异常：渔轮已不在你的装备中
展示异常：这套搭配中的装备已不是“已拥有”状态
展示异常：竿轮类型不兼容
```

说明：

- 这里不再出现「包含私密装备」；
- 因为单件装备已经不再设计公开 / 私密状态。

---

## 六、主页展示条件

一套搭配只有在满足以下条件时，才可在他人主页展示：

```text
showOnProfile = true
AND 搭配未软删除
AND 搭配内引用的 user_gear_items 均未软删除
AND 搭配内用于展示的装备 ownershipStatus = owned
AND 若同时存在鱼竿和渔轮，则竿轮兼容性校验通过
AND 未超过主页展示数量限制
```

第一版建议：

```text
主页最多展示 3 套代表搭配。
不做“查看全部公开搭配”。
```

原因：

1. 他人主页要克制；
2. 用户疯狂创建搭配不应该污染他人浏览体验；
3. 代表内容比完整仓库更有判断价值。

## 6.1 搭配是否必须完整

普通保存「我的搭配」时，不强制必须同时有鱼竿、渔轮、鱼饵。

最低保存条件：

```text
至少选择 1 件装备，或填写了搭配名称 + 备注。
```

但若要 `showOnProfile = true`，建议最低要求：

```text
至少包含 1 件已拥有的鱼竿或渔轮。
```

原因：

- 有些用户可能只想记录一个常用饵组合，不应阻止保存；
- 但他人主页展示的代表搭配需要有基本参考价值；
- 鱼饵可以为 0，因为很多搭配只展示竿轮也有意义。

---

## 七、关键流程变更

## 7.1 用户添加装备

旧流程：

```text
添加装备 -> 填写状态 / 备注 / 是否公开
```

新流程：

```text
添加装备 -> 填写拥有状态 / 使用状态 / 备注
```

页面不出现公开 / 私密。

## 7.2 用户新建搭配

旧流程：

```text
新建搭配 -> 设置公开 / 私密
```

新流程：

```text
新建搭配 -> 默认未展示
用户可主动开启：展示到主页
```

推荐文案：

```text
展示到主页后，其他用户可以在你的主页看到这套代表搭配。
建议只展示最有代表性的几套。
```

## 7.3 用户把搭配设为展示到主页

后端校验：

1. 搭配属于当前用户；
2. 搭配未删除；
3. 搭配内装备未删除；
4. 展示用装备均为 `ownershipStatus = owned`；
5. 竿轮兼容性通过；
6. 未超过主页展示数量上限。

若通过：

```text
showOnProfile = true
profileDisplayStatus = showing
```

若不通过：

第一版建议阻止开启，并提示用户修复。

示例：

```text
这套搭配暂不能展示到主页：渔轮已不在你的装备中。
```

## 7.4 用户把装备状态改为「已出掉」或删除装备

如果这件装备被某套 `showOnProfile = true` 的搭配引用：

```text
不阻止用户修改装备状态或删除装备。
```

系统处理：

```text
搭配仍保留 showOnProfile = true
但 profileDisplayStatus 变为 invalid
他人主页不再展示该搭配
我的搭配页显示“展示异常”并提示原因
```

这样不会泄露，也不会擅自改用户的主页展示意图。

## 7.5 用户修复异常搭配

用户可通过以下方式修复：

1. 重新选择有效装备；
2. 把装备状态改回 `owned`；
3. 关闭「展示到主页」。

修复后后端重新计算：

```text
showOnProfile = true 且满足条件 -> profileDisplayStatus = showing
showOnProfile = false -> profileDisplayStatus = not_displayed
```

## 7.6 求推荐发布页选择搭配

求推荐和主页展示解耦。

规则：

```text
求推荐发布页可以从当前用户所有未删除的“我的搭配”中选择。
不要求 showOnProfile = true。
不因为搭配未展示到主页而禁止用于求推荐。
```

原因：

- 求推荐是用户主动发布上下文；
- 主页展示是长期对外代表内容；
- 两者不是一回事。

若用户选择的搭配包含已出掉 / 想买装备，前端应给轻提示：

```text
这套搭配包含非“已拥有”装备，发布后会作为本次求推荐上下文展示。
```

但第一版不强制阻止，因为用户可能正是在围绕「想买搭配」求推荐。

---

## 八、数据库变更建议

## 8.1 `user_gear_items`

推荐最终字段中不再新增 `is_public`：

```sql
-- 不推荐新增
-- is_public BOOLEAN NOT NULL DEFAULT false
```

若已经创建该字段，建议保留但废弃：

```sql
-- deprecated: no longer used for profile visibility
is_public BOOLEAN NOT NULL DEFAULT false
```

## 8.2 `user_gear_sets`

原 PRD 中：

```sql
is_public BOOLEAN NOT NULL DEFAULT false
```

建议改为：

```sql
show_on_profile BOOLEAN NOT NULL DEFAULT false,
profile_sort_order INT NOT NULL DEFAULT 0,
profile_selected_at TIMESTAMP NULL
```

如果 `is_public` 尚未落地：

```text
直接使用 show_on_profile。
```

如果 `is_public` 已落地：

```text
优先用迁移 SQL 将 is_public 重命名为 show_on_profile。
不要继续保留两个并行字段。
```

示例迁移：

```sql
ALTER TABLE user_gear_sets
  RENAME COLUMN is_public TO show_on_profile;

ALTER TABLE user_gear_sets
  ADD COLUMN IF NOT EXISTS profile_sort_order INT NOT NULL DEFAULT 0;

ALTER TABLE user_gear_sets
  ADD COLUMN IF NOT EXISTS profile_selected_at TIMESTAMP NULL;
```

说明：

- `profileDisplayStatus` 不建议存表；
- 它应由查询时根据搭配、装备状态、删除状态、兼容性实时计算；
- 这样能避免状态陈旧。

## 8.3 `user_gear_set_items`

原设计继续有效，不需要因为本次变更推翻。

继续使用：

```text
set_id
user_gear_item_id
gear_type
role
sort_order
```

---

## 九、接口变更建议

## 9.1 `GET /mini/user/gear-sets`

### 查自己

```http
GET /mini/user/gear-sets
```

返回当前用户自己的所有未删除搭配，包括：

```text
未展示
主页展示中
展示异常
```

建议返回字段：

```json
{
  "id": 1,
  "name": "野河翘嘴常用",
  "targetFish": ["翘嘴"],
  "useScene": ["野河", "城市河道"],
  "note": "5-12g 小饵用得多",
  "showOnProfile": true,
  "profileDisplayStatus": "showing",
  "profileBlockedReasons": [],
  "items": {
    "rod": {},
    "reel": {},
    "lures": []
  }
}
```

### 查别人主页展示

```http
GET /mini/user/gear-sets?userId=:id&profileOnly=true&summaryOnly=true
```

规则：

```text
只返回 showOnProfile = true 且 profileDisplayStatus = showing 的搭配。
最多返回 3 条。
不返回 not_displayed。
不返回 invalid。
不返回对方所有搭配。
```

## 9.2 `POST /mini/user/gear-sets`

请求字段替换：

```json
{
  "name": "野河翘嘴常用",
  "targetFish": ["翘嘴"],
  "useScene": ["野河"],
  "note": "5-12g 小饵",
  "showOnProfile": false,
  "items": {
    "rodUserGearItemId": 1,
    "reelUserGearItemId": 2,
    "lureUserGearItemIds": [3, 4, 5]
  }
}
```

兼容旧字段：

```text
如果前端仍传 isPublic，后端可以临时映射为 showOnProfile。
但返回结构必须返回 showOnProfile，不再鼓励 isPublic。
```

## 9.3 `PUT /mini/user/gear-sets/:id`

支持修改：

```text
name
targetFish
useScene
note
showOnProfile
items
sortOrder / profileSortOrder
```

当 `showOnProfile` 从 false 改为 true 时，必须执行主页展示校验。

## 9.4 `DELETE /mini/user/gear-sets/:id`

保持原 PRD 软删除策略。

---

## 十、他人主页展示变更

## 10.1 模块名

建议模块名：

```text
代表搭配
```

也可用：

```text
常用搭配
```

不建议：

```text
公开装备
装备墙
他的装备库
全部装备
```

## 10.2 展示规则

他人主页只展示：

```text
showOnProfile = true
profileDisplayStatus = showing
最多 3 套
```

每张卡片展示：

```text
搭配名称
目标鱼
使用场景
鱼竿
渔轮
常用饵前 3 个
备注摘要，可选
```

示例：

```text
代表搭配

野河翘嘴常用
鱼竿：C6IM 702M
渔轮：阿德 BRF
常用饵：VIB 7g、小米诺、铅笔
场景：野河 / 城市河道
```

## 10.3 空状态

如果用户没有可展示搭配：

```text
他人主页不展示该模块。
```

不要展示：

```text
TA 还没有公开搭配
TA 没有公开装备
```

原因：

- 避免给用户造成资料不完整的羞辱感；
- 保持主页克制。

---

## 十一、关于用户疯狂添加装备 / 搭配的处理

本次变更后，处理策略变成：

```text
管理区适度限制，对外展示严格限制。
```

## 11.1 我的装备

仍建议保留原 PRD 的轻量数量上限，防止滥用数据库：

```text
鱼竿最多 30
渔轮最多 30
鱼饵最多 120
总装备最多 180
每日新增最多 50
```

但产品上不强调「真假拥有认证」。

原因：

- 平台无法证明用户是否真的拥有；
- 要求购买凭证会极大增加使用门槛；
- 用户乱加装备主要问题是对外误导，而不是个人管理区变乱。

## 11.2 我的搭配

保留轻量上限：

```text
单用户有效搭配最多 30
每日新增搭配最多 10
单套搭配最多 20 个鱼饵
```

## 11.3 主页展示

严格限制：

```text
主页展示搭配最多 3 套
他人主页不提供完整装备仓库入口
第一版不做“查看全部展示搭配”
```

这样即使用户把装备库遍历了一遍，也不会污染别人看到的主页内容。

---

## 十二、兼容性与迁移策略

## 12.1 如果尚未实现代码

直接按本文档调整后再实现：

1. 不做 `user_gear_items.is_public`；
2. `user_gear_sets` 使用 `show_on_profile`；
3. 前端文案使用「展示到主页」；
4. 他人主页只取代表搭配；
5. 求推荐选择搭配不依赖主页展示状态。

## 12.2 如果已部分实现 `isPublic`

不要在 UI 上继续扩散 `isPublic`。

后端处理建议：

```text
user_gear_items.is_public -> deprecated，不使用
user_gear_sets.is_public -> rename / map 为 show_on_profile
接口入参 isPublic -> 临时兼容别名
接口出参 showOnProfile -> 新标准字段
```

前端处理建议：

```text
隐藏单件装备公开开关
隐藏搭配公开 / 私密文案
改为“展示到主页”开关
```

---

## 十三、验收标准变更

## 13.1 我的装备验收

通过标准：

- [ ] 我的装备可以添加鱼竿 / 渔轮 / 常用饵。
- [ ] 我的装备可以编辑拥有状态、使用状态、备注、排序。
- [ ] 我的装备页不出现「公开 / 私密」开关。
- [ ] 他人不能直接查看某用户完整装备列表。
- [ ] 他人主页不展示散件装备仓库。
- [ ] 求推荐发布页仍可从我的装备选择当前已有装备。

## 13.2 我的搭配验收

通过标准：

- [ ] 用户可以从自己的装备中创建搭配。
- [ ] 单套搭配最多 1 根鱼竿、1 个渔轮、20 个鱼饵。
- [ ] 直柄竿 + 水滴轮 / 鼓轮保存失败。
- [ ] 枪柄竿 + 纺车轮保存失败。
- [ ] 搭配默认未展示到主页。
- [ ] 用户可以开启「展示到主页」。
- [ ] 搭配不再使用「公开 / 私密」主文案。
- [ ] 我的搭配页可显示：未展示 / 主页展示中 / 展示异常。

## 13.3 他人主页验收

通过标准：

- [ ] 他人主页最多展示 3 套代表搭配。
- [ ] 只展示 `showOnProfile = true` 且 `profileDisplayStatus = showing` 的搭配。
- [ ] 不展示 `not_displayed` 搭配。
- [ ] 不展示 `invalid` 搭配。
- [ ] 不展示完整装备仓库。
- [ ] 没有可展示搭配时，不展示该模块。

## 13.4 状态联动验收

通过标准：

- [ ] 一套搭配展示到主页后，他人主页可见。
- [ ] 删除该搭配中的某件装备后，他人主页不再展示该搭配。
- [ ] 自己的我的搭配页显示「展示异常」。
- [ ] 修复装备引用后，该搭配可恢复为「主页展示中」。
- [ ] 把装备状态改为 `sold / wishlist` 后，引用它的主页展示搭配进入「展示异常」。
- [ ] 把装备状态改回 `owned` 后，重新计算展示状态。

## 13.5 求推荐验收

通过标准：

- [ ] 求推荐发布页可以选择未展示到主页的搭配。
- [ ] 求推荐发布页可以选择主页展示中的搭配。
- [ ] 选择搭配后写入 `recommendMeta.currentGearSet / currentGearItems / currentGear`。
- [ ] 求推荐发布不因为搭配未展示到主页而失败。
- [ ] 求推荐发布页不把「展示到主页」误认为求推荐可见性。

---

## 十四、需要同步修改的原 PRD 位置

## 14.1 `GearSage_我的装备_PRD_v1.md`

建议修改：

1. 「第一版必须支持」中删除：
   - 是否公开；
   - 自己查看公开 + 私密；
   - 他人查看只展示公开装备。
2. 删除或改写「他人主页展示公开装备」。
3. 数据表中 `is_public` 标记为废弃或删除。
4. 接口 `GET /mini/user/gear?userId=:id` 改成不支持查他人散件装备。
5. 前端页面删除公开状态显示。
6. 验收标准删除「公开 / 私密」相关项。

## 14.2 `GearSage_我的搭配_PRD_v1.md`

建议修改：

1. `isPublic` 全部替换为 `showOnProfile`。
2. 「公开 / 私密」文案替换为「展示到主页 / 未展示」。
3. 删除「公开搭配只能包含公开装备」相关逻辑。
4. 新增 `profileDisplayStatus / profileBlockedReasons`。
5. 他人主页查询规则改为只返回主页展示且状态正常的代表搭配。
6. 数量限制中将「公开搭配数」改为「主页展示搭配数」。
7. 求推荐章节明确：选择搭配与主页展示状态无关。

---

## 十五、给 Codex 的执行提示

可以直接贴给 Codex：

```text
请先阅读：
1. docs/GearSage_我的装备_PRD_v1.md
2. docs/GearSage_我的搭配_PRD_v1.md
3. docs/GearSage_我的装备_我的搭配_展示控制需求变更_v1.md

注意：第三份不是新功能 PRD，而是前两份 PRD 的需求变更。不要架空原始文档，不要重写整个“我的装备 / 我的搭配”功能，只按变更文档调整公开/私密与主页展示模型。

本次核心修改：
1. 取消单件装备公开/私密开关。
2. 我的装备只作为个人管理区，不直接展示到他人主页。
3. 我的搭配不再使用 isPublic 语义，改为 showOnProfile：是否展示到主页。
4. 他人主页只展示 showOnProfile=true 且 profileDisplayStatus=showing 的代表搭配，最多 3 套。
5. 新增或计算 profileDisplayStatus：not_displayed / showing / invalid。
6. 新增 profileBlockedReasons，用于解释展示异常。
7. 删除“公开搭配必须包含公开装备”的校验，因为装备不再有公开/私密。
8. 如果装备被删除、状态改为 sold/wishlist、gear master 隐藏、竿轮搭配不兼容，则引用它的主页展示搭配进入 invalid；他人主页隐藏，自己页显示展示异常。
9. 求推荐发布页可以选择所有自己的有效搭配，不要求 showOnProfile=true。
10. 接口和 DB 保持增量改造；如已有 isPublic 字段，user_gear_items.is_public 标记 deprecated，user_gear_sets.is_public 迁移或映射为 show_on_profile。
11. 不改 /mini/gear/*、/mini/topic*、/mini/comment* 主链路。
12. 完成后同步回写两份原 PRD、验收测试标准、小程序页面切接口清单、独立后台迁移施工记录。
```

---

## 十六、一句话收束

本次变更不是砍掉「我的装备 / 我的搭配」，而是把它们从「公开 / 私密对象」改成更合理的两层结构：

> **我的装备和我的搭配是个人管理区；他人主页只展示用户主动挑选出来的少数代表搭配。**

这样既保留原 PRD 的功能主干，又从设计上避免装备公开性和搭配公开性互相打架。
