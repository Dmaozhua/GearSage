# 装备库数据扩充标准作业规程 (SOP)

**版本**: 2.0
**日期**: 2026-03-28
**变更日志**:
*   **v2.2**: 优化了 Megabass 假饵 (Lure) 的抓取与分类链路。完善了 description 的多级语言回退提取（优先查找包含有效内容的中文 > 英文 > 日文），清除了 `script` / `style` / 语言切换器等干扰节点。增强了 `classifyLure` 的解析逻辑（基于正则表达式提取深度值并映射为 Deep/Mid/Subsurface），引入官网大分类覆盖机制（如优先采用官网标注的 TOPWATER/CRANKBAIT 分类），并严格对齐 `type_tips`, `system`, `water_column`, `action` 等字段与系统枚举值。
*   **v2.1**: 完善了假饵（Lure）品类的采集与导出链路。针对 Daiwa 假饵增加了自动分页与多线程（`ThreadPoolExecutor`）并发抓取及图片下载；在 Node.js 导出端引入 `classifyLure` 分类逻辑，实现假饵字段（`type_tips`, `system`, `water_column`, `action`）的自动化枚举填充，并支持按类型（hardbait, metal, soft, wire, jig）自动拆分多 Sheet 导出。该逻辑已同步应用至 Shimano 假饵导出。
*   **v2.0**: 彻底重构SOP，引入标准的Scrapling MCP (Micro-Crawling Platform) 工作流。流程从“本地脚本”升级为“客户端-服务器”模式。明确了安装步骤、工具分层、中间数据范式和采集策略，为工业化数据采集奠定基础。
*   **v1.1**: 引入 `Scrapling` 库和本地化脚本执行方案，将数据采集阶段从“手动复制”升级为“半自动化执行”，大幅提升效率和准确性。确立了 Python 虚拟环境的最佳实践。

**目标**: 建立一套标准化、可复用、可维护的工业级数据采集与处理流程，确保数据的高效、准确、合规。

---

## 核心原则

1.  **MCP为核心**: 所有采集任务都通过在本地运行的 **Scrapling MCP** 服务执行，实现任务的集中管理、并发控制和状态监控。
2.  **配置驱动**: 采集目标、选择器、策略均通过配置文件定义，实现代码与配置的完全分离。
3.  **分层架构**: 严格遵循“**采集层 -> 标准化层 -> 导入层**”三层架构，各层职责单一，输入输出明确。
4.  **合规与安全**: MCP服务在用户本地网络运行，所有数据请求均源自本地，从根本上规避云端爬取带来的法律和合规风险。

---

## 问题与解决方案总览

| 核心问题 | 解决方案 |
| :--- | :--- |
| **采集任务管理混乱** | 引入 **Scrapling MCP** 作为中央任务调度器，提供统一的API接口和管理界面。 |
| **采集逻辑重复开发** | 通过 **配置化** 和 **工具分层**（`get` -> `fetch` -> `stealthy_fetch`）实现采集逻辑的高度复用。 |
| **数据格式不一，下游处理困难** | 强制所有采集任务输出统一的 **`normalized.json` 中间范式**，简化校验、查重和转换。 |
| **反爬能力弱且资源成本高** | 建立 **`get -> fetch -> stealthy_fetch`** 的自动升舱策略，按需使用无头浏览器等重资源。 |

---

## 标准作业流程 (SOP)

### **第一阶段：MCP服务搭建 (首次执行)**

1.  **安装Python环境**:
    *   通过 `brew install python` 或官网下载等方式，确保本地拥有最新的Python 3.x 版本。

