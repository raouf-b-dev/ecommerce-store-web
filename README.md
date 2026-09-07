# E-commerce Store Web

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black" alt="React"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-App%20Router-black?style=flat&logo=next.js&logoColor=white" alt="Next.js"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"></a>
  <a href="https://tanstack.com/query"><img src="https://img.shields.io/badge/TanStack-Query-FF4154?style=flat&logo=react-query&logoColor=white" alt="TanStack Query"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"></a>
</p>

> Customer storefront for the [E-commerce Store API](https://github.com/raouf-b-dev/ecommerce-store-api). Next.js 16 App Router. Business rules stay in the API.

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

Intended Next.js App Router storefront for the NestJS ecommerce API (catalog, cart, checkout, orders, account). The app shell is scaffolded; shopper features follow [`docs/ROADMAP.md`](docs/ROADMAP.md).

When it exists, this app should handle UI, routing, and client caching only. Pricing, stock, checkout, auth, and permissions stay in the API.

**Current limits**

| Topic            | Status                                                                 |
| :--------------- | :--------------------------------------------------------------------- |
| Application code | App shell on port **3100**. Catalog and checkout are not wired yet. Build order: [`docs/ROADMAP.md`](docs/ROADMAP.md). |
| Hosted demo      | None.                                                                  |

---

<a id="quick-start"></a>

## Quick start

Requires Node.js 24+ and npm 11+ (see `.nvmrc`).

1. `npm ci`
2. `npm run env:init` (copies `.env.example` to `.env.local`; create `.secrets` for later Playwright)
3. Start the API from the [API README](https://github.com/raouf-b-dev/ecommerce-store-api) on port **3000**. CORS must allow `http://localhost:3100` with credentials.
4. `npm run dev` - storefront at [http://localhost:3100](http://localhost:3100)

`npm run dev` and `npm run start` both bind **3100**. Stop one before starting the other.

Regenerate OpenAPI types (API must be running): `npm run api:generate`.

Client rules: [`docs/API-INTEGRATION.md`](docs/API-INTEGRATION.md). Security baseline: [`SECURITY.md`](SECURITY.md).

---

<a id="architecture"></a>

## Architecture

```text
Browser -> Next.js (RSC + client components) -> versioned HTTP API -> ecommerce-store-api
                                                                    ^
Admin SPA / mobile apps --------------------------------------------+
```

| Rule        | Detail                                                                             |
| :---------- | :--------------------------------------------------------------------------------- |
| Boundary    | Do not reimplement stock, pricing, or RBAC here. Show API errors clearly.          |
| Data access | Typed client from the API OpenAPI/Swagger spec. No BFF.                            |
| Rendering   | Server Components by default. Catalog RSC is unauthenticated on purpose.           |
| Client data | TanStack Query for session, cart, checkout, and orders.                            |
| Auth        | In-memory access token + HttpOnly refresh cookie. Same contract as the admin SPA.  |
| Cart        | Authenticated only (`manage_own_cart`). No guest basket.                           |
| Checkout    | Idempotency headers as OpenAPI documents; poll own order for SAGA completion.      |

---

<a id="tech-stack"></a>

## Tech stack

| Layer          | Choice                                                              |
| :------------- | :------------------------------------------------------------------ |
| Framework      | Next.js 16 App Router (`cacheComponents`, Turbopack)                |
| UI             | React 19                                                            |
| Language       | TypeScript (strict)                                                 |
| Styling        | Tailwind CSS v4 + shadcn/ui (Radix)                                 |
| Public reads   | React Server Components (unauthenticated catalog)                   |
| Client data    | TanStack Query (session, cart, checkout, orders)                    |
| Local UI state | React state (no global store for server data)                       |
| Forms          | React Hook Form + Zod                                               |
| API            | `openapi-fetch` + generated OpenAPI types                           |
| Tests          | Vitest, Testing Library, Playwright                                 |

---

<a id="documentation"></a>

## Documentation

| Document                                             | Description                                                                                       |
| :--------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| [`SECURITY.md`](SECURITY.md)                         | Frontend security baseline                                                                        |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)                 | Delivery plan, Next.js 16 conventions, ship gates                                                 |
| [`docs/API-INTEGRATION.md`](docs/API-INTEGRATION.md) | Client integration rules (OpenAPI is the contract)                                                |
| [`docs/README.md`](docs/README.md)                   | Docs index                                                                                        |
| [`docs/ai/README.md`](docs/ai/README.md)             | Agent and conventions docs                                                                        |
| [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) | System context                                                                                    |
| [`AGENT.md`](AGENT.md)                               | Canonical agent policy                                                                            |
| API docs                                             | [`ecommerce-store-api/docs`](https://github.com/raouf-b-dev/ecommerce-store-api/tree/master/docs) |

---

<a id="related-repositories"></a>

## Related repositories

| Repository                                                                              | Role        |
| :-------------------------------------------------------------------------------------- | :---------- |
| [`ecommerce-store-api`](https://github.com/raouf-b-dev/ecommerce-store-api)             | Backend API |
| [`ecommerce-admin-dashboard`](https://github.com/raouf-b-dev/ecommerce-admin-dashboard) | Admin SPA   |

---

<a id="project-layout"></a>

## Project layout

```
src/
  app/                    # thin routes, layouts, metadata
  components/ui/          # shadcn primitives
  features/               # catalog, cart, checkout, auth, account (when added)
  lib/
    api/generated/        # OpenAPI schema.d.ts
    utils.ts
docs/
  API-INTEGRATION.md
  ROADMAP.md
  ai/                     # agent conventions
  architecture/           # ADRs
```

---

<a id="license"></a>

## License

[MIT](LICENSE)

---

Built by [Abderaouf .B](https://github.com/raouf-b-dev) | [Issues](https://github.com/raouf-b-dev/ecommerce-store-web/issues) | [Repository](https://github.com/raouf-b-dev/ecommerce-store-web)
