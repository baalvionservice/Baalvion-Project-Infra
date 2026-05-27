# Baalvion Canonical JWT Contract (`@baalvion/auth-node`)

Status: **Phase 2 foundation.** This defines the ONE canonical token contract and the
ONE canonical verifier for the Baalvion ecosystem. Consumers are **not yet migrated**
(Phase 3) — legacy claim shapes still exist in the wild and are **deprecated**.

---

## 1. Canonical JWT schema

RS256 access token issued by **auth-service** (`utils/jwtRsa.js`) — and, during the
migration window, by **proxy-service** (`claimStyle:'canonical'`).

```jsonc
{
  "sub":         "user-uuid",          // subject = user id            (REQUIRED)
  "org_id":      "org-uuid",           // tenant / organization id     (REQUIRED)
  "sid":         "session-uuid",       // session id                   (REQUIRED)
  "jti":         "token-uuid",         // unique token id (revocation) (REQUIRED)
  "roles":       ["admin"],            // ALWAYS an array              (REQUIRED)
  "permissions": ["read:org"],         // ALWAYS an array              (REQUIRED, may be [])
  "iss":         "baalvion-auth",      // issuer                       (REQUIRED)
  "aud":         "baalvion-platform",  // audience                     (REQUIRED)
  "iat":         1730000000,           // issued-at  (set by signer)
  "exp":         1730000900,           // expiry     (set by signer)

  // ── optional / transitional ──────────────────────────────────────────────
  "email":        "user@example.com",  // optional
  "tokenVersion": 0,                    // optional (session-revocation generation)
  "role":         "admin",              // DEPRECATED scalar alias = roles[0] (one phase only)
  "impersonated_by": "admin-uuid"       // optional (admin impersonation)
}
```

### Required claims
`sub`, `org_id`, `sid`, `jti`, `roles[]`, `permissions[]`, `iss`, `aud`.

### Optional claims
`email`, `tokenVersion`, `impersonated_by`, and the **deprecated** `role` scalar.

### Algorithm policy
- **RS256 only.** HS256 is rejected by the canonical verifier (`rejectHs256: true`).
- Tokens carry a `kid` header; verification resolves the key via JWKS.

### Issuer / audience requirements
- `iss` MUST equal the configured issuer (default `baalvion-auth`).
- `aud` MUST equal the configured audience (default `baalvion-platform`).
- Verifiers enforce both when configured.

---

## 2. JWKS endpoint spec

Served by auth-service:

- `GET /.well-known/jwks.json` — RS256 public keys; supports multiple `kid` values
  (active key + optional retiring keys via `JWT_ADDITIONAL_PUBLIC_KEYS`).
- `GET /.well-known/openid-configuration` — discovery doc (issuer, jwks_uri,
  token/authorization/userinfo endpoints, supported algs/response-types/grant-types,
  `claims_supported`).

```jsonc
// jwks.json
{ "keys": [ { "kty": "RSA", "use": "sig", "alg": "RS256", "kid": "<fingerprint>", "n": "...", "e": "AQAB" } ] }
```

---

## 3. The One True Verifier — `createJwksVerifier(opts)`

```js
const { createJwksVerifier } = require('@baalvion/auth-node');
const verifier = createJwksVerifier({
  jwksUri:        'http://baalvion-auth:3001/.well-known/jwks.json',
  issuer:         'baalvion-auth',
  audience:       'baalvion-platform',
  requiredClaims: ['sub', 'org_id', 'sid', 'jti'],   // enforced (default [] = off)
  rejectHs256:    true,                               // RS256 only (default false)
  validateRolesPermissions: true,                     // roles/permissions must be arrays
  isBlacklisted:  async (jti) => redis.sismember('jwt:blacklist', jti),
  jwksTtlMs:      300000,                              // JWKS cache TTL
});
const payload = await verifier.verify(token);         // throws VerifyError on failure
```

