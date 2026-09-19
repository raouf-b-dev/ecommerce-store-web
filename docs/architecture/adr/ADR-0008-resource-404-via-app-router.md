# ADR-0008: Resource 404s via App Router `notFound()`

- **Status**: Accepted
- **Date**: 2026-09-10
- **Does not supersede**: [ADR-0006](ADR-0006-security-headers-and-client-auth.md)
- **Context**: Missing `/products/[id]` must return a genuine HTTP 404 under Cache Components.

---

## 1. Context & Problem Statement

With `cacheComponents: true`, if a Suspense fallback (including a route-segment `loading.tsx`) starts streaming, the response commits as `HTTP 200` before a later `notFound()` can change the status. Search engines may see a soft 404 even when the UI eventually shows not-found content.

Catalog detail pages need a real `404` for missing or inactive products (shopper API already returns 404; the storefront maps that to `null` + `notFound()`).

## 2. Decision

1. Resolve product existence with the shared RSC fetcher (`getProduct`, React `cache()`).
2. Call `notFound()` in `generateMetadata` and the page **before** any Suspense boundary that would start streaming.
3. Keep `app/(shop)/products/[id]/not-found.tsx` for product-specific copy; root `not-found.tsx` stays generic.
4. Prefer explicit `<Suspense>` around deferred catalog holes (e.g. home list body). Do **not** place route-segment `loading.tsx` on ancestors of detail routes that must emit hard HTTP 404s.
5. Product detail keeps `export const instant = false` so Cache Components does not force an instant shell that would soft-404.
6. Acceptance: `/products/{malformed|missing}` returns `HTTP 404` with `noindex`; valid products return `200`.

## 3. Alternatives Considered

1. **Accept soft 404 + `noindex` only:** Rejected - fails monitoring and status-based SEO expectations.
2. **Disable `cacheComponents`:** Rejected - loses static-shell benefits for catalog chrome.

## 4. Consequences

- Product 404 behavior lives in App Router + feature fetchers only.
- Catalog list keeps in-page Suspense; hard-404 detail routes avoid ancestor streaming shells.
