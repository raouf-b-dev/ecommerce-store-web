# E-commerce Store Web: Roadmap

> Delivery plan for the customer storefront. Work top to bottom.
>
> Companions: [README.md](../README.md), [API-INTEGRATION.md](API-INTEGRATION.md), [ecommerce-store-api](https://github.com/raouf-b-dev/ecommerce-store-api), [ecommerce-admin-dashboard](https://github.com/raouf-b-dev/ecommerce-admin-dashboard).
>
> Revision (2026-09-07): Integer phases 0-14. Port admin **client** patterns, but do not cargo-cult the Vite shell into App Router. Query is client-only; catalog is RSC + Suspense; MSW must cover Node.

---

## How to use this file

- `[ ]` not started
- `[/]` in progress
- `[x]` done
- Finish each phase before starting the next.
  - **Exceptions:** Phase 11 (commercial loop) and Phase 14 (polish) do **not** block Phase 12 (release gate). Phase 13 (visuals) may record from Phase 10 mock, then re-verify after Phase 12.
- Keep business rules in the API. This repo is UI, routing, caching, and error mapping only.
- For HTTP contracts, use **live OpenAPI/Swagger** (and the generated client). [API-INTEGRATION.md](API-INTEGRATION.md) covers client rules only, not an endpoint catalog.
- Do not invent filters, buttons, slug lookups, guest carts, or checkout job APIs that OpenAPI does not expose. If the API is missing a customer capability, stop and fix it in `ecommerce-store-api` first (admin Phases 11 / 11.5 pattern).

### Testing policy

Write tests **with** each feature.

| Layer | When |
| :---- | :--- |
| Unit / component (Vitest + Testing Library) | Client islands and pure helpers in the same phase. **Do not** RTL-test Server Components. |
| Playwright | RSC pages and the critical path when the feature joins it |
| Cross-cutting quality | Phase 9 only |

A feature phase is not done until its **Done when** checks pass.

### Definition of done (every feature phase)

1. UI wired to OpenAPI operations for that phase’s capabilities (no mocked domain rules; no invented DTOs).
2. Listed component tests green.
3. Listed Playwright updates green (or explicitly deferred to Phase 9 with a note).
4. Lint + typecheck clean. No `any`, no `as` escapes to silence the contract, no leftover `TODO` in shipped code.
5. OpenAPI client regenerated if the contract changed; client rules in [API-INTEGRATION.md](API-INTEGRATION.md) still accurate.
6. Feature folder, query keys, and error helpers follow `docs/ai/CONVENTIONS.md` (once Phase 1 exists).

---

## Stack

Pin **latest stable** at scaffold time. Do not add backward-compat shims for Pages Router, `middleware.ts`, or implicit App Router fetch cache.

| Concern | Choice |
| :------ | :----- |
| Runtime | Node.js 24 (same as API and admin) |
| Framework | Next.js 16 App Router (`create-next-app@latest`). Turbopack default. `cacheComponents: true`. |
| UI | React 19 (whatever Next 16 ships). TypeScript strict (`noUncheckedIndexedAccess`). |
| Bundling / lint | Turbopack; ESLint flat config (`eslint .` - do **not** use removed `next lint`) |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix). Do not copy the admin Vite/Tailwind v3 scaffold blindly. |
| Rendering | Server Components by default. `"use client"` only for session, forms, cart, checkout, and other interactivity. |
| Public reads | RSC fetchers in `features/*/api/` with `import 'server-only'`. Catalog is unauthenticated on purpose. **No** TanStack Query hydration for catalog. |
| Authenticated reads/writes | Browser `openapi-fetch` client + TanStack Query. **Not** Server Actions as an API proxy (that is a BFF). |
| QueryClient | Query is **browser-only** in v1 (no catalog hydration). Create it in a client `Providers` with `useState(() => new QueryClient())` - never `new QueryClient()` at module scope. Do **not** import Query from RSC. A server `getQueryClient()` factory is only if a later phase prefetches. |
| Local UI state | React state. Session via `AuthProvider`. **No Zustand** unless a later phase proves a real cross-tree UI need that is not server state. React Compiler on if Next 16 marks it stable - do not copy admin `useMemo` on table columns. |
| Forms | React Hook Form + Zod **latest the current shadcn/RHF resolver supports** (do not pin admin’s Zod 3). Align to OpenAPI DTOs. |
| API | `openapi-fetch` + generated `schema.d.ts` (same as admin) |
| Tests | Vitest + Testing Library + Playwright |
| A11y lint | `eslint-plugin-jsx-a11y` + `eslint-plugin-react-hooks` (React 19 compatible) from Phase 0 |

**Ports (intent):** storefront `3100`, API `3000`, admin `5174`. Confirm in Phase 0. API CORS must allow `http://localhost:3100` with credentials (companion one-liner in the API `.env.example` - not a storefront invention).

---

## Rendering and session (non-negotiable)

These are the decisions the old roadmap left vague. They are locked here so Phases 0-3 do not fork.

