import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_AUTH_URL: z.string().url().default('http://localhost:4000/v1/auth'),
  NEXT_PUBLIC_DASHBOARD_API_URL: z.string().url().default('http://localhost:3009/api/v1'),
  NEXT_PUBLIC_REALTIME_WS_URL: z.string().default('ws://localhost:3040'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3024'),
});

const parsed = clientSchema.safeParse({
  NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,
  NEXT_PUBLIC_DASHBOARD_API_URL: process.env.NEXT_PUBLIC_DASHBOARD_API_URL,
  NEXT_PUBLIC_REALTIME_WS_URL: process.env.NEXT_PUBLIC_REALTIME_WS_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsed.success) {
  console.warn('[Dashboard] Invalid env vars:', parsed.error.flatten().fieldErrors);
}

const data = parsed.success ? parsed.data : clientSchema.parse({});

export const env = {
  authUrl: data.NEXT_PUBLIC_AUTH_URL,
  dashboardApiUrl: data.NEXT_PUBLIC_DASHBOARD_API_URL,
  realtimeWsUrl: data.NEXT_PUBLIC_REALTIME_WS_URL,
  appUrl: data.NEXT_PUBLIC_APP_URL,
};
