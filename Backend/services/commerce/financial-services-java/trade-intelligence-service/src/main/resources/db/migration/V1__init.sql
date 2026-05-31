-- Trade Intelligence domain: persisted demand forecasts + supplier-risk assessments.
-- One isolated schema per service. NL-assistant and BTI responses are computed on demand.
CREATE SCHEMA IF NOT EXISTS trade_intelligence;

-- =====================================================================================
-- Demand forecasts — predicted demand per commodity/region over a horizon.
-- =====================================================================================
CREATE TABLE IF NOT EXISTS trade_intelligence.demand_forecasts (
  id                UUID PRIMARY KEY,
  tenant_id         UUID NOT NULL,
  commodity         VARCHAR(255) NOT NULL,
  region            VARCHAR(64),
  horizon_days      INT NOT NULL,
  predicted_total   NUMERIC(19,4),
  unit              VARCHAR(20),
  confidence        NUMERIC(5,4),               -- 0..1
  points            JSONB NOT NULL DEFAULT '[]', -- [{date, predicted, low, high}]
  provider          VARCHAR(40),
  generated_at      TIMESTAMP NOT NULL DEFAULT now(),
  metadata          JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_df_tenant_commodity ON trade_intelligence.demand_forecasts (tenant_id, commodity);
CREATE INDEX IF NOT EXISTS idx_df_generated ON trade_intelligence.demand_forecasts (generated_at DESC);

-- =====================================================================================
-- Supplier risk — 0-100 default-risk score with an early-warning flag.
-- =====================================================================================
CREATE TABLE IF NOT EXISTS trade_intelligence.supplier_risks (
  id                UUID PRIMARY KEY,
  tenant_id         UUID NOT NULL,
  supplier_id       UUID NOT NULL,
  supplier_name     VARCHAR(255),
  score             NUMERIC(5,2) NOT NULL,      -- 0..100 (higher = riskier)
  grade             VARCHAR(10) NOT NULL,       -- LOW, MEDIUM, HIGH, CRITICAL
  early_warning     BOOLEAN NOT NULL DEFAULT FALSE,
  factors           JSONB NOT NULL DEFAULT '{}', -- {onTimeDelivery, disputeRate, financialHealth, ...}
  summary           TEXT,
  provider          VARCHAR(40),
  assessed_at       TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sr_tenant_supplier ON trade_intelligence.supplier_risks (tenant_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_sr_assessed ON trade_intelligence.supplier_risks (assessed_at DESC);
