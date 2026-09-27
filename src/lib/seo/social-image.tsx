import { seoConfig } from '@/lib/seo/config';

export function renderSocialCard() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#09090b',
        color: '#fafafa',
        fontFamily: 'sans-serif',
        padding: '48px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '72px',
          height: '72px',
          borderRadius: '16px',
          backgroundColor: '#27272a',
          marginBottom: '24px',
          fontSize: '36px',
        }}
      >
        🛍️
      </div>
      <div
        style={{
          fontSize: 60,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: 16,
        }}
      >
        {seoConfig.siteName}
      </div>
      <div
        style={{
          fontSize: 24,
          color: '#a1a1aa',
          maxWidth: 800,
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {seoConfig.description}
      </div>
    </div>
  );
}
