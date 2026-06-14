# 03 — Duplicate Functionality & Consolidation

Every product app re-implemented the same cross-cutting admin surfaces. This is the largest source of migration value: **~12 functional domains, duplicated across 4–9 apps each, collapse into one canonical global module.** Evidence is the real routes from `01-module-inventory.md`.

Disposition per instance: **canonical** (becomes the single home) · **merge** (fold its data/views into canonical, scoped) · **deprecate** (retire after redirect).

---

## 1. Analytics / Reporting — 9 implementations → 1

| Instance | Routes | Disposition |
|----------|--------|-------------|
| **Central** | `/analytics`, `/commerce/analytics` | **canonical** (cross-product, dashboard-service) |
| Imperialpedia | `/admin/analytics/*` (~25 pages) | merge → global Analytics + product-scoped views |
| Connect | `/admin/analytics`, `/reports` | merge |
| CTM | `/admin/analytics`, `/analytics/roles` | merge |
| Amarise | `/admin/revenue`, `/observability` | merge |
| Mining | `/admin/reports`, `/performance` | merge |
| IR | `/admin/performance` | merge |
| Jobs | `/admin/analytics`, `/reports` | merge |
| Proxy | `/Growth`, `/CohortRetention`, `/Intelligence` | merge |
| Company-Dash | `/analytics`, `/kpis` | merge → exec dashboard |

**Consolidation:** one Analytics service-of-record (`dashboard-service` + analytics rollups/ClickHouse). Products get **scoped views** of the same engine, not their own pipelines. Kills ~9 bespoke analytics stacks.

## 2. Users / Identity / Team / Roles — 8 → 1