| Rule | Detail |
| :--- | :----- |
| No BFF | No Next Route Handlers or Server Actions that forward cookies/tokens to the API. Out of scope, same as admin. |
| No `proxy.ts` until needed | Security headers belong in `next.config.ts` `headers()`. Do **not** add `proxy.ts` (or `middleware.ts`) for headers or auth. Add Proxy only for a real rewrite/redirect that cannot live in `next.config`. |
| Two HTTP clients | **Browser** client: cookies + Bearer + 401 recovery. **Server** client: `import 'server-only'`, no `credentials`, no Bearer, no login redirect. Do not one-file both with `typeof window` branches. |
| RSC freshness | With `cacheComponents`, wrap catalog fetch UI in `<Suspense>` so chrome is the static shell. Deduplicate `generateMetadata` + page with React `cache()`. After cart/checkout mutations, `router.refresh()` so RSC inventory/HTML is not stale. |
| 401 / force-password | `openapi-fetch` middleware is outside React: `window.location.assign` is acceptable **there** (admin panic path). Form success (login, logout, change-password) uses `router.push` + `router.refresh()`. |
| Access token | In-memory only (port admin ADR-0002). Refresh via HttpOnly cookie on the **API** origin + `credentials: 'include'`. Next `cookies()` will not see it. |
| Silent refresh | Domain `401`: single-flight refresh + one retry (ADR-0003). Never silent-retry `/authentication/*`. |
| RSC catalog | Fetch **without** the shopper Bearer so `CatalogVisibilityPolicy` always sees a shopper (active-only). Sending an operator token from the server would leak inactive products into the storefront. |
| Catalog filters | Server `searchParams` + Next `next/form` GET or `<Link href>`. **Not** admin `useSearchParams` + `setSearchParams` (that forces the list client-side). |
| Cart | API requires `manage_own_cart`. **No guest line-item basket.** Persist **cart id** only (localStorage is fine; it is not a credential). Clear id on logout. |
| Checkout | `POST /v1/orders/checkout` is **async**. HTTP 201 returns `orderId` + `jobId`. There is **no** public job-status route. Poll `GET` order by id until a documented status. Do not invent `PENDING → PROCESSING → COMPLETED`. |
| Product URLs | OpenAPI product detail is by **numeric id**. `slug` is a field, not a lookup. Use `/products/[id]`. Do not build a client-side slug index. |
| Query parity | Bind every list query param the **current** OpenAPI DTO already accepts in the same phase as the list. URL search params are the source of truth. |
| Errors | Shared RFC 9110 helpers. Map payloads; do not re-validate domain rules. RSC failures use `error.tsx` / `not-found.tsx`. `QueryStateAlert` is for **client Query** only. |
| Shell | Document/body scroll for the storefront. Do **not** copy admin `h-screen overflow-hidden` (operator cockpit, bad for SEO/mobile). |
| DRY | No barrel `index.ts`. No cross-feature re-export shims. Pages in `src/app` stay thin. |

Exact client rules: [API-INTEGRATION.md](API-INTEGRATION.md).

---

## Port from the admin SPA **code** (not its roadmap)

