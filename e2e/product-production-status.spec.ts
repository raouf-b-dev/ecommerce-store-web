import { expect, test } from '@playwright/test';

// Production server HTML for product detail (ADR-0009). Run with
// `npm run test:e2e:prod`; `next dev` does not stream the same way.
const NOINDEX_META = /<meta name="robots" content="noindex"\s*\/?>/;

function headOf(html: string): string {
  const end = html.indexOf('</head>');
  return end === -1 ? '' : html.slice(0, end);
}

test.describe('product detail status in production', () => {
  test('valid product returns 200 and stays indexable', async ({ request }) => {
    const response = await request.get('/products/1');

    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toMatch(/<h1[^>]*>[^<]+<\/h1>/);
    expect(html).not.toMatch(NOINDEX_META);
  });

  for (const path of ['/products/0', '/products/abc', '/products/999999']) {
    test(`${path} is a soft 404 with noindex in the server head`, async ({
      request,
    }) => {
      const response = await request.get(path);

      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(headOf(html)).toMatch(NOINDEX_META);
      expect(html).toContain('Product not found');
    });
  }

  test('unknown routes keep a hard 404', async ({ request }) => {
    const response = await request.get('/definitely-not-a-route');

    expect(response.status()).toBe(404);
    expect(headOf(await response.text())).toMatch(NOINDEX_META);
  });
});
