# MarketUnderworld — Full Backend, Product & Operations Plan

**Domain:** marketunderworld.com
**Premise:** an investor intelligence platform that beats Crunchbase / Harmonic / Signal NFX / PitchBook on speed, commentary depth, and operator-grade workflow tools — monetized as a tiered subscription with a public SEO content engine driving the funnel.
**Document scope:** end-to-end product, backend, infra, ops, and growth plan. Nothing intentionally omitted.

---

## 1. Why people must come — and come back

A platform is a habit, not a product. Every architectural choice below answers one of three questions:

1. **Why do they come the first time?** SEO content (rewritten + commented news), a curated list ("Top 25 fintech seed investors in India, May 2026"), or a referral.
2. **Why do they sign up?** A specific investor profile is gated; or they hit the soft paywall after 3 free views; or they want the weekly digest.
3. **Why do they come back daily?** Because something changed in their watchlist since yesterday. Without that loop, churn destroys the business in month 2.

The "must come back" mechanics, baked into the product from day one:

- **Activity feed** — the homepage of a logged-in user shows only what's new in the investors they follow (new investment, news article, social signal, fund raise).
- **Watchlist alerts** — email + push when a watched investor invests, hires, or publishes.
- **Weekly digest** — Monday 8am local time, every user, every plan. The #1 retention lever.
- **Trending dashboards** — "Most active investors this week," "Hottest sectors right now" — refreshed daily, fear-of-missing-out engine.
- **Founder pipeline tool** — for founders raising, the site becomes their CRM. They can't leave without losing their pipeline.
- **Saved searches with alerts** — set once, get notified on new matches forever.

If the build doesn't deliver these loops, the rest of the plan is academic.

---

## 2. Personas — who comes, what they need, what they pay

| # | Persona | Trigger to visit | What they want | Likely plan | LTV signal |
|---|---|---|---|---|---|
| 1 | **Anonymous SEO visitor** | Googled an investor name or sector list | Read 1 article, move on | Free | Citation / referral |
| 2 | **Founder raising** | "Find investors for my pre-seed AI startup" | Curated investor list + outreach CRM | Pro $199/mo, 3-month avg | $597 |
| 3 | **Other investor (VC / angel)** | Competitive intel on peer firms | Deal flow signals, peer activity | Team $499/mo, 12-month avg | $5,988 |
| 4 | **Service provider** (lawyer, banker, BD, recruiter, accelerator scout) | Needs investor lists for clients | Searchable DB, CSV export, API | Pro $199 or Team $499, 12-month avg | $2,388–$5,988 |
| 5 | **Journalist / researcher** | Article research | Source citations, free data | Free | Inbound links + brand |
| 6 | **Family office analyst** | Tracking GP performance | Detailed firm pages, fund-level data | Enterprise custom $1k–$5k/mo | $24,000+ |
| 7 | **Admin / editorial** | Internal | Review queue, analytics | Internal | n/a |
| 8 | **VA / data team** | Internal | Investor curation tools | Internal | n/a |

Two ICPs you bet on first because they have the right LTV-to-CAC ratio: **founders raising** (mass-market, low CAC via SEO, but churn after raise closes) and **service providers** (smaller market, much higher LTV, stickier). Investors and family offices are the long-game high-ARPU segment — chase them in year 2.

---

## 3. User flows — entry to value to conversion to retention

### 3.1 Anonymous SEO visitor → free signup

1. Lands on `/articles/sequoia-ai-thesis-2026` from Google.
2. Reads commentary article. Sidebar shows "Sequoia's recent investments" with 3 visible, 5 blurred.
3. Clicks blurred → soft paywall modal: *"Get free access to 100 investor profiles each month."*
4. Signs up with email or Google in 10 seconds.
5. Verification email lands. Confirms.
6. First-time onboarding asks: *"Why are you here?"* — Raising / Investing / Researching / Just curious. Branches the personalization.
7. Lands on personalized dashboard with 3 suggested investors based on their answer.

**Perceived value at step 7:** "I got 3 investor profiles I'd have spent an hour finding on Twitter."

### 3.2 Founder raising → Pro subscriber

