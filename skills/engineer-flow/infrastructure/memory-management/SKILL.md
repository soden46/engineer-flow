---
name: memory-management
description: Framework-agnostic project memory infrastructure for engineering tasks. Use for sparse recall, stale-memory handling, secret-safe durable checkpoints, and MCP/CLI fallback without consuming specialist slots.
metadata:
  internal: true
---

# Memory Management

Use memory as conditional infrastructure, not specialist expertise.

## Preflight

Run memory preflight only when prior project/session/workflow context could materially affect correctness. Skip self-contained tasks.

Prefer an active MCP memory tool when the host provides one. Otherwise use:

```bash
node skills/engineer-flow/infrastructure/memory-management/scripts/memory.mjs auto --cwd <project-root> --query "<task intent>" --limit 5
```

The command prints `decision: RUN` or `decision: SKIP`. On `RUN`, use only sparse relevant memory and verify it against current code/config.

## Rules

- Memory never consumes primary or support specialist slots.
- Current code/config beats old memory.
- Do not store secrets, `.env` values, raw credentials, or personal data.
- Preserve provenance and status.
- Checkpoint only durable reusable knowledge.

## Structured Checkpoints (v0.2)

Runtime version 0.2 writes structured checkpoint entries (schema version 2) to:

```
projects/<alias>/checkpoints.jsonl
```

Each line is an independent JSON object with required fields:

```json
{
  "version": 2,
  "id": "...",
  "type": "general",
  "scope": "project",
  "status": "current",
  "created_at": "...",
  "updated_at": "...",
  "supersedes": [],
  "source": "engineer-flow checkpoint",
  "confidence": "confirmed",
  "content": "<summary>"
}
```

Optional fields:

- `pending` — free-form pending-work text

Allowed `type` values: `general`, `decision`, `architecture`, `convention`, `deployment`, `migration`, `known-issue`, `benchmark`, `pending-work`.

Allowed `status` values: `current`, `resolved`, `stale`.

Allowed `confidence` values: `confirmed`, `inferred`.

### Checkpoint CLI

```bash
node skills/engineer-flow/infrastructure/memory-management/scripts/memory.mjs checkpoint \
  --project <alias> \
  --summary "<durable summary>"
```

Optional metadata flags (all default when omitted):

| Flag           | Default                    | Validation                  |
|----------------|----------------------------|-----------------------------|
| `--type`       | `general`                  | Must be an allowed type     |
| `--scope`      | `project`                  | Secret-guarded              |
| `--status`     | `current`                  | Must be an allowed status   |
| `--source`     | `engineer-flow checkpoint` | Secret-guarded              |
| `--confidence` | `confirmed`                | Must be an allowed confidence |
| `--supersedes` | none                       | Comma-separated checkpoint IDs |

Invalid enum values fail with a non-zero exit and a deterministic error.

### Legacy Compatibility

The legacy `projects/<alias>/current-state.md` file remains **read-only** and is
never rewritten or migrated by the v0.2 runtime. New checkpoints are written
**only** to `checkpoints.jsonl`. The `recall` command searches both storage
formats when both are present.

Current code/config always wins over any memory, structured or legacy.
