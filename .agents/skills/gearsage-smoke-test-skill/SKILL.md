---
name: gearsage-smoke-test-skill
description: Use this skill after a GearSage code or contract change to generate the smallest correct verification path, including build checks, affected API checks, and manual page regression steps. Do not use it as a full QA test-plan generator for unrelated future features.
---

# GearSage Smoke Test Skill

## Purpose

Turn a GearSage change into a **small, realistic regression plan**.

This skill exists to stop two common failures:

1. testing too little and missing breakage
2. testing everything and wasting time

It should generate the minimum verification route that matches the actual changed area.

---

## Inputs this skill expects

This skill works best when Codex already knows:

- which files changed
- which endpoints changed
- whether the task is backend-only, frontend-only, or linked
- whether database fields or moderation states changed

If that context is not yet clear, infer it from the task and changed files before producing the test list.

---

## Mandatory references

Read these when relevant:

### Default first

- `AGENTS.md`
- `P2 本地 smoke test 清单.md`

### Add as needed

- `小程序页面切接口清单.md` for page ↔ API mapping
- `小程序api.md` for request/response expectations
- `数据库说明.md` if data fields changed
- current stage task doc if the behavior is stage-specific

---

## Testing philosophy

Prefer a layered route:

1. **Static confidence**: build / type / lint if configured and relevant
2. **Targeted API verification**: only impacted endpoints
3. **Manual page verification**: only impacted pages and direct dependency pages
4. **Risk-based extras**: auth, status flow, upload, moderation, cache, edge cases only if the change touches them

Do not generate a giant generic checklist.

---

## Output structure

When this skill is invoked, produce the following sections.

### 1) Change summary

- task area:
- changed side: backend / mini-program / admin / docs only
- risk level: low / medium / high

### 2) Must-run checks

Keep these command-level and short. Examples:

- build
- typecheck
- targeted unit test if it exists
- start app / verify health if needed

Only include checks that fit the repo reality.

### 3) Affected API checks

List only impacted endpoints, with the exact behavior to confirm.

For each endpoint, describe:

- request focus
- expected success shape
- expected edge case or failure if relevant

### 4) Manual page path

List the shortest user flow to verify in the mini-program or admin UI.

Format each as:

- entry page
- action
- expected visible result

### 5) Regression neighbors

List nearby areas worth a quick check because they are commonly coupled.

Examples:

- login state after auth change
- counts and badges after comment change
- moderation status display after audit change
- image rendering after upload change

### 6) Done when

State the concrete completion condition in one short block.

---

## Risk rules

### Low risk

Use for:

- copy changes
- tiny UI rendering changes
- isolated query fix with unchanged contract

Test lightly.

### Medium risk

Use for:

- endpoint logic changes
- DTO validation changes
- page-to-endpoint switching
- list/detail rendering changes

Test changed API plus one main page flow.

### High risk

Use for:

- auth
- moderation status flow
- upload/media handling
- schema changes
- shared response shape changes
- admin review actions

Test build, impacted APIs, main page flow, and at least one regression neighbor.

---

## Domain-specific mapping hints

### Topic / post related

Usually consider:

- list page
- detail page
- publish / edit flow
- counts: like/comment/view if touched

### Comment related

Usually consider:

- topic detail comment area
- comment list refresh
- comment count sync
- moderation or rejection path if touched

### User profile related

Usually consider:

- profile page
- personal topic/comment list
- avatar/nickname/signature rendering

### Tag related

Usually consider:

- profile tag display
- reply/post tag display
- fallback behavior when no eligible tag exists

### Moderation related

Usually consider:

- submit action result
- pending / approved / rejected visibility
- admin review page
- user-facing message when blocked or held

### Gear library related

Usually consider:

- search / filter entry
- detail page data display
- linkage from reviews or posts if touched

---

## Hard rules

- Do not output a full regression matrix unless the task truly needs it.
- Do not mention pages or endpoints that are not plausibly affected.
- Do not claim “tested” unless the task or tool output confirms it.
- If the task is docs-only, say clearly that no runtime smoke test is required.
- If build/test commands are unknown, say “run the repo’s configured build/typecheck” rather than inventing commands.

---

## Example output style

### Change summary

- task area: comment moderation status
- changed side: backend + mini-program
- risk level: high

### Must-run checks

- run backend build
- start app and verify `/health`

### Affected API checks

- `POST /mini/comment`: verify blocked text is rejected with expected business message
- `GET /mini/comment/list`: verify approved comments still render normally

### Manual page path

- open topic detail -> submit normal comment -> appears in list or pending state as designed
- submit blocked content -> see correct prompt and no bad record shown publicly

### Regression neighbors

- topic comment count remains correct
- profile comment history still loads if applicable

### Done when

The changed comment flow behaves correctly for normal and blocked content, the topic detail page remains usable, and no nearby count/display regression is observed.
