# Daiwa 台湾钓线 当前官网字段重写流程 v1

版本：v1  
状态：Daiwa line 已从日本站来源切到当前台湾官网字段  
更新时间：2026-05-02

---

## 1. 当前范围

来源站点：

- Daiwa 当前台湾官网钓线列表  
  `https://www.daiwa.com/tw/product/productlist/?brand=&category1=%E9%87%A3%E7%B7%9A%E7%94%A8&page=1&search=1`

当前正式导入表：

- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_line_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_line_import.xlsx)

当前中间层与审计文件：

- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_line_current_official_normalized.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_line_current_official_normalized.json)
- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_line_current_official_audit.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_line_current_official_audit.json)
- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_line_current_official_audit.md](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_line_current_official_audit.md)
- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_line_import_current_official_dry_run.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_line_import_current_official_dry_run.xlsx)

当前结果：

- 主商品：`26`
- 子规格：`392`
- 品牌：`brand_id = 2`

---

## 2. 当前链路

脚本：

- [/Users/tommy/GearSage/scripts/build_daiwa_tw_line_current_import.js](/Users/tommy/GearSage/scripts/build_daiwa_tw_line_current_import.js)

默认运行只生成 dry-run：

```bash
node scripts/build_daiwa_tw_line_current_import.js
```

正式覆盖导入表：

```bash
node scripts/build_daiwa_tw_line_current_import.js --commit
```

小批量验证：

```bash
node scripts/build_daiwa_tw_line_current_import.js --limit=3 --skip-images
```

重新下载主图并覆盖正式表：

```bash
node scripts/build_daiwa_tw_line_current_import.js --force-images --commit
```

---

## 3. 字段口径

主表 `line`：

- `model`：当前台湾官网列表产品名。
- `model_cn`：同当前官网产品名，避免旧日本站名称残留。
- `type_tips`：按官网规格表 `材質` 优先分类，其次才看型号和描述关键词；当前分类为 `PE / Fluorocarbon / Nylon / Composite`。
- `description`：当前台湾官网详情页中文描述。
- `images`：只写未来资源存储 URL，格式为 `https://static.gearsage.club/gearsage/Gearimg/images/daiwa_lines/<主图文件名>`。
- 主图本地缓存目录：`/Users/tommy/Pictures/images/daiwa_lines`。
- 旧图可复用目录：`/Users/tommy/Pictures/images_old_copy/daiwa_lines`。
- 图片策略：一个主商品一张 main 图；默认优先用当前缓存，其次复制旧图目录中可匹配主图，最后访问官网下载；`--force-images` 会重新从官网下载。

明细表 `line_detail`：

- `SKU`：官网规格表 `物品`。
- `COLOR`：官网规格表 `顏色`。
- `LENGTH(m)`：官网规格表 `捲線量`，去掉末尾 `M/m`。
- `SIZE NO.`：官网规格表 `號數` 或 `參考（號）`。
- `MAX STRENGTH(lb)`：官网规格表 `強力（lb）` 或 `參考（lb）`；若官网只有 SKU 写明 `2lb-120m`，只从 SKU 拆 lb 和长度。
- `MAX STRENGTH(kg)`：官网规格表 `強力（kg）`。
- `Market Reference Price`：官网规格表 `製造商建議零售價（日圓）` 的数字价格。
- `AdminCode`：官网规格表 `JAN`。

---

## 4. 当前合理空值

合理空值不代表漏抓：

- `SIZE NO.`：`STEEZ氟碳線 堅韌` 官网表未给号数，不从 lb 反推。
- `AVG STRENGTH(lb/kg)`：当前官网未给平均强力列。
- `Market Reference Price`：部分官网表写“请确认详细说明页面，或洽询店铺门市”，不改写成猜测价格。
- `MAX STRENGTH(lb/kg)`：很多尼龙/氟碳子线类官网表只给号数、长度、材质，不补推测强力。

---

## 5. 防污染机制

这条链路不再直接复用旧日本站脚本。

保留机制：

- 默认 dry-run，不覆盖正式表。
- 同步输出 normalized JSON 和 audit。
- 只有 `--commit` 才覆盖 `daiwa_line_import.xlsx`。
- 官网没有明确给出的字段保守留空。
- `type_tips` 不允许只因描述里出现泛用关键词就覆盖规格表材质。

---

## 6. 当前验收判断

当前这份正式表可以作为：

**Daiwa 台湾钓线 当前官网字段基线**

验收判断：

- 主商品层：通过。
- 台湾官网列表抓取：通过。
- 规格表解析：通过。
- 旧日本站主表字段替换：通过。
- `brand_id = 2`：通过。
- dry-run / audit / commit 机制：通过。
