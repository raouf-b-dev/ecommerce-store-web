# Storefront Conventions

## 1. Architecture Boundary

- Keep domain rules in `ecommerce-store-api`.
- UI guards, disabled actions, and hidden navigation are UX only.
- Prefer the OpenAPI-generated client for API calls. Do not spread ad-hoc `fetch` calls through feature code.
- Roadmap phase numbers and delivery sequencing belong only in [`docs/ROADMAP.md`](../ROADMAP.md). Other docs describe structure and behavior without phase IDs.

## 2. Feature Layout

Server Components by default. `"use client"` only for interactivity.

`src/app` is thin routes only (`layout.tsx`, `page.tsx`, `error.tsx`, `not-found.tsx`, metadata, `robots.ts`, `sitemap.ts`). Feature code lives in `src/features/<name>/`. Prefer explicit `<Suspense>` holes over route-segment `loading.tsx`, especially above detail routes that must return hard HTTP 404.

Typical shape (no barrels):

```text
src/features/catalog/
  api/          # OpenAPI wrappers; server files start with import 'server-only'
  hooks/        # TanStack Query (client features only)
  components/
  lib/          # searchParam parsers, pure helpers, feature SEO builders
  schemas/      # Zod (when there is a form)
  types.ts      # aliases to generated OpenAPI types
```

Do **not** add barrel `index.ts` files. Import the concrete module.

Cross-feature dependencies must be imported directly from the target feature's concrete module. Do not create re-export shims or adapter files across features.

Preset query facades that call another feature's request with fixed filters are allowed.

Optional folders: `schemas/` and `hooks/` exist only when the feature has forms or client queries.

**Auth exception:** session Query lives in `AuthProvider` (`src/lib/auth/`). Key `['auth','session']`. Do not invent `useAuthQuery` in the feature.

Keep cross-feature primitives in `src/components/` and cross-feature utilities in `src/lib/`.

## 3. HTTP clients

Two constructed clients, one generated `schema.d.ts`:

- `src/lib/api/browser-client.ts` - cookies, Bearer, 401 recovery. **Never** import from Server Components.
- `src/lib/api/server-client.ts` - `import 'server-only'`, no credentials, no Bearer, no login redirect.

Do not one-file both with `typeof window` branches.

Do **not** use Route Handlers or Server Actions as a BFF in front of the ecommerce API.

## 4. Catalog vs client data

- Catalog is RSC + awaited `searchParams`. Filters: Next `next/form` GET or `Link`. Never `useSearchParams` + `setSearchParams` (or `nuqs`) for the product list.
- Cart, checkout, orders, and session use TanStack Query in Client Components. Do **not** prefetch or hydrate catalog into Query (`HydrationBoundary`).
- Server catalog fetchers: wrap with React `cache()` so `generateMetadata` and the page share one HTTP call. Wrap async catalog UI in `<Suspense>` (Cache Components static shell). Prefer that over a route-segment `loading.tsx` for list/detail holes — especially above detail routes that must return hard HTTP 404 ([ADR-0008](../architecture/adr/ADR-0008-resource-404-via-app-router.md)).
- `"use cache"` only if catalog HTML can be stale versus stock. Default: request-time RSC. Do not put `"use cache"` on product or inventory reads.
- After cart/checkout mutations, invalidate Query **and** `router.refresh()` so RSC inventory HTML is not stale.

## 5. Query and forms (when those layers exist)

- QueryClient lives in a **client** `Providers`. Create a new client for each server render and reuse one module-scoped instance only in the browser (`getQueryClient`); never share Query cache across SSR users. Do not import Query from RSC.
- Skip retry on HTTP `429`; else `failureCount < 2`. Session: never retry `isClientError`. No `throwOnError`.
- Session bootstrap, pre-expiry refresh, and domain-`401` recovery share one raw-fetch single-flight operation plus a same-origin Web Lock for cross-tab refresh-cookie rotation. Logout uses the same lock. Refresh `401` means unauthenticated; refresh `429`, `5xx`, network failures, and malformed success payloads throw without clearing session state.
- Access tokens stay in memory. Before authenticated browser requests, refresh if the token is missing, malformed, expired, or near JWT `exp`. The browser-only session Query schedules before `exp` and refetches on focus/reconnect only when the token is unusable.
- TkDodo query-key factories per **client** feature (`all` / `lists()` / `list(filters)` / `details()` / `detail(id)`).
- Client lists (orders, not catalog): URL search params as source of truth; `placeholderData: keepPreviousData`; `staleTime` ~45s; enums `satisfies` generated unions.
- Handle Query `isError` with `QueryStateAlert` (`hasData` = last good data). RSC uses `error.tsx` / `not-found.tsx` instead.
- Forms: React Hook Form + Zod (current major) aligned to DTOs. `throwApiErrorFromResponse` in browser `api/` only. `applyApiFormErrors` + `matchField`; skip OCC `409` fields. `ActionErrorAlert` on mutations.
- RFC 9110 helpers: prefer predicates over `error as ApiRequestError`.
- Confirm dialogs: block dismiss while `isPending`; `ActionErrorAlert` inside the dialog.

