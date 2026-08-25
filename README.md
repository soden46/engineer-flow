<h1 align="center">Engineer Flow</h1>

<p align="center">
  <strong>Framework-agnostic engineering control plane for AI coding agents.</strong>
</p>

<p align="center">
  More engineering knowledge. Less active context.
</p>

<p align="center">
  <strong>72 specialized workflows analyzed → 16 generalized engineering capabilities → 0–2 active specialists per task</strong>
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
  <strong>
    Concern-first routing · Project-aware discovery · Sparse specialists · Persistent memory · Minimal-change engineering · Mandatory security
  </strong>
</p>

---

## Overview

**Engineer Flow** is an orchestration and engineering control layer for AI coding agents.

Modern coding agents can access increasingly large collections of skills, rules, tools, project instructions, and specialized knowledge.

The problem is that **more available knowledge does not automatically produce better engineering**.

Without a control layer, an agent can:

* load too much context;
* activate unrelated skills;
* choose a technology-specific workflow for a generic engineering problem;
* miss useful specialist knowledge already installed by the user;
* over-explore a repository;
* introduce unnecessary abstractions;
* make a larger change than the task requires;
* fix symptoms instead of root causes;
* claim completion without enough verification;
* or skip security review entirely.

Engineer Flow takes the opposite approach.

It compresses a broad range of engineering workflows into **16 generalized capabilities**, detects the actual concern of the task, combines that concern with project evidence and compatible external Agent Skills, and activates only the smallest capability set required.

```text
72 specialized workflows analyzed
                ↓
16 generalized engineering capabilities
                ↓
project evidence + task intent + installed skills
                ↓
0–2 active development specialists
                ↓
implementation
                ↓
verification
                ↓
mandatory security review
```

Engineer Flow is designed around one principle:

> **Use as much engineering knowledge as necessary, but as little active context as possible.**

---

## Why Engineer Flow?

Most skill systems scale horizontally:

```text
more frameworks
→ more skills
→ more prompts
→ more overlapping instructions
→ more active context
```

Engineer Flow scales differently:

```text
specialized engineering knowledge
→ identify reusable concerns
→ generalize the portable principles
→ keep stack-specific expertise external
→ route only what the current task needs
```

This makes Engineer Flow less like a static prompt library and more like a lightweight **engineering control plane**.

Its job is not to know every framework itself.

Its job is to decide:

* what kind of engineering problem is actually being solved;
* what knowledge is relevant;
* whether project-specific evidence changes the routing decision;
* whether an installed specialist should be used;
* whether a second specialist is justified;
* how much repository exploration is enough;
* what behavior must be preserved;
* what should be verified;
* and whether the final change is secure.

---

## What Makes Engineer Flow Different?

### Broad knowledge, compact execution

Engineer Flow's architecture was shaped by analyzing **72 specialized engineering workflows** and separating reusable engineering principles from stack-specific implementation details.

Those reusable principles were consolidated into a compact generalized model:

```text
72 specialized workflows
        ↓
16 generalized capabilities
        ↓
0–2 active specialists
```

The goal is not to maximize the number of loaded skills.

The goal is to maximize **relevant engineering signal per active context token**.

---

### Concern before technology

Engineer Flow first asks:

```text
What engineering problem is this?
```

before asking:

```text
What framework is this?
```

For example:

```text
"N+1 query"
→ performance

"transaction consistency"
→ database

"production exception"
→ debugging

"regression coverage"
→ testing

"module boundary"
→ architecture
```

Technology-specific knowledge is introduced only after the engineering concern is understood.

---

### Project-aware routing

The user does not always need to name the framework in the prompt.

Engineer Flow can use bounded project evidence such as dependency manifests to determine whether an installed specialist is relevant.

For example:

```text
Task:
"Fix this validation bug and add regression coverage."

Prompt does not mention Laravel.

composer.json:
laravel/framework

Installed external skill:
laravel-development

Result:
Laravel specialist can become relevant through project evidence.
```

No hardcoded framework-routing table is required.

---

### Sparse specialist activation

Normal development routing is deliberately capped at:

```text
1 primary specialist
+
1 optional support specialist
=
maximum 2
```

A task can also use:

```text
0 specialists
```

when specialist context provides no meaningful value.

This prevents a small task from turning into a multi-skill context explosion.

---

### External skill discovery

Engineer Flow does not need to contain every possible technology specialist.

Compatible user-installed Agent Skills can become part of the capability pool dynamically.

That means Engineer Flow can stay small while the user's specialist ecosystem keeps growing.

---

### Persistent project memory

Long-running work often depends on decisions that are not obvious from the current task alone.

Engineer Flow includes persistent memory infrastructure for durable project knowledge such as:

* architecture decisions;
* project conventions;
* reusable root causes;
* environment constraints;
* workflow decisions;
* migration decisions;
* non-obvious implementation constraints.

