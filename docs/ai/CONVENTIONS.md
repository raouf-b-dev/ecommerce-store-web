# Storefront Conventions

Rules for `ecommerce-store-web`. Section numbers are cited by ADRs and other docs: keep them stable. Bad and good examples: [ANTI-PATTERNS.md](ANTI-PATTERNS.md). Anything a tool can enforce lives in ESLint, not here.

## 1. Architecture Boundary

- Domain rules live in `ecommerce-store-api`. UI guards, disabled actions, and hidden navigation are UX only.
- Call the API through the OpenAPI-generated clients. No ad-hoc `fetch` for domain calls.
- Roadmap phase numbers and delivery sequencing belong only in [ROADMAP.md](../ROADMAP.md). Other docs describe structure and behavior without phase IDs.

## 2. Feature Layout

Server Components by default. `"use client"` only for interactivity.

`src/app` holds thin routes only: `layout.tsx`, `page.tsx`, `error.tsx`, `not-found.tsx`, metadata, `robots.ts`, `sitemap.ts`. Feature code lives in `src/features/<name>/`. Prefer explicit `<Suspense>` holes over route-segment `loading.tsx`, especially above detail routes whose not-found UI must replace the whole page.

**Thin routes are slot composition.** The route (or a thin shell) composes feature pieces. `AddToCart` does not live in `features/catalog`: catalog owns product chrome, cart owns the CTA, and the product page wires both as children or slots.

```text
src/features/catalog/
  api/          # OpenAPI wrappers; server files start with import 'server-only'
  hooks/        # TanStack Query (client features only)
  components/
  lib/          # searchParam parsers, pure helpers, feature SEO builders
  schemas/      # Zod (when there is a form)
  types.ts      # aliases to generated OpenAPI types
```

No barrel `index.ts` files. Import the concrete module. `schemas/` and `hooks/` exist only when the feature has forms or client queries.

### Import matrix

| From / To    | `app/` | `features/*`                           | `lib/` | `components/`             |
| ------------ | ------ | -------------------------------------- | ------ | ------------------------- |
| `app/`       | yes    | yes                                    | yes    | yes                       |
| `features/A` | no     | other features, concrete modules only  | yes    | yes                       |
| `lib/`       | no     | **forbidden**                          | yes    | yes                       |
| `components/`| no     | no (prefer props or slots)             | yes    | yes                       |

ESLint enforces `lib/` never imports `features/` (`no-restricted-imports`). Invert with a `lib` helper or inject callbacks from `app/providers.tsx`. Cross-feature code imports the other feature's concrete module; no re-export shims or adapter files. A preset query facade that calls another feature's request with fixed filters is fine. Shared primitives go in `src/components/`, shared utilities in `src/lib/`.

**Auth exception:** the session Query lives in `AuthProvider` (`src/lib/auth/`) under key `['auth','session']`. Session HTTP and redirect helpers live in `src/lib/auth/` (`session-api.ts`, `auth-routes.ts`); feature forms import them from `lib/`. No `useAuthQuery` in a feature.

## 3. HTTP clients

Two clients, one generated `schema.d.ts`:

- `src/lib/api/browser-client.ts`: cookies, Bearer, 401 recovery. Never import it from Server Components.
- `src/lib/api/server-client.ts`: `import 'server-only'`, no credentials, no Bearer, no login redirect.

Never one file with `typeof window` branches. No Route Handlers or Server Actions as a BFF in front of the ecommerce API.

## 4. Catalog vs client data

- Catalog is RSC with awaited `searchParams`. Filters use `next/form` GET or `Link`. Never `useSearchParams` + `setSearchParams` (or `nuqs`) for the product list.
- Cart, checkout, orders, account, and session use TanStack Query in Client Components. Do not prefetch or hydrate catalog into Query (`HydrationBoundary`).
- Server catalog fetchers are wrapped in React `cache()` so `generateMetadata` and the page share one HTTP call. Wrap async catalog UI in `<Suspense>` (Cache Components static shell).
- `"use cache"` only if catalog HTML can be stale versus stock. Default is request-time RSC. Never put `"use cache"` on product or inventory reads.
- After a cart or checkout mutation, invalidate Query and call `router.refresh()` so RSC inventory HTML is not stale.

