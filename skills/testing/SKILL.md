---
name: testing
description: General testing fallback for selecting focused unit, integration, regression, smoke, and end-to-end checks across languages and frameworks.
---

# Testing

Choose tests that prove behavior, not implementation details.

- Add or run the narrowest regression test for the changed behavior.
- Prefer existing test style and helpers.
- Cover failure paths for risky code.
- Use smoke checks for packaging, CLI, or integration changes.
- Report any unverified risk clearly.
