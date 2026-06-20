# Single-host EC2 backend — deploy + validation runbook

> Run everything **on the EC2 host** (`ssh -i Baalvion-ec2 ubuntu@13.206.116.65`), from the
> **repo root**. This stack is backend-only (frontends are on Vercel). The Caddyfile in this
> folder is the single public ingress — only :80/:443 are exposed.

## 0. Public hostnames, path-routed

Most frontends call **`https://api.baalvion.com`** (Caddy fans out by prefix). **`trade.baalvion.com`**
is a second hostname for the full-stack GTI app. DNS: point BOTH A-records at this host's Elastic IP.

| Vercel app | API base it must call | → backend |
|------------|----------------------|-----------|
| admin / about / amarisé | `https://api.baalvion.com` (native `/api/*`) | auth-gateway:3099 |
| Stack A CMS public reads | `https://api.baalvion.com/api/v1/public/<slug>/content` | cms-service:3018 (direct) |
| controlthemarket | `https://api.baalvion.com/ctm` | ctm-service:3017 |
| baalvionstack (proxy) | `https://api.baalvion.com/proxy` (+`/proxy/auth-bff/*`) | proxy-service:4000 |
| CMS public reads (proxy) | `https://api.baalvion.com/proxy-cms/api/v1/public/...` | proxy-cms-service:3011 |
| **lawelitenetwork** (CMS) | `https://api.baalvion.com/api/v1/public` + slug `law-elite-network` | cms-service:3018 |
| **lawelitenetwork** (data) | `https://api.baalvion.com/law/v1` | law-service:3015 |
| **imperialpedia** (CMS) | `https://api.baalvion.com/api/v1/public` + slug `imperialpedia` | cms-service:3018 |
| **imperialpedia** (entities) | `https://api.baalvion.com/imperialpedia/api/v1` | imperialpedia-service:3004 |
| **trade.baalvion.com** | served whole at its own hostname (UI + `/trade-bff` + `/finance-bff`) | gti-web:9003 + gateway |

> ⚠️ Setting Vercel API bases is **on you** (I did not touch Vercel) — see §12 for the exact per-app
> env. trade.baalvion.com is NOT a Vercel app; it runs entirely here (§12). The backend is ready;
> a frontend won't reach it until its built API base matches the table above.

## 1. Service inventory (what runs on the host)

| Stack | Container | Port (internal) | Database |
|-------|-----------|-----------------|----------|
| infra | postgres / redis / redpanda | 5432 / 6379 / 9092 | — (never published) |
| A | auth-service | 3001 | baalvion_db |
| A | rbac-service / audit-service | 3055 / 3032 | baalvion_db (rbac, audit) |
| A | cms-service | 3018 | baalvion_db (cms) |
| A | commerce / inventory / order | 3012 / 3014 / 3013 | baalvion_db |
| A | payment-service (Java) | 3015 | baalvion_db (Flyway, as owner; runtime as baalvion_app) |
| A | auth-gateway | 3099 | — |
| A | notification-service | 3031 | — |
| B | ctm-service | 3017 | **ctm_db** |
| C | proxy-cms-service | 3011 | **proxy_db** |
| C | proxy-payment-service (Java) | 3015 | **proxy_db** (separate Flyway history) |
| C | proxy-service | 4000 | proxy_db |
| D | law-service | 3015 | baalvion_db (`legal`) |
| D | imperialpedia-service | 3004 | baalvion_db (`imperialpedia`) |
| D | trade-service | 3025 | baalvion_db (`trade`) |
| D | gti-web (Next.js, trade.baalvion.com) | 9003 | **gti_db** (Prisma) |
| edge | caddy | **80 / 443** | the only public surface |

> The two `:3015` services (Stack A `payment-service`, Stack D `law-service`) do not collide:
> container ports are per-container, addressed by Docker DNS (`payment-service:3015`, `law-service:3015`).
> First boot now also creates **gti_db** (see `initdb/00-init-databases.sh`).
> One-shot tools (profile `tools`, never auto-start): `cms-migrate`, `cms-register`,
> `cms-seed-law`, `cms-seed-imperialpedia`, `gti-migrate` — see §11/§12.

