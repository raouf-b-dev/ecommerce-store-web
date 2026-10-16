# Storefront end-to-end tests

Playwright starts the storefront on `http://localhost:3100`. Authentication
and customer journey specs require the API to already be running on the configured
`NEXT_PUBLIC_API_BASE_URL` (normally `http://localhost:3000`) with credentials
CORS for the storefront origin.

```bash
npm run test:e2e
```

## Local setup

1. Start a seeded `ecommerce-store-api` (migrate, `npm run db:seed`, then start it) and point `NEXT_PUBLIC_API_BASE_URL` at it. A sibling checkout is the usual local layout. The tests never read that path.
2. In the API `.env.development`, set `THROTTLE_GLOBAL_LIMIT=100000` and restart the API. The storefront server and every browser share one client IP, so the default of 100 requests per minute returns 429 partway through the suite. Global setup stops early with this hint when the limit is lower than 1000. Auth throttles (`THROTTLE_STRICT_LIMIT`) stay as they are.
3. Run `npm run env:init` once (creates `.env.local` and `.secrets` from the examples). [`.secrets.example`](../.secrets.example) ships the published local demo seed password (`Customer123!`). Refresh a stale `.secrets` with `npm run env:init:secrets:force`. Playwright loads `.secrets.example`, then `.secrets`, then `.env.local` (non-empty `process.env` wins).
4. Browsers are not part of `npm install`. If Playwright Chromium is already installed, the suite uses it (same binary as CI). Otherwise it uses installed Google Chrome. To match CI, run once (and again after a Playwright upgrade):

```bash
npm run playwright:install
```

If `cdn.playwright.dev` times out:

```powershell
$env:PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT="300000"
# optional mirror:
# $env:PLAYWRIGHT_DOWNLOAD_HOST="https://storage.googleapis.com"
npm run playwright:install
```

5. Run `npm run test:e2e`. A missing browser fails once in global setup, before the suite.

Playwright reuses a storefront already running on port 3100 (`npm run dev`), which skips recompiling routes between runs. Override the binary with `PLAYWRIGHT_EXECUTABLE_PATH` if needed.

Specs that need a purchasable product use `openInStockProduct` from `e2e/helpers/catalog.ts`. The seed keeps some products at zero stock, and their position on the home page is not stable.

## Projects

Playwright runs four test projects defined in `playwright.config.ts`:

1. **`guest`**: Desktop Chromium/Chrome, in parallel, for unauthenticated flows (smoke tests, catalog browsing, guest session, and public accessibility audits in `a11y-guest.spec.ts`).
2. **`pixel`**: Pixel 5 viewport (375px wide, Chromium/Chrome, touch). Same guest specs as `guest`, in parallel.
3. **`iphone`**: iPhone 14 viewport on Chromium/Chrome (same pattern as the admin dashboard). Guest specs only. There is no WebKit project: it would be a second browser download, and WebKit drops Secure refresh cookies on `http://localhost`.
4. **`customer`**: Desktop Chromium/Chrome, serialized with a single worker (`workers: 1`) for authenticated flows (`00-forced-password.spec.ts`, auth, cart, checkout, orders, account, unified `journey.spec.ts`, and protected accessibility audits in `a11y-customer.spec.ts`). One worker avoids refresh-cookie rotation collisions and stays inside the API's auth rate limit. `00-forced-password` sorts first so the one-shot must-change-password flow runs before other seeded logins. A failure there does not skip the rest of the project.

`shell.spec.ts` pins a 390px viewport so the desktop guest project still opens the mobile menu. Catalog sort below 768px uses the filters sheet.

## Production status check

`playwright.prod.config.ts` builds the storefront, serves it with `next start` on port 3199, and runs `product-production-status.spec.ts`. It checks the product soft 404 contract from [ADR-0009](../docs/architecture/adr/ADR-0009-resource-soft-404-with-noindex.md): missing IDs return `200` with `noindex` in the server `<head>`, and valid products stay indexable. Node-side MSW answers catalog requests, so no API is needed:

```bash
npm run test:e2e:prod
```

## CI

`.github/workflows/ci.yml` runs two Playwright jobs:

