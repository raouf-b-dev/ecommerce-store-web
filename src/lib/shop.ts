/**
 * Shopper-facing shop identity. Header, footer, document title, metadata, and
 * social cards read this module. A future brand replaces this file, the color
 * variables in src/app/globals.css, and src/app/icon.svg. The current values
 * are a neutral placeholder, not a brand decision.
 */
export const shop = {
  name: 'Everyday Goods',
  tagline: 'Well-made things for every day.',
  description:
    'Headphones, hoodies, planters, yoga mats, and books, picked for daily use and shipped from stock.',
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