## 2. Prerequisites (host)

```bash
docker version && docker compose version            # Docker + compose v2
git fetch --tags && git checkout v1.0.1-frontend-hardening   # or the release you build from
git submodule update --init --recursive 2>/dev/null || true  # ensure GTI + trade-service trees exist
# Stack D builds need these source trees present (each has a package.json):
for d in Frontend/Global-Trade-Infrastructure-main Backend/services/commerce/trade-service \
         Frontend/Imperialpedia-main Frontend/Law-Elite-Network-main; do
  test -f "$d/package.json" && echo "OK $d" || echo "MISSING $d — check it out before building"; done
cp deploy/ec2-single-host/.env.production.example deploy/ec2-single-host/.env.production
# …fill every 🔒 in .env.production (openssl rand -hex 32 / -base64 48; generate:keys for RS256)
```

> The host needs **outbound internet** (image pulls + `gti-migrate` fetches the Prisma engines via npx).

## 3. Generate keys

```bash
# Platform RS256 (Stack A) → JWT_PRIVATE_KEY / JWT_PUBLIC_KEY (single-line PEM, literal \n):
pnpm run generate:keys
awk 'NF{printf "%s\\n",$0}' config/keys/private.pem   # → JWT_PRIVATE_KEY
awk 'NF{printf "%s\\n",$0}' config/keys/public.pem    # → JWT_PUBLIC_KEY

# Proxy (Stack C) signs its own customer tokens — keypair mounted read-only:
mkdir -p deploy/ec2-single-host/secrets/keys
#   place baalvion-key-1.key (private) + baalvion-key-1.pub (public) there.
#   Set CMS_JWT_PUBLIC_KEY in .env to the single-line .pub PEM.
```

## 4. First boot

```bash
docker compose -f deploy/ec2-single-host/docker-compose.yml \
  --env-file deploy/ec2-single-host/.env.production up -d --build
# First start runs initdb/00-init-databases.sh ONCE → creates ctm_db, proxy_db, baalvion_app.
docker compose -f deploy/ec2-single-host/docker-compose.yml ps
docker compose -f deploy/ec2-single-host/docker-compose.yml logs -f payment-service auth-service
```

## 5. Post-boot grant pass (Stack A RLS)

After Stack A services have created their schemas, grant the runtime role USAGE on them
(idempotent; re-runnable). Reuses the committed init-roles.sql:

```bash
docker compose -f deploy/ec2-single-host/docker-compose.yml exec -T postgres \
  psql -U baalvion -d baalvion_db \
    -v baalvion_pw="$DB_PASSWORD" -v baalvion_app_pw="$DB_APP_PASSWORD" \
  < deploy/mvp-production/init-roles.sql
docker compose -f deploy/ec2-single-host/docker-compose.yml restart payment-service
```

## 6. Health checks (internal ports)

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'
docker exec auth-service    node -e "require('http').get('http://127.0.0.1:3001/health',r=>process.exit(r.statusCode<500?0:1))"
docker exec auth-gateway    node -e "require('http').get('http://127.0.0.1:3099/health',r=>process.exit(r.statusCode<500?0:1))"
docker exec ctm-service     wget -qO- http://127.0.0.1:3017/health
docker exec proxy-service   wget -qO- http://127.0.0.1:4000/healthz || true
docker exec payment-service wget -qO- http://127.0.0.1:3015/actuator/health        # → "UP"
docker exec proxy-payment-service wget -qO- http://127.0.0.1:3015/actuator/health  # → "UP"
```

## 7. Restart any missing service

```bash
docker compose -f deploy/ec2-single-host/docker-compose.yml \
  --env-file deploy/ec2-single-host/.env.production up -d        # converge to desired state
