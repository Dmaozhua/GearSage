# 装备库 fit_style_tags 枚举与填表规范 v1.3

版本：v1.3  
状态：新字段添加前施工口径  
适用范围：`rate/excel` 装备主表、`GearSage-api` gear 筛选、`pkgGear` 筛选项  
更新时间：2026-05-02

---

## 一、文档目标

本文档用于固定装备库 `fit_style_tags` 字段的枚举值和填写口径。

`fit_style_tags` 的作用是承接“使用方向 / 适用风格 / 适用场景”筛选，不再长期依赖后端从 `model / alias / type_tips` 等文本字段里猜测。

本字段优先用于：

- 列表页筛选
- 列表卡轻量标签
- 详情页 GearSage 解释层
- 对比页候选方向提示

本字段不用于替代：

- 装备基础类型字段，例如 `type`
- lure 的 `system / water_column / action`
- 玩家实测字段
- 官方硬参数字段

---

## 二、字段定义

字段名：

```text
fit_style_tags
```

建议添加位置：

- `reel.xlsx`
- `rod.xlsx`
- `line.xlsx`
- `hook.xlsx`

暂不建议添加到：

- `lure.xlsx`

原因：lure 当前已有更适合自身决策逻辑的 `system / water_column / action / family` 筛选体系，不应强行并入通用 `fit_style_tags`。

---

## 三、填写格式

Excel 中使用逗号分隔多个标签：

```text
精细,轻量,海鲈
```

填写规则：

1. 只允许使用本文档中对应装备类别的枚举值。
2. 多个标签用英文逗号 `,` 分隔。
3. 不填写不确定标签。
4. 不为凑筛选数量强行贴标签。
5. 标签表达 GearSage 归纳，不冒充厂家官方参数。

示例：

```text
reel.fit_style_tags = 精细,海水
rod.fit_style_tags = bass,岸投
line.fit_style_tags = 耐磨,高强度
hook.fit_style_tags = 软饵,防挂
```

---

## 四、枚举总表

### 4.1 reel

适用于渔轮主型号。

reel 不再使用一套统一枚举，按轮型拆分为水滴轮和纺车轮两套。

字段仍统一填写在：

```text
fit_style_tags
```

前端和后端按 reel 的基础类型选择对应枚举：

| reel type | 使用枚举 |
|---|---|
| `baitcasting` | `baitcasting_reel` |
| `spinning` | `spinning_reel` |

`drum` 鼓轮暂不纳入本轮筛选枚举；如后续数据量足够，再单独定义 `drum_reel`，不要直接混进水滴或纺车。

枚举配置：

```js
const FIT_STYLE_TAG_ENUMS = {
  baitcasting_reel: [
    '精细',
    '泛用',
    '远投',
    '强力',
    '海水ok',
    'bass'
  ],

  spinning_reel: [
    '精细',
    '泛用',
    '远投',
    '轻量',
    '海鲈',
    '岸投',
    '近海'
  ]
}
```

#### 4.1.1 baitcasting_reel

适用于水滴轮。

允许值：

```text
精细
泛用
远投
强力
海水
bass
```

含义：

| 枚举值 | 含义 |
|---|---|
| 精细 | 偏 BFS、轻饵、细线、浅杯或精细操作方向 |
| 泛用 | 覆盖面较宽，适合作为常规主力水滴轮理解 |
| 远投 | 偏长距离抛投、远投调校、线杯启动和抛投稳定性 |
| 强力 | 偏重饵、障碍、强控鱼、高刚性或较高负载方向 |
| 海水 | 可以用于海水或具备明确海水适用性的水滴轮 |
| bass | 偏 bass 路亚体系，覆盖常规 bass 水滴轮使用方向 |

说明：

- `海水` 是正式枚举值，不使用 `海水ok`、`SW`、`海水近岸` 等非标准写法。
- 水滴轮不再保留旧的 `重饵 / 细线` 作为独立筛选枚举；这两类判断并入 `强力 / 精细`。
- `bass` 使用英文小写，和 rod 保持一致。

#### 4.1.2 spinning_reel

适用于纺车轮。

允许值：

```text
精细
泛用
远投
轻量
海鲈
岸投
近海
```

含义：