Memory is retrieved sparsely and remains subordinate to current repository evidence.

---

### Minimal-change engineering

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

The target is the **smallest safe change that solves the actual root cause and preserves relevant behavior**.

---

### Evidence before completion

Implementation output is not proof that a task is complete.

Engineer Flow expects verification appropriate to the risk and behavior being changed.

Examples include:

* regression tests;
* targeted tests;
* integration checks;
* build checks;
* runtime verification;
* query verification;
* browser checks;
* migration validation;
* security review.

---

### Mandatory post-development security

Security is not an optional afterthought.

Every development workflow ends with a security verification stage.

Security does **not** consume one of the normal development specialist slots.

```text
Development
     ↓
Verification
     ↓
Security Review
     ↓
PASS
or
NEEDS_FIX
```

When actionable findings remain:

```text
NEEDS_FIX
→ fix
→ regression protection
→ re-test
→ security review again
```

---

## Architecture

```text
                         USER TASK
                             │
                             ▼
                    ┌─────────────────┐
                    │  ENGINEER FLOW  │
                    │   ORCHESTRATOR  │
                    └─────────────────┘
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
           Task Intent   Project       Relevant
                         Evidence        Memory
                │            │            │
                └────────────┼────────────┘
                             ▼
                      Capability Pool
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
       16 Generalized Cores        External Skills
                │                         │
                └────────────┬────────────┘
                             ▼
                       Sparse Routing
                          0 / 1 / 2
                             │
                             ▼
                        Development
                             │
                             ▼
                         Verification
                             │
                             ▼
                  Mandatory Security Review
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
                   PASS           NEEDS_FIX
                                      │
                                      ▼
                                 Fix + Retest
```

---

## Core Architecture

Engineer Flow separates four concerns that are often mixed together in AI coding systems.

### 1. Generalized engineering knowledge

Universal software-engineering concerns belong in the internal core.

These capabilities remain framework and language agnostic.

### 2. Technology-specific expertise

Framework-, library-, platform-, tool-, and domain-specific knowledge can remain in external Agent Skills.

Engineer Flow discovers and routes to those skills when relevant.

### 3. Project evidence

The current repository is evidence.

Its code, configuration, manifests, tests, schema, conventions, and structure can affect routing and implementation decisions.

### 4. Verification infrastructure

Memory and post-development security are infrastructure concerns.

They do not consume normal development specialist slots.

---

# Internal Engineering Capabilities

Engineer Flow currently ships **16 generalized engineering capabilities**.

## 1. Architecture

Handles:

* module boundaries;
* service boundaries;
* dependency direction;
* interfaces;
* adapters;
* orchestration;
* modularity;
* architecture refactoring;
* failure isolation.

Principle:

> Architecture should follow the actual complexity of the system, not a pattern name.

Engineer Flow avoids creating abstractions merely because an architecture pattern exists.

---

## 2. API & Integration

Handles:

* API contracts;
* external service integrations;
* HTTP clients;
* webhooks;
* pagination;
* retries;
* timeouts;
* idempotency;
* rate limits;
* authentication boundaries;
* partial failures;
* provider isolation;
* observability.

Provider-specific assumptions should remain isolated from core business logic.

---

## 3. Database

Handles:

* schema design;
* constraints;
* indexes;
* query design;
* transactions;
* consistency;
* locking;
* concurrency;
* deadlocks;
* lost updates;
* duplicate creation;
* migrations;
* rollout and rollback;
* data integrity.

Application validation is not treated as a replacement for database integrity when concurrent writes can violate an invariant.

---

## 4. Testing

Handles:

* unit testing;
* integration testing;
* contract testing;
* end-to-end testing;
* regression protection;
* test selection;
* verification strategy.

Typical bug-fix flow:

```text
reproduce
→ create regression protection
→ apply fix
→ verify
→ check nearby behavior
```

Testing depth should match the actual behavior and risk being changed.

---

## 5. Performance

Handles:

* latency;
* throughput;
* query count;
* N+1 problems;
* indexing;
* serialization;
* rendering cost;
* network calls;
* caching;
* memory pressure;
* batching;
* streaming;
* concurrency;
* resource usage.

Primary rule:

> **Measure before declaring an optimization successful.**

An optimization without measurement remains a hypothesis.

---

## 6. Debugging

Handles:

* reproduction;
* failure tracing;
* logs;
* stack traces;
* state inspection;
* recent-change analysis;
* data-flow tracing;
* hypothesis testing;
* root-cause analysis.

Engineer Flow distinguishes:

```text
symptom
≠
trigger
≠
root cause
```

The preferred fix addresses the root cause with the smallest safe change.

---

## 7. Code Quality & Refactoring

Handles:

