# AGENTS.md

## Purpose

This file defines the default rules for working on GearSage.

When requirements are incomplete or multiple implementation paths are possible, follow this file first.
Do not default to generic community-product patterns.
Do not optimize for speed by violating product identity, trust, or existing migration constraints.

---

## Product Principles

### North Star

GearSage is not a generic content community.
GearSage is a trustable experience system for lure anglers to make better gear decisions.

Core goal:

**Use real, long-term, experience-based knowledge to help lure anglers make better gear decisions.**

### What every feature should strengthen

Prefer features that improve at least one of these:

1. content credibility
2. decision usefulness
3. knowledge accumulation
4. gear comparison clarity

If a feature mainly increases noise, vanity, shallow engagement, or decorative complexity, it is likely off-direction.

### Non-negotiable product rules

- Never sacrifice credibility for activity metrics.
- Never turn GearSage into a shallow show-off space.
- Never flatten lure culture into a generic forum template.
- Never let structured posting feel like cold form-filling.
- Never sacrifice readability for visual style.
- Never let gamification overpower trust and usefulness.
- Never optimize for short-term excitement at the cost of long-term trust.

### Product feel

GearSage should feel:

- restrained
- trustworthy
- experience-driven
- outdoors-informed
- readable
- textured but not flashy
- premium but not luxurious
- expressive but not noisy

Avoid making the product feel like:

- a generic social feed
- a mobile game reward screen
- an e-commerce promotion page
- an NFT badge wall
- an overdesigned UI showcase
- a noisy engagement machine

### Visual boundaries

Prefer:

- low to medium saturation
- natural / water / stone / metal / mist / charcoal / dark green / gray-blue tones
- stable hierarchy
- calm spacing
- high readability
- subtle tags, badges, and icons

Avoid:

- neon-heavy palettes
- exaggerated glow
- fantasy-loot rarity effects
- excessive animation
- modules competing for attention
- decorative elements that weaken reading or judgment

### Implementation trade-off rules

When trade-offs happen, choose in this order:

1. credibility over excitement
2. readability over visual cleverness
3. durability over trendiness
4. GearSage-specific identity over generic community conventions
5. authentic expression over engagement tricks
6. decision usefulness over content volume
7. long-term trust over short-term metrics

---

## Engineering Rules

### Current architecture direction

GearSage is in the middle/late stage of migration from WeChat cloud-oriented implementation to an independent backend architecture.

Default backend direction:

- Node.js
- NestJS
- PostgreSQL
- Nginx
- PM2

Do not introduce a conflicting architecture unless the user explicitly asks for it.

### Migration baseline

The current project direction is based on the migration work already established in historical project documents and conversations.

General constraints:

- keep the independent backend direction stable
- do not reintroduce cloud-only assumptions into core business logic
- do not couple new server logic to legacy cloud function patterns unless compatibility is explicitly required
- prefer standard HTTPS API design and independent service boundaries
- maintain consistency with the existing migration plan and implementation status

### API rules

Unless explicitly requested otherwise:

- prefer consistent REST-style endpoints
- keep response structure consistent within the active backend standard
- do not silently invent a new response envelope format
- do not rename request or response fields casually
- do not break the mini-program side contract without clearly marking required frontend changes
- preserve compatibility where practical during ongoing migration

If changing an interface, also evaluate:

- affected mini-program pages
- affected DTO / validation logic
- affected database fields
- affected existing migration documents
- whether the change creates unnecessary rework

### Database rules

- PostgreSQL is the default database baseline.
- Do not casually rename core tables or fields that are already part of the migration path.
- Prefer additive migration over destructive change.
- Prefer explicit, readable schema changes.
- Do not assume old data quality is perfect.
- Keep business fields understandable and aligned with product meaning.
- Avoid over-normalization that makes product iteration harder.
- Avoid schema changes that break current API rollout unless clearly justified.

### Backend coding rules

