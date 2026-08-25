<h1 align="center">Engineer Flow</h1>

<p align="center">
  <strong>Framework-agnostic AI engineering control plane for AI coding agents.</strong>
</p>

<p align="center">
  More engineering knowledge. Less active context.
</p>

<p align="center">
  <strong>72 specialized workflows analyzed and distilled into 16 generalized engineering capabilities -> 0-2 active specialists per task</strong>
</p>

<p align="center">
  <a href="https://agentskills.io/">
    <img alt="Agent Skills" src="https://img.shields.io/badge/Agent_Skills-compatible-2563EB?style=for-the-badge">
  </a>
  <a href="https://github.com/soden46/engineer-flow/releases">
    <img alt="Version" src="https://img.shields.io/badge/version-0.2.0-7C3AED?style=for-the-badge">
  </a>
  <img alt="Framework Agnostic" src="https://img.shields.io/badge/framework-agnostic-0891B2?style=for-the-badge">
  <img alt="Internal Capabilities" src="https://img.shields.io/badge/capabilities-16-0284C7?style=for-the-badge">
  <img alt="Specialists" src="https://img.shields.io/badge/active_specialists-0--2-059669?style=for-the-badge">
  <img alt="Security Gate" src="https://img.shields.io/badge/security_review-mandatory-16A34A?style=for-the-badge">
  <a href="https://github.com/soden46/engineer-flow/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/license-MIT-0EA5E9?style=for-the-badge">
  </a>
  <a href="https://github.com/soden46/engineer-flow/stargazers">
    <img alt="GitHub Stars" src="https://img.shields.io/github/stars/soden46/engineer-flow?style=for-the-badge">
  </a>
</p>

<p align="center">
  <strong>Concern-first routing | Project-aware discovery | Sparse specialists | Persistent memory | Minimal-change engineering | Mandatory security</strong>
</p>

---

## Contents

