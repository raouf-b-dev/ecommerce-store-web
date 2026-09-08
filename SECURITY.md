# Security

Security baseline for this frontend. The API remains the authority for authn/authz and domain rules.

## Secrets and config

- Never commit `.env`, `.env.local`, or files with real credentials.
- Only non-secret values may use `NEXT_PUBLIC_*`. API keys, private JWTs, and refresh tokens must not be embedded in public env vars.
- Local seed users live only in the API seeding doc. Do not copy passwords into this repository.

## Trust boundaries

- The browser is untrusted. Hide/disable UI for UX only; the API enforces authorization.
- Do not reimplement pricing, stock, checkout, or permission decisions in the client.
- Treat API error payloads as data for UX mapping. Prefer structured fields; avoid rendering raw HTML from the API.

## Auth session

- Follow the API’s documented session/cookie (or bearer) contract from OpenAPI.
- Prefer httpOnly, Secure cookies when the API provides them. Avoid storing long-lived tokens in `localStorage` unless the API contract forces it and risks are documented.
- Keep access tokens in memory only. Missing or near-expiry access tokens are restored through the API's HttpOnly refresh cookie; never persist access or refresh tokens in `localStorage` / `sessionStorage`.
- Session bootstrap, proactive refresh, and domain-`401` recovery share one single-flight refresh because refresh tokens rotate. A same-origin Web Lock also serializes refresh/logout across tabs. Retry a domain request once with the new Bearer.
- Only refresh HTTP `401` (or a retry that is still `401`) proves the session is invalid. Refresh `429`, `5xx`, network failures, and malformed success responses keep session state and surface a retryable error instead of forcing login.

## Dependencies and supply chain

- Keep dependencies updated; run audits in CI once continuous integration is in place.
- Prefer generating the API client from OpenAPI over hand-rolled HTTP that can drift and skip validation.

## Reporting

If you find a vulnerability in this UI or its handling of the API, prefer a private report to the maintainer over a public issue when exploit detail is sensitive.
