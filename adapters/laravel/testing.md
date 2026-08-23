# Laravel Testing Adapter

Adapt the agnostic `testing` skill to the Laravel version and testing stack already used by the project.

Common mechanisms include:

- PHPUnit or Pest
- Laravel feature tests
- Laravel unit tests
- HTTP assertions
- database assertions
- factories
- authentication helpers
- queue/event/mail fakes
- filesystem fakes

Prefer feature tests when Laravel routing, middleware, validation, authorization, database behavior, or framework integration is part of the behavior being tested.

Use unit tests for isolated logic that does not require Laravel integration.

Use database refresh/transaction mechanisms already established by the project.

Do not fake the database when persistence behavior itself is the subject of the test.

When fixing a defect, add a regression test that reproduces the failure where practical.

Check the installed Laravel and testing package versions before proposing APIs.

<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_START -->

## Absorbed Legacy Laravel Knowledge

> Preserved from retired standalone Laravel skills.
> This section is implementation guidance only.
> Universal engineering rules remain in the agnostic core.

# Laravel migration bundle: testing

> Temporary migration artifact.
>
> This file preserves Laravel-specific source knowledge while legacy standalone skills are being retired.
> Universal engineering requirements belong in the agnostic core.
> Framework-specific implementation guidance belongs in the Laravel adapter.

Concepts: 10

## api-surface-evolution

Legacy family: `testing`

Aliases: `api-surface-evolution`, `laravel:api-surface-evolution`

### Legacy knowledge

# Api Surface Evolution

Use this skill when a Laravel task involves api surface evolution.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `api-surface-evolution` topic from `jpcaparas/superpowers-laravel` into the local `api-surface-evolution` catalog without copying third-party skill body text.

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

## controller-tests

Legacy family: `testing`

Aliases: `controller-tests`, `laravel:controller-tests`

### Legacy knowledge

# Controller Tests

Use this skill when a Laravel task involves controller tests.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `controller-tests` topic from `jpcaparas/superpowers-laravel` into the local `controller-tests` catalog without copying third-party skill body text.

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

## daily-workflow

Legacy family: `testing`

Aliases: `daily-workflow`, `laravel:daily-workflow`

### Legacy knowledge

# Daily Workflow

Use this skill when a Laravel task involves daily workflow.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `daily-workflow` topic from `jpcaparas/superpowers-laravel` into the local `daily-workflow` catalog without copying third-party skill body text.

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

## e2e-playwright

Legacy family: `testing`

Aliases: `e2e-playwright`, `laravel:e2e-playwright`

### Legacy knowledge

# E2E Playwright

Use this skill when a Laravel task involves Playwright E2E tests, browser workflow coverage, regression tests, screenshots, traces, auth setup, or converting manual browser findings into durable tests.

Use the official `microsoft/playwright` repository as the source for current Playwright behavior when APIs, CLI, MCP, browser support, locators, traces, or configuration details matter: https://github.com/microsoft/playwright. Prefer the linked Playwright docs and API reference over remembered APIs.

## Workflow

1. Detect how the project runs Laravel, assets, queues, database, and browser tests: host, Sail, Docker, package manager, Vite, Playwright config, existing test helpers, and CI commands.
2. Reuse project-local Playwright patterns first: auth helpers, seed scripts, storage state, route helpers, page objects, fixtures, test IDs, screenshots, and trace settings.
3. Seed deterministic data through Laravel factories, seeders, HTTP setup routes, API helpers, or existing test bootstrap. Avoid fragile production-like data dependencies.
4. Write tests with user-facing locators first: `getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`, and `getByTestId` only when semantic locators are not stable enough.
5. Prefer Playwright web-first assertions such as `toBeVisible`, `toHaveText`, `toHaveURL`, `toHaveValue`, and `toHaveScreenshot` over fixed sleeps.
6. Cover the high-value user workflow, not every implementation detail. Include success, validation failure, authorization-dependent UI, empty state, loading or queued state, and destructive confirmation when relevant.
7. Capture traces, screenshots, videos, or console/network evidence only when they help debug failures or support handoff.
8. Run the smallest meaningful Playwright command locally and report skipped browsers, missing services, or environment blockers explicitly.

## Laravel Setup Rules

