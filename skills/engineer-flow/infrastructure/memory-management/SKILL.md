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

### Checkpoint Lifecycle

Identical `current` checkpoints are deduplicated. Dedupe identity is:

- `type`
- normalized `scope` (trim, lowercase, whitespace-collapsed)
- normalized `content` (trim, lowercase, whitespace-collapsed)

When a duplicate is detected, no new checkpoint is appended and the existing
checkpoint ID is returned.

`stale` / `resolved` entries do not block creating new `current` entries. Only
`current` entries participate in dedupe comparison.

**Order of operations:** dedupe is evaluated **before** supersession. If a
new checkpoint deduplicates against an existing `current` entry, supersession
is not applied.

#### Supersession

`--supersedes` accepts a comma-separated list of existing `current` checkpoint IDs.

On success:

- the new checkpoint is written with `status=current`
- each referenced checkpoint is updated to `status=stale` with a new
  `updated_at` timestamp; its `id`, `created_at`, `content`, and other
  metadata are preserved
- output prints `CHECKPOINT_WRITTEN=YES`, `CHECKPOINT_ID`, and `SUPERSEDED`

Validation (all must pass before any file mutation; failures are atomic):

- every referenced ID must exist
- every referenced ID must currently be `current`
- no self-reference
- no duplicate IDs within the `--supersedes` list

Invalid/unknown/stale supersession IDs reject with a non-zero exit and leave
no partial changes to `checkpoints.jsonl`.

### Legacy Compatibility

The legacy `projects/<alias>/current-state.md` file remains **read-only** and is
never rewritten or migrated by the v0.2 runtime. New checkpoints are written
**only** to `checkpoints.jsonl`. The `recall` command searches both storage
formats when both are present.

Current code/config always wins over any memory, structured or legacy.

### Memory Compaction

Structured memory is split across two JSONL files per project alias:

- Active structured memory: `projects/<alias>/checkpoints.jsonl`
- Archived historical memory: `projects/<alias>/archive.jsonl`

The `compact` command prunes stale/resolved entries from the active file into the
archive. Compaction controls:

- `compact` defaults to DRY RUN; output reports `MEMORY_COMPACTION=DRY_RUN`
  with `WOULD_ARCHIVE` count and leaves both files unmodified.
- Use `compact --apply` to perform actual archival.
- `--keep-history <n>` controls how many stale/resolved entries (by newest
  `updated_at`/`created_at`/`id`) are retained in the active file. Default: 50.
- `current` checkpoints are never archived, regardless of retention.
- stale/resolved entries beyond the retention limit move to `archive.jsonl`.
- Archived entries are excluded from normal `recall` results (archive is
  read-only history, not active memory).
- Compaction is idempotent: running again with the same retention is a NOOP
  (`MEMORY_COMPACTION=NOOP`, `ARCHIVED=0`) because archived IDs are skipped.
- The legacy `current-state.md` is never modified by compaction.

```bash
node skills/engineer-flow/infrastructure/memory-management/scripts/memory.mjs compact \
  --project <alias> --keep-history 50        # dry run
node skills/engineer-flow/infrastructure/memory-management/scripts/memory.mjs compact \
  --project <alias> --keep-history 50 --apply  # apply
```

Current code/config always wins over any memory, structured or legacy.
