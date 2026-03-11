# AGENTS.md

Repository-level guidance for human and AI contributors.

## Core Principles

- Prioritize correctness, readability, and maintainability over cleverness.
- Keep changes small, scoped, and easy to review.
- Prefer explicit code and stable interfaces to hidden magic.
- Preserve backward compatibility unless a breaking change is intentional and documented.
- Make behavior observable: structured logs, meaningful errors, and tests for critical paths.

## Node.js + TypeScript Standards

- Use modern TypeScript features safely: `satisfies`, discriminated unions, utility types, and `as const` when appropriate.
- Favor strict typing end-to-end; avoid `any` unless unavoidable and documented inline.
- Validate all untrusted input at boundaries (HTTP, queue, env, file, third-party APIs).
- Keep domain logic framework-agnostic; isolate transport concerns in controllers/handlers.
- Prefer async/await and propagate typed errors; never swallow promise rejections.

## Architecture Guidelines

- Follow a layered design:
  - `routes/controllers`: transport and request mapping
  - `services/use-cases`: business logic
  - `repositories/gateways`: persistence and external integrations
  - `domain/types`: core models and invariants
- Use dependency injection via constructor params/factories for testability.
- Keep side effects at the edges; core logic should be deterministic where possible.

## Code Quality and Tooling

- Keep lint and type checks passing.
- Use consistent naming:
  - `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.schema.ts`, `*.test.ts`
- Keep functions short and focused; extract helpers before complexity grows.
- Add comments only when intent is non-obvious.
- Remove dead code and stale TODOs during touched-file edits.

## Security, Reliability, Performance

- Never commit secrets. Use environment variables and secure secret stores.
- Enforce authn/authz checks at entry points and sensitive service methods.
- Add request timeouts/retries/circuit-breaker behavior for external calls.
- Use idempotency for retryable write operations.
- Avoid N+1 calls and repeated expensive computations in hot paths.

## Testing Expectations

- Unit test business logic and edge cases.
- Add integration tests for persistence boundaries and API contracts.
- Add regression tests for every production bug fix.
- Keep tests deterministic: no network calls in unit tests, fixed clocks/seeds where needed.

## Pull Request Expectations

- Include concise “why” in PR description, not only “what”.
- Highlight risks, migrations, and rollout/rollback notes.
- Include test evidence (commands and key outcomes).
- Prefer incremental PRs over large multi-concern changes.

