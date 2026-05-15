# GearSage 我的装备功能验收与测试标准 v1

版本：v1.0  
状态：可直接交给 Codex / 前端 / 后端执行验收  
适用范围：GearSage-client / GearSage-api / PostgreSQL / 小程序“我的”页 / 装备库详情页 / 他人主页 / 求推荐发布页  
建议存放路径：`docs/GearSage_我的装备_验收测试标准_v1.md`  
对应需求文档：`docs/GearSage_我的装备_PRD_v1.md`  
更新时间：2026-05-14

---

## 2026-05-15 展示控制验收变更

本验收标准中关于「单件装备公开 / 私密」「他人主页展示公开装备」「公开搭配包含私密装备」的用例，已由 `docs/GearSage_我的装备_我的搭配_展示控制需求变更_v1.md` 覆盖。

新的通过标准：

- 我的装备页不出现单件装备公开 / 私密开关。
- 他人不能通过 `/mini/user/gear?userId=:id` 查看完整散件装备仓库。
- 我的搭配使用「展示到主页」语义，接口标准字段为 `showOnProfile`。
- 我的搭配返回 `profileDisplayStatus` 和 `profileBlockedReasons`。
- 他人主页最多展示 3 套 `showOnProfile=true` 且 `profileDisplayStatus=showing` 的代表搭配。
- 删除装备、将装备状态改为 `sold / wishlist`、装备库记录不可用或竿轮兼容失效时，引用它的主页展示搭配进入 `invalid`，他人主页隐藏，自己的我的搭配页显示「展示异常」。
- 求推荐发布页可以选择未展示、主页展示中或展示异常的自己的搭配，并写入 `recommendMeta.currentGearSet / currentGearItems / currentGear`。

## 一、文档目标

本文档用于定义 **我的装备** 功能第一版的验收标准、测试路径、接口测试、数据库校验、前端联调和回归要求。

本功能的验收目标不是“做一个装备墙”，而是确认以下闭环稳定可用：

> 用户可以从装备库添加自己真实拥有、想买或已出掉的鱼轮、鱼竿、常用饵；可以在我的页管理；他人主页只展示用户主动选择展示且状态正常的代表搭配；求推荐发布时可以复用这些已有装备或搭配作为上下文。

---

## 二、验收范围

## 2.1 本次必须验收

### 后端

1. 新增 `user_gear_items` 表。
2. 新增用户装备模块：`user-gear`。
3. 新增并跑通以下接口：
   - `GET /mini/user/gear`
   - `POST /mini/user/gear`
   - `PUT /mini/user/gear/:id`
   - `DELETE /mini/user/gear/:id`
4. 所有接口继续使用统一返回结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

5. 写操作必须登录。
6. 用户不能编辑 / 删除别人的装备。
7. 查询他人装备不返回散件装备仓库。
8. 重复添加必须被拦截。
9. 删除使用软删除，不物理删除。

### 前端

1. “我的”页新增 `我的装备` 入口。
2. 新增 `我的装备` 管理页。
3. 新增添加 / 编辑装备页或等价弹层。
4. 支持 `鱼轮 / 鱼竿 / 常用饵` 三个分类。
5. 支持从装备库搜索并添加。
6. 支持从装备详情页点击 `加入我的装备`。
7. 支持编辑：
   - 展示名
   - 使用状态
   - 公开 / 私密
   - 备注
   - 排序，若本期实现排序
8. 支持删除。
9. 他人主页新增 `常用装备` 模块。
10. 求推荐发布页可从“我的装备”选择当前已有装备，并写入 `recommendMeta.currentGear` 与 `recommendMeta.currentGearItems`。

### 联动

1. 继续复用现有 `/mini/gear/*`，不重做装备库接口。
2. 继续复用现有 `GET /mini/user/info?id=:id` 的他人主页链路，不把完整装备列表塞进用户详情接口。
3. 继续复用现有 `/mini/topic*` 求推荐发布链路，不为“我的装备”新建求推荐接口。

---

## 2.2 本次明确不验收

以下内容本期不做，不能因为未实现而判定失败：

1. 装备评分。
2. 装备点赞。
3. 装备评论。
4. 装备交易。
5. 装备估价。
6. 装备鱼获绑定。
7. 装备图片二次上传。
8. 装备瀑布流展示。
9. 关注 / 粉丝 / 私信联动。
10. 根据用户装备自动判断水平。
11. 自动推荐装备。
12. 装备对比页自动给购买结论。
13. 用户自建装备库主数据。
14. 鱼线、钩子、配件、钓箱、穿搭等扩展分类。

---

## 三、验收前置条件

## 3.1 环境要求

默认本地联调环境：

```text
API: http://127.0.0.1:3001
小程序：微信开发者工具
数据库：本地 PostgreSQL
```

如果在远程环境验收，应确认：

```text
API: https://api.gearsage.club
静态资源: https://static.gearsage.club/gearsage
```

但本功能第一轮建议先按本地环境验收。

## 3.2 服务状态

验收前必须通过：

```text
GET /health
GET /health/db
```

通过标准：

1. API 服务正常返回。
2. 数据库连接正常。
3. `npm run build` 可通过。
4. 小程序重新编译后无阻塞报错。

