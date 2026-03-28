# 装备库数据扩充标准作业规程 (SOP)

**版本**: 2.0
**日期**: 2026-03-28
**变更日志**:
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

3.  **启动MCP服务**:
    *   在前台启动服务进行测试: `scrapling serve`。
    *   服务将在本地 `http://127.0.0.1:8000` 启动。建议在生产操作中使用 `tmux` 或 `screen` 将其作为后台服务长期运行。

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
    *   我将运行 `scripts/pre-check.js` 脚本，对 `normalized.json` 进行严格校验（完整性、数据类型、唯一性等）。

2.  **数据转换**:
    *   校验通过后，我将运行一个转换脚本 (如 `scripts/to_excel.js`)，读取 `normalized.json` 并生成符合 `_templates` 规范的Excel文件。

3.  **最终导入**:
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

---

## 附录B：中间层数据范式 (Schema)

所有采集器必须输出一个包含对象数组的JSON文件 (`normalized.json`)。每个JSON对象必须遵循以下结构：

```json
{
  "brand": "string",
  "kind": "string (e.g., 'reel', 'rod', 'lure')",
  "model": "string",
  "model_year": "integer",
  "source_url": "string (The specific page URL of the product)",
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

---

## 迭代与扩展

本规程是可扩展的：

*   **添加新数据源**: 只需在 `source_config.json` 中配置新入口，并由我为您编写一个新的采集脚本。
*   **增加校验规则**: 只需在 `pre-check.js` 脚本中增加新的校验函数。
*   **支持新品类**: 创建新品类的 Excel 模板，并编写对应的采集和转换逻辑。
