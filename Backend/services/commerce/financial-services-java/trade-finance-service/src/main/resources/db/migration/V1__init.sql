-- Trade Finance domain: documentary credits (UCP 600) + independent guarantees (URDG 758).
-- One isolated schema per service (platform boundary rule). Money is numeric(19,4).
CREATE SCHEMA IF NOT EXISTS trade_finance;

-- =====================================================================================
-- Letters of Credit (documentary credits)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS trade_finance.letters_of_credit (
  id                       UUID PRIMARY KEY,
  tenant_id                UUID NOT NULL,
  lc_number                VARCHAR(40) NOT NULL,
  idempotency_key          VARCHAR(255) NOT NULL,
  lc_type                  VARCHAR(20) NOT NULL,           -- SIGHT, USANCE, DEFERRED, REVOLVING, TRANSFERABLE, STANDBY
  status                   VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

  applicant_id             UUID,                            -- buyer (orders the credit)
  applicant_name           VARCHAR(255) NOT NULL,
  beneficiary_id           UUID,                            -- seller (receives payment)
  beneficiary_name         VARCHAR(255) NOT NULL,
  issuing_bank             VARCHAR(255),
  advising_bank            VARCHAR(255),
  confirming_bank          VARCHAR(255),

  amount                   NUMERIC(19,4) NOT NULL,
  available_amount         NUMERIC(19,4) NOT NULL,          -- remaining drawable balance
  settled_amount           NUMERIC(19,4) NOT NULL DEFAULT 0,
  currency                 VARCHAR(3) NOT NULL,
  tolerance_pct            NUMERIC(5,2) NOT NULL DEFAULT 0, -- credit amount tolerance (UCP 600 art.30)

  incoterm                 VARCHAR(11),
  goods_description        TEXT,
  port_of_loading          VARCHAR(255),
  port_of_discharge        VARCHAR(255),
  partial_shipment_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  transhipment_allowed     BOOLEAN NOT NULL DEFAULT FALSE,
  latest_shipment_date     DATE,
  expiry_date              DATE NOT NULL,
  expiry_place             VARCHAR(255),
  required_documents       JSONB NOT NULL DEFAULT '[]',

  commission_amount        NUMERIC(19,4) NOT NULL DEFAULT 0,
  margin_rate              NUMERIC(6,4) NOT NULL DEFAULT 0,
  margin_amount            NUMERIC(19,4) NOT NULL DEFAULT 0, -- cash collateral blocked on the applicant

  scheme_ref               VARCHAR(100),                     -- external issuing-bank / SWIFT reference (MT700)
  created_by               VARCHAR(255),
  metadata                 JSONB NOT NULL DEFAULT '{}',
  created_at               TIMESTAMP NOT NULL DEFAULT now(),
  updated_at               TIMESTAMP,
  issued_at                TIMESTAMP,
  settled_at               TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_lc_tenant_number ON trade_finance.letters_of_credit (tenant_id, lc_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_lc_tenant_idem   ON trade_finance.letters_of_credit (tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_lc_tenant_status       ON trade_finance.letters_of_credit (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_lc_beneficiary         ON trade_finance.letters_of_credit (tenant_id, beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_lc_expiry              ON trade_finance.letters_of_credit (expiry_date);

CREATE TABLE IF NOT EXISTS trade_finance.lc_amendments (
  id                UUID PRIMARY KEY,
  lc_id             UUID NOT NULL REFERENCES trade_finance.letters_of_credit (id),
  tenant_id         UUID NOT NULL,
  amendment_number  INT NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'PROPOSED', -- PROPOSED, ACCEPTED, REJECTED
  new_amount        NUMERIC(19,4),
  new_expiry_date   DATE,
  changes           JSONB NOT NULL DEFAULT '{}',
  reason            TEXT,
  requires_consent  BOOLEAN NOT NULL DEFAULT TRUE,           -- UCP 600 art.10: beneficiary must consent
  consented_by      VARCHAR(255),
  created_by        VARCHAR(255),
  created_at        TIMESTAMP NOT NULL DEFAULT now(),
  decided_at        TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_lc_amend_seq ON trade_finance.lc_amendments (lc_id, amendment_number);
CREATE INDEX IF NOT EXISTS idx_lc_amend_lc        ON trade_finance.lc_amendments (lc_id);

CREATE TABLE IF NOT EXISTS trade_finance.lc_presentations (
  id                   UUID PRIMARY KEY,
  lc_id                UUID NOT NULL REFERENCES trade_finance.letters_of_credit (id),
  tenant_id            UUID NOT NULL,
  presentation_number  INT NOT NULL,
  status               VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, UNDER_EXAMINATION, COMPLYING, DISCREPANT, WAIVED, REJECTED, SETTLED
  presented_amount     NUMERIC(19,4) NOT NULL,
  documents            JSONB NOT NULL DEFAULT '[]',
  discrepancies        JSONB NOT NULL DEFAULT '[]',
  examination_due_date DATE,                                    -- UCP 600 art.14(b): 5 banking days
  examined_by          VARCHAR(255),
  waived               BOOLEAN NOT NULL DEFAULT FALSE,
  created_by           VARCHAR(255),
  created_at           TIMESTAMP NOT NULL DEFAULT now(),
  examined_at          TIMESTAMP,
  settled_at           TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_lc_pres_seq ON trade_finance.lc_presentations (lc_id, presentation_number);
CREATE INDEX IF NOT EXISTS idx_lc_pres_lc        ON trade_finance.lc_presentations (lc_id);
CREATE INDEX IF NOT EXISTS idx_lc_pres_status    ON trade_finance.lc_presentations (tenant_id, status);

-- =====================================================================================
-- Bank Guarantees (independent guarantees / standby undertakings)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS trade_finance.bank_guarantees (
  id                       UUID PRIMARY KEY,
  tenant_id                UUID NOT NULL,
  guarantee_number         VARCHAR(40) NOT NULL,
  idempotency_key          VARCHAR(255) NOT NULL,
  guarantee_type           VARCHAR(20) NOT NULL,            -- BID_BOND, PERFORMANCE, ADVANCE_PAYMENT, FINANCIAL, RETENTION, WARRANTY
  status                   VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

  applicant_id             UUID,                            -- principal / instructing party
  applicant_name           VARCHAR(255) NOT NULL,
  beneficiary_id           UUID,
  beneficiary_name         VARCHAR(255) NOT NULL,
  guarantor_bank           VARCHAR(255),

  amount                   NUMERIC(19,4) NOT NULL,
  claimed_amount           NUMERIC(19,4) NOT NULL DEFAULT 0,
  currency                 VARCHAR(3) NOT NULL,

  underlying_contract_ref  VARCHAR(255),
  purpose                  TEXT,
  governing_rules          VARCHAR(20) NOT NULL DEFAULT 'URDG_758', -- URDG_758, ISP98, LOCAL
  effective_date           DATE,
  expiry_date              DATE NOT NULL,
  auto_extend              BOOLEAN NOT NULL DEFAULT FALSE,   -- "extend or pay" clause

  commission_amount        NUMERIC(19,4) NOT NULL DEFAULT 0,
  margin_rate              NUMERIC(6,4) NOT NULL DEFAULT 0,
  margin_amount            NUMERIC(19,4) NOT NULL DEFAULT 0,

  scheme_ref               VARCHAR(100),                     -- external guarantor reference (SWIFT MT760)
  created_by               VARCHAR(255),
  metadata                 JSONB NOT NULL DEFAULT '{}',
  created_at               TIMESTAMP NOT NULL DEFAULT now(),
  updated_at               TIMESTAMP,
  issued_at                TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bg_tenant_number ON trade_finance.bank_guarantees (tenant_id, guarantee_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bg_tenant_idem   ON trade_finance.bank_guarantees (tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_bg_tenant_status       ON trade_finance.bank_guarantees (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_bg_beneficiary         ON trade_finance.bank_guarantees (tenant_id, beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_bg_expiry              ON trade_finance.bank_guarantees (expiry_date);

CREATE TABLE IF NOT EXISTS trade_finance.guarantee_claims (
  id                   UUID PRIMARY KEY,
  guarantee_id         UUID NOT NULL REFERENCES trade_finance.bank_guarantees (id),
  tenant_id            UUID NOT NULL,
  claim_number         INT NOT NULL,
  status               VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, UNDER_REVIEW, PAID, REJECTED
  claim_amount         NUMERIC(19,4) NOT NULL,
  statement            TEXT,                                     -- statement of default (URDG 758 art.15)
  supporting_documents JSONB NOT NULL DEFAULT '[]',
  decision_reason      TEXT,
  decided_by           VARCHAR(255),
  created_by           VARCHAR(255),
  created_at           TIMESTAMP NOT NULL DEFAULT now(),
  decided_at           TIMESTAMP,
  paid_at              TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bg_claim_seq ON trade_finance.guarantee_claims (guarantee_id, claim_number);
CREATE INDEX IF NOT EXISTS idx_bg_claim_g         ON trade_finance.guarantee_claims (guarantee_id);
CREATE INDEX IF NOT EXISTS idx_bg_claim_status    ON trade_finance.guarantee_claims (tenant_id, status);
