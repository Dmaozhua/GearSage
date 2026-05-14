# P3-B 系统介入式选型推荐施工任务单 v1

版本：v1.0  
状态：建议执行版  
适用对象：Tommy / Codex / Cursor / GearSage-api / GearSage-client  
更新时间：2026-05-14

---

## 一、阶段定义

P3-B 建议新增一条产品深化主线：

> 系统介入式选型推荐：让用户从“预算 + 场景 + 目标鱼 + 基础规格”直接得到选择分支与候选装备。

这不是替代求推荐，而是放在求推荐之前。

---

## 二、当前基线

施工前必须确认：

1. 求推荐继续复用 `questionType = recommend`。
2. 求推荐发布继续复用 `/mini/topic` 主链路。
3. 求推荐回答继续复用 `/mini/comment` 主链路。
4. 装备库列表 / 详情已切到独立后台。
5. 装备详情页和对比页已经具备跳转求推荐的方向。
6. 推荐结果必须能转成 `recommendMeta.candidateOptions`。

---

## 三、本阶段目标

### 3.1 产品目标

用户输入：

- M 硬度
- 枪柄
- 1200 预算
- 目标鱼
- 使用场景
- 玩法倾向或“不确定”

系统输出：

- 专注软饵
- 专注硬饵
- 泛用轻量
- 结实耐用
- 预算收紧
- 提预算一步到位

每个分支都能跳：

- 装备详情
- 装备对比
- 求推荐发布页
- 关联使用经验帖

### 3.2 技术目标

新增最小接口：

```http
POST /mini/recommend/selection
```

可选新增表：

```text
gear_selection_sessions
```

新增前端页面：

```text
pkgGear/pages/selection-guide/selection-guide
```

---

## 四、明确不做

第一版不做：

1. 不做 AI 大模型黑盒推荐。
2. 不做后台规则配置中心。
3. 不做全品类一次性覆盖。
4. 不做复杂推荐图谱。
5. 不做“自动告诉你最佳购买结论”。
6. 不改现有 `/mini/topic*`、`/mini/comment*`、`/mini/gear/*` 路径。

---

## 五、施工分组

## A 组：后端推荐模块骨架

### A1. 新增 recommend 模块

新增文件：

```text
src/modules/recommend/recommend.controller.ts
src/modules/recommend/recommend.service.ts
src/modules/recommend/recommend-rule.service.ts
src/modules/recommend/recommend-evidence.service.ts
src/modules/recommend/recommend.types.ts
src/modules/recommend/dto/create-selection.dto.ts
src/modules/recommend/config/rod-selection-rules.ts
src/modules/recommend/config/reel-selection-rules.ts
```

验收：

- `npm run build` 通过。
- `POST /mini/recommend/selection` 有空实现并返回 `{ code: 0 }`。

### A2. DTO 与输入校验

最低支持字段：

- `gearCategory`
- `rodType`
- `power`
- `budgetMax`
- `targetFish`
- `useScene`
- `technique`
- `carePriorities`
- `source`

验收：

- 缺少 `gearCategory` 返回明确错误。
- 鱼竿缺少 `rodType / power` 返回 `missingFields` 或校验提示。
- 不出现服务端 500。

---

## B 组：鱼竿第一版规则

### B1. 固定 6 个分支

先做：

1. `softbait_focus`：专注软饵
2. `hardbait_focus`：专注硬饵
3. `allround_light`：泛用轻量
4. `durable`：结实耐用
5. `budget_down`：预算收紧
6. `budget_up`：提预算一步到位

验收：

- M 枪柄 / 1200 / 鲈鱼可返回至少 3 个分支。
- 分支名称和文案稳定。
- 每个分支有推荐理由和取舍提醒。

### B2. 候选匹配逻辑

硬筛：

- `gearCategory = rod`
- `rodType = casting`
- `power = M`
- `is_show = 1`
- 预算匹配或预算弹性匹配

软匹配：

- 目标鱼
- 场景
- 玩法
- 长度
- 资料完整度
- 关联帖子数量

验收：

- 不返回隐藏装备。
- 不返回完全不相关品类。
- 无价格字段时不直接剔除，但降低置信度。

---

## C 组：证据帖聚合

### C1. 关联帖子查询

优先级：

1. `gearItemId` 精确绑定。
2. `relatedGearItemId` 精确绑定。
3. `gearModel / relatedGearModel` 文本匹配。
4. 同品牌同型号弱匹配。

