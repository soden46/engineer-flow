<h1 align="center">Engineer Flow</h1>

<p align="center">
  <strong>Framework-agnostic engineering orchestration for AI coding agents.</strong>
</p>

<p align="center">
  Route each task to the smallest relevant capability set, apply stack-specific knowledge only when needed, and finish engineering work with mandatory security verification.
</p>

<p align="center">
  <a href="https://agentskills.io/">
    <img alt="Agent Skills" src="https://img.shields.io/badge/Agent_Skills-compatible-2563EB?style=for-the-badge">
  </a>
  <img alt="Framework Agnostic" src="https://img.shields.io/badge/framework-agnostic-7C3AED?style=for-the-badge">
  <img alt="Internal Skills" src="https://img.shields.io/badge/internal_skills-16-0891B2?style=for-the-badge">
  <img alt="Laravel Adapters" src="https://img.shields.io/badge/Laravel_adapters-16-DC2626?style=for-the-badge">
  <img alt="Security Gate" src="https://img.shields.io/badge/security_gate-enabled-059669?style=for-the-badge">
  <a href="https://github.com/soden46/engineer-flow/stargazers">
    <img alt="GitHub Stars" src="https://img.shields.io/github/stars/soden46/engineer-flow?style=for-the-badge">
  </a>
</p>

---

## What is Engineer Flow?

**Engineer Flow** is an engineering orchestration layer for AI coding agents.

Instead of giving an agent one giant framework-specific instruction set, Engineer Flow separates:

- **engineering concerns**
- **technology-specific implementation**
- **user-installed specialist skills**
- **security verification**

The result is a workflow that can reason about a database problem as a **database problem**, an API problem as an **API problem**, and only apply Laravel, Odoo, Flutter, Firebase, ML tooling, or another technology when the project or task actually requires it.

```text
User Task
   │
   ▼
Engineer Flow
   │
   ├── Internal generalized skills
   │
   └── User-installed external skills
   │
   ▼
Relevant capability selection
   │
   │  max 2 development specialists
   ▼
Project stack detection
   │
   ▼
Optional stack adapter
   │
   ▼
Development
   │
   ▼
Mandatory Security Review
   │
   ├── PASS ───────────────► Done
   │
   └── NEEDS_FIX ─► Fix ─► Re-test
```

Engineer Flow is not a framework.

It is the layer that decides **what engineering knowledge is relevant**, **how much of it should be activated**, and **what must be verified before the work is considered complete**.

---

## Why Engineer Flow?

AI coding agents can become less effective as more instructions and skills are added.

Common failure modes include:

- activating too many specialists for a simple task
- selecting tools because generic keywords happen to match
- coupling engineering principles to one framework
- ignoring skills already installed by the user
- over-exploring a repository before making a small change
- declaring work complete without security verification

Engineer Flow takes a different approach:

> **Concern first. Stack second. Minimal relevant capability. Verify before completion.**

---

## How It Works

### 1. Understand the engineering concern

Engineer Flow first identifies the underlying engineering problem.

For example:

```text
"Fix N+1 queries"
```

maps to:

```text
performance
```

rather than immediately mapping to Laravel, Django, Rails, or another framework.

---

### 2. Build the capability pool

Engineer Flow combines two capability sources:

```text
Engineer Flow internal skills
+
user-installed Agent Skills
```

Internal skills cover broad engineering concerns.

External skills provide specialized technology or domain expertise.

By default, external Agent Skills are discovered from:

```text
~/.agents/skills/
```

Additional roots can be supplied with:

```text
ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS
```

---

### 3. Activate only relevant specialists

Engineer Flow uses **sparse specialist activation**.

At most:

```text
1 primary specialist
+
1 optional support specialist
```

are selected for normal development work.

Broad engineering concerns can activate internal skills.

Highly specialized external skills require stronger technology or domain evidence.

For example:

```text
"Build a transaction endpoint with database persistence"
```