1. Signed up free. Onboarding answered "Raising."
2. Asked: *"What stage, sector, target check size, geo?"*
3. Dashboard shows a **matched investor list** — 10 free profiles, 90+ behind upgrade prompt.
4. Each profile shows: recent investments at matching stage, check size, partner who leads, last 5 news mentions, social handles.
5. Hits paywall at profile 11 → upgrade modal: *"Unlock all 247 matched investors + outreach CRM for $199/mo. Cancel anytime."*
6. 14-day free trial offered, card required.
7. Trial user adds 30 investors to their **pipeline**: cold → contacted → meeting → passed / interested. Notes per investor.
8. **Day 3 of trial:** email — "5 of your pipeline investors made a new investment this week."
9. **Day 12 of trial:** email — "Your trial ends in 2 days. You have an active pipeline of 30 investors and 4 are in 'meeting' status."
10. Converts to paid. Stays 3–6 months until raise closes. Likely churns. Win-back campaign 6 months later when they raise again.

**Perceived value:** saved 20+ hours of LinkedIn scrolling + a pipeline tool they don't have elsewhere.

### 3.3 Other investor → Team subscriber

1. Found article on peer firm's recent deals.
2. Free signup → onboarding answered "Investing."
3. Shown the **competitive intel dashboard preview**: peer-firm activity heatmap, sector flows, "new check sizes" anomaly detector.
4. Two free uses, then paywall to Team plan.
5. Trial → daily usage habit forms within first week if dashboard delivers.
6. High retention because the data refreshes daily and "competitive intel" is a forever job.

**Perceived value:** sees deal flow they'd otherwise hear about 2 weeks later in TechCrunch.

### 3.4 Service provider → Pro subscriber on annual

1. Found via long-tail SEO: *"how to find seed investors for fintech in India 2026."*
2. Lands on a curated list page (one of your SEO honeypots).
3. Sees value immediately — exactly the list they need.
4. Signs up free, hits paywall on CSV export.
5. Buys Pro on annual ($1,910/yr vs $2,388/mo equivalent — 20% saving).
6. Uses the platform as a client deliverable tool. Exports lists into PDFs for clients.

**Perceived value:** they bill clients $5k for the deliverable; the tool costs $200. Easiest sale in the funnel.

### 3.5 Returning user (any plan) → daily habit loop

1. Push notification or email: *"3 updates in your watchlist this morning."*
2. Clicks → activity feed.
3. Activity feed shows: a16z invested in Company X, Naval tweeted about Y, Peak XV announced new fund.
4. Each card has 1-click "save to pipeline" or "share."
5. Spends 4 minutes. Comes back tomorrow.

The activity feed is the single most important screen in the product. Build it right.

### 3.6 Admin team → daily ops

1. Logs into `/admin` (separate subdomain, 2FA required).
2. Dashboard: MRR, new signups today, churn risks (cards with red flags), articles awaiting review, failed enrichments.
3. Reviews 30 AI-rewritten articles in the **editorial queue**: approve, edit, reject. Approved articles auto-publish.
4. Spot-checks 10 newly-enriched investors flagged as low-confidence.
5. Looks at "stuck rows" panel — anything in `processing` >30 min, one-click reset.
6. Reads support inbox (Crisp or Intercom embedded).

### 3.7 VA data team → daily curation

1. Logs into `/admin/curation`.
2. Sees "candidate queue" — new investor names auto-suggested from Crunchbase fresh signals.
3. For each candidate: accept (creates `pending` investor row → kicks off Workflow A) or reject.
4. Reviews "low confidence" enrichment results from Workflow A: fix manually or mark verified.
5. KPIs per VA: investors added, accuracy %, time to first review.

---

## 4. Site information architecture — every page

### 4.1 Public pages (anonymous-accessible, SEO-indexed)

- `/` — homepage. Hero with positioning line, 3 product-value props, "trending investors this week," 6 latest articles, signup CTA.
- `/investors` — investor directory landing. Filters preview (locked behind login for the search itself). SEO target: "investor database."
- `/investors/[slug]` — public investor profile, free preview tier. 3 free per IP per day. Schema.org Person/Organization markup.
- `/articles` — content hub. Paginated.
- `/articles/[slug]` — individual rewritten + commentary article. Schema.org NewsArticle. Most important SEO surface.
- `/lists/[slug]` — curated lists ("Top 25 fintech seed VCs in India May 2026"). Highest-converting SEO surface. Build 50+.
- `/sectors/[sector]` — sector pages (AI, fintech, climate, biotech) auto-generated from tags. Updated weekly.
- `/regions/[region]` — region pages.
- `/pricing` — plan comparison.
- `/about`, `/methodology`, `/sources`, `/editorial-guidelines` — trust pages. Build these well; they're cited by journalists.
- `/blog` — your own commentary, separate from the news rewrite engine. Builds brand.
- `/privacy`, `/terms`, `/cookies`, `/dmca` — legal.
- `/contact` — support form.