- **Production Status E2E** runs `npm run test:e2e:prod` on every pull request and push.
- **Playwright E2E** runs the full suite on pull requests into `master`, pushes to `master`, and manual runs (`api_ref` input, default `master`). The job provisions the API: it clones `ecommerce-store-api`, starts Postgres and Redis from its `docker-compose.yaml`, migrates, runs `npm run db:seed`, and starts the API in development mode with mock payment auto-complete and a raised global request limit (`THROTTLE_GLOBAL_LIMIT`; auth throttles are unchanged). Playwright then calls that API over HTTP. `CI Status Check` fails if this job does not pass on those runs. On failure, the traces and API log are uploaded as the `playwright-e2e-*` artifact.

Both jobs cache `~/.cache/ms-playwright` on the lockfile, then run `npx playwright install --with-deps chromium` (a no-op for the browser zip when the cache hits; OS dependencies still install). `retries` is 1 in CI so `trace: 'on-first-retry'` actually records a trace.

The full suite job copies [`.secrets.example`](../.secrets.example) to `.secrets` before Playwright. `playwright.config.ts` strips empty GitHub secret placeholders (`""`) so the demo defaults apply. Optional repository secrets (`E2E_CUSTOMER_EMAIL`, `E2E_CUSTOMER_PASSWORD`, `E2E_CUSTOMER_NEW_PASSWORD`) override when set. Do not commit `.secrets`.

## Global setup

`e2e/global-setup.ts` runs before the suite and talks only to the running API:

- **Browser check**: Fails once when neither bundled Chromium nor Google Chrome can launch (see [Local setup](#local-setup)).
- **API health**: `GET /health` must return HTTP 200.
- **Catalog**: `GET /v1/products?limit=1` must return at least one product. An empty catalog fails immediately. Seed the API (`npm run db:seed`) before the suite.
- **Rate limit**: Reads `X-RateLimit-Limit` from that response and fails when it is below 1000 (see [Local setup](#local-setup)).

The suite does not clone the API, boot Nest, or reset passwords. `npm run db:seed` and `npm run db:seed:auth` belong to the API repo, against the database the running API uses. Run them there when you prepare data.

The forced-password test (`e2e/00-forced-password.spec.ts`) needs the seeded customer to still be required to change password. Seeding sets that flag. Completing the change clears it, and no storefront request turns it back on. CI seeds a fresh database on every job, so the test runs. A local database survives between runs: after one successful rotation, later runs skip that test until you run `npm run db:seed:auth` in the API repo. The other customer specs keep working. They accept the seed password or the rotated one (`E2E_CUSTOMER_NEW_PASSWORD`, or `<seed>Rotated1!` when that is unset).

## Credentials & Rate Limits

Seeded customer tests require:
- `E2E_CUSTOMER_EMAIL`
- `E2E_CUSTOMER_PASSWORD`
- `E2E_CUSTOMER_NEW_PASSWORD` (optional; helpers derive `<seed>Rotated1!` when omitted)

Local path: `npm run env:init` then `npm run test:e2e`. Demo values match the API [seeding guide](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/SEEDING.md) and [`.secrets.example`](../.secrets.example). Specs that need credentials `test.skip` when still unset after file load.

Authentication routes enforce a throttle of roughly ten attempts per minute. If a test reaches HTTP 429, wait at least 61 seconds (`AUTH_THROTTLE_WAIT_MS`) before retrying.

## Progress output

`npm run verify` prints `==> lint|typecheck|test` before each phase. Long quiet gaps in `npm run test:e2e` are usually API health/catalog checks in global setup or a login throttle wait (~61s); those steps log when they start.

## Accessibility Audits

Accessibility audits powered by `@axe-core/playwright` assert that zero critical or serious WCAG 2.1 AA violations exist across all key storefront pages:
- **Guest**: Home (`/`), Product Detail (`/products/[id]`), plus skip link and mobile menu keyboard navigation.
- **Customer**: Cart (`/cart`), Checkout (`/checkout`), Order Detail (`/orders/[id]`), Account (`/account`), plus modal dialog keyboard escape and focus restoration.
