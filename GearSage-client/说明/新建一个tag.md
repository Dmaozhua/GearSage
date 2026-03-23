你如果现在要新建一个 tag，核心只要关心一张主表：

- `bz_tag_definitions`

如果这个 tag 还要让用户“拥有”或“兑换”，再补另外两张：

- `bz_user_tags`
- `bz_points_goods`

**一、新建一个 tag 最少要做什么**

先在 `bz_tag_definitions` 新增一条记录。最关键字段是：

- `_id`
- `code`
- `name`
- `type`
- `sub_type`
- `rarity_level`
- `style_key`
- `icon_key`
- `source_type`
- `display_priority`
- `credibility_weight`
- `scene_scope`
- `is_active`
- `is_wearable`
- `is_redeemable`
- `description`

你可以把它理解成：

- `name`：tag 显示文字
- `type`：tag 的大类语义
- `sub_type`：更细的子类
- `rarity_level`：稀有度层级
- `style_key`：前端具体走哪种视觉风格
- `icon_key`：前端用哪种小图形标记
- `display_priority`：智能推荐时优先级
- `scene_scope`：更适合哪些内容场景
- `is_active`：启不启用
- `is_wearable`：能不能佩戴
- `is_redeemable`：能不能上商城兑换

**二、哪些字段控制“显示上的区别”**

最重要的是这 5 个：

1. `name`  
控制 tag 上显示什么文字。  
比如：
- `钓鱼人`
- `差点打龟`
- `内容创作者`

2. `type`  
控制它属于哪一类语义。现在主要是：
- `identity`
- `fun`
- `event`
- `official`

比如你要建一个搞笑梗 tag，就填：
- `type = fun`

3. `sub_type`  
控制它在大类下面更细的归属。  
比如 fun 里常见可以是：
- `meme`
- `social`

event 里常见可以是：
- `achievement`
- `milestone`
- `record`
- `honor`
- `founder`

4. `rarity_level`  
控制稀有度等级。当前是：
- `1 ~ 5`

它主要影响：
- 样式精致度
- 细节层次
- 稀有感

5. `style_key`  
这是最直接控制视觉风格的字段。  
比如当前库里已经在用的有：
- `fun_slate`
- `fun_blue`
- `fun_orange`
- `identity_slate`
- `identity_blue`
- `identity_orange`
- `behavior_blue`
- `behavior_orange`
- `official_gold`

同样是 `fun`，不同 `style_key` 看起来也会不同。

6. `icon_key`  
控制 tag 左侧的小标记。当前组件支持这些 key：
- `stream`
- `wave`
- `splash`
- `hook`
- `spark`
- `bolt`
- `crown`
- `reel`
- `rod`
- `fish`
- `calendar`
- `gear`
- `storm`
- `leaf`
- `fire`
- `heart`
- `chat`
- `pen`

**三、如果你要新建一个 fun 类型 tag，具体怎么配**

比如你要建一个：
- 文字：`差点打龟`
- 类型：`fun`
- 稀有度：`2`
- 样式：偏蓝色
- 小图形：水花

可以这样配：

```json
{
  "_id": "tag_fun_almost_skunk",
  "code": "fun_almost_skunk",
  "name": "差点打龟",
  "type": "fun",
  "sub_type": "meme",
  "rarity_level": 2,
  "style_key": "fun_blue",
  "icon_key": "splash",
  "source_type": "shop",
  "display_priority": 40,
  "credibility_weight": 0,
  "scene_scope": ["catch", "trip"],
  "is_active": true,
  "is_wearable": true,
  "is_redeemable": true,
  "description": "适合鱼获展示和钓行分享的社区梗标签"
}
```

这条配置的含义就是：
- 文案显示 `差点打龟`
- 它是 `fun` 类
- 稀有度 `R2`
- 视觉走 `fun_blue`
- 图形走 `splash`
- 智能推荐时更偏向 `catch/trip`
- 可佩戴、可兑换、已启用

**四、如果只建定义还不够，还要做什么**

1. 让某个用户拥有这个 tag  
往 `bz_user_tags` 插一条：

```json
{
  "user_id": "用户ID",
  "tag_id": "tag_fun_almost_skunk",
  "obtain_method": "admin_grant",
  "status": "active",
  "obtained_at": "当前时间",
  "created_at": "当前时间",
  "updated_at": "当前时间"
}
```

2. 如果要上积分商城  
往 `bz_points_goods` 加一条商品，并让 `tag_id` 指向这个 tag。

3. 如果要设成主标签  
更新 `user_tag_display_settings`：
- `main_tag_id`
- `equipped_tag_id`

**五、你最需要记住的字段关系**

如果你只关心“新建一个 tag 怎么配显示”，就记这一组：

- `name`：显示文字
- `type`：大类
- `sub_type`：子类
- `rarity_level`：稀有度
- `style_key`：视觉风格
- `icon_key`：图形标记
- `scene_scope`：适合哪些帖子场景
- `display_priority`：智能推荐优先级

**六、推荐做法**

新增 tag 时，最好先从现有风格里挑，而不是发明一套全新的 `style_key`。  
比如：

- 普通 fun：`fun_slate`
- 稍稀有 fun：`fun_blue`
- 更有收藏感 fun：`fun_orange`

这样整套系统会稳很多。

如果你要，我下一步可以直接帮你输出一份“新增 tag 模板表”，你以后每次只要填：
- 名字
- 类型
- 稀有度
- 样式
- icon
- 来源
就能直接生成一条完整的数据库记录。