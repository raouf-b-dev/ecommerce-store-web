# Security

Security baseline for this frontend. The API remains the authority for authn/authz and domain rules.

## Secrets and config

- Never commit `.env`, `.env.local`, or files with real credentials.
- Only non-secret values may use `NEXT_PUBLIC_*` (this app) / public Vite env vars (admin uses `VITE_*`). API keys, private JWTs, and refresh tokens must not be embedded in public env vars.
- Local seed users live only in the API seeding doc. Do not copy passwords into this repository.

## Trust boundaries

- The browser is untrusted. Hide/disable UI for UX only; the API enforces authorization.
- Do not reimplement pricing, stock, checkout, or permission decisions in the client.
- Treat API error payloads as data for UX mapping. Prefer structured fields; avoid rendering raw HTML from the API.

## Auth session

- Follow the API’s documented session/cookie (or bearer) contract from OpenAPI.
- Prefer httpOnly, Secure cookies when the API provides them. Avoid storing long-lived tokens in `localStorage` unless the API contract forces it and risks are documented.
- On domain `401`, attempt a single-flight silent refresh and one retry; if that fails, clear client session state and require sign-in again. Never store long-lived tokens in `localStorage`.

## Dependencies and supply chain

- Keep dependencies updated; run audits in CI once continuous integration is in place.
- Prefer generating the API client from OpenAPI over hand-rolled HTTP that can drift and skip validation.

## Reporting

If you find a vulnerability in this UI or its handling of the API, prefer a private report to the maintainer over a public issue when exploit detail is sensitive.
