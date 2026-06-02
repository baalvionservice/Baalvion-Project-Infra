# rbac-service — Baalvion Authorization Core (RBAC + ABAC)

The single authorization authority for the platform: a **multi-tenant, hierarchical
RBAC** engine with an **ABAC policy decision point (PDP)** layered on top. Built for
the complex case — many websites, a centralized dashboard, CMS, and internal
company platform — all sharing one consistent access-control model.

- **Domain:** `identity` · **Port:** `3055` · **Schema:** `rbac` (isolated)
- **Stack:** Node + Express 5 + Sequelize/pg. Tokens are verified through
  `@baalvion/auth-node` (RS256) — this service **never** mints user tokens and
  introduces **no second issuer** (per `CLAUDE.md`).

## The model

### Tenancy (multi-tenant tree)
```
platform ─► country ─► organization
```
Exactly one **platform** tenant (the root). Countries hang off it; organizations
hang off a country (or the platform). **Each tenant owns its own roles** — separate
roles per tenant — so a custom role in one org never leaks into another.

### Role hierarchy (the four canonical system roles)
```
super_admin (400, platform)
   └─ country_admin (300, country)
         └─ organization_admin (200, organization)
               └─ end_user (100, organization)
```
`level` is the rank (higher = more privileged); `parent_role_id` encodes
**inheritance** — a role inherits every permission of the roles below it.
Custom roles slot in at any level between these bands.

### Three layers (built in phases, one coherent service)
1. **RBAC core** — roles, hierarchy, and assignment of roles to users per scope.
2. **Permission engine** — a global permission registry (`resource:action`) mapped
   onto roles, with optional per-grant ABAC `constraints`.
3. **ABAC policy engine (PDP)** — attribute-based policies evaluated dynamically to
   decide **allow / deny / limit**, returning **obligations** to the caller.
   Combination strategy is **deny-overrides**.

## API surface

All routes are under `/v1` and require a `Bearer` token (canonical RS256).

### Roles  `/v1/roles`
| Method | Path | Purpose |
|---|---|---|
| `POST`   | `/roles` | **Create Role** |
| `GET`    | `/roles?tenantId=&scopeType=&key=` | **Get Roles** |
| `GET`    | `/roles/:id` | Get one role |
| `PATCH`  | `/roles/:id` | Update role |
| `DELETE` | `/roles/:id` | Delete role (system roles protected) |
| `PUT`    | `/roles/:id/parent` | **Maintain hierarchy** (set/clear parent) |
| `GET`    | `/roles/hierarchy?tenantId=` | Role tree for a tenant |

### Assignments  `/v1/assignments`
| Method | Path | Purpose |
|---|---|---|
| `POST`   | `/assignments` | **Assign Role** to a user in a scope |
| `DELETE` | `/assignments/:id` | Revoke an assignment |
| `GET`    | `/assignments?userId=&roleId=&scopeId=` | List assignments |
| `GET`    | `/users/:userId/roles` | A user's active roles |
| `GET`    | `/users/:userId/effective` | Effective roles + level + RBAC permissions |

### Permissions  `/v1/permissions` (Phase 2)
`POST /permissions`, `GET /permissions`, `DELETE /permissions/:id`,
plus role mapping: `POST|GET|DELETE /roles/:roleId/permissions[...]`,
`GET /roles/:roleId/permissions/effective` (incl. inherited).

### Policies & attributes  `/v1/policies`, `/v1/users/:userId/attributes` (Phase 3)
CRUD over ABAC policies; declare subject attributes for ABAC inputs.

### PDP  `/v1/authorize` (and `/v1/simulate`)
```http
POST /v1/authorize
{
  "action": "publish",
  "resource": { "type": "cms.content", "id": "a1", "attributes": { "orgId": "org-9" } },
  "scopeId": "org-9",
  "tenantId": "<uuid>",
  "context": { "ip": "1.2.3.4" }
}
→ { "decision": "allow", "allow": true, "obligations": {}, "reasons": [...], "matched": {...} }
```
Subject defaults to the caller; trusted callers (super_admin, or a PEP using
`X-Internal-Key`) may ask about another subject.

## Authorization of the management APIs

Writes are guarded by *scoped* checks that bridge the token and this service's DB:
- **super_admin** (from the token's `roles[]` **or** a platform `super_admin`
  assignment) → manages everything.
- **country_admin** → manages its country tenant and every organization beneath it.
- **organization_admin** → manages its own organization.

## Run locally

```bash
cp .env.example .env            # set JWT_PUBLIC_KEY to the auth-service public PEM
pnpm install
pnpm --filter rbac-service migrate    # or: psql $DATABASE_URL -f migrations/00*.sql
pnpm --filter rbac-service seed       # platform tenant + system roles + base perms/policies
pnpm --filter rbac-service dev
pnpm --filter rbac-service test       # engine unit tests (no DB needed)
```

See [RBAC.md](RBAC.md) for the condition grammar and decision algorithm.
