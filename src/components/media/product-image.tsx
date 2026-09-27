'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { isAllowedImageOrigin } from '@/lib/images/allowed-origins';

const CATEGORY_TINTS = [
  'bg-tint-1 text-tint-1-foreground',
  'bg-tint-2 text-tint-2-foreground',
  'bg-tint-3 text-tint-3-foreground',
  'bg-tint-4 text-tint-4-foreground',
  'bg-tint-5 text-tint-5-foreground',
] as const;

const ACCENT_TINT = 'bg-primary/10 text-primary';

export function placeholderTintClass(categoryId?: number | null): string {
  if (categoryId == null || !Number.isFinite(categoryId)) {
    return ACCENT_TINT;
  }
  const index =
    ((Math.trunc(categoryId) % CATEGORY_TINTS.length) + CATEGORY_TINTS.length) %
    CATEGORY_TINTS.length;
  return CATEGORY_TINTS[index] ?? ACCENT_TINT;
}

function initialOf(name?: string): string {
  const letter = name?.trim().match(/[\p{L}\p{N}]/u)?.[0];
  return letter ? letter.toUpperCase() : '';
}

export type ProductImageProps = {
  src?: string | null;
  alt?: string;
  /** Product name. Its first letter labels the placeholder. */
  name?: string;
  /**
   * Category id when the payload carries one (catalog reads). Cart and order
   * lines have no category, so they omit it and get the accent tint.
   */
  categoryId?: number | null;
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
  name,
  categoryId,
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
          '@container flex h-full w-full items-center justify-center select-none',
          placeholderTintClass(categoryId),
          className,
        )}
        aria-hidden="true"
        data-testid="product-image-placeholder"
      >
        <span className="text-[38cqi] leading-none font-semibold tracking-tight opacity-80">
          {initialOf(name ?? alt)}
        </span>
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

type ProductImageFrameProps = Omit<ProductImageProps, 'fill' | 'className'> & {
  /** Sizing and radius overrides for the frame. The aspect ratio stays square. */
  className?: string;
  imageClassName?: string;
};

/** One square frame for every product image surface: card, detail, cart, checkout, orders. */
export function ProductImageFrame({
  className,
  imageClassName,
  ...imageProps
}: ProductImageFrameProps) {
  return (
    <div
      className={cn(
        'relative aspect-square shrink-0 overflow-hidden rounded-lg bg-muted',
        className,
      )}
    >
      <ProductImage {...imageProps} fill className={imageClassName} />
    </div>
  );
}
