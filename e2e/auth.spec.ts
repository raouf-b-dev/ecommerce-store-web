import { expect, test } from '@playwright/test';
import {
  AUTH_THROTTLE_WAIT_MS,
  registerFreshCustomer,
  resetAuthSeed,
  uniquePasswords,
} from './helpers/auth';
import { skipUnlessEnv } from './helpers/env';

test.describe.configure({ mode: 'serial' });

test('registers a customer and establishes a session', async ({ page }) => {
  const customer = await registerFreshCustomer(page);
  await expect(page).toHaveURL('/');
  await expect(page.getByText(customer.email)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Account' })).toBeVisible();
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
    await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
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

test('rotates a seeded forced password and restores the destination', async ({
  page,
}) => {
  skipUnlessEnv('E2E_CUSTOMER_EMAIL', 'E2E_CUSTOMER_PASSWORD');
  resetAuthSeed();
  test.setTimeout(180_000);

  const email = process.env.E2E_CUSTOMER_EMAIL!;
  const seedPassword = process.env.E2E_CUSTOMER_PASSWORD!;
  const rotatedPassword =
    process.env.E2E_CUSTOMER_NEW_PASSWORD ?? `${seedPassword}Rotated1!`;
  const candidates = uniquePasswords(seedPassword, rotatedPassword);
  const destination = '/account?tab=orders';

  for (const candidate of [...candidates, ...candidates]) {
    await page.goto(destination);
    await expect(
      page.getByRole('heading', { name: 'Sign in' }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(candidate);
    await page.getByRole('button', { name: 'Sign in' }).click();

    const accountHeading = page.getByRole('heading', { name: 'Account' });
    const changeHeading = page.getByRole('heading', {
      name: 'Change your password',
    });
    const invalidError = page.getByText('Invalid email or password.');
    const throttleError = page.getByText('Too many sign-in attempts');

    await Promise.race([
      accountHeading.waitFor({ state: 'visible', timeout: 15_000 }),
      changeHeading.waitFor({ state: 'visible', timeout: 15_000 }),
      invalidError.waitFor({ state: 'visible', timeout: 15_000 }),
      throttleError.waitFor({ state: 'visible', timeout: 15_000 }),
    ]).catch(() => undefined);

    if (await throttleError.isVisible()) {
      await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
      continue;
    }

    if (await accountHeading.isVisible()) {
      if (process.env.E2E_SKIP_DB_SEED === '1') {
        test.skip(
          true,
          'Seeded customer was already rotated and E2E_SKIP_DB_SEED=1 bypassed resetting seed state. To test forced rotation, run without E2E_SKIP_DB_SEED=1.',
        );
        return;
      }
      throw new Error(
        'Expected forced password change heading, but customer landed directly on Account. Verify that npm run db:seed:auth reset isPasswordChangeRequired: true in the database.',
      );
    }

    if (await changeHeading.isVisible()) {
      await expect(page).toHaveURL(
        '/change-password?redirect=%2Faccount%3Ftab%3Dorders',
      );

      // A direct protected-route navigation cannot bypass forced rotation.
      await page.goto(destination);
      await expect(changeHeading).toBeVisible({ timeout: 15_000 });

      const nextPassword =
        candidate === rotatedPassword ? seedPassword : rotatedPassword;
      await page.getByLabel('Current password').fill(candidate);
      await page
        .getByLabel('New password', { exact: true })
        .fill(nextPassword);
      await page.getByLabel('Confirm new password').fill(nextPassword);
      await page.getByRole('button', { name: 'Update password' }).click();

      const changeThrottleError = page.getByText(
        'Too many password-change attempts',
      );
      await Promise.race([
        accountHeading.waitFor({ state: 'visible', timeout: 15_000 }),
        changeThrottleError.waitFor({ state: 'visible', timeout: 15_000 }),
      ]).catch(() => undefined);

      if (await changeThrottleError.isVisible()) {
        await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
        await page.getByRole('button', { name: 'Update password' }).click();
      }

      await expect(accountHeading).toBeVisible({ timeout: 15_000 });
      await expect(page).toHaveURL(destination);
      return;
    }
  }

  throw new Error(
    'Seeded customer login failed with both seed and rotated passwords. Run `npm run db:seed:auth` in `ecommerce-store-api`.',
  );
});
