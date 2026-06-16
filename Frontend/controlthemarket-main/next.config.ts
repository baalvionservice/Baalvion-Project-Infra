import type {NextConfig} from 'next';

// Next.js dev (webpack HMR + react-refresh) runs on eval() and a localhost websocket; a prod-grade
// CSP that omits 'unsafe-eval'/ws breaks the client bundle in dev (nothing hydrates). Relax in dev
// only; prod stays strict. 'unsafe-inline' stays for inline JSON-LD / Next bootstrap.
const isDev = process.env.NODE_ENV !== 'production';

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://checkout.razorpay.com https://js.stripe.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https:${isDev ? ' http://localhost:* ws://localhost:* ws://127.0.0.1:*' : ''};
  frame-src https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://js.stripe.com https://hooks.stripe.com;
  frame-ancestors 'none';
  base-uri 'self';
  object-src 'none';
  form-action 'self';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  /* config options here */
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
  // Self-contained server bundle for Docker/ECS (.next/standalone + server.js).
  // Standalone file-tracing recreates the pnpm symlink tree, which throws EPERM on Windows
  // (symlink creation needs Admin/Developer Mode). Production images build on Linux where this
  // works; skip it on win32 so local Windows builds succeed without changing the deploy artifact.
  output: process.platform === 'win32' ? undefined : 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint is not configured in this app (no eslint config + `next lint`
    // prompts interactive setup), so there is no working lint to gate on.
    // Left enabled until a lint config is wired and proven clean.
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const authTarget =
      process.env.AUTH_PROXY_TARGET ||
      'https://api.baalvion.com/api/v1/identity/auth/v1/auth';
    // Same-origin auth proxy so the httpOnly refresh cookie flows in dev and prod.
    return [{ source: '/auth-bff/:path*', destination: `${authTarget}/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
