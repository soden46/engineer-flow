# Engineer Flow Architecture

## Reusable Architecture Extracted From Laravel Skill System

Engineer Flow generalizes these proven ideas:

- sparse skill activation;
- dynamic skill discovery;
- family-gated routing;
- conditional memory infrastructure;
- 0-2 specialists by default;
- task/risk/context-aware routing;
- graceful fallback when specialists are unavailable;
- strict machine-readable routing contracts;
- benchmarkable routing behavior.

## Laravel-Specific Assumptions Not Carried Over

- Laravel/PHP tags are not required for skills.
- Laravel family names such as Form Requests, Eloquent, Blade, Livewire, Horizon, and migrations are not core taxonomy families.
- Laravel specialists are not bundled; they are discovered externally when installed.
- Candidate B thresholds informed the architecture, but the routing schema is generalized and not copied as Laravel-specific config.

## Runtime Components

- `skills/engineer-flow/SKILL.md`: thin entrypoint.
- `scripts/engineer-flow.mjs`: discovery, registry, routing, memory preflight, and test CLI.
- `skills/memory-management/`: framework-agnostic memory infrastructure.
- Bundled fallback skills: compact general specialists used only when no stronger installed skill exists.
- `tests/routing-scenarios.json`: deterministic development routing scenarios.

## v0.1 Scope

This release focuses on local file-aware agents, local skill discovery, deterministic routing heuristics, and self-tests. It intentionally defers remote registries, dashboards, distributed agent delegation, and vector databases.
