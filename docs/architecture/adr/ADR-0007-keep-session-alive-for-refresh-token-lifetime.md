# ADR-0007: Keep Session Alive for the Refresh-Token Lifetime

- **Status**: Accepted
- **Date**: 2026-09-07
- **Context**: Short-lived access tokens; shoppers remain signed in while the API refresh cookie is valid
- **Does not supersede**: [ADR-0002](ADR-0002-in-memory-access-token-with-httponly-refresh-cookie.md), [ADR-0003](ADR-0003-single-flight-silent-refresh.md)

---

## 1. Context & Problem Statement

The access token lives only in browser memory and has a short lifetime. It is
therefore absent after reload and regularly expires while a shopper is active.
Waiting for every domain request to fail with HTTP 401 creates unnecessary
failures, while treating refresh outages as logout ends valid sessions.

The API rotates refresh tokens and revokes the session family when a rotated
token is reused. Every refresh caller must share one in-flight request.

This extends the same concept recorded by the admin SPA's ADR-0008, adapted to
Next.js App Router and the storefront's unauthenticated RSC catalog.

## 2. Decision

1. The API's HttpOnly refresh cookie represents session continuity. Missing,
   malformed, near-expiry, or expired in-memory access tokens trigger the
   existing single-flight refresh before authenticated browser requests.
2. While authenticated, the client session query refreshes shortly before JWT
   `exp`. Window focus and reconnect refetch only when the access token is
   unusable. JWT `exp` is used only for scheduling; the API verifies RS256.
3. Session bootstrap, proactive refresh, and domain-401 recovery use the same
   raw-fetch single-flight operation. A same-origin Web Lock also serializes
   refresh-cookie rotation across tabs.
4. Refresh HTTP 401 means unauthenticated. Refresh HTTP 429, HTTP 5xx, network
   failures, and malformed success payloads throw and preserve the current
   session state for retry.
5. Login, register, and refresh requests are exempt from pre-request refresh.
   Logout and change-password are not exempt because they require a usable
   Bearer token. Logout acquires the same browser-wide session-cookie lock and
   suppresses refresh-result updates until revocation settles.
6. The session query runs only in the browser. Public catalog RSC requests
   remain token-free.
7. Access and refresh tokens are never persisted in `localStorage` or
   `sessionStorage`.

## 3. Alternatives Considered

1. **Persist the access token**: Rejected because XSS could exfiltrate it.
2. **Wait only for domain 401**: Rejected because short token TTL causes
   avoidable failed requests.
3. **Treat every refresh failure as logout**: Rejected because transient
   failures do not prove that the refresh cookie is invalid.
4. **Refresh independently in each caller**: Rejected because refresh-token
   rotation can interpret overlap as reuse and revoke the session family.

## 4. Consequences

- Reload restores the session through the API cookie without persisting a
  Bearer token.
- Authenticated tabs refresh near access-token expiry and recover on focus.
- Transient refresh failures surface retry UI or request errors without a
  false login redirect.
- Timers and cookie-based bootstrap remain browser-only; the Next server does
  not attempt to read the API-origin refresh cookie.
