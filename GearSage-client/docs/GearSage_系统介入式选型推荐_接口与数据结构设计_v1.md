# GearSage 系统介入式选型推荐：接口与数据结构设计 v1

版本：v1.0  
状态：可交给 Codex / 后端拆分  
更新时间：2026-05-14

---

## 一、设计原则

1. 不推翻现有 `/mini/topic*`、`/mini/comment*`、`/mini/gear/*` 主链路。
2. 第一版优先复用 `gear_master / gear_variants` 与 `GET /mini/topic/all`。
3. 推荐结果必须可解释，不能只给黑盒分数。
4. 推荐结果必须能跳装备详情、加入对比、带入求推荐发布页。
5. 没有数据时明确提示，不伪造经验。

---

## 二、模块落点

建议后端新增：

```text
src/modules/recommend/
  recommend.controller.ts
  recommend.service.ts
  recommend.types.ts
  recommend-rule.service.ts
  recommend-evidence.service.ts
  config/
    rod-selection-rules.ts
    reel-selection-rules.ts
  dto/
    create-selection.dto.ts
```

`app.module.ts` 继续按当前项目风格注册 controller / provider。

---

## 三、接口一：生成选型推荐

### 3.1 路径

```http
POST /mini/recommend/selection
```

### 3.2 请求体

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
  "brandPreference": [],
  "ownedGear": "",
  "source": "home",
  "limit": 6
}
```

### 3.3 字段说明

| 字段 | 必填 | 说明 |
|---|---:|---|
| `gearCategory` | 是 | `rod / reel / lure`，第一版建议先做 `rod` |
| `rodType` | 鱼竿必填 | `casting / spinning` |
| `power` | 鱼竿必填 | `UL / L / ML / M / MH / H` |
| `budgetMax` | 是 | 预算上限 |
| `budgetMin` | 否 | 预算下限 |
| `targetFish` | 是 | 目标鱼 |
| `useScene` | 是 | 场景 |
| `technique` | 否 | 玩法，如软饵 / 硬饵 / 不确定 |
| `carePriorities` | 否 | 关注点 |
| `source` | 否 | `home / gear_list / publish / compare` |

### 3.4 返回结构

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "sessionId": "SEL_20260514_000001",
    "inputSummary": "M 枪柄 / 1200 预算 / 鲈鱼 / 野河、水库",
    "missingFields": [],
    "branches": [
      {
        "branchKey": "softbait_focus",
        "branchTitle": "专注软饵",
        "branchSummary": "更重视底感、轻量和细腻操作。",
        "primaryGear": {
          "gearItemId": 101,
          "gearCategory": "rod",
          "gearLabel": "示例装备 A",
          "brandName": "Daiwa",
          "model": "Example Rod",
          "variantKey": "66M-ST",
          "variantLabel": "66M-ST",
          "priceText": "约 1200",
          "detailUrlParams": {
            "id": 101,
            "type": "rod"
          }
        },
        "alternativeGears": [],
        "whyRecommended": ["匹配 M 硬度", "预算接近", "更适合软饵操作"],
        "tradeOffs": ["不一定是硬饵远投优先"],
        "budgetFit": "in_budget",
        "confidence": "medium",
        "evidencePosts": [
          {
            "topicId": 201,
            "title": "这根竿软饵用下来怎么样",
            "topicCategory": "review",
            "reason": "绑定同一装备"
          }
        ],
        "actions": {
          "canViewDetail": true,
          "canAddCompare": true,
          "canCreateRecommendTopic": true
        }
      }
    ],
    "topicDraftPayload": {
      "topicCategory": 3,
      "questionType": "recommend",
      "relatedGearCategory": "rod",
      "recommendMeta": {
        "recommendIntent": "compare_options",
        "candidateOptions": []
      }
    }
  }
}
```

---

## 四、接口二：保存选型会话（已改为内置持久化）

2026-05-14 施工口径：暂不新增独立 `POST /mini/recommend/session`。`POST /mini/recommend/selection` 生成推荐时直接写入 `gear_selection_sessions`，并在返回体里给出 `data.sessionId`。

`selectionSessionId` 会写入：

```text
topicDraftPayload.recommendMeta.selectionSource.selectionSessionId
```

从选型结果生成求推荐帖后，`/mini/topic` 主链路非阻塞回写 `gear_selection_sessions.created_topic_id`。回写失败不影响发帖。

### 4.1 路径

```http
POST /mini/recommend/session
```

### 4.2 用途

- 用户未立即发帖时可保存结果。
- 后续从结果页继续进入求推荐。
- 后续分析“系统推荐 -> 发帖 -> 采纳 -> 反馈”的转化。

### 4.3 返回

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "sessionId": "SEL_20260514_000001"
  }
}
```

---

## 五、接口三：从选型会话生成求推荐草稿（可选）

### 5.1 路径

```http
POST /mini/recommend/session/:id/to-topic-draft
```

### 5.2 内部逻辑

1. 查询 `gear_selection_sessions`。
2. 组装 `recommendMeta.candidateOptions`。
3. 调用或复用 `PUT /mini/topic` 的保存草稿逻辑。
4. 返回草稿 topicId。

### 5.3 返回

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "topicId": "123",
    "status": 0
  }
}
```

---

## 六、推荐规则结构

### 6.1 分支配置示例

