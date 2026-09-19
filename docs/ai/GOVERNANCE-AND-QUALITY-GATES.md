# Governance and Quality Gates

## Merge Gates

The baseline gates for this repository (PR and the `ci` GitHub Actions job) are:

- `npm run lint` (`eslint .` plus `scripts/lint-ascii-prose.cjs` for docs/comments)
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm audit --omit=dev --audit-level=high`

Those checks run as parallel jobs. Require **CI Status Check** (`ci`) in branch protection, not the individual job names. The aggregator in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) depends on `lint`, `typecheck`, `unit-tests`, `build`, and `audit` only.

Weekly Dependabot version updates (npm + GitHub Actions) live in [`.github/dependabot.yml`](../../.github/dependabot.yml).

Prettier is installed for local formatting. `format:check` is not a merge gate.

## Playwright & End-to-End Governance

Playwright covers smoke, catalog, auth, cart, checkout, order fulfillment, account address book, the unified customer journey (`e2e/journey.spec.ts`), and automated WCAG 2.1 AA audits (`e2e/a11y-guest.spec.ts`, `e2e/a11y-customer.spec.ts`).

### Merge Gates and CI Policy

Aligned with [`ci.yml`](../../.github/workflows/ci.yml):

- **Pull requests and pushes:** five parallel fast checks (`lint`, `typecheck`, `unit-tests`, `build`, `audit`) aggregated by the `ci` status check. Playwright is **not** part of that aggregator.
- **E2E in CI (`workflow_dispatch` only):** the `e2e` job runs only on manual dispatch against an accessible live/staging API (`E2E_API_BASE_URL`) with configured `E2E_*` secrets. Missing secrets fail-closed (no skip-to-green). GitHub-hosted runners do not bootstrap polyrepo Docker services on every PR.
- **Branch Protection:** Require the **CI Status Check** (`ci`) job.

### Local Execution & Seeding Conventions

- Run `npm run test:e2e` against a running API on port 3000.
- `e2e/global-setup.ts` verifies API connectivity, confirms active catalog items, and resets customer credentials via `npm run db:seed:auth` in `ecommerce-store-api` (unless `E2E_SKIP_DB_SEED=1`).
- Catalog must be seeded via `npm run db:seed` in `ecommerce-store-api` before journey tests.
- Populate customer credentials in `.secrets` using `npm run env:init:secrets`. Never commit `.secrets`.
- All audited pages must have zero `serious` or `critical` accessibility violations detected by `@axe-core/playwright`.

## Definition of Done

A feature is not done until:

1. It uses the OpenAPI contract or generated client for integration.
2. Component or unit tests for the new client behavior pass (Playwright for RSC routes when they join the critical path).
3. Lint and typecheck pass.
4. Any relevant API integration or security notes stay accurate.
5. Manual verification confirms the UI behavior that changed.

## Escalation Cases

Stop and clarify when:

- auth/session behavior is ambiguous
- CORS or cookie behavior differs from the expected contract
- API docs and runtime behavior disagree
- a change tempts the UI to own domain rules
- a change would add a BFF (Route Handlers or Server Actions that call the ecommerce API)

## ADR triggers

Write an ADR in `docs/architecture/adr/ADR-XXXX-[title].md` when a change affects:

- RSC vs browser client split, or introducing a BFF
- Session/token storage strategy
- Mid-request auth recovery (silent refresh / retry policy)
- Guest vs authenticated cart
- Checkout completion (order polling vs job-status API)
- Introducing a request-interception layer for auth, headers, or resource existence (see [ADR-0006](../architecture/adr/ADR-0006-security-headers-and-client-auth.md), [ADR-0008](../architecture/adr/ADR-0008-resource-404-via-app-router.md))

### ADR lifecycle states

- **`Proposed`**: Written during design; awaiting approval
- **`Accepted`**: Approved and in effect
- **`Deprecated`**: No longer recommended
- **`Superseded`**: Obsoleted by a later ADR (must link the successor)

ADRs are immutable historical documents for their **decision body**: do not edit Context / Decisions / Alternatives / Consequences. **Status** (and supersede header/index links) may be updated when a later ADR fully replaces one. See [`docs/architecture/adr/README.md`](../architecture/adr/README.md) and [`docs/ai/CONVENTIONS.md`](./CONVENTIONS.md) §10.
