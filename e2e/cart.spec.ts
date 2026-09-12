import { expect, test } from '@playwright/test';
import { registerFreshCustomer } from './helpers/auth';

test.describe('Cart and Checkout Entrypoint', () => {
  test('redirects unauthenticated guest accessing /cart to login with redirect param', async ({
    page,
  }) => {
    await page.goto('/cart');

    await expect(page).toHaveURL(/\/login\?redirect=%2Fcart/);
    await expect(
      page.getByRole('heading', { name: 'Sign in', level: 1 }),
    ).toBeVisible();
  });

  test('redirects unauthenticated guest attempting to add to cart to login', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to the first product card
    const firstProduct = page.locator('main a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();

    await expect(page).toHaveURL(/\/products\/\d+/);

    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    await expect(page).toHaveURL(/\/login\?redirect=%2Fproducts%2F\d+/);
  });

  test('has noindex, nofollow robots metadata on /cart', async ({ page }) => {
    await registerFreshCustomer(page);
    await page.goto('/cart');

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
  });

  test('authenticated customer can add products, view cart, adjust quantity, and clear cart', async ({
    page,
  }) => {
    await registerFreshCustomer(page);

    await page.goto('/');
    const firstProduct = page.locator('main a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible();

    await firstProduct.click();

    await expect(page).toHaveURL(/\/products\/\d+/);

    // Wait for availability check and add to cart button
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    // Verify toast notification
    await expect(page.getByText(/added .* to cart/i)).toBeVisible();

    // Check header badge count
    const headerCartBadge = page.getByRole('link', {
      name: /shopping cart, \d+ items/i,
    });
    await expect(headerCartBadge).toBeVisible();

    // Navigate to cart
    await headerCartBadge.click();
    await expect(page).toHaveURL(/\/cart/);

    // Verify cart contents
    await expect(
      page.getByRole('heading', { name: 'Shopping Cart', level: 1 }),
    ).toBeVisible();
    await expect(page.getByText('Order Summary')).toBeVisible();

    // Verify item row is rendered
    const itemRows = page.locator('[data-testid^="cart-item-"]');
    await expect(itemRows).toHaveCount(1);

    // Increase quantity
    const increaseBtn = page.getByRole('button', {
      name: /increase quantity/i,
    });
    await increaseBtn.click();

    // Verify quantity updated to 2
    await expect(itemRows.getByText('2', { exact: true })).toBeVisible();

    // Clear the cart
    const clearCartBtn = page.getByRole('button', {
      name: /clear shopping cart/i,
    });
    await clearCartBtn.click();

    // Verify empty state is displayed
    await expect(
      page.getByRole('heading', { name: 'Your cart is empty', level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /explore products/i }),
    ).toBeVisible();
  });
});
