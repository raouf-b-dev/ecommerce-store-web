import type { MetadataRoute } from 'next';
import { getStorefrontOrigin } from '@/lib/storefront-origin';

export default function robots(): MetadataRoute.Robots {
  const origin = getStorefrontOrigin();

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/products/'],
      disallow: [
        '/cart',
        '/checkout',
        '/account',
        '/login',
        '/register',
        '/change-password',
        '/status',
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
