// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('console', (m) => console.log('console:', m.type(), m.text()));
page.on('response', (r) => {
  if (r.url().includes('authentication')) {
    console.log('auth', r.status(), r.url());
  }
});

await page.goto('http://localhost:3100/login');
await page.waitForSelector('text=Fill demo customer credentials', { timeout: 30000 });
await page.click('text=Fill demo customer credentials');
await page.click('button[type="submit"]:has-text("Sign in")');
await page.waitForTimeout(8000);
console.log('url', page.url());
const alert = page.locator('[title="Could not sign in"]');
console.log('login error visible', await alert.count());
console.log((await page.locator('body').innerText()).slice(0, 800));
await browser.close();