### 4.2 Authenticated pages (free tier)

- `/app` — personalized dashboard. Activity feed (last 24h on watchlist), suggested investors, weekly digest preview, plan usage meter.
- `/app/search` — full investor search. Filters: type, region, sector, check size, AUM, stage, active in last 90 days, last invested in (company), partner.
- `/app/investors/[id]` — full investor profile. Tabs: Overview, Investments, News, Socials, Similar.
- `/app/watchlist` — saved investors.
- `/app/activity` — full activity feed with filters.
- `/app/digest` — past weekly digests.
- `/app/account` — profile, password, email prefs, sessions, delete account.
- `/app/billing` — Stripe-backed billing portal.

### 4.3 Authenticated pages (founder Pro features)

- `/app/raise` — raise setup. Stage, sector, check size, current round.
- `/app/raise/matches` — AI-ranked investor matches.
- `/app/raise/pipeline` — Kanban view: Cold, Contacted, Meeting, Diligence, Term Sheet, Closed, Passed.
- `/app/raise/pipeline/[investorId]` — investor card in pipeline. Notes, last contact, intro path, materials shared.
- `/app/raise/materials` — pitch deck, one-pager, data room links. Track who viewed what.
- `/app/raise/intros` — request a warm intro through your network (premium).

### 4.4 Authenticated pages (investor Team features)

- `/app/intel` — competitive intel dashboard. Peer firm heatmap.
- `/app/intel/firms` — track specific firms.
- `/app/intel/sectors` — sector flow analytics. New money moving in/out.
- `/app/intel/dealflow` — anonymized founder watch-list (founders who opted in).
- `/app/intel/exports` — CSV / API access.

### 4.5 Admin panel (`admin.marketunderworld.com` or `/admin`, 2FA required)

- `/admin` — dashboard. Live MRR, today's signups, conversion rates, churn alerts, system health.
- `/admin/users` — user search, edit role, refund, suspend, force-logout, GDPR delete, view audit trail per user.
- `/admin/users/[id]` — single user 360. Subscription history, sessions, pipeline data (founder), watchlist, activity.
- `/admin/billing` — Stripe sync status, failed payments, dunning queue, refunds, MRR breakdown by plan.
- `/admin/investors` — investor DB management. Bulk edit, merge duplicates, manual override, verified flag.
- `/admin/investors/queue` — `pending` and `enrichment_failed` rows. One-click retry.
- `/admin/investors/duplicates` — fuzzy match suggester, merge UI.
- `/admin/articles/queue` — editorial review queue. Approve, edit, reject AI-rewritten articles. Bulk approve for trusted sources.
- `/admin/articles/published` — manage live articles. Edit, unpublish, redirect.
- `/admin/sources` — news source allowlist, scrape health, rate-limit status per source.
- `/admin/news` — `news_raw` browser. Mark relevant / irrelevant to train the classifier.
- `/admin/curation` — VA-mode. Candidate investors from Crunchbase signals.
- `/admin/jobs` — n8n workflow status, last run, error logs, manual trigger buttons.
- `/admin/jobs/stuck` — rows stuck in `processing`. Reset.
- `/admin/audit` — audit log viewer with filters.
- `/admin/featureflags` — feature toggles (Pro features, beta features).
- `/admin/emails` — email template editor, send test, campaign scheduler.
- `/admin/analytics` — funnel, retention cohorts, top SEO pages.
- `/admin/legal/requests` — GDPR / DPDP data subject requests queue.
- `/admin/legal/takedowns` — DMCA + investor opt-out requests.
- `/admin/api-costs` — cost per workflow per day. Budget alerts.
- `/admin/settings` — global config, branding, default plan settings.

### 4.6 Special routes

- `/api/*` — REST API for Team-plan API access.
- `/webhooks/stripe` — Stripe events.
- `/webhooks/memberstack` — auth events (if you use Memberstack; otherwise omit).
- `/sitemap.xml`, `/robots.txt`, `/rss.xml` — SEO + syndication.

---

## 5. Backend system architecture