Capabilities: JWKS fetch + cache, `kid` rotation, issuer/audience/expiry validation,
required-claims validation, role/permission shape validation, JTI revocation.
> Backward compatible: with default opts (no `requiredClaims`, `rejectHs256:false`) it
> behaves exactly as before, so legacy callers (e.g. realtime-service) are unaffected.

---

## 4. Canonical middleware — `createAuthMiddleware(opts)`

```js
const { createAuthMiddleware } = require('@baalvion/auth-node');
app.use(createAuthMiddleware({
  jwksUri:       process.env.JWKS_URI,
  issuer:        process.env.JWT_ISSUER,
  audience:      process.env.JWT_AUDIENCE,
  isBlacklisted: (jti) => redis.sismember('jwt:blacklist', jti),
}));
```

### `req.auth` schema (canonical)
```jsonc
{
  "userId":      "<sub>",
  "orgId":       "<org_id>",
  "sessionId":   "<sid>",
  "roles":       ["admin"],     // ALWAYS array
  "permissions": ["read:org"],  // ALWAYS array
  "jti":         "<jti>",
  "issuer":      "<iss>",
  "audience":    "<aud>"
}
```
Invalid tokens **fail hard** — there is NO legacy `id`/`orgId`/`sessionId` coercion in
canonical mode. Errors propagate via `next(err)` with `err.status=401` and `err.code`.

---

## 5. Migration table — legacy → canonical

| Legacy claim / field        | Canonical claim | Notes |
|-----------------------------|-----------------|-------|
| `id`                        | `sub`           | user id |
| `orgId` / `organizationId`  | `org_id`        | tenant id |
| `sessionId`                 | `sid`           | session id |
| `role` (scalar)             | `roles[]`       | `role` kept ONE phase as `roles[0]` |
| (none)                      | `jti`           | now required (revocation) |
| HS256 tokens                | RS256 only      | HS256 rejected by canonical verifier |

`req.auth` mapping: `sub → userId`, `org_id → orgId`, `sid → sessionId`.

---

## 6. Failure modes (`VerifyError.code`)

| code                   | meaning |
|------------------------|---------|
| `malformed`            | token not decodable |
| `alg_not_allowed`      | non-RS256 alg in canonical mode |
| `unknown_kid`          | no JWKS key for the token's `kid` |
| `no_method`            | no valid verification method available |
| `missing_claim`        | a required claim is absent/empty |
| `malformed_roles`      | `roles` is not an array |
| `malformed_permissions`| `permissions` is not an array |
| `revoked`              | `jti` is blacklisted |
| `blacklist_unavailable`| revocation store errored (fail-closed) |
| (jsonwebtoken errors)  | expired / wrong iss / wrong aud / bad signature |

---

## 7. Security guarantees

- **RS256 only** in canonical mode; HS256 cannot be presented to bypass verification.
- **No shared secret** needed by verifiers — public-key verification via JWKS.
- **Issuer + audience** enforced.
- **Expiry** enforced by `jsonwebtoken`.
- **Required claims** enforced; identity/tenant/session can never be silently `undefined`.
- **Revocation**: JTI blacklist checked on every verify; the store is consulted via an
  injected async function and **fails closed** if unavailable.
- **No legacy coercion**: malformed/legacy tokens fail hard rather than degrade.

---

## 8. Revocation behavior

- On logout / password reset / "log out everywhere", auth-service blacklists the access
  token's `jti` (Redis) until natural expiry.
- The canonical verifier rejects a blacklisted `jti` with `code: 'revoked'`.
- Blacklist lookup is injected (`isBlacklisted`) so `@baalvion/auth-node` stays
  storage-agnostic; a backend outage results in `blacklist_unavailable` (fail-closed).

---

## 9. Deprecation notice

These are **deprecated** and will be removed after the migration window:
- the scalar `role` claim (use `roles[]`),
- the legacy claim names `id` / `orgId` / `organizationId` / `sessionId`,
- HS256-issued service tokens and per-service local verifiers.

Phases 3+ migrate every consumer onto `createAuthMiddleware` and this contract.
