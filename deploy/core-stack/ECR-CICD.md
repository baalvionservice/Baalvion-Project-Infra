# CI/CD — Core stack: GitHub Actions → Amazon ECR → EC2

Pipeline for the reduced **3-service core** (auth + cms + payment). Its own workflow + its own
`core-*` ECR repos + its own host, fully decoupled from the full `deploy/ec2-single-host` pipeline.
**All images build in GitHub Actions and push to Amazon ECR. The host only pulls and runs.**

```
              build (turbo prune / Maven)            pull + up -d --no-build
 dispatch ─▶ GitHub Actions ──────────────▶ Amazon ECR ──────────────▶ EC2 (Docker Compose)
   or push   deploy-core-stack.yml          baalvion/core-<svc>:<sha>   deploy/core-stack/
   to main                                  baalvion/core-<svc>:prod-latest  deploy.sh
```

| Component | File |
|-----------|------|
| Build + push + roll | [`.github/workflows/deploy-core-stack.yml`](../../.github/workflows/deploy-core-stack.yml) |
| Runtime + local stack | [`docker-compose.prod.yml`](docker-compose.prod.yml) (host uses `--no-build`) |
| Host roll script | [`deploy.sh`](deploy.sh) |
| Host environment (gitignored) | `.env.production` (from [`.env.production.example`](.env.production.example)) |
| First-time DB init | [`init-data.sh`](init-data.sh) |

---

## 1. Images & tags

Four ECR repos, namespace `baalvion`:

| ECR repo | Built from | Notes |
|----------|-----------|-------|
| `baalvion/core-auth-service`    | `identity/auth-service/Dockerfile` | RS256 mint + JWKS |
| `baalvion/core-cms-service`     | `knowledge/cms-service/Dockerfile` | delivery + admin + vault |
| `baalvion/core-payment-service` | `commerce/financial-services-java/Dockerfile` (`SERVICE=payment-service`) | Java PSP |
| `baalvion/core-cms-tools`       | `knowledge/cms-service/Dockerfile` (target `installer`) | migrations + register (tools profile) |

Every build pushes four tags: `prod-latest`, `latest`, `<commit-sha>` (immutable rollback),
and `RELEASE_TAG` (`v1.0.1-production` by default). CI rolls the host to the exact SHA;
`prod-latest` stays current so a bare `deploy.sh` still pulls the newest build. Repos auto-create
on first push (`scanOnPush=true`, `MUTABLE` tags). Builds share the GHA cache scopes `cms` /
`payjava` with `deploy.yml`, so they're mostly cache hits.

**Rollback:** `bash deploy/core-stack/deploy.sh <older-sha>` on the host, or re-run the workflow
via *Run workflow* with `image_tag = <older-sha>`.

## 2. Triggers

- **`workflow_dispatch`** — operator-initiated (optional `image_tag`). Runs against whatever branch
  you pick, so you can deploy from `feat/core-stack-deploy` before it merges.
- **push to `main`** touching `deploy/core-stack/**` or the workflow — auto build + roll on config
  changes. Unrelated main pushes do NOT trigger this (the full pipeline owns those).

## 3. Exact GitHub secrets / variables

### Secrets (repo or `production` environment)

| Secret | Purpose |
|--------|---------|
| `AWS_DEPLOY_ROLE_ARN` | IAM role the workflow assumes via OIDC (keyless ECR push). |
| `CORE_EC2_HOST` | Core host public IP / DNS. **If unset, images still build + push; the roll is skipped.** |
| `CORE_EC2_USER` | SSH user (e.g. `ubuntu`). |
| `CORE_EC2_SSH_KEY` | Private key (PEM) for SSH to the core host. |

> These are SEPARATE from the `EC2_*` secrets the full single-host pipeline uses — the core stack
> runs on its own box (Caddy needs sole ownership of :80/:443). `AWS_DEPLOY_ROLE_ARN` is shared.

### Variables (non-secret, optional)

| Variable | Default |
|----------|---------|
| `AWS_REGION` | `ap-south-1` |
| `RELEASE_TAG` | `v1.0.1-production` |
| `CORE_DEPLOY_PATH` | `/opt/baalvion-core` (repo clone path on the host) |
| `CORE_DOMAIN_API` | `api.baalvion.com` (smoke test only) |
| `CORE_DOMAIN_CMS` | `cms.baalvion.com` (smoke test only) |

## 4. IAM — least privilege

**CI push (OIDC role `AWS_DEPLOY_ROLE_ARN`)** — push + create scoped to `baalvion/*` (same policy
as the full pipeline; see [`../ec2-single-host/ECR-CICD.md`](../ec2-single-host/ECR-CICD.md) §3A
for the JSON and the OIDC trust policy — use `repo:<owner>/<repo>:*` if you dispatch from branches).

**EC2 pull (instance role)** — read-only ECR scoped to `baalvion/*` (AWS-managed
`AmazonEC2ContainerRegistryReadOnly` works). No AWS keys on the host.

## 5. Core host — one-time setup

```bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip && unzip awscliv2.zip && sudo ./aws/install
sudo usermod -aG docker "$USER"   # re-login after this

sudo mkdir -p /opt/baalvion-core && sudo chown "$USER" /opt/baalvion-core
git clone <repo-url> /opt/baalvion-core && cd /opt/baalvion-core

cp deploy/core-stack/.env.production.example deploy/core-stack/.env.production
#   → fill every __CHANGE_ME__; set IMAGE_PREFIX=<acct>.dkr.ecr.<region>.amazonaws.com/baalvion
#   → generate the RS256 keypair (npm run generate-keys) and paste single-line PEMs
```

Attach the **read-only ECR instance role**, then first roll + init:

```bash
aws sts get-caller-identity                       # shows the instance role, no keys
bash deploy/core-stack/deploy.sh                  # first manual roll (pulls prod-latest)
# First-time DB init (fresh DB only): the tools image must be present, so pull it once:
docker compose -f deploy/core-stack/docker-compose.prod.yml \
  --env-file deploy/core-stack/.env.production --profile tools pull cms-migrate
CORE_ENV_FILE=deploy/core-stack/.env.production bash deploy/core-stack/init-data.sh
```

## 6. Guardrails

- **Host never builds:** `deploy.sh` uses `docker compose pull` + `up -d --no-build`.
- **No secrets in code:** GitHub Secrets / the host's gitignored `.env.production` / IAM roles only.
- **Least privilege:** CI push-only, host read-only — both scoped to `baalvion/*`.
- **Immutable rollbacks:** every build is addressable by commit SHA.
- **Decoupled:** `core-*` repos + a separate host mean this never collides with the full pipeline.
