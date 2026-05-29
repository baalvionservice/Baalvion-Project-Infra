// Dev bootstrap: derive RS256 public key from auth-service JWKS, then start the service.
// appConfig.js calls dotenv.config() so DB creds load from .env automatically.
(async () => {
  const { createPublicKey } = require('crypto');
  try {
    const res = await fetch('http://127.0.0.1:3001/.well-known/jwks.json');
    const { keys } = await res.json();
    const pem = createPublicKey({ key: keys[0], format: 'jwk' }).export({ type: 'spki', format: 'pem' });
    process.env.JWT_PUBLIC_KEY = pem;
  } catch (e) {
    console.error('boot: could not fetch JWKS from auth-service:', e.message);
    process.exit(1);
  }
  require('./index.js');
})();
