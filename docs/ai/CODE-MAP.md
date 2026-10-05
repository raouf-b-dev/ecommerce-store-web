# Code Map

Where things live in `ecommerce-store-web`. Paths are relative to the repository root.

## Role

Customer storefront for `ecommerce-store-api`. It consumes the versioned HTTP contract, owns no domain rules, and may hide or disable actions for UX while the API stays the authority for auth and data integrity. There is no BFF.

| Surface                         | How it talks to the API                                                   |
| ------------------------------- | ------------------------------------------------------------------------- |
| Public catalog                  | RSC, `server-client.ts`, no access token                                  |
| Diagnostics `/status`           | RSC, `server-client.ts`, unauthenticated health and readiness             |
| Session                         | `browser-client.ts` + TanStack Query, refresh-cookie keep-alive           |
| Cart, checkout, orders, account | `browser-client.ts` + TanStack Query                                      |

## Source

- `src/app/`: thin routes. Groups `(shop)` (catalog, cart, checkout, status), `(auth)` (login, register, change-password; chrome only, `GuestRoute` wraps the pages), `(account)` (account, orders; layout-level `ProtectedRoute`). `providers.tsx` composes Theme, mock bootstrap, browser `QueryClient`, `AuthProvider`, and the toaster.
- `src/components/`: `layout/` (skip link, header, footer, mobile nav, chrome, `AccountNav`), `media/` (`ProductImage`), `theme/`, `feedback/` (`QueryStateAlert`, `QueryLoading`, `QueryListRegion`, `ActionErrorAlert`, `EmptyState`; not for RSC catalog), `forms/`, `seo/`, `ui/` (shadcn primitives, `StatusBadge`), `mock/`.
- `src/features/<name>/`: `auth` (forms, schemas, field matchers), `catalog` (RSC list and detail, filters, SEO), `cart`, `checkout` (form, idempotency, order polling, confirmation), `orders`, `account` (read-only profile, address book), `health`. Inside: `api/` (maps HTTP to data, `null`, or a thrown `ApiRequestError`; no UI), `hooks/`, `components/`, `lib/` (pure parsers, SEO policy, JSON-LD builders; no I/O), `schemas/`, `types.ts` (CONVENTIONS section 2).
- `src/lib/api/`: `browser-client.ts`, `server-client.ts`, `silent-refresh.ts` (single-flight shared by bootstrap, proactive refresh, and recovery), `parse-api-error.ts` (RFC 9110 helpers), `throw-api-error.ts`, `form-api-errors.ts`, `generated/schema.d.ts` (`npm run api:generate`).
- `src/lib/auth/`: `AuthProvider`, route guards, in-memory access token, JWT-exp refresh policy, `session-api.ts`, `auth-routes.ts`.
- `src/lib/seo/`: Metadata factory, canonical URLs, JSON-LD serialization.
- `src/lib/`: `format.ts` (money and dates, `en-US`), `list-filters.ts` (shared URL parsers), `utils.ts` (`cn()`), `images/allowed-origins.ts`, `mock/` (MSW, CONVENTIONS section 12).
- `src/test/`: Vitest setup, `create-test-jwt.ts`, typed `fixtures/`.
- `e2e/`: Playwright projects (guest, pixel at 375px, iphone at 390px, customer): smoke, catalog, auth, cart, checkout, orders, account, journey, a11y. Details: `e2e/README.md`.
- `scripts/`: `generate-api-client.js`, `generate-env.js`, `dev-mock.js`, `ascii-prose.cjs`, `lint-ascii-prose.cjs`, asset capture.

## Local environment

- `npm run dev` and `npm run start` both bind `http://localhost:3100`; they cannot run together.
- `NEXT_PUBLIC_API_BASE_URL` is the API origin (default `http://localhost:3000`), which must allow `http://localhost:3100` with `credentials: true`. `NEXT_PUBLIC_STOREFRONT_ORIGIN` feeds `metadataBase`; a production build fails when it is missing or points at localhost (CI sets `https://storefront.test`). `NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS` adds image origins.
- `npm run env:init` creates `.env.local` from `.env.example`. Browser configuration uses `NEXT_PUBLIC_*` only; never expose secrets, never commit `.secrets`.
- `npm run dev:mock` runs without a backend (MSW, demo login). Playwright needs a seeded API. Boot, Docker, and credentials: the API repo's `README.md`, `docs/development/LOCAL-SETUP.md`, and `docs/development/SEEDING.md`.

## Auth

- The access token is in memory only. Refresh uses the HttpOnly cookie on the API origin with `credentials: 'include'`.
- One raw-fetch single-flight operation restores missing or expiring tokens; refresh and logout are serialized across tabs with a Web Lock. A refresh `401` ends the session; `429`, `5xx`, and network errors keep it and expose retry.
- `AuthProvider` refreshes before JWT `exp` and on focus or reconnect when the token is unusable. JWT decoding is for scheduling and chrome only; the API verifies RS256.
- The session Query is browser-only, because Next `cookies()` cannot see the API-origin refresh cookie.
- Decisions: [ADR-0001](../architecture/adr/ADR-0001-rsc-catalog-browser-session-no-bff.md), [ADR-0002](../architecture/adr/ADR-0002-in-memory-access-token-with-httponly-refresh-cookie.md), [ADR-0003](../architecture/adr/ADR-0003-single-flight-silent-refresh.md), [ADR-0007](../architecture/adr/ADR-0007-keep-session-alive-for-refresh-token-lifetime.md).

## API integration

OpenAPI is the contract; use the generated clients and a thin wrapper in each feature's `api/`. If Swagger and runtime disagree, fix the API. Client rules: [API-INTEGRATION.md](../API-INTEGRATION.md).
