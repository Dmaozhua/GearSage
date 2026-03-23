# miniApi 云函数

统一入口：

```json
{
  "action": "topic.all",
  "payload": {}
}
```

返回结构：

```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

> 注意：该实现使用 OPENID 作为身份来源，不再依赖 Sa-Token。