## 3.3 基础数据要求

验收前至少准备：

1. 测试用户 A。
2. 测试用户 B。
3. 装备库中至少有：
   - 1 个鱼轮主型号，且最好有多个 variant / SKU。
   - 1 个鱼竿主型号。
   - 1 个常用饵主型号。
4. 用户 A 至少添加 3 件装备：
   - 1 个 `reel`
   - 1 个 `rod`
   - 1 个 `lure`
5. 用户 A 至少设置 1 件装备为私密。
6. 用户 B 用于查看用户 A 的他人主页和公开装备过滤。

---

## 四、总体验收通过标准

本功能只有同时满足以下条件，才算第一版完成：

1. 后端接口完整可用。
2. 数据库表、约束、索引正确。
3. 写操作鉴权正确。
4. 私密装备不会出现在他人视角。
5. 用户不能改别人的装备。
6. 重复添加被拦截。
7. 删除后列表立即更新。
8. 删除后可以重新添加同一装备。
9. 我的页、我的装备页、装备详情页、他人主页、求推荐发布页五条路径都能跑通。
10. 求推荐发布后，详情页能看到从“我的装备”带入的当前已有装备文案。
11. 不新增 `wx.cloud` / 云函数 / 云数据库主链路依赖。
12. 不破坏现有装备库列表、详情、对比、去求推荐能力。
13. 不破坏现有发帖、评论、求推荐采纳等主链路。
14. 文档已回写。

---

## 五、数据库验收标准

## 5.1 表结构验收

表名：

```text
user_gear_items
```

必须包含字段：

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
image_url
ownership_status
usage_status
note
is_public
sort_order
extra
create_time
update_time
delete_time
is_deleted
```

通过标准：

1. 表存在。
2. 主键存在。
3. `gear_type` 限制在 `reel / rod / lure`。
4. `ownership_status` 第一版固定为 `owned`。
5. `usage_status` 限制在 `frequent / backup / idle`。
6. `is_public` 默认值正确。
7. `is_deleted` 默认值正确。
8. `extra` 为 JSONB 或等价 JSON 字段。
9. `create_time / update_time` 自动写入。
10. 软删除字段可用。

建议 SQL 检查：

```sql
\d user_gear_items
```

## 5.2 唯一索引验收

必须防止同一用户重复添加同一件未删除装备。

唯一口径：

```text
user_id + gear_type + gear_master_id + COALESCE(variant_key, '') + is_deleted = false
```

通过标准：

1. 第一次添加成功。
2. 第二次添加相同装备返回重复提示。
3. 删除后可以再次添加相同装备。
4. 用户 A 添加某装备不影响用户 B 添加同一装备。

建议 SQL 检查：

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_gear_items';
```

## 5.3 软删除验收

删除接口不能物理删除记录。

通过标准：

1. 调用 `DELETE /mini/user/gear/:id` 后，记录仍在数据库中。
2. `is_deleted = true`。
3. `delete_time` 有值。
4. 普通列表不再返回该记录。
5. 删除后可重新添加同一装备。

建议 SQL 检查：

```sql
SELECT id, user_id, gear_type, gear_master_id, variant_key, is_deleted, delete_time
FROM user_gear_items
WHERE user_id = :userId
ORDER BY id DESC;
```

---

## 六、后端接口验收标准

## 6.1 `GET /mini/user/gear` 查询我的装备

### 用例 UG-API-001：未添加时返回空列表

前置：用户 A 已登录，尚未添加装备。

请求：

```text
GET /mini/user/gear
```

通过标准：

1. HTTP 状态为 `200`。
2. `code = 0`。
3. `data.summary.total = 0`。
4. `data.items` 是空数组。
5. 不报错。

---

### 用例 UG-API-002：添加后查询自己返回公开 + 私密

前置：用户 A 已添加 1 件公开装备、1 件私密装备。

请求：

```text
GET /mini/user/gear
```

通过标准：

1. 返回 2 条。
2. 公开装备与私密装备都出现。
3. 每条都有：
   - `id`
   - `gearType`
   - `gearMasterId`
   - `displayName`
   - `usageStatus`
   - `usageStatusText`
   - `isPublic`
4. `summary` 数量准确。

---

### 用例 UG-API-003：按分类查询

请求：

```text
GET /mini/user/gear?gearType=reel
GET /mini/user/gear?gearType=rod
GET /mini/user/gear?gearType=lure
```

通过标准：

1. `reel` 只返回鱼轮。
2. `rod` 只返回鱼竿。
3. `lure` 只返回常用饵。
4. summary 与筛选结果一致，或 summary 明确为全量摘要；前后端解释一致即可。

---

### 用例 UG-API-004：他人视角只返回公开装备

前置：用户 A 有 1 件公开装备、1 件私密装备。用户 B 已登录。

用户 B 请求：

```text
GET /mini/user/gear?userId=:userAId
```

通过标准：

1. 只返回用户 A 的公开装备。
2. 不返回用户 A 的私密装备。
3. 返回结果中不能包含任何可推断私密装备存在的字段。
4. `summary.publicTotal` 或等价字段不泄露私密数量。

---

