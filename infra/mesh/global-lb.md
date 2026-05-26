# Global load balancing & edge routing

The proxy data plane is **TCP** (HTTP-CONNECT + SOCKS5), so global routing is at
the **DNS / Anycast** layer, not HTTP L7.

## Strategy (two supported)

### A. GeoDNS + health-checked failover (default — Route53 / Cloudflare)
- `gw.baalvion.net` → **latency/geo routing** to the nearest healthy region's NLB.
- Each region's NLB has a **health check** (TCP :10000 + the gateway `/readyz` on :9090
  via a side HTTP check). Unhealthy region is withdrawn from DNS automatically.
- Customer geo-affinity: clients resolve to nearest region; sticky sessions stay
  in-region (Redis is regional).

```
Route53 latency record set:
  gw.baalvion.net  →  alias us-east  NLB (health-check: us-east-gw)
  gw.baalvion.net  →  alias eu-west  NLB (health-check: eu-west-gw)
  gw.baalvion.net  →  alias ap-south NLB (health-check: ap-south-gw)
  ... (one per region; latency-based; failover to next-nearest healthy)
```
`external-dns` manages these records from the Service annotation:
`external-dns.alpha.kubernetes.io/hostname: gw.baalvion.net`.

### B. Anycast (single IP, BGP) — for the lowest-latency / DDoS-resilient tier
- One Anycast VIP announced from every region's edge; BGP steers to nearest PoP.
- Requires a provider that supports Anycast (Cloudflare Spectrum / AWS Global
  Accelerator). AWS Global Accelerator is the pragmatic managed option:
  one static Anycast IP → regional NLB endpoint groups with health checks +
  automatic failover + traffic dials per region.

## DDoS / WAF
- L3/L4 volumetric: AWS Shield Advanced / Cloudflare Spectrum in front of the NLBs.
- App-layer abuse (credential stuffing, scraping the control plane): handled by
  the gateway's brute-force lockout + the API's distributed rate limiter; the
  public dashboard/API sits behind Cloudflare WAF.

## Control-plane (dashboard/API) ingress
HTTP L7 via Istio ingress gateway + cert-manager TLS; `api.baalvion.com` /
`app.baalvion.com` → GeoDNS to the nearest control-plane region (us-east primary,
eu-west for GDPR customers).
