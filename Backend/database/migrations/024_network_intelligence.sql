-- 024_network_intelligence.sql
-- AI/ML network-intelligence layer: model registry, feature store, ban-probability
-- snapshots, forecasts, anomaly events, and append-only inference logs.
-- Models are REAL (coefficients/params persisted here, served by Node + Python).
-- Append-only tables reuse public.deny_audit_mutation() (migration 017).

BEGIN;

-- ── 1) Model registry — versioned, with active/shadow promotion ───────────────
-- params holds the actual learned model (e.g. logistic-regression weights+bias,
-- Holt-Winters alpha/beta/gamma, anomaly baselines). status drives serving.
CREATE TABLE IF NOT EXISTS public.ml_models (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,                    -- ban_predictor|anomaly|forecast_bandwidth|route_scorer|churn
  version       INTEGER NOT NULL,
  algorithm     TEXT NOT NULL,                    -- logistic_regression|holt_winters|robust_zscore|isolation_forest|gbdt
  framework     TEXT NOT NULL DEFAULT 'node',     -- node|sklearn
  params        JSONB NOT NULL DEFAULT '{}'::jsonb,
  feature_names TEXT[] NOT NULL DEFAULT '{}',
  metrics       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {auc, logloss, mae, rmse, accuracy}
  trained_rows  BIGINT NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'shadow',   -- active|shadow|archived
  trained_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ml_models_name_ver ON public.ml_models (name, version);
-- At most one active model per name.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ml_models_active ON public.ml_models (name) WHERE status = 'active';

-- ── 2) Model evaluation metrics over time (drift + accuracy tracking) ─────────
CREATE TABLE IF NOT EXISTS public.ml_model_metrics (
  id           BIGSERIAL PRIMARY KEY,
  model_name   TEXT NOT NULL,
  version      INTEGER,
  metric       TEXT NOT NULL,                     -- auc|logloss|mae|psi|ks|accuracy|drift
  value        DOUBLE PRECISION NOT NULL,
  window_start TIMESTAMPTZ,
  window_end   TIMESTAMPTZ,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ml_metrics_name ON public.ml_model_metrics (model_name, metric, evaluated_at DESC);

-- ── 3) Provider feature store (rolling computed features) ─────────────────────
CREATE TABLE IF NOT EXISTS public.provider_features (
  id            BIGSERIAL PRIMARY KEY,
  provider      TEXT NOT NULL,
  bucket        TIMESTAMPTZ NOT NULL,
  success_rate  DOUBLE PRECISION,                 -- 0..1
  ban_rate      DOUBLE PRECISION,                 -- 0..1
  p50_latency   DOUBLE PRECISION,
  p95_latency   DOUBLE PRECISION,
  throughput_gb DOUBLE PRECISION,
  cost_per_gb   DOUBLE PRECISION,
  efficiency    DOUBLE PRECISION,                 -- success / cost (margin-aware)
  sample_count  BIGINT NOT NULL DEFAULT 0,
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_features ON public.provider_features (provider, bucket);

-- ── 4) ASN quality scores (ML-derived; distinct from operator asn_intelligence) ─
CREATE TABLE IF NOT EXISTS public.asn_quality_scores (
  asn           INTEGER PRIMARY KEY,
  quality_score DOUBLE PRECISION NOT NULL DEFAULT 50,  -- 0..100
  success_rate  DOUBLE PRECISION,
  ban_rate      DOUBLE PRECISION,
  latency_p50   DOUBLE PRECISION,
  sample_count  BIGINT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5) Geo latency models (per-country latency distribution) ──────────────────
CREATE TABLE IF NOT EXISTS public.geo_latency_models (
  country       TEXT PRIMARY KEY,
  p50           DOUBLE PRECISION,
  p95           DOUBLE PRECISION,
  p99           DOUBLE PRECISION,
  jitter        DOUBLE PRECISION,
  sample_count  BIGINT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 6) Ban-probability snapshots per route key (served to the gateway) ────────
CREATE TABLE IF NOT EXISTS public.ban_probability_models (
  id            BIGSERIAL PRIMARY KEY,
  route_key     TEXT NOT NULL,                    -- provider|country|target_class
  provider      TEXT,
  country       TEXT,
  target_class  TEXT,
  ban_probability DOUBLE PRECISION NOT NULL,      -- 0..1
  features      JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_version INTEGER,
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ban_prob_route ON public.ban_probability_models (route_key);

-- ── 7) Forecasts (bandwidth/cost/quota/churn/demand) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.forecasts (
  id            BIGSERIAL PRIMARY KEY,
  entity_type   TEXT NOT NULL,                    -- org|provider|region|platform
  entity_id     TEXT NOT NULL,
  metric        TEXT NOT NULL,                    -- bandwidth_gb|cost_usd|quota_exhaustion|churn_risk|demand
  horizon_days  INTEGER NOT NULL DEFAULT 30,
  point_value   DOUBLE PRECISION,                 -- headline number (e.g. churn prob, days-to-exhaustion)
  forecast      JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{date, yhat, lower, upper}]
  model         TEXT,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_forecasts_entity ON public.forecasts (entity_type, entity_id, metric, generated_at DESC);

-- ── 8) Anomaly events (detected by the anomaly engine) ────────────────────────
CREATE TABLE IF NOT EXISTS public.anomaly_events (
  id            BIGSERIAL PRIMARY KEY,
  scope         TEXT NOT NULL,                    -- provider|org|asn|region|platform|target
  entity_id     TEXT NOT NULL,
  metric        TEXT NOT NULL,                    -- bandwidth|success_rate|ban_rate|latency|fanout
  observed      DOUBLE PRECISION,
  expected      DOUBLE PRECISION,
  score         DOUBLE PRECISION,                 -- robust z / anomaly score
  severity      TEXT NOT NULL DEFAULT 'medium',   -- low|medium|high|critical
  status        TEXT NOT NULL DEFAULT 'open',     -- open|mitigated|resolved|false_positive
  mitigation    JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_anomaly_scope ON public.anomaly_events (scope, entity_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_open ON public.anomaly_events (status, severity, detected_at DESC);

-- ── 9) Inference logs (append-only — telemetry integrity + drift datasets) ────
CREATE TABLE IF NOT EXISTS public.inference_logs (
  id            BIGSERIAL PRIMARY KEY,
  model_name    TEXT NOT NULL,
  model_version INTEGER,
  source        TEXT NOT NULL DEFAULT 'node',     -- node|sklearn|gateway
  features      JSONB NOT NULL DEFAULT '{}'::jsonb,
  output        JSONB NOT NULL DEFAULT '{}'::jsonb,
  latency_ms    DOUBLE PRECISION,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inference_logs_model ON public.inference_logs (model_name, created_at DESC);

CREATE TRIGGER trg_inference_logs_no_mutate
  BEFORE UPDATE OR DELETE ON public.inference_logs
  FOR EACH ROW EXECUTE FUNCTION public.deny_audit_mutation();

COMMIT;
