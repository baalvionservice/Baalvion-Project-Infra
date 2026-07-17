# community-service — RBAC & Auth Contract

Canonical auth from day one: this service verifies **only** canonical RS256 tokens
issued by `auth-service`, via `@baalvion/auth-node`'s One True Verifier — the same
pattern as `jobs-service`/`about-service`/`ir-service`. No local JWT issuance, no
HS256, no legacy scalar `role`/`id`/`orgId` tokens.

## Token verification
- Algorithm: **RS256 only**.
- Issuer: `baalvion-auth` (`JWT_ISSUER`)
- Audience: `baalvion-platform` (`JWT_AUDIENCE`)
- Key: `JWT_PUBLIC_KEY` (PEM) as `staticPublicKey`; rotation via `BAALVION_JWKS_URI` / `JWKS_URI`.
- Entry point: `createAuthMiddleware` in `middleware/authMiddleware.js`.

## Claim mapping (canonical token → request)
| JWT claim | `req.auth`  |
|-----------|-------------|
| `sub`     | `userId`    |
| `org_id`  | `orgId`     |
| `sid`     | `sessionId` |
| `roles[]` | `roles`     |
| `permissions[]` | `permissions` |

## Community-scoped authorization (this service's own model)

Platform roles (`req.auth.roles`) gate nothing about forum content directly — they
only grant the platform-wide `super_admin`/`platform_admin` bypass used by the admin
console. All per-community access is decided from **this service's own**
`community_memberships` table, resolved fresh on every authenticated request (not
embedded in the JWT, since membership can change independently of token lifetime):

- `authMiddleware` verifies the token, then loads every `community_memberships` row
  for `req.auth.userId` into `req.communityRoles: { [communitySlug]: { role, status, tier } }`.
- `requireCommunityRole(minRole)` (route-level guard) checks `req.communityRoles[slug]`
  against the community's `role` hierarchy: `member < moderator < admin`.
- `requirePlatformAdmin` bypasses per-community checks entirely for `super_admin` /
  `platform_admin` roles carried in the RS256 token — mirrors the jobs-service
  `PLATFORM_ADMIN_ROLES` bypass pattern.

NodeBB access (read/post on the actual category) is a **separate, downstream**
authorization surface: this service's membership approval is what triggers a grant/
revoke call to NodeBB's Write API (`service/nodebbClient.js`) so NodeBB's own group
privileges reflect this service's decision. NodeBB is never the source of truth for
who is allowed to join or moderate a community — this service is.

## Rejected tokens (→ 401/403)
Same rejection set as every other canonical-auth ecosystem service: HS256 tokens,
legacy `id`/`orgId`/`sessionId` claims, missing/expired/invalid-signature tokens,
wrong `iss`/`aud`.
