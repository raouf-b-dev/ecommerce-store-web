#!/usr/bin/env node
/**
 * One-time Chromium install (and again after a Playwright upgrade).
 * Not a pretest hook: CI installs in the workflow, and local runs use the
 * bundled binary when it exists, otherwise installed Google Chrome.
 *
 * Slow or blocked CDN:
 *   set PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT=300000
 *   set PLAYWRIGHT_DOWNLOAD_HOST=https://storage.googleapis.com
 *   npm run playwright:install
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const timeoutMs = process.env.PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT ?? '180000';
const playwrightCli = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'node_modules',
  'playwright',
  'cli.js',
);

console.log(
  `[e2e] Installing Playwright Chromium (download timeout ${timeoutMs}ms)...`,
);

const result = spawnSync(process.execPath, [playwrightCli, 'install', 'chromium'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT: timeoutMs,
  },
});

if (result.status === 0) {
  process.exit(0);
}

console.error(`
[e2e] Browser download failed (often a slow or blocked CDN).

Retry:
  set PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT=300000
  set PLAYWRIGHT_DOWNLOAD_HOST=https://storage.googleapis.com
  npm run playwright:install

Until that succeeds, \`npm run test:e2e\` uses installed Google Chrome.
`);
process.exit(result.status ?? 1);
