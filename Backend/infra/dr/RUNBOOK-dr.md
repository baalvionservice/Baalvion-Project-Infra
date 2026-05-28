# Disaster Recovery Runbook

## Targets (per data store)

| System      | RPO (max data loss) | RTO (max downtime) | Mechanism |
|-------------|---------------------|--------------------|-----------|
| PostgreSQL  | ≤ 5 min             | ≤ 30 min           | CloudNativePG WAL archiving + PITR (S3) |
| ClickHouse  | ≤ 24 h              | ≤ 2 h              | Daily native `BACKUP ... TO S3` |
| Redis       | ≤ 6 h               | ≤ 15 min           | Sentinel auto-failover (RTO ~secs); RDB→S3 for total loss |
| K8s objects | ≤ 1 h               | ≤ 30 min           | Velero (config hourly, full daily) |
| Region      | active-active       | ≤ 5 min (DNS)      | GeoDNS health-check failover to peer region |

> Redis is **session/quota/stream** state — losing it does not lose money
> (billing truth is Postgres + ClickHouse). Sentinel failover is the common case;
> the RDB→S3 restore is only for total cluster loss.

## Restore procedures

### Postgres — Point-in-Time Recovery
```bash
# Recover into a NEW cluster from the object store to a timestamp.
kubectl apply -f - <<'EOF'
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata: { name: baalvion-pg-restore, namespace: baalvion }
spec:
  instances: 3
  imageName: ghcr.io/cloudnative-pg/timescaledb:16
  bootstrap:
    recovery:
      source: baalvion-pg
      recoveryTarget: { targetTime: "2026-05-26 09:00:00+00" }
  externalClusters:
    - name: baalvion-pg
      barmanObjectStore:
        destinationPath: s3://baalvion-pg-backups/
        s3Credentials: { accessKeyId: {name: pg-backup-creds, key: ACCESS_KEY_ID}, secretAccessKey: {name: pg-backup-creds, key: SECRET_ACCESS_KEY} }
EOF
# Verify, then repoint the api/workers DATABASE_URL (or swap the Service selector).
```

### Cross-region failover (region down)
1. Confirm region health red in Grafana + GeoDNS health checks failing.
2. GeoDNS (Route53/Cloudflare) auto-steers new traffic to the healthy region
   (health-check based). Verify weights; manually drain the dead region if needed.
3. Promote the DR Postgres replica (bootstrapped from the same S3 store) to primary.
4. Scale up gateway HPA min in surviving region(s) to absorb load.
5. Post-incident: rebuild the failed region from `infra/k8s/overlays/<region>`.

### ClickHouse
```bash
clickhouse-client --query "RESTORE DATABASE baalvion FROM S3('.../ch_YYYYMMDD', '<key>', '<secret>')"
```

### Redis (total loss)
```bash
aws s3 cp s3://baalvion-redis-backups/<latest>.rdb /data/dump.rdb   # into redis-0 PVC, then restart
```

### Kubernetes (cluster rebuild)
```bash
velero restore create --from-backup <daily-backup-name> --include-namespaces baalvion,baalvion-edge
```

## DR testing (quarterly, MANDATORY)
- Game day: restore Postgres PITR into a scratch namespace + run billing-accuracy checks.
- Region kill: drain a non-primary region, assert GeoDNS failover < 5 min, no 5xx spike.
- Record actual RPO/RTO; update this table if targets are missed.
