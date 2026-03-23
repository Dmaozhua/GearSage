# 帖子模块接口与字段规范

本文是帖子模块的新版本整理稿。

适用范围：

- 微信小程序当前五种发帖模式
- 帖子发布、草稿、列表、详情、我的帖子、点赞
- 客户端字段、服务端接口字段、数据库字段统一收敛

本文约束：

- 全部使用新字段，不再兼容旧字段
- 不再使用旧拼写、旧别名、旧评分字段
- 不再把数组转 JSON 字符串存储
- 不再把图片数组转逗号字符串存储
- 不再把模式扩展字段塞进 `content` 里混存

也就是说，后续客户端、服务端、数据库都按本文字段名和结构统一。

## 1. 模块目标

帖子模块统一支持 5 种模式：

| `topicCategory` | 模式 | 组件 |
| --- | --- | --- |
| `0` | 好物速报 | `post-Recommend` |
| `1` | 长测评 | `post-Experience` |
| `2` | 讨论&提问 | `post-Question` |
| `3` | 鱼获展示 | `post-Catch` |
| `4` | 钓行分享 | `post-Trip` |

统一目标：

- 客户端发什么字段，接口就接什么字段
- 服务端不再做旧字段兼容映射
- 数据库按新字段直接存储原始结构
- 列表、详情统一返回新字段

## 2. 废弃字段

本次整理后，以下字段全部视为废弃，不再写入、不再返回、不再兼容：

- `gaerCategory`
- `categoryKey`
- `gear_category`
- `contentImages`
- `coverImg`
- `receipt`
- `usagePeriod`
- `usageRate`
- `recommendReason`
- `castingRate`
- `worthRate`
- `lifeRate`
- 任何通过逗号拼接的数组字段
- 任何通过 `JSON.stringify` 传输的数组/对象字段

说明：

- 图片统一使用 `images: string[]`
- 评分统一使用 `ratings: object[]`
- 环境统一使用 `environments: string[]`
- 优点缺点统一使用 `pros: string[]`、`cons: string[]`
- 模式扩展字段全部使用独立字段存储

## 3. 统一字段规范

## 3.1 通用字段

所有帖子共用以下基础字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 否 | 草稿发布、编辑发布时传 |
| `topicCategory` | `number` | 是 | 帖子模式 |
| `title` | `string` | 是 | 标题 |
| `content` | `string` | 否 | 正文；Catch 可为空 |
| `images` | `string[]` | 否 | 图片列表 |
| `status` | `number` | 否 | 服务端维护；`0=草稿`，`2=已发布` |
| `userId` | `string` | 否 | 服务端写入 |
| `createTime` | `string/date` | 否 | 服务端写入 |
| `publishTime` | `string/date` | 否 | 服务端写入 |
| `updateTime` | `string/date` | 否 | 服务端写入 |
| `likeCount` | `number` | 否 | 服务端维护 |
| `commentCount` | `number` | 否 | 服务端维护 |
| `isDelete` | `number` | 否 | 服务端维护 |

## 3.2 返回聚合字段

列表、详情接口额外返回：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `nickName` | `string` | 发布者昵称 |
| `avatarUrl` | `string` | 发布者头像 |
| `level` | `number` | 发布者等级 |
| `publisher` | `object` | 发布者对象 |
| `author` | `object` | 发布者聚合对象，包含 `id/name/avatar/level/displayTag` |
| `isLike` | `boolean` | 当前用户是否已点赞 |
| `displayTag` | `object/null` | 当前帖子场景下服务端计算后的作者展示标签 |

### `displayTag` 结构

```json
{
  "id": "tag_fun_almost_skunk",
  "code": "fun_almost_skunk",
  "name": "差点打龟",
  "type": "fun",
  "subType": "meme",
  "displayCategory": "fun",
  "displayCategoryLabel": "娱乐",
  "displayLabel": "娱乐标签",
  "rarityLevel": 2,
  "styleKey": "fun_blue",
  "iconKey": "splash",
  "isAuthoritative": false,
  "credibilityWeight": 0,
  "rarityLabel": "R2",
  "sourceLabel": "积分兑换",
  "isEquipped": true
}
```

说明：
- `displayTag` 不再只靠 `rarityLevel` 决定展示效果，前端统一按 `styleKey` 渲染
- `displayTag` 由服务端按帖子类型和用户佩戴设置计算，不等同于“当前手动佩戴标签”
- `author.displayTag` 与顶层 `displayTag` 含义一致，前者更适合新接口聚合结构

### 后台运营字段

以下字段由服务端生成或后台维护，客户端发帖时不需要传：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `contentQualityScore` | `number` | 内容完整度 / 精选权重 |
| `engagementScore` | `number` | 互动热度 |
| `credibilityScore` | `number` | 可信度 |
| `recommendationScore` | `number` | 推荐指数，仅长测评 `topicCategory=1` 计算 |
| `knowledgeScore` | `number` | 知识价值，仅钓行分享 `topicCategory=4` 使用 |
| `sampleCount` | `number` | 装备聚合样本数 |

