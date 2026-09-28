import type { NextConfig } from 'next';
import {
  getConfiguredImageRemotePatterns,
  IMAGE_LOCAL_PATTERNS,
} from './src/lib/images/allowed-origins';

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
    localPatterns: IMAGE_LOCAL_PATTERNS,
    // Redirect targets skip the remotePatterns check, so an open redirect on an
    // allowed origin would turn the optimizer into an open proxy.
    maximumRedirects: 0,
    maximumResponseBody: 5_000_000,
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
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
