import { expect, type Page } from '@playwright/test';

export const AUTH_THROTTLE_WAIT_MS = 61_000;

export type FreshCustomer = {
  email: string;
  password: string;
};

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
  await page.goto('/register');
  await page.getByLabel('First name').fill('Store');
  await page.getByLabel('Last name').fill('Shopper');
  await page.getByLabel('Email').fill(customer.email);
  await page.getByLabel('Password').fill(customer.password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByText(customer.email)).toBeVisible({ timeout: 15_000 });
  return customer;
}
