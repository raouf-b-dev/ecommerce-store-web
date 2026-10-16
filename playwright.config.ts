import path from 'node:path';
import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';
import { chromiumLaunch } from './e2e/browser';

const E2E_ENV_KEYS = [
  'E2E_CUSTOMER_EMAIL',
  'E2E_CUSTOMER_PASSWORD',
  'E2E_CUSTOMER_NEW_PASSWORD',
] as const;

// GitHub Actions sets missing secrets to "". Treat those as unset so files can fill.
for (const key of E2E_ENV_KEYS) {
  if (process.env[key] === '') {
    delete process.env[key];
  }
}

// Defaults from tracked example, then gitignored .secrets, then .env.local.
// process.loadEnvFile does not override keys already set (non-empty GH secrets win).
for (const name of ['.secrets.example', '.secrets', '.env.local']) {
  try {
    process.loadEnvFile(path.resolve(process.cwd(), name));
  } catch {
    // Missing or unreadable; continue.
  }
}

const launch = chromiumLaunch();

const guestTestMatch = /.*(smoke|catalog|shell|a11y-guest)\.spec\.ts/;

const pixelDevice = devices['Pixel 5'];
const pixelViewport = pixelDevice.viewport;
if (!pixelViewport) {
  throw new Error('expected Pixel 5 to define a viewport');
}

const iphoneDevice = devices['iPhone 14'];
const iphoneViewport = iphoneDevice.viewport;
if (!iphoneViewport) {
  throw new Error('expected iPhone 14 to define a viewport');
}

type BrowserUse = NonNullable<PlaywrightTestConfig['use']>;

function chromiumUse(overrides: BrowserUse = {}): BrowserUse {
  return {
    ...overrides,
    browserName: 'chromium',
    ...(launch.channel ? { channel: launch.channel } : {}),
    ...(launch.executablePath
      ? { launchOptions: { executablePath: launch.executablePath } }
      : {}),
  };
}

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // The CI default (dot) prints no newline per test, so the Actions log looks stalled.
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'guest',
      testMatch: guestTestMatch,
      fullyParallel: true,
      use: chromiumUse({ ...devices['Desktop Chrome'] }),
    },
    {
      name: 'pixel',
      testMatch: guestTestMatch,
      fullyParallel: true,
      use: chromiumUse({
        ...pixelDevice,
        viewport: { width: 375, height: pixelViewport.height },
      }),
    },
    {
      name: 'iphone',
      testMatch: guestTestMatch,
      fullyParallel: true,
      // Chromium with an iPhone viewport (same pattern as the admin dashboard).
      // WebKit would require a separate CDN download and drops Secure cookies on http://localhost.
      use: chromiumUse({
        ...iphoneDevice,
        viewport: { width: iphoneViewport.width, height: iphoneViewport.height },
      }),
    },
    {
      // workers: 1 runs files in path order. `00-forced-password` sorts first so
      // the one-shot must-change-password flow runs before other seeded logins.
      // No project dependency: a failure here must not skip the rest of customer.
      name: 'customer',
      testMatch:
        /.*(00-forced-password|auth|session|cart|checkout|orders|account|journey|a11y-customer)\.spec\.ts/,
      fullyParallel: false,
      workers: 1,
      timeout: 120_000,
      use: chromiumUse({ ...devices['Desktop Chrome'] }),
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
