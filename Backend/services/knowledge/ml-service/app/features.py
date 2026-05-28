"""Feature engineering for the Python ML tier. Builds the ban-model feature
vector in the SAME order as the Node engine (service/banPrediction.js FEATURES)
so models are interchangeable across the registry, and loads training datasets
from ClickHouse (preferred) or Postgres (fallback)."""
from __future__ import annotations

import urllib.parse
import urllib.request

from .config import config

# Must match service/banPrediction.js FEATURES + TARGET_HARDNESS exactly.
FEATURES = ["fail_rate", "captcha_rate", "err4xx_rate", "err5xx_rate", "latency_norm", "recent_ban_rate", "target_hardness"]
TARGET_HARDNESS = {
    "sneaker_ticket": 0.9, "social": 0.7, "search": 0.6,
    "ecommerce": 0.5, "travel": 0.45, "generic": 0.3,
}


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def hardness(cls: str) -> float:
    return TARGET_HARDNESS.get(cls or "generic", 0.3)


def feature_vector(f: dict) -> list[float]:
    """Build the ordered feature vector from a feature dict (camelCase from Node)."""
    return [
        clamp(float(f.get("failRate", f.get("fail_rate", 0)) or 0), 0, 1),
        clamp(float(f.get("captchaRate", f.get("captcha_rate", 0)) or 0), 0, 1),
        clamp(float(f.get("err4xxRate", f.get("err4xx_rate", 0)) or 0), 0, 1),
        clamp(float(f.get("err5xxRate", f.get("err5xx_rate", 0)) or 0), 0, 1),
        clamp(float(f.get("latencyMs", f.get("latency_ms", 0)) or 0) / 5000.0, 0, 2),
        clamp(float(f.get("recentBanRate", f.get("recent_ban_rate", 0)) or 0), 0, 1),
        hardness(f.get("targetClass", f.get("target_class", "generic"))),
    ]


def clickhouse_enabled() -> bool:
    return bool(config.CLICKHOUSE_URL)


def _ch_query(sql: str) -> list[dict]:
    parsed = urllib.parse.urlparse(config.CLICKHOUSE_URL)
    params = urllib.parse.urlencode({"database": config.CLICKHOUSE_DB, "default_format": "JSON"})
    url = f"{parsed.scheme}://{parsed.hostname}:{parsed.port or 8123}/?{params}"
    req = urllib.request.Request(url, data=sql.encode(), method="POST")
    if parsed.username:
        req.add_header("X-ClickHouse-User", urllib.parse.unquote(parsed.username))
    if parsed.password:
        req.add_header("X-ClickHouse-Key", urllib.parse.unquote(parsed.password))
    import json
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode()).get("data", [])


def load_ban_training_set(days: int = 14) -> tuple[list[list[float]], list[int], int]:
    """Return (X, y, n) for the ban classifier from ClickHouse ban_features_hourly."""
    if not clickhouse_enabled():
        return [], [], 0
    sql = (
        "SELECT provider, country, target_class, requests, failures, bans, captchas, "
        "err_4xx, err_5xx, avgMerge(avg_latency) AS latency "
        "FROM baalvion.ban_features_hourly "
        f"WHERE hour >= now() - INTERVAL {int(days)} DAY "
        "GROUP BY provider, country, target_class, requests, failures, bans, captchas, err_4xx, err_5xx, avg_latency "
        "HAVING requests >= 20 LIMIT 200000"
    )
    rows = _ch_query(sql)
    X, y = [], []
    for r in rows:
        requests = float(r.get("requests") or 1)
        ban_rate = float(r.get("bans") or 0) / requests
        captcha_rate = float(r.get("captchas") or 0) / requests
        f = {
            "fail_rate": float(r.get("failures") or 0) / requests,
            "captcha_rate": captcha_rate,
            "err4xx_rate": float(r.get("err_4xx") or 0) / requests,
            "err5xx_rate": float(r.get("err_5xx") or 0) / requests,
            "latency_ms": float(r.get("latency") or 0),
            "recent_ban_rate": ban_rate,
            "target_class": r.get("target_class") or "generic",
        }
        X.append(feature_vector(f))
        y.append(1 if (ban_rate + captcha_rate) >= config.BAN_LABEL_THRESHOLD else 0)
    return X, y, len(X)
