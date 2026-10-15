# Storefront end-to-end tests

Playwright starts the storefront on `http://localhost:3100`. Authentication
and customer journey specs require the API to already be running on the configured
`NEXT_PUBLIC_API_BASE_URL` (normally `http://localhost:3000`) with credentials
CORS for the storefront origin.

```bash
npm run test:e2e
```

## Projects

Playwright runs four test projects defined in `playwright.config.ts`:

1. **`guest`**: Desktop Chrome, in parallel, for unauthenticated flows (smoke tests, catalog browsing, guest session, and public accessibility audits in `a11y-guest.spec.ts`).
2. **`pixel`**: Pixel 5 (Chromium, touch) with the viewport width set to 375px. Same guest specs as `guest`, in parallel.
3. **`iphone`**: iPhone 14 (WebKit, touch) at its 390px viewport. Same guest specs as `guest`, in parallel.
4. **`customer`**: Desktop Chrome, serialized with a single worker (`workers: 1`) for authenticated flows (auth, cart, checkout, orders, account, unified `journey.spec.ts`, and protected accessibility audits in `a11y-customer.spec.ts`). This prevents refresh-cookie rotation collisions and adheres to the API's ~61s rate limits. Authenticated specs stay on this project only.

`shell.spec.ts` pins a 390px viewport so the desktop guest project still opens the mobile menu. Catalog sort below 768px uses the filters sheet.

## Production status check

`playwright.prod.config.ts` builds the storefront, serves it with `next start` on port 3199, and runs `product-production-status.spec.ts`. It checks the product soft 404 contract from [ADR-0009](../docs/architecture/adr/ADR-0009-resource-soft-404-with-noindex.md): missing IDs return `200` with `noindex` in the server `<head>`, and valid products stay indexable. Node-side MSW answers catalog requests, so no API is needed:

```bash
npm run test:e2e:prod
```

## CI

`.github/workflows/ci.yml` runs two Playwright jobs:

- **Production Status E2E** runs `npm run test:e2e:prod` on every pull request and push.
- **Playwright E2E** runs the full suite on pull requests into `master`, pushes to `master`, and manual runs (`api_ref` input, default `master`). It clones `ecommerce-store-api` next to the checkout, starts Postgres and Redis from its `docker-compose.yaml`, migrates, runs `npm run db:seed`, and starts the API in development mode with mock payment auto-complete and a raised global request limit (`THROTTLE_GLOBAL_LIMIT`; auth throttles are unchanged). `CI Status Check` fails if this job does not pass on those runs. On failure, the traces and API log are uploaded as the `playwright-e2e-*` artifact.

The full suite needs the `E2E_CUSTOMER_EMAIL` and `E2E_CUSTOMER_PASSWORD` repository secrets (values from the API seeding guide). Dependabot pull requests target `master`, so the same two values must also be set as Dependabot secrets.

## Database Seeding & Global Setup

`e2e/global-setup.ts` automatically runs before test execution:
- **API Health Check**: Verifies `GET /health` returns HTTP 200.
- **Catalog Verification**: Verifies `GET /v1/products?limit=1` returns active products. If the catalog is empty, it fails immediately - run `npm run db:seed` in `ecommerce-store-api` first.
- **Auth User Reset**: Resets seeded customer credentials via `npm run db:seed:auth` in `E2E_API_REPO_PATH` (defaults to `../ecommerce-store-api`). To skip automated seeding in environments where the database is already prepared, set:
  ```bash
  E2E_SKIP_DB_SEED=1 npm run test:e2e
  ```

## Credentials & Rate Limits

Seeded customer tests (`auth.spec.ts`, `journey.spec.ts`, and `a11y-customer.spec.ts`) require:
- `E2E_CUSTOMER_EMAIL`
- `E2E_CUSTOMER_PASSWORD`
- `E2E_CUSTOMER_NEW_PASSWORD` (optional, derives rotated password if omitted)

Populate these in `.secrets` using `npm run env:init:secrets`. Seed account values live in the API [seeding guide](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/SEEDING.md). Missing required secrets fail CI immediately (fail-closed) and provide an explicit skip notice locally.

Authentication routes enforce a throttle of roughly ten attempts per minute. If a test reaches HTTP 429, wait at least 61 seconds (`AUTH_THROTTLE_WAIT_MS`) before retrying.

## Accessibility Audits

Accessibility audits powered by `@axe-core/playwright` assert that zero critical or serious WCAG 2.1 AA violations exist across all key storefront pages:
- **Guest**: Home (`/`), Product Detail (`/products/[id]`), plus skip link and mobile menu keyboard navigation.
- **Customer**: Cart (`/cart`), Checkout (`/checkout`), Order Detail (`/orders/[id]`), Account (`/account`), plus modal dialog keyboard escape and focus restoration.
