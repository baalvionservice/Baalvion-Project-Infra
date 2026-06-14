# API Design — Baalvion Investment Platform

NestJS 11, global prefix **`/api/v1`**. JSON only. All times ISO-8601 UTC.

## Conventions

- **Auth:** `Authorization: Bearer <accessToken>` (RS256, 15 min). Refresh token is
  an httpOnly cookie (`baalvion_refresh`, scoped to `/auth`) and is also returned
  in the body for native/mobile clients.
- **Tenancy:** every authenticated request carries `orgId` + `role` in the JWT.
  Resource access is scoped to the caller's active organization.
- **Success envelope:** `{ "success": true, ...payload }`.
- **Error envelope:** `{ "success": false, "statusCode", "path", "timestamp", "error" }`.
- **Pagination:** `?page=1&limit=20` → `{ data, meta: { total, page, limit } }`.
- **Idempotency:** mutating money endpoints accept an `Idempotency-Key` header.
- **Rate limits:** global 120/min; auth endpoints 5–10/min (see `@Throttle`).
- **Roles:** `OWNER | ADMIN | MEMBER | VIEWER | COMPLIANCE` (per-org membership).

## Resource map

| Domain | Base path | Phase |
|--------|-----------|-------|
| Auth & MFA | `/auth` | 1 (built) |
| Users & orgs | `/users`, `/orgs` | 2 |
| Investor onboarding | `/investors`, `/investors/:id/accreditation` | 2 |
| KYC/AML (Sumsub) | `/compliance/kyc`, `/compliance/webhooks/sumsub` | 2 |
| Companies | `/companies`, `/companies/:id/profile` | 2 |
| Opportunities | `/opportunities` | 2 |
| Deals & deal room | `/deals`, `/deals/:id/messages`, `/deals/:id/members` | 2 |
| Documents / vault | `/documents`, `/documents/:id/download` | 2 |
| Due diligence | `/deals/:id/due-diligence`, `/deals/:id/requests` | 2 |
| Term sheets | `/deals/:id/term-sheets` | 3 |
| Signatures | `/deals/:id/signatures` | 3 |
| Investments | `/investments` | 3 |
| Escrow & payments | `/escrow`, `/payments`, `/payments/webhooks/{stripe,wise}` | 3 |
| Distributions/returns | `/distributions`, `/portfolio`, `/portfolio/returns` | 3 |
| Tax | `/tax/documents` | 3 |
| Secondary market | `/secondary/listings`, `/secondary/orders` | 3 (opt) |
| Admin | `/admin/*` | 3 |

## Auth endpoints (Phase 1 — implemented)

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/auth/register` | public | `email,password,fullName,country?` | Creates user + personal investor org (OWNER); returns token pair |
| POST | `/auth/login` | public | `email,password` | Returns token pair, or `{ mfaRequired, challengeToken }` |
| POST | `/auth/mfa/verify` | public | `challengeToken,code` | Completes MFA login → token pair |
| POST | `/auth/refresh` | public | `refreshToken?` (or cookie) | Rotates refresh token (reuse-detecting) |
| POST | `/auth/logout` | public | `refreshToken?` (or cookie) | Revokes the session |
| POST | `/auth/mfa/enroll` | bearer | — | Returns `otpauthUrl` + QR data URL |
| POST | `/auth/mfa/confirm` | bearer | `code` | Confirms TOTP, returns one-time backup codes |
| GET | `/auth/me` | bearer | — | Returns the authenticated principal |

## Token model

- **Access:** RS256 JWT, claims `{ sub, email, orgId, role, type:'access' }`,
  `iss=baalvion-invest`, `aud=baalvion-platform`, 15 min TTL.
- **Refresh:** opaque `<sessionId>.<secret>`, secret stored only as SHA-256.
  Rotated on every use inside a `familyId`; presenting a revoked token revokes
  the whole family (theft detection). 7-day TTL.
- **MFA challenge:** RS256 JWT `type:'mfa_challenge'`, 5 min TTL, issued between
  the password and TOTP steps.
