# Laravel Security Adapter

This file adapts the framework-agnostic `security` skill to Laravel projects.

It does not redefine the security requirements.

Use the Laravel version and APIs actually present in the project.

Target Laravel 10 and newer unless project evidence indicates otherwise.

## Validation

Core requirement:
Validate untrusted data at application boundaries.

Laravel mechanisms may include:

- Form Requests
- `$request->validate(...)`
- Validator
- route parameter constraints
- typed/value objects after validation

Prefer Form Requests when validation/authorization logic is substantial or reusable.

Do not consume raw request data broadly when validated data is sufficient.

Prefer validated input such as:

- `$request->validated()`
- explicitly retrieved validated fields

## Authorization

Core requirement:
Authorize every protected operation against the target resource.

Laravel mechanisms:

- Policies
- Gates
- Form Request `authorize()`
- `can` middleware
- `$this->authorize(...)`
- model/resource policy methods

Do not treat authentication middleware as authorization.

Avoid scattered role-name comparisons when Policies/Gates represent the rule more safely.

## Authentication

Use Laravel's supported authentication facilities and the authentication package already selected by the project.

Examples may include:

- session authentication
- Sanctum
- Passport
- framework-supported authentication scaffolding

Do not invent custom token/session cryptography.

## CSRF / Request Forgery

For browser state-changing requests using cookie/session authentication, preserve Laravel CSRF protection.

Do not globally disable CSRF middleware to make an endpoint work.

Webhook/API endpoints should use authentication appropriate to that boundary, for example provider signatures or authenticated tokens.

## Mass Assignment

Treat model mass assignment as a trust boundary.

Do not pass unrestricted request payloads directly into model create/update operations.

Use:

- validated fields
- explicit field mapping
- appropriate model assignment controls

Sensitive fields should not become writable merely because they exist on the model.

## SQL / Query Injection

Prefer Eloquent or the Query Builder's parameterized APIs.

For raw expressions or raw SQL:

- use parameter binding
- do not concatenate untrusted values into executable SQL

Dynamic column names, sort directions, and similar identifiers should use explicit allowlists.

## XSS / Output

Blade escapes normal interpolation by default.

Prefer escaped output.

Use raw output only when the content is deliberately trusted/sanitized for that context.

Do not disable escaping merely to fix formatting.

## File Uploads

Use Laravel filesystem/storage abstractions where appropriate.

Validate:

- file
- size
- expected media/type
- access semantics

Generate server-controlled filenames where practical.

Keep public and private disks explicit.

Do not trust `getClientOriginalName()` as a safe storage path.

## Rate Limiting

Use Laravel's native rate limiting facilities where appropriate.

Apply limits to the actual abuse boundary rather than adding one broad global limit.

Examples include:

- login
- password/reset operations
- verification
- public APIs
- expensive endpoints
- token endpoints

## Secrets and Configuration

Keep secrets in environment-backed configuration or the deployment secret mechanism.

Application code should normally read configuration through Laravel configuration abstractions rather than repeatedly calling environment access throughout runtime code.

Do not commit production `.env` files or credentials.

Ensure production debug/error settings do not expose internals.

## API Resources

Prefer explicit API/resource serialization when models contain fields that should not cross the external boundary.

Do not assume every model attribute is safe to return.

Authorization should happen independently of serialization.

## Sessions / Cookies

Use Laravel/session configuration appropriate to the deployment environment.

For production, verify relevant secure cookie/session settings based on the actual deployment topology.

Do not blindly hardcode settings without checking HTTPS/proxy/domain architecture.

## Queued Work

Security requirements continue across queue boundaries.

Validate and authorize before scheduling sensitive operations when appropriate.

Do not assume serialized job input remains trustworthy forever.

For long-lived jobs, reconsider whether authorization/state must be revalidated at execution time.

## Logging and Exceptions

Do not expose Laravel exception/debug output publicly in production.

Avoid logging:

- passwords
- tokens
- authorization headers
- session identifiers
- private keys
- sensitive request payloads

Use structured application logging without leaking secrets.

## Version Awareness

Do not assume APIs from the newest Laravel release exist.

Before proposing framework-specific code:

1. inspect `composer.json`
2. determine installed Laravel version
3. inspect existing project conventions
4. use APIs valid for that version

If an application-specific package already handles a concern, integrate with it rather than introducing a competing mechanism.

<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_START -->

## Absorbed Legacy Laravel Knowledge

> Preserved from retired standalone Laravel skills.
> This section is implementation guidance only.
> Universal engineering rules remain in the agnostic core.

# Laravel migration bundle: security

