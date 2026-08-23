# E-commerce Store Web

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black" alt="React"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-App%20Router-black?style=flat&logo=next.js&logoColor=white" alt="Next.js"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"></a>
  <a href="https://tanstack.com/query"><img src="https://img.shields.io/badge/TanStack-Query-FF4154?style=flat&logo=react-query&logoColor=white" alt="TanStack Query"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"></a>
</p>

> Customer storefront for the [E-commerce Store API](https://github.com/raouf-b-dev/ecommerce-store-api). Built with Next.js. Business rules stay in the API.

## Table of Contents

- [What this is](#what-this-is)
- [Quick start](#quick-start)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Documentation](#documentation)
- [Related repositories](#related-repositories)
- [Project layout](#project-layout)
- [License](#license)

---

<a id="what-this-is"></a>

## What this is

Next.js App Router storefront for the NestJS ecommerce API. Covers catalog, cart, checkout, orders, and account flows over the API’s versioned HTTP surface (see OpenAPI).

This app handles UI, routing, and client caching. Pricing, stock, checkout, auth, and permissions are enforced by the API so the same backend can serve admin and mobile clients without special-casing this UI.

**Current limits**

| Topic | Status |
| :---- | :----- |
| Application code | Not scaffolded yet. Build order: [`docs/ROADMAP.md`](docs/ROADMAP.md). |
| Hosted demo | None yet. Run locally. |
| Payments UI | Tracks whatever the API exposes (mock/test provider for now). |
| BFF | Not used. Talks to the API directly. |

---

<a id="quick-start"></a>

## Quick start

### Prerequisites

- **Node.js** >= 24
- **npm** >= 11
- Local [ecommerce-store-api](https://github.com/raouf-b-dev/ecommerce-store-api) on `http://localhost:3000`

### Run the API first

Follow the API local boot guide (do not fork script names here; they can change):

[`docs/development/LOCAL-SETUP.md`](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/LOCAL-SETUP.md)

Seeded customer account: API [`docs/development/SEEDING.md`](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/SEEDING.md) (local fixtures only; never production).

### Run this app (after scaffold)

```bash
cd ../ecommerce-store-web
npm install
cp .env.example .env.local
npm run dev
```

| Service | URL |
| :------ | :-- |
| Storefront | `http://localhost:3100` (confirm in project config) |
| API | `http://localhost:3000` |
| Swagger (contract) | `http://localhost:3000/api` |

Client rules: [`docs/API-INTEGRATION.md`](docs/API-INTEGRATION.md). Security baseline: [`SECURITY.md`](SECURITY.md).

---

<a id="architecture"></a>

## Architecture

```text
Browser -> Next.js (RSC + client components) -> versioned HTTP API -> ecommerce-store-api
                                                                    ^
Admin SPA / mobile apps --------------------------------------------+
```

| Rule | Detail |
| :--- | :----- |
| Boundary | Do not reimplement stock, pricing, or RBAC here. Show API errors clearly. |
| Data access | Typed client from the API OpenAPI/Swagger spec. |
| Rendering | Server Components by default. Client Components for cart, forms, and session UI. |
| Client data | TanStack Query for browser fetches and mutations. |
| Auth | Match the API session contract from OpenAPI. Authorization is enforced by the API. |
| Checkout | Use idempotency exactly as the checkout operation documents in OpenAPI. |

---

<a id="tech-stack"></a>

## Tech stack

| Layer | Choice |
| :---- | :----- |
| Framework | Next.js (App Router) |
| UI | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui (Radix) |
| Client data | TanStack Query |
| Local UI state | React state; Zustand only when several trees need the same UI state |
| Forms | React Hook Form + Zod |
| API | Typed OpenAPI client |
| Tests | Vitest, Testing Library, Playwright |

---

<a id="documentation"></a>

## Documentation

| Document | Description |
| :------- | :---------- |
| [`SECURITY.md`](SECURITY.md) | Frontend security baseline |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Delivery plan, tests-with-features, ship gates |
| [`docs/API-INTEGRATION.md`](docs/API-INTEGRATION.md) | Client integration rules (OpenAPI is the contract) |
| [`docs/README.md`](docs/README.md) | Docs index |
| [`docs/ai/README.md`](docs/ai/README.md) | Agent and conventions docs |
| API docs | [`ecommerce-store-api/docs`](https://github.com/raouf-b-dev/ecommerce-store-api/tree/master/docs) |

---

<a id="related-repositories"></a>

## Related repositories

| Repository | Role |
| :--------- | :--- |
| [`ecommerce-store-api`](https://github.com/raouf-b-dev/ecommerce-store-api) | Backend API |
| [`ecommerce-admin-dashboard`](https://github.com/raouf-b-dev/ecommerce-admin-dashboard) | Admin SPA |

---

<a id="project-layout"></a>

## Project layout

Target layout (may shift slightly with the scaffold):

```
app/                      # routes, layouts, metadata
components/               # shared UI
features/                 # catalog, cart, checkout, etc.
lib/
  api/                    # OpenAPI client and HTTP helpers
  auth/                   # session helpers matching the API
docs/
  API-INTEGRATION.md
  ROADMAP.md
  ai/                     # agent conventions
```

---

<a id="license"></a>

## License

[MIT](LICENSE)

---

Built by [Abderaouf .B](https://github.com/raouf-b-dev) | [Issues](https://github.com/raouf-b-dev/ecommerce-store-web/issues) | [Repository](https://github.com/raouf-b-dev/ecommerce-store-web)