说明：
- `contentQualityScore`、`engagementScore`、`credibilityScore`、`knowledgeScore`、`sampleCount` 当前作为后台字段落库，默认值为 `0`
- `recommendationScore` 由服务端根据长测评字段实时计算，不接受客户端直接传值

### `recommendationScore` 计算规则

仅长测评 `topicCategory=1` 生效：

`GearSage 推荐指数 = 推荐等级 × 0.5 + 综合评分 × 0.3 + 回购意愿 × 0.2`

#### 推荐等级分值映射

| `summary` 选项 | 分数 |
| --- | --- |
| `A. 强烈推荐，明显超出预期` | `10` |
| `B. 值得推荐，整体满意` | `7` |
| `C. 勉强可用，但不太推荐` | `4` |
| `D. 不推荐，存在明显问题` | `0` |

#### 回购意愿分值映射

| `repurchase` 选项 | 分数 |
| --- | --- |
| `A 会继续使用同款` | `10` |
| `B 会考虑升级同系列` | `8` |
| `C 可能尝试其他品牌` | `5` |
| `D 不会再买` | `0` |

#### 综合评分计算方式

- 来自 `publish-rating` 组件提交的 `ratings: object[]`
- 取当前帖子 5 维评分的平均值
- 每个评分项取 `score`
- 分数范围：`1 ~ 10`
- 不区分具体装备类型，只按 `ratings[].score` 做平均

## 3.3 统一存储原则

- `images` 直接存数组
- `environments` 直接存数组
- `ratings` 直接存数组
- `pros`、`cons`、`comboGear`、`compareGear`、`tripStatus`、`targetFish`、`envFeelings`、`rigs` 全部直接存数组
- `tags` 直接存对象
- 不再把模式字段混入 `content`
- `content` 仅表示正文文本内容

## 4. 模式字段定义

## 4.1 好物速报 `topicCategory=0`

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gearCategory` | `string` | 是 | 装备分类 |
| `gearModel` | `string` | 否 | 装备型号展示文案 |
| `gearItemId` | `number` | 否 | 装备库唯一 ID，推荐按选择器带出 |
| `usageYear` | `string` | 是 | 使用时长 |
| `usageFrequency` | `string` | 是 | 使用频率 |
| `environments` | `string[]` | 是 | 使用场景 |
| `customScene` | `string` | 否 | 自定义场景 |
| `summary` | `string` | 是 | 一句话总结 |
| `pros` | `string[]` | 是 | 推荐理由 |
| `tags` | `object` | 是 | 推荐标签对象 |

### `tags` 结构

```json
{
  "scene": [],
  "customScene": [],
  "budget": "",
  "usage": [],
  "shareReasons": []
}
```

### 字段归属说明

- `预算倾向`：在 `tags.budget` 中，单选，类型应为 `string`，选填
- `使用倾向`：在 `tags.usage` 中，多选，类型为 `string[]`，选填
- `分享理由`：在 `tags.shareReasons` 中，多选，类型为 `string[]`，必填
- `推荐理由`：独立字段 `pros`，类型为 `string[]`，必填

说明：

- `分享理由` 和 `推荐理由` 不是重复字段
- `分享理由` 更偏“为什么发这篇”
- `推荐理由` 更偏“为什么值得推荐”
- 因此保留两套字段，不合并

## 4.2 长测评 `topicCategory=1`

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gearCategory` | `string` | 是 | 装备分类 |
| `gearModel` | `string` | 否 | 装备型号展示文案 |
| `gearItemId` | `number` | 否 | 装备库唯一 ID，推荐按选择器带出 |
| `usageYear` | `string` | 是 | 使用时长 |
| `usageFrequency` | `string` | 是 | 使用频率 |
| `verifyImage` | `string` | 是 | 验证图/凭证图 |
| `environments` | `string[]` | 是 | 使用场景 |
| `customScene` | `string` | 否 | 自定义场景 |
| `ratings` | `object[]` | 是 | 评分项 |
| `summary` | `string` | 是 | 总结 |
| `repurchase` | `string` | 是 | 是否愿意回购 |
| `pros` | `string[]` | 否 | 对优点的说明 |
| `cons` | `string[]` | 否 | 对缺点的说明 |
| `tags` | `object` | 是 | 标签对象 |
| `customFit` | `string` | 否 | 自定义适合人群 |
| `customUnfit` | `string` | 否 | 自定义不适合人群 |
| `comboGear` | `string[]` | 否 | 搭配装备 |
| `comboDesc` | `string` | 否 | 搭配说明 |
| `compareGear` | `string[]` | 否 | 对比装备 |
| `compareDesc` | `string` | 否 | 对比说明 |

### `ratings` 结构

