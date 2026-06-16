<div align="center">

<img src="assets/banner.svg" alt="Knowledge Domain — Baalvion Platform" width="100%">

<br/>
<br/>

**The knowledge domain — content & CMS, encyclopedic data, legal knowledge, and ML / analytics serving.**

</div>

---

## Domain

The **knowledge** bounded context owns the platform's content and intelligence
surfaces: a multi-website CMS, the Imperialpedia financial-education base, the
legal-knowledge backend, and the ML/analytics serving tier. Per platform rule
**D1**, ML/analytics read from **projections** (e.g. ClickHouse / Timescale) and
never from another service's primary database.

```mermaid
flowchart TD
    subgraph KNOWLEDGE["knowledge domain"]
        CMS["cms-service<br/><i>:3018 · multi-website CMS</i>"]
        IMP["imperialpedia-service<br/><i>:3004 · encyclopedic base</i>"]
        LAW["law-service<br/><i>:3015 · legal knowledge</i>"]
        ML["ml-service<br/><i>:8000 · ML / analytics (Python)</i>"]
    end
    PROJ[("projections<br/><i>ClickHouse / Timescale</i>")]
    ML -->|"read-only · rule D1"| PROJ

    classDef svc fill:#A78BFA,stroke:#6D28D9,color:#1A0B2E;
    class CMS,IMP,LAW,ML svc;
```

## Services

| Service | Port | Bounded context | Notes |
|---|---|---|---|
| [`cms-service`](cms-service) | `3018` | content management | enterprise multi-website CMS |
| [`imperialpedia-service`](imperialpedia-service) | `3004` | encyclopedic knowledge base | financial education |
| [`law-service`](law-service) | `3015` | legal knowledge | Law Elite Network backend — distinct from the `law-elite` ecosystem sub-stack |
| [`ml-service`](ml-service) | `8000` | ML / analytics serving | Python / FastAPI; reads projections (ClickHouse / Timescale) |

## Domain rules

- **D1** — ML/analytics read from **projections**, never from another service's
  primary database.
- `analytics-platform` is the reserved bounded context for cross-domain analytics.
- Services migrate into this folder per `Backend/MIGRATION.md`.

---

<div align="center">
<sub>Part of the <a href="https://github.com/baalvionservice/Baalvion-Project-Infra">Baalvion Platform</a> · centralized identity · domain-driven monorepo</sub>
</div>
