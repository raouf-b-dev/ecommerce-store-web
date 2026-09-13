# E-commerce Store Web: Roadmap

> Delivery plan for the customer storefront. Work top to bottom.
>
> Companions: [README.md](../README.md), [API-INTEGRATION.md](API-INTEGRATION.md), [ecommerce-store-api](https://github.com/raouf-b-dev/ecommerce-store-api).
>
> Revision (2026-09-08): Integer phases 0-14. Next.js 16 App Router architecture: TanStack Query is browser-only; catalog is RSC + Suspense; MSW mock preview covers both browser and Node runtimes.

---

## How to use this file

- `[ ]` not started
- `[/]` in progress
- `[x]` done
- Finish each phase before starting the next.
  - **Exceptions:** Phase 11 (order lifecycle verification) and Phase 14 (polish) do **not** block Phase 12 (release gate). Phase 13 (visuals) may record from Phase 10 mock, then re-verify after Phase 12.
- Keep business rules in the API. This repo is UI, routing, caching, and error mapping only.
- For HTTP contracts, use **live OpenAPI/Swagger** (and the generated client). [API-INTEGRATION.md](API-INTEGRATION.md) covers client rules only, not an endpoint catalog.
- Do not invent filters, buttons, slug lookups, guest carts, or checkout job APIs that OpenAPI does not expose. If the API is missing a customer capability, ensure the backend exposes it in the OpenAPI schema before building UI around invented endpoints.

### Testing policy

Write tests **with** each feature.

| Layer                                       | When                                                                                      |
| :------------------------------------------ | :---------------------------------------------------------------------------------------- |
| Unit / component (Vitest + Testing Library) | Client islands and pure helpers in the same phase. **Do not** RTL-test Server Components. |
| Playwright                                  | RSC pages and the critical path when the feature joins it                                 |
| Cross-cutting quality                       | Phase 9 only                                                                              |

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

Pin **latest stable** at scaffold time. Do not add backward-compat shims for Pages Router or implicit App Router fetch cache.

| Concern                    | Choice                                                                                                                                                                                                                                                 |
| :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime                    | Node.js 24                                                                                                                                                                                                                                             |
| Framework                  | Next.js 16 App Router (`create-next-app@latest`). Turbopack default. `cacheComponents: true`.                                                                                                                                                          |
| UI                         | React 19 (whatever Next 16 ships). TypeScript strict (`noUncheckedIndexedAccess`).                                                                                                                                                                     |
| Bundling / lint            | Turbopack; ESLint flat config (`eslint .` - do **not** use removed `next lint`)                                                                                                                                                                        |
| Styling                    | Tailwind CSS v4 + shadcn/ui (Radix). Configured natively for Next.js App Router.                                                                                                                                                                       |
| Rendering                  | Server Components by default. `"use client"` only for session, forms, cart, checkout, and other interactivity.                                                                                                                                         |
| Public reads               | RSC fetchers in `features/*/api/` with `import 'server-only'`. Catalog is unauthenticated on purpose. **No** TanStack Query hydration for catalog.                                                                                                     |
| Authenticated reads/writes | Browser `openapi-fetch` client + TanStack Query. **Not** Server Actions as an API proxy (that is a BFF).                                                                                                                                               |
| QueryClient                | Query is **browser-only** in v1 (no catalog hydration). A client `Providers` creates per-server-render clients and reuses one module instance only in the browser (`getQueryClient`) so Suspense cannot discard it and SSR users never share cache. Do **not** import Query from RSC. |
| Local UI state             | React state. Session via `AuthProvider`. **No Zustand** unless a later phase proves a real cross-tree UI need that is not server state. React Compiler on by default; avoid manual `useMemo`/`useCallback` by default.                                    |
| Forms                      | React Hook Form + Zod (current major the current shadcn/RHF resolver supports). Align to OpenAPI DTOs.                                                                                                                                                 |
| API                        | `openapi-fetch` + generated `schema.d.ts`                                                                                                                                                                                                              |
| Tests                      | Vitest + Testing Library + Playwright                                                                                                                                                                                                                  |
| A11y lint                  | `eslint-plugin-jsx-a11y` + `eslint-plugin-react-hooks` (React 19 compatible) from Phase 0                                                                                                                                                              |

**Ports (intent):** storefront `3100`, API `3000`. API CORS must allow `http://localhost:3100` with credentials.

---

## Rendering and session (non-negotiable)

These decisions are locked here so phases do not fork.

| Rule                       | Detail                                                                                                                                                                                                                                         |
| :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No BFF                     | No Next Route Handlers or Server Actions that forward cookies/tokens to the API. Storefront UI communicates directly with the API.                                                                                                             |
| Security headers & auth placement | Security headers in `next.config.ts` `headers()`. Static redirects in `redirects()`. Client session gates for protected routes ([ADR-0006](architecture/adr/ADR-0006-security-headers-and-client-auth.md)). Resource 404s via App Router `notFound()` before streaming ([ADR-0008](architecture/adr/ADR-0008-resource-404-via-app-router.md)). |
| Two HTTP clients           | **Browser** client: cookies + Bearer + 401 recovery. **Server** client: `import 'server-only'`, no `credentials`, no Bearer, no login redirect. Do not one-file both with `typeof window` branches.                                            |
| RSC freshness              | With `cacheComponents`, wrap catalog fetch UI in `<Suspense>` so chrome is the static shell. Deduplicate `generateMetadata` + page with React `cache()`. After cart/checkout mutations, `router.refresh()` so RSC inventory/HTML is not stale. |
| 401 / force-password       | The `openapi-fetch` browser interceptor redirects via `window.location.assign` on low-level unrecoverable auth failures. Form success (login, logout, change-password) uses `router.push` + `router.refresh()`.                                       |
| Access token               | In-memory only (ADR-0002). Refresh via HttpOnly cookie on the **API** origin + `credentials: 'include'`. Next `cookies()` will not see it.                                                                                                   |
| Silent refresh             | Domain `401`: single-flight refresh + one retry (ADR-0003). Never silent-retry `/authentication/*`.                                                                                                                                            |
| RSC catalog                | Fetch **without** the shopper Bearer so `CatalogVisibilityPolicy` always sees a shopper (active-only). Sending an operator token from the server would leak inactive products into the storefront.                                             |
| Catalog filters            | Server `searchParams` + Next `next/form` GET or `<Link href>`. Do **not** use client-side `useSearchParams` + `setSearchParams` which forces catalog rendering into client components.                                                         |
| Cart                       | API requires `manage_own_cart`. **No guest line-item basket.** Persist **cart id** only (localStorage is fine; it is not a credential). Clear id on logout.                                                                                    |
| Checkout                   | `POST /v1/orders/checkout` is **async**. HTTP 201 returns `orderId` + `jobId`. There is **no** public job-status route. Poll `GET` order by id until a documented status. Do not invent `PENDING → PROCESSING → COMPLETED`.                    |
| Product URLs               | OpenAPI product detail is by **numeric id**. `slug` is a field, not a lookup. Use `/products/[id]`. Do not build a client-side slug index.                                                                                                     |
| Query parity               | Bind every list query param the **current** OpenAPI DTO already accepts in the same phase as the list. URL search params are the source of truth.                                                                                              |
| Errors                     | Shared RFC 9110 helpers. Map payloads; do not re-validate domain rules. RSC failures use `error.tsx` / `not-found.tsx`. `QueryStateAlert` is for **client Query** only.                                                                        |
| Shell                      | Document/body scroll for the storefront. Standard natural scrolling (avoid viewport-locked `h-screen overflow-hidden` layouts).                                                                                                                 |
| DRY                        | No barrel `index.ts`. No cross-feature re-export shims. Pages in `src/app` stay thin.                                                                                                                                                          |

Exact client rules: [API-INTEGRATION.md](API-INTEGRATION.md).

---

## Storefront Core Architecture & Module Blueprint

The storefront's core modules are organized under `src/lib/` and `src/components/`, separating server-side rendering concerns from client-side state and token lifecycle:

| Module | Responsibility | Rendering Boundary |
| :--- | :--- | :--- |
| `src/lib/api/browser-client.ts` | Browser `openapi-fetch` client. Attaches Bearer token, sets `credentials: 'include'`, proactively refreshes expiring tokens, and performs single-flight 401 recovery. Redirects on unrecoverable 401 or forced password change. | Client only (browser) |
| `src/lib/api/server-client.ts` | Server-only `openapi-fetch` client (`import 'server-only'`). Unauthenticated; sends no cookies and no Bearer token. Used for catalog reads and `/status` diagnostics. | Server Components only |
| `src/lib/api/silent-refresh.ts` | Raw `fetch` refresh implementation (avoids client interceptor re-entry). Implements single-flight promise reuse (`inFlightRefresh`) and Web Lock cross-tab synchronization. Fires `onSessionRefreshed` listener bus. | Client only (browser) |
| `src/lib/api/parse-api-error.ts` | RFC 9110 error parsing: `ApiRequestError`, `getErrorMessage`, `getErrorStatusCode`, `hasHttpStatus`, `isClientError`, `isServerError`, `isOptimisticLockConflict`. | Universal |
| `src/lib/api/throw-api-error.ts` | Standardized error throwing: `throwApiErrorFromResponse` and `throwTooManyRequests` for consistent error handling in feature API wrappers. | Client only (browser) |
| `src/lib/api/form-api-errors.ts` | Form error mapper: `applyApiFormErrors` and `matchField`. Automatically sets RHF field errors from RFC 9110 problem details; skips inline field errors on optimistic lock conflict (`409`). | Client only (browser) |
| `src/lib/auth/auth-session.ts` | In-memory storage for JWT access token. Accessible only in the browser runtime; never stored in localStorage. | Client only (browser) |
| `src/lib/auth/auth-context.tsx` | `AuthProvider` managing `['auth', 'session']` via TanStack Query. Configures `staleTime: Infinity`, zero retries on 4xx, proactive JWT-expiration refresh, and clean cache teardown on logout. | Client only (browser) |
| `src/lib/auth/auth-guard.tsx` | Layout guards: `ProtectedRoute` and `GuestRoute` enforcing authentication requirements with safe redirects. | Client only (browser) |
| `src/features/auth/lib/safe-redirect-path.ts` | URL sanitizer: ensures redirect targets are same-origin relative paths (`/…`), rejecting `//` protocol-relative paths and `/login` or `/change-password` loops. | Universal |
| `src/app/providers.tsx` | Application providers: ThemeProvider, client QueryClient manager (`getQueryClient()` with browser singleton reuse and per-render SSR isolation), AuthProvider, and ThemeAwareToaster. | Client only (browser) |
| `src/components/feedback/query-state.tsx` | Query feedback components: `QueryStateAlert` (handles soft vs hard error states based on `hasData`), `QueryLoading`, and `QueryListRegion` (`aria-busy`). | Client only (browser) |
| `src/components/feedback/action-error-alert.tsx` | Mutation error alert with `aria-live="polite"` for forms and dialogs. | Client only (browser) |
| `src/components/layout/storefront-chrome.tsx` | Storefront layout: skip link to `#main`, accessible header, navigation, and footer. | Universal |
| `src/components/layout/focus-main-on-navigate.tsx` | Accessible focus manager: moves focus to `#main` on App Router pathname changes. | Client only (browser) |
| `src/components/theme/*` | Light/Dark/System theme system using `useSyncExternalStore`, inline zero-FOUC script in root layout, and Sonner `ThemeAwareToaster`. Key: `store-ui-theme`. | Universal / Client |
| `src/lib/format.ts` | Formatting helpers: `formatMoney`, `formatDate`, `formatDateTime`, `formatStatusLabel` (defaulting to `en-US` locale). | Universal |
| `src/lib/list-filters.ts` | URL query parsing: typed numeric and boolean query parameter helpers (`parsePositiveInt`, `parseNonNegativeNumber`, `parseIsActiveParam`). | Universal |
| `src/lib/utils.ts` | Class utility: re-exports `cn` from the `cn` package. | Universal |
| `src/components/ui/status-badge.tsx` | Visual badges for order status (OpenAPI `OrderStatus`). Reused in checkout confirmation and Phase 8 orders. | Universal |
| `scripts/generate-api-client.js` | Script generating `src/lib/api/generated/schema.d.ts` from live OpenAPI/Swagger documentation. | Build tooling |
| `scripts/generate-env.js` | Template initialization: generates `.env.local` and `.secrets` from `.env.example` and `.secrets.example`. | Build tooling |
| `e2e/global-setup.ts` *(planned)* + `e2e/README.md` | Playwright test setup: supports local test database seeding via `E2E_SKIP_DB_SEED`, accounts for login throttle (~61s), and manages test secrets (Phase 9). | Testing harness |

### Storefront Architectural Boundaries & Exclusions

The following patterns belong to administrative consoles and are explicitly **excluded** from this customer storefront:
- Operator role guards (`OperatorRoute`, `PermissionRoute`, navigation permission matrices)
- Heavy administrative data tables (e.g. TanStack Table with complex multi-sort or column reordering)
- Operator charting dashboards and metric summaries
- Role/user management CRUD and inventory adjustment interfaces
- Operator order transition actions (Process, Ship, Deliver buttons)
- Operator WebSocket feeds (low-stock alerts, admin-wide order creation toasts)

---

## Phase overview

| Phase  | Name                                      | Status | Priority | Focus                                                              |
| ------ | ----------------------------------------- | ------ | :------: | ------------------------------------------------------------------ |
| **0**  | Foundation                                | `[x]`  |  `[P0]`  | Next 16 scaffold, tooling, tests, OpenAPI client, Cache Components |
| **1**  | Agent ecosystem and conventions           | `[x]`  |  `[P0]`  | AGENT policy, Next-specific CONVENTIONS, ADR template, adapters    |
| **2**  | App shell                                 | `[x]`  |  `[P0]`  | Layouts, chrome, error/loading, theme, health page                 |
| **3**  | Authentication and session                | `[x]`  |  `[P0]`  | Login, register, silent refresh, customer chrome                   |
| **4**  | Forced password change                    | `[x]`  |  `[P0]`  | Seeded customer `mustChangePassword` (do not skip)                 |
| **5**  | Catalog                                   | `[x]`  |  `[P0]`  | RSC list/detail, categories, query parity, SEO                     |
| **6**  | Cart                                      | `[x]`  |  `[P0]`  | Authenticated cart mutations + tests                               |
| **7**  | Checkout                                  | `[x]`  |  `[P0]`  | Idempotency + order polling + confirmation                         |
| **8**  | Orders and account                        | `[ ]`  |  `[P0]`  | Own orders, profile read, address book                             |
| **9**  | Quality sweep                             | `[ ]`  |  `[P0]`  | Full journey, a11y, consistency, CI e2e policy                     |
| **10** | Standalone mock preview                   | `[ ]`  |  `[P1]`  | MSW `dev:mock` (Playwright still needs a live API)                 |
| **11** | End-to-end order lifecycle verification   | `[ ]`  |  `[P1]`  | Storefront checkout → API order lifecycle → polling confirmation   |
| **12** | Release gate                              | `[ ]`  |  `[P0]`  | Deploy/preview, stranger quick start, smoke                        |
| **13** | Visual showcase                           | `[ ]`  |  `[P1]`  | Hero recording, screenshots, README                                |
| **14** | Storefront polish                         | `[ ]`  |  `[P2]`  | Optional UX after the gate (empty-state guides, command palette)   |

---

## Phase 0: Foundation

> Runnable Next.js 16 app with toolchain and test harness. No product features.

**OpenAPI capabilities:** health / readiness (see [API-INTEGRATION.md](API-INTEGRATION.md)).

**Scope:**

- [x] Scaffold with `create-next-app@latest`: App Router, TypeScript, ESLint, Tailwind v4, `src/` directory. **No** Pages Router. Security headers via `next.config.ts` `headers()` (ADR-0006).
- [x] `next.config.ts`: `cacheComponents: true`; `reactCompiler: true` if current stable docs mark it stable; `typedRoutes` on. Do not set `experimental.ppr`. Security headers via `headers()` (CSP/frame/etc.).
- [x] Path aliases (`@/*` → `src/*`), strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `forceConsistentCasingInFileNames`). Keep the TypeScript major `create-next-app` installs. `engines` Node `>=24` / npm `>=11`; `.nvmrc` = `24`.
- [x] Prettier (local format; not a merge gate unless you choose otherwise). ESLint flat config: `typescript-eslint`, `react-hooks` (React 19), `jsx-a11y`, `consistent-type-imports`. Scripts: `dev`, `build`, `lint`, `lint:fix`, `typecheck`, `test`, `test:watch`, `test:e2e`. Lint is `eslint .`, not `next lint`.
- [x] shadcn/ui init for Next + Tailwind v4 (Zod major that the current `@hookform/resolvers` supports). Class utility `cn()` via the `cn` package. Primitives under `src/components/ui/`. Add Sonner.
- [x] `.env.example` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` (no secrets). Use `process.env.NEXT_PUBLIC_*` - **not** Vite `import.meta.env`. Script `scripts/generate-env.js`: `npm run env:init` / `env:init:force`. `.secrets.example` for Playwright (no passwords committed).
- [x] `.gitignore` ignores `.env`, `.env.local`, `.env*.local`, `.secrets`, and other secret files.
- [x] OpenAPI typed client: `scripts/generate-api-client.js` → `src/lib/api/generated/schema.d.ts` + `npm run api:generate` from live Swagger (`openapi-fetch` + `openapi-typescript`).
- [x] Vitest + Testing Library: jsdom, globals, `@testing-library/jest-dom` (`src/test/setup.ts`). One sample test. Exclude `e2e/`.
- [x] Playwright placeholder smoke hitting `/`. Config later grows `guest` / `customer` projects (Phase 9).
- [x] CI pipeline: parallel `lint`, `typecheck`, `unit-tests`, `build`, `audit` (`npm audit --omit=dev --audit-level=high`), composite `.github/actions/setup-node-ci` (Node from `.nvmrc` + `npm ci`), aggregator job `ci`. Dependabot weekly npm + GitHub Actions.
- [x] Dev server on port **3100** (`strictPort`). Document that `dev` and `start` cannot share the port.
- [x] Backend CORS: ensure `ecommerce-store-api` allows `http://localhost:3100` with credentials in `CORS_ALLOWED_ORIGINS`.

