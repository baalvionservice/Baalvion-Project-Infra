/**
 * Shared CSP header builder for all Baalvion Next.js frontends.
 * Usage: import { buildCspHeader } from '@baalvion/security/csp'
 */

export interface CspOptions {
  nonce?: string;
  allowedOrigins?: string[];
  allowedImageDomains?: string[];
  allowUnsafeEval?: boolean;
  allowedConnectSrc?: string[];
}

export function buildCspHeader(opts: CspOptions = {}): string {
  const {
    nonce,
    allowedOrigins = [],
    allowedImageDomains = [],
    allowUnsafeEval = false,
    allowedConnectSrc = [],
  } = opts;

  const nonceAttr = nonce ? `'nonce-${nonce}'` : '';
  const scriptSrc = [
    "'self'",
    nonceAttr,
    allowUnsafeEval ? "'unsafe-eval'" : '',
    "'strict-dynamic'",
  ]
    .filter(Boolean)
    .join(' ');

  const connectSrc = [
    "'self'",
    ...allowedOrigins,
    ...allowedConnectSrc,
    'ws://localhost:*',
    'wss://*.baalvion.com',
  ].join(' ');

  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    'https://placehold.co',
    'https://images.unsplash.com',
    'https://picsum.photos',
    ...allowedImageDomains,
  ].join(' ');

  const directives: Record<string, string> = {
    'default-src': "'self'",
    'script-src': scriptSrc,
    'style-src': "'self' 'unsafe-inline'",
    'img-src': imgSrc,
    'font-src': "'self' data:",
    'connect-src': connectSrc,
    'frame-ancestors': "'none'",
    'form-action': "'self'",
    'base-uri': "'self'",
    'object-src': "'none'",
    'upgrade-insecure-requests': '',
  };

  return Object.entries(directives)
    .map(([k, v]) => (v ? `${k} ${v}` : k))
    .join('; ');
}

export const SECURITY_HEADERS: Array<{ key: string; value: string }> = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];