### 用例 UG-API-005：未登录访问他人公开装备

如果本期采用“允许未登录看公开装备”：

```text
GET /mini/user/gear?userId=:userAId
```

通过标准：

1. 未登录也可返回公开装备。
2. 不返回私密装备。
3. 不返回编辑相关字段。

如果本期采用“必须登录后查看”：

通过标准：

1. 返回 `401` 或统一未登录错误。
2. 前端能引导登录。
3. 不能返回私密装备。

两种方案都可以接受，但最终实现必须在文档里写清楚。

---

## 6.2 `POST /mini/user/gear` 添加我的装备

### 用例 UG-API-010：添加鱼轮成功

请求体示例：

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

通过标准：

1. HTTP 状态为 `200` 或 `201`。
2. `code = 0`。
3. 返回新增记录 ID。
4. 数据库新增一条 `gear_type = reel` 的记录。
5. `user_id` 为当前登录用户。
6. `is_deleted = false`。

---

### 用例 UG-API-011：添加鱼竿成功

通过标准：

1. `gearType = rod` 可保存。
2. 列表页归入鱼竿分类。
3. 他人主页展示时归入鱼竿。

---

### 用例 UG-API-012：添加常用饵成功

通过标准：

1. `gearType = lure` 可保存。
2. 用户侧显示文案为“常用饵”。
3. 不显示成生硬的“lure”。

---

### 用例 UG-API-013：重复添加被拦截

前置：用户 A 已添加同一 `gearType + gearMasterId + variantKey`。

再次请求相同 body。

通过标准：

1. 不新增第二条有效记录。
2. 返回业务错误。
3. 前端能显示：`这件装备已经在我的装备里了` 或同义文案。
4. 如果后端返回 `409`，前端能正确处理。

---

### 用例 UG-API-014：不同用户可添加同一装备

前置：用户 A 已添加某装备。

用户 B 添加相同装备。

通过标准：

1. 用户 B 添加成功。
2. 用户 A 与用户 B 的记录互不影响。

---

### 用例 UG-API-015：非法 gearType 被拒绝

请求：

```json
{
  "gearType": "line",
  "gearMasterId": "XXX",
  "displayName": "测试鱼线"
}
```

通过标准：

1. 返回业务错误或参数错误。
2. 不写入数据库。
3. 错误文案可读。

---

### 用例 UG-API-016：gearMasterId 不存在

通过标准：

1. 返回 `404` 或等价业务错误。
2. 不写入数据库。
3. 前端提示：`装备不存在或已下架`。

---

### 用例 UG-API-017：未登录添加被拒绝

请求：不带 token 调用 `POST /mini/user/gear`。

通过标准：

1. 返回 `401`。
2. 不写入数据库。
3. 前端跳转登录或提示登录。

---

## 6.3 `PUT /mini/user/gear/:id` 更新我的装备

### 用例 UG-API-020：更新展示名、状态、备注、公开性

请求体：

```json
{
  "displayName": "C6IM 702M",
  "usageStatus": "backup",
  "isPublic": false,
  "note": "备用竿",
  "sortOrder": 10
}
```

通过标准：

1. 更新成功。
2. `update_time` 变化。
3. 查询自己时能看到新值。
4. 查询他人视角时，如果 `isPublic = false`，不再返回该装备。

---

### 用例 UG-API-021：禁止更新归属与装备主关系

尝试通过 PUT 修改：

```json
{
  "userId": 999,
  "gearType": "rod",
  "gearMasterId": "OTHER",
  "gearVariantId": "OTHER",
  "variantKey": "OTHER"
}
```

通过标准：

1. 后端忽略这些字段，或直接返回参数错误。
2. 数据库中的 `user_id / gear_type / gear_master_id / gear_variant_id / variant_key` 不变化。
3. 不允许“把一条用户装备更新成另一件装备”。

---

### 用例 UG-API-022：用户不能更新别人的装备

前置：用户 A 创建装备记录。用户 B 登录。

用户 B 请求：

```text
PUT /mini/user/gear/:userAGearItemId
```

通过标准：

1. 返回 `403` 或等价权限错误。
2. 数据不变化。
3. 错误文案可读。

---

## 6.4 `DELETE /mini/user/gear/:id` 删除我的装备

### 用例 UG-API-030：删除自己的装备成功

通过标准：

1. 返回 `code = 0`。
2. 列表不再展示该装备。
3. 数据库执行软删除。
4. 删除后可以重新添加相同装备。

---

### 用例 UG-API-031：不能删除别人的装备

通过标准：

1. 用户 B 删除用户 A 的装备，返回 `403`。
2. 用户 A 的装备仍存在。
3. `is_deleted` 不变化。

---

### 用例 UG-API-032：重复删除幂等处理

同一 ID 删除两次。

通过标准：

1. 第二次删除不造成服务异常。
2. 可返回成功或返回“记录不存在 / 已删除”，但前端不能崩。
3. 数据保持软删除状态。

---

## 七、前端页面验收标准

## 7.1 “我的”页入口

### 用例 UG-FE-001：我的页显示入口

路径：

```text
pages/profile/profile.*
```

通过标准：

