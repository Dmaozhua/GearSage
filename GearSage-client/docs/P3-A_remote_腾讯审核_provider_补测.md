# P3-A remote 腾讯审核 provider 补测

补测时间：2026-05-12  
测试环境：remote 正式服  
测试标记：`tencent-provider-1778591358424`

---

## 检查目标

只检查 remote 正式服为什么 `topic_title / topic_content` 的 `moderation_records.provider` 是 `system_bypass`，而不是 `tencent_text`。

本轮未改接口路径、未改返回结构、未扩审核后台、未改内容审核供应商。

---

## 代码条件

检查文件：

- `GearSage-api/src/modules/moderation/moderation.service.ts`
- `GearSage-api/src/modules/moderation/moderation.tencent.service.ts`

`system_bypass` 出现条件：

1. 文本为空：
   - `provider=system_bypass`
   - `riskReason=empty_content`
2. 腾讯审核 provider 未启用：
   - `provider=system_bypass`
   - `riskReason=tencent_provider_disabled`

腾讯文本审核启用条件：

- `MODERATION_ENABLED=true`
- `MODERATION_PROVIDER=tencent`
- `TENCENT_MODERATION_SECRET_ID` 有值
- `TENCENT_MODERATION_SECRET_KEY` 有值

满足上述条件后，`reviewText()` 会调用 `ModerationTencentService.reviewText()`，并写入：

- `provider=tencent_text`
- `result=pass/review/reject`
- 腾讯云 `requestId`

---

## remote 环境变量检查结果

服务器：`root@49.232.195.121`  
服务目录：`/srv/gearsage-api`

修复前检查结果：

| 变量 | 状态 |
| --- | --- |
| `MODERATION_ENABLED` | 缺失 |
| `MODERATION_PROVIDER` | 缺失 |
| `MODERATION_TEXT_REVIEW_ENABLED` | `true` |
| `TENCENT_MODERATION_SECRET_ID` | 缺失 |
| `TENCENT_MODERATION_SECRET_KEY` | 缺失 |
| `TENCENT_MODERATION_REGION` | 缺失 |
| `TENCENT_MODERATION_TEXT_BIZ_TYPE` | 缺失 |
| `TENCENT_MODERATION_IMAGE_BIZ_TYPE` | 缺失 |

判断：

- remote 之前是因为缺少 provider 开关和腾讯云密钥，`isTencentModerationEnabled()` 返回 `false`。
- 因此 `topic_title / topic_content` 会走 `system_bypass`，`riskReason=tencent_provider_disabled`。
- 这不是接口、后台或 topic 发布链路问题。

---

## 是否修改 .env

已修改，仅补齐腾讯审核相关环境变量。

来源：本地 `GearSage-api/.env` 中已存在的腾讯审核配置。

写入 remote 后检查结果：

| 变量 | 状态 |
| --- | --- |
| `MODERATION_ENABLED` | `true` |
| `MODERATION_PROVIDER` | `tencent` |
| `MODERATION_TEXT_REVIEW_ENABLED` | `true` |
| `TENCENT_MODERATION_SECRET_ID` | `<set>` |
| `TENCENT_MODERATION_SECRET_KEY` | `<set>` |
| `TENCENT_MODERATION_REGION` | `ap-guangzhou` |
| `TENCENT_MODERATION_TEXT_BIZ_TYPE` | 空值，当前代码使用内置 scene -> BizType 映射 |
| `TENCENT_MODERATION_IMAGE_BIZ_TYPE` | 空值，当前代码使用内置 scene -> BizType 映射 |

备份文件：

- `/srv/gearsage-api/.env.bak.tencent-provider-20260512210821`

---

## 是否 pm2 update-env

已执行：

```bash
cd /srv/gearsage-api
npm run build
pm2 restart gearsage-api --update-env
```

结果：

- `npm run build` 通过
- `pm2 restart gearsage-api --update-env` 成功
- pm2 进程：`gearsage-api`
- 重启后 pid：`3989301`
- 状态：`online`

健康检查：

| 接口 | 结果 |
| --- | --- |
| `GET https://api.gearsage.club/health` | HTTP 200，`code=0` |
| `GET https://api.gearsage.club/health/db` | HTTP 200，`code=0`，数据库 `gearsage`，用户 `gearsage_app` |

---

## 补测接口结果

测试账号：

| 类型 | 手机号 | 用户 ID |
| --- | --- | --- |
| 发帖用户 | `19967820731` | `32` |

发帖接口：

- `POST /mini/topic`

新测试帖：

| 字段 | 值 |
| --- | --- |
| topicId | `50` |
| 返回 status | `1` |
| publishTime | `null` |

说明：

- 腾讯云文本审核返回 `pass`。
- 因 `MODERATION_TEXT_REVIEW_ENABLED=true`，PASS 后仍按提审口径进入 `status=1` 待审核。

---

## moderation_records 证据

后台详情接口：

- `GET /admin/review/topics/50`

记录：

| record id | scene | provider | result | riskLevel | riskReason | requestId |
| --- | --- | --- | --- | --- | --- | --- |
| `198` | `topic_title` | `tencent_text` | `pass` | `Normal|score=0` | `label=Normal` | `6d573c9c-d035-42c8-88ed-50d62b6e5f7e` |
| `199` | `topic_content` | `tencent_text` | `pass` | `Normal|score=0` | `label=Normal` | `605fc389-9574-4090-8312-c107eb059f96` |

---

## 结论

remote 正式服**已真实启用腾讯云文本审核**。

修复前 `system_bypass` 原因：

- remote `.env` 缺少 `MODERATION_ENABLED=true`
- remote `.env` 缺少 `MODERATION_PROVIDER=tencent`
- remote `.env` 缺少 `TENCENT_MODERATION_SECRET_ID`
- remote `.env` 缺少 `TENCENT_MODERATION_SECRET_KEY`

修复后：

- 新发帖 `topicId=50`
- `topic_title` 已写入 `tencent_text/pass`
- `topic_content` 已写入 `tencent_text/pass`
- 两条记录均有腾讯云 `requestId`
- 发帖仍进入 `status=1` 待审核

是否阻断提审：**不阻断**。
