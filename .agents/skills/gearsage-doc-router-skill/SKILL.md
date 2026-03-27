---
name: gearsage-doc-router-skill
description: Use this skill when a GearSage task depends on multiple markdown docs and Codex needs to decide which document is authoritative, which documents must be read, and which docs must be updated after the change. Do not use it for tasks that are fully specified by a single file and do not affect project behavior.
---

# GearSage Doc Router Skill

## Purpose

Route GearSage tasks to the correct documentation set so Codex does not rely on stale or incomplete context.

This skill is especially useful because GearSage has:

- architecture docs
- migration plans
- construction task docs
- acceptance checklists
- interface-switch lists
- moderation/review plans
- smoke-test docs

The goal is to answer three questions fast:

1. Which docs must be read now?
2. Which doc wins if two docs differ?
3. Which docs must be updated after the task?

---

## Core routing principle

Prefer the most execution-near, latest operational document over older strategic documents.

Default priority when docs overlap:

1. `AGENTS.md`
2. latest execution reality
   - `独立后台迁移计划_施工记录版.md`
3. current stage task doc
   - for example `P3-A 微信审核准备任务单.md`
4. architecture / API / DB reference docs
5. older planning docs
   - for example `独立后台迁移计划.md`

If two docs conflict, do not silently blend them. State the conflict and follow the higher-priority one unless the user explicitly says otherwise.

---

## Document map

### Global behavioral constraints

Read when the task changes code, docs, or structure:

- `AGENTS.md`

### Migration reality and stage truth

Read for almost all substantial tasks:

- `独立后台迁移计划_施工记录版.md`

### Older planning context

Read only when historical intent is useful or when current execution doc is missing detail:

- `独立后台迁移计划.md`

### Backend structure and implementation boundary

Read for backend, data flow, deployment, or module design tasks:

- `GearSage_后端架构设计文档.md`

### API contract and frontend switching

Read for endpoint, request/response, or page linkage tasks:

- `小程序api.md`
- `小程序页面切接口清单.md`

### Database truth

Read for field, table, query, migration, or schema tasks:

- `数据库说明.md`

### Stage execution docs

Read according to task stage:

- `P1 施工任务单.md`
- `P2 本地施工任务单.md`
- `P3 施工任务单.md`
- `P3-A 微信审核准备任务单.md`

### Acceptance / done criteria

Read when checking completion or regression obligations:

- `P0 完成验收清单.md`
- `P1 完成验收清单.md`

### Smoke test route

Read when verifying behavior or planning a narrow regression path:

- `P2 本地 smoke test 清单.md`

### Compliance and review domain docs

Read when task involves moderation, review backend, or submission prep:

- `内容审核接入方案.md`
- `审核后台 v0 方案.md`
- `正式短信接入最小改造面.md`

### Gear library domain doc

Read when task involves gear library migration or split strategy:

- `装备库迁移拆分方案.md`

---

## Routing workflow

For each non-trivial task, perform this routing workflow.

### Step 1: classify task intent

Choose one or more:

- architecture
- api contract
- page switch
- database
- moderation/compliance
- admin/review backend
- smoke test / regression
- deployment / ops
- gear-library data
- historical plan lookup

### Step 2: pick minimal read set

Do not read every file by default. Read the smallest authoritative set.

Minimum baseline for most tasks:

- `AGENTS.md`
- `独立后台迁移计划_施工记录版.md`
- one or more domain docs based on task intent

### Step 3: resolve priority

If docs disagree, explicitly write:

- conflict found
- which doc wins
- why

### Step 4: determine doc write-back obligations

After the implementation plan is clear, identify which docs need updates.

Common write-back rules:

- behavior change -> update the matching task doc
- API change -> update API doc and page switch doc if relevant
- DB field/table change -> update DB doc
- moderation flow change -> update moderation/review docs
- rollout/testing change -> update smoke test or checklist if relevant

---

## Required output format

When this skill is invoked, respond in this structure before coding if needed:

### Required reads

- file A: why
- file B: why
- file C: why

### Priority decision

- source of truth:
- lower-priority references:
- known conflicts:

### Write-back targets

- file X
- file Y

### Safe next action

One short paragraph on what to do next.

---

## Hard rules

- Do not treat older planning docs as equal to current施工记录 when they conflict.
- Do not skip `AGENTS.md` for meaningful work.
- Do not update docs mechanically; only update the docs truly affected.
- Do not claim a doc is authoritative unless you actually read it.
- Do not read the whole repo when a 3-file read set is enough.

---

## Example use cases

### Example 1: “Add moderation status to comment flow”

Read:

- `AGENTS.md`
- `独立后台迁移计划_施工记录版.md`
- `P3-A 微信审核准备任务单.md`
- `内容审核接入方案.md`
- `数据库说明.md`
- maybe `小程序api.md` if response shape changes

Write back likely needed:

- `P3-A 微信审核准备任务单.md`
- `数据库说明.md` if schema changed

### Example 2: “Fix topic detail page after interface switch”

Read:

- `AGENTS.md`
- `独立后台迁移计划_施工记录版.md`
- `小程序页面切接口清单.md`
- `小程序api.md`
- `P2 本地 smoke test 清单.md`

Write back likely needed:

- page switch doc if mapping changed
- smoke test doc only if verification path changes meaningfully
