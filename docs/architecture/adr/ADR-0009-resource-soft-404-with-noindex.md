# ADR-0009: Resource soft 404s with `noindex` under Cache Components

- **Status**: Accepted
- **Date**: 2026-09-26
- **Supersedes**: [ADR-0008](ADR-0008-resource-404-via-app-router.md)
- **Does not supersede**: [ADR-0006](ADR-0006-security-headers-and-client-auth.md)
- **Context**: ADR-0008 promised a hard HTTP 404 for missing `/products/[id]`. Next.js 16 with `cacheComponents: true` cannot deliver that from the App Router.

---

## 1. Context & Problem Statement

With Cache Components, every dynamic route streams its static shell first. The response commits as `HTTP 200` before the page can resolve the product, so a later `notFound()` cannot change the status. The Next.js 16 docs state this directly and point to `proxy` for a real 404 status.

ADR-0008 relied on calling `notFound()` before any Suspense boundary and on `export const instant = false`. Neither changes the status: `instant = false` only opts the segment out of instant-navigation validation. Measured on a production build, `/products/0`, `/products/abc`, and `/products/999999` return `200`, render the product not-found UI, and carry `<meta name="robots" content="noindex">` in `<head>`, including for Googlebot.

Unknown routes (no matching segment) still return a hard `404`.

## 2. Decision

1. Missing, inactive, or malformed product IDs are **soft 404s**: `HTTP 200`, the product not-found UI, and `noindex`.
2. `noindex` comes from Next.js, which injects it whenever `notFound()` fires mid-stream. The storefront does not add its own robots tag for this case.
3. Keep resolving existence with the shared RSC fetcher (`getProduct`, React `cache()`) and calling `notFound()` in `generateMetadata` and the page before any page-level Suspense boundary, so the not-found UI replaces the whole page.
4. Keep `app/(shop)/products/[id]/not-found.tsx` for product-specific copy; root `not-found.tsx` stays generic.
5. Keep `export const instant = false` on product detail only as the validation opt-out for the blocking lookup.
6. Acceptance: on a production build, missing and malformed product URLs return `200` with `noindex` in the server HTML and the not-found UI; valid products return `200` without `noindex`. `playwright.prod.config.ts` runs this check.

## 3. Alternatives Considered

1. **Existence check in `proxy` for a hard 404:** Rejected for now - adds a request-interception layer and one extra API call per product request. Revisit with a new ADR if monitoring or SEO tooling needs status-based 404s.
2. **Disable `cacheComponents`:** Rejected - loses static-shell benefits for catalog chrome.
3. **Keep ADR-0008 as written:** Rejected - its acceptance criterion cannot pass on Next.js 16.

## 4. Consequences

- Search engines skip missing product URLs through `noindex`; status-based monitors see `200`.
- Product 404 behavior stays in App Router + feature fetchers; no `proxy`.
- A regression in Next.js's `noindex` injection shows up in the production status check.
