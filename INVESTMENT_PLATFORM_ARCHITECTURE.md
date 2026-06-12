# Baalvion Invest — Investment Marketplace
## Master Architecture & Delivery Blueprint

> End-to-end equity investment marketplace where companies raise capital and investors
> discover, negotiate, sign, fund and track deals **entirely inside the platform**.
>
> **Foundation decision: HYBRID.** Reuse the existing Baalvion platform services for all
> cross-cutting concerns (auth, RBAC, KYC/AML, payments/escrow, notifications, audit,
> search, CMS, tenancy, events) and build a small number of **new marketplace-domain
> services** for the gaps (company/investor profiles, discovery & AI matching, equity deal
> rooms, due-diligence, term sheets, cap table). Stack stays on the existing
> **Node + Express 5 + Sequelize + PostgreSQL** monorepo (the PRD's NestJS is satisfied in
> spirit by the existing modular service pattern; greenfield NestJS would force re-building
> KYC/AML/payments/RBAC/audit that already run in production).

---

## 0. Reuse Map — what already exists vs. what is new

| PRD capability | Reuse (existing service) | New (build) |
|---|---|---|
| Auth / JWT / MFA | `auth-service` + `@baalvion/auth-node` (RS256) | — |
| RBAC / ABAC | `rbac-service` (:3005/:3055) hybrid RBAC+ABAC PDP | marketplace permission registry + roles |
| KYC (company & investor) | `account-service` KYC | accreditation verification module |
| AML / sanctions screening | `aml-service`, `risk-service` (Jaro-Winkler watchlist) | — |
| Payments + Escrow | `payment-service`, `escrow-service`, `payment-rails-service` | escrow *orchestration* for equity rounds |
| Deal room (realtime) | `deal-room-service` (WebSocket negotiation) | equity deal-room domain logic |
| Smart contracts / e-sign seam | `smart-contract-service` (Incoterms/e-sign seam) | term-sheet + eSign provider adapters |
| Dispute resolution | `dispute-service` | — |
| Notifications (email/SMS/WhatsApp/in-app/push) | `notification-service` (:3031) multi-channel | marketplace notification templates |
| Audit (immutable, hash-chained, WORM) | `audit-service` (:3032) | emit marketplace audit events |
| Search / discovery | `search-service` (:3036, OpenSearch, tenant-scoped) | opportunity indexer + facets |
| Content (legal templates, help) | `cms-service` (:3011) | NDA / term-sheet templates |
| Caching | `@baalvion/cache` (read-through, stampede-safe) | match-score & discovery caches |
| Multi-tenant isolation | `@baalvion/tenancy` (Postgres RLS) | apply policies to marketplace tables |
| Event bus | `@baalvion/events` → Redis Streams `baalvion:events` | marketplace event types |
| Integration layer | `@baalvion/sdk` (config/auth/http/trace/events) | consume in new services |
| Object storage | AWS S3 via `@baalvion/upload` | data-room buckets + signed URLs |

**Net-new services (this build):** `company-service`, `investor-service`, `deal-service`
(opportunities, matching, pipeline, deal rooms, due diligence, term sheets, cap table).
For MVP these are scaffolded as **one `marketplace-service`** with internal modules and
split later along the boundaries below.

---

## 1. Complete System Architecture

