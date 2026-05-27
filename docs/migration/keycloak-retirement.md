# Keycloak Retirement — operator runbook (Phase 5, PREPARE-ONLY)

Code migrations (baalvion-os verifier, Jobs-Portal frontend) are **applied**. Everything
that touches real users or removes infra is **prepared** here for the operator — nothing
below is executed by the migration author.

## Task 4 — Password hash compatibility report
Keycloak stores passwords as **pbkdf2-sha256** (salted, realm-configured iterations).
auth-service uses **argon2id / bcrypt**. The hashes are **NOT interchangeable** and must
**not** be converted. → **ALL Keycloak-origin users require a password reset.**
`import-keycloak-users.mjs` sets `password_reset_required = true` for every imported user
and never imports a Keycloak hash.

| source | hash | reusable in auth-service? | action |
|--------|------|---------------------------|--------|
| Keycloak | pbkdf2-sha256 | ❌ no | force reset (all) |

## Task 7 — Password-reset campaign
Queue = every imported Keycloak user (all of them, per Task 4). Generate reset tokens via
auth-service `POST /v1/auth/forgot-password` (existing flow: hashed token, 1h expiry,
audit-logged, rate-limited). **Do NOT auto-send** unless instructed.

### Email template preview
```
Subject: Action required — set your Baalvion password

Hi {{name}},

We've upgraded Baalvion to a single secure sign-in (Baalvion ID). For your security,
please set a new password to continue:

    {{resetUrl}}        (expires in 1 hour)

You won't be able to sign in with your old password. If you didn't expect this,
contact support@baalvion.com.

— The Baalvion Team
```
Counts: `| users queued for reset | = <all imported>` (from import output).

## Task 8 — Keycloak infrastructure removal (GATED — not executed)
Remove ONLY after: import validated + Jobs-Portal validated + baalvion-os validated
(Task 10/11). Then delete:
- `docker/keycloak/` (realm-baalvion.json)
- the `keycloak` service in `docker-compose.baalvion-os.yml` (+ its volume `keycloak_data`)
- `KEYCLOAK_*` / `NEXT_PUBLIC_KEYCLOAK_*` env vars (root `.env`/`.env.example`, Jobs-Portal `.env.local`)
- `KEYCLOAK_BAALVION_OS_SECRET` (now unused)
Keep historical migration artifacts (exports, this doc). **Not removed now** — prepare-only.

## Rollback
- Code: revert this commit (baalvion-os re-points to Keycloak JWKS; Jobs-Portal re-adds the KC client).
- Users: delete auth-service rows tagged `source_issuer='keycloak'` in `audit_logs` (import is idempotent + tagged); merges are role-union and reversible by recomputing.
- Keycloak itself is untouched until Task 8, so reverting code restores the old flow immediately.

## Blast radius
- baalvion-os now verifies auth-service RS256 (not Keycloak). Any client still presenting a Keycloak token is rejected — intended.
- Jobs-Portal logs in against auth-service (cookie-based); the old Keycloak password grant is gone.
- Until import runs, Keycloak-only users cannot log in to the new flow → run import + reset campaign during the cutover window.