may resolve to:

```text
database
```

but should **not** accidentally activate:

```text
firebase-database
```

unless Firebase is actually relevant.

---

### 4. Detect the project stack

Engineering concerns remain framework-independent.

Stack-specific knowledge is applied afterward through adapters.

Example:

```text
database concern
      +
Laravel detected
      ↓
database core
      +
Laravel database adapter
```

The core defines **what good engineering requires**.

The adapter defines **how that requirement is implemented naturally in the detected stack**.

---

### 5. Implement the smallest correct change

Engineer Flow prefers:

- minimal correct changes
- existing project conventions
- native framework mechanisms
- reuse before new abstractions
- bounded repository exploration
- evidence over assumptions

The goal is not to produce the most code.

The goal is to make the **smallest change that correctly solves the engineering problem**.

---

### 6. Run mandatory security verification

Security is not treated as just another optional specialist.

After development, Engineer Flow runs:

```text
skills/security/SKILL.md
```

plus a matching security adapter when available.

The final security state must be:

```text
SECURITY REVIEW: PASS
```

or:

```text
SECURITY REVIEW: NEEDS_FIX
```

If actionable findings remain:

```text
NEEDS_FIX
   ↓
fix
   ↓
re-test
   ↓
PASS
```

Security verification does **not** consume one of the development specialist slots.

---

## Internal Engineering Skills

Engineer Flow currently includes **16 generalized engineering capabilities**.

| Skill | Responsibility |
|---|---|
| `architecture` | boundaries, modularity, system structure, design decisions |
| `api-integration` | APIs, contracts, integrations, request/response behavior |
| `database` | persistence, queries, transactions, schema and data integrity |
| `testing` | test strategy, regression coverage, behavior verification |
| `performance` | query efficiency, runtime cost, memory and bottlenecks |
| `debugging` | root-cause analysis, reproduction and failure tracing |
| `code-quality-refactoring` | maintainability, simplification and safe refactoring |
| `data-processing` | transformations, pipelines, imports and exports |
| `dependency-tooling` | dependencies, packages, builds and developer tooling |
| `infrastructure-devops` | deployment, runtime, containers and infrastructure |
| `version-control-review` | Git workflows, diffs, review and change discipline |
| `planning-execution` | implementation planning and bounded execution |
| `documentation` | technical documentation and maintainable knowledge |
| `frontend-ui` | UI behavior, frontend implementation and interaction concerns |
| `ai-llm-engineering` | model training, inference, datasets and LLM workflows |
| `security` | application security review and post-development verification |

These skills describe **engineering principles**, not framework APIs.

---

## External Skill Discovery

Engineer Flow does not try to replace every specialist skill you already use.

It can discover compatible user-installed Agent Skills and include them in the capability pool.

For example, a user may already have:

```text
odoo-cross-platform-report-consistency
trl-training
pytorch-fsdp2
firebase-auth
riverpod
huggingface-datasets
playwright
```

Engineer Flow can select those capabilities when the task provides sufficiently specific evidence.

Example:

```text
Task:
"Fix an Odoo cross platform report consistency issue"

Resolved specialist:
odoo-cross-platform-report-consistency
```

Another example:

```text
Task:
"Fine tune this model using TRL training"

Resolved specialist:
trl-training
```

External skills remain responsible for their own native instructions.

Engineer Flow orchestrates them; it does not rewrite them.

---

## Stack Adapters

Adapters translate generalized engineering requirements into native stack mechanisms.

```text
skills/
    database/
    testing/
    security/
    performance/
        ...

adapters/
    laravel/
        database.md
        testing.md
        security.md
        performance.md
        ...
```

### Laravel

Laravel is currently the first complete adapter family.

Engineer Flow ships **16 Laravel adapters** corresponding to the generalized internal capabilities.

Example:

```text
Task
   ↓
database
   ↓
Laravel project detected
   ↓
skills/database/SKILL.md
+
adapters/laravel/database.md
```

