# AGENTS.md

This file defines backend-specific rules for the GearSage API service.

It inherits the repository root `AGENTS.md`.
Do not contradict the root product philosophy.
This file only adds stricter local rules for backend implementation.

---

## Service Scope

This directory contains the independent backend service for GearSage.

Default stack and direction:

- Node.js
- NestJS
- PostgreSQL
- Nginx
- PM2

The backend is part of the migration away from cloud-oriented logic toward an independent API architecture.
Do not reintroduce cloud-function-style assumptions into the core backend unless compatibility is explicitly required.

---

## Architecture Rules

### Module boundaries

Prefer clear NestJS module boundaries.

Keep responsibilities separated:

- **Controller**: request entry, param parsing, DTO binding, auth guards, response handoff
- **Service**: business logic, orchestration, rule enforcement
- **DTO**: request validation and input shape definition
- **Repository / data access layer**: SQL / persistence concerns
- **Utils**: only pure reusable helpers, never hidden business logic

Do not:
- put business logic directly in controllers
- hide important rules inside helper functions with vague names
- mix validation, query construction, and business decisions in one large method
- create deep abstraction layers without a real reuse need

### File and module growth

When a module grows, prefer splitting by business meaning, not by arbitrary technical fashion.

Prefer:
- `topic`
- `comment`
- `user`
- `auth`
- `upload`
- `moderation`
- `gear`
- `task`
- `shop`
- `tag`

Avoid:
- giant “common service” files
- “misc” or “helper” dumping grounds
- premature microservice decomposition

### Business-first structure

Structure code around business capability and migration reality, not abstract purity.

When deciding where code belongs, ask:
- which business domain owns this rule?
- which API path uses it?
- which migration task or rollout stage does it belong to?
- does this change reduce or increase future migration confusion?

---

## API Rules

### Endpoint style

Unless the task explicitly requires otherwise:

- prefer REST-style API design
- keep route naming stable and readable
- use nouns / resource-oriented paths when practical
- avoid inventing inconsistent action names casually

Examples of preferred tendencies:
- `/mini/topic/...`
- `/mini/comment/...`
- `/mini/user/...`

Do not rename active endpoints casually during migration.

### Response format

Keep response envelope consistent with the active backend standard already being used in migration.

Rules:
- do not silently create a second response standard
- do not mix multiple response envelope styles in the same service without a very clear reason
- do not break existing frontend expectations casually

If a format change is required:
- identify impacted pages
- identify impacted clients
- identify impacted docs
- update related docs if the change is intentional

### Backward compatibility

During migration, prioritize compatibility where practical.

Do not:
- rename fields for cosmetic reasons
- change enum meanings silently
- remove old-compatible behavior unless explicitly asked
- break mini-program request/response assumptions without noting it

### Error handling

Errors must be explicit and diagnosable.

Prefer:
- meaningful HTTP status codes
- readable business error messages
- stable error structures
- logging for integration failures

Avoid:
- swallowing errors
- returning fake success
- hiding infrastructure failures behind silent fallback
- unclear `"系统错误"` style messages without logs

---

## DTO and Validation Rules

### DTO discipline

All non-trivial request input should use DTOs and validation.

Prefer:
- explicit DTO classes
- class-validator rules
- required vs optional fields made clear
- business constraints reflected in validation where reasonable

Do not:
- accept unvalidated free-form payloads for important endpoints
- duplicate request shape definitions across multiple places without reason
- move validation logic into random controller code

### Validation philosophy

Validation should protect business quality, not create unnecessary friction.

Prefer:
- validating shape, type, range, enum, and required fields
- mode-specific validation when different post types require different rules
- clear failure messages where useful

Avoid:
- over-validating harmless inputs
- forcing fields that are not truly needed
- mixing product rules and formatting hacks into DTOs

---

## Database Rules

### PostgreSQL baseline

PostgreSQL is the default persistence baseline.
Assume SQL is first-class, readable, and acceptable.

Do not force ORM-heavy patterns if they reduce clarity.

### Schema change rules

Prefer additive change over destructive change.

Do:
- add fields carefully
- preserve migration continuity
- keep table/field naming readable
- align schema with business meaning
- check whether existing docs already define the field/table

Do not:
- casually rename tables already used in migration
- delete fields just because they look unused
- perform destructive schema changes without clear justification
- introduce hidden coupling between unrelated tables

### Query rules

Prefer queries that are:
- readable
- explainable
- scoped to real business needs
- efficient enough for the current product stage

Do not:
- over-engineer query layers
- hide important SQL in too many wrappers
- create N+1 problems casually
- write unreadable “smart” query builders when plain SQL is clearer

