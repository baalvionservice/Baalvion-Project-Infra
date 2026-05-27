# admin-service — RBAC & Auth Contract

**Phase 3 / Batch C canonical auth migration.** admin-service is a **consumer** (verifies
canonical RS256 auth-service tokens via `@baalvion/auth-node` `createAuthMiddleware`) **plus a
sanctioned impersonation issuer** (the only retained direct `jsonwebtoken` usage, for
impersonation flows only).

## Token verification
- Algorithm **RS256 only** (HS256 rejected).
- Issuer `baalvion-auth`, Audience `baalvion-platform` (was `baalvion-services` — corrected to canonical).
- Key: `JWT_PUBLIC_KEY` / `JWT_PUBLIC_KEY_PATH` / `JWT_PUBLIC_KEY_B64` (`staticPublicKey`/`staticPublicKeyB64`) + optional `BAALVION_JWKS_URI`.
- **JTI revocation**: `createAuthMiddleware` `isBlacklisted` hook checks Redis `auth:bl:<jti>` (fail-open only when Redis is unavailable).
- Entry point: `middleware/authMiddleware.js`.

## Claim mapping
| JWT claim | `req.auth` |
|---|---|
| `sub` → `userId` | `org_id` → `orgId` | `sid` → `sessionId` | `roles[]` → `roles` | `permissions[]` → `permissions` | `jti` → `jti` |

Back-compat `req.user = { id, orgId, roles }` (no scalar role).

## Role hierarchy
`viewer < member < editor < manager < admin < owner < super_admin`. Guards (from `@baalvion/auth-node`):
`requireRole(...)`, `requireOrgAdmin` (= admin/owner/super_admin), `requireSuperAdmin` (= super_admin only).

## Authorization matrix
| Surface | Rule |
|---|---|
| `routes/v1.js` (all v1) | `authMiddleware` (authenticated) |
| `routes/adminRoutes.js` | `requireSuperAdmin` |

## Impersonation (Special Case A — RETAINED, isolated)
- Issuer: **`baalvion-auth-impersonation`** (`config.jwt.impersonationIssuer`) — a DISTINCT issuer,
  NOT the canonical `baalvion-auth`. Canonical consumers (which pin `iss=baalvion-auth`) therefore
  **reject** impersonation tokens by default (fail-closed); a service that intends to honor
  impersonation must explicitly opt into this issuer.
- TTL: **`impersonationTtl` = 15 minutes** (reduced from 1h; security policy max).
- Token shape: canonical (`sub/org_id/sid/roles[]/jti`) + `impersonated_by` (admin user id).
- Audited: `auth.audit_logs` insert (`admin.impersonation_started`) + eventBus publish.
- Sanctioned `jwt.sign` in `service/adminService.js` — the only direct `jsonwebtoken` usage (RS256, `JWT_PRIVATE_KEY`).

> Runtime note: because impersonation tokens use a distinct issuer, end-to-end impersonation
> across services requires those services to accept `baalvion-auth-impersonation`. None do yet
> (deliberate fail-closed posture); wiring that acceptance is a follow-up.

## Rejected tokens (→ 401/403)
HS256; legacy `id`/`orgId`/`sessionId`; missing/expired/invalid-signature; wrong `iss`/`aud`; revoked `jti`.

## Migration notes (Batch C)
- `middleware/authMiddleware.js`: handwritten verify → `createAuthMiddleware` (+ JTI blacklist hook); roles[]-aware hierarchical guards.
- `config/appConfig.js`: added `jwksUri`/`impersonationIssuer`; audience → `baalvion-platform`; `impersonationTtl` → 15m.
- `service/adminService.js`: impersonation issuer → `baalvion-auth-impersonation`, claims add `roles[]`; removed dead `verifyToken` import.
- `utils/jwtVerify.js`: **deleted** (verification now via `createAuthMiddleware`).