### 1.1 Logical layers
```
┌──────────────────────────────────────────────────────────────────────────┐
│  CLIENTS                                                                   │
│  • Investor Web App (Next.js)   • Company Web App (Next.js)                │
│  • Central Admin Console (admin-platform :3030)                            │
└───────────────┬────────────────────────────────────────────────────────── ┘
                │ HTTPS (same-origin BFF routes; private service URLs)
┌───────────────▼────────────────────────────────────────────────────────── ┐
│  EDGE / GATEWAY                                                             │
│  • API Gateway (go-gateway)  • CSP/MFA/rate-limit/WAF  • x-tenant-id        │
└───────────────┬────────────────────────────────────────────────────────── ┘
                │ RS256 bearer (auth-node verify) + tenant context (RLS GUC)
┌───────────────▼─────────────────────────── MARKETPLACE DOMAIN ──────────── ┐
│  company-service   investor-service   deal-service                          │
│  (profiles, KYC    (profiles, prefs,  (opportunities, matching, pipeline,   │
│   refs, financials, accreditation,     watchlist, deal rooms, DD, term       │
│   pitch, cap table) AML refs)          sheets, signatures, escrow, cap tbl)  │
└───────────────┬─────────────────────────────────────────────────────────── ┘
                │ sdk.http (internal auth) + sdk.events (Redis Streams)
┌───────────────▼────────────────── PLATFORM SERVICES (REUSE) ────────────── ┐
│ auth · rbac · account(KYC) · aml/risk · payment · escrow · deal-room        │
│ smart-contract(eSign) · notification · audit · search · cms · dispute       │
└───────────────┬─────────────────────────────────────────────────────────── ┘
                │
┌───────────────▼─────────────────────── DATA / INFRA ─────────────────────── ┐
│ PostgreSQL (schema-per-service, RLS) · Redis (cache + Streams) · OpenSearch  │
│ · AWS S3 (data room) · Object signing · Prometheus/OTel                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Communication
- **North-south:** clients → same-origin Next BFF routes → gateway → services (RS256 bearer).
- **East-west (sync):** `sdk.http` with `sdk.internalAuth` (service-to-service signed calls).
- **East-west (async):** `sdk.events` → Redis Streams `baalvion:events` (e.g.
  `marketplace.match.created`, `deal.stage.changed`, `termsheet.signed`,
  `escrow.released`). `notification-service` and `audit-service` consume via XREADGROUP.
- **Search:** services emit upserts to `search-service`; discovery reads from OpenSearch.

### 1.3 Tenancy
Every marketplace table carries `org_id`; `@baalvion/tenancy` RLS (FORCE + fail-closed
policy on `app.current_tenant`) enforces isolation; services run under a **NOSUPERUSER**
`baalvion_app` role so RLS is not bypassed. Investors and companies are separate tenants;
a **deal** is the cross-tenant join object with explicit grants.

---

## 2. Database Schema (PostgreSQL — schema `marketplace`)

> Implemented as real SQL in `Backend/services/marketplace/marketplace-service/migrations/001_init.sql`
> and applied to `baalvion_db`. Money = `NUMERIC(20,2)`; all tables `org_id UUID`, `created_at`,
> `updated_at`. RLS enabled on every table.

**Identity & profiles**
- `companies` (org_id, legal_name, brand_name, cin/registration_no, country, industry_code,
  stage [startup|sme|growth|enterprise], website, status, kyc_status, created_by)
- `company_profiles` (company_id, summary, problem, solution, traction_json, team_size,
  founded_year, revenue_band, funding_raised, funding_target, valuation_target, deck_url,
  is_published)
- `founders` (company_id, name, role, email, linkedin, equity_pct, bio)
- `company_documents` (company_id, type [financial|legal|ip|business_plan|cap_table|deck],
  file_url, file_size, mime, visibility [private|nda|approved], uploaded_by)
- `investors` (org_id, type [angel|vc|family_office|pe|institutional|corporate|strategic],
  legal_name, country, status, kyc_status, aml_status, accreditation_status)
- `investor_profiles` (investor_id, thesis, aum_band, website, contact_email)
- `investment_preferences` (investor_id, industries[], stages[], geographies[],
  ticket_min, ticket_max, risk_appetite)

**Discovery, matching & pipeline**
- `opportunities` (org_id, company_id, title, round [pre_seed|seed|series_a|…], amount_sought,
  pre_money_valuation, equity_offered_pct, min_ticket, deadline, status [draft|live|closed],
  visibility, published_at) — indexed into OpenSearch
- `matches` (opportunity_id, investor_id, score NUMERIC(5,2), reasons_json, model_version,
  status [suggested|viewed|dismissed|actioned])
- `watchlist` (investor_id, opportunity_id, note)
- `saved_companies` (investor_id, company_id)
- `pipeline_stages` (org_id, name, order) · `pipeline_entries` (investor_id|company_id,
  opportunity_id, stage_id, owner, last_activity_at)
- `profile_views` (subject_type, subject_id, viewer_org_id, viewed_at)

**Deal room & due diligence**
- `deals` (org_id_company, org_id_investor, opportunity_id, status
  [open|dd|negotiating|term_sheet|signing|funding|closed|withdrawn], lead_investor_id)
- `deal_members` (deal_id, user_id, org_id, role [lead|participant|advisor|legal|observer])
- `deal_messages` (deal_id, sender_id, body, attachments_json, kind [chat|system]) — realtime via deal-room-service
- `nda_agreements` (deal_id, party_org_id, template_id, status, signed_at, signature_ref)
- `document_requests` (deal_id, category [financial|legal|operational|compliance|tax],
  title, status [requested|uploaded|approved|rejected], requested_by)
- `data_room_documents` (deal_id, document_request_id, file_url, version, uploaded_by)
- `document_access_grants` (deal_id, document_id|category, grantee_org_id, condition
  [kyc|nda|verified|approved], granted_by, expires_at)
- `due_diligence_items` (deal_id, category, item, status, owner, evidence_url)

**Term sheet, signature, escrow, cap table**
- `term_sheets` (deal_id, current_version, status [draft|sent|countered|accepted|rejected])
- `term_sheet_versions` (term_sheet_id, version, amount, equity_pct, valuation,
  board_rights_json, investor_rights_json, exit_rights_json, author_org_id, action
  [propose|counter|accept|reject], note)
- `signatures` (deal_id, document_type [nda|term_sheet|spa], provider
  [aadhaar_esign|docusign|adobe_sign], envelope_id, signer_id, status, signed_at, audit_url)
- `escrow_transactions` (deal_id, escrow_ref [escrow-service id], amount, currency, status
  [initiated|funded|approval_pending|released|refunded], release_conditions_json)
- `cap_table_entries` (company_id, holder_type [founder|investor|esop|other], holder_id,
  security_type [equity|preferred|safe|convertible|option], shares, ownership_pct, as_of)
- `cap_table_events` (company_id, deal_id, event [issue|transfer|dilution|conversion],
  delta_json, effective_at)

**Audit / activity** is delegated to `audit-service` (hash-chained WORM); marketplace keeps a
thin `activity_log` projection for fast UI reads.

---

## 3. User Flows

**A. Company raises capital**
```
Sign up → Company onboarding (details, founders, business reg, KYC, bank verify,
financial uploads, pitch deck, cap table, industry) → Admin/compliance approval →
Create opportunity (round, amount, valuation, equity) → Publish (indexed for discovery) →
Receive interested investors → grant data-room access on NDA+KYC → respond to DD requests →
negotiate term sheet → e-sign SPA → receive escrow funds on release → cap table updated.
```

**B. Investor invests**
```
Sign up → Investor onboarding (type, KYC, AML, accreditation, preferences) → verified →
Discover (AI recommendations + filters) → save/watchlist → express interest →
sign NDA → unlock data room → run due diligence → propose/counter term sheet →
e-sign → fund escrow → escrow releases on conditions → portfolio + cap table reflect holding.
```

**C. Internal (admin/compliance/legal/advisor)**
```
Review onboarding & KYC/AML → approve companies/investors/opportunities → monitor deals,
fraud/risk scoring → manage disputes → oversee escrow release approvals → regulatory reporting.
```

**Unlock-condition gate (Permission-Based Data Room)** — a document is visible to an investor
only when ALL hold: `kyc_complete ∧ nda_signed ∧ investor_verified ∧ company_approval_granted`
(checked by `deal-service` against grants; enforced again at S3 signed-URL issuance).

---

## 4. UI / UX Wireframes (low-fi)

**Investor — Discover**
```
┌───────────────────────────────────────────────────────────────┐
│ Baalvion Invest        Discover  Pipeline  Portfolio  ◯ profile │
├──────────────┬────────────────────────────────────────────────┤
│ FILTERS      │  AI RECOMMENDED FOR YOU                          │
│ Industry  ▾  │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ Stage     ▾  │  │ Acme AI  │ │ FinFlow  │ │ GridX    │         │
│ Geography ▾  │  │ Seed·$2M │ │ A·$8M    │ │ Seed·$1M │         │
│ Ticket  ▢▢   │  │ Match 94%│ │ Match 88%│ │ Match 81%│         │
│ Valuation ▢▢ │  └──────────┘ └──────────┘ └──────────┘         │
│ [Apply]      │  ALL OPPORTUNITIES   (sort: match ▾) [list/grid]  │
└──────────────┴────────────────────────────────────────────────┘
```
**Company — Dashboard**
```
┌───────────────────────────────────────────────────────────────┐
│ Raise: Seed $2M  ▓▓▓▓▓▓░░░░ 62% committed                       │
│ KPIs:  Profile views 1,204 | Interested 38 | Meetings 6         │
│ ┌ Investor pipeline ───────────────────────────────────────┐   │
│ │ New(12) │ Reviewing(8) │ DD(5) │ Term sheet(2) │ Closed(1)│   │
│ └──────────────────────────────────────────────────────────┘   │
│ Due-diligence requests (5 open)   Active deals (2)              │
└───────────────────────────────────────────────────────────────┘
```
**Deal Room**
```
┌─ Acme AI ⇄ Meridian Capital ── status: NEGOTIATING ────────────┐
│ [Chat] [Documents] [Due Diligence] [Term Sheet] [Signatures]    │
│ ───────────────── chat ─────────────────  │  Term sheet v3      │
│ Meridian: revised valuation to $12M        │ Amount   $2.0M      │
│ Acme: acceptable; board seat?              │ Equity   16.7%      │
│ [type a message…]            [attach] [▶]  │ Valuation $12M      │
│                                            │ [Accept][Counter]   │
└────────────────────────────────────────────────────────────────┘
```
Admin adds an **Investor Applications**-style review surface (already built) extended with
**Companies**, **Investors**, **Deals**, **Escrow approvals**, **Compliance** queues.

---

## 5. API Structure (REST, `/api/v1`, RS256)

```
company-service
  POST   /companies                      create (onboarding)
  GET    /companies/:id                   profile
  PATCH  /companies/:id                   update
  POST   /companies/:id/documents         upload (S3 signed)
  GET    /companies/:id/cap-table         cap table
  POST   /companies/:id/submit            submit for approval

