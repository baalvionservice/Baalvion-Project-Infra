# community.marketunderworld.com: launch runbook

Covers shipping the Nightlife (clubs, events, bookings), Locals, Staffing, Bug Bounty, Education,
KYC and Investment-listing work. Read `vps-health-and-safe-deploy-runbook.md` first; this file only
adds what is specific to this release. **Nothing here has been deployed.** Everything below was
built and tested locally on branch `feat/community-nightlife-backend`.

## 1. What ships and where

| Piece | Where it runs | What changes |
|---|---|---|
| Frontend | Cloudflare Worker `market-underworld-community` (`pnpm run cf:deploy`, custom domain) | New pages, wiring to the API, retired mock pages |
| community-service | VPS container (`/api/v1/community/*`) | 29 new tables (adds staff_members, audit_events, support_tickets, support_messages, announcements), routes for nightlife / locals / gigs / bounty / edu / kyc, KYC encryption, seed + purge scripts |
| order-service | VPS container | Opt-in KYC gate (`service/kycGate.js`), reads `custom_fields.requiresKyc` |
| commerce-service | VPS container | Storefront serializer exposes `kycRequired` and a whitelisted `investment` block |

New tables are created by `sequelize.sync({ alter: false })` at community-service start-up (schema
`community`). Nothing existing is altered. order-service and commerce-service have **no migrations**
in this release.

## 2. Decisions that must be made before launch (not engineering)

1. **Legal sign-off on investment listings.** Selling revenue-share stakes in creators' channels can
   be a regulated activity. The site stores no money itself (normal checkout), and every listing shows
   a risk note, but sign-off is yours to get.
2. **Privacy/retention sign-off on KYC.** The site will hold ID scans and selfies (encrypted). Confirm
   the retention window (default 90 days after a decision), who the admin reviewers are, and that your
   privacy policy covers it.
3. **Bounty tasks.** The three seeded tasks aim at the live login, checkout and session code. They
   seed as **drafts**; write rules/scope text and decide that you can pay the rewards before publishing.
4. **Reward and price claims.** Only publish rewards you will honour.

## 3. New configuration (secrets are NOT in git)

| Service | Variable | Notes |
|---|---|---|
| community-service | `KYC_ENCRYPTION_KEY` | `openssl rand -base64 32`. **Back it up outside the box** (password manager). Losing it makes every stored document unreadable. Without it `/kyc` returns 503 (fail closed). |
| community-service | `KYC_VALIDITY_MONTHS` (24), `KYC_DOC_RETENTION_DAYS` (90) | Optional |
| community-service | `NOTIFICATION_BASE_URL` | notification-service as seen from community-service (confirm the service name/port on the box). Unset = no emails; the in-app feed still works. |
| community-service | `ADMIN_ALERT_EMAIL` | Comma-separated ops mailbox(es) for "new booking / profile / KYC / report / chat" alerts |
| community-service | `SITE_URL` | Defaults to `https://community.marketunderworld.com`; used for links in emails |
| community-service | `INTERNAL_SERVICE_SECRET` | Already required; must **equal** order-service's |
| order-service | `KYC_SERVICE_URL` | Base of the community API as seen from order-service, e.g. `http://<community-service-name>:3064/api/v1/community` (confirm the service name on the box) |
| order-service | `INTERNAL_SERVICE_SECRET` | Already set; confirm it equals community-service's |

Frontend: no new variables. (`NEXT_PUBLIC_COMMUNITY_API_BASE` defaults to `https://api.baalvion.com/api/v1/community`.)

## 4. Pre-flight (re-run just before deploying)

```bash
# from repo root, on the release branch
pnpm run architecture:check                      # expect 0 violations (then: git checkout -- Backend/catalog/index.json, it only rewrites a timestamp)
cd Backend/services/ecosystem/community-service && npx jest --testEnvironment node --forceExit   # 90 pass
cd ../../commerce/order-service && node --test --test-force-exit tests/kycGate.test.js          # 6 pass
cd ../commerce-service && node --test --test-force-exit tests/storefrontSerializer.test.js      # 12 pass
cd ../../../../Frontend/community.marketunderworld.com && npx tsc --noEmit                      # expect no errors under src/
```