- Authenticate through existing Laravel test helpers when available. If the project uses storage state, create it from a safe test user and never commit real cookies, tokens, or session files.
- Keep `.env`, credentials, tokens, private URLs, raw customer data, and real auth state out of tests, screenshots, traces, and fixtures.
- Use Laravel fakes for mail, notifications, queues, files, events, and HTTP integrations when the browser flow does not need the real external system.
- Wait for app-specific readiness: Vite assets loaded, Livewire requests settled, Inertia navigation finished, queued job state visible, fonts ready, and network idle only when it is meaningful.
- Add stable `data-testid` attributes only when accessible locators are not reliable and the project accepts test IDs.

## Playwright And Agent Browser

Use `ui-agent-browser` when UI/UX design or implementation is still being explored. Use `agent-browser` for low-token browser inspection, then convert the accepted workflow into Playwright when it should become a repeatable regression test.

## Completion Gate

Do not call Playwright coverage complete unless:

- the tested workflow is tied to real Laravel routes, Livewire actions, Inertia pages, or API contracts;
- deterministic setup and teardown exist or the dependency on local state is explicit;
- locators are resilient and user-facing where possible;
- assertions prove behavior and state, not only that the page loads;
- auth, validation, authorization, loading, empty, and success states are covered when relevant;
- screenshots/traces are enabled or captured where failure diagnosis needs them;
- the exact command run and any skipped checks are reported.

## Related Skills

- `using-laravel-standards`
- `ui-agent-browser`
- `responsive-ui-testing`
- `testing`
- `runner-selection`

## integrate-whatsapp-baileys-laravel

Legacy family: `testing`

Aliases: `integrate-whatsapp-baileys-laravel`

### Legacy knowledge

# Integrate WhatsApp With Baileys And Laravel

Build Baileys as a private Node.js sidecar and keep Laravel as the application, authorization, queue, and user-facing boundary.

## Required references

Read both references before changing the target project:

- [architecture-and-implementation.md](references/architecture-and-implementation.md) for package selection, service boundaries, security, reliability, and tests.
- [deployment-and-documentation.md](references/deployment-and-documentation.md) for Windows, VPS, process management, verification, and the required documentation artifact.

## Workflow

### 1. Inspect before designing

1. Read the target repository instructions and relevant existing documentation.
2. Detect the Laravel and PHP versions, Node package manager and lockfile, Node runtime policy, test framework, queue driver, process manager, deployment layout, and quality tools.
3. Search for existing WhatsApp clients, notification contracts, jobs, admin routes, configuration keys, Baileys services, and documentation. Extend a sound boundary instead of creating a competing integration.
4. Record assumptions. Default an unspecified VPS to Ubuntu/Debian, but label that assumption in the generated documentation.
5. Consult current official Baileys documentation and package metadata before choosing a package or API. Baileys changes frequently; do not rely on remembered package names, versions, exports, or migration behavior.

### 2. Agree on the smallest feature surface

Derive scope from the request. A normal outbound integration needs:

- one private Baileys session;
- connection status and QR or pairing-code lifecycle;
- connect and disconnect operations;
- text-message sending;
- Laravel configuration and a focused integration client;
- authorized admin controls only when the project needs them;
- queued delivery for business workflows when latency or retry behavior warrants it.

Do not add inbound message handling, media, groups, bulk messaging, chat storage, multi-session tenancy, webhooks, or a new admin UI unless requested or already required by project behavior.

### 3. Design before editing

Use this default boundary:

```text
authorized browser or application workflow
                -> Laravel
                -> private authenticated HTTP API
                -> Node.js Baileys sidecar
                -> WhatsApp Web socket
```

Keep the sidecar on the same host or a private network. Bind to loopback by default. Never point a public reverse proxy directly at it.

Before implementation, define:

- the sidecar directory and runtime;
- the package/version strategy and lockfile;
- the internal versioned endpoint contract;
- authentication and secret ownership;
- development and production auth-state storage;
- connection states and reconnect rules;
- sync versus queued send behavior;
- duplicate-delivery and retry policy;
- the exact test and smoke-check plan.

### 4. Implement the sidecar

Create or adapt a focused service such as `services/baileys/`. Keep socket state and HTTP transport separated when that materially improves testing; do not create ceremonial layers.

Require the sidecar to provide:

