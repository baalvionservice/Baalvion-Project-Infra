import type { NextConfig } from 'next';

// Next's dev server needs eval() and a localhost websocket for HMR; a CSP without them
// leaves the client bundle dead in development. Relax there only — production stays strict.
const isDev = process.env.NODE_ENV !== 'production';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // A support platform has no reason to reach for a camera, a microphone or a location.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // static.cloudflareinsights.com: once this host sits behind the Cloudflare proxy, the
      // edge injects a Web Analytics beacon the origin never served. It is cookieless and
      // does no cross-site tracking, so it is allowed.
      //
      // www.googletagmanager.com is deliberately NOT allowed, even though Google Tag Gateway
      // is enabled at the zone and will therefore try to load here. On a directory site that
      // would be unremarkable; on this one it would send the URL of a page somebody is
      // reading about their own family to Google, on a site whose front page promises the
      // opposite. Blocked by CSP means the script never runs and nothing is sent — the safe
      // failure. Turn Google Tag Gateway OFF for this hostname in Cloudflare so the console
      // is clean as well as the privacy.
      `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      // Same-origin only. The gateway is reached through the /auth-bff proxy route, so no
      // cross-origin destination needs to be allow-listed at all.
      // cloudflareinsights.com (no `static.`) is where that beacon POSTs its measurements.
      `connect-src 'self' https://cloudflareinsights.com${isDev ? ' ws://localhost:* http://localhost:*' : ''}`,
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

/**
 * A production build must know its own address.
 *
 * Guide pages are prerendered, so their canonical URL, Open Graph URL and JSON-LD are written
 * into the HTML at build time. A production build that runs without an origin therefore ships
 * a site whose every canonical points at localhost — which does not look broken anywhere, and
 * quietly makes the whole thing unindexable.
 *
 * Loud beats silent. Set ALLOW_LOCALHOST_ORIGIN=1 to build a production bundle locally.
 */
const origin = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';
if (
  !isDev &&
  process.env.ALLOW_LOCALHOST_ORIGIN !== '1' &&
  (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)/.test(origin))
) {
  throw new Error(
    'Refusing to build: SITE_URL is ' +
      (origin ? `"${origin}"` : 'unset') +
      '. Prerendered pages bake their canonical URLs, so this build would publish canonicals ' +
      'pointing at localhost. Set SITE_URL=https://canwemarry.baalvion.com, or pass ' +
      'ALLOW_LOCALHOST_ORIGIN=1 for a local production build.',
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(process.env.BUILD_STANDALONE === '1' ? { output: 'standalone' as const } : {}),

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
