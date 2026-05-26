# Baalvion ML Service

Real scikit-learn / statsmodels inference + training tier for the network
intelligence platform. The Node control plane ([service/mlInferenceClient.js](../backend-Proxy-BaalvionStack/service/mlInferenceClient.js))
delegates heavy models here and **falls back to its in-process models** when this
service is down — so it accelerates, never gates, the platform.

## Endpoints (all HMAC-authenticated)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/healthz`, `/readyz` | liveness / readiness |
| GET | `/models` | registry catalogue |
| POST | `/predict/ban` | ban probability (LogisticRegression) |
| POST | `/detect/anomaly` | robust-z + IsolationForest score |
| POST | `/forecast` | Holt-Winters (statsmodels) forecast |
| POST | `/drift` | PSI + KS drift assessment |
| POST | `/train/ban` | train + register + (auto)promote the ban model |

## Auth
HMAC-SHA256 over `"{ts}.{rawBody}"`, hex, in `X-Baalvion-Signature` with
`X-Baalvion-Ts` (5-min replay window). Identical to the Node signer. Set
`ML_SERVICE_SECRET` on both sides. Unset = unsigned dev mode.

## Model registry
Writes into the platform's `ml_models` table (`framework='sklearn'`, `params`
points at the joblib artifact) so Node + Python models share one versioned,
promotable catalogue. Artifacts persist to `MODEL_DIR` (PVC/S3 mount).

## Config (env)
`ML_SERVICE_SECRET`, `DATABASE_URL`, `CLICKHOUSE_URL`, `CLICKHOUSE_DB`,
`MODEL_DIR`, `BAN_LABEL_THRESHOLD`, `MIN_TRAIN_ROWS`, `PROMOTE_AUC`.

## Run / test
```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

pip install -r requirements-dev.txt
pytest -q                      # pure-stat tests run with stdlib; sklearn test auto-skips if absent
```

## Deploy
[infra/k8s/base/ml-service.yaml](../../infra/k8s/base/ml-service.yaml) (Deployment +
Service + HPA + ServiceMonitor). Build: `docker build -t ghcr.io/baalvion/ml-service .`
