"""Model registry — writes sklearn model metadata into the SAME `ml_models`
table the Node registry uses (framework='sklearn', params point at the joblib
artifact path), so the platform has one unified, versioned model catalogue.
Resilient: when DATABASE_URL is unset it falls back to an in-memory version
counter so the service still runs in isolation."""
from __future__ import annotations

import json

from .config import config

_mem_versions: dict[str, int] = {}


def _connect():
    if not config.DATABASE_URL:
        return None
    import psycopg2  # imported lazily so the service boots without a DB

    return psycopg2.connect(config.DATABASE_URL)


def next_version(name: str) -> int:
    conn = _connect()
    if conn is None:
        _mem_versions[name] = _mem_versions.get(name, 0) + 1
        return _mem_versions[name]
    try:
        with conn, conn.cursor() as cur:
            cur.execute("SELECT COALESCE(MAX(version),0)+1 FROM ml_models WHERE name=%s", (name,))
            return int(cur.fetchone()[0])
    finally:
        conn.close()


def register(name: str, version: int, algorithm: str, params: dict, feature_names: list[str],
             metrics: dict, trained_rows: int, activate: bool) -> dict:
    conn = _connect()
    if conn is None:
        return {"name": name, "version": version, "status": "active" if activate else "shadow", "persisted": False}
    try:
        with conn, conn.cursor() as cur:
            if activate:
                cur.execute(
                    "UPDATE ml_models SET status='archived' WHERE name=%s AND status='active'", (name,)
                )
            cur.execute(
                """INSERT INTO ml_models
                   (name, version, algorithm, framework, params, feature_names, metrics, trained_rows, status)
                   VALUES (%s,%s,%s,'sklearn',%s::jsonb,%s,%s::jsonb,%s,%s)""",
                (name, version, algorithm, json.dumps(params), feature_names,
                 json.dumps(metrics), trained_rows, "active" if activate else "shadow"),
            )
        return {"name": name, "version": version, "status": "active" if activate else "shadow", "persisted": True}
    finally:
        conn.close()


def record_metric(name: str, version: int, metric: str, value: float) -> None:
    conn = _connect()
    if conn is None:
        return
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO ml_model_metrics (model_name, version, metric, value) VALUES (%s,%s,%s,%s)",
                (name, version, metric, float(value)),
            )
    finally:
        conn.close()


def list_models() -> list[dict]:
    conn = _connect()
    if conn is None:
        return []
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "SELECT name, version, algorithm, framework, status, trained_rows, metrics, trained_at "
                "FROM ml_models ORDER BY name, version DESC"
            )
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]
    finally:
        conn.close()
