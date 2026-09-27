export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3100';
export const THEME_STORAGE_KEY = 'store-ui-theme';

/** Force a theme for portfolio stills (`light` or `dark`). */
export async function applyTheme(page, theme) {
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: THEME_STORAGE_KEY, value: theme },
  );
}

/** @deprecated Prefer applyTheme(page, 'light'). */
export async function applyLightTheme(page) {
  await applyTheme(page, 'light');
}

/** Switch to dark theme via the header toggle (walkthrough demo). */
export async function switchToDarkTheme(page) {
  const darkRadio = page.getByRole('radio', { name: /dark theme/i });
  if ((await darkRadio.count()) > 0) {
    await darkRadio.click();
  }
  await page.evaluate(
    ({ key }) => {
      localStorage.setItem(key, 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    },
    { key: THEME_STORAGE_KEY },
  );
  await page.waitForTimeout(600);
}

/** Remove Sonner toasts so they do not appear in portfolio stills. */
export async function dismissToasts(page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll(
      '[data-sonner-toast], [data-sonner-toaster], ol[data-sonner-toaster]',
    )) {
      el.remove();
    }
  });
}

/** Hide Next.js dev overlays (issue badge, toasts, build watcher). */
export async function hideDevOverlay(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-toast],
      [data-next-badge-root],
      [data-nextjs-dev-tools-button],
      #__next-build-watcher,
      [data-nextjs-dialog-overlay] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `,
  });
}

export async function captureScreenshot(page, filePath) {
  await hideDevOverlay(page);
  await dismissToasts(page);
  await page.screenshot({ path: filePath });
}

export async function mockLogin(page, baseUrl = BASE_URL) {
  await page.goto(`${baseUrl}/login`);
  await page.waitForSelector('text=Fill demo customer credentials', { timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.click('text=Fill demo customer credentials');
  await page.waitForTimeout(300);
  await page.click('button[type="submit"]:has-text("Sign in")');
  await page.waitForURL(
    (url) =>
      url.pathname === '/' ||
      url.pathname.startsWith('/products') ||
      url.pathname.startsWith('/account'),
    { timeout: 30_000 },
  );
}

export async function waitForCatalogReady(page) {
  await page.waitForSelector('a[href^="/products/"]', { timeout: 20_000 });
}

export async function openFirstProduct(page) {
  await waitForCatalogReady(page);
  const productLink = page.locator('a[href^="/products/"]').first();
  await productLink.click();
  await page.waitForURL(/\/products\/\d+/, { timeout: 15_000 });
  await page.waitForSelector('button:has-text("Add to cart")', { timeout: 15_000 });
}

export async function addCurrentProductToCart(page) {
  await page.waitForSelector('button:has-text("Add to cart")', { timeout: 15_000 });
  await page.click('button:has-text("Add to cart")');
  await page.waitForSelector('a[aria-label="Shopping cart, 1 items"]', {
    timeout: 15_000,
  });
}

export async function openCartViaHeader(page) {
  await page.click('a[aria-label^="Shopping cart"]');
  await page.waitForURL(/\/cart/, { timeout: 15_000 });
  await page.waitForSelector('text=Proceed to Checkout', { timeout: 15_000 });
}

export async function openCheckoutViaCart(page) {
  await page.click('a:has-text("Proceed to Checkout")');
  await page.waitForURL(/\/checkout/, { timeout: 15_000 });
  await page.waitForSelector('button[type="submit"]:has-text("Place Order")', {
    timeout: 20_000,
  });
}

export async function fillCheckoutAddress(page) {
  await page.waitForSelector('#firstName', { timeout: 15_000 });
  await page.fill('#firstName', 'Demo');
  await page.fill('#lastName', 'Customer');
  await page.fill('#street', '123 Demo Street');
  await page.fill('#city', 'Austin');
  await page.fill('#state', 'TX');
  await page.fill('#postalCode', '78701');
  await page.fill('#country', 'US');
}

export async function submitCheckout(page) {
  const placeOrder = page.locator('button[type="submit"]:has-text("Place Order")');
  if (await placeOrder.isVisible()) {
    const firstName = page.locator('#firstName');
    if (await firstName.isVisible()) {
      const value = await firstName.inputValue();
      if (!value) {
        await fillCheckoutAddress(page);
      }
    }
    await placeOrder.click();
  }
  await page.waitForSelector('text=Thank You For Your Order!', { timeout: 20_000 });
}
