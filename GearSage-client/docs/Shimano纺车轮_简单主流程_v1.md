# Shimano 纺车轮_简单主流程 v1

版本：v1  
状态：执行中  
更新时间：2026-04-18

---

## 一、默认主流程

1. 官网抓取主数据  
2. 按官网独立详情页重建主商品  
3. 子型号规格重抓  
4. 主图一主商品一张，`images` 最终写静态资源链接  
5. 官网缺失字段，再去白名单辅助站补值  
6. 白名单来源单元格用黄色底色标记  
7. 结果先落中间层，不进最终总表

当前测试输出：

- [shimano_spinning_reels_import_test.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_spinning_reels_import_test.xlsx)

正式中间层：

- [shimano_spinning_reels_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_spinning_reels_import.xlsx)

---

## 二、当前第一轮测试范围

本轮只测 5 个泛用纺车轮主商品：

- `STELLA`
- `Vanquish`
- `TWINPOWER`
- `VANFORD`
- `STRADIC`

---

## 三、当前优先落表字段

### 主表

- `model_year`
- `alias`
- `images`
- `Description`
- `series_positioning`
- `main_selling_points`
- `player_positioning`
- `player_selling_points`

### detail

- 官方规格字段
- `line_capacity_display`
- `spool_depth_normalized`
- `drag_click`
- `is_compact_body`
- `EV_link`
- `Specs_link`

---

## 四、当前纺车轮特殊规则

1. `is_compact_body` 只对纺车轮生效  
   - `SKU` 中带 `C2000 / C2500 / C3000 ...` 这类 `C` 开头规格时，写 `是`

2. `spool_depth_normalized` 当前按 Shimano 纺车轮 SKU 自动解析  
   - `SSS -> 特超浅线杯`
   - `SS -> 超浅线杯`
   - `S -> 浅线杯`
   - `MS -> 中浅线杯`
   - `M -> 中线杯`
   - 无标注 -> `标准`

3. `is_sw_edition` 只对纺车轮生效  
   - 当前测试阶段没有明确值时先留空

4. `drag_click` 在纺车轮当前默认写 `1`

5. `EV_link / Specs_link` 优先按子型号 `product_code` 去 Shimano 售后站匹配  
   - 能命中就写
   - 命不中就空

6. `images` 不写本地路径  
   - 最终写静态资源目标链接

---

## 五、当前执行边界

- 不改最终总表
- 不导库
- 不碰数据库
- 先做测试表
- 测试确认后，再同步正式中间层
