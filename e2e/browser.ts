import fs from 'node:fs';
import { chromium, type Browser } from '@playwright/test';

type ChromiumLaunch = {
  channel?: 'chrome';
  executablePath?: string;
};

/**
 * CI and a completed `npm run playwright:install` use bundled Chromium.
 * A local machine without that binary falls back to installed Google Chrome
 * so a blocked Playwright CDN does not stop the suite.
 */
export function chromiumLaunch(): ChromiumLaunch {
  const override = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  if (override) {
    return { executablePath: override };
  }
  if (process.env.CI || fs.existsSync(chromium.executablePath())) {
    return {};
  }
  return { channel: 'chrome' };
}

/** One error before the suite, instead of a launch failure per test. */
export async function assertBrowserReady(): Promise<void> {
  const launch = chromiumLaunch();
  if (launch.executablePath) {
    if (!fs.existsSync(launch.executablePath)) {
      throw new Error(
        `PLAYWRIGHT_EXECUTABLE_PATH does not exist: ${launch.executablePath}`,
      );
    }
    return;
  }

  if (!launch.channel) {
    if (!fs.existsSync(chromium.executablePath())) {
      throw new Error(
        'Playwright Chromium is not installed. CI runs `npx playwright install --with-deps chromium` before the suite.',
      );
    }
    return;
  }

  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({ channel: 'chrome' });
  } catch (error) {
    throw new Error(
      'Google Chrome did not launch, and Playwright Chromium is not installed. Install Chrome, or run `npm run playwright:install` once.',
      { cause: error },
    );
  }
  await browser.close();
}