* deep nesting;
* large functions;
* duplication;
* unclear naming;
* mixed responsibilities;
* hidden side effects;
* excessive branching;
* unnecessary abstractions;
* maintainability;
* safe restructuring.

Behavior-changing work and structural refactoring should remain separate when practical.

---

## 8. Data Processing

Handles:

* imports;
* exports;
* transformation;
* batch processing;
* file processing;
* large datasets;
* pipelines;
* malformed records;
* retries;
* partial failures;
* duplicate handling;
* resumability.

For large workloads, prefer bounded techniques such as:

```text
streaming
chunking
pagination
iterators
batching
```

instead of loading everything into memory.

---

## 9. Dependency & Tooling

Handles:

* dependency selection;
* package upgrades;
* lockfiles;
* build systems;
* runtime compatibility;
* transitive dependencies;
* maintenance status;
* dependency removal;
* migration requirements.

A dependency should solve enough real complexity to justify the additional maintenance surface.

---

## 10. Infrastructure & DevOps

Handles:

* deployment;
* CI/CD;
* containers;
* runtime configuration;
* workers;
* queues;
* schedulers;
* health checks;
* restart behavior;
* resource limits;
* observability;
* rollout;
* rollback;
* operational failure modes.

Local development behavior must not automatically be assumed to match production.

---

## 11. Version Control & Review

Handles:

* Git diffs;
* commits;
* branches;
* merges;
* conflicts;
* review preparation;
* change hygiene;
* regression review;
* data-integrity review;
* security-sensitive review.

Review prioritizes:

```text
bugs
regressions
security
missing verification
data integrity
```

before cosmetic preferences.

---

## 12. Planning & Execution

Handles:

* implementation planning;
* decomposition;
* sequencing;
* dependencies;
* verification strategy;
* rollout;
* rollback;
* bounded execution.

A useful plan should answer:

* what changes;
* where it changes;
* in what order;
* what depends on what;
* what can fail;
* how success will be verified.

Planning should create enough confidence to move safely, not become endless analysis.

---

## 13. Documentation

Handles:

* README files;
* setup guides;
* technical documentation;
* runbooks;
* architecture docs;
* migration docs;
* developer guidance.

Documentation should describe **actual current behavior**, not assumptions.

Commands and examples must match the real project.

---

## 14. Frontend & UI

Handles:

* components;
* forms;
* layout;
* interaction;
* client state;
* responsive behavior;
* accessibility;
* keyboard interaction;
* focus management;
* semantic structure;
* loading states;
* empty states;
* error states.

Existing design systems and project UI conventions should be reused when available.

---

## 15. AI & LLM Engineering

Handles:

* LLM integrations;
* agent workflows;
* prompts;
* embeddings;
* retrieval;
* evaluation;
* model workflows;
* AI pipelines;
* datasets;
* model output validation;
* tool boundaries.

Core rule:

```text
model output
=
untrusted + nondeterministic
```

Authorization and sensitive side effects must remain outside model assumptions.

---

## 16. Security

Handles security both as:

1. a direct engineering specialist for security-focused work; and
2. a mandatory post-development verification stage.

Coverage includes:

* authentication;
* authorization;
* IDOR;
* tenant isolation;
* privilege escalation;
* SQL/query injection;
* command injection;
* template injection;
* XSS;
* CSRF;
* SSRF;
* file uploads;
* path traversal;
* webhook security;
* API abuse;
* sensitive data;
* secrets;
* logging;
* dependency security;
* runtime configuration;
* cryptographic misuse;
* resource exhaustion.

Security findings should be evidence-based rather than based only on suspicious-looking code.

---

# Concern-First Routing

Engineer Flow routes by the engineering concern first.

### Example: performance

```text
Task:
"Fix N+1 queries and add regression tests."

Primary:
performance

Support:
testing
```

### Example: database

```text
Task:
"Protect these related writes from partial completion."

Primary:
database
```

### Example: debugging

```text
Task:
"This endpoint intermittently returns invalid state in production."

Primary:
debugging
```

### Example: architecture

```text
Task:
"Separate this module without breaking the current public contract."

Primary:
architecture
```

The framework can influence **how** the solution is implemented without becoming the definition of **what problem is being solved**.

---

# Sparse Specialist Routing

Engineer Flow deliberately limits normal development activation to:

```text
Primary specialist:  max 1
Support specialist:  max 1
──────────────────────────
Total:               max 2
```

The system may also select:

```text
0 specialists
```

for trivial or self-contained tasks.

Why?

Because this:

```text
simple query bug

→ database
→ performance
→ security
→ architecture
→ testing
→ debugging
→ code quality
```

usually introduces more noise than value.

Engineer Flow instead aims for:

```text
simple query bug

→ database
```

or:

```text
query performance bug + regression coverage

→ performance
→ testing
```

Security review still runs afterward and does not consume a specialist slot.

---

# Dynamic External Skill Discovery

