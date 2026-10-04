---
name: add-feature
description: Add or extend a storefront feature, route, page, server fetcher, query hook, mutation, API wrapper, or Zod form. Use when creating anything under src/features or src/app, or wiring a new OpenAPI endpoint into the UI.
---

# Add a feature

Rules behind each step: [CONVENTIONS.md](../../../docs/ai/CONVENTIONS.md). Copy the closest existing feature instead of inventing a shape: `catalog` for an RSC feature (server fetchers, `searchParams`, SEO), `orders` for a client Query list and detail, `cart` for mutations, `checkout` or `account` for a form.

## 1. Decide the rendering side

| Data                                              | Side                                                       |
| ------------------------------------------------- | ---------------------------------------------------------- |
| Public, cacheable, SEO relevant (catalog, status) | Server Component, `server-client.ts`, awaited `searchParams` |
| Per-shopper (session, cart, checkout, orders)     | Client Component, `browser-client.ts`, TanStack Query      |

Default to a Server Component. Add `"use client"` only to the smallest interactive island.

## 2. Contract first

The generated client is the contract. Confirm the endpoint exists in `src/lib/api/generated/schema.d.ts`. If it does not, the API repo changes first, then `npm run api:generate` against a running API. Do not hand-write request types or a BFF route.

## 3. Layout

```text
src/features/<name>/
  api/<name>-api.ts          # browser client: one function per request, returns the DTO or throws
  api/get-<thing>.ts         # RSC: starts with import 'server-only', wrapped in React cache()
  hooks/use-<name>.ts        # TanStack Query hooks (client features only)
  hooks/<name>-keys.ts       # key factory
  components/                # feature UI
  lib/                       # searchParam parsers, pure helpers, SEO builders
  schemas/<name>-schema.ts   # Zod, only with a form
  types.ts                   # aliases of generated DTOs
```

Specs sit beside each file. No `index.ts` barrels. Import other features by concrete module. `src/app/` holds thin routes only; shared UI goes in `src/components/`, shared helpers in `src/lib/` (which must not import `features/`).

## 4. Build order

1. **types.ts**: `export type FooResponseDto = components['schemas']['FooResponseDto']`.
2. **api/**: browser wrappers do `const { data, error, response } = await browserClient.GET(...)` and on `error || !data || !response.ok` return `await throwApiErrorFromResponse(response, 'Failed to load foo.', error)`. Server fetchers map HTTP to the DTO, `null` (404), or a thrown `ApiRequestError`. No UI, no casts, no business rules.
3. **keys + hooks** (client features): key factory with `all` / `lists()` / `list(filters)` / `details()` / `detail(id)`. `useQuery` with `staleTime` and, for lists, `placeholderData: keepPreviousData`. A mutation invalidates the feature key and calls `router.refresh()` so RSC inventory HTML is not stale.
4. **lib**: parse URL params with type guards (`value is T`) and fall back to defaults, never `as`. Catalog links go through `catalogHref()`.
5. **schemas + forms**: React Hook Form + Zod aligned to the DTO. Map server errors with `applyApiFormErrors` and `matchField`; show mutation failures in `ActionErrorAlert`. No business validation.
6. **components**: Server Components by default. Client lists show `QueryLoading`, `QueryStateAlert` with retry, and `EmptyState`. Compose other features through slots passed by the route, never by importing their chrome.
7. **route**: add `src/app/(group)/<path>/page.tsx` that awaits `params` and `searchParams`, parses, and renders the feature. Resolve a missing resource with the fetcher and call `notFound()` in both `generateMetadata` and the page, before any page-level `<Suspense>` (ADR-0009). Wrap async UI in `<Suspense>`. Routes behind the browser-only session set `export const instant = false;` as `cart` and `orders` do. Account routes live under `(account)`, whose layout applies `ProtectedRoute` and `noindex`.
8. **metadata**: use `createPageMetadata` and the feature's SEO builders. No SEO components or services.
9. **tests**: use the `write-tests` skill. At minimum: the parser or helper, the schema, the API wrapper, the mutation effects, and the component's loading, empty, and error states.
10. **docs**: update `docs/ai/CODE-MAP.md` when a top-level folder or shared helper is added; consider an ADR for the triggers in the `write-docs` skill.

## Checks

- `npm run verify` passes; run `npm run build` too when you changed routes, layouts, metadata, or caching.
- No `@/lib/mock/*` import in the feature (CONVENTIONS section 12).
- Hidden or disabled UI is paired with an API-enforced rule, never a client-only one.
