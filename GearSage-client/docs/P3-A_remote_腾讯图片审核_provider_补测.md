# P3-A remote 腾讯图片审核 provider 补测

补测时间：2026-05-12  
测试环境：remote 正式服  
测试标记：`image-provider-1778591706576`

---

## 测试目标

确认 remote 正式服图片审核走 `tencent_image`，不是 `system_bypass`。

本轮未改功能、未改接口、未扩后台、未改审核供应商。

---

## 测试图片

使用项目内正常尺寸图片：

- 文件：`GearSage-client/images/logo/2.png`
- 尺寸：`696 x 556`
- 类型：PNG
- 大小：约 `11K`

未使用 1x1 PNG。

---

## 上传结果

测试账号：

| 类型 | 值 |
| --- | --- |
| 手机号 | `19967820742` |
| 用户 ID | `33` |

| 场景 | 接口 | objectKey | 返回 URL |
| --- | --- | --- | --- |
| 发帖图 | `POST /upload/image` | `topic/1778591707214-g1vgao2g.png` | `https://static.gearsage.club/gearsage/topic/1778591707214-g1vgao2g.png` |
| 头像图 | `POST /upload/avatar` | `avatar/1778591708188-p582pfl0.png` | `https://static.gearsage.club/gearsage/avatar/1778591708188-p582pfl0.png` |
| 背景图 | `POST /upload/background` | `background/1778591708825-0ovn49i7.png` | `https://static.gearsage.club/gearsage/background/1778591708825-0ovn49i7.png` |

---

## 只读 SQL 证据

证据来源：

- `media_assets`
- `moderation_records`

查询口径：

- 通过上传返回的 `objectKey` 定位 `media_assets`
- 通过 `moderation_records.targetType = 'media_asset'`
- 通过 `moderation_records.targetId = media_assets.id::text`

| assetId | bizType | scene | provider | result | riskLevel | requestId |
| --- | --- | --- | --- | --- | --- | --- |
| `53` | `topic` | `topic_image` | `tencent_image` | `pass` | `Normal|score=0` | `3b49d6d0-9882-4570-b8b9-32c4b617efae` |
| `54` | `avatar` | `avatar_image` | `tencent_image` | `pass` | `Normal|score=0` | `a4bae2b7-0ddc-4050-add4-ef623aad5ee4` |
| `55` | `background` | `background_image` | `tencent_image` | `pass` | `Normal|score=0` | `1d2cdf48-7e1a-4116-b884-27f348ff2608` |

`media_assets` 同步字段：

| assetId | moderationStatus | moderationProvider | moderationRiskLevel |
| --- | --- | --- | --- |
| `53` | `pass` | `tencent_image` | `Normal|score=0` |
| `54` | `pass` | `tencent_image` | `Normal|score=0` |
| `55` | `pass` | `tencent_image` | `Normal|score=0` |

---

## 结论

- `topic_image` 是否 `tencent_image/pass`：**是**
- `avatar_image` 是否 `tencent_image/pass`：**是**
- `background_image` 是否 `tencent_image/pass`：**是**
- 是否阻断提审：**不阻断**
