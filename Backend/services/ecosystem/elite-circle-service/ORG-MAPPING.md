# elite-circle-service — ORG MAPPING (Phase 4, Task 4) — ⛔ HUMAN CONFIRMATION REQUIRED

**No user import will run until this is confirmed.**

## Findings [V]
- elite-circle tokens are `{ id, email, roles }` — **no org/tenant claim**. The service
  has **no organization concept** in auth; it is a single community ("Elite Circle").
- Domain tables (memberships, founders, investors) describe relationships *within* that
  one community, not separate tenants.

## ⚠ Pre-import blocker [V]
Schema ambiguity: migration `000_baseline.sql` creates schema **`elite_circle`**, but
`config/appConfig.js` defaults `DB_SCHEMA` to **`insiders`** (copy-paste from the insiders
twin). The operator MUST confirm which schema holds live rows before snapshot/import.
`islands.config.mjs` defaults to `elite_circle` (per the migration).

## Recommended strategy: ONE ORG PER ISLAND
Create a single auth-service organization **"Elite Circle"** and assign every imported
elite-circle user as a member of it, with role from the RBAC mapping.

- **Why:** elite-circle is itself one tenant; there is no per-user org data to preserve.
- **org_id:** newly created auth-service org; recorded in the import audit so rollback can
  target `source_issuer='elite-circle'`.

### Alternatives (choose one)
| option | when to pick |
|--------|--------------|
| **One org per island** (recommended) | elite-circle is a standalone community (current reality) |
| Merge into an existing auth-service org | only if Elite Circle members are already part of a known platform org |
| Multi-tenant (org per cohort) | only if memberships actually represent separate paying tenants — not evidenced |

## CONFIRM before import
1. Org strategy = one-org-per-island "Elite Circle"? (or specify org_id to merge into)
2. Live schema = `elite_circle`? (or `insiders` / other)
3. `moderator → manager` (vs `editor`)? (RBAC.md)
4. WEAK (bcrypt-10) handling = force-reset-all vs rehash-on-next-login?

**STOP — awaiting confirmation. NO USER IMPORT YET.**
