import { ImageResponse } from 'next/og';
import { renderSocialCard } from '@/lib/seo/social-image';

export const alt = 'Storefront';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(renderSocialCard(), size);
}
