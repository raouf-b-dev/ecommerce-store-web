'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: MIT

import { RouteError } from '@/components/layout/route-error';

export default function ShopError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError reset={reset} />;
}
