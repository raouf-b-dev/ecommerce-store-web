# Project Context Accelerator

Read this file first for fast orientation. It summarizes `ecommerce-store-web` without replacing the canonical docs.

## Tech Stack

- Framework: Next.js 16 App Router (`cacheComponents`, Turbopack, React Compiler)
- UI: React 19
- Language: TypeScript (strict, `noUncheckedIndexedAccess`)
- Styling: Tailwind CSS v4 + shadcn/ui (Radix) + Sonner
- Public reads: React Server Components (unauthenticated catalog, when wired)
- Client data: TanStack Query for session, cart, checkout, and orders (not wired yet)
- Forms: React Hook Form + Zod (when forms exist)
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
- Admin SPA (sibling): `http://localhost:5174`
- Live API boot, Docker, and seed credentials: API [README](https://github.com/raouf-b-dev/ecommerce-store-api#quick-start), [LOCAL-SETUP.md](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/LOCAL-SETUP.md), and [SEEDING.md](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/SEEDING.md)
- Cross-origin browser calls assume the API allows `http://localhost:3100` with `credentials: true`
- Browser configuration must use `NEXT_PUBLIC_*` env vars only. Do not expose secrets
- Copy env templates with `npm run env:init`. Fill Playwright passwords in `.secrets` from the API seeding guide. Do not commit `.secrets`

## Directory Map

- `src/app/` - thin App Router routes, layouts, metadata
- `src/components/ui/` - shadcn primitives (button, input, card, alert, sonner)
- `src/features/` - feature folders (none yet; catalog, cart, checkout, auth, account)
- `src/lib/utils.ts` - `cn()` class merger (re-exports the shadcn `cn` package)
- `src/lib/api/generated/schema.d.ts` - generated OpenAPI types (`npm run api:generate`)
- `src/test/setup.ts` - Vitest Testing Library setup
- `e2e/` - Playwright (home smoke today; guest/customer projects later)
- `scripts/` - `generate-api-client.js`, `generate-env.js`
- `docs/` - roadmap, API integration, AI conventions, ADRs

## Rendering split

| Surface | How it talks to the API |
| :------ | :---------------------- |
| Public catalog | RSC. No access token. `import 'server-only'` client when fetchers exist. |
| Session, cart, checkout, orders, account | Browser `openapi-fetch` + TanStack Query. Not implemented yet. |
| Next Server Actions / Route Handlers | Do not use them to proxy the ecommerce API. |

## Auth (target model)

- Access token in memory only. Refresh via HttpOnly cookie on the API origin + `credentials: 'include'`.
- Next `cookies()` will not see the refresh cookie.
- See [ADR-0001](../docs/architecture/adr/ADR-0001-rsc-catalog-browser-session-no-bff.md) and [ADR-0002](../docs/architecture/adr/ADR-0002-in-memory-access-token-with-httponly-refresh-cookie.md).

## Related docs

- [AGENT.md](../AGENT.md)
- [docs/ai/CONVENTIONS.md](../docs/ai/CONVENTIONS.md)
- [docs/API-INTEGRATION.md](../docs/API-INTEGRATION.md)
- [docs/architecture/ARCHITECTURE.md](../docs/architecture/ARCHITECTURE.md)
- Admin SPA (session patterns to port, not the Vite shell): [ecommerce-admin-dashboard](https://github.com/raouf-b-dev/ecommerce-admin-dashboard)
