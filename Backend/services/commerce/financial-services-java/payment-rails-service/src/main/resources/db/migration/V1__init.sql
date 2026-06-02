-- Payment Rails domain: route + settle outbound/inbound payments across clearing rails.
-- One isolated schema per service. Money is numeric(19,4).
CREATE SCHEMA IF NOT EXISTS payment_rails;

CREATE TABLE IF NOT EXISTS payment_rails.payment_instructions (
  id                  UUID PRIMARY KEY,
  tenant_id           UUID NOT NULL,
  idempotency_key     VARCHAR(255) NOT NULL,
  reference           VARCHAR(40) NOT NULL,             -- e.g. PR-2026-AB12CD34
  direction           VARCHAR(10) NOT NULL DEFAULT 'OUTBOUND', -- OUTBOUND, INBOUND

  -- debtor (payer) / creditor (payee)
  debtor_name         VARCHAR(255),
  debtor_account      VARCHAR(64),
  debtor_country      VARCHAR(2),
  creditor_name       VARCHAR(255) NOT NULL,
  creditor_account    VARCHAR(64),                      -- IBAN / account number
  creditor_bic        VARCHAR(11),                      -- SWIFT/BIC
  creditor_routing    VARCHAR(34),                      -- ABA / IFSC / sort code etc.
  creditor_country    VARCHAR(2) NOT NULL,              -- ISO 3166-1 alpha-2

  amount              NUMERIC(19,4) NOT NULL,
  currency            VARCHAR(3) NOT NULL,
  purpose             VARCHAR(255),
  urgency             VARCHAR(10) NOT NULL DEFAULT 'STANDARD', -- STANDARD, INSTANT, PRIORITY

  requested_rail      VARCHAR(16),                      -- caller's optional rail preference
  rail                VARCHAR(16),                      -- chosen rail (SWIFT, SEPA, ACH, UPI, PIX, ...)
  rail_ref            VARCHAR(255),                     -- provider/scheme settlement reference
  fee_amount          NUMERIC(19,4) NOT NULL DEFAULT 0,
  fee_currency        VARCHAR(3),
  provider            VARCHAR(40),

  status              VARCHAR(12) NOT NULL DEFAULT 'INITIATED', -- INITIATED, ROUTED, SUBMITTED, SETTLED, FAILED, RETURNED, CANCELLED
  failure_reason      TEXT,
  routing_note        TEXT,                             -- why this rail was chosen
  created_by          VARCHAR(255),
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMP NOT NULL DEFAULT now(),
  updated_at          TIMESTAMP,
  submitted_at        TIMESTAMP,
  settled_at          TIMESTAMP,
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (tenant_id, reference)
);
CREATE INDEX IF NOT EXISTS idx_pr_tenant_status ON payment_rails.payment_instructions (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_pr_rail ON payment_rails.payment_instructions (rail);
CREATE INDEX IF NOT EXISTS idx_pr_rail_ref ON payment_rails.payment_instructions (rail_ref);
