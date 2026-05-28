# Baalvion Global Edge Network

The proxy data plane runs as a fleet of **edge PoPs** (Points of Presence) fronted
by **Anycast (AWS Global Accelerator)** and **GeoDNS (Route53 geolocation)**. A
client always lands on the nearest healthy gateway; the gateway then egresses
through residential / mobile / datacenter / dedicated owned-IP pools.

This directory documents the topology. The deployable pieces live in:

| Concern | Path |
| --- | --- |
| Anycast + GeoDNS | [`infra/terraform/modules/edge/main.tf`](../terraform/modules/edge/main.tf) |
| Region K8s overlays | [`infra/k8s/overlays/`](../k8s/overlays/) (`us-east`, `eu`, `india`, `sea`) |
| Gateway data plane | [`Backend/gateway/`](../../Backend/gateway/) |
| Edge control plane | `Backend/backend-Proxy-BaalvionStack/service/{edgeRegionService,asnIntelService,dedicatedPoolService}.js` |

---

## Steering: how a client reaches the nearest PoP

```
                 client (anywhere)
                        │
            ┌───────────┴────────────┐
            │  Layer 1: ANYCAST       │   2 static IPs announced from every
            │  AWS Global Accelerator │   AWS edge; TCP, client_affinity=SOURCE_IP
            └───────────┬────────────┘   (sticky region for sticky sessions)
                        │ AWS backbone → nearest HEALTHY region NLB
            ┌───────────┴────────────┐
            │  Layer 2: GeoDNS        │   geo.<zone> geolocation records +
            │  Route53 geolocation    │   region-pinned <key>.<zone> (data-residency)
            └───────────┬────────────┘   each record health-checked (TCP :8080)
                        │
            ┌───────────┴────────────┐
            │  Regional gateway NLB   │  →  gateway pods (baalvion-edge ns)
            └─────────────────────────┘
```

- **Anycast (primary):** lowest latency + sub-10s failover at the network layer.
  A dead region is drained by GA health checks; clients keep one anycast IP.
- **GeoDNS (secondary / explicit):** `eu.proxy.baalvion.com` style hostnames pin a
  customer to a region for **GDPR / data-residency**; `geo.<zone>` is a
  DNS-level fallback for clients that can't use Global Accelerator. Each record
  carries a Route53 health check so a failed region falls through to the default.

---

## 8-Region matrix

| # | Region key | AWS region | Continents served (Route53) | K8s overlay | Gateway min/max | Role |
|---|------------|------------|------------------------------|-------------|-----------------|------|
| 1 | `us-east` | `us-east-1` | NA, SA | ✅ `overlays/us-east` | 6 / 150 | Primary NA + LatAm, highest traffic |
| 2 | `eu` | `eu-west-1` | EU, AF | ✅ `overlays/eu` | 4 / (HPA) | GDPR / data-residency, Africa overflow |
| 3 | `india` | `ap-south-1` | AS (in/subcontinent) | ✅ `overlays/india` | 4 / 100 | India residential/mobile growth, **TF default region** |
| 4 | `sea` | `ap-southeast-1` | OC, AS (sea) | ✅ `overlays/sea` | 3 / 80 | SG/ID/TH/VN/MY hub + Oceania |
| 5 | `sa` | `sa-east-1` | SA | _planned_ | — | LatAm dedicated (offloads us-east) |
| 6 | `me` | `me-central-1` | AS (gulf) | _planned_ | — | UAE/SA/TR, mobile carriers |
| 7 | `af` | `af-south-1` | AF | _planned_ | — | ZA/NG/EG (offloads eu) |
| 8 | `oc` | `ap-southeast-2` | OC | _planned_ | — | AU/NZ dedicated (offloads sea) |

> Route53 `continent` codes: NA, SA, EU, AF, AS, OC, AN. India/SEA both fall under
> `AS`; we split them with **country/subdivision** geolocation records and the
> `client_affinity = SOURCE_IP` Anycast pin. The control-plane
> `edgeRegionService.pickRegion()` performs the finer-grained continent affinity
> (NA/SA/EU/IN/SEA/ME/AF/OC) for **egress** routing decisions inside a PoP.

Regions 1–4 ship now (Terraform `edge_regions` + K8s overlays). 5–8 are capacity
expansions: add a K8s overlay + an `edge_regions` entry; no code changes.

---

## PoP component topology (per region)

Each region is a self-contained edge cell:

```
 region (e.g. ap-south-1)
 ├─ Global Accelerator endpoint group ──► regional NLB (TCP 80/443/1080/8080)
 │      health check: TCP :8080, interval 10s, threshold 3
 │
 ├─ namespace baalvion-edge
 │   └─ Deployment gateway (Go)                      [nodeSelector workload=edge]
 │        ├─ HTTP forward proxy            :80
 │        ├─ HTTPS CONNECT                 :443
 │        ├─ SOCKS5 (RFC1928/1929)         :1080
 │        ├─ control/metrics               :8080  (/healthz, /metrics)
 │        └─ HPA  min→max (see matrix)
 │
 ├─ namespace baalvion (control plane, region-pinned)
 │   ├─ Deployment api      (auth, billing, orchestration, edge admin)
 │   └─ workers             (metering, ASN refresh, dedicated-IP gauges)
 │
 └─ Redis (regional) — routing flags consumed by the gateway BEFORE egress:
      asn:rep:{asn}          ASN reputation 0–100   (asnIntelService.publish)
      asn:banned             SET of low-rep ASNs    (route-around)
      region:health:{code}   PoP health snapshot    (edgeRegionService.recordHealth)
      dedipool:org:{id}       per-org owned IP set    (dedicatedPoolService.publishOrgPool)
```

### Egress pools available at every PoP
| Kind | Source | Exit IP | Sticky |
|------|--------|---------|--------|
| `residential` | upstream provider (templated `customer-…-country-…-session-…`) | discovered | session-keyed |
| `mobile` | upstream provider + `carrier`/`mobile` directive | discovered | session-keyed |
| `datacenter` | upstream provider / `direct` | discovered / node | optional |
| `dedicated` | **owned IPs bound as source addr** (`net.Dialer.LocalAddr`) | **known** | sha256(session) |

The `dedicated` provider reads `dedipool:org:{id}` to pick an owned source IP
exclusively allocated to that org, giving customer isolation + clean, predictable
exit IPs (datacenter / dedicated-static / ISP).

---

## Rollout / expansion runbook

1. **Add a region overlay:** copy `infra/k8s/overlays/<existing>` → `<new>`, set
   `topology.kubernetes.io/region` + replica counts. Deploy:
   `kubectl apply -k infra/k8s/overlays/<new>`.
2. **Expose the gateway:** the in-cluster LB controller creates a regional NLB.
   Capture its ARN + DNS name.
3. **Register with edge steering:** append an entry to `edge_regions` in
   `terraform.tfvars` (ARN, DNS, continents). `terraform apply` adds a GA endpoint
   group + GeoDNS records + a health check. No application redeploy.
4. **Seed the control plane:** `POST /v1/admin/edge/regions` with the region code,
   continent, gateway endpoint, and weight so `pickRegion()` includes it for
   egress routing; health is reported via `POST /v1/admin/edge/regions/:code/health`.

Failover is automatic at both layers (GA health check + Route53 health check);
`recordHealth()` additionally marks a region `degraded`/`offline` in Postgres and
lowers its routing weight.
