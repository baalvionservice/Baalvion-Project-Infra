"""Runtime configuration for the Baalvion ML service (env-driven, 12-factor)."""
import os
import sys

# Known insecure dev-placeholder values that must never reach production.
_DEV_SECRET_LITERALS = {"", "dev", "secret", "changeme", "ml_secret", "ml-secret", "test"}


class Config:
    # HMAC shared secret with the Node control plane (mlInferenceClient.js).
    ML_SERVICE_SECRET = os.getenv("ML_SERVICE_SECRET", "")
    # Replay window for signed requests (seconds).
    SIGNATURE_TTL_S = int(os.getenv("ML_SIGNATURE_TTL_S", "300"))

    # Postgres (model registry + feature store metadata). Same DB as the platform.
    DATABASE_URL = os.getenv("DATABASE_URL", "")

    # ClickHouse HTTP interface (training datasets / feature MVs). Optional.
    CLICKHOUSE_URL = os.getenv("CLICKHOUSE_URL", "")
    CLICKHOUSE_DB = os.getenv("CLICKHOUSE_DB", "baalvion")

    # Where joblib model artifacts are stored (PVC / S3-mounted path).
    MODEL_DIR = os.getenv("MODEL_DIR", "/var/lib/baalvion/models")

    # Training thresholds.
    BAN_LABEL_THRESHOLD = float(os.getenv("BAN_LABEL_THRESHOLD", "0.15"))
    MIN_TRAIN_ROWS = int(os.getenv("MIN_TRAIN_ROWS", "50"))
    PROMOTE_AUC = float(os.getenv("PROMOTE_AUC", "0.6"))


config = Config()

# --- Production secret fail-fast -------------------------------------------
# APP_ENV / NODE_ENV (Node parity) / ENV are all accepted as the env indicator.
_app_env = (
    os.getenv("APP_ENV") or os.getenv("NODE_ENV") or os.getenv("ENV") or ""
).strip().lower()

if _app_env == "production":
    if config.ML_SERVICE_SECRET.strip().lower() in _DEV_SECRET_LITERALS:
        print(
            "[ml-service] FATAL: ML_SERVICE_SECRET is unset or uses a known dev "
            "placeholder. Set a strong secret before starting in production.",
            file=sys.stderr,
        )
        sys.exit(1)
# ---------------------------------------------------------------------------
