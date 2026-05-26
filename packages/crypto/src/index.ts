import { createHash, randomBytes, createHmac, timingSafeEqual } from 'crypto';

/**
 * Generates a cryptographically random hex token.
 * @param byteLength Number of random bytes (output is 2× this length in hex)
 */
export function generateToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('hex');
}

/**
 * Generates a base64url-safe random token (URL safe, no padding).
 */
export function generateUrlSafeToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('base64url');
}

/**
 * SHA-256 hash of a string value — used for storing tokens in the DB.
 * Never store raw tokens; always store the hash.
 */
export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * HMAC-SHA256 signature — used for service-to-service request signing.
 */
export function hmacSign(message: string, secret: string): string {
  return createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Constant-time comparison — prevents timing attacks on token comparison.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Derives a stable identifier from a public key DER (for JWKS kid).
 */
export function deriveKeyId(publicKeyDer: Buffer): string {
  return createHash('sha256').update(publicKeyDer).digest('base64url').slice(0, 16);
}

/**
 * Generates a deterministic bucket (0-99) for percentage rollouts.
 * Same input always produces the same bucket → consistent user experience.
 */
export function rolloutBucket(key: string, userId: string): number {
  const hash = createHash('sha256').update(`${key}:${userId}`).digest('hex');
  return parseInt(hash.slice(0, 8), 16) % 100;
}
