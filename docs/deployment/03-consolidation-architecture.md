# 03 · Consolidation Architecture

How 45 repository modules become **6 Node apps + 1 JVM app** with zero code changes.

## The mechanism

- **One shared image** ([`Dockerfile.node`](../../deploy/consolidated/Dockerfile.node)) carries the
  full Backend pnpm workspace — every service plus the `@baalvion/*` packages they link to.
- **Per-container personality** — each app container runs the same image but a different
  [`pm2`](../../deploy/consolidated/pm2/) ecosystem file, selected via the compose `command:`.
- **pm2-runtime** launches each module's own `node index.js` with its own `cwd` and an explicit
  `PORT`. A container starts **only the processes in its ecosystem file** — i.e. only its bounded
  context.

```
                         ┌─────────────────────────── one EC2 host ───────────────────────────┐
   Internet ── Caddy ──► │  app-identity   app-commerce   app-trade   app-ecosystem            │
   (TLS, 80/443)         │  app-platform   app-edge-realtime   [app-payments]   redis          │
                         └──────────────────────────────┬─────────────────────────────────────┘
                                                        │  (TLS)
                                                   AWS RDS PostgreSQL
```

Each `app-*` container internally:

```
app-ecosystem (image: baalvion-backend:local, command: pm2-runtime start ecosystem.config.js)
└── pm2-runtime
    ├── node Backend/services/ecosystem/about-service/index.js   (PORT 3010)
    ├── node Backend/services/ecosystem/agent-service/index.js   (PORT 3044)
    ├── ... (10 modules total, each unchanged)
    └── node Backend/services/ecosystem/jobs-service/index.js    (PORT 3002)
```

## The 6 + 1 deployable apps

| App (container) | Bounded context(s) | Modules | Σ idle | pm2 config |
|---|---|---:|---:|---|
| `app-identity` | identity | 5 | ~550 MB | `identity.config.js` |
| `app-commerce` | commerce + marketplace | 7 | ~880 MB | `commerce.config.js` |
| `app-trade` | trade | 6 | ~700 MB | `trade.config.js` |
| `app-ecosystem` | ecosystem | 10 | ~1105 MB | `ecosystem.config.js` |
| `app-platform` | platform + knowledge + infra-utils | 10 | ~1125 MB | `platform.config.js` |
| `app-edge-realtime` | infra (BFF + realtime + async) | 4 | ~635 MB | `edge-realtime.config.js` |
| `app-payments` *(profile)* | commerce/finance (JVM) | 1 | ~600 MB | `Dockerfile.java` |

### Membership

- **app-identity** — auth-service, auth-gateway, oauth-service, rbac-service, session-service
- **app-commerce** — commerce, inventory, fulfillment, market, order, trade-service, marketplace-service
- **app-trade** — network-graph, order-execution, product-registry, quality-inspection, supplier-lifecycle, trade-documentation
- **app-ecosystem** — about, agent, brand-connector, crm, ctm, insiders, ir, jobs, mining, real-estate
- **app-platform** — admin, dashboard, tenant, cms, imperialpedia, law-service, audit, developer, report, search
- **app-edge-realtime** — proxy-service, realtime (infra), realtime (platform → PORT 3046), notification
- **app-payments** — financial-services-java (`--profile payments`)

### Intentional exclusions
- **`law-elite`** — in-memory demo shell, not production code → **decommission**.
- **`ml-service`** — Python optional accelerator; OFF by default (Node falls back in-process). Ships
  as its own container only when needed (an 8th deployable).

## Grouping rationale

1. **By bounded context first.** The repo's domain folders (`identity`, `commerce`, `trade`,
   `ecosystem`, `platform`, …) define the seams. Grouping along them keeps the deployable map
   legible and matches CODEOWNERS review boundaries.
2. **Runtime separation.** The JVM (`financial-services-java`) and Python (`ml-service`) cannot share
   the Node image, so they are their own containers.
3. **Connection-style isolation.** `app-edge-realtime` collects the public BFF + the two websocket
   servers + the notification worker fleet — all long-lived-connection or worker workloads that
   benefit from being scaled and restarted independently of request/response apps.
4. **Back-office consolidation.** Low-traffic admin/knowledge/infra-utility services share
   `app-platform`, keeping the count at the low end of the 5–7 target.

## How module boundaries stay intact

| Property | Guarantee |
|---|---|
| Source location | No file under `Backend/services/**` moves or is edited |
| Process isolation | Each module is its own OS process (own event loop, own crash domain) |
| DB isolation | Each module opens its own Sequelize pool to its own schema |
| Lifecycle | Each module keeps its own startup, workers, and `@baalvion/graceful-shutdown` |
| Independent restart | `pm2 restart <module>` cycles one module without touching siblings |
| Reversibility | Splitting a module back to its own container = move one entry to a new ecosystem file |

The grouping is **packaging, not coupling**. Boundaries are preserved at the process level rather
than dissolved into a shared runtime (the alternative — see [02 · Resource Audit §5](02-resource-audit.md)).

➡ Next: [04 · Deployment Guide](04-deployment-guide.md)
