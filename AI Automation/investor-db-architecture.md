# Investor Intelligence Platform — Architecture & n8n Workflow Plan

**Target site:** marketunderworld.com
**Monetization:** gated subscription via Memberstack / Outseta / MemberPress
**Universe:** global investors writing $1M+ checks
**Data sources:** Crunchbase / PitchBook / Tracxn (paid APIs) + news APIs + selective social scraping + VA-curated baseline

---

## 1. The shape of the system

The product is really three loops that share one database:

1. **Acquisition loop** — fill the investor database (VAs + paid APIs + enrichment).
2. **Intelligence loop** — keep each investor record fresh (new investments, news, social signals).
3. **Publishing loop** — take the news the intelligence loop captures, rewrite it, publish it to marketunderworld.com, and use the SEO traffic that generates as the funnel into the gated subscription.

n8n orchestrates loops 2 and 3. Loop 1 is mostly human + spreadsheet at the start, automated later.

```
 ┌──────────────┐    ┌─────────────────┐    ┌─────────────────┐
 │  Acquisition │ →  │  Master DB      │ ←  │  Intelligence   │
 │  (VAs +      │    │  (Postgres or   │    │  (n8n cron jobs)│
 │   APIs)      │    │   Airtable)     │    │                 │
 └──────────────┘    └────────┬────────┘    └────────┬────────┘
                              │                       │
                              ▼                       ▼
                     ┌─────────────────┐    ┌─────────────────┐
                     │  Member site    │    │  Publishing     │
                     │  (Memberstack + │    │  (AI rewrite →  │
                     │   Webflow/WP)   │    │  marketunder-   │
                     └─────────────────┘    │  world.com)     │
                                            └─────────────────┘
```

---

## 2. Data model

Use Postgres if you expect >10k investors or want serious query power; Airtable if you want VAs editing rows daily and don't need complex joins. n8n speaks to both natively.

**investors** — name, type (VC/angel/family office/PE/CVC), region, AUM, focus sectors, website, status, dedupe_key
**investor_socials** — investor_id, platform (twitter/linkedin/instagram/facebook), handle, url, last_checked_at
**investments** — investor_id, target_company, round, amount_usd, date, source_url, source_name
**news_raw** — investor_id, url, headline, body, source, fetched_at, content_hash, status (pending/rewritten/published/skipped)
**articles_published** — news_raw_id, slug, title, body, published_at, cms_post_id, status
**subscribers** — synced from Memberstack via webhook (email, plan, status, joined_at)
**audit_log** — every write, with source. Non-negotiable for a paid-data product.

`content_hash` and `dedupe_key` are the unglamorous fields that save you. Without them you get duplicate articles and duplicate investors and the product becomes unsellable.

---

## 3. The n8n workflows

### Workflow A — Investor enrichment (triggered: new row in `investors`)

Triggered when a VA adds an investor. Steps:

1. Crunchbase API lookup by name → fetch firm profile, partners, AUM, website.
2. Clearbit / Apollo lookup → enrich personal websites and social handles.
3. Google search via SerpAPI → find Twitter/LinkedIn/Instagram handles from official sources only (firm website, AngelList, Crunchbase profile — not scraped from Meta).
4. Write back to `investor_socials`.
5. Slack / email notification to your team for manual QA.

### Workflow B — Investment tracker (cron: every 6h)

1. Crunchbase API: `funding_rounds` endpoint, filtered to last 24h.
2. For each round, fuzzy-match investors to your `investors` table (use Postgres `pg_trgm` or an LLM matching step).
3. Insert into `investments`. Compute "this month" / "this year" totals via a SQL view, not stored columns.
4. PitchBook or Tracxn as backup for rounds Crunchbase misses (esp. India/Asia).

### Workflow C — News fetcher (cron: hourly)

