# Infra Hardening & Safe Cleanup — Runbook

Branch: `cleanup/infra-hardening`. Produced from the production Docker audit (2026-06-13).

These scripts execute the **operational** half of the cleanup (removing stale containers,
reclaiming images/volumes, stopping the paused finance stack). The **declarative** half
(compose + Traefik hardening) is already committed as file changes on this branch.

## Golden rules

- **Every script is DRY-RUN by default.** It prints what it *would* do. Re-run with
  `DRY_RUN=0` to actually execute.
- **No business data volume is ever deleted.** The reclaim script has an explicit
  preserve-list and refuses to touch `*_data`, `*pgdata*`, and the finance
  `kafka`/`zookeeper`/`redis` volumes.
- **Run `00-snapshot.sh` first.** Nothing else should run until a snapshot + finance
  `pg_dump` exist.
- Order: `00 → (10, 20 in any order) → 40 → 30 (gated)`. `90` is rollback.

## Scripts

| Script | What it does | Default |
|---|---|---|
| `00-snapshot.sh` | `docker ps/inspect/volumes` snapshot + `pg_dump` of finance DB (PG-B) | safe, always runs |
| `10-remove-stale-containers.sh` | Removes 5 stale containers (open-webui, auth, orders, commerce, inventory) **after** asserting the host/successor still answers. Never touches volumes. | DRY_RUN=1 |
| `20-reclaim-images-volumes.sh` | Removes dangling layers, dead Node finance images, unused base images, Maven caches, orphan volumes. Hard preserve-list. | DRY_RUN=1 |
| `40-apply-config.sh` | Applies the committed config: restarts the gateway (loads new `dynamic.yml` — `watch:true` does **not** fire on Windows), recreates pgAdmin/Keycloak/Grafana with hardened settings. | DRY_RUN=1 |
| `30-finance-stack-stop.sh` | **Gated** (`CONFIRM=yes` + finance dump present). Stops the idle finance stack with `compose stop` — never `down -v`. | DRY_RUN=1, blocked w/o CONFIRM |
| `90-rollback.sh` | Recreates removed containers from compose, restores finance from dump, reverts config (`git`). | DRY_RUN=1 |

## Why there is NO Flyway migration here

The audit found the finance shared-DB cutover migrated **0 rows** (schema-only: PG-A
`baalvion_db.payments` 4 tables + `payments_legacy` 3 tables, all empty), and the real
finance data lives only in PG-B (`baalvion`). Migrating that data is a **separate, gated
project** that needs owner sign-off — fabricating a Flyway migration to move live
double-entry ledger/payment rows during an infra cleanup would be unsafe. The cleanup
itself requires **no schema change**, so no migration file is created. The `pg_dump` in
`00-snapshot.sh` is the data backstop until that project is scheduled.

## Quick start

```bash
cd "scripts/infra-cleanup"
bash 00-snapshot.sh                       # snapshot + finance pg_dump
bash 10-remove-stale-containers.sh        # dry-run preview
DRY_RUN=0 bash 10-remove-stale-containers.sh
bash 20-reclaim-images-volumes.sh         # dry-run preview
DRY_RUN=0 bash 20-reclaim-images-volumes.sh
DRY_RUN=0 bash 40-apply-config.sh         # apply gateway + tooling hardening
# Only when the owner approves stopping paused finance WIP:
CONFIRM=yes DRY_RUN=0 bash 30-finance-stack-stop.sh
```

Backups default to `$HOME/baalvion-infra-backups` (outside the repo — may contain data).
