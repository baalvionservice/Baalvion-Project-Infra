"""Ban prediction — scikit-learn LogisticRegression with standardisation +
class balancing. Trains on the ClickHouse-derived dataset and persists a joblib
pipeline; serves a calibrated probability. Falls back to the cold-start hardness
prior when no model is loaded (parity with the Node engine)."""
from __future__ import annotations

import os

import joblib

from ..config import config
from ..features import FEATURES, feature_vector, hardness

_PIPELINE = None
_VERSION = 0


def _artifact_path(version: int) -> str:
    return os.path.join(config.MODEL_DIR, f"ban_predictor_v{version}.joblib")


def train(X, y) -> dict:
    """Train + evaluate. Returns metrics + the fitted pipeline (not yet persisted)."""
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import log_loss, roc_auc_score
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler

    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=1000, C=1.0)),
    ])
    pipe.fit(X, y)
    proba = pipe.predict_proba(X)[:, 1]
    metrics = {"feature_names": FEATURES, "rows": len(X)}
    try:
        metrics["auc"] = float(roc_auc_score(y, proba)) if len(set(y)) > 1 else 0.5
        metrics["logloss"] = float(log_loss(y, proba, labels=[0, 1]))
    except Exception:
        metrics["auc"], metrics["logloss"] = 0.5, 0.0
    return {"pipeline": pipe, "metrics": metrics}


def persist(pipeline, version: int) -> str:
    os.makedirs(config.MODEL_DIR, exist_ok=True)
    path = _artifact_path(version)
    joblib.dump(pipeline, path)
    return path


def load(version: int) -> bool:
    global _PIPELINE, _VERSION
    path = _artifact_path(version)
    if not os.path.exists(path):
        return False
    _PIPELINE = joblib.load(path)
    _VERSION = version
    return True


def predict(features: dict) -> dict:
    """Predict ban probability. Cold-start prior when no model is loaded."""
    if _PIPELINE is None:
        prior = 0.5 * float(features.get("recentBanRate", features.get("recent_ban_rate", 0)) or 0) + \
            0.5 * hardness(features.get("targetClass", features.get("target_class", "generic")))
        return {"probability": max(0.0, min(1.0, prior)), "model_version": 0, "cold_start": True}
    x = [feature_vector(features)]
    p = float(_PIPELINE.predict_proba(x)[0, 1])
    return {"probability": p, "model_version": _VERSION, "cold_start": False}
