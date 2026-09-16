# Deploying Baalvion Stack to the VPS

Two pieces on the box, matching how `canwemarry` and `amarise-web` are already deployed.

## 1. Build the image (on the VPS, from the repo root)

```sh
docker build -f Frontend/baalvion-stack/Dockerfile -t baalvion-stack-web:local .
```

The catalogue, navigation, sitemap and JSON-LD are all generated from `@baalvion/sites` at BUILD
time and baked into static HTML. Registering a new product therefore means rebuilding this image —
that is the intended trade for having one source of truth and no runtime drift.

## 2. Service, appended to `/opt/baalvion/stack/docker-compose.app.yml`

```yaml
  app-stack-web:
    image: baalvion-stack-web:local
    pull_policy: never
    restart: unless-stopped
    env_file:
      - path: .env
        required: false
    environment:
      NODE_ENV: production
      PORT: "3072"
      HOSTNAME: 0.0.0.0
    mem_limit: 512m
    mem_reservation: 128m
    healthcheck:
      test: ["CMD","node","-e","require('http').get({host:'127.0.0.1',port:3072,path:'/'},r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"]
      interval: 30s
      timeout: 8s
      retries: 5
      start_period: 45s
```

## 3. Caddy block, appended to `/opt/baalvion/stack/caddy/Caddyfile`

```caddyfile
# Baalvion Stack — the public product index (baalvionstack.com).
# proxy.baalvionstack.com is NOT served here: it stays on Vercel via its own CNAME, so this
# block deliberately names only the apex and www.
baalvionstack.com, www.baalvionstack.com {
	encode gzip zstd
	reverse_proxy app-stack-web:3072
}
```

Then:

```sh
docker compose -f docker-compose.data.yml -f docker-compose.app.yml -f docker-compose.caddylive.yml up -d app-stack-web
docker exec baalvion-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker exec baalvion-caddy-1 caddy reload  --config /etc/caddy/Caddyfile --adapter caddyfile
```

## 4. The prerequisite nobody can skip

`baalvionstack.com` currently resolves to Cloudflare and **times out** — Cloudflare has no working
origin behind it. Until the DNS record for the apex (and `www`) points at this box, Caddy cannot
complete its ACME HTTP-01 challenge and the site is unreachable no matter what runs here.

Verify the origin independently of DNS with:

```sh
curl -sS -o /dev/null -w '%{http_code}\n' --resolve baalvionstack.com:443:<VPS_IP> https://baalvionstack.com
```

Do NOT touch the `proxy.baalvionstack.com` record — it is a CNAME to Vercel and serves a different
product.
