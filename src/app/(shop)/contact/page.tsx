import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { CONTACT_PATH } from '@/features/catalog/lib/catalog-params';
import { buildCanonicalUrl } from '@/lib/seo/canonical';
import { INDEX_FOLLOW_ROBOTS, NO_INDEX_ROBOTS } from '@/lib/seo/config';
import { createPageMetadata } from '@/lib/seo/metadata';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { hasPlaceholderSupportEmail, shop } from '@/lib/shop';

export function generateMetadata(): Metadata {
  const origin = getStorefrontOrigin();
  return createPageMetadata({
    title: 'Contact',
    description: `Contact ${shop.name} support.`,
    canonicalUrl: buildCanonicalUrl(origin, CONTACT_PATH),
    robots: hasPlaceholderSupportEmail()
      ? NO_INDEX_ROBOTS
      : INDEX_FOLLOW_ROBOTS,
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
          Email:{' '}
          <a
            href={`mailto:${shop.supportEmail}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {shop.supportEmail}
          </a>
        </p>
        <p>
          For order status, sign in and open Orders. The cart and checkout show
          the shipping amount for your order.
        </p>
      </div>
    </article>
  );
}
