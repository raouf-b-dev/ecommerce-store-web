import { seoConfig } from '@/lib/seo/config';
import { shop } from '@/lib/shop';

export function renderSocialCard() {
  const colors = shop.socialColors;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: 'sans-serif',
        padding: '48px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '88px',
          height: '88px',
          borderRadius: '20px',
          backgroundColor: colors.accent,
          marginBottom: '28px',
          fontSize: '48px',
          fontWeight: 800,
        }}
      >
        {seoConfig.siteName.charAt(0)}
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: 16,
        }}
      >
        {seoConfig.siteName}
      </div>
      <div
        style={{
          fontSize: 26,
          color: colors.muted,
          maxWidth: 820,
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {seoConfig.description}
      </div>
    </div>
  );
}