Known, not caused by this release: `order-service`'s `tests/security.test.js` has 2 cart tests that
need a database password. The frontend lint errors that used to block `pnpm run cf:build/deploy` have
been fixed, so the build runs with `eslint.ignoreDuringBuilds: false` as configured.

## 5. Rollout order (backend first, frontend last)

Why: the frontend reads fall back to bundled data, but every write (bookings, applications, KYC)
needs the API. And the KYC gate must not exist before the thing it asks.

1. **Back up Postgres** (`pg_dump` of the `community` schema is enough; this release only adds tables).
2. **Generate and store `KYC_ENCRYPTION_KEY`** (section 3). Add it to community-service's env on the box.
3. **Build images in CI or locally, never on the box** (rule 1 of the deploy runbook).
   Check which images these services share before building: some containers share one image, so one
   build can serve several (see the container-swap notes in the deploy runbook).
4. **Swap community-service** using the compose set the container reports:
   `docker inspect <container> --format '{{json .Config.Labels}}' | tr , '\n' | grep compose`, then
   `docker compose <those -f files> up -d --no-build --no-deps <service>`. Never `--remove-orphans`.
   Tag the old image `:previous` first so rollback is a tag move.
5. **Verify community-service** (section 6, backend checks) before touching anything else.
6. **Seed**, from inside the container (idempotent, safe to re-run):
   `node scripts/seed-nightlife.js` (107 clubs, 5 locals) and `node scripts/seed-bounty.js` (3 draft tasks).
7. **Schedule the document purge** daily (cron/pm2 on the host that can reach the container):
   `node scripts/purge-kyc-documents.js`. Without it ID scans are kept past the retention window.
8. **Set `KYC_SERVICE_URL`**, then swap **commerce-service**, then **order-service**.
   Until an admin posts a product flagged `requiresKyc`, the gate never runs, so order behaviour is unchanged.
9. **Deploy the frontend** (`pnpm run cf:deploy`, see the lint note in section 4). Wrangler keeps the
   previous Worker version available for rollback.

## 6. Smoke tests

Backend (replace `$T` with a real user token and `$A` with an admin token):

```bash
B=https://api.baalvion.com/api/v1/community
curl -s $B/nightlife/stats                                  # clubs: 107
curl -s "$B/nightlife/clubs?limit=1"                        # a club, no 5xx
curl -s -o /dev/null -w '%{http_code}\n' $B/kyc/me          # 401 without a token
curl -s -o /dev/null -w '%{http_code}\n' $B/internal/kyc/00000000-0000-4000-8000-000000000000   # 401 (secret required)
curl -s -H "authorization: Bearer $T" $B/kyc/me             # 200, data null for a new user
curl -s -H "authorization: Bearer $T" $B/admin/overview     # 403 for a non-admin
curl -s -H "authorization: Bearer $A" $B/admin/overview     # 200 with counts
```

KYC gate (on the box, after step 8). Post one test investment listing from `/admin/investments`, then:
1. As a user with no KYC, add it to the cart and check out: expect the redirect to `/kyc`, order refused with `KYC_REQUIRED`.
2. Submit KYC as that user, approve it at `/admin/kyc`, retry: the order is created.
3. Stop community-service briefly and retry: expect `KYC_UNAVAILABLE` (503), not an order.
4. Check a normal (non-flagged) product still checks out with no KYC lookup.

Notifications and uploads (needs a real user token `$T` and an admin token `$A`):

