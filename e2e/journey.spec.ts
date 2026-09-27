import { expect, test } from '@playwright/test';
import { loginSeededCustomer } from './helpers/auth';
import { skipUnlessEnv } from './helpers/env';

test.describe.configure({ mode: 'serial' });

test.describe('Shopper Journey Glue', () => {
  test('continuous journey: seeded auth -> catalog -> cart -> checkout -> order detail -> orders list', async ({
    page,
  }) => {
    skipUnlessEnv('E2E_CUSTOMER_EMAIL', 'E2E_CUSTOMER_PASSWORD');
    test.setTimeout(180_000);

    // 1. Authenticate seeded customer (handling rotation if pending)
    const { email } = await loginSeededCustomer(page);
    await expect(page.getByText(email).first()).toBeVisible();

    // 2. Browse Catalog via in-app navigation
    const homeLink = page.getByRole('link', { name: /storefront/i }).first();
    await homeLink.click();
    await expect(page).toHaveURL('/');

    const firstProduct = page.locator('main a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15_000 });
    const productTitle = await firstProduct.locator('h3').first().textContent();
    await firstProduct.click();

    await expect(page).toHaveURL(/\/products\/\d+/);
    if (productTitle) {
      await expect(page.getByRole('heading', { name: productTitle.trim(), level: 1 })).toBeVisible();
    }

    // 3. Add to Cart
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await expect(addToCartButton).toBeEnabled();
    await addToCartButton.click();

    // 4. Navigate to Cart via Header Link
    const cartLink = page.getByRole('link', { name: /cart/i }).first();
    await cartLink.click();
    await expect(page).toHaveURL('/cart');
    await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible();

    // 5. Proceed to Checkout via in-app link
    const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i });
    await expect(checkoutLink).toBeVisible();
    await checkoutLink.click();
    await expect(page).toHaveURL('/checkout');
    await expect(page.getByRole('main')).toBeFocused();
    await expect(page.getByRole('heading', { name: /checkout/i, level: 1 })).toBeVisible();

    // 6. Fill Shipping Address & Submit Checkout
    await page.locator('#address-option-custom').click();
    await page.locator('#firstName').fill('Journey');
    await page.locator('#lastName').fill('Customer');
    await page.locator('#street').fill('742 Evergreen Terrace');
    await page.locator('#city').fill('Springfield');
    await page.locator('#state').fill('OR');
    await page.locator('#postalCode').fill('97477');
    await page.locator('#country').fill('US');

    const placeOrderBtn = page.getByRole('button', { name: /place order/i });
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    // 7. Poll and Confirm Order
    await expect(
      page.getByText(/thank you for your order!/i),
    ).toBeVisible({ timeout: 25_000 });

    const orderText = await page.getByText(/ORD-\d+/).first().textContent();
    const orderMatch = orderText?.match(/ORD-\d+/);
    expect(orderMatch).toBeTruthy();
    const orderNumber = orderMatch![0];

    // 8. In-App Navigation to Order Detail
    const viewDetailBtn = page.getByRole('link', { name: /view order details/i });
    await expect(viewDetailBtn).toBeVisible();
    await viewDetailBtn.click();

    await expect(page).toHaveURL(/\/orders\/\d+/, { timeout: 15_000 });
    await expect(page.getByRole('main')).toBeFocused();
    await expect(page.getByRole('heading', { name: orderNumber, level: 1 })).toBeVisible();
    await expect(page.getByText('Confirmed').first()).toBeVisible();

    // 9. In-App Navigation to Orders History
    const ordersNav = page.getByRole('link', { name: /orders/i }).first();
    await ordersNav.click();
    await expect(page).toHaveURL('/orders');
    await expect(page.getByRole('main')).toBeFocused();
    await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: new RegExp(orderNumber) }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
