#!/usr/bin/env node
'use strict';

/**
 * Generate an RS256 keypair for JWT signing.
 *
 *   node scripts/generateKeys.js [kid]
 *
 * Writes <kid>.key (private) and <kid>.pub (public) into config/keys/ and
 * prints the env-var form for production secret managers. NEVER commit the
 * private key — config/keys/ must be gitignored.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const kid = process.argv[2] || `baalvion-key-${Date.now()}`;
const keysDir = path.resolve(__dirname, '../config/keys');
fs.mkdirSync(keysDir, { recursive: true });

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const privPath = path.join(keysDir, `${kid}.key`);
const pubPath = path.join(keysDir, `${kid}.pub`);
fs.writeFileSync(privPath, privateKey, { mode: 0o600 });
fs.writeFileSync(pubPath, publicKey);

console.log(`✓ Wrote ${privPath}`);
console.log(`✓ Wrote ${pubPath}`);
console.log('\n--- Production env (secret manager) ---');
console.log(`JWT_ACTIVE_KID=${kid}`);
console.log(`JWT_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"`);
console.log(`JWT_PUBLIC_KEYS={"${kid}":"${publicKey.replace(/\n/g, '\\n')}"}`);
