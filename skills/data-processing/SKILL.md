---
name: data-processing
description: Process, transform, import, export, and handle large datasets using bounded and reliable technology-agnostic patterns.
---

# data-processing

Use this skill for imports, exports, transformations, batch processing, files, large datasets, and data pipelines.

## Principles

Make data boundaries explicit.

Validate external data before relying on it.

For large workloads prefer bounded processing such as:

- streaming
- chunking
- pagination
- iterators
- batches

Avoid loading unbounded datasets into memory.

Define behavior for:

- malformed records
- partial failure
- retries
- duplicates
- ordering
- checkpointing
- resumability

Keep transformation logic separate from transport/storage concerns where useful.

For destructive or bulk operations, consider dry-run or preview mechanisms when appropriate.

Verify record counts and important invariants after processing.

## Adaptation

Use project evidence to determine the actual language, framework, runtime, and existing conventions.

If a matching technology adapter exists, use it only to translate these principles into native mechanisms.

Do not allow an adapter to redefine the engineering concern or weaken the core requirement.