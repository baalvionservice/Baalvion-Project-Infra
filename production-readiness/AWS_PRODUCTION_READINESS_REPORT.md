# AWS Production Readiness Audit — Baalvion Monorepo

**Date:** 2026-06-03 · **Auditor:** Senior DevOps/Cloud Architect (evidence-based)
**Scope:** Containerization, ECS/EKS readiness, migrations, secrets, edge/networking, observability, CI/CD
**Deployment standard (per `production-readiness/RUNTIME_CONFLICT_AUDIT.md`):** Docker-first → ECS/EKS
**Method:** AUDIT ONLY — no code modified. All findings cite `file:line`.

---

## Executive Summary

The platform is **further along than a typical pre-prod monorepo**: it already has a real CI/CD pipeline with OIDC, Trivy/gosec/CodeQL scanning, GitHub Container Registry pushes, GitOps deploy via ArgoCD with a us-east canary and Argo Rollouts blue/green, plus a production-shaped Helm chart (`Backend/infra/helm/baalvion-service`) with non-root securityContext, liveness/readiness probes, HPA and PDB. The Go gateway and the Java financial suite are exemplary containers (distroless/non-root, multi-stage, HPA 3→50).

However, the **Node service fleet — which is the bulk of the platform — is not yet production-grade as containers**, and there is a **structural gap between the Helm contract and the actual images**. The most serious issues are: (1) Node Dockerfiles run as **root** with **no HEALTHCHECK**, yet the Helm chart asserts `runAsNonRoot: true` (pods will `CreateContainerError`); (2) **8 backend services and 13 of 15 frontends have no Dockerfile at all**; (3) **graceful SIGTERM shutdown is absent from ~28 Node services** (and the shared `@baalvion/graceful-shutdown` package is adopted by **zero** services) — ECS/EKS rolling deploys will drop in-flight requests; (4) **Next.js `NEXT_PUBLIC_*` are passed as runtime `environment`, not build args** — client bundles will silently ship wrong/empty API URLs; (5) the **`migrate` job is a raw `node:20-alpine` with a bind-mounted SQL directory and a hardcoded DB password** — not portable to an ECS task / init container.

None of these are research problems — the patterns to fix them already exist *inside this repo* (the Java/Go Dockerfiles, the Helm chart, the `@baalvion/graceful-shutdown`/`@baalvion/logger` packages). This is a **finishing/rollout job**, not a design job.

## Overall Risk: **HIGH**

Not deployable to AWS as-is for the Node fleet (root images vs non-root Helm = hard boot failure; no SIGTERM = lossy deploys; baked-wrong frontend env = broken UIs). The *path* is low-risk because the reference implementations are in-repo. With the P0 items closed this drops to MEDIUM.

---

## Findings Table