- Prefer clear module boundaries.
- Keep controller / service / DTO responsibilities separated.
- Use validation for request data.
- Do not hide business rules inside random utility files.
- Prefer explicit error handling over silent fallback.
- Add logs where they help diagnose migration, integration, moderation, upload, auth, or external service failures.
- Do not introduce unnecessary abstractions for a still-evolving product.

### Frontend / mini-program migration rules

- Do not assume a page can be changed independently from its API mapping.
- Check whether a page is already part of the “切接口” scope before changing request contracts.
- Minimize frontend-breaking changes.
- Prefer completing real migration chains over temporary visual-only patches.
- Do not leave mixed old/new logic in a half-migrated state without comments.

### Moderation / compliance related rules

Because GearSage contains user-generated content:

- treat text/image moderation as a first-class requirement
- do not bypass moderation-related fields, states, or review logic casually
- do not remove auditability-related fields without explicit approval
- prefer implementation paths compatible with content review, SMS, and WeChat/platform compliance preparation

---

## Workflow Rules

### Read before changing

Before making major implementation decisions, first check the relevant project documents if they exist in the repo or workspace.

High-priority reference documents include:

- `独立后台迁移计划.md`
- `独立后台迁移计划_施工记录版.md`
- `GearSage_后端架构设计文档.md`
- `小程序api.md`
- `小程序页面切接口清单.md`
- `数据库说明.md`
- `装备库迁移拆分方案.md`
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

Use the most recent execution-oriented document as source of truth when planning implementation details.
If two documents conflict, prefer the newer construction record /施工记录 /验收口径 over the older planning description, unless explicitly told otherwise.

### Change discipline

Before changing code:

1. understand the current implementation
2. identify which document or migration stage the change belongs to
3. avoid unrelated refactors
4. preserve working paths unless the task explicitly requires restructuring

### Scope control

Default to small, grounded, production-relevant changes.

Do not:

- refactor unrelated modules for style only
- rename files / tables / fields without strong reason
- introduce broad framework changes casually
- optimize prematurely
- replace a stable approach with a fashionable one just because it is newer

### Documentation discipline

If implementation changes project behavior in a meaningful way, also update the relevant documentation when appropriate, especially when affecting:

- API contracts
- migration stage completion
- rollout steps
- moderation flow
- environment variables
- deployment procedures
- smoke test expectations

### Verification discipline

After making meaningful changes, verify as much as practical for the task type:

- build success
- lint/typecheck if configured
- affected endpoint behavior
- DTO validation
- database query assumptions
- migration compatibility
- smoke-test path if relevant

Do not claim something is completed if it has not been verified.

### Communication style inside generated output

When writing code comments, docs, or implementation notes:

- be concrete
- be minimal
- be readable
- avoid buzzwords
- avoid pretending uncertain things are confirmed

---

## Directory Notes

### Repository root

This root `AGENTS.md` defines the project-wide default rules.

### Subdirectory rules

If the repo later contains clearly separated areas with different constraints, add nested `AGENTS.md` files only where necessary, for example:

- backend service directory
- mini-program frontend directory
- admin/review backend directory
- scripts / deployment directory

Use nested `AGENTS.md` only to add local constraints, not to contradict the root philosophy.

### Current default

Unless a deeper directory contains its own `AGENTS.md`, apply this root file to all work in the repository.

---

## Practical Default

When uncertain, default to:

- simpler
- calmer
- more readable
- more trustworthy
- more compatible with the migration path
- less noisy
- less vain
- more grounded in actual lure angling experience

## One-line reminder

**Do not build GearSage like a generic content community. Build it like a trustable experience system for gear decisions.**

## Skills preference

This repository contains GearSage-specific skills under `.agents/skills`.

When a task matches one of these workflows, prefer using the matching skill before broad freeform reasoning:

- `gearsage-architect-skill`: for stage judgment, architecture boundary, migration-aware implementation planning
- `gearsage-doc-router-skill`: for deciding which docs are authoritative, which docs to read, and which docs to update
- `gearsage-smoke-test-skill`: for generating the smallest correct regression path after a change

Do not force these skills for trivial single-file edits.
Use them when the task spans docs, contracts, migration stages, verification scope, or multiple modules.
