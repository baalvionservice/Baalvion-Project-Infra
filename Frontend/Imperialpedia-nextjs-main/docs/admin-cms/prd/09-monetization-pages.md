# 09 — Monetization (Admin Pages PRD)

> **Section:** Monetization · **Audience:** Product, Engineering, Editorial, Finance, Legal/Compliance.
> **Status:** Page-level PRD, grounded in [`05-analytics-monetization-ai.md` §B](../05-analytics-monetization-ai.md) (schema + capability map), the proven Razorpay/Stripe server-side HMAC payment stack in `Backend/services/commerce/order-service/` (`service/paymentProvider.js`, `service/ledgerClient.js`), and `rbac-service` (:3005) for authorization.

This section specifies the Admin Panel surface that runs Imperialpedia's four revenue streams — **ads, affiliates, sponsored content, and memberships** — plus the **finance/payouts** settlement view. The `monetization` schema is the system of record for ad units, affiliate links/clicks, sponsored flags, plans, and subscriptions; **all money movement settles into the platform double-entry ledger** (`ledger-service`) exactly as the commerce stack already does, so the ledger remains the single source of truth for revenue and author payouts. Subscriptions reuse the **backend-authoritative** payment provider abstraction (Razorpay live, Stripe interface-ready) — a client can never self-mark a subscription paid; capture happens only on verified provider webhooks (HMAC). Disclosure (FTC sponsored, affiliate, "not financial advice") is **enforced at publish**, never optional. Monetization is `admin`-only: per [§7 permission matrix](../04-rbac-and-workflow.md#a2-permission-matrix), **Manage monetization** is allowed for **Super Admin** and **Admin** only — Managing Editors and below have no access. Cross-references: revenue dashboards live in [§9 Analytics](../05-analytics-monetization-ai.md#a-analytics-9); the in-editor affiliate/sponsored blocks live in [§3 Block Editor](../02-content-cms.md); the compliance gate lives in [§8 Workflow](../04-rbac-and-workflow.md#b-editorial-workflow-8).

**Canonical capabilities used in this section:** `monetization:ads`, `monetization:affiliates`, `monetization:sponsored`, `monetization:memberships`, `analytics:revenue`, `analytics:view`, `audit:view`. Each maps to roles via `rbac-service`; the UI hides/disables actions from `GET /v1/me/permissions` but the server (`/v1/authorize`, deny-overrides) remains the authority. Because the matrix grants **Manage monetization** only to Super Admin + Admin, every `monetization:*` capability below resolves to **Super Admin + Admin** unless a page explicitly widens read access (e.g. `analytics:revenue` for Managing Editor on a read-only revenue tile).

---

## Ads — Ad Units, Placements & Providers

**Purpose** — Manage display advertising: define **ad units** (name, size, targeting), bind them to **placements** (in-article, sidebar, header, sticky, footer), wire **providers** (Google Ad Manager, AdSense, direct-sold), and monitor **viewability + revenue**. Supports per-page/per-content suppression for premium and sponsored pages, lazy-loaded CLS-safe slots, and a kill-switch per unit. This is the canonical home for `/admin/ads` (the legacy `/admin/monetization` "Ads & Partnerships" tile links here).

**Route** — `/admin/ads` (list + drawer create/edit). Detail/analytics drawer is in-page (no separate route).

**Components**
- `AdsHeader` — title, provider-health pill (GAM/AdSense connected?), revenue-this-month KPI, `New Ad Unit` button (gated).
- `AdUnitsTable` — columns: Name · Placement · Provider · Size · Status · 7-day impressions · Viewability % · eCPM · Revenue. Row actions: Edit, Pause/Activate, Preview slot, Delete (step-up).
- `AdUnitDrawer` — form: name, placement (select), provider (select gam/adsense/direct), size, `targeting` JSON editor (key/value chips), active toggle.
- `PlacementMap` — visual diagram of article/sidebar/header/sticky/footer slots showing which units occupy each (overlap warnings).
- `ProviderConnectCard` — per provider: connection status, network/publisher id, last-sync time, `Reconnect` (reads keys from CMS vault, never the form).
- `ViewabilityChart` — viewability % and CLS impact over time (from analytics rollups).
- `SuppressionRules` — list of content/page patterns where ads are suppressed (premium, sponsored, paywalled).
- `EmptyState`, `TableSkeleton`, `ErrorBanner`, `ConfirmDeleteDialog` (step-up).

