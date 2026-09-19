# Contributing

Thanks for your interest in improving the customer storefront. This repository is UI, routing, and client integration only. Domain rules, authz, and payments live in the [API](https://github.com/raouf-b-dev/ecommerce-store-api).

## Code of Conduct

By participating, you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## How we accept changes

1. **Fork** this repository (write access on the upstream is not expected).
2. Create a branch from `develop` (`feature/...`, `fix/...`, or `docs/...`).
3. Open a **pull request** into `develop` (or `master` only when maintainers ask for a release hotfix).
4. Keep PRs focused. Large refactors should be discussed in an issue first.

Do not push directly to `master` or `develop`. Force-pushes and branch deletion on the upstream are blocked by repository rulesets.

## Local setup

Requires Node.js 24+ and npm 11+ (see `.nvmrc`).

```bash
git clone https://github.com/YOUR_USERNAME/ecommerce-store-web.git
cd ecommerce-store-web
npm ci
npm run env:init
```

| Goal | Command |
| :--- | :------ |
| UI without a backend | `npm run dev:mock` → [http://localhost:3100](http://localhost:3100) |
| Full stack | Start the [API](https://github.com/raouf-b-dev/ecommerce-store-api) on port **3000** (CORS must allow `http://localhost:3100` with credentials), then `npm run dev` |
| Refresh OpenAPI types | With the API running: `npm run api:generate` |

Details: [README](README.md). Client rules: [`docs/API-INTEGRATION.md`](docs/API-INTEGRATION.md).

## Project rules (non-negotiable)

- Use the **live OpenAPI / generated client**. Do not invent endpoints, filters, DTOs, or guest-cart behavior the API does not expose.
- No BFF: do not add Next Route Handlers or Server Actions that proxy API auth.
- Keep business logic (pricing, stock, RBAC, checkout orchestration) out of the UI.
- Follow conventions in [`AGENT.md`](AGENT.md) and [`docs/ai/`](docs/ai/) when touching app structure.

## Before you open a PR

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Playwright needs a live API; see [`e2e/README.md`](e2e/README.md). Prefer unit/component coverage for client islands in the same PR as the feature.

### PR checklist

- [ ] Targets `develop` from a fork branch
- [ ] Lint, typecheck, and unit tests pass locally
- [ ] OpenAPI client regenerated if the contract changed
- [ ] No secrets in `NEXT_PUBLIC_*` or committed env files
- [ ] Docs updated when behavior or setup changes

## Issues and security

- **Bugs / features:** open a GitHub issue with reproduction steps or a clear problem statement.
- **Security:** do not file a public issue with exploit detail. Follow [`SECURITY.md`](SECURITY.md).

## Related repositories

| Repository | Role |
| :--------- | :--- |
| [ecommerce-store-api](https://github.com/raouf-b-dev/ecommerce-store-api) | Backend |
| [ecommerce-admin-dashboard](https://github.com/raouf-b-dev/ecommerce-admin-dashboard) | Operator SPA |

Questions welcome via issues. Maintainers will review PRs as capacity allows.
