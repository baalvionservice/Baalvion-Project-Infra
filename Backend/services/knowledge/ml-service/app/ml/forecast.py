"""Forecasting — statsmodels Holt-Winters (additive trend + seasonality) when
available + enough data, with a pure-Python double-exponential-smoothing
fallback so the endpoint always returns a real forecast."""
from __future__ import annotations

import math
import statistics


def _fallback_holt(series: list[float], horizon: int, alpha=0.4, beta=0.1) -> dict:
    if len(series) < 2:
        v = series[0] if series else 0.0
        return {"forecast": [max(0.0, v)] * horizon, "lower": [0.0] * horizon,
                "upper": [max(0.0, v) * 2] * horizon, "model": "naive"}
    level = series[0]
    trend = series[1] - series[0]
    resid = []
    for y in series:
        prev = level
        resid.append(y - (level + trend))
        level = alpha * y + (1 - alpha) * (level + trend)
        trend = beta * (level - prev) + (1 - beta) * trend
    sd = statistics.pstdev(resid) if len(resid) > 1 else 0.0
    fc, lo, hi = [], [], []
    for h in range(1, horizon + 1):
        yhat = max(0.0, level + h * trend)
        band = 1.96 * sd * math.sqrt(h)
        fc.append(yhat)
        lo.append(max(0.0, yhat - band))
        hi.append(yhat + band)
    return {"forecast": fc, "lower": lo, "upper": hi, "model": "holt_linear"}


def forecast(series: list[float], horizon: int = 7, period: int = 7) -> dict:
    series = [float(v) for v in series if v is not None]
    if len(series) >= 2 * period and period >= 2:
        try:
            from statsmodels.tsa.holtwinters import ExponentialSmoothing

            model = ExponentialSmoothing(
                series, trend="add", seasonal="add", seasonal_periods=period,
                initialization_method="estimated",
            ).fit()
            fc = [max(0.0, float(v)) for v in model.forecast(horizon)]
            resid = list(getattr(model, "resid", []) or [])
            sd = statistics.pstdev(resid) if len(resid) > 1 else 0.0
            lo = [max(0.0, fc[i] - 1.96 * sd * math.sqrt(i + 1)) for i in range(horizon)]
            hi = [fc[i] + 1.96 * sd * math.sqrt(i + 1) for i in range(horizon)]
            return {"forecast": fc, "lower": lo, "upper": hi, "model": "holt_winters_seasonal"}
        except Exception:
            pass
    return _fallback_holt(series, horizon)