investor-service
  POST   /investors                       create (onboarding)
  PATCH  /investors/:id/preferences       investment prefs
  POST   /investors/:id/accreditation     accreditation submit
  GET    /investors/:id/portfolio         holdings + ROI

deal-service
  GET    /opportunities                   discover (filters, facets)
  GET    /opportunities/recommended       AI matches for caller
  POST   /opportunities                   company publishes a round
  POST   /watchlist        DELETE /watchlist/:id
  POST   /deals                           open a deal (express interest)
  GET    /deals/:id        PATCH /deals/:id  (stage transitions)
  POST   /deals/:id/messages               chat (proxied to deal-room-service WS)
  POST   /deals/:id/nda                    sign NDA → unlock room
  POST   /deals/:id/documents/requests     request DD docs
  POST   /deals/:id/documents              upload to data room
  POST   /deals/:id/access-grants          grant doc access (gated)
  POST   /deals/:id/term-sheets            create/propose
  POST   /deals/:id/term-sheets/:tid/versions  counter/accept/reject
  POST   /deals/:id/signatures             start e-sign envelope
  POST   /deals/:id/escrow                 initiate escrow (→ escrow-service)
  POST   /deals/:id/escrow/release         release (admin approval)
  GET    /matches  (admin)                 matching analytics