```json
[
  {
    "key": "castingScore",
    "name": "抛投",
    "score": 4
  }
]
```

### `tags` 结构

`tags` 直接按客户端 tagConfig 的 groupKey 原样存储，并补齐业务命名后至少包含以下组：

```json
{
  "fit": [],
  "unfit": [],
  "budget": "",
  "usage": [],
  "fitContextTags": [],
  "fitTechniqueTags": [],
  "compareProfile": [],
  "compareBuyDecision": [],
  "purchaseAdvice": [],
  "buyStage": [],
  "supplementParams": []
}
```

### 字段归属说明

- `预算倾向`：在 `tags.budget` 中，单选，类型为 `string`，必填
- `使用倾向`：在 `tags.usage` 中，多选，类型为 `string[]`，必填
- `对优点的说明`：独立字段 `pros`，类型为 `string[]`，选填
- `对缺点的说明`：独立字段 `cons`，类型为 `string[]`，选填
- `适合人群`：在 `tags.fit` 中，多选，类型为 `string[]`，必填
- `不适合人群`：在 `tags.unfit` 中，多选，类型为 `string[]`，必填
- `适配场景`：在 `tags.fitContextTags` 中，多选，类型为 `string[]`，选填
- `适配玩法`：在 `tags.fitTechniqueTags` 中，多选，类型为 `string[]`，选填
- `对比定位`：在 `tags.compareProfile` 中，类型统一为 `string[]`，选填
- `对比购买结论`：在 `tags.compareBuyDecision` 中，类型统一为 `string[]`，选填
- `入手建议`：在 `tags.purchaseAdvice` 中，类型统一为 `string[]`，选填
- `购买定位`：在 `tags.buyStage` 中，类型统一为 `string[]`，选填
- `补充参数`：新增到 `tags.supplementParams` 中，类型为 `string[]`，选填

说明：

- `适合人群` / `不适合人群` 已有标签组，不需要再新增独立同名字段
- `customFit` / `customUnfit` 是自定义补充文本，不和 `tags.fit` / `tags.unfit` 重复
- `补充参数` 目前在现有代码和配置里还没有对应 groupKey，这次应新增到 `tags` 结构

## 4.3 讨论&提问 `topicCategory=2`

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `questionType` | `string` | 是 | 问题类型 |
| `relatedGearCategory` | `string` | 否 | 关联装备分类 |
| `relatedGearModel` | `string` | 否 | 关联装备型号展示文案 |
| `relatedGearItemId` | `number` | 否 | 关联装备在装备库中的唯一 ID |
| `quickReplyOnly` | `boolean` | 否 | 是否偏好简短回复 |

### `questionType` 枚举

- `ask`
- `discuss`
- `recommend`
- `avoid_pitfall`
- `chat_with_photos`

## 4.4 鱼获展示 `topicCategory=3`

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `locationTag` | `string` | 是 | 位置标签 |
| `length` | `string` | 否 | 长度 |
| `isLengthSecret` | `boolean` | 否 | 是否隐藏长度 |
| `isLengthEstimated` | `boolean` | 否 | 长度是否估算 |
| `weight` | `string` | 否 | 重量 |
| `isWeightSecret` | `boolean` | 否 | 是否隐藏重量 |
| `isWeightEstimated` | `boolean` | 否 | 重量是否估算 |

说明：

- Catch 模式正文 `content` 可为空
- Catch 模式图片 `images` 必填

## 4.5 钓行分享 `topicCategory=4`

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `tripResult` | `string` | 是 | 钓行结果 |
| `tripStatus` | `string[]` | 是 | 钓行总结 |
| `targetFish` | `string[]` | 是 | 目标鱼 |
| `customTargetFish` | `string` | 否 | 自定义目标鱼 |
| `season` | `string` | 是 | 季节 |
| `weather` | `string` | 是 | 天气 |
| `waterType` | `string` | 是 | 水域类型 |
| `mainSpot` | `string` | 是 | 主要钓点 |
| `fishingTime` | `string` | 是 | 作钓时间 |
| `envFeelings` | `string[]` | 否 | 环境感受 |
| `rigs` | `string[]` | 是 | 钓组/饵型 |
| `rigDescription` | `string` | 否 | 钓组说明 |

说明：

- Trip 模式正文统一使用基础字段 `content`
- Trip 模式图片统一使用基础字段 `images`

## 5. 接口设计

## 5.1 新建草稿

### 接口

`PUT /mini/topic`

### 说明

- 使用新字段直接入库
- 草稿和正式发布使用同一套字段结构
- 仅 `status` 不同

### 请求体

请求体 = 通用字段 + 对应模式字段

### 服务端行为

- 写入集合：`bz_mini_topic`
- 自动写入：
  - `userId`
  - `status = 0`
  - `isDelete = 0`
  - `createTime`
  - `updateTime`
  - `contentQualityScore = 0`
  - `engagementScore = 0`
  - `credibilityScore = 0`
  - `knowledgeScore = 0`
  - `sampleCount = 0`
  - `recommendationScore`
