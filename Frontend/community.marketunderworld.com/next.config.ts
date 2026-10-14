import type {NextConfig} from 'next';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  /* High Performance Configuration */
  reactStrictMode: true,

  // Disable image optimization in dev to bypass processing overhead
  images: {
    unoptimized: isDev,
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },

  // Speed up builds/dev by disabling source maps in development
  productionBrowserSourceMaps: false,

  experimental: {
    // Optimize internal package imports for faster dev reloads and smaller production bundles
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      '@radix-ui/react-icons',
      'date-fns',
    ],
  },

  compiler: {
    // Remove console logs in production for performance and security
    removeConsole: process.env.NODE_ENV === 'production',
  },

  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  async redirects() {
    return [
      // One canonical address for search engines and visitors: www goes to the bare domain in a single hop.
      {
        source: '/',
        has: [{ type: 'host', value: 'www.community.marketunderworld.com' }],
        destination: 'https://community.marketunderworld.com/',
        permanent: true,
      },
      {
        source: '/:path+',
        has: [{ type: 'host', value: 'www.community.marketunderworld.com' }],
        destination: 'https://community.marketunderworld.com/:path*',
        permanent: true,
      },
      // The emailed links point at /reset-password and /verify-email; the pages live under /auth.
      { source: '/reset-password', destination: '/auth/reset-password', permanent: false },
      { source: '/verify-email', destination: '/auth/verify-email', permanent: false },
      {
        source: '/app',
        destination: '/app/home',
        permanent: true,
      },
      // /forums/* was a duplicate, partially-broken forum tree (mismatched region-id
      // datasets caused real 404s) — consolidated onto /forum/*, which is now backed by
      // real community-service + NodeBB data instead of mock region arrays.
      {
        source: '/forums',
        destination: '/forum',
        permanent: true,
      },
      {
        source: '/forums/thread/:id',
        destination: '/forum/thread/:id',
        permanent: true,
      },
      {
        source: '/forums/:slug',
        destination: '/forum/:slug',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    const authTarget =
      process.env.AUTH_PROXY_TARGET ||
      'https://api.baalvion.com/api/v1/identity/auth/v1';
    // Same-origin auth proxy so the httpOnly refresh cookie flows in dev and prod.
    // The gateway session client always calls `${gatewayUrl}/auth/<action>`, so the
    // target here must NOT itself end in `/auth` (verified against the live gateway:
    // .../v1/auth/register works, .../v1/auth/auth/register 404s).
    return [{ source: '/auth-bff/:path*', destination: `${authTarget}/:path*` }];
  },
};

export default nextConfig;
