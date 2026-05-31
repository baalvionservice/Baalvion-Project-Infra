-- Smart Contract domain: binding sale contracts (Incoterms 2020 + UCP 600 clauses) with
-- e-signature. One isolated schema per service. Money is numeric(19,4).
CREATE SCHEMA IF NOT EXISTS smart_contract;

-- =====================================================================================
-- Trade contracts
-- =====================================================================================
CREATE TABLE IF NOT EXISTS smart_contract.trade_contracts (
  id                    UUID PRIMARY KEY,
  tenant_id             UUID NOT NULL,
  idempotency_key       VARCHAR(255) NOT NULL,
  contract_number       VARCHAR(40) NOT NULL,
  origin_type           VARCHAR(20) NOT NULL DEFAULT 'DEAL',   -- DEAL, TERM_SHEET, ORDER, MANUAL
  origin_id             UUID,
  deal_id               UUID,
  term_sheet_id         UUID,

  buyer_id              UUID NOT NULL,
  buyer_name            VARCHAR(255) NOT NULL,
  seller_id             UUID NOT NULL,
  seller_name           VARCHAR(255) NOT NULL,

  commodity             VARCHAR(255),
  description           TEXT,
  quantity              NUMERIC(19,4) NOT NULL,
  unit                  VARCHAR(20),
  price                 NUMERIC(19,4) NOT NULL,
  currency              VARCHAR(3) NOT NULL,
  total_value           NUMERIC(19,4) NOT NULL,

  incoterm              VARCHAR(11) NOT NULL,                   -- Incoterms 2020: EXW..DDP
  named_place           VARCHAR(255),                          -- Incoterms named place/port
  payment_method        VARCHAR(20) NOT NULL DEFAULT 'TT',     -- LC, BG, TT, OA, BNPL, ESCROW
  delivery_date         DATE,
  port_of_loading       VARCHAR(255),
  port_of_discharge     VARCHAR(255),

  governing_law         VARCHAR(255),
  dispute_resolution    VARCHAR(255),
  clauses               JSONB NOT NULL DEFAULT '[]',           -- ordered clause list (heading + text)

  status                VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT, ISSUED, OUT_FOR_SIGNATURE, SIGNED, EXECUTED, VOID, TERMINATED
  envelope_id           VARCHAR(255),                          -- e-signature provider envelope ref
  esign_provider        VARCHAR(40),
  created_by            VARCHAR(255),
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMP NOT NULL DEFAULT now(),
  updated_at            TIMESTAMP,
  issued_at             TIMESTAMP,
  executed_at           TIMESTAMP,
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (tenant_id, contract_number)
);
CREATE INDEX IF NOT EXISTS idx_sc_tenant_status ON smart_contract.trade_contracts (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_sc_deal ON smart_contract.trade_contracts (deal_id);

-- =====================================================================================
-- Signatures — one row per party that must sign.
-- =====================================================================================
CREATE TABLE IF NOT EXISTS smart_contract.contract_signatures (
  id                    UUID PRIMARY KEY,
  contract_id           UUID NOT NULL REFERENCES smart_contract.trade_contracts(id) ON DELETE CASCADE,
  tenant_id             UUID NOT NULL,
  party                 VARCHAR(10) NOT NULL,                  -- BUYER, SELLER, WITNESS
  signer_name           VARCHAR(255),
  signer_email          VARCHAR(255),
  status                VARCHAR(12) NOT NULL DEFAULT 'PENDING', -- PENDING, SIGNED, DECLINED, EXPIRED
  provider_ref          VARCHAR(255),
  signed_at             TIMESTAMP,
  declined_reason       TEXT,
  ip_address            VARCHAR(45),
  created_at            TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (contract_id, party)
);
CREATE INDEX IF NOT EXISTS idx_sig_contract ON smart_contract.contract_signatures (contract_id);
