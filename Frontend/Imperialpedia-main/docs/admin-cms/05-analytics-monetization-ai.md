# 05 — Analytics, Monetization & AI Features

Covers **§9 (Analytics)**, **§10 (Monetization)**, **§11 (AI Features)**.

---

## A. Analytics (§9)

### A.1 Pipeline

At 100M MAU the event firehose cannot live in Postgres. Architecture:

```
Browser (1st-party SDK)        Server events (publish, search, conversions)
        │ /collect (beacon)              │ baalvion:events
        ▼                                ▼
   collector (edge fn) ──▶ Kafka/Redpanda ──▶ ClickHouse (raw events)  ──▶ scheduled rollups
                                                       │                          │
                                                       ▼                          ▼
                                              real-time dashboards        Postgres summary tables
                                              (admin live)                (fast admin reads, cached)
```

- **1st-party, privacy-respecting** (no 3rd-party pixel dependency for core metrics); GDPR/consent gated.
- **ClickHouse** stores raw `pageviews`, `events`, `search_queries` (partitioned by day).
- **Rollups** (hourly/daily) materialize into Postgres `analytics.*` summary tables the admin reads from —
  the dashboard never scans raw events.

### A.2 Event & rollup schema

```sql
-- ClickHouse (raw, illustrative)
-- pageviews(ts, visitor_id, session_id, user_id, content_id, content_type, category, referrer,
--           country, device, utm{}, dwell_ms, scroll_pct)
-- events(ts, visitor_id, name, content_id, props JSON)         -- click, share, save, signup, subscribe…
-- search_queries(ts, visitor_id, query, results, clicked_pos, no_results bool)

-- Postgres rollups (admin reads)
CREATE TABLE analytics.content_daily (
  day date NOT NULL, content_id uuid NOT NULL,
  views bigint, uniques bigint, avg_dwell_ms int, scroll_pct numeric,
  ctr numeric, shares int, saves int, revenue_cents bigint,
  PRIMARY KEY (day, content_id)
);
CREATE TABLE analytics.traffic_daily (
  day date PRIMARY KEY, sessions bigint, uniques bigint, pageviews bigint,
  new_users bigint, returning_users bigint, by_source jsonb, by_country jsonb, by_device jsonb
);
CREATE TABLE analytics.search_daily (
  day date NOT NULL, query text NOT NULL, count bigint, no_results bigint, avg_click_pos numeric,
  PRIMARY KEY (day, query)
);
```

### A.3 The 7 required dashboards → design (existing `/admin/analytics/*` routes)

| Dashboard | Route | Key visuals | Source |
|-----------|-------|-------------|--------|
| **Traffic** | `/analytics/traffic` | sessions/uniques/pageviews time series, by source/country/device, real-time now | `traffic_daily` + live |
| **Engagement** | `/analytics/engagement` | avg dwell, scroll depth, pages/session, bounce, returning vs new | `content_daily` |
| **CTR** | `/analytics` (SEO+ads) | SERP CTR (Search Console), internal CTR, ad CTR, affiliate CTR | CrUX/GSC + ad logs |
| **Revenue** | `/analytics` (finance) | revenue by stream (ads/affiliate/subs), ARPU, MRR, churn | payment/ledger + monetization |
| **Top Content** | `/analytics/top-content` | top by views/engagement/revenue; risers & decliners (velocity) | `content_daily` |
| **Search Queries** | `/analytics/top-keywords` | top queries, **zero-result queries** (content-gap finder), click position | `search_daily` |
| **User Growth** | `/analytics/growth` | signups, activation, retention cohorts, DAU/WAU/MAU | events + identity |

### A.4 Analytics product behaviors

- **Content-gap engine:** zero-result + high-volume external queries → suggested new articles/terms
  (feeds AI Article Generator and the editorial backlog).
- **Author scorecards:** per-author published count × views × engagement × revenue → powers the dashboard
  "Top Authors" tile and author payouts (if revenue-share).
