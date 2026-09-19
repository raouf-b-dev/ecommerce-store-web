import { expect, test } from '@playwright/test';
import { AUTH_THROTTLE_WAIT_MS, registerFreshCustomer } from './helpers/auth';

test.describe('Checkout Flow', () => {
  test('redirects unauthenticated guest accessing /checkout to login with redirect param', async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto('/checkout');

    const sessionErrorAlert = page.getByText('Too many requests. Wait a moment and try again.');
    if (await sessionErrorAlert.isVisible().catch(() => false)) {
      await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
      await page.goto('/checkout');
    }

    await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/, { timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: 'Sign in', level: 1 }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('has noindex, nofollow robots metadata on /checkout', async ({
    page,
  }) => {
    await page.goto('/checkout');

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
  });

  test('authenticated customer can add item, proceed to checkout, and complete order via polling', async ({
    page,
  }) => {
    await registerFreshCustomer(page);

    // 1. Add an in-stock product to cart
    await page.goto('/');
    const firstProduct = page.locator('main a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();

    await expect(page).toHaveURL(/\/products\/\d+/);
    const addToCartBtn = page.getByRole('button', { name: /add to cart/i });
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // 2. Go to /cart and proceed to checkout
    await page.goto('/cart');
    const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i });
    await expect(checkoutLink).toBeVisible();
    await checkoutLink.click();

    await expect(page).toHaveURL(/\/checkout/);

    // 3. Verify checkout form rendered with address options
    await expect(page.getByText('Shipping Address')).toBeVisible();
    await expect(page.getByText('Use saved address on file')).toBeVisible();
    await expect(page.locator('form').getByText('Order Summary')).toBeVisible();

    // Fresh customer has no saved address on file; switch to custom address
    await page.locator('#address-option-custom').click();

    // Fill required custom shipping address fields (country defaults to US, phone is optional)
    await page.locator('#firstName').fill('Jane');
    await page.locator('#lastName').fill('Doe');
    await page.locator('#street').fill('123 Market Street');
    await page.locator('#city').fill('San Francisco');
    await page.locator('#state').fill('CA');
    await page.locator('#postalCode').fill('94105');
    await page.locator('#country').fill('US');

    // 4. Place order
    const placeOrderBtn = page.getByRole('button', { name: /place order/i });
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();

    // 5. Verify transition to confirmation and polling to confirmed status
    // Order number badge and confirmation header should become visible
    await expect(
      page.getByText(/thank you for your order!/i),
    ).toBeVisible({ timeout: 20_000 });

    await expect(page.getByText(/ORD-\d+/)).toBeVisible();
    await expect(page.getByText('Confirmed').first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: /view order details/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /continue shopping/i }),
    ).toBeVisible();
  });
});
