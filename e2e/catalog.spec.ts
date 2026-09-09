import { expect, test } from '@playwright/test';

test.describe('Catalog storefront', () => {
  test('renders catalog home with products and category navigation', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Products', level: 1 }),
    ).toBeVisible();

    await expect(
      page.getByRole('navigation', { name: 'Categories' }),
    ).toBeVisible();

    await expect(
      page.getByRole('link', { name: 'All Products' }),
    ).toBeVisible();

    // Check that search filter exists
    await expect(page.getByLabel('Search')).toBeVisible();
    await expect(page.getByLabel('Sort By')).toBeVisible();
    await expect(page.getByLabel('Order')).toBeVisible();

    // Assert that product cards or empty state render
    const cards = page.locator('main a[href^="/products/"]');
    await expect(cards.first()).toBeVisible();
  });

  test('navigates pagination unconditionally against seeded catalog and verifies products differ', async ({
    page,
  }) => {
    await page.goto('/');

    const cards = page.locator('main a[href^="/products/"]');
    await expect(cards.first()).toBeVisible();
    const pageOneFirstTitle = await cards.first().locator('h3').textContent();
    expect(pageOneFirstTitle).toBeTruthy();

    const paginationNav = page.getByRole('navigation', { name: 'Pagination' });
    await expect(paginationNav).toBeVisible();

    const pageTwoLink = paginationNav.getByRole('link', {
      name: 'Page 2',
    });
    await expect(pageTwoLink).toBeVisible();
    await pageTwoLink.click();

    await expect(page).toHaveURL(/(?:[?&])page=2(?:&|$)/);
    await expect(pageTwoLink).toHaveAttribute('aria-current', 'page');

    await expect(cards.first()).toBeVisible();
    const pageTwoFirstTitle = await cards.first().locator('h3').textContent();
    expect(pageTwoFirstTitle).toBeTruthy();
    expect(pageTwoFirstTitle?.trim()).not.toBe(pageOneFirstTitle?.trim());
  });

  test('selecting category filters products and round-trips through URL', async ({
    page,
  }) => {
    await page.goto('/');

    const categoryNav = page.getByRole('navigation', { name: 'Categories' });
    await expect(categoryNav).toBeVisible();

    const categoryLink = categoryNav.locator('a[href*="categoryId="]').first();
    await expect(categoryLink).toBeVisible();
    await categoryLink.click();

    await expect(page).toHaveURL(/categoryId=\d+/);
    await expect(categoryLink).toHaveAttribute('aria-current', 'page');

    const cards = page.locator('main a[href^="/products/"]');
    await expect(cards.first()).toBeVisible();
  });

  test('submitting search filters product list and round-trips to URL', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByLabel('Search').fill('Headphones');
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect(page).toHaveURL(/search=Headphones/);

    const cards = page.locator('main a[href^="/products/"]');
    await expect(cards.first()).toBeVisible();
    await expect(cards.first().locator('h3')).toContainText(/Headphones/i);
  });

  test('non-matching search renders in-page empty state rather than 404', async ({
    page,
  }) => {
    await page.goto('/?search=xyznonexistentproduct99999');

    await expect(page.getByText('No products found')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Clear all filters' }),
    ).toBeVisible();

    // Verify it is not a 404 page
    await expect(page.getByText('Product not found')).not.toBeVisible();
  });

  test('navigates to product detail and displays details, availability, and JSON-LD', async ({
    page,
  }) => {
    await page.goto('/');

    const firstProduct = page.locator('main a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible();

    const productTitle = await firstProduct.locator('h3').textContent();
    expect(productTitle).toBeTruthy();

    await firstProduct.click();

    await expect(page).toHaveURL(/\/products\/\d+/);

    // Assert heading matches product
    await expect(
      page.getByRole('heading', { name: productTitle!.trim(), level: 1 }),
    ).toBeVisible();

    // Breadcrumbs
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumbs' }),
    ).toBeVisible();

    // Stock availability indicator
    await expect(page.getByText(/In stock|Out of stock/i)).toBeVisible();

    // Add to cart preview button
    const addToCartBtn = page.getByRole('button', { name: /Add to cart/i });
    await expect(addToCartBtn).toBeVisible();
    await expect(addToCartBtn).toBeDisabled();

    // Verify JSON-LD Schema.org script
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdScript).toBeAttached();

    const jsonText = await jsonLdScript.textContent();
    expect(jsonText).toBeTruthy();

    const parsed = JSON.parse(jsonText!);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('Product');
    expect(parsed.name).toBe(productTitle!.trim());
  });

  test('navigating to invalid product ID displays 404 page', async ({
    page,
  }) => {
    await page.goto('/products/0');

    await expect(
      page.getByRole('heading', { name: 'Product not found', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Back to catalog' }),
    ).toBeVisible();
  });

  test('out-of-range page redirects to last valid page while preserving filters', async ({
    page,
  }) => {
    await page.goto('/?sortBy=name&sortOrder=asc&page=999');

    // Should redirect to the last available page (page 2 in the seeded catalog) preserving filters
    await expect(page).toHaveURL(/\/\?sortBy=name&sortOrder=asc&page=2$/);

    const cards = page.locator('main a[href^="/products/"]');
    await expect(cards.first()).toBeVisible();

    // Verify pagination active state points to the last page
    const paginationNav = page.getByRole('navigation', { name: 'Pagination' });
    await expect(paginationNav).toBeVisible();
    const activePage = paginationNav.locator('[aria-current="page"]');
    await expect(activePage).toHaveText('2');
  });
});
