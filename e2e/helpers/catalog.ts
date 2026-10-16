import { expect, type Page } from '@playwright/test';
import { z } from 'zod';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const stockSchema = z.object({
  isAvailable: z.boolean(),
  availableQuantity: z.number(),
});

async function isInStock(page: Page, productId: number): Promise<boolean> {
  const response = await page.request.get(
    `${API_BASE_URL}/v1/inventory/check/${productId}`,
  );
  if (!response.ok()) {
    return false;
  }
  const stock = stockSchema.parse(await response.json());
  return stock.isAvailable && stock.availableQuantity > 0;
}

/**
 * Opens the first home page product card that has stock. The seed keeps some
 * products at zero stock, and their order on the home page is not stable.
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
    'No in-stock product on the home page. Check the API seed inventory.',
  );
}
