"""Anomaly scoring — robust modified z-score (median + MAD) as the always-on
detector, plus an IsolationForest scorer when enough history is available. Both
return a normalised score + severity so callers (Node anomalyDetection fallback,
or this service directly) get a consistent contract."""
from __future__ import annotations

import statistics


def _median(xs):
    return statistics.median(xs) if xs else 0.0


def _mad(xs):
    if not xs:
        return 0.0
    med = _median(xs)
    return _median([abs(v - med) for v in xs])


def severity_from_z(z: float) -> str:
    a = abs(z)
    if a >= 6:
        return "critical"
    if a >= 4.5:
        return "high"
    if a >= 3.5:
        return "medium"
    return "low"


def robust_z(value: float, history: list[float]) -> float:
    if len(history) < 3:
        return 0.0
    med = _median(history)
    mad = _mad(history)
    if mad < 1e-9:
        sd = statistics.pstdev(history) if len(history) > 1 else 0.0
        return 0.0 if sd < 1e-9 else (value - med) / sd
    return 0.6745 * (value - med) / mad


def isolation_score(value: float, history: list[float]) -> float | None:
    """IsolationForest anomaly score in [0,1] (higher = more anomalous), or None
    if sklearn unavailable / insufficient data."""
    if len(history) < 20:
        return None
    try:
        import numpy as np
        from sklearn.ensemble import IsolationForest

        X = np.array(history, dtype=float).reshape(-1, 1)
        clf = IsolationForest(contamination="auto", random_state=42, n_estimators=100)
        clf.fit(X)
        # decision_function: higher = more normal. Map to [0,1] anomaly score.
        df = float(clf.decision_function(np.array([[value]]))[0])
        return max(0.0, min(1.0, 0.5 - df))
    except Exception:
        return None


def detect(value: float, history: list[float]) -> dict:
    z = robust_z(value, history)
    sev = severity_from_z(z)
    iso = isolation_score(value, history)
    return {
        "score": z,
        "severity": sev,
        "is_anomaly": abs(z) >= 3.5 or (iso is not None and iso >= 0.7),
        "isolation_score": iso,
    }