验收：

- 每个候选最多返回 3 条帖子。
- 无帖子时返回空数组。
- 不影响现有 `GET /mini/topic/all`。

### C2. 证据帖展示字段

返回：

- `topicId`
- `title`
- `summary`
- `topicCategory`
- `authorNickName`
- `reason`

验收：

- 前端能展示标题和跳转。
- 不需要一次性展示全文。

---

## D 组：前端选型向导页面

### D1. 新增页面

建议路径：

```text
pkgGear/pages/selection-guide/selection-guide.js
pkgGear/pages/selection-guide/selection-guide.wxml
pkgGear/pages/selection-guide/selection-guide.wxss
pkgGear/pages/selection-guide/selection-guide.json
```

页面结构：

1. 需求输入区。
2. 必要信息追问区。
3. 生成按钮。
4. 分支卡片结果区。
5. 结果动作区。

验收：

- 可以输入 M 枪柄 / 1200 / 鲈鱼 / 野河水库。
- 点击生成后调用 `POST /mini/recommend/selection`。
- 能渲染分支卡片。

### D2. 入口接入

新增入口：

- 装备库首页 / 列表页：`帮我选装备`
- 求推荐发布页：`还没有候选？先让系统帮你生成`
- 装备详情页：保留现有 `去求推荐`，后续可增加 `找相似路线`

验收：

- 至少一个入口可进入选型向导。
- 不破坏现有装备详情页和求推荐发布页。

---

## E 组：结果页动作

### E1. 看装备详情

动作：

```text
/pkgGear/pages/detail/detail?id=:gearItemId&type=:gearCategory&from=selection_guide
```

验收：

- 能从分支卡片进入装备详情。

### E2. 加入对比

动作：

- 写入本地对比池。
- 跳转对比页。

验收：

- 2~3 个候选可进入对比页。
- 继续复用 `GET /mini/gear/detail` 聚合。

### E3. 带去求推荐

动作：

- 将结果映射为 `recommendMeta.candidateOptions`。
- 写入本地缓存。
- 跳转发布页。

建议缓存 key：

```text
recommend_prefill_from_selection
```

验收：

- 发布页能读取缓存并预填候选项。
- 用户可以继续编辑标题、预算、核心问题。
- 发布后仍走 `/mini/topic`。

---

## F 组：日志与闭环

### F1. 可选新增表

新增：

```text
gear_selection_sessions
```

验收：

- 生成推荐时写入 input / result。
- 从推荐生成求推荐帖时回写 `createdTopicId`。

### F2. 后续反馈挂钩

暂不做自动学习，只预留：

- `selectionSessionId`
- `branchKey`
- `candidateOptions.source = selection_guide`

验收：

- 求推荐帖中能看出候选项来自选型向导。

---

## 六、Smoke Test 清单

### 6.1 最短路径

1. 打开选型向导。
2. 输入：鱼竿 / 枪柄 / M / 1200 / 鲈鱼 / 野河。
3. 点击生成。
4. 看到 3~6 个分支。
5. 点击一个分支的装备详情。
6. 返回后选择 2 个候选加入对比。
7. 点击“带着这些候选去求推荐”。
8. 发布页候选项被预填。
9. 保存草稿。
10. 发布求推荐帖。

### 6.2 通过标准

- 接口无 500。
- 分支卡片内容完整。
- 装备详情可跳转。
- 对比页可打开。
- 求推荐发布页预填正确。
- 发布后详情页能看到候选项。

---

## 七、给 Codex 的第一轮提示词

```text
请基于当前 GearSage-api 的 NestJS 结构新增系统介入式选型推荐第一版。

要求：
1. 不修改现有 /mini/topic*、/mini/comment*、/mini/gear/* 路径。
2. 新增 POST /mini/recommend/selection。
3. 新增 src/modules/recommend/* 文件，按当前 app.module.ts 直接注册 controller/provider 的风格接入。
4. 第一版先支持 rod/casting/M/预算/目标鱼/场景，返回 6 个 branch 的结构。
5. 候选装备从现有 gear_master / gear_variants 读取，只返回 is_show=1。
6. 每个 branch 返回 branchKey、branchTitle、branchSummary、primaryGear、whyRecommended、tradeOffs、evidencePosts、actions。
7. evidencePosts 可先通过现有 topic service 或 SQL 查询 gearItemId 相关帖子，最多 3 条。
8. 返回结构必须保持 { code, message, data }。
9. npm run build 必须通过。
10. 不要引入大模型、不要新增复杂规则表、不要重构 topic/comment/gear 模块。
```