- explicit environment validation and a safe `.env.example`;
- loopback binding by default;
- authenticated, versioned endpoints for status, session operations, and sending;
- bounded JSON bodies and validated phone/message input;
- one connection attempt at a time and one active socket per session;
- credential persistence on every auth update;
- explicit handling for restart-required, logged-out, replaced, transient, and fatal disconnects;
- bounded reconnect backoff with jitter and no reconnect after deliberate logout;
- redacted structured logs, graceful shutdown, and useful exit codes;
- no secrets, QR values, auth state, or full message bodies in logs.

Treat file-based multi-file auth as development/demo storage. Follow the production decision rules in the architecture reference.

### 5. Implement the Laravel boundary

Use Laravel-native configuration and HTTP APIs:

- put environment reads in config files and add placeholders to `.env.example`;
- keep provider request mapping, authentication, timeouts, response parsing, and error translation in a focused client/service;
- add an interface only when multiple drivers or a meaningful domain boundary justify one;
- keep controllers limited to authorization, validated input, orchestration, and responses;
- authorize every admin/session action and retain CSRF protection for browser routes;
- use safe structured logs without tokens, QR data, message content, or unnecessary phone numbers;
- separate connection timeout from total request timeout;
- retry safe status reads only; never blindly retry message sends;
- queue business notifications when appropriate and make retry semantics explicit.

Preserve existing project conventions for routes, responses, translations, admin UI, and tests.

### 6. Verify behavior

Run the smallest meaningful set supported by the project:

1. Node syntax/type, lint, and unit/integration tests.
2. Laravel tests using `Http::fake()` for success, validation failure, unauthorized access, sidecar unavailability, and provider rejection.
3. Queue dispatch and job behavior tests when queued delivery exists.
4. Formatter/static analysis and affected frontend checks.
5. A local smoke check for health/status, connect, QR or pairing code, reconnect, send, disconnect, and restart persistence.

Do not claim an end-to-end WhatsApp send was verified unless a real test account was paired and the result was observed. Report skipped checks and why.

### 7. Write the mandatory project documentation

After implementation and verification, create or update `docs/BAILEYS_SETUP.md` in the target Laravel project. If the project already has a canonical WhatsApp setup document, update that file instead and report the chosen path.

The document must be project-specific, safe to commit, and contain complete local Windows and Linux VPS instructions. Use the required outline and completion rules in the deployment reference. Never place real tokens, session data, phone numbers, domains, usernames, or private paths in it.

### 8. Handoff

Report:

- architecture and scope implemented;
- files changed;
- chosen Baileys package and pinned version;
- development and production auth-state choices;
- tests and smoke checks run;
- documentation path;
- operational or compliance risks that remain.

State clearly that Baileys is unofficial and is not affiliated with Meta or WhatsApp. Do not imply guaranteed delivery, protocol stability, or freedom from account restrictions.

## queues-and-jobs

Legacy family: `testing`

Aliases: `laravel:queues-and-jobs`, `queues-and-jobs`

### Legacy knowledge

# Queues And Jobs

Use queues for work that can happen outside the request cycle: notifications, imports, exports, media processing, integration callbacks, long-running calculations, and retryable external operations.

This is the canonical queue skill. It consolidates the former `queues-and-horizon` topic while keeping `horizon-metrics-and-dashboards` for focused observability work.

## Detect The Queue Stack

Confirm the queue connection, worker manager, Horizon installation, failed-job storage, deployment process, and local runner before changing configuration or issuing operational commands. Do not assume Horizon is installed merely because Redis is used.

## Job Design

Queued jobs should be safe to retry.

Prefer:

- passing IDs or small scalar payloads;
- reloading models in `handle()`;
- explicit `tries`, backoff, timeout, and failure behavior when the job is important;
- idempotency keys or state checks for external side effects;
- after-commit dispatch when jobs depend on committed records.

```php
final class ProcessRecord implements ShouldQueue
{
    public function __construct(public int $recordId)
    {
    }

    public function handle(): void
    {
        $record = Record::query()->findOrFail($this->recordId);

        if ($record->processed_at !== null) {
            return;
        }

        // Perform idempotent work.
    }
}
```

## Dispatching

Dispatch after commit when a queued job needs database writes to be visible.

```php
ProcessRecord::dispatch($record->id)->afterCommit();
```

## Failure Handling

Separate transient failures from permanent failures. Retry network and temporary provider issues; fail fast for invalid state or bad input.

Log failures with redacted context. Do not log secrets, tokens, signatures, full payloads, or unnecessary personal data.

## Horizon And Workers

Do not force Horizon on every project. Use Horizon or equivalent visibility when queue volume, failed jobs, throughput, or production support justifies it.