| # | Area | Finding | Risk | Remediation | Effort |
|---|------|---------|------|-------------|--------|
| 1 | Dockerfiles | Node service Dockerfiles run as **root** (no `USER`); only gateway/Java/ml-service set a non-root user | **HIGH** | Add non-root `USER` to the shared Node final stage; matches Helm `runAsNonRoot` | S |
| 2 | Dockerfiles | **No `HEALTHCHECK`** in 30 of 33 Dockerfiles (only ledger/payment/ml) | MED | Add `HEALTHCHECK` hitting `/healthz`; ECS uses it, EKS uses probes | S |
| 3 | Coverage | **8 backend services have no Dockerfile**: agent, auth-gateway, audit, developer, report, search, platform/realtime, tenant | **HIGH** | Copy the standard turbo-prune Dockerfile per service | M |
| 4 | Coverage | **13 of 15 frontends have no Dockerfile** (only admin-platform, Law-Elite) | **HIGH** | Add the Next standalone Dockerfile pattern per app | M |
| 5 | Base images | Base images pinned by **tag** (`node:20-alpine`, `turbo@2.9.14`) not by **digest** | LOW | Pin `node:20-alpine@sha256:…`; Trivy already gates | S |
| 6 | Graceful shutdown | **~28 Node services lack SIGTERM handling**; `@baalvion/graceful-shutdown` adopted by **0** services | **HIGH** | Wire the existing package (drain server + close pg/redis) into every `index.js` | M |
| 7 | NEXT_PUBLIC | admin-platform compose passes `NEXT_PUBLIC_*` as runtime `environment`, **not build `args`** — Next bakes these at build → client gets stale defaults | **HIGH** | Move to `build.args` + `ARG`/`ENV` in Dockerfile; per-env image builds | M |
| 8 | Frontend build | admin-platform Dockerfile uses `npm ci` + `package-lock.json*` in an isolated context — repo is **pnpm**, `@baalvion/*` workspace deps won't resolve from that context | MED | Use the monorepo turbo-prune pattern at repo-root context (as backends do) | M |
| 9 | Migrations | `migrate` job is raw `node:20-alpine` + **bind-mounted** `./Backend/database/migrations` — no host FS on ECS/Fargate | **HIGH** | Bake migrations into an image (or init container); run as one-shot ECS task / Job | S |
| 10 | Migrations | `migrate.js` is transactional + idempotent (tracking table + checksum) ✅ but has **no advisory lock** | LOW | Add `pg_advisory_lock` so concurrent runners can't race | S |
| 11 | Secrets | `DB_PASSWORD=baalvion_dev_pass` hardcoded across ~30 compose services **and** as `migrate.js` fallback | MED (dev) / **HIGH** if reused | Source from AWS Secrets Manager; never carry the dev fallback to prod | S |
| 12 | Secrets | App secrets correctly `${VAR}`-interpolated (JWT_ACCESS_SECRET, RAZORPAY_KEY_SECRET, INTERNAL_*) ✅ | LOW | Map each to a Secrets Manager entry via task-def `secrets:` | S |
| 13 | Config | `appConfig.js` uses dotenv + `requireEnv('JWT_PUBLIC_KEY')` fail-fast ✅ but many `|| 'localhost'` / `|| ''` fallbacks | MED | Make prod-critical vars fail-fast; empty-string fallbacks mask misconfig | S |
| 14 | Edge/TLS | Traefik is the in-repo edge with HTTPS redirect + `websecure` ✅, but **ACME/TLS is commented out**; no ALB/CloudFront/Route53/WAF | **HIGH** | On AWS: ALB(+ACM cert) or keep Traefik on EKS + cert-manager; add CloudFront + WAF + Route53 | M |
| 15 | Networking | Backends correctly have **no public entrypoint** (Traefik-only ingress) ✅ | LOW | Mirror with private subnets + SG-only ALB→service | — |
| 16 | Autoscaling | Gateway HPA 3→50 ✅; generic Helm chart has HPA/PDB ✅; **no HPA wired for the Node fleet** | MED | Provide per-service `values.yaml` with HPA/requests/limits | M |
| 17 | Observability | Prometheus/Grafana present; Helm sets `prometheus.io/scrape` annotations ✅ — but **no `/metrics` endpoint found in Node services** | MED | Wire `@baalvion/telemetry`/prom-client `/metrics`; confirm scrape targets | M |
| 18 | Logging | Node services log via raw `console.*` (→ stdout, OK for CloudWatch) but **unstructured**; `@baalvion/logger` adopted by **0** services | MED | Adopt `@baalvion/logger` (JSON to stdout) for CloudWatch/structured queries | M |
| 19 | Health endpoints | `/health`+`/healthz` (liveness) and `/readyz` (real DB check) present and **path-aligned to Helm probes** ✅ | LOW | Keep; ensure `/readyz` also checks Redis where it's a hard dep | — |
| 20 | CI/CD | Mature: OIDC, Trivy/gosec/tfsec/CodeQL, kustomize+kubeconform validation, GHCR push, ArgoCD GitOps, us-east canary, Argo Rollouts blue/green, SHA tags ✅ | LOW | Expand `build-push` matrix beyond gateway+proxy to the full fleet | M |
| 21 | CI/CD gap | `platform-cicd.yml` build matrix builds **only 2 images** (gateway, proxy-backend); `deploy-staging.yml` covers 15 via SSH `docker compose` (not ECS/EKS) | MED | Extend the build/push matrix to all services; converge staging onto the same GitOps path | M |
| 22 | Stateless | Services are stateless (state in Postgres/Redis) ✅; reconciliation worker (BullMQ) runs in-process in order-service — must be a single replica or use a distributed lock | MED | Run schedulers as a separate single-replica deploy or guard with a lock | S |

**Severity counts:** CRITICAL 0 · HIGH 9 · MED 9 · LOW 4

