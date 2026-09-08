# Storefront end-to-end tests

Playwright starts the storefront on `http://localhost:3100`. Authentication
specs require the API to already be running on the configured
`NEXT_PUBLIC_API_BASE_URL` (normally `http://localhost:3000`) with credentials
CORS for the storefront origin.

```bash
npm run test:e2e
```

Most auth tests register unique customers and do not commit or require
passwords. The forced-password test reads `E2E_CUSTOMER_EMAIL` and
`E2E_CUSTOMER_PASSWORD` from `.secrets`; `E2E_CUSTOMER_NEW_PASSWORD` is
optional and otherwise derives a rotated password from the seed password.
The test tries both seed and rotated credentials so it remains rerunnable
without reseeding. Missing required secrets fail CI and skip locally.

Authentication routes are limited to roughly ten attempts per minute. If a
local run reaches HTTP 429, wait at least 61 seconds
(`AUTH_THROTTLE_WAIT_MS`) before retrying. Run auth-focused debugging with one
worker to avoid refresh-cookie rotation and throttle interference:

```bash
npx playwright test e2e/auth.spec.ts e2e/session.spec.ts --workers=1
```

Playwright normally uses its managed Chromium. On a workstation where browser
download is unavailable, `PLAYWRIGHT_EXECUTABLE_PATH` may point to an installed
Chrome/Edge executable; CI should continue using `npx playwright install`.

The session spec intentionally uses an isolated page. Reload drops the
in-memory access token and proves that the API's HttpOnly refresh cookie
restores the session. Clearing browser cookies proves that refresh HTTP 401,
not an expired or missing access token, ends the session.