The admin [`docs/ROADMAP.md`](https://github.com/raouf-b-dev/ecommerce-admin-dashboard/blob/master/docs/ROADMAP.md) is stale in places (categories shipped; later a11y/e2e/theme/WS hardening sits in code). **Copy the implementation**, then adapt for App Router and shoppers. Do **not** cargo-cult operator-only pieces.

**Copy / adapt these modules** (keep names unless Next forces a rename):

| Admin source | What it actually does | Store-web |
| :----------- | :-------------------- | :-------- |
| `src/lib/api/client.ts` | Browser `openapi-fetch` + cookies + Bearer + 401 recovery; `403` `MUST_CHANGE_PASSWORD` **or** message `Password change required` | Phase 3. **Client-only module.** Interceptor redirects may `assign`; do not import from RSC. |
| `src/lib/api/silent-refresh.ts` | **Raw `fetch`** to refresh (avoids client middleware re-entry); `inFlightRefresh` single-flight; `onSessionRefreshed` listener bus | Phase 3. Wire the bus into `AuthProvider` `setQueryData`. |
| `src/lib/api/parse-api-error.ts` | `ApiRequestError`, `getErrorMessage`, `getErrorStatusCode`, `hasHttpStatus`, `isClientError` / `isServerError`, `isOptimisticLockConflict` | Phase 3. Port tests too. |
| `src/lib/api/throw-api-error.ts` | Every feature `*-api.ts` uses `throwApiErrorFromResponse`; `throwTooManyRequests` stable copy | Phase 3. Login/register `429` is **not** “invalid password”. |
| `src/lib/api/form-api-errors.ts` | `applyApiFormErrors` + `matchField`; **skip** inline field errors on OCC `409` | Phases 3-8. |
| `src/lib/auth/auth-session.ts` | In-memory access token only | Phase 3. |
| `src/lib/auth/auth-context.tsx` | Query key `['auth','session']`; `staleTime: Infinity`; **no retry on 4xx**, retry `< 2` on 5xx/network; logout `queryClient.clear()`; `onSessionRefreshed` updates session cache | Phase 3. Drop `hasPermission` / operator chrome. |
| `src/features/auth/lib/safe-redirect-path.ts` | Same-origin `/…` only; reject `//`; reject `/login` and `/change-password` loops | Phase 3. Open-redirect footgun. |
| `src/main.tsx` QueryClient | Module singleton - **Vite-safe, Next-unsafe** | Phase 3. Client `useState` factory; skip retry on `429`; else `failureCount < 2`. No `throwOnError`. |
| `src/components/feedback/query-state.tsx` | `QueryStateAlert` (soft vs hard: `hasData`), `QueryLoading`, `QueryListRegion` (`aria-busy`, opacity while fetching) | Client Query surfaces only (cart, orders, session). **Not** RSC catalog pages. |
| `src/components/feedback/action-error-alert.tsx` | Mutation banner, `aria-live="polite"` | Phases 3-8. |
| `src/components/layout/app-layout.tsx` | Skip link; `<main id="main" tabIndex={-1}>` | Phase 2. |
| `src/components/layout/focus-on-route-change.tsx` | Focus `#main` after client navigations | Phase 2 (Next equivalent on pathname change). |
| `src/components/layout/route-error-boundary.tsx` | Class `componentDidCatch` | **Do not port.** Use `error.tsx` / `global-error.tsx`. |
| `src/components/theme/*` | `useSyncExternalStore` OS sync; **zero-FOUC** inline script; `ThemeAwareToaster` (Sonner `theme={resolvedTheme}`, `richColors`, `closeButton`) | Phase 2. Storage key `store-ui-theme` (admin code uses `admin-ui-theme`, not the CONVENTIONS `vite-ui-theme` string). |
| `src/lib/format.ts` | `formatMoney`, `formatDate`, `formatDateTime`, `formatStatusLabel` | Phases 5-8. Shopper locale. |
| `src/lib/list-filters.ts` | `parsePositiveInt`, `parseNonNegativeNumber`, URL helpers | Phase 5+. Shared parsers, not copy-paste per feature. |
| `src/lib/utils.ts` | `cn()` = `twMerge(clsx())` | Phase 0. |
| `src/components/ui/status-badge.tsx` | Order/product status chrome | Phases 7-8. |
| `scripts/generate-api-client.js` | Live OpenAPI → `schema.d.ts` | Phase 0. |
| `scripts/generate-env.js` | `.env.example` → `.env.local`; `.secrets.example` → `.secrets` | Phase 0 / 9. |
| `e2e/global-setup.ts` + `e2e/README.md` | Sibling `../ecommerce-store-api` `db:seed:auth`; `E2E_SKIP_DB_SEED`; login throttle **~61s**; fail-closed CI secrets | Phases 3 and 9. |
| Playwright projects | `guest` parallel; authenticated project `workers: 1`; worker-scoped reused page (avoid full reload/cookie rotation) | Phase 9: `guest` + `customer`. |
| `e2e/helpers/axe.ts` | Serious/critical only | Phase 9. |
| Page specs | Hook-mocked pages; **do not** wrap page tests in `QueryClientProvider` unless testing the hook | Every feature phase. |
| Mock `main.tsx` | **Inline** env gate before dynamic `import('@/lib/mock/browser')` so the bundler drops MSW; `onUnhandledRequest: 'bypass'` | Phase 10. Lazy demo chrome on login only. |

**Admin-only - do not port:** `OperatorRoute`, `PermissionRoute`, `IndexLandingGate` / `getDefaultLandingRoute`, nav permission matrix, `NotOperatorError`, TanStack Table, Recharts, roles/users admin CRUD, inventory adjust, order Process/Ship/Deliver chrome, operator `WebSocketProvider` (low-stock / `orders.created` toasts). Shopper realtime, if ever, is Phase 14 and must follow the **live** Socket.IO contract (admin **code** uses `query.token` + `Authorization`, not CONVENTIONS `auth.token`).

---

## Phase overview

| Phase | Name                            | Status | Priority | Focus                                                              |
| ----- | ------------------------------- | ------ | :------: | ------------------------------------------------------------------ |
| **0** | Foundation                      | `[x]`  |  `[P0]`  | Next 16 scaffold, tooling, tests, OpenAPI client, Cache Components |
| **1** | Agent ecosystem and conventions | `[x]`  |  `[P0]`  | AGENT policy, Next-specific CONVENTIONS, ADR template, adapters    |
| **2** | App shell                       | `[x]`  |  `[P0]`  | Layouts, chrome, error/loading, theme, health page                 |
| **3** | Authentication and session      | `[ ]`  |  `[P0]`  | Login, register, silent refresh, customer chrome                   |
| **4** | Forced password change          | `[ ]`  |  `[P0]`  | Seeded customer `mustChangePassword` (do not skip)                 |
| **5** | Catalog                         | `[ ]`  |  `[P0]`  | RSC list/detail, categories, query parity, SEO                     |
| **6** | Cart                            | `[ ]`  |  `[P0]`  | Authenticated cart mutations + tests                               |
| **7** | Checkout                        | `[ ]`  |  `[P0]`  | Idempotency + order polling + confirmation                         |
| **8** | Orders and account              | `[ ]`  |  `[P0]`  | Own orders, profile read, address book                             |
| **9** | Quality sweep                   | `[ ]`  |  `[P0]`  | Full journey, a11y, consistency, CI e2e policy                     |
| **10** | Standalone mock preview        | `[ ]`  |  `[P1]`  | MSW `dev:mock` (Playwright still needs a live API)                 |
| **11** | Commercial loop (ecosystem)    | `[ ]`  |  `[P1]`  | Storefront → SAGA → admin WS toast. Does **not** block Phase 12    |
| **12** | Release gate                   | `[ ]`  |  `[P0]`  | Deploy/preview, stranger quick start, smoke                        |
| **13** | Visual showcase                | `[ ]`  |  `[P1]`  | Hero recording, screenshots, README                                |
| **14** | Storefront polish              | `[ ]`  |  `[P2]`  | Optional UX after the gate (empty-state guides, command palette)   |

---

## Phase 0: Foundation

> Runnable Next.js 16 app with toolchain and test harness. No product features.

**OpenAPI capabilities:** health / readiness (see [API-INTEGRATION.md](API-INTEGRATION.md)).

**Scope:**

- [x] Scaffold with `create-next-app@latest`: App Router, TypeScript, ESLint, Tailwind v4, `src/` directory. **No** Pages Router. **No** `middleware.ts`. **No** `proxy.ts` unless a later phase proves a rewrite need.
- [x] `next.config.ts`: `cacheComponents: true`; `reactCompiler: true` if current stable docs mark it stable; `typedRoutes` on. Do not set `experimental.ppr`. Security headers via `headers()` (CSP/frame/etc.) - not Proxy.
- [x] Path aliases (`@/*` → `src/*`), strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `forceConsistentCasingInFileNames`). Keep the TypeScript major `create-next-app` installs (do not force admin’s TS 6 if Next does not support it). `engines` Node `>=24` / npm `>=11`; `.nvmrc` = `24`.
- [x] Prettier (local format; not a merge gate unless you choose otherwise). ESLint flat config: `typescript-eslint`, `react-hooks` (React 19), `jsx-a11y`, `consistent-type-imports`. Scripts: `dev`, `build`, `lint`, `lint:fix`, `typecheck`, `test`, `test:watch`, `test:e2e`. Lint is `eslint .`, not `next lint`.
- [x] shadcn/ui init for Next + Tailwind v4 (Zod major that the current `@hookform/resolvers` supports). `cn()` via `clsx` + `tailwind-merge`. Primitives under `src/components/ui/`. Add Sonner.
- [x] `.env.example` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` (no secrets). Use `process.env.NEXT_PUBLIC_*` - **not** Vite `import.meta.env`. Port admin `scripts/generate-env.js`: `npm run env:init` / `env:init:force`. `.secrets.example` for Playwright (no passwords committed).
- [x] `.gitignore` ignores `.env`, `.env.local`, `.env*.local`, `.secrets`, and other secret files.
- [x] OpenAPI typed client: port `scripts/generate-api-client.js` → `src/lib/api/generated/schema.d.ts` + `npm run api:generate` from live Swagger (`openapi-fetch` + `openapi-typescript`).
- [x] Vitest + Testing Library: jsdom, globals, `@testing-library/jest-dom` (`src/test/setup.ts`). One sample test. Exclude `e2e/`.
- [x] Playwright placeholder smoke hitting `/`. Config later grows `guest` / `customer` projects (Phase 9).
- [x] CI: copy admin shape - parallel `lint`, `typecheck`, `unit-tests`, `build`, `audit` (`npm audit --omit=dev --audit-level=high`), composite `.github/actions/setup-node-ci` (Node from `.nvmrc` + `npm ci`), aggregator job `ci`. Dependabot weekly npm + GitHub Actions.
- [x] Dev server on port **3100** (`strictPort`). Document that `dev` and `start` cannot share the port.
- [x] Companion (API repo, tiny): add `http://localhost:3100` to `CORS_ALLOWED_ORIGINS` in `.env.example` / local env. Credentials CORS. Do not wildcard `*`.

