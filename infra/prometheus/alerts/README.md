# Prometheus SLO Alert Rules

This directory contains Prometheus alerting rules for the Baalvion enterprise platform.

## File: `slo.yml`

| Alert | SLO | Severity |
|---|---|---|
| `AuthServiceErrorRateTooHigh` | Auth routes < 0.5% error rate (5m) | critical |
| `APILatencyP95High` | Per-route p95 < 500 ms (5m) | warning |
| `APILatencyP95HighAggregate` | Aggregate p95 < 500 ms (5m) | warning |
| `RealtimeConnectionsDrop` | Active connections must not drop >30% in 5m | critical |
| `RealtimeServiceConnectionsDrop` | Realtime-service connections must not drop >30% in 5m | critical |
| `WorkerJobFailureRateHigh` | Worker health endpoint < 10% error rate | warning |

## Loading the rules into Prometheus

### Option 1 — Static configuration

Add the rules file path to your `prometheus.yml`:

```yaml
rule_files:
  - /etc/prometheus/alerts/*.yml
```

Then restart (or `kill -HUP`) the Prometheus process.

### Option 2 — Kubernetes ConfigMap

```bash
kubectl create configmap baalvion-prom-alerts \
  --from-file=slo.yml=infra/prometheus/alerts/slo.yml \
  --namespace monitoring \
  --dry-run=client -o yaml | kubectl apply -f -
```

Mount the ConfigMap into the Prometheus pod and reference it from `prometheus.yml`
via the `rule_files` key (see Prometheus Helm chart `additionalRulesForClusterRole`
or `ruleFiles` values).

### Option 3 — Prometheus Operator (PrometheusRule CRD)

Wrap the rule group inside a `PrometheusRule` custom resource:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: baalvion-slo
  namespace: monitoring
  labels:
    prometheus: kube-prometheus    # must match your Prometheus CR selector
spec:
  groups: []                       # paste the contents of slo.yml here
```

Apply with:

```bash
kubectl apply -f infra/prometheus/alerts/slo-prometheusrule.yml
```

## Verifying the rules

```bash
# Lint the YAML
promtool check rules infra/prometheus/alerts/slo.yml

# Unit-test rules (add a slo_test.yml alongside this file)
promtool test rules infra/prometheus/alerts/slo_test.yml
```

## Metric sources

| Metric | Source | Notes |
|---|---|---|
| `http_requests_total` | `proxy-backend` (`observability/metrics.js`) | Labels: `method`, `route`, `status_code` |
| `http_request_duration_seconds` | `proxy-backend` (`observability/metrics.js`) | Histogram with standard buckets |
| `http_active_connections` | `proxy-backend` (`observability/metrics.js`) | Gauge |
| `realtime_active_connections` | `realtime-service` | Export this gauge from the realtime-service when it is instrumented |
