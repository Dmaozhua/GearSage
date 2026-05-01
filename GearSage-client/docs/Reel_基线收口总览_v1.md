# Reel 基线收口总览 v1

版本：v1.1  
状态：阶段性收口  
更新时间：2026-04-30

---

## 1. 当前总范围

当前已形成可用中间层基线的 reel 线包括：

- Shimano 水滴轮
- Shimano 纺车轮
- Daiwa 台湾纺车轮
- Daiwa 台湾水滴轮
- Megabass reel

本总览的目标不是重复每条线的全部细节，而是明确：

1. 当前哪些线已经形成基线
2. 当前每条线的主文件在哪里
3. 当前哪些流程已经稳定
4. 哪些空值和边界是合理保留
5. 后续默认不应再回到“全表试错式重跑”

---

## 2. 当前正式基线文件

### Shimano

- 水滴轮：
  - [shimano_baitcasting_reels_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import.xlsx)
- 纺车轮：
  - [shimano_spinning_reels_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_spinning_reels_import.xlsx)

### Daiwa

- 台湾纺车轮：
  - [daiwa_spinning_reels_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import.xlsx)
- 台湾水滴轮：
  - [daiwa_baitcasting_reel_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_baitcasting_reel_import.xlsx)

### Megabass

- reel：
  - [megabass_reel_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_reel_import.xlsx)

---

## 3. 当前配套审查文件

### Shimano

- [Shimano_reel_基线收口_v1.md](/Users/tommy/GearSage/GearSage-client/docs/Shimano_reel_基线收口_v1.md)
- [Spinning_Reel_抓取导入复用流程_v1.md](/Users/tommy/GearSage/GearSage-client/docs/Spinning_Reel_抓取导入复用流程_v1.md)

### Daiwa

- [Daiwa台湾纺车轮_基线收口_v1.md](/Users/tommy/GearSage/GearSage-client/docs/Daiwa台湾纺车轮_基线收口_v1.md)
- [Daiwa台湾水滴轮_基线收口_v1.md](/Users/tommy/GearSage/GearSage-client/docs/Daiwa台湾水滴轮_基线收口_v1.md)

### 审查辅助表

- [daiwa_spinning_reels_increment_review.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_increment_review.xlsx)
- [daiwa_baitcasting_reel_review.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_baitcasting_reel_review.xlsx)

---

## 4. 当前规模概览

### Shimano

- 水滴轮：
  - 主商品 `76`
  - detail `386`
- 纺车轮：
  - 主商品 `46`
  - detail `360`

### Daiwa

- 台湾纺车轮：
  - 主商品 `33`
  - detail `261`
- 台湾水滴轮：
  - 主商品 `25`
  - detail `98`

### Megabass

- reel：
  - 主商品 `18`
  - baitcasting detail `16`
  - spinning detail `2`

---

## 5. 当前已稳定的流程

### Shimano

- 官网主链已稳定
- 白名单补值链已跑通
- 主图已闭环
- 水滴轮 / 纺车轮两条中间层已固定口径

### Daiwa 台湾官网

- 台湾纺车轮已切到当前 `daiwa.com/tw` 结构化规格表链路
- 旧站规格图 OCR / family parser 作为历史测试链路保留
- 纺车轮正式中间层已按当前官网 33 个商品覆盖
- 主图链已闭环
- 白名单主层已补一轮

### Megabass 官网

- 重新抓取已完成
- 导出链已对齐当前 schema
- 主图 CDN 路径已统一
- 老页面特殊字段（例如 `Line /Handle Turn`、`drag max lb`）已做兼容处理

---

## 6. 当前已固定的通用口径

### 图片

- 主图一主商品一张
- 本地落图后，`images` 最终写 CDN 目标链接
- 不写本地绝对路径

### 纺车轮

- `DH -> 双摇臂`
- Daiwa / Shimano 的 `Compact` 规则已单独处理
- `spool_depth_normalized` 只在证据明确时启用

### 水滴轮

- `type` 使用：
  - `baitcasting`
  - `drum`
- `is_compact_body`
  - 仅在确有结构含义时使用
- `spool_weight_g`
  - 只补热门且证据硬的家族

### 白名单

- 白名单字段统一打黄底
- 优先补：
  - 主商品定位层
  - 环境层
  - 玩家层
  - 技术层
- 不为补满继续猜值

---

## 7. 当前合理空值

以下空值当前视为合理空值：

- 官网原图没有该列
- 官网正文没有该信息
- 兼容页不能稳定回到当前官方型号
- 玩家字段不适合统一泛化

典型包括：

- 部分水滴轮没有 `handle_knob_type`
- 部分鼓轮没有统一可写的 `min_lure_weight_hint`
- `spool_weight_g` 目前不追求全量
- Megabass 老页面没有完整正文，只能用 catchline 兜底

---

## 8. 当前不该再做的事情

### 不建议

- 回到全表通用 parser 试错
- 为了补满继续猜值
- 把低证据兼容页直接当正式值回填
- 为了追长尾继续反复重跑已稳定链路

### 建议

- 按 `reel_id` / 按家族定点修
- 修完即冻结
- 保留 review 表做人工验收

---

## 9. 当前总体验收判断

当前 reel 线已经可以视为：

**GearSage reel 中间层基线 v1**

### 通过项

- Shimano reel：通过
- Daiwa reel：通过
- Megabass reel：通过
- 主图主链：通过
- 白名单主层：通过
- 当前 schema 对齐：通过

### 保留项

- 仍可能存在零散单条实错，需要定点修
- 仍有部分高阶字段未追求全量
- review 表仍然有人工验收价值

---

## 10. 下一步建议

当前最合理的下一步只有两种：

1. 切下一个品牌 / 品类
2. 做一次目录清理 / 临时脚本与审查文件收口

不建议继续做的事：

- 在当前 reel 线上继续大规模补长尾字段
- 再次全表重跑稳定链路
- 把 reel 线从“基线”重新打回“实验态”