Worker configuration should account for:

- queue priorities;
- memory limits;
- timeouts;
- retry/backoff;
- graceful restarts;
- failed job storage.

When Horizon is installed:

- align supervisors with real queue names and priorities;
- keep worker timeout below the queue driver's retry-after window;
- balance processes based on workload behavior rather than one global queue;
- tag jobs with low-cardinality identifiers that help operators diagnose failures;
- protect the dashboard with production authorization;
- terminate or restart workers through the deployment lifecycle so new code is loaded safely.

Without Horizon, apply the same timeout, memory, retry, graceful-restart, and failed-job expectations to the selected process manager.

## Scheduling

Scheduled tasks should use overlap protection for long-running or non-reentrant work.

```php
Schedule::command('records:process')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();
```

Keep scheduled commands testable independently from cron.

## Testing

Use `Queue::fake()` or `Bus::fake()` to assert dispatching. Test job behavior directly when the job contains meaningful logic.

Also verify retry/idempotency behavior, failure callbacks, batch or chain behavior when used, and after-commit dispatch for jobs that depend on newly written data. For operational changes, inspect the effective worker/Horizon configuration and perform a safe local smoke test when the required services are available.

## specifying-constraints

Legacy family: `testing`

Aliases: `laravel:specifying-constraints`, `specifying-constraints`

### Legacy knowledge

# Specifying Constraints

Use this skill when a Laravel task involves specifying constraints.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `specifying-constraints` topic from `jpcaparas/superpowers-laravel` into the local `specifying-constraints` catalog without copying third-party skill body text.

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

## tdd-with-pest

Legacy family: `testing`

Aliases: `laravel:tdd-with-pest`, `tdd-with-pest`

### Legacy knowledge

# Tdd With Pest

Use this skill when a Laravel task involves tdd with pest.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `tdd-with-pest` topic from `jpcaparas/superpowers-laravel` into the local `tdd-with-pest` catalog without copying third-party skill body text.

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

Load this skill only when TDD is needed. Do not load with unrelated skills. RED-GREEN-REFACTOR, but keep it tight: one failing test, smallest passing implementation, refactor only when it simplifies. No per-function suites unless asked.
- `security`

## testing

Legacy family: `testing`

Aliases: `laravel:testing`

### Legacy knowledge

# Testing

Tests should prove behavior, not mirror implementation. Prefer the smallest test type that catches the risk.

## Test Selection

Use feature tests for:

- routes and controllers;
- authorization and middleware;
- validation;
- redirects;
- sessions;
- database writes;
- user-facing workflows.

Use unit tests for:

- pure helpers;
- value objects;
- complex Actions/Services without HTTP behavior;
- parsing and normalization rules.

Use browser E2E tests for:

- JavaScript-dependent behavior;
- Livewire/SPA interactions;
- modals, uploads, previews, drag/drop, and browser state;
- critical accessibility-sensitive flows.

## Framework Fakes

Use Laravel fakes for external or filesystem side effects.

```php
Http::fake([
    'api.example.test/*' => Http::response(['ok' => true]),
]);

$this->post(route('records.send', $record))
    ->assertRedirect()
    ->assertSessionHasNoErrors();

Http::assertSent(fn ($request) => $request->method() === 'POST');
```

Common fakes:

- `Http::fake()`;
- `Storage::fake()`;
- `Mail::fake()`;
- `Notification::fake()`;
- `Queue::fake()` or `Bus::fake()`;
- `Event::fake()`.

## Workflow Tests

For important user-facing workflows, cover the full route behavior.

```php
$this->actingAs($user)
    ->post(route('records.store'), [
        'name' => 'Example',
    ])
    ->assertRedirect(route('records.index'))
    ->assertSessionHasNoErrors();

$this->assertDatabaseHas('records', [
    'name' => 'Example',
]);
```

When rebuilding or porting an app, add feature parity tests for critical happy paths. Parity tests are a regression net, not a replacement for focused tests.

## Render And Document Tests

For pure Blade/report rendering, unsaved Eloquent graphs may be built with `forceFill()` and `setRelation()`.

Use this only when persistence, middleware, authorization, route model binding, database constraints, queries, and events are not part of the behavior.

```php
$owner = (new User)->forceFill(['name' => 'Example User']);
$record = (new Record)->forceFill(['number' => 'DOC-001']);
$record->setRelation('owner', $owner);

$html = view('reports.record', ['record' => $record])->render();

$this->assertStringContainsString('DOC-001', $html);
```

