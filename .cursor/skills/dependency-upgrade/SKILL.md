# Dependency Upgrade

Use this skill for upgrading Node.js/TypeScript packages safely and incrementally.

## Goal

Upgrade dependencies with minimal risk, clear compatibility checks, and rollback confidence.

## Upgrade Strategy

1. Inventory:
   - Determine target packages and current usage surface.
2. Classify risk:
   - Patch/minor/major and runtime/build/test/tooling impact.
3. Read release notes/changelogs:
   - Identify breaking changes, migrations, and deprecations.
4. Upgrade in small batches:
   - Prefer one major dependency family per PR.
5. Migrate code/config:
   - Apply required API/config updates and remove deprecated usage.
6. Validate:
   - Typecheck, lint, unit/integration tests, and key runtime paths.

## Safety Checklist

- [ ] Lockfile updated and reproducible install confirmed.
- [ ] Peer dependency constraints are satisfied.
- [ ] Engine requirements (Node/npm/pnpm) remain compatible.
- [ ] Build output and startup flow verified.
- [ ] Security advisories reviewed if relevant.
- [ ] Rollback plan is obvious (revert commit or downgrade path).

## Node + TS Specific Notes

- Watch for ESM/CJS behavior shifts in major upgrades.
- Revalidate TS compiler options affected by tooling updates.
- Update test runners/mocks if module resolution behavior changed.
- Confirm runtime differences between dev and production builds.

## Done Criteria

- Upgraded packages are stable in CI-representative checks.
- Migration notes captured in PR summary.
- No unexplained behavior changes.

