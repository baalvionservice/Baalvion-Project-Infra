#!/usr/bin/env node
/**
 * gen-dev-jwt-keys.mjs — generate a FIXED dev RS256 keypair for local/CI.
 *
 * Why: auth-service signs access tokens RS256 (utils/jwtRsa.js). Every other
 * service must verify them with the matching PUBLIC key. In dev, auth-service's
 * vault.js would otherwise mint an EPHEMERAL keypair on each boot that nobody
 * else can verify. This script materialises ONE shared keypair so the whole
 * fleet agrees.
 *
 * Outputs:
 *   docker/secrets/jwt_private_key.pem   (gitignored — *.pem)
 *   docker/secrets/jwt_public_key.pem    (gitignored — *.pem)
 *   .env  ← appends/updates JWT_PRIVATE_KEY, JWT_PUBLIC_KEY (single-line, \n-escaped)
 *
 * The kid is the SHA-256 fingerprint of the SPKI DER, matching
 * Backend/services/identity/auth-service/config/vault.js so JWKS `kid` lines up.
 *
 * Run:  node scripts/gen-dev-jwt-keys.mjs
 * NEVER use these keys in production — provision real keys via your secret store.
 */
import { generateKeyPairSync, createPublicKey, createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const secretsDir = join(root, 'docker', 'secrets');
mkdirSync(secretsDir, { recursive: true });

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const der = createPublicKey(publicKey).export({ type: 'spki', format: 'der' });
const kid = createHash('sha256').update(der).digest('base64url').slice(0, 16);

writeFileSync(join(secretsDir, 'jwt_private_key.pem'), privateKey, { mode: 0o600 });
writeFileSync(join(secretsDir, 'jwt_public_key.pem'), publicKey, { mode: 0o644 });

// Single-line, \n-escaped forms for .env (consumed by vault.js step 3 + @baalvion/auth-node normalizePem)
const inline = (pem) => pem.trim().replace(/\n/g, '\\n');
const envLines = {
  JWT_PRIVATE_KEY: inline(privateKey),
  JWT_PUBLIC_KEY: inline(publicKey),
};

const envPath = join(root, '.env');
// Read atomically: attempt the read directly and treat a missing file as empty,
// instead of existsSync()-then-read() which opens a TOCTOU race (the file could
// be created/removed between the check and the read/write).
let env = '';
try {
  env = readFileSync(envPath, 'utf8');
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}
for (const [k, v] of Object.entries(envLines)) {
  const line = `${k}=${v}`;
  const re = new RegExp(`^${k}=.*$`, 'm');
  env = re.test(env) ? env.replace(re, line) : (env.endsWith('\n') || env === '' ? env : env + '\n') + line + '\n';
}
writeFileSync(envPath, env);

console.log('✅ Dev RS256 keypair generated.');
console.log('   docker/secrets/jwt_private_key.pem  (gitignored)');
console.log('   docker/secrets/jwt_public_key.pem   (gitignored)');
console.log('   .env updated: JWT_PRIVATE_KEY, JWT_PUBLIC_KEY (single-line)');
console.log('   kid =', kid, '(SHA-256 SPKI fingerprint — matches auth-service vault.js)');
