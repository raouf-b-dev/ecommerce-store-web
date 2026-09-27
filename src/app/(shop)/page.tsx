import { Suspense } from 'react';
import { buildCanonicalUrl } from '@/lib/seo/canonical';
import { INDEX_FOLLOW_ROBOTS } from '@/lib/seo/config';
import { createPageMetadata, type PageMetadata } from '@/lib/seo/metadata';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { HomeHero } from '@/features/catalog/components/home-hero';
import { LandingSections } from '@/features/catalog/components/landing-sections';
import { LandingSectionsSkeleton } from '@/features/catalog/components/landing-sections-skeleton';

// This route depends on browser-only session bootstrap, so exempt it from instant-navigation validation.
export const instant = false;

export function generateMetadata(): PageMetadata {
  const origin = getStorefrontOrigin();
  return createPageMetadata({
    canonicalUrl: buildCanonicalUrl(origin, '/'),
    robots: INDEX_FOLLOW_ROBOTS,
    origin,
  });
}

export default function HomePage() {
  return (
    <div className="space-y-14">
      <HomeHero />
      <Suspense fallback={<LandingSectionsSkeleton />}>
        <LandingSections />
      </Suspense>
    </div>
  );
}
