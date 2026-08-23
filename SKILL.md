---
name: engineer-flow
description: Framework and language agnostic engineering orchestrator that combines generalized internal engineering capabilities, user-installed external skills, stack adapters, and post-development security verification.
---

# Engineer Flow

<!-- ENGINEER_FLOW_RUNTIME_V1_START -->

## Runtime Architecture

This section defines the authoritative Engineer Flow runtime model.

Engineer Flow is the root engineering orchestrator.

Its capability pool consists of:

1. internal generalized engineering skills under `skills/`
2. compatible external user-installed skills discovered from the user's Agent Skills directories
3. optional stack adapters under `adapters/`

The runtime resolver is:

`scripts/engineer-flow.mjs`

### Internal Skills

Internal skills describe universal engineering concerns and must remain language and framework agnostic.

Examples include:

- architecture
- API integration
- database
- testing
- performance
- debugging
- security
- frontend UI
- infrastructure
- dependency tooling

Technology-specific implementation details belong in adapters.

### External Skills

Engineer Flow may discover compatible user-installed skills from:

`~/.agents/skills/`

Additional skill roots may be provided through:

`ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS`

External skills supplement Engineer Flow instead of replacing the root orchestrator.

Internal skills handle broad engineering concerns.

External skills should activate only when the task contains sufficiently specific evidence for their technology or domain.

### Specialist Selection

Select at most two development specialists:

- primary
- optional support

Do not activate unrelated specialists merely because their documentation contains generic words also present in the task.

### Stack Adapters

Detect the actual project stack from repository evidence.

When an adapter exists, apply it only to the corresponding generalized internal skill.

Adapters translate universal engineering requirements into native stack mechanisms.

Adapters must not redefine or weaken the core requirement.

### Development

Use the selected internal and/or external capabilities to implement, fix, review, or otherwise complete the engineering task.

Prefer minimal correct changes and preserve project conventions.

### Post-Development Security

After development work, run the Engineer Flow security verification stage.

Security verification uses:

`skills/security/SKILL.md`

and, when available, the matching stack security adapter.

The security stage does not consume one of the two development specialist slots.

The review must use evidence-based analysis and finish with:

`SECURITY REVIEW: PASS`

or:

`SECURITY REVIEW: NEEDS_FIX`

When actionable security findings remain, fix them and re-test before considering the work complete.

For staged-diff or commit-aware verification, use:

`scripts/security-gate.mjs`

### Direct Security Tasks

When the user's task itself is primarily a security assessment, the security core may also be selected directly as a development specialist.

The post-development security contract still remains available for final verification.

<!-- ENGINEER_FLOW_RUNTIME_V1_END -->

<!-- ENGINEER_FLOW_ABSORBED_MINIMAL_CHANGE_START -->

## Absorbed Legacy Capability: minimal-change

The following framework-agnostic knowledge was preserved from the
previous Engineer Flow capability during consolidation.

# Minimal Change

Prefer the smallest change that satisfies the task, preserves behavior, and can be verified.

- Reuse existing code and conventions.
- Avoid new abstractions unless they remove real complexity.
- Keep unrelated files and behavior untouched.
- Trace the affected path before editing shared behavior.
- Verify proportionally to risk.

<!-- ENGINEER_FLOW_ABSORBED_MINIMAL_CHANGE_END -->