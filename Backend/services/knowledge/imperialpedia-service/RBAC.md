# imperialpedia-service — RBAC & Auth Contract

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

Back-compat shape: `req.user = { id, orgId, roles }` — **no scalar `role`.** Ownership-or-admin
checks read `req.auth.roles`.

## Role hierarchy (`@baalvion/auth-node` rbac)
`viewer < member < editor < manager < admin < owner < super_admin`.
`requireRole(X)` passes for role `X` or any higher rank; `super_admin` passes every permission check.

## Authorization matrix (controller-level)
| Action                                | Rule (canonical)                                                |
|---------------------------------------|-----------------------------------------------------------------|
| `PATCH /articles/:id`                 | author (`author_id === userId`) **or** admin/owner/super_admin  |
| `DELETE /articles/:id`                | author **or** admin/owner/super_admin                           |
| `POST /articles/:id/publish`          | author **or** admin/owner/super_admin                           |
| `PATCH /community/posts/:id`          | author (`author_id === userId`) **or** admin/owner/super_admin  |
| `DELETE /community/posts/:id`         | author **or** admin/owner/super_admin                           |
| `POST /community/posts/:id/pin`       | admin/owner/super_admin                                         |
| `POST /assets` (upsert)               | admin/owner/super_admin **or** `system`                         |
| `POST /leaderboard/refresh`           | admin/owner/super_admin                                         |
| create / like / vote / comment        | any authenticated user                                          |
| `GET` list & detail endpoints          | public (no auth)                                                |

## Legacy → canonical conversion
- Scalar `req.user.role !== 'admin'` → `!(req.auth.roles || []).some(r => ['admin','owner','super_admin'].includes(r))`.
- Ownership checks keep `author_id === req.user.id` (back-compat `req.user.id`).
- The `system` role is preserved as an explicit member of the `POST /assets` allow-list
  (`['admin','owner','super_admin','system']`).

## Rejected tokens (→ 401/403)
- HS256-signed tokens (algorithm confusion).
- Legacy tokens carrying `id` / `orgId` / `sessionId` instead of `sub` / `org_id` / `sid`.
- Missing, expired, or invalid-signature tokens; wrong `iss` / `aud`.

## Migration notes (Batch B)
- `config/appConfig.js`: `jwt.accessSecret` → `jwt.publicKey` / `issuer` / `audience` / `jwksUri`.
- `middleware/authMiddleware.js`: rewritten to the canonical verifier (no scalar role).
- `utils/jwtserver.js`: **deleted**.
- Controllers `articlesController` / `communityController` / `assetsController` / `leaderboardController`:
  8 scalar-role checks converted to roles-aware ownership-or-admin gates.