docker compose -f deploy/ec2-single-host/docker-compose.yml restart <service>
```

## 8. Public routing / TLS (after `api.baalvion.com` A-record → this EIP)

```bash
curl -sSI https://api.baalvion.com | head -1
curl -fsS https://api.baalvion.com/health                                   # gateway
curl -fsS "https://api.baalvion.com/proxy-cms/api/v1/health"                # proxy CMS public
# Stack A CMS public delivery (direct to cms-service; serves about / law / imperialpedia editorial):
curl -fsS "https://api.baalvion.com/api/v1/public/law-elite-network/content?limit=1"
curl -fsS "https://api.baalvion.com/api/v1/public/imperialpedia/content?limit=1"
# Stack D dynamic backends:
curl -fsS "https://api.baalvion.com/law/v1/health" || true                  # law-service
curl -fsS "https://api.baalvion.com/imperialpedia/health" || true           # imperialpedia-service
# trade.baalvion.com (after its A-record → this EIP):
curl -sSI https://trade.baalvion.com | head -1
curl -fsS https://trade.baalvion.com/api/health                             # gti-web (DB-backed)
# /ctm and /proxy require a valid request path/headers for the underlying BFF.
```

## 9. Confirm NO backend port is publicly exposed

```bash
# Only 80/443 should listen on 0.0.0.0. Any backend port here = FAIL.
sudo ss -tlnp | grep -E '0\.0\.0\.0:(5432|6379|9092|3001|3004|3011|3012|3013|3014|3015|3017|3018|3025|3031|3032|3055|3099|4000|9003)' \
  && echo "FAIL: a backend port is public" || echo "OK: no backend port public"
sudo ss -tlnp | grep -E ':(80|443)\b'      # expect caddy only
```

Also set the instance's AWS security group to inbound **80, 443, and 22 (admin CIDR only)** —
nothing else. DB/Redis/Kafka are reachable only inside `baalvion-net`.

## 10. Webhook URLs (set in each provider dashboard, after TLS is live)

| Stack | Razorpay webhook URL |
|-------|----------------------|
| A (storefront) | `https://api.baalvion.com/api/v1/orders/webhooks/razorpay` |
| B (CTM) | `https://api.baalvion.com/ctm/api/v1/payments/webhook` |
| C (Proxy) | `https://api.baalvion.com/proxy/v1/billing/webhook/razorpay` |
| D (Law, if subscriptions enabled) | `https://api.baalvion.com/law/v1/payments/webhook` |

---

## 11. CMS schema + Stack D content seed (one-time, fresh DB)

`cms-service` creates the `cms` **schema** on boot but not its **tables**, and registers no website
tenants. Run this ordered sequence ONCE, from the repo root, after §4 boot is healthy. It is the
single-host adaptation of the proven `deploy/about-baalvion-cms/init-data.sh` flow. All commands
share the env-file/compose prefix:

```bash
CF="-f deploy/ec2-single-host/docker-compose.yml --env-file deploy/ec2-single-host/.env.production"
PSQL="docker compose $CF exec -T postgres psql -U baalvion -d baalvion_db"

# (a) Create the cms tables (Sequelize migrations). Idempotent-safe to re-run.
docker compose $CF --profile tools run --rm cms-migrate

# (b) Bootstrap the super-admin (also prints orgId/userId used to own the sites).
BOOT=$(docker compose $CF exec -T auth-service node scripts/bootstrapSuperAdmin.js); echo "$BOOT"
ORG_ID=$(printf '%s' "$BOOT"  | grep -oE '"orgId":[^,]*"[^"]+"'  | grep -oE '[0-9a-f-]{36}' | head -1)
USER_ID=$(printf '%s' "$BOOT" | grep -oE '"userId":[^,]*"[^"]+"' | grep -oE '[0-9a-f-]{36}' | head -1)
echo "orgId=$ORG_ID userId=$USER_ID"

# (c) Register ALL website tenants (incl. law-elite-network + imperialpedia). Idempotent.
docker compose $CF --profile tools run --rm \
  -e CMS_ORG_ID="$ORG_ID" -e CMS_CREATED_BY="$USER_ID" cms-register

# (d) Resolve the website ids the seeds need.
LAW_WID=$($PSQL -tAc "select id from cms.cms_websites where slug='law-elite-network'" | tr -d '[:space:]')
IMP_WID=$($PSQL -tAc "select id from cms.cms_websites where slug='imperialpedia'"     | tr -d '[:space:]')
echo "law=$LAW_WID imperialpedia=$IMP_WID"

# (e) Seed + publish Law Elite Network editorial content.
docker compose $CF --profile tools run --rm -e LAW_WEBSITE_ID="$LAW_WID" cms-seed-law

# (f) OPTIONAL — promote Imperialpedia's Personal-Finance content into the live CMS.
#     Skip it and imperialpedia.com still renders from its committed snapshot fallback.
docker compose $CF --profile tools run --rm -e IMPERIALPEDIA_WEBSITE_ID="$IMP_WID" cms-seed-imperialpedia

# (g) Publish stragglers (register adds no membership, so seeds can leave drafts) + verify.
$PSQL -c "UPDATE cms.cms_contents c SET status='published', published_at=COALESCE(published_at,now()), updated_at=now() FROM cms.cms_websites w WHERE c.website_id=w.id AND w.slug IN ('law-elite-network','imperialpedia') AND c.status<>'published' AND c.visibility='public';"
for s in law-elite-network imperialpedia; do
  n=$(docker compose $CF exec -T cms-service node -e "fetch('http://localhost:3018/api/v1/public/$s/content?limit=200').then(r=>r.json()).then(j=>console.log((j.data||[]).length)).catch(()=>console.log('ERR'))" | tr -d '[:space:]')
  echo "$s: $n published items"
done
```

