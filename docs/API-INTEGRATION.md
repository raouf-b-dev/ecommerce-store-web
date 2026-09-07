# API Integration

How `ecommerce-store-web` consumes [ecommerce-store-api](https://github.com/raouf-b-dev/ecommerce-store-api).

## Single source of truth

| Concern                            | Source of truth                                                                                                                         |
| :--------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| Paths, methods, DTOs, status codes | API **OpenAPI / Swagger** (`http://localhost:3000/api/docs` locally)                                                                    |
| Auth, cookies, versioning rules    | API docs + OpenAPI                                                                                                                      |
| Local seed users                   | API [`docs/development/SEEDING.md`](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/SEEDING.md)         |
| Local API boot                     | API [`docs/development/LOCAL-SETUP.md`](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/LOCAL-SETUP.md) |
| Delivery sequence                  | [`ROADMAP.md`](ROADMAP.md)                                                                                                              |

Do **not** maintain an endpoint catalog in this repo. When the API adds, renames, or removes routes, regenerate the typed client from OpenAPI and adjust call sites. This file only covers **client-side** rules that are easy to get wrong.

## Base connection

| Item              | Typical local value                                                                                                                                                                                                                       |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storefront origin | `http://localhost:3100`                                                                                                                                                                                                                   |
| API origin        | `http://localhost:3000` (from `NEXT_PUBLIC_API_BASE_URL`)                                                                                                                                                                                 |
| Versioned API     | Confirm versioning scheme in OpenAPI                                                                                                                                                                                                      |
| Health            | Confirm health routes in OpenAPI                                                                                                                                                                                                          |
| CORS              | API `CORS_ALLOWED_ORIGINS` must include the storefront origin **with credentials**. Default API example historically listed admin Vite ports (`5173`/`5174`) and **not** `3100` - add it in the API env; do not disable CORS in this app. |

## Typed client

1. Generate a client from the API OpenAPI document during initial scaffold (`openapi-fetch` + `openapi-typescript`).
2. Prefer that client for domain calls over hand-written `fetch` wrappers.
3. Two constructed clients, one generated `schema.d.ts`: browser (cookies, Bearer, 401 recovery) vs `import 'server-only'` (no credentials, no Bearer, no login redirect). Do not branch on `typeof window` in one file.
4. Treat generated types as disposable: regenerate on API contract change; do not forever hand-edit them.
5. Keep `npm run api:generate` so drift is intentional.

## Rendering split (no BFF)

| Surface                                       | How it talks to the API                                                                   |
| :-------------------------------------------- | :---------------------------------------------------------------------------------------- |
| Public catalog / categories / inventory check | React Server Components. **No** access token. Shopper visibility policy stays on the API. |
| Session, cart, checkout, orders, account      | Browser `apiClient` + TanStack Query. `credentials: 'include'`. Bearer from memory.       |
| Next Server Actions / Route Handlers          | **Do not** use them to proxy the ecommerce API. That is a BFF and is out of scope.        |

Do **not** put `"use cache"` on product or inventory reads in v1 (stale stock). `cacheComponents` still prerenders chrome; wrap catalog fetch UI in `<Suspense>`. Never cache authenticated payloads. Deduplicate RSC fetchers with React `cache()` when metadata and the page share a call. After cart/checkout mutations, `router.refresh()` so RSC HTML is not stale.

## Security (frontend)

See also root [`SECURITY.md`](../SECURITY.md).

- Never put secrets in `NEXT_PUBLIC_*` env vars.
- Access token in memory only. Refresh token is the API’s HttpOnly cookie. Avoid `localStorage` for tokens.
- Do not add `proxy.ts` (or `middleware.ts`) for auth or security headers. Headers belong in `next.config.ts`. Proxy is last-resort rewrites/redirects only. The access token is not in a cookie Next can read.
- Map errors to UI text; do not render API HTML.
- UI gating is not authorization.

## Auth and session

Port the admin SPA rules, minus operator admission:

- Use OpenAPI auth operations (register / login / refresh / logout / change-password).
- Access token in memory; refresh via HttpOnly cookie (`credentials: 'include'`).
- Session bootstrap: `POST` refresh on app mount (client `AuthProvider`). Register returns a profile, not tokens, so successful registration is followed by login.
- Login, refresh, and change-password responses include `mustChangePassword`. When `true`, route to `/change-password` before cart, checkout, or account.
- Seeded **customer** starts with `mustChangePassword: true`. Passwords live only in the API seeding doc.
- The refresh cookie, not the short-lived access token, provides session continuity. Before authenticated browser requests, refresh when the in-memory token is missing, malformed, expired, or near JWT `exp`. The session Query also refreshes before `exp` and on focus/reconnect when the token is unusable. JWT claims are scheduling/chrome input only; the API verifies them.
- Session bootstrap, proactive refresh, and domain `401` recovery share one raw-`fetch` single-flight request. A same-origin Web Lock serializes refresh and logout across tabs. Both are required because the API rotates refresh tokens and treats reuse as session theft.
- A refresh **401** means the cookie is invalid: clear in-memory session and return to login. Refresh **429**, **5xx**, network failures, and malformed success payloads throw and keep the current session for retry. Never silent-retry authentication responses. On success, `onSessionRefreshed` updates `['auth','session']`.
- The session Query is browser-only because the Next server cannot read the API-origin refresh cookie. Catalog RSC remains unauthenticated.
- Login/register **429**: stable “too many requests” copy. Do not map throttle to invalid credentials. QueryClient skips retry on `429`.
- `safeRedirectPath`: only same-origin relative paths; reject `//`; reject `/login` and `/change-password` as redirect targets.
- On `403` with code `MUST_CHANGE_PASSWORD` **or** a message containing `Password change required`, redirect to change-password. Other `403` responses show forbidden; do not invent a bypass.
- There is **no** `access_admin` gate on this app. Do not copy admin `OperatorRoute`.
- RSC catalog fetchers must not attach a Bearer token (an operator session in the browser must not change what the public catalog shows).

## Cart

- Cart HTTP requires `manage_own_cart`. There is **no** anonymous cart in the API.
- Do not keep a `localStorage` basket to “merge later.” Signed-out add-to-cart goes to login/register with `redirect`.
- Persist cart **id** only in `localStorage` (namespaced key). It is not a credential; `sessionStorage` would drop the cart when the tab closes. Clear the id on logout. Do not persist line items locally. The API still enforces ownership.

## Catalog

- Product list/detail and category reads are optional-auth and **active-only** for shoppers.
- Product detail is by **numeric id**. `slug` is a response field, not a lookup key, until OpenAPI says otherwise.
- Bind list query params from the **current** list DTO (search, category, price, sort, pagination). Parse them on the **server** from `searchParams`. Change filters with Next `next/form` GET or `<Link>`. Do not use `useSearchParams` + `setSearchParams` (or `nuqs`) for the product list.
- Inventory: use the public product inventory / check operations. `200 + null` means empty stock row, not an error banner.

## Checkout / idempotency

Checkout is an **async SAGA** on the API. Before coding:

1. Read the checkout operation in Swagger (headers, body, responses).
2. Send `Idempotency-Key` (legacy `x-idempotency-key` / body field only if still documented). Reuse the same key when retrying the **same** attempt.
3. Handle in-progress **409** (`Retry-After`) and fail-closed **503**.
4. HTTP 201 returns `orderId` and `jobId`. There is **no** public job-status route. Poll **GET order by id** until a documented order status (success: `confirmed` or later fulfillment; failure: `payment_failed` / `cancelled`). Do not invent `PENDING → PROCESSING → COMPLETED` as client states.
5. `paymentMethod` is the OpenAPI enum (currently `STRIPE`). The API mock adapter is enough for v1. Do not add card UI until the API wires a real provider.

## Account

- Own orders: `view_own_orders`. Bind list query fields the DTO allows for a self scope; do not expose admin name/email search as shopper chrome.
- Profile read: `GET` user by id with `view_own_profile`. If PATCH remains `manage_users`, keep the profile read-only.
- Addresses: list on user detail; writes with `manage_own_addresses`. Always use the session user id.

## Error UX (client mapping only)

Map API failures to UI. Do not reinterpret domain rules.

| Class                                | Typical storefront behavior                                                                |
| :----------------------------------- | :----------------------------------------------------------------------------------------- |
| Validation (`4xx` with field errors) | Show field/form messages from the payload                                                  |
| `401`                                | Silent refresh + one retry; then sign in                                                   |
| `403`                                | `MUST_CHANGE_PASSWORD` → change-password; else not allowed                                 |
| `404`                                | Not found / empty                                                                          |
| `409`                                | Conflict: checkout in progress → wait/`Retry-After`; OCC → reload (rare on shopper writes) |
| `429`                                | Retryable banner; keep last good data when possible                                        |
| `5xx` / fail-closed infra            | Temporary failure; retry guidance                                                          |

Exact codes and bodies: OpenAPI.

### Client layering (same idea as admin)

| Layer      | Use                                    |
| :--------- | :------------------------------------- |
| `*-api.ts` | `throwApiErrorFromResponse` only       |
| Queries    | status UI + `getErrorMessage`          |
| Actions    | `getErrorMessage` + `ActionErrorAlert` |
| Forms      | `applyApiFormErrors`                   |

Helpers belong in `src/lib/api/` once the browser OpenAPI client exists.

## Capability areas (discover in OpenAPI)

Concrete paths live in Swagger. Typical storefront needs:

- Health / readiness for local diagnostics
- Register, login, refresh, logout, change-password
- Product and category list/detail (shopper-active)
- Public inventory check for a product
- Cart create/read and line-item mutations
- Checkout with idempotency + own order poll
- Customer order list/detail; profile/addresses if present

Out of scope for this app: admin product writes, operator order transitions, analytics, role matrices, anything not meant for customers.

Build order: [`ROADMAP.md`](ROADMAP.md).

## When the API changes

1. Pull / run the new API.
2. Regenerate the OpenAPI client.
3. Fix TypeScript and call sites.
4. Update tests.
5. Only edit this file if a **client rule** changed (auth, RSC split, idempotency, error UX), not because a path string moved.
