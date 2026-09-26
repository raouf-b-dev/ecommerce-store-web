'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

type FocusMainOnNavigateProps = {
  targetId?: string;
};

export function FocusMainOnNavigate({
  targetId = 'main',
}: FocusMainOnNavigateProps) {
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current === pathname) {
      return;
    }
    previousPath.current = pathname;
    document.getElementById(targetId)?.focus();
  }, [pathname, targetId]);

  return null;
}
