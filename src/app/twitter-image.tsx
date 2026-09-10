import { ImageResponse } from 'next/og';
import { seoConfig } from '@/lib/seo/config';
import { renderSocialCard } from '@/lib/seo/social-image';

export const alt = seoConfig.siteName;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(renderSocialCard(), size);
}
