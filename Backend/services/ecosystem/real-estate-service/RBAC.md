# real-estate-service — RBAC & Auth Contract

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

## Authorization matrix (controller- & service-level)
| Action                                          | Rule (canonical)                                                                |
|-------------------------------------------------|---------------------------------------------------------------------------------|
| `GET /viewings` scope (`viewingsController`)    | admin/owner/super_admin **and** `orgId` → org-scoped; else own (`org_id` OR `user_id`) |
| `GET /viewings` scope (`svc.listViewings`)      | admin/owner/super_admin → org-scoped (properties in org); else requester's own  |
| `GET/PATCH/cancel/feedback /viewings/:id`       | admin/owner/super_admin **or** owner (`user_id === userId`) **or** same org      |
| `PATCH/DELETE /properties/:id`, `POST .../publish` | admin/owner/super_admin **or** same org (`org_id === orgId`)                  |
| `POST /properties/:id/feature`                  | admin/owner/super_admin                                                         |

> **Two viewing-list paths exist** (`controller/viewingsController.listViewings` and
> `controller/realEstateController.listViewings` → `service/realEstateService.listViewings`).
> Both were converted; this is a pre-existing duplication, not introduced by this migration.

## Legacy → canonical conversion
- Scalar `req.user.role !== 'admin'` → `!(req.auth.roles || []).some(r => ['admin','owner','super_admin'].includes(r))`.
- `req.user.role === 'admin'` (scoping branch) → `(req.auth.roles || []).some(r => ['admin','owner','super_admin'].includes(r))`.
- **Service-layer handoff:** `realEstateController.listViewings` previously passed a scalar
  `role: req.user.role` into `service/realEstateService.js`. The service signature is now
  `roles` and its `role === 'admin' || role === 'owner'` branch became
  `(roles || []).some(r => ['admin','owner','super_admin'].includes(r))` — removing the
  scalar-role assumption end-to-end (controller → service). `super_admin` is added to the
  org-scope set for hierarchy consistency.

## Rejected tokens (→ 401/403)
- HS256-signed tokens (algorithm confusion).
- Legacy tokens carrying `id` / `orgId` / `sessionId` instead of `sub` / `org_id` / `sid`.
- Missing, expired, or invalid-signature tokens; wrong `iss` / `aud`.

## Migration notes (Batch B)
- `config/appConfig.js`: `jwt.accessSecret` → `jwt.publicKey` / `issuer` / `audience` / `jwksUri`.
- `middleware/authMiddleware.js`: rewritten to the canonical verifier (no scalar role).
- `utils/jwtserver.js`: **deleted**.
- Controllers `viewingsController` / `propertiesController` / `realEstateController` and
  `service/realEstateService.js`: all scalar-role checks converted to roles-aware gates.
