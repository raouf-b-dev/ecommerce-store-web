import { expect, test, type Page } from '@playwright/test';
import { openInStockProduct } from './helpers/catalog';

const MD_BREAKPOINT = 768;

function viewportWidth(page: Page): number {
  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error('expected a viewport');
  }
  return viewport.width;
}

async function expectSortControl(page: Page) {
  if (viewportWidth(page) < MD_BREAKPOINT) {
    await page.getByRole('button', { name: 'Filters' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Filter and sort' }).getByRole('combobox', {
        name: 'Sort by',
      }),
    ).toBeVisible();
    return;
  }

  await expect(page.getByRole('combobox', { name: 'Sort products' })).toBeVisible();
}

async function chooseLowToHighPrice(page: Page) {
  if (viewportWidth(page) < MD_BREAKPOINT) {
    await page.getByRole('button', { name: 'Filters' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filter and sort' });
    await sheet.getByRole('combobox', { name: 'Sort by' }).click();
    await page.getByRole('option', { name: 'Price: low to high' }).click();
    await sheet.getByRole('button', { name: 'Show results' }).click();
    return;
  }

  await page.getByRole('combobox', { name: 'Sort products' }).click();
  await page.getByRole('option', { name: 'Price: low to high' }).click();
}

test.describe('Catalog storefront', () => {
  test('homepage leads with the hero, category tiles, and new arrivals', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Shop by category', level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'New arrivals', level: 2 }),
    ).toBeVisible();
    await expect(
      page.locator('#categories a[href*="categoryId="]').first(),
    ).toBeVisible();
    await expect(
      page.locator('main a[href^="/products/"]').first(),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Shop all products' }).first().click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(
      page.getByRole('heading', { name: 'All products', level: 1 }),
    ).toBeVisible();
  });

  test('renders the full catalog with products and category navigation', async ({
    page,
  }) => {
    await page.goto('/products');

    await expect(
      page.getByRole('heading', { name: 'All products', level: 1 }),
    ).toBeVisible();
    await expect(page).toHaveTitle('All products | Everyday Goods');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /https?:\/\/[^/]+\/products$/,
    );

    await expect(
      page.getByRole('navigation', { name: 'Categories' }),
    ).toBeVisible();

    await expect(
      page
        .getByRole('navigation', { name: 'Categories' })
        .getByRole('link', { name: 'All Products', exact: true }),
    ).toBeVisible();

    await expect(
      page.getByRole('searchbox', { name: 'Search products' }),
    ).toBeVisible();

    const cards = page.locator('main a[href^="/products/"]');
    await expect(cards.first()).toBeVisible();
    await expectSortControl(page);
  });

  test('applies price ascending from the inline sort or the filters sheet', async ({
    page,
  }) => {
    await page.goto('/products');

    await chooseLowToHighPrice(page);

    await expect(page).toHaveURL(/sortBy=price&sortOrder=asc/);
  });

  test('declares correct canonical, title, social metadata, and image routes on homepage', async ({
    page,
    request,
  }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Everyday Goods');

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      'href',
      /https?:\/\/[^/?#]+(?:\/)?$/,
    );

    // Robots should be index, follow
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow',
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Everyday Goods',
    );
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'Everyday Goods',
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
    await page.goto('/products');

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

    await expect(page).toHaveTitle('All products - Page 2 | Everyday Goods');

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      'href',
      /https?:\/\/[^/]+\/products\?page=2$/,
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
    await page.goto('/products');

    const categoryNav = page.getByRole('navigation', { name: 'Categories' });
    await expect(categoryNav).toBeVisible();

    const categoryLink = categoryNav.locator('a[href*="categoryId="]').first();
    await expect(categoryLink).toBeVisible();
    const categoryName = (await categoryLink.textContent())?.trim();
    const href = await categoryLink.getAttribute('href');
    if (!href || !/categoryId=\d+/.test(href)) {
      throw new Error(
        `expected category pill href to include categoryId, got ${href ?? 'null'}`,
      );
    }

    await Promise.all([
      page.waitForURL(/categoryId=\d+/, { timeout: 15_000 }),
      categoryLink.click(),
    ]);

    const activeCategory = categoryNav.locator('a[aria-current="page"]');
    await expect(activeCategory).toBeVisible();
    if (categoryName) {
      await expect(activeCategory).toHaveText(categoryName);
    }

    if (categoryName) {
      await expect(page).toHaveTitle(
        new RegExp(`${categoryName} \\| Everyday Goods`),
      );
    }

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      'href',
      /https?:\/\/[^/]+\/products\?categoryId=\d+$/,
    );

    const cards = page.locator('main a[href^="/products/"]');
    await expect(cards.first()).toBeVisible();
  });

  test('submitting search filters product list and applies noindex, follow with normalized self-canonical', async ({
    page,
  }) => {
    await page.goto('/products');

    await expect(
      page.getByRole('search', { name: 'Search and filter products' }),
    ).toBeVisible();

    const search = page.getByRole('searchbox', { name: 'Search products' });
    await search.fill('Headphones');

    // Desktop exposes Apply; below md the form submits on Enter only.
    if (viewportWidth(page) >= MD_BREAKPOINT) {
      await Promise.all([
        page.waitForURL(/search=Headphones/, { timeout: 15_000 }),
        page.getByRole('button', { name: 'Apply' }).click(),
      ]);
    } else {
      await Promise.all([
        page.waitForURL(/search=Headphones/, { timeout: 15_000 }),
        search.press('Enter'),
      ]);
    }

    // Check noindex, follow policy on search
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow',
    );

    // Check normalized self-canonical
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      'href',
      /https?:\/\/[^/]+\/products\?search=Headphones$/,
    );

    const cards = page.locator('main a[href^="/products/"]');
    await expect(cards.first()).toBeVisible();
    await expect(cards.first().locator('h3')).toContainText(/Headphones/i);
  });

  test('custom sort applies noindex, follow with normalized self-canonical', async ({
    page,
  }) => {
    await page.goto('/products?sortBy=price');

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow',
    );

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      'href',
      /https?:\/\/[^/]+\/products\?sortBy=price$/,
    );
  });

  test('non-matching search renders in-page empty state rather than 404', async ({
    page,
  }) => {
    await page.goto('/products?search=xyznonexistentproduct99999');

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
    const { name: productTitle } = await openInStockProduct(page);

    // Assert heading matches product
    await expect(
      page.getByRole('heading', { name: productTitle, level: 1 }),
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
    await expect(page.getByText(/In stock \(\d+ available\)/)).toBeVisible();

    // Add to cart CTA is active and enabled
    const addToCartBtn = page.getByRole('button', { name: /Add to cart/i });
    await expect(addToCartBtn).toBeVisible();
    await expect(addToCartBtn).toBeEnabled();

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
    expect(productSchema.name).toBe(productTitle);
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
    await page.goto('/products?categoryId=invalid');

    await expect(page).toHaveTitle('Category Not Found | Everyday Goods');
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
    // (exact category IDs depend on seed data - assert shape only when present)
    if (sitemapBody.includes('categoryId=')) {
      expect(sitemapBody).toMatch(/categoryId=\d+/);
    }

    // 3. Out-of-range or malformed sitemap IDs return HTTP 404 (not empty 200)
    const outOfRangeResponse = await request.get('/sitemap/999.xml');
    expect(outOfRangeResponse.status()).toBe(404);

    const malformedResponse = await request.get('/sitemap/abc.xml');
    expect(malformedResponse.status()).toBe(404);
  });

  // `next dev` answers 404 here while production streams a 200 soft 404 (ADR-0009),
  // so the status code is asserted only in product-production-status.spec.ts.
  test('invalid and missing product IDs render a noindex product not-found UI', async ({
    page,
  }) => {
    for (const path of ['/products/0', '/products/999999']) {
      await page.goto(path);

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
    }
  });

  test('out-of-range page redirects to last valid page while preserving filters', async ({
    page,
  }) => {
    const cards = page.locator('main a[href^="/products/"]');

    // Parallel guest/pixel/iphone runs can truncate the RSC redirect payload
    // (Next.js "Unexpected end of JSON input" overlay). Retry the navigation.
    await expect(async () => {
      await page.goto('/products?sortBy=name&sortOrder=asc&page=999');
      await expect(page).not.toHaveURL(/page=999/, { timeout: 10_000 });
      await expect(cards.first()).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 45_000 });

    // Seed length can change; assert clamp + filter preservation, not a fixed page number.
    await expect(page).toHaveURL(/\/products\?/);
    await expect(page).toHaveURL(/sortBy=name/);
    await expect(page).toHaveURL(/sortOrder=asc/);

    const paginationNav = page.getByRole('navigation', { name: 'Pagination' });
    await expect(paginationNav).toBeVisible();
    // On the last page the Next control is omitted.
    await expect(
      paginationNav.getByRole('link', { name: 'Go to next page' }),
    ).toHaveCount(0);
    await expect(
      paginationNav.locator('[aria-current="page"]'),
    ).toBeVisible();
  });
});
