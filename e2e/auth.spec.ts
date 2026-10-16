import { expect, test } from '@playwright/test';
import {
  accountMenuButton,
  waitOutAuthThrottle,
  registerFreshCustomer,
} from './helpers/auth';

test.describe.configure({ mode: 'serial' });

test('registers a customer and establishes a session', async ({ page }) => {
  const customer = await registerFreshCustomer(page);
  await expect(page).toHaveURL('/');
  await accountMenuButton(page, customer.email).click();
  await expect(
    page.getByRole('menuitem', { name: 'Account Settings' }),
  ).toBeVisible();
});

test('protects account routes with a safe login redirect', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/account?tab=orders');

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page).toHaveURL(/\/login\?redirect=%2Faccount%3Ftab%3Dorders$/);
});

test('shows invalid credentials without calling it a session outage', async ({
  page,
}) => {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email').fill(`missing-${Date.now()}@example.com`);
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  const invalidMsg = page.getByText('Invalid email or password.');
  const throttleMsg = page.getByText('Too many sign-in attempts');
  await Promise.race([
    invalidMsg.waitFor({ state: 'visible', timeout: 15_000 }),
    throttleMsg.waitFor({ state: 'visible', timeout: 15_000 }),
  ]).catch(() => undefined);

  if (await throttleMsg.isVisible()) {
    await waitOutAuthThrottle(page);
    await page.getByRole('button', { name: 'Sign in' }).click();
  }

  await expect(invalidMsg).toBeVisible({ timeout: 15_000 });
});

test('shows distinct rate-limit copy for login HTTP 429', async ({ page }) => {
  await page.route('**/v1/authentication/login', async (route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({
        statusCode: 429,
        message: 'Too many requests',
      }),
    });
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill('shopper@example.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(
    page.getByText(
      'Too many sign-in attempts. Wait about a minute and try again.',
    ),
  ).toBeVisible();
});
