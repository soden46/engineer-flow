# Core / Adapter Contract

Engineer Flow separates universal engineering knowledge from technology-specific implementation guidance.

## Core skill

A core skill:

- describes the engineering/security principle
- must remain language agnostic
- must remain framework agnostic
- must work when no adapter exists
- must not require technology detection to remain correct

## Adapter

An adapter:

- translates a core requirement into native stack mechanisms
- may mention framework APIs
- may include version-specific guidance
- must not weaken or replace the core requirement
- must not introduce unrelated task-family routing rules

## Resolution

Task concern
→ core skill
→ detected stack
→ matching adapter when available

Adapters do not determine the primary concern.