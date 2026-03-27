# GearSage Codex skills

## Recommended repository layout

Place this `.agents` directory at the repository root:

```text
<repo-root>/
  AGENTS.md
  .agents/
    README.md
    AGENTS.skills.patch.md
    skills/
      gearsage-architect-skill/
        SKILL.md
      gearsage-doc-router-skill/
        SKILL.md
      gearsage-smoke-test-skill/
        SKILL.md
```

## Notes

- Codex can discover repository skills from `.agents/skills` directories.
- You do not need to add skills to `AGENTS.md` for basic discovery.
- Adding the patch content to `AGENTS.md` can still improve when Codex chooses these skills.
