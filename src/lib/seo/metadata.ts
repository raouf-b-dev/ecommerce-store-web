// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { Metadata } from 'next';
import { seoConfig } from '@/lib/seo/config';
import { isValidAbsoluteHttpUrl } from '@/lib/seo/image-url';

export interface CreatePageMetadataOptions {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: Metadata['robots'];
  origin?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  openGraphType?: 'website' | 'article';
}

/**
 * Builds a declarative Next.js Metadata object adhering to root title templates,
 * validating image URLs, and preserving complete 1200x630 fallback social image metadata.
 */
type OgImageItem = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  type?: string;
};

export type PageOpenGraph = Extract<
  NonNullable<Metadata['openGraph']>,
  { type: 'website' | 'article' }
>;

export interface PageMetadata extends Metadata {
  openGraph?: PageOpenGraph;
}

export function createPageMetadata(
  options: CreatePageMetadataOptions,
): PageMetadata {
  const {
    title,
    description = seoConfig.description,
    canonicalUrl,
    robots,
    origin,
    imageUrl,
    imageAlt = title ?? seoConfig.siteName,
    openGraphType = 'website',
  } = options;

  const validImage = isValidAbsoluteHttpUrl(imageUrl) ? imageUrl.trim() : null;

  let ogImages: OgImageItem[] | undefined = undefined;
  let twitterImages: string[] | undefined = undefined;

  if (validImage) {
    ogImages = [
      {
        url: validImage,
        alt: imageAlt,
      },
    ];
    twitterImages = [validImage];
  } else if (origin) {
    ogImages = [
      {
        url: `${origin}${seoConfig.defaultOgImagePath}`,
        alt: imageAlt,
        width: 1200,
        height: 630,
        type: 'image/png',
      },
    ];
    twitterImages = [`${origin}${seoConfig.defaultTwitterImagePath}`];
  }

  const metadata: PageMetadata = {
    ...(title ? { title } : {}),
    description,
    ...(canonicalUrl
      ? {
          alternates: {
            canonical: canonicalUrl,
          },
        }
      : {}),
    ...(robots ? { robots } : {}),
    openGraph: {
      ...(title ? { title } : {}),
      description,
      siteName: seoConfig.siteName,
      type: openGraphType,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      ...(title ? { title } : {}),
      description,
      ...(twitterImages ? { images: twitterImages } : {}),
    },
  };

  return metadata;
}
