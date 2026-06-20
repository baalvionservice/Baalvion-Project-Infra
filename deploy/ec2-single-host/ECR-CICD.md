# CI/CD — GitHub Actions → Amazon ECR → EC2 (single-host)

Production pipeline for the single-host stack. **All images are built in GitHub Actions and
pushed to Amazon ECR. EC2 only pulls and runs — it never builds.**

```
                build (turbo prune, multi-stage)        pull + up -d --no-build
 git push  ─▶  GitHub Actions  ───────────────▶  Amazon ECR  ───────────────▶  EC2 (Docker Compose)
   main         .github/workflows/deploy.yml      baalvion/<svc>:<sha>          deploy/ec2-single-host/
                                                  baalvion/<svc>:prod-latest    deploy.sh
```

| Component | File |
|-----------|------|
| Build + push + roll | [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) |
| Runtime stack (no `build:` keys — pull only) | [`docker-compose.yml`](docker-compose.yml) |
| Host roll script (ECR login → pull → up -d) | [`deploy.sh`](deploy.sh) |
| Host environment (gitignored) | `.env.production` (from [`.env.production.example`](.env.production.example)) |

---

## 1. Image & tag strategy

- **One ECR repo per image:** `<account>.dkr.ecr.<region>.amazonaws.com/baalvion/<service>`
  (ECR supports the `baalvion/...` namespace — this matches `IMAGE_PREFIX` on the host).
- **Every build pushes four tags:**
  - `prod-latest` — the moving "latest production" pointer (`IMAGE_TAG` default in the compose).
  - `latest` — conventional moving pointer (alias of the newest build).
  - `<commit-sha>` — immutable, for reproducible rollbacks.
  - `v1.0.1-production` — immutable release pointer (the `RELEASE_TAG` repo Variable; bump on each release).
- CI rolls the EC2 host to the **exact commit SHA** (immutable deploy); `prod-latest` is kept
  current so a manual `deploy.sh` with no argument still pulls the newest build. Pin a release on the
  host by setting `IMAGE_TAG=v1.0.1-production` in `.env.production`.
- The workflow auto-creates each ECR repo on first push (`scanOnPush=true`, tags `MUTABLE`).

**Rollback:** `bash deploy/ec2-single-host/deploy.sh <older-sha>` on the host (or re-run the
workflow via *Run workflow* with `image_tag = <older-sha>`).

---

## 2. Exact secret names

### GitHub → repo (or `production` environment) **Secrets**

| Secret | Purpose |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | CI push user — ECR push. *(omit if you use the OIDC path below)* |
| `AWS_SECRET_ACCESS_KEY` | CI push user secret. *(omit for OIDC)* |
| `EC2_HOST` | EC2 public IP / DNS. **If unset, images still build + push; the roll is skipped.** |
| `EC2_USER` | SSH user (e.g. `ubuntu`). |
| `EC2_SSH_KEY` | Private key (PEM) for SSH to the host. |
| `AWS_DEPLOY_ROLE_ARN` | *(OIDC only)* IAM role the workflow assumes — no static keys. |

### GitHub → repo **Variables** (non-secret, optional)

| Variable | Default |
|----------|---------|
| `AWS_REGION` | `ap-south-1` |
| `RELEASE_TAG` | `v1.0.1-production` |
| `TRADE_PUBLIC_URL` | `https://trade.baalvion.com` |
| `TRADE_API_BASE_URL` | `https://api.baalvion.com/api/v1/commerce/trade/v1` |

> No secrets live in the repo. The EC2 host's `.env.production` is gitignored and injected
> on the box only. The host needs **no AWS keys** — it uses its IAM instance role (§4).

---

## 3. IAM — least privilege

### A) CI push (the GitHub Actions identity)

Static-key user **or** OIDC role. Attach this policy (replace `<account>` / `<region>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EcrAuth",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "EcrPushAndCreate",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage",
        "ecr:BatchGetImage",
        "ecr:DescribeRepositories",
        "ecr:CreateRepository",
        "ecr:TagResource"
      ],
      "Resource": "arn:aws:ecr:<region>:<account>:repository/baalvion/*"
    }
  ]
}
```

Drop `ecr:CreateRepository` + `ecr:TagResource` once all repos exist if you want it even tighter.

**OIDC trust policy** (for `AWS_DEPLOY_ROLE_ARN` — preferred, no long-lived keys):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": { "token.actions.githubusercontent.com:sub": "repo:<owner>/<repo>:ref:refs/heads/main" }
    }
  }]
}
```
OIDC is **auto-preferred**: `deploy.yml` selects keyless OIDC whenever the `AWS_DEPLOY_ROLE_ARN`
secret is set, and only falls back to the static `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` when it
is not. To migrate, just add `AWS_DEPLOY_ROLE_ARN` and delete the two static-key secrets — no workflow
edit needed (`permissions: id-token: write` is already set).

### B) EC2 pull (the instance role) — **read-only**

Attach an instance profile with this policy so the host pulls without any stored credentials:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "ecr:GetAuthorizationToken", "Resource": "*" },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "arn:aws:ecr:<region>:<account>:repository/baalvion/*"
    }
  ]
}
```
(Equivalent to the AWS-managed `AmazonEC2ContainerRegistryReadOnly`, scoped to `baalvion/*`.)

---

## 4. EC2 host — one-time setup

```bash
# Ubuntu host
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip && unzip awscliv2.zip && sudo ./aws/install
sudo usermod -aG docker "$USER"   # re-login after this

sudo mkdir -p /opt/baalvion && sudo chown "$USER" /opt/baalvion
git clone <repo-url> /opt/baalvion
cd /opt/baalvion

cp deploy/ec2-single-host/.env.production.example deploy/ec2-single-host/.env.production
#   → fill every 🔒, and set:
#        IMAGE_PREFIX=<account>.dkr.ecr.ap-south-1.amazonaws.com/baalvion
#        IMAGE_TAG=prod-latest
#        AWS_REGION=ap-south-1
#   → generate the proxy RS256 keypair into deploy/ec2-single-host/secrets/keys/ (runbook §3)
```

Attach the **read-only ECR instance role** (§3B) to the EC2 instance. Verify:

```bash
aws sts get-caller-identity      # should show the instance role, no keys configured
bash deploy/ec2-single-host/deploy.sh   # first manual roll
```

---

## 5. Deployment flow (every push to `main`)

1. **Checkout** the repo in GitHub Actions.
2. **Configure AWS credentials** (static keys, or OIDC role assume).
3. **Login to ECR** (`amazon-ecr-login`).
4. **Ensure repo exists** → **build** each image (repo-root context, `turbo prune`, multi-stage)
   → **tag** `<sha>` + `prod-latest` → **push** to ECR. Runs as a parallel matrix (19 images).
5. **SSH into EC2** (`production` environment — add required reviewers for manual approval).
6. **Run `deploy.sh <sha>`** on the host: `git pull` → ECR login (instance role) →
   `docker compose pull` → `up -d --no-build --remove-orphans` → image prune.
7. **Smoke test** the public ingress (`/health` endpoints) — non-blocking.

If `EC2_HOST` is not set, steps 1–4 still run (images land in ECR); the roll is skipped with a notice.

---

## 6. Guardrails

- **EC2 never builds:** `docker-compose.yml` has zero `build:` keys; `deploy.sh` uses `up -d --no-build`.
- **No secrets in code:** all from GitHub Secrets / the host's gitignored `.env.production` / IAM roles.
- **Least privilege:** CI gets push-only; the host gets read-only; both scoped to `baalvion/*`.
- **Immutable rollbacks:** every build is addressable by commit SHA.
