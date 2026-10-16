import { expect, type Locator, type Page } from '@playwright/test';
import { openInStockProduct } from './catalog';

export const AUTH_THROTTLE_WAIT_MS = 61_000;

/** Log once, then wait out the API auth throttle window (~61s). */
export async function waitOutAuthThrottle(
  page: Page,
  reason = 'Auth throttled',
): Promise<void> {
  console.log(
    `[e2e] ${reason}; waiting ${AUTH_THROTTLE_WAIT_MS / 1000}s before retry...`,
  );
  await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
}

export const SESSION_THROTTLE_TEXT =
  'Too many requests. Wait a moment and try again.';

/**
 * When session bootstrap hit the auth rate limit, the shell shows a retryable
 * alert and guest chrome. Wait out the window and click Retry (or reload).
 * Returns true when a throttle alert was handled.
 */
export async function recoverFromSessionThrottle(page: Page): Promise<boolean> {
  const alert = page.getByText(SESSION_THROTTLE_TEXT);
  if (!(await alert.isVisible().catch(() => false))) {
    return false;
  }
  await waitOutAuthThrottle(page, 'Session bootstrap throttled');
  const retry = page.getByRole('button', { name: 'Retry' });
  if (await retry.isVisible().catch(() => false)) {
    await retry.click();
  } else {
    await page.reload();
  }
  return true;
}

/** The header shows the full email only in the account menu's accessible name. */
export function accountMenuButton(page: Page, email: string): Locator {
  return page.getByRole('button', { name: `User account menu for ${email}` });
}

export async function signOut(page: Page, email: string): Promise<void> {
  await accountMenuButton(page, email).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
}

/** CI passes unset secrets as empty strings, so `??` would keep them. */
export function rotatedCustomerPassword(seedPassword: string): string {
  return process.env.E2E_CUSTOMER_NEW_PASSWORD || `${seedPassword}Rotated1!`;
}

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
  const sessionErrorAlert = page.getByText(SESSION_THROTTLE_TEXT);

  await Promise.race([
    firstName.waitFor({ state: 'visible', timeout: 15_000 }),
    sessionErrorAlert.waitFor({ state: 'visible', timeout: 15_000 }),
  ]).catch(() => undefined);

  if (await recoverFromSessionThrottle(page)) {
    await page.goto('/register');
    await expect(firstName).toBeVisible({ timeout: 15_000 });
  }
  await firstName.fill('Store');
  await page.getByLabel('Last name').fill('Shopper');
  await page.getByLabel('Email').fill(customer.email);
  await page.getByLabel('Password').fill(customer.password);
  await page.getByRole('button', { name: 'Create account' }).click();

  const accountMenu = accountMenuButton(page, customer.email);
  const throttleLocator = page
    .getByText('Too many sign-in attempts')
    .or(page.getByText('Too many requests'));

  await Promise.race([
    accountMenu.waitFor({ state: 'visible', timeout: 15_000 }),
    throttleLocator.waitFor({ state: 'visible', timeout: 15_000 }),
  ]).catch(() => undefined);

  if (await throttleLocator.isVisible()) {
    await waitOutAuthThrottle(page, 'Create account throttled');
    await page.getByRole('button', { name: 'Create account' }).click();
  }

  await expect(accountMenu).toBeVisible({ timeout: 25_000 });
  return customer;
}

/**
 * Opens an in-stock product from the home page, clicks "Add to cart",
 * and waits for the toast notification to confirm addition.
 * Recovers once from a session bootstrap 429 (guest chrome + no toast).
 */
export async function addInStockProductToCart(page: Page): Promise<void> {
  const toast = page.getByText(/added .* to cart/i);
  const signInHeading = page.getByRole('heading', { name: 'Sign in', level: 1 });

  for (let attempt = 0; attempt < 2; attempt++) {
    await openInStockProduct(page);
    if (await recoverFromSessionThrottle(page)) {
      continue;
    }

    const addToCartBtn = page.getByRole('button', { name: /add to cart/i });
    await expect(addToCartBtn).toBeVisible({ timeout: 15_000 });
    await addToCartBtn.click();

    await Promise.race([
      toast.waitFor({ state: 'visible', timeout: 15_000 }),
      signInHeading.waitFor({ state: 'visible', timeout: 15_000 }),
      page.getByText(SESSION_THROTTLE_TEXT).waitFor({
        state: 'visible',
        timeout: 15_000,
      }),
    ]).catch(() => undefined);

    if (await toast.isVisible().catch(() => false)) {
      return;
    }

    if (await recoverFromSessionThrottle(page)) {
      continue;
    }

    // Unauthenticated CTA redirects to login when session status is error.
    if (await signInHeading.isVisible().catch(() => false)) {
      await waitOutAuthThrottle(page, 'Add to cart lost session');
      continue;
    }
  }

  await expect(toast).toBeVisible({ timeout: 15_000 });
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
  if (!email || !seedPassword) {
    throw new Error(
      'Missing E2E_CUSTOMER_EMAIL or E2E_CUSTOMER_PASSWORD in environment (see e2e/README.md).',
    );
  }

  const rotatedPassword = rotatedCustomerPassword(seedPassword);
  const destination = options?.destination ?? '/account';
  const candidates = uniquePasswords(seedPassword, rotatedPassword);

  for (const candidate of [...candidates, ...candidates]) {
    await page.goto(destination);

    // If already authenticated and landed on destination, return immediately
    const emailOnPage = await accountMenuButton(page, email).isVisible().catch(() => false);
    if (emailOnPage) {
      return { email };
    }

    if (await recoverFromSessionThrottle(page)) {
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

    const accountHeading = page.getByRole('heading', {
      name: 'Account',
      level: 1,
    });
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
      await waitOutAuthThrottle(page, 'Sign-in throttled');
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
        await waitOutAuthThrottle(page, 'Password change throttled');
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
    `Failed to authenticate seeded customer ${email} with both the seed and rotated passwords. Align E2E_CUSTOMER_PASSWORD with the running API (see e2e/README.md).`,
  );
}
