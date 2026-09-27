import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Load .secrets if present (for local Playwright runs)
const secretsPath = path.resolve(process.cwd(), '.secrets');
if (fs.existsSync(secretsPath)) {
  const content = fs.readFileSync(secretsPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim();
      const cleanKey = key?.trim();
      if (cleanKey && val && !process.env[cleanKey]) {
        process.env[cleanKey] = val;
      }
    }
  }
}

const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    {
      name: 'guest',
      testMatch: /.*(smoke|catalog|shell|a11y-guest)\.spec\.ts/,
      fullyParallel: true,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'customer',
      testMatch: /.*(auth|session|cart|checkout|orders|account|journey|a11y-customer)\.spec\.ts/,
      fullyParallel: false,
      workers: 1,
      timeout: 120_000,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
