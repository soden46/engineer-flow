# Engineer Flow Architecture

## Overview

Engineer Flow is a framework- and language-agnostic engineering orchestration layer for AI coding agents.

Its purpose is to select the smallest relevant engineering capability set for a task while allowing specialized knowledge to come from user-installed Agent Skills and current project evidence.

## Runtime Model

```text
User Task
   |
   v
Engineer Flow
   |
   +-- 16 generalized internal capabilities
   |
   +-- user-installed external Agent Skills
   |
   v
Sparse specialist selection
   |
   |  max 2 development specialists
   v
Development
   |
   v
Mandatory post-development security review
   |
   +-- PASS -------> Done
   |
   +-- NEEDS_FIX --> Fix --> Re-test
```

## Public Skill

Engineer Flow is distributed as one public Agent Skill:

`skills/engineer-flow/SKILL.md`

Users install the root skill once.

The 16 internal capabilities are implementation details of the orchestrator and are not intended to be installed independently.

## Internal Capabilities

Internal generalized capabilities live under:

`skills/engineer-flow/core/`

Canonical capability registry:

`skills/engineer-flow/core/core-manifest.json`

Internal capabilities remain framework and language agnostic.

## External Agent Skills

Default shared root:

`~/.agents/skills/`

Additional roots:

`ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS`

External skills should activate only when task or project evidence provides sufficiently specific technology or domain evidence.

## Specialist Selection

Normal development uses at most:

- 1 primary specialist
- 1 optional support specialist

Maximum:

`2`

Mandatory post-development security does not consume a development specialist slot.

## Framework-Specific Knowledge

Engineer Flow does not ship built-in framework adapters.

Technology-specific knowledge should come from:

- current project evidence
- native stack mechanisms
- user-installed external Agent Skills

## Security

Security capability:

`skills/engineer-flow/core/security/SKILL.md`

Valid final outcomes:

`SECURITY REVIEW: PASS`

`SECURITY REVIEW: NEEDS_FIX`

## Runtime Components

Resolver:

`skills/engineer-flow/scripts/engineer-flow.mjs`

Security gate:

`skills/engineer-flow/scripts/security-gate.mjs`

Security gate installer:

`skills/engineer-flow/scripts/install-security-gate.ps1`

Validation:

`skills/engineer-flow/scripts/validate.mjs`

## Core Invariants

```text
INTERNAL_SKILLS=16
MAX_SPECIALISTS=2
POST_DEVELOPMENT_SECURITY=ENABLED
```