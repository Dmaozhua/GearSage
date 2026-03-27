---
name: gearsage-architect-skill
description: Use this skill when the task is about GearSage architecture, migration stage judgment, backend/frontend/admin change boundaries, implementation planning, or avoiding accidental contract drift. Do not use it for pure copywriting or small isolated code edits that already have a fully specified target file and no cross-document impact.
---

# GearSage Architect Skill

## Purpose

Keep Codex aligned with the real GearSage migration path before any meaningful code or doc change.

This skill is for tasks where Codex needs to understand **what stage the task belongs to**, **which docs are authoritative**, and **what must not be changed casually**.

Use this skill before implementation when the request may affect:

- migration stage scope (P0 / P1 / P2 / P3 / P3-A)
- API contracts
- backend module boundaries
- admin/review backend scope
- moderation flow
- environment variables
- deployment or smoke test expectations
- frontend/backend handoff

Do not use this skill for:

- tiny style-only edits in one file
- obvious typo fixes
- single-file UI polish with no contract impact
- pure prose generation unrelated to repository behavior

---

## Mandatory project truths

Assume the following unless the user explicitly overrides them with newer repo evidence:

- GearSage is not a generic social community; it is a trustable gear-experience system.
- The active backend direction is independent backend architecture, not cloud-function-first design.
- Default backend stack is Node.js + NestJS + PostgreSQL + Nginx + PM2.
- During migration, compatibility and stability beat cosmetic refactors.
- Do not casually change table names, endpoint names, enum meanings, or response envelopes.
- Meaningful implementation changes should also update the relevant docs.

---

## Authoritative reading order

Before planning or coding, read the minimum relevant docs in this order.

### Always read first

1. `AGENTS.md`
2. `独立后台迁移计划_施工记录版.md`
3. `GearSage_后端架构设计文档.md`

### Then choose by task type

#### If task is about interface switching or frontend/backend linkage

Read:

- `小程序页面切接口清单.md`
- `小程序api.md`

#### If task is about database or fields

Read:

- `数据库说明.md`

#### If task is about verification or regression range

Read:

- `P2 本地 smoke test 清单.md`
- related acceptance checklist if the task clearly belongs to P0 or P1

#### If task is about moderation / review / compliance / WeChat submission prep

Read:

- `P3-A 微信审核准备任务单.md`
- `内容审核接入方案.md`
- `审核后台 v0 方案.md`
- `正式短信接入最小改造面.md`

---

## Stage judgment rules

Classify the task before acting.

### P0 / P1 tendencies

Use when the task concerns:

- basic server availability
- health check
- core auth/login base path
- core topic/comment/user migration
- minimal end-to-end backend replacement

### P2 tendencies

Use when the task concerns:

- local compatibility cleanup
- frontend page switching to new API
- data shape normalization
- local smoke-test driven bug fixing

### P3 tendencies

Use when the task concerns:

- background/admin capability
- ops completion
- production hardening
- non-review backend improvements

### P3-A tendencies

Use when the task concerns:

- moderation
- audit state flow
- review backend
- SMS capability needed for platform requirements
- WeChat review preparation and compliance gaps

If the task spans stages, state that clearly and keep the implementation scoped to the primary stage.

---

## Required output shape

When this skill is used, produce this structure before coding if the task is non-trivial:

### 1) Task classification

- Primary stage:
- Task type:
- Affected sides: backend / mini-program / admin / docs / ops

### 2) Source of truth

List the exact files you used.

### 3) Change boundary

State clearly:

- what is allowed to change
- what must remain stable
- what is out of scope

### 4) Implementation approach

Give a short, ordered plan.

### 5) Verification

List the minimum build/test/smoke-check path required.

Keep this short and concrete.

---

## Hard constraints

Do not do any of the following unless the task explicitly requires it and you explain the impact:

- change response envelope format
- rename active `/mini/*` endpoints casually
- refactor unrelated modules for style
- invent a broader architecture than current stage needs
- move a v0 admin/review task into a full RBAC platform build
- delete fields or tables because they "look unused"
- claim completion without verification

---

## Good behavior examples

### Good

- Identify that a comment moderation change is a P3-A task.
- Read moderation docs before touching code.
- Keep route names stable.
- Update the matching task doc after behavior changes.
- Produce a narrow regression checklist.

### Bad

- Treat a moderation task like a generic CRUD task.
- Change frontend field names for neatness.
- Skip reading the current施工记录 and rely on older assumptions.
- Expand a tiny review requirement into a generalized platform redesign.

---

## Final reminder

Before coding, ask internally:

1. Which stage owns this task?
2. Which document is the source of truth?
3. What working behavior must stay stable?
4. What is the smallest correct change?

If you cannot answer these, read more before editing.