1. For each active investor, query NewsAPI / GNews / Google News RSS with `"<investor name>" + (invest OR fund OR portfolio)`.
2. Dedupe by URL + `content_hash` (SHA-256 of headline+first 500 chars).
3. Filter by source allowlist (TechCrunch, Bloomberg, Reuters, Inc42, etc.) — drop blog-spam.
4. Insert into `news_raw` with status=`pending`.
5. Push to a Redis queue or just rely on the DB row status for the rewrite workflow.

### Workflow D — Social monitor (cron: daily, light touch)

This is the legally fragile workflow. Do it like this:

1. **Twitter/X**: official API v2 (Basic tier ~$200/mo, or use Apify Twitter scraper actor for cost). Pull last 24h of posts for each tracked handle.
2. **LinkedIn**: do NOT scrape. Subscribe to official RSS via the investor's company page where available, or rely on news mentions from Workflow C.
3. **Instagram / Facebook**: Meta Graph API only works for pages you own. Skip platform scraping. Have VAs spot-check the 50 most important investors weekly.
4. **Personal websites**: simple HTTP GET, hash the page, alert on change. n8n's HTTP Request + Crypto nodes do this in 4 steps.

### Workflow E — AI rewrite + publish (triggered: new `news_raw` with status=pending)

This is the workflow that has to be defensible legally and editorially.

1. Pull the raw article (full text via `mercury-parser` or `extractus/article-extractor`).
2. Send to Claude or GPT with a strict rewrite prompt:
   - Aggregate facts only, do not paraphrase sentence-by-sentence.
   - Cite the original source by name + link at the top.
   - Add your editorial angle (why this investor / why now / what their pattern says).
   - Reject if the article is < 80 words of factual content.
3. Plagiarism check (Copyscape API or `originality.ai`) — must score > 90% original.
4. Optional: human review queue for the first 30 days. Send to Slack with Approve/Reject buttons (n8n has webhook triggers).
5. Publish to marketunderworld.com via:
   - **WordPress**: native n8n WordPress node, set as draft first, then publish.
   - **Webflow**: HTTP Request node → Webflow CMS API (POST `/collections/{id}/items`).
   - **Ghost / custom**: HTTP Request with bearer token.
6. Write back to `articles_published` with the CMS post ID for later edits.

### Workflow F — Subscriber sync (webhook from Memberstack)

1. Memberstack fires `member.created` / `member.updated` / `member.deleted` webhooks to an n8n webhook URL.
2. Upsert into `subscribers`.
3. If new paid subscriber: add to Brevo / ConvertKit, send welcome email, post to internal Slack.

---

## 4. Member-facing site

Memberstack + Webflow is the most common pairing here and the fastest to launch.

- **Public** (SEO funnel): the rewritten articles from Workflow E. Free. This is what gets indexed and brings traffic.
- **Free preview**: first 2-3 paragraphs of any investor profile.
- **Paid**: full investor profiles with social handles, monthly/yearly investment totals, news feed per investor, downloadable CSV.
- **Search/filter**: Memberstack does NOT do this. Options:
  - **Softr** on top of Airtable — fast to ship, looks decent.
  - **Whalesync** sync Postgres → Airtable → Webflow CMS — Webflow-native search.
  - Custom React + Postgres — if you go SaaS-grade later.

**Pricing tiers** (suggested floor for unit economics to work):
- Free: SEO articles only.
- Starter $49/mo: 100 investor profiles/month, basic search.
- Pro $199/mo: full DB, exports, alerts.
- Team $499/mo: API access, multi-seat.

---

## 5. What's missing from the original plan

These are the things that will either kill the product or eat the margin if you don't plan for them now.

**Copyright on rewritten news.** "Rewriting" an article in AI doesn't create a clean copyright story. Substantial similarity is the legal test, not word-level paraphrase. The defensible pattern is **factual aggregation with attribution**, not paraphrase. Workflow E is designed for that, but you need editorial guidelines written down and an EIC who owns them.