---

## Per-Area Detail (with evidence)

### 1. Dockerfiles

**Backend Node pattern (good bones, root user).** The standard backend Dockerfile is monorepo-aware and multi-stage with `turbo prune --docker`, `pnpm install --frozen-lockfile --filter`, then `pnpm deploy --prod`, and uses `dumb-init` as PID 1 — all good:
- `Backend/services/commerce/order-service/Dockerfile:8-27` (pruner→installer→final, `dumb-init`, `CMD ["node","index.js"]`)
- Identical pattern: `Backend/services/identity/auth-service/Dockerfile:8-27`, `Backend/services/platform/admin-service/Dockerfile:8-27`

**Problem — runs as root.** None of these set `USER`. Only 3 backend Dockerfiles have a `USER` directive: `Backend/gateway/Dockerfile:16` (`USER nonroot:nonroot`, distroless), `Backend/services/commerce/financial-services-java/Dockerfile:27-28` (`useradd app; USER app`), and `Backend/services/knowledge/ml-service/Dockerfile`. This directly conflicts with the Helm chart's `securityContext: { runAsNonRoot: true }` (`Backend/infra/helm/baalvion-service/templates/deployment.yaml:18`) — **the kubelet will refuse to start a root image**, so these images cannot run under the existing chart.

**Problem — no HEALTHCHECK.** Only `ledger-service`, `payment-service`, `ml-service` Dockerfiles contain `HEALTHCHECK` (grep over all `Dockerfile*`). ECS task health checks read this; EKS reads probes (covered by Helm), so add it for ECS parity.

**Exemplars to copy from:**
- Go: `Backend/gateway/Dockerfile:1-17` — distroless static, non-root, `-ldflags="-s -w"`, multi-stage.
- Java: `Backend/services/commerce/financial-services-java/Dockerfile:8-33` — Maven reactor build, JRE runtime, non-root UID 10001 matching k8s `runAsUser`, container-aware JVM flags.

**Frontend.** admin-platform uses the canonical Next standalone pattern with a non-root `nextjs` user (`Frontend/admin-platform/Dockerfile:20-30`) — but builds with `npm ci` in an **isolated context** (`COPY package.json package-lock.json* ./`, line 6), which won't resolve `@baalvion/*` workspace deps and is inconsistent with the pnpm monorepo. Law-Elite's frontend Dockerfile correctly threads `ARG NEXT_PUBLIC_*` build args (`Frontend/Law-Elite-Network-main/Dockerfile:17-18`) — use it as the frontend reference.

**.dockerignore.** Root `.dockerignore` is sensible (excludes `node_modules`, `.next`, `.env*`, `Frontend`, `*.md`) — `.dockerignore:1-18`. Note it excludes `Frontend` and `*.md` at the **repo-root** context; that's fine for backend builds but frontends must build from their own context (which they do).

**Coverage gaps (no Dockerfile):**
- Backend: `agent-service`, `identity/auth-gateway`, `infrastructure/audit-service`, `infrastructure/developer-service`, `infrastructure/report-service`, `infrastructure/search-service`, `platform/realtime-service`, `platform/tenant-service`.
- Frontend (13/15): AmariseMaisonAvenue-main, Baalvion-Jobs-Portal-main, "For Invstors and Founders", Global-Trade-Infrastructure-main, IR-Baalvion-main, Imperialpedia-main, Mining.Baalvion-main, Proxy-BaalvionStack, about-baalvion-main, brand-connector-main, company-unified-Dashboard-main, controlthemarket-main, insiders-seo.

### 2. ECS/EKS Readiness