Adapters must never weaken or replace the generalized core.

They only answer:

> **How should this engineering requirement be implemented naturally in this stack?**

Future adapter families can follow the same contract.

---

## Security Review

The security capability includes review guidance for areas such as:

- authentication and session handling
- authorization and IDOR
- input validation
- SQL / command / template injection
- XSS and output contexts
- CSRF
- SSRF and outbound requests
- file uploads and path traversal
- secrets and token exposure
- API exposure and mass assignment
- rate limiting and resource abuse
- webhook authenticity and replay
- dependency and configuration risk
- sensitive logging and error handling
- cryptographic misuse

Security findings are classified using evidence.

The workflow distinguishes between:

```text
confirmed vulnerability
likely vulnerability
hardening opportunity
informational finding
```

Dynamic verification should remain minimal, scoped, authorized, and non-destructive.

---

## Commit-Aware Security Gate

Engineer Flow also includes an optional staged-diff security gate.

```text
scripts/security-gate.mjs
```

The gate:

1. reads the exact staged Git diff
2. calculates its SHA-256 hash
3. creates a security review request
4. blocks the commit until that exact diff receives a PASS
5. invalidates previous approval automatically when the diff changes

Example:

```bash
node scripts/security-gate.mjs check --cwd .
```

Possible result:

```text
SECURITY_GATE=REVIEW_REQUIRED
DIFF_SHA256=<hash>

Commit blocked until this exact staged diff receives
SECURITY REVIEW: PASS.
```

This prevents a security approval for one change from being silently reused for another change.

A PowerShell installation helper is also included:

```text
scripts/install-security-gate.ps1
```

---

## Installation

### Agent Skills-compatible agents

Clone Engineer Flow into your shared Agent Skills directory.

#### Windows PowerShell

```powershell
git clone https://github.com/soden46/engineer-flow.git `
  "$env:USERPROFILE\.agents\skills\engineer-flow"
```

#### macOS / Linux

```bash
git clone https://github.com/soden46/engineer-flow.git \
  ~/.agents/skills/engineer-flow
```

Then restart or reload your coding agent if required.

---

## Generic AI Agent Usage

Engineer Flow can also be used by coding assistants that can read Markdown and repository files.

Point the agent to:

```text
engineer-flow/SKILL.md
```

and instruct it to use Engineer Flow as the root engineering workflow.

Example:

```text
Use Engineer Flow for this task.

Read SKILL.md first, resolve the relevant engineering capabilities,
apply a matching stack adapter when available, complete the task,
then run the post-development security review.
```

---

## CLI Resolver

Engineer Flow includes a lightweight resolver:

```text
scripts/engineer-flow.mjs
```

### Self-test

```bash
node scripts/engineer-flow.mjs self-test
```

Example:

```text
SELF_TEST_PASS=YES
INTERNAL_SKILLS=16
EXTERNAL_SKILLS=<detected>
EFFECTIVE_CAPABILITIES=<effective>
ADAPTER_FAMILIES=1
MAX_SPECIALISTS=2
POST_DEVELOPMENT_SECURITY=ENABLED
```

### Inspect discovered capabilities

```bash
node scripts/engineer-flow.mjs inventory
```

### Resolve a task

```bash
node scripts/engineer-flow.mjs resolve \
  --task "Fix N+1 queries and add regression tests" \
  --cwd .
```

Example resolution:

```text
primary
└── performance

support
└── testing

post-development
└── security
```

---

## Repository Structure

```text
engineer-flow/
│
├── SKILL.md
│
├── skills/
│   ├── architecture/
│   ├── api-integration/
│   ├── database/
│   ├── testing/
│   ├── performance/
│   ├── debugging/
│   ├── code-quality-refactoring/
│   ├── data-processing/
│   ├── dependency-tooling/
│   ├── infrastructure-devops/
│   ├── version-control-review/
│   ├── planning-execution/
│   ├── documentation/
│   ├── frontend-ui/
│   ├── ai-llm-engineering/
│   ├── security/
│   └── core-manifest.json
│
├── adapters/
│   └── laravel/
│       ├── adapter.json
│       ├── architecture.md
│       ├── database.md
│       ├── testing.md
│       ├── security.md
│       └── ...
│
└── scripts/
    ├── engineer-flow.mjs
    ├── security-gate.mjs
    └── install-security-gate.ps1
