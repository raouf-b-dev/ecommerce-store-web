import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const PROD_PORT = 3199;

export default defineConfig({
  testDir: './e2e',
  testMatch: /product-production-status\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PROD_PORT}`,
    trace: 'on-first-retry',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: `npm run build && npx next start -p ${PROD_PORT}`,
    url: `http://localhost:${PROD_PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_STOREFRONT_ORIGIN: 'https://storefront.test',
      NEXT_PUBLIC_API_BASE_URL:
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    },
  },
});
