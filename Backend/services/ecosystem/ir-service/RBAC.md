# ir-service — RBAC & Auth Contract

**Phase 3 / Batch C canonical auth migration.** ir-service is a pure **consumer**: it verifies
**only** canonical RS256 auth-service tokens via `@baalvion/auth-node` `createAuthMiddleware`.
Local `utils/jwtserver.js` (HS256) removed; HS256 + legacy `id`/`orgId`/`sessionId` rejected.

## Token verification
- Algorithm **RS256 only** (HS256 rejected by the One True Verifier).
- Issuer `baalvion-auth`, Audience `baalvion-platform`.
- Key: `JWT_PUBLIC_KEY` (`staticPublicKey`) + optional `BAALVION_JWKS_URI` rotation.
- Entry point: `createAuthMiddleware` in `middleware/authMiddleware.js`; errors → `AppError` (401/403).

## Claim mapping
| JWT claim | `req.auth` | Notes |
|---|---|---|
| `sub` | `userId` | (was legacy `id`) |
| `org_id` | `orgId` | (was legacy `orgId`) |
| `sid` | `sessionId` | (was legacy `sessionId`) |
| `roles[]` | `roles` | replaces scalar `role` |
| `permissions[]` | `permissions` | |
| `jti` | `jti` | |

Back-compat `req.user = { id, orgId, roles }` (no scalar role).

## Role hierarchy (`@baalvion/auth-node`)
`viewer < member < editor < manager < admin < owner < super_admin`; `super_admin` passes all.

## Authorization matrix
| Action | Rule (canonical) |
|---|---|
| `GET /reports`, `GET /reports/:id`, `GET /reports/by-year` | **public** (no middleware); authenticated-only filters keyed off `req.user` (undefined when anonymous) |
| `POST/PATCH/DELETE` on contacts/documents/earnings/filings/shareholders | authenticated (`authMiddleware`) |
| `PATCH /reports/:id` (update) | `ir_manager` **or** admin/owner/super_admin |
| `DELETE /reports/:id` (non-draft) | admin/owner/super_admin only (draft deletable by any authenticated owner) |

**Domain role:** `ir_manager` is carried in `roles[]`. Scalar `['ir_manager','admin'].includes(req.user.role)`
→ `(req.auth.roles||[]).some(r => ['ir_manager','admin','owner','super_admin'].includes(r))`.

## Rejected tokens (→ 401/403)
HS256; legacy `id`/`orgId`/`sessionId` tokens; missing/expired/invalid-signature; wrong `iss`/`aud`.

## Migration notes (Batch C)
- `config/appConfig.js`: `jwt.accessSecret` (HS256) → `publicKey`/`issuer`/`audience`/`jwksUri`.
- `middleware/authMiddleware.js`: rewritten to canonical verifier.
- `utils/jwtserver.js`: **deleted**.
- `controller/reportsController.js`: 2 scalar-role checks → roles-aware.
