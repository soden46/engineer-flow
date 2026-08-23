---
name: testing
description: Design and execute automated tests, regression tests, integration tests, end-to-end tests, and verification using framework-agnostic principles.
---

# Testing

Use this skill when work requires automated verification, regression protection, test design, or test maintenance.

This skill is language and framework agnostic.

## Principles

Test observable behavior rather than internal implementation details whenever practical.

Prefer the smallest test scope that gives useful confidence.

Use:

- unit tests for isolated logic
- integration tests for boundaries between components
- contract tests for external interfaces
- end-to-end tests only where broader system behavior must be proven

Do not require every behavior to be tested at every layer.

## Regression Protection

When fixing a defect:

1. reproduce the incorrect behavior
2. add or identify a test that fails for the defect
3. implement the fix
4. verify the regression test passes
5. verify nearby behavior remains intact

## Test Cases

Cover relevant:

- valid paths
- invalid inputs
- boundary values
- authorization failures
- missing resources
- duplicate execution
- failure paths
- state transitions
- concurrency behavior when relevant

Do not manufacture irrelevant edge cases merely to increase test count.

## Test Isolation

Tests should avoid unnecessary dependence on:

- execution order
- shared mutable state
- wall-clock timing
- external network services
- developer machines
- production infrastructure

Control nondeterministic dependencies where appropriate.

## Mocks and Fakes

Mock boundaries, not everything.

Prefer real behavior for inexpensive deterministic components.

Use mocks/fakes when a dependency is:

- slow
- external
- nondeterministic
- destructive
- difficult to reproduce

Do not over-mock implementation details.

## Database Tests

Use realistic persistence behavior when the database interaction itself is what must be verified.

Test:

- constraints
- transactions
- query behavior
- persistence
- rollback
- concurrency when relevant

Do not replace meaningful database behavior with mocks merely to make tests faster.

## API Tests

Verify relevant:

- status/result semantics
- validation
- authorization
- response shape
- side effects
- idempotency
- error behavior

Avoid coupling tests unnecessarily to internal method structure.

## Quality

A useful test should:

- fail for the intended regression
- produce actionable failure information
- avoid unrelated assertions
- remain deterministic
- be maintainable

## Framework Adaptation

Use the project's existing test framework and conventions.

If an adapter exists, translate these principles into native stack mechanisms.

Do not introduce a second test framework without a clear requirement.