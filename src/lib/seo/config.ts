// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { Metadata } from 'next';

/** Site identity and shared SEO defaults (not assembled Metadata). */
export const seoConfig = {
  siteName: 'Storefront',
  description: 'Customer storefront for the E-commerce Store API.',
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
