# ADR-0005: Checkout Completion Is Order Polling

- **Status**: Proposed
- **Date**: 2026-09-07
- **Context**: `POST` checkout is an async SAGA. HTTP 201 returns `orderId` and `jobId`. There is no public job-status route.

---

## 1. Context & Problem Statement

Checkout does not finish in the POST response. Inventing client states such as `PENDING -> PROCESSING -> COMPLETED`, or polling a job API that does not exist, would hide SAGA failures and diverge from OpenAPI.

## 2. Decision

1. Send `Idempotency-Key` as OpenAPI documents. Reuse the same key when retrying the **same** attempt; a new attempt gets a new key.
2. Handle in-progress **409** (`Retry-After`) and fail-closed **503**.
3. On 201, keep `orderId`. Poll **GET order by id** (TanStack Query `refetchInterval`) until a documented order status (success: `confirmed` or later fulfillment; failure: `payment_failed` / `cancelled`).
4. Do not poll `jobId`. Do not invent a job-status HTTP client.

## 3. Alternatives Considered

1. **Public job-status endpoint**: Does not exist; do not invent it in the UI.
2. **WebSocket for own-order updates**: Optional later, only if the API documents a shopper event. Polling remains the v1 completion signal.
3. **Treat 201 as paid**: Rejected: the SAGA may still fail payment.

## 4. Consequences

- Confirmation UI shows a real order status from GET.
- Accept this ADR when checkout polling is implemented.
