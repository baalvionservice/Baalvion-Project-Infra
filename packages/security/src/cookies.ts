/**
 * Secure cookie utilities for all Baalvion frontends.
 * Provides cookie attribute enforcement and token storage helpers.
 */

export interface SecureCookieOptions {
  maxAge?: number;
  path?: string;
  domain?: string;
  sameSite?: 'strict' | 'lax' | 'none';
}

export function buildSecureCookieHeader(
  name: string,
  value: string,
  opts: SecureCookieOptions = {},
): string {
  const {
    maxAge = 900,
    path = '/',
    sameSite = 'lax',
    domain,
  } = opts;

  const isProd = process.env.NODE_ENV === 'production';

  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
    'HttpOnly',
    ...(isProd ? ['Secure'] : []),
    ...(domain ? [`Domain=${domain}`] : []),
  ];

  return parts.join('; ');
}

export const SESSION_COOKIE_OPTIONS: SecureCookieOptions = {
  maxAge: 60 * 60 * 8,
  path: '/',
  sameSite: 'lax',
};

export const REFRESH_COOKIE_OPTIONS: SecureCookieOptions = {
  maxAge: 60 * 60 * 24 * 30,
  path: '/api',
  sameSite: 'strict',
};
