# Laravel To General Migration Matrix

Source: `D:\syarif-laravel-ai-skills\syarif-laravel-standards`

Purpose: classify the 72 Laravel skills before creating bundled Engineer Flow fallback skills. This matrix is analysis only; the Laravel source repo remains the external specialist pack.

Classification values:

- `GENERAL`: already broadly useful outside Laravel.
- `GENERALIZABLE`: useful concept, but current body contains Laravel-specific implementation details.
- `LARAVEL_SPECIFIC`: keep in Laravel pack and discover externally.
- `META_INFRASTRUCTURE`: orchestration, memory, prompt, runner, or workflow infrastructure.
- `MERGE_CANDIDATE`: overlaps with a bundled general fallback and should be merged rather than copied.

| Laravel skill | Classification | Proposed general equivalent | Action | Rationale |
|---|---|---|---|---|
| actions-and-services | GENERALIZABLE | architecture | generalize | Application-boundary idea is portable, but Laravel Actions/Services details stay external. |
| ai-sdk | GENERALIZABLE | ai-llm-engineering | generalize | AI feature patterns generalize; Laravel SDK specifics remain external. |
| api-resources-and-pagination | LARAVEL_SPECIFIC | api-integration | keep Laravel-only | Laravel API Resources are framework-specific. |
| api-surface-evolution | GENERALIZABLE | api-integration | generalize | API versioning and compatibility are framework-agnostic. |
| architecture | GENERALIZABLE | architecture | generalize | Boundary and dependency guidance generalizes after removing Laravel assumptions. |
| blade-components-and-layouts | LARAVEL_SPECIFIC | frontend-ui | keep Laravel-only | Blade component implementation is Laravel-specific. |
| brainstorming | GENERAL | planning | merge | Interactive clarification belongs in planning fallback. |
| code-review-requests | GENERAL | code-review | merge | Review request shaping is broadly applicable. |
| complexity-guardrails | GENERAL | refactoring | merge | Complexity reduction is portable. |
| config-env-storage | GENERALIZABLE | infrastructure-devops | generalize | Environment/storage config ideas generalize; Laravel config helpers stay external. |
| constants-and-configuration | GENERAL | refactoring | merge | Constants/enums/config extraction is portable. |
| controller-cleanup | GENERALIZABLE | refactoring | generalize | Thin-controller principle applies to MVC, but Laravel controller patterns stay external. |
| controller-tests | GENERALIZABLE | testing | generalize | HTTP/controller testing concept is portable; Laravel assertions stay external. |
| custom-helpers | GENERAL | minimal-change | merge | Small pure helpers are generic engineering guidance. |
| daily-workflow | META_INFRASTRUCTURE | planning | meta/infrastructure | Workflow checklist supports orchestration, not a specialist slot. |
| data-chunking-large-datasets | GENERAL | data-processing | merge | Chunking/lazy processing is portable. |
| database-transactions | GENERAL | database | merge | Transactions, locks, idempotency, and consistency are broadly applicable. |
| debugging-prompts | GENERAL | debugging | merge | Debugging context collection is portable. |
| dependencies-trim-packages | GENERAL | dependency-tooling | merge | Dependency reduction and package hygiene are portable. |
| documentation-best-practices | GENERAL | documentation | merge | Documentation guidance is portable. |
| e2e-playwright | GENERALIZABLE | testing | generalize | Playwright is cross-stack; Laravel seeding/auth specifics stay external. |
| effective-context | GENERAL | planning | merge | Context quality is useful for any engineering task. |
| eloquent-patterns | LARAVEL_SPECIFIC | database | keep Laravel-only | Eloquent is Laravel-specific. |
| eloquent-relationships | LARAVEL_SPECIFIC | database | keep Laravel-only | Eloquent relationships are Laravel-specific. |
| exception-handling-and-logging | GENERALIZABLE | debugging | generalize | Observability/failure handling generalizes; Laravel exception APIs stay external. |
| executing-plans | GENERAL | planning | merge | Execution sequencing is portable. |
| extract-laravel-standards | META_INFRASTRUCTURE | engineer-flow | keep Laravel-only | Catalog extraction is repo-specific infrastructure. |
| filesystem-uploads | GENERALIZABLE | api-integration | generalize | File handling is portable; Laravel Storage APIs stay external. |
| form-requests | LARAVEL_SPECIFIC | security | keep Laravel-only | Form Requests are Laravel-specific validation/authorization. |
| horizon-metrics-and-dashboards | LARAVEL_SPECIFIC | infrastructure-devops | keep Laravel-only | Horizon is Laravel-specific. |
| http-client-resilience | GENERAL | api-integration | merge | Timeouts, retries, backoff, and provider errors are portable. |
| integrate-whatsapp-baileys-laravel | GENERALIZABLE | api-integration | keep Laravel-only | Baileys integration concept generalizes, but body is Laravel sidecar-specific. |
| interfaces-and-di | GENERAL | architecture | merge | Interfaces and dependency injection are portable. |
| internationalization-and-translation | GENERALIZABLE | frontend-ui | generalize | i18n is portable; Laravel translation helpers stay external. |
| iterating-on-code | GENERAL | refactoring | merge | Iteration guidance is portable. |
| laravel-11-12-app-guidelines | LARAVEL_SPECIFIC | dependency-tooling | keep Laravel-only | Laravel version compatibility belongs in Laravel pack. |
| laravel-database-optimization | LARAVEL_SPECIFIC | performance | keep Laravel-only | Must outrank generic performance when installed for Laravel tasks. |
| laravel-prompting-patterns | META_INFRASTRUCTURE | engineer-flow | keep Laravel-only | Prompt vocabulary is Laravel-specific orchestration support. |
| laravel-specialist | META_INFRASTRUCTURE | engineer-flow | meta/infrastructure | Laravel coordinator should be discoverable but not primary support in Engineer Flow. |
| least-code | GENERAL | minimal-change | merge | Minimization discipline is core to Engineer Flow. |
| livewire-development | LARAVEL_SPECIFIC | frontend-ui | keep Laravel-only | Livewire is Laravel-specific. |
| memory-management | META_INFRASTRUCTURE | memory-management | generalize | Generalize memory lifecycle and keep outside specialist slots. |
| migrations-and-factories | GENERALIZABLE | database | generalize | Schema/migration principles are portable; Laravel factories stay external. |
| module-per-menu | GENERALIZABLE | architecture | generalize | Feature/page modularity is portable, but Laravel menu patterns stay external. |
| nova-resource-patterns | LARAVEL_SPECIFIC | frontend-ui | keep Laravel-only | Nova is Laravel-specific. |
| performance-caching | GENERAL | performance | merge | Caching and invalidation are portable. |
| performance-eager-loading | GENERALIZABLE | performance | generalize | N+1 prevention generalizes, Eloquent mechanics stay external. |
| performance-select-columns | GENERALIZABLE | performance | generalize | Selective data loading is portable. |
| php-attributes | GENERALIZABLE | dependency-tooling | keep Laravel-only | PHP/Laravel attribute usage is language/framework-specific. |
| policies-and-authorization | LARAVEL_SPECIFIC | security | keep Laravel-only | Laravel policy APIs are framework-specific. |
| ports-and-adapters | GENERAL | architecture | merge | Hexagonal architecture is portable. |
| prompt-structure | META_INFRASTRUCTURE | engineer-flow | merge | Prompt structure supports orchestration, not a domain specialist. |
| quality-checks | GENERAL | testing | merge | Quality gates are portable. |
| queues-and-jobs | GENERALIZABLE | infrastructure-devops | generalize | Queue/job lifecycle generalizes; Laravel queue APIs stay external. |
| rate-limiting | GENERAL | security | merge | Rate limits are portable API/security guidance. |
| request-forgery-protection | GENERALIZABLE | security | generalize | CSRF/origin protection generalizes; Laravel middleware details stay external. |
| responsive-ui-testing | GENERAL | frontend-ui | merge | Responsive testing is portable. |
| routes-best-practices | GENERALIZABLE | api-integration | generalize | Route hygiene generalizes; Laravel route files stay external. |
| runner-selection | META_INFRASTRUCTURE | engineer-flow | meta/infrastructure | Tool detection supports orchestration, not a specialist slot. |
| security | GENERAL | security | merge | Security review is portable. |
| specifying-constraints | GENERAL | planning | merge | Constraint specification is portable. |
| strategy-pattern | GENERAL | architecture | merge | Strategy pattern is portable. |
| task-scheduling | GENERALIZABLE | infrastructure-devops | generalize | Scheduling concepts generalize; Laravel scheduler APIs stay external. |
| tdd-with-pest | GENERALIZABLE | testing | keep Laravel-only | TDD generalizes, but Pest/Laravel body remains external. |
| template-method-and-plugins | GENERAL | architecture | merge | Template Method and plugin extension are portable. |
| testing | GENERAL | testing | merge | Testing strategy is portable. |
| ui-agent-browser | GENERAL | frontend-ui | merge | Browser-based UI inspection is portable. |
| upgrade-13 | LARAVEL_SPECIFIC | dependency-tooling | keep Laravel-only | Laravel 13 upgrade path belongs in Laravel pack. |
| using-examples-in-prompts | GENERAL | documentation | merge | Examples and prompt grounding are portable. |
| using-laravel-standards | META_INFRASTRUCTURE | engineer-flow | keep Laravel-only | Laravel entrypoint remains external specialist-pack coordinator. |
| vector-search | GENERALIZABLE | ai-llm-engineering | generalize | Vector search concepts generalize; framework-specific query syntax stays external. |
| writing-plans | GENERAL | planning | merge | Planning skill is portable. |

## Summary

- Total source skills classified: 72
- Bundled Engineer Flow fallback skills created: 17
- Infrastructure/meta skills created: 2
- Laravel-specific bodies copied into Engineer Flow: 0
- Intended integration: discover installed `syarif-laravel-ai-skills` as an external specialist pack and prefer its framework-specific skills for Laravel work.