**Done when:** `npm run lint`, `typecheck`, and `test` pass on a clean install; `npm run dev` serves an empty App Router shell on **3100**.

**Where:** `src/app/`, `src/components/`, `src/lib/api/`, `.github/workflows/`

---

## Phase 1: Agent ecosystem and conventions

> Lock how humans and agents work before features diverge. Sized for Next.js 16.

### Files to create (minimal outline)

| File                                          | Purpose (keep short)                                                         |
| :-------------------------------------------- | :--------------------------------------------------------------------------- |
| `AGENT.md`                                    | Authority order; non-negotiables; link to docs below                         |
| `.agents/PROJECT-CONTEXT.md`                  | Stack, folders, RSC vs client, API base URL, CORS, project orientation       |
| `docs/ai/README.md`                           | Index of AI docs                                                             |
| `docs/ai/CONVENTIONS.md`                      | Feature layout, RSC/client split, Query/forms, errors, naming                |
| `docs/ai/GOVERNANCE-AND-QUALITY-GATES.md`     | Merge gates: lint, typecheck, tests, audit, Playwright policy                |
| `docs/ai/WORKFLOW-PLAYBOOK.md`                | Roadmap task → implement → verify                                            |
| `docs/architecture/ARCHITECTURE.md`           | System context + composition (write the real tree, not a wish)               |
| `docs/architecture/adr/README.md`             | ADR index; immutable bodies                                                  |
| `AGENTS.md` / `CLAUDE.md` / `.cursor/rules/*` | Thin adapters that **point at** `AGENT.md` (no forked policy)                |

