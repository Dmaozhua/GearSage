# GearSage 系统介入式选型推荐 PRD v1

版本：v1.0  
状态：建议进入 P3-B / 产品深化评审  
适用范围：GearSage-client / GearSage-api / 装备库 / 求推荐模块 / 后续数据规则维护  
更新时间：2026-05-14

---

## 一、背景与判断

当前 GearSage 的“求推荐”已经能让用户结构化表达纠结，也能让其他用户按模板回答、采纳、反馈。但它仍然假设用户已经知道自己在纠结什么，例如：A 还是 B、某两个型号怎么选、某个装备是否适合自己。

真实用户更常见的起点不是“我在 A/B 之间纠结”，而是：

> 我想要一根 M 硬度枪柄，预算 1200，钓鲈鱼/翘嘴，主要玩软饵还是硬饵还没想清楚。

这时 GearSage 应该先把用户从“模糊需求”带到“可比较候选项”，然后才进入装备库对比、发求推荐帖、社区回答与采纳反馈。

因此本模块建议新增：**系统介入式选型推荐**，也可命名为：

- 选型向导
- 系统推荐
- 帮我选装备
- 从需求找装备

建议产品内部统一叫：`selection_guide`。

---

## 二、产品定位

### 2.1 一句话定位

系统介入式选型推荐是 GearSage 的“需求到候选项生成器”。它不替用户做最终购买决定，而是基于装备库数据、使用场景、预算、目标鱼和玩法偏好，生成可解释的选择分支。

### 2.2 它解决的问题

1. 用户不知道自己该看哪些装备。
2. 用户只知道预算、硬度、目标鱼、场景，不知道具体型号。
3. 用户不会把模糊需求转换成装备库筛选条件。
4. 用户不会自然组织一篇高质量求推荐帖。
5. 装备库现在偏“查资料”，求推荐偏“问别人”，中间缺一层“系统帮我收敛候选”。

### 2.3 它不解决的问题

第一版不做：

1. 不承诺“唯一最佳答案”。
2. 不做黑盒 AI 购买决策。
3. 不做复杂评分大模型。
4. 不替代社区回答。
5. 不直接生成“买这个就对了”的强结论。
6. 不把装备库对比页改成自动判胜负工具。

---

## 三、目标链路

建议把 GearSage 的推荐链路改成四段：

```text
模糊需求
  ↓
系统选型向导：生成选择分支 + 候选装备
  ↓
装备库详情 / 对比：看参数和关联经验
  ↓
求推荐帖：带着候选项去问人，并沉淀采纳与反馈
```

用户最终应该感受到：

> 我不是自己在装备库里瞎翻，而是 GearSage 先帮我把可能路线列出来，再让我按路线看装备、看经验、问别人。

---

## 四、入口设计

### 4.1 首页入口

建议在首页或装备库首页新增入口：

- `帮我选装备`
- `不知道买什么？从需求开始`
- `输入预算和场景，生成候选清单`

### 4.2 装备库入口

装备库列表页 / 详情页 / 对比页都可以进入：

- 列表页：`条件太多？让系统帮你收敛`
- 详情页：`看完参数还是纠结？去求推荐`
- 对比页：`带着这几个候选继续问`

### 4.3 发帖入口

在“讨论&提问 -> 求推荐”发布页顶部新增：

- `还没有候选项？先让 GearSage 帮你生成几个方向`

点击后进入选型向导，生成候选项后回填 `recommendMeta.candidateOptions`。

---

## 五、用户输入字段

### 5.1 通用品类字段