- [Why Engineer Flow?](#why-engineer-flow)
- [Quick Install](#quick-install)
- [Quick Start](#quick-start)
- [What Makes Engineer Flow Different?](#what-makes-engineer-flow-different)
- [How It Works](#how-it-works)
- [Core Capabilities](#core-capabilities)
- [Project-Aware Routing](#project-aware-routing)
- [Browser-Driven UI](#browser-driven-ui)
- [External Skills](#external-skills)
- [Persistent Memory](#persistent-memory)
- [Minimal-Change Engineering](#minimal-change-engineering)
- [Verification](#verification)
- [Mandatory Security](#mandatory-security)
- [Repository Structure](#repository-structure)
- [Development](#development)
- [Benchmarks](#benchmarks)
- [Compatibility](#compatibility)
- [Releases](#releases)
- [Roadmap](#roadmap)
- [Security Philosophy](#security-philosophy)
- [License](#license)

---

## Why Engineer Flow?

Engineer Flow turns a broad engineering knowledge base into a small, context-efficient decision system for AI coding agents.

Modern coding agents can access more skills, rules, tools, project instructions, and specialized knowledge than ever. The problem is that more available knowledge does not automatically produce better engineering.

Without a control layer, an agent can:

- load too much context
- activate unrelated skills
- treat a framework keyword as the whole problem
- miss useful specialist knowledge already installed by the user
- over-explore a repository
- introduce unnecessary abstractions
- make a larger change than the task requires
- patch symptoms instead of root causes
- claim completion without enough verification
- skip security review

Engineer Flow takes the opposite approach.

It compresses a broad range of proven engineering workflows into 16 generalized capabilities, detects the actual engineering concern, combines that concern with project evidence and compatible external Agent Skills, and activates only the smallest capability set required.

```text
72 specialized workflows analyzed during generalization
        |
        v
16 generalized engineering capabilities
        |
        v
project evidence + task intent + installed skills
        |
        v
0-2 active development specialists
        |
        v
implementation
        |
        v
verification
        |
        v
mandatory security review
```

Engineer Flow is designed around one principle:

> Use as much engineering knowledge as necessary, but as little active context as possible.

---

## Quick Install

Recommended:

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -g -y
```

Codex:

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -g -a codex -y
```

Claude Code:

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -g -a claude-code -y
```

Kilo Code:

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -g -a kilo -y
```

The public Agent Skill entrypoint is:

```text
skills/engineer-flow/SKILL.md
```

The repository also contains tests, benchmark artifacts, release notes, docs, and validation scripts. The installed skill surface is intentionally smaller than the full development repository.

---

## Quick Start

After installation, ask your coding agent to use Engineer Flow for engineering work:

```text
Use Engineer Flow to fix this bug.
```

You can also provide the task directly when your agent supports automatic Agent Skill discovery:

```text
This endpoint occasionally creates duplicate orders under concurrency.
Find the root cause and fix it without changing unrelated behavior.
```

Engineer Flow will route from the engineering concern first, inspect bounded project evidence, activate an external stack specialist only when it provides meaningful additional context, make the smallest correct change, verify the result, and finish with mandatory security review.

---

## What Makes Engineer Flow Different?

### Broad Knowledge, Compact Execution

Engineer Flow's architecture was shaped by analyzing 72 specialized engineering workflows and separating reusable engineering principles from stack-specific implementation details.

Those reusable principles were consolidated into a compact generalized model:

```text
72 specialized workflows
        |
        v
16 generalized capabilities
        |
        v
0-2 active specialists
```

The goal is not to maximize the number of loaded skills.

The goal is to maximize relevant engineering signal per active context token.

### Concern Before Technology

Engineer Flow starts with:

```text
What engineering problem is this?
```

before:

```text
What framework is this?
```

Examples:

| Task signal | Primary engineering concern |
| --- | --- |
| N+1 query | Performance |
| Transaction consistency | Database |
| Production exception | Debugging |
| Regression coverage | Testing |
| Module boundary | Architecture |
| API retry behavior | API & Integration |
| Release checklist | Infrastructure & DevOps |
| README correction | Documentation |

Technology-specific knowledge is introduced only after the engineering concern is understood.

### Sparse Specialist Activation

Normal development routing is deliberately capped at:

```text
1 primary specialist
+
1 optional support specialist
=
maximum 2 development specialists
```

A task can also use zero specialists when specialist context provides no meaningful value.

Mandatory post-development security review does not consume one of those two development specialist slots.

### External Skill Discovery

Engineer Flow does not need to contain every possible technology specialist.

Compatible user-installed Agent Skills can become part of the capability pool dynamically. That means Engineer Flow can stay small while the user's specialist ecosystem keeps growing.

### Evidence-Based Completion

Implementation output is not proof that a task is complete.

Engineer Flow expects verification appropriate to the risk and behavior being changed, then a mandatory security review before completion.

---

## How It Works

```text
User Task
   |
   v
Engineer Flow Orchestrator
   |
   +-- task intent
   +-- bounded project evidence
   +-- relevant persistent memory, when useful
   +-- internal generalized capabilities
   +-- compatible external Agent Skills
   |
   v
Sparse Routing
   |
   +-- 0 specialists
   +-- 1 primary specialist
   +-- 1 primary + 1 support specialist
   |
   v
Development
   |
   v
Verification
   |
   v
Mandatory Security Review
   |
   +-- PASS
   |
   +-- NEEDS_FIX -> fix -> re-test -> security review
```

Engineer Flow separates four concerns that are often mixed together in AI coding systems.

### 1. Generalized Engineering Knowledge

Universal software-engineering concerns belong in the internal core.

These capabilities remain framework and language agnostic.

### 2. Technology-Specific Expertise

Framework-, library-, platform-, tool-, and domain-specific knowledge can remain in external Agent Skills.

Engineer Flow discovers and routes to those skills when relevant.

### 3. Project Evidence

The current repository is evidence.

Its code, configuration, manifests, tests, schema, conventions, and structure can affect routing and implementation decisions.

### 4. Control & Verification Layer

Persistent memory operates as infrastructure outside specialist slots, while mandatory post-development security acts as a final verification gate.

---

## Core Capabilities

Engineer Flow currently ships 16 generalized internal capabilities.

The canonical registry lives at:

```text
skills/engineer-flow/core/core-manifest.json
```

Capability details live under:

```text
skills/engineer-flow/core/<capability>/SKILL.md
```

| Capability | Handles |
| --- | --- |
| Architecture | Boundaries, dependency direction, modularity, interfaces, adapters, orchestration, and failure isolation. |
| API & Integration | API contracts, external clients, webhooks, pagination, retries, timeouts, idempotency, and provider boundaries. |
| Database | Schema, queries, transactions, consistency, locking, concurrency, migrations, and data integrity. |
| Testing | Unit, integration, contract, browser, Playwright, end-to-end, responsive, visual, regression, and risk-aware verification strategy. |
| Performance | Latency, throughput, query count, N+1 issues, caching, memory pressure, batching, and resource use. |
| Debugging | Reproduction, logs, stack traces, state inspection, data-flow tracing, hypotheses, and root-cause analysis. |
| Code Quality & Refactoring | Duplication, naming, responsibilities, side effects, nesting, maintainability, and behavior-preserving restructuring. |
| Data Processing | Imports, exports, transformations, files, large datasets, batching, malformed records, retries, and resumability. |
| Dependency & Tooling | Package changes, build tooling, lockfiles, runtime compatibility, upgrades, dependency removal, and maintenance risk. |
| Infrastructure & DevOps | Deployment, CI/CD, containers, workers, schedulers, health checks, observability, rollout, and rollback. |
| Version Control & Review | Diffs, commits, branches, merges, review workflow, change isolation, and staged-work awareness. |
| Planning & Execution | Ordered implementation plans, task decomposition, risk sequencing, and verifiable execution steps. |
| Documentation | README files, setup guides, runbooks, architecture notes, release notes, and accurate developer documentation. |
| Frontend UI | Usability, accessibility, browser-driven inspection, reference-driven UI reconstruction, screenshots, DOM/accessibility trees, responsive behavior, state, rendering, layout, and interaction behavior. |
| AI & LLM Engineering | LLM integrations, agents, prompts, embeddings, retrieval, evaluation, model workflows, AI pipelines, structured outputs, and tool boundaries. |
| Security | Security boundaries, authentication, authorization, validation, injection, sensitive data, configuration, dependencies, and review gates. |

Internal capabilities describe universal engineering concerns. Stack-specific implementation details should come from project evidence, native mechanisms, or compatible external skills.

---

## Project-Aware Routing

The user does not always need to name the framework in the prompt.

Engineer Flow can use bounded project evidence, such as dependency manifests, to determine whether an installed specialist is relevant.

Example:

```text
Task:
Fix the validation flow and add regression protection.

Prompt:
Does not mention Laravel.

Project evidence:
composer.json contains laravel/framework.

Installed external skill:
laravel-development.

Result:
The Laravel specialist may become relevant through project evidence.
```

No hardcoded framework-routing table is required.

Current code and configuration remain authoritative over stale memory, generic assumptions, or broad skill descriptions.

---

## Browser-Driven UI

Browser-driven UI work belongs to the existing `frontend-ui` capability, not a new core.

When a browser-capable tool is available, Engineer Flow can inspect the rendered app, screenshots, DOM structure, accessibility tree, responsive behavior, interaction states, and console/runtime UI errors before or after implementation.

For reference-driven UI reconstruction, Engineer Flow should:

1. inspect the reference website, screenshot, or design
2. extract reusable layout, spacing, typography, color, component, navigation, and interaction patterns
3. separate visual language from third-party branding, proprietary assets, and exact copy
4. inspect the target project stack and existing component system
5. map the reference direction into the project conventions
6. implement the smallest coherent UI change
7. verify the local result in desktop and mobile browser contexts

Durable browser or E2E regression coverage belongs to `testing` or a compatible external browser testing skill after the UI behavior has stabilized.

---

## External Skills

Engineer Flow can discover compatible user-installed Agent Skills from:

```text
~/.agents/skills/
```

Additional roots can be provided with:

```text
ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS
```

External skills supplement Engineer Flow instead of replacing it.

They should activate only when the task or project provides sufficiently specific technology or domain evidence.

Generic keyword overlap is not enough.

---

## Persistent Memory

Engineer Flow includes conditional persistent project memory.

Memory is useful when prior project, session, workflow, architecture, migration, benchmark, or deployment context could materially affect correctness.

Memory is not a development specialist and does not consume one of the two specialist slots.

Preferred recall order:

1. active host-provided MCP memory tool, when available
2. bundled local persistent memory fallback

Bundled memory infrastructure lives under:

```text
skills/engineer-flow/infrastructure/memory-management/
```

Memory is retrieved sparsely. Current repository evidence remains authoritative.

Durable memory must not store secrets, credentials, `.env` values, raw tokens, or personal data.

---

## Minimal-Change Engineering

Engineer Flow favors:

```text
reuse
> invention

existing pattern
> new pattern

native capability
> new dependency

focused diff
> broad rewrite

root-cause fix
> symptom patch
```

The smallest change is not automatically the best change.

The target is the smallest safe change that solves the actual root cause and preserves relevant behavior.

---

## Verification

Verification depth should follow the actual risk and behavior being changed.

Useful checks may include:

- regression tests
- targeted tests
- integration checks
- build checks
- runtime verification
- query verification
- migration validation
- browser checks
- security review

Development validation for this repository includes:

```bash
npm run validate
npm run self-test
npm run inventory
npx --yes skills add . --list
```

Expected invariants:

```text
INTERNAL_SKILLS=16
MAX_SPECIALISTS=2
POST_DEVELOPMENT_SECURITY=ENABLED
```

Additional checks used by the project include:

```bash
npm run test:browser-ui-routing
npm run test:normalization
npm run benchmark:routing
```

Previously used heldout suites should not be presented as fresh final evaluation evidence for new routing candidates.

---

## Mandatory Security

Security is not an optional afterthought.

Every development workflow ends with a security verification stage.

Security coverage includes:

- authentication and authorization
- input validation
- injection and output encoding
- request forgery protection
- CSRF and SSRF concerns
- files and path traversal
- APIs and webhooks
- sessions and tokens
- secrets and sensitive data
- logging and error disclosure
- dependencies and configuration
- rate limiting and resource abuse
- cryptographic misuse

Security verification must finish with exactly one gate result:

```text
SECURITY REVIEW: PASS
```

or:

```text
SECURITY REVIEW: NEEDS_FIX
```

When actionable findings remain:

```text
NEEDS_FIX
   |
   v
fix
   |
   v
regression protection where practical
   |
   v
re-test
   |
   v
security review again
```

Commit-aware security review can be tied to the exact staged Git diff through:

```text
skills/engineer-flow/scripts/security-gate.mjs
```

The security skill itself is:

```text
skills/engineer-flow/core/security/SKILL.md
```

---

## Repository Structure

```text
engineer-flow/
|-- skills/
|   `-- engineer-flow/
|       |-- SKILL.md
|       |-- core/
|       |   |-- architecture/
|       |   |-- api-integration/
|       |   |-- database/
|       |   |-- testing/
|       |   |-- performance/
|       |   |-- debugging/
|       |   |-- code-quality-refactoring/
|       |   |-- data-processing/
|       |   |-- dependency-tooling/
|       |   |-- infrastructure-devops/
|       |   |-- version-control-review/
|       |   |-- planning-execution/
|       |   |-- documentation/
|       |   |-- frontend-ui/
|       |   |-- ai-llm-engineering/
|       |   `-- security/
|       |-- infrastructure/
|       |   `-- memory-management/
|       `-- scripts/
|           |-- engineer-flow.mjs
|           |-- validate.mjs
|           `-- security-gate.mjs
|-- tests/
|-- benchmark-results/
|-- docs/
|-- agent-skills.json
|-- package.json
|-- RELEASE-NOTES.md
|-- CHANGELOG.md
`-- README.md
```

Runtime components:

| Component | Path |
| --- | --- |
| Root skill | `skills/engineer-flow/SKILL.md` |
| Resolver | `skills/engineer-flow/scripts/engineer-flow.mjs` |
| Validator | `skills/engineer-flow/scripts/validate.mjs` |
| Security gate | `skills/engineer-flow/scripts/security-gate.mjs` |
| Security gate installer | `skills/engineer-flow/scripts/install-security-gate.ps1` |
| Core manifest | `skills/engineer-flow/core/core-manifest.json` |

---

## Development

Engineer Flow follows several permanent design principles.

### Framework Agnostic By Default

Universal engineering principles stay in the generalized core.

Technology-specific implementation guidance stays external.

### Sparse By Default

Do not load more specialist context than the task actually needs.

### Project Evidence Matters

The repository is an evidence source, not merely an editing target.

### Current Code Is Authoritative

Current code and configuration override stale memory or generic assumptions.

### Reuse Before Invention

Existing correct project patterns should usually beat new abstractions.

### Root Cause Before Patch

Small changes should solve the underlying problem, not merely suppress symptoms.

### Verification Before Completion

Success claims require evidence appropriate to the task.

### Security Before Completion

Development is not complete while actionable security findings remain.

Before proposing a new internal capability, ask:

```text
Is this truly a new universal engineering concern?
```

If the answer is a framework, library, platform, vendor, tool, or technology-specific workflow, it is usually better represented as an external Agent Skill.

---

## Benchmarks

Engineer Flow should be evaluated as a framework-agnostic engineering orchestrator.

Routing validation covers:

- internal generalized capability discovery
- user-installed external Agent Skill discovery
- generic task routing
- technology-specific external skill routing
- false-positive protection for generic keywords
- primary-only routing
- primary plus support routing
- maximum specialist count of 2
- duplicate skill handling
- malformed external skill metadata
- self-discovery exclusion
- mandatory post-development security
- large installed-skill inventories

Final benchmark cases must have independently authored expected routing assertions.

Do not tune routing against a final heldout benchmark after evaluation begins.

Create a fresh multi-framework benchmark before claiming broad routing performance.

---

## Compatibility

Engineer Flow follows the Agent Skills model and is designed for AI coding environments that can discover or read compatible skill packages.

Dedicated install metadata is currently provided for:

- generic Agent Skills installation
- Codex
- Claude Code
- Kilo Code

Other compatible assistants can use the canonical `skills/engineer-flow/` package when they support the same skill format or can load Markdown-based Agent Skills.

---

## Releases

Current version:

```text
v0.2.0
```

Release documentation:

- [Release Notes](RELEASE-NOTES.md)
- [v0.2.0 Release](docs/releases/v0.2.0.md)
- [Changelog](CHANGELOG.md)

---

## Roadmap

Current research priorities focus on improving routing precision without increasing context size.

Potential future work:

- morphology-aware lexical matching
- stronger internal relevance ranking
- better support-specialist compatibility
- bounded deeper project evidence for complex repository layouts
- improved skill relevance signals
- continued routing robustness evaluation
- security workflow refinement

Any routing improvement should preserve:

```text
framework agnostic core
+
maximum 2 specialists
+
low false external activation
+
bounded context
+
mandatory security
```

---

## Security Philosophy

Engineer Flow treats secure engineering as part of normal software engineering.

Security is not a final cosmetic checklist. It is boundary analysis:

```text
Who controls the input?
        |
        v
Where does it travel?
        |
        v
What validation occurs?
        |
        v
What authorization occurs?
        |
        v
What sensitive operation receives it?
        |
        v
What real impact is reachable?
```

The objective is not to produce the largest vulnerability report.

The objective is to identify real risk, fix actionable findings, preserve behavior, and verify the final change.

---

## License

Engineer Flow is released under the MIT License.

<p align="center">
  <strong>Engineer Flow</strong>
</p>

<p align="center">
  More engineering knowledge. Less active context.
</p>

<p align="center">
  <strong>72 specialized workflows analyzed and distilled into 16 generalized capabilities -> 0-2 specialists per task</strong>
</p>