Optional later: `.agents/skills/` for custom agent tooling if needed.

### `AGENT.md` non-negotiables (must include)

1. No business rules in this repo.
2. Call only the versioned API surface documented in OpenAPI (plus documented unversioned health if needed).
3. Prefer the OpenAPI client over ad-hoc `fetch` wrappers for domain calls. RSC catalog fetchers still use generated types/paths, not a second client dialect.
4. Require verification evidence for behavior changes.
5. Do not push, publish, or change production config without explicit user confirmation.
6. If the API contract is incomplete or erroneous, align with `ecommerce-store-api` rather than inventing client-side workarounds.

### `docs/ai/CONVENTIONS.md` must cover

- Roadmap phase numbers belong **only** in this file. Other docs describe behavior without phase IDs.
- ADR bodies are immutable; index and status may change.
- Server Components by default; `"use client"` only for interactivity
- `src/app` = thin routes (layouts, `page.tsx`, `error.tsx`, `not-found.tsx`, metadata). Prefer `<Suspense>` holes over route-segment `loading.tsx` on hard-404 detail routes. Feature code lives in `src/features/<name>/`
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

- Cross-feature imports: concrete modules only. No re-export shims. Preset query facades that call another feature’s request with fixed filters are allowed.
- Two HTTP clients: `lib/api/browser-client.ts` (cookies, Bearer, 401 recovery) vs `lib/api/server-client.ts` (`import 'server-only'`, no credentials). Generated `schema.d.ts` is shared.
- Auth exception: session Query lives in `AuthProvider` (`src/lib/auth/`). Key `['auth','session']`. Do not invent `useAuthQuery` in the feature.
- Catalog is RSC + awaited `searchParams`. Filters: Next `next/form` GET or `Link`. **Never** `useSearchParams` + `setSearchParams` (or `nuqs`) for the product list.
- Cart, checkout, orders, session use TanStack Query in Client Components. Do **not** prefetch/hydrate catalog into Query.
- TkDodo query-key factories per **client** feature (`all` / `lists()` / `list(filters)` / `details()` / `detail(id)`)
- Client lists (orders, not catalog): URL search params as source of truth; `placeholderData: keepPreviousData`; `staleTime` ~45s; enums `satisfies` generated unions
- QueryClient lives in a **client** `Providers` (`getQueryClient()` singleton reuse in browser, per-render isolation on server). Skip retry on `429`; else `failureCount < 2`. Session: never retry `isClientError`. No `throwOnError`.
- Server catalog fetchers: wrap with React `cache()` so `generateMetadata` and the page share one HTTP call. Wrap async catalog UI in `<Suspense>` (Cache Components static shell). Prefer that over route-segment `loading.tsx` for list/detail holes (ADR-0008).
- Handle Query `isError` with `QueryStateAlert` (`hasData` = last good data). RSC uses `error.tsx` / `not-found.tsx` instead.
- Form pattern (RHF + Zod current major) aligned to DTOs. `throwApiErrorFromResponse` in browser `api/` only. `applyApiFormErrors` + `matchField`; skip OCC `409` fields. `ActionErrorAlert` on mutations.
- RFC 9110 helpers - prefer predicates over `error as ApiRequestError`
- Confirm dialogs: block dismiss while `isPending`; `ActionErrorAlert` inside the dialog
- Env: `NEXT_PUBLIC_*` only in the browser
- `params` / `searchParams` / `cookies()` / `headers()` are async
- `"use cache"` only if catalog HTML can be stale vs stock. Default: request-time RSC (no `"use cache"` on product/inventory reads)
- Security headers in `next.config.ts`; auth at the client boundary ([ADR-0006](architecture/adr/ADR-0006-security-headers-and-client-auth.md)). Resource 404s via App Router `notFound()` ([ADR-0008](architecture/adr/ADR-0008-resource-404-via-app-router.md)).
- Theme: Light/Dark/System, FOUC script, `useSyncExternalStore`, `ThemeAwareToaster`. Key `store-ui-theme`
- Storefront scrolls the document. Avoid viewport-locked `h-screen overflow-hidden` shells.
- Loading: `QueryLoading` / `role="status"` / `aria-busy` on client fetches. RSC: `<Suspense>` holes. No skeleton requirement in v1
- React Compiler: do not add `useMemo`/`useCallback` by habit
- Treat rendered API strings as untrusted. No `dangerouslySetInnerHTML`
- Tests: RTL + hook-mocked specs for **client** components; Playwright for RSC routes and journeys
- ESLint: `typescript-eslint` + `react-hooks` + `jsx-a11y` + `consistent-type-imports`

