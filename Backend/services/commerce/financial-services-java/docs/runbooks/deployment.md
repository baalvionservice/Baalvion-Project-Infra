# Runbook — Deployment, Promotion & Rollback

## Pipeline (CI/CD)
The active CI workflow `.github/workflows/financial-services.yml` runs:
build → `mvn verify` (Testcontainers) → Trivy FS scan → per-service image build → Trivy image
scan. It pushes to **no registry** (no GHCR). The deployed payment-service image is built +
pushed to **Amazon ECR** (`baalvion/payment-service`, build-arg `SERVICE=payment-service`) by the
canonical pipeline `.github/workflows/deploy.yml`.

## Deploy (Helm)
```
# staging
helm upgrade --install financial deploy/helm/baalvion-financial \
  -f deploy/helm/baalvion-financial/values.yaml \
  -f deploy/helm/baalvion-financial/values-staging.yaml \
  --set image.tag=<git-sha> -n financial --create-namespace

# production (pin an immutable tag/digest)
helm upgrade --install financial deploy/helm/baalvion-financial \
  -f deploy/helm/baalvion-financial/values.yaml \
  -f deploy/helm/baalvion-financial/values-prod.yaml \
  --set image.tag=<release-tag> -n financial
```
Migrations: Flyway runs automatically on each service at startup against its own schema +
`flyway_history_<svc>` table. `ddl-auto=validate` — the app fails fast if the schema and entities
disagree (a migration was missed).

## Pre-deploy checks
1. `helm template ... | kubectl apply --dry-run=server -f -` passes.
2. New Flyway migrations are additive/backward-compatible (see backup-restore.md before any
   destructive change).
3. `APP_SECURITY_ENABLED=true` and `OAUTH_*` set for non-dev (zero-trust — ADR 0002).

## Verify after rollout
```
kubectl -n financial rollout status deploy/<service>
kubectl -n financial get pods -l app=<service>          # all Ready
curl -fsS http://<service>:<port>/actuator/health/readiness
```
Grafana "Baalvion Financial — Overview": error ratio ~baseline, no OPEN circuit breakers,
`outbox_pending` draining, `dlt_messages_dead` == 0.

## Rollback
```
helm history financial -n financial
helm rollback financial <previous-revision> -n financial
kubectl -n financial rollout status deploy/<service>
```
Rollback is safe for code; **DB migrations are forward-only** — never auto-roll-back a schema.
If a release shipped a bad migration, roll back the deployment to the previous image (which still
validates against the new schema if the migration was additive) and ship a corrective migration.
Plan destructive migrations as expand/contract across two releases.