| 字段 | 必填 | 类型 | 示例 | 说明 |
|---|---:|---|---|---|
| `gearCategory` | 是 | string | `rod` | 装备类型，第一版建议先做鱼竿 / 渔轮 |
| `budgetMin` | 否 | number | `800` | 预算下限 |
| `budgetMax` | 是 | number | `1200` | 预算上限 |
| `budgetFlexible` | 否 | string | `slightly_up` | 预算是否可上浮 |
| `targetFish` | 是 | string[] | `鲈鱼`、`翘嘴` | 最多 3 个 |
| `useScene` | 是 | string[] | `野河`、`水库` | 最多 2 个 |
| `userLevel` | 否 | string | `beginner` | 新手 / 进阶 / 老手 |
| `carePriorities` | 否 | string[] | `泛用`、`轻量`、`耐用` | 最多 3 个 |
| `avoidPoints` | 否 | string[] | `不想太重` | 最多 3 个 |
| `brandPreference` | 否 | string[] | `Daiwa`、`Shimano` | 品牌偏好 |
| `ownedGear` | 否 | string | `已有泛用水滴轮` | 当前已有装备 |

### 5.2 鱼竿专属字段

| 字段 | 必填 | 类型 | 示例 | 说明 |
|---|---:|---|---|---|
| `rodType` | 是 | string | `casting` | 枪柄 / 直柄 |
| `power` | 是 | string | `M` | 硬度 |
| `lengthPreference` | 否 | string | `6'6"~6'10"` | 长度偏好 |
| `lureWeightRange` | 否 | string | `5~18g` | 常用饵重 |
| `technique` | 否 | string[] | `软饵`、`硬饵` | 玩法 |
| `transportNeed` | 否 | string | `two_piece_ok` | 是否需要多节 |

### 5.3 渔轮专属字段

| 字段 | 必填 | 类型 | 示例 | 说明 |
|---|---:|---|---|---|
| `reelType` | 是 | string | `baitcasting` | 水滴轮 / 纺车轮 |
| `lineType` | 否 | string | `PE` | 常用线种 |
| `lureWeightRange` | 否 | string | `5~18g` | 常用饵重 |
| `brakePreference` | 否 | string | `easy_control` | 更重视易控还是远投 |

---

## 六、必要信息不足时的追问规则

系统不要一上来就让用户填大表。第一版建议用“必要字段 + 智能追问”的轻交互。

### 6.1 鱼竿最低可推荐字段

鱼竿第一版最低要求：

- 装备类型：鱼竿
- 枪柄 / 直柄
- 硬度
- 预算上限
- 目标鱼
- 场景

例如用户输入：

> M 枪柄，1200，钓鲈鱼

系统只需要再追问一个关键问题：

> 你主要想玩软饵、硬饵，还是先要泛用？

如果用户不确定，系统可以生成三条分支：软饵优先 / 硬饵优先 / 泛用优先。

### 6.2 不追问也可生成的情况

如果用户选择“我也不知道”，系统应直接生成分支，而不是卡住：

- 软饵优先
- 硬饵优先
- 泛用轻量
- 结实耐用
- 预算收紧
- 提预算一步到位

---

## 七、输出结构

### 7.1 输出形态

系统输出不是一条推荐，而是一组**选择分支卡片**。

每个分支包含：

| 字段 | 说明 |
|---|---|
| `branchKey` | 分支标识，如 `softbait_focus` |
| `branchTitle` | 分支名称，如 `专注软饵` |
| `branchSummary` | 一句话解释 |
| `primaryGear` | 主推荐装备 |
| `alternativeGears` | 备选装备，0~2 个 |
| `matchedVariant` | 具体子型号 / 规格，若能确定 |
| `whyRecommended` | 推荐理由 |
| `tradeOffs` | 取舍提醒 |
| `budgetFit` | 预算匹配状态 |
| `confidence` | `high / medium / low` |
| `evidencePosts` | 关联使用经验帖 |
| `actions` | 查看详情 / 加入对比 / 带去求推荐 |

### 7.2 示例输出

用户输入：

```json
{
  "gearCategory": "rod",
  "rodType": "casting",
  "power": "M",
  "budgetMax": 1200,
  "targetFish": ["鲈鱼"],
  "useScene": ["野河", "水库"],
  "technique": ["不确定"]
}
```