- **Health/readiness:** strong. `order-service` exposes `/health`+`/healthz` (liveness) and `/readyz` with a real DB check, explicitly aligned to the Helm probe paths (`Backend/services/commerce/order-service/index.js:23-25`). Helm probes point at `/readyz` and `/healthz` (`Backend/infra/helm/baalvion-service/values.yaml:37-38`).
- **Graceful shutdown:** weak. Only ~14 files reference `SIGTERM`/`server.close` (grep), and the shared `@baalvion/graceful-shutdown` package (`Backend/packages/graceful-shutdown`) is imported by **0 services**. The entire commerce + identity + platform fleet (order, auth, admin, rbac, session, oauth, commerce, payment, etc.) has **no SIGTERM handler** — on a rolling deploy ECS/EKS sends SIGTERM, the process dies immediately, and in-flight requests/DB txns are dropped.
- **Stateless:** yes — state lives in Postgres/Redis. Caveat: order-service starts an in-process BullMQ reconciliation worker (`index.js:51`, hourly cron in `appConfig.js:82-87`); running N replicas runs the sweep N× unless guarded. Run schedulers as a dedicated single replica or add a distributed lock.
- **K8s/Helm present:** generic chart `Backend/infra/helm/baalvion-service/` (deployment + service-hpa-pdb templates, `runAsNonRoot`, `seccompProfile: RuntimeDefault`, resources requests/limits 100m/256Mi → 1cpu/1Gi). Gateway has its own Helm + raw k8s (`Backend/gateway/deploy/{helm,k8s}/`, HPA `minReplicas:3 maxReplicas:50 @65% CPU`). Java suite has Helm too. Kustomize overlays referenced by CI (`Backend/infra/k8s/overlays/*`). **EKS scaffolding exists; the Node fleet just isn't wired to it.**

### 3. Migration-on-Deploy

- Mechanism: compose `migrate` service — `image: node:20-alpine`, `command: ["node","migrate.js","up"]`, `working_dir: /migrations`, **bind mount** `./Backend/database/migrations:/migrations`, `depends_on: postgres service_healthy`, `restart: "no"`, profile `migrate` (`docker-compose.yml:1414-1435`).
- `migrate.js` is **safe & idempotent**: tracking table `public.schema_migrations` with `CREATE TABLE IF NOT EXISTS`, applies only un-applied files, each migration in `BEGIN/COMMIT` with `ROLLBACK` on error, checksum recorded (`Backend/database/migrations/migrate.js:24-37, 62-92`). Good for an ECS one-shot task or an init container — **except** it relies on a bind-mounted directory and a raw base image. On Fargate there is no host FS.
- Fix: build a small migration image (`COPY` the SQL + `migrate.js`) and run it as a one-shot ECS RunTask / EKS Job before the service deploy, or an init container. Add `pg_advisory_lock` to prevent two runners racing.
- Secret smell: `DB_PASSWORD=baalvion_dev_pass` in the job env (`docker-compose.yml:1424`) and as the `migrate.js` fallback (`migrate.js:13`).

### 4. Secrets

- Loader: `appConfig.js` uses `dotenv.config({ override: true })` and `require('@baalvion/auth-node').requireEnv('JWT_PUBLIC_KEY')` (fail-fast on the public key) — `Backend/services/commerce/order-service/config/appConfig.js:6,18`. The comment explicitly notes "in production no .env is shipped (env comes from Secrets Manager)" (line 5) — the intent is correct.
- **Hardcoded dev DB password** repeated across ~30 compose services (`docker-compose.yml:79,111,154,188,…,1424`) and as `migrate.js` fallback. Acceptable for local, but it must never be the AWS value and the fallback should not exist in any prod path.
- App secrets are correctly env-interpolated and **not committed**: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `INTERNAL_SERVICE_SECRET`, `INTERNAL_API_KEY`, `RAZORPAY_KEY_SECRET` all `${VAR}` (`docker-compose.yml:86,265,335,413,476`).
- Many config fields fall back to empty string / localhost (`appConfig.js:28,34,46,55,65`) which **masks misconfiguration** rather than failing fast.
- **AWS recommendation:** create one Secrets Manager secret per logical group (db creds, jwt keypair, internal service secret, payment keys). In ECS task defs use `secrets:` (valueFrom ARN) → injected as env; in EKS use the Secrets Store CSI driver or External Secrets Operator. Rotate the dev fallback values; they should be considered burned.

### 5. NEXT_PUBLIC_* Build Args

- Next.js inlines `NEXT_PUBLIC_*` into the client bundle **at build time**. admin-platform reads them at module scope (`Frontend/admin-platform/src/lib/api/client.ts:8,12-16` and `next.config.ts:24,27`).
- **Bug:** the compose `admin-platform` service passes them as **runtime `environment:`** with **no `build.args`** (`docker-compose.yml:428-445`). At runtime Next has already baked the *default* values (`https://api.baalvion.com/...`), so the localhost overrides are ignored — and any single prod image cannot serve multiple environments.
- The correct pattern is already in-repo: `Frontend/Law-Elite-Network-main/Dockerfile:17-18` declares `ARG NEXT_PUBLIC_*`. 
- **Fix:** pass `NEXT_PUBLIC_*` via `build.args` + `ARG`/`ENV` in the Dockerfile and produce **per-environment image builds** (or move purely-runtime config to server-side rewrites — `next.config.ts:17-29` already proxies `/api/proxy/*` server-side, which is the right escape hatch for values that must be runtime).

