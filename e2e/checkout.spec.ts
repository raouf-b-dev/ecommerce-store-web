import { expect, test } from '@playwright/test';
import {
  AUTH_THROTTLE_WAIT_MS,
  addFirstProductToCart,
  registerFreshCustomer,
} from './helpers/auth';
import { createMockAddress } from '@/test/fixtures/account.fixture';

test.describe('Checkout Flow', () => {
  test('redirects unauthenticated guest accessing /checkout to login with redirect param', async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto('/checkout');

    const sessionErrorAlert = page.getByText(
      'Too many requests. Wait a moment and try again.',
    );
    if (await sessionErrorAlert.isVisible().catch(() => false)) {
      await page.waitForTimeout(AUTH_THROTTLE_WAIT_MS);
      await page.goto('/checkout');
    }

    await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/, {
      timeout: 15_000,
    });
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
    await addFirstProductToCart(page);

    // 2. Go to /cart and proceed to checkout
    await page.goto('/cart');
    const checkoutLink = page.getByRole('link', {
      name: /proceed to checkout/i,
    });
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
    await expect(page.getByRole('combobox', { name: 'Country' })).toHaveText(
      /United States/,
    );

    // 4. Place order
    const placeOrderBtn = page.getByRole('button', { name: /place order/i });
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();

    // 5. Verify transition to confirmation and polling to confirmed status
    await expect(page.getByRole('status')).toHaveText(/confirmed/i);
    await expect(
      page.getByRole('heading', { name: /your order is confirmed/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Order ORD-\d+/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /view order details/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /continue shopping/i }),
    ).toBeVisible();
  });

  test('does not scroll horizontally from 360px up with long address and product name', async ({
    page,
  }) => {
    const longName = 'Extraordinarily'.repeat(8) + ' Long Product Name '.repeat(4);
    const longWord = 'Supercalifragilisticexpialidocious'.repeat(3);

    // Rewrite the cart read so a long product name reaches the order summary.
    await page.route(/\/v1\/carts\/[^/?]+(\?.*)?$/, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      const body = await response.text();
      await route.fulfill({
        response,
        body: body.replace(
          /("productName"\s*:\s*)"(?:[^"\\]|\\.)*"/g,
          `$1${JSON.stringify(longName)}`,
        ),
      });
    });

    // Rewrite the user profile read so a long saved address reaches the checkout options.
    await page.route(/\/v1\/users\/me(\?.*)?$/, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      const json = await response.json();
      json.addresses = [
        createMockAddress({
          street: `${longWord} ${longWord} Street`,
          street2: `Suite ${longWord}`,
          city: longWord,
          deliveryInstructions: longWord,
        }),
      ];
      json.addressCount = json.addresses.length;
      await route.fulfill({
        response,
        json,
      });
    });

    await registerFreshCustomer(page);
    await page.setViewportSize({ width: 360, height: 800 });

    await addFirstProductToCart(page);

    await page.goto('/checkout');
    await expect(page.locator('form').getByText('Order Summary')).toBeVisible();

    // Verify "Use saved address on file" is selected and renders the long address lines
    const savedOption = page.locator('#address-option-saved');
    await expect(savedOption).toBeChecked();
    await expect(page.getByText(longWord).first()).toBeVisible();

    const placeOrderBtn = page.getByRole('button', { name: /place order/i });
    for (const width of [360, 390, 768]) {
      await page.setViewportSize({ width, height: 800 });
      await placeOrderBtn.scrollIntoViewIfNeeded();
      await expect(placeOrderBtn).toBeVisible();
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      const viewportWidth = await page.evaluate(
        () => document.documentElement.clientWidth,
      );
      expect(scrollWidth, `scrollWidth at ${width}px`).toBe(viewportWidth);
      expect(viewportWidth).toBe(width);
    }
  });
});

