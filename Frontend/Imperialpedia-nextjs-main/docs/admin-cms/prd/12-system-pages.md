# 12 — System Administration

> **Section:** System administration — the operator-and-integrator surface that sits *underneath* the
> editorial product. These pages are how Admins and Super Admins prove the platform is **trustworthy**
> (tamper-evident audit), **observable** (event stream + health), **integrable** (API keys + webhooks),
> **configurable** (settings + feature flags), and **recoverable** (backups + DR). They are the lowest-traffic
> but highest-blast-radius screens in the admin panel, so every page here is rank-gated to `admin`+, every
> mutation is step-up-authed and audited, and destructive actions are break-glass. This document grounds on
> the real platform services: `audit-service` (`audit.events`, WORM + SHA-256 hash-chain), `@baalvion/events`
> over Redis Streams (`baalvion:events`, XREADGROUP consumer groups), `cms-service` integrations
> (`cms.cms_website_integrations`), `realtime-service` (Socket.IO health/metrics), and `rbac-service` as the
> single authorization PDP. See [06-security-database-api.md](../06-security-database-api.md) (sections A + C)
> for the security model, ER, and API conventions that the whole section inherits; see
> [04-rbac-and-workflow.md](../04-rbac-and-workflow.md) for the role ladder and the audit/feature-flag
> capability rules referenced throughout.

**Section-wide conventions (do not repeat per page):**

- All routes live under the `/admin/*` route group → edge gate requires an authenticated RS256 session.
  System pages additionally require **rank ≥ `admin`** (Managing Editor and below are denied at the edge,
  except the *scoped* Audit Logs read noted on that page).
- Every mutation calls `rbac-service` `POST /v1/authorize` `{subject, action, resource{type,id,scope}}` with
  deny-overrides; the UI hides/disables actions from `GET /me/permissions` but the server is the authority.
- Every mutation emits a `baalvion:events` event → `audit-service` captures it (actor/jti/ip/before-after).
- **Step-up auth** (re-enter 2FA) is required for: revealing/rotating secrets, deleting an API key, deleting a
  webhook, editing security settings, toggling a `security`-class feature flag, and triggering a restore.
- Envelope is always `{ success, data, error, meta:{total,page,limit} }`; cursor pagination on append-only lists.

---

## Audit Logs

**Route:** `/admin/audit-logs`
(The legacy `/admin/audit` page is a thin redirect to this canonical viewer; `/admin/access-logs` is a
pre-filtered view of the same store scoped to `action LIKE 'auth.%'` / `resource_type='session'`.)

**Purpose.** A read-only, tamper-evident window onto `audit.events` — the WORM, SHA-256 hash-chained record of
every privileged action on the platform. Operators answer *"who did what, to what, when, from where, and did it
succeed"*, filter by actor/action/target/time, drill into a single event's before/after diff, and — critically —
press **Verify chain** to cryptographically prove the segment has not been tampered with (no edited, inserted,
or removed rows). This is the compliance and incident-response surface.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Audit Logs              chain status: ✓ verified (seq 1–842,901)   [ Verify chain ]  ⟳  │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  Actor [▾ any]  Action [content.published ▾]  Target [content:* ]  Outcome [any ▾]        │
│  Severity [≥ info ▾]   Range [ Last 7 days ▾ ]   Source [cms-service ▾]      [ Export CSV ]│
├─────────┬─────────────────────┬──────────────────┬───────────────┬─────────┬──────────────┤
│  seq    │ occurred_at (UTC)   │ actor            │ action        │ outcome │ resource     │
├─────────┼─────────────────────┼──────────────────┼───────────────┼─────────┼──────────────┤
│ 842901  │ 2026-06-04 09:12:03 │ a.rao (mgr)      │content.publish│ success │ content:8f2… │
│ 842900  │ 2026-06-04 09:11:58 │ seo.bot (editor) │seo.recompute  │ success │ content:8f2… │
│ 842899  │ 2026-06-04 09:09:41 │ m.khan (admin)   │role.assign    │ success │ user:5521    │
│ 842898  │ 2026-06-04 09:08:12 │ — (system)       │content.schedule│ deny   │ content:11a… │  ← red
├─────────┴─────────────────────┴──────────────────┴───────────────┴─────────┴──────────────┤
│  ▸ row click → side panel: full metadata JSON, prev_hash → hash, before/after, jti, ip, UA │
│  [ ‹ newer ]                          seq cursor 842898…842849                [ older › ]   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Components.** `AuditFilterBar` (actor autocomplete, action picker bound to the canonical event-type list,
target-resource search, outcome `success|deny|failure`, severity `info..critical`, source-service select,
date-range), `AuditTable` (virtualized, cursor-paginated by `seq DESC`), `AuditDetailPanel` (slide-over with
`prev_hash → hash` chain link, `metadata` JSON tree, before/after diff when present, actor `jti`/ip/user-agent),
`VerifyChainButton` + `ChainStatusBadge` (calls `/v1/audit/verify`, shows `valid | broken at seq N`),
`ExportCsvButton`, `EmptyState`, `ErrorState`, `SkeletonRows`.