> Temporary migration artifact.
>
> This file preserves Laravel-specific source knowledge while legacy standalone skills are being retired.
> Universal engineering requirements belong in the agnostic core.
> Framework-specific implementation guidance belongs in the Laravel adapter.

Concepts: 7

## controller-cleanup

Legacy family: `security`

Aliases: `controller-cleanup`, `laravel:controller-cleanup`

### Legacy knowledge

# Controller Cleanup

Use this skill when controllers become difficult to understand, test, or maintain.

When a Laravel app has several menus/pages, also use `module-per-menu`: avoid one broad controller for the whole app, and split by menu, page group, or resource boundary.

Controllers should stay thin and focused on HTTP orchestration. They should not contain long business workflows, provider payload construction, repeated query logic, or file-processing loops.

## Responsibilities

A controller may:

- receive route-bound models and requests;
- call `$this->authorize()` or rely on middleware/Form Request authorization;
- call a Form Request's `validated()` data;
- invoke an Action or Service;
- return redirects, views, JSON resources, streams, or downloads;
- attach session flash messages.

A controller should not:

- build external provider payloads inline;
- contain multi-step write workflows without a transaction boundary;
- duplicate validation rules;
- hide authorization inside unrelated branches;
- contain heavy report/query logic that is reused elsewhere.

## Route Boundaries

Keep coarse access requirements visible in routes or route groups.

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('records', RecordController::class)
        ->middlewareFor('index', 'can:viewAny,' . Record::class)
        ->middlewareFor(['create', 'store'], 'can:create,' . Record::class)
        ->middlewareFor(['edit', 'update'], 'can:update,record')
        ->middlewareFor('destroy', 'can:delete,record');
});
```

Use Policies for model-state rules and Form Request `authorize()` for request-input-dependent authorization.

## Route Order And Cache Safety

Use controller actions for committed production endpoints that need middleware, sessions, tests, cache headers, or deployment route caching.

Route closures are acceptable for static views, simple redirects, prototypes, and temporary debugging.

Place static or specific routes before broad resource routes when URI patterns could collide.

```php
Route::get('records/export', ExportRecordsController::class)
    ->name('records.export');

