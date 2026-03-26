# P2 cloud 兼容清理建议

更新时间：2026-03-26  
适用范围：GearSage-client 本地阶段 / 历史 `cloud://` 资产兼容 / 后续 P3 接手

---

## 一、当前结论

当前小程序主链路已经脱离微信云开发运行，但客户端仍保留少量 `cloud://` 兼容逻辑，目的不是继续依赖云开发，而是给历史资产做兜底。

当前真实状态可以分成 3 类：

1. 运行时仍必须保留的历史兼容
2. 等历史资产归零后可删除的延后清理项
3. 已不再参与本地主链路、可立即归档的旧云开发脚本和目录

本阶段不建议一次性硬删全部 `cloud://` 逻辑，否则容易误伤：

- 历史头像
- 历史背景图
- 历史标签图标
- 历史帖子图片或草稿

---

## 二、本轮盘点结果

### 2.1 GearSage-api

后端仓库当前未发现运行时 `cloud://` / `wx.cloud` 依赖。匹配结果主要在文档说明中，不在实际业务代码路径里。

结论：

- GearSage-api 不属于 P2-D 主清理对象
- P2-D 重点在 GearSage-client

### 2.2 GearSage-client 运行时残留

当前仍与 `cloud://` 历史兼容有关的运行时文件主要有：

1. `utils/tempUrlManager.js`
2. `utils/iconImageCache.js`
3. `utils/imageUploadUtils.js`
4. `pages/index/index.js`
5. `components/post-mode/post-mode.js`
6. `pkgContent/publish/publish.js`

这些残留点的共同特征是：

- 只在输入值本身是 `cloud://` 时才会触发
- 新上传、新发帖、新资料更新不会再写入新的 `cloud://`
- 当前作用是兼容历史资产，不是继续走云开发主链路

### 2.3 可立即归档的旧云开发资产

当前已不再参与独立后台主链路，但仍保留在仓库中的旧云开发资产主要有：

1. `cloudfunctions/`
2. `scripts/import_excel_to_db.js`
3. `scripts/import_tag_seed.js`
4. `scripts/grant_all_tags_to_user.js`
5. `scripts/clear-task-records.js`
6. `pkgLabs/test-cloud/test-cloud.js`

这些文件当前的价值主要是：

- 留作历史参考
- 留作旧云开发数据结构对照
- 留作“曾经如何导云数据库”的备查资料

---

## 三、分级清理建议

## A. 运行时必须保留

以下逻辑建议在 P2 保留，不做硬删。

### A1. `utils/tempUrlManager.js`

当前职责：

- 统一处理历史 `cloud://` 图片到临时可访问 URL
- 同时兼容本地上传 `http://127.0.0.1:3001/uploads/...`

保留原因：

- 首页历史头像仍可能命中
- 发布模式背景图仍可能命中历史 `cloud://`
- 一次性移除会直接把旧资源显示打断

P2 建议：

- 保留
- 仅作为历史兜底层继续存在
- 不再向新逻辑扩散

### A2. `utils/iconImageCache.js`

当前职责：

- 标签图标缓存
- 对历史 `cloud://` 标签图标做安全下载兜底

保留原因：

- 标签历史图标资源仍可能存在

P2 建议：

- 保留
- 禁止新增调用方再以 `cloud://` 为正常输入

### A3. `utils/imageUploadUtils.js`

当前职责：

- 压缩前统一把输入图转为可处理本地路径
- 对历史 `cloud://` 图片仍可先下载再处理

保留原因：

- 草稿二次编辑、旧帖子编辑、旧资料图片二次处理时，理论上仍可能碰到历史云文件

P2 建议：

- 保留
- 仅保留“输入兜底”职责，不再把它作为主上传方案的一部分

### A4. 页面级历史资源转换

当前包括：

1. `pages/index/index.js` 的历史头像转换
2. `components/post-mode/post-mode.js` 的历史背景图转换

保留原因：

- 这两处仍可能直接消费旧资源值

P2 建议：

- 保留
- 后续如果后台数据确认已无 `cloud://`，再连同 `tempUrlManager` 一起删

---

## B. 可延后清理

这些项已经不是“必须保命”，但建议等前置条件满足后再删。

### B1. `pkgContent/publish/publish.js` 中对 `cloud://` 的已上传判定

当前逻辑：

- `http://`
- `https://`
- `cloud://`

都会被当成“已上传资源”

延后原因：