Engineer Flow can discover compatible Agent Skills installed by the user.

Default location:

```text
~/.agents/skills/
```

Additional roots can be supplied through:

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

External skills remain native.

Engineer Flow does not need to copy their framework-specific knowledge into its generalized core.

This allows the ecosystem to grow independently:

```text
Engineer Flow
    │
    ├── generalized built-in engineering capabilities
    │
    └── user-installed specialist ecosystem
```

---

# External Skill False-Positive Protection

External skills need stronger evidence than generic internal capabilities.

Suppose an installed skill is:

```text
firebase-database
```

This generic task:

```text
Optimize this database query.
```

should not activate it merely because both contain:

```text
database
```

But this:

```text
Optimize this Firebase database query.
```

contains a more specific identity signal.

Generic vocabulary such as:

```text
development
testing
database
configuration
workflow
service
model
performance
```

is intentionally not enough by itself to activate an unrelated external specialist.

---

# Project-Evidence-Aware Retrieval

Since **v0.2.0**, external specialist discovery can use project evidence in addition to task text.

Engineer Flow inspects common root-level dependency manifests such as:

```text
package.json
composer.json
pyproject.toml
requirements*.txt
pom.xml
build.gradle
build.gradle.kts
settings.gradle
settings.gradle.kts
go.mod
Cargo.toml
pubspec.yaml
Gemfile
```

The inspection is bounded.

```text
Maximum manifest files : 16
Maximum bytes/file     : 64 KiB
Maximum total evidence : 256 KiB
Root-level only
```

There is no need to recursively scan the whole repository merely to identify stack evidence.

---

## No Technology Routing Table

Engineer Flow does not depend on a hardcoded mapping like:

```text
laravel/framework → Laravel specialist
react-dom         → React specialist
springframework   → Spring specialist
```

Instead:

```text
installed specialist identity
+
manifest evidence
+
task engineering intent
=
retrieval signal
```

Conceptually:

```text
installed skill:
laravel-development

identity:
laravel

project manifest:
laravel/framework

task:
fix validation bug

→ Laravel specialist becomes relevant
```

This keeps the mechanism framework and language agnostic.

A newly installed specialist can participate without Engineer Flow needing a new framework-specific routing rule.

---

# Intent-Conditioned Retrieval

Project evidence does not independently decide the route.

Engineer Flow also derives task intent from existing internal engineering capabilities.

Conceptually:

```text
Task
  ↓
Engineering intent
  ↓
Project evidence
  ↓
External skill identity
  ↓
Candidate relevance
  ↓
Final sparse routing
```

Project evidence enriches retrieval.

It does not replace engineering intent.

---

# Explicit Skill-Name Recognition

When the user explicitly names a specialist, Engineer Flow supports consistent identity matching across common separators.

These forms are treated equivalently for exact-name comparison:

```text
cache-query-optimizer
cache_query_optimizer
cache:query:optimizer
cache query optimizer
```

Behavior remains deliberately conservative:

* exact-name normalization only;
* no fuzzy matching;
* no embeddings;
* no stemming;
* no arbitrary partial-name activation.

So:

```text
cache
```

does not automatically mean:

```text
cache-query-optimizer
```

---

# Capability Deduplication

Internal and external skills are merged into one effective capability pool.

If an external capability duplicates the canonical name of an internal capability, Engineer Flow preserves the internal core as canonical.

This avoids unnecessary duplicate routing candidates.

---

# Persistent Project Memory

Engineer Flow includes conditional persistent project memory.

Memory is:

* project-scoped;
* sparse;
* relevance-aware;
* persistent across tasks;
* secret-aware;
* outside normal specialist slots.

Default storage:

```text
~/.engineer-flow-memory
```

Optional overrides:

```text
ENGINEER_FLOW_MEMORY_ROOT
AI_MEMORY_ROOT
```

---

## When Memory Runs

Memory is not automatically dumped into every task.

A preflight can decide whether previous context is materially useful.

Tasks involving concepts such as:

```text
continue
resume
previous
architecture
migration
release
deployment
benchmark
production
```

may benefit from memory.

Self-contained work can skip memory entirely.

---

## Sparse Recall

Memory retrieval selects only a small number of relevant blocks.

Conceptually:

```text
large project history
       ↓
current task query
       ↓
relevance scoring
       ↓
small relevant recall
```

The objective is continuity without flooding the active context.

---

## Durable Checkpoints

Useful durable knowledge can be checkpointed for later work.

Good memory candidates include:

* architecture decisions;
* non-obvious constraints;
* accepted migration strategies;
* reusable root causes;
* environment quirks;
* long-lived project conventions.

Temporary command output, one-off logs, and disposable task details should not become persistent memory.

---

## Current Code Beats Memory

Memory is never the final authority.

When memory conflicts with current repository evidence:

```text
current code/config
>
memory
```