reuse (called via sdk.http): auth-service, rbac-service /v1/authorize, account-service /kyc,
aml-service /screen, payment-service, escrow-service, notification-service /v1/dispatch,
audit-service (events), search-service /index|/search, cms-service (templates).
```
Envelope: `{ success, data, meta:{requestId,timestamp,version} }`; lists
`{ data:{ items,total,page,limit,totalPages } }` (matches existing convention).

---

## 6. RBAC Permission Matrix

Roles (marketplace tier on top of platform roles): `company_admin`, `company_member`,
`investor_admin`, `investor_member`, `advisor`, `compliance`, `legal`, `platform_admin`.

| Permission | company_admin | investor_admin | advisor | compliance | legal | platform_admin |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| company.profile.edit | ✓ (own) | — | — | — | — | ✓ |
| opportunity.publish | ✓ (own) | — | — | ⚠ approve | — | ✓ |
| opportunity.discover | — | ✓ | ✓ | ✓ | — | ✓ |
| deal.open | — | ✓ | — | — | — | ✓ |
| dataroom.view | ✓ (own) | ✓ (granted) | ✓ (granted) | ✓ | ✓ | ✓ |
| dataroom.grant | ✓ (own) | — | — | — | — | ✓ |
| dd.request | — | ✓ | ✓ | — | — | ✓ |
| dd.upload | ✓ (own) | — | — | — | — | ✓ |
| termsheet.propose | — | ✓ | — | — | ⚠ review | ✓ |
| termsheet.counter/accept | ✓ ✓ | ✓ ✓ | — | — | ⚠ | ✓ |
| signature.initiate | ✓ | ✓ | — | — | ✓ | ✓ |
| escrow.fund | — | ✓ | — | — | — | ✓ |
| escrow.release.approve | — | — | — | ✓ | — | ✓ |
| captable.edit | ✓ (own) | — | — | — | ✓ | ✓ |
| kyc/aml.review | — | — | — | ✓ | — | ✓ |
| user/company/investor.manage | — | — | — | ⚠ | — | ✓ |

Enforcement: `rbac-service` ABAC PDP `/v1/authorize` (deny-overrides) for cross-cutting
decisions; ownership/`org_id` scoping in each service PEP; RLS as the last line. (✓=allow,
⚠=conditional/approval, —=deny.)

---

## 7. Folder Structure

```
Backend/services/marketplace/
  marketplace-service/            # MVP: one service, modular (split later)
    index.js                      # express bootstrap (helmet, cors, metrics, routes)
    config/appConfig.js
    middleware/{authMiddleware,errorMiddleware,tenant,rateLimit}.js
    models/index.js + <table>.js  # Sequelize models (schema 'marketplace')
    modules/
      companies/{routes,controller,service,validators}.js
      investors/{routes,controller,service,validators}.js
      opportunities/{…}  matching/{…}  pipeline/{…}
      dealrooms/{…}  duediligence/{…}  termsheets/{…}  captable/{…}
    routes/v1.js                  # mounts module routers
    integrations/                 # sdk.http clients: rbac, kyc, aml, escrow, esign, notify, search
    migrations/001_init.sql
    package.json