系统输出示例：

```json
{
  "summary": "你现在不是在选某一根竿，而是在选玩法路线。M 枪柄 1200 预算可以先分成软饵优先、硬饵优先、泛用轻量、结实耐用、预算收紧和提预算六条路线。",
  "branches": [
    {
      "branchKey": "softbait_focus",
      "branchTitle": "专注软饵",
      "branchSummary": "更重视底感、轻量和细腻操作。",
      "primaryGear": {
        "gearItemId": 101,
        "gearLabel": "示例：Daiwa Palms 66M-ST",
        "gearCategory": "rod"
      },
      "whyRecommended": ["M 硬度覆盖常见鲈鱼软饵", "长度更适合精细操作", "预算与需求接近"],
      "tradeOffs": ["硬饵远投和大范围搜索不是最强项"],
      "actions": ["gear_detail", "add_compare", "ask_with_this"]
    },
    {
      "branchKey": "hardbait_focus",
      "branchTitle": "专注硬饵",
      "branchSummary": "更适合米诺、铅笔、小胖子等搜索型硬饵。",
      "primaryGear": {
        "gearItemId": 102,
        "gearLabel": "示例：Daiwa Black Label 610M",
        "gearCategory": "rod"
      },
      "whyRecommended": ["长度和调性更适合抛投与控饵", "覆盖水库和野河搜索"],
      "tradeOffs": ["软饵细腻底感不一定优先"]
    },
    {
      "branchKey": "allround_light",
      "branchTitle": "泛用轻量",
      "branchSummary": "适合暂时不确定玩法、先买一根覆盖面更大的竿。",
      "primaryGear": {
        "gearItemId": 103,
        "gearLabel": "示例：Shimano 荣光二代 610M",
        "gearCategory": "rod"
      }
    },
    {
      "branchKey": "durable",
      "branchTitle": "结实耐用",
      "branchSummary": "优先考虑容错、耐用和新手使用安全感。",
      "primaryGear": {
        "gearItemId": 104,
        "gearLabel": "示例：Shimano 邦汤姆 610M",
        "gearCategory": "rod"
      }
    },
    {
      "branchKey": "budget_down",
      "branchTitle": "预算收紧",
      "branchSummary": "如果想压预算，优先找参数接近、口碑稳定的低一档系列。",
      "primaryGear": {
        "gearItemId": 105,
        "gearLabel": "示例：Shimano EXP 系列",
        "gearCategory": "rod"
      }
    },
    {
      "branchKey": "budget_up",
      "branchTitle": "提预算一步到位",
      "branchSummary": "如果能上浮预算，优先看更轻、更细腻、更有长期使用价值的系列。",
      "primaryGear": {
        "gearItemId": 106,
        "gearLabel": "示例：Olympic Vigore 系列",
        "gearCategory": "rod"
      }
    }
  ]
}
```

说明：以上型号仅用于产品流程示例。真实上线必须以 GearSage 装备库中实际存在的 `gearItemId / gearLabel / variant` 为准。

---

## 八、推荐生成规则

### 8.1 第一层：硬筛选

先用用户输入过滤明显不匹配项：

- 品类：rod / reel / lure
- 枪柄 / 直柄
- 硬度
- 预算区间
- 目标鱼
- 使用场景
- 可展示状态 `is_show = 1`

### 8.2 第二层：分支模板

第一版不要直接做一个总分，而是先按分支模板分流：

| 分支 | 说明 |
|---|---|
| `softbait_focus` | 软饵优先 |
| `hardbait_focus` | 硬饵优先 |
| `allround_light` | 泛用轻量 |
| `durable` | 结实耐用 |
| `budget_down` | 预算收紧 |
| `budget_up` | 提预算一步到位 |

### 8.3 第三层：候选打分

每个分支内部可以用轻量打分：

```text
score = 硬条件匹配分 + 预算匹配分 + 玩法匹配分 + 目标鱼/场景匹配分 + 装备库资料完整度分 + 关联帖子证据分
```

