# Phase 1.2 — Runtime Conflict Audit & Single Deployment Standard

**Date:** 2026-06-03 · **Scope:** local/runtime topology (PM2 ⇄ Docker)
**Status:** active duplicate resolved; single standard chosen (**Docker-first**); migration plan below.

---

## 1. Service inventory (as observed)

### Docker (13 containers running)

| Container | Image | Host port → ctr | Role |
|-----------|-------|-----------------|------|
| baalvion-postgres | postgres:15-alpine | 5432 | **infra** (shared DB) |
| baalvion-redis | redis:7-alpine | 6379 | **infra** (cache/streams) |
| baalvion-pgadmin | dpage/pgadmin4 | 5050 | infra (admin UI) |
| baalvion-keycloak | keycloak:26.0 | 8088→8080 | infra (IdP) |
| baalvion-minio | minio | 9000-9001 | infra (object store) |
| baalvion-mailpit | axllent/mailpit | 1025, 8025 | infra (mail sink) |
| baalvion-api-gateway | traefik:v3.1 | 80, 443 | infra (edge) |
| baalvion-grafana | grafana | 3100→3000 | infra (observability) |
| baalvion-prometheus | prom/prometheus | 9090 | infra (observability) |
| baalvion-cms | baalvionprojects-cms-service | **3011** | **APP (drift)** |
| baalvion-law | baalvionprojects-law-service | **3015** | **APP (drift)** |
| baalvion-payment-service | baalvionprojects-payment-service | **3019→3015** | **APP (drift)** |
| baalvion-rbac | baalvionprojects-rbac-service | **3055** | **APP (drift)** |

`docker-compose.yml` actually **defines 34 services** (the full platform, incl. a `migrate` job) — i.e. Docker is *designed* to run everything; only infra + 4 app services are currently up.

### PM2 (40 processes before this audit → 39 after)

Backends + frontends run as native `node` processes from **three** PM2 config files:
`ecosystem.config.js` (core: auth, session, oauth, admin, commerce, ~~cms~~, realtime, admin-platform) +
`extra-backends.config.js` (jobs, mining, imperialpedia, real-estate, brand-connector, market, ir, dashboard, about, ctm, insiders, elite-circle, trade, order, proxy, …) +
`frontends.config.js` (`*-web` Next.js apps).

---

## 2. Duplicate inventory

| Service | Docker | PM2 | Verdict |
|---------|--------|-----|---------|
| **cms-service** | ✅ baalvion-cms (:3011, serving) | ✅ id 5 (`knowledge/cms-service`, :3011) | **DUPLICATE — both running, conflict on :3011.** Docker won the port (owner = `wslrelay`); the PM2 copy could never bind and **crash-looped 3,302 times**. → **RESOLVED** this session. |
| law-service | ✅ baalvion-law (:3015) | ✗ | Docker-only (no live dup). |
| payment-service | ✅ (:3019) | ✗ | Docker-only (no live dup). |
| rbac-service | ✅ (:3055) | ✗ | Docker-only (no live dup). |
| ~30 other backends | defined in `docker-compose.yml` | run in PM2 | **Config-level overlap** (defined in both; only one started). Split-brain risk. |

**Port-ownership evidence** (`Get-NetTCPConnection`): 3011/3015/3019/3055 → PID `wslrelay` (Docker/WSL2 proxy); 3013 → native `node` (PM2 order-service). Confirms the Docker/PM2 split per service.

---

## 3. Port conflicts

- **:3011 (cms)** — Docker vs PM2 double-bind → **the only live conflict. RESOLVED.**
- No other simultaneous double-bind found. Risk remains **latent** because ~30 services are declared in *both* `docker-compose.yml` and the PM2 configs on the same ports — starting both orchestrators reproduces the conflict for any of them.

---

## 4. Stale deployments / configuration sprawl

Multiple overlapping ways to launch the same services — no single source of truth:

| Artifact | Purpose | State |
|----------|---------|-------|
| `docker-compose.yml` | full 34-service stack (+ `migrate` job, `depends_on`, healthchecks) | **prod-aligned** |
| `docker-compose.baalvion-os.yml` | keycloak/minio/observability subset | partial |
| `docker-compose.observability.yml` | prometheus/grafana | partial |
| `ecosystem.config.js` | PM2 core fleet | **active** |
| `extra-backends.config.js` | PM2 extra backends | active |
| `frontends.config.js` | PM2 frontends | active |
| `pm2.config.js` | **alternate** PM2 fleet — different names (`fe-*`) and ports (auth=3001…fulfillment=3015) | **STALE — delete** |
| `start.ps1` / `stop.ps1` / `bootstrap.ps1` | ad-hoc orchestration | overlaps the above |

