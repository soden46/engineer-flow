<h1 align="center">Engineer Flow</h1>

<p align="center">
  <strong>Framework-agnostic engineering orchestration for AI coding agents.</strong>
</p>

<p align="center">
  Route each task to the smallest relevant capability set, combine generalized engineering knowledge with user-installed specialist skills, and finish development with mandatory security verification.
</p>

<p align="center">
  <a href="https://agentskills.io/">
    <img alt="Agent Skills" src="https://img.shields.io/badge/Agent_Skills-compatible-2563EB?style=for-the-badge">
  </a>
  <img alt="Framework Agnostic" src="https://img.shields.io/badge/framework-agnostic-7C3AED?style=for-the-badge">
  <img alt="Internal Capabilities" src="https://img.shields.io/badge/internal_capabilities-16-0891B2?style=for-the-badge">
  <img alt="Security Gate" src="https://img.shields.io/badge/security_gate-enabled-059669?style=for-the-badge">
  <a href="https://github.com/soden46/engineer-flow/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/license-MIT-0284C7?style=for-the-badge">
  </a>
  <a href="https://github.com/soden46/engineer-flow/stargazers">
    <img alt="GitHub Stars" src="https://img.shields.io/github/stars/soden46/engineer-flow?style=for-the-badge">
  </a>
</p>

<p align="center">
  <strong>
    Generalized engineering core · Sparse specialist routing · External Agent Skills · Security before completion
  </strong>
</p>

---

## Overview

**Engineer Flow** is an engineering orchestration layer for AI coding agents.

It is designed for a common problem in modern AI-assisted development: the more skills, rules, and specialist instructions an agent has access to, the easier it becomes to activate too much context, route tasks to the wrong specialist, or couple otherwise reusable engineering guidance to one framework.

Engineer Flow takes a different approach.

Instead of treating every framework, language, and tool as a separate root workflow, it separates:

- generalized engineering concerns
- user-installed specialist skills
- project-specific evidence
- implementation context
- verification
- post-development security review

The result is a workflow that can understand a database problem as a **database problem**, a performance issue as a **performance issue**, and a testing problem as a **testing problem** before introducing stack-specific knowledge.

Technology-specific expertise can then come from the project itself or from compatible Agent Skills already installed by the user.

The goal is simple:

> **Use the right engineering capability at the right time, make the smallest correct change, and verify security before declaring the work complete.**

---

## Table of Contents

