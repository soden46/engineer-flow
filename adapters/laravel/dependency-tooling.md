# Laravel dependency-tooling Adapter

This adapter translates the framework-agnostic `dependency-tooling` core into Laravel-specific implementation guidance.

The agnostic core remains authoritative.

Use the Laravel version, packages, and conventions actually present in the project.

Do not infer the engineering concern from Laravel technology alone.


<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_START -->

## Absorbed Legacy Laravel Knowledge

> Preserved from retired standalone Laravel skills.
> This section is implementation guidance only.
> Universal engineering rules remain in the agnostic core.

# Laravel migration bundle: dependency-tooling

> Temporary migration artifact.
>
> This file preserves Laravel-specific source knowledge while legacy standalone skills are being retired.
> Universal engineering requirements belong in the agnostic core.
> Framework-specific implementation guidance belongs in the Laravel adapter.

Concepts: 3

## dependencies-trim-packages

Legacy family: `dependency-tooling`

Aliases: `dependencies-trim-packages`, `laravel:dependencies-trim-packages`

### Legacy knowledge

# Dependencies Trim Packages

Use this skill when a Laravel task involves dependencies trim packages.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `dependencies-trim-packages` topic from `jpcaparas/superpowers-laravel` into the local `dependencies-trim-packages` catalog without copying third-party skill body text.

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

## runner-selection

Legacy family: `dependency-tooling`

Aliases: `laravel:runner-selection`, `runner-selection`

### Legacy knowledge

# Runner Selection

Use this skill before executing Laravel commands in an unfamiliar repository. It consolidates the former `bootstrap-check` skill into one environment-detection workflow.

## Detection Order

1. Read project instructions for required containers, wrappers, or task runners.
2. Check for `vendor/bin/sail`, Docker Compose files, and a Sail dependency in `composer.json`.
3. Check whether the expected containers are already running and whether required services are healthy.
4. If Sail is absent, verify host `php`, `composer`, `node`, and the selected package manager.
5. Inspect `composer.json`, lock files, `package.json`, and test configuration before choosing commands.

Prefer Sail when the project is configured around it and its services are available. Use host tooling when the repository is intentionally non-Sail or the user has chosen the host workflow.

Do not silently mix runners within one verification sequence. Container and host PHP versions, extensions, environment variables, databases, and filesystem permissions may differ.

## Command Map

| Task | Sail | Host |
| --- | --- | --- |
| Artisan | `./vendor/bin/sail artisan ...` | `php artisan ...` |
| Composer | `./vendor/bin/sail composer ...` | `composer ...` |
| PHP tests | `./vendor/bin/sail artisan test ...` | `php artisan test ...` |
| Pint | `./vendor/bin/sail pint ...` | `vendor/bin/pint ...` |
| Node script | `./vendor/bin/sail npm run ...` | `npm run ...` |

Use the package manager selected by the lock file. Do not replace npm, pnpm, Yarn, or Bun merely because another tool is installed globally.

## Bootstrap Checks

- Required PHP and Node versions match project constraints.
- Composer and frontend dependencies are installed.
- `.env` exists when runtime commands need it, without printing secrets.
- The application key and writable directories are ready when relevant.
- Database, cache, queue, mail, search, and browser-test services required by the task are reachable.
- Pending migrations are understood before applying them.
- Test environment configuration points to safe, non-production services.

Starting containers or applying migrations changes local state. Do it when the requested workflow requires it; otherwise report the exact readiness issue and the command that would resolve it.

## Output

State the selected runner once, then use it consistently. When handing off, report environment limitations that prevented a check from running.

## upgrade-13

Legacy family: `dependency-tooling`

Aliases: `laravel:upgrade-13`, `upgrade-13`

### Legacy knowledge

# Upgrade 13

Use this skill when a Laravel task involves upgrade 13.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `upgrade-13` topic from `jpcaparas/superpowers-laravel` into the local `upgrade-13` catalog without copying third-party skill body text.

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
