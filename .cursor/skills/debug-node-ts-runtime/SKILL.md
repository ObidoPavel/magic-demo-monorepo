# Debug Node TS Runtime

Use this skill for runtime failures, crashes, hangs, memory issues, and async bugs in Node.js + TypeScript.

## Goal

Find root cause quickly with evidence, then implement the smallest safe fix and regression protection.

## Debug Flow

1. Reproduce reliably:
   - Capture exact command, environment, and payload.
   - Reduce to the smallest failing case.
2. Collect signals:
   - Stack traces, logs, request IDs, and timestamps.
   - Recent code/config/dependency changes.
3. Isolate fault domain:
   - Input validation, business logic, I/O boundaries, or infra assumptions.
4. Confirm hypothesis:
   - Add temporary instrumentation or focused tests.
5. Fix minimally:
   - Preserve existing behavior outside bug scope.
6. Prevent recurrence:
   - Add regression test and targeted guards/observability.

## Common Node/TS Pitfalls

- Unhandled promise rejections and floating promises.
- ESM/CJS interop and path resolution mismatches.
- Timezone/Date parsing inconsistencies.
- Race conditions from shared mutable state.
- Connection pool exhaustion and missing timeouts.
- Serialization issues with `bigint`, `Date`, or circular objects.

## Runtime Diagnostics Tips

- Use structured logs with correlation IDs.
- Add short-lived, high-signal logging around suspected branches.
- Check memory/CPU/event-loop behavior for hangs.
- Validate environment variables and secret loading paths.

## Exit Criteria

- Root cause is documented in one sentence.
- Fix is verified by test and/or deterministic reproduction.
- No new lint/type failures introduced.

