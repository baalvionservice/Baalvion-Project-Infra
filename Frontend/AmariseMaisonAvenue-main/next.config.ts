import type { NextConfig } from 'next';

// Production media host (S3 bucket / CloudFront / CDN) where real product photos live.
// Set NEXT_PUBLIC_MEDIA_HOST (hostname only, e.g. "cdn.amarisemaisonavenue.com" or
// "amarise-media.s3.amazonaws.com") and uploaded images load + pass CSP automatically.
const MEDIA_HOST = (process.env.NEXT_PUBLIC_MEDIA_HOST || '').trim();

// Admin-uploaded media (CMS media library) is served from the cms-service / gateway
// origin (NEXT_PUBLIC_CMS_URL) or an S3/CDN (NEXT_PUBLIC_MEDIA_HOST). Derive the CMS
// host so admin-edited homepage / featuredImage URLs load through next/image and pass
// CSP without per-image config.
function originParts(
  url: string
): { protocol: 'http' | 'https'; hostname: string; port: string } | null {
  try {
    const u = new URL(url);
    const protocol = u.protocol.replace(':', '');
    if (protocol !== 'http' && protocol !== 'https') return null;
    return { protocol, hostname: u.hostname, port: u.port };
  } catch {
    return null;
  }
}
const CMS_HOST = originParts(process.env.NEXT_PUBLIC_CMS_URL || '');
const IS_DEV = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  // Keep the server-only Genkit + OpenTelemetry runtime external so Next leaves it as a runtime
  // require() instead of bundling and statically analysing its dynamic `require(expr)` calls
  // (@opentelemetry/instrumentation, require-in-the-middle, protobufjs, express). Removes the
  // "Critical dependency: the request of a dependency is an expression" build warnings with no
  // behaviour change — src/ai/* is `server-only`, reached only through flows / route handlers.
  serverExternalPackages: [
    'genkit',
    '@genkit-ai/core',
    '@genkit-ai/ai',
    '@genkit-ai/google-genai',
    'dotprompt',
    'handlebars',
    '@opentelemetry/sdk-node',
    '@opentelemetry/api',
    '@opentelemetry/instrumentation',
    'require-in-the-middle',
    'import-in-the-middle',
    'protobufjs',
    'express',
  ],
  // Self-contained server bundle for Docker/ECS/Amplify (.next/standalone + server.js).
  // Standalone file-tracing recreates the pnpm symlink tree, which throws EPERM on Windows
  // (symlink creation needs Admin/Developer Mode). Production images build on Linux where this
  // works; skip it on win32 so local Windows builds succeed without changing the deploy artifact.
  output: process.platform === 'win32' ? undefined : 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'madisonavenuecouture.com', pathname: '/**' },
      ...(MEDIA_HOST ? [{ protocol: 'https' as const, hostname: MEDIA_HOST, pathname: '/**' }] : []),
      // Admin CMS media origin (covers gateway / cms-service uploads).
      ...(CMS_HOST
        ? [
            {
              protocol: CMS_HOST.protocol,
              hostname: CMS_HOST.hostname,
              ...(CMS_HOST.port ? { port: CMS_HOST.port } : {}),
              pathname: '/**',
            },
          ]
        : []),
      // In dev, admin media is typically served from a localhost service port.
      ...(IS_DEV
        ? [
            { protocol: 'http' as const, hostname: 'localhost', pathname: '/**' },
            { protocol: 'http' as const, hostname: '127.0.0.1', pathname: '/**' },
          ]
        : []),
    ],
  },
  async rewrites() {
    const authTarget =
      process.env.AUTH_PROXY_TARGET ||
      'https://api.baalvion.com/api/v1/identity/auth/v1/auth';
    // Same-origin auth proxy so the httpOnly refresh cookie flows in dev and prod.
    return [{ source: '/auth-bff/:path*', destination: `${authTarget}/:path*` }];
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';

    // The storefront's CLIENT code fetches the catalog directly from commerce-service
    // (NEXT_PUBLIC_COMMERCE_URL). Whitelist that exact origin in connect-src so the browser
    // doesn't CSP-block it. In dev we also allow any localhost origin (+ ws for HMR).
    const originOf = (url?: string) => {
      try { return url ? new URL(url).origin : ''; } catch { return ''; }
    };
    // When the canonical URL is localhost we are running the prod build locally over http — do NOT
    // emit upgrade-insecure-requests (it would rewrite the http://localhost:* API calls to https and
    // break them). In real prod APP_URL is the https domain, so the directive is emitted normally.
    const isLocalhost = /localhost|127\.0\.0\.1/.test(process.env.NEXT_PUBLIC_APP_URL || '');

    // Admin CMS media origin (e.g. https://api.baalvion.com or http://localhost:3018)
    // so admin-uploaded homepage / press images aren't CSP-blocked.
    const cmsImgSrc = CMS_HOST
      ? `${CMS_HOST.protocol}://${CMS_HOST.hostname}${CMS_HOST.port ? `:${CMS_HOST.port}` : ''}`
      : '';
    const devImgSrc = isDev || isLocalhost ? 'http://localhost:* http://127.0.0.1:*' : '';

    const connectSrc = [
      "'self'",
      'https://api.baalvion.com',
      'https://*.googleapis.com',
      'https://www.google-analytics.com',
      'https://stats.g.doubleclick.net',
      // Payment gateways the browser talks to directly (Razorpay popup, Stripe.js).
      'https://api.razorpay.com',
      'https://*.razorpay.com',
      'https://api.stripe.com',
      originOf(process.env.NEXT_PUBLIC_COMMERCE_URL),
      originOf(process.env.NEXT_PUBLIC_ORDER_URL),
      originOf(process.env.NEXT_PUBLIC_API_URL),
      isDev || isLocalhost ? 'http://localhost:* ws://localhost:*' : '',
    ].filter(Boolean).join(' ');

    // upgrade-insecure-requests would rewrite http://localhost:* to https in dev — only emit in prod.
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com https://checkout.razorpay.com https://js.stripe.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' blob: data: https://picsum.photos https://images.unsplash.com https://placehold.co https://madisonavenuecouture.com https://www.google-analytics.com https://www.googletagmanager.com ${MEDIA_HOST ? `https://${MEDIA_HOST}` : ''} ${cmsImgSrc} ${devImgSrc};
      font-src 'self' data: https://fonts.gstatic.com;
      object-src 'none';
      base-uri 'self';
      connect-src ${connectSrc};
      frame-src https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://js.stripe.com https://hooks.stripe.com https://*.stripe.com;
      form-action 'self' https://*.payu.in https://secure.payu.in https://test.payu.in https://checkout.stripe.com;
      frame-ancestors 'none';
      ${isDev || isLocalhost ? '' : 'upgrade-insecure-requests;'}
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