### 6. Networking / ALB / CloudFront / Route53 / SSL / WAF

- Today: **Traefik v3.1** is the single public ingress (`Backend/infra/api-gateway/traefik.yml`): `web:80` redirects to `websecure:443`, file provider with `watch`, dashboard `insecure: false`. Backends have no public entrypoint (defense-in-depth, documented at top of `traefik.yml`). The root compose has **zero** Traefik router labels — routing lives in `dynamic.yml` (file provider).
- **Missing for AWS:** ACME/TLS is **commented out** (`traefik.yml:19-26`) — there is no working cert issuance. No ALB, CloudFront, Route53, or WAF anywhere in the repo.
- **Recommendation:**
  - **EKS path (matches existing Helm/ArgoCD):** AWS Load Balancer Controller → ALB Ingress with an ACM cert; cert-manager if you keep Traefik; Route53 alias to the ALB; AWS WAF web ACL on the ALB; CloudFront in front for the frontends/static + edge caching + WAF.
  - **ECS path:** ALB (HTTPS listener, ACM cert) → target groups per service; CloudFront → ALB; Route53; WAF on ALB and/or CloudFront.
  - Either way, terminate TLS at ALB/CloudFront (not Traefik) on AWS, or run Traefik behind the ALB only if you specifically want its routing/middleware.

### 7. Autoscaling, Monitoring, Logging

- **Autoscaling:** gateway HPA `3→50 @65% CPU / 75% mem` (`Backend/gateway/deploy/k8s/hpa.yaml:10-20`); generic chart ships HPA + PDB (`templates/service-hpa-pdb.yaml`). The Node fleet has no per-service HPA values yet.
- **Monitoring:** Prometheus + Grafana run in compose (per RUNTIME_CONFLICT_AUDIT.md) and the Helm chart emits `prometheus.io/scrape`/`path` annotations (`deployment.yaml:16`). **But no `/metrics` endpoint was found in the Node services** and `@baalvion/telemetry` is not wired in — so scraping currently has nothing to read for those pods.
- **Logging:** Node services log with raw `console.log`/`console.error` (`order-service/index.js:51,53,56`). This goes to stdout (✅ CloudWatch/awslogs/Fluent Bit will capture it) but is **unstructured**. The repo has `@baalvion/logger` — adopted by **0 services**. Adopt it for JSON logs to enable CloudWatch Logs Insights / structured queries.

### 8. Rollback + Blue/Green + CI/CD

- **Strong.** `platform-cicd.yml`: OIDC (`id-token: write`), backend+gateway tests, gosec→SARIF, **IaC validation** (kustomize build + kubeconform + tfsec), then `build-push` (only on `main`) to **GHCR** tagged `:${sha}` and `:latest` with **Trivy CRITICAL/HIGH scan**, then a **GitOps `deploy`** job that bumps the `us-east` overlay `newTag` and commits so **ArgoCD auto-syncs**; comment notes promotion to other regions is a gated `workflow_dispatch` after canary SLOs hold 30m, **blue/green via Argo Rollouts** (`.github/workflows/platform-cicd.yml:64-114`).
- `deploy-staging.yml`: builds 15 service images with `docker/metadata-action` (`type=sha,prefix=staging-`), pushes to GHCR, then SSH `docker compose pull && up -d` + curl `/health` smoke checks (`.github/workflows/deploy-staging.yml:51-93`).
- **Gaps:** (a) the `build-push` matrix in platform-cicd only builds **gateway + proxy-backend** (`:71-73`) — the rest of the fleet is not built/pushed by the prod pipeline; (b) staging deploys via **SSH+compose**, not ECS/EKS — two divergent deploy mechanisms; converge on the GitOps path; (c) image **rollback** is implicit via ArgoCD (revert the tag commit) + Argo Rollouts — document the one-command rollback runbook.
- **Image tagging:** SHA-based (immutable) ✅ — correct for rollback.

