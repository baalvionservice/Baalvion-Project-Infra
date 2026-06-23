# Backend Consolidation — Architecture & Design Decisions

A planning/architecture companion to [DEPLOYMENT.md](DEPLOYMENT.md). DEPLOYMENT.md is the
authoritative **implementation runbook** — service inventory, measured sizing, cost, secrets,
runbooks, and the pre-deploy checklist. This document captures the **design rationale** behind the
packaging: the *why*, not the *how*. Where a topic has an authoritative home in DEPLOYMENT.md, this
doc links there instead of restating it.

> **Single source of truth.** Every concrete number — inventory, measured RAM, instance sizing, cost,
> the ECS mapping — lives in DEPLOYMENT.md. This companion deliberately carries **no capacity or cost
> figures**; see [DEPLOYMENT.md §8 · Sizing & cost](DEPLOYMENT.md#8-sizing--cost).

---

## 1. The shape — one image, per-container personality

45 repository modules ship as **6 Node app containers + 1 JVM app**, with zero business-logic changes.
One shared image (`Dockerfile.node`) carries the entire Backend pnpm workspace — every service plus
the `@baalvion/*` packages they link to. Each app container runs that **same image** but a different
[`pm2`](../../deploy/consolidated/pm2/) ecosystem file, selected via the compose `command:`.
`pm2-runtime` then launches each module's own unmodified `node index.js` with its own `cwd` and an
explicit `PORT`, so a container starts **only the processes in its ecosystem file** — i.e. only its
bounded context:

```
app-ecosystem   (image: baalvion-backend, command: pm2-runtime start ecosystem.config.js)
└── pm2-runtime
    ├── node Backend/services/ecosystem/about-service/index.js   (PORT 3010)
    ├── node Backend/services/ecosystem/agent-service/index.js   (PORT 3044)
    ├── … (10 modules total, each unchanged)
    └── node Backend/services/ecosystem/jobs-service/index.js    (PORT 3002)
```

The 6 + 1 grouping, per-app membership, and bounded-context rationale are tabulated in
[DEPLOYMENT.md §4 · Consolidation architecture](DEPLOYMENT.md#4-consolidation-architecture-6--1); the
full 45-service inventory is [§2 · Service inventory](DEPLOYMENT.md#2-service-inventory).

---

## 2. Why multi-process, not single-process — the boot-pattern finding

Two runtime models were considered for collapsing 43 Node services onto one host:

| Model | Mechanism | Code change | Boundary risk |
|---|---|---|---|
| A. Single process | mount each service's Express router under a path prefix in one Node process | **~42 entrypoint edits** | shared global state, one crash domain |
| **B. Multi-process per container** *(chosen)* | one image; `pm2-runtime` runs each module's own `node index.js`, grouped by context | **none** | none — own port, pool, and lifecycle |

**Model B was chosen because the service entrypoints self-start on import, inconsistently** — there is
no uniform `export app` contract to compose against:

- `auth-gateway` — composition-safe: `if (require.main === module) { app.listen() }` + `module.exports = app`.
- `about-service`, `auth-service` — export `app` **but also call `start()` at import** (binds the port,
  creates the schema, starts workers).
- `commerce-service` — calls `start()` at import and exports nothing.

Model A would therefore require guarding `start()` behind `require.main === module` and exporting the
app across **~42 files**, and would collapse 42 services' Sequelize model registrations, telemetry
bootstraps, and worker lifecycles into a single process — directly violating the "no business-logic
changes / boundaries intact" guarantee. Model A remains the documented lever to shrink the RAM
footprint *if* that guarantee is ever relaxed (see
[DEPLOYMENT.md §3 · Resource audit](DEPLOYMENT.md#3-resource-audit)).

**How boundaries stay intact under Model B:** each module is its own OS process (own event loop, own
crash domain) with its own Sequelize pool to its own schema, its own workers and
`@baalvion/graceful-shutdown`; `pm2 restart <module>` cycles one module without touching its siblings;
and re-splitting a module back to its own container is just moving one entry to a new ecosystem file.
The grouping is **packaging, not coupling** — preserved at the process level rather than dissolved into
a shared runtime.

---

## 3. ECS migration guardrails

The Compose file is written to translate 1:1 to ECS: each `app-*` service becomes one ECS service/task,
and because the six Node apps share one image and differ only by `command:`, you get **one image + N
task definitions**. The full Compose→ECS mapping and the scale-out phases live in
[DEPLOYMENT.md §15 · ECS migration path](DEPLOYMENT.md#15-ecs-migration-path). Carry these invariants
through the move:

- **Ports become irrelevant** under awsvpc / ALB target groups — but keep the pm2 `PORT` assignments as
  the canonical per-module contract during the transition.
- **One database, many schemas** survives the migration. A schema graduates to its own RDS instance
  only when a bounded context needs independent scaling or SLA — and only along the context boundary.
- **Secrets move from `.env` to SSM Parameter Store / Secrets Manager before the ECS cutover** — never
  bake them into the image.

---

*Companion to [DEPLOYMENT.md](DEPLOYMENT.md) (the implementation runbook) and the runnable artifacts in
[`deploy/consolidated/`](../../deploy/consolidated/).*
