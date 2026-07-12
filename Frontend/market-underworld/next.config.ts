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
      {
        source: '/app',
        destination: '/app/home',
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
