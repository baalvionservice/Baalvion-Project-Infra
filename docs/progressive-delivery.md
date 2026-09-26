# Progressive delivery on box2

> **Status: written, never run against production.** Everything here was designed
> against the real files and rehearsed against a mock stack of throwaway containers on
> a laptop. None of it has touched box2. The numbers in "What was actually verified"
> at the foot of this document say exactly which claims are measured and which are
> inferred. Read that section before you enable any of this.

## The problem this solves

Box2's deploy pipeline (`.github/workflows/deploy-consolidated-box2.yml`) already does
better than most: it records the running image digests before pulling, smoke-tests
after, and retags-and-restarts on failure. But the rollback is a **restart**, which
means the sequence for a bad image is:

1. every core container is recreated on the new image — all users are on it at once
2. the smoke check runs
3. it fails
4. every core container is recreated again on the old image

Users are served broken responses for the whole of steps 1–4, and the recovery is
itself a redeploy that can fail. There is no stage at which only some traffic is
exposed.

Progressive delivery replaces steps 1–4 with: run the candidate beside the current
version, give it 5% of requests, watch, then 25%, then 100%, and only then adopt it.
Rolling back is a config reload rather than a redeploy, so it takes about a second and
cannot fail the way a pull can.

## Why per-service, and not a second copy of the stack

Box2 is a **t3.large — 2 vCPU, 8 GiB** (inferred from the name of
`.github/workflows/_audit-box2-post-resize-health.yml`; I did not query the instance),
with a **2 GiB swapfile** and `vm.swappiness=10` added by
`.github/workflows/_action-box2-add-swap.yml`.

Measured from `deploy/consolidated/docker-compose.prod.yml`:

| | services | `mem_limit` | `mem_reservation` |
|---|---|---|---|
| Default profile (what actually runs) | 11 | 9,120 MiB (8.91 GiB) | 4,352 MiB (4.25 GiB) |
| Including `payments`/`community`/`giftcard`/`kafka` | 16 | 11,552 MiB (11.28 GiB) | 4,864 MiB |
| Largest single service (`app-ecosystem`, `app-platform`) | — | 1,536 MiB | 768 MiB |

`mem_limit` is a ceiling, so the sum being larger than the box is normal and fine.
`mem_reservation` is the number that has to be genuinely resident. So:

- **Full-stack blue/green** needs a second 4,352 MiB of reservations on top of the
  first. 4,352 × 2 = 8,704 MiB — more than the box's entire 8 GiB, before a single
  page of actual working set. It does not fit, and the box has already needed swap to
  run **one** copy. This is not a tuning problem.
- **One green at a time** costs at most 768 MiB of reservation (1,536 MiB of cap) on
  top of 4,352 MiB, for 5,120 MiB. That fits with roughly 3 GiB to spare.

That difference is the entire design. Only the service being deployed runs a second
copy; everything else keeps exactly one.

> The task brief said "+1 GiB at a time for the largest". The real figure is **+1.5 GiB
> of cap / +768 MiB of reservation** — `app-ecosystem` and `app-platform` are both
> capped at 1536m, not 1024m.

## How it works

### Blue is the existing container; green is a temporary second one

There is no alternating pair. `app-platform` is permanently blue — that name is
hardcoded in 55 places in the Caddyfile and nothing good comes of chasing that. A
rollout adds `app-platform-green`, moves traffic to it, and at the end recreates blue
on the new image and takes green away. The stack converges back to one container per
service, so memory stays bounded and the Caddyfile returns to its committed form.

The cost is one extra recreate of blue at promotion time — but traffic is 100% on
green at that moment, so nobody sees it.

### Caddy does the splitting

`deploy/consolidated/caddy/Caddyfile` routes every upstream as a single
`reverse_proxy <service>:<port>`. `scripts/traffic-shift.mjs` rewrites the lines
belonging to one service into Caddy's weighted form:

```caddyfile
reverse_proxy app-platform:3018 app-platform-green:3018 {
	lb_policy weighted_round_robin 95 5
	fail_duration 30s
	max_fails 3
}
```

and runs `caddy reload`, which swaps the config without dropping connections.

- **All of a service's ports move together.** `app-platform` owns 16 routes across
  eight ports (cms 3018, admin 3021, imperialpedia 3004, law 3015, audit 3032,
  dashboard 3009, news 3045, developer 3042). They are one container running one pm2
  group, so splitting them would send a browser's CMS read and its admin write to
  different colours.
- **0% and 100% render the plain single-upstream form**, so a finished or aborted
  rollout leaves the Caddyfile byte-identical to the tracked one. `git diff` is empty
  when nothing is in flight.
- **`fail_duration`/`max_fails` are passive health checks.** Active checks
  (`health_uri`) would apply to *both* upstreams, and not every port behind these
  routes answers `/health` — cms-service on 3018 does not — so an active check would
  mark blue unhealthy and take the route down. Passive counts transport failures only.

### The green containers

`deploy/consolidated/docker-compose.bluegreen.yml` defines one green per service,
each behind its own profile (`bg-app-platform`, …), so exactly one can ever start.
Notable choices, all explained inline in that file:

- `restart: "no"` — a green that dies stays dead, so the soak sees it. `unless-stopped`
  would hide a crash-looping candidate while it ate the headroom that made room for it.
- `GREEN_IMAGE_TAG`, never `IMAGE_TAG`, so a green cannot be confused with blue.
- Ports published on **127.0.0.1 only** — a green is never publicly reachable. The
  loopback port exists so `scripts/smoke-check.mjs` can probe the candidate from the
  box before any traffic moves to it.
- `app-platform-green` mounts the same `cms_uploads` volume as blue. Without it, media
  uploaded while the canary carries traffic would land in the green container's
  writable layer and die with it.

### Health gating

No shift above 0% happens until `scripts/smoke-check.mjs` — the same script the deploy
workflow uses — gets a good response from the green's loopback probe port. That is a
hard gate in `traffic-shift.mjs`, not a step the operator can forget.

## What an operator runs

All of this runs **on box2**, from `/opt/baalvion-box2`. It needs the Docker socket and
the checkout that Caddy mounts its Caddyfile from.

```bash
cd /opt/baalvion-box2

# the whole thing: 5% -> 25% -> 100%, five minutes at each stage, then promote
node scripts/canary-rollout.mjs --service app-platform --tag prod-9f2c1ab --write-env

# where are we?
node scripts/canary-rollout.mjs --status

# stop and put everything back
node scripts/canary-rollout.mjs --abort
```

Tuning, with the defaults shown:

```bash
node scripts/canary-rollout.mjs --service app-platform --tag prod-9f2c1ab \
  --stages 5,25,100 \        # ascending percentages
  --soak 300 \               # seconds watched at each stage
  --error-threshold 0.02 \   # 2% of probes failing aborts the rollout
  --probe-interval 10 \      # seconds between probes
  --min-samples 10 \         # probes needed before the rate is allowed to abort
  --warmup 180               # seconds green gets to report healthy
```

**Why these defaults.** 5% of a low-traffic surface is a handful of requests, so the
soak has to be long enough to see any of them — five minutes at a 10-second probe
interval is 30 samples. 2% is above the noise floor of a healthy service and well below
the rate a genuinely broken one produces. `--min-samples 10` stops a single failed
probe in the first 20 seconds from aborting a good rollout. Lengthen the soak for a
change you are nervous about; shorten nothing without a reason.

### Aborting by hand

If the orchestrator is not running — you are on the box at 3am and something is wrong —
one command puts all traffic back:

```bash
node scripts/traffic-shift.mjs --service app-platform --percent 0
```

That rewrites the Caddyfile back to its committed form and reloads. Blue never changed
image during a canary, so **there is nothing to redeploy** — the previous version has
been running and serving the whole time.

If even that fails, the fallback is the ordinary one:

```bash
cd /opt/baalvion-box2/deploy/consolidated
git checkout -- caddy/Caddyfile
docker compose --env-file .env -f docker-compose.prod.yml up -d --no-deps --force-recreate caddy
docker compose --env-file .env -f docker-compose.prod.yml -f docker-compose.bluegreen.yml \
  --profile bg-app-platform rm -sf app-platform-green
```

## Which services this is safe for

A traffic shift decides who answers **requests**. It does nothing about background
loops, and several of these containers run them. Running two copies runs those loops
twice. This table is from reading the code, service by service:

| Service | Edge routes | Green? | Why |
|---|---|---|---|
| `admin-web` | 1 | **yes** | stateless Next.js standalone, no background work |
| `app-auth-web` | 1 | **yes** | stateless Next.js standalone, no background work |
| `app-platform` | 16 | **yes** | `law-service/billingWorker.js` and `admin-service/paymentRecordsRetention.js` both take a Postgres advisory lock and say so in their headers; `developer-service/deliveryWorker.js` holds a lock too. `statusProbe` is off unless `STATUS_PROBER=true`. The overlay turns the first two and the prober off anyway. |
| `app-identity` | 7 | **yes, with the cron off** | `auth-service/jobs/reengagementCron.js` has no lock — only a cooldown timestamp it reads then writes, which two copies race. The overlay sets `REENGAGEMENT_CRON_ENABLED=false` on green. |
| `app-commerce` | 10 | **caveat** | `marketplace-service/service/auditRelay.js` drains an outbox with no row lock, so two copies can relay a row twice. Its own header notes audit-service hash-chains what it receives, so duplicates are *visible* rather than corrupting. `commerce-service/fxRateProvider.js` is an idempotent cache refresh. |
| `app-ecosystem` | 9 | **caveat** | `ctm-service/service/observability.js` persists metric snapshots on a timer with no lock, so the admin dashboard time-series double-samples for the duration of the canary. I did not audit all ten modules in this group. |
| `app-edge-realtime` | 4 | **NO** | two reasons, below |
| `app-trade` | **0** | **NO** | two reasons, below |

`canary-rollout.mjs` refuses the last two outright. `--force-unsafe` overrides and owns
the consequences.

**`app-trade`** — `order-execution-service/services/outboxPublisher.js` claims PENDING
rows with a plain `findAll`: no `FOR UPDATE SKIP LOCKED`, no advisory lock, and no env
switch to turn it off. Two copies read the same batch and publish every event twice.
Separately, **nothing in the Caddyfile proxies to `app-trade` at all** — the only
mention is an example in the comment at the foot of the file — so there is no traffic
to shift even if the worker were safe. Fix the claim query before revisiting.

**`app-edge-realtime`** — `ws.baalvion.com` is socket.io. `weighted_round_robin`
splits *requests*, not sessions: a websocket that upgrades cleanly stays on one
upstream for its life, but the HTTP long-polling fallback issues a fresh request per
poll and will alternate colours mid-session. Caddy cannot do weighted and sticky at the
same time. Separately, `proxy-service/workers/intelligenceWorker.js` schedules model
training, forecasts, anomaly sweeps and route-weight publishing on timers — all of
which would double on a 2-vCPU box.

## What this does NOT protect against

This is the important section.

**Database migrations.** A traffic shift cannot undo a migration. The box2 workflow
runs `npm run migrate` for commerce, inventory, fulfillment, marketplace, cms and news
on every deploy, all with `continue-on-error: true`. If a migration drops a column,
rewrites data, or adds a `NOT NULL` the old code cannot satisfy, then shifting traffic
back to blue puts the **old code on the new schema** — which may be worse than leaving
it on green. A bad migration is still a bad migration, and this machinery gives you
nothing against it. The only real defence is the discipline the schema needs anyway:
expand-then-contract, additive first, never destructive in the same release as the code
that stops using the column. **If a release contains a destructive migration, do not
canary it — this design assumes blue and green can both run against the same schema at
the same time, and a destructive migration breaks that assumption by definition.**