**Done when:** `npm run lint`, `typecheck`, and `test` pass on a clean install; `npm run dev` serves an empty App Router shell on **3100**.

**Where:** `src/app/`, `src/components/`, `src/lib/api/`, `.github/workflows/`

---

## Phase 1: Agent ecosystem and conventions

> Lock how humans and agents work before features diverge. Same shape as the API and admin, sized for Next.js 16.

### Files to create (minimal outline)

| File | Purpose (keep short) |
| :--- | :------------------- |
| `AGENT.md` | Authority order; non-negotiables; link to docs below |
| `.agents/PROJECT-CONTEXT.md` | Stack, folders, RSC vs client, API base URL, CORS, links to API + admin docs |
| `docs/ai/README.md` | Index of AI docs |
| `docs/ai/CONVENTIONS.md` | Feature layout, RSC/client split, Query/forms, errors, naming |
| `docs/ai/GOVERNANCE-AND-QUALITY-GATES.md` | Merge gates: lint, typecheck, tests, audit, Playwright policy |
| `docs/ai/WORKFLOW-PLAYBOOK.md` | Roadmap task → implement → verify |
| `docs/architecture/ARCHITECTURE.md` | System context + composition (write the real tree, not a wish) |
| `docs/architecture/adr/README.md` | ADR index; immutable bodies (same lifecycle as admin/API) |
| `AGENTS.md` / `CLAUDE.md` / `.cursor/rules/*` | Thin adapters that **point at** `AGENT.md` (no forked policy) |

Optional later: `.agents/skills/` only if you adopt the API skills-sync model.

### `AGENT.md` non-negotiables (must include)

1. No business rules in this repo.
2. Call only the versioned API surface documented in OpenAPI (plus documented unversioned health if needed).
3. Prefer the OpenAPI client over ad-hoc `fetch` wrappers for domain calls. RSC catalog fetchers still use generated types/paths, not a second client dialect.
4. Require verification evidence for behavior changes.
5. Do not push, publish, or change production config without explicit user confirmation.
6. If the API contract is wrong, fix it in `ecommerce-store-api`. Do not paper over it here.

### `docs/ai/CONVENTIONS.md` must cover

- Roadmap phase numbers belong **only** in this file. Other docs describe behavior without phase IDs (admin CONVENTIONS §13).
- ADR bodies immutable; index/status may change (admin CONVENTIONS §14).
- Server Components by default; `"use client"` only for interactivity
- `src/app` = thin routes (layouts, `page.tsx`, `loading.tsx`, `error.tsx`, metadata). Feature code lives in `src/features/<name>/`
- Typical feature shape (no barrels):

  ```text
  src/features/catalog/
    api/          # OpenAPI wrappers; server files start with import 'server-only'
    hooks/        # TanStack Query (client features only)
    components/
    lib/          # searchParam parsers, pure helpers
    schemas/      # Zod (when there is a form)
    types.ts      # aliases to generated OpenAPI types
  ```

- Cross-feature imports: concrete modules only. No re-export shims. Preset query facades that call another feature’s request with fixed filters are allowed (admin CONVENTIONS §15).
- Two HTTP clients: `lib/api/browser-client.ts` (cookies, Bearer, 401 recovery) vs `lib/api/server-client.ts` (`import 'server-only'`, no credentials). Generated `schema.d.ts` is shared.
- Auth exception: session Query lives in `AuthProvider` (`src/lib/auth/`). Key `['auth','session']`. Do not invent `useAuthQuery` in the feature.
- Catalog is RSC + awaited `searchParams`. Filters: Next `next/form` GET or `Link`. **Never** `useSearchParams` + `setSearchParams` (or `nuqs`) for the product list.
- Cart, checkout, orders, session use TanStack Query in Client Components. Do **not** prefetch/hydrate catalog into Query.
- TkDodo query-key factories per **client** feature (`all` / `lists()` / `list(filters)` / `details()` / `detail(id)`)
- Client lists (orders, not catalog): URL search params as source of truth; `placeholderData: keepPreviousData`; `staleTime` ~45s; enums `satisfies` generated unions
- QueryClient lives in a **client** `Providers` (`useState(() => new QueryClient())`). Skip retry on `429`; else `failureCount < 2`. Session: never retry `isClientError`. No `throwOnError`.
- Server catalog fetchers: wrap with React `cache()` so `generateMetadata` and the page share one HTTP call. Wrap async catalog UI in `<Suspense>` (Cache Components static shell). Prefer that over a page-only `loading.tsx` for list/detail holes.
- Handle Query `isError` with `QueryStateAlert` (`hasData` = last good data). RSC uses `error.tsx` / `not-found.tsx` instead.
- Form pattern (RHF + Zod current major) aligned to DTOs. `throwApiErrorFromResponse` in browser `api/` only. `applyApiFormErrors` + `matchField`; skip OCC `409` fields. `ActionErrorAlert` on mutations.
- RFC 9110 helpers - prefer predicates over `error as ApiRequestError`
- Confirm dialogs: block dismiss while `isPending`; `ActionErrorAlert` inside the dialog
- Env: `NEXT_PUBLIC_*` only in the browser
- `params` / `searchParams` / `cookies()` / `headers()` are async
- `"use cache"` only if catalog HTML can be stale vs stock. Default: request-time RSC (no `"use cache"` on product/inventory reads)
- No `proxy.ts` unless a rewrite/redirect cannot live in `next.config.ts`. Never auth in Proxy.
- Theme: Light/Dark/System, FOUC script, `useSyncExternalStore`, `ThemeAwareToaster`. Key `store-ui-theme`
- Storefront scrolls the document. No admin `h-screen overflow-hidden` shell
- Loading: `QueryLoading` / `role="status"` / `aria-busy` on client fetches. RSC: `<Suspense>` holes (+ optional `loading.tsx`). No skeleton requirement in v1
- React Compiler: do not add `useMemo`/`useCallback` by habit
- Treat rendered API strings as untrusted. No `dangerouslySetInnerHTML`
- Tests: RTL + hook-mocked specs for **client** components; Playwright for RSC routes and journeys
- ESLint: `typescript-eslint` + `react-hooks` + `jsx-a11y` + `consistent-type-imports`

