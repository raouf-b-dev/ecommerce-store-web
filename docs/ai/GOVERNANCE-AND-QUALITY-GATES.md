# Governance and Quality Gates

## Merge Gates

The baseline gates for this repository (PR and the `ci` GitHub Actions job) are:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm audit --omit=dev --audit-level=high`

Those checks run as parallel jobs. Require **CI Status Check** (`ci`) in branch protection, not the individual job names.

Weekly Dependabot version updates (npm + GitHub Actions) live in [`.github/dependabot.yml`](../../.github/dependabot.yml).

Prettier is installed for local formatting. `format:check` is not a merge gate.

## Playwright

A home-page smoke spec exists under `e2e/` for local use (`npm run test:e2e`). Playwright is **not** part of the `ci` aggregator yet. It joins the aggregator when the quality-sweep policy is enabled (see [`docs/ROADMAP.md`](../ROADMAP.md)).

Until then, do not require Playwright job success in branch protection.

Locally, run the smoke spec against `npm run dev` on port 3100. Authenticated journeys need a live seeded API and `.secrets` (`npm run env:init:secrets`). Do not commit `.secrets`.

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

ADRs are immutable historical documents for their **decision body**: do not edit Context / Decisions / Alternatives / Consequences. **Status** (and supersede header/index links) may be updated when a later ADR fully replaces one. See [`docs/architecture/adr/README.md`](../architecture/adr/README.md) and [`docs/ai/CONVENTIONS.md`](./CONVENTIONS.md) §8.