```ts
export const ROD_SELECTION_BRANCHES = [
  {
    branchKey: 'softbait_focus',
    title: '专注软饵',
    preferredTechniques: ['软饵', '铅头钩', '德州', '倒钓'],
    scoring: {
      techniqueMatch: 30,
      powerMatch: 20,
      budgetMatch: 20,
      sceneMatch: 15,
      evidencePost: 10,
      dataCompleteness: 5
    },
    copy: {
      summary: '更重视底感、轻量和细腻操作。',
      tradeoff: '硬饵远投和大范围搜索不是最优先。'
    }
  },
  {
    branchKey: 'hardbait_focus',
    title: '专注硬饵',
    preferredTechniques: ['硬饵', '米诺', '小胖子', '铅笔'],
    scoring: {
      techniqueMatch: 30,
      lengthMatch: 15,
      powerMatch: 20,
      budgetMatch: 20,
      evidencePost: 10,
      dataCompleteness: 5
    }
  }
]
```

### 6.2 推荐流程伪代码

```ts
function createSelection(input) {
  validateMinimumInput(input)

  const candidates = loadGearCandidates(input.gearCategory)
    .filter(isVisible)
    .filter(matchHardConstraints(input))

  const branches = branchConfigs.map(branch => {
    const scored = candidates
      .map(gear => scoreGearForBranch(gear, branch, input))
      .sort(byScoreDesc)

    const selected = pickTopNonDuplicate(scored)
    const evidencePosts = loadEvidencePosts(selected.gearItemId)

    return buildBranchCard(branch, selected, evidencePosts, input)
  })

  return normalizeResult(branches)
}
```

---

## 七、装备数据读取建议

第一版优先读取：

- `gear_master`
- `gear_variants`
- `gear_brands`

字段来源：

- `gear_master.type`
- `gear_master.brand_id`
- `gear_master.model`
- `gear_master.model_cn`
- `gear_master.alias`
- `gear_master.raw_json`
- `gear_variants.variant_key`
- `gear_variants.variant_label`
- `gear_variants.raw_json`
- `official_specs`
- `gsc_traits`
- `compare_profile`

---

## 八、关联帖子读取建议

第一版不新增复杂推荐图谱，继续复用帖子接口或内部 service 查询。

优先匹配：

1. `gearItemId` 精确匹配。
2. `relatedGearItemId` 精确匹配。
3. `gearModel / relatedGearModel` 文本匹配。
4. 同品牌 + 同型号弱匹配。

排序建议：

1. 长测评 / 好物分享优先。
2. 被采纳求推荐回答相关帖优先。
3. 更新时间较新优先。
4. 有图、有详细内容优先。

返回最多 3 条。

---

## 九、数据库表建议

### 9.1 `gear_selection_sessions`

```sql
CREATE TABLE IF NOT EXISTS gear_selection_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NULL,
  gear_category VARCHAR(32) NOT NULL DEFAULT '',
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  source VARCHAR(32) NOT NULL DEFAULT '',
  created_topic_id BIGINT NULL,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gear_selection_sessions_user_id
  ON gear_selection_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_gear_selection_sessions_gear_category
  ON gear_selection_sessions(gear_category);

CREATE INDEX IF NOT EXISTS idx_gear_selection_sessions_created_topic_id
  ON gear_selection_sessions(created_topic_id);
```

说明：P3-B-2B 已建表；当前仍不做规则学习，只做推荐输入、结果和求推荐帖关联留痕。

---

## 十、前端跳转协议

### 10.1 从结果页到装备详情

```js
wx.navigateTo({
  url: `/pkgGear/pages/detail/detail?id=${gearItemId}&type=${gearCategory}&from=selection_guide`
})
```

### 10.2 从结果页到对比页

```js
wx.navigateTo({
  url: `/pkgGear/pages/compare/compare?from=selection_guide&candidateKey=${candidateKey}`
})
```

若候选项较多，建议用本地缓存中转：

```js
wx.setStorageSync('selection_compare_candidates', candidates)
```

### 10.3 从结果页到求推荐发布页

```js
wx.setStorageSync('recommend_prefill_from_selection', topicDraftPayload)
wx.navigateTo({
  url: '/pkgContent/publish/publish?mode=question&questionType=recommend&from=selection_guide'
})
```

---

## 十一、空态与降级

### 11.1 没有命中装备

返回：

```json
{
  "missingFields": [],
  "branches": [],
  "emptyReason": "当前装备库没有足够匹配 M 枪柄 / 1200 / 鲈鱼 的装备数据。",
  "suggestedActions": [
    "放宽预算",
    "放宽长度",
    "改成泛用路线",
    "直接发求推荐帖"
  ]
}
```

### 11.2 有装备但没有帖子

分支仍可展示，但经验区提示：

> 暂无足够使用经验帖，当前主要基于装备库参数和规则给出。

### 11.3 只有系列，没有具体子型号

展示：

> 当前推荐到系列级，具体规格建议进入装备详情页查看。

---

## 十二、验收清单

- [ ] `POST /mini/recommend/selection` 可生成分支结果。
- [ ] 返回结构符合 `{ code, message, data }`。
- [ ] 鱼竿 M 枪柄 / 1200 / 鲈鱼场景可返回 3~6 个分支。
- [ ] 每个分支至少有一个 `primaryGear.gearItemId`。
- [ ] 每个分支有 `whyRecommended` 与 `tradeOffs`。
- [ ] 可通过 gearItemId 跳装备详情。
- [ ] 可把 2~3 个候选项带入求推荐发布页。
- [ ] 不新增 compare 专用接口也能跑通对比页聚合。
- [ ] 没有关联帖子时不报错、不伪造。
- [ ] 不影响现有求推荐发帖、评论、采纳、反馈链路。
