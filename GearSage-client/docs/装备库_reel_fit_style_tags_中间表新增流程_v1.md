# 装备库 reel fit_style_tags 中间表新增流程 v1

版本：v1  
状态：其他品牌复用施工流程  
更新时间：2026-05-02  
适用范围：`GearSage-client/pkgGear/data_raw/*reel*_import.xlsx` 的 `reel` 主表

---

## 一、目标

给某个品牌的 reel 中间导入表新增并填写：

```text
fit_style_tags
```

这个字段用于承接渔轮“使用方向 / 适用风格 / 适用场景”筛选。

本流程只处理中间数据层：

```text
GearSage-client/pkgGear/data_raw/
```

不直接处理：

- 原始抓取文件
- `normalized.json`
- `rate/excel/reel.xlsx`
- 数据库
- 前端筛选配置

如果后续要同步到最终表，必须另走 `sync_rate_excel_from_imports.js` 和导入校验流程，不在本流程里顺手做。

---

## 二、权威依据

填写枚举以这份文档为准：

```text
GearSage-client/docs/装备库_fit_style_tags_枚举与填表规范_v1.md
```

reel 字段分层以这份文档为准：

```text
GearSage-client/docs/reel_字段速查表_v1.md
```

数据层级以这份文档为准：

```text
GearSage-client/docs/装备库数据更新实际流程_v1.md
```

---

## 三、处理对象

每次只处理当前品牌的中间导入表。

常见文件形态：

```text
{brand}_spinning_reels_import.xlsx
{brand}_baitcasting_reels_import.xlsx
{brand}_baitcasting_reel_import.xlsx
{brand}_reel_import.xlsx
```

必须确认文件里存在 `reel` sheet。

如果同一个文件里还有：

```text
spinning_reel_detail
baitcasting_reel_detail
```

这些 detail sheet 只作为判断辅助来源，不新增主表字段，不改已有单元格。

---

## 四、字段位置

只在 `reel` 主表新增列。

推荐位置：

```text
type_tips 后面，type 前面
```

即：

```text
type_tips | fit_style_tags | type
```

不要把 `fit_style_tags` 加到 detail 表来完成本次主表需求。

如果 detail 表已经存在旧的 `fit_style_tags`，不要直接照抄；旧值可能是旧枚举或子型号粒度，只能作为判断证据之一。

---

## 五、reel 枚举规则

按 `reel.type` 分开填写。

### 5.1 水滴轮：`type = baitcasting`

只能使用：

```text
精细
泛用
远投
强力
海水
bass
```

常见判断口径：

| 标签 | 典型证据 |
|---|---|
| `精细` | BFS、轻饵、细线、浅杯、finesse、skipping |
| `泛用` | 通用、主力、全能、versatile、all-round、常规主力系列 |
| `远投` | 远投、long cast、HLC、DC、飞距、快收搜索 |
| `强力` | heavy duty、big bait、swimbait、cover、flipping、强控鱼、大饵 |
| `海水` | saltwater、SW、inshore、海水、咸淡水、明确海水适用 |
| `bass` | bass、black bass、常规 bass 水滴轮体系 |

禁止使用旧写法：

```text
SW
海水近岸
海水大物
重饵方向
细线方向
快收方向
慢卷方向
海水ok
```

### 5.2 纺车轮：`type = spinning`

只能使用：

```text
精细
泛用
远投
轻量
海鲈
岸投
近海
```

常见判断口径：

| 标签 | 典型证据 |
|---|---|
| `精细` | 小饵、细线、轻量钓组、finesse、light game、trout、area |
| `泛用` | 通用、主力、全能、versatile、all-round、常规淡水/综合系列 |
| `远投` | 远投、long cast、surf、投、顺滑出线、长距离搜索 |
| `轻量` | 轻量机身、轻量化转子、低惯性、长时间操作、lightweight |
| `海鲈` | seabass、EXSENCE、海鲈、近岸硬饵 |
| `岸投` | shore、岸、堤、防波堤、滩、矶、surf |
| `近海` | offshore、nearshore、SW、船钓、青物、大物、近海 |

纺车轮第一版不使用 `bass`。淡水 bass 方向纺车轮优先归入 `泛用` 或 `精细`。

### 5.3 鼓轮：`type = drum`

本轮不填。

```text
fit_style_tags = 空
```

不要把鼓轮混进 `baitcasting` 枚举里。

---

## 六、判断信息来源

