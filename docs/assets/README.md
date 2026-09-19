# Storefront visual assets (Phase 13)

Capture against **`npm run dev:mock`** (MSW; no API required). Re-verify against a live API after [`RELEASE-GATE.md`](../RELEASE-GATE.md) if you need production-faithful screenshots.

## Prerequisites

1. From repo root: `npm run dev:mock` (port **3100**).
2. Playwright Chromium installed: `npx playwright install chromium` (once).

## Regenerate

```bash
# Terminal 1
npm run dev:mock

# Terminal 2
npm run assets:capture
```

Or run individually:

- `npm run assets:stills` - Retina PNG stills (dark + light)
- `npm run assets:walkthrough` - animated hero WebP

Override base URL if needed: `BASE_URL=http://localhost:3100 npm run assets:capture`

## Outputs referenced by README

| File | Purpose |
| :--- | :------ |
| `storefront-walkthrough.webp` | Hero animated walkthrough |
| `screenshot-catalog-{dark,light}.png` | Catalog home |
| `screenshot-product-detail-{dark,light}.png` | Product detail |
| `screenshot-cart-{dark,light}.png` | Cart with line item |
| `screenshot-checkout-{dark,light}.png` | Checkout form |
| `screenshot-order-confirmation-{dark,light}.png` | Confirmed order |

Walkthrough scripts use **click navigation** (not hard reloads between cart and checkout) so mock session and cart state persist. The hero WebP starts in light mode, toggles to dark on the product page (same pattern as the admin dashboard walkthrough), then continues the purchase flow in dark mode.

## Optional suite clip

For a multi-app demo, run the API plus companion admin and storefront repos together. A 60-90 second silent clip can end on the admin WebSocket toast when checkout completes; verify that moment from the admin repository docs, not from this repo.