- 返回：草稿 `id`

## 5.2 发布帖子

### 接口

`POST /mini/topic`

### 请求体

请求体 = 通用字段 + 对应模式字段

### 发布规则

- 携带 `id`：将草稿更新并发布
- 不携带 `id`：直接创建并发布

### 服务端行为

- 自动写入：
  - `userId`
  - `status = 2`
  - `publishTime`
  - `updateTime`
  - `contentQualityScore`
  - `engagementScore`
  - `credibilityScore`
  - `knowledgeScore`
  - `sampleCount`
  - `recommendationScore`
- 返回：`true/false`

### 请求体示例

#### 好物速报

```json
{
  "topicCategory": 0,
  "title": "这支竿子真适合新手入门",
  "content": "为什么想推荐它...",
  "images": ["cloud://a.jpg", "cloud://b.jpg"],
  "gearCategory": "rod",
  "gearModel": "XXX",
  "gearItemId": 10086,
  "usageYear": "1年",
  "usageFrequency": "每周1-2次",
  "environments": ["lake", "river"],
  "customScene": "",
  "summary": "轻、稳、容错高",
  "pros": ["轻", "抛投舒服", "不累"],
  "tags": {
    "scene": ["lake"],
    "customScene": [],
    "budget": ["300-500"],
    "usage": ["新手入门"],
    "shareReasons": ["性价比高"]
  }
}
```

#### 长测评

```json
{
  "topicCategory": 1,
  "title": "用了两年后的真实体验",
  "content": "正文内容",
  "images": ["cloud://a.jpg"],
  "gearCategory": "reel",
  "gearModel": "ABC",
  "gearItemId": 20012,
  "usageYear": "2年",
  "usageFrequency": "每周3次",
  "verifyImage": "cloud://verify.jpg",
  "environments": ["river", "lake"],
  "customScene": "",
  "ratings": [
    { "key": "castingScore", "name": "抛投", "score": 4 }
  ],
  "summary": "泛用但偏重",
  "repurchase": "会",
  "pros": ["稳", "顺滑"],
  "cons": ["略重"],
  "tags": {
    "budget": ["1000-1500"],
    "usage": ["泛用"],
    "purchaseAdvice": ["可以买"],
    "buyStage": ["升级"]
  },
  "customFit": "",
  "customUnfit": "",
  "comboGear": ["某某竿"],
  "comboDesc": "搭配后更均衡",
  "compareGear": ["某某轮"],
  "compareDesc": "刹车更稳"
}
```

#### 讨论&提问

```json
{
  "topicCategory": 2,
  "title": "这个水域该怎么找鱼",
  "content": "详细问题描述",
  "images": ["cloud://a.jpg"],
  "questionType": "ask",
  "relatedGearCategory": "bait",
  "relatedGearModel": "YYY",
  "relatedGearItemId": 30009,
  "quickReplyOnly": false
}
```

#### 鱼获展示

```json
{
  "topicCategory": 3,
  "title": "今天最大的一条",
  "content": "",
  "images": ["cloud://a.jpg"],
  "locationTag": "江河",
  "length": "58",
  "isLengthSecret": false,
  "isLengthEstimated": true,
  "weight": "2.8",
  "isWeightSecret": false,
  "isWeightEstimated": false
}
```

#### 钓行分享

```json
{
  "topicCategory": 4,
  "title": "傍晚窗口期真短",
  "content": "今天整体过程记录",
  "images": ["cloud://a.jpg", "cloud://b.jpg"],
  "tripResult": "有几口但没打中",
  "tripStatus": ["窗口期很短", "只在特定结构出鱼"],
  "targetFish": ["鲈鱼"],
  "customTargetFish": "",
  "season": "秋",
  "weather": "阴",
  "waterType": "江河",
  "mainSpot": "桥墩附近",
  "fishingTime": "傍晚",
  "envFeelings": ["风大", "水浑"],
  "rigs": ["德州", "跳底"],
  "rigDescription": "5g铅坠+软饵"
}
```

## 5.3 获取帖子列表

### 接口

`GET /mini/topic/all`

### 建议查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `topicCategory` | `number` | 否 | 按模式筛选 |
| `title` | `string` | 否 | 标题搜索 |
| `gearCategory` | `string` | 否 | 装备类帖子筛选 |
| `gearModel` | `string` | 否 | 装备型号文本筛选，兼容旧帖和手输型号 |
| `gearItemId` | `number` | 否 | 装备库唯一 ID 筛选，推荐优先使用 |
| `questionType` | `string` | 否 | 问答模式筛选 |
| `page` | `number` | 否 | 页码 |
| `limit` | `number` | 否 | 每页数量 |

### 返回原则

