# MarketUnderworld — Admin Panel Specification

This is the full spec of the admin panel: every screen, every role, every action, every audit hook. Built as a separate area in the same Next.js app, served from `admin.marketunderworld.com` (or `/admin` if you want it same-domain). All admin routes require 2FA, IP allowlist optional, every state-changing action writes to `audit_log`.

---

## 1. Roles and permission matrix

Six roles. Permission scopes are additive — superadmin inherits everything.

| Role | Description | Typical user |
|---|---|---|
| `member_free` | Free signup | End user |
| `member_paid` | Paid sub (any tier) | End user |
| `va` | Data curator | Outsourced VA |
| `editor` | Reviews + publishes articles | Editorial staff |
| `support` | User-facing ops | Support agent |
| `admin` | Manages all of the above | Ops lead |
| `superadmin` | Org owner; billing + infra | Founder |

### Permission matrix

| Capability | VA | Editor | Support | Admin | Super |
|---|:---:|:---:|:---:|:---:|:---:|
| View investor data | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add / edit investors | ✓ | — | — | ✓ | ✓ |
| Merge / delete investors | — | — | — | ✓ | ✓ |
| View article queue | — | ✓ | — | ✓ | ✓ |
| Approve / reject articles | — | ✓ | — | ✓ | ✓ |
| Publish to CMS | — | ✓ | — | ✓ | ✓ |
| Edit published article | — | ✓ | — | ✓ | ✓ |
| View user list | — | — | ✓ | ✓ | ✓ |
| View user 360 | — | — | ✓ | ✓ | ✓ |
| Impersonate user | — | — | ✓ (with reason) | ✓ | ✓ |
| Refund payment | — | — | ≤$200 | ≤$2000 | ∞ |
| Suspend user | — | — | ✓ | ✓ | ✓ |
| Delete user (GDPR) | — | — | — | ✓ | ✓ |
| Edit roles | — | — | — | ≤ admin | ✓ |
| View billing / MRR | — | — | partial | ✓ | ✓ |
| Trigger workflows | — | — | — | ✓ | ✓ |
| Edit feature flags | — | — | — | ✓ | ✓ |
| Edit pricing | — | — | — | — | ✓ |
| Manage API keys | — | — | — | ✓ | ✓ |
| Edit global settings | — | — | — | — | ✓ |
| View audit log | — | — | self only | ✓ | ✓ |
| Manage admin users | — | — | — | — | ✓ |

Every permission check is enforced at the API layer, not just the UI. Frontend hides irrelevant menus by role.

---

## 2. Auth and 2FA for admin users

- All admin accounts require 2FA (TOTP via Authy/1Password/Google Authenticator). No SMS — too risky.
- 2FA setup flow: on first admin login, forced to set up TOTP before reaching any screen.
- Backup codes generated at setup, shown once.
- Session timeout: 8 hours for admin/support/editor, 24 hours for VA.
- IP allowlist optional, configurable per role at `/admin/settings/security`.
- All admin logins logged with IP + UA, surfaced in `/admin/audit`.
- Force-logout-all-sessions button per admin user (superadmin only).
- Single sign-on via Google Workspace optional for the staff org.

---

## 3. Admin home (`/admin`)

Single-screen ops dashboard, refreshed every 60s.

**Top metric strip (live):**
- MRR — current value + delta vs yesterday + sparkline 30 days
- New signups today + breakdown by source
- Trial-to-paid conversion this month %
- Active users right now (sessions in last 5 min)
- System health badge (green / yellow / red, click for detail)

**Action queues (cards with counts + click-through):**
- Articles awaiting review (red if >50, click → editorial queue)
- Investors pending enrichment (yellow if >100)
- Failed enrichments in last 24h (red if any)
- Open data subject requests with SLA timer
- Open takedown requests with SLA timer
- Refund requests pending
- Support tickets unread

**Risk panels:**
- Top 5 churn-risk users (paid users with <2 logins last 14 days, sorted by MRR)
- API cost today vs daily budget
- Failed payments in dunning

**Activity stream (right rail):**
- Last 20 audit events
- Click any event → audit log filtered

**Permission:** all admin staff. VAs only see the "Pending investor enrichment" and "Failed enrichments" cards.

---

## 4. User management

### 4.1 User list (`/admin/users`)
- Filters: plan, status (active/trial/churned/suspended), role, signup date range, last_login range, country, lifetime spend > X
- Columns: email, name, plan, status, MRR, LTV, signups date, last login, role
- Bulk actions: tag, email, export CSV
- Sort by any column
- Saved views per admin user

