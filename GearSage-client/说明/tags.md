一、先定总原则

GearSage 的 tag 系统，先只解决 3 件事：

识别作者是谁

在不同帖子里决定该不该突出

tag 定成这 4 类：

1）identity

身份类
用于表达“这个人是谁 / 擅长什么 / 为什么值得看”

例如：

溪流路亚

夜钓党

硬饵党

长测作者

2）fun

趣味类
用于表达钓鱼梗、圈内味、社区气氛

例如：

差点打龟

空钩上鱼

打火机

拍大腿

3）event

纪念/荣誉类
用于表达活动、资历、阶段身份

例如：

开服元老

首发测试员

周年纪念

4）official

官方类
先把结构留好，先不主做
以后给入驻钓手、合作作者、官方认证、专属 tag 用

例如未来：

驻站钓手

GearSage 认证

品牌合作作者

三、rarity 的作用要降级

这个非常关键。

以后 rarity 只表示“稀有度/获得难度/装饰感”，
不再表示“权威度/可信度/身份等级”。
1）tag_definitions（tag 定义表）

这张表定义“世界上有哪些 tag”。

建议字段：

tag_definitions
- id
- code                  -- 唯一编码，如 fun_almost_skunk
- name                  -- 展示文案
- type                  -- identity / fun / event / official
- sub_type              -- scene / style / honor / meme / certification
- rarity_level          -- 1-5，只负责稀有度
- style_key             -- 前端样式模板 key
- icon_key              -- 可选，小图标
- source_type           -- system / shop / event / manual
- is_redeemable         -- 是否可积分兑换
- is_wearable           -- 是否允许佩戴
- is_active             -- 是否启用
- display_priority      -- 展示优先级
- credibility_weight    -- 是否带可信属性，0/1 或数值
- scene_scope           -- JSON，允许在哪些场景优先展示
- description           -- 后台说明
- created_at
- updated_at

user_tags（用户拥有 tag 表）

这张表表示“某个用户拥有哪些 tag”。

user_tags
- id
- user_id
- tag_id
- obtain_method         -- redeem / event / admin_grant / system
- obtain_source_id      -- 订单id/活动id/后台发放记录id
- status                -- active / expired / revoked
- obtained_at
- expires_at            -- 可为空
- created_at
- updated_at

user_tag_display_settings（用户展示设置表）

这张表决定“用户想戴哪个 tag”。

user_tag_display_settings
- user_id
- equipped_tag_id               -- 当前主动佩戴
- prefer_identity_in_review     -- 长测评是否优先身份类
- prefer_fun_in_catch           -- 鱼获展示是否优先趣味类
- updated_at

四 服务端和前端职责要分清

这个地方别让前端自己判断太多，不然后面很乱。

服务端负责

返回用户拥有的所有 tag

处理兑换、发放、回收、过期

根据帖子类型，计算当前详情页该显示哪个 tag

给前端返回“最终展示 tag”

前端负责

用 style_key 渲染样式

只展示服务端给的最终 tag

不自己推断业务优先级

不再只靠 rarityLevel 决定效果



五 最关键的一步：把“显示哪个 tag”放到服务端算
返回帖子详情时，服务端顺手返回 author.displayTag

例如：

{
  "author": {
    "id": "u_001",
    "name": "Tommy",
    "avatar": "xxx",
    "displayTag": {
      "id": "tag_101",
      "name": "溪流路亚",
      "type": "identity",
      "rarityLevel": 2,
      "styleKey": "identity_blue",
      "iconKey": "stream",
      "isAuthoritative": true
    }
  }
}



六 、服务端展示决策规则，我建议这样定

先做一版简单但够用的。

1）通用优先级

先定义一个全局顺序：

official > identity > event > fun

但不是所有帖子都照这个顺序硬套，而是按帖子类型微调。

2）按帖子类型决定显示策略
长测评

优先级：
official > identity > equipped_tag > event > fun

解释：

长测评是最依赖可信度的内容

默认优先身份类

即使用户佩戴了“差点打龟”，也不要优先显示这个

钓行分享

优先级：
official > identity > equipped_tag > event > fun

和长测评接近。
因为这也是经验型内容。

好物速报

优先级：
equipped_tag > identity > event > fun > official
或者
identity > equipped_tag > fun

这里可以更中性。
我更推荐第二种：

identity > equipped_tag > fun

这样整体更稳。

讨论&提问

优先级：
equipped_tag > identity > fun > event > official

因为这里作者身份不是重点，
用户佩戴什么就显示什么，问题本身更重要。

鱼获展示

优先级：
equipped_tag > fun > event > identity > official