第一版不建议把分数直接展示给用户。用户看到的是：

- 推荐理由
- 取舍提醒
- 关联证据
- 置信度

### 8.4 第四层：证据补强

每个候选装备尽量补：

- 装备详情跳转
- 关联测评帖
- 关联求推荐帖
- 被采纳回答摘要
- 用户使用经验帖

如果没有关联帖子，要明确展示：

> GearSage 暂时没有足够使用经验帖，当前主要基于装备库参数与规则给出。

---

## 九、与现有求推荐模块的关系

系统选型向导生成结果后，应提供三个动作：

1. `看详情`：跳装备库详情页。
2. `加入对比`：进入装备对比页。
3. `带着这些候选去求推荐`：跳到求推荐发布页并预填候选项。

跳到求推荐发布页时，映射到现有字段：

```json
{
  "topicCategory": 3,
  "questionType": "recommend",
  "relatedGearCategory": "rod",
  "recommendMeta": {
    "recommendIntent": "compare_options",
    "budgetRange": "800_1200",
    "targetFish": ["鲈鱼"],
    "useScene": ["野河", "水库"],
    "carePriorities": ["泛用", "轻量"],
    "candidateOptions": [
      { "gearItemId": 101, "label": "候选 A", "source": "selection_guide", "branchKey": "softbait_focus" },
      { "gearItemId": 102, "label": "候选 B", "source": "selection_guide", "branchKey": "hardbait_focus" }
    ],
    "coreQuestion": "系统按我的预算和场景生成了几个方向，我主要纠结哪条路线更适合。"
  }
}
```

---

## 十、后端接口建议

### 10.1 最小接口：生成选型推荐

`POST /mini/recommend/selection`

请求体：

```json
{
  "gearCategory": "rod",
  "rodType": "casting",
  "power": "M",
  "budgetMin": 800,
  "budgetMax": 1200,
  "budgetFlexible": "slightly_up",
  "targetFish": ["鲈鱼"],
  "useScene": ["野河", "水库"],
  "technique": ["unknown"],
  "carePriorities": ["泛用", "轻量"],
  "avoidPoints": ["不想太重"],
  "limit": 6
}
```

