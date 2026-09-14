# Storefront end-to-end tests

Playwright starts the storefront on `http://localhost:3100`. Authentication
and customer journey specs require the API to already be running on the configured
`NEXT_PUBLIC_API_BASE_URL` (normally `http://localhost:3000`) with credentials
CORS for the storefront origin.

```bash
npm run test:e2e
```

## Projects

Playwright runs two distinct test projects defined in `playwright.config.ts`:

1. **`guest`**: Runs in parallel for unauthenticated flows (smoke tests, catalog browsing, guest session, and public accessibility audits in `a11y-guest.spec.ts`).
2. **`customer`**: Serialized with a single worker (`workers: 1`) for authenticated flows (auth, cart, checkout, orders, account, unified `journey.spec.ts`, and protected accessibility audits in `a11y-customer.spec.ts`). This prevents refresh-cookie rotation collisions and adheres to the API's ~61s rate limits.

## Database Seeding & Global Setup

`e2e/global-setup.ts` automatically runs before test execution:
- **API Health Check**: Verifies `GET /health` returns HTTP 200.
- **Catalog Verification**: Verifies `GET /v1/products?limit=1` returns active products. If the catalog is empty, it fails immediately — run `npm run db:seed` in `ecommerce-store-api` first.
- **Auth User Reset**: Resets seeded customer credentials via `npm run db:seed:auth` in `E2E_API_REPO_PATH` (defaults to `../ecommerce-store-api`). To skip automated seeding in environments where the database is already prepared, set:
  ```bash
  E2E_SKIP_DB_SEED=1 npm run test:e2e
  ```

## Credentials & Rate Limits

Seeded customer tests (`auth.spec.ts`, `journey.spec.ts`, and `a11y-customer.spec.ts`) require:
- `E2E_CUSTOMER_EMAIL`
- `E2E_CUSTOMER_PASSWORD`
- `E2E_CUSTOMER_NEW_PASSWORD` (optional, derives rotated password if omitted)

Populate these in `.secrets` using `npm run env:init:secrets`. Missing required secrets fail CI immediately (fail-closed) and provide an explicit skip notice locally.

Authentication routes enforce a throttle of roughly ten attempts per minute. If a test reaches HTTP 429, wait at least 61 seconds (`AUTH_THROTTLE_WAIT_MS`) before retrying.

## Accessibility Audits

Accessibility audits powered by `@axe-core/playwright` assert that zero critical or serious WCAG 2.1 AA violations exist across all key storefront pages:
- **Guest**: Home (`/`), Product Detail (`/products/[id]`), plus skip link and mobile menu keyboard navigation.
- **Customer**: Cart (`/cart`), Checkout (`/checkout`), Order Detail (`/orders/[id]`), Account (`/account`), plus modal dialog keyboard escape and focus restoration.
