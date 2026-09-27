import type { Metadata } from 'next';
import { shop } from '@/lib/shop';

/** Site identity and shared SEO defaults (not assembled Metadata). */
export const seoConfig = {
  siteName: shop.name,
  description: shop.description,
  defaultOgImagePath: '/opengraph-image',
  defaultTwitterImagePath: '/twitter-image',
} as const;

export const NO_INDEX_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
};

export const NO_INDEX_FOLLOW_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: true,
};

export const INDEX_FOLLOW_ROBOTS: Metadata['robots'] = {
  index: true,
  follow: true,
};