1. 登录后“我的”页能看到 `我的装备`。
2. 入口位置不挤压核心功能。
3. 点击进入 `我的装备` 页面。
4. 若展示摘要数量，数量与接口返回一致。

---

### 用例 UG-FE-002：未登录点击入口

通过标准：

1. 未登录状态下点击时能引导登录。
2. 登录完成后可进入我的装备页。
3. 不出现空白页或死循环。

---

## 7.2 我的装备管理页

### 用例 UG-FE-010：空状态

前置：用户 A 未添加装备。

通过标准：

1. 页面可正常打开。
2. 显示空状态文案。
3. 显示添加入口。
4. 三个分类 Tab 可切换。
5. 无报错。

---

### 用例 UG-FE-011：三个分类显示

前置：用户 A 已添加鱼轮、鱼竿、常用饵。

通过标准：

1. `鱼轮` Tab 只显示鱼轮。
2. `鱼竿` Tab 只显示鱼竿。
3. `常用饵` Tab 只显示常用饵。
4. 顶部数量准确。
5. 下拉刷新或重新进入后数据保持一致。

---

### 用例 UG-FE-012：装备卡片展示

每张卡片至少展示：

1. 装备图片，若有。
2. 展示名。
3. 品牌或型号。
4. 子型号 / SKU，若有。
5. 使用状态。
6. 公开 / 私密状态。
7. 备注首行，若有。
8. 编辑入口。

通过标准：

1. 卡片信息与后端返回一致。
2. 长名称不撑破布局。
3. 无图片时有默认图或留白合理。

---

### 用例 UG-FE-013：编辑装备

通过标准：

1. 点击编辑进入编辑页或弹层。
2. 原字段正确回填。
3. 修改备注后保存成功。
4. 修改使用状态后保存成功。
5. 修改公开 / 私密后保存成功。
6. 返回列表后立即显示新值。

---

### 用例 UG-FE-014：删除装备

通过标准：

1. 点击删除前有确认提示。
2. 确认后删除成功。
3. 列表立即移除。
4. 取消删除时不删除。
5. 删除失败时显示可读提示。

---

## 7.3 添加装备页 / 弹层

### 用例 UG-FE-020：从我的装备页搜索添加

流程：

```text
我的 → 我的装备 → 添加装备 → 选择分类 → 搜索装备库 → 选择装备 → 选择 SKU → 保存
```

通过标准：

1. 可以选择 `鱼轮 / 鱼竿 / 常用饵`。
2. 搜索走现有装备库能力。
3. 可以选择主型号。
4. 有多个 variant 时可以选择具体 SKU。
5. 保存成功后回到对应分类列表。
6. 新装备立即显示。

---

### 用例 UG-FE-021：添加时必填校验

通过标准：

1. 未选分类不能保存。
2. 未选装备不能保存。
3. 必须有展示名。
4. 多 SKU 装备未选 SKU 时，若 PRD 要求必须选，则不能保存并提示。
5. 错误提示可读。

---

### 用例 UG-FE-022：重复添加提示

通过标准：

1. 用户重复添加同一装备时，页面不崩。
2. 显示：`这件装备已经在我的装备里了` 或同义提示。
3. 列表中不出现重复卡片。

---

## 7.4 装备详情页加入我的装备

### 用例 UG-FE-030：详情页显示入口

路径：

```text
pkgGear/pages/detail/detail.*
```

通过标准：

1. 装备详情页显示 `加入我的装备`。
2. 按钮与 `去求推荐` 区分明确。
3. 不影响原有参数展示、variant 选择、关联帖子、对比入口。

---

### 用例 UG-FE-031：从详情页加入成功

流程：

```text
装备库 → 装备详情 → 选择 SKU → 加入我的装备 → 保存
```

通过标准：

1. 保存成功。
2. toast 提示成功。
3. 按钮状态变为 `已加入我的装备` 或等价状态。
4. 回到我的装备页可看到该装备。

---

### 用例 UG-FE-032：多 SKU 装备必须带具体 variant

前置：装备有多个 variant。

通过标准：

1. 未选 SKU 直接加入时，前端要求选择 SKU。
2. 选中 SKU 后保存。
3. 保存记录中有 `variantKey` 或 `variantLabel`。
4. 展示名包含或能展示具体 SKU。

---

### 用例 UG-FE-033：已加入状态判断

通过标准：

1. 详情页加载后能判断当前装备是否已加入。
2. 已加入同一 `gearMasterId + variantKey` 时按钮显示已加入。
3. 不同 variant 不应误判为已加入，除非本期明确只按 master 判断。
4. 点击已加入可进入编辑页，或显示已加入提示；两者择一即可，但交互要稳定。

---

## 7.5 他人主页展示公开装备

### 用例 UG-FE-040：展示公开装备

路径：

```text
pkgContent/user-profile/user-profile.*
```

前置：用户 A 有公开装备。用户 B 打开用户 A 主页。

通过标准：

1. 他人主页展示 `常用装备` 模块。
2. 只展示公开装备。
3. 按 `鱼轮 / 鱼竿 / 常用饵` 分组或清晰展示。
4. 每类最多展示 3 条，或按本期实现约定。
5. 优先展示 `usageStatus = frequent` 的装备。