```
                ┌───────────────────────┐
                │  CDN (Cloudflare)     │
                │  + WAF + rate limit   │
                └──────────┬────────────┘
                           ▼
            ┌──────────────┴───────────────┐
            │   Next.js front + API edge   │  (Vercel)
            │   - SSR for SEO pages        │
            │   - API routes for app       │
            └──────────────┬───────────────┘
                           ▼
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  ┌──────────┐     ┌───────────────┐    ┌──────────────┐
  │ Postgres │     │ Search (Meili │    │ Redis (cache │
  │ (Neon /  │     │  / Typesense) │    │  + queues)   │
  │ Supabase)│     │               │    │ (Upstash)    │
  └────┬─────┘     └───────────────┘    └──────────────┘
       │
       ▼
  ┌───────────────────────────┐
  │  n8n (workflows A–F)      │
  │  Self-hosted or n8n.cloud │
  └────┬──────────────────────┘
       ▼
  ┌────────────────────────────────────────────┐
  │ External APIs: Crunchbase, SerpAPI,         │
  │ NewsAPI, GNews, Twitter, Anthropic,         │
  │ Stripe, Resend, Slack                       │
  └────────────────────────────────────────────┘
```

### 5.1 Frontend
- **Framework:** Next.js 14+ on Vercel. SSR for SEO pages; client-side rendering for `/app/*`.
- **UI:** Tailwind + shadcn/ui.
- **State:** Tanstack Query for server state, Zustand for client state.
- **Auth:** Supabase Auth or Clerk (Memberstack works for low-engineering, but Clerk gives much more control at the price point).

### 5.2 Backend services
- **Primary API:** Next.js API routes for thin endpoints; a separate Node.js service (Fastify) for heavier endpoints (search, exports, intel computations) hosted on Railway/Render/Fly.
- **Background jobs:** n8n for orchestration of the 6 workflows. Plus a Node worker (BullMQ on Redis) for fast in-app jobs (email sends, CSV exports, intel computation).
- **Search:** Meilisearch self-hosted on a $20 VPS or Typesense Cloud. Indexes investors, articles, lists. Reindex via webhook on Postgres changes.
- **Cache:** Upstash Redis. Cache hot investor profiles, leaderboards, sector pages.

### 5.3 Data stores
- **Postgres** — primary store (schema in section 6). Hosted on Neon or Supabase. Daily backups, 30-day PITR.
- **Object storage** — Cloudflare R2 for pitch decks, profile images, exports.
- **Analytics warehouse** — eventually duplicate to BigQuery or DuckDB on R2 for dashboards. Year-2 problem.

### 5.4 Observability
- **Errors:** Sentry (frontend + backend).
- **Logs:** Better Stack or Axiom.
- **Uptime:** Better Stack uptime + status page.
- **Product analytics:** PostHog (self-host on a $10 VPS to avoid pricing surprises).
- **Performance:** Vercel Analytics + Lighthouse CI on PRs.

### 5.5 Email infrastructure
- **Transactional:** Resend ($20/mo to start, scales cleanly).
- **Marketing/newsletter:** Beehiiv ($39/mo for 2,500 subs).
- **Dunning + lifecycle:** built into the app via Resend with scheduled n8n triggers; or use Loops.so.

---

## 6. Database schema — full

Building on the schema we already shipped in `investor-db-schema.sql`, the full production schema includes:

**Identity & billing**
- `users` (id, email, name, role, locale, created_at, last_login_at, mfa_enabled)
- `sessions` (user_id, token_hash, ip, ua, last_seen_at)
- `subscriptions` (user_id, stripe_sub_id, plan, status, current_period_end, trial_end)
- `payments` (user_id, stripe_payment_id, amount, currency, status, invoice_url, at)

**Core data (already drafted)**
- `investors`, `investor_socials`, `investments`, `news_raw`, `articles_published`, `audit_log`

**Engagement & product**
- `watchlists` (user_id, investor_id, added_at)
- `notes` (user_id, investor_id, body, updated_at)
- `pipeline_stages` (user_id, investor_id, stage, last_activity_at)
- `materials` (user_id, kind, file_url, share_token, view_count, created_at)
- `material_views` (material_id, viewer_email, ip, ua, at)
- `saved_searches` (user_id, name, filters_json, alert_enabled, last_run_at)
- `alerts` (user_id, kind, payload_json, sent_at, opened_at)
- `activity_events` (investor_id, kind, payload_json, at) — denormalized feed source
- `feed_views` (user_id, event_id, viewed_at)

