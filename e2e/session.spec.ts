import { expect, test } from '@playwright/test';
import {
  accountMenuButton,
  registerFreshCustomer,
  signOut,
} from './helpers/auth';

test.describe.configure({ mode: 'serial' });

test('reload stays signed in while the refresh cookie is valid', async ({
  page,
}) => {
  const customer = await registerFreshCustomer(page);
  const refreshPosts: string[] = [];

  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      request.url().includes('/v1/authentication/refresh')
    ) {
      refreshPosts.push(request.url());
    }
  });

  await page.reload();

  await expect(accountMenuButton(page, customer.email)).toBeVisible({
    timeout: 15_000,
  });
  expect(refreshPosts.length).toBeGreaterThan(0);
});

test('an invalid refresh cookie ends the browser session', async ({ page }) => {
  const customer = await registerFreshCustomer(page);
  await page.context().clearCookies();
  await page.goto('/account');

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(accountMenuButton(page, customer.email)).toHaveCount(0);
});

test('logout revokes the refresh cookie and clears shopper chrome', async ({
  page,
}) => {
  const customer = await registerFreshCustomer(page);
  await signOut(page, customer.email);

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible({
    timeout: 15_000,
  });
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(accountMenuButton(page, customer.email)).toHaveCount(0);
});
