# Baalvion — Global Infrastructure Architecture

```
                          ┌──────────────────────────────┐
   Customers ───DNS───▶   │  GeoDNS / Anycast (Route53 /  │   (infra/mesh/global-lb.md)
   (proxy + dashboard)    │  Global Accelerator + Shield) │
                          └───────────────┬──────────────┘
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                              ▼
     ┌────────────┐                ┌────────────┐                 ┌────────────┐
     │ us-east-1  │  active-active │ eu-west-1  │   active-active │ ap-south-1 │ … (6 regions)
     │  EDGE NLB  │                │  EDGE NLB  │                 │  EDGE NLB  │
     └─────┬──────┘                └─────┬──────┘                 └─────┬──────┘
           ▼ (baalvion-edge ns, NO mesh) │                              │
   ┌───────────────┐                     │                              │
   │ gateway pods  │ HPA 3→150 (cpu/mem/ │  (Go: HTTP-CONNECT + SOCKS5) │
   │  (Go)         │  active_connections)│                              │
   └──┬─────────┬──┘                     │                              │
      │         │ Redis (regional, sessions/quota/usage:events stream)  │
      │         ▼                                                        
      │   ┌──────────────┐   reads quota:block, publishes provider:state 
      │   │ Redis HA     │◀──────────────────────────────────────────────
      │   │ (Sentinel)   │
      │   └──────────────┘
      ▼ upstream (real providers: Bright Data/Oxylabs/SOAX/Smartproxy/IPRoyal)
   Internet destinations

   CONTROL PLANE (baalvion ns, Istio STRICT mTLS, primary us-east + eu replica)
   ┌──────────────┐   ┌──────────────┐   ┌─────────────────────────────────┐
   │ api (Node)   │   │ workers      │   │ CloudNativePG (1+2 sync, PITR)  │
   │ HPA 3→30     │   │ metering+    │   │  + TimescaleDB (usage hypertbl) │
   │ JWT/billing/ │   │ billing      │   │  + PgBouncer poolers (rw/ro)    │
   │ admin/dev API│   └──────┬───────┘   └─────────────────────────────────┘
   └──────┬───────┘          │ consumes usage:events → TimescaleDB + ClickHouse
          │                  ▼
          │           ┌──────────────┐   ┌──────────────┐
          └──────────▶│ ClickHouse   │   │ Observability│ Prometheus+Grafana+
                      │ (IP/provider │   │ (own ns)     │ Loki+Tempo+Alertmgr+
                      │  analytics)  │   │ OTel Collector│ kube-prometheus-stack
                      └──────────────┘   └──────────────┘
```

## Layers
- **Edge (`baalvion-edge`)** — Go gateways only, per region, on **spot** nodes,
  behind NLBs, **outside the mesh** (they're forward proxies). HPA on
  `active_connections`. `infra/k8s/base/gateway.yaml` + overlays.
- **Control plane (`baalvion`)** — Node `api` + `workers`, Istio **STRICT mTLS**,
  zero-trust NetworkPolicies, on-demand nodes. Primary in us-east, EU replica for
  GDPR. `api.yaml`, `workers.yaml`.
- **Data** — Postgres (CloudNativePG, sync replicas, PITR) + TimescaleDB (same
  cluster) + Redis HA (Sentinel) + ClickHouse (analytics). `infra/database/`.
- **Observability (`observability`)** — single OTLP ingest (OTel Collector) →
  Prometheus (metrics) + Loki (logs) + Tempo (traces); SLOs (Pyrra) + multi-burn
  alerts → Alertmanager → PagerDuty/Slack. `infra/observability/`, `infra/sre/`.

## Multi-region model
Active-active edge; control-plane primary + cross-region warm replica. Routing by
GeoDNS/Anycast with health-check failover (RTO ≤ 5 min DNS). Customer/session data
stays in-region (regional Redis); billing truth is the primary Postgres + S3.

## Delivery
GitOps via **ArgoCD app-of-apps** (`infra/gitops/`) reconciling each region's
overlay; **GitHub Actions** (`.github/workflows/platform-cicd.yml`) does
lint/test/gosec/Trivy/kubeconform/tfsec → build → push → staged GitOps bump
(us-east canary → gated promotion).

## Security & compliance
mTLS (mesh) · zero-trust NetworkPolicies · External Secrets/Vault + rotation ·
SSRF guard (gateway) + NetworkPolicy egress denylist (defense in depth) ·
append-only audit/billing logs · encryption at rest (EBS/RDS/S3 KMS) + in transit ·
GDPR data residency (eu-west) · SOC2 foundations (audit trails, access RBAC, change
mgmt via GitOps PRs).

## How it maps to the app (Prompts 1–6)
1 auth/tenant · 2 API-key/developer · 3 Go gateway · 4 metering/billing ·
5 provider orchestration · **6 = this: the platform that runs all of it at scale.**
```