The repository represents the current state.

Memory represents historical context.

---

## Secret-Safe Memory

Engineer Flow memory includes guardrails against persisting likely secrets or sensitive credential material.

Examples include:

```text
password=
api_key=
access_token=
private keys
raw secrets
known token patterns
```

Persistent memory should contain engineering knowledge, not credentials.

---

# Minimal-Change Engineering

Engineer Flow includes a minimal-change discipline as part of its root workflow.

Before introducing new code, consider:

```text
Does this need to exist?

Is the solution already present in the codebase?

Can an existing function or abstraction solve it?

Does the language/runtime already provide it?

Does the framework already provide it?

Is an installed dependency already enough?

Can the existing execution path solve the problem safely?
```

Preferred hierarchy:

```text
reuse existing behavior
        ↓
modify existing local behavior
        ↓
extend existing abstraction
        ↓
new abstraction only when justified
```

Engineer Flow avoids:

* speculative architecture;
* unnecessary repositories/services/factories;
* abstractions with no real variation;
* dependencies for trivial behavior;
* broad refactors during focused bug fixes;
* unrelated cleanup while touching a file.

Minimal does **not** mean careless.

Never simplify away:

* validation at trust boundaries;
* authorization;
* protections against data loss;
* security controls;
* required accessibility;
* explicit user requirements.

---

# Root-Cause Engineering

A small diff in the wrong location is not a good minimal change.

Engineer Flow therefore traces enough of the real execution path to identify where the problem originates.

Conceptually:

```text
symptom
   ↓
entry point
   ↓
data/state flow
   ↓
implementation
   ↓
callers
   ↓
persistence / side effects
   ↓
output
```

Then:

```text
root cause
→ smallest safe fix
→ regression protection
→ verification
```

---

# Bounded Repository Exploration

AI coding agents can waste large amounts of context exploring a repository long after enough information is available.

Engineer Flow uses a stop condition.

Explore until the following are sufficiently understood:

* affected execution path;
* behavior being changed;
* relevant callers;
* relevant contracts;
* data flow;
* regression surface;
* verification surface.

Then implement.

Broader exploration is justified when:

* architecture is unclear;
* behavior crosses modules;
* security boundaries are involved;
* the failure cannot be reproduced;
* a shared contract changes;
* regression risk is high.

The goal is:

> **Understand enough to be correct, then move.**

---

# Verification Strategy

Verification should match risk.

A typo does not need the same verification depth as:

```text
authentication
payments
database migrations
concurrency
permissions
destructive operations
```

Engineer Flow prefers the smallest verification surface that provides meaningful evidence.

Possible verification includes:

```text
targeted test
regression test
integration test
browser test
build
lint/type check
query verification
migration check
runtime smoke test
security review
```

Completion should be supported by evidence.

---

# Mandatory Security Review

After development, Engineer Flow requires:

```text
SECURITY REVIEW: PASS
```

or:

```text
SECURITY REVIEW: NEEDS_FIX
```

Security verification does not count toward the maximum two development specialists.

If findings remain:

```text
NEEDS_FIX
    ↓
fix
    ↓
regression protection
    ↓
re-test
    ↓
security review
```

---

# Security Coverage

Engineer Flow's security capability covers common application-security boundaries.

## Authentication

Checks:

* credential handling;
* password storage;
* token/session lifecycle;
* login/logout;
* revocation;
* recovery flows;
* session fixation;
* authentication bypass.

---

## Authorization

Checks:

* server-side authorization;
* resource ownership;
* IDOR;
* horizontal privilege escalation;
* vertical privilege escalation;
* tenant boundaries;
* administrative operations.

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
Are you allowed to do this?
```

They are separate concerns.

---

## Injection

Checks:

* SQL/query injection;
* command injection;
* expression injection;
* template injection;
* unsafe evaluation;
* header injection.

Prefer structured and parameterized APIs over concatenating untrusted data into interpretable contexts.

---

## XSS & Output Context

Output safety depends on destination.

Examples include:

```text
HTML
attribute
JavaScript
URL
CSS
template
generated document
```

Escaping for one context does not automatically protect another.

---

## CSRF & Request Forgery

Browser sessions and machine-to-machine integrations require different protections.

Browser state-changing requests may require anti-forgery mechanisms.

Webhooks usually require mechanisms such as:

* signatures;
* authenticated tokens;
* provider verification;
* freshness checks.

A webhook signature is not automatically a browser CSRF mechanism.

---

## SSRF

Outbound requests influenced by untrusted input should consider:

* scheme;
* protocol;
* hostname;
* redirects;
* private networks;
* metadata endpoints;
* credential forwarding;
* DNS behavior;
* timeouts;
* response-size limits.

---

## File Handling

Checks:

* size;
* content/MIME;
* extension;
* filenames;
* generated names;
* path traversal;
* public/private storage;
* executable uploads;
* overwrite behavior;
* archive extraction;
* retrieval authorization.

---

## API Security

Checks:

* authentication;
* authorization;
* validation;
* pagination bounds;
* response exposure;
* rate limits;
* replay;
* idempotency;
* mass assignment;
* enumeration;
* verbose failures.

---

## Webhooks

Checks:

* authenticity;
* signatures;
* freshness;
* replay protection;
* duplicate delivery;
* idempotency;
* secret handling;
* authorization of resulting side effects.

---

## Abuse & Resource Exhaustion

High-cost surfaces can include:

```text
login
password reset
OTP
search
exports
uploads
bulk operations
external API calls
AI/model calls
```

Relevant controls may include:

* rate limiting;
* bounded input;
* pagination;
* execution limits;
* concurrency controls;
* query complexity limits;
* memory limits.

---

## Secrets & Sensitive Data

Security review checks whether secrets or sensitive information may leak through:

* source control;
* frontend bundles;
* API responses;
* logs;
* analytics;
* exceptions;
* stack traces;
* debug output;
* serialized objects.

---

## Dependency & Configuration Security

Checks may include:

* vulnerable packages;
* unsupported versions;
* abandoned dependencies;
* debug configuration;
* cookie/session configuration;
* trusted hosts/proxies;
* insecure transport;
* excessive permissions;
* exposed administration surfaces.

---

## Cryptographic Guardrails

Avoid:

* custom cryptographic protocols;
* weak randomness;
* ordinary hashes for passwords;
* hardcoded encryption keys;
* invented encryption formats.

Prefer reviewed native platform mechanisms.

---

# Evidence-Based Vulnerability Assessment

Suspicious-looking code is not automatically a confirmed vulnerability.

Engineer Flow security analysis follows the path:

```text
attacker-controlled source
        ↓
transformation
        ↓
authorization / validation
        ↓
sensitive sink
        ↓
reachable impact
```

Findings should distinguish:

```text
confirmed vulnerability
likely vulnerability requiring verification
hardening opportunity
informational observation
```

Severity should reflect exploitability and impact.

---

# Commit-Aware Security Gate

Engineer Flow includes a Git-aware security gate that can bind security approval to the exact staged diff.

Conceptually:

```text
git add
   ↓
staged diff
   ↓
SHA-256 hash
   ↓
security review
   ↓
PASS / NEEDS_FIX
```

A `PASS` applies only to that exact diff.

If staged content changes:

```text
Diff A
→ PASS

change staged code

Diff B
→ previous PASS no longer matches
→ review required again
```

This prevents stale security approval from being reused after the code changes.

---

## Optional Pre-Commit Enforcement

A Git pre-commit hook can enforce the gate locally.

When configured:

```text
git commit
    ↓
existing pre-commit hook
    ↓
Engineer Flow security gate
    ↓
PASS → commit continues
FAIL → commit blocked
```

This provides stronger enforcement than relying only on agent instructions.

---

# Routing Diagnostics

Engineer Flow's resolver can expose routing diagnostics.

Example:

```bash
node skills/engineer-flow/scripts/engineer-flow.mjs resolve \
  --task "Fix N+1 queries and add regression tests" \
  --cwd .
```

Resolver output can include information such as:

```text
capability_pool
retrieval.intent
retrieval.project_evidence
retrieval.external_matches
primary
support
specialist_count
memory_infrastructure
post_development_security
max_specialists
```

This makes routing behavior inspectable rather than completely opaque.

---

# Capability Inventory

Inspect the current capability pool:

```bash
npm run inventory
```

This can show:

* internal capabilities;
* discovered external capabilities;
* effective capabilities after deduplication.

---

# Runtime Self-Test

Run:

```bash
npm run self-test
```

The self-test verifies key runtime invariants such as:

```text
16 internal engineering capabilities
maximum 2 development specialists
memory infrastructure enabled
post-development security enabled
```

---

# Routing Evaluation

Engineer Flow routing changes are tested through executable calibration and heldout evaluations.

## Calibration V4

Current v0.2.0 calibration evidence:

| Metric                     | Result |
| -------------------------- | -----: |
| Primary accuracy           | 83.33% |
| External-required accuracy |   100% |
| False external activation  |      0 |
| Maximum specialists        |      2 |

Run:

```bash
npm run benchmark:routing
```

---

## Fresh Heldout V5

The fresh v0.2.0 generalization evaluation produced:

| Metric                         | Result |
| ------------------------------ | -----: |
| Mode accuracy                  |   100% |
| Primary accuracy               |   100% |
| Support accuracy               |    95% |
| Exact route accuracy           |    95% |
| Explicit-name normalization    |   100% |
| Project-evidence regression    |   100% |
| Partial-name negative controls |   100% |
| Robustness                     |   100% |
| False external activation      |      0 |
| Resolver crashes               |      0 |
| Maximum specialists            |      2 |

These results support the current project-aware retrieval and explicit-name normalization mechanisms.

They do **not** imply that every possible routing problem has been solved.

---

# Burned Heldout Discipline

Fresh heldout datasets are treated as one-time evaluation evidence.

Once used:

```text
fresh heldout
→ execute once
→ inspect result
→ BURNED
```

A burned heldout dataset may be studied as historical evidence but must not later be reused and presented as fresh evidence for another candidate.

This prevents benchmark tuning from masquerading as generalization.

---

# Known Routing Limitations

Engineer Flow v0.2.0 intentionally documents remaining weaknesses.

## Morphology

Lexical matching does not yet fully understand relationships such as:

```text
migration
migrations

