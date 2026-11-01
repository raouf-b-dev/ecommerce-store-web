import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { buildCanonicalUrl } from '@/lib/seo/canonical';
import { INDEX_FOLLOW_ROBOTS } from '@/lib/seo/config';
import { createPageMetadata } from '@/lib/seo/metadata';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { shop } from '@/lib/shop';

export function generateMetadata(): Metadata {
  const origin = getStorefrontOrigin();
  return createPageMetadata({
    title: 'Shipping',
    description: `How shipping works at ${shop.name}.`,
    canonicalUrl: buildCanonicalUrl(origin, '/shipping'),
    robots: INDEX_FOLLOW_ROBOTS,
    origin,
  });
}

export default function ShippingPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Shipping"
        description={`How ${shop.name} calculates delivery for your order.`}
      />
      <div className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          Items in the catalog ship from available stock. Shipping cost is
          calculated at checkout for the address you choose; the cart and
          checkout summary show the amount for that order.
        </p>
        <p>
          We do not advertise a blanket free-shipping threshold on this page.
          When an order qualifies for free shipping, the cart and confirmation
          screens say so for that order.
        </p>
        <p>
          After you place an order, track status under{' '}
          <Link
            href="/orders"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Orders
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
