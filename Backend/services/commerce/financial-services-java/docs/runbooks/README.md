<div align="center">

<img src="assets/banner.svg" alt="Financial Runbooks — Baalvion Platform" width="100%">

<br/>
<br/>

**Operational procedures for the Baalvion financial platform. Audience: on-call / SRE / platform engineers.**

<p>
  <img alt="Runbooks" src="https://img.shields.io/badge/Ops-Runbooks-38BDF8?style=for-the-badge">
  <img alt="Prometheus" src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white">
  <img alt="Grafana" src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
</p>

</div>

---

Architecture context is in [../adr/](../adr/) and `INTEGRATION_SUMMARY.md`.

## Runbooks

| Runbook | When to use |
|---------|-------------|
| [deployment.md](deployment.md) | Deploying, promoting, and rolling back a release |
| [incident-response.md](incident-response.md) | An alert fired (see `deploy/observability/prometheus-alerts.yml`) |
| [dlq-replay.md](dlq-replay.md) | Dead-letter messages present; replay or discard |
| [backup-restore.md](backup-restore.md) | Backups, point-in-time restore, restore validation |
| [failover.md](failover.md) | DB / Kafka / Redis / region failover |

## Service map (ports / schemas)

account 3016 `accounts` · ledger 3014 `ledger` · payment 3015 `payments` · escrow 3017 `escrow` ·
settlement 3018 `settlement` · reconciliation 3019 `reconciliation` · audit 3020 `audit` ·
reporting 3024 `reporting` · risk 3035 `risk`. All share one PostgreSQL database (`baalvion`),
isolated by schema + RLS, each with its own Flyway history table `flyway_history_<svc>`.

## Health & metrics

- Liveness: `GET /actuator/health/liveness` · Readiness: `GET /actuator/health/readiness`
- Metrics: `GET /actuator/prometheus` (Micrometer) — dashboard `deploy/observability/grafana-financial-overview.json`

---

<div align="center">
<sub>Part of the <a href="../../../../../../README.md">Baalvion Platform</a> · centralized identity · domain-driven monorepo</sub>
</div>
