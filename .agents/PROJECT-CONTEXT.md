# Project Context Accelerator

Read this file first for fast orientation. It summarizes `ecommerce-store-web` without replacing the canonical docs.

## Tech Stack

- Framework: Next.js 16 App Router (`cacheComponents`, Turbopack, React Compiler)
- UI: React 19
- Language: TypeScript (strict, `noUncheckedIndexedAccess`)
- Styling: Tailwind CSS v4 + shadcn/ui (Radix) + Sonner
- Theme: Light / Dark / System via `useSyncExternalStore`, storage key `store-ui-theme`, FOUC script in the root layout
- Public reads: React Server Components (unauthenticated catalog). Health diagnostics use the server OpenAPI client.
- Client data: TanStack Query for session, cart, checkout, orders, and account
- Forms: React Hook Form + Zod v4
- API: `openapi-fetch` + generated `src/lib/api/generated/schema.d.ts`
- Tests: Vitest, Testing Library, Playwright

## System Role

This repository is the customer storefront for `ecommerce-store-api`.

- It consumes the API contract over versioned HTTP.
- It does not own domain rules.
- It may hide or disable actions for UX, but the API remains the authority for auth and data integrity.
- There is no BFF: no Route Handlers or Server Actions that proxy the ecommerce API.
- Catalog RSC must not send a Bearer token. Session and mutations use a browser OpenAPI client.

## Local Environment

- Storefront intent: `http://localhost:3100` (`npm run dev` and `npm run start` both bind 3100; they cannot share the port)
- API origin: `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3000`)
- Storefront origin: `NEXT_PUBLIC_STOREFRONT_ORIGIN` (default `http://localhost:3100`, used for `metadataBase`)
- Live API boot, Docker, and seed credentials: API [README](https://github.com/raouf-b-dev/ecommerce-store-api#quick-start), [LOCAL-SETUP.md](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/LOCAL-SETUP.md), and [SEEDING.md](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/SEEDING.md)
- Cross-origin browser calls assume the API allows `http://localhost:3100` with `credentials: true`
- Browser configuration must use `NEXT_PUBLIC_*` env vars only. Do not expose secrets
- Copy env templates with `npm run env:init`. Fill Playwright passwords in `.secrets` from the API seeding guide. Do not commit `.secrets`

## Directory Map

- `src/app/` - thin App Router routes. `(auth)` layout is chrome only; `GuestRoute` wraps login/register pages. `(account)` has layout-level `ProtectedRoute`
- `src/app/providers.tsx` - Theme + browser QueryClient + Auth + Toaster
- `src/components/layout/` - skip link, header, footer, mobile nav, chrome, focus helper, `AccountNav`
- `src/components/media/` - shared `ProductImage`
- `src/components/theme/` - theme store, provider, toggle, FOUC script constant, toaster
- `src/components/feedback/` - `QueryStateAlert`, `QueryLoading`, `QueryListRegion`, `ActionErrorAlert` (not for RSC catalog)
- `src/components/ui/` - shadcn primitives + `StatusBadge`
- `src/features/auth/` - auth forms, schemas, field matchers (session HTTP + redirect helpers live in `src/lib/auth/`; import those modules from `lib/` directly)
- `src/features/catalog/` - RSC product list/detail, filters, SEO
- `src/features/cart/` - authenticated cart (TanStack Query)
- `src/features/checkout/` - checkout form, idempotency, order polling, confirmation
- `src/features/orders/` - own order list/detail, payment panel (TanStack Query)
- `src/features/account/` - read-only profile + address book CRUD (TanStack Query)
- `src/features/health/` - diagnostics `/status` (server OpenAPI health + readiness)
- `src/lib/format.ts` - money/date helpers (`en-US` until i18n)
- `src/lib/list-filters.ts` - shared URL parsers
- `src/lib/utils.ts` - `cn()` class merger (re-exports the shadcn `cn` package)
- `src/lib/api/browser-client.ts` - client-only OpenAPI client (credentials, pre-request refresh, Bearer, one domain-401 replay)
- `src/lib/api/silent-refresh.ts` - raw-fetch single-flight shared by bootstrap, proactive refresh, and recovery
- `src/lib/api/server-client.ts` - `import 'server-only'` OpenAPI client (no cookies, no Bearer)
- `src/lib/api/parse-api-error.ts` - RFC 9110 helpers
- `src/lib/auth/` - AuthProvider, layout guards, in-memory access token, JWT-exp refresh policy
- `src/lib/api/generated/schema.d.ts` - generated OpenAPI types (`npm run api:generate`)
- `src/test/setup.ts` - Vitest Testing Library setup
- `e2e/` - Playwright multi-project (guest / customer): smoke, catalog, auth, cart, checkout, orders, account, journey, a11y
- `scripts/` - `generate-api-client.js`, `generate-env.js`
- `docs/` - roadmap, API integration, AI conventions, ADRs

## Next up

See [`docs/ROADMAP.md`](../docs/ROADMAP.md) **Next up**. Live queue: Phase **13** (visual showcase media; capture guide done), then **14** (optional polish). Phases **10–12** are done. Staff slices **9b-9e** are folded into Phase 9.

## Rendering split

| Surface                              | How it talks to the API                                                               |
| :----------------------------------- | :------------------------------------------------------------------------------------ |
| Public catalog                       | RSC. No access token. `import 'server-only'` client.                                  |
| Diagnostics `/status`                | RSC via `server-client.ts`. Unauthenticated health/readiness.                         |
| Session                              | Browser `openapi-fetch` + TanStack Query. Refresh-cookie keep-alive.                  |
| Cart, checkout, orders, account      | Browser `openapi-fetch` + TanStack Query (wired).                                     |
| Next Server Actions / Route Handlers | Do not use them to proxy the ecommerce API.                                           |

## Auth

- Access token in memory only. Refresh via HttpOnly cookie on the API origin + `credentials: 'include'`.
- Restore missing/expiring access tokens with one raw-fetch single-flight operation and serialize refresh/logout across tabs with a Web Lock. Refresh 401 ends the session; refresh 429/5xx/network errors keep it and expose retry.
- AuthProvider schedules refresh before JWT `exp` and on focus/reconnect when unusable. JWT decoding is scheduling/chrome only; the API verifies RS256.
- The session Query is browser-only. Next `cookies()` cannot see the API-origin refresh cookie.
- See [ADR-0001](../docs/architecture/adr/ADR-0001-rsc-catalog-browser-session-no-bff.md), [ADR-0002](../docs/architecture/adr/ADR-0002-in-memory-access-token-with-httponly-refresh-cookie.md), [ADR-0003](../docs/architecture/adr/ADR-0003-single-flight-silent-refresh.md), and [ADR-0007](../docs/architecture/adr/ADR-0007-keep-session-alive-for-refresh-token-lifetime.md).

## Related docs

- [AGENT.md](../AGENT.md)
- [docs/ai/CONVENTIONS.md](../docs/ai/CONVENTIONS.md)
- [docs/API-INTEGRATION.md](../docs/API-INTEGRATION.md)
- [docs/architecture/ARCHITECTURE.md](../docs/architecture/ARCHITECTURE.md)
- [docs/ROADMAP.md](../docs/ROADMAP.md)
