# Engineer Flow Agent Instructions

Use `skills/engineer-flow/SKILL.md` as the entrypoint for engineering tasks.

## Source Of Truth

- Canonical skills live under `skills/<skill-name>/SKILL.md`.
- The entrypoint skill is `engineer-flow`.
- Bundled skills are fallback generalists, not a closed universe.
- Dynamic discovery may find project-local, globally installed, Codex, Claude, or manifest-declared skills.
- Do not execute scripts from discovered third-party skills during discovery.

## Routing Rules

- Use family-gated sparse routing.
- Default specialist count is 0-2.
- Memory is infrastructure and must not consume specialist slots.
- Prefer project-local and framework-specific skills over generic bundled fallbacks.
- Fall back to mode 0 or a bundled generalist when no suitable specialist exists.
- Current code/config beats memory and skill assumptions.

## Validation

Run:

```bash
npm run validate
npm run self-test
node scripts/engineer-flow.mjs discover --json
```

Do not commit, tag, or publish unless explicitly asked.
