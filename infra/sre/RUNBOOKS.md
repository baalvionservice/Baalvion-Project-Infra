# SRE Runbooks & On-call

## SLIs / SLOs (see `slos.yaml`)
| SLO | Target (30d) | SLI |
|---|---|---|
| Gateway availability | 99.9% | successful tunnels / total |
| Gateway connect latency | 99% < 1s | latency histogram |
| API availability | 99.95% | non-5xx / total |
| Metering freshness (billing) | 99.9% | ingested / (ingested+failed) |

## On-call & escalation
- **Primary on-call** (PagerDuty `baalvion-sre`): pages on `severity=critical`.
- **Escalation:** no ack in 15 min → secondary → 15 min → eng manager.
- `warning`/`info` → Slack `#sre-alerts` (no page).
- Every page links a runbook section below (alert `annotations.runbook`).

---

## <a id="gateway-down"></a>Runbook: Gateway availability fast-burn / NoActiveGateways
1. Grafana **Proxy Gateway** dashboard → which region(s)? `provider_state` table.
2. If **one provider** is OFFLINE and dominating failures → it's a provider issue,
   not us → see [provider-outage]. The orchestrator should already be failing over;
   confirm `failover_events_total` rising and other providers HEALTHY.
3. If **all regions** failing → check ingress/NLB health, recent deploy
   (`kubectl rollout history deploy/gateway -n baalvion-edge`). Roll back:
   `kubectl rollout undo deploy/gateway -n baalvion-edge`.
4. If a **region** is down → confirm GeoDNS withdrew it; if not, manually drain
   (set region weight 0) per `infra/dr/RUNBOOK-dr.md`.
5. Capacity: check gateway HPA at max; if so, raise `maxReplicas` / add nodes.

## <a id="provider-outage"></a>Runbook: Provider outage / high ban rate
1. Admin → Orchestration page (or `provider:state:*` in Redis) for live state.
2. Circuit breaker auto-opens an OFFLINE provider; verify traffic shifted to peers
   (`bytes_transferred_total by provider`).
3. If ban rate high on a target domain → expected (target is blocking that exit
   pool); customer should rotate/sticky-off. Not an outage.
4. If provider truly down: disable it in `provider_credentials`/config, or set
   weight 0; the orchestrator stops selecting it. Open a ticket with the provider.

## <a id="db-failover"></a>Runbook: Postgres primary failover
1. CloudNativePG auto-promotes a synchronous replica (RTO seconds). Confirm:
   `kubectl get cluster baalvion-pg -n baalvion -o jsonpath='{.status.currentPrimary}'`.
2. Apps reconnect via the PgBouncer `-rw` Pooler Service (no config change).
3. If cluster unrecoverable → PITR restore (`infra/dr/RUNBOOK-dr.md#postgres`).

## <a id="billing"></a>Runbook: Billing failures / metering stalled
1. `MeteringIngestStalled` → traffic flowing but no ingest: check `workers` pods,
   Redis stream `usage:events` length (`XLEN`), consumer-group lag (`XINFO GROUPS`).
2. Restart `workers`; XAUTOCLAIM recovers pending entries; dead-letters in
   `usage:events:dlq`. No billing data is lost (events persist in the stream).
3. `BillingFailures` → check `billing_runs` table + worker logs; the monthly run
   is idempotent (safe to re-trigger).

## Maintenance
- Node drains: PDBs guarantee gateway `minAvailable: 75%`, api `2`, redis `2`.
- DB upgrades: CloudNativePG rolling, replicas first. Always during low-traffic window.
- Schema migrations run as a pre-deploy Job (`migrate.js up`) gated in CI before image promote.