---

### 用例 UG-FE-041：私密装备不展示

前置：用户 A 有 1 件私密装备。

通过标准：

1. 用户 B 看不到该装备。
2. 页面源码 / 调试返回数据里也不应有该私密装备。
3. 不展示“还有 1 件私密装备”等泄露性文案。

---

### 用例 UG-FE-042：无公开装备时隐藏模块

通过标准：

1. 用户没有公开装备时，他人主页不显示 `常用装备` 模块。
2. 不展示难看的空状态。
3. 不影响最近帖子、被采纳统计等模块。

---

## 7.6 求推荐发布页选择我的装备

### 用例 UG-FE-050：从我的装备选择当前已有装备

路径可能涉及：

```text
pkgContent/publishMode/publishMode.*
components/post-Question/post-Question.*
```

流程：

```text
发布 → 讨论&提问 → 求推荐 → 当前已有装备 → 从我的装备选择
```

通过标准：

1. 能打开我的装备选择器。
2. 能多选，最多数量按本期约定，建议最多 5 件。
3. 能取消选择。
4. 选中后生成 `recommendMeta.currentGear` 文案。
5. 同时生成 `recommendMeta.currentGearItems` 数组。
6. 用户仍可手动编辑 `currentGear` 文案。

---

### 用例 UG-FE-051：发布后详情页展示当前已有装备

流程：

1. 从我的装备选择 `C6IM 702M`、`阿德 BRF`。
2. 发布求推荐。
3. 打开帖子详情。

通过标准：

1. 帖子发布成功。
2. 详情页求推荐摘要中能看到当前已有装备文案。
3. 不影响 `candidateOptions` 展示。
4. 不把已有装备误显示成候选装备。

---

### 用例 UG-FE-052：手动 currentGear 不被破坏

通过标准：

1. 用户手动输入当前装备仍可保存。
2. 用户从我的装备选择后仍可编辑文本。
3. 编辑后的文本按用户最终输入保存。
4. `currentGearItems` 保持结构化数组，若用户清空选择，应同步清空或按明确规则保留。

---

## 八、权限与隐私验收标准

## 8.1 写操作鉴权

必须登录的接口：

```text
POST /mini/user/gear
PUT /mini/user/gear/:id
DELETE /mini/user/gear/:id
POST /mini/user/gear/sort，若实现
```

通过标准：

1. 未登录调用返回 `401`。
2. token 过期时走现有 refresh 逻辑。
3. refresh 成功后可以重放请求。
4. refresh 失败后引导登录。

## 8.2 归属校验

通过标准：

1. 用户 A 只能编辑自己的装备。
2. 用户 A 只能删除自己的装备。
3. 用户 B 不能通过 ID 猜测修改用户 A 的装备。
4. 后端做强校验，不能只靠前端隐藏按钮。

## 8.3 公开 / 私密校验

通过标准：

1. 自己能看到公开 + 私密。
2. 别人只能看到公开。
3. 未登录用户如果允许访问，也只能看到公开。
4. 私密装备不返回到接口响应中。
5. summary 不泄露私密数量，除非是自己视角。

---

## 九、兼容与回归验收

## 9.1 装备库回归

本功能不能破坏现有装备库。

必须回归：

1. `GET /mini/gear/brands?type=reels`
2. `GET /mini/gear/list?type=reels&page=1&pageSize=10`
3. `GET /mini/gear/detail?type=reels&id=:id`
4. 装备列表页可打开。
5. 装备详情页可打开。
6. variant 选择正常。
7. 原有 `去求推荐` 入口仍可用。
8. 对比页如果已有，仍可加入对比、打开对比。

通过标准：

1. 装备详情不因为新增 `加入我的装备` 报错。
2. 原有字段展示不丢失。
3. 原有 `official_specs / gsc_traits / compare_profile` 增量结构不被破坏。
4. 不新增 `GET /mini/gear/compare` 作为本功能依赖。

## 9.2 他人主页回归

必须回归：

1. 从帖子作者进入他人主页。
2. 从评论作者进入他人主页。
3. 基础资料展示正常。
4. 求推荐统计展示正常。
5. 最近被采纳回答 / 最近帖子摘要展示正常。
6. 无公开装备时不影响其他模块。

## 9.3 求推荐回归

必须回归：

1. 发布普通求推荐。
2. 发布带 `candidateOptions` 的求推荐。
3. 发布带 `currentGear` 的求推荐。
4. 发布带 `currentGearItems` 的求推荐。
5. 详情页展示正常。
6. 规范回答入口正常。
7. 采纳回答不受影响。
8. 补充反馈不受影响，若当前已实现反馈。

## 9.4 登录态回归

必须回归：

1. 正常登录。
2. 退出登录。
3. 登录态过期后打开我的装备页。
4. 登录态过期后执行添加 / 编辑 / 删除。
5. refresh 成功后继续操作。
6. refresh 失败后回登录页。

## 9.5 云开发残留回归

通过标准：

1. 新增代码中不出现新的 `wx.cloud.database()`。
2. 新增代码中不出现新的 `wx.cloud.callFunction()`。
3. 新增代码中不新增 `cloud://` 写入逻辑。
4. `services/api.js` 不新增 `/mini/user/gear` 到云函数的分流。
5. 所有新接口走独立后台 HTTP API。