### 4.2 User 360 (`/admin/users/[id]`)

Tabbed page:

**Overview tab**
- Avatar, name, email, plan badge, status badge, lifetime spend
- Quick actions: impersonate, refund, suspend, send password reset, force-logout, edit role, GDPR delete
- Signup info: date, source, referrer, UTM tags
- Onboarding answers (raising/investing/etc.)
- Notes added by admins (free text)

**Subscriptions tab**
- All Stripe subscriptions, current + historical
- Each row: plan, status, started, current period, trial ended, MRR, Stripe link
- Actions: change plan (with proration preview), apply coupon, extend trial, cancel at period end, cancel immediately

**Payments tab**
- All invoices and charges
- Per row: amount, status, invoice PDF link, Stripe link
- Refund button per charge (with reason + amount; permission-gated by role's cap)

**Sessions tab**
- Active sessions: IP, UA, location, last active
- Historical sessions (last 90 days)
- Kick session / kick all

**Pipeline tab (founders)**
- Their pipeline data — investors, stages, notes
- Read-only; not editable by admins to avoid trust issues

**Watchlist tab**
- Investors they've watchlisted

**Activity tab**
- Last 100 product events: viewed investor X, ran search Y, exported Z
- Helps support diagnose "I can't find...".

**Audit tab**
- All admin actions on this user (impersonations, refunds, role changes)

### 4.3 Impersonation (`/admin/users/[id]` → Impersonate)
- Requires reason input (logged to audit).
- Opens a new browser session as that user, scoped with banner "Impersonating <email>."
- Read-mostly: cannot create/destroy resources; can view what they see.
- Auto-expires after 30 minutes.
- All actions during impersonation tagged with `impersonator_id` in audit.

### 4.4 GDPR / data subject requests
- Per user, "Export data" button → packages a ZIP of profile + watchlist + pipeline + notes + activity → emailed to user.
- "Delete user" button → scrubs PII per retention policy, retains billing records for tax (7 years).
- "Correct data" inline edits to user fields.
- All flow through `/admin/legal/requests` queue (section 14).

---

## 5. Billing & revenue admin

### 5.1 Billing dashboard (`/admin/billing`)
- MRR breakdown: by plan, by month-over-month delta, by cohort
- ARR projection
- New MRR / expansion / contraction / churn / reactivation
- Active subscriptions count by plan
- Trial-in-progress count
- Failed payments / dunning queue with retry status
- Refunds this month (count + $)
- Top 20 customers by LTV

### 5.2 Stripe sync status (`/admin/billing/sync`)
- Last successful webhook event timestamp
- Webhook failures last 24h (red if >0)
- Manual re-sync button per subscription
- Out-of-sync list: subs where Stripe state ≠ local DB

### 5.3 Coupons & promotions (`/admin/billing/coupons`)
- Create coupon: code, % or $ off, applies to plans, expires, max redemptions, first-time-only flag
- Active coupons list with redemption count
- Per-coupon redemption log
- Deactivate / archive

### 5.4 Pricing experiments (`/admin/billing/experiments`)
- A/B test plan prices (e.g., split 50/50 on Pro $199 vs $179 for new signups)
- Variant config, target metric, sample size needed
- Auto-stop on significance
- Superadmin only

### 5.5 Tax & compliance
- View Stripe Tax registration status
- Download tax reports (monthly per jurisdiction)
- VAT/GST overrides per customer (B2B exemptions)

---

## 6. Investor data management

### 6.1 Investor list (`/admin/investors`)
- Filters: enrichment_status, firm_type, region, last_updated, has_socials, confidence
- Columns: name, type, region, AUM, last_invested, social count, confidence, verified flag
- Bulk: mark verified, retry enrichment, archive, export
- Click row → investor edit page

### 6.2 Investor edit (`/admin/investors/[id]`)
- Full CRUD on every field with inline validation
- Manual override flag per field — if set, future workflow runs won't overwrite
- Socials editor: add / remove / verify each platform
- Investments editor: add / edit / delete rounds
- Linked articles list (read-only)
- Change history: diff viewer showing who changed what when

### 6.3 Investor queue (`/admin/investors/queue`)
- Tabs: `pending`, `processing`, `enrichment_failed`, `low_confidence`
- One-click actions: retry, mark verified, archive
- Bulk retry
- Per row: age in queue, last attempt error message

### 6.4 Duplicate detection (`/admin/investors/duplicates`)
- Fuzzy-match suggester (pg_trgm similarity > 0.6)
- Side-by-side compare UI
- Merge action: pick primary record, choose per-field winner, all references re-pointed
- Permanent — captures merge in audit log so it's reversible by superadmin

### 6.5 Curation queue (`/admin/curation`)
- Candidate investors auto-suggested from:
  - Crunchbase fresh funding round signals where the lead investor isn't in our DB
  - News articles mentioning unknown investor names
  - User-suggested additions (Pro/Team users can suggest)
- Per candidate: name, source, suggested type, raw mentions
- Accept (inserts as `pending` → triggers Workflow A) or Reject (logged with reason)
- VA leaderboard: investors added per day, accuracy rate (% verified after enrichment)

### 6.6 Most-watched investors (`/admin/investors/popular`)
- Top 100 investors by watchlist count + pipeline adds
- Curation priority signal — which investors need the most attention
- Read-only

---

## 7. Editorial / content management

### 7.1 Editorial queue (`/admin/articles/queue`)

The highest-volume admin screen. Optimized for keyboard speed.

- One article per row. Filters: source, sector, region, AI confidence, plagiarism score, age in queue, assigned editor
- Sort by: age (oldest first by default), confidence, plagiarism score
- Bulk approve / reject for trusted sources after warm-up
- Per row: title, source, AI confidence %, plagiarism originality %, sources used, age in queue, assigned to

**Review view (click a row):**
- Split-screen: original article on left, AI rewrite on right
- Plagiarism breakdown panel: which sentences flagged as similar to source
- Inline edit on the rewrite side
- Sources used list with link-out
- Audit panel: what tools the AI called, in what order
- Actions:
  - **Approve & Publish** — sends to CMS, marks `published`
  - **Edit & Publish** — saves edits and publishes
  - **Send back for re-rewrite** — sends back to AI with editor's note (re-runs Workflow E with extra instruction)
  - **Reject** — soft-delete with reason (logged)
- Keyboard shortcuts: J/K navigate, A approve, E edit, R reject, P publish

### 7.2 Published articles (`/admin/articles/published`)
- Filters: status (live/unpublished/redirected), source, sector, published date, view count
- Per row: title, slug, published_at, view count, conversion attributed
- Actions: edit, unpublish (sets `noindex`), redirect, schedule recurring update
- SEO panel per article: meta title, meta description, canonical, Open Graph image, schema markup preview
- Performance: views, signups attributed, paid conversions attributed (last-touch + first-touch)

### 7.3 Article composer (`/admin/articles/new`)
- Manual blog post writer (not from AI)
- Markdown editor with live preview
- Image upload to R2
- SEO panel
- Schedule publish

### 7.4 Source management (`/admin/sources`)
- News source allowlist: domain, publication name, license type (RSS-licensed / public commentary / blocked), default trust score
- Per source: scrape health (last successful, error rate), articles fetched 24h, articles approved, articles rejected
- Block / unblock source
- Per source rate-limit config

### 7.5 News raw browser (`/admin/news`)
- Browse `news_raw` table
- Per row: investor, headline, source, fetched_at, status (pending/rewritten/published/skipped), content_hash
- Mark as relevant / irrelevant (trains future classifier)
- Manual trigger of Workflow E for a specific row

### 7.6 Curated lists builder (`/admin/lists`)
- The SEO honeypots ("Top 25 fintech seed VCs in India 2026")
- Per list: slug, title, intro body (markdown), curator notes, investor_ids array, publication date, expiry/refresh date
- Drag-to-reorder investors
- Auto-populate suggestion: pick filters → preview matching investors → add bulk
- Schedule refresh: monthly / quarterly / never
- SEO panel per list

### 7.7 Sector & region pages (`/admin/sectors`, `/admin/regions`)
- Editable intro markdown per sector
- Featured investors override
- Custom layout blocks (highlighted lists, embedded charts)

### 7.8 Editorial guidelines page (`/admin/editorial-policy`)
- The public-facing methodology + ethics doc
- Markdown, versioned

---

## 8. Support tools

### 8.1 Tickets (`/admin/support`)
- Embedded Crisp or Intercom inbox
- Per ticket: user link → opens User 360
- Macros for common replies
- Tags: billing / bug / feature-request / data-correction / abuse
- Per-agent stats: response time, resolution rate, CSAT

### 8.2 Refund tool
- Triggered from User 360 → Payments tab
- Required fields: amount (≤ role cap), reason (dropdown + free text)
- Preview: Stripe will refund $X to card ending Y
- Logged to audit, refund email auto-sent

### 8.3 Bulk message tool (`/admin/support/broadcast`)
- Send a message to a segment of users (e.g., "trial users active in last 7 days")
- Template + variables
- Preview against 5 sample users
- Send in batches, throttled
- Admin+ only

---

## 9. Marketing tools

### 9.1 Referral program (`/admin/marketing/referrals`)
- Toggle program on/off
- Set reward: $X account credit / Y days free / fixed coupon
- Per-user referral codes (auto-generated)
- Leaderboard of top referrers
- Anti-fraud rules: same IP, same payment method, fingerprint match

### 9.2 Email campaigns (`/admin/marketing/campaigns`)
- Campaign builder: name, segment, template, schedule, A/B variants
- Segment builder: visual query over `users` (plan, signup date, activity, geo, plan source)
- Template editor: HTML or markdown with variables
- A/B test: split %, target metric (open / click / conversion)
- Sent campaigns: opens, clicks, unsubscribes, conversions

### 9.3 Onboarding flow editor (`/admin/marketing/onboarding`)
- Edit the welcome questionnaire questions, branches, post-signup landing
- Preview as new user
- A/B variants supported

### 9.4 Landing page templates (`/admin/marketing/landing`)
- Library of templates for paid-traffic landing pages
- Slug, hero, value props, CTA
- UTM-tagged tracking per template

---

## 10. SEO admin (`/admin/seo`)

- Sitemap status: last regenerated, URL count, errors
- Robots.txt editor
- Redirect manager: from-slug → to-slug, type (301/302), hit count
- Canonical override per article
- Meta tag global defaults (title pattern, description pattern, OG image fallback)
- Schema.org markup validator (paste any URL → see preview)
- Indexed pages tracker (pull from Search Console API): which pages are indexed, which dropped
- Internal link audit: orphan pages, pages with <3 inbound links
- Broken link scanner: links from articles to dead URLs

---

## 11. Jobs & workflow monitor

### 11.1 Workflow list (`/admin/jobs`)
- Each n8n workflow as a row: name, schedule, last run time, success/fail, success rate 24h, success rate 7d, last error
- Status badges (green / yellow / red)
- Click → workflow detail

### 11.2 Workflow detail (`/admin/jobs/[name]`)
- Run history (last 100): timestamp, duration, status, items processed, error
- Per-run drilldown: full n8n execution log link
- Manual trigger button (with confirmation)
- Pause/resume
- Edit schedule (writes to n8n via API)

### 11.3 Stuck rows (`/admin/jobs/stuck`)
- Any row stuck in `processing` >30 min, across all tables (investors, news_raw, articles_published)
- One-click reset to `pending`
- Bulk reset

### 11.4 In-app job queue (`/admin/jobs/bullmq`)
- BullMQ queue status: waiting, active, delayed, failed, completed
- Per queue: throughput, p95 latency
- Failed jobs: payload, error, retry button

---

## 12. Audit & activity log

### 12.1 Audit log viewer (`/admin/audit`)
- Filters: actor (admin user), table, action, target id, date range, IP
- Columns: when, actor, action, table, row id, payload diff, IP, UA
- Click row → full event detail with before/after payload
- Export CSV
- Required reading for security reviews

### 12.2 Admin activity (`/admin/audit/admins`)
- Per-admin scorecard: actions per day, sensitive actions (refunds, deletes, impersonations) per week
- Anomaly detection: admin doing unusual volume of sensitive actions → alert superadmin

---

## 13. Legal & compliance queue

### 13.1 Data subject requests (`/admin/legal/requests`)
- Open requests with SLA countdown (30 days from received)
- Kind: access (export) / correct / delete
- Status: open / in_progress / closed
- Per request: requester email, identity verification status, request body
- One-click fulfill (triggers export job or delete job)
- Audit trail with timestamps for compliance evidence

### 13.2 Takedown / opt-out (`/admin/legal/takedowns`)
- Investor opt-out requests (someone wants their investor profile removed)
- DMCA notices from publishers
- Per request: requester, target investor/article, reason, evidence link
- Actions: accept (scrub or unpublish) / dispute / escalate to legal
- SLA timer (72h target)

### 13.3 Compliance dashboard (`/admin/legal`)
- Open requests count by type
- Average time-to-close
- Overdue requests (red banner)
- Quarterly compliance report generator

---

## 14. Feature flags & experiments

### 14.1 Feature flags (`/admin/featureflags`)
- Per flag: key, description, default value, rollout (off / on / % / specific users / specific plans)
- Toggle UI with confirmation for destructive changes
- Per-flag audit trail
- Common flags shipped from day 1:
  - `pipeline_v2` — pipeline UI redesign
  - `intel_dashboard` — investor intel dashboard
  - `api_access` — Team API
  - `weekly_digest` — kill switch
  - `ai_rewrite_autopublish` — auto-publish without editorial review (only flip after warm-up)

### 14.2 Experiments (`/admin/experiments`)
- A/B test config: name, variants, traffic split, target metric, minimum sample size
- Live results with significance indicator
- Variant assignment is sticky per user (hashed)
- Sunset stale experiments automatically after 60 days

---

## 15. API & integrations

### 15.1 API keys (`/admin/api-keys`)
- Two key types: user-facing (Team plan customers) and internal service-to-service
- Per key: label, owner, scope (read-only / read-write), rate limit override, last used, created
- Rotate / revoke per key
- Usage analytics per key

### 15.2 Webhooks (`/admin/webhooks`)
- Outgoing webhooks customers can register (Team plan): URL, events, secret, retry policy
- Incoming webhook health: Stripe, n8n, Memberstack (if used) — last received, failure count
- Per-webhook event log

### 15.3 Integrations (`/admin/integrations`)
- Status panel for each external service: Crunchbase, SerpAPI, NewsAPI, Twitter, Anthropic, Stripe, Resend, Slack
- Per service: connected, last successful call, error rate 24h, quota used, plan tier
- Rotate credentials button
- Disable in emergency button

---

## 16. System health & ops

### 16.1 System dashboard (`/admin/system`)
- DB connection pool usage
- Postgres replication lag (if HA)
- Redis hit rate + memory
- Meilisearch index lag (last reindex)
- Vercel function p95 latency
- Cloudflare error rate (4xx, 5xx) last 1h
- Background queue depths (BullMQ + n8n)
- Disk usage on self-hosted services

### 16.2 Backup status (`/admin/system/backups`)
- Last successful Postgres backup
- Retention status (last N backups)
- Backup restore test status (run monthly)
- Manual backup trigger button

### 16.3 Cost dashboard (`/admin/system/costs`)
- Cost per data source per day (Crunchbase, SerpAPI, etc.)
- Anthropic spend by workflow
- Infra spend (Vercel, Neon, Upstash, R2, Cloudflare)
- Total cost vs MRR (gross margin %)
- Budget alerts: configurable per source, breach → Slack

### 16.4 Incidents (`/admin/system/incidents`)
- Open incidents (manual create + auto from Sentry/Better Stack)
- Per incident: severity, status (investigating / mitigated / resolved), timeline, impacted services
- Post-mortem template
- Public status page sync (Better Stack)

---

## 17. Reports & analytics

### 17.1 Reports (`/admin/reports`)
- Pre-built monthly reports: revenue, churn cohort, top SEO pages, user activation funnel
- Per report: PDF + CSV export
- Schedule recurring delivery to email

### 17.2 Funnel analyzer (`/admin/analytics/funnels`)
- Build funnels in UI: landing → signup → activation → trial → paid → retained
- Step-by-step drop-off
- Filter by source, plan, geo, cohort

### 17.3 Cohort retention (`/admin/analytics/cohorts`)
- Retention matrix: signup month vs week-N retention
- Heatmap
- Filter by acquisition source, plan, ICP

### 17.4 Top content (`/admin/analytics/content`)
- Top articles by views, by signups attributed, by paid conversions attributed
- Top searches in search bar
- Top investor profiles viewed

---

## 18. VA mode (`/admin/curation/*`)

VAs see a stripped-down admin with only what they need. Logged-in VA lands directly on this dashboard.

### 18.1 VA dashboard
- Today's queue count (investors to curate)
- Your accuracy score (last 30 days)
- Daily target progress bar
- Recent rejections by editorial (with reasons — learning loop)

### 18.2 VA curation tasks
- Investor candidate cards: name, source URL, suggested type
- Click → quick-add form: name, firm_type, region, dedupe_key
- Submit → creates `pending` investor row → triggers Workflow A
- Mark candidate as duplicate / spam / wrong / not_in_scope (with reason)

### 18.3 VA review tasks
- Low-confidence enrichments to verify
- Side-by-side: AI output vs source links — verify each field
- One-click "verify" / "correct" per field
- Sources panel: AI's tool call history

### 18.4 VA performance leaderboard
- All VAs ranked by: investors added (week / month), accuracy %, average review time
- Personal view: yours vs team median
- Used for VA team meetings and contracting decisions

---

## 19. Settings (`/admin/settings`, superadmin only)

### 19.1 Organization settings
- Brand name, logo, favicon, primary color (these flow to email templates and frontend)
- Editorial team email, support email, legal email
- Office hours (used in support auto-replies)

### 19.2 Security settings
- 2FA enforcement (on by default, can't disable for admin role)
- IP allowlist per role
- Session timeout per role
- Password policy (length, complexity)
- Admin invite system: superadmin sends invite link, recipient sets password + 2FA

### 19.3 Notification routing
- Per event type, configure where alerts go (Slack channel, email, PagerDuty)
- Events: payment failed, system error, churn risk, takedown received, queue overflow, cost budget breach

### 19.4 Plan settings
- Define plans (name, price, limits per feature)
- Trial config (length, requires card)
- Free tier limits (profile views/day, watchlist size)

### 19.5 Branding for emails
- Header/footer template
- Color palette
- Sender name / address per category (transactional / marketing / digest)

### 19.6 Domain & DNS
- Custom domain status (DNS records, SSL)
- Email domain auth (SPF, DKIM, DMARC) verification status

---

## 20. Audit hooks — what every action writes

Every mutating action in the admin panel writes to `audit_log` with:

- `actor_id` (the admin user)
- `impersonator_id` (if action taken during impersonation)
- `action` (e.g., `user.suspend`, `investor.merge`, `article.approve`, `refund.issue`)
- `target_table` + `target_id`
- `before_state` JSONB + `after_state` JSONB
- `reason` (free text, required for sensitive actions)
- `ip`, `ua`
- `at` timestamp

Sensitive actions that REQUIRE a reason field:
- Refunds
- User deletes
- Investor deletes/merges
- Role changes
- Coupon creation (over 50% off)
- Plan pricing changes
- Feature flag flips that affect billing
- Impersonation

Audit data retained for 7 years (covers tax + most jurisdictions).

---

## 21. Build order

If you're shipping this admin panel in stages, this is the order that unblocks each phase of the business:

**Phase 1 (launch readiness, weeks 1–4)**
- Auth + 2FA
- Admin home dashboard (minimal)
- User list + User 360 + impersonation + refund
- Investor list + edit + queue
- Editorial review queue
- Audit log
- Settings → admin invites

**Phase 2 (post-launch, weeks 5–8)**
- Duplicate detection
- Curation queue + VA mode
- Source management
- Curated list builder
- Marketing → coupons
- Stripe sync status
- Jobs monitor

**Phase 3 (scale, weeks 9–16)**
- Sector/region page editors
- SEO admin
- Email campaigns
- Referral program
- Feature flags + experiments
- API key management
- Cost dashboard
- Compliance queue (legal/requests/takedowns)

**Phase 4 (mature ops, months 4–6)**
- Reports & analytics deep features
- Onboarding flow editor
- Pricing experiments
- VA performance leaderboard
- Incident management
- Backup restore tests

---

## 22. What I'd still recommend before building

Three product decisions before this admin gets coded:

1. **Pick the admin framework.** Building it in your Next.js app is ideal long-term but slower. Faster shortcut: use **Forest Admin** or **Retool** pointed at Postgres for the v1 admin so VAs and editors have tools on day 1, then migrate critical paths into the Next.js app as you go. Recommendation: **Retool for VA + editorial in week 1; native Next.js admin for support + billing in week 4.**
2. **Decide on Crisp vs Intercom vs Plain for support.** This locks in the ticket admin design. Plain.com is the modern choice if you're starting fresh.
3. **Decide who's on admin first.** If it's just you for 2 months, half this panel is overkill at launch. Build only Phase 1 and add as the team grows.

Tell me if you want me to scaffold the actual Retool app definition for the Phase 1 admin (Retool exports JSON you can import), or jump straight to writing the Next.js admin routes for one of the screens. I can do either next.
