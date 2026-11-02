/**
 * Shopper-facing shop identity. Header, footer, document title, metadata,
 * social cards, and the Contact page support address read this module. A future
 * brand replaces this file, the color variables in src/app/globals.css, and
 * src/app/icon.svg. The current values are a neutral placeholder, not a brand
 * decision.
 */
export const shop = {
  name: 'Everyday Goods',
  tagline: 'Well-made things for every day.',
  description:
    'Headphones, hoodies, planters, yoga mats, and books, picked for daily use and shipped from stock.',
  /**
   * Replace this with your own support address before going live; the Contact
   * page reads it.
   */
  supportEmail: 'support@example.com',
  /** Path of the favicon mark, reused by the header so the mark has one source. */
  markPath: '/icon.svg',
  /** Hex copies of the accent for image generators that cannot read CSS variables. */
  socialColors: {
    background: '#0d1914',
    accent: '#1b6047',
    text: '#fafafa',
    muted: '#a3b8ae',
  },
} as const;

const PLACEHOLDER_SUPPORT_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
]);

/**
 * True when the support address still uses a reserved example/test domain so
 * Contact must stay out of search indexes until a real address is set.
 * Defaults to `shop.supportEmail`.
 */
export function hasPlaceholderSupportEmail(
  email: string = shop.supportEmail,
): boolean {
  const at = email.lastIndexOf('@');
  if (at < 0) {
    return true;
  }
  const domain = email.slice(at + 1).toLowerCase();
  return (
    PLACEHOLDER_SUPPORT_EMAIL_DOMAINS.has(domain) ||
    domain.endsWith('.example') ||
    domain.endsWith('.test')
  );
}