Central `/users` + `/staff` + `/identity` + `/rbac` is **canonical**. Merge: Connect `/users`, CTM `/users`+`/roles`+`/teams`, Mining `/users`, Jobs `/users`+`/roles`+`/team`, Proxy `/Users`+`/Tenants`, Insiders `/AdminUsers`, Amarise `/super`, Company-Dash `/employees`. Product-level "team/roles" become **scoped views of central RBAC** (Product Admin manages their product's assignments only). One identity store (`auth-service` + `rbac-service` + `tenant-service`).

## 3. Notifications — 6 → 1

Central `/notifications` (+ Logs/Templates, `notification-service`) is **canonical**. Merge: Connect, Amarise, Mining, IR, Company-Dash notification pages. One multi-channel engine (email/SMS/push/in-app) with per-product templates + scoping. Kills 5 duplicate notification UIs.

## 4. AI tooling — 7 → 1 (+ product tools)

Central `/ai` (AI Operations: Models/Agents/Prompts/Queue/Vectors/Cost, `ml-service`) is **canonical platform AI**. Product AI *tools* (Imperialpedia draft/fact-check/SEO/linking; Connect `/ai`+`/automation`; Amarise `/ai`+`/ai-control`+`/ai-dashboard`; Mining `/ai`; Proxy `/Intelligence`) become **product-scoped feature surfaces** over the one `ml-service` + job/cost governance. One model registry, one cost dashboard, one prompt store.

## 5. Audit & Compliance — 6 → 1

Central `/audit-logs` + `/audit-center` (`audit-service`, WORM hash-chain) is **canonical**. Merge: Connect `/audit`, Amarise `/audit`+`/audit-summary`+`/compliance`, Jobs `/audit-logs`+`/project-governance`, Proxy `/AuditLogs`, Mining `/security`. One immutable, tamper-evident audit store consuming `baalvion:events` from every product. (MarketUnderworld's pervasive audit spec maps onto this directly.)

## 6. Finance / Revenue / Payments / Billing — 8 → 1

Central `/payments` + `/billing` + `/commerce/revenue` (`ledger-service`, `payment-service`) is **canonical Monetization & Finance**. Merge: Connect `/finance`+`/revenue`+`/plans`, Amarise `/finance`+`/revenue`, Mining `/finances`+`/monetization`, CTM `/revenue`, Proxy `/Finance`+`/Payments`+`/Revenue`+`/Chargebacks`+`/Plans`, Jobs `/banking`+`/withdrawals`, Insiders `/AdminRevenue`, Company-Dash `/finance`+`/payments`+`/financials`+`/equity`. **All settlement through the platform ledger** (single source of truth); products get scoped revenue views + payout reports.

## 7. Settings — every app → global + scoped

Central `/settings` is **canonical platform settings**. Each product keeps a thin **product settings** page (scoped config from `product_modules.config`), not a separate settings subsystem. Merge: Connect/CTM/Amarise/Mining/Proxy/Jobs `/settings`, Amarise `/integrations`-style config.

## 8. Integrations / Webhooks / API keys — 5 → 1

Central `/developers` (+ `/payments/webhooks`) is **canonical** (`developer-service`). Merge: CTM `/integrations`+`/integration-logs`+`/api-settings`+`/webhooks`, Amarise `/integrations`, Mining `/integrations`. One API-key/webhook/SDK surface with per-product scoping.

## 9. Support / Tickets — 5 → 1

Central `/support` (Tickets/Macros) is **canonical**. Merge: Connect `/support`, Amarise `/support`, Mining `/support`, Proxy `/Tickets`. One helpdesk, product-tagged.

## 10. Trust & Safety / Fraud / Risk — 5 → 1

New **canonical** global module **Trust & Safety** under Security (fed by `audit-service` + risk signals). Merge: Connect `/fraud`+`/disputes`, Mining `/fraud`+`/disputes`+`/reviews`, Proxy `/RiskCenter`+`/TrustSafety`+`/AbuseMonitoring`, CTM `/security`+`/alerts`. One risk/fraud/abuse console with per-product queues.

## 11. Media — 2+ → 1

Central `/media` is **canonical** (+ a NEW `media-service` per the Imperialpedia spec, `media` schema, S3/R2 + CDN). Merge: Imperialpedia `/media`, Amarise/Mining/IR asset uses (via `cms_media_references`). One tenant-scoped media library across all products.

## 12. CMS / Content — 6 → 1 (multi-website)

Central `/cms` is **canonical** and **already multi-website** (`cms-service`: Websites/Workflows/Pages/Posts/Categories/Tags). Merge product editorial: About (retired→here), IR `/pages`+`/navigation`+`/data-room`, Mining `/documents`+`/localization`, Connect `/content`, Amarise `/content`+`/heritage-archive`. **Imperialpedia is the exception** — it keeps its rich domain editorial layer (block editor, glossary, knowledge graph) but still persists to `cms_contents`. One CMS, many websites, scoped per product.

## 13. Feature Flags — 3 → 1

Central `/feature-flags` **canonical**. Merge: Imperialpedia, Proxy `/FeatureFlags`. One flag service, product-scoped flags.

---

## Consolidation summary

| Before | After |
|--------|-------|
| ~14 separate admin apps, each with its own analytics/users/notifications/AI/audit/finance/settings/support | 1 console; **12 global modules** are single-instance, product-scoped |
| ~9 analytics pipelines | 1 (dashboard-service + rollups) |
| ~8 user/identity managers | 1 (auth + rbac + tenant) |
| ~8 finance/payment surfaces | 1 platform ledger + scoped views |
| ~6 audit stores | 1 WORM audit-service |
| ~6 CMS/content systems | 1 multi-website cms-service |

**Net:** product admins shrink to their **genuinely product-specific modules** (Imperialpedia→Content/Knowledge/SEO; Jobs→ATS/Campus; CTM→Intelligence; Connect→Campaigns/Creators; Mining→Marketplace; Proxy→Network). Everything cross-cutting is inherited from the platform. This is both the dedup win **and** the registry-driven design's payoff — a new product declares only its unique modules and gets all 12 global modules for free.
