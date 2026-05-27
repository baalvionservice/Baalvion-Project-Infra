# Auth-Unification Kit (Phase 4 — PREPARE-ONLY)

Tooling + docs to migrate HS256 auth islands onto the canonical auth-service identity.
**These are artifacts.** Nothing here mutates data on its own; an operator runs the
steps against the real DB. Scope decision: *prepare artifacts only* (no data mutation
performed by the migration author).

## Per-island flow (gated)
1. **Snapshot** — `node scripts/auth-unification/snapshot-island.mjs --island <name> --verify-restore --execute`
   → versioned, checksummed `.sql` in `Backend/database/migrations/auth-unification/` + row counts. Restore MUST verify before continuing.
2. **Hash analysis** — `node scripts/auth-unification/analyze-island-hashes.mjs --island <name>`
   → classifies hashes; writes a forced-reset list for WEAK ones (bcrypt<12 / unknown). Hashes are never printed or upgraded.
3. **Role mapping** — per-island `RBAC.md` (legacy → canonical). Ambiguous semantics are flagged CONFIRM.
4. **Org mapping** — per-island `ORG-MAPPING.md` recommendation. **HARD STOP** — requires human confirmation before any import. *No user import until confirmed.*
5. **Import** — `scripts/auth-unification/import-island-users.mjs` (built after Task 4 confirmation): idempotent, transactional, dry-run, dup-email-safe, audit-logged.
6. **Dual-issue window** (≤7 days) — island login keeps working AND also obtains a canonical token via auth-service; every upgrade audited.
7. **issue-on-behalf** — internal HMAC-only endpoint in auth-service that mints a canonical RS256 token for a validated, already-imported island identity.
8. **Cutover** — island login delegates to auth-service; no local signing. (NOT before dual-issue validates.)
9. **Retire issuer** — remove `signAccessToken`, JWT secret config, local refresh signing. (NOT before cutover validates.)
10. **Forced reset** — set `password_reset_required` for WEAK-hash users; generate campaign list (no auto-email).
11. **Post-cutover validation** — canonical accepted, old HS256 rejected, RBAC/MFA/refresh/revocation/logout.
12. **Regression grep** — no remaining `signAccessToken` / HS256 verify / local issuer / island JWT secret.

## Rollback (per island, template)
- Local issuer is **retained** until step 8 validates → revert = redeploy previous island image (still issues HS256) + flip dual-issue flag off.
- Imported auth-service users: delete by `source_issuer=<island>` audit tag within the import transaction window (the import is idempotent + tagged).
- Restore island DB from the Task-1 snapshot (`psql -f <snapshot>.sql`) if island tables were touched (they are NOT in this kit — island data is read-only during import).

## Status
- `islands.config.mjs` — declarative specs (verify CONFIRM fields).
- elite-circle: Tasks 1–4 prepared; **awaiting org-mapping confirmation** before import.
- insiders / law-elite: pending. trade-service: deferred (embedded git repo).