Frontend/
  invest-investor/                # Next.js investor app (discover, pipeline, portfolio, deal room)
  invest-company/                 # Next.js company app (raise, pipeline, data room)
  admin-platform/  (extend)       # marketplace admin queues under /marketplace/*
```
Target service split (post-MVP): `company-service`, `investor-service`, `deal-service`
(extract `modules/*` into their own services sharing the schema boundaries above).

---

## 8. Development Roadmap

| Phase | Weeks | Scope |
|---|---|---|
| **0 Foundation** | 1 | Schema + RLS applied, `marketplace-service` scaffold boots, catalog descriptor, CI |
| **1 Onboarding** | 2–3 | Company & investor onboarding, KYC (account-service), AML (aml-service), accreditation, admin approval queues |
| **2 Discovery & Match** | 3–4 | Opportunities, OpenSearch indexer + filters/facets, AI matching v1 (rules → score), watchlist/saved/pipeline |
| **3 Deal Room** | 4–5 | Deals, NDA gate, permissioned data room (S3 signed + grants), realtime chat (deal-room-service), document requests |
| **4 Due Diligence** | 5–6 | DD center (categories, request/upload/approve, progress), advisor/legal roles |
| **5 Term Sheet + eSign** | 6–7 | Term-sheet versioning (propose/counter/accept), signature provider adapters (Aadhaar/DocuSign/Adobe) |
| **6 Escrow + Cap Table** | 7–8 | Escrow orchestration (escrow-service), release approvals, cap-table issuance/dilution |
| **7 Reports & Analytics** | 8–9 | Investor/company reports, ROI, conversion funnels, dashboards |
| **8 Harden & GA** | 9–10 | Security review, fraud/risk scoring, load test, full audit coverage, prod deploy |

AI matching evolves: **v1 weighted-rules** (industry/stage/geo/ticket/history) → **v2**
embeddings + similarity (reuse `ml-service`/`knowledge`) once data accrues.

---

## 9. Security Architecture

- **AuthN:** RS256 via `auth-service` + `@baalvion/auth-node` (JWKS); **MFA** enforced for
  investors, company admins and all internal users.
- **AuthZ:** RBAC+ABAC PDP (`rbac-service`) + per-service ownership PEP + **Postgres RLS**
  (FORCE, fail-closed, NOSUPERUSER app role). Three independent layers.
- **Data room:** documents in private S3; access only via **short-lived signed URLs** minted
  after the unlock-condition gate (kyc ∧ nda ∧ verified ∧ approved); every view/download
  emits an audit event; optional watermarking.
- **Encryption:** TLS 1.2+ in transit; S3 SSE-KMS + Postgres encryption at rest; secrets in
  a secret manager (no secrets in source — fail-fast on missing at startup).
- **Audit:** immutable, hash-chained WORM (`audit-service`) for document views, downloads,
  signatures, payments, term-sheet changes, escrow releases, logins, role changes.
- **Anti-fraud:** `risk-service` scoring on onboarding + transactions; AML/sanctions screening;
  velocity/anomaly checks; IP whitelisting for internal/admin.
- **Web:** strict CSP (nonce), HSTS, X-Content-Type-Options, rate limiting, CSRF on
  state-changing forms, input validation (zod) at every boundary, output encoding.
- **Compliance:** KYC/AML/accreditation gates, SEBI/tax reporting hooks, data-residency via
  tenancy, configurable retention + right-to-erasure on PII.

---

## 10. Production Deployment Plan

- **Containers:** each service a Docker image (multi-stage, turbo-prune); Compose for local,
  **Kubernetes** for prod (Deployments + HPA, readiness/liveness on `/health`).
- **Data:** managed PostgreSQL (Multi-AZ, PITR), Redis (cluster), OpenSearch, S3 + KMS.
- **Edge:** ALB/CloudFront, WAF, gateway (mTLS east-west or signed internal auth via sdk).
- **CI/CD:** lint+typecheck+test → build images → catalog `enforce.mjs` governance gate →
  migrate (expand→migrate→contract) → canary → promote. Frontends on Vercel or containerized
  `next start`.
- **Observability:** Prometheus metrics (`prom-client`), OTel traces (traceId propagated by
  sdk), structured logs (`@baalvion/logger`), dashboards + alerts (escrow stuck, DD SLA,
  match latency, error budgets).
- **Resilience:** per-service DB schema, circuit breakers on sdk.http, idempotent
  escrow/payment writes (UNIQUE provider+event_id), Redis Streams consumer groups with
  XAUTOCLAIM reclaim, DR drill (restore + replay).
- **Rollout:** environment promotion dev → staging → prod; feature flags per phase;
  limited-beta with a few real companies/investors before GA.

---

### Appendix — event catalog (additions to `baalvion:events`)
`marketplace.company.submitted|approved`, `marketplace.investor.verified`,
`marketplace.opportunity.published`, `marketplace.match.created`,
`deal.opened|stage.changed`, `dataroom.access.granted`, `dataroom.document.viewed`,
`dd.request.created|completed`, `termsheet.proposed|countered|accepted`,
`signature.completed`, `escrow.funded|released`, `captable.updated`.
```
```
