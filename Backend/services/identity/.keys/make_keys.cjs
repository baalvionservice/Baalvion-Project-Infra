'use strict';
// Extract the platform RS256 keypair from the running baalvion-auth container
// and write valid multi-line PEM files. No shell-escaping ambiguity.
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function fromContainer(varName) {
  const raw = execSync(`docker exec baalvion-auth printenv ${varName}`, { encoding: 'utf8' });
  // Container stores PEM with escaped \n sequences; turn them into real newlines.
  return raw.replace(/\\n/g, '\n').trim() + '\n';
}

const priv = fromContainer('JWT_PRIVATE_KEY');
const pub = fromContainer('JWT_PUBLIC_KEY');

fs.writeFileSync(path.join(__dirname, 'jwt_private.pem'), priv);
fs.writeFileSync(path.join(__dirname, 'jwt_public.pem'), pub);

// Authoritative validation: load both and round-trip a signature.
const pk = crypto.createPrivateKey(priv);
const pubk = crypto.createPublicKey(pub);
const sig = crypto.sign('sha256', Buffer.from('probe'), pk);
const ok = crypto.verify('sha256', Buffer.from('probe'), pubk, sig);

console.log('private.pem lines:', priv.split('\n').length);
console.log('public.pem  lines:', pub.split('\n').length);
console.log('keypair valid & matched:', ok);
