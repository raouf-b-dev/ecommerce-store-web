# ADR-0006: No Proxy for Auth or Headers

- **Status**: Accepted
- **Date**: 2026-09-07
- **Context**: Next.js 16 renamed `middleware.ts` to `proxy.ts`. Access tokens are in memory, not in a cookie Next can read.

---

## 1. Context & Problem Statement

`proxy.ts` runs before the App Router. It is a convenient place to dump CSP headers or "protect" routes. The storefront access token is not in a Next cookie, so Proxy cannot authorize shoppers. Using Proxy as a header dump also fights Cache Components and is the wrong layer for static security headers.

Next documents Proxy as a last-resort rewrite/redirect, not an application middleware stack.

## 2. Decision

1. **Do not add `proxy.ts` (or `middleware.ts`) for authentication or security headers.**
2. Security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` / `frame-ancestors`) live in `next.config.ts` `headers()`.
3. Do **not** ship a strict `script-src` CSP that would block a later inline theme FOUC script. Tighten CSP only with a nonce or hash when that script exists.
4. Add Proxy only for a rewrite/redirect that cannot live in `next.config.ts`. Never read session tokens there.

## 3. Alternatives Considered

1. **`proxy.ts` copies admin OperatorRoute**: Rejected: no access token on the request; would always look logged out or require a BFF cookie.
2. **Headers only in Proxy**: Rejected: `next.config.ts` `headers()` is the documented place for static response headers.

## 4. Consequences

- Scaffold has no `proxy.ts`.
- Route protection for cart/account remains a client concern until a non-token hint exists (see ADR-0002).