**The shared image.** `IMAGE_TAG` feeds seven services — the six pm2 personalities plus
`admin-web` all come out of one build. Canarying `app-platform` on a tag validates that
tag *as app-platform*. When you promote and persist `IMAGE_TAG`, the other six keep
running their current image until something recreates them, and then they adopt the new
one **without ever having been canaried**. Roll each personality you care about, in
sequence, against the same tag. The script prints this reminder at promotion.

**Anything not on the probed path.** The abort signal is an error rate over this
script's own probes of one endpoint per service, not over real user traffic. Caddy is
not configured to log at all — there is no `log` directive anywhere in the Caddyfile —
so per-upstream request outcomes are simply not observable on the box today. The probe
reliably catches a candidate that has fallen over, hung, started erroring on the probed
path, or is being OOM-killed. It will **not** see a fault confined to a route the probe
does not touch: a broken checkout, a 500 on one CMS endpoint, a subtly wrong response
body. Those reach 5% of users and nothing aborts.

To close that gap properly, Caddy needs an access log with the chosen upstream in it —
roughly:

```caddyfile
log {
	output file /var/log/caddy/access.log
	format json
}
```

plus a custom field carrying `{http.reverse_proxy.upstream.hostport}`. That is a
separate change to live edge config with its own disk and rotation questions, and I
have not written or tested it. Until it exists, treat the soak as a liveness check with
an error rate attached, not as real observability.

**Correctness.** Green answering 200 does not mean green is right. Nothing here
compares responses between colours.

**Shared state.** Both colours talk to the same RDS, the same Redis, the same
`cms_uploads` volume. A candidate that corrupts data corrupts it for everyone
immediately, and shifting traffic back does not unwrite it.

**Sessions and caches.** A user's requests alternate between colours during a partial
stage. If the two versions disagree about a cookie format, a cache key, or a Redis
value shape, that user sees the disagreement. Assume anything you change about session
or cache representation is incompatible with a canary.

**Cloudflare.** Several of these hostnames sit behind Cloudflare with edge caching. A
cached response is served without reaching Caddy at all, so cached routes are neither
canaried nor rolled back by a traffic shift.

**The box.** Everything runs on one EC2 instance. This buys nothing against instance
failure, AZ failure, RDS failure, or a full disk.

## Prerequisites, one-time

1. **Node on box2.** These are Node scripts and they run on the box. Confirm with
   `node --version` — `package.json` pins `engines.node >= 24`, and the scripts need
   at least 18 for `fetch` and `AbortSignal.timeout`. *(I could not check whether box2
   has Node installed at all; the workflow runs `smoke-check.mjs` on the GitHub runner,
   not on the box.)*
2. **Caddy must be reading the file on disk.** The Caddyfile is a single-**file** bind
   mount, so `git pull` replaces its inode and the running container keeps reading the
   old one — this is why the deploy workflow force-recreates Caddy every roll.
   `traffic-shift.mjs` refuses to do anything if the container's copy does not match
   the disk copy, and tells you to recreate Caddy. Do that after any `git pull`.
3. **No deploy mid-rollout.** While a rollout is in flight the Caddyfile is modified,
   so `git pull --ff-only` on the box will fail. That is deliberate back-pressure:
   finish or abort the rollout first. `--status` says whether one is in flight.
4. **Green image must be in ECR** under the tag you pass. The scripts never build.

## Failure modes, and what happens

| What goes wrong | What happens |
|---|---|
| Green never becomes healthy | rollout aborts before any traffic moves; blue untouched |
| Green dies mid-stage | Caddy drains it after `max_fails`; soak sees `restart: "no"` and aborts to 0% |
| Green is OOM-killed | `docker inspect` reports it; immediate abort, and the message says the box lacked headroom |
| Green errors above threshold | abort to 0% at the end of that probe |
| Rendered Caddyfile does not adapt | caught by `caddy validate` in a throwaway container **before** the live file is touched; nothing changes |
| `caddy reload` fails | Caddy keeps its running config, so the edge stays up; the script restores the previous file |
| Caddy is on a stale inode | refused up front, with the recreate command |
| Two rollouts at once | refused — there is only headroom for one green |
| Blue fails to come back at promotion | traffic **stays** on green and the script says so; shifting to a blue that is not serving would be worse |

