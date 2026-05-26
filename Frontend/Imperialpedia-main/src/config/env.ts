/**
 * @fileOverview Safe environment variable management with fallback defaults.
 */

export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Imperialpedia',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://imperialpedia.com',
  environment: (process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  isDev: (process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV) !== 'production',
  /** Public addresses shown on Contact and legal pages; override via NEXT_PUBLIC_* in production. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'infra.baalvion@gmail.com',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@imperialpedia.com',
  expertsEmail: process.env.NEXT_PUBLIC_EXPERTS_EMAIL || 'experts@imperialpedia.com',
};

export type Env = typeof env;
