import type { Metadata } from 'next';
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_NAME,
  DEFAULT_TWITTER_IMAGE_PATH,
} from '@/lib/seo/constants';
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
    description = DEFAULT_SITE_DESCRIPTION,
    canonicalUrl,
    robots,
    origin,
    imageUrl,
    imageAlt = title ?? DEFAULT_SITE_NAME,
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
        url: `${origin}${DEFAULT_OG_IMAGE_PATH}`,
        alt: imageAlt,
        width: 1200,
        height: 630,
        type: 'image/png',
      },
    ];
    twitterImages = [`${origin}${DEFAULT_TWITTER_IMAGE_PATH}`];
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
      siteName: DEFAULT_SITE_NAME,
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
