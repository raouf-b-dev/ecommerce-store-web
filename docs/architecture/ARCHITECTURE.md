# Storefront Architecture

High-level architecture for the customer-facing Next.js App Router storefront.

## System context

```text
Browser -> Next.js (RSC + client components) -> versioned HTTP API -> ecommerce-store-api
                                                                    ^
Admin SPA / mobile apps --------------------------------------------+
```

Backend context: [ecommerce-store-api ARCHITECTURE.md](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/architecture/ARCHITECTURE.md).

| Rule | Detail |
| :--- | :----- |
| Boundary | Pricing, stock, checkout, auth, and permissions live in the API. |
| Data access | Typed client from OpenAPI (`openapi-fetch` + generated schema). No BFF. |
| Public catalog | Unauthenticated RSC. Do not attach a Bearer token. |
| Client data | TanStack Query for session, cart, checkout, and orders (when wired). |
| Auth | In-memory access token + HttpOnly refresh cookie on the API origin. |
| Cart | Authenticated only (`manage_own_cart`). No guest line-item basket. |
| Checkout | Idempotency as OpenAPI documents; poll own order for SAGA completion. |

## App composition (current)

```text
src/app/layout.tsx
  html + body (document scroll)
    src/app/page.tsx   # placeholder home
```

Query, Auth, and theme providers are not mounted yet. When they land, QueryClient is created in a client `Providers` with `useState`, not at module scope.

## Routing model (target)

Rationale: [ADR-0001](adr/ADR-0001-rsc-catalog-browser-session-no-bff.md).

```mermaid
flowchart TD
  Visit["Any URL"] --> Kind{"Route kind"}
  Kind -->|public shop| Rsc["RSC catalog pages"]
  Kind -->|auth forms| AuthLayout["auth layout, no shopping chrome"]
  Kind -->|account cart checkout| ClientGate["client ProtectedRoute"]
  ClientGate -->|no session| Login["/login?redirect=..."]
  ClientGate -->|session| Page["feature page + Query"]
```

- Public catalog is RSC and does not require a session.
- Cart, checkout, and account are client-gated because the access token is in memory.
- Do not put session checks in `proxy.ts`.

## Auth and session (target)

Rationale: [ADR-0002](adr/ADR-0002-in-memory-access-token-with-httponly-refresh-cookie.md), [ADR-0003](adr/ADR-0003-single-flight-silent-refresh.md).

```mermaid
sequenceDiagram
    participant Browser
    participant AuthProvider
    participant ApiClient
    participant API

    Browser->>AuthProvider: App mount
    AuthProvider->>ApiClient: POST refresh
    ApiClient->>API: HttpOnly cookie credentials include
    alt Valid refresh cookie
        API-->>AuthProvider: accessToken
        AuthProvider-->>Browser: authenticated
    else No session
        API-->>AuthProvider: 401
        AuthProvider-->>Browser: unauthenticated
    end
```

Next `cookies()` cannot read the API refresh cookie. Silent refresh uses raw `fetch`, not the OpenAPI middleware.

## Directory tree (as of this writing)

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    ui/           # shadcn: button, input, card, alert, sonner
  lib/
    utils.ts
    api/
      generated/
        schema.d.ts
  test/
    setup.ts
e2e/
  smoke.spec.ts
scripts/
  generate-api-client.js
  generate-env.js
```

Feature folders under `src/features/` are added when those screens exist. Do not invent them empty.

## Related ADRs

See [adr/README.md](adr/README.md).
