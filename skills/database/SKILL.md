---
name: database
description: General database fallback for schema, queries, transactions, migrations, consistency, indexing, and persistence behavior across data stores.
---

# Database

Preserve data correctness first.

- Understand current schema and migration history.
- Keep reads bounded and intentional.
- Use transactions or locks for multi-step consistency.
- Verify indexes and query shape for performance-sensitive paths.
- Avoid destructive migrations without explicit approval.