dependency
dependencies
```

---

## Body-Text Blindness

Normal relevance scoring primarily uses compact skill identity surfaces such as:

* name;
* description;
* headings.

The full prose body is not currently used as ordinary relevance signal.

---

## Broad-Heading Over-Capture

Capabilities with large heading surfaces can occasionally receive relevance from broad vocabulary.

Security is the most notable example because its responsibility surface is intentionally wide.

---

## Support Selection Variance

The optional second specialist is selected through a bounded heuristic.

Ambiguous cross-cutting tasks can therefore occasionally select a different support capability than ideal.

---

# Installation

## Recommended

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -g -y
```

---

## Kilo Code

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -g -a kilo -y
```

---

## Codex

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -g -a codex -y
```

---

## Claude Code

```bash
npx skills add soden46/engineer-flow --skill engineer-flow -g -a claude-code -y
```

---

# What Gets Installed?

The repository contains development infrastructure such as:

```text
tests/
benchmark-results/
docs/
package.json
```

but the Agent Skill entry lives under:

```text
skills/engineer-flow/
```

The installed skill package therefore remains separate from repository-level benchmark and development artifacts.

Conceptually:

```text
GitHub repository
├── benchmark-results/
├── tests/
├── docs/
├── package.json
└── skills/
    └── engineer-flow/
        ├── SKILL.md
        ├── core/
        ├── infrastructure/
        └── scripts/
```

---

# Quick Start

After installation, ask your coding agent to use Engineer Flow for engineering work.

Example:

```text
Use Engineer Flow to fix this bug.
```

or simply provide the task when your agent supports automatic Agent Skill discovery.

Example:

```text
This endpoint occasionally creates duplicate orders under concurrency.
Find the root cause and fix it without changing unrelated behavior.
```

Engineer Flow can route that task toward the relevant engineering concern, inspect project evidence, and activate an external stack specialist when one provides meaningful additional context.

---

# Example Workflows

## Generic debugging

```text
Task:
The API returns the wrong state after a retry.

Likely flow:
debugging
→ inspect execution/data flow
→ reproduce
→ isolate root cause
→ focused fix
→ regression verification
→ security review
```

---

## Performance + testing

```text
Task:
Fix this N+1 issue and prevent regression.

Primary:
performance

Support:
testing

Specialist count:
2
```

---

## Database consistency

```text
Task:
Make these writes atomic and safe under concurrency.

Primary:
database
```

---

## Framework-aware task without naming the framework

```text
Task:
Fix the validation flow and add regression protection.

Project evidence:
framework dependency appears in project manifest

Installed specialist:
matching framework skill

Result:
external specialist may become relevant automatically
```

---

## Explicit external specialist

```text
Task:
Use my-specialist to review this implementation.

Explicit identity:
my-specialist

Result:
exact skill-name routing receives strong evidence
```

---

## Mode 0 / no specialist

```text
Task:
Rename this local variable without changing behavior.

Specialists:
none

Engineer Flow still applies:
minimal-change discipline
+
appropriate verification
+
security contract when development work requires it
```

---

# Repository Structure

```text
engineer-flow/
├── skills/
│   └── engineer-flow/
│       ├── SKILL.md
│       │
│       ├── core/
│       │   ├── architecture/
│       │   ├── api-integration/
│       │   ├── database/
│       │   ├── testing/
│       │   ├── performance/
│       │   ├── debugging/
│       │   ├── code-quality-refactoring/
│       │   ├── data-processing/
│       │   ├── dependency-tooling/
│       │   ├── infrastructure-devops/
│       │   ├── version-control-review/
│       │   ├── planning-execution/
│       │   ├── documentation/
│       │   ├── frontend-ui/
│       │   ├── ai-llm-engineering/
│       │   └── security/
│       │
│       ├── infrastructure/
│       │   └── memory-management/
│       │
│       └── scripts/
│           ├── engineer-flow.mjs
│           ├── validate.mjs
│           └── security-gate.mjs
│
├── tests/
├── benchmark-results/
├── docs/
├── agent-skills.json
├── package.json
├── RELEASE-NOTES.md
├── CHANGELOG.md
└── README.md
```