- 返回新字段，不返回旧兼容字段
- 列表返回基础字段 + 当前模式的摘要字段
- 装备相关推荐场景下，Recommend / Experience 优先按 `gearItemId` 命中，Question 优先按 `relatedGearItemId` 命中
- 如果帖子没有装备 ID，再兜底按 `gearModel` / `relatedGearModel` 文本匹配
- `content` 可按需要截断为摘要

### 后台字段返回说明

- 列表接口可返回 `contentQualityScore`、`engagementScore`、`credibilityScore`、`recommendationScore`、`knowledgeScore`、`sampleCount`
- 如果列表页暂时不展示这些字段，也建议保留在返回结构中，便于后续做排序、精选、聚合统计
- `recommendationScore` 仅在长测评帖子中有实际值
- `knowledgeScore` 主要用于钓行分享帖子

### 列表项基础结构

```json
{
  "id": "topic_xxx",
  "topicCategory": 1,
  "title": "用了两年后的真实体验",
  "content": "正文摘要",
  "images": ["cloud://a.jpg"],
  "status": 2,
  "userId": "user_xxx",
  "nickName": "钓友A",
  "avatarUrl": "cloud://avatar.jpg",
  "author": {
    "id": "user_xxx",
    "name": "钓友A",
    "avatar": "cloud://avatar.jpg",
    "displayTag": {
      "id": "tag_identity_stream",
      "name": "溪流路亚",
      "type": "identity",
      "rarityLevel": 2,
      "styleKey": "identity_blue",
      "isAuthoritative": true
    }
  },
  "displayTag": {
    "id": "tag_identity_stream",
    "name": "溪流路亚",
    "type": "identity",
    "rarityLevel": 2,
    "styleKey": "identity_blue",
    "isAuthoritative": true
  },
  "isLike": false,
  "likeCount": 12,
  "commentCount": 3,
  "publishTime": "2026-03-11 10:00:00"
}
```

### 各模式建议返回的摘要字段

- Recommend：
  - `gearCategory`
  - `gearModel`
  - `gearItemId`
  - `usageYear`
  - `summary`
  - `pros`
- Experience：
  - `gearCategory`
  - `gearModel`
  - `gearItemId`
  - `usageYear`
  - `summary`
  - `ratings`
  - `repurchase`
- Question：
  - `questionType`
  - `relatedGearCategory`
  - `relatedGearModel`
  - `relatedGearItemId`
  - `quickReplyOnly`
- Catch：
  - `locationTag`
  - `length`
  - `isLengthSecret`
  - `weight`
  - `isWeightSecret`
- Trip：
  - `tripResult`
  - `targetFish`
  - `season`
  - `weather`
  - `waterType`
  - `mainSpot`

## 5.4 获取帖子详情

### 接口

`GET /mini/topic?topicId={id}`

### 返回原则

- 返回完整新字段
- 不再返回旧兼容字段
- 不再把模式字段封到 `content` 里

### 后台字段返回说明

- 详情接口返回后台运营字段，与模式字段一起输出
- 长测评详情返回服务端计算后的 `recommendationScore`
- 钓行分享详情返回 `knowledgeScore`
- 其余后台字段当前默认值可为 `0`

### 返回结构

详情返回 = 基础字段 + 发布者信息 + 当前模式完整字段

### 装备详情页相关推荐

- 装备详情页底部“相关推荐”统一调用 `GET /mini/topic/all`
- 页签固定为：`长测评(topicCategory=1)`、`好物速报(topicCategory=0)`、`讨论&提问(topicCategory=2)`
- Recommend / Experience：
  - 优先传 `gearItemId`
  - 同时附带 `gearCategory`、`gearModel` 作为兼容兜底
- Question：
  - 优先传当前装备的 `gearItemId`，服务端匹配帖子中的 `relatedGearItemId`
  - 同时附带 `gearCategory`、`gearModel`，服务端兜底匹配 `relatedGearCategory`、`relatedGearModel`
- 如果没有匹配结果，客户端显示：`这里还空着呢，要不要做第一个分享的人？`

## 5.5 获取草稿

### 接口

`GET /mini/topic/tmp`

### 返回结构

- 返回当前用户最新一条草稿
- 字段结构和发布请求保持一致

## 5.6 获取我的帖子

### 接口

`GET /mini/topic/mine`

### 建议查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | `number` | 否 | `0=草稿`，`2=已发布` |
| `topicCategory` | `number` | 否 | 模式筛选 |
| `page` | `number` | 否 | 页码 |
| `limit` | `number` | 否 | 每页数量 |

## 5.7 删除帖子

### 接口

`DELETE /mini/topic`

### 请求体

```json
{
  "id": "topic_xxx"
}
```

## 5.8 点赞/取消点赞

### 接口

`POST /mini/topic/like`

### 请求体

```json
{
  "topicId": "topic_xxx"
}
```

## 5.9 标签相关接口（帖子作者标签依赖）

