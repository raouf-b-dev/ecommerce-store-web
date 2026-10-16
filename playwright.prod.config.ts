import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig, devices } from '@playwright/test';
import { chromiumLaunch } from './e2e/browser';

const launch = chromiumLaunch();
const PROD_PORT = 3199;

// Node-side MSW answers the RSC catalog fetches, so no API has to run. The browser
// worker stays off: mock mode renders nothing on the server until it starts.
const mockPreloadUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts', 'mock-server-preload.mjs'),
).href;

export default defineConfig({
  testDir: './e2e',
  testMatch: /product-production-status\.spec\.ts/,
  globalSetup: './e2e/browser-global-setup.ts',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PROD_PORT}`,
    trace: 'on-first-retry',
    browserName: 'chromium',
    ...(launch.channel ? { channel: launch.channel } : {}),
    ...(launch.executablePath
      ? { launchOptions: { executablePath: launch.executablePath } }
      : {}),
  },
  webServer: {
    command: `npm run build && npx next start -p ${PROD_PORT}`,
    url: `http://localhost:${PROD_PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_STOREFRONT_ORIGIN: 'https://storefront.test',
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_ENABLE_MOCK: 'false',
      NODE_OPTIONS: `--import=${mockPreloadUrl}`,
    },
  },
});