### ADRs to open in this phase (Proposed → Accepted as the matching phase lands)

| ADR | Decision | Lands |
| :-- | :------- | :---- |
| ADR-0001 | Browser OpenAPI client owns session and mutations; RSC only fetches public catalog; no BFF | 1 / 3 |
| ADR-0002 | In-memory access token + HttpOnly refresh cookie (port admin) | 3 |
| ADR-0003 | Single-flight silent refresh + one domain retry | 3 |
| ADR-0004 | No guest cart; login/register gate on cart and checkout | 6 |
| ADR-0005 | Checkout completion is order-resource polling, not a job-queue API | 7 |
| ADR-0006 | Do not add `proxy.ts` for auth or headers; `next.config.ts` `headers()` for CSP/etc. | 0 / 2 |

**Scope checklist:**

- [x] Create all files in the table above
- [x] Link them from the root README docs table
- [x] Point adapters at `AGENT.md` without duplicating rules
- [x] ADR index exists; bodies follow admin/API immutability rules

**Done when:** A new chat can follow `AGENT.md` + `PROJECT-CONTEXT.md` and know stack, RSC/client boundary, session model, and quality gates without reading the whole roadmap.

---

## Phase 2: App shell

> Stable App Router chrome **before** auth (same sequencing lesson as the admin SPA). Do not wire session yet.

**OpenAPI capabilities:** health / liveness / readiness (discover exact paths in Swagger).

**Scope:**

- [x] Root layout: skip link to `#main`; `<main id="main" tabIndex={-1}>`; `html` lang; metadata defaults. Branding is not an `h1`. **Normal document scroll** (no `h-screen overflow-hidden`).
- [x] Storefront chrome: header, footer, mobile nav (shadcn `Sheet` + `SheetTitle`; Esc closes; close on navigate).
- [x] Route groups: `(shop)` public chrome; `(account)` later guards; `(auth)` without shopping chrome.
- [x] `loading.tsx` / `error.tsx` / `not-found.tsx` / `global-error.tsx` (`error.tsx` must be a Client Component). **Do not** add a class-based `route-error-boundary`.
- [x] Small client `FocusMainOnNavigate` using `usePathname()` - do not import React Router helpers.
- [x] Shared feedback components exist for later Query use (`QueryStateAlert`, `QueryLoading`, `QueryListRegion`, `ActionErrorAlert`). Do not use them on RSC catalog pages.
- [x] `src/lib/format.ts` + URL parse helpers + `cn()`.
- [x] Light / Dark / System theme (`useSyncExternalStore`, `store-ui-theme`, zero-FOUC script in root layout). `ThemeAwareToaster`. No dead theme button. If Phase 0 added a CSP, allow that inline script (nonce or a tight hash) - do not ship a CSP that silently blocks the FOUC script.
- [x] Optional diagnostics route, `noindex`, not linked in shopper nav.
- [x] Providers: Theme + Toaster. Query + Auth wait for Phase 3.
- [x] Refresh `.agents/PROJECT-CONTEXT.md` folder map
- [x] Playwright: home chrome, mobile nav, skip link, no theme flash

**Done when:** Home shell renders on 3100; theme persists; health page shows API up/down against a running API; tests green.

**Where:** `src/app/`, `src/components/layout/`, `src/components/theme/`

---

## Phase 3: Authentication and session

> Port the **admin** session stack, then adapt chrome for customers (register, no `access_admin` gate).

**OpenAPI capabilities:** register, login, refresh, logout (discover exact paths in Swagger).

**Seeded user:** customer from API [`SEEDING.md`](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/SEEDING.md) (do not paste passwords into this repo). First login will still be blocked by `mustChangePassword` until Phase 4 - Phase 3 tests may use a freshly **registered** user to prove the happy session path, or stop at the change-password redirect.

**Scope:**

- [ ] Browser `apiClient` from admin `client.ts` **in a client-only module**: cookies, Bearer, `recoverFromDomain401`. Never silent-retry `/authentication/*`. Do not import this file from Server Components.
- [ ] Port `silent-refresh.ts`: raw `fetch`; `inFlightRefresh`; `onSessionRefreshed`.
- [ ] Port RFC 9110 helpers + tests (`parse-api-error.ts`, `throw-api-error.ts`, `form-api-errors.ts`).
- [ ] Client `Providers`: `useState(() => new QueryClient())` + defaults (no retry on `429`; else `failureCount < 2`). No `throwOnError`. Do not create QueryClient at module scope or import it from RSC.
- [ ] `AuthProvider`: `['auth','session']`, `staleTime: Infinity`, never retry `isClientError`, retry `< 2` on 5xx/network; `onSessionRefreshed` → `setQueryData`; logout `clearAccessToken` + `queryClient.clear()`.
- [ ] Login and register (RHF + Zod). `applyApiFormErrors`. Distinct **429** copy vs invalid credentials.
- [ ] After login/logout/password-change **forms**: `router.push(safeRedirectPath)` + `router.refresh()`. Leave `window.location.assign` only on the OpenAPI interceptor panic path (failed refresh / forced password), matching admin `client.ts`.
- [ ] Access token in memory; refresh cookie only. No `localStorage` **tokens**.
- [ ] `safeRedirectPath`: same-origin path; reject `//`; reject `/login` and `/change-password` loops.
- [ ] Auth-aware header. **Do not** port `OperatorRoute`, `PermissionRoute`, or `IndexLandingGate`.
- [ ] Client guards: layout-level `ProtectedRoute` / `GuestRoute` under `(account)` / `(auth)`, not a wrap on every page. Unauthenticated → `/login?redirect=` + encoded `safeRedirectPath`. Do not invent a session-hint cookie in v1 (the access token is in memory; a short loading splash is the honest UX).
- [ ] `401` after failed recovery → sign in. Other `403` → forbidden. Do not bounce to login on boot 5xx with no retry.
- [ ] Accept any authenticated shopper session. RSC catalog still sends no Bearer.
- [ ] Confirm API CORS allows `http://localhost:3100` with credentials.
- [ ] Tests: validation, guards, silent refresh, `safeRedirectPath` (RTL). Playwright for login success/failure (throttle ~61s).
- [ ] Accept ADR-0001, ADR-0002, ADR-0003. Update [API-INTEGRATION.md](API-INTEGRATION.md)