帖子详情/列表里的作者标签，不再由前端根据 `tagName + rarityLevel` 自行推断，统一依赖 tag 系统接口和服务端返回的 `author.displayTag`。

### 获取用户标签衣柜

接口：
`GET /mini/tag/usable`

返回说明：
- 返回当前用户已拥有、可佩戴、状态有效的标签列表
- 每条记录同时包含用户拥有关系字段和标签定义字段
- 前端编辑资料页、积分商城兑换成功后的刷新，都读取这个接口

返回项核心字段：
- `id`：用户拥有记录 id
- `userTagId`：用户拥有记录 id
- `tagId`：标签定义 id
- `name`
- `type`
- `displayCategory`：用户侧展示分类，固定为 `identity / fun / behavior / official`
- `displayLabel`：展示分类文案，如“身份标签”“经历标签”
- `displayCategoryDescription`：分类说明文案
- `sourceLabel`：来源说明，如“积分兑换 / 活动获得 / 系统授予 / 官方发放”
- `rarityLabel`：稀有标记，当前统一返回 `R1 ~ R5`
- `rarityLevel`
- `styleKey`
- `iconKey`
- `displayPriority`
- `isMainTag`
- `isEquipped`
- `displayTag`

### 获取当前主标签与帖子展示偏好

接口：
`GET /mini/tag/used`

返回结构：

```json
{
  "mainTagId": "tag_fun_almost_skunk",
  "mainTag": {
    "id": "tag_fun_almost_skunk",
    "name": "差点打龟",
    "type": "fun",
    "displayCategory": "fun",
    "displayLabel": "娱乐标签",
    "rarityLevel": 2,
    "styleKey": "fun_blue",
    "iconKey": "splash",
    "isAuthoritative": false,
    "isMainTag": true,
    "isEquipped": true
  },
  "equippedTagId": "tag_fun_almost_skunk",
  "equippedTag": {
    "id": "tag_fun_almost_skunk",
    "name": "差点打龟",
    "type": "fun",
    "displayCategory": "fun",
    "displayLabel": "娱乐标签",
    "rarityLevel": 2,
    "styleKey": "fun_blue",
    "iconKey": "splash",
    "isAuthoritative": false,
    "isMainTag": true,
    "isEquipped": true
  },
  "postTagMode": "smart",
  "customPostTags": {
    "experience": "__smart__",
    "catch": "__hidden__"
  },
  "settings": {
    "mainTagId": "tag_fun_almost_skunk",
    "postTagMode": "smart",
    "customPostTags": {
      "experience": "__smart__",
      "catch": "__hidden__"
    }
  },
  "ownedTags": [],
  "groupedTags": [
    {
      "key": "identity",
      "label": "身份",
      "displayLabel": "身份标签",
      "description": "代表你的钓鱼偏好与身份侧写",
      "count": 3,
      "tags": []
    }
  ],
  "previewByPostType": [
    {
      "key": "experience",
      "label": "长测评",
      "topicCategory": 1,
      "displayTag": {
        "id": "tag_identity_creator",
        "name": "长测作者",
        "displayCategory": "identity",
        "displayLabel": "身份标签",
        "styleKey": "identity_blue"
      }
    }
  ]
}
```

说明：
- `mainTagId` 允许为 `null`，表示主页/资料页也不展示主标签
- `postTagMode` 固定为 `main / smart / custom / hidden`
- `customPostTags` 的 value 支持：具体 `tagId`、`__main__`、`__smart__`、`__hidden__`
- `ownedTags` 供编辑资料页直接渲染“我的标签区”
- `groupedTags` 已按用户侧展示模型分组，不再暴露底层 `event -> behavior` 的实现细节
- `previewByPostType` 用于个人页和编辑资料页预览“不同帖子类型最终会显示哪个标签”
- 主页和个人信息页只认 `mainTag`
- 帖子/回复作者标签由服务端根据 `postTagMode + customPostTags + topicCategory` 计算

### 更新当前主标签与帖子展示偏好

接口：
`POST /mini/tag/used`

请求体：

```json
{
  "mainTagId": "tag_fun_almost_skunk",
  "postTagMode": "custom",
  "customPostTags": {
    "recommend": "__main__",
    "experience": "__smart__",
    "question": "__hidden__",
    "catch": "tag_fun_almost_skunk",
    "trip": "tag_identity_creator"
  }
}
```

说明：
- `mainTagId=null` 表示取消主标签，主页/资料页也不再展示
- `postTagMode=main` 表示所有帖子和回复都使用主标签
- `postTagMode=smart` 表示由服务端按帖子类型自动挑选更合适的标签，不命中时回退主标签
- `postTagMode=custom` 表示按 `customPostTags` 为 5 种帖子模式分别指定标签
- `postTagMode=hidden` 表示帖子和回复都不展示标签，但主页/资料页仍可展示主标签
- `customPostTags` 缺省某个模式时，服务端回退主标签；显式传 `__hidden__` 时，该模式不展示标签
- 这些设置会影响帖子接口里 `author.displayTag` 的最终计算结果

