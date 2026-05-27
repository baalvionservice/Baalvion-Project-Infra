# jobs-service — RBAC & Auth Contract

**Phase 3 / Batch B canonical auth migration.** This service verifies **only** canonical
RS256 tokens issued by `auth-service`. The local `utils/jwtserver.js` was removed; HS256 and
legacy `id`/`orgId`/`sessionId` tokens are rejected.

## Token verification
- Algorithm: **RS256 only** — HS256 rejected by the One True Verifier in `@baalvion/auth-node`.
- Issuer: `baalvion-auth` (`JWT_ISSUER`)
- Audience: `baalvion-platform` (`JWT_AUDIENCE`)
- Key: `JWT_PUBLIC_KEY` (PEM) as `staticPublicKey`; rotation via `BAALVION_JWKS_URI` / `JWKS_URI` (`jwksUri`).
- Entry point: `createAuthMiddleware` in `middleware/authMiddleware.js`; verifier errors normalized to `AppError` (401/403).

## Claim mapping (canonical token → request)
| JWT claim       | `req.auth`    | Notes                                   |
|-----------------|---------------|-----------------------------------------|
| `sub`           | `userId`      | replaces legacy scalar `id`             |
| `org_id`        | `orgId`       | replaces legacy `orgId`                 |
| `sid`           | `sessionId`   | replaces legacy `sessionId`             |
| `roles[]`       | `roles`       | array; replaces scalar `role`           |
| `permissions[]` | `permissions` | array                                   |
| `jti`           | `jti`         | token id                                |

Back-compat shape: `req.user = { id, orgId, roles }` — **no scalar `role`.**

## Role hierarchy (`@baalvion/auth-node` rbac)
`viewer < member < editor < manager < admin < owner < super_admin`.
`requireRole(X)` passes for role `X` or any higher rank; `super_admin` passes every permission check.

## Authorization model
- All protected routes require a valid canonical token (`authMiddleware`).
- **No scalar-role authorization gates exist in jobs-service controllers** — verified by grep
  (`req.user.role` / `decoded.id` / `jwt.verify` / `jsonwebtoken` → none).
- Resource scoping uses `req.user.id` / `req.user.orgId`.
- Hierarchical `requireRole(...)` / `requirePermission(...)` guards are exported from the
  middleware for any route-level restrictions.

## Rejected tokens (→ 401/403)
- HS256-signed tokens (algorithm confusion).
- Legacy tokens carrying `id` / `orgId` / `sessionId` instead of `sub` / `org_id` / `sid`.
- Missing, expired, or invalid-signature tokens; wrong `iss` / `aud`.

## Migration notes (Batch B)
- `config/appConfig.js`: `jwt.accessSecret` → `jwt.publicKey` / `issuer` / `audience` / `jwksUri`.
- `middleware/authMiddleware.js`: rewritten to the canonical verifier (no scalar role).
- `utils/jwtserver.js`: **deleted**.
- Controllers: no changes required (no scalar-role checks present).
