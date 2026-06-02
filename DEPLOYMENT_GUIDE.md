# Baalvion — Deployment Guide (Limited Beta)

How to stand up the **Limited-Beta commerce vertical** from a fresh checkout, what it
contains, and how to take it toward production. Scope is deliberately the verified
revenue/authz/payment slice — not the full 30-service platform.

---

## 1. What deploys in the beta

| Service | Container | Host port | Role |
|---|---|---|---|
| PostgreSQL | `baalvion-postgres` | 5432 | shared `baalvion_db` (per-service schemas) |
| Redis | `baalvion-redis` | 6379 | sessions, JTI blacklist, queues |
| rbac-service | `baalvion-rbac` | 3055 | authorization PDP (roles, tenants, policies) |
| order-service | `baalvion-orders` | 3013 | checkout, payments intent/confirm, refund, IDOR/PEP |
| cms-service | `baalvion-cms` | 3011 | content + **payment-provider vault** (encrypted keys) |
| payment-service | `baalvion-payment-service` | 3019 → 3015 | gateway intents, signed webhooks, refunds |
| commerce-service | `baalvion-commerce` | 3012 | storefront/catalog (best-effort; seeding host-side) |
| inventory-service | `baalvion-inventory` | 3016 | stock (best-effort) |

**Excluded from the booted beta** (intentional): `ledger-service` — order→ledger posting is
**fail-open** (a ledger outage never breaks checkout; entries are backfilled by the
reconciliation sweep). Its Dockerfile is now monorepo-aware and builds, but it is not part of
the verified runtime set. auth-service (interactive login) is also out of the booted set — the
beta uses RS256 tokens minted from the platform key; its data lives in the `auth` schema.

---

## 2. Prerequisites

A "fresh machine" needs the standard monorepo toolchain:

- **Docker** (Engine 24+) with **Compose v2**
- **Node.js 20** (`.nvmrc`)
- **pnpm** via corepack (`corepack enable`)
- **openssl** (only if no JWT keypair exists yet — to generate one)

> Why host Node/pnpm: the Sequelize services (commerce/order/inventory/cms) migrate with
> `sequelize-cli`, a **devDependency** pruned from the production images, so migrations run
> host-side against the published Postgres port. Everything else runs in containers.

---

## 3. Zero-to-Beta (one command)

```bash
git clone <repo> && cd <repo>
./bootstrap.sh            # Linux/macOS/CI
# or, on Windows:
.\bootstrap.ps1
```

The bootstrap is **idempotent** and runs: preflight (network, RS256 keypair, `.env`,
toolchain) → infra → migrations → services → seed/provision → fixtures → health verify.
It prints an admin-token command and the four verification harnesses at the end.

Flags: `--fresh` / `-Fresh` wipes the Postgres+Redis volumes for a true cold start;
`--skip-install` / `-SkipInstall` skips `pnpm install`.

### What it creates
- Schemas + tables for the beta vertical (rbac via `sync`; commerce/order/inventory/cms via
  `sequelize-cli`; ledger/payment self-migrate on boot).
- Default **RBAC hierarchy**: platform tenant + 4 system roles (super_admin → country_admin →
  organization_admin → end_user) + commerce store-team roles, grants, and country/store tenants.
- Demo **store** (Amarisé) + catalog (20 published products).
- **Payment vault** entries (mock mode) for `baalvion-mining` (razorpay) + `baalvionstack-shop` (stripe).
- **Fixtures**: a test customer, ops_manager/store_viewer/admin role assignments, and
  `warroom/beta-fixtures.json` (stable IDs for the harnesses).

---

## 4. Verify

```bash
node warroom/revenue_e2e.cjs --refund     # order → intent → confirm → PAID → refund
node warroom/enforcement_e2e.cjs          # IDOR 403, store-role gates, ops refund
node warroom/security_e2e.cjs             # malformed→400, revoked-JTI→401
node warroom/payment_e2e.cjs              # intent, signed webhook, capture, refund, idempotency
```
Notes: `order-service` is on **:3013** (harnesses default to it). `payment_e2e` uses the
internal secret payment-service runs with — leave `INTERNAL_SERVICE_SECRET` **unset** locally so
both use the dev default `baalvion-internal-dev-secret`.

---

## 5. Secrets & configuration

`bootstrap` seeds dev-grade secrets into `.env`. For production you MUST replace:

| Variable | Where | Production requirement |
|---|---|---|
| `JWT_PUBLIC_KEY` / `JWT_PRIVATE_KEY` | `.env`, `docker/secrets/` | real RS256 keypair; private key only where tokens are minted |
| `INTERNAL_SERVICE_SECRET` | payment-service + callers | **must be set** — payment-service `appConfig` refuses to start in prod with the dev default |
| `LEDGER_INTERNAL_KEY` | order + ledger | strong shared secret (enables ledger posting + reconciliation) |
| `CMS_SECRETS_KEY` | cms-service | vault master key (decrypts provider keys); dev uses a fixed key |
| `INTERNAL_API_KEY` | rbac-service | service-to-service key |
| DB password | postgres + all services | replace `baalvion_dev_pass` |
| `NODE_ENV` | all | `production` |

Run `node Backend/scripts/check-env.cjs` until **RESULT: OK** before exposing services.

---

## 6. Payments: mock → sandbox → production

Default is **mock** (real adapter code + real signature crypto, no charge). To use a real
provider sandbox or go live, see **`Backend/services/commerce/payment-service/docs/SANDBOX_GOLIVE.md`**.
One-step flip: `node Backend/services/knowledge/cms-service/scripts/configureSandboxPayments.cjs --provider stripe --site <slug>` with test keys in the environment.

---

## 7. Build reproducibility

- `.dockerignore` excludes `node_modules`/`Frontend`/`dist`/`.next` → lean build context.
- `pnpm install --frozen-lockfile` is **in sync** (verified) — clean-clone installs are reproducible.
- Service images build via the monorepo `turbo prune` → `pnpm deploy --prod` pattern
  (commerce/order/rbac/cms/payment). **ledger-service's Dockerfile was rewritten** to this
  pattern (it previously ran `npm ci` with no lockfile and could never build).
- Scoped package names (`@baalvion/payment-service`, `@baalvion/ledger-service`) require the
  scoped name in turbo/pnpm filters — encoded in those Dockerfiles.

---

## 8. Backup & recovery

See **`docs/runbooks/disaster-recovery.md`**. TL;DR:
```bash
pwsh -File scripts/db-backup.ps1          # nightly
pwsh -File scripts/db-restore.ps1         # safe rehearsal into baalvion_restore_test
pwsh -File scripts/db-verify-restore.ps1  # row-for-row PASS vs manifest
```
Ship `backups/` off-box for real DR.
