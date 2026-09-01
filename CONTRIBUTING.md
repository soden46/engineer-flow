# Contributing to Engineer Flow

Thank you for contributing. Engineer Flow is a framework-agnostic engineering orchestration system. Contributions should preserve that intent.

## 1. Contribution Principles

- Prefer the smallest correct change.
- Reuse existing code and conventions.
- Avoid unrelated changes.
- Preserve the framework/language-agnostic core.
- Do not weaken verification or security.

## 2. Where Changes Belong

| Concern | Location |
| --- | --- |
| Core capability knowledge | `skills/engineer-flow/core/` |
| Orchestration/runtime | `skills/engineer-flow/scripts/` |
| Memory infrastructure | `skills/engineer-flow/infrastructure/memory-management/` |
| Tests | `tests/` |
| Benchmark docs/results | `docs/` and `benchmark-results/` |

## 3. Routing-Sensitive Changes

Changes affecting the following are routing-sensitive:

- capability names
- descriptions
- H1-H3 routing-visible headings
- resolver scoring
- external skill activation
- specialist selection

Routing-sensitive changes must include appropriate routing benchmark or invariant evidence.

Do not bypass:

- routing-surface invariant
- `MAX_SPECIALISTS=2`
- internal/external routing safeguards

Burned heldout datasets v4 and v5 must **never** be executed. Their committed result artifacts are historical only. See `docs/BENCHMARK_STRATEGY.md`.

## 4. Memory Changes

Memory changes must preserve:

- structured schema compatibility
- current/stale/resolved lifecycle
- dedupe and supersession semantics
- legacy `current-state.md` read-only behavior
- secret rejection
- recall read-only behavior
- compaction safety
- archive exclusion from normal recall, unless behavior is intentionally changed and tested

Memory behavior changes require regression tests.

## 5. Security

- Mandatory post-development security review must not be weakened.
- Security gate behavior must remain fail-closed.
- Exact staged-diff review binding must remain intact.
- Security-sensitive changes require regression coverage.

For vulnerability reporting, see [SECURITY.md](SECURITY.md).

## 6. Benchmark Integrity

- Use reproducible methodology.
- Include baseline comparison where applicable.
- Preserve raw results.
- Disclose limitations.
- Do not use cherry-picked headline claims.
- Do not fabricate benchmark numbers.
- Correctness and security must not be sacrificed for lower tokens, LOC, cost, or latency.

## 7. Cross-Platform Expectation

Changes affecting runtime, install, hooks, or CLI should consider:

- Windows
- Linux/macOS

Do not claim compatibility without testing or evidence.

## 8. Local Validation

Before submitting a PR, run:

```bash
npm run validate
npm run self-test
npm run inventory
npm run test:normalization
npm run test:routing-surface
npm run test:security-gate
npm run test:heldout-burn-guard
npm run test:memory
npm run test:doctor
npm run benchmark:routing
git diff --check
```

Do not run burned heldout v4/v5 datasets.

## 9. Commits and PRs

- Write focused commits.
- Use clear commit messages.
- Explain why, not just what.
- Include tests.
- Note routing, security, or memory impact.
- Include benchmark evidence when required.
- Avoid unrelated refactors.

## 10. Good First Contributions

Examples of appropriate first contributions:

- documentation corrections
- test coverage improvements
- cross-platform fixes
- reproducibility improvements
- verified compatibility documentation

Routing redesign and security-gate changes are not beginner work.
