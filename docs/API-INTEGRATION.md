# API Integration

How `ecommerce-store-web` consumes [ecommerce-store-api](https://github.com/raouf-b-dev/ecommerce-store-api).

## Single source of truth

| Concern | Source of truth |
| :------ | :-------------- |
| Paths, methods, DTOs, status codes | API **OpenAPI / Swagger** (`http://localhost:3000/api/docs` locally) |
| Auth, cookies, versioning rules | API docs + OpenAPI |
| Local seed users | API [`docs/development/SEEDING.md`](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/SEEDING.md) |
| Local API boot | API [`docs/development/LOCAL-SETUP.md`](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/LOCAL-SETUP.md) |
| Delivery sequence | [`ROADMAP.md`](ROADMAP.md) |

Do **not** maintain an endpoint catalog in this repo. When the API adds, renames, or removes routes, regenerate the typed client from OpenAPI and adjust call sites. This file only covers **client-side** rules that are easy to get wrong.

## Base connection

| Item | Typical local value |
| :--- | :------------------ |
| API origin | `http://localhost:3000` (from `NEXT_PUBLIC_API_BASE_URL`) |
| Versioned API | Confirm versioning scheme in OpenAPI |
| Health | Confirm health routes in OpenAPI |

## Typed client

1. Generate a client from the API OpenAPI document during initial scaffold.
2. Prefer that client for domain calls over hand-written `fetch` wrappers.
3. Treat generated types as disposable: regenerate on API contract change; do not forever hand-edit them.
4. Keep a `npm` script for regenerate so drift is intentional.

## Security (frontend)

See also root [`SECURITY.md`](../SECURITY.md).

- Never put secrets in `NEXT_PUBLIC_*` env vars.
- Prefer the API’s httpOnly cookie session when available; avoid `localStorage` for long-lived tokens.
- Map errors to UI text; do not render API HTML.
- UI gating is not authorization.

## Checkout / idempotency

Checkout is idempotent on the API. Before coding:

1. Read the checkout operation in Swagger (headers, body, responses).
2. Send the documented idempotency header(s) / field.
3. Reuse the same key when retrying the **same** attempt.
4. Handle in-progress / conflict responses as Swagger documents (including any `Retry-After`).

## Error UX (client mapping only)

Map API failures to UI. Do not reinterpret domain rules.

| Class | Typical storefront behavior |
| :---- | :-------------------------- |
| Validation (`4xx` with field errors) | Show field/form messages from the payload |
| `401` | Re-auth |
| `403` | Not allowed |
| `404` | Not found / empty |
| `409` | Conflict: reload or retry with guidance |
| `5xx` / fail-closed infra | Temporary failure; retry guidance |

Exact codes and bodies: OpenAPI.

## Capability areas (discover in OpenAPI)

Concrete paths live in Swagger. Typical storefront needs:

- Health / readiness for local diagnostics
- Register, login, refresh, logout
- Product list and product detail (reads only)
- Cart create/read and line-item mutations
- Checkout with idempotency
- Customer order list/detail; profile/addresses if present

Out of scope for this app: admin product writes, operator order transitions, anything not meant for customers.

Build order for these capabilities: [`ROADMAP.md`](ROADMAP.md).

## When the API changes

1. Pull / run the new API.
2. Regenerate the OpenAPI client.
3. Fix TypeScript and call sites.
4. Update tests.
5. Only edit this file if a **client rule** changed (auth, idempotency habit, error UX), not because a path string moved.
