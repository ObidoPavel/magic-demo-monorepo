# Implement Node Feature

Use this skill when implementing or extending Node.js + TypeScript features.

## Goal

Deliver production-safe feature changes with clear architecture boundaries, tests, and observability.

## Inputs to Gather First

- User intent and acceptance criteria.
- Existing module/layer where feature belongs.
- Data contracts involved (input/output/schema).
- Non-functional constraints (latency, reliability, security).

## Workflow

1. Clarify feature behavior and edge cases from existing code/tests.
2. Identify impacted layers (controller/service/repository/domain).
3. Define or update types and validation schemas first.
4. Implement business logic with explicit error handling.
5. Integrate transport mapping (HTTP/status/error envelopes) if needed.
6. Add or update unit + integration tests.
7. Verify lints/types/tests for changed scope.

## Implementation Checklist

- [ ] No `any` introduced without clear rationale.
- [ ] Input validation at boundary is enforced.
- [ ] Domain logic is isolated from framework/transport concerns.
- [ ] Errors are typed and mapped consistently.
- [ ] Tests cover happy path + key failures.
- [ ] Logging/metrics added for critical behavior.

## Definition of Done

- Feature matches acceptance criteria.
- Tests are deterministic and passing.
- Typecheck/lint pass for touched files.
- API contract updates included if externally visible.