| 枚举值 | 含义 |
|---|---|
| 精细 | 偏小饵、细线、轻量钓组、细腻操作方向 |
| 泛用 | 覆盖面较宽，适合作为常规主力纺车轮理解 |
| 远投 | 偏远距离抛投、顺滑出线、长距离搜索 |
| 轻量 | 偏轻量化机身、轻量竿轮搭配或长时间操作 |
| 海鲈 | 偏海鲈、近岸硬饵、远投搜索等玩法 |
| 岸投 | 偏岸边、堤岸、防波堤、滩涂等岸上作钓场景 |
| 近海 | 偏近海、船钓、轻型海水或更高防护/负载场景 |

说明：

- 纺车轮不使用 `bass` 作为第一版筛选枚举；如果是淡水 bass 泛用纺车轮，优先填写 `泛用` 或 `精细`。
- `海鲈 / 岸投 / 近海` 可以同时存在，但必须有明确定位依据，不用海水场景词凑标签。
- `轻量` 只表示轻量化和搭配体验，不等同于 `精细`。

### 4.2 rod

适用于鱼竿主型号。

允许值：

```text
bass
溪流
海鲈
根钓
岸投
船钓
旅行
```

含义：

| 枚举值 | 含义 |
|---|---|
| bass | 偏 bass 路亚体系，覆盖常规鲈钓竿、泛用 bass 竿、障碍或强控鱼方向 |
| 溪流 | 偏溪流、鳟鱼、小水域轻量玩法 |
| 海鲈 | 偏海鲈、近岸硬饵或远投搜索 |
| 根钓 | 偏根鱼、礁区、底层结构区玩法 |
| 岸投 | 偏岸边作钓、堤岸、滩涂、防波堤等场景 |
| 船钓 | 偏船上作钓、近海船钓、垂直搜索或船抛场景 |
| 旅行 | 2 节以上（不包含 2 节）的多节鱼竿，便携属性 |

说明：

- rod 第一版改为以玩法 / 场景为主，不再把 `精细 / 泛用 / 障碍 / 远投` 作为 rod 筛选枚举。
- `bass` 使用英文小写，表示 bass 路亚体系，不翻译成 `鲈钓`，避免和 `海鲈` 混淆。
- 如果一支竿同时明确适合多个场景，可以填写多个值；不要用旧的 reel / line 风格词补齐。

### 4.3 line

适用于鱼线主型号。

允许值：

```text
泛用
精细
远投
耐磨
隐蔽
高强度
```

含义：

| 枚举值 | 含义 |
|---|---|
| 泛用 | 通用线种或覆盖面较宽 |
| 精细 | 偏小饵、细线、轻量钓组 |
| 远投 | 偏低阻力、顺滑、远距离抛投 |
| 耐磨 | 偏障碍、礁石、结构区使用 |
| 隐蔽 | 偏低可见度、清水、谨慎鱼情 |
| 高强度 | 偏高拉力、高结节强度或大鱼场景 |

### 4.4 hook

适用于鱼钩主型号。

允许值：

```text
软饵
硬饵
精细
障碍
强力
防挂
```

含义：

| 枚举值 | 含义 |
|---|---|
| 软饵 | 更适合软饵、德州、倒钓、铅头等软饵体系 |
| 硬饵 | 更适合硬饵替换钩、三本钩等方向 |
| 精细 | 偏小号、轻量、精细钓组 |
| 障碍 | 偏结构区、草区、复杂障碍环境 |
| 强力 | 偏大鱼、强拉力或更高强度钩条 |
| 防挂 | 明确带防挂、曲柄、防草或类似结构 |

---

## 五、与现有筛选的关系

### 5.1 前端

前端筛选项应从对应类别的固定枚举生成。

当前 `defData.js` 中 reel 的 `usageTags` 后续不能再使用一套静态列表，而应按当前 reel 子类型切换：

- 当前类型为 `baitcasting` 时，展示 `baitcasting_reel` 枚举。
- 当前类型为 `spinning` 时，展示 `spinning_reel` 枚举。
- 当前类型为 `drum` 时，暂不展示 `fit_style_tags` 筛选，或等 `drum_reel` 枚举明确后再开放。

如果前端当前没有选中具体 reel 子类型，可以先不展示 `usageTags`，避免把水滴和纺车的筛选词混在一起。

### 5.2 后端

后端筛选优先读取显式字段：

```text
fit_style_tags
```

reel 筛选需要先根据 `gear_master.type` 判断使用哪套枚举：