---

## Prioritized Remediation Roadmap

### P0 — Blockers (must fix before any AWS Node-fleet deploy)

1. **Non-root Node images.** Add to the shared backend final stage (after `COPY --from=installer /out ./`):
   ```dockerfile
   RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
   USER app
   ```
   Apply to every backend Dockerfile (they're near-identical) so images satisfy Helm `runAsNonRoot:true`. *(Effort S, repo-wide sed-able.)*
2. **Graceful shutdown everywhere.** Wire the existing `@baalvion/graceful-shutdown` into every service `index.js` (trap SIGTERM/SIGINT → stop accepting, drain, close pg pool + redis, exit). Without this, every rolling deploy is lossy. *(Effort M.)*
3. **Fix Next.js build-time env.** Convert frontend Dockerfiles to accept `ARG NEXT_PUBLIC_*` (copy `Frontend/Law-Elite-Network-main/Dockerfile`); pass via `build.args`; produce per-env images. Stop passing `NEXT_PUBLIC_*` as runtime `environment` in compose. *(Effort M.)*
4. **Containerize the migrate job for ECS.** Bake SQL + `migrate.js` into an image; run as a one-shot ECS RunTask / EKS Job (or init container) before service rollout; source `DB_PASSWORD` from Secrets Manager; add `pg_advisory_lock`. *(Effort S.)*
5. **TLS at the edge.** Wire ACM cert + ALB/CloudFront (or enable Traefik ACME) — there is currently **no working cert issuance** for prod. *(Effort M.)*

### P1 — High (close before GA / wider traffic)

6. **Dockerfile coverage.** Add the standard turbo-prune Dockerfile to the 8 backend services missing one; add the Next standalone Dockerfile to the 13 frontends missing one. *(Effort M.)*
7. **HEALTHCHECK + ECS health.** Add `HEALTHCHECK CMD wget -qO- http://localhost:$PORT/healthz` to all Dockerfiles for ECS parity. *(Effort S.)*
8. **Secrets Manager wiring.** One secret group per concern (db, jwt keypair, internal secret, payment keys); ECS `secrets: valueFrom`, or External Secrets / CSI on EKS. Rotate all dev fallback values. Remove empty-string config fallbacks for prod-critical vars (fail fast). *(Effort M.)*
9. **CI build matrix.** Extend `platform-cicd.yml build-push` from 2 images to the full fleet; converge staging onto the GitOps/EKS path instead of SSH+compose. *(Effort M.)*
10. **WAF + CloudFront + Route53.** Add WAF web ACL, CloudFront distribution for frontends, Route53 records. *(Effort M.)*

### P2 — Medium (operability)

11. **Structured logging.** Adopt `@baalvion/logger` (JSON → stdout) fleet-wide for CloudWatch Logs Insights. *(Effort M.)*
12. **/metrics + scrape.** Wire `@baalvion/telemetry`/prom-client `/metrics` so the Prometheus annotations actually scrape something; create per-service HPA values. *(Effort M.)*
13. **Scheduler isolation.** Run the order-service reconciliation worker (and any BullMQ schedulers) as a single-replica deployment or behind a distributed lock so HPA replicas don't multiply cron runs. *(Effort S.)*
14. **Monorepo-correct frontend build.** Switch admin-platform off `npm ci` to the repo-root turbo-prune pattern so `@baalvion/*` deps resolve. *(Effort M.)*

### P3 — Low (hardening)

15. **Pin base images by digest** (`node:20-alpine@sha256:…`, `turbo@2.9.14` already pinned). *(Effort S.)*
16. **`/readyz` should also check Redis** where Redis is a hard dependency (streams/cache). *(Effort S.)*
17. **Document one-command rollback** (ArgoCD tag revert + Argo Rollouts abort) in a runbook. *(Effort S.)*

---

## Bottom Line

The **platform-level** production engineering (CI/CD, GitOps, Helm, Go/Java containers) is genuinely strong. The risk is concentrated in **finishing the Node fleet**: make the images non-root, give every service SIGTERM handling, fix the frontend build-time env, make migrations container-portable, and put real TLS/WAF at the edge. Every fix has an in-repo reference implementation, so this is a disciplined rollout — estimate **~1–2 focused engineering weeks** to clear P0+P1.
