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
      // Note: Private routes (/account, /login, /register, /change-password, /status, /cart, /checkout)
      // are deliberately omitted from disallow so search engine crawlers can fetch the pages,
      // discover the metadata-level `noindex, nofollow` directive, and de-index them from search results.
    },
    sitemap: partitions.map((p) => `${origin}/sitemap/${p.id}.xml`),
  };
}
