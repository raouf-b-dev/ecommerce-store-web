import { expect, test } from '@playwright/test';
import { checkA11y } from './helpers/axe';
import { loginSeededCustomer, AUTH_THROTTLE_WAIT_MS } from './helpers/auth';
import { skipUnlessEnv } from './helpers/env';

test.describe.configure({ mode: 'serial' });

test.describe('Customer Accessibility & Dialog Keyboard Navigation', () => {
  test('audits cart, checkout, order detail, and account with dialog focus restoration', async ({
    page,
  }) => {
    skipUnlessEnv('E2E_CUSTOMER_EMAIL', 'E2E_CUSTOMER_PASSWORD');
    test.setTimeout(180_000);

    // 1. Authenticate seeded customer once
    await loginSeededCustomer(page);

    // 2. Cart accessibility
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible({
      timeout: 15_000,
    });
    await checkA11y(page, 'Cart page');

    // 3. Add item and test Checkout accessibility
    await page.goto('/');
    const firstProduct = page.locator('main a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15_000 });
    await firstProduct.click();
    await expect(page).toHaveURL(/\/products\/\d+/, { timeout: 15_000 });
    await page.getByRole('button', { name: /add to cart/i }).click();

    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: /checkout/i, level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await checkA11y(page, 'Checkout page');

    // 4. Place order and test Order Detail accessibility
    await page.locator('#address-option-custom').click();
    await page.locator('#firstName').fill('Alex');
    await page.locator('#lastName').fill('A11y');
    await page.locator('#street').fill('100 Accessible Way');
    await page.locator('#city').fill('Eugene');
    await page.locator('#state').fill('OR');
    await page.locator('#postalCode').fill('97401');
    await page.locator('#country').fill('US');

    const placeOrderBtn = page.getByRole('button', { name: /place order/i });
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    await expect(
      page.getByText(/thank you for your order!/i),
    ).toBeVisible({ timeout: 25_000 });

    await page.getByRole('link', { name: /view order details/i }).click();
    await expect(page).toHaveURL(/\/orders\/\d+/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await checkA11y(page, 'Order detail page');

    // 5. Account accessibility & Dialog keyboard navigation
    const accountLink = page.getByRole('link', { name: /account/i }).first();
    if (await accountLink.isVisible().catch(() => false)) {
      await accountLink.click();
    } else {
      await page.goto('/account');
    }
    const sessionErrorAlert = page.getByText('Too many requests. Wait a moment and try again.');
    if (await sessionErrorAlert.isVisible().catch(() => false)) {
      await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
      await page.goto('/account');
    }
    const accountHeading = page.getByRole('heading', { name: 'Account', level: 1 });
    await expect(accountHeading).toBeVisible({ timeout: 15_000 });

    await checkA11y(page, 'Account page');

    // Dialog keyboard Escape and focus restoration
    const addAddressButton = page.getByRole('button', { name: 'Add address' }).first();
    await addAddressButton.click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog.getByRole('heading', { name: 'Add address' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(addAddressButton).toBeFocused();
  });
});
