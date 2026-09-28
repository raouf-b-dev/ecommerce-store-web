'use client';

import { RouteError } from '@/components/layout/route-error';

export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteError retry={retry} />;
}
