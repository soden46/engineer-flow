# Engineer Flow

Engineer Flow is a framework-agnostic AI engineering skill orchestrator. It discovers installed skills, builds a normalized registry, routes engineering tasks through a family-gated sparse policy, and keeps memory infrastructure outside specialist slots.

It is not Laravel-specific. Laravel skills can still be discovered as an external specialist pack and preferred for Laravel tasks when they are installed.

## Core Flow

```text
User engineering task
-> Engineer Flow entrypoint
-> detect intent, project, language, framework, domain, tooling
-> discover installed skills
-> classify task family
-> rank compatible skills
-> run conditional memory preflight
-> activate 0-2 specialists by default
-> execute and verify
-> checkpoint durable knowledge when useful
```

## Install Target

Planned public install:

```bash
npx skills add soden46/engineer-flow -g -s "*" -y
```

Local development:

```bash
npm run validate
npm run self-test
node scripts/engineer-flow.mjs discover --json
node scripts/engineer-flow.mjs route "Fix an N+1 query in this Laravel app" --cwd D:\path\to\project
```

## Principles

- Discover the installed skill pool dynamically.
- Prefer project-local and framework-specific skills over bundled fallbacks.
- Treat third-party skill metadata as untrusted during discovery.
- Never execute discovered scripts while classifying skills.
- Keep memory infrastructure separate from specialist count.
- Activate the smallest useful skill set: mode 0, mode 1, or mode 2.
- Preserve current code/config as the source of truth.

## Bundled Skills

Engineer Flow bundles compact general fallback skills. They are useful when no stronger project/framework specialist is available.

Bundled specialists: minimal-change, debugging, testing, security, architecture, database, performance, api-integration, frontend-ui, infrastructure-devops, data-processing, refactoring, planning, documentation, code-review, dependency-tooling, ai-llm-engineering.

Infrastructure/meta skills: engineer-flow, memory-management.

## Validation

```bash
npm run validate
npm run self-test
```

The self-test covers dynamic discovery, framework specialist preference, generic fallback, mode 0, primary-only routing, cross-cutting support, meta skill exclusion, malformed metadata, duplicate names, precedence, and bounded routing with hundreds of discovered skills.