## 5. Query and forms

- `QueryClient` lives in the client `Providers`. Create a new client per server render and reuse one module-scoped instance only in the browser (`getQueryClient`); never share a Query cache across SSR users. Do not import Query from RSC.
- Retry: skip HTTP `429`, else `failureCount < 2`. Session: never retry `isClientError`. No `throwOnError`.
- Session, refresh, and token rules (single-flight refresh, Web Lock, in-memory access token, refresh-failure handling): [CODE-MAP.md](CODE-MAP.md) Auth section and ADR-0002, ADR-0003, ADR-0007.
- Query-key factories per client feature: `all` / `lists()` / `list(filters)` / `details()` / `detail(id)`.
- Client lists (orders, not catalog): URL search params are the source of truth; `placeholderData: keepPreviousData`; `staleTime` about 45 s; enums `satisfies` the generated unions.
- Query `isError` renders `QueryStateAlert` (`hasData` = last good data). RSC uses `error.tsx` and `not-found.tsx`.
- Forms: React Hook Form + Zod (current major) aligned to the DTOs. `throwApiErrorFromResponse` in browser `api/` only. `applyApiFormErrors` + `matchField`; skip OCC `409` fields. `ActionErrorAlert` on mutations.
- RFC 9110 helpers: prefer predicates (`hasHttpStatus`, `isClientError`) over `error as ApiRequestError`.
- Confirm dialogs block dismiss while `isPending` and show `ActionErrorAlert` inside the dialog.

## 6. App Router and Next.js 16

- `params`, `searchParams`, `cookies()`, and `headers()` are async: await them.
- `NEXT_PUBLIC_*` only in the browser, read as `process.env.NEXT_PUBLIC_*` (not Vite `import.meta.env`).
- Security headers and static redirects belong in `next.config.ts` (`headers()`, `redirects()`). Auth gates stay in client layouts and providers ([ADR-0006](../architecture/adr/ADR-0006-security-headers-and-client-auth.md)).
- Layering (who owns what under `app/`, `features/*`, `lib/`, `components/`) is in [CODE-MAP.md](CODE-MAP.md). `lib/seo` owns site identity, the Metadata factory, and safe JSON-LD serialization; pages and features supply page-specific data. `lib/api` is clients and error parsing, never a BFF.
- **Soft 404 for a missing resource:** resolve existence with the feature fetcher, then call `notFound()` in `generateMetadata` and in the page, before any page-level Suspense boundary. Cache Components streams the static shell as `200` first, so the response stays `200` and Next.js injects `noindex`; do not add a second robots tag. Use segment `not-found.tsx` for resource-specific UI and keep the root one generic. `playwright.prod.config.ts` checks the status and `noindex` on a production build ([ADR-0009](../architecture/adr/ADR-0009-resource-soft-404-with-noindex.md)).
- Typed routes: a literal href or a template literal Next can validate needs no cast. A href built from runtime data needs Next's documented `as Route`; mark it `// eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Next typedRoutes documented cast`.
- The storefront scrolls the document. Avoid viewport-locked `h-screen overflow-hidden` layouts.
- Loading: `QueryLoading` (`role="status"`, `aria-busy`) on client fetches; `<Suspense>` holes in RSC. No skeleton requirement.
- React Compiler is on. Do not add `useMemo` or `useCallback` by habit.
- Treat rendered API strings as untrusted. `dangerouslySetInnerHTML` only for the theme FOUC script and JSON-LD (`<JsonLd />`, `serializeJsonLd`).
- No SEO frameworks (`SEOProvider`, `<SEO />`, SEO services). Use the Metadata API, `createPageMetadata`, and feature builders.
- Theme: Light / Dark / System, FOUC script, `useSyncExternalStore`, `ThemeAwareToaster`, storage key `store-ui-theme`.
- Format helpers use `en-US` until i18n exists. Never an `undefined` locale (Node and browser drift).

