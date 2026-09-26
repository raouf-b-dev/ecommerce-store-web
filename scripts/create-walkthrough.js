// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createAnimatedWebp } from './create-animated-webp.js';
import {
  addCurrentProductToCart,
  applyLightTheme,
  dismissToasts,
  hideDevOverlay,
  BASE_URL,
  fillCheckoutAddress,
  mockLogin,
  openCartViaHeader,
  openCheckoutViaCart,
  openFirstProduct,
  submitCheckout,
  switchToDarkTheme,
  waitForCatalogReady,
} from './capture-helpers.js';

async function captureWalkthrough() {
  const width = 1280;
  const height = 800;
  const frames = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    colorScheme: 'light',
  });
  const page = await context.newPage();
  await applyLightTheme(page);

  async function snap(description) {
    console.log(`Capturing frame: ${description}`);
    await page.waitForTimeout(400);
    await hideDevOverlay(page);
    await dismissToasts(page);
    const buf = await page.screenshot({ type: 'webp', quality: 80 });
    frames.push(buf);
  }

  await mockLogin(page);
  if (new URL(page.url()).pathname !== '/') {
    await page.getByRole('link', { name: 'Storefront' }).click();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 });
  }
  await waitForCatalogReady(page);
  await snap('1. Catalog home in light mode');

  await openFirstProduct(page);
  await snap('2. Product detail in light mode');

  await switchToDarkTheme(page);
  await snap('3. Theme toggle to dark mode');

  await addCurrentProductToCart(page);
  await page.waitForTimeout(400);
  await snap('4. Product added to cart in dark mode');

  await openCartViaHeader(page);
  await snap('5. Cart with line item');

  await openCheckoutViaCart(page);
  await fillCheckoutAddress(page);
  await snap('6. Checkout form with shipping address');

  await submitCheckout(page);
  await snap('7. Order confirmation');

  await browser.close();

  console.log(`Encoding ${frames.length} frames into animated WebP...`);
  const animWebp = createAnimatedWebp(frames, width, height, 1100);
  const destPath = path.resolve('docs/assets/storefront-walkthrough.webp');
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, animWebp);
  const sizeMB = (animWebp.length / (1024 * 1024)).toFixed(2);
  console.log(`Successfully generated ${destPath}! Size: ${animWebp.length} bytes (${sizeMB} MB)`);
}

captureWalkthrough().catch((err) => {
  console.error('Failed to create walkthrough:', err);
  process.exit(1);
});
