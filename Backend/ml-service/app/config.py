"""Runtime configuration for the Baalvion ML service (env-driven, 12-factor)."""
import os


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
