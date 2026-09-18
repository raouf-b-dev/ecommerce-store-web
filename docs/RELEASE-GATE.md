# Release gate (Phase 12)

Executable checklist for a stranger onboarding without tribal knowledge.

Credentials stay in the API [seeding guide](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/SEEDING.md). Do not paste passwords into this repository.

## Before you start

1. `ecommerce-store-api` is running on port **3000**. Follow that repository's [README](https://github.com/raouf-b-dev/ecommerce-store-api#quick-start) or [local setup](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/docs/development/LOCAL-SETUP.md).
2. This storefront is configured (`npm ci`, `npm run env:init`) and served with `npm run dev` on port **3100**.
3. Confirm API CORS includes `http://localhost:3100` with credentials.

## Stranger quickstart

- [ ] Clone `ecommerce-store-web`, run `npm ci`, `npm run env:init`
- [ ] API healthy at the origin in `NEXT_PUBLIC_API_BASE_URL`
- [ ] `npm run dev` opens `http://localhost:3100`

## Seeded purchase path

- [ ] Sign in as the seeded **customer** from the API seeding guide
- [ ] Complete forced password change on first login
- [ ] Browse catalog, add to cart, checkout
- [ ] Order reaches `confirmed` via polling (see [`ORDER-VERIFICATION.md`](ORDER-VERIFICATION.md))

## Production build

- [ ] `npm run build` succeeds
- [ ] `npm run start` on **3100** against the same API
- [ ] Repeat seeded purchase path on production build

## Documentation

- [ ] README matches ports, limits (mock payments), and API dependency
- [ ] `docs/API-INTEGRATION.md` accurate
- [ ] No secrets in `NEXT_PUBLIC_*`

## Notes

- Playwright e2e requires a live API; MSW `dev:mock` (Phase 10) is for UI preview only.
- Payments are mocked behind a swappable adapter; no live card UI in v1.
