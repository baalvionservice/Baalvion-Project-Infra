# Merge-Readiness Report — `finance-db-consolidation`

**Branch:** `finance-db-consolidation` · **Commit:** `4d23e440` · **Base:** `main` (`e89eef34`)
**Date:** 2026-06-13 · **Status:** 🟡 **NOT READY TO MERGE** — runtime/build gates pending in a JDK17+Maven environment.
**Authorization:** No deletion of `payment-service` or `ledger-service`. Ledger is deprecation-flagged only.

## Scope of the change

Consolidates the `financial-services-java` stack onto the platform's **single shared** Postgres
(`baalvion-postgres`, host 5432) and Redis (`baalvion-redis`, host 6379), removing the bundled
`postgres:16` (5433) and `redis:7` (6380). **No Java source or `pom.xml` was modified** — the diff is
limited to `docker-compose.yml`, `docker/init.sql`, three finance docs, and the Node `ledger-service`
deprecation markers (+ two new doc files). 9 files, +193/−99.

## Pre-merge checklist (requested gates)

| # | Gate | Status | Evidence / how to complete |
|---|------|--------|----------------------------|
| 1 | `mvn verify` (Java finance stack) | ⛔ **NOT RUN (blocked)** | Sandbox has **Java 1.7, no Maven**; stack needs JDK 17. No Java/pom files changed → build is orthogonal to this change. Run in CI (`deploy/ci/financial-services.yml`) or Dockerized Maven (cmd below). |
| 2 | Bring up stack vs shared PG/Redis | 🟡 **PARTIAL** | Runtime path proven (PATH-1/2 below); full bring-up needs the built JDK17 images. |
| 3 | Validate startup / health / Kafka / migrations | 🟡 **PARTIAL** | DB reachability + role stmt validated; health/Kafka/migrations need the stack up. |
| 4 | `payment-service` intact + all gateway adapters | ✅ **VERIFIED** | `razorpay.js`, `stripe.js`, `payu.js`, `base.js`, `index.js` + `gateway.js`/`gatewayWebhooks.js` all present. Untouched by this branch. |
| 5 | `ledger-service` deprecation-state only (no removals) | ✅ **VERIFIED** | Diff = +9/−1 (markers only). Root compose entry, CI ref (`financial-services.yml`), 4 health endpoints, and all deps intact. No code/compose/CI/health/deps removed. |

## 1. Build status

- ⛔ **`mvn verify` not run here** — environment has `java 1.7.0_10` and no `mvn`; the reactor requires JDK 17.
- ✅ **Build risk from this change: none expected** — zero Java/`pom.xml` files modified. The change is
  infra-wiring + docs + Node markers, which `mvn verify` does not exercise.
- ✅ **`docker compose config` exits 0** for the edited finance compose (structurally valid).
- **Canonical gate:** CI `deploy/ci/financial-services.yml` → `mvn -B -ntp clean verify`.
- **Local (Dockerized Maven, Docker is available here):**
  ```bash
  cd Backend/services/commerce/financial-services-java
  docker volume create baalvion-m2
  docker run --rm -v "$PWD:/work" -v baalvion-m2:/root/.m2 -w /work \
    -v /var/run/docker.sock:/var/run/docker.sock \
    --add-host host.docker.internal:host-gateway \
    -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \
    maven:3.9-eclipse-temurin-17 mvn -B -ntp -DargLine="-Dapi.version=1.43" clean verify
  ```

## 2. Service startup status

- 🟡 **Full stack not started** (needs the JDK17/Maven-built images; not buildable in-sandbox).
- ✅ **Runtime path to shared infra PROVEN** (the exact mechanism the compose uses on Docker Desktop):
  - **PATH-1** `docker run postgres:15-alpine pg_isready -h host.docker.internal -p 5432` → `accepting connections`.
  - **PATH-2** `docker run redis:7-alpine redis-cli -h host.docker.internal -p 6379 ping` → `PONG`.
- **Pending bring-up checks:** each service's Actuator `/actuator/health/readiness` + `/liveness` should be 200 once images are built and started:
  ```bash
  docker compose -f ../../../../docker-compose.yml up -d postgres redis   # shared infra (already healthy here)
  docker compose up --build                                               # finance stack (Kafka bundled)
  for p in 3014 3015 3016 3017 3018 3019 3020 3024 3035; do
    curl -s "http://localhost:$p/actuator/health" | head -c 80; echo "  <- :$p"; done
  ```

## 3. Database validation

