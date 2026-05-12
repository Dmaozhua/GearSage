# P3-A 提审前正式服内容清洁与样例数据报告

生成时间：2026-05-13 00:49（Asia/Shanghai）  
环境：remote 正式服  
API 域名：`https://api.gearsage.club`

## 一、备份文件

已在清理前备份内容相关表：

- `bz_mini_topic`
- `bz_topic_comment`
- `bz_topic_like`
- `bz_topic_comment_like`
- `user_reports`

备份路径：

| 文件 | 路径 |
| --- | --- |
| SQL 文本备份 | `/srv/gearsage-api/backups/pre-submit-content-20260513003721/content_tables.sql` |
| pg_dump custom 备份 | `/srv/gearsage-api/backups/pre-submit-content-20260513003721/content_tables.dump` |
| 校验文件 | `/srv/gearsage-api/backups/pre-submit-content-20260513003721/SHA256SUMS` |
| 装备图回退前记录 | `/srv/gearsage-api/backups/pre-submit-content-20260513003721/gear_image_fallback_before.json` |

## 二、清理内容

清理前确认包含以下历史标记的内容：

- `block-fix`
- `pre-submit`
- `provider`
- `smoke`
- `测试`
- `tencent-provider`
- `image-provider`

命中数量：

| 类型 | 命中数量 |
| --- | ---: |
| 帖子 | 12 |
| 评论 | 3 |
| 举报 | 1 |

为满足“公开列表只保留干净样例内容”的提审前口径，本轮对 remote 现有内容做了整体业务隐藏：

| 表 | 处理方式 | 数量 |
| --- | --- | ---: |
| `bz_mini_topic` | 软隐藏：`isDelete=1`，非草稿内容置 `status=9`，并归零 `likeCount/commentCount` | 39 |
| `bz_topic_comment` | 软隐藏：`status=9`，`isVisible=0` | 33 |
| `bz_topic_like` | 表无软删除字段，备份后清空历史点赞 | 19 |
| `bz_topic_comment_like` | 表无软删除字段，备份后清空历史评论点赞 | 29 |
| `user_reports` | 待处理举报置为 `rejected`，写入清理备注 | 1 |

清理后状态：

| 指标 | 结果 |
| --- | ---: |
| 可见帖子 | 5 |
| 公开帖子 | 5 |
| 可见评论 | 0 |
| 帖子点赞 | 0 |
| 评论点赞 | 0 |
| 待处理举报 | 0 |

## 三、保留表

本轮未删除、未清空以下表：

- `bz_mini_user`
- `admin_users`
- `moderation_rules`
- `moderation_records`
- `admin_operation_logs`
- `media_assets`
- `gear_brands`
- `gear_master`
- `gear_variants`

说明：装备图检查中对抽检命中的破图装备做了 `gear_master.images=[]` 默认图回退，未改装备库表结构、品牌、型号或变体关系。

## 四、样例帖子

样例内容均通过真实接口 `POST /mini/topic` 发布，发布后先进入 `status=1` 待审核，再通过审核后台 `POST /admin/review/topics/:id/pass` 进入 `status=2`。

| ID | 标题 | 类型 | questionType | topicCategory | 状态 | 后台通过日志 | 腾讯审核记录 |
| ---: | --- | --- | --- | ---: | ---: | ---: | ---: |
| 51 | 预算一千五以内的溪流泛用纺车搭配怎么选 | 求推荐 | `recommend` | 2 | 2 | 1 | 2 |
| 52 | 轻量小饵轮在城市河道的三个月感受 | 装备经验 | `discuss` | 1 | 2 | 1 | 2 |
| 53 | 水库亮片远投时线号该怎么取舍 | 装备问答 | `ask` | 2 | 2 | 1 | 2 |
| 54 | ML 调性枪柄竿连续使用后的优缺点 | 长测评 | `discuss` | 1 | 2 | 1 | 2 |
| 55 | 泛用水滴轮和浅杯水滴轮怎么分工 | 装备对比 | `recommend` | 2 | 2 | 1 | 2 |

审核记录摘要：

