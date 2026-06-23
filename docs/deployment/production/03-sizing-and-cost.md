# 03 · Sizing & Cost

All memory figures below are **measured** from the local dry-run (`docker stats --no-stream`,
idle, no data/load) unless marked. The fleet idled at **~4.0 GiB**.

## 6. Per-container CPU & memory recommendations

| Container | Measured idle | `mem_reservation` | `mem_limit` | CPU guidance | Rationale |
|---|---:|---:|---:|---|---|
| app-identity | **723 MiB** | 512m | **1024m** | burst; bcrypt spikes on login | was 723/768 = **94%** in dry-run → raised cap |
| app-commerce | 460 MiB | 640m | 1280m | burst | BullMQ + media + order/trade workers |
| app-trade | 422 MiB | 512m | 1024m | burst | Neo4j pool + saga/outbox workers |
| app-ecosystem | 634 MiB | 768m | 1536m | burst | 10 modules incl. jobs (ES client) |
| app-platform | 613 MiB | 768m | 1536m | burst | 10 modules incl. cms/law media |
| app-edge-realtime | 251 MiB | 448m | 896m | burst; websockets | proxy/jobs can cross 300 MB under load |
| app-payments (JVM) | 402 MiB | 512m | 768m | burst; cold start | `-Xmx512m`, MaxRAMPercentage 70 |
| redis | 8 MiB | 96m | 320m | minimal | `maxmemory 256mb noeviction` |
| neo4j | 525 MiB | 384m | 768m | minimal | heap 384m + pagecache 128m |
| kafka + zookeeper | ~600 MiB (est) | — | 768m + 384m | minimal | `payments` profile only |
| caddy | ~40 MiB | 32m | 96m | minimal | TLS edge |

**Per-process guardrails (already in the pm2 configs, unchanged):** each Node process has
`--max-old-space-size` and a pm2 `max_memory_restart` ceiling, so one leaking module restarts
without taking down its siblings.

**CPU policy:** on a 2-vCPU `t3.large` do **not** hard-pin CPU per container — the fleet is
near-idle and relies on burst credits; hard limits would starve login/JVM spikes. On a 4-vCPU
`t3.xlarge` (10x) you may pin `cpus:` for the JVM and the worker-heavy BFFs to isolate them.

## 7. EC2 sizing — from the measured 4 GB idle

| Footprint | Value |
|---|---|
| Measured idle, Node-only (6 apps + redis + neo4j + caddy) | **~3.5 GiB** |
| Measured idle, full stack (+ payments JVM) | **~4.0 GiB** |
| + Kafka/Zookeeper (payments profile, est.) | **~4.6 GiB** |
| Realistic prod **peak** under load (watch-list: proxy/jobs/JVM + data) | **~5.5–6.5 GiB** |

**Recommendation: `t3.large` (x86_64, 2 vCPU / 8 GB).** 4.0 GiB idle leaves ~2 GiB headroom for
load; peak ~6 GiB still fits 8 GB with margin. **x86_64 is the determined target** — it matches the
existing CI (`ubuntu-latest`), every current ECR image, and the live `ec2-single-host` deployment;
the image builds `linux/amd64`. ARM/Graviton (`t4g.large`, ~15–20% cheaper) is a documented future
optimization that requires adding a `docker buildx` multi-arch pipeline — out of scope for this push.

| Scenario | Instance | Why |
|---|---|---|
| **Current (recommended)** | `t3.large` 2/8 | 4 GiB idle + headroom; absorbs login/JVM bursts on credits |
| If CPU-tight (42 procs + JVM exhaust credits) | `t3.xlarge` 4/16 | double vCPU + RAM headroom |
| Cost floor (no JVM yet) | `t3.large` 2/8 | ~3.5 GiB still wants 8 GB |

> The single-process merge (Model A, ~2 GB → `t3.small`) remains the documented RAM lever but
> requires ~42 entrypoint edits — **out of scope** (no code changes). See
> [docs/deployment/02-resource-audit.md §5](../02-resource-audit.md).

## 15. Cost estimates (ap-south-1, USD/mo)

### Current (1×) — single host, recommended HA on RDS

| Item | Spec | On-demand | 1-yr Savings/RI |
|---|---|---:|---:|
| EC2 | t3.large 2/8 (x86_64) | ~$61 | ~$38 |
| EBS | 50 GB gp3 | ~$4 | ~$4 |
| RDS | db.t3.small **Single-AZ** + 20 GB | ~$28 | ~$22 |
| Redis / Neo4j / Kafka | on-box | $0 | $0 |
| ECR + S3 + egress | low | ~$8 | ~$8 |
| SES | <50k emails | ~$1 | ~$1 |
| **Total (single-AZ DB)** | | **~$102** | **~$73** |
| ▸ upgrade RDS to **Multi-AZ** (recommended for prod) | db.t3.small Multi-AZ | +~$28 | +~$22 |
| **Total (Multi-AZ DB)** | | **~$130** | **~$95** |

> x86 (`t3`) runs ~15–20% above the ARM (`t4g`) figures an earlier draft used. RDS instance arch is
> independent of the app image — ARM RDS (`db.t4g.small`) is a valid ~$2/mo saver if preferred.

### 10× traffic — vertical + start offloading

| Item | Spec | On-demand |
|---|---|---:|
| EC2 | t3.xlarge 4/16 (x86_64) | ~$121 |
| EBS | 100 GB gp3 | ~$8 |
| RDS | db.m6i.large Multi-AZ + 100 GB | ~$280 |
| ElastiCache | cache.t3.small | ~$25 |
| MSK (or keep on-box Kafka) | msk.t3.small ×2 / on-box | ~$0–150 |
| S3 + ECR + egress | moderate | ~$30 |
| SES | ~500k emails | ~$50 |
| CloudWatch | logs/metrics/alarms | ~$25 |
| **Total** | | **~$550–700** |

### 100× traffic — horizontal / HA (ECS or multi-EC2)

| Item | Spec | On-demand |
|---|---|---:|
| Compute | ECS Fargate or 3–5 EC2 (autoscaled), per-service tasks | ~$900–1,600 |
| RDS | db.r6i.xlarge Multi-AZ + 1–2 read replicas | ~$900–1,400 |
| ElastiCache | cache.m6i.large cluster (HA) | ~$200 |
| MSK | 3-broker cluster | ~$350 |
| OpenSearch | 2–3 data nodes | ~$300 |
| ALB + WAF | HA edge | ~$40 |
| S3 + egress + CloudWatch | high | ~$200–400 |
| **Total** | | **~$2,900–4,500** |

> Scaling is **not linear**: 1×→10× is mostly a bigger box + managed Redis/DB (~6×). 10×→100×
> forces horizontal compute, RDS read replicas, MSK and OpenSearch — that's where cost steps up.
> The cheapest 100× lever is per-service horizontal scaling on ECS (one image, N task defs) so
> only the hot containers (proxy, order/payment, auth) scale out.

➡ Next: [04 · Environment & secrets](04-environment-and-secrets.md)