| Check | Result |
|-------|--------|
| Shared `baalvion-postgres` reachable | ✅ `connected db=baalvion_db ver=PostgreSQL 15`, container `Up (healthy)` |
| `init.sql` `CREATE ROLE postgres` statement valid | ✅ executed in a rolled-back txn — **VALID**, nothing persisted |
| `postgres` role currently present on the shared volume | ⚠️ **ABSENT** — must run the one-liner before the first Java migration (fresh volumes get it from `docker/init.sql`) |
| Finance schemas already in shared DB | ⚠️ **`payments`, `audit` already exist**; `ledger/accounts/escrow/settlement/reconciliation/reporting/risk` absent |
| `payments.transactions` already exists | ⚠️ **YES, owner `baalvion`** (see Risk #1) |
| Flyway migrations run end-to-end | ⛔ **NOT RUN** (needs stack up) |

**One-time role creation for the existing shared volume (required before first Java migration):**
```bash
docker exec -e PGPASSWORD=baalvion_dev_pass baalvion-postgres \
  psql -U baalvion -d baalvion_db -c \
  "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='postgres') THEN CREATE ROLE postgres; END IF; END \$\$;"
```

## 4. Kafka validation

- **Unchanged by this branch** — Kafka/Zookeeper remain **bundled** in the finance compose
  (`KAFKA_BROKERS=kafka:9092`); only Postgres and Redis were consolidated.
- ⛔ **NOT RUN** (needs stack up). Pending checks once started: broker reachable, topic auto-create,
  `payments.transaction.*` / `payments.ledger.*` / `escrow.hold.*` flow, and the ledger transactional-
  outbox relay drains (`ledger.outbox.pending` gauge → 0).

## 5. Known risks

1. **🔴 HIGH — Pre-existing `payments`/`audit` schema + `payments.transactions` in the shared DB.**
   The first Java Flyway run against this **existing** shared volume may collide (`CREATE TABLE
   payments.transactions` on an already-present table; `ALTER SCHEMA payments OWNER TO postgres`).
   `payments.transactions` is **co-owned** with the Node `payment-service` (the verified partial-overlap).
   **Mitigation:** run the Java migrations against a **clean** `baalvion_db` (fresh volume), or
   pre-reconcile existing schema state/ownership, and confirm `SPRING_FLYWAY_BASELINE_ON_MIGRATE=true` +
   `BASELINE_VERSION=0` resolves cleanly. **Must verify before merge.**
2. **🟠 MED — `postgres` role absent on existing volumes** → migrations fail until the one-liner runs.
   Fresh volumes are covered by `docker/init.sql`.
3. **🟠 MED — `host.docker.internal` is Docker-Desktop-native.** On Linux Docker Engine, set
   `DB_HOST`/`REDIS_HOST` to the host IP or add `extra_hosts: ["host.docker.internal:host-gateway"]`.
   (Dev env here = Docker Desktop, works.)
4. **🟠 MED — Build not verified in-sandbox** (Java 7). CI `mvn verify` must be green pre-merge.
5. **🟡 LOW — Fee+VAT logic duplicated** across Node and Java `payment-service` (divergence hazard) —
   pre-existing, not introduced here; flagged for a follow-up single-source-of-truth extraction.
6. **🟡 LOW — Saga broker isolation:** never point both Node and Java `payment-service` at the same
   Kafka broker with overlapping `payments.transaction.*` topics (enforced by mutually-exclusive deploy).

## 6. Rollback procedure

**Pre-merge (current state):** `main` is untouched — nothing to roll back. To abandon the branch:
```bash
git checkout main && git branch -D finance-db-consolidation
```
**Post-merge revert (config/docs only — no Java code, no data migration):**
```bash
git revert 4d23e440        # or: git revert <merge-commit> -m 1
```
This restores the bundled `postgres:16`/`redis:7` services and the original `DB_*`/`REDIS_*` defaults.
No data migration to undo — finance data lives in the shared `baalvion_db` and is not touched by compose.

**Operational rollback of a running stack:**
1. `docker compose down` the finance stack (shared `baalvion-postgres`/`baalvion-redis` keep running).
2. Check out the pre-change `docker-compose.yml` to bring back the self-contained PG16/Redis if needed.
3. The `postgres` NOLOGIN role on the shared DB is harmless. **Do NOT `DROP ROLE postgres` after a Java
   migration has run** — it would then own the finance schemas. Pre-migration it is safe to drop:
   `DROP ROLE IF EXISTS postgres;` (only if it owns no objects).

---
*Generated 2026-06-13. Verified items were executed live against the running shared infra; ⛔/🟡 items
require a JDK17+Maven environment (CI or a dev box) and are out of scope for this sandbox.*
