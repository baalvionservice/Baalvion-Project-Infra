import { z } from 'zod';

// ── Base schema shared by ALL services ────────────────────────────────────────
const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database
  DB_HOST:     z.string().default('localhost'),
  DB_PORT:     z.coerce.number().default(5432),
  DB_NAME:     z.string().default('baalvion_db'),
  DB_USER:     z.string().default('baalvion'),
  DB_PASSWORD: z.string().default('baalvion_dev_pass'),

  // Redis
  REDIS_HOST:     z.string().default(''),
  REDIS_PORT:     z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_DB:       z.coerce.number().default(0),

  // JWT (verify-side; only auth-service has private key)
  JWT_PUBLIC_KEY_PATH: z.string().optional(),
  JWT_PUBLIC_KEY_B64:  z.string().optional(),
  JWT_PUBLIC_KEY:      z.string().optional(),
  JWT_ISSUER:          z.string().default('baalvion-auth'),
  JWT_AUDIENCE:        z.string().default('baalvion-services'),
  JWT_ACCESS_EXPIRES_IN:  z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3030,http://localhost:5173'),

  // Auth service location (for non-auth services that call it)
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('debug'),
});

// ── Auth-service-specific additions ───────────────────────────────────────────
const authServiceSchema = baseSchema.extend({
  PORT: z.coerce.number().default(3001),

  JWT_PRIVATE_KEY_PATH: z.string().optional(),
  JWT_PRIVATE_KEY_B64:  z.string().optional(),
  JWT_PRIVATE_KEY:      z.string().optional(),

  BCRYPT_ROUNDS: z.coerce.number().default(12),

  FRONTEND_URL: z.string().default('http://localhost:8080'),
  ADMIN_URL:    z.string().default('http://localhost:3030'),

  EMAIL_FROM:  z.string().email().default('noreply@baalvion.com'),
  SMTP_HOST:   z.string().default(''),
  SMTP_PORT:   z.coerce.number().default(587),
  SMTP_USER:   z.string().default(''),
  SMTP_PASS:   z.string().default(''),
});

// ── Identity service additions (admin, session, oauth) ────────────────────────
const identityServiceSchema = baseSchema.extend({
  PORT: z.coerce.number(),
  AUTH_JWKS_URL: z.string().url().default('http://localhost:3001/.well-known/jwks.json'),
});

// ── Factories ─────────────────────────────────────────────────────────────────

type ParseResult<T extends z.ZodTypeAny> =
  | { success: true;  config: z.infer<T> }
  | { success: false; errors: z.ZodError };

export function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  env: Record<string, string | undefined> = process.env,
): z.infer<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const formatted = result.error.format();
    console.error('[Config] Invalid environment variables:');
    console.error(JSON.stringify(formatted, null, 2));
    process.exit(1);
  }
  return result.data;
}

export function createServiceConfig<T extends z.ZodTypeAny>(
  schema: T,
): () => z.infer<T> {
  let cached: z.infer<T> | null = null;
  return () => {
    if (!cached) cached = parseEnv(schema);
    return cached;
  };
}

// ── Pre-built config accessors ─────────────────────────────────────────────────

export const getBaseConfig     = createServiceConfig(baseSchema);
export const getAuthConfig     = createServiceConfig(authServiceSchema);
export const getIdentityConfig = createServiceConfig(identityServiceSchema);

// Schema exports for extending
export { baseSchema, authServiceSchema, identityServiceSchema };
export { z };

// Type exports
export type BaseConfig      = z.infer<typeof baseSchema>;
export type AuthConfig      = z.infer<typeof authServiceSchema>;
export type IdentityConfig  = z.infer<typeof identityServiceSchema>;
