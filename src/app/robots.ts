import type { MetadataRoute } from 'next';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { getSitemapPartitions } from '@/features/catalog/lib/sitemap-partitions';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = getStorefrontOrigin();
  const partitions = await getSitemapPartitions();

  return {
    rules: {
      userAgent: '*',
      allow: ['/'],
      // Keep unfinished feature routes disallowed until Phase 6 (Cart) and Phase 7 (Checkout) land
      // with page-level noindex metadata.
      // Note: Existing private routes (/account, /login, /register, /change-password, /status)
      // are deliberately omitted from disallow so search engine crawlers can fetch the pages,
      // discover the metadata-level `noindex, nofollow` directive, and de-index them from search results.
      disallow: ['/cart', '/checkout'],
    },
    sitemap: partitions.map((p) => `${origin}/sitemap/${p.id}.xml`),
  };
}
