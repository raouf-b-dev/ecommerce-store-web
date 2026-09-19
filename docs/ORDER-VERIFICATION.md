# Order lifecycle verification

Storefront reference for Phase 11: checkout initiates the async API order lifecycle; polling tracks confirmation.

Credentials stay in the API [seeding guide](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/SEEDING.md). Do not paste passwords into this repository.

## Flow

```text
Checkout form -> POST /v1/orders/checkout (201 + orderId)
              -> poll GET /v1/orders/{orderId}
              -> terminal status: confirmed | payment_failed | cancelled
```

## Before you start

1. `ecommerce-store-api` is running on port **3000**. Follow that repository's [README](https://github.com/raouf-b-dev/ecommerce-store-api#quick-start) or [local setup](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/LOCAL-SETUP.md).
2. This storefront is configured (`npm run env:init`) and served with `npm run dev` on port **3100**. Point `NEXT_PUBLIC_API_BASE_URL` at the API origin from step 1.
3. Confirm API CORS includes `http://localhost:3100` with credentials.

## Manual verification (live API)

1. Open `http://localhost:3100` and sign in as the seeded **customer** from the API seeding guide. Complete forced password change on first login.
2. Add a seeded catalog product to cart; open checkout.
3. Confirm order summary shows API `subtotal`, `shippingCost`, and `totalAmount` (not hardcoded UI copy).
4. Submit checkout; URL should include `?orderId=`.
5. Confirmation page polls until status becomes `confirmed` (mock payment SAGA success).

Cross-app effects (inventory lock, WebSocket `orders.created`, admin toast) are owned by the API and companion apps. Verify those from their repositories if needed.

## Failure scenarios

| API status | Storefront behavior |
| :-- | :-- |
| `payment_failed` | Polling stops; user sees failure message from order status |
| `cancelled` | Polling stops; user sees cancelled state |
| 409 optimistic lock | Form shows conflict message; user may retry |

## Automated tests

- Unit/component: checkout mutation, polling helpers (Vitest).
- Playwright: full async SAGA against seeded live API when Docker is available (`e2e/README.md`).