- `type = baitcasting` 使用 `baitcasting_reel`
- `type = spinning` 使用 `spinning_reel`
- `type = drum` 暂不参与本轮 `fit_style_tags` 筛选

旧的运行时推导逻辑只作为兜底：

```text
显式 fit_style_tags 命中优先
未填写时，再从 model / alias / type_tips 等字段推导
```

这样可以保证：

- 新数据可控
- 旧数据不立刻失效
- 筛选结果可解释

### 5.3 数据导入

导入链需要保留 `fit_style_tags` 原始值。

如果暂时不新增数据库显式列，也必须确保该字段进入 `gear_master.raw_json`，由后端从 `raw_json` 水合后读取。

---

## 六、与 lure 的边界

lure 暂不使用通用 `fit_style_tags` 作为主筛选。

lure 当前继续使用：

```text
system
water_column
action
family / derived family
```

原因：

- lure 的决策维度天然围绕饵型、水层、动作、泳姿展开。
- `硬饵 / 软饵 / 水面 / 中层` 这些值更像 lure 的结构分类，不适合和 reel / rod 的使用风格混成一套。
- 当前已有 lure 推导推荐词链路，继续保留更稳。

---

## 七、填表优先级

建议按以下顺序补字段：

1. `reel.xlsx`
2. `rod.xlsx`
3. `line.xlsx`
4. `hook.xlsx`

每张表先补主型号行，不急着补 variant 详情表。

首轮目标不是全量完美，而是让筛选可控：

- 明确适合的就填
- 不确定的先空
- 不用猜

---

## 八、示例

### reel

| model | fit_style_tags |
|---|---|
| AIRITY ST spinning | 精细,轻量 |
| SALTIGA spinning | 近海 |
| TATULA SV TW baitcasting | bass,泛用 |
| ZILLION TW HD baitcasting | bass,强力 |

### rod

| model | fit_style_tags |
|---|---|
| 泛用 bass 竿 | bass |
| 溪流竿 | 溪流 |
| 海鲈岸投竿 | 海鲈,岸投 |
| 近海船钓竿 | 船钓 |
| 5 节旅行 bass 竿 | bass,旅行 |

### line

| model | fit_style_tags |
|---|---|
| 通用 PE 线 | 泛用 |
| 氟碳前导 | 耐磨,隐蔽 |
| 远投 PE 线 | 远投 |

### hook

| model | fit_style_tags |
|---|---|
| 曲柄钩 | 软饵,防挂 |
| 三本钩 | 硬饵 |
| 强力单钩 | 强力 |

---

## 九、后续代码调整提醒

添加字段后，需要检查：

1. `defData.js` 的筛选枚举是否与本文档一致。
2. `search-filter` 是否继续按装备类别展示对应枚举。
3. `GearService` 是否优先读取显式 `fit_style_tags`。
4. 导入脚本是否保留该字段到 `raw_json`。
5. smoke test 是否覆盖：
   - baitcasting reel 按 `bass / 海水 / 强力` 筛选
   - spinning reel 按 `轻量 / 海鲈 / 近海` 筛选
   - rod 按 `bass / 根钓 / 船钓 / 旅行` 筛选
   - line 按 `耐磨 / 隐蔽` 筛选
   - hook 按 `软饵 / 防挂` 筛选

---

## 十、鱼竿中间导入层落地记录

参考 `Daiwa台湾鱼竿_爬取补充修复导出流程收口_v1.md` 的已完成口径，鱼竿导入表统一把 `fit_style_tags` 放在主表 `rod`：

- 字段位置：`type_tips` 之后、`images` 之前。
- 详情表：`rod_detail` 不写入 `fit_style_tags`。
- 中间数据：normalized/raw 的主商品层保留 `fit_style_tags`，variant 层不保留。
- 允许值：`bass`、`溪流`、`海鲈`、`根钓`、`岸投`、`船钓`、`旅行`，多个值用英文逗号分隔。
- 不再使用旧鱼竿风格词：`精细`、`泛用`、`障碍`、`远投`。

当前已用 `scripts/apply_rod_master_fit_style_tags.py` 对本地 rod import 表做统一补列和校验：

- Abu
- Ark
- Daiwa
- Dstyle
- Evergreen
- Jackall
- Keitech
- Megabass
- Nories
- Olympic
- Raid
- Shimano

Daiwa 例外需保留：

- `WIND X` 当前 `fit_style_tags` 留空。
- `月下美人` 按使用风格归入 `岸投`。
