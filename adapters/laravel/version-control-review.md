# Laravel version-control-review Adapter

This adapter translates the framework-agnostic `version-control-review` core into Laravel-specific implementation guidance.

The agnostic core remains authoritative.

Use the Laravel version, packages, and conventions actually present in the project.

Do not infer the engineering concern from Laravel technology alone.


<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_START -->

## Absorbed Legacy Laravel Knowledge

> Preserved from retired standalone Laravel skills.
> This section is implementation guidance only.
> Universal engineering rules remain in the agnostic core.

# Laravel migration bundle: version-control-review

> Temporary migration artifact.
>
> This file preserves Laravel-specific source knowledge while legacy standalone skills are being retired.
> Universal engineering requirements belong in the agnostic core.
> Framework-specific implementation guidance belongs in the Laravel adapter.

Concepts: 2

## code-review-requests

Legacy family: `version-control-review`

Aliases: `code-review-requests`, `laravel:code-review-requests`

### Legacy knowledge

# Code Review Requests

Use this skill when a Laravel task involves code review requests.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `code-review-requests` topic from `jpcaparas/superpowers-laravel` into the local `code-review-requests` catalog without copying third-party skill body text.

## Syarif Defaults

- Follow Laravel conventions before introducing custom abstractions.
- Prefer project-local patterns when they are explicit and tested.
- Keep controllers focused on HTTP orchestration.
- Put validation, authorization, transactions, side effects, and integrations at clear boundaries.
- Keep client names, credentials, internal URLs, provider secrets, and project-specific business rules out of reusable standards.
- Verify important behavior with the smallest meaningful tests and quality checks.

## Workflow

1. Detect the Laravel version, PHP version, runner, package manager, and existing project conventions.
2. Identify the smallest local skill set that overlaps this topic.
3. Implement or review the change using Laravel-native APIs first.
4. Add abstractions only when they reduce real complexity or protect a meaningful boundary.
5. Run targeted tests and available quality checks before handoff.

## Checkpoints

- Authorization and validation boundaries are explicit.
- Query shape, transactions, queues, cache, files, and external calls are intentional when touched.
- User-facing behavior has feature, unit, browser, or integration tests at the right level.
- Logs and errors are useful without exposing secrets or unnecessary personal data.
- Documentation or proposals avoid importing source-project names or one-off business rules.

## Related Skills

- `using-laravel-standards`
- `architecture`
- `testing`
- `security`

## least-code

Legacy family: `version-control-review`

Aliases: `least-code`

### Legacy knowledge

# Least Code

You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

Apply this skill when doing focused Laravel implementation, review, or refactor work. It governs what you build, not how you talk.

## Silent execution

Apply orchestration internally. Do not recite layer names, protocol steps, checklists, or internal decision process unless the user explicitly asks for a plan or explanation. The normal output must focus on the requested code/task, not the framework.

## Minimal solution rule

For implementation tasks, provide the single best minimal solution by default. Do not list multiple alternative implementations unless the user asks for alternatives or there is a meaningful unresolved trade-off.

## Core rules

- Make the smallest safe change.
- Preserve unrelated behavior.
- Do not overengineer.
- Verify proportionally to risk.

## Detailed references

- Risk classification, behavior preservation, root-cause workflow, confidence levels, test creation rules, change surface budget, anti-patterns, and output rules: `references/least-code-details.md`

## V4 Sparse Activation Alignment

In the V4 experimental worktree, the least-code gate runs before specialist activation. If the task is trivial, can be solved by reuse, or is covered by stdlib/native features, skip specialist activation entirely. This applies even if the router would otherwise recommend a specialist.

This preserves the minimization discipline: the cheapest solution is no specialist at all.

<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_END -->