### 标签商品接口依赖

标签的获取链路依赖积分商品接口：

- `GET /mini/goods?type=0`
  返回虚拟权益商品列表；若商品是标签类权益，建议返回 `displayTag` / `tagDefinition`，前端积分商城直接按标签样式渲染
- `POST /mini/goods`
  提交兑换；服务端完成积分扣减、库存校验后，将标签写入 `bz_user_tags`

推荐的标签商品返回补充字段：
- `displayTag`
- `tagDefinition`
- `goodsName`
- `points`
- `stock`
- `description`

## 6. 数据库设计

## 6.0 标签系统相关集合

### `bz_tag_definitions`

标签定义表，描述“系统里有哪些标签”。

核心字段：
- `code`
- `name`
- `type`
- `sub_type`
- `rarity_level`
- `style_key`
- `icon_key`
- `source_type`
- `is_redeemable`
- `is_wearable`
- `is_active`
- `display_priority`
- `credibility_weight`
- `scene_scope`
- `description`
- `created_at`
- `updated_at`

### `bz_user_tags`

用户拥有标签表，描述“某个用户拥有哪些标签”。

核心字段：
- `user_id`
- `tag_id`
- `obtain_method`
- `obtain_source_id`
- `status`
- `obtained_at`
- `expires_at`
- `created_at`
- `updated_at`

### `user_tag_display_settings`

用户标签展示设置表，描述“当前佩戴哪个标签，以及各帖子场景的展示偏好”。

核心字段：
- `user_id`
- `equipped_tag_id`
- `display_strategy`
- `prefer_identity_in_review`
- `prefer_fun_in_catch`
- `updated_at`

## 6.1 主表 `bz_mini_topic`

主表直接按新字段存，不再做旧结构兼容。

### 基础字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | `string` | 主键 |
| `userId` | `string` | 发布者 |
| `topicCategory` | `number` | 模式 |
| `title` | `string` | 标题 |
| `content` | `string` | 正文 |
| `images` | `array` | 图片数组 |
| `status` | `number` | `0=草稿`，`2=已发布` |
| `isDelete` | `number` | 逻辑删除 |
| `likeCount` | `number` | 点赞数 |
| `commentCount` | `number` | 评论数 |
| `createTime` | `date` | 创建时间 |
| `publishTime` | `date` | 发布时间 |
| `updateTime` | `date` | 更新时间 |

### Recommend 字段

- `gearCategory`
- `gearModel`
- `gearItemId`
- `usageYear`
- `usageFrequency`
- `environments`
- `customScene`
- `summary`
- `pros`
- `tags`

### Experience 字段

- `gearCategory`
- `gearModel`
- `gearItemId`
- `usageYear`
- `usageFrequency`
- `verifyImage`
- `environments`
- `customScene`
- `ratings`
- `summary`
- `repurchase`
- `pros`
- `cons`
- `tags`
- `customFit`
- `customUnfit`
- `comboGear`
- `comboDesc`
- `compareGear`
- `compareDesc`

### Question 字段

- `questionType`
- `relatedGearCategory`
- `relatedGearModel`
- `relatedGearItemId`
- `quickReplyOnly`

### Catch 字段

- `locationTag`
- `length`
- `isLengthSecret`
- `isLengthEstimated`
- `weight`
- `isWeightSecret`
- `isWeightEstimated`

### Trip 字段

- `tripResult`
- `tripStatus`
- `targetFish`
- `customTargetFish`
- `season`
- `weather`
- `waterType`
- `mainSpot`
- `fishingTime`
- `envFeelings`
- `rigs`
- `rigDescription`

## 6.2 建议索引

主表建议建立：

- `topicCategory + status + isDelete + publishTime`
- `userId + status + isDelete + updateTime`
- `title`
- `gearCategory`
- `questionType`

## 6.3 相关表

### `bz_topic_like`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | `string` | 主键 |
| `topicId` | `string` | 帖子 id |
| `userId` | `string` | 点赞用户 |
| `createTime` | `date` | 创建时间 |

### `bz_topic_comment`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | `string` | 主键 |
| `topicId` | `string` | 帖子 id |
| `content` | `string` | 评论内容 |
| `replyCommentId` | `string` | 回复的评论 id |
| `replyUserId` | `string` | 回复目标用户 id |
| `userId` | `string` | 评论用户 |
| `isVisible` | `number` | 是否可见 |
| `createTime` | `date` | 创建时间 |
| `updateTime` | `date` | 更新时间 |

## 7. 客户端提交规范

当前客户端各模式内部表单字段并不完全同名，建议统一在提交前做一次字段归一。

### 统一归一规则

