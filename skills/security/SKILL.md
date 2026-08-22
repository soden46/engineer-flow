---
name: security
description: General security fallback for authorization, input handling, secret safety, injection risks, dependency exposure, and secure engineering review.
---

# Security

Treat security-sensitive paths conservatively.

- Identify trust boundaries and attacker-controlled input.
- Preserve authorization, authentication, and audit behavior.
- Avoid logging or persisting secrets.
- Prefer structured APIs over string-built commands or queries.
- Verify both allowed and denied paths when possible.
