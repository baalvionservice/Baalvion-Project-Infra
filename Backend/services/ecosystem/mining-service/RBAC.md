# mining-service — RBAC & Auth Contract

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

## Authorization matrix (controller-level)
| Action                                          | Rule (canonical)                                                                 |
|-------------------------------------------------|----------------------------------------------------------------------------------|
| `GET /orders` (scope)                           | `buyer` role → own buyer orders; `seller` role → own seller orders; admin/owner/super_admin → all; otherwise own (buyer **OR** seller) |
| `PATCH/DELETE /listings/:id`, `POST .../publish`| listing owner (`seller_id === userId`) **or** admin/owner/super_admin            |
| `POST /listings/:id/feature`                    | admin/owner/super_admin                                                          |
| `PATCH /disputes/:id` (set `resolution`/`admin_notes`) | admin/owner/super_admin                                                   |
| `DELETE /warehouses/:id`                        | admin/owner/super_admin                                                          |
| `POST /verification/approve` & `/reject`        | admin/owner/super_admin                                                          |

## Domain roles & tie-break (orders)
`buyer` and `seller` are **domain roles** carried in `roles[]` (not part of the org-rank
hierarchy). The legacy scalar `role === 'buyer'` became `roles.includes('buyer')`.

> **Tie-break:** a user holding BOTH `buyer` and `seller` resolves to the **buyer** branch
> first. This preserves the original `if/else-if` precedence; the scalar model could not
> represent dual roles, so this is the documented, behavior-preserving choice. The non-domain
> fallback (`where buyer_id = me OR seller_id = me`) remains a safe superset for any single
> domain role.

## Rejected tokens (→ 401/403)
- HS256-signed tokens (algorithm confusion).
- Legacy tokens carrying `id` / `orgId` / `sessionId` instead of `sub` / `org_id` / `sid`.
- Missing, expired, or invalid-signature tokens; wrong `iss` / `aud`.

## Migration notes (Batch B)
- `config/appConfig.js`: `jwt.accessSecret` → `jwt.publicKey` / `issuer` / `audience` / `jwksUri`.
- `middleware/authMiddleware.js`: rewritten to the canonical verifier (no scalar role).
- `utils/jwtserver.js`: **deleted**.
- Controllers `ordersController` / `listingsController` / `disputeController` /
  `warehouseController` / `verificationController`: all scalar-role checks converted to
  roles-aware gates (admin → admin/owner/super_admin; buyer/seller → `roles.includes(...)`).
