# ADR-0001: RSC Catalog, Browser Session Client, No BFF

- **Status**: Accepted
- **Date**: 2026-09-07
- **Context**: Storefront rendering split for `ecommerce-store-api`.

---

## 1. Context & Problem Statement

The storefront needs SEO-friendly public catalog pages and an authenticated shopper session that matches the API cookie model. Next.js Server Actions and Route Handlers are a convenient place to hide tokens, but the API sets the refresh cookie on **its** origin. A Next BFF would receive `Set-Cookie` on the storefront origin and break the admin/storefront shared session contract.

Catalog list/detail is `@OptionalAuth`. Sending a Bearer token from the server (for example an operator token leaked into cookies) would change `CatalogVisibilityPolicy` and could expose inactive products.

## 2. Decision

1. **Public catalog, categories, and public inventory reads** are React Server Components. They call the API **without** cookies or Bearer tokens (`import 'server-only'` client).
2. **Session, cart, checkout, orders, and account** use a browser `openapi-fetch` client + TanStack Query, with `credentials: 'include'` and an in-memory access token.
3. **No BFF.** Do not add Next Route Handlers or Server Actions that forward cookies or tokens to the ecommerce API.
4. Generated OpenAPI `schema.d.ts` is shared. Do not maintain a second untyped HTTP dialect.

## 3. Alternatives Considered

1. **Server Actions as the API proxy**: Rejected. Refresh `Set-Cookie` would land on the Next origin; CORS credentials to the API would be unused; this is a BFF.
2. **Single OpenAPI client with `typeof window` branches**: Rejected. Easy to import into RSC and attach credentials by accident.
3. **TanStack Query hydration for catalog**: Rejected. RSC already rendered the HTML; `HydrationBoundary` plus `cacheComponents` doubles the data path.

## 4. Consequences

- Protected account routes cannot be redirected in a Server Component; client guards plus a short loading splash are the honest UX.
- After mutations that change stock, call `router.refresh()` so RSC catalog HTML is not stale.
- Implementation patterns live in `docs/ai/CONVENTIONS.md`.
