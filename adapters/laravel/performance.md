# Laravel Performance Adapter

Adapt the agnostic `performance` skill to Laravel applications.

Measure before changing behavior.

Potential Laravel-specific areas include:

- Eloquent query count
- N+1 relationships
- eager loading
- pagination
- chunking/cursors
- cache usage
- queues
- expensive middleware
- serialization/resources
- container/bootstrap cost
- repeated external calls

Use project-compatible profiling and observability tools.

Do not add caching until ownership and invalidation behavior are understood.

For large datasets, prefer bounded approaches such as chunking, cursors, pagination, or queue processing when appropriate.

Do not assume every slow request is caused by Eloquent.

Check Laravel version and project infrastructure before recommending version-specific optimizations.

<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_START -->

## Absorbed Legacy Laravel Knowledge

> Preserved from retired standalone Laravel skills.
> This section is implementation guidance only.
> Universal engineering rules remain in the agnostic core.

# Laravel migration bundle: performance

> Temporary migration artifact.
>
> This file preserves Laravel-specific source knowledge while legacy standalone skills are being retired.
> Universal engineering requirements belong in the agnostic core.
> Framework-specific implementation guidance belongs in the Laravel adapter.

Concepts: 3

## performance-caching

Legacy family: `performance`

Aliases: `laravel:performance-caching`, `performance-caching`

### Legacy knowledge

# Performance Caching

Use this skill when a Laravel task involves performance caching.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `performance-caching` topic from `jpcaparas/superpowers-laravel` into the local `performance-caching` catalog without copying third-party skill body text.

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

## performance-eager-loading

Legacy family: `performance`

Aliases: `laravel:performance-eager-loading`, `performance-eager-loading`

### Legacy knowledge

# Performance Eager Loading

Use this skill when a Laravel task involves performance eager loading.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `performance-eager-loading` topic from `jpcaparas/superpowers-laravel` into the local `performance-eager-loading` catalog without copying third-party skill body text.

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

## performance-select-columns

Legacy family: `performance`

Aliases: `laravel:performance-select-columns`, `performance-select-columns`

### Legacy knowledge

# Performance Select Columns

Use this skill when a Laravel task involves performance select columns.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `performance-select-columns` topic from `jpcaparas/superpowers-laravel` into the local `performance-select-columns` catalog without copying third-party skill body text.

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

<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_END -->