For generated documents, assert both stable source content and artifact validity.

```php
$html = view('reports.record', $viewData)->render();
$output = Pdf::loadView('reports.record', $viewData)->output();

$this->assertStringContainsString('Document Number', $html);
$this->assertStringStartsWith('%PDF-', $output);
```

Avoid broad snapshots unless the project intentionally uses snapshot or visual-regression testing.

## Browser E2E

For Playwright or similar tools:

- prefer role and label locators;
- use web-first assertions;
- avoid fixed sleeps;
- use deterministic auth setup when appropriate;
- keep E2E focused on high-value browser behavior.

## Handoff Verification

Before work is complete, run the relevant checks:

- targeted PHP tests;
- affected browser tests;
- Pint/style check;
- static analysis;
- frontend build/lint;
- route checks;
- queue/job smoke tests.

If a check cannot run, report the command and reason.

## using-laravel-standards

Legacy family: `testing`

Aliases: `laravel:using-laravel-standards`, `using-laravel-standards`

### Legacy knowledge

# Using Syarif Laravel Standards

Apply silently.

1. Smallest safe change
2. Infer risk: LOW / MEDIUM / HIGH.
3. Preserve unrelated behavior.
4. Select relevant guidance.
5. Verify proportionally.
6. Stop when complete.

Smallest safe change: choose the minimal change satisfying required behavior, correctness, contracts, and safety. Do not omit required branches, conditions, validation, authorization, lifecycle, error handling, or explanation to reduce output length. Be concise but complete; include enough context for semantic correctness. Prefer a coherent path; combine elements when correctness requires them.

LOW: local change. No new abstraction. Minimal verification. No memory unless needed.
MEDIUM: trace affected path. Preserve contracts. Root-cause where non-obvious. Targeted regression check.
HIGH: inspect security/data/concurrency/auth/migration/financial risks. Failure paths. Affected regression surface. Explicit remaining uncertainty when meaningful.

Memory: use only when prior context matters. Current code/config overrides memory.

Overengineering gate: reuse existing code unless it cannot safely solve the task. Then create the smallest justified abstraction.

## V4 Sparse Activation (Experimental)

This worktree uses V4 sparse activation protocol. Specialist bodies are loaded conditionally, not by default.

### Activation Protocol

1. Run least-code gate. If trivial/reuse/stdlib covers the task, skip specialist activation.
2. Run V4 sparse router: classify domain, compute knowledge need, compute confidence, detect cross-cutting signals.
3. Apply activation gates:
   - If knowledge need < threshold â†’ 0 specialists
   - If knowledge need â‰¥ threshold AND confidence â‰¥ threshold â†’ 1 primary specialist
   - If cross-cutting signal â‰¥ threshold â†’ +1 supporting specialist
4. Enforce hard cap: MAX_SPECIALISTS = 2
5. Load sequentially: primary first, support second only if cross-cutting need remains.
6. Execute with available guidance.
7. Verify proportionally to risk.

### Routing Strategies

**flat_v4** (default)
- Single-stage: classify directly into one of 72 specialists.
- Reference: `references/v4-sparse-router.md`

**semantic_v4_3** (experimental)
- Two-stage: first classify into semantic family, then select specialist from family shortlist.
- Stage 1 reference: `references/v4-semantic-router-stage1.md`
- Stage 2 reference: `references/v4-semantic-router-stage2.md`
- Family index: `benchmark/v4-family-index.json`

Set `routing_strategy` in the runner config to choose.

### Key Distinctions

- Knowledge Need controls specialist activation.
- Risk controls verification depth.
- Confidence decreases with ambiguity/conflict.
- No benchmark-derived baseline gap.
- No historical accuracy dependency in V4.0.

### References

- V4 sparse router: `references/v4-sparse-router.md`
- V4 semantic router stage 1: `references/v4-semantic-router-stage1.md`
- V4 semantic router stage 2: `references/v4-semantic-router-stage2.md`
- Knowledge need gate: `references/v4-need-gate.md`
- Confidence gate: `references/v4-confidence-gate.md`
- Activation enforcer: `references/v4-activation-enforcer.md`
- Context contract: `references/v4-context-contract.md`
- Semantic family index: `benchmark/v4-family-index.json`

<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_END -->