优先看主表字段：

```text
model
model_cn
alias
type_tips
series_positioning
main_selling_points
Description
player_positioning
player_selling_points
market_status
```

可以辅助看 detail 字段：

```text
SKU
type
official_environment
player_environment
usage_environment
variant_description
Description
spool_depth_normalized
brake_type_normalized
min_lure_weight_hint
line_capacity_display
is_sw_edition
body_material
body_material_tech
gear_material
```

detail 信息只能帮助判断主商品方向，不能把某一个子型号的特殊用途直接扩大成整个系列标签。

---

## 七、填写原则

1. 只填标准枚举值。
2. 多个标签用英文逗号 `,` 分隔。
3. 同一行标签不要重复。
4. 标签顺序按枚举顺序写，方便复核。
5. 证据不足时宁可留空，并列入人工复核清单。
6. `drum` 必须留空。
7. 不用旧 detail 标签直接覆盖主表。
8. 不为了让筛选项丰富而强行贴标签。

示例：

```text
精细,泛用
泛用,远投,bass
远投,岸投,近海
```

---

## 八、标准施工步骤

### 第一步：确认本次范围

先明确本次只处理哪些文件。

例：

```text
GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import.xlsx
GearSage-client/pkgGear/data_raw/shimano_spinning_reels_import.xlsx
```

不要顺手处理其他品牌，也不要顺手处理 `rate/excel/reel.xlsx`。

### 第二步：记录修改前状态

执行：

```bash
cd /Users/tommy/GearSage
git status --short
```

确认工作区里哪些文件本来就有改动。已有的无关改动不要回退、不要覆盖。

### 第三步：检查表结构

对目标文件确认：

- 是否存在 `reel` sheet
- `reel` sheet 是否有 `type_tips`
- `reel` sheet 是否有 `type`
- 行数是否符合预期
- detail sheet 是否存在，仅作为辅助

### 第四步：新增列

只在 `reel` sheet 新增：

```text
fit_style_tags
```

位置：

```text
type_tips 后面
```

新增列后，不移动或改写其他原有字段值。

### 第五步：逐行填写

按每行 `type` 判断枚举：

- `baitcasting`：使用水滴轮枚举
- `spinning`：使用纺车轮枚举
- `drum`：留空

填写时先看主表描述，再看 detail 辅助证据。

### 第六步：逐格对比，确认没有误改

必须和修改前版本逐格对比：

- sheet 名不变
- 原有行数不变
- detail sheet 不变
- `reel` 原有字段的所有单元格值不变
- `reel` 只新增一列 `fit_style_tags`

这是防止 Excel 重写时误伤其他数据的核心检查。

### 第七步：枚举校验

校验项：

- `baitcasting` 行不能出现纺车轮专属标签
- `spinning` 行不能出现水滴轮专属标签
- `drum` 行必须为空
- 非 `drum` 行如果为空，必须列入人工复核清单
- 不允许出现旧枚举或非标准写法

### 第八步：最终确认变更范围

再次执行：

```bash
git status --short
```

期望只看到本次目标中间表被修改。

如果出现以下文件，说明范围越界，需要停下复查：

```text
GearSage-client/rate/excel/reel.xlsx
GearSage-api/*
scripts/gear_export_schema.js
scripts/sync_rate_excel_from_imports.js
GearSage-client/pkgGear/searchData/*
```

除非用户明确要求推进到最终表或代码链路，否则不要保留这些改动。

---

## 九、推荐校验脚本口径

校验脚本至少要做两件事：

1. 和 `HEAD` 版本逐格对比，确认除新增列外没有原有数据变化。
2. 校验新列值是否符合 `type` 对应枚举。

输出中必须包含：

```text
目标文件
sheet 是否一致
原有单元格是否一致
type 分布
tag 分布
非 drum 空值数量
drum 误填数量
非法枚举数量
```

只有这些检查全部通过，才算完成本阶段。

---

## 十、完成标准

一次品牌中间表 `fit_style_tags` 新增任务完成时，应满足：

1. 只修改目标品牌的中间 `*_import.xlsx`。
2. 只在 `reel` 主表新增 `fit_style_tags`。
3. 原有字段值逐格对比无变化。
4. detail sheet 无变化。
5. 水滴轮、纺车轮、鼓轮按类型分开处理。
6. 新字段没有非法枚举。
7. 不确定项有人工复核清单，不伪装成确定结论。