### ADRs to open in this phase (Proposed → Accepted as the matching phase lands)

| ADR      | Decision                                                                                   | Lands |
| :------- | :----------------------------------------------------------------------------------------- | :---- |
| ADR-0001 | Browser OpenAPI client owns session and mutations; RSC only fetches public catalog; no BFF | 1 / 3 |
| ADR-0002 | In-memory access token + HttpOnly refresh cookie                                           | 3     |
| ADR-0003 | Single-flight silent refresh + one domain retry                                            | 3     |
| ADR-0004 | No guest cart; login/register gate on cart and checkout                                    | 6     |
| ADR-0005 | Checkout completion is order-resource polling, not a job-queue API                         | 7     |
| ADR-0006 | Security headers in `next.config.ts`; auth at the client boundary                          | 0 / 2 |
| ADR-0007 | Keep session alive for refresh-token lifetime                                              | 3     |
| ADR-0008 | Missing resource URLs use App Router `notFound()` before streaming                         | 5     |

**Scope checklist:**

- [x] Create all files in the table above
- [x] Link them from the root README docs table
- [x] Point adapters at `AGENT.md` without duplicating rules
- [x] ADR index exists; bodies follow standard ADR immutability rules

**Done when:** A new chat can follow `AGENT.md` + `PROJECT-CONTEXT.md` and know stack, RSC/client boundary, session model, and quality gates without reading the whole roadmap.

