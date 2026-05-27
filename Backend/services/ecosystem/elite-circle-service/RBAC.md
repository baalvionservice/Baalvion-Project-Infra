# elite-circle-service — RBAC mapping (Phase 4, Task 3)

Auth roles live in `user_roles(user_id, role)`. Default on register is `user`;
`seed.js` also assigns `moderator` and `admin`.

## Legacy → canonical role mapping
| legacy `user_roles.role` | canonical | rationale | confidence |
|--------------------------|-----------|-----------|-----------|
| `user`      | `member`  | basic authenticated community member | **[V]** |
| `admin`     | `admin`   | platform administrator | **[V]** |
| `moderator` | `manager` | moderation = manage members/content; canonical `manager` carries `manage:members` | **[S] CONFIRM** — could instead be `editor` (content edit only). Needs business confirmation. |

### Permissions delta
- `user → member`: gains `read:org`, `write:self` (canonical member perms). No loss.
- `moderator → manager`: gains `manage:members`. If business intent is content-only,
  use `editor` instead (no `manage:members`). **Confirm before import.**
- `admin → admin`: unchanged scope (`manage:org`, `manage:members`, `manage:api_keys`).

### NOT auth roles (do not map)
These are **domain-model values**, not `user_roles` auth roles, and stay in the island's
own tables (memberships/founders/queries):
- `founder`, `cofounder` (membership/company role)
- `owner`, `auth`, `system` (row-ownership / policy markers in `queryController` POLICIES)

## Hierarchy note
Canonical is hierarchical (`viewer<member<editor<manager<admin<owner<super_admin`):
`super_admin` passes all checks. The island's previous checks were exact-match arrays —
behavior changes from exact-match to "at least this level".

## Hashes
All passwords are **bcrypt cost 10** (bcryptjs) → **WEAK** (Task 2: bcrypt<12). Per policy,
affected users are flagged `password_reset_required` (no silent upgrade). See
`analyze-island-hashes.mjs` output. **Operator decision:** force-reset all, OR accept
bcrypt-10 + transparently rehash-on-next-login (lower friction). Flagged for confirmation.