---

# Validation

Before releasing changes:

```bash
npm run validate
```

Validator checks structural invariants including:

* one public Engineer Flow entry skill;
* exactly 16 internal capabilities;
* valid internal metadata;
* memory infrastructure presence;
* memory runtime behavior;
* secret-safe memory handling;
* router self-test;
* maximum specialist count;
* mandatory security contract;
* version metadata consistency.

---

## Normalization Regression Tests

```bash
npm run test:normalization
```

Checks explicit skill identity behavior across separators such as:

```text
-
_
:
space
```

---

## Routing Calibration

```bash
npm run benchmark:routing
```

Burned heldout suites should not be reused as fresh final evaluation evidence for new routing candidates.

---

# Development Principles

Engineer Flow follows several permanent design principles.

## Framework agnostic by default

Universal engineering principles stay in the generalized core.

Technology-specific implementation guidance stays external.

---

## Sparse by default

Do not load more specialist context than the task actually needs.

---

## Project evidence matters

The repository is an evidence source, not merely an editing target.

---

## Current code is authoritative

Current code and configuration override stale memory or generic assumptions.

---

## Reuse before invention

Existing correct project patterns should usually beat new abstractions.

---

## Root cause before patch

Small changes should solve the underlying problem, not merely suppress symptoms.

---

## Verification before completion

Success claims require evidence appropriate to the task.

---

## Security before completion

Development is not complete while actionable security findings remain.

---

## Benchmark honestly

Do not tune against heldout evidence and later present the same dataset as fresh evaluation.

---

# Design Goals

Engineer Flow aims to remain:

* lightweight;
* framework agnostic;
* language agnostic;
* inspectable;
* deterministic where practical;
* extensible through Agent Skills;
* bounded in context growth;
* conservative with external activation;
* security-aware;
* useful across small and large repositories.

---

# Non-Goals

Engineer Flow is not intended to:

* replace framework-specific expertise;
* contain every framework in its own core;
* activate every installed skill;
* become a giant universal prompt;
* perform unrestricted recursive repository scanning just to identify stack;
* use fuzzy external-skill activation by default;
* claim perfect routing;
* replace project tests or human engineering judgment.

---

# Compatibility

Engineer Flow follows the Agent Skills model and is designed for AI coding environments that can discover or read compatible skill packages.

Dedicated install metadata is currently provided for:

* Kilo Code;
* Codex;
* Claude Code;
* generic Agent Skills installation.

Other compatible assistants can use the canonical `skills/engineer-flow/` package when they support the same skill format or can load Markdown-based Agent Skills.

---

# Releases

Current version:

```text
v0.2.0
```

Release documentation:

* [Release Notes](RELEASE-NOTES.md)
* [v0.2.0 Release](docs/releases/v0.2.0.md)
* [Changelog](CHANGELOG.md)

---

# Roadmap

Current research priorities include improving routing precision without increasing context size.

Potential future work:

* morphology-aware lexical matching;
* stronger internal relevance ranking;
* better support-specialist compatibility;
* bounded deeper project evidence for complex repository layouts;
* improved skill relevance signals;
* continued routing robustness evaluation;
* security workflow refinement.

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

# Contributing

Contributions should preserve the core architecture.

Before proposing a new internal capability, ask:

```text
Is this truly a new universal engineering concern?
```

If the answer is:

```text
This is a framework,
library,
platform,
vendor,
tool,
or technology-specific workflow.
```

it is usually better represented as an external Agent Skill.

Before submitting changes:

```bash
npm run validate
npm run test:normalization
npm run benchmark:routing
```

Do not present previously burned heldout datasets as fresh evidence.

---

# Security Philosophy

Engineer Flow treats secure engineering as part of normal software engineering.

Security is not a final cosmetic checklist.

It is a boundary analysis:

```text
Who controls the input?
        ↓
Where does it travel?
        ↓
What validation occurs?
        ↓
What authorization occurs?
        ↓
What sensitive operation receives it?
        ↓
What real impact is reachable?
```

The objective is not to produce the largest vulnerability report.

The objective is to identify real risk, fix actionable findings, preserve behavior, and verify the final change.

---

# Philosophy

```text
More knowledge is useful.

More active context is not always useful.

Understand the problem.
Route the concern.
Use project evidence.
Load specialists only when needed.
Reuse what already works.
Make the smallest safe change.
Verify the actual behavior.
Verify security.
Stop when done.
```

---

# License

Engineer Flow is released under the [MIT License](LICENSE).

---

<p align="center">
  <strong>Engineer Flow</strong>
</p>

<p align="center">
  More engineering knowledge. Less active context.
</p>

<p align="center">
  <strong>72 specialized workflows analyzed → 16 generalized capabilities → 0–2 specialists per task</strong>
</p>
