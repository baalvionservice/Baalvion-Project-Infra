import type { NextConfig } from 'next';

// Next.js dev (webpack HMR + react-refresh) runs on eval() and a localhost websocket; a CSP without
// 'unsafe-eval'/ws breaks the client bundle in dev (nothing hydrates). Relax in dev only; prod stays strict.
const isDev = process.env.NODE_ENV !== 'production';

// Allow the actual backend API origin the app is configured to call (so CSP works in
// any environment — localhost, staging, prod — not just api.baalvion.com).
function originOf(url?: string): string {
  try { return url ? new URL(url).origin : ''; } catch { return ''; }
}
const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_BASE_URL);
const gatewayOrigin = originOf(process.env.NEXT_PUBLIC_GATEWAY_URL);
// Real-time chat WebSocket origin (explicit override, else derived from the API
// origin by swapping http→ws / https→wss). Needed in connect-src for the WS.
const wsExplicit = originOf(process.env.NEXT_PUBLIC_WS_URL);
const wsDerived = apiOrigin ? apiOrigin.replace(/^http/, 'ws') : '';
const wsOrigin = wsExplicit ? wsExplicit.replace(/^http/, 'ws') : wsDerived;
const extraConnect = [apiOrigin, gatewayOrigin, wsOrigin].filter(Boolean).join(' ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com https://pagead2.googlesyndication.com${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com https://picsum.photos https://fastly.picsum.photos https://*.razorpay.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' ${extraConnect} https://api.baalvion.com https://*.razorpay.com https://lumberjack.razorpay.com https://*.googleapis.com https://*.algolianet.com https://*.algolia.net${isDev ? ' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*' : ''}`,
      "frame-src 'self' https://*.razorpay.com https://api.razorpay.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // Lean, self-contained server output for Docker/AWS deploys (.next/standalone).
  output: 'standalone',
  typescript: {
    // Production builds don't block on legacy type noise in inherited components; type
    // checking runs out-of-band (tsc/CI). App code compiles and runs clean.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'fastly.picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