**Done when:** A registered (or seeded-after-Phase-4) customer can establish a session, refresh the page, and stay signed in via the cookie; unauthenticated users cannot open a protected stub; tests green.

**Where:** `src/lib/api/`, `src/lib/auth/`, `src/features/auth/`

---

## Phase 4: Forced password change

> Seeded customer accounts start with `mustChangePassword: true`. Skipping this phase bricks the documented quick start.

**OpenAPI capabilities:** change-password; `mustChangePassword` on login/refresh; `403` `MUST_CHANGE_PASSWORD`.

**Scope:**

- [ ] Parse `mustChangePassword` on login, refresh, and change-password responses
- [ ] Global `403` redirect on `apiClient`: `code === 'MUST_CHANGE_PASSWORD'` **or** message contains `Password change required` (admin `shouldRedirectToChangePassword` - do not rely on `code` alone)
- [ ] `/change-password` route (auth layout, no shopping chrome)
- [ ] Guards: cannot enter shop/account until the flag is clear; cannot skip via URL (`safeRedirectPath` already rejects this path as a post-login target)
- [ ] Change-password form (RHF + Zod) wired to API; `applyApiFormErrors`
- [ ] Sign out on the change-password page stays on that page (admin behavior)
- [ ] Component tests for guards and validation
- [ ] Playwright: seeded customer forced change then reaches the storefront (reuse admin throttle/password-candidate helper ideas)
- [ ] Update `docs/API-INTEGRATION.md`

**Done when:** Seeded `customer@store.local` lands on change-password, updates the password, and reaches the storefront shell; tests green.

---

## Phase 5: Catalog

**OpenAPI capabilities:** product list/detail (`@OptionalAuth`, shopper sees active only); category list/detail; public inventory check / product inventory read (discover in Swagger).

**Scope:**

- [ ] Home + product list as **async Server Components**. Wrap the fetching UI in `<Suspense>` so `cacheComponents` can ship chrome as the static shell. Empty/error via `not-found.tsx` / `error.tsx` - **not** `QueryStateAlert`
- [ ] Server OpenAPI wrapper (`import 'server-only'`). No cookies, no Bearer. Wrap fetchers in React `cache()` when `generateMetadata` and the page share a call.
- [ ] Bind **every** current list DTO field to the URL. Parse `searchParams` on the server. Change filters with Next `<Form>` from `next/form` or `<Link href={...}>` - not `setSearchParams`, not `nuqs`
- [ ] Category navigation from category list (active only)
- [ ] Product detail by **id**. Await `params`. Inactive → `not-found.tsx`
- [ ] Availability from public inventory/check. `200 + null` → out of stock, not an error banner. `formatMoney` for price
- [ ] Metadata, Open Graph, `robots.ts` / `sitemap.ts`
- [ ] `next/image` + `images.remotePatterns`. Placeholder when `imageUrl` is null
- [ ] Do **not** put `"use cache"` on product/inventory reads in v1 (stale stock). `cacheComponents` still streams a static shell
- [ ] Do **not** hydrate catalog into TanStack Query
- [ ] Add-to-cart CTA island only; mutation is Phase 6
- [ ] Tests: URL parsers (unit); Playwright for list → detail and filter round-trip

**Done when:** Seeded catalog is browsable without a session; SEO tags exist on detail; filters round-trip through the URL to the API; tests green.

**Where:** `src/features/catalog/`, `src/app/(shop)/`

---

## Phase 6: Cart

**OpenAPI capabilities:** cart create/read and line-item mutations (`manage_own_cart`).

**Scope:**

- [ ] Accept ADR-0004. Guest add-to-cart → `/login?redirect=` + `safeRedirectPath`. No local guest basket
- [ ] Create/load cart after session exists; persist **cart id** in `localStorage` (namespaced key; not a credential). Clear it on logout. Do **not** persist line items locally
- [ ] Add / update quantity / remove / clear via OpenAPI. Client components only. Feature `api/` uses `throwApiErrorFromResponse` only. On mutation success: invalidate cart queries **and** `router.refresh()` so RSC inventory on open product pages is not stale.
- [ ] Query cache: TkDodo keys; `placeholderData: keepPreviousData`; invalidate `detail(cartId)` (and header badge) on mutation success
- [ ] Map API errors with `ActionErrorAlert` / `getErrorMessage` (stock, ownership, validation, `429`). No client stock engine
- [ ] Cart page + header count. Empty state. `QueryListRegion` while fetching
- [ ] Component tests for cart controls and guest redirect (hook-mocked)
- [ ] Playwright: sign in → add item → see line (seeded in-stock SKU); authenticated worker `workers: 1`

**Done when:** Seeded customer can build a cart against the API; signed-out add-to-cart never writes a fake cart; tests green.

**Where:** `src/features/cart/`, `src/app/(shop)/cart/`

---

## Phase 7: Checkout

**OpenAPI capabilities:** `POST` checkout with documented idempotency headers/fields; `GET` own order by id (`view_own_orders`). Payment method enum currently `STRIPE` (API mock adapter). See Swagger + [API-INTEGRATION.md](API-INTEGRATION.md).

