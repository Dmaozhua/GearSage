# Topic 接口字段契约（统一版）

> 最后更新：2026-02-25
> 适用范围：小程序前端 + `cloudfunctions/miniApi` 的 `topic.*` 接口。

## 1. 命名规范

- **统一使用 `camelCase`**。
- 云函数侧会兼容读取历史 `snake_case` 数据（如 `content_images`），但对外返回统一字段。
- 前端新代码不再依赖 `snake_case` 字段。

## 2. Topic 标准字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 帖子 ID（等于 `_id`） |
| `_id` | string | 数据库原始主键 |
| `userId` | string | 作者用户 ID |
| `title` | string | 标题 |
| `content` | string | 正文（支持 JSON 字符串） |
| `contentImages` | string | 内容图片，逗号分隔 |
| `coverImg` | string \| null | 封面图 |
| `topicCategory` | number | 帖子主分类 |
| `gearCategory` | string \| null | 装备分类键 |
| `environment` | string \| null | 环境信息 |
| `receipt` | string \| null | 凭证图片，逗号分隔 |
| `usagePeriod` | string \| null | 使用周期 |
| `usageRate` | string \| null | 使用频率 |
| `recommendReason` | string \| null | 推荐理由（JSON 字符串） |
| `castingRate` | number | 抛投评分 |
| `worthRate` | number | 性价比评分 |
| `lifeRate` | number | 耐用评分 |
| `likeCount` | number | 点赞数 |
| `commentCount` | number | 评论数 |
| `status` | number | 状态（0 草稿，2 已发布等） |
| `isDelete` | number | 逻辑删除标记 |
| `rates` | string | 评分数组 JSON 字符串 |
| `createTime` | Date \| string \| null | 创建时间 |
| `publishTime` | Date \| string \| null | 发布时间 |
| `updateTime` | Date \| string \| null | 更新时间 |
| `isLike` | boolean | 当前登录用户是否已点赞 |
| `tagName` | string \| undefined | 用户佩戴标签名 |
| `tagRarityLevel` | number \| undefined | 标签稀有度 |
| `averageRate` | number | 聚合平均评分 |

## 3. 历史字段映射（兼容读取）

| 历史字段（snake_case / 旧拼写） | 统一字段（camelCase） |
|---|---|
| `content_images` | `contentImages` |
| `cover_img` | `coverImg` |
| `topic_category` | `topicCategory` |
| `gear_category` / `gaerCategory` / `categoryKey` | `gearCategory` |
| `usage_period` | `usagePeriod` |
| `usage_rate` | `usageRate` |
| `recommend_reason` | `recommendReason` |
| `casting_rate` | `castingRate` |
| `worth_rate` | `worthRate` |
| `life_rate` | `lifeRate` |
| `like_count` | `likeCount` |
| `comment_count` | `commentCount` |
| `is_delete` | `isDelete` |
| `create_time` | `createTime` |
| `publish_time` | `publishTime` |
| `update_time` | `updateTime` |
| `user_id` | `userId` |

## 4. 接口约定

- `topic.new` / `topic.update`：入参建议仅传统一字段（camelCase）。
- `topic.get` / `topic.all` / `topic.mine` / `topic.tmp`：返回值统一为上表标准字段。
- 迁移期间：数据库中可存在历史字段，云函数负责兜底映射；后续可逐步离线清洗历史数据。

## 5. 更新规则（建议）

当接口字段新增/删除时，请同时更新：
1. `cloudfunctions/miniApi/index.js` 中 `normalizeTopicPayload` 与 `normalizeTopicRecord`。
2. 本文档（字段表 + 映射表）。
3. 涉及页面的数据消费代码（避免再次散落多处字段兜底逻辑）。
