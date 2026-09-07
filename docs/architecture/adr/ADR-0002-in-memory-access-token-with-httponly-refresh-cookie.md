# ADR-0002: In-Memory Access Token with HttpOnly Refresh Cookie

- **Status**: Accepted
- **Date**: 2026-09-07
- **Context**: Shopper session storage for `ecommerce-store-api` JWT auth. Ports the admin SPA decision to the storefront.

---

## 1. Context & Problem Statement

The API uses a dual-token model: short-lived access tokens (Bearer header) and long-lived refresh tokens (HttpOnly cookie on the API origin). The storefront must attach tokens consistently without putting long-lived credentials in `localStorage`.

Reference: API [JWT-RSA-JWKS.md](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/security/JWT-RSA-JWKS.md). Admin: [ADR-0002](https://github.com/raouf-b-dev/ecommerce-admin-dashboard/blob/master/docs/architecture/adr/ADR-0002-in-memory-access-token-with-httponly-refresh-cookie.md).

## 2. Decision

1. **Access token** is kept in an in-memory module ref and React Query session cache. Never persist to `localStorage` or `sessionStorage`.
2. **Refresh token** is never read by application JavaScript. The browser sends the API's HttpOnly cookie via `credentials: 'include'` on the browser OpenAPI client.
3. **Session bootstrap** calls the OpenAPI refresh operation on app mount through TanStack Query (`AuthProvider`).
4. Next `cookies()` will not see the refresh cookie. Do not invent a Next-side session cookie that copies the access token.

## 3. Alternatives Considered

1. **`localStorage` for access token**: Rejected: XSS can exfiltrate tokens.
2. **Next HttpOnly session cookie wrapping the API token**: Rejected: that is a BFF (see ADR-0001).
3. **Session-hint cookie for RSC redirects**: Deferred. Honest v1 is a client loading splash.

## 4. Consequences

- Page refresh drops the access token but can restore session via the refresh cookie.
- Cross-origin local dev requires API CORS to allow `http://localhost:3100` with credentials.
- Accept this ADR when the browser `apiClient` and `AuthProvider` land.
