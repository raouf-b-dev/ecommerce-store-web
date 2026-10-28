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

Requires Node.js LTS (see `.nvmrc`, currently 26) and npm 12.2.1 (pinned in `package.json` `devEngines`).

```bash
git clone https://github.com/YOUR_USERNAME/ecommerce-store-web.git
cd ecommerce-store-web
npm ci
npm run env:init
```

| Goal | Command |
| :--- | :------ |
| UI without a backend (MSW mocks) | `npm run dev:mock` -> [http://localhost:3100](http://localhost:3100) - cart, checkout, addresses, and demo 1-click login are handled in-browser |
| Live API integration | Start the [API](https://github.com/raouf-b-dev/ecommerce-store-api) on port **3000** (CORS must allow `http://localhost:3100` with credentials), then `npm run dev` |
| Refresh OpenAPI types | With the API running: `npm run api:generate` |
| Verify mock handlers (no API) | `npx vitest run src/lib/mock` - contract tests for filters, auth, and 501 fallbacks |

`npm run dev` talks to the real API. `npm run dev:mock` enables MSW (`NEXT_PUBLIC_ENABLE_MOCK=true`) with a Node preload for RSC catalog requests plus a browser worker for client mutations; unimplemented mutating routes return **501** instead of silently hitting the API. Demo quick-login UI appears only in mock mode.

### Node version policy

`.nvmrc` is the single source of truth for the Node.js version and tracks the current Active LTS. CI reads it through `.github/actions/setup-node-ci`. The `Dockerfile` base image (pinned by tag and digest) and `engines` in `package.json` follow it, and `.npmrc` sets `engine-strict=true` so `npm ci` fails on an older Node or npm. Dependabot bumps Node patches and minors in the `Dockerfile` but ignores Node majors. To move to a new LTS, update `.nvmrc`, the `Dockerfile` `FROM` lines, and `engines` (then `npm install --package-lock-only`) in one PR.

### npm version policy

npm is pinned to one exact version through `devEngines.packageManager` in `package.json` (currently npm 12.2.1, `onFail: "error"`), so `npm ci`, `npm install`, and `npm run` fail on any other npm. No Node.js release bundles npm 12 yet, so CI (`.github/actions/setup-node-ci`, with setup-node caching off and `actions/cache` restoring `~/.npm` instead, because setup-node runs the bundled npm in the repo) and the `Dockerfile` read that version from `package.json` and run `npm install -g npm@<version>` before installing dependencies. Locally, run `npm install -g npm@12.2.1` once (global installs ignore this repo's `devEngines`). There is no top-level `packageManager` field, so Corepack stays off. `engines.npm` stays the minimum supported range. npm 12 blocks dependency install scripts unless `allowScripts` in `package.json` allows them: approve new ones with `npm install-scripts approve`, then run `npm rebuild`. To bump npm, change `devEngines.packageManager.version` (CI and Docker follow it) and the version named in these docs. Revisit this pin (and drop the extra install step) once the Node LTS in `.nvmrc` bundles npm 12.

Hosting note: a host that installs with its own bundled npm (for example Vercel, which runs its default npm for `package-lock.json` projects) fails with `EBADDEVENGINES`. Set its install command to `npm install -g npm@12.2.1 && npm ci`.

Details: [README](README.md). Client rules: [`docs/API-INTEGRATION.md`](docs/API-INTEGRATION.md).

## Project rules (non-negotiable)

- Use the **live OpenAPI / generated client**. Do not invent endpoints, filters, DTOs, or guest-cart behavior the API does not expose.
- No BFF: do not add Next Route Handlers or Server Actions that proxy API auth.
- Keep business logic (pricing, stock, RBAC, checkout orchestration) out of the UI.
- Follow conventions in [`AGENTS.md`](AGENTS.md) and [`docs/ai/`](docs/ai/) when touching app structure.

## Before you open a PR

```bash
npm run verify   # lint, typecheck, unit tests
NEXT_PUBLIC_STOREFRONT_ORIGIN=https://storefront.test npm run build
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
