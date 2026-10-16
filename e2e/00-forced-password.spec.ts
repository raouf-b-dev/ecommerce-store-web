import { expect, test, type Page } from '@playwright/test';
import {
  recoverFromSessionThrottle,
  rotatedCustomerPassword,
  SESSION_THROTTLE_TEXT,
  uniquePasswords,
  waitOutAuthThrottle,
} from './helpers/auth';
import {
  requireEnv,
  skipUnlessEnv,
  skipUnlessForcedPasswordChange,
} from './helpers/env';

/**
 * Runs first among customer specs (filename sorts before a11y-*). Completing
 * this flow clears mustChangePassword; later seeded logins expect that.
 */
test(
  'rotates a seeded forced password and restores the destination',
  { tag: '@forced-password' },
  async ({ page }) => {
    skipUnlessEnv('E2E_CUSTOMER_EMAIL', 'E2E_CUSTOMER_PASSWORD');
    test.setTimeout(180_000);

    const email = requireEnv('E2E_CUSTOMER_EMAIL');
    const seedPassword = requireEnv('E2E_CUSTOMER_PASSWORD');
    const rotatedPassword = rotatedCustomerPassword(seedPassword);
    const candidates = uniquePasswords(seedPassword, rotatedPassword);
    const destination = '/account?tab=orders';

    await page.context().clearCookies();

    for (const candidate of [...candidates, ...candidates]) {
      await page.goto(destination);

      if (await recoverFromSessionThrottle(page)) {
        await page.goto(destination);
      }

      const accountHeading = page.getByRole('heading', {
        name: 'Account',
        level: 1,
      });
      const changeHeading = page.getByRole('heading', {
        name: 'Change your password',
      });
      const signInHeading = page.getByRole('heading', { name: 'Sign in' });
      const invalidError = page.getByText('Invalid email or password.');
      const throttleError = page.getByText('Too many sign-in attempts');

      await Promise.race([
        accountHeading.waitFor({ state: 'visible', timeout: 15_000 }),
        changeHeading.waitFor({ state: 'visible', timeout: 15_000 }),
        signInHeading.waitFor({ state: 'visible', timeout: 15_000 }),
        page.getByText(SESSION_THROTTLE_TEXT).waitFor({
          state: 'visible',
          timeout: 15_000,
        }),
      ]).catch(() => undefined);

      if (await recoverFromSessionThrottle(page)) {
        continue;
      }

      if (await accountHeading.isVisible()) {
        skipUnlessForcedPasswordChange();
        return;
      }

      if (await signInHeading.isVisible()) {
        await page.getByLabel('Email').fill(email);
        await page.getByLabel('Password').fill(candidate);
        await page.getByRole('button', { name: 'Sign in' }).click();

        await Promise.race([
          accountHeading.waitFor({ state: 'visible', timeout: 15_000 }),
          changeHeading.waitFor({ state: 'visible', timeout: 15_000 }),
          invalidError.waitFor({ state: 'visible', timeout: 15_000 }),
          throttleError.waitFor({ state: 'visible', timeout: 15_000 }),
        ]).catch(() => undefined);

        if (await throttleError.isVisible()) {
          await waitOutAuthThrottle(page, 'Sign-in throttled');
          continue;
        }

        if (await invalidError.isVisible()) {
          continue;
        }

        if (await accountHeading.isVisible()) {
          skipUnlessForcedPasswordChange();
          return;
        }
      }

      if (!(await changeHeading.isVisible())) {
        continue;
      }

      const nextPassword =
        candidate === rotatedPassword ? seedPassword : rotatedPassword;
      await completeForcedPasswordChange(page, {
        currentPassword: candidate,
        nextPassword,
        destination,
        accountHeading,
        changeHeading,
      });
      return;
    }

    throw new Error(
      'Seeded customer login failed with both the seed and rotated passwords (or session stayed throttled). Align E2E_CUSTOMER_PASSWORD with the running API (see e2e/README.md).',
    );
  },
);

async function completeForcedPasswordChange(
  page: Page,
  options: {
    currentPassword: string;
    nextPassword: string;
    destination: string;
    accountHeading: ReturnType<Page['getByRole']>;
    changeHeading: ReturnType<Page['getByRole']>;
  },
): Promise<void> {
  const {
    currentPassword,
    nextPassword,
    destination,
    accountHeading,
    changeHeading,
  } = options;

  await expect(page).toHaveURL(
    /\/change-password\?redirect=%2Faccount%3Ftab%3Dorders/,
  );

  // A direct protected-route navigation cannot bypass forced rotation.
  await page.goto(destination);
  await expect(changeHeading).toBeVisible({ timeout: 15_000 });

  await page.getByLabel('Current password').fill(currentPassword);
  await page.getByLabel('New password', { exact: true }).fill(nextPassword);
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
    await waitOutAuthThrottle(page, 'Password change throttled');
    await page.getByRole('button', { name: 'Update password' }).click();
  }

  await expect(accountHeading).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(destination);
}
