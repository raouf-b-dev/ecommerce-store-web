import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';

const catalogResponseSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number().optional(),
});

export default async function globalSetup(): Promise<void> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  // 1. Verify API Connectivity
  try {
    const healthRes = await fetch(`${apiBaseUrl}/health`);
    if (!healthRes.ok) {
      throw new Error(`API health check returned HTTP ${healthRes.status}`);
    }
  } catch (error) {
    throw new Error(
      `E2E tests require a running API at ${apiBaseUrl}. Ensure the API is running before executing tests: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // 2. Verify Catalog Presence (Hard Fail if Empty)
  try {
    const catalogRes = await fetch(`${apiBaseUrl}/v1/products?limit=1`);
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
    );
  }

  // 3. Reset Customer Auth State
  if (process.env.E2E_SKIP_DB_SEED === '1') {
    console.log('[e2e global-setup] E2E_SKIP_DB_SEED=1 is set; bypassing db:seed:auth.');
    return;
  }

  const apiPath =
    process.env.E2E_API_REPO_PATH ||
    path.resolve(process.cwd(), '../ecommerce-store-api');

  if (!fs.existsSync(apiPath)) {
    throw new Error(
      `API repository not found at "${apiPath}". Set E2E_API_REPO_PATH or E2E_SKIP_DB_SEED=1.`,
    );
  }

  console.log(`[e2e global-setup] Seeding auth users via 'npm run db:seed:auth' in ${apiPath}...`);
  try {
    execSync('npm run db:seed:auth', {
      cwd: apiPath,
      stdio: 'inherit',
      timeout: 120_000,
      env: { ...process.env },
    });
    console.log('[e2e global-setup] Auth seed completed successfully.');
  } catch (error) {
    throw new Error(
      `Failed to seed auth users via 'npm run db:seed:auth' in ${apiPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
