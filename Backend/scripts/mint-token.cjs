#!/usr/bin/env node
'use strict';
/**
 * Portable, dependency-free RS256 platform-JWT minter (Node builtins only).
 *
 * Signs with the platform private key so the minted token verifies against every
 * service's JWT_PUBLIC_KEY. Used by bootstrap (super-admin provisioning token) and by
 * the war-room harnesses (test buyers/admins). Path resolution is RELATIVE to the repo
 * root so this works on any machine (the old harnesses hard-coded an absolute D: path).
 *
 * Key source (first that resolves):
 *   1. $JWT_PRIVATE_KEY      (PEM literal; \n-escaped allowed)
 *   2. $JWT_PRIVATE_KEY_FILE (path to a .pem)
 *   3. <repoRoot>/docker/secrets/jwt_private_key.pem
 *
 * CLI:
 *   node Backend/scripts/mint-token.cjs --sub 9000099 --roles super_admin
 *   node Backend/scripts/mint-token.cjs --sub 9000001 --roles end_user --org <storeId>
 * Programmatic:
 *   const { mintToken, REPO_ROOT } = require('./mint-token.cjs');
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Backend/scripts/mint-token.cjs -> repo root is two levels up.
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_KEY = path.join(REPO_ROOT, 'docker', 'secrets', 'jwt_private_key.pem');
// Default org/store used by the commerce harnesses (the seeded Amarisé store).
const DEFAULT_ORG = 'a0a00000-0000-4000-8000-000000000001';

function loadPrivateKey() {
  if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PRIVATE_KEY.includes('PRIVATE KEY')) {
    return process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
  }
  const file = process.env.JWT_PRIVATE_KEY_FILE || DEFAULT_KEY;
  if (!fs.existsSync(file)) {
    throw new Error(
      `No platform private key found. Set $JWT_PRIVATE_KEY / $JWT_PRIVATE_KEY_FILE or create ${file} ` +
      `(run: pnpm run generate:keys, or bootstrap generates one).`
    );
  }
  return fs.readFileSync(file, 'utf8');
}

const b64url = (b) =>
  Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * @param {{ sub: string|number, roles?: string[], org?: string, ttlSeconds?: number, email?: string }} opts
 * @returns {string} signed RS256 JWT
 */
function mintToken(opts = {}) {
  const { sub, roles = [], org = DEFAULT_ORG, ttlSeconds = 3600, email } = opts;
  if (sub === undefined || sub === null) throw new Error('mintToken: sub is required');
  const priv = loadPrivateKey();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: 'baalvion-key-1' };
  const payload = {
    sub: String(sub),
    email: email || `user${sub}@baalvion.test`,
    org_id: org,
    sid: 'sess-' + crypto.randomUUID(),
    roles,
    role: roles[0] || null,
    permissions: [],
    jti: crypto.randomUUID(),
    iss: 'baalvion-auth',
    aud: 'baalvion-platform',
    iat: now,
    exp: now + ttlSeconds,
  };
  const input = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload));
  const sig = crypto.sign('RSA-SHA256', Buffer.from(input), priv);
  return input + '.' + b64url(sig);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--sub') out.sub = argv[++i];
    else if (a === '--roles') out.roles = String(argv[++i]).split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--org') out.org = argv[++i];
    else if (a === '--ttl') out.ttlSeconds = Number(argv[++i]);
    else if (a === '--email') out.email = argv[++i];
  }
  return out;
}

if (require.main === module) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.sub) {
      console.error('usage: node mint-token.cjs --sub <id> [--roles a,b] [--org <id>] [--ttl <s>] [--email <e>]');
      process.exit(2);
    }
    process.stdout.write(mintToken(args));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = { mintToken, REPO_ROOT, DEFAULT_ORG, DEFAULT_KEY };
