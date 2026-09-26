// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import {
  addCurrentProductToCart,
  applyTheme,
  captureScreenshot,
  BASE_URL,
  fillCheckoutAddress,
  mockLogin,
  openCartViaHeader,
  openCheckoutViaCart,
  openFirstProduct,
  submitCheckout,
  waitForCatalogReady,
} from './capture-helpers.js';

async function captureThemeStills(browser, assetsDir, theme) {
  const suffix = theme === 'dark' ? 'dark' : 'light';
  console.log(`\n=== CAPTURING ${theme.toUpperCase()} THEME STILLS ===`);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  const page = await context.newPage();
  await applyTheme(page, theme);

  await mockLogin(page);
  if (new URL(page.url()).pathname !== '/') {
    await page.getByRole('link', { name: 'Storefront' }).click();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 });
  }
  await waitForCatalogReady(page);
  await page.waitForTimeout(600);
  const catalogPath = path.join(assetsDir, `screenshot-catalog-${suffix}.png`);
  await captureScreenshot(page, catalogPath);
  console.log('Saved:', catalogPath);

  await openFirstProduct(page);
  await page.waitForTimeout(600);
  const productPath = path.join(assetsDir, `screenshot-product-detail-${suffix}.png`);
  await captureScreenshot(page, productPath);
  console.log('Saved:', productPath);

  await addCurrentProductToCart(page);
  await page.waitForTimeout(400);
  await openCartViaHeader(page);
  await page.waitForTimeout(600);
  const cartPath = path.join(assetsDir, `screenshot-cart-${suffix}.png`);
  await captureScreenshot(page, cartPath);
  console.log('Saved:', cartPath);

  await openCheckoutViaCart(page);
  await fillCheckoutAddress(page);
  await page.waitForTimeout(600);
  const checkoutPath = path.join(assetsDir, `screenshot-checkout-${suffix}.png`);
  await captureScreenshot(page, checkoutPath);
  console.log('Saved:', checkoutPath);

  await submitCheckout(page);
  await page.waitForTimeout(800);
  const confirmationPath = path.join(
    assetsDir,
    `screenshot-order-confirmation-${suffix}.png`,
  );
  await captureScreenshot(page, confirmationPath);
  console.log('Saved:', confirmationPath);

  await context.close();
}

async function main() {
  const assetsDir = path.resolve(process.cwd(), 'docs/assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log(`Starting storefront showcase capture at ${BASE_URL} (1440x900 @ 2x)...`);
  const browser = await chromium.launch({ headless: true });

  await captureThemeStills(browser, assetsDir, 'dark');
  await captureThemeStills(browser, assetsDir, 'light');

  await browser.close();
  console.log('\nStorefront Retina stills (dark + light) captured successfully.');
}

main().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
