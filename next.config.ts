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
  // The Dockerfile sets NEXT_OUTPUT_STANDALONE=true. `next start` (npm start,
  // test:e2e:prod) does not support standalone output, so other builds keep it off.
  output:
    process.env.NEXT_OUTPUT_STANDALONE === 'true' ? 'standalone' : undefined,
  cacheComponents: true,
  reactCompiler: true,
  typedRoutes: true,
  serverExternalPackages: ['msw'],
  // msw 3 `exports['./browser']` is `{ node: null, types, default }`, which
  // Turbopack fails to resolve for the mock worker (src/lib/mock/browser.ts).
  // Point it at the file msw ships. Drop this once Turbopack/msw resolve it.
  // The SSR pass of that client module still hits serverExternalPackages, so
  // `next build` warns "Package msw can't be external": expected and harmless.
  turbopack: {
    resolveAlias: {
      'msw/browser': './node_modules/msw/lib/browser/index.js',
    },
  },
  images: {
    remotePatterns: getConfiguredImageRemotePatterns(),
    localPatterns: IMAGE_LOCAL_PATTERNS,
    // Redirect targets skip the remotePatterns check, so an open redirect on an
    // allowed origin would turn the optimizer into an open proxy.
    maximumRedirects: 0,
    maximumResponseBody: 5_000_000,
    // Production blocks local and private IPs (SSRF). IMAGES_ALLOW_LOCAL_IP=true
    // is the opt-in for a private network; standalone output freezes it at build.
    dangerouslyAllowLocalIP:
      process.env.NODE_ENV !== 'production' ||
      process.env.IMAGES_ALLOW_LOCAL_IP === 'true',
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