**Scope:**

- [ ] Accept ADR-0005
- [ ] Checkout is a protected route. Empty cart cannot start checkout (API will reject; UX disables)
- [ ] Form matching the checkout command: `cartId`, shipping address (prefill from default address when Phase 8 exists; until then, fields aligned to `ShippingAddressDto`), `paymentMethod` as the OpenAPI enum (`satisfies` - no invented `COD`), optional notes
- [ ] Send `Idempotency-Key` (and keep body fallback only if the DTO still has it). Generate once per **attempt**; reuse on retry of that attempt; new attempt → new key. Persist the in-flight key in `sessionStorage`
- [ ] Handle validation via `applyApiFormErrors`; **409** in-progress (`Retry-After`); **503** fail-closed; **429** banner. Disable submit while `isPending` (admin confirm-dialog pending rule)
- [ ] On 201: keep `orderId`. Poll `GET` order (TanStack Query `refetchInterval`) until a **documented** status that means SAGA success (`confirmed` or later fulfillment) or failure (`payment_failed`, `cancelled`). Surface API messages. Do not poll `jobId` (no public route)
- [ ] Confirmation UI with order id and `StatusBadge`. Out of scope: Stripe Elements / live card UI (API 17b)
- [ ] Component tests: validation, 409/503 messaging, polling terminal states (mocked)
- [ ] Playwright: happy-path checkout on seeded in-stock data (wait for confirmed; mock gateway is enough)

**Done when:** One seeded checkout completes end-to-end; retrying the same idempotency key does not create a second order; polling shows a real order status; tests green.

**Where:** `src/features/checkout/`, `src/app/(shop)/checkout/`

---

## Phase 8: Orders and account

**OpenAPI capabilities:** own order list/detail (`view_own_orders`); `GET` user by id (`view_own_profile`); address writes (`manage_own_addresses`). Confirm **current** Swagger before coding.

**Known contract (verify on start, do not assume forever):**

- Customer **profile PATCH** is operator `manage_users` today. **Do not** ship an edit-profile form that calls an admin-only operation. Read-only profile until the API exposes a self-update.
- Address list is on `GET /v1/users/{id}` (`addresses[]`). Writes are the existing address operations. IDOR is enforced by the API; still pass the session user id only.

**Scope:**

- [ ] Order list: bind pagination + `status` (and any other **own-order-safe** query fields from OpenAPI) via URL parsers. `keepPreviousData`. Do not send admin-only filters as shopper chrome. `StatusBadge` + `formatDateTime`
- [ ] Order detail: lines, status, shipping, payment fields the DTO already returns (`view_own_payments` if a nested/list operation exists - discover in Swagger; skip if not)
- [ ] Account: profile read + address book add/edit/delete/set-default. Port admin address UX: `isDefault` on add only; Set default is a card action; confirm delete; `ActionErrorAlert` inside the dialog; block close while `isPending`
- [ ] `401`/`403` UX (API still enforces access)
- [ ] Tests: empty/error order list; address schema + form (admin `address-schema.spec.ts` pattern); hook-mocked pages
- [ ] Playwright: open an order after Phase 7 checkout **or** a seeded customer order; address add then delete (leave the seeded home address)

**Done when:** Customer can view their orders and manage their address book through the API; profile is honest about what the contract allows; tests green.

**Where:** `src/features/orders/`, `src/features/account/`, `src/app/(account)/`

---

## Phase 9: Quality sweep

> Cross-cutting only. Feature tests should already exist. Same job as admin Phase 8.

**OpenAPI capabilities:** none new.

### A. Shopper journey (Playwright)

- [ ] Projects: `guest` (parallel) and `customer` (`workers: 1`, worker-scoped reused page - admin `admin-fixtures.ts` lesson: prefer in-app nav, avoid full reload/cookie rotation)
- [ ] `e2e/global-setup.ts`: sibling `../ecommerce-store-api` `npm run db:seed:auth`; `E2E_SKIP_DB_SEED=1` documented. `e2e/README.md` (fail-closed secrets, ~61s login throttle)
- [ ] One spec: auth (seeded customer, including password change if the seed flag is set) → catalog search/detail → add to cart → checkout → order detail (same session)
- [ ] Keep per-feature specs; the journey is glue
- [ ] In CI, missing `E2E_*` fails the e2e job when that job is scheduled (no skip-to-green). Local skip message stays. `npm run env:init:secrets` from `.secrets.example`

### B. Keyboard and accessibility

- [ ] Skip link, `main` id, page `h1`, decorative icons `aria-hidden`
- [ ] Port admin `e2e/keyboard.spec.ts` ideas: skip link → `#main`; mobile sheet Esc; dialog Esc / focus restore
- [ ] `@axe-core/playwright` helper like admin `expectNoSeriousAxeViolations` on home, product detail, cart, checkout, order detail (no serious/critical)
- [ ] Loading / status: `QueryLoading` / `QueryListRegion` (`role="status"`, `aria-busy`, `aria-live="polite"`)
- [ ] Focus `#main` after client navigations (already in Phase 2; verify checkout → confirmation)

### C. Consistency

- [ ] Shared `src/lib/format.ts` + `src/lib/list-filters.ts` (no per-feature copy-paste of `parsePositiveInt`)
- [ ] Shared `QueryStateAlert` / `QueryListRegion` / `ActionErrorAlert`; `StatusBadge` for order states
- [ ] Confirm no catalog data is duplicated in TanStack Query without a reason
- [ ] Confirm no barrels, no `any`, no Server Actions hitting the API, no `throwOnError`, no skeleton cargo-cult
- [ ] Hook-mocked page specs remain the pattern; do not rewrite them onto `QueryClientProvider`
- [ ] Align CONVENTIONS + ARCHITECTURE + PROJECT-CONTEXT with the real tree (phase numbers stay in this file only)

### D. CI and governance

- [ ] PR merge gates as parallel jobs plus `ci` aggregator (lint, typecheck, unit, build, audit) using `setup-node-ci` + `.nvmrc`
- [ ] Dependabot weekly npm + GitHub Actions (grouped prod/dev like admin)
- [ ] Playwright on PRs into `main`/`master` and `workflow_dispatch`; feature PRs into `develop` skip e2e; skipped e2e does not fail `ci`
- [ ] GOVERNANCE documents that policy + throttle/seed notes

