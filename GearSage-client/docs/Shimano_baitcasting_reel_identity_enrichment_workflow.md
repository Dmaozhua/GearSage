# Shimano baitcasting reel identity enrichment workflow

更新时间：2026-04-16  
适用范围：`pkgGear/data_raw`、`identity_reports`、`experiment_reports`  
当前阶段：中间层 identity enrichment

---

## 一、目标

在 Shimano baitcasting reel 的 enrichment 流程里，先补齐身份字段，再做后续 whitelist 字段补值。

当前 identity enrichment 的目标字段：

- `model_year`
- `alias`
- `version_signature`

其中 `alias` 进一步拆成：

- `canonical_alias`：清理过站点尾巴与栏目尾巴后的来源短标题
- `normalized_alias`：用于 downstream 绑定的标准 alias

这一步的结果会生成 `identity patch`，后续 whitelist 字段补值必须建立在它之上。

---

## 二、为什么要先做 identity

之前把 `model_year` 留到 apply 前才校验，会导致顺序倒置。

正确顺序应该是：

1. 官网抓基础结构
2. 白名单辅助站补 identity
3. 生成 identity patch
4. 再基于 identity patch 去做 `body_material`、`gear_material` 等 whitelist 字段补值
5. 最后才进入 patch / apply 验证

也就是说：

- `model_year` 缺失不再被视为人工 blocker
- 它应该在 enrichment 前段就被辅助站补齐

---

## 三、脚本与输出物

### 3.1 identity enrichment 脚本

[`run_shimano_bc_identity_enrichment.js`](/Users/tommy/GearSage/scripts/run_shimano_bc_identity_enrichment.js)

### 3.2 identity 输出物

- identity report JSON：  
  [`2026-04-16_shimano_baitcasting_reel_identity_experiment.json`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/identity_reports/2026-04-16_shimano_baitcasting_reel_identity_experiment.json)
- identity report markdown：  
  [`2026-04-16_shimano_baitcasting_reel_identity_experiment.md`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/identity_reports/2026-04-16_shimano_baitcasting_reel_identity_experiment.md)
- identity review workbook：  
  [`2026-04-16_shimano_baitcasting_reel_identity_review.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_review.xlsx)
- identity patch：  
  [`2026-04-16_shimano_baitcasting_reel_identity_patch.json`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_patch.json)

---

## 四、identity patch 角色

identity patch 不是最终表，也不是数据库写入物。

它的作用是：

- 给后续 whitelist field enrichment 提供 `model_year`
- 给 review / patch builder 提供 `alias`
- 给版本识别提供 `version_signature`

当前 downstream 规则：

- `run_shimano_bc_whitelist_experiment.js` 先读 identity patch，再生成 field review
- `build_shimano_bc_review_patch.js` 也先读 identity patch，再把 `model_year / alias / version_signature` 带进 patch

这里的 `alias` 默认指 `normalized_alias`，用于后续字段补值绑定。

---

## 四点五、alias normalization 最小规则

### 4.5.1 目标

把来源页标题里的栏目、活动、站点尾巴剥掉，只保留对版本识别真正有帮助的 alias。

### 4.5.2 噪声词

当前 identity enrichment 会把下面这些内容视为 alias 噪声并剔除：

- `Shimano` 这类品牌前缀
- `Casting Reels`
- `JapanTackle`
- `JDM`
- `Spring Trout Special`
- 其他被识别成 `archive / feature / special section` 的栏目尾巴

### 4.5.3 最小规则

当前最小规则是：

1. 先去掉品牌前缀和站点尾巴
2. 再去掉栏目/活动后缀
3. 保留清理后的来源短标题作为 `canonical_alias`
4. 再从 `canonical_alias` 中去掉：
   - `Japan model + year`
   - 单纯宣传性括号说明
   - 跟在逗号后面的活动/营销短句
5. 生成用于绑定的 `normalized_alias`

### 4.5.4 当前口径

- `canonical_alias` 用来保留来源侧语义
- `normalized_alias` 用来做 identity 底座和 downstream 绑定
- 如果两者都为空，才视为 alias 仍未稳定

---

## 五、当前辅助站策略

当前辅助站同步开启为“可评估信息源”：

- `japantackle`
- `tackletour`
- `jdmfishing`

注意：

- “开启”表示 identity / whitelist experiment 可以同时评估这些站的有效性
- 不表示它们都能直接单站写入最终字段
- 后续是否允许单站落值，仍然要看样本质量和字段稳定性

---

## 六、body_material 双来源方案

在中间层 patch / review 阶段，`body_material` 现在按双来源设计：

- `official`
- `player`

当前 patch 至少支持这些字段：

- `body_material_official`
- `body_material_tech_official`
- `body_material_player`
- `body_material_tech_player`
- `client_display_priority`
- `client_display_source`

### 6.1 客户端显示优先级

当前显示优先级固定为：

- `official > player`

也就是说：

1. 如果 future patch 中已经有官方确认值，客户端优先显示 `official`
2. 如果官方值缺失，则回退显示 `player`

### 6.2 当前阶段的实际情况

这轮 Shimano baitcasting reel 的 `body_material` patch 主要还是 player/whitelist 路线，因此：

- `body_material_player` 有值
- `body_material_official` 暂为空
- `client_display_source` 当前通常会落在 `player`

---

## 七、与 apply 的关系

当前不要继续推进最终 apply。

identity enrichment 的意义是：

- 先把 `model_year` 这类身份字段从 enrichment 流程前段补起来
- 避免后续再把 `model_year` 缺失当成纯人工阻塞

在 identity patch 稳定之前，不应继续扩大 whitelist patch 的 apply 范围。