**Content + moderation**
- `editorial_queue` (article_id, status, assigned_to, reviewed_at, decision, notes)
- `lists` (slug, title, body, investor_ids[], curator_id, published_at)
- `topics` / `sectors` / `regions` taxonomy tables

**Compliance**
- `data_subject_requests` (user_or_investor_id, kind: access/delete/correct, status, opened_at, closed_at)
- `takedowns` (investor_id, requester_email, reason, status, evidence_url)

**Operational**
- `feature_flags` (key, value_json, rollout_percentage)
- `api_costs` (date, source, calls, dollar_cost) — for the cost dashboard
- `job_runs` (workflow_name, started_at, finished_at, status, error)

---

## 7. REST API surface (Team-plan + internal)

Versioned at `/api/v1/*`. All authenticated with bearer tokens (PAT for Team users, session for app, admin scope for staff).

**Investor search & read**
- `GET /api/v1/investors` — list w/ filters: `?sector=fintech&region=india&min_check=250000&active_since=2026-01-01&limit=50&cursor=...`
- `GET /api/v1/investors/{id}` — full profile (auth tier gates fields).
- `GET /api/v1/investors/{id}/investments` — investment history.
- `GET /api/v1/investors/{id}/news` — news mentions.
- `GET /api/v1/investors/{id}/similar` — recommendation.

**Articles & lists**
- `GET /api/v1/articles?since=...`
- `GET /api/v1/articles/{slug}`
- `GET /api/v1/lists`
- `GET /api/v1/lists/{slug}`

**User actions (app session)**
- `POST /api/v1/watchlist` `{ investor_id }`
- `DELETE /api/v1/watchlist/{investor_id}`
- `POST /api/v1/notes` `{ investor_id, body }`
- `PATCH /api/v1/pipeline/{investor_id}` `{ stage }`
- `POST /api/v1/saved-searches` `{ name, filters, alert_enabled }`
- `GET /api/v1/feed` — activity feed for current user.
- `POST /api/v1/exports/investors` — Pro+ — async job, returns job id.
- `GET /api/v1/exports/{job_id}` — status + signed URL when ready.

**Admin**
- All `/api/v1/admin/*` require `role >= admin`. Mirror admin panel actions.

**Webhooks (incoming)**
- `POST /webhooks/stripe`
- `POST /webhooks/n8n/article-ready` — n8n posts here when a rewritten article is ready for queue.

Rate limits: Free 60/min, Starter 300/min, Pro 1,000/min, Team 10,000/min. Enforced at Cloudflare + app layer.

---

## 8. Subscription model & pricing

| Plan | Price (mo) | Price (yr, -20%) | What's included |
|---|---|---|---|
| Free | $0 | — | 5 investor profiles/day, articles, weekly digest |
| Starter | $49 | $470 | 100 investor profiles/mo, watchlist (20 max), saved searches (3) |
| Pro | $199 | $1,910 | Unlimited profiles, pipeline CRM, exports, alerts, founder raise tools |
| Team | $499 | $4,790 | Pro + competitive intel, API access, 5 seats, deal flow signals |
| Enterprise | from $1k/mo | annual contract | Custom data feeds, SSO, dedicated CSM, SLA |

**Billing rules:**
- 14-day free trial on Pro and Team. Card required.
- Annual: 20% off, paid upfront.
- Dunning: 3 retry attempts over 14 days, then downgrade to Free.
- Refunds: prorated within first 14 days of any new plan; not after.
- Tax: Stripe Tax handles VAT/GST.

**Stripe integration**:
- One Stripe Product per plan, monthly + annual prices.
- Webhook handlers for `customer.subscription.*`, `invoice.*`, `charge.refunded`.
- Sync state to `subscriptions` table; never read entitlement from Stripe at request time — always from local DB.

---

## 9. Background jobs / automation

The six n8n workflows from the architecture doc, plus three operational workflows:

- **Workflow A — Investor enrichment** (built). Schedule trigger, claims pending rows, AI Agent + tools.
- **Workflow B — Funding round tracker** (next). Every 6h, Crunchbase rounds → matches investors → inserts investments.
- **Workflow C — News fetcher** (hourly). NewsAPI + GNews + Google News RSS per active investor → `news_raw`.
- **Workflow D — Social monitor** (daily). Twitter API + website-change-detection.
- **Workflow E — AI rewrite + publish** (per `news_raw` row). Editorial queue → publish.
- **Workflow F — Subscriber sync** (Stripe webhook).

Plus operational:

- **Workflow G — Stuck-row recovery** (every 15 min). Resets rows in `processing` >30 min back to `pending`.
- **Workflow H — Weekly digest** (Monday 8am local time per user). Aggregates each user's watchlist activity → email.
- **Workflow I — Alert engine** (every 5 min). Checks new `activity_events` against `saved_searches`, sends emails.
- **Workflow J — Daily ops digest** (8am internal). Slacks the admin team yesterday's signups, MRR delta, churn, errors.

In-app jobs run on BullMQ over Redis (CSV exports, email sends, intel computations) — faster than n8n for sub-second user-facing work.

---

## 10. Email lifecycle

Every email is triggered, never blast-sent.

**Lifecycle**
- Day 0: Welcome + onboarding nudge (finish your profile).
- Day 1: "Here are 5 investors matching your goal."
- Day 3: First weekly digest sneak peek.
- Day 7: First weekly digest. Locks in the Monday morning habit.
- Day 12: If on trial — *"Your trial ends in 2 days, here's what you'd lose"* with their actual pipeline stats.
- Day 14: Trial converted or downgraded notice.
- Day 30: NPS survey.
- Day 60: Use-case-specific upsell.
- Day 90+: Retention nurture, win-back if churned.

**Triggered**
- New activity on watched investor (configurable: instant / daily / weekly).
- Saved search has new match.
- Payment success / failure.
- Material viewed by an investor.
- Account security: login from new device, password changed.

**Marketing**
- Weekly digest to everyone, every Monday.
- Monthly editorial pick from the founder/editor.

---

## 11. Analytics, KPIs, and dashboards

The numbers that decide if this is working:

**Acquisition**
- Daily unique visitors, by source (organic / direct / social / referral)
- Signups / day, signup-rate per landing page
- Top 20 organic landing pages (kept on a leaderboard)

**Activation**
- % signups that complete onboarding
- % signups that view 3+ investor profiles in first 7 days
- % signups that add 1+ investor to watchlist in first 7 days
- Time-to-first-aha (defined as: 3 profiles viewed + 1 watchlist add)

**Revenue**
- MRR, ARR, by plan
- New MRR, expansion MRR, churned MRR, net new MRR
- Trial-to-paid conversion %
- ARPU by plan and by ICP

**Retention**
- D1, D7, D30 retention curves
- Cohort retention by signup month
- Logo churn % monthly
- DAU/MAU ratio (target > 35%)
- % of paid users who log in 4+ days/week

**Product**
- Watchlist add rate
- Saved search creation rate
- Pipeline stage conversion (cold → contacted, etc.)
- Articles read / user / week
- Search-to-result-click rate

**Operational**
- Editorial queue time-to-review (target < 24h)
- Enrichment success rate
- API cost per active user

Build a single internal dashboard (Metabase pointed at Postgres + PostHog) reviewed every Monday.

---

## 12. Legal, compliance, editorial policy

- **Privacy policy** + **terms** + **cookies** + **DMCA agent registered**.
- **GDPR + UK GDPR + India DPDP**: data subject access / deletion / correction requests workflow with 30-day SLA.
- **Investor opt-out**: every investor profile page has a "this is me, I want this changed/removed" link → goes to `data_subject_requests`. Public-figure exception applied but documented.
- **Editorial guidelines (public)**: methodology page that says how rewrites work, what's sourced where, what's commentary. Reduces legal exposure and increases trust.
- **Content rule**: no rewritten article is published without (a) a clear attribution link to the original source at the top, (b) at least 40% original commentary, (c) factual aggregation rather than paraphrase. Workflow E enforces.
- **Source allowlist**: only rewrite from publications you have a defensible relationship with (RSS-licensed or public-domain factual aggregation). Block tabloid sources.
- **DMCA process**: documented takedown flow, target response <72h.
- **AI disclosure**: every rewritten article has a footer line "Editorially reviewed; first-draft assisted by AI."
- **Data retention**: deleted users' data purged within 30 days; minimum identifiers retained for fraud + tax (Stripe billing records).
- **Security**: bcrypt for password hashes (handled by Supabase/Clerk), HTTPS everywhere, HSTS, CSP, signed cookies, 2FA on admin role.

---

## 13. Infrastructure & hosting

