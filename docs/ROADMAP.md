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
  - **Repeatable checklists** ([`RELEASE-GATE.md`](RELEASE-GATE.md)) stay unchecked; they are runbooks for manual verification, not phase status.
- Keep business rules in the API. This repo is UI, routing, caching, and error mapping only.
- For HTTP contracts, use **live OpenAPI/Swagger** (and the generated client). [API-INTEGRATION.md](API-INTEGRATION.md) covers client rules only, not an endpoint catalog.
- Do not invent filters, buttons, slug lookups, guest carts, or checkout job APIs that OpenAPI does not expose. If the API is missing a customer capability, ensure the backend exposes it in the OpenAPI schema before building UI around invented endpoints.

## Next up

Pick the first unchecked integer phase. Letter suffixes (`9b`-`9e`) are stable IDs - do not renumber them.

1. **Phase 14** - Storefront polish (optional; does **not** block the release gate).

---

## Testing policy

Write tests **with** each feature.

| Layer                                       | When                                                                                      |
| :------------------------------------------ | :---------------------------------------------------------------------------------------- |
| Unit / component (Vitest + Testing Library) | Client islands and pure helpers in the same phase. **Do not** RTL-test Server Components. |
| Playwright                                  | RSC pages and the critical path when the feature joins it                                 |
| Cross-cutting quality                       | Phase 9 only                                                                              |

A feature phase is not done until its **Done when** checks pass.

## Definition of done (every feature phase)

1. UI wired to OpenAPI operations for that phase's capabilities (no mocked domain rules; no invented DTOs).
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
| Cart                       | API requires `manage_own_cart`. **No guest line-item basket.** Authenticated load is `GET /v1/carts/current` (**404 → empty `null`**, never an error banner). Create-on-add is `POST /v1/carts`. Do not persist a cart id in `localStorage`. |
| Checkout                   | `POST /v1/orders/checkout` is **async**. HTTP 201 returns `orderId` + `jobId`. Persist `?orderId=` in the URL. There is **no** public job-status route. Poll `GET` order by id until a documented status. Hold the idempotency key until **terminal** success. Do not invent `PENDING → PROCESSING → COMPLETED`. |
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
| `src/lib/auth/safe-redirect-path.ts` | URL sanitizer: ensures redirect targets are same-origin relative paths (`/...`), rejecting `//` protocol-relative paths and `/login` or `/change-password` loops. | Universal |
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
| `e2e/global-setup.ts` + `e2e/README.md` | Playwright setup: API connectivity, optional `db:seed:auth` (skip with `E2E_SKIP_DB_SEED`), login throttle (~61s), secrets. | Testing harness |

### Storefront Architectural Boundaries & Exclusions

The following patterns belong to administrative consoles and are explicitly **excluded** from this customer storefront:
- Operator role guards (`OperatorRoute`, `PermissionRoute`, navigation permission matrices)
- Heavy administrative data tables (e.g. TanStack Table with complex multi-sort or column reordering)
- Operator charting dashboards and metric summaries
- Role/user management CRUD and inventory adjustment interfaces
- Operator order transition actions (Process, Ship, Deliver buttons)
- Operator WebSocket feeds (low-stock alerts, admin-wide order creation toasts)

---

## Completed phases

> Full checklists for Phases 0-9 (including 9b-9e) are collapsed. History is in git. IDs stay; do not renumber.

| Phase  | Name                                      | Status | Focus                                                              |
| ------ | ----------------------------------------- | ------ | ------------------------------------------------------------------ |
| **0**  | Foundation                                | Done   | Next 16 scaffold, tooling, tests, OpenAPI client, Cache Components |
| **1**  | Agent ecosystem and conventions           | Done   | AGENT policy, Next-specific CONVENTIONS, ADR template, adapters    |
| **2**  | App shell                                 | Done   | Layouts, chrome, error/loading, theme, health page                 |
| **3**  | Authentication and session                | Done   | Login, register, silent refresh, customer chrome                   |
| **4**  | Forced password change                    | Done   | Seeded customer `mustChangePassword` (do not skip)               |
| **5**  | Catalog                                   | Done   | RSC list/detail, categories, query parity, SEO                     |
| **6**  | Cart                                      | Done   | Authenticated cart: `GET /v1/carts/current` (404 = empty)        |
| **7**  | Checkout                                  | Done   | Idempotency + `?orderId=` polling + confirmation                 |
| **8**  | Orders and account                        | Done   | Own orders, `GET /v1/users/me`, address book                     |
| **9**  | Quality sweep                             | Done   | Full journey, a11y, consistency, CI e2e policy                     |
| **9b** | Staff conventions                         | Done   | CONVENTIONS + ANTI-PATTERNS + ESLint lib must not import features  |
| **9c** | API-independent correctness               | Done   | Checkout `?orderId=`, idempotency key, image allowlist, `/` links |
| **9d** | Consume API shopper contract              | Done   | `GET /me`, current cart, shopper inventory; drop workarounds     |
| **9e** | Layering, DRY, tests                      | Done   | Slot composition, shared helpers, typed factories                  |
| **10** | Standalone mock preview                   | Done   | MSW `dev:mock` (browser + Node); Playwright still needs live API |
| **11** | End-to-end order lifecycle verification   | Done   | Checkout → polling; [`ORDER-VERIFICATION.md`](ORDER-VERIFICATION.md) |
| **12** | Release gate                              | Done   | Stranger quickstart; [`RELEASE-GATE.md`](RELEASE-GATE.md) runbook |

