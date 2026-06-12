import type { Env } from './env.validation';

/**
 * PEM keys are commonly stored \n-escaped in single-line env vars. Normalize
 * them back to real newlines so the crypto layer can parse them.
 */
function normalizePem(value: string): string {
  return value.includes('BEGIN') ? value.replace(/\\n/g, '\n') : value;
}

/**
 * Structured, typed configuration consumed via ConfigService.get('jwt') etc.
 * Reads from already-validated process.env (see validateEnv).
 */
export function configuration() {
  const env = process.env as unknown as Env;
  return {
    nodeEnv: env.NODE_ENV,
    port: Number(env.API_PORT),
    webOrigin: env.WEB_ORIGIN,
    jwt: {
      accessPrivateKey: normalizePem(env.JWT_ACCESS_PRIVATE_KEY),
      accessPublicKey: normalizePem(env.JWT_ACCESS_PUBLIC_KEY),
      accessTtl: Number(env.JWT_ACCESS_TTL),
      refreshTtl: Number(env.JWT_REFRESH_TTL),
    },
    mfa: {
      issuer: env.MFA_ISSUER,
    },
    encryptionKey: env.ENCRYPTION_KEY,
  };
}

export type AppConfig = ReturnType<typeof configuration>;
