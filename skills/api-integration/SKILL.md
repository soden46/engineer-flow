---
name: api-integration
description: General API and integration fallback for HTTP clients, retries, contracts, pagination, versioning, webhooks, and external service reliability.
---

# API Integration

Treat external systems as unreliable.

- Preserve request and response contracts.
- Use timeouts, retries, and backoff intentionally.
- Make idempotency explicit for writes and webhooks.
- Validate error handling and user-visible failure states.
- Avoid hiding provider errors that matter operationally.
