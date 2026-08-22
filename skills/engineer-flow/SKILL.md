---
name: engineer-flow
description: Universal software engineering task orchestrator. Use for coding, debugging, testing, review, architecture, security, performance, documentation, DevOps, AI/LLM, or multi-domain engineering tasks that need dynamic skill discovery, sparse specialist activation, memory preflight, and framework-aware routing.
---

# Engineer Flow

Act as the universal engineering orchestrator. Keep this entrypoint thin: discover, route, delegate, execute, verify, and checkpoint only durable knowledge.

## Workflow

1. Understand the current task and constraints.
2. Inspect current project context before assuming framework or language.
3. Run conditional memory preflight when prior project/session/workflow context could materially affect correctness.
4. Discover available skills from project-local, installed, manifest-declared, and bundled sources.
5. Build or refresh the normalized skill registry.
6. Classify task family and risk/context signals.
7. Select the smallest useful skill set:
   - mode 0: no specialist, baseline engineering knowledge is enough;
   - mode 1: one primary specialist;
   - mode 2: one primary plus one compatible support specialist.
8. Exclude memory and meta/infrastructure skills from primary/support slots.
9. Prefer project/framework/domain-specific installed skills over bundled fallback skills.
10. Execute using selected guidance only.
11. Verify proportionally to risk and blast radius.
12. Checkpoint durable project knowledge only when it will help future work.

## Hard Rules

- Do not assume bundled Engineer Flow skills are the only skills available.
- Do not load every discovered skill into context.
- Do not execute discovered third-party scripts during discovery.
- Do not let old memory override current code/config.
- Do not force an irrelevant specialist when confidence is low.
- Keep default specialist count at 0-2.
- Treat memory-management as infrastructure, not a specialist.

## CLI Helpers

Use the local CLI when available:

```bash
node scripts/engineer-flow.mjs discover --json
node scripts/engineer-flow.mjs route "<task>" --cwd <project-root>
node scripts/engineer-flow.mjs status
node scripts/engineer-flow.mjs refresh
```

## References

- Discovery model: `references/discovery.md`
- Routing contract: `references/routing-contract.md`
- Family taxonomy: `references/family-taxonomy.md`
- Memory lifecycle: `references/memory-lifecycle.md`