**Permissions required**
- Capability: `monetization:ads` for all mutations (create/edit/pause/delete ad units, edit placements, connect providers); `analytics:view` to read impression/viewability/revenue tiles.
- Roles: **Super Admin** (✓, audited) and **Admin** (✓) per the Manage-monetization matrix row. **Managing Editor, Editor, SEO Manager, Legal Reviewer, Author, Contributor** → ✗ (no access to `/admin/ads`; route-group floor is `admin` for this page). Provider key reads are never exposed in the UI — only connection status.
- Scope: site-level (no category scope). Deleting a unit is a step-up (re-auth) action.

**API endpoints used**
- `GET /v1/ads` — list ad units (filters: placement, provider, status; `meta:{total,page,limit}`).
- `POST /v1/ads` — create ad unit (`monetization:ads`).
- `GET /v1/ads/:id` — single unit + recent stats.
- `PATCH /v1/ads/:id` — update (name/placement/provider/size/targeting/is_active).
- `DELETE /v1/ads/:id` — delete (step-up).
- `POST /v1/ads/:id/toggle` — pause/activate (audited).
- `GET /v1/ads/providers` — provider connection status (GAM/AdSense/direct); keys resolved from CMS vault server-side.
- `GET /v1/ads/stats?from&to&unitId` — impressions, viewability, eCPM, revenue (read projection from analytics rollups).
- `GET /v1/me/permissions` — capability list to gate the UI.

