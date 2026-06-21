# GitHub Release — Baalvion MVP Production Release

## Release title
```
Baalvion MVP Production Release — v1.0.0-mvp
```

## Tag
```
v1.0.0-mvp   (target: main)
```

## Release description (paste into GitHub release body)

```markdown
## Baalvion MVP Production Release

First production-ready deployment of the Baalvion platform. Scope is the **critical
revenue path**: registration, login, CMS publishing, product management, order
creation, and Razorpay payments on AWS.

### Deployment infrastructure
- `deploy/mvp-production/` — `docker-compose.yml` (env-driven, zero embedded secrets),
  `Caddyfile` TLS ingress, `.env.production.example` (all secrets blank), `init-roles.sql`
  RDS bootstrap, `redis.conf`, `RUNBOOK.md`, `MVP-DEPLOYMENT-ANALYSIS.md`.

### Frontend production builds
- Next.js `output: 'standalone'` for about-baalvion, Imperialpedia, Law-Elite-Network, GTI.
- New production Dockerfiles + `.dockerignore` for GTI, Imperialpedia, Proxy-BaalvionStack,
  about-baalvion, admin-platform; nginx SPA template for Proxy-BaalvionStack.

### Services included
Infra: PostgreSQL 16, Redis 7, Redpanda, Caddy.
auth-service · auth-gateway · rbac-service · audit-service · cms-service · commerce-service ·
inventory-service · order-service · payment-service (Java) · notification-service ·
admin-platform · about-web · amarise-web.

### Services deferred (stubbed / fail-open)
ledger · session-service · media-service · dashboards · ControlTheMarket · analytics · OAuth.

### Security
- In-schema PostgreSQL RLS (non-superuser `baalvion_app` runtime role).
- RS256 JWT centralized issuer; Razorpay webhook HMAC verification.
- All secrets injected at deploy time from AWS Secrets Manager — none in source.
- Pre-tag audit: no `.env`, AWS, Razorpay, PayU, or private-key material committed.

**Full notes:** see `RELEASE_NOTES.md`. **Baseline:** see `DEPLOYMENT_BASELINE.md`.
**Runbook:** `deploy/mvp-production/RUNBOOK.md`.
```

## CLI to create the release (after the tag is pushed)

```bash
gh release create v1.0.0-mvp \
  --title "Baalvion MVP Production Release — v1.0.0-mvp" \
  --notes-file GITHUB_RELEASE.md \
  --target main \
  --latest
```

> Note: `--notes-file GITHUB_RELEASE.md` includes this whole file. To publish only the
> description block above, copy it into a separate `notes.md` and pass that instead, or
> use `--notes "<inline>"`. Do not attach build artifacts that contain secrets.
