// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { expect, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

export const AUTH_THROTTLE_WAIT_MS = 61_000;

export type FreshCustomer = {
  email: string;
  password: string;
};

export function uniquePasswords(
  ...values: Array<string | null | undefined>
): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export function createFreshCustomer(): FreshCustomer {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    email: `storefront-${unique}@example.com`,
    password: `Store${unique}!`,
  };
}

export async function registerFreshCustomer(
  page: Page,
  customer = createFreshCustomer(),
): Promise<FreshCustomer> {
  await page.context().clearCookies();
  await page.goto('/register');

  const firstName = page.getByLabel('First name');
  const sessionErrorAlert = page.getByText('Too many requests. Wait a moment and try again.');

  await Promise.race([
    firstName.waitFor({ state: 'visible', timeout: 15_000 }),
    sessionErrorAlert.waitFor({ state: 'visible', timeout: 15_000 }),
  ]).catch(() => undefined);

  if (await sessionErrorAlert.isVisible()) {
    await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
    await page.goto('/register');
    await expect(firstName).toBeVisible({ timeout: 15_000 });
  }
  await firstName.fill('Store');
  await page.getByLabel('Last name').fill('Shopper');
  await page.getByLabel('Email').fill(customer.email);
  await page.getByLabel('Password').fill(customer.password);
  await page.getByRole('button', { name: 'Create account' }).click();

  const emailLocator = page.getByText(customer.email);
  const throttleLocator = page
    .getByText('Too many sign-in attempts')
    .or(page.getByText('Too many requests'));

  await Promise.race([
    emailLocator.waitFor({ state: 'visible', timeout: 15_000 }),
    throttleLocator.waitFor({ state: 'visible', timeout: 15_000 }),
  ]).catch(() => undefined);

  if (await throttleLocator.isVisible()) {
    await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
    await page.getByRole('button', { name: 'Create account' }).click();
  }

  await expect(emailLocator).toBeVisible({ timeout: 25_000 });
  return customer;
}

/**
 * Resets seeded customer credentials via `npm run db:seed:auth` in the API repository.
 */
export function resetAuthSeed(): void {
  if (process.env.E2E_SKIP_DB_SEED === '1') {
    return;
  }

  const apiPath =
    process.env.E2E_API_REPO_PATH ||
    path.resolve(process.cwd(), '../ecommerce-store-api');

  if (!fs.existsSync(apiPath)) {
    throw new Error(
      `Cannot reset auth seed: API repository not found at "${apiPath}". Set E2E_API_REPO_PATH or E2E_SKIP_DB_SEED=1.`,
    );
  }

  try {
    execSync('npm run db:seed:auth', {
      cwd: apiPath,
      stdio: 'pipe',
      timeout: 120_000,
      env: { ...process.env },
    });
  } catch (error) {
    throw new Error(
      `Failed to run 'npm run db:seed:auth' in ${apiPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export interface LoginSeededCustomerOptions {
  destination?: string;
}

/**
 * Logs in the seeded customer, handling forced password change if active.
 * Reusable across journey, auth, and authenticated accessibility audits.
 */
export async function loginSeededCustomer(
  page: Page,
  options?: LoginSeededCustomerOptions,
): Promise<{ email: string }> {
  const email = process.env.E2E_CUSTOMER_EMAIL;
  const seedPassword = process.env.E2E_CUSTOMER_PASSWORD;
  const rotatedPassword =
    process.env.E2E_CUSTOMER_NEW_PASSWORD ?? `${seedPassword}Rotated1!`;

  if (!email || !seedPassword) {
    throw new Error(
      'Missing E2E_CUSTOMER_EMAIL or E2E_CUSTOMER_PASSWORD in environment (see e2e/README.md).',
    );
  }

  const destination = options?.destination ?? '/account';
  const candidates = uniquePasswords(seedPassword, rotatedPassword);

  for (const candidate of [...candidates, ...candidates]) {
    await page.goto(destination);

    // If already authenticated and landed on destination, return immediately
    const emailOnPage = await page.getByText(email).first().isVisible().catch(() => false);
    if (emailOnPage) {
      return { email };
    }

    const sessionErrorAlert = page.getByText('Too many requests. Wait a moment and try again.');
    if (await sessionErrorAlert.isVisible().catch(() => false)) {
      await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
      await page.goto(destination);
    }

    const signInHeading = page.getByRole('heading', { name: 'Sign in' });
    let isSignIn = await signInHeading.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);

    if (!isSignIn) {
      await page.goto(`/login?redirect=${encodeURIComponent(destination)}`);
      isSignIn = await signInHeading.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false);
    }

    if (!isSignIn) {
      continue;
    }

    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(candidate);
    await page.getByRole('button', { name: 'Sign in' }).click();

    const accountHeading = page.getByRole('heading', { name: 'Account' });
    const changeHeading = page.getByRole('heading', { name: 'Change your password' });
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

    if (await invalidError.isVisible()) {
      continue;
    }

    if (await changeHeading.isVisible()) {
      const nextPassword =
        candidate === rotatedPassword ? seedPassword : rotatedPassword;
      await page.getByLabel('Current password').fill(candidate);
      await page.getByLabel('New password', { exact: true }).fill(nextPassword);
      await page.getByLabel('Confirm new password').fill(nextPassword);
      await page.getByRole('button', { name: 'Update password' }).click();

      const changeThrottleError = page.getByText('Too many password-change attempts');
      await Promise.race([
        accountHeading.waitFor({ state: 'visible', timeout: 15_000 }),
        changeThrottleError.waitFor({ state: 'visible', timeout: 15_000 }),
      ]).catch(() => undefined);

      if (await changeThrottleError.isVisible()) {
        await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
        await page.getByRole('button', { name: 'Update password' }).click();
      }

      await expect(page).not.toHaveURL(/\/change-password/);
      return { email };
    }

    if (await accountHeading.isVisible()) {
      return { email };
    }
  }

  throw new Error(
    `Failed to authenticate seeded customer ${email} with both seed and rotated passwords. Run 'npm run db:seed:auth' in the API.`,
  );
}
