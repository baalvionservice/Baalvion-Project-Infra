# Baalvion Backend Architecture

> **Status:** LOCKED. This document is the single source of truth for how the
> Baalvion backend is organized. It is designed so that the **next 100+ services**
> can be added without restructuring, without duplication, and without ambiguity
> about where a service lives or how it talks to the rest of the platform.

`Backend/` is the **one** backend monorepo root. There is no other backend home:
all server-side code, every service, the gateway, the kernel, shared libraries,
the service registry, database migrations and infra manifests live here. All UI
code lives in `Frontend/`. Nothing backend lives inside a `Frontend/*` app, and
no service is duplicated across folders.

---

## 1. The model: a federated monorepo on a locked 6-domain axis

Every backend service belongs to **exactly one** of six business domains. The
domain is the primary organizing axis — it decides the folder, the owning team,
the catalog grouping, and the deploy namespace.

| Domain | What lives here | Examples |
|---|---|---|
| **identity** | Authentication, sessions, OAuth, directory, tenancy | `auth-service`, `oauth-service`, `session-service` |
| **commerce** | Trade, orders, inventory, fulfillment, marketplace, billing | `trade-service`, `order-service`, `inventory-service`, `fulfillment-service`, `commerce-service`, `market-service` |
| **knowledge** | Content, encyclopedic data, legal knowledge, ML/analytics | `imperialpedia-service`, `cms-service`, `law-service`, `ml-service` |
| **infrastructure** | Ingress, proxy data-plane, realtime transport, notifications | `gateway` (Go), `realtime-service`, `notification-service`, proxy control plane |
| **platform** | Cross-cutting control plane: admin, dashboards, the kernel | `admin-service`, `dashboard-service`, `baalvion-os` (kernel) |
| **ecosystem** | Vertical/branded products & acquired sub-stacks | `mining-service`, `ir-service`, `jobs-service`, `real-estate-service`, `brand-connector-service`, `ctm-service`, `about-service`, `insiders-service`, `elite-circle-service`, `law-elite` |

The domain axis is **orthogonal** to the legacy `division` axis (`platform-core`,
`proxy-infrastructure`, `commerce`, `mining`, `legal`, …) which is retained in the
catalog for CODEOWNERS routing only. **Domain decides the folder. Division decides
the reviewers.**

---

## 2. Target directory layout

```
Backend/                          ← the one backend monorepo root
├── services/                     ← every business service, grouped by domain
│   ├── identity/
│   │   ├── auth-service/
│   │   ├── oauth-service/
│   │   └── session-service/
│   ├── commerce/
│   │   ├── trade-service/
│   │   ├── order-service/
│   │   ├── inventory-service/
│   │   ├── fulfillment-service/
│   │   ├── commerce-service/
│   │   └── market-service/
│   ├── knowledge/
│   │   ├── imperialpedia-service/
│   │   ├── cms-service/
│   │   ├── law-service/
│   │   └── ml-service/
│   ├── infrastructure/
│   │   ├── realtime-service/
│   │   ├── notification-service/
│   │   └── proxy-service/        ← was backend-Proxy-BaalvionStack
│   ├── platform/
│   │   ├── admin-service/
│   │   └── dashboard-service/
│   └── ecosystem/
│       ├── mining-service/  ir-service/  jobs-service/  real-estate-service/
│       ├── brand-connector-service/  ctm-service/  about-service/
│       ├── insiders-service/  elite-circle-service/
│       └── law-elite/            ← acquired multi-service sub-stack (its own gateway+services)
│
├── gateway/                      ← Go API gateway. The SOLE public ingress (domain: infrastructure)
├── platform/
│   ├── baalvion-os/              ← NestJS + Prisma kernel; the ONLY place Prisma is allowed
│   └── cli/                      ← baalctl (golden-path developer CLI)
├── packages/                     ← shared BACKEND libraries (one copy, imported everywhere)
│   ├── auth-node/                ←   the ONLY home for `jsonwebtoken` (identity authority)
│   ├── contracts/                ←   proto + domain-event registry (cross-service API surface)
│   ├── events/  rbac/  service-kit/  response/  logger/  telemetry/  middleware/  …
├── catalog/                      ← service registry + governance gate (validate.mjs + enforce.mjs)
├── database/                     ← shared SQL migrations & seeds (per-service DBs still own their schema)
└── infra/                        ← docker / k8s / helm / terraform + clickhouse & timeseries projections
```

