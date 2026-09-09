import type { Metadata } from 'next';

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

export const DEFAULT_SITE_NAME = 'Storefront';
export const DEFAULT_SITE_DESCRIPTION =
  'Customer storefront for the E-commerce Store API.';
export const DEFAULT_OG_IMAGE_PATH = '/opengraph-image';
export const DEFAULT_TWITTER_IMAGE_PATH = '/twitter-image';
