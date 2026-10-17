import { z } from 'zod';
import { assertBrowserReady } from './browser';
import { E2E_API_BASE_URL } from './helpers/env';

const catalogResponseSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number().optional(),
});

// The Next server and every browser share one client IP, so the API default
// (100 requests per minute) returns 429 partway through the suite.
const MIN_GLOBAL_RATE_LIMIT = 1_000;

function assertRateLimitFitsSuite(response: Response, apiBaseUrl: string): void {
  const limit = Number(response.headers.get('x-ratelimit-limit'));
  if (!Number.isFinite(limit) || limit === 0 || limit >= MIN_GLOBAL_RATE_LIMIT) {
    return;
  }
  throw new Error(
    `API at ${apiBaseUrl} allows ${limit} requests per minute; the suite needs at least ${MIN_GLOBAL_RATE_LIMIT}. Set THROTTLE_GLOBAL_LIMIT=100000 in ecommerce-store-api/.env.development and restart the API (CI does the same).`,
  );
}

export default async function globalSetup(): Promise<void> {
  console.log('[e2e] Checking Playwright browser...');
  await assertBrowserReady();
  console.log('[e2e] Browser ready.');

  const apiBaseUrl = E2E_API_BASE_URL;

  console.log(`[e2e] Checking API health at ${apiBaseUrl}...`);
  try {
    const healthRes = await fetch(`${apiBaseUrl}/health`);
    if (!healthRes.ok) {
      throw new Error(`API health check returned HTTP ${healthRes.status}`);
    }
  } catch (error) {
    throw new Error(
      `E2E tests require a running API at ${apiBaseUrl}. Ensure the API is running before executing tests: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  console.log('[e2e] API health ok.');

  console.log('[e2e] Checking catalog has at least one product...');
  let catalogRes: Response;
  try {
    catalogRes = await fetch(`${apiBaseUrl}/v1/products?limit=1`);
    if (!catalogRes.ok) {
      throw new Error(`Catalog query returned HTTP ${catalogRes.status}`);
    }
    const rawData: unknown = await catalogRes.json();
    const parsed = catalogResponseSchema.safeParse(rawData);
    if (!parsed.success || parsed.data.items.length === 0) {
      throw new Error(
        `API catalog at ${apiBaseUrl} has 0 products or an invalid schema. Run 'npm run db:seed' in the API before running E2E tests.`,
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to verify active catalog data at ${apiBaseUrl}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  console.log('[e2e] Catalog ok.');

  console.log('[e2e] Checking global rate limit header...');
  assertRateLimitFitsSuite(catalogRes, apiBaseUrl);
  console.log('[e2e] Global setup done.');
}
