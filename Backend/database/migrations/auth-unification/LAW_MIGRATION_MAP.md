# LAW Island → auth-service Migration Map

Source: **law-service** `legal.users` (HS256 island, `Backend/services/knowledge/law-service`).
Target: **auth-service** `auth.*` (canonical RS256 IdP).
Decisions locked (Prompt 4 A1): single dedicated org; explicit role map; law-elite = dead demo.

## Org strategy
All law users are scoped to **one** organization (law users have no org field):
- `auth.organizations`: `slug = 'law-elite-network'`, `name = 'Law Elite Network'`, `plan = 'free'`.
- `owner_id` = the imported **admin** user (first `admin`; falls back to first imported user).
- Each user linked via `auth.team_members (org_id, user_id, role, status='active')`.

## Role map (legacy → canonical) — EXPLICIT, no silent remap
| law role (`legal.users.role`) | canonical (`auth.team_members.role`) |
|---|---|
| `admin`  | `admin`  |
| `lawyer` | `editor` |
| `client` | `member` |

Canonical hierarchy: `viewer < member < editor < manager < admin < owner < super_admin`.
Any law role NOT in this table → row **REJECTED** (never silently remapped).

## Claim map (legacy HS256 token → canonical RS256 token)
| legacy claim (law) | canonical claim (auth-service) |
|---|---|
| `id` (int) | `sub` (auth.users.id) |
| `role` (scalar string) | `roles[]` (from team_members.role) |
| — (none) | `org_id` = the `law-elite-network` org UUID |
| — (none) | `sid` (auth-service session id) |
| — (none) | `jti`, `permissions[]`, `iss=baalvion-auth`, `aud=baalvion-platform` |
| `email` | `email` |
| alg **HS256** | alg **RS256** (JWKS) |

## Schema map (`legal.users` → `auth.*`)
| legal.users | auth target | notes |
|---|---|---|
| `id` | `auth.users.id` (new BIGSERIAL) | legacy id NOT preserved (auth is system of record); email is the join key |
| `email` (unique) | `auth.users.email` (unique) | preserved; case-insensitive dedup |
| `password_hash` (bcryptjs) | `auth.users.password_hash` | **preserved verbatim**; never overwritten |
| `full_name` | `auth.users.full_name` | preserved |
| `is_active` (bool) | `auth.users.status` | `false → 'disabled'`, else `'active'` (disabled users preserved) |
| `role` | `auth.team_members.role` (mapped) | via role map above |
| — | `auth.users.password_reset_required` | `TRUE` if hash weak (bcrypt cost < 12) — see A5 |
| — | `auth.users.imported_from` | `'law'` (provenance / rollback key) |

## Hash policy
law uses **bcryptjs cost 10 (< 12)** → ALL law users imported with `password_reset_required = TRUE`
(A5 confirms). bcrypt hashes are preserved (auth-service bcrypt-compatible), so existing passwords
keep working until the user is prompted to reset. argon2/cost≥12 would be marked safe.

## law-elite
Dead demo skeleton (gateway HS256 verify; in-memory user-service array). **No users to import.**
Its gateway HS256 verify will be swapped to the canonical verifier in A4 (per decision), but there
is no identity store to migrate.

## Prerequisites / order
1. Apply `000_add_password_reset_required.sql` to the auth DB (adds the columns this import writes).
2. Snapshot `legal.users` (see `SNAPSHOT_RUNBOOK.md`) — rollback artifact.
3. `node scripts/import-island-users.mjs --island=law` (dry-run) → review.
4. `... --apply` (transactional) in the DB-capable environment.
