# ctm-service — RBAC (Phase 3 Batch A)

Canonical auth via `@baalvion/auth-node`. Exposes:
- `authMiddleware` — hard gate (401 on missing/invalid token).
- `optionalAuth` — soft gate: verifies a present token via the **canonical** verifier and
  populates `req.auth`/`req.user`; anonymous otherwise (used on public read routes that are
  owner/tenant-scoped when signed in). Legacy/HS256 tokens → treated as anonymous.

`req.auth` canonical; back-compat `req.user = {id, orgId, roles}` (no scalar role).

## Behavior change
Previously `optionalAuth` defaulted an anonymous caller's role to `'candidate'` and accepted
legacy `id`/`org_id` claims. Now `req.auth` is set **only** for a valid canonical token; there
is no implicit `candidate` role. Controllers already handle the anonymous (no `req.auth`) case.

## App roles (carried in roles[])
`candidate`, `client`, plus platform roles. Hierarchy reference: `candidate→member`,
`client→member`, `admin→admin`.

## Revocation
Consumer-side JTI blacklist not yet wired (enforced at issuer). Follow-up.
