import type { MetadataRoute } from 'next';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { getProducts } from '@/features/catalog/api/get-products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getStorefrontOrigin();
  const productEntries: MetadataRoute.Sitemap = [];

  let page = 1;
  let totalPages = 1;

  do {
    const result = await getProducts({ page, limit: 100 });
    totalPages = result.totalPages;

    for (const item of result.items) {
      productEntries.push({
        url: `${origin}/products/${item.id}`,
        lastModified: item.createdAt ? new Date(item.createdAt) : new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }

    page += 1;
  } while (page <= totalPages);

  return [
    {
      url: origin,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...productEntries,
  ];
}
