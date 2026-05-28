-- Migration 016: Trade Schema — Global Trade Infrastructure
-- Run: psql -U baalvion -d baalvion_db -f 016_trade_full.sql

CREATE SCHEMA IF NOT EXISTS trade;

-- ── organizations ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade.organizations (
    id                  SERIAL PRIMARY KEY,
    tenant_id           TEXT NOT NULL,
    name                VARCHAR(255) NOT NULL,
    type                VARCHAR(20) CHECK (type IN ('buyer','seller','carrier','bank','insurer','regulator')),
    country             VARCHAR(100),
    registration_number VARCHAR(100),
    status              VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active','suspended','pending')),
    contact_email       VARCHAR(255),
    kyc_status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending','verified','rejected')),
    risk_score          NUMERIC(5,2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_tenant_id ON trade.organizations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type      ON trade.organizations (type);
CREATE INDEX IF NOT EXISTS idx_organizations_status    ON trade.organizations (status);
CREATE INDEX IF NOT EXISTS idx_organizations_country   ON trade.organizations (country);

-- ── rfqs ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade.rfqs (
    id                    SERIAL PRIMARY KEY,
    tenant_id             TEXT,
    buyer_org_id          TEXT,
    title                 VARCHAR(255),
    commodity             VARCHAR(255),
    quantity              NUMERIC(15,4),
    unit                  VARCHAR(50),
    origin_country        VARCHAR(100),
    destination_country   VARCHAR(100),
    incoterm              VARCHAR(10) CHECK (incoterm IN ('EXW','FOB','CIF','DDP','DAP','FCA')),
    required_delivery_date DATE,
    budget_usd            NUMERIC(15,2),
    status                VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','closed','awarded','cancelled')),
    expires_at            TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfqs_tenant_id    ON trade.rfqs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_buyer_org_id ON trade.rfqs (buyer_org_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status       ON trade.rfqs (status);
CREATE INDEX IF NOT EXISTS idx_rfqs_commodity    ON trade.rfqs (commodity);

-- ── deals ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade.deals (
    id            SERIAL PRIMARY KEY,
    tenant_id     TEXT,
    rfq_id        TEXT,
    buyer_org_id  TEXT,
    seller_org_id TEXT,
    commodity     VARCHAR(255),
    quantity      NUMERIC(15,4),
    unit          VARCHAR(50),
    unit_price    NUMERIC(15,4),
    total_value   NUMERIC(20,2),
    currency      VARCHAR(10) DEFAULT 'USD',
    incoterm      VARCHAR(10),
    origin        VARCHAR(255),
    destination   VARCHAR(255),
    payment_terms VARCHAR(255),
    status        VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','negotiation','finalized','committed','cancelled')),
    signed_at     TIMESTAMPTZ,
    expires_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_tenant_id    ON trade.deals (tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_buyer_org_id ON trade.deals (buyer_org_id);
CREATE INDEX IF NOT EXISTS idx_deals_seller_org_id ON trade.deals (seller_org_id);
CREATE INDEX IF NOT EXISTS idx_deals_status       ON trade.deals (status);

-- ── orders ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade.orders (
    id                SERIAL PRIMARY KEY,
    tenant_id         TEXT,
    deal_id           TEXT,
    buyer_org_id      TEXT,
    seller_org_id     TEXT,
    product           VARCHAR(255),
    quantity          NUMERIC(15,4),
    price             NUMERIC(15,4),
    total_value       NUMERIC(20,2),
    currency          VARCHAR(10) DEFAULT 'USD',
    status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','in_production','shipped','delivered','cancelled')),
    fulfillment_state VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (fulfillment_state IN ('pending','production','shipped','delivered')),
    logistics_id      TEXT,
    due_date          TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_id    ON trade.orders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_deal_id      ON trade.orders (deal_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_org_id ON trade.orders (buyer_org_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_org_id ON trade.orders (seller_org_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON trade.orders (status);

-- ── escrows ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade.escrows (
    id                 SERIAL PRIMARY KEY,
    tenant_id          TEXT,
    order_id           TEXT,
    buyer_org_id       TEXT,
    seller_org_id      TEXT,
    amount             NUMERIC(20,2),
    currency           VARCHAR(10),
    status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','funded','released','refunded','disputed')),
    funded_at          TIMESTAMPTZ,
    released_at        TIMESTAMPTZ,
    release_conditions JSONB NOT NULL DEFAULT '{}',
    mandate_hash       TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrows_tenant_id  ON trade.escrows (tenant_id);
CREATE INDEX IF NOT EXISTS idx_escrows_order_id   ON trade.escrows (order_id);
CREATE INDEX IF NOT EXISTS idx_escrows_status     ON trade.escrows (status);

-- ── shipments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade.shipments (
    id               SERIAL PRIMARY KEY,
    tenant_id        TEXT,
    order_id         TEXT,
    carrier_id       TEXT,
    carrier_name     VARCHAR(255),
    tracking_number  VARCHAR(255) UNIQUE,
    vessel_name      VARCHAR(255),
    container_id     VARCHAR(100),
    origin           VARCHAR(255),
    destination      VARCHAR(255),
    status           VARCHAR(30) NOT NULL DEFAULT 'booked'
                       CHECK (status IN ('booked','picked_up','in_transit','port_processing','customs_clearance',
                                         'customs_hold','released','delivered','delayed','re_routed','cancelled')),
    estimated_arrival TIMESTAMPTZ,
    actual_arrival    TIMESTAMPTZ,
    value             NUMERIC(20,2),
    currency          VARCHAR(10),
    milestones        JSONB NOT NULL DEFAULT '[]',
    exceptions        JSONB NOT NULL DEFAULT '[]',
    iot_stream_id     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_tenant_id   ON trade.shipments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id    ON trade.shipments (order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier_id  ON trade.shipments (carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status      ON trade.shipments (status);

-- ── documents ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade.documents (
    id             SERIAL PRIMARY KEY,
    tenant_id      TEXT,
    entity_type    VARCHAR(100),
    entity_id      TEXT,
    doc_type       VARCHAR(50) CHECK (doc_type IN ('invoice','bill_of_lading','certificate_of_origin',
                                                    'packing_list','letter_of_credit','inspection_report',
                                                    'customs_declaration','insurance_certificate','other')),
    title          VARCHAR(255),
    file_url       TEXT,
    file_hash      TEXT,
    issuer_org_id  TEXT,
    status         VARCHAR(20) NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','issued','verified','rejected','expired')),
    issued_at      TIMESTAMPTZ,
    expires_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_id   ON trade.documents (tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity_type ON trade.documents (entity_type);
CREATE INDEX IF NOT EXISTS idx_documents_entity_id   ON trade.documents (entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type    ON trade.documents (doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_status      ON trade.documents (status);

-- ── payments ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade.payments (
    id              SERIAL PRIMARY KEY,
    tenant_id       TEXT,
    order_id        TEXT,
    payer_org_id    TEXT,
    payee_org_id    TEXT,
    amount          NUMERIC(20,2),
    currency        VARCHAR(10),
    method          VARCHAR(30) NOT NULL DEFAULT 'wire_transfer'
                      CHECK (method IN ('wire_transfer','letter_of_credit','escrow','open_account')),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','processing','completed','failed','refunded')),
    provider_tx_id  TEXT UNIQUE,
    settled_at      TIMESTAMPTZ,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id    ON trade.payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id     ON trade.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_org_id ON trade.payments (payer_org_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee_org_id ON trade.payments (payee_org_id);
CREATE INDEX IF NOT EXISTS idx_payments_status       ON trade.payments (status);

-- ── compliance_cases ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade.compliance_cases (
    id          SERIAL PRIMARY KEY,
    tenant_id   TEXT,
    entity_type VARCHAR(100),
    entity_id   TEXT,
    case_type   VARCHAR(30) NOT NULL DEFAULT 'kyc_review'
                  CHECK (case_type IN ('sanctions_check','kyc_review','aml_screening',
                                        'customs_violation','trade_restriction')),
    status      VARCHAR(20) NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','under_review','cleared','escalated','closed')),
    risk_level  VARCHAR(10) NOT NULL DEFAULT 'low'
                  CHECK (risk_level IN ('low','medium','high','critical')),
    assigned_to TEXT,
    findings    TEXT,
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_cases_tenant_id   ON trade.compliance_cases (tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_cases_entity_type ON trade.compliance_cases (entity_type);
CREATE INDEX IF NOT EXISTS idx_compliance_cases_status      ON trade.compliance_cases (status);
CREATE INDEX IF NOT EXISTS idx_compliance_cases_risk_level  ON trade.compliance_cases (risk_level);

-- ── disputes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade.disputes (
    id                SERIAL PRIMARY KEY,
    tenant_id         TEXT,
    order_id          TEXT,
    claimant_org_id   TEXT,
    respondent_org_id TEXT,
    dispute_type      VARCHAR(20) NOT NULL DEFAULT 'other'
                        CHECK (dispute_type IN ('quality','delivery','payment','documentation','other')),
    description       TEXT,
    status            VARCHAR(30) NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open','evidence_collection','mediation','arbitration','resolved','closed')),
    resolution        TEXT,
    resolved_at       TIMESTAMPTZ,
    evidence          JSONB NOT NULL DEFAULT '[]',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_tenant_id  ON trade.disputes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order_id   ON trade.disputes (order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status     ON trade.disputes (status);

-- ── wallets ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade.wallets (
    id               SERIAL PRIMARY KEY,
    tenant_id        TEXT,
    org_id           TEXT NOT NULL UNIQUE,
    balance          NUMERIC(20,6) NOT NULL DEFAULT 0,
    reserved_balance NUMERIC(20,6) NOT NULL DEFAULT 0,
    currency         VARCHAR(10) NOT NULL DEFAULT 'USD',
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_tenant_id ON trade.wallets (tenant_id);
CREATE INDEX IF NOT EXISTS idx_wallets_org_id    ON trade.wallets (org_id);

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade.notifications (
    id                SERIAL PRIMARY KEY,
    tenant_id         TEXT,
    recipient_org_id  TEXT,
    type              VARCHAR(100),
    title             VARCHAR(255),
    message           TEXT,
    entity_type       VARCHAR(100),
    entity_id         TEXT,
    is_read           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id        ON trade.notifications (tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_org_id ON trade.notifications (recipient_org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read          ON trade.notifications (is_read);