建议 grep：

```bash
grep -R "wx.cloud" GearSage-client/pkgContent/my-gear* GearSage-client/pkgGear/pages/detail* GearSage-client/services || true
grep -R "cloud://" GearSage-client/pkgContent/my-gear* GearSage-client/pkgGear/pages/detail* || true
```

---

## 十、Smoke Test 最短路径

每次提交前至少跑以下路径。

## 10.1 后端最短路径

1. 启动 API。
2. 登录用户 A。
3. `GET /mini/user/gear`，确认空列表或现有列表。
4. `POST /mini/user/gear` 添加鱼轮。
5. `POST /mini/user/gear` 添加鱼竿。
6. `POST /mini/user/gear` 添加常用饵。
7. `GET /mini/user/gear`，确认 3 条。
8. 重复添加鱼轮，确认重复错误。
9. `PUT /mini/user/gear/:id` 改为私密。
10. 登录用户 B。
11. `GET /mini/user/gear?userId=:userAId`，确认看不到私密装备。
12. 用户 B 尝试 `PUT /mini/user/gear/:userAGearId`，确认失败。
13. 用户 A 删除一件装备。
14. 用户 A 重新添加同一装备，确认成功。

## 10.2 前端最短路径

1. 登录用户 A。
2. 打开“我的”页。
3. 点击“我的装备”。
4. 添加一件鱼轮。
5. 添加一根鱼竿。
6. 添加一个常用饵。
7. 编辑备注。
8. 设置一件为私密。
9. 进入装备详情页，点击 `加入我的装备`。
10. 切换用户 B。
11. 打开用户 A 他人主页，确认只展示公开装备。
12. 切回用户 A。
13. 发一条求推荐，从我的装备选择已有装备。
14. 发布后打开详情，确认当前已有装备展示正确。

---

## 十一、详细测试用例清单

| ID | 模块 | 用例 | 优先级 | 通过标准 |
|---|---|---|---|---|
| UG-DB-001 | 数据库 | 表存在且字段完整 | P0 | `user_gear_items` 字段完整 |
| UG-DB-002 | 数据库 | 唯一索引生效 | P0 | 重复添加被拦截 |
| UG-DB-003 | 数据库 | 软删除生效 | P0 | 删除后 `is_deleted=true` |
| UG-API-001 | 接口 | 空列表查询 | P0 | 返回空数组和 summary |
| UG-API-002 | 接口 | 查询自己公开 + 私密 | P0 | 自己可见全部 |
| UG-API-003 | 接口 | 分类查询 | P0 | 分类过滤正确 |
| UG-API-004 | 接口 | 他人只看公开 | P0 | 私密不泄露 |
| UG-API-010 | 接口 | 添加鱼轮 | P0 | 添加成功 |
| UG-API-011 | 接口 | 添加鱼竿 | P0 | 添加成功 |
| UG-API-012 | 接口 | 添加常用饵 | P0 | 添加成功 |
| UG-API-013 | 接口 | 重复添加 | P0 | 返回重复错误 |
| UG-API-014 | 接口 | 不同用户添加同装备 | P1 | 互不影响 |
| UG-API-015 | 接口 | 非法 gearType | P0 | 返回参数错误 |
| UG-API-016 | 接口 | 不存在的 gearMasterId | P0 | 返回 404 或业务错误 |
| UG-API-017 | 接口 | 未登录添加 | P0 | 返回 401 |
| UG-API-020 | 接口 | 更新装备 | P0 | 可更新允许字段 |
| UG-API-021 | 接口 | 禁止改主关系 | P0 | 主关系不变 |
| UG-API-022 | 接口 | 禁止改别人装备 | P0 | 返回 403 |
| UG-API-030 | 接口 | 删除自己的装备 | P0 | 软删除成功 |
| UG-API-031 | 接口 | 禁止删别人装备 | P0 | 返回 403 |
| UG-FE-001 | 前端 | 我的页入口 | P0 | 可进入我的装备页 |
| UG-FE-010 | 前端 | 我的装备空状态 | P0 | 空状态与添加入口正常 |
| UG-FE-011 | 前端 | 三分类 Tab | P0 | 分类展示正确 |
| UG-FE-012 | 前端 | 卡片展示 | P0 | 信息完整且不破版 |
| UG-FE-013 | 前端 | 编辑装备 | P0 | 保存后回显正确 |
| UG-FE-014 | 前端 | 删除装备 | P0 | 删除确认与列表刷新正常 |
| UG-FE-020 | 前端 | 搜索添加 | P0 | 从装备库选装备保存成功 |
| UG-FE-030 | 前端 | 详情页加入入口 | P0 | 按钮展示且不影响详情页 |
| UG-FE-031 | 前端 | 从详情页加入 | P0 | 加入成功，状态更新 |
| UG-FE-032 | 前端 | 多 SKU 选择 | P0 | 必须带具体 variant |
| UG-FE-040 | 前端 | 他人主页公开装备 | P0 | 只展示公开装备 |
| UG-FE-041 | 前端 | 私密不展示 | P0 | 他人看不到私密装备 |
| UG-FE-050 | 前端 | 求推荐选择我的装备 | P0 | 写入 currentGear/currentGearItems |
| UG-FE-051 | 前端 | 发布后详情展示 | P0 | 当前已有装备展示正确 |
| UG-REG-001 | 回归 | 装备库列表详情 | P0 | 原功能不破坏 |
| UG-REG-002 | 回归 | 他人主页基础信息 | P0 | 原统计不破坏 |
| UG-REG-003 | 回归 | 求推荐发布与详情 | P0 | 原链路不破坏 |
| UG-REG-004 | 回归 | 登录 refresh | P0 | 过期可恢复或登录 |
| UG-REG-005 | 回归 | 无新增云开发依赖 | P0 | 不新增 wx.cloud 主链路 |

