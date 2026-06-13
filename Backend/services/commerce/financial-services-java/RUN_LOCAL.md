# Running `financial-services-java` locally

> This module is the **system of record for money + KYC/risk/audit** in the Baalvion Trade OS.
> It is wired into the platform behind the `auth-gateway`; the Node `trade-service` (`:3025`) proxies
> money/compliance calls to it and consumes its events via an HMAC webhook bridge
> (`POST /v1/internal/finance-events`). See `INTEGRATION_SUMMARY.md` and `docs/SERVICE-CATALOG.md`.

> ⚠️ **This stack requires JDK 17 + Maven.** It is built/tested in CI
> (`.github/workflows/financial-services.yml`, `mvn -B -ntp clean verify`) or on a dev box. The agent
> sandbox has only Java 1.7 / no Maven — but it **does** have Docker, so the suite can be built and
> fully tested there via a Dockerized Maven toolchain (see next section). Never assume a green build
> without running it.

## Building & testing without a local JDK (Dockerized Maven + Testcontainers)

When there is no local JDK 17 / Maven but Docker is available, run the whole reactor inside a
`maven:3.9-eclipse-temurin-17` container with a persistent `.m2` cache volume. The integration tests
use Testcontainers, which talks to the **host** Docker daemon via the mounted socket
("Docker-out-of-Docker"). Two host-specific knobs are required and easy to miss:

- **`-Dapi.version=1.43`** (passed to the forked Surefire JVM via `-DargLine`). The docker-java client
  bundled in Testcontainers defaults to an API version older than the daemon's minimum on modern
  Docker Engine (25+/Desktop ≥ API 1.40), so the unconfigured client gets **HTTP 400** and reports
  "Could not find a valid Docker environment". Pinning a supported version fixes it.
- **`TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal`** + `--add-host host.docker.internal:host-gateway`
  so the test JVM reaches the *spawned* Postgres container's published port through the host (inside
  the build container, `localhost` is the build container, not the host).

```bash
cd Backend/services/commerce/financial-services-java
docker volume create baalvion-m2
docker run --rm \
  -v "$PWD:/work" -v baalvion-m2:/root/.m2 -w /work \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --add-host host.docker.internal:host-gateway \
  -e DOCKER_HOST=unix:///var/run/docker.sock \
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \
  maven:3.9-eclipse-temurin-17 \
  mvn -B -ntp -DargLine="-Dapi.version=1.43" clean verify
```

> On Git-Bash/MSYS for Windows, prefix the command with `MSYS_NO_PATHCONV=1` and use `"$(pwd -W):/work"`
> so the container paths are not mangled. `Testcontainers 1.20.x` is required (1.19.x cannot negotiate
> the Docker Engine 29.x API). CI on `ubuntu-latest` needs none of these overrides — it has a native
> JDK 17 + a local Docker daemon, so plain `mvn -B -ntp clean verify` works there.

## Ports

| Service | Port | Schema |
|---|---|---|
| ledger-service | 3014 | `ledger` |
| payment-service | 3015 | `payments` |
| account-service (+ KYC vault) | 3016 | `accounts` |
| escrow-service | 3017 | `escrow` |
| settlement-service | 3018 | `settlement` |
| reconciliation-service | 3019 | `reconciliation` |
| audit-service | 3020 | `audit` |
| reporting-service | 3024 | `reporting` |
| risk-service | **3035** | `risk` |

> `risk-service` moved 3025 → **3035** to free `:3025` for the Node `trade-service`. Don't move it back.

Bundled infra (this compose): Kafka 9092, Zookeeper 2181 only. **Postgres and Redis are no longer
bundled** — these services use the platform's single shared `baalvion-postgres` (host 5432) and
`baalvion-redis` (host 6379). There is intentionally only ONE Postgres and ONE Redis for the whole
platform. (Redis is used only by payment-service idempotency and the optional redis rate-limit
backend, which fails open — so the suite still boots if Redis is absent.)

## Bring it up

The shared `baalvion-postgres` + `baalvion-redis` must be running first (root `docker-compose.yml`
exposes them on host 5432 / 6379; DB `baalvion_db` / user `baalvion` / pass `baalvion_dev_pass`).
This stack reaches them via `host.docker.internal` (override with `DB_HOST` / `REDIS_HOST`) and
brings up its own Kafka.

```bash
# 1. shared platform Postgres + Redis (skip if your platform stack is already up):
docker compose -f ../../../../docker-compose.yml up -d postgres redis

# 2. ONE-TIME on an EXISTING baalvion-postgres volume — create the `postgres` role the finance
#    Flyway migrations assign schema ownership to (fresh volumes get it from docker/init.sql):
docker exec -e PGPASSWORD=baalvion_dev_pass baalvion-postgres \
  psql -U baalvion -d baalvion_db -c \
  "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='postgres') THEN CREATE ROLE postgres; END IF; END \$\$;"

# 3. the finance stack (first build is slow — full Maven build per image):
cd Backend/services/commerce/financial-services-java
docker compose up --build
```

