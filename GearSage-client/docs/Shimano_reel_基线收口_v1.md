# Shimano reel 基线收口 v1

版本：v1  
状态：阶段性收口  
更新时间：2026-04-19

---

## 一、当前基线文件

### 水滴轮

- [shimano_baitcasting_reels_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import.xlsx)

### 纺车轮

- [shimano_spinning_reels_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_spinning_reels_import.xlsx)

这两份当前作为 Shimano reel 中间层基线使用。

---

## 二、水滴轮当前状态

### 已完成

- 官网结构重建完成
- 独立详情页拆独立 `reel_id`
- 主商品与子型号结构稳定
- `type` 已拆成：
  - `baitcasting`
  - `drum`
- `images` 已全部写成 CDN 格式
- 本地图片与正式表已对齐：
  - `76 / 76`
- 主商品 `Description` 已清理
- 一批主流家族已完成白名单补厚

### 当前稳定字段方向

- `model_year`
- `alias`
- `series_positioning`
- `main_selling_points`
- `player_positioning`
- `player_selling_points`
- `body_material`
- `body_material_tech`
- `main_gear_material`
- `spool_weight_g`
- `handle_hole_spec`
- `knob_bearing_spec`
- `EV_link`
- `Specs_link`

### 当前暂停持续投入

- `custom_spool_compatibility`
- `custom_knob_compatibility`
- `drag_click` 全量自动扩写
- `spool_axis_type`
- `main_gear_size`
- `minor_gear_material`

### 当前规则已固定

- 水滴轮 `is_compact_body = 空`
- 水滴轮 `is_sw_edition = 空`
- `main_gear_material` 作为主齿材质字段主线

---

## 三、纺车轮当前状态

### 已完成

- 当前范围收成：
  - 海水 `9`
  - 泛用 `37`
  - 共 `46` 个主商品
- `images` 已全部写成 CDN 格式
- 本地图片与正式表已对齐：
  - `46 / 46`
- 主商品 `Description` 已全量清理
- 主流家族、海水家族、海鲈家族、细分用途家族、入门进阶家族已完成一轮家族补全
- `spool_depth_normalized` 已启用
- `is_compact_body / handle_style / is_handle_double` 已按 SKU 规则解析

### 当前稳定字段方向

- `model_year`
- `alias`
- `series_positioning`
- `main_selling_points`
- `player_positioning`
- `player_selling_points`
- `official_environment`
- `player_environment`
- `is_sw_edition`
- `body_material`
- `body_material_tech`
- `EV_link`
- `Specs_link`
- `spool_depth_normalized`
- `is_compact_body`
- `handle_style`
- `is_handle_double`

### 当前规则已固定

- `is_compact_body`
  - 仅对纺车轮生效
  - `SKU` 带 `Cxxxx` -> `是`
- `is_handle_double`
  - `SKU` 带 `DH` -> `1`
- `handle_style`
  - `DH` -> `双摇臂`
  - 否则 `单摇臂`
- `spool_depth_normalized`
  - `SSS -> 特超浅线杯`
  - `SS -> 超浅线杯`
  - `S -> 浅线杯`
  - `MS -> 中浅线杯`
  - `M -> 中线杯`
  - 无标注 -> `标准`

### 当前剩余缺口

仍有少量主商品未补出稳的 `model_year / alias`，当前继续留空：

- `SARAGOSA SW`
- `AERO`
- `SOCORRO SW`
- `CATANA`
- `SIENNA`
- `FX`

这批当前不建议为了完整度继续猜写。

---

## 四、图片状态

### 正式图片目录

- `/Users/tommy/Pictures/images/shimano_reels`

### 当前状态

- 水滴轮：目录已只保留正式表能匹配的图片
- 纺车轮：目录已完成与正式表一一对应

图片命名、正式表 `images` 字段、CDN 链接路径当前已经闭环。

---

## 五、当前验收结论

### 可以通过的部分

- Shimano 水滴轮中间层基线可用
- Shimano 纺车轮中间层基线可用
- 图片链已闭环
- 白名单字段补厚链已形成稳定节奏
- 两份中间层都可以作为后续其他品牌 reel 的模板参考

### 仍需记住的边界

- 当前不是“所有字段补满”
- 当前是“高价值、低歧义字段优先补齐”
- 对高歧义、高风险、长尾字段继续保守留空

---

## 六、下一步默认动作

当前不建议继续在 Shimano 上打磨长尾。

下一步默认转向：

- 其他品牌 reel

并直接沿用这两份 Shimano 中间层基线和已固定规则。
