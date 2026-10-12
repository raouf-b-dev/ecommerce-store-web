## Overview

This pull request unifies storefront account access into a single header user menu, integrates theme selection radio items into the account menu, improves environment loading in the API client generation script, displays checkout line items in each item's currency, and ensures checkout idempotency keys are sent strictly via the request header.

The `develop` branch was merged into this branch (not rebased). Changes for OpenAPI schema regeneration and CARD payment method updates were already incorporated from develop.

## Key Changes

- **Header User Menu & Mobile Navigation**:
  - Replaced inline session links with a single `StorefrontUserMenu` in the header for both desktop and mobile viewports.
  - Removed duplicate session links from the mobile drawer (`MobileNav`).
  - Account dropdown displays user email, formatted role, and links to Orders and Account Settings.
  - Inlined sign-in, create account, and sign-out handlers directly into `StorefrontUserMenu`.
  - Added theme selection directly into the account dropdown via an "Appearance" section with Light, Dark, and System radio items, backed by a type guard.
  - Retained `ThemeToggle` for signed-out visitors.

- **Checkout Item Currency**:
  - Updated line item price and subtotal formatting in `checkout-form.tsx` to use each item's own currency (`item.price`, `item.currency` and `item.subtotal`, `item.currency`).
  - Cart totals continue to use `cart.currency`.
  - Added a test verifying EUR carts display EUR formatted line items.

- **Checkout Idempotency**:
  - Confirmed the checkout mutation excludes `idempotencyKey` from the JSON request body and passes it solely as the `Idempotency-Key` header parameter.
  - Added unit test assertions verifying exact request payload shapes without an `idempotencyKey` property.

- **API Client Generator**:
  - Updated `scripts/generate-api-client.js` to check for `.env` and `.env.local` file existence before loading rather than catching errors silently.
  - Configured script to fail fast if required API URLs are missing rather than defaulting silently to `http://localhost:3000`.
  - Clarified `.env.example` to note that `-json` is appended unless the URL already ends in `-json` or `.json`.

## Verification

- `npm run verify` passed (ESLint, ASCII prose linter, route typegen, TypeScript compiler, Vitest suite with 76 test files and 478 tests).
- Production build succeeded (`NEXT_PUBLIC_STOREFRONT_ORIGIN=https://storefront.test npm run build`).