Each service exposes Spring Actuator. Smoke-test once healthy:

```bash
for p in 3014 3015 3016 3017 3018 3019 3020 3024 3035; do
  curl -s "http://localhost:$p/actuator/health" | head -c 120; echo "  <- :$p"
done
```

Happy-path money flow (payment → ledger double-entry → settlement batch):

```bash
curl -s -X POST http://localhost:3015/api/v1/payments \
  -H 'Content-Type: application/json' -H 'X-Tenant-ID: 00000000-0000-0000-0000-000000000000' \
  -H 'X-Idempotency-Key: demo-1' \
  -d '{"amount":1000,"currency":"USD","scheme":"INTERNAL","source":"acc-a","destination":"acc-b"}'
# then watch ledger + settlement:
curl -s http://localhost:3014/api/v1/ledger/entries  -H 'X-Tenant-ID: 00000000-0000-0000-0000-000000000000'
curl -s http://localhost:3018/api/v1/settlement/batches -H 'X-Tenant-ID: 00000000-0000-0000-0000-000000000000'
```

## Pointing at a different Postgres

The DB target is env-overridable — defaults `DB_HOST=host.docker.internal`, `DB_PORT=5432`,
`DB_NAME=baalvion_db`, `DB_USER=baalvion`, `DB_PASSWORD=baalvion_dev_pass`. To target another
instance, override them: `DB_HOST=10.0.0.5 DB_USER=svc DB_PASSWORD=… docker compose up`.

`host.docker.internal` resolves natively on Docker Desktop (macOS/Windows). On Linux Docker Engine
either set `DB_HOST` to the host IP, or add `extra_hosts: ["host.docker.internal:host-gateway"]`.

> **Schema-ownership note:** the migrations run `ALTER SCHEMA <svc> OWNER TO postgres`, so whatever
> DB you point at must have a `postgres` role. The shared `baalvion-postgres` gets it from
> `docker/init.sql` on a fresh volume (step 2 above covers an existing volume); the connecting user
> must be able to reassign ownership to it (superuser, or a member of `postgres`).
>
> Building/running this stack needs JDK17+Maven (or the Dockerized Maven flow above) and is **not**
> verifiable from the agent sandbox — confirm a green build before relying on it.

## Security / identity

- Dev default `APP_SECURITY_ENABLED=false` (gateway-trusted, permit-all).
- Production: set `APP_SECURITY_ENABLED=true` + `OAUTH_ISSUER_URI` / `OAUTH_JWK_SET_URI` to the platform
  **`auth-service` RS256 JWKS** (single issuer — no second issuer). The same user access token the
  `auth-gateway` holds then verifies here. Tenant comes from the JWT; `X-Tenant-ID` is a dev fallback only.

## Gateway wiring

The `auth-gateway` (`:3099`) route map (`routes/proxy.js`) forwards `/api/<svc>/...` to these services
(`payment`→3015, `ledger`→3014, `escrow`→3017, `settlement`→3018, `account`→3016, `reconciliation`→3019,
`risk`→3035, `reporting`→3024), injecting the user bearer + `X-Tenant-ID`. The Node `trade-service`
finance facade calls these directly on the trusted internal network so the browser keeps hitting one base URL.

## Finance-events bridge (Java → Node, register once)

The Node `trade-service` consumes finance events via an HMAC webhook (it has no Kafka client). The
`finance-audit-service` (`:3020`) already aggregates Kafka topics `(payments|ledger|settlement|escrow|account).*`
and `fanOut`s a signed delivery to any matching active subscription. Register the trade-service endpoint
**once** after the suite is up (the secret MUST equal trade-service's `FINANCE_WEBHOOK_SECRET`):

```bash
curl -X POST http://localhost:3020/api/v1/audit/webhooks \
  -H 'Content-Type: application/json' \
  -H 'X-Tenant-ID: 00000000-0000-0000-0000-000000000000' \
  -d '{
        "url": "http://host.docker.internal:3025/v1/internal/finance-events",
        "secret": "dev_finance_webhook_secret_change_me_min32",
        "eventPattern": "(payments|escrow|settlement)\\..*"
      }'
```

- **`host.docker.internal`** — from inside the audit-service container, `localhost:3025` is the container,
  not the host. Docker Desktop resolves `host.docker.internal` to the host where trade-service runs.
  (If trade-service also runs in a shared compose, use its service name instead.)
- The delivery carries `X-Webhook-Signature: sha256=<hmac>`, `X-Webhook-Id` (idempotency), `X-Webhook-Event`.
  trade-service verifies the signature over the raw body, projects payment/escrow/settlement events onto
  its read models, and fans out realtime. Verify deliveries: `GET /api/v1/audit/webhooks/{id}/deliveries`.
- **`risk.*` is NOT yet bridged** — the audit aggregator pattern excludes `risk`. To bridge risk
  assessments, widen the aggregator topic pattern to include `risk` and add `risk` to the `eventPattern` above.