- `mainContent` -> `content`
- `mainImages` -> `images`
- `verifyImage` 保持不变
- `repurchase` 保持不变
- 装备联想选择器除 `gearModel` / `relatedGearModel` 文案外，需同时提交 `gearItemId` / `relatedGearItemId`
- `pros`、`cons`、`ratings`、`tags`、`environments` 原样提交数组/对象
- `Catch/Trip/Question` 已经是新字段，直接提交

### 客户端目标

- `publishMode` 只做模式分发，不再负责旧字段映射
- 每个 `post-*` 组件提交的最终 payload 都直接满足接口结构
- 不再在客户端做旧字段兼容和 JSON 字符串拼装

## 8. 当前改造结论

这版整理之后，帖子模块的统一方向就是：

- 接口层只认新字段
- 服务端只存新字段
- 数据库只保留新字段
- 列表和详情只返回新字段
- 各模式字段不再混装进 `content`

如果后续按本文落地，需要同步修改三层：

1. 客户端 `publishMode` 和各 `post-*` 组件提交结构
2. 云函数 `miniApi` 的发布、列表、详情处理逻辑
3. `bz_mini_topic` 的字段设计和历史数据迁移方案

## 9. 各类内容封面与详情页展示规范

本节定义首页卡片封面和帖子详情页的展示顺序，客户端列表页、预览页、详情页统一按本节执行。

## 9.1 好物速报 `topicCategory=0`

### 封面展示顺序

1. 封面图
2. 标题
3. 装备分类 + 型号
4. 一句话总结
5. 1 到 2 个“分享理由 / 推荐理由”标签
6. 使用场景或使用时长，二选一，只露一个

### 封面注意事项

- 封面信息要轻，不要堆太多内容
- 不要把频率、预算、使用倾向同时塞进封面
- 核心是让用户快速知道“这是什么装备 + 为什么值得点开”

### 详情页顺序

1. 标题 + 型号 + 分类
2. 一句话总结
3. 分享理由 / 推荐理由
4. 基本信息：时长、频率、场景、预算、使用倾向
5. 正文
6. 图片

## 9.2 长测评 `topicCategory=1`

### 封面展示顺序

1. 封面图
2. 标题
3. 装备分类 + 型号
4. 一句话总结
5. “长测评”标识 + 使用年限
6. ABCD 推荐等级文案
7. 2 个最关键标签
8. 优点 1 个
9. 适合人群 1 个

### 详情页顺序

第一屏：结论卡
1. 标题
2. 型号 + 分类
3. 一句话总结
4. ABCD 推荐文案
5. 再次选择意愿
6. 使用年限 / 频率 / 场景
7. 作者五维评分，优先条形图，也可雷达图

第二屏：使用边界
1. 适合人群
2. 不适合人群
3. 主要优点
4. 主要缺点

第三屏：正文证据
1. 正文
2. 图片

第四屏：进阶信息
1. 常用搭配
2. 对比对象
3. 入手建议
4. 购买定位
5. 参数补充

### 详情页注意事项

- 长测评是核心内容，详情页必须结论先行
- 第一屏必须先把结论、推荐等级、复购意愿、评分打出来

## 9.3 讨论&提问 `topicCategory=2`

### 封面展示顺序

1. 类型标签：提问 / 讨论 / 求推荐 / 求避坑 / 晒图闲聊
2. 标题
3. 关联装备，有就露，没有就不露
4. 快速回答标识，开启时显示
5. 图片缩略图，有图再露

### 详情页顺序

1. 类型标签
2. 标题
3. 关联装备
4. 正文
5. 图片
6. 回答区

### 封面注意事项

- 封面只需要让用户快速判断“要不要回复”
- 不要在封面堆过多正文摘要

## 9.4 鱼获展示 `topicCategory=3`

### 封面展示顺序

1. 大图
2. 标题
3. 位置标签
4. 长度 / 重量，有就显示，没有就不占位

### 详情页顺序

1. 图片轮播
2. 标题
3. 位置标签
4. 长度 / 重量
5. 发布时间
6. 评论互动区

### 展示注意事项

- 鱼获展示的核心是图，其它信息都要让路
- 长度、重量没有值时不占版面

## 9.5 钓行分享 `topicCategory=4`

### 封面展示顺序

1. 标题
2. 钓行结果标签
3. 目标鱼
4. 水域类型 + 季节 / 天气，二选二组合
5. 主要钓组 / 饵型
6. 图片缩略图，有图再露

### 详情页顺序

第一屏：结果卡
1. 标题
2. 钓行结果
3. 状态标签
4. 目标鱼

第二屏：环境卡
1. 季节
2. 天气
3. 水域类型
4. 主要钓点
5. 作钓时间
6. 环境感受

第三屏：打法卡
1. 主要钓组 / 饵型
2. 手法简述

第四屏：正文与图片
1. 正文
2. 图片

### 展示注意事项

- 封面优先展示“结果感”
- 详情页优先展示“经验结构”
