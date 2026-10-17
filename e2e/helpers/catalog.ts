import { expect, type Page } from '@playwright/test';
import { z } from 'zod';
import { E2E_API_BASE_URL } from './env';

// Checkout specs buy one unit per run and retry, and the seed has products
// with only 3 or 4 units. Require headroom so a run cannot drain one.
const MIN_CHECKOUT_STOCK = 20;

const stockSchema = z.object({
  isAvailable: z.boolean(),
  availableQuantity: z.number(),
});

async function isInStock(page: Page, productId: number): Promise<boolean> {
  const response = await page.request.get(
    `${E2E_API_BASE_URL}/v1/inventory/check/${productId}`,
  );
  if (!response.ok()) {
    return false;
  }
  const stock = stockSchema.parse(await response.json());
  return stock.isAvailable && stock.availableQuantity >= MIN_CHECKOUT_STOCK;
}

/**
 * Opens the first home page product card with at least MIN_CHECKOUT_STOCK
 * units. The seed keeps some products at zero or low stock, and their order
 * on the home page is not stable.
 */
export async function openInStockProduct(
  page: Page,
): Promise<{ name: string }> {
  await page.goto('/');
  const cards = page.locator('main a[href^="/products/"]');
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });

  const hrefs = await cards.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href') ?? ''),
  );

  for (const href of new Set(hrefs)) {
    const productId = Number(href.split('/').pop());
    if (!Number.isInteger(productId) || !(await isInStock(page, productId))) {
      continue;
    }

    const card = page.locator(`main a[href="${href}"]`).first();
    const name = (await card.locator('h3').first().textContent())?.trim();
    if (!name) {
      throw new Error(`Product card ${href} has no heading`);
    }
    await card.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`), { timeout: 15_000 });
    return { name };
  }

  throw new Error(
    `No product with at least ${MIN_CHECKOUT_STOCK} units on the home page. Check the API seed inventory.`,
  );
}
