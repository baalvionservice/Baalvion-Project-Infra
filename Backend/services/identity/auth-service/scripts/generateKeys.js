#!/usr/bin/env node
'use strict';
/**
 * Generates a 2048-bit RSA keypair and writes it to disk.
 * Run once per environment:
 *
 *   node scripts/generateKeys.js
 *   node scripts/generateKeys.js --out ./keys --bits 4096
 *
 * Then set in .env:
 *   JWT_PRIVATE_KEY_PATH=./keys/private.pem
 *   JWT_PUBLIC_KEY_PATH=./keys/public.pem
 */
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const args    = process.argv.slice(2);
const outArg  = args.indexOf('--out');
const bitsArg = args.indexOf('--bits');
const outDir  = outArg  >= 0 ? args[outArg  + 1] : path.join(__dirname, '..', 'keys');
const bits    = bitsArg >= 0 ? Number(args[bitsArg + 1]) : 2048;

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength:   bits,
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const privFile = path.join(outDir, 'private.pem');
const pubFile  = path.join(outDir, 'public.pem');

fs.writeFileSync(privFile, privateKey,  { mode: 0o600 });
fs.writeFileSync(pubFile,  publicKey);

// Derive kid for informational output
const pubObj = crypto.createPublicKey(publicKey);
const der    = pubObj.export({ type: 'spki', format: 'der' });
const kid    = crypto.createHash('sha256').update(der).digest('base64url').slice(0, 16);

console.log(`\n✓ RSA-${bits} keypair generated`);
console.log(`  private: ${privFile}`);
console.log(`  public:  ${pubFile}`);
console.log(`  kid:     ${kid}`);
console.log(`\nAdd to .env:`);
console.log(`  JWT_PRIVATE_KEY_PATH=${privFile}`);
console.log(`  JWT_PUBLIC_KEY_PATH=${pubFile}\n`);
