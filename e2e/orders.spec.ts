import { expect, test } from '@playwright/test';
import { AUTH_THROTTLE_WAIT_MS, registerFreshCustomer } from './helpers/auth';

test.describe('Orders', () => {
  test('has noindex, nofollow robots metadata on /orders', async ({ page }) => {
    await page.goto('/orders');

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
  });

  test('redirects unauthenticated guest accessing /orders to login', async ({
    page,
  }) => {
    await page.goto('/orders');

    await expect(page).toHaveURL(/\/login\?redirect=%2Forders/);
  });

  test('authenticated customer can complete checkout then open order detail from /orders', async ({
    page,
  }) => {
    await registerFreshCustomer(page);

    await page.goto('/');
    const firstProduct = page.locator('main a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();

    await expect(page).toHaveURL(/\/products\/\d+/);
    await page.getByRole('button', { name: /add to cart/i }).click();

    await page.goto('/cart');
    await page.getByRole('link', { name: /proceed to checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout/);

    await page.locator('#address-option-custom').click();
    await page.locator('#firstName').fill('Jane');
    await page.locator('#lastName').fill('Doe');
    await page.locator('#street').fill('123 Market Street');
    await page.locator('#city').fill('San Francisco');
    await page.locator('#state').fill('CA');
    await page.locator('#postalCode').fill('94105');
    await page.locator('#country').fill('US');

    await page.getByRole('button', { name: /place order/i }).click();

    await expect(
      page.getByText(/thank you for your order!/i),
    ).toBeVisible({ timeout: 20_000 });

    const orderText = await page.getByText(/ORD-\d+/).first().textContent();
    const orderNumberMatch = orderText?.match(/ORD-\d+/);
    expect(orderNumberMatch).toBeTruthy();
    const orderNumber = orderNumberMatch![0];

    await page.getByRole('link', { name: /view order details/i }).click();
    await expect(page).toHaveURL(/\/orders\/\d+/, { timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: orderNumber, level: 1 }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Confirmed').first()).toBeVisible();

    const ordersNav = page.getByRole('link', { name: /orders/i }).first();
    if (await ordersNav.isVisible().catch(() => false)) {
      await ordersNav.click();
    } else {
      await page.goto('/orders');
    }

    const sessionErrorAlert = page.getByText('Too many requests. Wait a moment and try again.');
    if (await sessionErrorAlert.isVisible().catch(() => false)) {
      await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
      await page.goto('/orders');
    }

    await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('link', { name: new RegExp(orderNumber) }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