**Permissions required.** Capability `audit:view`. Roles: **Super Admin** ✓ (global), **Admin** ✓ (org/site
scope), **Managing Editor** — scoped read only (`audit:view` with `scope=site` → server filters to editorial
actions `content.*` / `media.*` for their site; cannot see `role.*`, `system.*`, `security.*`). Editor, SEO
Manager, Author, Contributor: ✗. Enforcement: `audit-service` `requireAuditReader` guard maps to `audit:read`;
the BFF passes the caller's scope so non-super-admins are tenant-filtered by `actor_org_id`/`tenant_id`. There
is **no write/delete** action on this page — the table is WORM by DB trigger.

**API endpoints used.**
- `GET /v1/audit?actor=&action=&resourceType=&resourceId=&outcome=&severity=&source=&from=&to=&cursor=&limit=`
  → list (audit-service).
- `GET /v1/audit/:seq` → single event detail.
- `GET /v1/audit/verify?fromSeq=&toSeq=` → recompute the hash-chain over the segment; returns
  `{ valid, checkedFrom, checkedTo, brokenAt? }`.
- `GET /v1/audit/export?…(same filters)` → streamed CSV (`text/csv`, `audit-export.csv`).

**Database tables affected.** Read-only: `audit.events` (seq, event_id, occurred_at, recorded_at, actor_id,
actor_org_id, ip_address, user_agent, action, resource_type, resource_id, tenant_id, scope_id, outcome,
severity, source_service, app_id, correlation_id, metadata JSONB, prev_hash, hash). No other tables written.

**Empty/Loading/Error states.** *Empty:* "No audit events match these filters" with a clear-filters affordance
(never implies the log is empty platform-wide). *Loading:* skeleton rows + disabled Verify button. *Error:* if
audit-service is unreachable, banner "Audit log unavailable — this does not mean no events occurred" (never
fail silent on a compliance surface). **Edge cases:** Verify returns `brokenAt: N` → the page locks into a red
**TAMPER DETECTED** state, surfaces seq N and its neighbors, and emits a `security.audit_chain_broken` event to
notification-service (pages on-call). Verifying very large ranges is chunked server-side; the button shows
progress and disables re-click. Export over a huge range is async (job → email link).

---

## Events

**Route:** `/admin/system/events`
(New route under the `system/` group; sits beside `/admin/system/webhooks` and `/admin/api-hub`.)

**Purpose.** A live inspector for the platform event backbone — the Redis Stream `baalvion:events` produced by
`@baalvion/events` (`sdk.events`) and consumed by `audit-service`, `notification-service`, and the
imperialpedia read-projection via XREADGROUP **consumer groups**. Operators watch events flow in real time,
inspect any event's full `PlatformEvent` payload, see **per-group consumer lag** (pending-entries-list depth /
last-delivered-id gap), spot a stuck or crashed consumer, and **replay** a recent window of events to a group
that fell behind. This is the "is the nervous system healthy and is anything stuck" page.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  Event Stream  ·  baalvion:events   transport: redis ●   stream len ~98,420   [ ⏸ Pause ]  │
├───────────────────────────────────────────┬──────────────────────────────────────────────┤
│  CONSUMER GROUPS                           │  LIVE TAIL   filter type [content.* ▾]  [⟳]   │
│  group              pending  lag    state  │  ───────────────────────────────────────────  │
│  audit-consumer        0      0     ✓ ok   │ 1717490… content.published  content:8f2  org:1│
│  notif-consumer        3      120   ⚠ lag  │ 1717490… term.published     term:421     org:1│
│  ip-read-projection    0      4     ✓ ok   │ 1717490… redirect.created   redirect:77  org:1│
│  [ group ▸ replay from… ]                  │ 1717490… content.updated    content:8f2  org:1│
├───────────────────────────────────────────┴──────────────────────────────────────────────┤
│  ▸ event click → payload drawer: _type, _eventId, _orgId, _userId, traceId, full _event JSON│
│  Replay: group [notif-consumer ▾]  from [last 15 min ▾]  match [content.* ]   [ Replay → ]  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Components.** `StreamHeader` (stream name, active transport `redis|nats|kafka|noop`, approx length, pause/
resume), `ConsumerGroupTable` (group name, pending PEL count, lag, consumer state `ok|lag|stalled|idle`, last
ack time), `LiveTail` (WS-driven append-only feed with type filter, auto-scroll, pause), `EventPayloadDrawer`
(decoded `PlatformEvent`: `_type`, `_eventId`, `_orgId`, `_userId`, `traceId`/`_correlationId`, `timestamp`,
pretty-printed `_event` JSON), `ReplayDialog` (group + time-window + type-match → confirm), `EmptyState`,
`ErrorState`.

