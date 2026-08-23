# Laravel api-integration Adapter

This adapter translates the framework-agnostic `api-integration` core into Laravel-specific implementation guidance.

The agnostic core remains authoritative.

Use the Laravel version, packages, and conventions actually present in the project.

Do not infer the engineering concern from Laravel technology alone.


<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_START -->

## Absorbed Legacy Laravel Knowledge

> Preserved from retired standalone Laravel skills.
> This section is implementation guidance only.
> Universal engineering rules remain in the agnostic core.

# Laravel migration bundle: api-integration

> Temporary migration artifact.
>
> This file preserves Laravel-specific source knowledge while legacy standalone skills are being retired.
> Universal engineering requirements belong in the agnostic core.
> Framework-specific implementation guidance belongs in the Laravel adapter.

Concepts: 6

## actions-and-services

Legacy family: `api-integration`

Aliases: `actions-and-services`, `laravel:actions-and-services`

### Legacy knowledge

# Actions And Services

Actions and Services create application boundaries. Use them based on need, not because every controller method needs another layer.

## When To Use An Action

Use an Action for one named use case:

- `CreateRecord`
- `ApproveRecord`
- `CancelRecord`
- `GenerateRecordDocument`

Actions fit workflows with clear input and output.

```php
final class CreateRecord
{
    public function handle(User $actor, array $data): Record
    {
        return DB::transaction(function () use ($actor, $data) {
            return Record::create([
                'owner_id' => $actor->id,
                'name' => $data['name'],
            ]);
        });
    }
}
```

## When To Use A Service

Use a Service when a component owns a broader capability:

- integration client;
- document generation;
- pricing/calculation policy;
- import/export workflow;
- reusable application workflow.

```php
final class GatewayService
{
    public function createLink(Record $record): string
    {
        $response = Http::baseUrl(config('services.gateway.url'))
            ->timeout(5)
            ->retry(2, 200, throw: false)
            ->post('/links', [
                'reference' => $record->public_reference,
                'amount' => $record->total,
            ]);

        throw_unless($response->successful(), RuntimeException::class);

        return $response->json('url');
    }
}
```

## Integration Boundaries

Keep provider calls in focused services or adapters. The boundary should own:

- request mapping;
- authentication/signing details;
- timeouts and retries;
- response parsing;
- provider error translation;
- sanitized structured logging;
- fake-driven tests.

Do not globalize provider endpoints, payload quirks, status maps, or customer copy.

## Interfaces And Repositories

Do not create an interface for every service.

Add an interface only when:

- multiple implementations exist;
- provider swapping is likely;
- configuration selects implementations;
- the contract is shared across modules;
- the boundary protects domain code from infrastructure.

Do not require Repository Pattern for normal Eloquent CRUD. Add a repository only for real data-access complexity or storage-provider variation.

## Context Efficiency

Layer: 3 (Implementation)

Load this skill only when application boundaries need design. Do not load with unrelated skills. Keep the diff minimal: one Action per use case, one Service per integration or workflow, no interface until a second implementation exists.

## api-resources-and-pagination

Legacy family: `api-integration`

Aliases: `api-resources-and-pagination`, `laravel:api-resources-and-pagination`

### Legacy knowledge

# Api Resources And Pagination

Use this skill when a Laravel task involves api resources and pagination.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `api-resources-and-pagination` topic from `jpcaparas/superpowers-laravel` into the local `api-resources-and-pagination` catalog without copying third-party skill body text.

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

## config-env-storage

Legacy family: `api-integration`

Aliases: `config-env-storage`, `laravel:config-env-storage`

### Legacy knowledge

# Config Env Storage

Use this skill when a Laravel task involves config env storage.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `config-env-storage` topic from `jpcaparas/superpowers-laravel` into the local `config-env-storage` catalog without copying third-party skill body text.

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

## http-client-resilience

Legacy family: `api-integration`

Aliases: `http-client-resilience`, `laravel:http-client-resilience`

### Legacy knowledge

# Http Client Resilience

Use this skill when a Laravel task involves http client resilience.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `http-client-resilience` topic from `jpcaparas/superpowers-laravel` into the local `http-client-resilience` catalog without copying third-party skill body text.

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

## internationalization-and-translation

Legacy family: `api-integration`

Aliases: `internationalization-and-translation`, `laravel:internationalization-and-translation`

### Legacy knowledge

# Internationalization And Translation

Use this skill when a Laravel task involves internationalization and translation.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `internationalization-and-translation` topic from `jpcaparas/superpowers-laravel` into the local `internationalization-and-translation` catalog without copying third-party skill body text.

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

## rate-limiting

Legacy family: `api-integration`

Aliases: `laravel:rate-limiting`, `rate-limiting`

### Legacy knowledge

# Rate Limiting

Use this skill when a Laravel task involves rate limiting.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `rate-limiting` topic from `jpcaparas/superpowers-laravel` into the local `rate-limiting` catalog without copying third-party skill body text.

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
