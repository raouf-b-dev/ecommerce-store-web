import { connection } from 'next/server';

/**
 * Signals intentional request-time rendering for Cache Components routes whose
 * generateMetadata reads searchParams while the page body stays prerenderable.
 * Must live under a Suspense boundary placed before <body> in the root layout.
 */
export async function CacheComponentsDynamicMarker() {
  await connection();
  return null;
}