## 7. Testing

Procedure, golden specs, and typed-mock patterns: `.agents/skills/write-tests/SKILL.md`. RTL covers client components; pure helpers and RSC data fetchers are tested as plain functions; Playwright covers RSC routes and journeys. ESLint (`eslint .`) runs `typescript-eslint`, `react-hooks`, `jsx-a11y`, `consistent-type-imports`, `consistent-type-assertions` (baselined), the `lib` to `features` restriction, and `ascii-prose`; `npm run lint` then runs `scripts/lint-ascii-prose.cjs`. It does not use `next lint`.

## 8. Money, stock, checkout URL, images

- Format money with `src/lib/format.ts` (`en-US`). Do not invent "Free shipping" or tax lines the API does not return.
- Stock UI uses shopper inventory fields (`availableQuantity`, `isAvailable`), not operator reserved or total quantities.
- While checkout polls, keep `?orderId=` in the URL via `router.replace` so a refresh resumes confirmation.
- Keep the checkout idempotency key until a terminal success; do not clear it on every mount or non-terminal failure.
- Production `next/image` hosts come from the shared env-driven allowlist (`src/lib/images/allowed-origins.ts`), not per-page config.
- `/` is the landing page and `/products` the full catalog. Link to the catalog through `CATALOG_PATH` / `catalogHref()` from `features/catalog/lib/catalog-params.ts`; never hand-build catalog URLs.

## 9. No-workaround contract rule

- If the OpenAPI contract is wrong or incomplete, patch the API. Do not parse JWT `sub` for profile ids, keep a cart-id store as a long-term read path when `GET /carts/current` exists, match English 403 messages, or add BFF shims.
- Forced password change: honor `code: 'MUST_CHANGE_PASSWORD'` only.
- `GET /v1/carts/current` returning `404` is an empty cart (`null`), never an error banner.

## 10. Architecture Decision Records

Rules (immutable body, supersede, naming, index): [adr/README.md](../architecture/adr/README.md). When to write one: `.agents/skills/write-docs/SKILL.md`.

## 11. ASCII prose (docs and comments)

Docs, Markdown, and source comments must read as typed in a plain editor, not with typography chat models insert by default. `npm run lint` runs `scripts/lint-ascii-prose.cjs` on Markdown (except immutable `docs/architecture/adr/`) and on comments in `ts`, `tsx`, and `js`; ESLint `ascii-prose/no-smart-punctuation` flags the same marks in comments.

| Avoid                                  | Use                                       |
| -------------------------------------- | ----------------------------------------- |
| Em dash (U+2014)                       | `-`, `:`, or a new sentence               |
| En dash (U+2013)                       | ASCII `-` in ranges (`9b-9e`, `400-499`)  |
| Curly quotes (U+2018/2019/201C/201D)   | `'` and `"`                               |
| Ellipsis character (U+2026)            | `...`                                     |
| Non-breaking space or hyphen           | Normal space or `-`                       |

No emoji in comments. New user-visible strings follow the same habit (`Loading...`). Existing ADR bodies stay as written.

## 12. Mock mode (MSW)

`npm run dev:mock` runs the storefront without a backend: a Node preload for RSC requests plus a browser worker for client requests (`NEXT_PUBLIC_ENABLE_MOCK=true`, see `.env.mock`).

- Handlers, seed data, and demo UI live only in `src/lib/mock/`. Mock shopper operations only; unimplemented mutating routes return `501`.
- Feature modules never import `@/lib/mock/*`. The allowed touchpoints are `src/components/mock/mock-mode-bootstrap.tsx` (dynamic import of the browser worker), `src/lib/api/server-client.ts` (dynamic import of `sync-node-handlers`), and `src/features/auth/components/login-form.tsx` (lazy demo login chrome).
- Gate on `process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true'` inline before any MSW import so production bundles drop the chunk.
- Demo login stores a flag in `sessionStorage`, never an access token.
- Contract tests: `npx vitest run src/lib/mock`.
