# Deleted / Retired Auth Modules — Auth Unification

Each removal was verified to have **no remaining importers** before deletion.

| Module | When | Verified dead by | Replaced by |
|---|---|---|---|
| `services/knowledge/law-service/utils/jwtserver.js` | LAW A4 (`10eb0a4`) | grep: only `authMiddleware` imported it; rewritten to `createJwksVerifier` | `@baalvion/auth-node` |
| `services/knowledge/law-service/service/canonicalUpgrade.js` | LAW A4 (`10eb0a4`) | dual-issue bridge unused post-cutover | n/a (cutover) |
| `services/identity/auth-service/utils/jwtserver.js` | Phase 10 | grep `rg jwtserver Backend/services/identity/auth-service` → 0 importers (issuance uses `utils/jwtRsa.js`) | `utils/jwtRsa.js` (RS256 issuer) |
| `services/ecosystem/about-service/...` legacy adapters etc. | Batches A–C | superseded by `createAuthMiddleware` migration | `@baalvion/auth-node` |

## NOT deleted (still LIVE — do NOT remove)
These are flagged by `check-auth-middleware` but are **active, un-migrated** (not dead) — removing them
would break the service. They are retired when their island is migrated (separate work):
- `services/commerce/trade-service/utils/jwtserver.js` + `middleware/{authMiddleware,tenantContext}.js`
- `services/ecosystem/elite-circle-service/utils/jwtserver.js`
- `services/ecosystem/insiders-service/utils/jwtserver.js`

## Flagged as unused (not a service dependency)
- `packages/middleware/src/index.ts` — direct `jsonwebtoken` import; **no canonical service imports it**
  (`rg @baalvion/middleware Backend/services` → 0). Migrate to `@baalvion/auth-node` or remove. Not a
  runtime risk today (unused).
