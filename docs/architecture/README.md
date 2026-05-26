# Baalvion Group — Enterprise Architecture Blueprint

> The permanent architecture + operational scaling model for Baalvion Group.
> This document is the map; the code under `packages/`, `catalog/`, `infra/` and
> the ADRs in `docs/adr/` are the territory.

## 1. The thesis

Baalvion is a **multi-business group** (proxy infrastructure, commerce, mining,
legal, real-estate, jobs) that today shares one monorepo. The businesses must
become **operationally isolated, independently deployable, independently scalable
bounded contexts** that sit on a **shared platform core** — without a big-bang
rewrite that would halt the businesses.

The chosen model is **federated monorepo + strangler-fig extraction**:

- **One repo, many independently-deployable units** (ADR-0001). We keep the
  developer-experience wins of a monorepo (atomic cross-cutting changes, one
  toolchain, shared packages) while each service owns its build, DB, deploy,
  observability and scaling.
- **Extract incrementally** behind stable contracts (ADR-0006). The monolith
  keeps running while we peel services off one at a time. Nothing is moved until
  its contract + event integration exists and is green in CI.

```
BAALVION GROUP (federated monorepo)
│
├── Platform Core (shared, tier-0/1)
│   identity · billing · organization · notification · audit · analytics · gateway
│
├── Proxy Infrastructure Division (tier-0)        ← furthest-along, the beachhead
│   gateway network · metering · orchestration · abuse · enterprise APIs · edge
│
├── Commerce · Mining · Legal · Real-Estate · Jobs Divisions
│
└── Shared Developer Platform  (packages/*, infra/*, catalog/*, platform/cli)
```

## 2. The platform layer (already real)

The internal platform — the thing that makes services cheap to build correctly —
lives in `packages/*` and is consumed by every service:

| Concern | Package | Status |
|---------|---------|--------|
| Identity / token verification | `@baalvion/auth-sdk` | existing |
| RBAC | `@baalvion/rbac` | existing |
| Observability (OTel + pino + prom) | `@baalvion/telemetry` | existing |
| Graceful shutdown | `@baalvion/graceful-shutdown` | existing |
| **Domain events + durable bus** | `@baalvion/events` | **extended (P11)** |
| **Inter-service contracts (gRPC + events)** | `@baalvion/contracts` | **new (P11)** |
| **Service bootstrap (golden path)** | `@baalvion/service-kit` | **new (P11)** |
| Service catalog + governance | `catalog/` + `baalctl` | **new (P11)** |

## 3. Communication model

Two transports, one rule: **a service depends only on contracts, never on another
service's internals** (`@baalvion/contracts`).

- **Synchronous** → gRPC over mTLS (ADR-0005). For request/response where the
  caller needs an answer now (token verification, quota check, allocation).
- **Asynchronous** → domain events on NATS JetStream (ADR-0002). For everything
  else: state propagation, read-model building, sagas, fan-out. The default.

The proxy backend **already emits** real domain events today
(`service/domainEvents.js` → `billing.invoice.generated`, `proxy.session.started`,
`abuse.action.triggered`) — the event-driven backbone is adopted, not theoretical.

## 4. Data model

**Database-per-service** (ADR-0003). The shared Postgres is logically partitioned
per context and physically split during extraction. CQRS where read and write
shapes diverge: the **analytics** and **audit** contexts are pure read models
built by consuming the event stream (Timescale/ClickHouse), never by querying
other services' tables.

## 5. Operational isolation

- **Namespaces per division** (`baalvion`, `baalvion-identity`, `baalvion-edge`,
  `baalvion-eventbus`) + **zero-trust NetworkPolicies** (deny-all, allow-listed) in
  the standard Helm chart.
- **Per-service deploy** via the `baalvion-service` Helm chart, generated per
  service by the **ArgoCD ApplicationSet** straight from the catalog.
- **Tiering** drives sync order + on-call: tier-0 = identity, gateway, billing.

## 6. How a new service comes to life

```
baalctl new service payments-platform --division platform-core --owner @baalvion/platform-core
  → writes catalog/services/payments-platform.yaml + Helm values
  → scaffold code with @baalvion/service-kit createService()
  → declare its public surface in @baalvion/contracts
  → PR (CODEOWNERS routes review; buf + catalog gates run)
  → merge → ArgoCD ApplicationSet provisions + deploys it
```

See [`ddd-map.md`](./ddd-map.md) for bounded contexts, [`migration-roadmap.md`](./migration-roadmap.md)
for the phased extraction, and [`../adr/`](../adr/) for the decisions.
