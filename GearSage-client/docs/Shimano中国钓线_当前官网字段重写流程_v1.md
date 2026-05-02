# Shimano 中国钓线 当前官网字段重写流程 v1

版本：v1  
状态：Shimano line 已完成当前中国官网 dry-run，中间层与审计文件已生成，正式导入表尚未覆盖  
更新时间：2026-05-02

---

## 1. 当前范围

来源站点：

- Shimano 当前中国官网钓线列表  
  `https://fish.shimano.com/zh-CN/product/list.html?pcat1=cg1SHIFCnLine&pcat2=&pcat3=&pcat4=&fs=&series=&price_min=&price_max=`

当前正式导入表：

- `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_line_import.xlsx`

当前 dry-run 导出与中间层：

- `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_line_import_current_official_dry_run.xlsx`
- `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_line_current_official_normalized.json`
- `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_line_current_official_audit.json`
- `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_line_current_official_audit.md`

当前 dry-run 结果：

- 主商品：`59`
- 子规格：`703`
- 品牌：`brand_id = 1`
- 类型分布：`PE 28 / Nylon 16 / Fluorocarbon 13 / Ester 2`
- 正文描述：`28/59`

---

## 2. 当前链路

脚本：

- `/Users/tommy/GearSage/scripts/build_shimano_cn_line_current_import.js`

默认运行只生成 dry-run：

```bash
node scripts/build_shimano_cn_line_current_import.js
```

正式覆盖导入表：

```bash
node scripts/build_shimano_cn_line_current_import.js --commit
```

小批量验证：

```bash
node scripts/build_shimano_cn_line_current_import.js --limit=3 --skip-images
```

重新下载主图并覆盖正式表：

```bash
node scripts/build_shimano_cn_line_current_import.js --force-images --commit
```

---

## 3. 字段口径

主表 `line`：

- `model`：当前中国官网详情页 `h1.product-main__logo`。
- `model_cn`：同当前官网产品名，补齐旧表空值。
- `type_tips`：优先按官网 URL 分类段判断：`peline -> PE`，`fluoroline -> Fluorocarbon`，`nylonline -> Nylon`，`esterline -> Ester`。
- `description`：只取详情页 `.product__description_section__content p` 正文段落；不使用产品描述标题、页面 `meta description`、免责声明、按钮文字或页面模板文本。
- `images`：只写未来资源存储 URL，格式为 `https://static.gearsage.club/gearsage/Gearimg/images/shimano_lines/<主图文件名>`。
- 主图本地缓存目录：`/Users/tommy/Pictures/images/shimano_lines`。
- 旧图可复用目录：`/Users/tommy/Pictures/images_old_copy/shimano_lines`。
- 图片策略：一个主商品一张 main 图；优先使用详情页主图 rendition URL 下载，避免列表原始 `.jpg` URL 403；默认优先用当前缓存，其次复制旧图目录中可匹配主图，最后访问官网下载；`--force-images` 会重新从官网下载，下载失败时才回退旧图。
- 当前正式主图：`/Users/tommy/Pictures/images/shimano_lines` 下 `59` 张 `.jpeg`；正式表 `images` 字段全部为 `https://static.gearsage.club/gearsage/Gearimg/images/shimano_lines/*.jpeg`。

明细表 `line_detail`：

- `SKU`：`产品名 + 官网规格表型号`，同一商品下重复型号时追加号数、长度、强度、颜色或商品编码做去重。
- `COLOR`：官网规格表 `颜色`。
- `LENGTH(m)`：官网规格表 `全长(m)`。
- `SIZE NO.`：官网规格表 `号数`。
- `MAX STRENGTH(lb)`：官网规格表 `最大强度(lb)`。
- `MAX STRENGTH(kg)`：官网规格表 `最大强度(kg)`。
- `AVG STRENGTH(lb)`：官网规格表 `平均强度(lb)`。
- `AVG STRENGTH(kg)`：官网规格表 `平均强度(kg)`。
- `Market Reference Price`：官网规格表 `市场参考价`，保留官网人民币显示文本。
- `AdminCode`：官网规格表 `商品编码`。

---

## 4. 当前合理空值

合理空值不代表漏抓：

- `description`：31 个商品当前官网详情页没有正文段落，保守留空；短标题和 `meta description` 不写入主表。
- `COLOR`：部分规格表没有颜色列值。
- `SIZE NO.`：部分前导线或特殊线种官网未给号数。
- `MAX STRENGTH(lb/kg)` 与 `AVG STRENGTH(lb/kg)`：按官网实际列写入，不从另一种强度字段反推。
- `Market Reference Price`：部分规格表没有市场参考价。
- `AdminCode`：部分规格表没有商品编码。

---

## 5. 防污染机制

保留机制：

- 默认 dry-run，不覆盖正式表。
- 同步输出 normalized JSON 和 audit。
- 只有 `--commit` 才覆盖 `shimano_line_import.xlsx`。
- 官网没有明确给出的字段保守留空。
- `type_tips` 优先使用官网 URL 类目，不用营销文案强行覆盖。

---

## 6. 当前验收判断

当前这份 dry-run 可以作为：

**Shimano 中国钓线 当前官网字段基线候选**

验收判断：

- 主商品层：通过。
- 中国官网列表抓取：通过。
- 分页去重：通过。
- 规格表解析：通过。
- `brand_id = 1`：通过。
- dry-run / audit 机制：通过。
- 正式导入表覆盖：待确认。
