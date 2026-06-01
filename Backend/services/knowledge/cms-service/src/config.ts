import dotenv from 'dotenv';

dotenv.config();

/**
 * ⚠️ PHASE-F SEED (typed contract — NOT the current runtime; the live runtime
 * reads `config/appConfig.js`). See `src/platform/sdk.ts` for the migration note.
 *
 * cms-service infrastructure/bootstrap configuration.
 *
 * IMPORTANT — this holds INFRA config only (db, redis, port, the SDK wiring).
 * It does NOT hold tenant secrets or external-provider keys: those live encrypted
 * in the CMS vault (the integrations store) and are read through the SDK / vault
 * layer. Business logic (controllers/services) must NEVER read process.env for
 * secrets — only this bootstrap file touches env, and only for infrastructure.
 */

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[cms-service] missing required env: ${name}`);
  return v;
}

const list = (v: string | undefined, fallback: string[]): string[] =>
  v ? v.split(',').map((s) => s.trim()).filter(Boolean) : fallback;

export type EventTransport = 'nats' | 'kafka' | 'redis' | 'noop';

export interface AppConfig {
  env: string;
  version: string;
  port: number;
  apiVersion: 'v1';
  corsOrigins: string[];
  jwt: { publicKey: string; issuer: string; audience: string; jwksUri: string | null };
  db: { host: string; port: number; name: string; user: string; password: string; schema: 'cms' };
  redis: { host: string; port: number; password: string | undefined };
  cache: { contentTtl: number; publicTtl: number; taxonomyTtl: number };
  security: { ipRateLimit: number };
  // ── SDK / platform wiring ──
  internalSecret: string;
  selfCmsApiBaseUrl: string;
  eventTransport: EventTransport;
  logLevel: string;
}

export const appConfig: AppConfig = {
  env: process.env.NODE_ENV ?? 'development',
  version: '1.0.0',
  port: Number(process.env.PORT ?? 3018),
  apiVersion: 'v1',
  corsOrigins: list(process.env.CORS_ORIGINS, [
    'http://localhost:3000',
    'http://localhost:3030',
    'http://localhost:5173',
  ]),
  jwt: {
    // User-facing JWT verification stays on the canonical @baalvion/auth-node layer.
    publicKey: requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
    issuer: process.env.JWT_ISSUER ?? 'baalvion-auth',
    audience: process.env.JWT_AUDIENCE ?? 'baalvion-platform',
    jwksUri: process.env.BAALVION_JWKS_URI ?? process.env.JWKS_URI ?? null,
  },
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    name: process.env.DB_NAME ?? 'baalvion_db',
    user: process.env.DB_USER ?? 'baalvion',
    password: process.env.DB_PASSWORD ?? '',
    schema: 'cms',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? undefined,
  },
  cache: {
    contentTtl: Number(process.env.CACHE_CONTENT_TTL ?? 300),
    publicTtl: Number(process.env.CACHE_PUBLIC_TTL ?? 600),
    taxonomyTtl: Number(process.env.CACHE_TAXONOMY_TTL ?? 1800),
  },
  security: {
    ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX ?? 200),
  },
  // SDK wiring
  internalSecret: process.env.INTERNAL_SERVICE_SECRET ?? 'baalvion-internal-dev-secret',
  selfCmsApiBaseUrl: process.env.CMS_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3018}/api/v1`,
  eventTransport: (process.env.EVENT_TRANSPORT as EventTransport) ?? 'noop',
  logLevel: process.env.LOG_LEVEL ?? 'info',
};
