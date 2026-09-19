# ADR-0003: Single-Flight Silent Refresh on Domain 401

- **Status**: Accepted
- **Date**: 2026-09-07
- **Context**: Mid-request recovery when the access token expires. Ports the admin SPA silent-refresh decision.

---

## 1. Context & Problem Statement

Access tokens are short-lived. Shoppers will hit domain `401` during a session. Retrying every 401 through the OpenAPI client middleware can re-enter refresh and loop. Concurrent 401s can stampede the refresh endpoint (which is rate-limited).

Admin: [ADR-0005](https://github.com/raouf-b-dev/ecommerce-admin-dashboard/blob/master/docs/architecture/adr/ADR-0005-silent-one-shot-access-token-refresh.md).

## 2. Decision

1. On domain `401`, run a **single-flight** refresh (`inFlightRefresh`) and **one** retry of the original request.
2. Refresh uses **raw `fetch`**, not the OpenAPI client, so it cannot re-enter client middleware.
3. Never silent-retry `/authentication/*`.
4. On success, `onSessionRefreshed` updates the session Query (`['auth','session']`).
5. If refresh fails or the retry is still `401`, clear the in-memory token. The OpenAPI interceptor may `window.location.assign` to login (outside React). Form success paths use the Next router.

## 3. Alternatives Considered

1. **Retry every 401 through `apiClient` middleware**: Rejected: refresh can re-enter middleware.
2. **No silent refresh; bounce to login on any 401**: Rejected: poor UX during the 15-minute access TTL.
3. **Parallel refresh per in-flight request**: Rejected: rate limits and refresh-token rotation.

## 4. Consequences

- Login/register `429` is not mapped as invalid credentials. QueryClient skips retry on `429`.
- Accept this ADR when silent refresh is implemented on the browser client.
