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
    title: 'Privacy',
    description: `Privacy notice for ${shop.name}.`,
    canonicalUrl: buildCanonicalUrl(origin, '/privacy'),
    robots: INDEX_FOLLOW_ROBOTS,
    origin,
  });
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Privacy"
        description={`How ${shop.name} handles account and order information.`}
      />
      <div className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          Account email, addresses, cart, and order data are stored by the store
          API so you can sign in, check out, and review order history.
        </p>
        <p>
          Questions about your data? See{' '}
          <Link
            href="/contact"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Contact
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