2.  **安装Scrapling MCP**:
    *   在项目根目录创建并激活Python虚拟环境:
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```
    *   安装MCP核心及AI扩展依赖:
        ```bash
        pip install "scrapling[ai]"
        ```
    *   安装无头浏览器核心依赖 (用于`fetch`和`stealthy_fetch`):
        ```bash
        scrapling install
        ```

3.  **在客户端配置MCP服务 (一次性配置)**:
    *   为了在您的IDE（如 Trae, Cursor 或 Claude Desktop）中使用Scrapling，您需要将其配置为MCP服务。
    *   打开您的IDE的MCP配置页面，添加一个新的MCP服务器。
    *   **类型**: `stdio` (或 `command`)
    *   **命令 (Command)**: 虚拟环境中的 `scrapling` 可执行文件绝对路径（如 `/Users/tommy/GearSage/venv/bin/scrapling`）
    *   **参数 (Args)**: `["mcp"]`
    *   配置完成后，重启或刷新MCP服务。您现在可以直接在对话中要求AI调用 `fetch`, `stealthy_fetch` 等工具进行数据采集了！

### **第二阶段：采集任务配置 (低频操作)**

1.  **定义数据源**:
    *   在 `/Users/tommy/GearSage/GearSage-client/pkgGear/source_config.json` 中维护品牌/品类的起始URL。

2.  **编写采集器配置**:
    *   我将根据您的需求，在 `/Users/tommy/GearSage/scripts/scrapers/` 目录下创建采集器配置文件 (如 `daiwa_reels.yml`)。
    *   此文件将详细定义采集步骤、使用的选择器、字段映射关系以及遵循的采集策略。

### **第三阶段：执行采集与生成中间数据 (高频操作)**

1.  **触发采集任务**:
    *   您通过一个简单的指令（例如：“帮我采集Daiwa纺车轮数据”）发起任务。
    *   我将调用MCP服务的API接口，启动对应的采集任务。

2.  **MCP执行与输出**:
    *   MCP服务根据配置文件，自动执行分层策略（并发、降级等），高效抓取数据。
    *   任务完成后，在指定目录生成一份 **`normalized.json`** 文件，包含所有采集到的、符合标准范式的结构化数据。

### **第四阶段：校验、转换与导入 (自动化)**

1.  **校验中间数据**:
    *   我将运行 `scripts/pre-check.js` 脚本，对 `normalized.json` 进行严格校验（完整性、可导入性、唯一性等）。
    *   当前 `pre-check` 已兼容历史采集器的字段别名差异，会统一识别 `model/model_name`、`source_url/url`、`images/local_image_path/main_image_url`、`sku/name/variant_name`、`specs/raw_specs`。
    *   `raw_data_hash`、`scraped_at`、`model_year`、`local_image_path` 当前仍按 **warning** 处理；缺失主模型、来源链接、变体数组、变体名称、规格对象等会直接判定为 **error**。

2.  **数据清洗与转换**:
    *   校验通过后，我将运行专门的转换脚本 (如 `scripts/to_excel_megabass_lure.js`)。
    *   脚本会在内存中执行动态枚举推导（如 `classifyLure`），将非结构化数据映射为系统的标准枚举（`type_tips`, `system`, `water_column` 等）。
    *   转换脚本会读取 `normalized.json` 并生成品牌级的中间 Excel，统一输出至 `pkgGear/data_raw/` 目录，例如 `daiwa_lure_import.xlsx`、`shimano_line_import.xlsx`。
    *   `data_raw` 导出规则现在要求直接对齐最终基准表：`brand_id` 使用 `brand.xlsx` 中的纯数字品牌 ID；装备主键/外键使用字符串前缀主键；sheet 名、表头顺序与 `rate/excel` 保持一致。
    *   公共导出常量统一维护在 `scripts/gear_export_schema.js`。新增或修改 `to_excel_*` 脚本时，优先复用这里的品牌 ID、sheet 名和 header 定义，不再在各脚本内重复手写。
    *   **注意**：`pkgGear/data_raw/*_import.xlsx` 只是中间产物，当前数据库导入仍以 `GearSage-client/rate/excel/` 目录下的总表为准。

3.  **同步回总表 (`rate/excel`)**:
    *   生成品牌级中间 Excel 后，我将运行 `scripts/sync_rate_excel_from_imports.js`。
    *   该脚本会按前缀主键定向替换 `rate/excel` 中对应品牌切片：
        Shimano 路亚 `SL*`、Daiwa 路亚 `DL*`、Shimano 鱼线 `SLN*`、Daiwa 鱼线 `DLN*`。
    *   Megabass 与历史遗留的数字主键行不会被覆盖。
    *   同步后，应以 `rate/excel/` 中的总表作为后续抽检与导入基线。
    *   如果当前阶段只想做对比、不想自动覆盖总表，可运行 `scripts/report_rate_excel_diffs.js`。该脚本会将 `data_raw` 导出与 `rate/excel` 最终基准做只读比对，并输出报告到 `pkgGear/data_raw/rate_excel_diff_report.md`。

4.  **最终导入**:
    *   在您确认后，我将执行 `import_gear_excel.js` 脚本，将最终的Excel数据安全地导入数据库。

---

## 附录A：采集策略约定

1.  **并发策略**: 列表页优先使用 `bulk_get` 或 `bulk_fetch` 批量抓取所有详情页URL，再并发处理详情页，最大化采集效率。
2.  **工具分层与降级**:
    *   **默认**: `get` (纯HTTP请求)，成本最低。
    *   **升级**: 若`get`失败或页面需要JS渲染，自动或手动升级至 `fetch` (标准无头浏览器)。
    *   **最终手段**: 仅在遇到强力反爬措施时，才使用 `stealthy_fetch` (反检测隐身模式)。
3.  **选择器优先**: **必须** 优先使用CSS选择器或XPath精确定位信息块，再将该信息块交由AI进行结构化解析。此举可大幅节省Token并提高解析稳定性。
4.  **元数据记录**: 每条采集记录都 **必须** 包含 `source_url` (来源URL) 和 `scraped_at` (采集时间戳)。
5.  **动态页面等待**: 对于需要等待特定元素加载的动态页面，**必须** 在采集配置中明确声明 `wait_for_selector` 或 `wait_for_network_idle` 条件。
6.  **主图下载策略**: 必须在采集详情页时下载单商品白底主图到本地 `/Users/tommy/Pictures/images/<brand>_<category>/` 目录。在定位图片时，需结合 URL 规律（如 `001_product_photo`）、排除关键词（如 `banner`, `sub`）并严格限制图片后缀（`.jpg`, `.png`, `.webp`）以防止抓取到通用占位图，最终将相对路径存入 `local_image_path`。

---

## 附录B：中间层数据范式 (Schema)

所有采集器必须输出一个包含对象数组的 JSON 文件 (`normalized.json`)。当前标准分为“**规范字段**”与“**兼容别名**”两层：

- **规范字段优先**：新采集器应尽量直接输出规范字段。
- **兼容别名允许**：历史脚本仍可使用兼容别名，`pre-check.js` 会在校验时做统一映射。
- **过渡目标**：后续逐步将 `model_name / url / variant_name / raw_specs` 等兼容别名收敛回规范字段。

### 规范字段（推荐）

```json
{
  "brand": "string",
  "kind": "string (e.g., 'reel', 'rod', 'lure', 'line')",
  "model": "string",
  "model_year": "integer|string",
  "source_url": "string (The specific page URL of the product)",
  "local_image_path": "string (Relative path to the downloaded main product image with white background, e.g., 'images/daiwa_reels/EXIST_main.jpg')",
  "images": [
    "string (URL of a product image)"
  ],
  "variants": [
    {
      "sku": "string (Manufacturer's SKU, if available)",
      "name": "string (Specific variant name, e.g., '2500-XH')",
      "specs": {
        "gear_ratio": "string",
        "weight_g": "integer",
        "max_drag_kg": "integer",
        "line_capacity_pe": "string"
      }
    }
  ],
  "raw_data_hash": "string (SHA256 hash of the raw content to detect changes)",
  "scraped_at": "string (ISO 8601 timestamp of when the data was scraped)"
}
```

### 兼容别名（当前 `pre-check` 支持）

- 顶层：
  - `model_name` -> `model`
  - `url` -> `source_url`
  - `main_image_url` 可作为图片来源兜底
  - 文件名可临时推断 `brand/kind`，但仍建议尽快回填到 JSON 内
- 变体层：
  - `variant_name` / `name` -> 变体显示名
  - `raw_specs` 可作为 `specs` 缺失时的兼容输入
- 品类兼容：
  - `spinning` / `baitcasting` 在校验阶段按 `reel` 处理，避免因渔轮子类命名造成误判

### 当前闸门规则

- **error**
  - 缺少 `brand`（且文件名无法推断）
  - 缺少 `kind`（且文件名无法推断）
  - 缺少 `model/model_name`
  - 缺少 `source_url/url`
  - `variants` 不是数组或为空
  - 变体缺少 `sku/name/variant_name`
  - 变体同时缺少 `specs` 和 `raw_specs`
- **warning**
  - 缺少 `model_year`
  - 缺少 `raw_data_hash`
  - 缺少 `scraped_at`
  - 缺少 `local_image_path`
  - 缺少全部图片来源
  - 仅存在 `raw_specs`，尚未落为结构化 `specs`

---

## 迭代与扩展

本规程是可扩展的：

*   **添加新数据源**: 只需在 `source_config.json` 中配置新入口，并由我为您编写一个新的采集脚本。
*   **增加校验规则**: 只需在 `pre-check.js` 脚本中增加新的校验函数。
*   **支持新品类**: 创建新品类的 Excel 模板，并编写对应的采集和转换逻辑。

---

## 执行进度记录 (Execution Log)

| 日期 | 任务/品类 | 阶段 | 状态 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| 2026-04-02 | Daiwa 纺车轮 | 阶段 1: MCP服务与采集配置 | ✅ 完成 | 修复了入口URL，编写了 `reel.py` 和 Node 编排器，成功提取 51 个详情页URL。 |
| 2026-04-02 | Daiwa 纺车轮 | 阶段 2: 详情页抓取与标准化 | ✅ 完成 | 编写了 `reel_detail.py`，成功抓取商品标题、高清图片和规格参数表格，输出 `normalized.json` 范式数据。 |
| 2026-04-02 | Daiwa 纺车轮 | 阶段 3: 预检查与数据转换 | ✅ 完成 | 编写了 `pre_check.js` 进行数据校验，并用 `to_excel.js` 将标准化JSON转换为便于人工复核的 Excel 文件 `daiwa_reels_import.xlsx`。 |
| 2026-04-06 | Daiwa & Shimano 假饵 (Lure) | 阶段 1-3 全链路优化 | ✅ 完成 | 为 Daiwa 增加自动分页与并发下载（多线程），大幅提升爬取速度；在 Node.js 中实现 `classifyLure` 逻辑自动判断水层、类型及动作并多表导出。Shimano 假饵同步应用此分类分表导出逻辑。 |
| 2026-04-08 | Megabass 假饵 (Lure) | 阶段 1-3 全链路优化 | ✅ 完成 | 修复了 description 多级语言抓取逻辑（排查空标签并清除干扰元素），优化了 `classifyLure` 中的水层深度判断与官网大分类强制映射，确保所有系统枚举值准确对应。 |
