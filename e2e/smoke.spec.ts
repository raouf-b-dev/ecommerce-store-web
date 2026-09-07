import { expect, test } from '@playwright/test';

test('home shell renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Storefront' })).toBeVisible();
});
