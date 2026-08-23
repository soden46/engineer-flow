# Laravel Database Adapter

Adapt the agnostic `database` skill to Laravel projects.

Use the project's installed Laravel version and existing persistence conventions.

Relevant mechanisms may include:

- Eloquent
- Query Builder
- migrations
- database transactions
- model relationships
- eager loading
- chunking
- cursors
- pagination
- database constraints

Prefer parameterized Eloquent/Query Builder operations.

Avoid unrestricted raw SQL construction.

For N+1 problems, inspect relationships and query behavior before applying eager loading.

Do not eager-load unrelated relationships merely as a blanket optimization.

Use database constraints for important invariants where practical.

For multi-step atomic operations, use appropriate transaction boundaries.

Large migrations should consider existing data volume and deployment sequencing.

Check the actual database driver because behavior and capabilities may differ.

<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_START -->

## Absorbed Legacy Laravel Knowledge

> Preserved from retired standalone Laravel skills.
> This section is implementation guidance only.
> Universal engineering rules remain in the agnostic core.

# Laravel migration bundle: database

> Temporary migration artifact.
>
> This file preserves Laravel-specific source knowledge while legacy standalone skills are being retired.
> Universal engineering requirements belong in the agnostic core.
> Framework-specific implementation guidance belongs in the Laravel adapter.

Concepts: 3

## database-transactions

Legacy family: `database`

Aliases: `database-transactions`, `laravel:database-transactions`

### Legacy knowledge

# Database Transactions

Use database transactions for write operations that must be atomic.

This is the canonical transaction skill. It consolidates the former `transactions-and-consistency` topic.

Transaction boundaries usually belong inside an Action or Service, not spread across controllers.

## Required Transaction Cases

Use `DB::transaction()` when a workflow:

- writes multiple related records;
- updates counters, balances, inventory, or state machines;
- coordinates audit records with domain writes;
- creates records and related child rows;
- must not partially succeed.

```php
final class CreateRecord
{
    public function handle(User $actor, array $data): Record
    {
        return DB::transaction(function () use ($actor, $data) {
            $record = Record::create([
                'owner_id' => $actor->id,
                'name' => $data['name'],
            ]);

            $record->items()->createMany($data['items'] ?? []);

            return $record->fresh(['items']);
        });
    }
}
```

## Filesystem Side Effects

Database rollbacks do not roll back files. Track stored paths and clean them up when the database write fails.

```php
$storedPaths = [];

try {
    DB::transaction(function () use ($request, &$storedPaths) {
        $record = Record::create([...]);

        foreach ($request->file('attachments', []) as $file) {
            $storedPaths[] = $file->store("records/{$record->id}", 'public');
        }
    });
} catch (Throwable $exception) {
    Storage::disk('public')->delete($storedPaths);

    throw $exception;
}
```

For delete flows, prefer committing database/audit changes first, then deleting files after the successful transaction unless the product explicitly requires the opposite failure mode.

## Locks And Retries

Use row locks for concurrent updates to shared counters, balances, or ordered state.

```php
DB::transaction(function () use ($recordId) {
    $record = Record::query()
        ->whereKey($recordId)
        ->lockForUpdate()
        ->firstOrFail();

    $record->increment('sequence');
});
```

Keep transactions short. Make retry behavior idempotent when deadlock retries are used.

## After-Commit Work

Dispatch queued jobs/events after commit when they depend on committed records.

Do not hold a database transaction open during slow HTTP calls, mail delivery, document generation, or other remote side effects. Persist the state needed to continue, commit it, and dispatch after commit. Use an outbox or equivalent durable handoff when losing the side effect would be unacceptable.

## Idempotency And Consistency

- Protect retried commands, webhooks, and queued jobs with a stable idempotency key or a domain state check.
- Enforce uniqueness in the database when duplicate prevention is a data invariant.
- Make retry behavior return or recover the original result instead of repeating side effects.
- Keep lock ordering consistent across workflows to reduce deadlocks.
- Use optimistic checks when conflicts should be reported rather than serialized.
- Prefer explicit compensating behavior for filesystem or provider operations that cannot participate in the database transaction.

Test:

- success path;
- rollback path;
- duplicate or retried execution;
- concurrent updates when locking matters;
- filesystem cleanup when applicable;
- after-commit behavior for important workflows.

## Context Efficiency

Layer: 3 (Implementation)

Load this skill only when writes need atomicity or consistency. Do not load with unrelated skills. Keep transactions short, idempotent, and after-commit for side effects. No open transaction during slow HTTP calls or mail delivery.

## laravel-database-optimization

Legacy family: `database`

Aliases: `laravel-database-optimization`

### Legacy knowledge

# Laravel Database Optimization

Use this skill when improving query performance, reviewing migrations, debugging slow pages, or reducing memory and database load in Laravel apps.

This skill coordinates existing performance skills and adds an optimization workflow.

## Priority Order

1. Prove the bottleneck with logs, query inspection, profiling, `EXPLAIN`, tests, or realistic data volume.
2. Fix query shape before adding infrastructure: eager loading, constraints, selective columns, aggregates, pagination, and bounded datasets.
3. Add indexes that match actual filters, joins, sorts, and uniqueness rules.
4. Cache only stable or expensive work with explicit invalidation.
5. Review transaction scope, lock behavior, and retry strategy for write-heavy paths.
6. Plan migrations with production data size and lock risk in mind.

## Query Shape

- Prevent N+1 problems with intentional eager loading.
- Select only needed columns on hot paths, including constrained relationship columns.
- Use `withCount`, `withSum`, `exists`, subqueries, or aggregates instead of loading full relations for summaries.
- Avoid unbounded `all()`, broad `get()`, and collection-side filtering on large tables.
- Use cursor pagination or chunking for large ordered datasets and background processing.

## Indexes And Migrations

- Add indexes for foreign keys, common filters, common sort paths, and composite access patterns.
- Match composite index order to the real query pattern.
- Avoid adding indexes speculatively without a query path that needs them.
- For production-scale tables, plan additive and reversible migrations; ask before destructive changes.
- When altering existing columns, preserve existing attributes required by the database platform.

## Caching

- Cache expensive reads behind stable keys and short, intentional TTLs.
- Invalidate cache near the writes that change the underlying data.
- Use tags only when the configured cache store supports them.
- Do not cache user-specific or authorization-sensitive data without including the scope in the key.

## Transactions And Locks

- Keep transactions short and free of slow external calls.
- Use row locks only around data that must remain consistent during the write.
- Use retry logic for known deadlock-prone flows.
- Dispatch jobs, events, notifications, and file cleanup after commit when correctness depends on committed data.

## Related Skills

- `performance-eager-loading`
- `performance-select-columns`
- `performance-caching`
- `data-chunking-large-datasets`
- `migrations-and-factories`
- `database-transactions`

## transactions-and-consistency

Legacy family: `database`

Aliases: `laravel:transactions-and-consistency`

### Legacy knowledge

# Transactions And Consistency

Use this skill when a Laravel task involves transactions and consistency.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `laravel:transactions-and-consistency` topic from `jpcaparas/superpowers-laravel` into the local `laravel:transactions-and-consistency` catalog without copying third-party skill body text.

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
