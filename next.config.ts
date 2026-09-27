import type { NextConfig } from 'next';
import { getConfiguredImageRemotePatterns } from './src/lib/images/allowed-origins';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  reactCompiler: true,
  typedRoutes: true,
  serverExternalPackages: ['msw'],
  images: {
    remotePatterns: getConfiguredImageRemotePatterns(),
  },
  async redirects() {
    return [
      {
        source: '/products',
        destination: '/',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