**Notes**
- `gateway/` is deliberately a first-class top-level folder, not under `services/`,
  because it is the one special node: the sole `ingress: public` descriptor in the
  whole platform (enforced by `catalog/enforce.mjs` rule C4).
- `packages/` holds **backend** shared libraries only. A package that is consumed by
  a UI (e.g. a React/zustand `auth-sdk`) is a *frontend* concern and belongs under
  `Frontend/`, not here. One shared library = one package = imported, never copied.
- `database/` holds cross-cutting migrations/seeds. **One service still owns its own
  database** (rule D1 below); `database/` does not centralize schemas, it centralizes
  the shared migration tooling.

---

## 3. The rules (enforced in CI by `catalog/enforce.mjs`)

These are non-negotiable invariants. The contract gate scans the source tree on
every PR and fails the build on violation. They are what keep 100+ services from
collapsing into a distributed monolith.

| # | Rule | Why |
|---|---|---|
| **D1** | **One service = one database.** Postgres-per-service is the source of truth. ClickHouse / Timescale / Redis are *projections*, never primary stores. | No shared-DB coupling; services stay independently deployable. |
| **A1** | **Identity only via `packages/auth-node`.** `jsonwebtoken` may be imported *only* by `auth-node` + `packages/middleware` + a finite, reasoned allowlist. | One auth authority; no copy-paste JWT logic drifting across services. |
| **X1** | **No cross-service `require`.** Services talk only through `packages/contracts` (sync gRPC/REST) or domain events. | No hidden compile-time coupling between services. |
| **I1** | **The gateway is the sole ingress.** Exactly one descriptor may declare `ingress: public`. | One front door for authn, rate-limit, routing, observability. |
| **K1** | **Prisma lives only in `baalvion-os`.** Every other service uses `pg` / its own client. | The kernel owns the relational schema lifecycle; services stay lightweight. |
| **C1** | **Every service has a catalog descriptor** with a valid `domain`. | The catalog is the registry that drives deploy, ownership and the dep graph. |

Run the gate locally before pushing:

```bash
npm run architecture:check     # = catalog/validate.mjs && catalog/enforce.mjs
```

---

## 4. Golden path — adding 1 of the next 100 services

This is the **only** sanctioned way to add a service. It guarantees the new
service lands in the right domain folder, is registered, deployable, and passes
the gate from minute one.

```bash
# 1. Scaffold: registers a catalog descriptor + Helm values, in the right domain.
npm run baalctl -- new service <name> \
    --domain <identity|commerce|knowledge|infrastructure|platform|ecosystem> \
    --division <division> \
    --context <bounded-context> \
    --owner @baalvion/<team> \
    --lang node            # node | go | python

#   → writes catalog/services/<name>.yaml         (domain-tagged, validated)
#   → writes infra/helm/baalvion-service/values-<name>.yaml
#   → creates Backend/services/<domain>/<name>/   (the code home)

# 2. Write the service using the shared kit (don't hand-roll the boilerplate):
#      @baalvion/service-kit   createService()   — http server, health, logging, shutdown
#      @baalvion/auth-node      identity/JWT      — never import jsonwebtoken directly
#      @baalvion/contracts      its public surface (proto + events)

# 3. Validate + commit:
npm run architecture:check     # must be green
git add . && git commit        # ArgoCD ApplicationSet provisions it on merge
```

**Conventions every service follows** (so 100 of them stay uniform):
- Entry point `server.js` (node) on a single `containerPort`, health at `/healthz`.
- Config from env only; secrets never committed.
- Its own `package.json`, its own isolated `node_modules`, its own Postgres DB.
- Imports shared code via the workspace package name (`@baalvion/<pkg>`), never via
  a deep relative path across service boundaries.
- A row in `catalog/services/<name>.yaml` is mandatory — no descriptor, no deploy.

---

## 5. What is NOT here (and why)

- **Frontend apps** → `Frontend/`. A backend embedded inside a `Frontend/*` app is a
  bug to be migrated out (see `MIGRATION.md`); the UI keeps only its client code.
- **Frontend-shared packages** (React SDKs, design system) → `Frontend/`, not
  `Backend/packages/`.
- **Two competing roots** — the earlier top-level `baalvion-platform/` skeleton is
  retired; `Backend/` is the single root.

---

## 6. Current migration status

The taxonomy in §1 is already encoded in `catalog/services/*.yaml` (every service
carries its `domain`). The **physical** move of service folders into
`Backend/services/<domain>/` is performed in build-verified batches — see
[`MIGRATION.md`](./MIGRATION.md) for the runbook and per-batch status.