Route::resource('records', RecordController::class);
```

Verify collision-prone route changes with `php artisan route:list` or a feature test.

## Generic Store Pattern

```php
final class RecordController
{
    public function store(StoreRecordRequest $request, CreateRecord $create): RedirectResponse
    {
        $record = $create->handle($request->user(), $request->validated());

        return redirect()
            ->route('records.show', $record)
            ->with('status', 'Record created.');
    }
}
```

## Guardrails

- Do not extract one-line code merely to create more layers.
- Do not require Repository Pattern by default.
- Keep framework-specific HTTP concerns in controllers.
- Keep reusable business operations outside controllers.

## Context Efficiency

Layer: 3 (Implementation)

Load this skill only when controllers need cleanup. Do not load with unrelated skills. Keep the diff minimal: inline validation only when rules are tiny, otherwise Form Request; one Action per use case; no repository by default.

## form-requests

Legacy family: `security`

Aliases: `form-requests`, `laravel:form-requests`

### Legacy knowledge

# Form Requests

Use Form Requests for HTTP validation and request-bound authorization when rules are complex, reused, sensitive, or likely to grow.

Inline controller validation is acceptable for tiny prototypes or legacy maintenance, but it is not the global standard for new or heavily edited workflows.

## Responsibilities

A Form Request may:

- authorize the HTTP operation;
- normalize input in `prepareForValidation()`;
- return validation rules;
- use custom messages and attribute labels;
- expose small helper methods for typed validated data.

It should not:

- perform database writes;
- send external requests;
- dispatch jobs;
- contain long business workflows.

## Input Normalization

Normalize human-formatted inputs before applying numeric/date/boolean rules. Keep locale assumptions explicit.

```php
final class StoreRecordRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'amount' => NumberInput::normalize($this->input('amount')),
        ]);
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0'],
            'status' => ['required', Rule::enum(RecordStatus::class)],
        ];
    }
}
```

Shared parsers should be small helpers or value objects with unit tests.

## Authorization

Use `authorize()` when the decision depends on request context or validated input. Use Policies when the decision depends on model state.

```php
public function authorize(): bool
{
    return $this->user()?->can('create', Record::class) === true;
}
```

## Array And Conditional Rules

Use the simplest Laravel-native validation rule set that fully matches the actual input shape and behavior. Reuse the existing Form Request structure when safe. Do not introduce complex nested rules, helper abstractions, or additional validation structures unless the behavior actually requires them.

Validate nested arrays explicitly.

```php
public function rules(): array
{
    return [
        'items' => ['required', 'array', 'min:1'],
        'items.*.name' => ['required', 'string', 'max:120'],
        'items.*.quantity' => ['required', 'integer', 'min:1'],
    ];
}
```

Prefer named custom rule objects when validation has reusable domain meaning.

## Testing

Test validation failures and authorization failures. Cover request normalization when human-formatted values are accepted.

## Context Efficiency

Layer: 3 (Implementation)

Load this skill only when validation or request authorization is nontrivial. Inline tiny validation in controllers only for prototypes or legacy maintenance. Keep Form Requests focused: rules, authorize, prepareForValidation, no database writes or business workflows.

## nova-resource-patterns

Legacy family: `security`

Aliases: `laravel:nova-resource-patterns`, `nova-resource-patterns`

### Legacy knowledge

# Nova Resource Patterns

Use this skill when a Laravel task involves nova resource patterns.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `nova:resource-patterns` topic from `jpcaparas/superpowers-laravel` into the local `nova-resource-patterns` catalog without copying third-party skill body text.

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

## php-attributes

Legacy family: `security`

Aliases: `laravel:php-attributes`, `php-attributes`

### Legacy knowledge

# Php Attributes

Use this skill when a Laravel task involves php attributes.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `php-attributes` topic from `jpcaparas/superpowers-laravel` into the local `php-attributes` catalog without copying third-party skill body text.

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

## policies-and-authorization

Legacy family: `security`

Aliases: `laravel:policies-and-authorization`, `policies-and-authorization`

### Legacy knowledge

# Policies And Authorization

Use this skill when a Laravel task involves policies and authorization.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `policies-and-authorization` topic from `jpcaparas/superpowers-laravel` into the local `policies-and-authorization` catalog without copying third-party skill body text.

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

## request-forgery-protection

Legacy family: `security`

Aliases: `laravel:request-forgery-protection`, `request-forgery-protection`

### Legacy knowledge

# Request Forgery Protection

Use this skill when a Laravel task involves request forgery protection.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `request-forgery-protection` topic from `jpcaparas/superpowers-laravel` into the local `request-forgery-protection` catalog without copying third-party skill body text.

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

## security

Legacy family: `security`

Aliases: `laravel:security`, `security`

### Legacy knowledge

# Security

Run a focused security pass whenever work touches authentication, authorization, input handling, uploads, external integrations, payment-like flows, public APIs, or sensitive data.

## Access Control

Every route/action that reads or mutates protected data needs authorization.

Use:

- route middleware for coarse access boundaries;
- Policies for model actions;
- Gates for cross-cutting checks;
- Form Request `authorize()` for request-input-dependent checks.

Test both allowed and denied paths.

## Request Forgery And Rate Limits

Use CSRF protection for browser forms. Exclude webhooks only deliberately, and authenticate webhook requests through signatures, shared secrets, IP allowlists, or provider verification as appropriate.

Apply rate limits to abuse-prone routes such as login, password reset, public forms, file uploads, and expensive API endpoints.

## Input And Output Safety

Validate all request input at the boundary. Use query builder bindings or Eloquent instead of interpolated raw SQL.

Escape output in Blade. Be deliberate about HTML rendering.

For frontend stacks, expose only the props needed by the page. Do not send hidden sensitive data because it is "not displayed."

## Uploads And Files

Validate uploaded files for:

- required/optional state;
- MIME/type;
- extension if relevant;
- size;
- count;
- image dimensions when needed.

Store files through Laravel `Storage`. Do not trust original filenames for storage paths. Keep visibility explicit.

## Secrets And Logs

Keep credentials in environment/config, not database-backed admin settings or source files.

Do not log:

- tokens;
- signatures;
- passwords;
- card data;
- full provider payloads;
- unnecessary personally identifiable information.

Use structured logs with safe identifiers and sanitized summaries.

```php
Log::info('integration.gateway.create.completed', [
    'record_id' => $record->id,
    'reference' => $record->public_reference,
    'provider_status' => $response->status(),
]);
```

## API Security

For APIs:

- return consistent errors;
- hide stack traces;
- validate input;
- authorize every action;
- apply rate limits;
- avoid leaking internal IDs when public identifiers are needed;
- add compatibility tests for consumed response shapes.

## Dependency And Configuration Review

When dependency or deployment configuration changes are in scope:

- check for known advisories;
- remove unused packages;
- avoid exposing frontend env values that are not meant for browsers;
- verify production debug settings are safe.

<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_END -->