---

## Phase 2: App shell

> Stable App Router chrome before auth. Do not wire session yet.

**OpenAPI capabilities:** health / liveness / readiness (discover exact paths in Swagger).

**Scope:**

- [x] Root layout: skip link to `#main`; `<main id="main" tabIndex={-1}>`; `html` lang; metadata defaults. Branding is not an `h1`. **Normal document scroll** (no `h-screen overflow-hidden`).
- [x] Storefront chrome: header, footer, mobile nav (shadcn `Sheet` + `SheetTitle`; Esc closes; close on navigate).
- [x] Route groups: `(shop)` public chrome; `(account)` later guards; `(auth)` without shopping chrome.
- [x] `error.tsx` / `not-found.tsx` / `global-error.tsx` (`error.tsx` must be a Client Component). Catalog list uses in-page `<Suspense>`. **Do not** add a class-based `route-error-boundary`.
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

> Implement customer authentication and session management using browser-client OpenAPI and in-memory tokens.

**OpenAPI capabilities:** register, login, refresh, logout (discover exact paths in Swagger).

**Seeded user:** customer account from API test seeds (do not paste passwords into this repo). First login will still be blocked by `mustChangePassword` until Phase 4 - Phase 3 tests may use a freshly **registered** user to prove the happy session path, or stop at the change-password redirect.

**Scope:**

- [x] Browser `apiClient` (`src/lib/api/browser-client.ts`) in a client-only module: cookies, Bearer, `recoverFromDomain401`. Never silent-retry `/authentication/*`. Do not import this file from Server Components.
- [x] Implement `silent-refresh.ts`: raw `fetch`; `inFlightRefresh`; `onSessionRefreshed`.
- [x] Implement RFC 9110 helpers + tests (`parse-api-error.ts`, `throw-api-error.ts`, `form-api-errors.ts`).
- [x] Client `Providers`: per-server-render QueryClient + browser-only reuse (`getQueryClient`) with defaults (no retry on `429`; else `failureCount < 2`). No `throwOnError`; never share Query cache across SSR users or import it from RSC.
- [x] `AuthProvider`: `['auth','session']`, browser-only bootstrap, `staleTime: Infinity`, never retry `isClientError`, retry `< 2` on 5xx/network; `onSessionRefreshed` → `setQueryData`; logout clears access token, writes session `null`, and removes non-auth queries (no loading flicker).
- [x] Keep the session alive for the refresh-cookie lifetime: refresh a missing/malformed/near-expiry access token before authenticated browser requests; schedule from JWT `exp`; refetch on focus/reconnect only when unusable. Bootstrap, proactive refresh, and domain-401 recovery share one single-flight call; a Web Lock serializes refresh/logout across tabs. Only refresh `401` logs out; `429`/`5xx`/network errors keep session state and surface retry.
- [x] Login and register (RHF + Zod). `applyApiFormErrors`. Distinct **429** copy vs invalid credentials.
- [x] After login/logout/password-change **forms**: `router.push(safeRedirectPath)` + `router.refresh()`. Leave `window.location.assign` only on the OpenAPI interceptor panic path (failed refresh / forced password).
- [x] Access token in memory; refresh cookie only. No `localStorage` **tokens**.
- [x] `safeRedirectPath`: same-origin path; reject `//`; reject `/login` and `/change-password` loops.
- [x] Auth-aware header. Customer-focused navigation; no operator route guards.
- [x] Client guards: layout-level `ProtectedRoute` / `GuestRoute` under `(account)` / `(auth)`, not a wrap on every page. Unauthenticated → `/login?redirect=` + encoded `safeRedirectPath`. Do not invent a session-hint cookie in v1 (the access token is in memory; a short loading splash is the honest UX).
- [x] `401` after failed recovery → sign in. Other `403` → forbidden. Do not bounce to login on boot 5xx with no retry.
- [x] Accept any authenticated shopper session. RSC catalog still sends no Bearer.
- [x] Confirm API CORS allows `http://localhost:3100` with credentials.
- [x] Tests: validation, guards, silent refresh, `safeRedirectPath` (RTL). Playwright for login success/failure (throttle ~61s).
- [x] Accept ADR-0001, ADR-0002, ADR-0003, ADR-0007. Update [API-INTEGRATION.md](API-INTEGRATION.md)

