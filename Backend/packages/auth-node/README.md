# @baalvion/auth-node

**Canonical backend JWT authority.** This is the **only** module in the monorepo
permitted to import `jsonwebtoken` (enforced by `catalog/enforce.mjs`, condition
**C3 — no auth duplication**). Every backend service consumes token verification
and issuance through here via a thin `utils/jwtserver.js` adapter.

## Why

Before this package, ~20 services each shipped a hand-copied `utils/jwtserver.js`.
They drifted: some verified RS256/JWKS, most only did legacy `jwt.verify(token,
sharedSecret)` and could not verify the RS256 tokens the issuer now mints. One lib,
one behaviour, one place to rotate keys.

## Usage

```js
const { createAuthServer } = require('@baalvion/auth-node'); // or relative in-repo
const config = require('../config/appConfig');

// verify-only service
const auth = createAuthServer({ accessSecret: config.jwt.accessSecret, env: config.env });
module.exports = { verifyAccessToken: (t) => auth.verifyAccessToken(t) };
```

### Options

| option | default | purpose |
|---|---|---|
| `accessSecret` / `refreshSecret` | — | HS256 secrets |
| `accessExpiresIn` / `refreshExpiresIn` | `24h` / `7d` | token TTLs |
| `env` | `process.env.NODE_ENV` | governs HS256-fallback default |
| `keysDir` / `activeKid` / `issuer` / `audience` | env / defaults | RS256 + JWKS |
| `claimStyle` | `'sub'` | `'sub'` (modern) or `'id'` (legacy issuer) |
| `normalizeClaims` | `false` | add `userId`/`organizationId` to decoded |
| `disableRs256` | `false` | force HS256 regardless of ambient keys |
| `requireRs256InProduction` | `false` | refuse to boot without RS256 in prod |

A service with no RS256 keys transparently stays on HS256 (identical to its old
behaviour) and gains RS256 verification the moment keys are configured.

## Verification scheme

`verifyAccessToken` decodes the header, verifies RS256 against the JWKS when the
token is RS256 and keys are present, otherwise falls back to HS256 (gated by
`allowHs256Fallback`, default = non-production). RS256 + JWKS is the target state.

## Test

```
node test.smoke.js
```
