"""Model drift detection — Population Stability Index (PSI) + two-sample
Kolmogorov-Smirnov. Compares a reference (training) distribution against a recent
(serving) distribution per feature; high PSI/KS triggers a retraining job."""
from __future__ import annotations


def psi(expected: list[float], actual: list[float], buckets: int = 10) -> float:
    if not expected or not actual:
        return 0.0
    lo = min(min(expected), min(actual))
    hi = max(max(expected), max(actual))
    if hi - lo < 1e-9:
        return 0.0
    width = (hi - lo) / buckets
    total = 0.0
    for b in range(buckets):
        b_lo = lo + b * width
        b_hi = hi + 1e-9 if b == buckets - 1 else lo + (b + 1) * width
        e = sum(1 for v in expected if b_lo <= v < b_hi) / len(expected) or 1e-6
        a = sum(1 for v in actual if b_lo <= v < b_hi) / len(actual) or 1e-6
        total += (a - e) * (__import__("math").log(a / e))
    return total


def ks_statistic(a: list[float], b: list[float]) -> float:
    """Two-sample KS statistic (max CDF gap)."""
    if not a or not b:
        return 0.0
    combined = sorted(set(a) | set(b))
    na, nb = len(a), len(b)
    max_gap = 0.0
    for x in combined:
        ca = sum(1 for v in a if v <= x) / na
        cb = sum(1 for v in b if v <= x) / nb
        max_gap = max(max_gap, abs(ca - cb))
    return max_gap


def assess(reference: list[float], recent: list[float]) -> dict:
    p = psi(reference, recent)
    k = ks_statistic(reference, recent)
    # PSI > 0.2 is the conventional "significant population shift" threshold.
    drifted = p > 0.2 or k > 0.2
    return {"psi": p, "ks": k, "drifted": drifted, "retrain_recommended": drifted}