- [Overview](#overview)
- [Why Engineer Flow](#why-engineer-flow)
- [How It Works](#how-it-works)
- [Core Architecture](#core-architecture)
- [Internal Engineering Capabilities](#internal-engineering-capabilities)
- [Sparse Specialist Routing](#sparse-specialist-routing)
- [External Skill Discovery](#external-skill-discovery)
- [Routing Behavior](#routing-behavior)
- [Project Context](#project-context)
- [Minimal Change Discipline](#minimal-change-discipline)
- [Bounded Exploration](#bounded-exploration)
- [Mandatory Security Verification](#mandatory-security-verification)
- [Security Coverage](#security-coverage)
- [Commit-Aware Security Gate](#commit-aware-security-gate)
- [Installation](#installation)
- [Manual Installation](#manual-installation)
- [Quick Start](#quick-start)
- [Resolver CLI](#resolver-cli)
- [Examples](#examples)
- [Repository Structure](#repository-structure)
- [Compatibility](#compatibility)
- [Development](#development)
- [Validation](#validation)
- [Design Principles](#design-principles)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security Philosophy](#security-philosophy)
- [License](#license)

---

## Why Engineer Flow?

AI coding agents are increasingly capable of reading large repositories, loading skills dynamically, using tools, and following reusable workflows.

But more capability does not automatically mean better engineering.

As the number of installed skills grows, agents can fail in predictable ways:

- activating too many specialists for a small task
- routing from weak keyword matches
- selecting a framework-specific skill when the task is generic
- ignoring useful user-installed skills
- over-exploring the repository before making a small change
- introducing unnecessary abstractions
- rewriting more code than the task requires
- treating generated code as proof of correctness
- skipping security review after implementation
- coupling reusable engineering principles to one technology

Engineer Flow is designed around the opposite set of behaviors:

```text
Understand first.
Concern before technology.
Use the smallest relevant capability set.
Prefer project evidence.
Reuse before invention.
Keep changes focused.
Verify behavior.
Verify security.
```

---

## How It Works

```text
User Task
   |
   v
Engineer Flow
   |
   +-- Internal generalized capabilities
   |
   +-- User-installed external Agent Skills
   |
   v
Relevant capability selection
   |
   |  max 2 development specialists
   v
Project context + available specialist skills
   |
   v
Development
   |
   v
Mandatory Security Review
   |
   +-- PASS -----------------> Done
   |
   +-- NEEDS_FIX --> Fix --> Re-test
```

Engineer Flow is not a framework.

It is not a replacement for Laravel knowledge, Odoo knowledge, Spring Boot knowledge, Flutter knowledge, ML knowledge, or any other specialist domain.

It is the orchestration layer that decides:

- what engineering concern is actually present
- what capability is relevant
- whether an external specialist adds real value
- how many specialists should be active
- when project-native evidence should take precedence
- what must be verified before completion

---

## Core Architecture

Engineer Flow combines three main layers.

### 1. Generalized engineering capabilities

Engineer Flow ships with 16 internal capabilities that cover reusable software engineering concerns.

These capabilities remain framework and language agnostic.

They describe what good engineering requires, not how one specific framework implements it.

### 2. User-installed external Agent Skills

Engineer Flow can discover compatible Agent Skills already installed by the user.

This means technology-specific expertise does not need to be hardcoded into Engineer Flow.

A user can install specialist skills for their preferred stack, tools, framework, platform, or domain.

Engineer Flow can then route to those skills only when the task provides enough evidence that they are relevant.

### 3. Mandatory post-development security

Security is a required verification stage after implementation.

It does not consume one of the normal development specialist slots.

Development is not considered complete until the security review reaches an acceptable final state.

---

## Internal Engineering Capabilities

Engineer Flow currently contains **16 generalized engineering capabilities**.

| Capability | Responsibility |
|---|---|
| `architecture` | boundaries, modularity, dependency direction, system structure, interfaces |
| `api-integration` | API contracts, integrations, request and response behavior, resilience |
| `database` | persistence, transactions, queries, schema design, integrity |
| `testing` | regression protection, test strategy, behavior verification |
| `performance` | runtime efficiency, memory usage, query performance, bottlenecks |
| `debugging` | reproduction, failure tracing, root-cause analysis |
| `code-quality-refactoring` | maintainability, simplification, safe refactoring |
| `data-processing` | transformations, pipelines, imports, exports, large datasets |
| `dependency-tooling` | packages, dependency management, builds, development tooling |
| `infrastructure-devops` | deployment, runtime, containers, infrastructure, operations |
| `version-control-review` | Git workflows, diffs, review discipline, change hygiene |
| `planning-execution` | implementation planning, sequencing, bounded execution |
| `documentation` | technical documentation, maintainable knowledge, project guidance |
| `frontend-ui` | UI behavior, frontend implementation, interaction concerns |
| `ai-llm-engineering` | model training, inference, datasets, LLM engineering workflows |
| `security` | application security analysis and post-development verification |

These capabilities are intentionally broad enough to remain reusable while focused enough to be selected independently.

---

## Sparse Specialist Routing

Engineer Flow intentionally limits normal development routing to:

```text
1 primary specialist
+
1 optional support specialist
```

Maximum:

```text
2 specialists
```

This keeps task context focused.

More skills do not automatically produce better results.

A small task should remain small.

A highly focused change should not trigger five unrelated skills simply because the task contains generic words such as `database`, `api`, `test`, or `security`.

Example:

```text
Task:
Fix N+1 queries and add regression tests

Primary:
performance

Support:
testing
```

Another example:

```text
Task:
Build a transaction endpoint with validation and database persistence

Primary:
database

Support:
none
```

The post-development security review still runs afterward and does not count as a development specialist.

---

## External Skill Discovery

Engineer Flow can include user-installed Agent Skills in its capability pool.

The default shared Agent Skills directory is:

```text
~/.agents/skills/
```

Additional roots can be configured with:

```text
ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS
```

### Windows PowerShell

```powershell
$env:ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS="D:\my-skills;E:\team-skills"
```

### macOS / Linux

```bash
export ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS="/opt/team-skills:$HOME/custom-skills"
```

Engineer Flow keeps external skills native.

It does not rewrite their instructions or merge their content into the generalized core.

External skills remain first-class specialist capabilities.

---

## External Skill Selection

External skills require stronger task evidence than generalized internal capabilities.

This is important because users may have many specialized skills installed at once.

For example, a user might have skills such as:

```text
odoo-cross-platform-report-consistency
trl-training
pytorch-fsdp2
firebase-auth
firebase-database
riverpod
huggingface-datasets
playwright
react-performance
spring-security
```

A generic task like:

```text
Optimize this database query.
```

should not activate `firebase-database` merely because both contain the word `database`.

But a task like:

```text
Fix this Firebase database query and security rule.
```

contains specific evidence that a Firebase specialist may be useful.

Likewise:

```text
Fine tune this model using TRL.
```

can activate a `trl-training` specialist if one is installed.

This keeps external skills useful without allowing them to dominate generic engineering work.

---

## Routing Behavior

Engineer Flow follows a concern-first routing model.

### Generic task

```text
Task:
Fix N+1 queries.

Resolved concern:
performance
```

### Generic database task

```text
Task:
Add a transaction around these related writes.

Resolved concern:
database
```

### Generic testing task

```text
Task:
Add regression protection for this production bug.

Resolved concern:
testing
```

### Technology-specific task

```text
Task:
Fix this Odoo QWeb report so Windows and Linux output stay consistent.

Resolved specialist:
odoo-cross-platform-report-consistency

Source:
external Agent Skill
```

### Specialized ML task

```text
Task:
Fine tune this model using TRL.

Resolved specialist:
trl-training

Source:
external Agent Skill
```

---

## Project Context

Engineer Flow does not treat installed skills as the only source of truth.

The current project remains authoritative.

Useful project evidence includes:

- source code
- current configuration
- package manifests
- framework conventions already in use
- tests
- existing abstractions
- deployment configuration
- database schema
- project documentation
- established naming and module boundaries

When external guidance conflicts with current project reality, the agent should verify against the repository before applying that guidance.

The current codebase is not just an implementation target.

It is evidence.

---

## Minimal Change Discipline

Engineer Flow includes a strong minimal-change bias.

The goal is not to produce the most code.

The goal is to solve the task correctly with the smallest reasonable change.

Prefer:

```text
existing project convention
before new convention

native feature
before new dependency

existing dependency
before adding another package

small helper
before new subsystem

focused diff
before repository-wide rewrite

reuse
before abstraction

clear code
before clever code
```

Minimal change does not mean avoiding necessary work.

It means avoiding unnecessary work.

---

## Bounded Exploration

AI coding agents can waste time and context by searching too broadly.

Engineer Flow encourages bounded exploration.

Explore until the agent understands:

- the execution path
- the affected behavior
- relevant callers
- important contracts
- data flow
- likely regression surface
- verification surface

Then implement.

Do not scan the entire repository when a small, well-defined execution path is sufficient.

Broader exploration is justified when:

- architecture is unclear
- behavior crosses multiple modules
- security boundaries are involved
- the failure cannot be reproduced locally
- shared contracts may be affected
- the change carries high regression risk

---

## Mandatory Security Verification

Security is not treated as an optional final suggestion.

After development, Engineer Flow invokes the generalized security capability:

```text
core/security/SKILL.md
```

The security review must finish with exactly one final state:

```text
SECURITY REVIEW: PASS
```

or:

```text
SECURITY REVIEW: NEEDS_FIX
```

When actionable issues remain:

```text
NEEDS_FIX
   |
   v
Fix root cause
   |
   v
Add regression protection when appropriate
   |
   v
Re-test
   |
   v
Security review
   |
   v
PASS
```

Security verification does not consume one of the two normal development specialist slots.

---

## Security Coverage

The security capability includes guidance for areas such as:

- authentication
- session handling
- authorization
- IDOR
- input validation
- SQL injection
- command injection
- template injection
- cross-site scripting
- output context handling
- CSRF
- SSRF
- unsafe outbound requests
- file uploads
- path traversal
- archive handling
- secret exposure
- token handling
- API exposure
- mass assignment
- rate limiting
- resource abuse
- webhook authenticity
- webhook replay
- idempotency
- sensitive logging
- error handling
- dependency risk
- configuration risk
- cryptographic misuse
- unsafe defaults

Security findings should be evidence-based.

Engineer Flow distinguishes between:

```text
confirmed vulnerability
likely vulnerability
hardening opportunity
informational finding
```

Do not report speculative findings as confirmed vulnerabilities.

Dynamic verification should remain:

```text
authorized
scoped
minimal
non-destructive
evidence-driven
```

---

## Direct Security Tasks

Security normally runs after development.

However, security can also become the primary capability when security itself is the task.

Example:

```text
Audit this endpoint for authorization bypass, IDOR, SSRF,
and unsafe outbound requests.
```

In this case:

```text
Primary:
security
```

If remediation is performed, the final security verification still runs again before completion.

---

## Commit-Aware Security Gate

Engineer Flow includes an optional staged-diff security gate.

The gate is implemented by:

```text
skills/engineer-flow/scripts/security-gate.mjs
```

It works against the **exact staged Git diff**.

The gate:

1. reads the current staged diff
2. calculates a SHA-256 hash
3. records the changed files
4. creates a security review request
5. associates the result with the exact diff hash
6. blocks commit while review is missing
7. blocks commit when actionable security issues remain
8. automatically invalidates old approval when the staged diff changes

Example:

```bash
node skills/engineer-flow/scripts/security-gate.mjs check --cwd .
```

Possible output:

```text
SECURITY_GATE=REVIEW_REQUIRED
DIFF_SHA256=<hash>

Commit blocked until this exact staged diff receives
SECURITY REVIEW: PASS.
```

A PASS for one staged diff cannot silently authorize another diff.

---

## Install the Git Security Gate

Engineer Flow includes a PowerShell helper:

```text
skills/engineer-flow/scripts/install-security-gate.ps1
```

Example:

```powershell
.\skills\engineer-flow\scripts\install-security-gate.ps1 `
  -Project "C:\path\to\your\project"
```

The installer creates or integrates with the target repository's Git pre-commit hook.

If another pre-commit hook already exists, Engineer Flow preserves it and runs the previous hook before the security gate.

The hook does not replace the engineering workflow.

It enforces the final security boundary.

---

## Installation

### npx skills - recommended

Engineer Flow is distributed as one Agent Skill package.

List the skill exposed by this repository:

```bash
npx skills add soden46/engineer-flow --list
```

Install Engineer Flow globally:

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -g -y
```

### OpenAI Codex

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -g -a codex -y
```

### Claude Code

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -g -a claude-code -y
```

### Kilo Code

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -g -a kilo -y
```

### Install into the current project

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -y
```

### View installed skills

```bash
npx skills list
```

### Check for updates

```bash
npx skills check
```

### Update installed skills

```bash
npx skills update
```

The 16 generalized capabilities are internal implementation components of the root `engineer-flow` skill.

Users install **Engineer Flow once**, not each internal capability individually.

---

## Why Engineer Flow Is Packaged as One Skill

Engineer Flow is not intended to be a marketplace of 16 independent skills.

The internal capabilities are coordinated by the root orchestration workflow.

Packaging Engineer Flow as one root Agent Skill keeps installation simple:

```text
install engineer-flow
```

instead of:

```text
install architecture
install database
install testing
install performance
install security
...
```

The user interacts with one engineering workflow.

The internal capability router decides what to load.

---

## Manual Installation

You can also install Engineer Flow manually.

### Windows PowerShell

Clone the repository:

```powershell
git clone https://github.com/soden46/engineer-flow.git
```

Then copy:

```text
skills/engineer-flow/
```

into the Agent Skills directory used by your coding agent.

A common shared location is:

```text
%USERPROFILE%\.agents\skills\engineer-flow
```

### macOS / Linux

```bash
git clone https://github.com/soden46/engineer-flow.git
```

Then copy:

```text
skills/engineer-flow/
```

into:

```text
~/.agents/skills/engineer-flow
```

---

## Quick Start

Once installed, ask your coding agent to use Engineer Flow.

Example:

```text
Use Engineer Flow for this task.

Fix the N+1 query problem in this endpoint and add regression protection.
```

Another example:

```text
Use Engineer Flow.

Investigate this production error, identify the root cause,
make the smallest safe fix, verify the behavior,
then perform the mandatory security review.
```

Another example:

```text
Use Engineer Flow.

Review the staged changes, verify the implementation,
then complete the post-development security review.
```

For agents that automatically discover Agent Skills, explicitly naming Engineer Flow may not be necessary once the skill is available.

---

## Resolver CLI

Engineer Flow includes a lightweight resolver:

```text
skills/engineer-flow/scripts/engineer-flow.mjs
```

### Self-test

```bash
node skills/engineer-flow/scripts/engineer-flow.mjs self-test
```

Expected output:

```text
SELF_TEST_PASS=YES
INTERNAL_SKILLS=16
EXTERNAL_SKILLS=<detected>
EFFECTIVE_CAPABILITIES=<effective>
MAX_SPECIALISTS=2
POST_DEVELOPMENT_SECURITY=ENABLED
```

### Inventory

Inspect the capability pool:

```bash
node skills/engineer-flow/scripts/engineer-flow.mjs inventory
```

The inventory includes:

- internal generalized capabilities
- externally discovered Agent Skills
- effective capability count after deduplication

### Resolve a task

```bash
node skills/engineer-flow/scripts/engineer-flow.mjs resolve \
  --task "Fix N+1 queries and add regression tests" \
  --cwd .
```

Example:

```text
primary
+-- performance

support
+-- testing

post-development
+-- security
```

---

## Examples

### Generic database task

```text
Task:
Build a transaction endpoint with validation and database persistence

Primary:
database

Post-development:
security
```

### Performance task

```text
Task:
Fix N+1 queries and reduce unnecessary database calls

Primary:
performance

Possible support:
database

Post-development:
security
```

### Testing task

```text
Task:
Add regression protection for this production bug

Primary:
testing

Post-development:
security
```

### Debugging task

```text
Task:
Investigate why this command succeeds locally but fails in production

Primary:
debugging

Possible support:
infrastructure-devops

Post-development:
security
```

### API task

```text
Task:
Add retry and timeout handling to this external API integration

Primary:
api-integration

Possible support:
testing

Post-development:
security
```

### Architecture task

```text
Task:
Split this module without changing behavior or introducing unnecessary abstractions

Primary:
architecture

Possible support:
code-quality-refactoring

Post-development:
security
```

### Odoo-specific task

If an appropriate external skill is installed:

```text
Task:
Fix an Odoo cross-platform report consistency issue

Primary:
odoo-cross-platform-report-consistency

Source:
external Agent Skill

Post-development:
security
```

### TRL training task

If a TRL specialist is installed:

```text
Task:
Fine tune this model using TRL

Primary:
trl-training

Source:
external Agent Skill

Post-development:
security
```

### Firebase task

If a Firebase specialist is installed:

```text
Task:
Fix this Firebase authentication flow and review the security rules

Primary:
firebase-auth

Source:
external Agent Skill

Post-development:
security
```

---

## Repository Structure

```text
engineer-flow/
|
+-- README.md
+-- LICENSE
+-- package.json
+-- agent-skills.json
|
`-- skills/
    `-- engineer-flow/
        |
        +-- SKILL.md
        |
        +-- core/
        |   +-- core-manifest.json
        |   |
        |   +-- architecture/
        |   +-- api-integration/
        |   +-- database/
        |   +-- testing/
        |   +-- performance/
        |   +-- debugging/
        |   +-- code-quality-refactoring/
        |   +-- data-processing/
        |   +-- dependency-tooling/
        |   +-- infrastructure-devops/
        |   +-- version-control-review/
        |   +-- planning-execution/
        |   +-- documentation/
        |   +-- frontend-ui/
        |   +-- ai-llm-engineering/
        |   `-- security/
        |
        `-- scripts/
            +-- engineer-flow.mjs
            +-- security-gate.mjs
            `-- install-security-gate.ps1
```

---

## Framework Agnostic by Design

Engineer Flow does not ship privileged built-in framework behavior.

The generalized core should not treat one framework as more important than another.

Instead:

```text
Engineer Flow
   |
   +-- generalized engineering capabilities
   |
   +-- project evidence
   |
   `-- user-installed specialist skills
```

This allows one root workflow to operate across different ecosystems without duplicating the entire engineering methodology for every framework.

For example:

```text
Laravel-specific expertise
-> external Laravel skill

Odoo-specific expertise
-> external Odoo skill

Spring-specific expertise
-> external Spring skill

Flutter-specific expertise
-> external Flutter skill

ML training expertise
-> external ML skill
```

Engineer Flow remains the orchestrator.

---

## Compatibility

Engineer Flow follows the Agent Skills model built around `SKILL.md`.

It is designed for compatible AI coding environments and generic agents capable of reading Agent Skills.

Target environments include:

```text
OpenAI Codex
Claude Code
Kilo Code
Cursor
Gemini CLI
OpenCode
Windsurf
Cline
Roo Code
Continue
Hermes Agent
Aider
and other Agent Skills-compatible tools
```

Host-specific installation behavior may vary.

Some agents may support automatic skill discovery.

Others may require explicit activation.

Some may support tools or hooks that others do not.

The engineering orchestration model itself remains agent-independent.

---

## Agent Skills

Engineer Flow follows the open Agent Skills approach.

An Agent Skill is a folder containing a `SKILL.md` file with instructions and metadata, optionally accompanied by scripts, references, templates, assets, or other resources.

Engineer Flow is packaged as one root Agent Skill because its internal capabilities work together as a coordinated engineering system.

Learn more:

https://agentskills.io/

---

## Development

Clone the repository:

```bash
git clone https://github.com/soden46/engineer-flow.git
cd engineer-flow
```

Run the self-test:

```bash
npm run self-test
```

Inspect capabilities:

```bash
npm run inventory
```

Check Agent Skills discovery:

```bash
npm run skills:list
```

---

## Validation

Before publishing changes, verify the runtime.

### Resolver syntax

```bash
node --check skills/engineer-flow/scripts/engineer-flow.mjs
```

### Security gate syntax

```bash
node --check skills/engineer-flow/scripts/security-gate.mjs
```

### Self-test

```bash
node skills/engineer-flow/scripts/engineer-flow.mjs self-test
```

Expected invariants:

```text
INTERNAL_SKILLS=16
MAX_SPECIALISTS=2
POST_DEVELOPMENT_SECURITY=ENABLED
```

### Generic routing smoke test

```bash
node skills/engineer-flow/scripts/engineer-flow.mjs resolve \
  --task "Fix N+1 queries and add regression tests" \
  --cwd .
```

Expected behavior:

```text
primary:
performance

post-development:
security
```

### Agent Skills discovery

```bash
npx skills add . --list
```

The public install surface should expose the root `engineer-flow` skill rather than requiring users to install internal capabilities separately.

---

## Design Principles

### Concern before technology

A database problem should first be understood as a database problem.

A performance problem should first be understood as a performance problem.

A testing problem should first be understood as a testing problem.

Technology-specific expertise is loaded only when it materially improves the task.

### Sparse over broad activation

More skills do not automatically produce better engineering.

Engineer Flow activates only the smallest relevant specialist set.

### External skills are first-class

User-installed Agent Skills extend the capability pool.

Engineer Flow is not a closed catalog.

### Project evidence stays authoritative

Installed instructions should not blindly override the current codebase.

Verify against current project reality.

### Internal capabilities remain generalized

Framework-specific implementation knowledge should not be permanently coupled to the generalized engineering core.

### Minimal correct change

Prefer the smallest correct implementation over unnecessary abstraction or broad rewrites.

### Bounded exploration

Explore until the execution path, affected behavior, contracts, callers, and verification surface are understood.

Then implement.

### Evidence before claims

Do not treat generated code as proof of correctness.

Verify behavior using the strongest practical evidence available.

### Security before completion

Development is not complete until the final security verification stage passes.

---

## Routing Philosophy

Engineer Flow intentionally avoids treating every keyword as strong evidence.

Words such as:

```text
database
api
test
security
performance
model
service
integration
```

are common across many skills.

A specialized external skill should require stronger evidence than a generic word match.

This reduces false-positive routing and keeps generic engineering tasks inside the generalized core.

The goal is not perfect semantic classification.

The goal is reliable, conservative capability activation.

---

## Failure Handling

Engineer Flow should not hide uncertainty.

When the task cannot be resolved confidently:

- inspect project evidence
- prefer a generalized capability
- avoid activating unrelated specialists
- ask for clarification only when the missing information materially blocks progress

When verification fails:

```text
do not claim completion
```

When security review returns:

```text
SECURITY REVIEW: NEEDS_FIX
```

the workflow continues until the issue is fixed or explicitly left unresolved.

---

## Security Philosophy

Engineer Flow treats security as an engineering quality boundary, not as a separate afterthought.

Security review should:

- focus on changed behavior first
- inspect reachable surrounding code when necessary
- trace source to transformation to authorization to sink
- distinguish evidence from speculation
- fix root causes instead of hiding symptoms
- add regression protection where appropriate
- avoid destructive verification
- preserve authorization boundaries
- avoid persisting secrets
- avoid unsafe assumptions

The security gate exists to reinforce one rule:

> **A change is not done merely because it compiles or passes a happy-path test.**

---

## Roadmap

- [x] Framework and language agnostic engineering core
- [x] 16 generalized engineering capabilities
- [x] Sparse specialist routing
- [x] User-installed Agent Skill discovery
- [x] External skill false-positive protection
- [x] Mandatory post-development security verification
- [x] Commit-aware staged-diff security gate
- [x] Agent Skills-compatible package structure
- [x] npx skills installation flow
- [ ] Automated GitHub Actions validation
- [ ] Cross-platform security gate installer
- [ ] Additional compatibility tests
- [ ] More real-world routing examples
- [ ] Release automation
- [ ] skills.sh listing
- [ ] Additional documentation
- [ ] Visual architecture diagram
- [ ] Optional installer helpers for more agent environments

---

## Contributing

Contributions are welcome.

Engineer Flow should remain:

- framework agnostic
- language agnostic
- focused on reusable engineering concerns
- compatible with sparse specialist activation
- friendly to external Agent Skills
- evidence-driven
- security-aware
- conservative about context expansion
- minimal-change oriented

Framework-specific expertise should generally live in a separate Agent Skill that Engineer Flow can discover rather than being embedded directly into the generalized core.

Good contributions should:

1. solve a reusable engineering problem
2. avoid unnecessary framework coupling
3. preserve project evidence as an important source of truth
4. preserve sparse specialist activation
5. avoid weakening security requirements
6. avoid inflating context without clear value
7. include clear verification expectations
8. remain understandable to multiple coding agents where possible

Changes should preserve:

```text
MAX_SPECIALISTS=2
POST_DEVELOPMENT_SECURITY=ENABLED
```

---

## Philosophy

```text
Understand before editing.

Concern before technology.

Reuse before invention.

Minimal change before unnecessary abstraction.

Sparse skills before skill overload.

Project evidence before assumptions.

Verification before claims.

Security before completion.
```

Engineer Flow is not trying to make an AI coding agent know everything at once.

It is trying to make the agent use the **right engineering capability at the right time**.

---

## License

Engineer Flow is released under the MIT License.

See [LICENSE](LICENSE).

---

<p align="center">
  <strong>Engineer Flow</strong>
</p>

<p align="center">
  The right engineering capability, at the right time, with security before completion.
</p>
