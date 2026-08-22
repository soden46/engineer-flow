---
name: minimal-change
description: General engineering fallback for smallest safe changes, behavior preservation, narrow diffs, and avoiding overengineering across languages and frameworks.
---

# Minimal Change

Prefer the smallest change that satisfies the task, preserves behavior, and can be verified.

- Reuse existing code and conventions.
- Avoid new abstractions unless they remove real complexity.
- Keep unrelated files and behavior untouched.
- Trace the affected path before editing shared behavior.
- Verify proportionally to risk.
