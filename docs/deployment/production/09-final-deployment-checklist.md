# 09 · Final Production Deployment Checklist

The authoritative pre-deploy gate, reflecting all remediation (Priority 1–3). Every box must be
checked before a production push. References: [04 env+secrets](04-environment-and-secrets.md),
[05 runbooks](05-runbooks.md), [07 risks](07-risks-and-readiness.md),
[08 dependency map](08-service-dependency-map.md).

## A. Build & architecture (x86_64)
- [ ] Images built **`linux/amd64`** (matches CI `ubuntu-latest`; **not** ARM — see [03](03-sizing-and-cost.md)).
- [ ] `baalvion-backend:prod-<sha>` + `baalvion-payments:prod-<sha>` pushed to ECR, **tagged by git sha**.
- [ ] Host is x86 (`t3.large` 2/8 default); EBS ≥50 GB for the 6.6 GB image.

## B. Secrets & env (preflight-enforced)
- [ ] `.env` materialised from Secrets Manager; **the container preflight passes** (`preflight-env.js`
      blocks missing/placeholder vars — 31 required + an email provider).
- [ ] All `[SECRET]`s ≥32 chars, none in git/images/compose (gitleaks + `deploy/consolidated/.gitignore`).
- [ ] **R1:** `JWT_PUBLIC_KEY` is a real PEM **or a path** (auth-node now normalizes both) — verify a
      cross-service authed call returns 200, not 401.
- [ ] `SUPERADMIN_PASSWORD` strong + rotated after bootstrap (not `BaalvionDryRun!2026`).
- [ ] `INVENTORY_INTERNAL_KEY`, `GATEWAY_SIGNING_SECRET`, `INTERNAL_SERVICE_SECRET`,
      `BILLING_SIGNING_SECRET`, `RBAC_INTERNAL_API_KEY`, `AUDIT_INTERNAL_KEY`, `CART_SESSION_SECRET`,
      `METRICS_SECRET`, `CMS_SECRETS_KEY`, `PROVIDER_SECRET_KEY`, `FINANCE_WEBHOOK_SECRET` all set.

## C. Inter-service discovery (consolidated container DNS)
- [ ] All `app-<container>:<port>` URLs set ([08](08-service-dependency-map.md)): `AUTH_SERVICE_URL`,
      `JWKS_URI`, `RBAC_BASE_URL` (=`:3053`), `CMS_BASE_URL`/`CMS_INTERNAL_URL`, `NOTIFICATION_BASE_URL`,
      `SVC_PAYMENT`, + the auth-gateway `SVC_*` BFF targets.
- [ ] **`CMS_BASE_URL` is a DNS name, not localhost** (order-service's prod guard rejects a localhost CMS URL).
- [ ] External-facing URLs set: `FRONTEND_URL`, `API_BASE_URL`, `OAUTH_PUBLIC_BASE_URL`, `AUTH_UI_URL`,
      `STOREFRONT_URL`, `PAYU_RETURN_URL`, `CORS_ORIGINS`.
- [ ] `FINANCE_ENABLED=false` (full Java finance reactor not in this stack) unless deploying it too.

## D. Data layer
- [ ] RDS Multi-AZ; `DB_SSL=true`; app user has `CREATE`.
- [ ] **Run `sql/payments-bootstrap.sql` as the RDS master BEFORE app-payments** (creates `postgres`
      owner role + membership + `baalvion_app`) — else the JVM crash-loops (R12). Set `baalvion_app`
      password from Secrets Manager.
- [ ] Neo4j provisioned + reachable (`NEO4J_PASSWORD` set) — app-trade hard-exits without it.
- [ ] Pre-deploy manual RDS snapshot taken.
- [ ] One-shot seed: superadmin bootstrapped; cms `db:migrate`; **only real** websites registered
      (NO demo seeders / `seedAboutBaalvion.cjs`).

## E. Dry-run-only config absent from production
- [ ] `DEPLOY_PROFILE` ≠ `dryrun`; `NODE_TLS_REJECT_UNAUTHORIZED=0` **absent**; `PSP_MOCK=false`.
- [ ] SMTP = **Amazon SES** (587 STARTTLS) — not Mailpit/MailHog; no self-signed cert.
- [ ] `docker-compose.dryrun.yml`, `dryrun-keys/`, dev `.env` **not** deployed (gitignored).
      (The preflight hard-fails on any of these in a non-dryrun profile.)

## F. Edge, security, monitoring
- [ ] Caddy issued TLS for every host; DNS A/ALIAS resolve.
- [ ] **R9:** Caddy edge-deny rules cover the JVM's sensitive paths (since `APP_SECURITY_ENABLED=false`).
- [ ] Security groups least-privilege (RDS 5432 from EC2 SG only; SSH via SSM).
- [ ] CloudWatch logs + retention; alarms wired (host, RDS, edge 5xx, queues, JVM heap, Kafka lag,
      cert expiry, SES bounces); synthetic checks on auth/api/admin.

## G. Payments
- [ ] Real payment-provider keys loaded (`PSP_MOCK=false`); Kafka/MSK reachable for the JVM.
- [ ] Razorpay webhook idempotency is **durable** (order-service unique index + ctm status-check) —
      already in place; optional ctm `SELECT FOR UPDATE` hardening ticketed.

## H. Post-deploy smoke (must pass)
- [ ] 6/6 Node app containers healthy + app-payments `UP` (`/actuator/health`).
- [ ] 42/42 processes `online` (`pm2 jlist`); cross-container connectivity matrix green.
- [ ] Auth login 200 (RS256) · CMS public 200 · payment `POST /initiate` 201 · 1 SES email delivered.

## Accepted-risk sign-offs
- [ ] Single-host SPOF (R8) accepted for MVP; ECS HA path documented.
- [ ] Search degraded without OpenSearch (R6) accepted, or OpenSearch provisioned.
- [ ] 6.6 GB image (R7) accepted for first deploy; multi-stage `--prod` slim-down ticketed.
- [ ] ARM/Graviton cost optimization (buildx) deferred — x86 is the determined target.
