# Memory Lifecycle

Memory is infrastructure and never consumes specialist slots.

## Flow

```text
engineering task
-> conditional memory preflight
-> RUN / SKIP
-> retrieve sparse durable memory
-> verify against current code/config
-> route skills
-> execute
-> checkpoint only durable reusable knowledge
```

## Rules

- Current code/config wins over old memory.
- Retrieve sparse relevant memory only.
- Do not dump full history into context.
- Never store secrets, tokens, raw personal data, or `.env` content.
- Preserve provenance and status.
- Mark stale/superseded memory instead of trusting it silently.
- Gracefully fall back when MCP/CLI memory is unavailable.

## Context Hierarchy

```text
global knowledge
< organization/team rules
< project rules
< current task requirements
< current code/config as source of truth
```