| Service | Provider | Plan estimate |
|---|---|---|
| Frontend / SSR | Vercel | $20–$150/mo depending on traffic |
| Postgres | Neon or Supabase | $25–$100/mo |
| Redis | Upstash | $10–$50/mo |
| Object storage | Cloudflare R2 | $5–$30/mo |
| Search | Meilisearch self-host or Typesense Cloud | $10–$50/mo |
| n8n | Self-host on Hetzner CPX21 or n8n.cloud Pro | $20–$50/mo |
| Email | Resend + Beehiiv | $59/mo |
| CDN + WAF | Cloudflare | Free → $20/mo |
| Monitoring | Sentry + Better Stack | $40/mo |
| Product analytics | PostHog self-host | $10/mo |
| **Infra subtotal** | | **~$200–$580/mo** |

Plus data + services already itemized in the architecture doc (Crunchbase, SerpAPI, NewsAPI, Twitter API, Anthropic, etc.).

CI/CD via GitHub Actions, branch protection, required code review, staging deploys on every PR, production deploys on merge to `main`.

Backups: Neon's PITR + daily logical backup to R2, retained 30 days.

---

## 14. Admin panel — detailed spec

Built as a separate area in the same Next.js app, gated by `role IN ('admin','superadmin')`. UI uses the same shadcn components, just denser tables.

**Dashboard widgets**
- Live MRR ticker + delta vs yesterday
- New signups today + sparkline 30-day
- Trial-to-paid this month %
- Top 5 churn-risk users (paid users with <2 logins last 14 days)
- Articles awaiting review count
- Pending investor enrichment count
- Failed enrichment count (red if >5)
- API cost today + budget %
- System uptime + last incident
- Latest 10 audit events

**User management**
- Search by email / id / Stripe customer
- Edit role
- Trigger password reset
- Issue refund (calls Stripe)
- Force-logout
- Suspend / unsuspend
- View 360: subscription history, sessions, watchlist, pipeline, support tickets

**Editorial review queue**
- One article per row. Columns: title, source, fetched at, AI confidence, plagiarism score, age in queue.
- Click row → split view: original on left, rewrite on right. Edit inline. Approve (publishes immediately) / Edit-and-publish / Reject (deletes draft) / Send back for re-rewrite.
- Bulk approve for trusted sources after warm-up period.
- Filter by source, sector, low/high confidence.
- Keyboard shortcuts (J/K navigate, A approve, R reject) — speed matters at 50+ articles/day.

**Investor curation**
- Candidate queue: investor names suggested by signals (new fund announcements, repeat investor in 3+ deals).
- Accept → inserts a `pending` row → triggers Workflow A.
- Reject → reason captured.
- Merge duplicates: fuzzy-match suggestions, manual merge UI.

**Jobs monitor**
- Workflow status table: name, last run, next run, success rate 24h, last error.
- Manual trigger button per workflow.
- "Stuck rows" panel with one-click reset.

**Audit log viewer**
- Filter by table, actor, action, date range.
- Used for: support investigations, security audits, customer disputes.

**Legal queue**
- Open data subject requests, open takedowns. SLA timers visible. One-click apply (delete user / scrub investor / publish correction).

---

## 15. 12-month roadmap (quarter by quarter)

### Q1 (months 1–3) — Foundation
- Postgres + auth + billing live.
- Workflows A, B, C running.
- VA team curates first 1,000 investors.
- Public site live with 50 SEO articles, 10 curated lists.
- Free + Pro plans only. Manual editorial review on every article.
- Soft launch to 200-person waitlist. Goal: 20 paying Pro users.

### Q2 (months 4–6) — Activation
- Workflows D, E, F live. Editorial review still human-gated.
- Pipeline CRM for founders shipped.
- Watchlist + activity feed live.
- Weekly digest live.
- Admin panel v1.
- 100 SEO articles total. Goal: 100 paying users, $20k MRR.

### Q3 (months 7–9) — Differentiation
- Team plan launches with competitive intel dashboard.
- API access for Team plan.
- Saved searches + alerts.
- Annual plans.
- 250 SEO articles. Goal: 250 paying users, $50k MRR, $1k–$5k Team contracts.

### Q4 (months 10–12) — Scale
- Enterprise plan with custom data feeds.
- iOS app for activity feed + alerts (huge retention lever).
- Community / forum layer (optional).
- Sponsored content + premium reports as a second revenue stream.
- 500 SEO articles. Goal: 500 paying users, $100k MRR.

---

## 16. Cost & revenue model

**Operating cost at three scales:**

