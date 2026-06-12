# Imperialpedia — Enterprise Admin Panel & CMS Architecture

> **Audience:** Product, Engineering, Editorial, SEO, Security.
> **Status:** Specification v1.0 — grounded in the existing Baalvion platform (does **not** propose a greenfield rebuild).
> **Authoring lens:** Senior Product Manager + Senior UX Designer + Enterprise CMS Architect.

Imperialpedia is a knowledge base + encyclopedia + financial-education publishing platform
(Investopedia × Britannica × Wikipedia) targeting **100M+ monthly visitors**. This spec defines the
complete Admin Panel and CMS that powers it.

## The one decision that frames everything

The codebase already contains **two overlapping content stores**:

| Store | Schema | Shape | Verdict |
|-------|--------|-------|---------|
| `imperialpedia.articles` | `imperialpedia` | thin: `content TEXT`, flat `tags`, `status (draft/published/archived)` | **Demote** → read-projection only |
| `cms.cms_contents` | `cms` | rich: `content_blocks JSONB`, 7-state workflow, revisions, approval logs, SEO metadata, media refs, redirects | **Promote** → canonical editorial store |

**Decision:** `cms-service` (`cms` schema) is the **canonical system of record for all editorial content**
(Articles, Encyclopedia, Guides, Tutorials, News, FAQs). `imperialpedia-service` (`imperialpedia` schema)
owns the **structured knowledge & engagement domain** (Glossary terms/entities, market assets, calculators,
community, portfolio, leaderboard, creators). The thin `articles` table becomes a denormalized read
projection fed by CMS publish events — see [02-content-cms.md](./02-content-cms.md#store-reconciliation).

This reuses ~70% of what's already built and avoids a second CMS.

## Document set

| # | Document | Covers (spec sections) |
|---|----------|------------------------|
| 1 | [01-architecture-and-stack.md](./01-architecture-and-stack.md) | Executive Dashboard (§1), Technology Stack (§16), service topology, system context |
| 2 | [02-content-cms.md](./02-content-cms.md) | CMS content types & schemas (§2), Rich Block Editor (§3), Glossary (§5) |
| 3 | [03-seo-and-media.md](./03-seo-and-media.md) | SEO Management (§4), Media Management (§6) |
| 4 | [04-rbac-and-workflow.md](./04-rbac-and-workflow.md) | Users & Roles + permission matrix (§7), Editorial Workflow + versioning (§8) |
| 5 | [05-analytics-monetization-ai.md](./05-analytics-monetization-ai.md) | Analytics (§9), Monetization (§10), AI Features (§11) |
| 6 | [06-security-database-api.md](./06-security-database-api.md) | Security (§12), Database Architecture + ER (§13), API Architecture (§14) |
| 7 | [07-uiux-roadmap-scaling.md](./07-uiux-roadmap-scaling.md) | UI/UX + wireframes (§15), Roadmap, Feature Priority Matrix, 100M-user Scaling Plan |

## Platform building blocks this spec reuses

- **Auth:** RS256 via `@baalvion/auth-node`; role rank `viewer < member < editor < manager < admin < owner < super_admin`.
- **Authorization:** `rbac-service` (:3005) — hybrid RBAC + ABAC PDP, `/v1/authorize` deny-overrides.
- **Search:** `search-service` (:3036, OpenSearch) — tenant-scoped full-text + fuzzy + facets.
- **Audit:** `audit-service` (:3032) — WORM, SHA-256 hash-chain, tamper-evident.
- **Notifications:** `notification-service` (:3031) — email/SMS/push/in-app fan-out.
- **Events:** `@baalvion/events` over Redis Streams (`baalvion:events`).
- **Cache:** `@baalvion/cache` — read-through Redis, single-flight, tenant-scoped keys.
- **CMS core:** `cms-service` (`cms` schema) — content, revisions, workflow, taxonomy, media, redirects.
- **Domain:** `imperialpedia-service` — entities, assets, community, calculators, portfolio, AI.
- **Admin UI:** Next.js 15 App Router, `Frontend/Imperialpedia-main/src/app/admin/*` (~80 routes scaffolded).

## How to read this

Each document is self-contained and < ~800 lines. Schemas are written as `CREATE TABLE`-equivalent
Sequelize/SQL so they map directly onto the existing migration style in
`Backend/services/knowledge/*/migrations/`. Wireframes are ASCII so they live in version control.
Permission rules use the canonical role ranks above, not invented role strings.