**Permissions required.** Capability `system:events`. Roles: **Super Admin** ✓, **Admin** ✓. All other roles ✗
(the bus carries cross-tenant system internals — not exposed below admin). **Replay** is a privileged,
potentially side-effecting action (it re-delivers events that trigger consumers): requires `system:events` +
step-up auth, is rate-limited, and is itself audited as `system.events_replayed`. Replay is **never** a publish
of new events — it only re-delivers existing stream entries to a chosen consumer group, so it cannot fabricate
domain state.

**API endpoints used.**
- `GET /v1/events/stream?filter=&limit=` → recent entries (REST fallback) **or** the realtime WS feed
  (`realtime-service` `/admin` namespace, `service_health`/event broadcasts) for the live tail.
- `GET /v1/events/groups` → consumer-group health: `[{ group, pending, lag, lastDeliveredId, consumers[] }]`
  (derived from Redis `XINFO GROUPS` / `XPENDING`).
- `GET /v1/events/:id` → single decoded event.
- `POST /v1/events/replay` `{ group, fromTs, toTs, match }` → re-deliver matched entries to the group
  (idempotency-key required; returns `{ replayed, skipped }`).

**Database tables affected.** None in PostgreSQL — the stream lives in **Redis** (`baalvion:events`, consumer
groups created via `XGROUP`). The **replay action emits an audit event** → `audit.events` (write, via
audit-service consumer). No editorial tables touched.

**Empty/Loading/Error states.** *Empty tail:* "No events in the last window" (quiet ≠ broken — show stream
length so operators see the stream exists). *Loading:* group table skeleton + connecting indicator on the tail.
*Error:* if transport is `noop` or Redis is down, a prominent banner "Event bus unavailable — events are not
being delivered" (this is an incident, not a UI nicety). **Edge cases:** a group with growing `pending` + stale
`lastDeliveredId` renders as `stalled` (likely a crashed consumer / poison message) and links to runbook;
replay confirmation warns that re-delivery may re-fire idempotent-but-observable side effects (e.g. duplicate
notifications) and is bounded to a max window.

---

## APIs

**Route:** `/admin/api-hub`