**Database tables affected**
- `monetization.ad_units` (read/write) — `id, name, placement, provider, size, targeting jsonb, is_active, created_at`.
- `analytics.content_daily` (read) — `revenue_cents` and ad metrics by content.
- `audit.audit_log` (write, via audit-service) — every create/toggle/delete recorded (WORM hash-chain).
- Provider credentials live in the **CMS vault** (`cms` schema integration store), **not** in `monetization` — only a reference/connection-status is read here.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  Ads & Placements              Provider: GAM ●  AdSense ●  Direct ○   [+ Ad Unit]│
│  Revenue (30d) $61,420   Viewability 71%   Avg eCPM $4.18   Fill 92%             │
├──────────────┬───────────────┬──────────┬────────┬─────────┬──────────┬─────────┤
│ NAME         │ PLACEMENT     │ PROVIDER │ SIZE   │ VIEWAB. │ eCPM     │ STATUS  │
├──────────────┼───────────────┼──────────┼────────┼─────────┼──────────┼─────────┤
│ Lead Banner  │ header        │ gam      │ 728x90 │  64%    │ $3.10    │ ● Active│
│ In-Article 1 │ in-article    │ adsense  │ fluid  │  78% ▲  │ $5.40    │ ● Active│
│ Sidebar Tools│ sidebar       │ direct   │ 300x250│  59% ▼  │ $7.90    │ ‖ Paused│
│ Sticky Foot  │ sticky        │ gam      │ 320x50 │  81%    │ $2.20    │ ● Active│
├──────────────┴───────────────┴──────────┴────────┴─────────┴──────────┴─────────┤
│  Placement map  [ header ▣ ][ in-article ▣▣ ][ sidebar ▣ ][ sticky ▣ ]          │
│  Suppression: premium pages, sponsored pages, /paywall/* — ads OFF              │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Empty/Loading/Error states & edge cases**
- **Empty:** "No ad units yet — create your first slot" with a CTA; placement map shows greyed slots.
- **Loading:** table + KPI skeletons; provider pills show a spinner until `/v1/ads/providers` resolves.
- **Error:** provider unreachable → amber `ProviderConnectCard` ("GAM not reachable; slots fall back to AdSense"); stats fetch failure shows last-cached value with a stale badge (never blank revenue).
- **Edge cases:** an active unit on a **sponsored/premium** page must be auto-suppressed (compliance) — surface a warning if a rule conflicts; deleting a unit referenced by live placements requires confirm + step-up; targeting JSON is schema-validated (reject malformed before save); CLS budget guard warns if a unit size is not reserved.

---

## Affiliates — Links, Tracking, Commission & Disclosure

**Purpose** — Manage affiliate monetization: create **cloaked tracking links** (per-merchant), track **clicks → conversions → commission**, run a **broken-affiliate-link monitor**, and enforce **auto-disclosure** so every page surfacing an affiliate link carries the required disclosure. Provides the data behind the in-editor affiliate block and the affiliate-CTR tile in [§9 Analytics](../05-analytics-monetization-ai.md#a-analytics-9).

**Route** — `/admin/monetization/affiliates`.

**Components**
- `AffiliatesHeader` — KPIs: total links, active, 30-day clicks, conversions, conversion rate, est. revenue; `New Link` button (gated).
- `AffiliateLinksTable` — columns: Merchant · Label · Target (truncated) · Tracking URL (cloaked, copy) · Commission % · Clicks · Conversions · CR% · Revenue · Status · Health. Row actions: Edit, Disable, Open analytics, Delete.
- `AffiliateLinkDrawer` — form: merchant, label, target URL (validated), commission %, optional `content_id` binding; tracking URL is **generated server-side** (cloaked `/go/:slug` with affiliate params), not hand-entered.
- `LinkHealthMonitor` — last-checked status per link (200/redirect/404/expired-program); bulk "Re-check now"; auto-disable on persistent 404.
- `ConversionFunnel` — clicks → conversions → revenue, with attribution to driving content.
- `DisclosureBadge` — shows that disclosure is auto-injected; links to the disclosure policy text.
- `EmptyState`, `TableSkeleton`, `ErrorBanner`, `ConfirmDeleteDialog`.

**Permissions required**
- Capability: `monetization:affiliates` for create/edit/disable/delete links and triggering health re-checks; `analytics:view` for click/conversion tiles; `analytics:revenue` to see commission revenue figures.
- Roles: **Super Admin** + **Admin** (✓). All editorial roles → ✗. (Authors may *insert* an affiliate block in their draft via the editor, but the **link registry and commission data** are admin-only; the editor block references an existing registered link by id.)
- Scope: site-level. Click/visitor data is pseudonymous (`visitor_id` hash) — no PII; GDPR-safe.

**API endpoints used**
- `GET /v1/affiliate-links` — list (filters: merchant, status, health, content_id).
- `POST /v1/affiliate-links` — create; server generates `tracking_url` (cloaked).
- `GET /v1/affiliate-links/:id` — detail + funnel.
- `PATCH /v1/affiliate-links/:id` — update (label, commission_pct, content_id, is_active).
- `DELETE /v1/affiliate-links/:id` — delete (cascades clicks).
- `POST /v1/affiliate-links/:id/recheck` — health probe (queued).
- `GET /v1/affiliate-links/:id/clicks?from&to` — click/conversion rows (paginated).
- `GET /v1/affiliate-links/stats` — aggregate clicks/conversions/revenue.
- *(public, not admin)* `GET /go/:slug` — the cloaked redirect endpoint records a click row then 302s to `tracking_url`; conversions posted back via merchant postback/webhook.

**Database tables affected**
- `monetization.affiliate_links` (read/write) — `id, merchant, label, target_url, tracking_url, commission_pct, content_id, clicks, conversions, revenue_cents, is_active, created_at`.
- `monetization.affiliate_clicks` (read/write) — `id, link_id, content_id, visitor_id, ts, converted, commission_cents`.
- `cms.cms_contents` (read) — to resolve `content_id` titles and enforce the disclosure block at publish.
- `analytics.content_daily` (read) — affiliate revenue attribution.
- `audit.audit_log` (write) — link create/edit/disable.

**Empty/Loading/Error states & edge cases**
- **Empty:** "No affiliate links yet" CTA; funnel shows zeros.
- **Loading:** table skeleton; health column shows "checking…".
- **Error:** stats backend down → tiles show stale-cached with badge; health monitor failure shows "last check unavailable" rather than implying links are healthy.
- **Edge cases:** **disclosure enforcement** — publishing content that contains an affiliate block without the disclosure block is blocked at the compliance gate (link back to [§8](../04-rbac-and-workflow.md#b-editorial-workflow-8)); a link returning persistent 404 auto-disables and notifies admin (notification-service); commission % change does **not** retroactively rewrite settled conversion rows (audit integrity); cloaked slug collisions are prevented server-side; merchant program termination flags all its links as expired in one action.

---

## Sponsored Content — FTC Disclosure, Campaign Window & Fee

**Purpose** — Flag a published content item as **sponsored**: attach sponsor + campaign, enforce a **mandatory FTC "Sponsored" disclosure** block, set a **campaign window** (`starts_at`/`ends_at`), record the **fee**, and exclude the item from "objective"/editorial rankings while it runs. Sponsored items are `noindex`-safe handled and visibly labeled.

**Route** — `/admin/monetization/sponsored`.

**Components**
- `SponsoredHeader` — KPIs: active campaigns, scheduled, total committed fee (period), `Flag Content` button (gated).
- `SponsoredTable` — columns: Content (title + link) · Sponsor · Campaign · Window (start→end) · Fee · Disclosure label · Status (active/scheduled/ended). Row actions: Edit, End early, View content.
- `FlagContentDrawer` — content picker (search published cms_contents), sponsor, campaign, disclosure label (default "Sponsored", editable to FTC-compliant variants), `starts_at`/`ends_at`, `fee_cents`.
- `DisclosurePreview` — renders exactly how the disclosure block appears on the live page (cannot be removed by author).
- `CampaignTimeline` — Gantt-style view of campaign windows.
- `RankingExclusionNote` — confirms the item is excluded from trending/objective lists while active.
- `EmptyState`, `TableSkeleton`, `ErrorBanner`, `ConfirmEndDialog`.

**Permissions required**
- Capability: `monetization:sponsored` to flag/unflag, set fee, set window; `content:read` to pick content.
- Roles: **Super Admin** + **Admin** (✓). Editorial roles → ✗ for the monetization action. *However*, the **disclosure block itself is enforced for everyone**: once flagged, neither the author nor an editor can publish the item without the disclosure (enforced at the publish gate). Legal Reviewer may *see* sponsored items in the Legal Review queue but cannot set fees.
- Scope: site-level; targets a specific `content_id`.

**API endpoints used**
- `GET /v1/sponsored` — list sponsored flags (filters: status, sponsor, date window).
- `POST /v1/sponsored` — flag a content item sponsored (body: content_id, sponsor, campaign, disclosure_label, starts_at, ends_at, fee_cents).
- `GET /v1/sponsored/:contentId` — detail.
- `PATCH /v1/sponsored/:contentId` — edit window/fee/label/status.
- `DELETE /v1/sponsored/:contentId` — remove sponsored flag (re-enables objective ranking; audited).
- `POST /v1/sponsored/:contentId/end` — end campaign early.
- `GET /v1/contents?status=published&q=` — content picker source (cms-service).

**Database tables affected**
- `monetization.sponsored_content` (read/write) — PK `content_id` → `cms.cms_contents(id)`; `sponsor, campaign, disclosure_label, starts_at, ends_at, fee_cents, status`.
- `cms.cms_contents` (read; flag side-effects) — sets/derives sponsored rendering + `noindex`-safe handling; disclosure block enforced at publish.
- `analytics.content_daily` (read) — sponsored revenue attribution (fee).
- `audit.audit_log` (write) — flag/unflag and fee changes (financial + compliance trail).

**Empty/Loading/Error states & edge cases**
- **Empty:** "No sponsored campaigns" CTA.
- **Loading:** skeleton table + timeline.
- **Error:** content-service unreachable → content picker disabled with message; existing flags still listed from `monetization`.
- **Edge cases:** **disclosure is non-removable** — the disclosure block is injected and locked; attempting to publish a flagged item without it is blocked; a campaign whose `ends_at` passes auto-transitions to `ended` (scheduled job) and ranking exclusion lifts; ending early prorates nothing automatically (fee is recorded as committed — finance reconciles); flagging unpublished content is allowed but disclosure enforcement triggers at publish; sponsored items are excluded from trending/objective lists for the active window (verified by ranking service).

---

## Memberships — Plans & Feature Gates

**Purpose** — Define **membership plans** (free / plus / pro) with **price + interval + feature gates** (ad-free, premium articles, advanced calculators, downloads, paywall-bypass). Plans drive entitlement checks resolved **server-side at render** — the client is never trusted. This page is the source of truth for plan codes consumed by the subscription lifecycle and the content `visibility` gating.

**Route** — `/admin/monetization/plans`.

**Components**
- `PlansHeader` — active plan count, subscribers per plan (rollup), `New Plan` button (gated).
- `PlanCards` — one card per plan: code, name, price/interval, feature list, active toggle, subscriber count, MRR contribution.
- `PlanDrawer` — form: code (unique, e.g. `plus`), name, price_cents, interval (month/year), `features` JSON/checklist (ad_free, premium_articles, advanced_calculators, downloads, paywall_bypass), active toggle.
- `FeatureGateMatrix` — grid of features × plans showing which gate each plan unlocks (drives the public pricing table + entitlement resolver).
- `PaywallMeterConfig` — N free premium articles/month per registered user before prompt (configurable; tie to §B.3 governance).
- `EmptyState`, `CardSkeleton`, `ErrorBanner`, `ConfirmArchiveDialog`.

**Permissions required**
- Capability: `monetization:memberships` to create/edit/archive plans and edit feature gates + paywall meter.
- Roles: **Super Admin** + **Admin** (✓). All others → ✗.
- Scope: site-level. Changing a plan's **price** does not silently re-bill existing subscribers — it applies to new subscriptions and surfaces a migration prompt for existing ones (handled in Subscriptions).

**API endpoints used**
- `GET /v1/plans` — list plans (+ subscriber counts via meta or join).
- `POST /v1/plans` — create plan (`monetization:memberships`).
- `GET /v1/plans/:id` — detail.
- `PATCH /v1/plans/:id` — update (name, price_cents, interval, features, is_active).
- `POST /v1/plans/:id/archive` — soft-disable (cannot hard-delete a plan with active subscriptions).
- `GET /v1/plans/:code/entitlements` — resolved feature set (used by the server-side entitlement resolver; cached).
- `GET /v1/me/entitlements` — current viewer's entitlements (render-time gate; never trust client copy).

**Database tables affected**
- `monetization.plans` (read/write) — `id, code (unique), name, price_cents, interval, features jsonb, is_active`.
- `monetization.subscriptions` (read) — subscriber counts + guard against deleting a plan in use.
- `cms.cms_contents` (read) — `visibility=private/password` content resolves entitlement against plan features at render.
- `audit.audit_log` (write) — plan create/price-change/archive (financial trail).

**Empty/Loading/Error states & edge cases**
- **Empty:** seed shows the `free` plan only; "Add a paid tier" CTA.
- **Loading:** plan-card skeletons.
- **Error:** subscriber-count rollup unavailable → cards render plan data with "counts unavailable" rather than failing the whole page.
- **Edge cases:** `code` must be unique (reject duplicate); a plan with active subscriptions cannot be hard-deleted (archive only); **price change** prompts whether to grandfather existing subscribers; feature-gate edits invalidate the entitlement cache (cache-bust); a `free` plan with `price_cents=0` is valid and required; downgrading a feature gate must not retroactively strip access mid-period (entitlement honored to `current_period_end`).

---

## Subscriptions — Lifecycle, Dunning & MRR/Churn

**Purpose** — Manage the **subscription lifecycle** (`trialing → active → past_due → canceled`) driven by **backend-authoritative provider webhooks** (Razorpay live, Stripe interface-ready — the exact server-side HMAC stack proven in `order-service`), run **dunning** for failed payments, and surface **MRR / churn / ARPU**. A subscription is `active`/`paid` **only** when the provider confirms it server-side; the admin UI never flips status manually except for explicit, audited overrides (comp, refund-cancel).

**Route** — `/admin/monetization/subscriptions`.

**Components**
- `SubsHeader` — KPIs: MRR, active subs, trial subs, churn (30d), past_due count, ARPU; period selector.
- `SubscriptionsTable` — columns: User · Plan · Status (badge) · Provider · Provider Sub ID · Period end · Cancel-at-period-end · MRR. Row actions: View, Cancel (at period end), Refund-cancel (step-up), Retry payment, Comp/extend (step-up).
- `SubscriptionDrawer` — timeline of provider events (created, paid, payment_failed, canceled) sourced from webhook log; current entitlement snapshot.
- `DunningPanel` — past_due cohort, retry schedule, last attempt result; `Retry now`; auto-email via notification-service.
- `MrrChurnChart` — MRR waterfall (new/expansion/contraction/churn) + churn %.
- `WebhookHealth` — provider webhook signature-verification status + last received event time (alerts if silent).
- `EmptyState`, `TableSkeleton`, `ErrorBanner`, `ConfirmCancelDialog`, `StepUpDialog`.

**Permissions required**
- Capability: `monetization:memberships` for lifecycle actions (cancel, retry, comp, refund-cancel); `analytics:revenue` to view MRR/churn/ARPU.
- Roles: **Super Admin** (✓, audited) + **Admin** (✓). Editorial roles → ✗. **Refund-cancel** and **comp/extend** are **step-up** (re-auth) actions and always audited.
- Scope: site-level; per-subscriber rows. Provider keys are read only server-side (CMS vault), never shown.

**API endpoints used**
- `GET /v1/subscriptions` — list (filters: status, plan, provider; `meta` pagination).
- `GET /v1/subscriptions/:id` — detail + event timeline.
- `POST /v1/subscriptions/:id/cancel` — cancel at period end (sets `cancel_at_period_end=true`).
- `POST /v1/subscriptions/:id/refund-cancel` — immediate cancel + refund via provider (step-up; mirrors to ledger as REFUND).
- `POST /v1/subscriptions/:id/retry` — retry dunning charge (queued).
- `POST /v1/subscriptions/:id/comp` — grant/extend free access (step-up; audited).
- `GET /v1/subscriptions/metrics?from&to` — MRR, churn, ARPU, cohorts.
- `POST /v1/subscriptions/webhook/:provider` — **provider webhook ingress** (NOT admin UI): HMAC-verified server-side; the only path that flips `active`/`past_due`/`canceled`. Mirrors capture to ledger (`recordPaymentCapture`).
- `GET /v1/subscriptions/webhook-health` — last verified event + signature status.

**Database tables affected**
- `monetization.subscriptions` (read/write via webhook/actions) — `id, user_id, plan_id, status, provider, provider_sub_id, current_period_end, cancel_at_period_end, created_at`.
- `monetization.plans` (read) — plan name/price for MRR math.
- **Platform ledger** (`ledger.*` via `ledger-service`, X-Internal-Key) — every captured subscription charge and refund posts a journal entry (`recordPaymentCapture`/`recordRefund` pattern); **single source of truth for revenue**.
- `audit.audit_log` (write) — cancel/refund/comp/retry + each webhook-driven status transition (non-repudiable).
- Identity (`identity.users` read, cross-service) — resolve `user_id` → email/name for display only.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  Subscriptions      MRR $24,180 ▲  Active 7,102  Trial 318  Churn 2.1%  ARPU $3 │
│  Webhook: Razorpay ● verified (12s ago)        Period: [ This month ▾ ]         │
├───────────────┬────────┬───────────┬──────────┬──────────────┬────────┬────────┤
│ USER          │ PLAN   │ STATUS    │ PROVIDER │ PERIOD END   │ CANCEL?│ MRR    │
├───────────────┼────────┼───────────┼──────────┼──────────────┼────────┼────────┤
│ a.rao@…       │ pro    │ ● active  │ razorpay │ Jul 03       │  —     │ $9.00  │
│ m.khan@…      │ plus   │ ⏳ trialing│ razorpay │ Jun 11       │  —     │ $0.00  │
│ j.li@…        │ pro    │ ⚠ past_due│ razorpay │ Jun 02 (ret3)│  —     │ $9.00  │
│ s.okoro@…     │ plus   │ ● active  │ razorpay │ Jun 28       │ ✓ EOP  │ $4.00  │
├───────────────┴────────┴───────────┴──────────┴──────────────┴────────┴────────┤
│  Dunning: 1 past_due · next retry Jun 05 09:00 · [Retry now]  [Email customer]  │
│  Actions on row: View · Cancel(EOP) · Refund-cancel🔒 · Retry · Comp🔒          │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Empty/Loading/Error states & edge cases**
- **Empty:** "No subscriptions yet" — show plans CTA.
- **Loading:** table + metric skeletons; webhook-health pill spins until resolved.
- **Error:** metrics endpoint down → KPI tiles show stale-cached + badge; **never** fabricate MRR. Provider unreachable → action buttons disabled with reason.
- **Edge cases:** status is **never** flipped from the UI except audited overrides — all organic transitions come from verified webhooks; a **webhook signature mismatch** is rejected and alerted (possible spoof); idempotent webhook handling (duplicate provider event = no double-charge, matches ledger `409 DUPLICATE_TRANSACTION` idempotency); `past_due` enters dunning with capped retries then auto-cancels; refund-cancel posts a REFUND to the ledger and revokes entitlement at period boundary or immediately per policy; comp/extend bypasses billing but is fully audited; plan price change offers grandfathering (see Plans).

---

## Finance / Payouts — Settlement & Author Revenue-Share

**Purpose** — The **finance settlement** view: reconcile all monetization revenue (ads, affiliates, sponsored, subscriptions) through the **platform double-entry ledger**, compute and disburse **author revenue-share** payouts, and provide the reconciliation report that proves admin figures match the ledger. This page reuses the proven `ledgerClient` pattern (`recordPaymentCapture`/`recordRefund`, deterministic per-tenant accounts, idempotent `transactionRef`) — the ledger is the **single source of truth**; this UI reads from it and triggers payout runs.

**Route** — `/admin/finance`.

**Components**
- `FinanceHeader` — KPIs: gross revenue (period), net after fees/refunds, pending payouts, settled this period; period selector + export.
- `RevenueByStream` — stacked breakdown ads / affiliates / sponsored / subscriptions (ties to [§9 Revenue dashboard](../05-analytics-monetization-ai.md#a-analytics-9)).
- `LedgerReconciliation` — admin-computed totals vs ledger journal totals with a diff indicator; lists any gaps (failed ledger posts) for replay.
- `AuthorPayoutsTable` — per-author: attributed revenue (`content_daily.revenue_cents`), revenue-share %, owed, status (pending/approved/paid). Actions: Approve, Pay (step-up), Hold.
- `PayoutRunDrawer` — create a payout run for a period: preview amounts, payment method, approve → disburse (step-up + audited).
- `SettlementTimeline` — journal entries (PAYMENT/REFUND/PAYOUT) with `transactionRef`, amount, account, time.
- `ExportButton` — CSV/PDF statement (finance + tax).
- `EmptyState`, `TableSkeleton`, `ErrorBanner`, `StepUpDialog`.

**Permissions required**
- Capability: `analytics:revenue` to view all revenue/ledger figures; `monetization:memberships` + `monetization:affiliates` context for stream detail; payout **disbursement** is gated behind `monetization:memberships` **and** step-up re-auth (financial action).
- Roles: **Super Admin** (✓, audited) + **Admin** (✓) for full access and payouts. **Managing Editor** may be granted **read-only** `analytics:revenue` to see the revenue-by-stream tile (matrix: View analytics ✓ for manager) but **cannot** run payouts or see per-subscriber PII. All other editorial roles → ✗. **Authors** see *their own* payout status via the author dashboard (`O` scope), not this admin page.
- Scope: site-level; payout runs are tenant-scoped to the Imperialpedia ledger tenant.

**API endpoints used**
- `GET /v1/finance/summary?from&to` — gross/net/pending/settled + revenue-by-stream.
- `GET /v1/finance/ledger/reconciliation?from&to` — admin vs ledger diff (reads `ledger-service` via internal key server-side).
- `GET /v1/finance/payouts?status&period` — author payout rows.
- `POST /v1/finance/payouts/runs` — create a payout run (preview).
- `POST /v1/finance/payouts/runs/:id/approve` — approve (step-up).
- `POST /v1/finance/payouts/runs/:id/disburse` — disburse via provider; posts PAYOUT journal entries (step-up, audited).
- `GET /v1/finance/statements/export?from&to&format=csv|pdf` — statement export.
- `GET /v1/ledger/entries` *(server-to-server, ledger-service)* — journal source for reconciliation (X-Internal-Key, never browser-direct).

**Database tables affected**
- **Platform ledger** (`ledger.*` via `ledger-service`) — authoritative journal: PAYMENT, REFUND, PAYOUT entries; idempotent `transactionRef`; deterministic per-tenant cash/revenue/payable accounts.
- `analytics.content_daily` (read) — `revenue_cents` per content → author attribution for revenue-share.
- `monetization.subscriptions` + `monetization.affiliate_links` + `monetization.sponsored_content` + `monetization.ad_units` (read) — per-stream gross inputs reconciled against the ledger.
- `imperialpedia.creator_profiles` (read) — author/creator → revenue-share % and payout identity.
- `audit.audit_log` (write) — payout run create/approve/disburse + reconciliation acknowledgements (financial WORM trail).

**Empty/Loading/Error states & edge cases**
- **Empty:** no revenue yet → zeros + "Revenue appears once monetization is live."
- **Loading:** KPI + table skeletons; reconciliation shows "computing diff…".
- **Error:** ledger-service unreachable → reconciliation panel shows **"ledger unavailable — figures unverified"** banner and **disables payout disbursement** (never pay out against unverified totals); summary may still render cached stream data with a stale badge.
- **Edge cases:** **fail-open does not apply to payouts** — disbursement is blocked unless the ledger is reachable and reconciliation diff is zero (or explicitly acknowledged by an admin with a reason, audited); payout runs are **idempotent** (a re-run for the same period does not double-pay — guarded by `transactionRef`); a non-zero reconciliation diff lists the gap entries for replay (matches `ledger.post_failed` log pattern); refunds reduce net revenue *and* claw back the affected author's attributed share for the period; currency is handled in minor units end-to-end (no float drift); tax/withholding fields surface on the statement export where configured.

---

## Cross-cutting notes

- **Authorization:** every mutating endpoint above calls `rbac-service /v1/authorize` (deny-overrides) with `{subject, action, resource{type:'monetization', id, scope:'site'}}`; the UI gates on `GET /v1/me/permissions`. The matrix grants **Manage monetization** to Super Admin + Admin only — do not widen without a matrix change in [§7](../04-rbac-and-workflow.md#a2-permission-matrix).
- **Disclosure & compliance:** sponsored + affiliate disclosures and the financial "not advice" disclosure are **enforced at the publish gate** ([§8](../04-rbac-and-workflow.md#b3-legal-review-routing-financial-compliance-aware)), not in these admin pages alone.
- **Money handling:** all amounts are integer **minor units** (cents/paise); subscriptions and payouts settle into the **platform ledger** via the proven `order-service` client pattern; payment capture is **backend-authoritative** (HMAC-verified provider webhooks), never client-asserted.
- **Audit:** every monetization mutation and every webhook-driven status transition writes to `audit-service` (WORM, SHA-256 hash-chain).
- **Revenue dashboards** (ARPU/MRR/churn/CTR time series) live in [§9 Analytics](../05-analytics-monetization-ai.md#a-analytics-9); this section owns the **operational management** surfaces, not the analytics charts.
