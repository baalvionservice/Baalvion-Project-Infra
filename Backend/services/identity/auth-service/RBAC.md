# auth-service — Canonical RBAC + Keycloak realm-role migration (Phase 5, Task 6)

## Canonical hierarchy
`viewer < member < editor < manager < admin < owner < super_admin` — hierarchical
(`super_admin` passes all checks). Carried in the canonical token's `roles[]`.

## App roles vs hierarchy roles
`roles[]` carries BOTH:
1. **hierarchy roles** (above) — used by platform `requireRole` ordering;
2. **app roles** (recruiter/brand/creator/lawyer/client/candidate/interviewer/finance) —
   used by baalvion-os `RolesGuard` (exact-match `@Roles('recruiter')` etc.).

The import **preserves app roles verbatim** in `roles[]` and adds the mapped hierarchy
role, e.g. a Keycloak `recruiter` → `roles: ['recruiter','manager']`. This keeps
baalvion-os route guards working unchanged while giving platform RBAC a level.

## Keycloak realm role → canonical mapping
| Keycloak realm role | preserved app role | hierarchy level | confidence |
|---------------------|--------------------|-----------------|-----------|
| `admin`      | admin      | **admin**   | [V] |
| `recruiter`  | recruiter  | **manager** | [S] CONFIRM (manage jobs/candidates ⇒ manager) |
| `finance`    | finance    | **manager** | [S] CONFIRM (was frontend-only — see drift) |
| `interviewer`| interviewer| **editor**  | [S] CONFIRM (was frontend-only) |
| `lawyer`     | lawyer     | **editor**  | [S] CONFIRM |
| `creator`    | creator    | **member**  | [S] |
| `brand`      | brand      | **member**  | [S] CONFIRM (brand may warrant manager for own campaigns) |
| `client`     | client     | **member**  | [V] |
| `candidate`  | candidate  | **member**  | [V] (was frontend-only) |

### Frontend/backend drift resolution
`interviewer`, `finance`, `candidate` appeared in the Jobs-Portal `KNOWN_ROLES` list but
were **not** declared realm roles. They are now first-class app roles in `roles[]`
(added to the canonical set). No undefined role semantics remain.

### Permissions
- hierarchy permissions follow `@baalvion/auth-node` `ROLE_PERMISSIONS`.
- app roles carry no implicit platform permission beyond their mapped hierarchy level;
  domain authorization (baalvion-os) keys off the exact app-role string.

> CONFIRM the `[S]` hierarchy levels before running the import (they feed
> `import-keycloak-users.mjs` `HIERARCHY_OF`). Ambiguous business semantics are flagged,
> not guessed.