### Data semantics

Business fields must remain understandable.

Examples:
- status fields must have clear lifecycle meaning
- moderation fields must reflect review logic clearly
- counters must have clear source and update rules
- user-facing labels must not be confused with internal flags

Do not allow field meaning to drift silently over time.

---

## Auth, Upload, Moderation, and Compliance Rules

### Auth

Auth-related code must remain explicit and traceable.

Prefer:
- clear token handling
- explicit auth guards / middleware
- stable user identity flow
- readable login/refresh/logout logic

Do not:
- scatter auth assumptions across random modules
- hardcode user identity shortcuts in business logic
- bypass auth logic for convenience in production paths

### Upload

Upload flows must be treated as production-critical.

Rules:
- keep file handling explicit
- validate upload assumptions
- preserve URL/storage field meaning
- do not mix temporary compatibility logic with final logic without comments

### Moderation

Moderation is not optional decoration.
It is part of the core platform viability.

Rules:
- preserve moderation-related status fields and flow meaning
- do not bypass content review logic casually
- keep text/image moderation paths auditable
- maintain compatibility with the broader compliance preparation direction

### SMS / external integrations

For SMS, moderation provider, or other external integrations:

- keep env-driven configuration explicit
- fail clearly when config is missing
- log integration failures with enough context
- do not hardcode secrets
- do not silently degrade important business flows without notice

---

## Logging and Observability Rules

### Logging

Add logs where they help diagnose real system issues, especially in:

- auth
- uploads
- moderation
- SMS
- external providers
- database failures
- migration-sensitive endpoints
- deployment/startup failures

Logs should be:
- concise
- meaningful
- tied to business context
- safe for production

Avoid:
- noisy debug spam
- useless “entered function” logs everywhere
- leaking secrets, tokens, or sensitive personal data

### Health and operability

Prefer keeping operational basics intact:

- health endpoints should stay simple and reliable
- startup failure should be obvious
- environment dependency failure should be visible
- deployment expectations should remain clear

Do not complicate health checks unnecessarily.

---

## Change Workflow

### Read before editing

Before making backend changes, check the relevant docs when available, especially:

- `独立后台迁移计划_施工记录版.md`
- `独立后台迁移计划.md`
- `GearSage_后端架构设计文档.md`
- `数据库说明.md`
- `小程序api.md`
- `小程序页面切接口清单.md`
- `P0 完成验收清单.md`
- `P1 完成验收清单.md`
- `P1 施工任务单.md`
- `P2 本地施工任务单.md`
- `P2 cloud 兼容清理建议.md`
- `P2 本地 smoke test 清单.md`
- `P3 施工任务单.md`
- `P3-A 微信审核准备任务单.md`
- `正式短信接入最小改造面.md`
- `内容审核接入方案.md`
- `审核后台 v0 方案.md`

If documents conflict:
- prefer newer execution-oriented docs
- prefer施工记录 / 验收口径 over older planning text
- do not invent a third direction casually

### Scope control

Default to focused changes.

Do not:
- refactor unrelated modules because “now is a good time”
- rewrite stable code without migration value
- change API shape and DB shape together unless needed
- bundle many unrelated fixes into one patch

### Comment discipline

Comments should explain:
- non-obvious business rules
- migration compatibility logic
- temporary compatibility code
- external integration assumptions

Do not write comments that only restate the code.

### Documentation discipline

If backend behavior meaningfully changes, update docs when appropriate, especially if affecting:

- API contract
- env variables
- deployment steps
- migration completion status
- moderation flow
- smoke test expectations

---

## Verification Rules

After meaningful backend changes, verify as much as practical:

- project builds successfully
- affected module compiles
- validation still works
- endpoints still match expected contract
- SQL assumptions still hold
- migration compatibility still holds
- health path still makes sense
- relevant smoke path is not obviously broken

Do not claim completion without verification.

If unable to verify something, say so explicitly.

---

## Local Directory Notes

If this backend directory later becomes large, nested `AGENTS.md` files may be added for:

- `src/modules/auth`
- `src/modules/moderation`
- `src/modules/upload`
- `src/modules/gear`
- `scripts`
- `deploy`

Use nested files only when a sub-area has real local constraints.
Do not create many nested instruction files without need.

---

## Practical Default

When uncertain, choose:

- explicit over implicit
- simple over clever
- compatible over disruptive
- readable over abstract
- business clarity over framework purity
- migration continuity over fresh redesign

## Reminder

**This backend is not just an API server. It is part of GearSage’s trust, migration, and compliance foundation.**