-- Deal Room domain: real-time bilateral trade negotiation → counter-offers → signed term sheet.
-- One isolated schema per service (platform boundary rule). Money is numeric(19,4).
CREATE SCHEMA IF NOT EXISTS deal_room;

-- =====================================================================================
-- Deal rooms — one negotiation per buyer/seller pair, originating from a listing or RFQ.
-- =====================================================================================
CREATE TABLE IF NOT EXISTS deal_room.deal_rooms (
  id                  UUID PRIMARY KEY,
  tenant_id           UUID NOT NULL,
  idempotency_key     VARCHAR(255) NOT NULL,
  reference           VARCHAR(40) NOT NULL,            -- human ref, e.g. DR-2026-AB12CD34
  origin_type         VARCHAR(20) NOT NULL DEFAULT 'LISTING', -- LISTING, RFQ, DIRECT
  origin_id           UUID,
  title               VARCHAR(255) NOT NULL,
  commodity           VARCHAR(255),
  buyer_id            UUID NOT NULL,
  buyer_name          VARCHAR(255),
  seller_id           UUID NOT NULL,
  seller_name         VARCHAR(255),
  status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',  -- OPEN, NEGOTIATING, AGREED, REJECTED, EXPIRED, CANCELLED
  -- current best terms on the table (mirror of the latest live counter-offer)
  current_price       NUMERIC(19,4),
  current_quantity    NUMERIC(19,4),
  unit                VARCHAR(20),
  currency            VARCHAR(3) NOT NULL,
  incoterm            VARCHAR(11),
  current_offer_by    VARCHAR(10),                     -- BUYER, SELLER (who owns the live offer)
  round_count         INT NOT NULL DEFAULT 0,
  term_sheet_id       UUID,
  agreed_at           TIMESTAMP,
  expires_at          TIMESTAMP NOT NULL,
  created_by          VARCHAR(255),
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMP NOT NULL DEFAULT now(),
  updated_at          TIMESTAMP,
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (tenant_id, reference)
);
CREATE INDEX IF NOT EXISTS idx_dr_tenant_status ON deal_room.deal_rooms (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_dr_buyer  ON deal_room.deal_rooms (tenant_id, buyer_id);
CREATE INDEX IF NOT EXISTS idx_dr_seller ON deal_room.deal_rooms (tenant_id, seller_id);

-- =====================================================================================
-- Counter-offers — each negotiation round; the latest PROPOSED is the live offer.
-- =====================================================================================
CREATE TABLE IF NOT EXISTS deal_room.counter_offers (
  id                  UUID PRIMARY KEY,
  deal_id             UUID NOT NULL REFERENCES deal_room.deal_rooms(id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL,
  round               INT NOT NULL,
  offered_by          VARCHAR(10) NOT NULL,            -- BUYER, SELLER
  price               NUMERIC(19,4) NOT NULL,
  quantity            NUMERIC(19,4) NOT NULL,
  unit                VARCHAR(20),
  currency            VARCHAR(3) NOT NULL,
  incoterm            VARCHAR(11),
  delivery_terms      TEXT,
  payment_terms       TEXT,
  message             TEXT,
  status              VARCHAR(12) NOT NULL DEFAULT 'PROPOSED', -- PROPOSED, ACCEPTED, REJECTED, SUPERSEDED, EXPIRED
  valid_until         TIMESTAMP,
  created_by          VARCHAR(255),
  created_at          TIMESTAMP NOT NULL DEFAULT now(),
  decided_at          TIMESTAMP,
  UNIQUE (deal_id, round)
);
CREATE INDEX IF NOT EXISTS idx_co_deal ON deal_room.counter_offers (deal_id);
CREATE INDEX IF NOT EXISTS idx_co_deal_status ON deal_room.counter_offers (deal_id, status);

-- =====================================================================================
-- Term sheets — generated on acceptance; EXECUTED when both parties sign.
-- =====================================================================================
CREATE TABLE IF NOT EXISTS deal_room.term_sheets (
  id                  UUID PRIMARY KEY,
  deal_id             UUID NOT NULL REFERENCES deal_room.deal_rooms(id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL,
  version             INT NOT NULL DEFAULT 1,
  price               NUMERIC(19,4) NOT NULL,
  quantity            NUMERIC(19,4) NOT NULL,
  unit                VARCHAR(20),
  currency            VARCHAR(3) NOT NULL,
  total_value         NUMERIC(19,4) NOT NULL,
  incoterm            VARCHAR(11),
  payment_terms       TEXT,
  delivery_terms      TEXT,
  delivery_date       DATE,
  terms               JSONB NOT NULL DEFAULT '{}',
  status              VARCHAR(20) NOT NULL DEFAULT 'AWAITING_SIGNATURES', -- DRAFT, AWAITING_SIGNATURES, EXECUTED, VOID
  buyer_signed_at     TIMESTAMP,
  buyer_signed_by     VARCHAR(255),
  seller_signed_at    TIMESTAMP,
  seller_signed_by    VARCHAR(255),
  executed_at         TIMESTAMP,
  created_at          TIMESTAMP NOT NULL DEFAULT now(),
  updated_at          TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ts_deal ON deal_room.term_sheets (deal_id);

-- =====================================================================================
-- Deal messages — the negotiation chat thread.
-- =====================================================================================
CREATE TABLE IF NOT EXISTS deal_room.deal_messages (
  id                  UUID PRIMARY KEY,
  deal_id             UUID NOT NULL REFERENCES deal_room.deal_rooms(id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL,
  sender_id           VARCHAR(255),
  sender_role         VARCHAR(10),                     -- BUYER, SELLER, SYSTEM
  body                TEXT NOT NULL,
  kind                VARCHAR(20) NOT NULL DEFAULT 'CHAT', -- CHAT, SYSTEM, OFFER, EVENT
  created_at          TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dm_deal ON deal_room.deal_messages (deal_id, created_at);
