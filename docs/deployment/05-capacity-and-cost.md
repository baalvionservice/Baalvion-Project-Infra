# 05 · Capacity & Cost

> **Superseded for production sizing/cost by [production/03-sizing-and-cost.md](production/03-sizing-and-cost.md)**,
> anchored on the measured ~4 GiB idle and the determined **x86_64** target (`t3.large`). Instance
> names below were mechanically updated to `t3`; treat the cost figures here as the earlier draft.

Memory budget, instance sizing, and expected monthly AWS cost.

> RAM figures are derived idle-RSS estimates (see [02 · Resource Audit](02-resource-audit.md) for
> methodology). Validate with `pm2 jlist` / `docker stats` post-deploy.

## Per-app memory budget

| App | Modules | Σ idle | `mem_reservation` | `mem_limit` |
|---|---:|---:|---:|---:|
| app-identity | 5 | ~550 MB | 384m | 768m |
| app-commerce | 7 | ~880 MB | 640m | 1280m |
| app-trade | 6 | ~700 MB | 512m | 1024m |
| app-ecosystem | 10 | ~1105 MB | 768m | 1536m |
| app-platform | 10 | ~1125 MB | 768m | 1536m |
| app-edge-realtime | 4 | ~635 MB | 448m | 896m |
| app-payments (JVM) | 1 | ~600 MB | 512m | 768m |
| redis | — | ~100 MB | 64m | 256m |
| caddy | — | ~40 MB | 32m | 64m |
| **Total** | **43 + JVM** | **~6.0 GB actual** | **~4.1 GB reserved** | (caps are ceilings) |

`mem_limit` is a hard ceiling, not a pre-allocation, so the limit column summing above 8 GB is fine —
**actual peak is ~6.0 GB**. Each Node process is additionally capped with
`--max-old-space-size` and a pm2 `max_memory_restart` guardrail.

## Instance sizing

| Option | Instance | vCPU / RAM | Fit |
|---|---|---|---|
| **Recommended** | t3.large (ARM) | 2 / 8 GB | ~6 GB actual + ~2 GB headroom |
| Headroom | t3.xlarge (ARM) | 4 / 16 GB | if 42 processes + JVM get CPU-tight |
| Budget (no JVM) | t3.large | 2 / 8 GB | ~5 GB Node-only still needs 8 GB |

**CPU reality:** at low traffic the fleet is near-idle. The only real spikes are bcrypt logins
(auth-service) and JVM/ML cold starts — all absorbed by 2 burstable vCPU + credits. Step up to
t3.xlarge (4 vCPU) if the 42-process + JVM baseline exhausts CPU credits.

## Monthly AWS cost (ap-south-1)

| Item | Spec | On-demand | 1-yr Savings Plan / RI |
|---|---|---:|---:|
| EC2 compute | t3.large (2 vCPU / 8 GB) | ~$49 | ~$31 |
| EBS root | 50 GB gp3 | ~$4 | ~$4 |
| RDS PostgreSQL | db.t3.small Single-AZ + 20 GB gp3 + backups | ~$28 | ~$22 |
| Redis | on-box container | $0 | $0 |
| ECR + egress | images + low traffic | ~$5 | ~$5 |
| **Total** | | **~$85/mo** | **~$62/mo** |

With the t3.xlarge headroom option, add ~$49/mo on-demand (~$31 with a Savings Plan).

## Cost levers

| Lever | Effect | Trade-off |
|---|---|---|
| Drop `app-payments` until payments are live | frees RAM headroom | still needs t3.large for ~5 GB Node |
| Keep `ml-service` OFF (default) | saves 300–400 MB | none (Node fallback) |
| 1-yr Compute Savings Plan on EC2 | ~37% off compute | 1-yr commit |
| RDS Reserved Instance | ~20% off RDS | 1-yr commit |
| **Single-process merge (Model A)** | **~6 GB → ~2 GB → t3.small (~$30/mo all-in)** | **~42 entrypoint edits; relaxes the "no-change" guarantee** — see [02 §5](02-resource-audit.md) |

## How this compares to the earlier $20–30 target

An earlier option quoted ~$20–30/mo. That assumed **self-hosted Postgres on the box** *and* the
**single-process merge** (Model A, ~2 GB). This design deliberately chooses the safer path —
**managed RDS** + **6–7 zero-change multi-process apps** — which raises both RAM (~6 GB) and the
managed-DB line, landing at **~$62–85/mo**. The single-process merge remains the documented lever to
return toward the lower figure when the no-change constraint can be relaxed.

➡ Next: [06 · ECS Migration](06-ecs-migration.md)
