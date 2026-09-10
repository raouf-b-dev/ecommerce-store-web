# ADR-0006: Security Headers in next.config; Auth at the Client Boundary

- **Status**: Accepted
- **Date**: 2026-09-07
- **Context**: Access tokens live in memory; the refresh cookie is on the API origin.

---

## 1. Context & Problem Statement

The storefront needs static security headers and shopper route protection. Putting session checks or header dumps in a Next.js request-interception layer does not work here: the access token is not in a cookie Next can read, and static headers belong in framework config. Auth UX therefore stays in Client Components that already own the session Query.

## 2. Decision

1. Security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` / `frame-ancestors`) live in `next.config.ts` `headers()`.
2. Do **not** ship a strict `script-src` CSP that would block the inline theme FOUC script. Tighten CSP only with a nonce or hash when that script exists.
3. Route protection for cart/account remains a client concern (`ProtectedRoute` / `GuestRoute`) until a non-token hint exists (see ADR-0002).
4. Static redirects belong in `next.config.ts` `redirects()`.

## 3. Alternatives Considered

1. **Server-side session gate on every protected URL:** Rejected — no access token on the request; would always look logged out or require a BFF cookie.
2. **Headers set only from a request interceptor:** Rejected — `next.config.ts` `headers()` is the documented place for static response headers.

## 4. Consequences

- Auth and header placement stay at the documented App Router / config boundaries.
- Cart, checkout, and account remain client-gated for session.
