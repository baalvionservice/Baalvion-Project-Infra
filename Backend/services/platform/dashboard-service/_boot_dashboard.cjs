// Dev bootstrap: derive the RS256 public key (PEM) from auth-service JWKS, set the gateway-trust
// secret, then start the service. appConfig.js's dotenv.config() loads the rest (DB, port) from .env.
(async () => {
  const res = await fetch('http://127.0.0.1:3001/.well-known/jwks.json');
  const { keys } = await res.json();
  const { createPublicKey } = require('crypto');
  const pem = createPublicKey({ key: keys[0], format: 'jwk' }).export({ type: 'spki', format: 'pem' });
  process.env.JWT_PUBLIC_KEY = pem;
  if (!process.env.GATEWAY_SIGNING_SECRET) {
    process.env.GATEWAY_SIGNING_SECRET = 'dev_gateway_signing_secret_change_me_min32';
  }
  require('./index.js');
})().catch((e) => { console.error('boot failed:', e); process.exit(1); });
