// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { expect, test } from '@playwright/test';
import { AUTH_THROTTLE_WAIT_MS, registerFreshCustomer } from './helpers/auth';

test.describe('Account address book', () => {
  test('redirects unauthenticated guest accessing /account to login', async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto('/account');

    const sessionErrorAlert = page.getByText('Too many requests. Wait a moment and try again.');
    if (await sessionErrorAlert.isVisible().catch(() => false)) {
      await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
      await page.goto('/account');
    }

    await expect(page).toHaveURL(/\/login\?redirect=%2Faccount/, { timeout: 15_000 });
  });

  test('authenticated customer can add then delete an address', async ({
    page,
  }) => {
    await registerFreshCustomer(page);
    await page.goto('/account');

    await expect(page.getByRole('heading', { name: 'Account', level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Add address' }).first().click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog.getByRole('heading', { name: 'Add address' })).toBeVisible();

    await dialog.locator('#address-street').fill('500 Mission Street');
    await dialog.locator('#address-city').fill('San Francisco');
    await dialog.locator('#address-state').fill('CA');
    await dialog.locator('#address-postalCode').fill('94105');
    await dialog.locator('#address-country').fill('US');
    await dialog.locator('#address-type').selectOption('HOME');

    await dialog.getByRole('button', { name: 'Add address' }).click();

    await expect(page.getByText('500 Mission Street')).toBeVisible({
      timeout: 10_000,
    });

    const addressCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: '500 Mission Street' })
      .first();

    await addressCard.getByRole('button', { name: 'Delete' }).click();

    const deleteDialog = page.getByRole('alertdialog');
    await expect(
      deleteDialog.getByRole('heading', { name: /delete address/i }),
    ).toBeVisible();
    await deleteDialog.getByRole('button', { name: 'Delete address' }).click();

    await expect(page.getByText('500 Mission Street')).toHaveCount(0, {
      timeout: 10_000,
    });
  });
});
