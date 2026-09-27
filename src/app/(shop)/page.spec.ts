import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateMetadata } from '@/app/(shop)/page';
import { seoConfig } from '@/lib/seo/config';
import * as storefrontOriginModule from '@/lib/storefront-origin';

describe('HomePage generateMetadata', () => {
  beforeEach(() => {
    vi.spyOn(storefrontOriginModule, 'getStorefrontOrigin').mockReturnValue(
      'https://storefront.test',
    );
  });

  it('is an indexable landing page that canonicalizes to the site root under the layout title', () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBeUndefined();
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe('https://storefront.test/');
    expect(metadata.openGraph?.title).toBe(seoConfig.siteName);
  });
});
