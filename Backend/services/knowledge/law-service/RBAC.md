# law-service — RBAC & Auth Contract

**Phase 4 (HS256 island retirement) — cutover complete.** law-service is now a **verify-only**
canonical consumer: it verifies **only** RS256 auth-service tokens via `@baalvion/auth-node`.
The local HS256 issuer (`utils/jwtserver.js`, `signAccessToken`) and the dual-issue bridge
(`service/canonicalUpgrade.js`) are **deleted**; `/login` + `/register` redirect to auth-service.

## Token verification
- Algorithm **RS256 only** (HS256 rejected); issuer `baalvion-auth`, audience `baalvion-platform`.
- `createJwksVerifier` (JWKS + `staticPublicKey` fallback), `requiredClaims=['sub','org_id','sid','jti']`, `rejectHs256`, `validateRolesPermissions`.

## Identity reconciliation (canonical ↔ legal)
law's business tables (`legal.lawyers/clients/documents/cases/...`) are keyed by the **local
`legal.users.id`**, but the canonical token's `sub` = `auth.users.id` (different; the importer
assigns fresh ids). `authMiddleware` maps them by **email** (preserved at import) and sets:
- `req.auth` = canonical `{ userId: sub(auth id), orgId, sessionId, roles[], permissions[], jti, email }`
- `req.user` = `{ id: <legal.users.id resolved by email>, orgId, roles, email }`

So controller joins on `req.user.id` (legal id) keep working unchanged; authorization uses `req.auth.roles`.

## Role map (legacy → canonical) and hierarchy
| legal role | canonical | (hierarchy: viewer<member<editor<manager<admin<owner<super_admin) |
|---|---|---|
| `admin`  | `admin`  | |
| `lawyer` | `editor` | |
| `client` | `member` | |

Admin gates accept `admin`/`owner`/`super_admin`: `(req.auth.roles||[]).some(r => ['admin','owner','super_admin'].includes(r))`.

## Authorization matrix
| Action | Rule |
|---|---|
| `GET /articles/:id` (non-published) | admin/owner/super_admin only (else published-only; public-safe) |
| article update/delete/publish | author (`author_id === req.user.id`) **or** admin/owner/super_admin |
| client/lawyer/document update/delete | owner (`user_id/owner_id === req.user.id`) **or** admin/owner/super_admin |
| admin endpoints, lawyer verify, feature, payment admin views | admin/owner/super_admin |
| bookings/cases/payments scoping | non-admins scoped to their own client/lawyer record |
| `/login`, `/register` | **308 redirect → auth-service** |
| `GET /me` | profile read by email-reconciled local id |

## Rejected tokens (→ 401/403)
HS256; legacy `id`/`orgId`/`sessionId`; missing canonical claims; wrong `iss`/`aud`; invalid signature.

## Migration notes (A4)
- `middleware/authMiddleware.js`: HS256 verify → canonical `createJwksVerifier` + email→legal-id reconciliation.
- `utils/jwtserver.js`, `service/canonicalUpgrade.js`: **deleted**.
- `controller/authController.js`: register/login → 308 redirect; `me` keyed by reconciled local id.
- 8 controllers: `req.user.role !== 'admin'` → roles-aware (`req.auth.roles`).
- `package.json`: removed `jsonwebtoken`, `bcrypt`, `bcryptjs`.
- law-elite gateway: HS256 `jwt.verify` → canonical `createJwksVerifier` (`@baalvion/auth-node`).