---

## 八、完成标准

本阶段完成后，GearSage 应该具备：

- 用户从模糊需求生成候选分支。
- 候选分支可解释。
- 候选分支可跳装备库。
- 候选分支可进入对比。
- 候选分支可生成求推荐帖候选项。
- 选型向导不替代社区，而是给社区问题提供更好的起点。

---

## 九、2026-05-14 第一轮施工记录

### 已完成

- 后端新增 `src/modules/recommend/*`，并在 `app.module.ts` 直接注册 `RecommendController / RecommendService / RecommendRuleService / RecommendEvidenceService`。
- 新增 `POST /mini/recommend/selection`，保持 `{ code, message, data }` 返回结构。
- 第一版仅支持 `gearCategory=rod`，按固定 6 个分支模板生成候选：`softbait_focus / hardbait_focus / allround_light / durable / budget_down / budget_up`。
- 候选读取 `gear_master / gear_variants / gear_brands`，并过滤 `isShow=0`。
- 证据帖按 `bz_mini_topic.extra.gearItemId / relatedGearItemId / gearModel / relatedGearModel` 与标题弱匹配，最多返回 3 条；没有证据帖时返回空数组。
- 前端新增 `pkgGear/pages/selection-guide/selection-guide.*`，已注册到 `app.json` 的 `pkgGear` 分包。
- 装备库 tab 和鱼竿列表页新增选型向导入口。
- 选型结果支持跳装备详情、写入 `gear_compare_pool_v1` 进入对比页、写入 `recommend_prefill_from_selection` 进入 `publishMode?from=selection_guide`。
- `publishMode` 已兼容 `selection_guide` 来源，继续通过 `post-question -> postPreview -> /mini/topic` 发布。
- 已新增计划文件：`.omx/plans/2026-05-14_p3b_selection_guide_plan.md`。

### 第一轮后仍未做

- 未做渔轮/鱼饵/鱼线/整套搭配扩展。
- 未做 AI/LLM 推荐、后台规则配置、自动学习采纳数据。

### 已验证

- `/Users/tommy/GearSage/GearSage-api` 下 `npm run build` 通过。

### 逻辑自检补充

- 使用本地 PostgreSQL 验证候选装备 SQL 可读取 `gear_master / gear_variants / gear_brands`，本地 `rod` 可见主数据为 664 条。
- 使用临时后端实例验证 `POST /mini/recommend/selection` 路由、DTO、服务链路可正常返回。
- 自检发现“鲈鱼 / 野河 / 枪柄 M”样例曾命中海水、船钓、鱿鱼语境装备，已补充淡水场景排除逻辑。
- 自检发现子型号柄型存在 `C/B/S` 短码，已补充 `casting/spinning` 与短码的兼容匹配。
- 自检发现价格展示丢失币种符号，已改为保留原始价格文本，例如 `$59.99` 显示为 `约 $59.99`。

---

## 十、2026-05-14 下一阶段准备

下一阶段建议保持 P3-B 范围，不进入 AI、规则后台或全品类扩展。优先把第一轮能力补成可验收、可追踪的闭环。

### 10.1 阶段边界

允许改动：

- 新增轻量 `gear_selection_sessions` 持久化。
- `POST /mini/recommend/selection` 返回真实 `sessionId`。
- 求推荐预填继续携带 `selectionSessionId / selectionSource`。
- 补齐求推荐发布页进入选型向导入口。
- 证据帖卡片支持跳帖子详情。
- 基于现有 `raw_json` 字段继续收紧规则匹配。

保持稳定：

- 不改 `/mini/topic*`、`/mini/comment*`、`/mini/gear/*` 主链路。
- 不改 `{ code, message, data }` 响应结构。
- 不改 `/mini/topic` 作为求推荐发布链路。
- 不引入 AI、后台规则配置中心或新 compare 接口。

### 10.2 推荐执行顺序

1. **P3-B-2A：验收缺口补齐**
   - 从求推荐发布页增加“先生成选择分支”入口。
   - 证据帖标题可点击进入帖子详情。
   - 复核 `candidateOptions` 在发布页仍可编辑，来源元数据保留在 `selectionSource`。

