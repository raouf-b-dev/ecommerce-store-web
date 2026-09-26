// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { expect, test } from '@playwright/test';

test('home shell renders chrome', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('link', { name: 'Skip to main content' }),
  ).toBeAttached();
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Storefront' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Products', level: 1 }),
  ).toBeVisible();
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Theme selector' })).toBeVisible();
});

test('skip link moves focus to main', async ({ page }) => {
  await page.goto('/');
  await page.locator('body').focus();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to main content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('html is dark before react when store-ui-theme is dark', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('store-ui-theme', 'dark');
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('status page is noindex and reports API health', async ({ page }) => {
  await page.goto('/status');
  await expect(
    page.getByRole('heading', { name: 'API status', level: 1 }),
  ).toBeVisible();
  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute('content', /noindex/);
  await expect(page.getByRole('status')).toHaveText(/API is (up|degraded|down)/i);
});