---

## 十二、失败判定标准

出现以下任一问题，本功能不得标记为完成：

1. 私密装备在他人视角出现。
2. 用户可以编辑或删除别人的装备。
3. 重复添加导致列表出现重复有效记录。
4. 删除使用物理删除且无软删除痕迹。
5. `POST /mini/user/gear` 未登录也可写入。
6. `gearType` 支持了 PRD 外的类型且无明确设计。
7. 新增代码绕开统一 `services/api.js` 鉴权 / refresh 逻辑。
8. 新增代码重新引入 `wx.cloud` 主链路。
9. 装备详情页因为新增按钮导致原详情无法打开。
10. 求推荐发布页因 `currentGearItems` 改造导致原手动输入失效。
11. 他人主页因为常用装备模块导致基础资料或统计加载失败。
12. 后端 `npm run build` 不通过。
13. 小程序编译报阻塞错误。
14. 文档未回写，Codex 无法判断新增接口和页面状态。

---

## 十三、允许带遗留通过的情况

以下问题可以作为遗留，不阻塞第一版上线，但必须记录：

1. 装备排序暂不支持拖拽，只支持默认排序。
2. `gearVariantId` 暂时为空，但 `variantKey / variantLabel` 能稳定展示。
3. 未登录查看他人公开装备暂时要求登录。
4. 他人主页每类只展示 2 条或 3 条，具体数量只要文档一致即可。
5. `currentGearItems` 只随 `recommendMeta` 存 JSON，不拆独立表。
6. 添加装备时搜索体验较粗糙，但能选到装备并保存。
7. 图片快照缺失时显示默认图。
8. 装备主数据更新后，用户装备快照暂未自动刷新，但展示不报错。

这些遗留必须写入对应任务单，不能口头带过。

---

## 十四、测试数据建议

建议准备两组账号：

```text
用户 A：13800000001
用户 B：13800000002
验证码：按当前环境配置，测试模式通常为 123456
```

用户 A 添加：

```text
鱼轮：Shimano STELLA C3000SDH，公开，常用
鱼竿：C6IM 702M，公开，常用
常用饵：X-80，私密，备用
```

用户 B 用于：

```text
查看用户 A 他人主页
验证只能看到 STELLA / C6IM，看不到 X-80
验证不能编辑 / 删除用户 A 的装备
```

求推荐测试帖建议：

```text
标题：【求推荐】已有 C6IM + 阿德 BRF，想补一个野河翘嘴泛用饵
questionType: recommend
recommendMeta.currentGear: 从我的装备自动生成
recommendMeta.currentGearItems: 从我的装备结构化带入
candidateOptions: 可为空
```

---

## 十五、Codex 执行测试提示

交给 Codex 时可以直接使用下面这段：

```text
请先阅读 docs/GearSage_我的装备_PRD_v1.md 和 docs/GearSage_我的装备_验收测试标准_v1.md。
实现完成后，按验收测试标准逐项自测：
1. npm run build 必须通过。
2. user_gear_items 表、唯一索引、软删除必须通过数据库检查。
3. /mini/user/gear 的 GET/POST/PUT/DELETE 必须跑通。
4. 必须用两个测试用户验证公开/私密与归属权限。
5. 小程序必须跑通：我的页入口、我的装备管理页、装备详情页加入、他人主页公开展示、求推荐 currentGear 选择。
6. 不得重写 /mini/gear/*、/mini/topic*、/mini/user/info 主链路。
7. 不得新增 wx.cloud 主链路。
8. 完成后回写小程序页面切接口清单、独立后台迁移计划施工记录版、对应任务单/验收清单。
```

---

## 十六、最终验收记录模板

验收时建议按以下格式记录：

