import type { NextConfig } from 'next';

// The auth-service base this surface proxies to. In Docker this is the internal service name
// (e.g. http://auth-service:3001); locally it is the dev port. The browser only ever sees the
// same-origin /auth-bff/* path — credentials stay first-party.
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Cloudflare Turnstile needs its script + challenge iframe allow-listed in the CSP.
const TURNSTILE = 'https://challenges.cloudflare.com';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${TURNSTILE}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com",
  `frame-src ${TURNSTILE}`,
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    // Same-origin BFF: the SPA calls /auth-bff/email/otp/* → auth-service /v1/auth/email/otp/*.
    return [{ source: '/auth-bff/:path*', destination: `${AUTH_SERVICE_URL}/v1/auth/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