**Purpose.** The integrator console: issue and govern **API keys** for external/partner programmatic access,
each scoped to a least-privilege set of capabilities and bound to a **rate-limit tier**; browse the live
**OpenAPI** surface per service in an embedded explorer; and see per-key usage/last-used so dead or noisy keys
can be revoked. Keys are RS256-service-issued, hashed at rest (only a `••••1234` hint is shown after creation),
and revocable instantly via the `jti`/key-id revocation list.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  API Hub                                                            [ + Create API key ]   │
├───────────────────────────────┬──────────────────────────────────────────────────────────┤
│  API KEYS                      │  OPENAPI EXPLORER     service [ cms-service ▾ ]           │
│  label        tier   scopes  ⋯ │  ──────────────────────────────────────────────────────  │
│  Partner BI   pro    read:*  ⋯ │  GET  /v1/content            list/filter        [ Try ]   │
│  Sitemap bot  free   seo:*   ⋯ │  POST /v1/content            create draft       [ Try ]   │
│  Ingest svc   ent    content ⋯ │  GET  /v1/glossary/:slug     term detail        [ Try ]   │
│  ──────────────────────────────│  GET  /v1/audit/verify       chain verify       [ Try ]   │
│  last used 2h ago · 41 req/min │                                                          │
│  [ rotate ]  [ revoke 🔒 ]     │  rate tier: free 60/min · pro 600/min · ent 6k/min        │
└───────────────────────────────┴──────────────────────────────────────────────────────────┘
```

**Components.** `ApiKeyTable` (label, masked key hint, tier badge, scopes, created/last-used, status),
`CreateKeyDialog` (label, scope multi-select from the canonical capability vocabulary, rate-tier select →
**one-time** full-key reveal with copy + "store it now, it won't be shown again"), `RotateKeyButton`,
`RevokeKeyButton` (step-up + confirm), `RateTierLegend`, `OpenApiExplorer` (Swagger/Redoc-style, per-service
`openapi.yaml`, "Try it" uses the operator's own session — never a partner key), `EmptyState`, `ErrorState`.

**Permissions required.** Capability `system:api`. Roles: **Super Admin** ✓, **Admin** ✓ (may only grant a key
scopes that are a subset of the admin's own capabilities — no privilege escalation via key minting). All other
roles ✗. Create/rotate/revoke require step-up auth and are audited (`apikey.created|rotated|revoked`). A key's
**effective authorization is still evaluated by `rbac-service`** at call time — the key's scope set is an upper
bound, not a bypass.

**API endpoints used.**
- `GET /v1/api-keys?status=&tier=` → list (hints only, never the secret).
- `POST /v1/api-keys` `{ label, scopes[], tier }` → create; returns the full key **once**.
- `POST /v1/api-keys/:id/rotate` → new secret, old grace-expires.
- `DELETE /v1/api-keys/:id` → revoke (adds key-id/`jti` to the Redis revocation list).
- `GET /v1/api-keys/:id/usage?range=` → request counts / last-used (from rate-limiter + analytics rollup).
- `GET /v1/openapi/:service` → the served `openapi.yaml` per service (e.g. realtime-service, imperialpedia-service).

**Database tables affected.** `identity`/platform `api_keys` (or `rbac` key registry) — key-id, label,
hashed secret, scopes, tier, owner, created/last-used, revoked_at (schema-qualified `identity.api_keys`;
this section introduces the table if not present). Revocation list is in **Redis** (`jti`/key-id set). Usage
counters read from Redis token-bucket + `analytics` rollups. No editorial tables written.

**Empty/Loading/Error states.** *Empty:* "No API keys yet — create one to enable programmatic access" with
inline scope guidance. *Loading:* table skeleton + explorer placeholder. *Error:* explorer falls back to a raw
`openapi.yaml` link if the interactive renderer fails. **Edge cases:** the full key is shown exactly once at
creation — if the operator navigates away, they must rotate; "Try it" calls are clearly labeled as running with
the operator's session (so a 403 reflects *their* permissions, not the key's); revoking a key that is mid-flight
returns `401` to in-progress callers immediately (revocation list checked per request).

---

## Webhooks

**Route:** `/admin/system/webhooks`

**Purpose.** Manage **outbound** webhook subscriptions so external systems react to platform events
(`content.published`, `content.updated`, `term.published`, `redirect.created`, …). Each subscription is a
target URL + selected event types + an HMAC signing secret (byte-stable signer, same pattern as the existing
finance-events bridge) + retry policy. Operators see a **delivery log** with per-attempt status, response code,
and latency, and can **re-deliver** a failed event. This is the integration-reliability surface; it is backed by
the `cms-service` integration store (`cms.cms_website_integrations`, `category='webhook'`).

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  Webhooks                                                        [ + Add subscription ]    │
├───────────────────────────────────────────┬──────────────────────────────────────────────┤
│  SUBSCRIPTIONS                             │  DELIVERY LOG   subscription [ Search idx ▾ ] │
│  endpoint                 events    state  │  ──────────────────────────────────────────  │
│  https://hooks.bi/cms     content.* ● on   │  09:12:04  content.published  200  142ms  ✓   │
│  https://idx.io/ingest    term.*    ● on   │  09:08:55  content.updated    503  ✗ retry 2 │
│  https://legacy/notify    redirect  ○ off  │  09:01:10  term.published     200   88ms  ✓   │
│  ──────────────────────────────────────────│  08:44:20  content.published  timeout ✗ retry4│
│  [ test ping ]  [ reveal secret 🔒 ]       │  ▸ row → request/response headers + body +    │
│  [ rotate secret 🔒 ]  [ delete 🔒 ]       │     HMAC signature  ·  [ Re-deliver ]         │
└───────────────────────────────────────────┴──────────────────────────────────────────────┘
```