- **Trending detection:** 7-day z-score on views/searches per tag → dashboard "Trending Topics" + homepage.
- **Real-time:** `realtime-service` WebSocket streams "active readers now / top live pages" to the admin.
- **Exports & API:** every dashboard exportable (CSV) + a read-only analytics API (rate-limited) for BI tools.
- **Attribution:** UTM + referrer captured; affiliate/subscription conversions tie back to the content that drove them.

---

## B. Monetization (§10)

### B.1 Schema (`monetization` schema; revenue settles into the platform ledger)

```sql
CREATE TABLE monetization.ad_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL, placement varchar(60) NOT NULL,    -- in-article, sidebar, header, sticky
  provider varchar(40) NOT NULL,                                  -- gam, adsense, direct
  size varchar(20) NULL, targeting jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true, created_at timestamptz DEFAULT now()
);
CREATE TABLE monetization.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant varchar(120) NOT NULL, label varchar(200) NOT NULL,
  target_url text NOT NULL, tracking_url text NOT NULL,           -- with affiliate params
  commission_pct numeric NULL, content_id uuid NULL,
  clicks bigint DEFAULT 0, conversions bigint DEFAULT 0, revenue_cents bigint DEFAULT 0,
  is_active boolean DEFAULT true, created_at timestamptz DEFAULT now()
);
CREATE TABLE monetization.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES monetization.affiliate_links(id) ON DELETE CASCADE,
  content_id uuid NULL, visitor_id varchar(64), ts timestamptz DEFAULT now(),
  converted boolean DEFAULT false, commission_cents bigint NULL
);
CREATE TABLE monetization.sponsored_content (
  content_id uuid PRIMARY KEY REFERENCES cms.cms_contents(id) ON DELETE CASCADE,
  sponsor varchar(160) NOT NULL, campaign varchar(160) NULL,
  disclosure_label varchar(120) NOT NULL DEFAULT 'Sponsored',    -- FTC disclosure (enforced)
  starts_at date, ends_at date, fee_cents bigint, status varchar(16) DEFAULT 'active'
);
CREATE TABLE monetization.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) UNIQUE NOT NULL,                              -- free, plus, pro
  name varchar(120) NOT NULL, price_cents bigint NOT NULL, interval varchar(10) NOT NULL,
  features jsonb NOT NULL DEFAULT '[]', is_active boolean DEFAULT true
);
CREATE TABLE monetization.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL, plan_id uuid NOT NULL REFERENCES monetization.plans(id),
  status varchar(20) NOT NULL,                                   -- active, past_due, canceled, trialing
  provider varchar(20) NOT NULL, provider_sub_id varchar(120),   -- Razorpay/Stripe
  current_period_end timestamptz, cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### B.2 The 5 required monetization capabilities → design

| Capability | Design | Admin route |
|-----------|--------|-------------|
| **Ads Management** | Ad units + placements (in-article/sidebar/sticky); GAM/AdSense + direct-sold; per-page suppression for premium/sponsored; lazy-loaded, CLS-safe slots; revenue & viewability in analytics. | `/admin/ads` |
| **Affiliate Links** | Link manager with cloaked tracking URLs, per-merchant commission, click/conversion tracking (`affiliate_clicks`), auto-disclosure, in-editor affiliate-block; broken-affiliate-link monitor. | `/admin/monetization` |
| **Sponsored Content** | Flag a content item as sponsored → mandatory FTC **"Sponsored"** disclosure block + `noindex`-safe handling, campaign window, fee tracking; excluded from "objective" rankings. | `/admin/monetization` |
| **Premium Memberships** | Plans (free/plus/pro) with feature gates (ad-free, premium articles, advanced calculators, downloads, no-paywall). Content-level `visibility=private/password` + entitlement check at render. | `/admin/monetization/plans` |
| **Subscription Management** | Reuse the platform payment stack (Razorpay/Stripe, server-side HMAC verify — already proven for Amarise). Lifecycle (trial→active→past_due→canceled) via webhooks; dunning; MRR/churn in analytics; **all settlement through the platform ledger** (single source of truth). | `/admin/finance` |

### B.3 Monetization governance

- **Disclosure is non-negotiable:** sponsored + affiliate disclosures are enforced at publish (compliance gate).
- **Paywall meters:** N free premium articles/month per registered user (configurable), then prompt.
- **Revenue attribution** flows into analytics + author scorecards; payouts (if author revenue-share) computed
  from `content_daily.revenue_cents`.
- **Entitlements** resolved server-side at render (never trust client) using subscription status + plan features.

---

## C. AI Features (§11)

Built on the existing `imperialpedia-service` `aiController.js`/`aiService.js` and `ml-service`, with a
**provider abstraction** (Claude/Gemini) and **keyless fallbacks** (never hard-fail on a missing key —
matches the platform's demo-mode pattern). Every AI output is a **suggestion a human accepts**, never a
silent auto-publish. All AI actions are audited and attributed.

### C.1 The 7 required AI tools → design

| Tool | What it does | Guardrails |
|------|--------------|-----------|
| **Article Generator** | From a title/outline/content-gap → draft blocks (headings, paragraphs, infobox, suggested references). Pulls structured facts from `entities`/`market_assets`. | Draft only → full workflow; sources cited; flagged `ai_generated`; fact-check required before publish. |
| **SEO Optimizer** | Suggests meta title/description, focus keyword, headings, internal links, schema gaps; one-click apply per suggestion. | Re-runs the SEO score engine; never auto-edits prose. |
| **Content Scoring** | Quality score 0..100 (clarity, depth, originality, readability, structure, sourcing) → `cms_contents.quality_score`. | Advisory; surfaced in editor + editor queue triage. |
| **Fact Checking** | Extracts claims (esp. numbers/dates/definitions), checks against trusted sources + internal `entities`/`glossary`; flags unsupported/contradicted claims inline. | Human verifies; financial claims always human-confirmed; logs evidence. |
| **Internal Linking** | Suggests links from prose to glossary/articles using the linking dictionary + embeddings; ranks by relevance. | Accept/reject; respects 1-link-per-term cap. |
| **Auto Summaries** | Generates the `excerpt`/`dek`, TL;DR callout, and meta description from the body. | Editable; counts validated against SEO limits. |
| **FAQ Generator** | Generates Q/A pairs (→ `faq` blocks + `FAQPage` schema) from an article. | Editor curates; max N; dedup against existing FAQs. |

### C.2 AI infrastructure

```sql
CREATE TABLE imperialpedia.ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind varchar(40) NOT NULL,                 -- generate|seo|score|factcheck|link|summary|faq|alt|translate
  content_id uuid NULL, requested_by bigint NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'queued',  -- queued|running|done|failed
  input jsonb NOT NULL DEFAULT '{}', output jsonb NULL,
  provider varchar(24) NULL, tokens_in int NULL, tokens_out int NULL, cost_cents int NULL,
  created_at timestamptz DEFAULT now(), finished_at timestamptz NULL
);
CREATE INDEX ai_jobs_content ON imperialpedia.ai_jobs (content_id);
```

- **Embeddings store** (pgvector or OpenSearch k-NN) for related-content, internal-linking, semantic search,
  and dedupe ("is this article a near-duplicate?").
- **RAG over owned content:** the AI assistant answers/drafts grounded in Imperialpedia's own published
  corpus + structured entities (reduces hallucination, keeps brand voice).
- **Cost & rate governance:** `ai_jobs` tracks tokens/cost per job; per-role quotas; provider failover; cached
  results for identical inputs.
- **Provenance:** AI-touched content carries an `ai_generated`/`ai_assisted` flag; never claims AI work as a
  human author; financial content gets an extra fact-check gate.
- **Surfaces:** inline in the editor (`/ai improve`, slash-AI), batch tools in `/admin/ai` + `/admin/ai-hub`,
  and a **News AI** pipeline (`/admin/news-ai`) that drafts news from wires/feeds for editor approval.

### C.3 AI safety & compliance

- No financial **advice** generation — information + education only; advice-shaped output is blocked/flagged.
- Human-in-the-loop is mandatory for publish; AI cannot transition past `draft`.
- Prompt-injection defenses on RAG inputs; outputs sanitized before entering blocks.
