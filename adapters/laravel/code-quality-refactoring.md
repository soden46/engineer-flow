# Laravel Code Quality / Refactoring Adapter

Adapt `code-quality-refactoring` to Laravel projects without forcing Laravel-specific abstractions into unrelated code.

Existing project conventions take precedence.

Potential Laravel boundaries include:

- controllers
- Form Requests
- Policies
- Actions
- Services
- Jobs
- Events/listeners
- Resources
- Models
- repositories when the project already uses them

Do not move code into a Service, Action, Repository, or other class solely because the pattern exists.

Extract responsibilities when the separation improves clarity, reuse, testability, or correctness.

Controllers should normally avoid accumulating unrelated validation, authorization, persistence, transformation, and orchestration concerns.

Keep Eloquent-specific behavior where it naturally belongs unless the project architecture establishes another boundary.

Preserve routes, request contracts, response contracts, events, and other public behavior during pure refactoring.

Check the installed Laravel version and existing project architecture before proposing framework APIs.

<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_START -->

## Absorbed Legacy Laravel Knowledge

> Preserved from retired standalone Laravel skills.
> This section is implementation guidance only.
> Universal engineering rules remain in the agnostic core.

# Laravel migration bundle: code-quality-refactoring

> Temporary migration artifact.
>
> This file preserves Laravel-specific source knowledge while legacy standalone skills are being retired.
> Universal engineering requirements belong in the agnostic core.
> Framework-specific implementation guidance belongs in the Laravel adapter.

Concepts: 2

## executing-plans

Legacy family: `code-quality-refactoring`

Aliases: `executing-plans`, `laravel:executing-plans`

### Legacy knowledge

# Executing Plans

Use this skill when a Laravel task involves executing plans.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `executing-plans` topic from `jpcaparas/superpowers-laravel` into the local `executing-plans` catalog without copying third-party skill body text.

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

## quality-checks

Legacy family: `code-quality-refactoring`

Aliases: `laravel:quality-checks`, `quality-checks`

### Legacy knowledge

# Quality Checks

Use this skill when a Laravel task involves quality checks.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `quality-checks` topic from `jpcaparas/superpowers-laravel` into the local `quality-checks` catalog without copying third-party skill body text.

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

## Context Efficiency

Layer: 4 (Verification)

Load this skill only when quality gates are needed. Do not load with unrelated skills. Run the smallest meaningful check set: Pint, static analysis, tests. Skip checks that cannot run and report the command.
- `security`

<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_END -->
