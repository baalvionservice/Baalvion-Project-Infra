# deploy/ec2-single-host — Baalvion backend on ONE EC2 box

Single-host backend deployment: **all stacks (A storefront/identity, B ControlTheMarket,
C Proxy/BaalvionStack, D Law/Imperialpedia/Trade) on one EC2 instance**, behind one Caddy, with a
self-contained data tier. Frontends are on **Vercel** — this host serves backend/API only, with one
exception: **trade.baalvion.com (GTI)** is a full-stack app served whole from this host.

Assembled by merging the three *verified* per-stack packages
([mvp-production](../mvp-production/), [controlthemarket](../controlthemarket/),
[proxy-baalvionstack](../proxy-baalvionstack/)). Service identity is unchanged; only co-located.

> The committed 3-host design ([MASTER_DEPLOYMENT_COMMANDS.md](../../MASTER_DEPLOYMENT_COMMANDS.md))
> remains the production reference. This package is the operator-chosen single-host variant.

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | 22 long-running services (3 infra + 10 Stack A + 1 B + 3 C + 4 D + Caddy) plus `gti-migrate` (one-shot on `up`) and 4 `tools`-profile one-shots (`cms-migrate`/`cms-register`/`cms-seed-law`/`cms-seed-imperialpedia`). Only Caddy publishes ports. |
| `Caddyfile` | `api.baalvion.com` (path-routed to all BFFs + Stack A CMS public reads + `/law`, `/imperialpedia`) **and** `trade.baalvion.com` (GTI app + its BFFs → gateway). |
| `.env.production.example` | Every variable, grouped by stack (incl. **Stack D — Law / Imperialpedia / Trade**). Copy → `.env.production`, fill 🔒. |
| `initdb/00-init-databases.sh` | First-boot: creates `ctm_db`, `proxy_db`, `gti_db`, and the `baalvion_app` RLS role. |
| `VALIDATION-RUNBOOK.md` | Deploy sequence + health/routing/security validation, **§11 CMS seed**, **§12 trade bring-up + Vercel env**. |
| `secrets/` | proxy-service RS256 keypair mount (gitignored). |

## Deploy (on the host, from repo root)

Images are **built in CI and pulled from Amazon ECR — this host never builds.** The full
pipeline (GitHub Actions → ECR → EC2), IAM policies, and secret names are in
[ECR-CICD.md](ECR-CICD.md). Manual roll on the host:

```bash
cp deploy/ec2-single-host/.env.production.example deploy/ec2-single-host/.env.production   # fill 🔒
#   set IMAGE_PREFIX=<account>.dkr.ecr.<region>.amazonaws.com/baalvion  and  AWS_REGION
bash deploy/ec2-single-host/deploy.sh        # ECR login → pull → up -d --no-build
```

On every push to `main`, [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)
builds + pushes every image to ECR and rolls this host automatically.

Then follow [VALIDATION-RUNBOOK.md](VALIDATION-RUNBOOK.md) §3 (keys), §5 (post-boot grant), §6–9 (verify).

## Key design points

- **Only `:80/:443` are public.** DB / Redis / Kafka / every app stay on `baalvion-net`.
- **De-conflicted names:** Stack C's CMS + Java payment are `proxy-cms-service` / `proxy-payment-service`
  (Stack A keeps `cms-service` / `payment-service`) so Docker DNS is unambiguous.
- **One Postgres, three databases** (`baalvion_db` / `ctm_db` / `proxy_db`) — the two Java
  payment-services run Flyway on separate databases, so histories never collide.
- **Local Postgres = no TLS:** `DB_SSL=disable`, empty `DB_JDBC_PARAMS`. Requiring SSL here breaks boot.
- **Centralized SSO kept:** B & C verify against Stack A's JWKS at `http://auth-service:3001` (internal).

## Stack D — Law / Imperialpedia / Trade (now packaged here)

The three domains that MASTER §11 called "build-ready but not deployable" are wired into this package:

- **lawelitenetwork.com** — CMS editorial content from Stack A `cms-service` (slug `law-elite-network`,
  served at `/api/v1/public`) + the dynamic **`law-service`** backend (`baalvion_db`/schema `legal`,
  reached at `/law/v1`). Register + seed its CMS site via §11.
- **imperialpedia.com** — CMS articles (slug `imperialpedia`) + the **`imperialpedia-service`** entity
  backend (`baalvion_db`/schema `imperialpedia`, reached at `/imperialpedia/api/v1`). Falls back to its
  committed content snapshot if the CMS isn't seeded.
- **trade.baalvion.com** — the full **GTI** app runs here: `gti-web` (Next standalone) + its own Prisma
  store `gti_db` + the `trade-service` data tier. Auth is central SSO via the gateway; the `/trade-bff`
  and `/finance-bff` proxies are terminated at the Caddy edge. See §12.

All three preserve centralized SSO (RS256, one issuer) and add **no** new public ports — everything
still rides Caddy on `:80/:443`. Frontends for law/imperialpedia stay on Vercel (env in §12); GTI is
self-hosted on `trade.baalvion.com`.
