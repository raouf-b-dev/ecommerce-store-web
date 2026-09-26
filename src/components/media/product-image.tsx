'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { isAllowedImageOrigin } from '@/lib/images/allowed-origins';

type ProductImageProps = {
  src?: string | null;
  alt?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export function ProductImage({
  src,
  alt = '',
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  className,
}: ProductImageProps) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setHasError(false);
  }

  const canRenderRemote = Boolean(src && isAllowedImageOrigin(src));
  const showPlaceholder = !src || !canRenderRemote || hasError;

  if (showPlaceholder) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center bg-muted/40 text-muted-foreground/50 transition-colors',
          className,
        )}
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 opacity-60"
        >
          <path d="m7.5 4.27 9 5.15" />
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      key={src}
      src={src!}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={sizes}
      priority={priority}
      onError={() => setHasError(true)}
      className={cn('object-cover transition-all duration-300', className)}
    />
  );
}
