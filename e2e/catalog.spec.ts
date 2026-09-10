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

  test('declares correct canonical, title, social metadata, and image routes on homepage', async ({
    page,
    request,
  }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Browse Products | Storefront');

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /https?:\/\/[^/?#]+(?:\/)?$/);

    // Robots should be index, follow
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow',
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Browse Products | Storefront',
    );
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'Storefront',
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/opengraph-image/,
    );

    // Twitter Card
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      'content',
      /\/twitter-image/,
    );

    // Assert social image endpoints return HTTP 200 with image/png
    const ogResponse = await request.get('/opengraph-image');
    expect(ogResponse.status()).toBe(200);
    expect(ogResponse.headers()['content-type']).toContain('image/png');

    const twitterResponse = await request.get('/twitter-image');
    expect(twitterResponse.status()).toBe(200);
    expect(twitterResponse.headers()['content-type']).toContain('image/png');
  });

  test('navigates pagination unconditionally against seeded catalog and verifies products and metadata', async ({
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

    await expect(page).toHaveTitle('Browse Products - Page 2 | Storefront');

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      'href',
      /https?:\/\/[^/]+\/\?page=2$/,
    );

    // Page 2 should remain indexable (index, follow)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow',
    );

    await expect(cards.first()).toBeVisible();
    const pageTwoFirstTitle = await cards.first().locator('h3').textContent();
    expect(pageTwoFirstTitle).toBeTruthy();
    expect(pageTwoFirstTitle?.trim()).not.toBe(pageOneFirstTitle?.trim());
  });

  test('selecting category filters products and round-trips through URL with self-canonical', async ({
    page,
  }) => {
    await page.goto('/');

    const categoryNav = page.getByRole('navigation', { name: 'Categories' });
    await expect(categoryNav).toBeVisible();

    const categoryLink = categoryNav.locator('a[href*="categoryId="]').first();
    await expect(categoryLink).toBeVisible();
    const categoryName = (await categoryLink.textContent())?.trim();
    await categoryLink.click();

    await expect(page).toHaveURL(/categoryId=\d+/);
    await expect(categoryLink).toHaveAttribute('aria-current', 'page');

    if (categoryName) {
      await expect(page).toHaveTitle(new RegExp(`${categoryName} \\| Storefront`));
    }

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      'href',
      /https?:\/\/[^/]+\/\?categoryId=\d+$/,
    );

    const cards = page.locator('main a[href^="/products/"]');
    await expect(cards.first()).toBeVisible();
  });

  test('submitting search filters product list and applies noindex, follow with normalized self-canonical', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByLabel('Search').fill('Headphones');
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect(page).toHaveURL(/search=Headphones/);

    // Check noindex, follow policy on search
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow',
    );

    // Check normalized self-canonical
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      'href',
      /https?:\/\/[^/]+\/\?search=Headphones$/,
    );

    const cards = page.locator('main a[href^="/products/"]');
    await expect(cards.first()).toBeVisible();
    await expect(cards.first().locator('h3')).toContainText(/Headphones/i);
  });

  test('custom sort applies noindex, follow with normalized self-canonical', async ({
    page,
  }) => {
    await page.goto('/?sortBy=price');

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow',
    );

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      'href',
      /https?:\/\/[^/]+\/\?sortBy=price$/,
    );
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

  test('navigates to product detail and displays details, availability, canonical, and structured data', async ({
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

    // Canonical link tag
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      'href',
      /https?:\/\/[^/]+\/products\/\d+$/,
    );

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

    // Open Graph type must be 'website'
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'website',
    );

    // Verify JSON-LD Schema.org scripts: both Product and BreadcrumbList
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdScripts).toHaveCount(2);

    const scriptContents = await jsonLdScripts.allTextContents();
    const schemas = scriptContents.map((text) => JSON.parse(text));

    const productSchema = schemas.find((s) => s['@type'] === 'Product');
    expect(productSchema).toBeDefined();
    expect(productSchema['@context']).toBe('https://schema.org');
    expect(productSchema.name).toBe(productTitle!.trim());
    expect(productSchema['@id']).toMatch(/https?:\/\/[^/]+\/products\/\d+$/);
    expect(productSchema.url).toMatch(/https?:\/\/[^/]+\/products\/\d+$/);

    const breadcrumbSchema = schemas.find(
      (s) => s['@type'] === 'BreadcrumbList',
    );
    expect(breadcrumbSchema).toBeDefined();
    expect(breadcrumbSchema['@context']).toBe('https://schema.org');
    expect(breadcrumbSchema.itemListElement.length).toBeGreaterThanOrEqual(2);
  });

  test('malformed category parameter emits noindex, follow without a canonical link', async ({
    page,
  }) => {
    await page.goto('/?categoryId=invalid');

    await expect(page).toHaveTitle('Category Not Found | Storefront');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow',
    );

    // Canonical link tag must be omitted on malformed category queries
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });

  test('sitemap partition returns HTTP 200 with XML content, and robots references it', async ({
    request,
  }) => {
    // 1. Verify robots.txt references /sitemap/0.xml
    const robotsResponse = await request.get('/robots.txt');
    expect(robotsResponse.status()).toBe(200);
    const robotsBody = await robotsResponse.text();
    expect(robotsBody).toContain('/sitemap/0.xml');

    // 2. Fetch sitemap partition /sitemap/0.xml
    const sitemapResponse = await request.get('/sitemap/0.xml');
    expect(sitemapResponse.status()).toBe(200);
    const contentType = sitemapResponse.headers()['content-type'] ?? '';
    expect(contentType).toContain('xml');

    const sitemapBody = await sitemapResponse.text();
    expect(sitemapBody).toContain('/products/');
    // Product entries expose honest lastmod from list updatedAt
    expect(sitemapBody).toContain('<lastmod>');
    // Non-empty categories may appear; empty ones must not be advertised via productCount=0
    // (exact category IDs depend on seed data — assert shape only when present)
    if (sitemapBody.includes('categoryId=')) {
      expect(sitemapBody).toMatch(/categoryId=\d+/);
    }

    // 3. Out-of-range or malformed sitemap IDs return HTTP 404 (not empty 200)
    const outOfRangeResponse = await request.get('/sitemap/999.xml');
    expect(outOfRangeResponse.status()).toBe(404);

    const malformedResponse = await request.get('/sitemap/abc.xml');
    expect(malformedResponse.status()).toBe(404);
  });

  test('invalid and missing product IDs return HTTP 404 with product not-found UI', async ({
    page,
    request,
  }) => {
    const malformed = await request.get('/products/0');
    expect(malformed.status()).toBe(404);

    const missing = await request.get('/products/999999');
    expect(missing.status()).toBe(404);

    await page.goto('/products/0');

    await expect(
      page.getByRole('heading', { name: 'Product not found', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Back to catalog' }),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/,
    );
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