**Social media ToS.** Meta, LinkedIn, and X all forbid automated scraping. Bans hit accounts and IP ranges. Twitter/X has an official API; LinkedIn doesn't and `hiQ v LinkedIn` made the law messy, not clear. Plan to never scrape LinkedIn directly — rely on news mentions and VAs.

**Entity resolution.** "Sequoia," "Sequoia Capital," "Sequoia India," "Peak XV" are different DB rows that all need to exist and link. Investors change firms. Solo GPs spin out. You need a `dedupe_key` strategy and a periodic merge tool from day one.

**Source citation.** Paid customers will challenge any data point that looks wrong. Every field needs a `source_url` and `source_fetched_at`. Without it, churn destroys the product after month 2.

**GDPR / DPDP (India).** Investors are people. EU/UK/India investors can request deletion. You need a `data_subject_requests` workflow and a privacy policy that names your data sources.

**Cost floor.** Realistic monthly operating cost at launch:
- Crunchbase API: $1,500–$2,000
- PitchBook (if used): $20k+/yr — usually too expensive at launch, skip
- Tracxn: ~$500–$1,500 depending on plan
- NewsAPI / GNews: $50–$500
- Twitter/X API: $200
- Claude/GPT for rewriting (~5k articles/mo at ~$0.05 each): $250
- Copyscape: $50
- n8n self-hosted on a $20 VPS or n8n.cloud ~$50
- Memberstack: $49–$249
- Webflow: $25–$50
- VA team (3 people, part-time): $1,500–$3,000

→ **Floor: ~$4k/mo, realistic: $6–8k/mo** before any marketing. Break-even at ~$199/mo = ~30–40 paying subscribers.

**SEO strategy.** The rewritten articles are your acquisition channel. They need:
- Schema.org `NewsArticle` markup.
- Internal links from each article to the gated investor profile.
- Unique editorial angle (LLM-paraphrased news ranks badly post-March 2024 Google updates).

**n8n hosting.** Self-host on Hetzner / DigitalOcean ($20–$40/mo) if you have devops competence. Use n8n.cloud if you don't — the $50/mo plan handles this volume.

**Backups + audit log.** Daily DB snapshot, retained 30 days. Every write to `investors` and `articles_published` logged. For paid B2B, this is required, not optional.

**Editorial QA in the first 90 days.** Auto-publish is tempting; don't do it at launch. Workflow E should send everything to a human review queue until you've shipped 200+ articles and tuned the prompts.

---

## 6. 90-day rollout

**Days 1–14 — Foundation**
- Decide Airtable vs Postgres. Set up DB schema above.
- Stand up n8n (self-hosted or cloud).
- Connect Crunchbase, NewsAPI, Twitter/X API.
- Memberstack account, Webflow site, basic paywall.

**Days 15–45 — Database**
- VA team curates first 500 Tier-1 investors manually.
- Workflow A enriches them automatically.
- Workflow B starts logging investments.
- Internal-only — no public site yet.

**Days 46–75 — Publishing engine**
- Workflows C, D, E built and tested.
- Human review queue for every published article.
- First 30 articles live on marketunderworld.com.
- Soft launch to a waitlist of 50–100 people, free.

**Days 76–90 — Monetize**
- Paid tiers live.
- Workflow F syncs subscribers.
- First paid cohort. Measure: signup → activation → retention at week 4.

---

## 7. Open questions for you

These are the decisions that change the build, in priority order:

1. **What CMS is marketunderworld.com on?** (WordPress / Webflow / Ghost / custom — drives the publish node.)
2. **Airtable or Postgres for the master DB?** (Volume + VA workflow drives this.)
3. **n8n: self-hosted or cloud?** (Cost vs ops effort.)
4. **Do you already have a Crunchbase / Tracxn subscription, or do we budget it?**
5. **Who owns editorial?** (You / a hire / outsourced — affects Workflow E review queue design.)
