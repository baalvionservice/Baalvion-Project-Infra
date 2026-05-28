"""Baalvion ML inference service (FastAPI).

REAL scikit-learn / statsmodels inference + training tier that the Node control
plane delegates to (mlInferenceClient.js) for heavier models. Every endpoint is
HMAC-authenticated (parity with the Node signer). The Node layer falls back to
its in-process models when this service is unavailable, so this tier is an
accelerator, not a hard dependency.

Run: uvicorn app.main:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

from fastapi import Depends, FastAPI
from pydantic import BaseModel, Field

from .config import config
from .features import load_ban_training_set
from .ml import anomaly, ban_model, drift, forecast
from .registry import list_models, next_version, record_metric, register
from .security import verify_signature

app = FastAPI(title="Baalvion ML Service", version="1.0.0")


# ── Schemas ───────────────────────────────────────────────────────────────────
class BanRequest(BaseModel):
    features: dict


class AnomalyRequest(BaseModel):
    value: float
    history: list[float] = Field(default_factory=list)


class ForecastRequest(BaseModel):
    series: list[float]
    horizon: int = 7
    period: int = 7


class TrainRequest(BaseModel):
    days: int = 14


class DriftRequest(BaseModel):
    reference: list[float]
    recent: list[float]


# ── Health / readiness ──────────────────────────────────────────────────────
@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/readyz")
def readyz():
    return {"status": "ok", "clickhouse": bool(config.CLICKHOUSE_URL), "db": bool(config.DATABASE_URL)}


@app.get("/models", dependencies=[Depends(verify_signature)])
def models():
    return {"models": list_models()}


# ── Inference ─────────────────────────────────────────────────────────────────
@app.post("/predict/ban", dependencies=[Depends(verify_signature)])
def predict_ban(req: BanRequest):
    return ban_model.predict(req.features)


@app.post("/detect/anomaly", dependencies=[Depends(verify_signature)])
def detect_anomaly(req: AnomalyRequest):
    return anomaly.detect(req.value, req.history)


@app.post("/forecast", dependencies=[Depends(verify_signature)])
def do_forecast(req: ForecastRequest):
    return forecast.forecast(req.series, req.horizon, req.period)


@app.post("/drift", dependencies=[Depends(verify_signature)])
def do_drift(req: DriftRequest):
    return drift.assess(req.reference, req.recent)


# ── Training ──────────────────────────────────────────────────────────────────
@app.post("/train/ban", dependencies=[Depends(verify_signature)])
def train_ban(req: TrainRequest):
    X, y, n = load_ban_training_set(req.days)
    if n < config.MIN_TRAIN_ROWS:
        return {"trained": False, "rows": n, "reason": "insufficient_data"}
    result = train_and_register(X, y, n)
    return result


def train_and_register(X, y, n) -> dict:
    out = ban_model.train(X, y)
    metrics = out["metrics"]
    version = next_version("ban_predictor")
    auc = float(metrics.get("auc", 0.5))
    activate = auc >= config.PROMOTE_AUC
    ban_model.persist(out["pipeline"], version)
    register(
        name="ban_predictor", version=version, algorithm="logistic_regression",
        params={"artifact": f"ban_predictor_v{version}.joblib"},
        feature_names=metrics["feature_names"], metrics=metrics, trained_rows=n, activate=activate,
    )
    record_metric("ban_predictor", version, "auc", auc)
    if activate:
        ban_model.load(version)
    return {"trained": True, "version": version, "auc": auc, "promoted": activate, "rows": n}
