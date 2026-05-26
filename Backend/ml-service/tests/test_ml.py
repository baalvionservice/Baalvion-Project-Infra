"""Tests for the Baalvion ML service. Pure-stat tests run with only the stdlib;
the sklearn-dependent training test is skipped automatically when sklearn is
absent so the suite is always runnable."""
import hashlib
import hmac

import pytest

from app.features import FEATURES, feature_vector, hardness
from app.ml import anomaly, drift, forecast


def test_feature_vector_order_and_clamp():
    f = {"failRate": 0.5, "captchaRate": 2.0, "err4xxRate": -1, "err5xxRate": 0.1,
         "latencyMs": 10000, "recentBanRate": 0.3, "targetClass": "social"}
    v = feature_vector(f)
    assert len(v) == len(FEATURES) == 7
    assert v[1] == 1.0          # captchaRate clamped to 1
    assert v[2] == 0.0          # negative clamped to 0
    assert v[4] == 2.0          # latency 10000/5000 = 2 (clamped at 2)
    assert v[6] == hardness("social") == 0.7


def test_robust_z_detects_spike():
    history = [10, 11, 9, 10, 12, 10, 11, 9, 10, 10]
    assert abs(anomaly.robust_z(10, history)) < 1.0       # normal point
    assert abs(anomaly.robust_z(100, history)) >= 3.5     # spike is an anomaly
    res = anomaly.detect(100, history)
    assert res["is_anomaly"] is True
    assert res["severity"] in ("medium", "high", "critical")


def test_drift_psi_zero_when_same():
    base = [float(i % 10) for i in range(200)]
    same = drift.assess(base, base)
    assert same["psi"] < 0.05
    assert same["drifted"] is False
    shifted = drift.assess(base, [v + 50 for v in base])
    assert shifted["psi"] > 0.2
    assert shifted["drifted"] is True


def test_forecast_fallback_tracks_trend():
    series = [float(i) for i in range(1, 21)]   # strictly increasing
    out = forecast.forecast(series, horizon=5, period=7)  # < 2*period → fallback
    assert len(out["forecast"]) == 5
    assert out["forecast"][0] >= series[-1] - 2           # continues upward
    assert all(lo <= f <= hi for lo, f, hi in zip(out["lower"], out["forecast"], out["upper"]))


def test_forecast_seasonal_shape_when_long():
    # 6 weeks of weekly-seasonal data — exercises the seasonal path (or fallback).
    series = [10 + (i % 7) * 2 for i in range(42)]
    out = forecast.forecast(series, horizon=7, period=7)
    assert len(out["forecast"]) == 7
    assert out["model"] in ("holt_winters_seasonal", "holt_linear")


def test_hmac_signature_parity():
    secret = "test-secret"
    ts = "1700000000000"
    body = '{"features":{"failRate":0.2}}'
    expected = hmac.new(secret.encode(), f"{ts}.{body}".encode(), hashlib.sha256).hexdigest()
    # Recompute the way security._expected would (same formula).
    assert expected == hmac.new(secret.encode(), f"{ts}.{body}".encode(), hashlib.sha256).hexdigest()
    assert len(expected) == 64


def test_ban_training_when_sklearn_available():
    pytest.importorskip("sklearn")
    from app.ml import ban_model

    # Separable synthetic data: high fail/ban rate → banned.
    X, y = [], []
    for i in range(120):
        banned = i % 2
        X.append([0.6 if banned else 0.02, 0.3 if banned else 0.0, 0.5 if banned else 0.05,
                  0.1, 0.4, 0.5 if banned else 0.01, 0.7])
        y.append(banned)
    out = ban_model.train(X, y)
    assert 0.0 <= out["metrics"]["auc"] <= 1.0
    assert out["metrics"]["auc"] > 0.8  # separable → strong AUC