返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "sessionId": "optional",
    "inputSummary": "M 枪柄 / 1200 预算 / 鲈鱼 / 野河水库",
    "missingFields": [],
    "branches": [],
    "nextActions": ["view_detail", "compare", "create_recommend_topic"]
  }
}
```

### 10.2 可选接口：保存选型会话

`POST /mini/recommend/session`

用途：

- 记录用户输入
- 记录推荐结果
- 支持后续回看
- 支持从选型结果生成求推荐帖

第一版如果想极简，可以不做 session 表，只做 stateless 推荐接口。但如果要后续做反馈闭环，建议保留 session。

### 10.3 可选接口：从选型结果生成求推荐草稿

`POST /mini/recommend/session/:id/to-topic-draft`

内部仍复用：

- `PUT /mini/topic`
- `POST /mini/topic`

---

## 十一、数据库建议

### 11.1 第一版可不强制新增表

如果只做“实时生成 + 用户手动带去求推荐”，可以不新增表。

### 11.2 推荐新增轻量日志表

为了后续知道用户输入了什么、系统推荐了什么、最后是否发帖/采纳/反馈，建议新增：

#### `gear_selection_sessions`

| 字段 | 说明 |
|---|---|
| `id` | 主键 |
| `userId` | 用户 ID，可空，未登录也可生成临时会话 |
| `gearCategory` | 装备类型 |
| `inputJson` | 用户输入 JSON |
| `resultJson` | 推荐结果 JSON |
| `source` | home / gear_list / publish / compare |
| `createdTopicId` | 后续生成的求推荐帖 ID，可空 |
| `createdAt` | 创建时间 |
| `updatedAt` | 更新时间 |

### 11.3 暂不建议新增复杂规则表

第一版推荐规则可以先放：

```text
src/modules/recommend/config/rod-selection-rules.ts
src/modules/recommend/config/reel-selection-rules.ts
```

等规则稳定后再考虑后台配置表。

---

## 十二、前端页面建议

### 12.1 新增页面

建议新增：

```text
pkgGear/pages/selection-guide/selection-guide
```

或：

```text
pkgContent/pages/recommend-guide/recommend-guide
```

如果它更偏装备库能力，放在 `pkgGear` 更合理。

### 12.2 页面结构

1. 顶部一句话说明：`告诉我预算、场景和目标鱼，GearSage 先帮你生成几个选择方向。`
2. 输入区：分步收集必要字段。
3. 缺失追问区：只问 1~2 个最关键问题。
4. 结果区：分支卡片。
5. 每个分支卡片动作：看装备 / 加对比 / 带去求推荐。
6. 底部提示：`推荐结果仅用于收敛候选，最终建议结合装备详情、使用经验和社区回答判断。`

---

## 十三、验收标准

### 13.1 产品验收

- [ ] 用户可从首页 / 装备库 / 求推荐发布页进入选型向导。
- [ ] 用户输入最低字段后，可生成 3~6 个选择分支。
- [ ] 每个分支至少包含：分支名称、推荐装备、推荐理由、取舍提醒、装备库跳转。
- [ ] 若有关联经验帖，每个候选可展示 1~3 条。
- [ ] 用户可把 2~3 个候选带入求推荐发布页。
- [ ] 求推荐发布页可正确预填 `candidateOptions`。

### 13.2 后端验收

- [ ] `POST /mini/recommend/selection` 返回 `{ code, message, data }`。
- [ ] 接口可读取 `gear_master / gear_variants`。
- [ ] 接口可按 `gearItemId` 聚合关联帖子。
- [ ] 没有命中装备时返回可解释空态，不报错。
- [ ] 不修改现有 `/mini/topic*`、`/mini/comment*`、`/mini/gear/*` 主链路。

### 13.3 数据验收

- [ ] 推荐只返回 `is_show = 1` 的装备。
- [ ] 推荐装备必须有可跳转的 `gearItemId`。
- [ ] 无法确定具体子型号时，明确展示“系列级推荐”。
- [ ] 有子型号时展示 `variantLabel`。
- [ ] 关联帖子为空时不伪造经验。

---

## 十四、推荐分期

### P0：人工规则 + 装备库候选生成

做：

- 鱼竿 / 渔轮至少一类先跑通。
- 规则写死在代码配置里。
- 生成分支卡片。
- 跳装备详情 / 对比 / 求推荐。

不做：

- 大模型生成。
- 后台规则配置。
- 自动学习采纳数据。

### P1：接入经验帖子与采纳反馈

做：

- 关联使用经验帖。
- 关联被采纳求推荐回答。
- 记录 selection session。
- 从最终反馈反向标记哪些分支更常被采纳。

### P2：规则后台与半自动优化

做：

- 分支规则后台配置。
- 品类扩展到鱼饵 / 鱼线 / 整套搭配。
- 基于采纳和反馈优化排序。

---

## 十五、最终判断

这个模块应该做，而且应该成为 GearSage 产品壁垒之一。

当前求推荐解决的是“我拿着候选项来问别人”。系统介入式选型推荐解决的是“我连候选项都不知道，GearSage 先帮我变成可讨论的问题”。

真正好的路径不是：

```text
用户自己懂装备 -> 自己找 A/B -> 自己发帖求推荐
```

而是：

```text
用户只知道预算和场景 -> GearSage 生成选择分支 -> 用户看详情/对比 -> 带着候选求推荐 -> 社区回答 -> 采纳反馈 -> 沉淀案例
```

这才是 GearSage 从“装备资料库 + 社区”变成“装备决策系统”的关键一步。
