# dashboard-service — RBAC & Auth Contract

**Phase 3 / Batch B canonical auth migration.** This service verifies **only** canonical
RS256 tokens issued by `auth-service`. The local `utils/jwtserver.js` was removed; HS256 and
legacy `id`/`orgId`/`sessionId` tokens are rejected.

## Token verification
- Algorithm: **RS256 only** — HS256 rejected by the One True Verifier in `@baalvion/auth-node`.
- Issuer: `baalvion-auth` (`JWT_ISSUER`)
- Audience: `baalvion-platform` (`JWT_AUDIENCE`)
- Key: `JWT_PUBLIC_KEY` (PEM) as `staticPublicKey`; rotation via `BAALVION_JWKS_URI` / `JWKS_URI` (`jwksUri`).
- Entry point: `createAuthMiddleware` in `middleware/authMiddleware.js`; verifier errors are normalized to `AppError` (401 unauthorized / 403 forbidden).

## Claim mapping (canonical token → request)
| JWT claim       | `req.auth`    | Notes                                   |
|-----------------|---------------|-----------------------------------------|
| `sub`           | `userId`      | replaces legacy scalar `id`             |
| `org_id`        | `orgId`       | replaces legacy `orgId`                 |
| `sid`           | `sessionId`   | replaces legacy `sessionId`             |
| `roles[]`       | `roles`       | array; replaces scalar `role`           |
| `permissions[]` | `permissions` | array                                   |
| `jti`           | `jti`         | token id                                |

Back-compat shape: `req.user = { id, orgId, roles, role }`.

> **`role` (singular) = `roles[0] ?? null` and is AUDIT-LOG METADATA ONLY.** It is written to
> the `AuditLog.role` column by `auditController` / `domainController` (and the per-controller
> audit helpers). It is **never** used as an authorization gate in this service. This is the
> single documented reason the `role` alias is retained here but dropped in the other Batch B
> services.

## Role hierarchy (`@baalvion/auth-node` rbac)
`viewer < member < editor < manager < admin < owner < super_admin`.
`requireRole(X)` passes for role `X` or any higher rank; `super_admin` passes every permission check.

## Authorization model
- All protected routes require a valid canonical token (`authMiddleware`).
- Resource scoping is by **org** (`req.user.orgId`) and **user** (`req.user.id`).
- **No scalar-role auth gates exist in controllers** — verified by grep: every `req.user.role`
  occurrence is an object property (`role: …`) written to an audit-log row, not an `if` gate.
- Route-level role/permission restrictions, where applied, use the exported hierarchical
  `requireRole(...)` / `requirePermission(...)` guards.

## Rejected tokens (→ 401/403)
- HS256-signed tokens (algorithm confusion).
- Legacy tokens carrying `id` / `orgId` / `sessionId` instead of `sub` / `org_id` / `sid`.
- Missing, expired, or invalid-signature tokens; wrong `iss` / `aud`.

## Migration notes (Batch B)
- `config/appConfig.js`: `jwt.accessSecret` (HS256 shared secret) → `jwt.publicKey` / `issuer` / `audience` / `jwksUri`.
- `middleware/authMiddleware.js`: rewritten to the canonical verifier; retains the `role` audit alias.
- `utils/jwtserver.js`: **deleted**.
- Controllers: logic unchanged — `role:` references are audit metadata.
