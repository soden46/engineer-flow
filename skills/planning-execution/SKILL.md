---
name: planning-execution
description: Turn engineering goals into executable implementation plans with ordered, verifiable, technology-agnostic steps.
---

# planning-execution

Use this skill when work should be planned before implementation.

## Principles

A useful engineering plan identifies:

- objective
- affected components
- ordered implementation steps
- dependencies
- risks
- verification
- rollout or rollback when relevant

Prefer concrete actions over vague statements.

Separate required work from optional improvements.

Keep scope aligned with the requested outcome.

For risky changes identify checkpoints where correctness can be verified before continuing.

Plans should be executable by another engineer without requiring hidden assumptions.

## Adaptation

Use project evidence to determine the actual language, framework, runtime, and existing conventions.

If a matching technology adapter exists, use it only to translate these principles into native mechanisms.

Do not allow an adapter to redefine the engineering concern or weaken the core requirement.

<!-- ENGINEER_FLOW_ABSORBED_PLANNING_START -->

## Absorbed Legacy Capability: planning

The following framework-agnostic knowledge was preserved from the
previous Engineer Flow capability during consolidation.

# Planning

Plan enough to move safely.

- Identify objective, constraints, affected surfaces, and verification.
- Sequence work in small reversible steps.
- Keep at most one active implementation thread.
- Re-plan when current code disproves assumptions.
- Stop planning once execution is clear.

<!-- ENGINEER_FLOW_ABSORBED_PLANNING_END -->