## What was actually verified

Rehearsed locally against throwaway `caddy:2-alpine` containers on a laptop, **not**
against box2:

- `weighted_round_robin` splits exactly as asked: 400 requests at `95 5` gave 380/20;
  at `75 25` gave 300/100; at `50 50` gave 100/100.
- `caddy reload` is non-disruptive: **3,000 of 3,000 requests returned 200** across a
  live weight change, and **2,500 of 2,500** across two consecutive shifts (5→25→100)
  driven by `traffic-shift.mjs` itself.
- Killing a green carrying 25% cost **3 failed requests out of 200** before
  `fail_duration 30s` / `max_fails 3` stopped Caddy selecting it.
- `caddy validate` exits 1 on a bad config and the running config is untouched — the
  fail-closed gate is real.
- End-to-end through `traffic-shift.mjs`: the health gate ran the real
  `smoke-check.mjs` against the green's loopback port; 5% produced 20/400 on both a
  bare `reverse_proxy` route and one that opens a block; `header_down` survived the
  rewrite; `--percent 0` restored the file **byte-identically**.
- Guards fired as designed: green down → refused; second service while one is in
  flight → refused; the mounted file replaced → refused.
- `docker compose config` accepts `docker-compose.prod.yml` + the overlay, and
  `--profile bg-app-platform` selects exactly one green while no profile selects none.
- `node --test scripts/traffic-shift.test.mjs` — 14 tests, including 35 `caddy validate`
  runs across five services × seven percentages, and a check that the rewrite regex
  covers **all 55** `reverse_proxy` directives in the real file with none skipped.

Written but **never executed**:

- The whole of `canary-rollout.mjs` beyond its argument parsing, `--status` and
  `--abort` paths. The staged loop, the soak, the promotion and the headroom check have
  never run against real containers.
- Every green service definition. None has ever been started.
- The `assertContainerSeesFile` digest-**mismatch** branch. On this laptop (Docker
  Desktop, virtiofs) replacing the mounted file makes the in-container read fail
  outright, which exercises the other branch. On a native Linux bind mount the old
  inode usually stays readable, so box2 would more likely hit the mismatch branch.
  Both are handled; only one is exercised. *(Inferred.)*
- The `/proc/meminfo` headroom check — macOS has no `/proc`, so it took the
  "cannot check" path every time.

Facts corrected against the brief while reading the real files:

- `docker-compose.prod.yml` defines **16 services**, not 23. The 23 is 16 services plus
  the 7 named volumes — both are two-space top-level keys. All 16 carry `mem_limit`.
  Only **11** run under the default profile; five are behind `payments`, `community`,
  `giftcard` and `kafka`.
- The Caddyfile has **55** real `reverse_proxy` directives; the 56th match is inside a
  comment.
- Two upstreams referenced at the edge are **not services in this compose file**:
  `nodebb:4567` lives in `deploy/consolidated/nodebb/docker-compose.nodebb.yml`, and
  `app-gti-web:9003` only exists in `deploy/stack/docker-compose.app.yml`, which is a
  different box.

## Related

- `deploy/consolidated/docker-compose.bluegreen.yml` — the green definitions
- `scripts/traffic-shift.mjs` — the weight rewrite and reload
- `scripts/canary-rollout.mjs` — the staged rollout and abort
- `scripts/traffic-shift.test.mjs` — `pnpm run canary:test`
- `scripts/smoke-check.mjs` — the health gate, shared with the deploy workflow
- `.github/workflows/deploy-consolidated-box2.yml` — the pipeline this sits beside