2. **P3-B-2B：选型会话持久化**
   - 新增 `gear_selection_sessions` 表和 additive SQL。
   - 推荐生成时保存 input/result。
   - 返回真实 `sessionId`。
   - 预填求推荐时携带 `selectionSessionId`。
   - 若求推荐帖创建成功，可非阻塞回写 `createdTopicId`。

3. **P3-B-2C：规则质量加固**
   - 用 `player_environment / recommended_rig_pairing / guide_use_hint / player_positioning` 等字段增强场景匹配。
   - 为目标鱼、使用场景增加软评分。
   - 固化 3~4 个本地 curl fixture，防止淡水场景再次命中明显海水/船钓路线。

### 10.3 最小验收路径

- 装备 tab -> 选型向导 -> 生成分支。
- 鱼竿列表 -> 选型向导 -> 生成分支。
- 求推荐发布页 -> 选型向导 -> 生成分支 -> 回到求推荐预填。
- 分支 -> 装备详情。
- 分支 -> 对比页。
- 分支 -> 证据帖详情。
- `POST /mini/recommend/selection` 返回非空 `sessionId`。
- 已生成求推荐帖能看出候选来自 `selection_guide`。

详细执行准备见：`.omx/plans/2026-05-14_p3b_selection_guide_next_stage.md`。

---

## 十一、2026-05-14 P3-B-2A / P3-B-2B 施工记录

### 已完成

- 求推荐发布表单的候选项区域新增“先生成选择分支”入口，跳转 `/pkgGear/pages/selection-guide/selection-guide?source=publish`。
- 选型结果中的证据帖卡片支持点击跳转 `/pkgContent/detail/detail?id=:topicId`。
- 新增 `gear_selection_sessions` 表，启动初始化 SQL 和单独 additive SQL 均已补齐。
- 新增 `RecommendSessionService`，推荐生成时写入 `input_json / result_json / source / gear_category`。
- `POST /mini/recommend/selection` 已接入 `OptionalJwtAuthGuard`，未登录可用，登录时记录 `user_id`。
- `POST /mini/recommend/selection` 返回真实 `sessionId`，并写入 `topicDraftPayload.recommendMeta.selectionSource.selectionSessionId`。
- 选型结果进入求推荐发布页时保留 `selectionSessionId / selectionSource`。
- `/mini/topic` 保存草稿或发布成功后，会按 `selectionSessionId` 非阻塞回写 `gear_selection_sessions.created_topic_id`；回写失败不影响发帖主链路。

### 已验证

- `/Users/tommy/GearSage/GearSage-api` 下 `npm run build` 通过。
- 相关小程序 JS `node --check` 通过。
- 本地 PostgreSQL 已执行 `sql/add_gear_selection_sessions.sql`，表和索引创建成功。
- 本地临时后端实例调用 `POST /mini/recommend/selection` 成功返回 `sessionId=1`，且 `gear_selection_sessions` 有对应记录。

### 仍待手动 smoke

- 微信开发者工具中确认：求推荐发布页入口 -> 选型向导 -> 生成结果 -> 去求推荐预填。
- 微信开发者工具中确认：有证据帖时点击证据帖可打开帖子详情。

---

## 十二、2026-05-14 P3-B-2C 规则质量加固记录

### 已完成

- 推荐规则增加目标鱼 / 使用场景软评分，基于 `raw_json` 中的 `player_environment / recommended_rig_pairing / guide_use_hint / player_positioning` 等文本语境参与排序。
- 保留前一轮淡水场景硬排除逻辑，避免“鲈鱼 / 野河”等输入优先命中明显海水、船钓、鱿鱼路线。
- 新增本地 smoke 脚本：`/Users/tommy/GearSage/GearSage-api/scripts/smoke_selection_guide.sh`。

### 已验证

- `/Users/tommy/GearSage/GearSage-api` 下 `npm run build` 通过。
- `scripts/smoke_selection_guide.sh` 覆盖以下样例并通过：
  - `casting / M / 1200 / 鲈鱼 / 野河`
  - `spinning / L / 800 / 马口 / 溪流`
  - 缺少必要字段
  - 不支持品类

### 下一步建议

- 在微信开发者工具跑完整页面 smoke 后，再决定是否扩展渔轮规则。
- 暂不进入规则后台或自动学习；等 session 数据积累后再评估。