```text
功能：我的装备 v1
验收日期：YYYY-MM-DD
验收环境：local / remote
API 地址：
客户端版本 / commit：
后端版本 / commit：
数据库：

一、构建结果
- API npm run build：通过 / 不通过
- 小程序编译：通过 / 不通过

二、后端接口
- GET /mini/user/gear：通过 / 不通过
- POST /mini/user/gear：通过 / 不通过
- PUT /mini/user/gear/:id：通过 / 不通过
- DELETE /mini/user/gear/:id：通过 / 不通过

三、权限隐私
- 自己看公开 + 私密：通过 / 不通过
- 他人只看公开：通过 / 不通过
- 禁止改别人装备：通过 / 不通过
- 禁止删别人装备：通过 / 不通过

四、前端路径
- 我的页入口：通过 / 不通过
- 我的装备页：通过 / 不通过
- 添加 / 编辑 / 删除：通过 / 不通过
- 装备详情页加入：通过 / 不通过
- 他人主页常用装备：通过 / 不通过
- 求推荐选择我的装备：通过 / 不通过

五、回归
- 装备库列表 / 详情：通过 / 不通过
- 他人主页基础统计：通过 / 不通过
- 求推荐发布 / 详情：通过 / 不通过
- 登录 refresh：通过 / 不通过
- 无新增 wx.cloud 主链路：通过 / 不通过

六、阻塞问题
1.
2.
3.

七、允许遗留
1.
2.
3.

结论：通过 / 带遗留通过 / 不通过
验收人：
```

---

## 十七、2026-05-14 本地验收记录

功能：我的装备 v1  
验收日期：2026-05-14  
验收环境：local  
API 地址：`http://127.0.0.1:3011`  
数据库：`postgresql://tommy@127.0.0.1:5432/gearsage`

### 一、构建结果

- API `npm run build`：通过
- 小程序编译：通过，微信开发者工具 CLI `preview` 成功，包体统计 `TOTAL 2.9 MB`

### 二、数据库检查

- `user_gear_items` 表存在，字段完整
- `gear_type / ownership_status / usage_status` check 约束存在
- `extra` 为 `jsonb`
- `is_public` 默认 `true`
- `is_deleted` 默认 `false`
- `ux_user_gear_active_unique` 存在，唯一口径为 `user_id + gear_type + gear_master_id + COALESCE(variant_key, '') WHERE is_deleted = false`
- 删除接口执行后原记录保留，`is_deleted = true` 且 `delete_time` 有值
- 删除后重新添加同一装备成功

### 三、后端接口

- `GET /mini/user/gear`：通过
- `POST /mini/user/gear`：通过
- `PUT /mini/user/gear/:id`：通过
- `DELETE /mini/user/gear/:id`：通过
- 未登录 `POST /mini/user/gear` 返回 `401`：通过
- 非法 `gearType` 返回参数错误：通过
- 不存在 `gearMasterId` 返回 `404`：通过
- 重复添加返回 `409`：通过

### 四、权限隐私

- 测试用户 A：`13951460003`，本地用户 ID `15`
- 测试用户 B：`13951460004`，本地用户 ID `16`
- 用户 A 自己可见公开 + 私密：通过
- 用户 B 查看用户 A 只返回公开装备：通过
- 未登录指定 `userId` 查看只返回公开装备：通过
- 用户 B 更新用户 A 装备返回 `403`：通过
- 用户 B 删除用户 A 装备返回 `403`：通过

### 五、前端路径

- “我的”页入口：微信开发者工具中已从 `pages/profile/profile` 点击进入 `pkgContent/my-gear/my-gear`
- 我的装备管理页：微信开发者工具中已打开，空状态、三分类 Tab、添加入口可见
- 添加 / 编辑 / 删除：微信开发者工具中已进入 `pkgContent/my-gear-edit/my-gear-edit`，装备库搜索结果可见；保存 / 编辑 / 删除动作由接口 smoke 覆盖
- 装备详情页加入：代码路径已覆盖，`pkgGear/pages/detail/detail` 调用 `GET/POST /mini/user/gear`
- 他人主页公开展示：代码路径已覆盖，接口 smoke 已验证私密不返回
- 求推荐选择我的装备：代码路径已覆盖，`post-Question` 写入 `currentGear/currentGearItems`
- 微信开发者工具 CLI `preview` 编译通过；本轮已手动点通“我的页入口 / 我的装备页 / 添加装备页”，装备详情加入、他人主页公开展示、求推荐选择由代码路径 + API smoke + 编译覆盖，未额外写入当前模拟器用户的 UI 测试数据

### 六、回归

- `GET /mini/gear/brands?type=reels`：通过
- `GET /mini/gear/list?type=reels&page=1&pageSize=10`：通过
- `GET /mini/gear/detail?type=reels&id=ARE1000`：通过
- `GET /mini/user/info?id=:id`：通过
- 新增链路 grep 未发现 `wx.cloud` / `cloud://` / `callFunction` / `database()` 主链路：通过

### 七、允许遗留

1. 装备排序第一版仅保留 `sortOrder` 字段与编辑保存，不做拖拽排序。
2. 添加装备搜索第一版复用 `GET /mini/gear/list` 前 500 条并本地过滤，后续如装备量继续增加再评估服务端搜索增强。
3. 本轮自动化验收覆盖 API、数据库、静态语法和微信开发者工具 preview 编译；手动 UI 覆盖到入口、管理页、添加页，未做完整逐屏截图留档。

结论：带遗留通过。

---

## 十八、一句话收束

我的装备 v1 的验收重点只有一个：

> 让用户能稳定维护自己的真实装备，并保证这些装备只在正确的地方、按正确的隐私规则、服务正确的业务上下文出现。

如果它变成装备墙、收藏夹、交易入口或自动推荐系统，就偏离了第一版目标。
