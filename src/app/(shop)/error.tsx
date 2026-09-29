'use client';

import { RouteError } from '@/components/layout/route-error';

export default function ShopError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteError retry={retry} />;
}
