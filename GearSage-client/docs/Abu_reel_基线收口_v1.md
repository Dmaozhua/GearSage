# Abu reel 基线收口 v1

## 范围

当前 Abu Garcia reel 基线包含两条官网链：

1. Abu 纺车轮
2. Abu 水滴/鼓轮

数据来源均为 Abu Garcia 官网 Shopify 产品页。

## 当前正式文件

### 纺车轮

- 正式中间层：
  - `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_spinning_reels_import.xlsx`
- 规范化缓存：
  - `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_spinning_reels_normalized.json`
- 审查表：
  - `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_spinning_reels_review.xlsx`
- 收口文档：
  - `/Users/tommy/GearSage/GearSage-client/docs/Abu纺车轮_基线收口_v1.md`

### 水滴/鼓轮

- 正式中间层：
  - `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_baitcasting_reel_import.xlsx`
- 规范化缓存：
  - `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_baitcasting_reels_normalized.json`
- 审查表：
  - `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_baitcasting_reel_review.xlsx`
- 收口文档：
  - `/Users/tommy/GearSage/GearSage-client/docs/Abu水滴鼓轮_基线收口_v1.md`

## 当前规模

### Abu 纺车轮

- 主商品：12
- detail：45

### Abu 水滴/鼓轮

- 主商品：41
- detail：93

## 当前已完成

### 纺车轮

- 官网抓取链已跑通
- compare table / metafields 合并已落地
- 主图 `12/12`
- 白名单第一轮已完成
- 白名单字段已打黄底
- review 表已导出

### 水滴/鼓轮

- 官网抓取链已跑通
- `type = baitcasting / drum` 已区分
- 主图 `41/41`
- 白名单第一轮已完成
- 白名单字段已打黄底
- review 表已导出

## 当前统一口径

### MAX DRAG

- 优先取官网直接展示的 `kg`
- 只有页面无 `kg` 时，才从 `lb` 换算

### 容线量

Abu 统一改成：

- `6/185 / 8/130 / 10/110`

不再保留官网原始：

- `185/6 / 130/8 / 110/10`

### 水滴/鼓轮 type

- `Low Profile Baitcast Reels` -> `baitcasting`
- `Round Baitcast Reels` -> `drum`

## 主图状态

### 纺车轮

- 本地目录：
  - `/Users/tommy/Pictures/images/abu_reels`
- 对账结果：
  - `12/12`

### 水滴/鼓轮

- 本地目录：
  - `/Users/tommy/Pictures/images/abu_reels`
- 对账结果：
  - `41/41`

## 白名单来源

主来源：

- 官网 `Description`
- 官网 `Features`

辅助来源：

- 少量 Tackle Warehouse / FishUSA / TackleDirect，用于玩家层表达补强

规则：

- 只用于玩家层 / 环境层 / 技术层归纳
- 不用于改写官网硬规格

## 当前判断

Abu reel 当前已经达到基线状态：

- 官网抓取可用
- 主图闭环
- 正式表可用
- review 表可用
- 白名单第一轮可用

当前不建议继续大面积补长尾字段。

## 下一步建议

如果继续 Abu，优先顺序是：

1. 人工验收式定点修正
2. 再决定是否补更深层白名单
3. 否则直接切下一个品牌 / 品类
