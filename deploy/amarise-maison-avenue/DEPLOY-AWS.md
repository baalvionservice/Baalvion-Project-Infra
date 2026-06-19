# Deploy Amarisé Maison Avenue to AWS (all-in-one EC2)

A single EC2 host runs the **entire** storefront + backend behind Caddy (automatic TLS).
Everything is in `deploy/amarise-maison-avenue/`. Total time: ~30–45 min.

```
            Internet (443)
                 │
            ┌────▼────┐   amarisemaisonavenue.com
            │  Caddy  │   (TLS, Let's Encrypt, HTTP→HTTPS)
            └────┬────┘
   ┌───────┬─────┼───────────┬──────────────┐
   │  /    │/svc/commerce  /svc/order   /svc/cms · /svc/inventory
   ▼       ▼               ▼            ▼
  web   commerce-service  order-service  cms-service · inventory-service
 (Next)      │                │             │
             └──────── postgres · redis · auth-service ───────┘   (internal only)
```

Browser hits one origin; Caddy strips the `/svc/<x>` prefix so each service sees its native `/api/v1`.
`/auth-bff/*` is rewritten by Next to the internal auth-service (HttpOnly refresh cookie stays first-party).

---

## 1. Prerequisites
- AWS account + an SSH keypair.
- Control of DNS for **amarisemaisonavenue.com**.
- The repo reachable from the box (Git URL or a deploy key).
- ~30 min. Have your payment provider account ready (keys can come at go-live — see `GO-LIVE.md`).

## 2. Launch the EC2 instance
- **AMI:** Ubuntu Server 24.04 LTS (x86_64).
- **Type:** `t3.large` (2 vCPU / 8 GB) — the stack runs ~8 services + Postgres. `t3.xlarge` for headroom; `t3.medium` works for a soft launch but watch memory.
- **Storage:** 30 GB gp3.
- **Elastic IP:** allocate one and associate it (stable IP for DNS).
- **Security group (inbound):** TCP 22 (your IP only), 80 (0.0.0.0/0), 443 (0.0.0.0/0). Nothing else — Postgres/Redis stay internal.

## 3. DNS
Point both records at the Elastic IP, then wait for propagation:
```
A   amarisemaisonavenue.com       → <ELASTIC_IP>
A   www.amarisemaisonavenue.com   → <ELASTIC_IP>
```
```bash
dig +short amarisemaisonavenue.com        # must return your Elastic IP before TLS will issue
```

## 4. Host setup
```bash
ssh ubuntu@<ELASTIC_IP>
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin git
sudo usermod -aG docker ubuntu && newgrp docker
sudo systemctl enable --now docker
sudo mkdir -p /opt/amarise && sudo chown "$USER" /opt/amarise
git clone <REPO_URL> /opt/amarise && cd /opt/amarise
```

## 5. Secrets
```bash
cd /opt/amarise
cp deploy/amarise-maison-avenue/.env.prod.example deploy/amarise-maison-avenue/.env.prod

# Generate the RS256 keypair for identity tokens:
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /tmp/jwt.key
openssl rsa -in /tmp/jwt.key -pubout -out /tmp/jwt.pub
echo "JWT_PRIVATE_KEY:"; awk 'NF {printf "%s\\n", $0}' /tmp/jwt.key; echo
echo "JWT_PUBLIC_KEY:";  awk 'NF {printf "%s\\n", $0}' /tmp/jwt.pub; echo
# Random secrets:
for k in POSTGRES_PASSWORD INTERNAL_SERVICE_SECRET CMS_SECRETS_KEY; do echo "$k=$(openssl rand -hex 32)"; done

nano deploy/amarise-maison-avenue/.env.prod   # fill EVERY __CHANGE_ME__ (set DB_PASSWORD = POSTGRES_PASSWORD)
rm -f /tmp/jwt.key /tmp/jwt.pub
```
Leave `PAYMENTS_MOCK=true` for now (storefront launches; checkout switches to real charges at go-live).

## 6. Build & bring up the stack
Run from the repo root. First build is ~5–10 min (builds all service + frontend images).
```bash
export CF="--env-file deploy/amarise-maison-avenue/.env.prod -f deploy/amarise-maison-avenue/docker-compose.prod.yml"
docker compose $CF up -d --build
docker compose $CF ps          # wait until postgres/auth/cms/commerce/order/web show healthy
```
Caddy will obtain TLS certs automatically once DNS resolves (watch `docker compose $CF logs -f caddy`).

## 7. Initialize the database + seed content (ONE time, fresh DB only)
```bash
bash deploy/amarise-maison-avenue/init-data.sh
```
This runs: auth migrations → cms/commerce/inventory/order migrations → super-admin bootstrap →
product-catalog seed → CMS content seed+publish → verify (prints non-zero CMS + product counts).

## 8. Smoke test
```bash
curl -sI https://amarisemaisonavenue.com | head -5                               # 200 + valid TLS
curl -s "https://amarisemaisonavenue.com/svc/commerce/api/v1/health" | head -c 80; echo
curl -s "https://amarisemaisonavenue.com/svc/cms/api/v1/public/amarise-maison-avenue/content/homepage" -o /dev/null -w '%{http_code}\n'   # 200
# Catalog through the storefront base the browser uses:
curl -s "https://amarisemaisonavenue.com/svc/commerce/api/v1/commerce/storefront/$(grep NEXT_PUBLIC_STORE_ID deploy/amarise-maison-avenue/.env.prod | cut -d= -f2)/products?limit=2" -o /dev/null -w '%{http_code}\n'
```
Then open `https://amarisemaisonavenue.com` — hero, collections, a product grid (branded
placeholder photos), authenticity, testimonials, press; `/us/press` and `/us/about` render.

## 9. Go live with payments + photos
Follow **`GO-LIVE.md`**: add payment keys (admin vault / env), set `PAYMENTS_MOCK=false`, register
the webhook, upload real product/editorial photos from the admin, then run a real test order.

## 10. Operate
```bash
docker compose $CF logs -f order-service          # tail a service
git pull && docker compose $CF up -d --build      # deploy an update (rebuilds changed images)
docker compose $CF exec -T postgres pg_dump -U baalvion baalvion_db | gzip > ~/db-$(date +%F).sql.gz   # backup DB
# Also snapshot the caddy_data volume (holds TLS certs) and pgdata.
```

## 11. Production hardening (post-launch backlog)
- **Managed data:** move Postgres → RDS (`DB_HOST`, `DB_SSL=true`) and Redis → ElastiCache.
- **Non-superuser DB role:** services currently connect as the DB owner (bypasses RLS). After
  verifying per-service tenant isolation, point `DB_USER` at a non-superuser `baalvion_app` role.
- **Edge:** put the EC2 behind an ALB + AWS WAF; lower `RATE_LIMIT_IP_MAX` once a WAF fronts it.
- **Media:** serve product/editorial photos from S3 + CloudFront; set `NEXT_PUBLIC_MEDIA_HOST` to the
  CDN host and rebuild `web`.
- **Email:** wire AWS SES (`SMTP_*`, `EMAIL_FROM`) for password-reset + order-confirmation mail.
- **Backups:** schedule automated `pg_dump` + volume snapshots; test a restore.
- **Secrets:** move `.env.prod` values into AWS SSM Parameter Store / Secrets Manager.
```