**Done when:** A registered (or seeded-after-Phase-4) customer can establish a session, refresh the page, and stay signed in via the cookie; unauthenticated users cannot open a protected stub; tests green.

**Where:** `src/lib/api/`, `src/lib/auth/`, `src/features/auth/`

---

## Phase 4: Forced password change

> Seeded customer accounts start with `mustChangePassword: true`. Skipping this phase bricks the documented quick start.

**OpenAPI capabilities:** change-password; `mustChangePassword` on login/refresh; `403` `MUST_CHANGE_PASSWORD`.

**Scope:**

- [x] Parse `mustChangePassword` on login, refresh, and change-password responses
- [x] Global `403` redirect on `apiClient`: `code === 'MUST_CHANGE_PASSWORD'` **or** message contains `Password change required` (do not rely on `code` alone)
- [x] `/change-password` route (auth layout, no shopping chrome)
- [x] Guards: public shop gate is non-blocking during bootstrap but reactively redirects once flagged; private account routes strictly block until the flag is clear; cannot skip via URL (`safeRedirectPath` already rejects this path as a post-login target)
- [x] Change-password form (RHF + Zod) wired to API; `applyApiFormErrors`
- [x] Sign out on the change-password page stays on the auth view
- [x] Component tests for guards and validation
- [x] Playwright: seeded customer forced change then reaches the storefront (accounting for API login throttling)
- [x] Update `docs/API-INTEGRATION.md`

**Done when:** Seeded `customer@store.local` lands on change-password, updates the password, and reaches the storefront shell; tests green.

---

## Phase 5: Catalog

**OpenAPI capabilities:** product list/detail (`@OptionalAuth`, shopper sees active only); category list/detail; public inventory check / product inventory read (discover in Swagger).

**Scope:**

- [x] Home + product list as **async Server Components**. Wrap the fetching UI in `<Suspense>` so `cacheComponents` can ship chrome as the static shell. Empty/error via `not-found.tsx` / `error.tsx` - **not** `QueryStateAlert`
- [x] Server OpenAPI wrapper (`import 'server-only'`). No cookies, no Bearer. Wrap fetchers in React `cache()` when `generateMetadata` and the page share a call.
- [x] Bind **every** current list DTO field to the URL. Parse `searchParams` on the server. Change filters with Next `<Form>` from `next/form` or `<Link href={...}>` - not `setSearchParams`, not `nuqs`
- [x] Category navigation from category list (active only)
- [x] Product detail by **id**. Await `params`. Inactive → `not-found.tsx`
- [x] Availability from public inventory/check. `200 + null` → out of stock, not an error banner. `formatMoney` for price
- [x] Metadata, Open Graph, `robots.ts` / `sitemap.ts`:
  - Pure domain-neutral SEO utilities under `src/lib/seo/` (canonical URL composer, safe JSON-LD serialization, page metadata composer, image URL validator, standard robots presets).
  - Complete fallback social-image metadata: native 1200×630 PNG routes (`opengraph-image.tsx`, `twitter-image.tsx`) with explicit width, height, and `image/png` metadata.
  - Catalog faceted URL policy in `src/features/catalog/lib/catalog-seo.ts`: normalized self-canonicals for allowlisted params with all defaults omitted; `noindex, follow` on search/price/sort/limit facets.
  - Zero-API metadata for root, search, and pagination; lazy cached category fetching only when valid `categoryId` is supplied. API timeouts and 500s propagate without being caught or misclassified.
  - Unique titles and descriptions for root pagination and category pages; `noindex, follow` on malformed (`?categoryId=abc`) or nonexistent categories; canonical tag omitted on malformed category queries.
  - Empty category pages (0 products) detected via `CategoryResponseDto.productCount` in metadata (no extra `getProducts` emptiness probe) and marked `noindex, follow`. Non-empty category URLs (`/?categoryId={id}`) are included in sitemap partition 0 when `productCount > 0`; category enrichment is best-effort (`ApiRequestError` omits category URLs without failing the sitemap).
  - Open Graph type for product detail pages set to `website`.
  - Schema.org structured data (`Product` and `BreadcrumbList` JSON-LD) using canonical URLs, valid absolute HTTP(S) image URLs (omitted when relative or invalid), and XSS-safe escaping.
  - Metadata-level `noindex, nofollow` on private routes (`(auth)`, `(account)`, `/status`), unblocking them in `robots.ts` so crawlers observe the directive. Simplified robots rules: `Allow: /` covers all catalog routes.
  - Real Next.js 16 `generateSitemaps()` partitioning via shared server-only partition helper (`getSitemapPartitions`) with bounded 1-hour caching and unswallowed error propagation.
  - Bounded parallel fetching within each partition (up to 1,000 products per partition, at most 10 API page requests with remaining pages fetched in parallel via `Promise.all`) using deterministic sorting (`sortBy: 'id'`, `sortOrder: 'asc'`).
  - Strict validation of sitemap partition IDs as non-negative integers within bounds (returns 404 `notFound()` on invalid, malformed, or out-of-range IDs). Stale manifest detection returns 404 if `startPage > totalPages`. Partition 0 includes the homepage, non-empty category URLs, and products; product entries set `lastModified` from list-item `updatedAt`.
