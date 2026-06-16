import type {NextConfig} from 'next';

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
  typescript: {
    // Type errors will now fail the build — all type issues must be resolved.
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  async rewrites() {
    const authTarget =
      process.env.AUTH_PROXY_TARGET ||
      'https://api.baalvion.com/api/v1/identity/auth/v1/auth';
    // Same-origin auth proxy so the httpOnly refresh cookie flows in dev and prod.
    return [{ source: '/auth-bff/:path*', destination: `${authTarget}/:path*` }];
  },
  async headers() {
    // Next.js dev (webpack HMR + react-refresh) runs on eval(); a prod CSP without
    // 'unsafe-eval' is correct, but dev needs it or the client bundle won't hydrate.
    const isDev = process.env.NODE_ENV !== 'production';
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
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
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://picsum.photos https://images.unsplash.com https://placehold.co https://s24.q4cdn.com https://www.cdprojektred.com",
              "font-src 'self'",
              "connect-src 'self' https://api.baalvion.com",
              "frame-ancestors 'self'",
            ].join('; '),
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
      {
        protocol: 'https',
        hostname: 'www.cdprojektred.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's24.q4cdn.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
