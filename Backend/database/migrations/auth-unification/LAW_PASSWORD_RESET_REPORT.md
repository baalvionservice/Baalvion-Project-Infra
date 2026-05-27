# LAW Password-Reset Analysis (A5)

Tool: `scripts/analyze-password-reset.mjs --island=law` (dry-run) → `--apply`.
Policy: mark `password_reset_required=TRUE` for **weak** hashes only; **hashes are never modified**
(existing passwords keep working until the user voluntarily resets); **no emails sent**.

## Deterministic classification (from A1 discovery)
law-service hashes passwords with **bcryptjs at cost factor 10** (`bcrypt.hash(password, 10)` —
see the now-removed `controller/authController.js`). The security threshold is **cost ≥ 12**.

⇒ **Every** law-origin user hash is `bcrypt(cost=10)` → **WEAK** → `password_reset_required = TRUE`.

| Bucket | Result |
|---|---|
| Safe hashes (argon2 / bcrypt cost ≥ 12) | **0** (law has none) |
| Weak hashes (bcrypt cost 10) | **ALL law users** |
| Forced resets | **ALL law users** |
| Unknown / non-bcrypt | 0 (law is uniformly bcryptjs) |

## Per-user counts (require the live DB — NOT fabricated here)
This static environment has no `psql`/DB. Run in the DB-capable env:
```bash
# total law users imported into auth.users:
psql "$DATABASE_URL" -tAc "SELECT count(*) FROM auth.users WHERE imported_from='law';"

# A5 analysis (dry-run) then apply:
node scripts/analyze-password-reset.mjs --island=law           # report: total/safe/weak
node scripts/analyze-password-reset.mjs --island=law --apply   # mark weak (= all) users
```
Expected dry-run shape: `total=<N> safe=0 weak(forceReset)=<N> ... by hash kind: {"bcrypt(cost=10)":<N>}`.

## Notes
- The A2 importer (`import-island-users.mjs`) already sets `password_reset_required` for weak hashes
  at import time; this A5 analyzer is the dedicated, **idempotent** verify+mark pass (also re-usable
  for users imported before the flag existed, and for the other islands).
- Reset is a **flag**, not a forced logout: users authenticate normally (bcrypt still verifies) and
  are prompted to set a new password; the app/frontend enforces the prompt when the flag is set.
- **No reset emails are sent** by this tooling (per mandatory safety rule).
