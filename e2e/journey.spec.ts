import { expect, test } from '@playwright/test';
import {
  accountMenuButton,
  addInStockProductToCart,
  loginSeededCustomer,
} from './helpers/auth';
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
    await expect(accountMenuButton(page, email)).toBeVisible();

    // 2. Browse Catalog via in-app navigation
    const homeLink = page
      .getByRole('banner')
      .getByRole('link', { name: 'Everyday Goods' });
    await homeLink.click();
    await expect(page).toHaveURL('/');

    // 3. Add an in-stock product (waits for the toast so the next click is not intercepted)
    await addInStockProductToCart(page);
    const addedToast = page.getByText(/added .* to cart/i);
    await expect(addedToast).toBeHidden({ timeout: 15_000 });

    // 4. Navigate to Cart via Header Link
    const cartLink = page
      .getByRole('banner')
      .getByRole('link', { name: /shopping cart/i });
    await cartLink.click();
    await expect(page).toHaveURL('/cart');
    await expect(
      page.getByRole('heading', { name: /shopping cart/i, level: 1 }),
    ).toBeVisible();

    // 5. Proceed to Checkout via in-app link
    const checkoutLink = page.getByRole('link', {
      name: 'Proceed to Checkout',
    });
    await expect(checkoutLink).toBeVisible();
    await Promise.all([
      page.waitForURL('/checkout', { timeout: 15_000 }),
      checkoutLink.click(),
    ]);
    await expect(page.getByRole('main')).toBeFocused();
    await expect(
      page.getByRole('heading', { name: /checkout/i, level: 1 }),
    ).toBeVisible();

    // 6. Fill Shipping Address & Submit Checkout
    await page.locator('#address-option-custom').click();
    await page.locator('#firstName').fill('Journey');
    await page.locator('#lastName').fill('Customer');
    await page.locator('#street').fill('742 Evergreen Terrace');
    await page.locator('#city').fill('Springfield');
    await page.locator('#state').fill('OR');
    await page.locator('#postalCode').fill('97477');
    const placeOrderBtn = page.getByRole('button', { name: /place order/i });
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    // 7. Poll and Confirm Order
    await expect(
      page.getByRole('heading', { name: /your order is confirmed/i }),
    ).toBeVisible({ timeout: 25_000 });

    const orderText = await page
      .getByText(/ORD-\d+/)
      .first()
      .textContent();
    const orderNumber = orderText?.match(/ORD-\d+/)?.[0];
    if (!orderNumber) {
      throw new Error('Confirmation page did not show an order number.');
    }

    // 8. In-App Navigation to Order Detail
    const viewDetailBtn = page.getByRole('link', {
      name: /view order details/i,
    });
    await expect(viewDetailBtn).toBeVisible();
    await viewDetailBtn.click();

    await expect(page).toHaveURL(/\/orders\/\d+/, { timeout: 15_000 });
    await expect(page.getByRole('main')).toBeFocused();
    await expect(
      page.getByRole('heading', { name: orderNumber, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText('Confirmed').first()).toBeVisible();

    // 9. In-App Navigation to Orders History
    await page
      .getByRole('navigation', { name: 'Account' })
      .getByRole('link', { name: 'Orders', exact: true })
      .click();
    await expect(page).toHaveURL('/orders');
    await expect(page.getByRole('main')).toBeFocused();
    await expect(
      page.getByRole('heading', { name: 'Orders', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: new RegExp(orderNumber) }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