- [x] `next/image` + `images.remotePatterns`. Placeholder when `imageUrl` is null
- [x] Do **not** put `"use cache"` on product/inventory reads in v1 (stale stock). `cacheComponents` still streams a static shell
- [x] Do **not** hydrate catalog into TanStack Query
- [x] Tests: URL parsers and SEO helpers (unit); Playwright for list → detail, canonicals, robots meta tags, and filter round-trip
- [x] [P0] Product detail missing/malformed IDs return `HTTP 404` with `noindex` via App Router `notFound()` before streaming ([ADR-0008](architecture/adr/ADR-0008-resource-404-via-app-router.md)); `instant = false` on product detail; valid products return `200`.

**Done when:** Seeded catalog is browsable without a session; SEO tags exist on detail; filters round-trip through the URL to the API; tests green.

**Where:** `src/features/catalog/`, `src/app/(shop)/`

---

## Phase 6: Cart

**OpenAPI capabilities:** cart create/read and line-item mutations (`manage_own_cart`).

**Scope:**

- [x] Accept ADR-0004. Guest add-to-cart → `/login?redirect=` + `safeRedirectPath`. No local guest basket
- [x] Cart route metadata exports `robots: NO_INDEX_ROBOTS` to prevent indexing before and after authentication. Unblock `/cart` in `robots.ts` once this lands.
- [x] Create/load cart after session exists; persist **cart id** in `localStorage` (namespaced key; not a credential). Clear it on logout. Do **not** persist line items locally
- [x] Add / update quantity / remove / clear via OpenAPI. Client components only. Feature `api/` uses `throwApiErrorFromResponse` only. On mutation success: invalidate cart queries **and** `router.refresh()` so RSC inventory on open product pages is not stale.
- [x] Query cache: TkDodo keys; `placeholderData: keepPreviousData`; invalidate `detail(cartId)` (and header badge) on mutation success
- [x] Map API errors with `ActionErrorAlert` / `getErrorMessage` (stock, ownership, validation, `429`). No client stock engine
- [x] Cart page + header count. Empty state. `QueryListRegion` while fetching
- [x] Component tests for cart controls and guest redirect (hook-mocked)
- [x] Playwright: sign in → add item → see line (seeded in-stock SKU); authenticated worker `workers: 1`

**Done when:** Seeded customer can build a cart against the API; signed-out add-to-cart never writes a fake cart; tests green.

**Where:** `src/features/cart/`, `src/app/(shop)/cart/`

---

## Phase 7: Checkout

**OpenAPI capabilities:** `POST` checkout with documented idempotency headers/fields; `GET` own order by id (`view_own_orders`). Payment method enum currently `STRIPE` (API mock adapter). See Swagger + [API-INTEGRATION.md](API-INTEGRATION.md).

**Scope:**

- [x] Accept ADR-0005
- [x] Checkout is a protected route. Empty cart cannot start checkout (API will reject; UX disables)
- [x] Checkout route metadata exports `robots: NO_INDEX_ROBOTS` to prevent indexing. Unblock `/checkout` in `robots.ts` once this lands.
- [x] Form matching the checkout command: `cartId`, shipping address (prefill from default address when Phase 8 exists; until then, fields aligned to `ShippingAddressDto`), `paymentMethod` as the OpenAPI enum (`satisfies` - no invented `COD`), optional notes
- [x] Send `Idempotency-Key` (and keep body fallback only if the DTO still has it). Generate once per **attempt**; reuse on retry of that attempt; new attempt → new key. Persist the in-flight key in `sessionStorage`
- [x] Handle validation via `applyApiFormErrors`; **409** in-progress (`Retry-After`); **503** fail-closed; **429** banner. Disable submit while `isPending`.
- [x] On 201: keep `orderId`. Poll `GET` order (TanStack Query `refetchInterval`) until a **documented** status that means SAGA success (`confirmed` or later fulfillment) or failure (`payment_failed`, `cancelled`). Surface API messages. Do not poll `jobId` (no public route)
- [x] Confirmation UI with order id and `StatusBadge`. Out of scope: live payment gateway elements / Stripe Elements (mock payment gateway in v1)
- [x] Component tests: validation, 409/503 messaging, polling terminal states (mocked)
- [x] Playwright: happy-path checkout on seeded in-stock data (wait for confirmed; mock gateway is enough)

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
- [ ] Account: profile read + address book add/edit/delete/set-default. Address management UX: `isDefault` on add only; Set default is a card action; confirm delete; `ActionErrorAlert` inside the dialog; block close while `isPending`
- [ ] `401`/`403` UX (API still enforces access)
- [ ] Tests: empty/error order list; address schema + form validation tests; hook-mocked pages
- [ ] Playwright: open an order after Phase 7 checkout **or** a seeded customer order; address add then delete (leave the seeded home address)

**Done when:** Customer can view their orders and manage their address book through the API; profile is honest about what the contract allows; tests green.

**Where:** `src/features/orders/`, `src/features/account/`, `src/app/(account)/`

---

## Phase 9: Quality sweep

> Cross-cutting only. Feature tests should already exist.

**OpenAPI capabilities:** none new.

### A. Shopper journey (Playwright)

- [ ] Projects: `guest` (parallel) and `customer` (`workers: 1`, worker-scoped reused page - prefer in-app nav, avoid full reload/cookie rotation)
- [ ] `e2e/global-setup.ts`: test database seeding via `npm run db:seed:auth` against the API; `E2E_SKIP_DB_SEED=1` documented. `e2e/README.md` (fail-closed secrets, ~61s login throttle)
- [ ] One spec: auth (seeded customer, including password change if the seed flag is set) → catalog search/detail → add to cart → checkout → order detail (same session)
- [ ] Keep per-feature specs; the journey is glue
- [ ] In CI, missing `E2E_*` fails the e2e job when that job is scheduled (no skip-to-green). Local skip message stays. `npm run env:init:secrets` from `.secrets.example`

### B. Keyboard and accessibility

