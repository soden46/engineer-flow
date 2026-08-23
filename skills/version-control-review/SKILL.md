---
name: version-control-review
description: Review changes and manage commits, branches, merges, and code-review workflows using VCS-agnostic engineering principles.
---

# version-control-review

Use this skill for code review, change inspection, commits, merges, branch workflows, and review preparation.

## Code Review

Evaluate:

- correctness
- regressions
- security impact
- data integrity
- tests
- maintainability
- scope creep

Prioritize behavior-affecting problems over style preferences.

Review changed behavior in context, not only individual lines.

## Changes

Keep commits coherent where practical.

Avoid mixing unrelated changes.

Before merging:

- ensure conflicts are resolved intentionally
- run relevant verification
- inspect unexpected generated or configuration changes

Do not rewrite shared history without understanding the collaboration impact.

## Adaptation

Use project evidence to determine the actual language, framework, runtime, and existing conventions.

If a matching technology adapter exists, use it only to translate these principles into native mechanisms.

Do not allow an adapter to redefine the engineering concern or weaken the core requirement.

<!-- ENGINEER_FLOW_ABSORBED_CODE_REVIEW_START -->

## Absorbed Legacy Capability: code-review

The following framework-agnostic knowledge was preserved from the
previous Engineer Flow capability during consolidation.

# Code Review

Prioritize findings over summaries.

- Look for bugs, regressions, security issues, and missing tests.
- Ground findings in files, commands, or observable behavior.
- Order issues by severity.
- State residual risk when checks are incomplete.
- Keep style-only comments secondary.

<!-- ENGINEER_FLOW_ABSORBED_CODE_REVIEW_END -->