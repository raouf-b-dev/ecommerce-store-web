# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- CI runs the full Playwright suite against a seeded API on pull requests into `master` and pushes to `master`, and `CI Status Check` requires it there. The production status spec runs on every pull request.

## [0.4.0] - 2026-10-15

Works with ecommerce-store-api v0.10.0 or later.

### Changed

- **Breaking:** checkout sends payment method `CARD` and an `Idempotency-Key` header, so API v0.10.0 is required (#76, #77).
- User profile menu overhaul: the header session links are now a dropdown user menu (#76).
- Tests use the production compiler, plus mobile Playwright projects (#74).
- Generated API client synced with API v0.10.0.
- `shadcn` moved to devDependencies with vulnerable subdependencies updated; Dependabot target and CI triggers cleaned up.
- Agent check workflow for in-chat verification (#80) and slimmer agent guidance (#70).

### Fixed

- Add-to-cart errors are shown instead of silently creating a new cart (#75).
- No horizontal overflow on small checkout screens (#72).
- Custom address validation errors are shown (#71).

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