---

## Pending work

Pick the first unchecked phase. Phase 14 does not block the release gate.

| Phase  | Name                                      | Status | Priority | Focus                                                              |
| ------ | ----------------------------------------- | ------ | :------: | ------------------------------------------------------------------ |
| **10** | Standalone mock preview                   | `[x]`  |  `[P1]`  | MSW `dev:mock` (Playwright still needs a live API)                 |
| **11** | End-to-end order lifecycle verification   | `[x]`  |  `[P1]`  | Storefront checkout -> API order lifecycle -> polling confirmation |
| **12** | Release gate                              | `[x]`  |  `[P0]`  | Deploy/preview, stranger quick start, smoke                        |
| **13** | Visual showcase                           | `[/]`  |  `[P1]`  | Hero recording, screenshots, README (assets folder + capture guide) |
| **14** | Storefront polish                         | `[ ]`  |  `[P2]`  | Optional UX after the gate (empty-state guides, command palette)   |

---

## Phase 10: Standalone mock preview (MSW) [P1]

> Instant evaluation without Docker/API. **Does not** replace Playwright. Comes after the real screens exist (Phase 9).

**OpenAPI capabilities:** Mirror shopper operations only (auth, catalog, inventory check, cart, checkout, own orders, profile/addresses). Do not mock administrative/operator operations.

**Scope:**

- [x] MSW as a **dev** dependency. Handlers under `src/lib/mock/` only
- [x] Feature modules must **not** import `@/lib/mock/*`. Allowed touchpoints: client provider (dynamic import) and login page (lazy demo chrome)
- [x] **Inline** env gate before any MSW import so production bundling drops the chunk. Do not hide the gate behind a helper the bundler cannot tree-shake
- [x] Browser MSW **does not** intercept RSC `fetch`. Also start MSW in the **Node** runtime (or a mock HTTP origin) so catalog pages work in `dev:mock`. A client-only worker mock is an incomplete storefront demo.
- [x] Worker / interceptor: `onUnhandledRequest: 'bypass'`, `quiet: true`
- [x] Demo login chrome lazy-loaded only when mock is on. Persist a **flag** in `sessionStorage`, not an access token
- [x] Realistic seed: active catalog, categories, one customer, cart, checkout → confirmed order
- [x] Scripts: `dev:mock`, optional `build:mock` for a static demo
- [x] README badge for mock/demo. Playwright still targets a live API

**Done when:** `npm run dev:mock` can browse, sign in, add to cart, and see a fake confirmation with the API process down.

**Where:** `src/lib/mock/`

---

## Phase 11: End-to-end order lifecycle verification [P1]

> Verify that the storefront checkout correctly initiates the asynchronous order lifecycle in the API, and that polling tracks order confirmation.
>
> Prerequisite: Phase 7 complete.

**OpenAPI capabilities:** checkout + order reads already wired.

**Scope:**

- [x] Verify order creation loop: storefront checkout → API order created & inventory locked → storefront order polling tracks transition to `confirmed` status
- [x] Document order verification procedure in `docs/ORDER-VERIFICATION.md` as the storefront reference
- [x] Verify that order failure scenarios (payment failure, cancellation) correctly surface user-friendly messages in the polling UI
- [x] Optional Playwright note: full asynchronous SAGA integration tests may run against a seeded live API; isolated CI runs rely on mocked terminal states

**Done when:** One checkout from the storefront successfully transitions from processing to confirmed status via API order polling; verification steps are documented.

---

## Phase 12: Release gate

> Executable checklist lives in [`RELEASE-GATE.md`](RELEASE-GATE.md) (repeatable runbook; no passwords). Checkboxes there stay open for each manual verification pass.

**Scope:**

- [x] Stranger onboarding: README → `env:init` → `dev` on **3100** against a live API started from the API repo's docs (including CORS origin)
- [x] Seeded purchase path: forced password change → browse → cart → checkout → order
- [x] `next build` + `next start` (or platform preview) on **3100** against the same API
- [x] README + PROJECT-CONTEXT + API-INTEGRATION match the repo
- [x] Confirm no secrets in `NEXT_PUBLIC_*`

**Done when:** A stranger can follow the README and complete a seeded purchase without tribal knowledge.

---

## Phase 13: Visual showcase [P1]

> Portfolio assets. Capture from `dev:mock` first if Phase 10 exists; re-verify against live data after Phase 12.

**Scope:**

- [x] Capture guide in [`docs/assets/README.md`](assets/README.md)
- [x] Short walkthrough (WebP/GIF): browse → add to cart → checkout confirmation
- [x] Retina stills: home, product detail, cart/checkout
- [x] README hero + accurate limits (mock payments, no hosted store)

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
- Guest / anonymous line-item baskets
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