> Editorial content is managed from the **admin-platform** console (a Vercel app) after this, pointed
> at `https://api.baalvion.com`. The dynamic backends (`law-service`, `imperialpedia-service`) self-create
> their own schemas (`legal` / `imperialpedia`) and migrate on boot — no step needed here.

---

## 12. trade.baalvion.com (GTI) bring-up + per-frontend Vercel env

GTI runs **entirely on this host** (its own Next server `gti-web` + its own Prisma DB `gti_db`).
Its data tier is `trade-service` (the gateway routes `/api/trade/v1/*` there). First boot ordering is
automatic: `gti-migrate` (Prisma `migrate deploy` → `gti_db`) runs to completion before `gti-web`
starts. Requires outbound internet on the host (npx fetches the Prisma engines).

```bash
CF="-f deploy/ec2-single-host/docker-compose.yml --env-file deploy/ec2-single-host/.env.production"
# gti-migrate runs automatically before gti-web on `up`. To (re)apply on demand — idempotent:
docker compose $CF run --rm gti-migrate
docker compose $CF up -d --build trade-service gti-web
docker compose $CF logs -f gti-migrate gti-web trade-service
# In-app checks:
docker exec gti-web        node -e "require('http').get('http://127.0.0.1:9003/api/health',r=>process.exit(r.statusCode<500?0:1))"
docker exec trade-service  node -e "require('http').get('http://127.0.0.1:3025/health',r=>process.exit(r.statusCode<500?0:1))"
```

> `GATEWAY_SIGNING_SECRET` is shared by `auth-gateway`, `trade-service`, and `gti-web` (one secret) so
> the gateway's signed identity envelope verifies everywhere. GTI login/register/refresh ride
> `/trade-bff/auth/*`, which the Caddy `trade.baalvion.com` vhost forwards to the gateway `/auth/*`.

### Per-frontend Vercel env (set on each Vercel project, then redeploy)

**lawelitenetwork.com** (Law-Elite-Network-main):
```
CMS_PUBLIC_URL=https://api.baalvion.com/api/v1/public
CMS_WEBSITE_SLUG=law-elite-network
NEXT_PUBLIC_API_BASE_URL=https://api.baalvion.com/law/v1
NEXT_PUBLIC_APP_URL=https://lawelitenetwork.com
AUTH_SERVICE_URL=https://api.baalvion.com          # law /api/auth BFF → gateway /auth/*
```

**imperialpedia.com** (Imperialpedia-main):
```
NEXT_PUBLIC_CMS_PUBLIC_URL=https://api.baalvion.com/api/v1/public
NEXT_PUBLIC_CMS_SITE_SLUG=imperialpedia
NEXT_PUBLIC_IMPERIALPEDIA_API_URL=https://api.baalvion.com/imperialpedia/api/v1
```

**trade.baalvion.com** is NOT on Vercel — nothing to set there. Its build args
(`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_APP_URL` = `https://trade.baalvion.com`) are baked by the
`gti-web` image build; auth/data are same-origin via the Caddy edge.