这是最适合展示趣味 tag 的模式。
用户如果戴了“打火机”“差点打龟”，这里显示出来反而有味道。


用户个人中心，资料，编辑，标签展示逻辑 设计V2.0
一、主标签保留，但允许为空

主标签的职责只做 3 件事：

个人信息编辑页展示

别人访问你的主页时展示

作为帖子/回复标签的默认兜底

也就是说：

mainTagId = null 合法

这就代表“我主页也不佩戴主标签”

这样“完全不戴标签”这条路就打通了。

二、把“帖子展示方式”做成单选策略，不要再做两个开关

我建议直接做成一个单选项：

帖子标签展示方式

使用主标签

智能推荐

自定义

不显示标签

这 4 个就够了。

这比“一个总开关 + 一个自定义开关”清楚太多。

三、你想要的功能，其实这 4 个策略都能覆盖
1）使用主标签

逻辑：

所有帖子都显示主标签

所有回复都显示主标签

主页 / 个人信息页显示主标签

如果主标签为空，则帖子/回复/主页都不显示

这就覆盖了你说的：

主标签默认影响主页、个人信息、回复；打开总开关时所有帖子都用主标签

2）智能推荐

逻辑：

主页 / 个人信息页仍显示主标签

帖子按模式智能选标签

回复也按所处内容模式智能选

如果没有合适标签，则回退主标签

主标签也为空，则不显示

这就覆盖了你说的：

关闭总开关后，使用系统智能携带标签

3）自定义

逻辑：

主页 / 个人信息页仍显示主标签

每个模式的帖子单独指定标签

回复跟随对应模式

某个模式没配置时，回退主标签

主标签也为空，则不显示

这就覆盖了你说的：

自定义模式可编辑每个模式展示的标签，回复也跟着模式走

4）不显示标签

逻辑：

所有帖子不显示

所有回复不显示

主页 / 个人信息页仍显示主标签（如果有）

如果主标签为空，则主页也不显示

这个模式很重要。
因为你刚刚点到的那个问题是真的：

用户应该有权选择“帖子里别挂标签，但我主页保留标签”。

这个策略最干净。

四、你现在这套需求，我建议这样落库

你已经把新结构和接口跑起来了，那我建议只加一层偏好设置，不要再拆复杂开关。

1）用户主标签
{
  "mainTagId": "tag_xxx" // 可为 null
}
2）帖子展示策略
{
  "postTagMode": "main" // main / smart / custom / hidden
}
3）自定义映射
{
  "customPostTags": {
    "recommend": "tag_001",
    "experience": "tag_002",
    "question": "tag_003",
    "catch": null,
    "trip": "tag_004"
  }
}

这里的 null 就代表该模式不显示。
也可以允许特殊值：

{
  "customPostTags": {
    "recommend": "__main__",
    "experience": "__smart__",
    "question": "__hidden__",
    "catch": "tag_fun_001",
    "trip": "tag_identity_003"
  }
}

如果你想把扩展性一次留足，我更推荐第二种。

五、最终显示逻辑，我帮你定成一版统一规则
1）个人信息页 / 别人访问你的主页

永远显示：

mainTagId

如果为空，则不显示

这个最稳定，不要智能，不要自定义。

2）帖子作者标签

根据 postTagMode 决定：

main

显示 mainTagId

smart

显示 smartResolvedTag(mode)
如果没有，回退 mainTagId
如果还没有，则不显示

custom

显示 customPostTags[mode]

如果是具体 tagId，就显示这个

如果是 __main__，显示主标签

如果是 __smart__，走智能推荐

如果是 __hidden__ 或 null，不显示

如果配置失效，回退主标签，再不行就不显示

hidden

直接不显示

3）回复标签

这里你说得很对：
回复不应该单独再配一套。

最合理的逻辑就是：

回复显示标签，跟随“当前回复所在内容模式”的展示规则。

例如：

回复长测评 → 用长测评模式的结果

回复鱼获展示 → 用鱼获展示模式的结果

这个非常一致，也省配置。


如果你想最小代价调整，我建议你把原逻辑改成下面这套：

{
  "mainTagId": "tag_xxx | null",
  "postTagMode": "main | smart | custom | hidden",
  "customPostTags": {
    "recommend": "tag_id | __main__ | __smart__ | __hidden__",
    "experience": "tag_id | __main__ | __smart__ | __hidden__",
    "question": "tag_id | __main__ | __smart__ | __hidden__",
    "catch": "tag_id | __main__ | __smart__ | __hidden__",
    "trip": "tag_id | __main__ | __smart__ | __hidden__"
  }
}

这套已经够你后面一直扩了。