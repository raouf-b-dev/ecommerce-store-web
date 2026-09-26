// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { expect, test } from '@playwright/test';
import { checkA11y } from './helpers/axe';

test.describe('Guest Accessibility & Keyboard Navigation', () => {
  test('home page passes automated accessibility audit', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await checkA11y(page, 'Home page');
  });

  test('skip link focuses main content', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await skipLink.focus();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press('Enter');
    const main = page.locator('#main');
    await expect(main).toBeFocused();
  });

  test('product detail page passes automated accessibility audit', async ({
    page,
  }) => {
    await page.goto('/');
    const firstProduct = page.locator('main a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15_000 });
    await firstProduct.click();

    await expect(page).toHaveURL(/\/products\/\d+/, { timeout: 15_000 });
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible({
      timeout: 10_000,
    });

    await checkA11y(page, 'Product detail page');
  });

  test('decorative icons in navigation and footer declare aria-hidden', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    // Verify SVG icons rendered inside buttons or decorative chrome have aria-hidden
    const decorativeSvgs = page.locator('header svg.lucide, footer svg.lucide');
    const count = await decorativeSvgs.count();
    for (let i = 0; i < count; i++) {
      const svg = decorativeSvgs.nth(i);
      const ariaHidden = await svg.getAttribute('aria-hidden');
      expect(ariaHidden).toBe('true');
    }
  });

  test('mobile navigation sheet closes on Escape and restores focus', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const menuButton = page.getByRole('button', { name: /open navigation menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const navDialog = page.getByRole('dialog', { name: /navigation menu/i });
    await expect(navDialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(navDialog).not.toBeVisible();
    await expect(menuButton).toBeFocused();
  });
});
