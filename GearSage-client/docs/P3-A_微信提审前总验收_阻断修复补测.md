# P3-A 微信提审前总验收_阻断修复补测

补测时间：2026-05-12  
测试环境：remote 正式服  
测试标记：`block-fix-1778590967148`

---

## 修复前阻断原因

`remote` 正式服中，用户调用 `POST /mini/topic` 发起求推荐后返回 `status=2`，不是提审口径要求的 `status=1` 待审核。

本地代码确认：

- `combinedDecision.result === 'REVIEW'` -> `topic.status = 1`
- `combinedDecision.result === 'PASS' && MODERATION_TEXT_REVIEW_ENABLED=true` -> `topic.status = 1`
- 否则 -> `topic.status = 2`

因此阻断点判断为 remote 环境缺少 `MODERATION_TEXT_REVIEW_ENABLED=true` 或 pm2 未带新环境重启。

---

## remote 环境变量检查结果

服务器：`root@49.232.195.121`  
服务目录：`/srv/gearsage-api`

检查结果：

- 修复前：`.env` 中缺少 `MODERATION_TEXT_REVIEW_ENABLED`
- 修复后：`.env` 第 17 行为 `MODERATION_TEXT_REVIEW_ENABLED=true`

---

## 是否修改 .env

已修改。

- 修改方式：追加 `MODERATION_TEXT_REVIEW_ENABLED=true`
- 备份文件：`/srv/gearsage-api/.env.bak.pre-submit-gate-20260512210007`
- 未修改接口路径、返回结构、后台范围、短信逻辑、首页 UI、装备库或内容审核供应商。

---

## 是否 pm2 update-env

已执行。

执行流程：

```bash
cd /srv/gearsage-api
npm run build
pm2 restart gearsage-api --update-env
```

结果：

- `npm run build` 通过
- `pm2 restart gearsage-api --update-env` 成功
- pm2 进程：`gearsage-api`
- 重启后状态：`online`
- 重启后 pid：`3987191`

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
| 作者账号 | `19967820651` | `30` |
| 非作者账号 | `19867820652` | `31` |

### 1. 发帖进入待审核

接口：`POST /mini/topic`

结果：

- 新测试帖 ID：`47`
- 返回：`status=1`
- `publishTime=null`
- `GET /mini/topic/mine?status=1`：作者可见该帖
- 非作者 `GET /mini/topic?topicId=47`：返回 `code=404`
- `GET /mini/topic/all?limit=50`：不包含该帖

### 2. 后台通过后公开展示

接口：`POST /admin/review/topics/47/pass`

结果：

- 返回：`status=2`
- `publishTime=2026-05-12T13:02:47.979Z`
- 非作者 `GET /mini/topic?topicId=47`：可见，`status=2`
- `GET /mini/topic/all?limit=50`：包含该帖

### 3. 待审核不可评论 / 不可点赞

接口：`POST /mini/topic`

结果：

- 新测试帖 ID：`48`
- 返回：`status=1`
- 非作者 `PUT /mini/comment`：HTTP 403
- 非作者 `POST /mini/topic/like`：HTTP 403

### 4. 后台驳回后不公开展示

接口：`POST /mini/topic`

结果：

- 新测试帖 ID：`49`
- 初始返回：`status=1`

接口：`POST /admin/review/topics/49/reject`

结果：

- 返回：`status=0`
- 非作者 `GET /mini/topic?topicId=49`：返回 `code=404`
- 作者 `GET /mini/topic/mine?status=0`：可见该帖
- 作者侧记录：`status=0`
- 驳回原因：`阻断修复驳回 block-fix-1778590967148`

---

## 新测试帖 ID

| 用途 | topicId | 最终状态 |
| --- | --- | --- |
| 通过闭环 | `47` | `status=2`，公开可见 |
| 待审核互动拦截 | `48` | `status=1`，待审核 |
| 驳回闭环 | `49` | `status=0`，回草稿 / 未通过 |

---

## moderation_records 证据

后台详情接口：`GET /admin/review/topics/:id`

| topicId | record id | scene | provider | result | riskLevel |
| --- | --- | --- | --- | --- | --- |
| `47` | `192` | `topic_title` | `system_bypass` | `pass` | `bypass` |
| `47` | `193` | `topic_content` | `system_bypass` | `pass` | `bypass` |
| `48` | `194` | `topic_title` | `system_bypass` | `pass` | `bypass` |
| `48` | `195` | `topic_content` | `system_bypass` | `pass` | `bypass` |
| `49` | `196` | `topic_title` | `system_bypass` | `pass` | `bypass` |
| `49` | `197` | `topic_content` | `system_bypass` | `pass` | `bypass` |

说明：本次只修复“PASS 后进入待审核”的人工审核开关。remote 当前审核 provider 返回为既有 `system_bypass/pass`，未在本轮改动审核供应商或审核逻辑。

---

## admin_operation_logs 证据

接口：`GET /admin/logs?limit=100`

| log id | targetType | targetId | action | remark |
| --- | --- | --- | --- | --- |
| `49` | `topic` | `47` | `topic_pass` | `阻断修复通过 block-fix-1778590967148` |
| `50` | `topic` | `49` | `topic_reject` | `阻断修复驳回 block-fix-1778590967148` |

---

## 结论：是否解除阻断

**解除阻断。**

remote 正式服已补齐 `MODERATION_TEXT_REVIEW_ENABLED=true` 并通过 `pm2 restart gearsage-api --update-env` 生效。补测确认：

- 发帖 PASS 后进入 `status=1` 待审核
- 作者可在 `mine?status=1` 看到待审核帖
- 非作者不可见待审核帖
- 首页公开列表不出现待审核帖
- 后台通过后进入 `status=2` 并公开可见
- 待审核帖不可评论、不可点赞
- 后台驳回后回到 `status=0`，非作者不公开，作者草稿 / 未通过链路可见
- `moderation_records` 与 `admin_operation_logs` 均有证据