## 6. App Router and Next.js 16

- `params` / `searchParams` / `cookies()` / `headers()` are async. Await them.
- Env: `NEXT_PUBLIC_*` only in the browser. Use `process.env.NEXT_PUBLIC_*`, not Vite `import.meta.env`.
- Security headers belong in `next.config.ts` `headers()`. Static redirects belong in `next.config.ts` `redirects()`. Auth gates stay in client layouts/providers ([ADR-0006](../architecture/adr/ADR-0006-security-headers-and-client-auth.md)).
- **Layering (each layer one job):**
  - `app/` — route composition only: layouts, pages, `generateMetadata`, `not-found` / `error`, `robots` / `sitemap`.
  - `features/<name>/api` — OpenAPI wrappers (`server-only` or browser). Map HTTP → feature data or `null` / thrown `ApiRequestError`. No UI.
  - `features/<name>/lib` — pure parsers, SEO policy, JSON-LD builders (no I/O unless named and documented).
  - `features/<name>/components` — UI for that domain.
  - `lib/seo` — site identity + Metadata factory + safe JSON-LD serialization. Pages/features supply page-specific SEO *data*.
  - `components/seo` — tiny presentational SEO primitives (e.g. `<JsonLd />`).
  - `lib/api` — clients + error parsing. Not a BFF.
  - `lib/auth` — browser session, providers, and client route gates.
- **Hard HTTP 404 for missing resources:** resolve existence with the feature fetcher, then call `notFound()` in `generateMetadata` and the page **before** any Suspense boundary that would start streaming. Prefer explicit `<Suspense>` holes over ancestor `loading.tsx` on those detail routes. Use segment `not-found.tsx` for resource-specific UI; keep root `not-found.tsx` generic ([ADR-0008](../architecture/adr/ADR-0008-resource-404-via-app-router.md)).
- Storefront scrolls the document. Avoid viewport-locked `h-screen overflow-hidden` layouts.
- Loading: `QueryLoading` / `role="status"` / `aria-busy` on client fetches. RSC: `<Suspense>` holes. No skeleton requirement in v1.
- React Compiler is on. Do not add `useMemo` / `useCallback` by habit.
- Treat rendered API strings as untrusted. No `dangerouslySetInnerHTML` except documented exceptions (theme FOUC script; JSON-LD via `<JsonLd />` / `serializeJsonLd`).
- Do **not** invent SEO frameworks (`SEOProvider`, `<SEO />` meta components, SEO services). Use the Metadata API + `createPageMetadata` + feature builders.
- Theme: Light / Dark / System, FOUC script, `useSyncExternalStore`, `ThemeAwareToaster`. Storage key `store-ui-theme`.
- Format helpers: `en-US` until i18n exists. Do not use `undefined` locale (Node vs browser drift).

## 7. Testing

- RTL + hook-mocked specs for **client** components and pure helpers.
- Do not RTL-test Server Components.
- Playwright for RSC routes and journeys.
- ESLint: `typescript-eslint` + `react-hooks` + `jsx-a11y` + `consistent-type-imports`. Lint is `eslint .`, not `next lint`.

## 8. Architecture Decision Records

Follow [`docs/architecture/adr/README.md`](../architecture/adr/README.md):

- Naming: `ADR-XXXX-[short-title].md` (4-digit zero-padded).
- **Body is immutable.** Do not rewrite Context, Decisions, Alternatives, or Consequences on an existing ADR.
- **Status (and supersede links) may change** in the file header and index only.
- Extending a decision (prior ADR still stands) -> new ADR with `Does not supersede`; leave the prior ADR `Accepted`.
- Full replacement -> new ADR with `Supersedes`; mark the old ADR `Superseded`. Never rewrite the old Decisions.
- Lifecycle: `Proposed` | `Accepted` | `Deprecated` | `Superseded`.
- Always update the ADR index when adding or superseding a record.