**Done when:** Full journey is green locally against a seeded API; axe/keyboard pass; CI policy is documented and the e2e job does not skip-to-green.

---

## Phase 10: Standalone mock preview (MSW) [P1]

> Instant evaluation without Docker/API. **Does not** replace Playwright. Comes after the real screens exist (Phase 9).

**OpenAPI capabilities:** Mirror shopper operations only (auth, catalog, inventory check, cart, checkout, own orders, profile/addresses). Do not mock admin analytics/RBAC.

**Scope:**

- [ ] MSW as a **dev** dependency. Handlers under `src/lib/mock/` only
- [ ] Feature modules must **not** import `@/lib/mock/*`. Allowed touchpoints: client provider (dynamic import) and login page (lazy demo chrome) - same boundary as admin CONVENTIONS §15
- [ ] **Inline** env gate before any MSW import so production bundling drops the chunk (admin `main.tsx` idea). Do not hide the gate behind a helper the bundler cannot tree-shake
- [ ] Browser MSW **does not** intercept RSC `fetch`. Also start MSW in the **Node** runtime (or a mock HTTP origin) so catalog pages work in `dev:mock`. A Vite-style worker-only mock is an incomplete storefront demo.
- [ ] Worker / interceptor: `onUnhandledRequest: 'bypass'`, `quiet: true`
- [ ] Demo login chrome lazy-loaded only when mock is on. Persist a **flag** in `sessionStorage`, not an access token
- [ ] Realistic seed: active catalog, categories, one customer, cart, checkout → confirmed order
- [ ] Scripts: `dev:mock`, optional `build:mock` for a static demo
- [ ] README badge for mock/demo. Playwright still targets a live API

**Done when:** `npm run dev:mock` can browse, sign in, add to cart, and see a fake confirmation with the API process down.

**Where:** `src/lib/mock/`

---

## Phase 11: Commercial loop (ecosystem) [P1]

> Verify the **already shipped** API SAGA + admin WebSocket using this storefront as the producer. This is **not** a storefront feature dump and does **not** block Phase 12.
>
> Prerequisite: Phase 7 complete. Companions: API Phase 17c, admin live order toasts.

**OpenAPI capabilities:** checkout + order reads already wired. Admin consumes `orders.created` (or current envelope - discover in API docs).

**Scope:**

- [ ] Manual (then documented) 4-step loop: storefront checkout → API inventory lock + SAGA → API WebSocket → admin toast + order list invalidation **without** refresh
- [ ] Prefer a short runbook in the **API** repo (`docs/integration/COMMERCIAL-LOOP-INTEGRATION.md`) as the source of truth; this repo links it
- [ ] Optional Playwright note: this cross-origin three-process test is **not** required in storefront CI. Do not couple storefront CI to the admin port

**Done when:** One live checkout from this app appears on the admin dashboard in real time; the runbook exists.

---

## Phase 12: Release gate

> Executable checklist lives in [`RELEASE-GATE.md`](RELEASE-GATE.md) (create in this phase; no passwords).

**Scope:**

- [ ] Stranger onboarding: README → `env:init` → `dev` on **3100** against a live API started from the API repo’s docs (including CORS origin)
- [ ] Seeded purchase path: forced password change → browse → cart → checkout → order
- [ ] `next build` + `next start` (or platform preview) on **3100** against the same API
- [ ] README + PROJECT-CONTEXT + API-INTEGRATION match the repo
- [ ] Confirm no secrets in `NEXT_PUBLIC_*`

**Done when:** A stranger can follow the README and complete a seeded purchase without tribal knowledge.

---

## Phase 13: Visual showcase [P1]

> Portfolio assets. Capture from `dev:mock` first if Phase 10 exists; re-verify against live data after Phase 12.

**Scope:**

- [ ] Short walkthrough (WebP/GIF): browse → add to cart → checkout confirmation
- [ ] Retina stills: home, product detail, cart/checkout
- [ ] README hero + accurate limits (mock payments, no hosted store)

**Done when:** `docs/assets/` exists and the README preview is truthful.

---

## Phase 14: Storefront polish [P2]

> Optional. Does not block Phase 12.

- [ ] Richer empty states / first-purchase guidance
- [ ] Command palette or keyboard product search (only if catalog search is already URL-driven)
- [ ] View Transitions / React 19 `Activity` where they improve real navigation, not decoration
- [ ] Customer-facing WebSocket for own-order updates **only if** the API documents a shopper event. If you add it: connect like admin **code** (`query.token` + `Authorization` Bearer), connect on session / disconnect on logout, invalidate own-order query keys. Do **not** copy operator low-stock toasts or `dashboardKeys`. Otherwise keep Phase 7 polling.

---

## Out of scope (v1)

- Pages Router, `middleware.ts`, `proxy.ts` as an auth or header dump, `getServerSideProps`, implicit fetch cache as the caching model
- TanStack Query `HydrationBoundary` for public catalog (RSC already rendered it)
- `nuqs` / `useSearchParams` as the product-list filter engine
- Class-based error boundaries next to `error.tsx`
- Admin `h-screen overflow-hidden` shell
- `window.location.assign` for post-login navigation
- A single OpenAPI client used from both RSC and the browser
- Guest / anonymous **line-item** baskets (cart **id** in localStorage is allowed)
- Product routes by slug until OpenAPI has a slug lookup
- Inventing checkout job-status HTTP
- Live Stripe Elements / card charging (API mock until API 17b)
- Admin/operator chrome, RBAC matrices, order transitions, inventory adjust
- Domain rules (pricing, stock, promotions) in the UI
- Native mobile, multi-tenant theming, i18n, wishlist, reviews
- Global client store for server data (Zustand/Redux)
- Barrel files and cross-feature adapter shims
- TanStack Table, Recharts, operator WebSocket toasts, RBAC nav matrices, `IndexLandingGate`
- Skeleton loaders as a v1 requirement (use `loading.tsx` / `QueryLoading`)