```bash
curl -s -H "authorization: Bearer $T" $B/notifications                      # 200 {items, unread}
curl -s -o /dev/null -w '%{http_code}\n' $B/notifications                    # 401 without a token
# set a club's contact email in /admin/clubs, submit a guest-list request, and confirm:
#  - the guest gets a receipt email, the venue and ADMIN_ALERT_EMAIL get the request
#  - confirming the request in /admin/clubs/bookings emails the guest once (not twice)
# upload a candidate photo at /nightlife/candidate; open its URL while signed out: expect 404
```

Frontend: open `/clubs`, `/locals`, `/calendar`, `/education`, `/stats`, `/kyc`, `/shop/investments`,
and submit a guest-list request; confirm it appears in `/admin/clubs/bookings`.

## 7. Admin set-up after launch (all through the console)

1. `/admin/investments`: create the Investments category, then post the first listing.
2. `/admin/clubs/events`: add events a venue has confirmed (the calendar starts empty by design).
3. `/admin/clubs`: add VIP packages only where the venue confirmed prices.
4. `/admin/bounty`: write rules on a task, then Publish.
5. `/admin/education/approvals`, `/nightlife/verify`, `/admin/kyc`: the review queues.

## 8. Rollback

* **Frontend:** `wrangler rollback` (or redeploy the previous commit). Safe at any time.
* **Backend:** move the `:previous` tag back and recreate the container. The new tables are inert
  without the new code and can stay.
* **order-service gate only:** unset `KYC_SERVICE_URL`. Flagged products then refuse to sell
  (fail closed) while every other order is unaffected. To stop selling them entirely, unpublish
  the listings in `/admin/investments`.
* **Do not delete `KYC_ENCRYPTION_KEY`** to "disable" KYC; that destroys access to stored documents.

## 9. Things to know

* **404s and redirects are real.** The old root `app/loading.tsx` forced HTTP 200 on unknown detail URLs
  and on redirects. Its skeleton now lives in `components/layout/route-loading.tsx` and each section that
  has no `notFound()`/`redirect()` pages carries its own `loading.tsx`. Sections without one (locals,
  clubs, calendar, nightlife, education, shop, marketplace, match and the retired redirect pages) return
  true 404/307 (checked with a browser and a Googlebot user agent). `forum` keeps a skeleton, so its
  `category/[slug]` not-found still answers 200 (forum was deliberately left as it was).
* The `/access` page lists three paid tiers that need those communities to exist in the production
  community-service (they do today); a fresh database returns 404 for them.
* `/internal/kyc/:userId` needs the internal secret AND is refused (404) for any request carrying proxy or
  CDN headers (`x-forwarded-for`, `cf-ray`, `via`, ...), so it cannot be reached from the internet even if
  the gateway forwards the path. Consequence: `KYC_SERVICE_URL` in order-service must be the service's
  PRIVATE address (for example `http://<service>:3064/api/v1/community`), never the public API host,
  and not a URL that goes through Caddy.
* Notifications: the bell is a real feed from community-service (polled every 60 s while signed in). Email needs `NOTIFICATION_BASE_URL`; without it only the in-app feed and the admin queues carry the news.
* Media is stored in Postgres (1 MB each, quota per user). Fine for launch volume; move to object storage (R2/S3) if photo counts grow into the tens of thousands.
* Admin tiers: super (super_admin/platform_admin), admin (country_admin or granted) and moderator (granted). Admins cannot open KYC or Staff & Access; moderators only get queues (bookings, applications, verification) and support. Grant moderators in `/admin/staff` (super only). The sidebar and each page enforce this, and every admin write is recorded at `/admin/system/audit`.
* Support: members write at `/support`; staff answer at `/admin/support/tickets`. Announcements published at `/admin/system/announcements` show as a banner site-wide.
* Bounty payouts are recorded by an admin after paying outside the site; the ledger requires method, amount, currency and a transaction reference and cannot be edited afterwards.
* Investment listings show exactly what an admin ticked as verified (channel ownership, revenue evidence) and say "claims have not been verified" otherwise.
* KYC proves identity, not that a creator's projected revenue is real.