---

## 5. Root cause of the "thousands of restarts"

The huge restart counts (about-service 4088, inventory 4135, insiders 4160, auth 3673, cms 3302, …) are **not ongoing crash loops** — `unstable_restarts = 0` and uptime is stable (~20m). The error logs show:

```
[Order Service] Startup failed: the database system is starting up
{"service":"cms-service","module":"boot","err":"the database system is starting up"}
```

→ On boot/`pm2 resurrect`, the **entire PM2 fleet starts before the Dockerized Postgres/Redis is ready** and crash-loops (retrying ~1×/sec) until infra accepts connections. PM2 has **no dependency ordering or readiness gate**. The restart counters are the accumulated cost of that race, every reboot.

`docker-compose.yml` already encodes `depends_on` + healthchecks + a `migrate` job — so **Docker-first inherently fixes this** (apps don't start until `postgres`/`redis` are healthy).

---

## 6. Decision: **Docker-first** (single deployment standard)

**Production = containers on ECS/EKS** (Phase 2). `docker-compose.yml` is the canonical local mirror.

**Rationale**
1. **Prod parity** — the prod target is containers (ECS/EKS); one build artifact, dev≈prod.
2. **Solves the startup-race** — compose `depends_on: condition: service_healthy` + the `migrate` job remove the boot crash-loop that PM2 cannot express.
3. **One source of truth** — `docker-compose.yml` already defines all 34 services; PM2 duplicates them in 3 files.
4. **Immutability & isolation** — pinned images, no host Node/`NODE_PATH` borrowing (e.g. realtime-service borrows session-service's `node_modules` under PM2 — fragile).
5. **Secrets & networking** — compose/ECS inject env + private networking; PM2 relies on per-service `.env` on the host.

**Trade-off:** slower local iteration (rebuild on change). Mitigation: compose `develop.watch`/bind-mounts for hot services, or keep PM2 strictly as an *opt-in* fast-iteration tool for **one** service at a time with its Docker container stopped.

---

## 7. Migration plan (incremental, reversible)

1. **DONE — kill the active duplicate.** Removed the `cms-service` PM2 zombie (`pm2 delete` + `pm2 save`); removed it from `ecosystem.config.js` with a guard comment. Docker `baalvion-cms` is the single owner of :3011.
2. **Pick the home for the 4 drifted app services** (cms/law/payment/rbac): keep them in Docker (chosen). Ensure they are **not** in any PM2 config (cms done; law/payment/rbac already absent from the running PM2 set).
3. **Delete the stale `pm2.config.js`** (superseded; wrong names/ports) to remove split-brain.
4. **Bring the rest onto Docker** service-by-service: for each PM2 backend, start its compose service, smoke-test, then remove it from the PM2 config. Verify with `health-check.ps1`.
5. **Add a readiness gate for any interim PM2 use:** wrap PM2 start in `wait-on tcp:127.0.0.1:5432 tcp:127.0.0.1:6379` (or a small pre-start probe) so the boot crash-loop cannot recur while migration is in progress.
6. **Frontends:** containerize the Next.js apps (multi-stage build) or serve via the platform's web host; remove from `frontends.config.js` as each lands.
7. **End state:** `docker compose up` (infra + apps, ordered) is the *only* local command; `pm2.config.js`/`ecosystem.config.js`/`extra-backends.config.js`/`frontends.config.js`/`start.ps1`/`stop.ps1` retired. CI builds the same images deployed to ECS/EKS.

### Final architecture (target)

```
            ┌──────────────── AWS (Phase 2) ────────────────┐
  Route53 → CloudFront → ALB → ECS/EKS services (1 task/service, same images as compose)
            │   RDS(Postgres)  ElastiCache(Redis)  S3  Secrets Manager  CloudWatch  │
            └────────────────────────────────────────────────┘
  Local:  docker compose up   (infra healthchecked → migrate → apps → frontends)
```

---

## 8. Immediate remediation applied this session

| Action | Command | Result |
|--------|---------|--------|
| Remove cms PM2 zombie | `pm2 delete cms-service && pm2 save` | PM2 40→39; :3011 still served by Docker (HTTP 404 = server up). |
| Prevent recurrence | edit `ecosystem.config.js` (drop cms-service + guard comment) | `pm2 start ecosystem.config.js` no longer races Docker for :3011. |

**Recommended next (needs operator approval — changes running state):** `docker stop baalvion-cms baalvion-law baalvion-payment-service baalvion-rbac` only if switching to a PM2-apps model, OR (preferred) migrate remaining PM2 apps into `docker-compose.yml` per §7 and delete `pm2.config.js`.
