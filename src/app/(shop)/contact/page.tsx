import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { buildCanonicalUrl } from '@/lib/seo/canonical';
import { INDEX_FOLLOW_ROBOTS } from '@/lib/seo/config';
import { createPageMetadata } from '@/lib/seo/metadata';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { shop } from '@/lib/shop';

const DEMO_SUPPORT_EMAIL = 'support@example.com';

export function generateMetadata(): Metadata {
  const origin = getStorefrontOrigin();
  return createPageMetadata({
    title: 'Contact',
    description: `Contact ${shop.name} support.`,
    canonicalUrl: buildCanonicalUrl(origin, '/contact'),
    robots: INDEX_FOLLOW_ROBOTS,
    origin,
  });
}

export default function ContactPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Contact"
        description={`Reach the ${shop.name} team about orders, shipping, or your account.`}
      />
      <div className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          This is a demo storefront. Use the address below as a placeholder for
          support mail; it is not a monitored inbox for a live brand.
        </p>
        <p>
          Email:{' '}
          <a
            href={`mailto:${DEMO_SUPPORT_EMAIL}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {DEMO_SUPPORT_EMAIL}
          </a>{' '}
          (demo placeholder)
        </p>
        <p>
          For order status, sign in and open Orders. Shipping rates appear in
          cart and checkout for your address.
        </p>
      </div>
    </article>
  );
}