- [ ] Skip link, `main` id, page `h1`, decorative icons `aria-hidden`
- [ ] Keyboard navigation: skip link → `#main`; mobile sheet Esc; dialog Esc / focus restore
- [ ] `@axe-core/playwright` helper verifying no serious or critical accessibility violations on home, product detail, cart, checkout, order detail
- [ ] Loading / status: `QueryLoading` / `QueryListRegion` (`role="status"`, `aria-busy`, `aria-live="polite"`)
- [ ] Focus `#main` after client navigations (already in Phase 2; verify checkout → confirmation)

### C. Consistency

- [ ] Shared `src/lib/format.ts` + `src/lib/list-filters.ts` (no per-feature copy-paste of `parsePositiveInt`)
- [ ] Shared `QueryStateAlert` / `QueryListRegion` / `ActionErrorAlert`; `StatusBadge` for order states
- [ ] Confirm no catalog data is duplicated in TanStack Query without a reason
- [ ] Confirm no barrels, no `any`, no Server Actions hitting the API, no `throwOnError`, no skeleton cargo-cult
- [ ] Audit SEO and metadata: verify canonical URLs, social tags, structured data, and robots directives match the Phase 5 foundation
- [ ] Hook-mocked page specs remain the pattern; do not rewrite them onto `QueryClientProvider`
- [ ] Align CONVENTIONS + ARCHITECTURE + PROJECT-CONTEXT with the real tree (phase numbers stay in this file only)

### D. CI and governance

- [ ] PR merge gates as parallel jobs plus `ci` aggregator (lint, typecheck, unit, build, audit) using `setup-node-ci` + `.nvmrc`
- [ ] Dependabot weekly npm + GitHub Actions (grouped production and development dependencies)
- [ ] Playwright on PRs into `main`/`master` and `workflow_dispatch`; feature PRs into `develop` skip e2e; skipped e2e does not fail `ci`
- [ ] GOVERNANCE documents that policy + throttle/seed notes

**Done when:** Full journey is green locally against a seeded API; axe/keyboard pass; CI policy is documented and the e2e job does not skip-to-green.

---

## Phase 10: Standalone mock preview (MSW) [P1]

> Instant evaluation without Docker/API. **Does not** replace Playwright. Comes after the real screens exist (Phase 9).

**OpenAPI capabilities:** Mirror shopper operations only (auth, catalog, inventory check, cart, checkout, own orders, profile/addresses). Do not mock administrative/operator operations.

**Scope:**

- [ ] MSW as a **dev** dependency. Handlers under `src/lib/mock/` only
- [ ] Feature modules must **not** import `@/lib/mock/*`. Allowed touchpoints: client provider (dynamic import) and login page (lazy demo chrome)
- [ ] **Inline** env gate before any MSW import so production bundling drops the chunk. Do not hide the gate behind a helper the bundler cannot tree-shake
- [ ] Browser MSW **does not** intercept RSC `fetch`. Also start MSW in the **Node** runtime (or a mock HTTP origin) so catalog pages work in `dev:mock`. A client-only worker mock is an incomplete storefront demo.
- [ ] Worker / interceptor: `onUnhandledRequest: 'bypass'`, `quiet: true`
- [ ] Demo login chrome lazy-loaded only when mock is on. Persist a **flag** in `sessionStorage`, not an access token
- [ ] Realistic seed: active catalog, categories, one customer, cart, checkout → confirmed order
- [ ] Scripts: `dev:mock`, optional `build:mock` for a static demo
- [ ] README badge for mock/demo. Playwright still targets a live API

**Done when:** `npm run dev:mock` can browse, sign in, add to cart, and see a fake confirmation with the API process down.

**Where:** `src/lib/mock/`

---

## Phase 11: End-to-end order lifecycle verification [P1]

> Verify that the storefront checkout correctly initiates the asynchronous order lifecycle in the API, and that polling tracks order confirmation.
>
> Prerequisite: Phase 7 complete.

**OpenAPI capabilities:** checkout + order reads already wired.

**Scope:**

- [ ] Verify order creation loop: storefront checkout → API order created & inventory locked → storefront order polling tracks transition to `confirmed` status
- [ ] Document order verification procedure in `docs/ORDER-VERIFICATION.md` as the storefront reference
- [ ] Verify that order failure scenarios (payment failure, cancellation) correctly surface user-friendly messages in the polling UI
- [ ] Optional Playwright note: full asynchronous SAGA integration tests may run against a seeded live API; isolated CI runs rely on mocked terminal states

**Done when:** One checkout from the storefront successfully transitions from processing to confirmed status via API order polling; verification steps are documented.

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
- [ ] Customer-facing WebSocket for own-order updates **only if** the API documents a shopper event. If added: authenticate via `auth: { token }` on the Socket.IO handshake, connect on session / disconnect on logout, and invalidate customer order query keys. Otherwise keep Phase 7 polling.

---

## Out of scope (v1)

- Pages Router, request-interception layers for auth/headers/resource checks, `getServerSideProps`, implicit fetch cache as the caching model
- TanStack Query `HydrationBoundary` for public catalog (RSC already rendered it)
- `nuqs` / `useSearchParams` as the product-list filter engine
- Class-based error boundaries next to `error.tsx`
- Viewport-locked `h-screen overflow-hidden` layouts (use natural document scroll)
- `window.location.assign` for standard post-login navigation
- A single OpenAPI client used from both RSC and the browser
- Guest / anonymous line-item baskets (cart id in localStorage is allowed)
- Product routes by slug until OpenAPI has a slug lookup
- Inventing checkout job-status HTTP routes
- Live Stripe Elements / card charging (mock payment gateway in v1)
- Administrative or operator chrome, RBAC management, order status overrides, inventory adjustment
- Domain rules (pricing, stock, promotions) in the UI
- Native mobile, multi-tenant theming, i18n, wishlist, reviews
- Global client store for server data (Zustand/Redux)
- Barrel files and cross-feature adapter shims
- Heavy administrative data tables, operator charts, or administrative landing gates
- Skeleton loaders as a v1 requirement (use `<Suspense>` / `QueryLoading`)
