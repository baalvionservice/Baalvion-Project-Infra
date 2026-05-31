-- Credit domain: receivables financing (invoice finance / factoring) + trade BNPL.
-- One isolated schema per service. Money is numeric(19,4); rates are numeric(9,6).
CREATE SCHEMA IF NOT EXISTS credit;

-- =====================================================================================
-- Invoice Finance (factoring / invoice discounting)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS credit.financed_invoices (
  id               UUID PRIMARY KEY,
  tenant_id        UUID NOT NULL,
  reference        VARCHAR(40) NOT NULL,            -- platform finance reference (IF-YYYY-XXXXXXXX)
  idempotency_key  VARCHAR(255) NOT NULL,
  invoice_number   VARCHAR(120) NOT NULL,           -- the seller's commercial invoice number
  status           VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, ASSESSED, APPROVED, REJECTED, FUNDED, COLLECTED, OVERDUE, DEFAULTED

  seller_id        UUID,                            -- financee (receives the advance)
  seller_name      VARCHAR(255) NOT NULL,
  debtor_id        UUID,                            -- the buyer who owes the invoice
  debtor_name      VARCHAR(255) NOT NULL,

  face_amount      NUMERIC(19,4) NOT NULL,          -- invoice value
  currency         VARCHAR(3) NOT NULL,
  issue_date       DATE,
  due_date         DATE NOT NULL,

  advance_rate     NUMERIC(9,6) NOT NULL DEFAULT 0, -- fraction of face advanced
  advance_amount   NUMERIC(19,4) NOT NULL DEFAULT 0,
  fee_rate         NUMERIC(9,6) NOT NULL DEFAULT 0, -- effective discount fee fraction for the tenor
  fee_amount       NUMERIC(19,4) NOT NULL DEFAULT 0,
  reserve_amount   NUMERIC(19,4) NOT NULL DEFAULT 0, -- face - advance, remitted on collection (net of fee)
  collected_amount NUMERIC(19,4) NOT NULL DEFAULT 0,

  risk_grade       VARCHAR(2),                      -- A..E
  risk_score       INT,                             -- 0..1000
  risk_rationale   TEXT,

  created_by       VARCHAR(255),
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMP NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP,
  funded_at        TIMESTAMP,
  collected_at     TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_if_tenant_ref   ON credit.financed_invoices (tenant_id, reference);
CREATE UNIQUE INDEX IF NOT EXISTS uq_if_tenant_idem  ON credit.financed_invoices (tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_if_tenant_status      ON credit.financed_invoices (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_if_seller             ON credit.financed_invoices (tenant_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_if_due                ON credit.financed_invoices (due_date);

CREATE TABLE IF NOT EXISTS credit.invoice_collections (
  id            UUID PRIMARY KEY,
  invoice_id    UUID NOT NULL REFERENCES credit.financed_invoices (id),
  tenant_id     UUID NOT NULL,
  amount        NUMERIC(19,4) NOT NULL,
  reference     VARCHAR(255),
  created_by    VARCHAR(255),
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_if_coll_invoice ON credit.invoice_collections (invoice_id);

-- =====================================================================================
-- Trade BNPL (Buy Now, Pay Later — bullet term or installments)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS credit.bnpl_plans (
  id                UUID PRIMARY KEY,
  tenant_id         UUID NOT NULL,
  reference         VARCHAR(40) NOT NULL,           -- BNPL-YYYY-XXXXXXXX
  idempotency_key   VARCHAR(255) NOT NULL,
  order_ref         VARCHAR(255),
  status            VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, ACTIVE, SETTLED, DELINQUENT, DEFAULTED, WRITTEN_OFF, CANCELLED

  buyer_id          UUID,
  buyer_name        VARCHAR(255) NOT NULL,
  merchant_id       UUID,                           -- seller paid up-front by the financier
  merchant_name     VARCHAR(255) NOT NULL,

  principal         NUMERIC(19,4) NOT NULL,         -- amount financed (paid to merchant)
  currency          VARCHAR(3) NOT NULL,
  term_type         VARCHAR(20) NOT NULL,           -- BULLET, INSTALLMENTS
  installment_count INT NOT NULL DEFAULT 1,
  tenor_days        INT NOT NULL,                   -- bullet tenor or interval*count
  interest_rate     NUMERIC(9,6) NOT NULL DEFAULT 0, -- effective finance charge fraction over the tenor
  interest_amount   NUMERIC(19,4) NOT NULL DEFAULT 0,
  total_payable     NUMERIC(19,4) NOT NULL DEFAULT 0, -- principal + interest
  outstanding       NUMERIC(19,4) NOT NULL DEFAULT 0, -- remaining repayable
  late_fees         NUMERIC(19,4) NOT NULL DEFAULT 0,

  risk_grade        VARCHAR(2),
  risk_score        INT,
  risk_rationale    TEXT,

  created_by        VARCHAR(255),
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMP NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP,
  disbursed_at      TIMESTAMP,
  settled_at        TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bnpl_tenant_ref  ON credit.bnpl_plans (tenant_id, reference);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bnpl_tenant_idem ON credit.bnpl_plans (tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_bnpl_tenant_status     ON credit.bnpl_plans (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_bnpl_buyer             ON credit.bnpl_plans (tenant_id, buyer_id);

CREATE TABLE IF NOT EXISTS credit.bnpl_installments (
  id                  UUID PRIMARY KEY,
  plan_id             UUID NOT NULL REFERENCES credit.bnpl_plans (id),
  tenant_id           UUID NOT NULL,
  sequence_no         INT NOT NULL,
  due_date            DATE NOT NULL,
  amount              NUMERIC(19,4) NOT NULL,        -- total due for this installment
  principal_component NUMERIC(19,4) NOT NULL DEFAULT 0,
  interest_component  NUMERIC(19,4) NOT NULL DEFAULT 0,
  paid_amount         NUMERIC(19,4) NOT NULL DEFAULT 0,
  late_fee            NUMERIC(19,4) NOT NULL DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'DUE', -- DUE, PAID, OVERDUE, WAIVED
  paid_at             TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bnpl_inst_seq ON credit.bnpl_installments (plan_id, sequence_no);
CREATE INDEX IF NOT EXISTS idx_bnpl_inst_plan      ON credit.bnpl_installments (plan_id);
CREATE INDEX IF NOT EXISTS idx_bnpl_inst_due       ON credit.bnpl_installments (status, due_date);

CREATE TABLE IF NOT EXISTS credit.bnpl_repayments (
  id            UUID PRIMARY KEY,
  plan_id       UUID NOT NULL REFERENCES credit.bnpl_plans (id),
  installment_id UUID REFERENCES credit.bnpl_installments (id),
  tenant_id     UUID NOT NULL,
  amount        NUMERIC(19,4) NOT NULL,
  reference     VARCHAR(255),
  created_by    VARCHAR(255),
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bnpl_repay_plan ON credit.bnpl_repayments (plan_id);
