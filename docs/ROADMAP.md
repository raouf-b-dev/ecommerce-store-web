# E-commerce Store Web: Roadmap

> Delivery plan for the customer storefront. Work top to bottom.
>
> Companions: [README.md](../README.md), [API-INTEGRATION.md](API-INTEGRATION.md), [ecommerce-store-api](https://github.com/raouf-b-dev/ecommerce-store-api).

---

## How to use this file

- `[ ]` not started
- `[/]` in progress
- `[x]` done
- Finish each phase before starting the next.
- Keep business rules in the API. This repo is UI only.
- For HTTP contracts, use **live OpenAPI/Swagger** (and the generated client). [API-INTEGRATION.md](API-INTEGRATION.md) covers client rules only, not an endpoint catalog.

### Testing policy

Write tests **with** each feature.

| Layer | When |
| :---- | :--- |
| Unit / component (Vitest + Testing Library) | Same phase as the UI |
| Playwright | Extend the critical path when the feature joins it |
| Cross-cutting quality | Phase 8 only |

A feature phase is not done until its **Done when** checks pass.

### Definition of done (every feature phase)

1. UI wired to OpenAPI operations for that phase’s capabilities (no mocked domain rules).
2. Listed component tests green.
3. Listed Playwright updates green (or explicitly deferred to Phase 8 with a note).
4. Lint + typecheck clean.
5. OpenAPI client regenerated if the contract changed; client rules in [API-INTEGRATION.md](API-INTEGRATION.md) still accurate.

---

## Stack

| Concern | Choice |
| :------ | :----- |
| Framework | Next.js App Router |
| UI | React 19 + TypeScript strict |
| Styling | Tailwind CSS + shadcn/ui |
| Client data | TanStack Query |
| Local UI state | React state; Zustand when needed across trees |
| Forms | React Hook Form + Zod |
| API | Typed client from OpenAPI / Swagger |
| Tests | Vitest + Testing Library + Playwright |

**Ports (intent):** storefront `3100`, API `3000`. Confirm in Phase 0.

---

## Phase overview

| Phase   | Name                                | Status | Priority | Focus                                                                           |
| ------- | ----------------------------------- | ------ | :------: | ------------------------------------------------------------------------------- |
| **0**   | Foundation                          | `[ ]`  |  `[P0]`  | Next scaffold, tooling, tests, OpenAPI client                                   |
| **1**   | Agent ecosystem and conventions     | `[ ]`  |  `[P0]`  | AGENT policy, context, AI docs, adapters                                        |
| **2**   | App shell                           | `[ ]`  |  `[P0]`  | Layouts, RSC rules, health check page                                           |
| **3**   | Authentication                      | `[ ]`  |  `[P0]`  | Session UX + tests                                                              |
| **4**   | Catalog                             | `[ ]`  |  `[P0]`  | List/detail, SEO + tests                                                        |
| **5**   | Cart                                | `[ ]`  |  `[P0]`  | Mutations + tests                                                               |
| **6**   | Checkout                            | `[ ]`  |  `[P0]`  | Idempotency UX + path tests                                                     |
| **6.5** | Commercial Loop & Real-Time Sync    | `[ ]`  |  `[P1]`  | **Ecosystem**: SAGA checkout state handling + Admin Dashboard live push trigger |
| **7**   | Orders and account                  | `[ ]`  |  `[P0]`  | Post-purchase + tests                                                           |
| **8**   | Quality sweep                       | `[ ]`  |  `[P0]`  | Full journey, a11y, perf                                                        |
| **9**   | Release gate                        | `[ ]`  |  `[P0]`  | Deploy, verified quick start                                                    |

---

## Phase 0: Foundation

> Runnable Next.js app with toolchain and test harness. No product features.

**OpenAPI capabilities:** health / readiness (see [API-INTEGRATION.md](API-INTEGRATION.md)).

**Scope:**

- [ ] Scaffold Next.js (App Router, TypeScript, ESLint)
- [ ] Tailwind CSS + shadcn/ui baseline
- [ ] Path aliases, strict TypeScript, Prettier
- [ ] `.env.example` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` (no secrets)
- [ ] `.gitignore` ignores `.env`, `.env.local`, and other secret files
- [ ] OpenAPI typed client stub + `npm` script to regenerate from API Swagger/OpenAPI
- [ ] Vitest + Testing Library with one sample test
- [ ] Playwright with a placeholder smoke hitting the home route
- [ ] Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`
- [ ] CI: lint, typecheck, unit tests
- [ ] Dev server on port **3100** (or document the chosen port in README)

**Done when:** `npm run lint`, `typecheck`, and `test` pass on a clean install; `npm run dev` serves a blank shell.

**Where:** `app/`, `components/`, `lib/api/`, `.github/workflows/`

---

## Phase 1: Agent ecosystem and conventions

> Lock how humans and agents work before features diverge. Same shape as the API, sized for Next.js.

### Files to create (minimal outline)

| File | Purpose (keep short) |
| :--- | :------------------- |
| `AGENT.md` | Authority order; non-negotiables; link to docs below |
| `.agents/PROJECT-CONTEXT.md` | Stack, folders, auth notes, API base URL, links to API docs |
| `docs/ai/README.md` | Index of AI docs |
| `docs/ai/CONVENTIONS.md` | RSC vs client, feature layout, Query/forms, naming |
| `docs/ai/GOVERNANCE-AND-QUALITY-GATES.md` | Merge gates: lint, typecheck, tests |
| `docs/ai/WORKFLOW-PLAYBOOK.md` | Roadmap task -> implement -> verify |
| `AGENTS.md` / `CLAUDE.md` / `.cursor/rules/*` | Thin adapters that **point at** `AGENT.md` (no forked policy) |

Optional later: `.agents/skills/` only if you adopt the API skills-sync model.

### `AGENT.md` non-negotiables (must include)

1. No business rules in this repo.
2. Call only the versioned API surface documented in OpenAPI (plus documented unversioned health if needed).
3. Prefer OpenAPI client over ad-hoc fetch wrappers for domain calls.
4. Require verification evidence for behavior changes.
5. Do not push, publish, or change production config without explicit user confirmation.

### `docs/ai/CONVENTIONS.md` must cover

- Server Components by default; `"use client"` only for interactivity
- Feature folder layout (`features/<name>/`)
- TanStack Query key conventions
- Form pattern (RHF + Zod) and API error mapping
- Env access (`NEXT_PUBLIC_*` only in the browser)

**Scope checklist:**

- [ ] Create all files in the table above
- [ ] Link them from the root README docs table
- [ ] Point adapters at `AGENT.md` without duplicating rules

**Done when:** A new chat can follow `AGENT.md` + `PROJECT-CONTEXT.md` and know stack, boundary, and quality gates without reading the whole roadmap.

---

## Phase 2: App shell

> Stable App Router chrome.

**OpenAPI capabilities:** health / readiness (discover exact paths in Swagger).

**Scope:**

- [ ] Root layout and storefront chrome (header/footer)
- [ ] `loading.tsx` / `error.tsx` / `not-found.tsx`
- [ ] Align with `docs/ai/CONVENTIONS.md`
- [ ] Diagnostics page that checks API health/readiness (paths from OpenAPI)
- [ ] Shared primitives via shadcn/ui
- [ ] Refresh `.agents/PROJECT-CONTEXT.md` folder map

**Done when:** Home shell renders; health page shows API up/down correctly against a running API.

---

## Phase 3: Authentication

**OpenAPI capabilities:** register, login, refresh, logout (discover exact paths in Swagger).

**Seeded user:** customer from API [`SEEDING.md`](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/SEEDING.md) (do not paste passwords into this repo)

**Scope:**

- [ ] Login and register forms (RHF + Zod)
- [ ] Session handling matching the API
- [ ] Auth-aware navigation
- [ ] Logout; 401 -> sign in
- [ ] Protect account and checkout entry routes
- [ ] Component tests: validation, protected redirect
- [ ] Playwright: login success and failure

**Done when:** Seeded customer can sign in and hit a protected stub route; tests above are green.

---

## Phase 4: Catalog

**OpenAPI capabilities:** product list and product detail (reads only).

**Scope:**

- [ ] Product list (filters/pagination as API supports)
- [ ] Product detail by id/slug as API exposes
- [ ] Metadata (title, description, Open Graph)
- [ ] Prefer RSC for read-only catalog fetches when it fits
- [ ] Empty and error states
- [ ] Tests for empty/error UI
- [ ] Playwright: browse list -> open detail

**Done when:** Seeded catalog is browsable with SEO tags on detail; tests green.

---

## Phase 5: Cart

**OpenAPI capabilities:** cart create/read and line-item mutations.

**Scope:**

- [ ] Create/load cart; add/update/remove items
- [ ] Client components for interactive cart UI
- [ ] Query cache invalidation after mutations
- [ ] Map API errors to messages (no domain re-validation)
- [ ] Component tests for cart controls
- [ ] Playwright: add item -> see cart line

**Done when:** Seeded customer can build a cart against the API; tests green.

---

## Phase 6: Checkout

**OpenAPI capabilities:** checkout with documented idempotency headers/fields (see Swagger + [API-INTEGRATION.md](API-INTEGRATION.md)).

**Scope:**

- [ ] Checkout form matching API command (shipping address)
- [ ] Send idempotency key; reuse on retry of the same attempt
- [ ] Handle validation errors, 409 conflicts, fail-closed idempotency responses
- [ ] Order confirmation UI
- [ ] Out of scope: payment UI beyond API mock/test provider
- [ ] Component tests for validation/conflict messaging
- [ ] Playwright: happy-path checkout on seeded data

**Done when:** One seeded checkout completes end-to-end; idempotency retry does not create a duplicate order; tests green.

---

## Phase 6.5: End-to-End Commercial Loop & Real-Time Sync [P1]

> **Goal**: Handle asynchronous SAGA checkout states and verify live event propagation across the ecosystem.
>
> *(Prerequisite: Requires Phase 6 complete. Companions: [ecommerce-store-api](https://github.com/raouf-b-dev/ecommerce-store-api) SAGA checkout & WebSocket stream, [ecommerce-admin-dashboard](https://github.com/raouf-b-dev/ecommerce-admin-dashboard) live order notifications).*

**OpenAPI capabilities:** `POST /v1/checkout`, WebSocket events (`orders.created`), inventory check.

**Scope:**
- [ ] Handle asynchronous SAGA checkout states: PENDING -> PROCESSING -> COMPLETED (or FAILED with user-friendly stock/payment error messages).
- [ ] Verify order placement triggers real-time WebSocket event on `ecommerce-admin-dashboard`.
- [ ] Add E2E journey test: Customer places order on storefront -> Admin Dashboard displays new order in table without manual page refresh.

**Done when:** A test checkout from the storefront handles SAGA completion states gracefully and pops up as a real-time order on the admin dashboard.
**Location:** `app/checkout/`, `lib/api/`, `e2e/checkout-journey.spec.ts`

---

## Phase 7: Orders and account

**OpenAPI capabilities:** customer order list/detail; profile and addresses if exposed.

**Scope:**

- [ ] Order list and detail
- [ ] Profile / addresses when needed
- [ ] 401/403 UX (API still enforces access)
- [ ] Tests for empty/error order list
- [ ] Playwright: open order after checkout (or seeded order)

**Done when:** Customer can view their orders from the API; tests green.

---

## Phase 8: Quality sweep

> Cross-cutting only. Feature tests should already exist.

- [ ] One Playwright journey: auth -> catalog -> cart -> checkout -> order
- [ ] Keyboard/focus pass on primary flows
- [ ] Performance targets for home and product detail; fix obvious regressions
- [ ] CI runs unit + e2e (or documented e2e job) reliably

**Done when:** Full journey is green in CI (or documented nightly job with link).

---

## Phase 9: Release gate

- [ ] Hosted deploy pointed at a configured API
- [ ] README quick start verified on a clean machine
- [ ] Smoke checklist against seeded data
- [ ] README + PROJECT-CONTEXT still match the repo

**Done when:** A stranger can follow the README and complete a seeded purchase path.

---

## Out of scope (v1)

- BFF
- Native mobile
- Live card charging beyond API payment adapters
- Multi-tenant storefront theming
- Domain rules inside the UI
- Admin/operator order transitions