**Components.** `WebhookSubscriptionTable` (endpoint, subscribed event types, enabled toggle, last-delivery
state, signing status), `AddSubscriptionDialog` (URL with `https`-only validation, event-type multi-select,
generated HMAC secret shown once, retry-policy preset), `SubscriptionDetail` (config + masked secret hint +
last-test result), `TestPingButton` (sends a signed `webhook.test` event), `RotateSecretButton`,
`RevealSecretButton` (step-up), `DeleteSubscriptionButton` (step-up), `DeliveryLogTable` (timestamp, event,
HTTP status, latency, attempt #, success/fail), `DeliveryDetailDrawer` (request/response headers + body +
`X-Baalvion-Signature` HMAC + verify hint), `RedeliverButton`, `EmptyState`, `ErrorState`.

**Permissions required.** Capabilities `system:webhooks` (+ `system:settings` for the integration store).
Roles: **Super Admin** ✓, **Admin** ✓. All other roles ✗. Backed by `cms-service` `requireCmsRole('cms_admin')`
on the integration routes — the admin must hold the site's `cms_admin` CMS role *and* rank `admin`. Reveal/
rotate/delete are step-up-authed and audited (`webhook.created|updated|secret_rotated|deleted`,
`webhook.delivered|failed|redelivered`). The signing secret is encrypted at rest (AES-256-GCM `secrets_enc`,
`••••1234` hint only) — the console never returns plaintext except a one-time reveal.

**API endpoints used.**
- `GET /v1/integrations?category=webhook` (alias of `GET /cms/websites/:websiteId/integrations`) → list subs.
- `PUT /v1/webhooks/:provider` / `PUT /cms/websites/:websiteId/integrations/:provider`
  `{ config:{ url, events[], retry }, secrets:{ signingSecret } }` → upsert (idempotent, validated).
- `POST /v1/webhooks/:provider/test` / `…/integrations/:provider/test` → signed test delivery.
- `DELETE /v1/webhooks/:provider` / `…/integrations/:provider` → remove.
- `GET /v1/webhooks/:provider/deliveries?status=&cursor=` → delivery log.
- `POST /v1/webhooks/deliveries/:deliveryId/redeliver` → re-attempt a single delivery.