```

---

## Example Resolutions

### Generic Laravel database task

```text
Task:
Build a transaction endpoint with validation and database persistence

Primary:
database

Adapter:
laravel/database.md

Post-development:
security + laravel/security.md
```

### Odoo-specific task

```text
Task:
Fix an Odoo cross platform report consistency issue

Primary:
odoo-cross-platform-report-consistency

Source:
external Agent Skill
```

### LLM training task

```text
Task:
Fine tune this model using TRL training

Primary:
trl-training

Source:
external Agent Skill
```

The same root workflow can therefore coordinate general software engineering and highly specialized user-installed skills without hardcoding every technology into Engineer Flow itself.

---

## Design Principles

### Concern before technology

Database problems should first be understood as database problems.

Framework details come later.

### Sparse over broad activation

More skills do not automatically produce better results.

Activate only what materially improves the task.

### External skills are first-class

User-installed skills extend the capability pool instead of being ignored by a closed internal router.

### Adapters translate; they do not redefine

The generalized core owns the engineering requirement.

The adapter only maps it to stack-native mechanisms.

### Minimal change

Prefer the smallest correct implementation over unnecessary abstraction or repository-wide changes.

### Evidence before completion

Do not treat successful code generation as proof that the task is complete.

Verify behavior.

Then verify security.

---

## Compatibility

Engineer Flow is designed around the open `SKILL.md` / Agent Skills model.

It is intended to be usable with Agent Skills-compatible coding environments and generic coding agents capable of reading Markdown instructions and repository files.

Examples include environments around:

```text
OpenAI Codex
Claude Code
Kilo Code
Cursor
Gemini CLI
OpenCode
Windsurf
Cline
and other compatible agents
```

Automatic discovery paths and host-specific integration may vary between agents.

The engineering model itself remains agent-independent.

---

## Direct Security Tasks

Security is normally a mandatory verification stage after development.

But when security itself is the user's task:

```text
"Audit this endpoint for authorization bypass and SSRF"
```

the security capability can become the primary specialist directly.

It can still perform final verification after remediation.

---

## Philosophy

Engineer Flow is built around a small set of ideas:

```text
Understand before editing.
Concern before framework.
Reuse before invention.
Sparse skills before skill overload.
Evidence before claims.
Security before completion.
```

The goal is not to make an AI agent know everything at once.

The goal is to make it load the **right engineering knowledge at the right time**.

---

## Contributing

Contributions are welcome.

Good contributions should:

1. represent a reusable engineering concern or stack translation
2. avoid unnecessary framework coupling in generalized skills
3. keep adapters faithful to the generalized core
4. avoid weakening security requirements
5. include clear activation intent
6. preserve sparse specialist selection
7. remain useful across compatible AI coding agents where possible

For a new framework or stack, prefer adding an adapter family rather than duplicating the generalized engineering core.

---

## Roadmap

- [x] Framework-agnostic engineering core
- [x] 16 generalized internal skills
- [x] User-installed external skill discovery
- [x] Sparse specialist activation
- [x] Laravel adapter family
- [x] Mandatory post-development security review
- [x] Commit-aware staged-diff security gate
- [ ] Additional framework adapters
- [ ] Cross-platform installer
- [ ] Additional integration examples
- [ ] Automated compatibility testing

---

## License

MIT License.

See [LICENSE](LICENSE).

---

<p align="center">
  <strong>Engineer Flow</strong><br>
  The right engineering capability, at the right time, with security before completion.
</p>