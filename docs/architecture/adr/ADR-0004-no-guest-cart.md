# ADR-0004: No Guest Cart

- **Status**: Accepted
- **Date**: 2026-09-07
- **Context**: Cart HTTP requires `manage_own_cart`. The API has no anonymous cart.

---

## 1. Context & Problem Statement

Shoppers expect add-to-cart from product pages while signed out. The API has no guest cart and no merge-later operation. A local line-item basket would invent domain state the API cannot honor.

## 2. Decision

1. There is **no guest line-item basket** (no `localStorage` cart contents to merge later).
2. Signed-out add-to-cart goes to login/register with `redirect` via `safeRedirectPath`.
3. After a session exists, persist **cart id only** in namespaced `localStorage`. The id is not a credential. Clear it on logout. Do not persist line items locally.
4. The API still enforces ownership.

## 3. Alternatives Considered

1. **Anonymous cart in the API**: Out of scope for this UI; would be an API change first.
2. **`sessionStorage` for cart id**: Rejected for the id: closing the tab would drop the cart handle. Line items still must not be stored locally.
3. **Cookie cart id readable by RSC**: Deferred. Cart remains a client Query surface.

## 4. Consequences

- Product pages can render an add-to-cart island that routes guests to login.
- Accept this ADR when cart create/load and the guest redirect land.
