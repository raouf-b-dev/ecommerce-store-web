import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('mobile navigation opens, navigates, and closes on Escape', async ({
  page,
}) => {
  await page.goto('/');

  const menu = page.getByRole('button', { name: 'Open navigation menu' });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.getByRole('link', { name: 'Home' }).nth(0)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();

  await menu.click();
  await page.getByRole('link', { name: 'Home' }).first().click();
  await expect(page.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();
  await expect(menu).toBeVisible();
});
