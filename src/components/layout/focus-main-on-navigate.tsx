'use client';

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
    // The router owns scroll position; focusing a tall <main> would scroll the header away.
    document.getElementById(targetId)?.focus({ preventScroll: true });
  }, [pathname, targetId]);

  return null;
}