| topicId | scene | provider | result | riskLevel | requestId |
| ---: | --- | --- | --- | --- | --- |
| 51 | `topic_title` | `tencent_text` | `pass` | `Normal\|score=0` | `768ac58c-72ab-4d45-8204-d5300892efaf` |
| 51 | `topic_content` | `tencent_text` | `pass` | `Normal\|score=0` | `c691a256-fc7b-494f-ba37-e5f152b149d7` |
| 52 | `topic_title` | `tencent_text` | `pass` | `Normal\|score=0` | `5eaed9f0-a45b-4970-a06c-df75111c5a98` |
| 52 | `topic_content` | `tencent_text` | `pass` | `Normal\|score=0` | `3c44e335-5907-4397-980d-5ef707df44a6` |
| 53 | `topic_title` | `tencent_text` | `pass` | `Normal\|score=0` | `e58d574b-4e2a-4565-b0c7-7b90482e44e6` |
| 53 | `topic_content` | `tencent_text` | `pass` | `Normal\|score=0` | `5c69caf4-7c70-476c-86b4-e606e4526e51` |
| 54 | `topic_title` | `tencent_text` | `pass` | `Normal\|score=0` | `947f6feb-149a-479a-b8db-cabde3613ace` |
| 54 | `topic_content` | `tencent_text` | `pass` | `Normal\|score=0` | `d1fe2157-5aea-4031-aaee-fba61dfc9590` |
| 55 | `topic_title` | `tencent_text` | `pass` | `Normal\|score=0` | `0c34a1bd-6492-4430-a598-96781aba190a` |
| 55 | `topic_content` | `tencent_text` | `pass` | `Normal\|score=0` | `868c74f4-f1e9-40a3-b5cd-79153139c7b9` |

## 五、公开列表检查

接口：

`GET /mini/topic/all?limit=20`

返回结果：

| 顺序 | ID | 标题 | status | isDelete |
| ---: | ---: | --- | ---: | ---: |
| 1 | 55 | 泛用水滴轮和浅杯水滴轮怎么分工 | 2 | 0 |
| 2 | 54 | ML 调性枪柄竿连续使用后的优缺点 | 2 | 0 |
| 3 | 53 | 水库亮片远投时线号该怎么取舍 | 2 | 0 |
| 4 | 52 | 轻量小饵轮在城市河道的三个月感受 | 2 | 0 |
| 5 | 51 | 预算一千五以内的溪流泛用纺车搭配怎么选 | 2 | 0 |

检查结论：

- 公开列表仅返回 5 条样例帖子。
- 未出现 `block-fix / pre-submit / provider / smoke / 测试 / tencent-provider / image-provider` 等历史脏数据标记。

## 六、装备库图片抽检

抽检接口：

- `GET /mini/gear/list?type=reels&page=1&pageSize=20`
- `GET /mini/gear/list?type=rods&page=1&pageSize=20`
- `GET /mini/gear/list?type=lures&page=1&pageSize=20`
- 对每类前 3 个装备详情执行 `GET /mini/gear/detail` 并检查首图

首次 HEAD 检查：

| 类型 | 检查数量 | 破图数量 |
| --- | ---: | ---: |
| reels | 23 | 14 |
| rods | 23 | 22 |
| lures | 23 | 0 |
| 合计 | 69 | 36 |

已回退默认图的装备 ID：

- reels：`DRE1000`, `DRE1001`, `DRE1003`, `DRE1005`, `DRE1006`, `DRE1008`, `DRE1009`, `DRE1010`, `DRE1011`, `DRE1012`, `DRE1015`, `DRE1018`
- rods：`DR1000`, `DR1001`, `DR1002`, `DR1003`, `DR1004`, `DR1006`, `DR1007`, `DR1008`, `DR1009`, `DR1010`, `DR1011`, `DR1012`, `DR1013`, `DR1014`, `DR1015`, `DR1016`, `DR1017`, `DR1018`, `DR1019`

回退后复查：

| 指标 | 结果 |
| --- | ---: |
| 总检查图片 | 69 |
| 远端破图 | 0 |
| 默认图 / 本地资源回退 | 46 |

说明：

- 本轮未做大规模装备库数据重构。
- 对已确认 404 的首屏和详情首图，只将对应 `gear_master.images` 置为空数组，使接口回退 `/images/default-gear.png`。
- 静态图可用的装备仍保持原图片 URL。

## 七、结论

是否存在阻断真机 smoke 的问题：**未发现阻断项**。

当前 remote 正式服具备：

- 内容表已备份。
- 历史测试内容已从公开面隐藏。
- 首页公开列表只剩 5 条干净样例帖。
- 样例帖均经过腾讯文本审核与审核后台通过。
- 审核记录与后台操作日志均保留。
- 装备库 reels / rods / lures 首屏和详情首图抽检无远端 404。

是否建议进入最终真机 smoke：**建议进入最终真机 smoke**。
