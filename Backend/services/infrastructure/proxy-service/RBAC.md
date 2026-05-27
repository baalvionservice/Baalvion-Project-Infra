# proxy-service — RBAC & Auth Contract

**Phase 3 / Batch C canonical auth migration (bounded hardening).** proxy-service is a
**sanctioned temporary issuer** (own RS256 keys in `config/keys`, own login / SSO / API-key
planes) AND a consumer of its own tokens, slated for later retirement. All JWT verification is
now **RS256-only** via `@baalvion/auth-node` `createAuthServer` with `allowHs256Fallback:false`.

## Token verification
- All JWT verify paths (`middleware/authMiddleware.js` user-JWT, `middleware/authenticateRequest.js`
  unified apiKey+JWT, `service/socketService.js` WebSocket) call the shared `utils/jwtserver.js`
  verifier, now **RS256-only** (`allowHs256Fallback:false`) — **HS256 tokens are rejected** when
  RS256 keys are present (proxy's `keysDir`; production enforces RS256 via `requireRs256InProduction`).
- Issuer `baalvion-auth`, Audience `baalvion-platform`, kid-based RS256 (`keysDir`/`activeKid`).

## Issued claims (canonical — Special Case B)
`generateAccessToken` uses `claimStyle:'canonical'` → emits **`sub`, `org_id`, `sid`, `roles[]`,
`permissions[]`, `jti`** (plus a deprecated scalar `role` alias). **No `organizationId`/`sessionId`
claims are emitted.** Verified by smoke (`emitted claims canonical … organizationId/sessionId ABSENT`).

## Auth context (`req.auth`)
| Field | Source |
|---|---|
| `userId` | `sub` (normalized) |
| `orgId` | `org_id` (canonical) |
| `organizationId` | **back-compat ALIAS of `orgId`** — internal property consumed by ~20 controllers/services + the API-key/proxy-egress planes. NOT a JWT claim. Scheduled for a dedicated proxy-internal rename. |
| `sessionId` | `sid` |
| `roles` | `roles[]` (canonical) |
| `role` | DEPRECATED scalar alias — **DB-authoritative single membership role**, set by `requireOrganizationAccess` from `org_memberships` (overrides any token role) |
| `permissions` | dynamic RBAC (`rbacService.resolveForUser`) / static fallback |
| `scopes` | API-key scopes |
| `jti` | `jti` |

## Authorization model
- **Roles are DB-authoritative**: `requireOrganizationAccess` resolves the effective role from
  `org_memberships` (active) — never trusting a stale token role — and sets both `req.auth.role`
  (scalar alias) and `req.auth.roles` (canonical, single-element).
- `middleware/authorize.js` `requireRoles(...)` is now **roles[]-aware** (membership check against `req.auth.roles`).
- `requirePermissions` / `requireScopes` unchanged (permission/scope based).
- API-key callers carry `roles:['api']`; proxy-egress callers authenticate via `Proxy-Authorization` (bvl_proxy_ keys).

## Hierarchy
`viewer < member < editor < manager < admin < owner < super_admin`.

## Rejected tokens
HS256 (rejected — RS256-only); wrong `iss`/`aud`; invalid signature; (org claim required by both JWT paths).
> Bounded-scope note: because proxy verifies its OWN tokens (which are always canonical), a strict
> `requiredClaims` legacy-shape rejection is not enforced at the issuer-verifier; the closed HS256
> path + RS256 signature + `iss`/`aud` enforcement are the security boundary.

## Migration notes (Batch C — bounded hardening, per decision)
- `utils/jwtserver.js`: `allowHs256Fallback:false` (RS256-only verify across all paths incl. sockets).
- `middleware/authMiddleware.js`: added `jti` to `req.auth` (already canonical-first via Phase 2).
- `middleware/authenticateRequest.js`: added canonical `roles[]` to `req.auth`.
- `middleware/authorize.js`: `requireRoles` → roles[]-aware.
- `middleware/requireOrganizationAccess.js`: sets canonical `req.auth.roles` alongside the scalar alias.
- `service/socketService.js`: RS256-only verify; org room join uses canonical `org_id`.
- **Deferred (documented):** `verifier MUST use createAuthMiddleware` and full `organizationId`
  property eradication were NOT applied — proxy is a self-issuer with kid-based RS256 keys (the
  consumer-oriented `createAuthMiddleware`/JWKS model does not fit), and a 20-file `organizationId`
  rename across the API-key + proxy-egress data plane is high-risk without runtime tests. The
  JWT-CLAIM-level requirement (canonical issued claims, no `organizationId`/`sessionId` claims,
  RS256-only) IS met. Full property rename + createAuthMiddleware adoption belong to proxy's
  eventual issuer-retirement.