- 可以兼容历史草稿和历史帖子图片

建议前置条件：

1. 本地数据库中确认最近联调数据不再出现 `cloud://`
2. 旧草稿 / 旧帖子编辑链确认不再需要兼容

满足条件后：

- 可把“已上传资源”判断收紧为仅 `http://` / `https://`

### B2. 页面/组件里对 `cloud://` 的批量判断

当前典型是：

- `pages/index/index.js`
- `components/post-mode/post-mode.js`

延后原因：

- 数据还没完全证明历史资源已清零

建议前置条件：

1. 连续一段本地联调期内无新的 `cloud://` 命中
2. 现有测试账号首页、发布模式、资料页不再返回 `cloud://`

满足条件后：

- 可以删页面层 `cloud://` 分支
- 统一保留普通 URL / 本地上传 URL

### B3. `utils/tempUrlManager.js` 中的云 API 分支

延后原因：

- 这是最后一道兜底，不建议在没有数据证据时提前删

建议前置条件：

1. 页面层 `cloud://` 调用方已清零
2. `rg "cloud://"` 在运行时业务文件里只剩文档或归档目录

满足条件后：

- 再删除 `wx.cloud.getTempFileURL` 分支

---

## C. 可立即归档

这些项当前不建议继续当“现役工程文件”看待，可以进入归档视角。

### C1. 旧云数据库导入脚本

包括：

1. `scripts/import_excel_to_db.js`
2. `scripts/import_tag_seed.js`
3. `scripts/grant_all_tags_to_user.js`
4. `scripts/clear-task-records.js`

建议：

- 不再继续维护为现役脚本
- 在文件头或脚本 README 明确标注“仅供旧云开发参考”
- 后续如需收仓库体积，可整体移动到 `archive/cloudbase-scripts/`

### C2. `cloudfunctions/`

包括：

- `miniApi`
- `login`
- `fixUserTags`
- `mergeFileChunks`
- `miniprogram-adapter`

建议：

- 当前直接标记为“旧云开发归档目录”
- 不再让新施工继续修改这部分
- P3 如确认完全不再参考，可整体迁入 `archive/cloudfunctions/`

### C3. `pkgLabs/test-cloud/test-cloud.js`

建议：

- 直接视为废弃测试页
- 如当前无使用价值，可在下一轮直接删除或迁档

---

## 四、建议执行顺序

### 第一批：只做口径收紧，不删运行时

动作：

1. 在 P2 文档里明确运行时保留范围
2. 停止继续往主链路新增 `cloud://` 兼容调用
3. 把旧云脚本、云函数标成“归档参考”

目标：

- 先防止问题继续扩散

### 第二批：观察历史资产是否归零

建议观察项：

1. 首页作者头像
2. 发布模式背景图
3. 标签图标
4. 草稿/帖子编辑链路

建议核查方式：

1. 小程序运行日志中是否还命中 `cloud://`
2. 本地数据库返回数据中是否还包含 `cloud://`
3. 真实测试账号页面是否还依赖 `tempUrlManager` 的云分支

目标：

- 拿到“还能不能删”的证据

### 第三批：逐层删除运行时兼容

建议删除顺序：

1. 页面层判断
2. `publish.js` 的 `cloud://` 已上传判断
3. `iconImageCache.js` / `imageUploadUtils.js` 的 `cloud://` 兜底
4. 最后删 `tempUrlManager.js` 中的云 API 分支

原因：

- 页面层最靠近业务
- 工具层是最后防线，应该最后删

---

## 五、P2-D 当前结论

P2-D 的目标不是“立即删除所有 `cloud://`”，而是把历史兼容从“看起来还活着”收敛成“有边界、有顺序、可撤除”。

本轮结论如下：

1. GearSage-api 当前无需作为 cloud 清理重点
2. GearSage-client 运行时仍保留少量历史 `cloud://` 兜底，当前应继续保留
3. 旧脚本、旧云函数、旧实验页已经可以按归档视角处理
4. 后续真正删除运行时兼容前，必须先拿到“历史资产已归零”的证据

---

## 六、建议的下一步

如果继续按 P2 推进，建议下一步做：

1. 给旧云脚本 / `cloudfunctions/` 增加归档说明
2. 统计本地联调日志里 `cloud://` 命中次数
3. 继续补装备库搜索/筛选元数据化

这样可以把 `cloud://` 清理和功能深化并行推进，而不是互相阻塞。