**Database tables affected.** `cms.cms_website_integrations` (website_id, provider, category='webhook',
config JSONB `{url,events,retry}`, secrets_enc, secret_hints JSONB, enabled, status, last_tested_at,
last_test_ok, last_test_message, created_by/updated_by) — written on upsert/test/delete. Delivery log rows are
append-only (a `cms.webhook_deliveries` table introduced by this section, or the delivery-worker's own store).
Test/CRUD actions also write `audit.events`.

**Empty/Loading/Error states.** *Empty:* "No webhook subscriptions — add one to push events to external
systems." *Loading:* table + delivery-log skeletons. *Error:* if the integration store is unreachable, edits are
blocked with a clear banner (never accept a write that can't persist). **Edge cases:** a target that returns
non-2xx is retried with exponential backoff and surfaced as `failing`; after the retry budget it is marked
`dead` and (optionally) auto-disabled + notifies the admin; **only `https://` targets are accepted** (SSRF/PII
hardening — no internal/loopback URLs); rotating the secret invalidates the old signature immediately, so the
UI warns the integrator to update their verifier; re-deliver re-signs with the *current* secret.

---

## Settings

**Route:** `/admin/settings`

**Purpose.** The platform configuration hub: site identity & branding, SEO defaults (default title template,
meta description, OG image, robots policy, canonical host), third-party **integrations** (analytics, payments,
AI providers, email/SMS) surfaced from the same encrypted integration store as webhooks, and a quick-access
panel for **feature flags** (full management lives on its own page). This is where an Admin tunes the global
behavior of the product; security-sensitive settings are walled behind step-up auth and are Super-Admin-only.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  Settings                                                                                  │
│  [ General ] [ Branding ] [ SEO defaults ] [ Integrations ] [ Feature flags ] [ Security ] │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  SEO defaults                                                                              │
│   Default title template  [ %s · Imperialpedia                              ]             │
│   Default meta desc       [ The encyclopedia of finance…                    ]             │
│   Canonical host          [ https://imperialpedia.com                       ]             │
│   Default OG image        [ /og/default.png            ] [ change ]                        │
│   robots policy           ( ) index,follow   ( ) noindex (staging)                        │
│  ──────────────────────────────────────────────────────────────────────────────────────  │
│   Integrations: Plausible ●on  ·  Razorpay ●on  ·  ml-service (Claude) ●on  ·  SMTP ●on    │
│                                                                  [ Save changes ]          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Components.** `SettingsTabs` (General, Branding, SEO defaults, Integrations, Feature flags, Security),
`GeneralForm` (site name, timezone, default locale, contact), `BrandingForm` (logo, favicon, theme tokens,
color/typography — writes design tokens), `SeoDefaultsForm` (title template, meta description, canonical host,
default OG image picker → media-service, robots policy), `IntegrationsPanel` (provider cards reusing
`cms_website_integrations`: configure/test/enable each), `FeatureFlagsQuickPanel` (link-through to
`/admin/feature-flags`), `SecuritySettingsForm` (Super-Admin-only: session policy, 2FA enforcement, CSP allowlist,
CORS origins), `SaveBar` (dirty-state, optimistic save with rollback), `EmptyState`, `ErrorState`.

**Permissions required.** Capability `system:settings`. Roles: **Super Admin** ✓ (all tabs incl. Security),
**Admin** ✓ (all tabs **except** the Security tab, which is `🔒` Super-Admin-only — session/2FA/CSP/CORS are
break-glass per the §7 matrix). Managing Editor and below: ✗. Monetization-related integration toggles
additionally require `monetization:ads`/`monetization:affiliates` etc. (cross-ref
[05-analytics-monetization-ai.md](../05-analytics-monetization-ai.md)). All saves are step-up-authed on the
Security/Integrations tabs and audited (`settings.updated`, `integration.configured|tested`).

**API endpoints used.**
- `GET /v1/settings` → resolved settings document (general, branding, seo defaults).
- `PATCH /v1/settings` `{ section, values }` → update a section (validated per-section with Zod).
- `GET /v1/integrations` / `GET /cms/websites/:websiteId/integrations` → provider configs (hints only).
- `PUT /v1/integrations/:provider` / `…/integrations/:provider` → configure provider.
- `POST /v1/integrations/:provider/test` → connectivity/credential test.
- `POST /v1/media/presign` (branding/OG image upload) → media-service.

**Database tables affected.** `cms.seo_settings` (per-site SEO defaults), a `settings` document table
(general/branding key-values, schema-qualified `cms.cms_websites` columns for branding + a `settings` JSONB
where applicable), and `cms.cms_website_integrations` (provider configs/secrets). Branding image writes go to
`media.assets` via media-service. Every save writes `audit.events`.

**Empty/Loading/Error states.** *Loading:* per-tab skeletons; the Save bar is hidden until the form hydrates.
*Error:* a failed save rolls back the optimistic update and keeps the dirty state so nothing is lost. **Edge
cases:** changing the canonical host or robots policy warns "this affects SEO globally and will re-emit
sitemaps" and (on confirm) emits an event the SEO pipeline consumes; the Security tab requires step-up *per
save*; integration "test" must pass before a provider can be enabled (the store's `status` reflects
`unconfigured → tested → enabled`).

---

## Health

**Route:** `/admin/health`
(The richer infra surface is `/admin/control/infrastructure`; this page is the focused service-health board.)

**Purpose.** A realtime operational board fed by `realtime-service` (Socket.IO `/admin` namespace) showing
upstream **service health**, host vitals (CPU/RAM/disk), datastore reachability (Postgres/Redis/OpenSearch),
queue depths, and the live event/audit feed. Operators confirm the platform is up, spot a degraded dependency
before users do, and pivot to the right runbook. Read-only.

**Components.** `ServiceHealthGrid` (per-service up/degraded/down tiles from the `service_health` broadcast),
`HostVitals` (CPU/RAM/disk gauges), `DatastorePanel` (Postgres replica lag, Redis ping, OpenSearch cluster
status), `QueueDepthList` (BullMQ/consumer-group depths), `LiveEventFeed` (WS feed; mirrors the Events page tail
at a glance), `ConnectionBadge` (WS connected/streaming/reconnecting), `EmptyState`, `ErrorState`.

**Permissions required.** Capability `audit:view`/`system:events` (read-only operational data). Roles:
**Super Admin** ✓, **Admin** ✓. The `realtime-service` `/admin` namespace itself enforces `admin|super_admin`
roles on the JWT at WS handshake (error `4003` otherwise). Managing Editor and below: ✗. No mutations on this
page → no step-up.

**API endpoints used.**
- `GET /health` and `GET /metrics` (realtime-service HTTP, no-auth health/metrics snapshot) for first paint.
- WS `ws://…/admin` (realtime-service) — `service_health` (every 10s), `platform_stats` (every 5s),
  `replay` on reconnect (last 5 min), `ping` heartbeat.
- `GET /v1/analytics/health` (optional rollup) for historical sparklines.

**Database tables affected.** None written. Reads are live introspection (Redis `XINFO`, Postgres
`pg_stat_replication`, OpenSearch `_cluster/health`) surfaced by realtime-service — not persisted by this page.

**Empty/Loading/Error states.** *Loading:* tiles show "connecting…" with the last cached snapshot from
`/metrics`. *Error:* if the WS cannot connect, the board falls back to polling `/metrics` and shows a "live feed
degraded — polling" badge (never a blank screen during an incident). **Edge cases:** a service reporting
`degraded` (e.g. OpenSearch down → search falls back to Postgres FTS) is shown amber, not red, with the
fallback noted; reconnect replays the missed 5-minute window so the feed has no gap.

---

## Backups

**Route:** `/admin/backup`
(Also reachable as `/admin/control/backups`; this is the canonical DR page.)

**Purpose.** Prove the platform is **recoverable**: show Postgres **PITR** status (WAL archiving health, latest
restore point, RPO), the schedule and result of nightly logical dumps per schema, cross-region replication lag,
and the history of **DR drills** (tested restores). Operators can trigger an on-demand backup, launch a DR
drill, and — break-glass — initiate a **restore**. Targets: RPO ≤ 5 min, RTO ≤ 1 h.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  Backups & Disaster Recovery                                                              │
│  PITR ✓ WAL archiving healthy   ·   latest restore point 2026-06-04 09:14 (RPO 47s)        │
│  cross-region replica lag: 1.2s ✓        nightly dump: ✓ all 8 schemas (02:00 UTC)         │
├───────────────────────────────────────────┬──────────────────────────────────────────────┤
│  BACKUP HISTORY                            │  DR DRILLS                                    │
│  2026-06-04 02:00  logical  ✓ 4.1GB        │  2026-06-01  restore→sandbox  ✓ 540 tbl ok    │
│  2026-06-03 02:00  logical  ✓ 4.0GB        │  2026-05-15  restore→sandbox  ✓ row-for-row   │
│  [ Run backup now ]                        │  [ Run DR drill ]   [ Restore… 🔒 break-glass ]│
└───────────────────────────────────────────┴──────────────────────────────────────────────┘
```

**Components.** `PitrStatusBanner` (WAL health, latest restore point, computed RPO), `ReplicationLagTile`,
`BackupHistoryTable` (timestamp, type logical|snapshot, per-schema result, size), `DrDrillTable` (date,
target, outcome, table/row parity), `RunBackupButton`, `RunDrillButton`, `RestoreDialog` (break-glass: explicit
typed confirmation + target selection + step-up auth + "this is destructive on the target" warning),
`EmptyState`, `ErrorState`.

**Permissions required.** Capability `system:backup`. Roles: **Super Admin** ✓ (restore is Super-Admin-only,
break-glass), **Admin** ✓ for *read* status + *run backup* + *run drill*; **Admin restore = `🔒`** (denied
unless explicitly granted, never to a production target without Super Admin). Managing Editor and below: ✗. Run
backup / drill / restore are step-up-authed and audited (`backup.run`, `dr.drill_run`, `db.restore_initiated` —
restore is the single highest-severity action on the platform and pages on-call).

**API endpoints used.**
- `GET /v1/backups/status` → PITR/WAL health, latest restore point, replication lag, RPO.
- `GET /v1/backups?type=&range=` → backup history.
- `POST /v1/backups/run` `{ type:'logical'|'snapshot', schema? }` → on-demand backup (async job).
- `GET /v1/backups/drills` / `POST /v1/backups/drills` → DR drill history / trigger a drill (restore to sandbox + parity check).
- `POST /v1/backups/restore` `{ snapshotId|restorePoint, target }` → **break-glass** restore (step-up, super_admin).

**Database tables affected.** This page **operates on** infrastructure, not a single app table: it reads
WAL/replication state (`pg_stat_archiver`, `pg_stat_replication`) and a `backups`/`dr_drills` registry
(schema-qualified `audit`/ops `audit.backups`, `audit.dr_drills` introduced by this section). A **restore
rewrites entire schemas on the target** — the most destructive operation in the system. All actions write
`audit.events`.

**Empty/Loading/Error states.** *Loading:* status banner shows "checking PITR…" with the last known good state.
*Error:* if WAL archiving is unhealthy, the banner goes **red** ("RPO at risk — backups degraded") and notifies
on-call — this is a P1, not a cosmetic warning. **Edge cases:** Restore requires typing the exact target name to
confirm and is hard-blocked against a production target unless Super Admin + a second confirmation; DR drills run
against an isolated sandbox and report row-for-row parity (the platform's proven drill recipe); on-demand backup
is rate-limited so an operator can't queue dozens.

---

## Feature Flags

**Route:** `/admin/feature-flags`
(`/admin/control/features` and `/admin/control/experiments` are sibling surfaces; this is the canonical flag
registry, experiments layer rides on top.)

**Purpose.** Toggle and target platform features without a deploy: a registry of flags with on/off state,
percentage/segment **rollout targeting** (by role, tenant/org, or user cohort), and an environment-aware
default. Operators ship behind a flag, ramp gradually, and kill-switch instantly. Security-class flags
(`security.*`) are walled behind step-up and Super-Admin to prevent a flag from silently disabling a control.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  Feature Flags                                       env: prod ●           [ + New flag ]  │
├──────────────────────────────────────────┬───────────────────────────────────────────────┤
│  flag                       state  rollout│  DETAIL · new-block-editor                    │
│  new-block-editor           ● on    25%   │   Description  TipTap v2 editor               │
│  ai-related-links           ● on   100%   │   Default      ( ) on  (•) off                │
│  graphql-bff-dashboard      ● on    50%   │   Targeting    role: editor+ · org: [all ▾]    │
│  legacy-articles-readmodel  ○ off    0%   │                cohort: 25% sticky-by-userId    │
│  security.strict-csp 🔒      ● on   100%   │   [ Save ]  [ Kill switch ⚡ ]   audited       │
└──────────────────────────────────────────┴───────────────────────────────────────────────┘
```

**Components.** `FeatureFlagTable` (key, state, rollout %, env, owner, last-changed), `FlagDetailPanel`
(description, default on/off, targeting rules: role/org/cohort, sticky-by-userId bucketing), `NewFlagDialog`,
`RolloutSlider` (0–100% with sticky hashing preview), `TargetingRuleBuilder` (role/tenant/cohort conditions),
`KillSwitchButton` (instant 0%), `EnvSelector`, `EmptyState`, `ErrorState`.

**Permissions required.** Capability `system:settings` (flag management is a settings-class privilege). Roles:
**Super Admin** ✓ (all flags incl. `security.*`), **Admin** ✓ for non-security flags; **`security.*` flags =
`🔒` Super-Admin + step-up only**. Managing Editor and below: ✗. All toggles are audited
(`feature_flag.updated`, `feature_flag.killed`) with before/after. Flag *evaluation* on the read path is fast
and server-driven; the UI reflects effective state from `GET /me/flags`.

**API endpoints used.**
- `GET /v1/feature-flags?env=` → flag registry.
- `POST /v1/feature-flags` `{ key, description, default, env }` → create.
- `PATCH /v1/feature-flags/:key` `{ state, rollout, targeting }` → update state/targeting.
- `POST /v1/feature-flags/:key/kill` → instant disable (rollout → 0%).
- `GET /v1/feature-flags/:key/audit` → change history (proxied from audit-service filtered by resource).

**Database tables affected.** `monetization`/platform feature-gate store — schema-qualified
`monetization.feature_flags` (key, description, default, rollout, targeting JSONB, env, enabled, updated_by) as
the §13 inventory lists feature gates under `monetization`. Flag state is cached in **Redis** (`@baalvion/cache`)
for fast evaluation; the cache is invalidated on write. Every change writes `audit.events`.

**Empty/Loading/Error states.** *Empty:* "No feature flags defined." *Loading:* table skeleton. *Error:* a
failed toggle rolls back the optimistic switch and surfaces the error (a flag that *looks* off but is on is a
production hazard — never show a false state). **Edge cases:** percentage rollout uses sticky hashing on
`userId` so a user's experience doesn't flicker between requests; toggling a `security.*` flag forces step-up
and a confirmation that names the control being changed; the kill switch is one click but still audited and
emits a `feature_flag.killed` event so on-call sees the intervention.
