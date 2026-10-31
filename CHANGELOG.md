# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Shoppers can cancel eligible orders from the order details page. The Cancel order button requires the `cancel_own_orders` or `manage_orders` permission and a cancellable status (`pending_payment`, `payment_failed`, or `confirmed`). Needs an ecommerce-store-api with `cancel_own_orders` (API [#408](https://github.com/raouf-b-dev/ecommerce-store-api/pull/408)) ([#149](https://github.com/raouf-b-dev/ecommerce-store-web/pull/149)).

## [0.7.0] - 2026-10-28

Works with ecommerce-store-api v0.10.0 or later. The generated client matches API v0.11.0.

### Added

- **Breaking (contributors):** Pin npm 12.2.1 through `devEngines.packageManager` (`onFail: "error"`) as the single source for the npm version. The CI setup action and the `Dockerfile` deps and build stages install it from `package.json`, because no Node release bundles npm 12 yet. `devEngines.runtime` (`node >=26.0.0`) restores the Node guardrail, which npm 12 no longer enforces from root `engines`. CONTRIBUTING gains an npm version policy ([#129](https://github.com/raouf-b-dev/ecommerce-store-web/pull/129)).
- Node version guardrails: `.npmrc` with `engine-strict=true`, a Dependabot `docker` entry that ignores Node majors, and a Node version policy in CONTRIBUTING (`.nvmrc` is the single source) ([#128](https://github.com/raouf-b-dev/ecommerce-store-web/pull/128)).

### Changed

- MSW HTTP handlers import `http` and `HttpResponse` from the `msw/http` entry point that msw 3 documents (`passthrough` stays on the root `msw` export, which is its only entry point) ([#130](https://github.com/raouf-b-dev/ecommerce-store-web/pull/130)).
- CONTRIBUTING passes `prettier --check` and its Node version policy names every copy of the Node version (`.nvmrc`, the `Dockerfile` `FROM` lines, `engines.node`, `devEngines.runtime`) and the pinned npm 12.2.1 ([#130](https://github.com/raouf-b-dev/ecommerce-store-web/pull/130)).
- **Breaking (contributors):** Move to Node.js 26 LTS (npm 11.6+): `.nvmrc`, `engines`, and the `Dockerfile` base image, now pinned to `node:26.12.1-alpine3.24` by digest. The CI setup action uses `actions/setup-node` v7.1.0 ([#128](https://github.com/raouf-b-dev/ecommerce-store-web/pull/128)).
- Migrate to msw 3.0.3: `onUnhandledRequest` is now `onUnhandledFrame`, and `public/mockServiceWorker.js` is regenerated ([#124](https://github.com/raouf-b-dev/ecommerce-store-web/pull/124)).
- Dependency updates: production deps, including `@hookform/resolvers` 6.0.0 ([#106](https://github.com/raouf-b-dev/ecommerce-store-web/pull/106), [#120](https://github.com/raouf-b-dev/ecommerce-store-web/pull/120), [#121](https://github.com/raouf-b-dev/ecommerce-store-web/pull/121)); dev deps, including `@babel/core` 8.0.7, `globals` 17.13.0, `hono`, `qs`, and the dev-deps group ([#109](https://github.com/raouf-b-dev/ecommerce-store-web/pull/109), [#110](https://github.com/raouf-b-dev/ecommerce-store-web/pull/110), [#113](https://github.com/raouf-b-dev/ecommerce-store-web/pull/113), [#122](https://github.com/raouf-b-dev/ecommerce-store-web/pull/122), [#123](https://github.com/raouf-b-dev/ecommerce-store-web/pull/123)); transitive `vite`, `fast-uri`, and `undici` ([#112](https://github.com/raouf-b-dev/ecommerce-store-web/pull/112), [#114](https://github.com/raouf-b-dev/ecommerce-store-web/pull/114), [#115](https://github.com/raouf-b-dev/ecommerce-store-web/pull/115)); GitHub Actions `actions/cache` 6.1.0, `actions/upload-artifact` 7.0.2, and `docker/login-action` 4.7.0 ([#104](https://github.com/raouf-b-dev/ecommerce-store-web/pull/104), [#105](https://github.com/raouf-b-dev/ecommerce-store-web/pull/105), [#119](https://github.com/raouf-b-dev/ecommerce-store-web/pull/119)).
- `CITATION.cff` is bumped to version 0.7.0, released 2026-10-28 ([#131](https://github.com/raouf-b-dev/ecommerce-store-web/pull/131)).
- README: the placeholder Live demo section becomes Hosted demo: coming soon and points to the local [ecommerce-platform](https://github.com/raouf-b-dev/ecommerce-platform) stack (`docker compose up`); local sign-in accounts link to the platform README Local demo sign-in section and the API SEEDING.md ([#133](https://github.com/raouf-b-dev/ecommerce-store-web/pull/133)).

### Fixed

- The user menu trigger passes axe-core 4.14 `label-content-name-mismatch`: an sr-only label replaces its `aria-label`, and the visible initial and email prefix are `aria-hidden` ([#123](https://github.com/raouf-b-dev/ecommerce-store-web/pull/123)).

[Compare v0.6.0...v0.7.0](https://github.com/raouf-b-dev/ecommerce-store-web/compare/v0.6.0...v0.7.0)

## [0.6.0] - 2026-10-18

Works with ecommerce-store-api v0.10.0 or later. The generated client matches API v0.11.0.

### Added

- Production Docker image (Next.js standalone, port 3100) published to `ghcr.io/raouf-b-dev/ecommerce-store-web` for linux/amd64 and linux/arm64 on pushes to master and `v*` tags. Run-time `API_BASE_URL` (browser) and server-only `API_INTERNAL_BASE_URL` override the build-time API origin, and `NEXT_PUBLIC_ALLOW_LOOPBACK_ORIGIN` / `IMAGES_ALLOW_LOCAL_IP` are explicit opt-ins, off by default (#100).

### Changed

- Stop tracking generated `next-env.d.ts` (#99).
- E2E stock headroom, typed refetch stubs, and dash fallbacks for nullable API fields (#98).

[Compare v0.5.0...v0.6.0](https://github.com/raouf-b-dev/ecommerce-store-web/compare/v0.5.0...v0.6.0)

## [0.5.0] - 2026-10-17

Works with ecommerce-store-api v0.10.0 or later. The generated client matches v0.11.0.

### Changed

- **Breaking:** production builds require `NEXT_PUBLIC_API_BASE_URL` and fail without it instead of calling localhost; CI sets `https://api.test` (#94).
- Generated API client synced with API v0.11.0: order item SKU, customer name and shipping address may be null and render as `-`; cart items carry a nullable `sku` (#94).
- README storefront walkthrough image updated (#89).
- Dependency updates: production deps (TanStack Query, lucide-react, radix-ui, react-hook-form, zod) and dev deps (Playwright 1.64, Vitest 5.0.4, ESLint 10.12 and others) (#85, #86).

### Fixed

- Add-to-cart fails with a clear error when cart creation returns no cart id (#94).
- `npm run verify` finds the npm CLI through `npm_execpath` on Windows and Unix, and MSW install scripts are allowed so `npm install` stays quiet (#91).

[Compare v0.4.0...v0.5.0](https://github.com/raouf-b-dev/ecommerce-store-web/compare/v0.4.0...v0.5.0)

## [0.4.0] - 2026-10-15

Works with ecommerce-store-api v0.10.0 or later.

### Changed

- **Breaking:** checkout sends payment method `CARD` and an `Idempotency-Key` header, so API v0.10.0 is required (#76, #77).
- User profile menu overhaul: the header session links are now a dropdown user menu (#76).
- Tests use the production compiler, plus mobile Playwright projects (#74).
- Generated API client synced with API v0.10.0.
- `shadcn` moved to devDependencies with vulnerable subdependencies updated; Dependabot target and CI triggers cleaned up.
- Agent check workflow for in-chat verification (#80) and slimmer agent guidance (#70).
- CI runs the full Playwright suite against a seeded API on pull requests into `master` and pushes to `master`, and `CI Status Check` requires it there. The production status spec runs on every pull request (#83).
- README showcase screenshots and walkthrough regenerated for the user menu and contrast updates.

### Fixed

- Add-to-cart errors are shown instead of silently creating a new cart (#75).
- No horizontal overflow on small checkout screens (#72).
- Custom address validation errors are shown (#71).
- Guest mobile nav shows on auth error; muted foreground and selected country combobox meet WCAG AA; checkout custom-address fade-in removed (#83).

[Compare v0.3.1...v0.4.0](https://github.com/raouf-b-dev/ecommerce-store-web/compare/v0.3.1...v0.4.0)

## [0.3.1] - 2026-09-29

### Changed

- Image allow-list: `NEXT_PUBLIC_API_BASE_URL` is always permitted; extra hosts go in `NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS`.
- Shared error pages use a retry action instead of a reset prop; API request errors carry causes more clearly.
- Phase 14c on the roadmap is a live deploy against hosted API staging. `dev:mock` stays local; there is no hosted MSW demo.
- AUTHORS format aligned; storefront `CITATION.cff` author now has a website.
- Dev dependencies: ESLint 10, Vitest 5, jsdom 30. GitHub Actions `checkout` v7.

## [0.3.0] - 2026-09-28

Works with ecommerce-store-api v0.9.0 or later (order line images use `imageUrl`).

### Added

- Merchandising homepage (hero, categories, new arrivals).
- Dedicated catalog route with a compact filter bar.
- Explicit shipping costs, country combobox, and order line images in cart/checkout.
- Shop brand identity, theme tokens, and product image placeholders.
- Mock product image fixtures and one-click demo login.

[Compare v0.2.0...v0.3.0](https://github.com/raouf-b-dev/ecommerce-store-web/compare/v0.2.0...v0.3.0)

## [0.2.0] - 2026-09-20

First customer-complete storefront after the v0.1.0 shell. Shoppers can register, sign in, browse, cart, checkout (mock payments), poll confirmation, and manage orders and addresses. Targets API v0.8.0. No guest cart. Playwright still needs a live API; `npm run dev:mock` is the offline preview.

[Compare v0.1.0...v0.2.0](https://github.com/raouf-b-dev/ecommerce-store-web/compare/v0.1.0...v0.2.0)

## [0.1.0] - 2026-09-07

Next.js 16 App Router foundation, agent docs, OpenAPI client, CI, and port 3100. Auth, catalog, cart, and checkout were out of scope.

[Compare v0.1.0](https://github.com/raouf-b-dev/ecommerce-store-web/releases/tag/v0.1.0)
