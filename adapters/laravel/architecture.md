# Laravel architecture Adapter

This adapter translates the framework-agnostic `architecture` core into Laravel-specific implementation guidance.

The agnostic core remains authoritative.

Use the Laravel version, packages, and conventions actually present in the project.

Do not infer the engineering concern from Laravel technology alone.


<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_START -->

## Absorbed Legacy Laravel Knowledge

> Preserved from retired standalone Laravel skills.
> This section is implementation guidance only.
> Universal engineering rules remain in the agnostic core.

# Laravel migration bundle: architecture

> Temporary migration artifact.
>
> This file preserves Laravel-specific source knowledge while legacy standalone skills are being retired.
> Universal engineering requirements belong in the agnostic core.
> Framework-specific implementation guidance belongs in the Laravel adapter.

Concepts: 5

## architecture

Legacy family: `architecture`

Aliases: `architecture`, `laravel:architecture`

### Legacy knowledge

# Architecture

Use Laravel conventions before adding custom architecture. A good default request path is:

```text
Route -> Controller -> Form Request -> Action/Service -> Eloquent/Integration -> Response
```

Do not force every layer into every feature. Add a boundary only when it makes behavior easier to test, reuse, reason about, or change.

For multi-menu dashboards, admin systems, or copied prototype apps, also use `module-per-menu`: default to one menu or page per module, small controllers, per-page views, shared layouts/components, and DB-backed dynamic data.

## Layer Decisions

Use a controller for HTTP orchestration:

- receive the request;
- delegate validation and authorization;
- call the application workflow;
- return redirect, response, resource, view, or stream.

Use a Form Request when validation or authorization is complex, reused, or important enough to test independently.

Use an Action when a single use case needs a named command-style object.

Use a Service when a workflow coordinates multiple models, integrations, files, jobs, events, generated documents, or transactional writes.

Use a Policy or Gate for authorization rules. Keep authorization close to the boundary, but do not bury model-state rules in routes.

## Avoid Overengineering

Do not add repositories, interfaces, DTOs, feature folders, or value objects by default.

Duplication alone is not sufficient reason to create a service, action, or class. Prefer local reuse or a small extraction when behavior, lifecycle, dependencies, and change surface remain simple. Create a dedicated service, action, or boundary only when there is a justified business boundary, reusable operation, dependency boundary, or meaningful complexity.

Add an interface when:

- there are multiple implementations;
- a provider may be swapped;
- the domain should not depend on a concrete integration;
- a stable contract is shared across modules;
- a test boundary is meaningful and not just mocking for its own sake.

Add a repository only when query/data-access complexity is real or storage implementation may vary. Plain Eloquent in an Action or Service is fine for normal CRUD.

## Version And Stack Detection

Before applying version-specific patterns, check:

- Laravel version in `composer.json` or `php artisan --version`;
- PHP version and supported syntax;
- installed testing framework;
- queue driver and Horizon presence;
- Blade, Livewire, Inertia, React, Vue, Tailwind, or Vite usage;
- Sail/container workflow versus host commands.

## Implementation Checklist

- Keep the public behavior small and testable.
- Prefer Laravel-native APIs over custom plumbing.
- Keep project-specific business names out of shared standards.
- Write focused tests around the behavior being changed.
- Run available quality checks before handoff.

## Context Efficiency

Layer: 3 (Implementation)

Load this skill only when architecture decisions are needed. Do not load with unrelated skills. Keep the implementation checklist minimal: public behavior, Laravel-native APIs, focused tests, quality checks.

## brainstorming

Legacy family: `architecture`

Aliases: `brainstorming`, `laravel:brainstorming`

### Legacy knowledge

# Brainstorming

Layer: 2-3 (Design + Implementation)

Use this skill when a Laravel task involves design refinement before implementation.

This skill assumes Layer 0-1 have already run. If you have not run `memory-management` preflight and `least-code` minimization yet, do so before loading this skill.

## Syarif Defaults

- Follow Laravel conventions before introducing custom abstractions.
- Prefer project-local patterns when they are explicit and tested.
- Keep controllers focused on HTTP orchestration.
- Put validation, authorization, transactions, side effects, and integrations at clear boundaries.
- Keep client names, credentials, internal URLs, provider secrets, and project-specific business rules out of reusable standards.
- Verify important behavior with the smallest meaningful tests and quality checks.

## Workflow

1. Confirm memory preflight and least-code minimization are active.
2. Detect the Laravel version, PHP version, runner, package manager, and existing project conventions.
3. Identify the smallest local skill set that overlaps this topic.
4. Design or review the change using Laravel-native APIs first.
5. Add abstractions only when they reduce real complexity or protect a meaningful boundary.
6. Run targeted tests and available quality checks before handoff.

## Checkpoints

- Authorization and validation boundaries are explicit.
- Query shape, transactions, queues, cache, files, and external calls are intentional when touched.
- User-facing behavior has feature, unit, browser, or integration tests at the right level.
- Logs and errors are useful without exposing secrets or unnecessary personal data.
- Documentation or proposals avoid importing source-project names or one-off business rules.

## Related Skills

- `using-laravel-standards` - entrypoint and skill selection
- `architecture` - layer decisions
- `testing` - test strategy
- `security` - security review

## interfaces-and-di

Legacy family: `architecture`

Aliases: `interfaces-and-di`, `laravel:interfaces-and-di`

### Legacy knowledge

# Interfaces And Di

Use this skill when a Laravel task involves interfaces and di.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `interfaces-and-di` topic from `jpcaparas/superpowers-laravel` into the local `interfaces-and-di` catalog without copying third-party skill body text.

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

## ports-and-adapters

Legacy family: `architecture`

Aliases: `laravel:ports-and-adapters`

### Legacy knowledge

# Ports And Adapters

Use this skill when a Laravel task involves ports and adapters.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `laravel:ports-and-adapters` topic from `jpcaparas/superpowers-laravel` into the local `laravel:ports-and-adapters` catalog without copying third-party skill body text.

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

- `laravel:using-laravel-standards`
- `laravel:architecture`
- `laravel:testing`
- `laravel:security`

## strategy-pattern

Legacy family: `architecture`

Aliases: `laravel:strategy-pattern`

### Legacy knowledge

# Strategy Pattern

Use this skill when a Laravel task involves strategy pattern.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `laravel:strategy-pattern` topic from `jpcaparas/superpowers-laravel` into the local `laravel:strategy-pattern` catalog without copying third-party skill body text.

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

- `laravel:using-laravel-standards`
- `laravel:architecture`
- `laravel:testing`
- `laravel:security`

<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_END -->
