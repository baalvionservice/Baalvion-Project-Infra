import { z } from 'zod';

const serverSchema = z.object({
  ADMIN_SECRET_KEY: z
    .string()
    .min(16, 'ADMIN_SECRET_KEY must be at least 16 characters')
    .refine((v) => v !== 'secure-admin-key', {
      message: 'ADMIN_SECRET_KEY must not use the default insecure value',
    }),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_ABOUT_API_URL: z
    .string()
    .url()
    .default('https://api.baalvion.com/api/v1/ecosystem/about'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default('http://localhost:3020'),
  NEXT_PUBLIC_AUTH_URL: z
    .string()
    .url()
    .default('https://auth.baalvion.com'),
});

function validateEnv() {
  if (typeof window !== 'undefined') return; // skip on client

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.flatten().fieldErrors;
    console.error('[BOS] Invalid environment variables:', missing);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[BOS] Invalid environment variables — refusing to start in production');
    }
    console.warn('[BOS] Continuing in development with invalid env — fix before deploying');
  }
}

validateEnv();

export const env = {
  server: {
    adminSecretKey: process.env.ADMIN_SECRET_KEY ?? '',
    nodeEnv: (process.env.NODE_ENV as 'development' | 'test' | 'production') ?? 'development',
  },
  client: {
    aboutApiUrl: process.env.NEXT_PUBLIC_ABOUT_API_URL ?? 'https://api.baalvion.com/api/v1/ecosystem/about',
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3020',
    authUrl: process.env.NEXT_PUBLIC_AUTH_URL ?? 'https://auth.baalvion.com',
  },
};
