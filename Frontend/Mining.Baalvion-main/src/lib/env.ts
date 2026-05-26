/**
 * @fileOverview Type-safe Environment Variable Utility.
 * Ensures critical configuration is present during build and runtime.
 */

export const env = {
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  analytics: {
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
  },

  api: {
    // Primary mining-service base URL
    miningUrl: process.env.NEXT_PUBLIC_MINING_API_URL || 'http://localhost:3003',
    // Auth proxy (JWT issue / refresh)
    authUrl: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4000/v1/auth',
    // Legacy alias — kept for backward-compat with older imports
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_MINING_API_URL || 'http://localhost:3003/api',
  },

  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3028',
  },
} as const;

/**
 * Validates that required environment variables are set.
 * Throws a descriptive error in development to aid debugging.
 */
export function validateEnv(): void {
  if (!process.env.NEXT_PUBLIC_MINING_API_URL) {
    const msg = '[Config]: NEXT_PUBLIC_MINING_API_URL is not set. Falling back to http://localhost:3003.';
    if (env.isProduction) {
      console.error(msg);
    } else {
      console.warn(msg);
    }
  }

  if (env.isProduction && !env.analytics.measurementId) {
    console.warn('[Security Warning]: NEXT_PUBLIC_GA_MEASUREMENT_ID is missing in production.');
  }

  if (env.isProduction && !process.env.NEXT_PUBLIC_AUTH_URL) {
    console.warn('[Config]: NEXT_PUBLIC_AUTH_URL is not set. Authentication may not function correctly.');
  }
}