| Cost item | Month 1 | Month 6 | Month 12 |
|---|---|---|---|
| Crunchbase API | $1,500 | $2,000 | $2,500 |
| SerpAPI | $50 | $200 | $500 |
| NewsAPI / GNews | $100 | $300 | $500 |
| Twitter / X API | $200 | $200 | $500 |
| Anthropic (rewrites + enrichment) | $200 | $1,000 | $3,000 |
| Plagiarism check | $50 | $200 | $400 |
| Infra (everything in §13) | $250 | $500 | $1,200 |
| Email (Resend + Beehiiv) | $60 | $150 | $400 |
| VA team | $1,500 | $3,000 | $5,000 |
| Editorial (1 part-time → 1 FT) | $0 | $2,000 | $5,000 |
| Eng (you ± 1 contractor) | varies | $3,000 | $6,000 |
| **Total cost** | **~$4k** | **~$13k** | **~$25k** |

**Revenue at the same scales (against Pro $199 + Team $499 mix):**

| Month | Paid users | Mix | MRR |
|---|---|---|---|
| 1 | 20 Pro | 100% Pro | $4,000 |
| 6 | 80 Pro + 20 Team | mix | $25,900 |
| 12 | 250 Pro + 80 Team + 5 Enterprise | mix | $110,000+ |

Break-even somewhere around month 4–5 in this model. $1M ARR achievable by month 12–18 if SEO compounds and the activation loop works. If those break, revise.

---

## 17. Differentiation playbook — how you beat each competitor

**vs Crunchbase Pro ($99/mo)** — they're broader but flat. You win on **commentary, fresh news, founder-side workflow tools (pipeline CRM), and curated lists**. Crunchbase doesn't have a pipeline tool.

**vs PitchBook (enterprise)** — they win on data depth, you lose that fight. You win on **price, speed of news, and founder accessibility**. PitchBook never serves founders directly.

**vs Harmonic** — they're AI-driven startup discovery for VCs. You overlap on the investor-intel side. You win by **also serving founders**, which doubles the addressable market.

**vs Signal NFX / OpenVC** — free or freemium, light data. You win on **depth and tooling**. They win on community.

**vs Lenny's Newsletter / The Information** — content-led. You overlap on the SEO funnel. You win by **converting readers into product users**, not just paid newsletter subs.

The defensible wedge: **"the only investor intelligence platform that's actually a tool for founders raising and a competitive intel layer for investors, with daily fresh signal you don't get on Crunchbase."** Pick that line, repeat it everywhere.

---

## 18. The "must come and look" loop — recap

A user opens the site daily if and only if **something they care about changed since they last looked.** Engineering against that:

1. Activity feed personalized to their watchlist — push notification at 9am local with count.
2. Weekly digest — Monday 8am, every user.
3. Saved-search alerts — instant or daily, user choice.
4. Trending dashboard — refreshed daily, FOMO mechanic.
5. Founder pipeline tool — they stay because their data lives here.
6. Activity streaks (optional gamification) — "you've checked your watchlist 5 days running."

The single most important metric to optimize: **% of paid users who log in 4+ days per week.** Hit 40% on that and churn is solved.

---

## 19. What's still open / decisions to make

1. **Auth provider**: Clerk vs Supabase vs Memberstack. Recommendation: **Clerk** for control.
2. **Postgres host**: Neon vs Supabase. Recommendation: **Neon** for PITR; pair with Clerk for auth.
3. **n8n self-host vs cloud**: depends on your DevOps appetite.
4. **CMS for current marketunderworld.com**: still unknown — I couldn't fetch the site. Send a screenshot or stack info.
5. **Who builds the frontend**: you / a hire / a contractor. The plan assumes someone with Next.js skill.
6. **Editorial lead**: critical hire by month 3 or sooner.
7. **Brand voice**: needs a 1-page guideline before article volume scales.

---

## 20. What to do this week

If you want a concrete next 7-day list:

1. Decide auth + DB provider (Clerk + Neon recommended).
2. Spin up empty Next.js repo + Postgres + Neon backups.
3. Run the existing `investor-db-schema.sql`.
4. Stand up n8n and import Workflow A.
5. Hire / brief 2 VAs to start curating the first 100 investors.
6. Buy domains for staging/admin (`app.marketunderworld.com`, `admin.marketunderworld.com`).
7. Write the brand voice 1-pager and the 5 first SEO list pages by hand — these are templates the AI will copy.

Tell me which slice to build next and I'll produce the actual code or workflow.
