-- ============================================================
-- Migration 009: Mining Full Schema (GeoTrade Nexus)
-- Schema: mining
-- ============================================================

CREATE SCHEMA IF NOT EXISTS mining;

-- ────────────────────────────────────────────────────────────
-- 1. mineral_listings
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mining.mineral_listings (
    id                SERIAL PRIMARY KEY,
    org_id            UUID,
    title             VARCHAR(300)   NOT NULL,
    mineral_type      VARCHAR(100),
    grade             VARCHAR(50),
    quantity_mt       DECIMAL(12, 2),
    unit              VARCHAR(20)    NOT NULL DEFAULT 'MT',
    price_per_unit    DECIMAL(12, 2),
    currency          VARCHAR(10)    NOT NULL DEFAULT 'USD',
    origin_country    VARCHAR(100),
    origin_region     VARCHAR(100),
    certification     VARCHAR(200),
    images            JSONB          NOT NULL DEFAULT '[]',
    documents         JSONB          NOT NULL DEFAULT '[]',
    status            VARCHAR(20)    NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'active', 'sold', 'expired')),
    seller_id         INTEGER,
    seller_org_id     UUID,
    is_featured       BOOLEAN        NOT NULL DEFAULT FALSE,
    views_count       INTEGER        NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mineral_listings_org_id      ON mining.mineral_listings (org_id);
CREATE INDEX IF NOT EXISTS idx_mineral_listings_status       ON mining.mineral_listings (status);
CREATE INDEX IF NOT EXISTS idx_mineral_listings_mineral_type ON mining.mineral_listings (mineral_type);
CREATE INDEX IF NOT EXISTS idx_mineral_listings_seller_id    ON mining.mineral_listings (seller_id);
CREATE INDEX IF NOT EXISTS idx_mineral_listings_is_featured  ON mining.mineral_listings (is_featured);

-- ────────────────────────────────────────────────────────────
-- 2. rfqs
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mining.rfqs (
    id              SERIAL PRIMARY KEY,
    org_id          UUID,
    listing_id      INTEGER
                        REFERENCES mining.mineral_listings (id) ON DELETE SET NULL,
    buyer_id        INTEGER,
    buyer_org_id    UUID,
    quantity_mt     DECIMAL(12, 2),
    target_price    DECIMAL(12, 2),
    currency        VARCHAR(10),
    delivery_port   VARCHAR(200),
    required_by     DATE,
    message         TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'closed', 'awarded')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfqs_org_id     ON mining.rfqs (org_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_listing_id ON mining.rfqs (listing_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_buyer_id   ON mining.rfqs (buyer_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status     ON mining.rfqs (status);

-- ────────────────────────────────────────────────────────────
-- 3. bids
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mining.bids (
    id              SERIAL PRIMARY KEY,
    org_id          UUID,
    rfq_id          INTEGER      NOT NULL
                        REFERENCES mining.rfqs (id) ON DELETE CASCADE,
    bidder_id       INTEGER,
    bidder_org_id   UUID,
    price_per_unit  DECIMAL(12, 2),
    total_price     DECIMAL(12, 2),
    currency        VARCHAR(10),
    delivery_days   INTEGER,
    notes           TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bids_rfq_id    ON mining.bids (rfq_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON mining.bids (bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_status    ON mining.bids (status);

-- ────────────────────────────────────────────────────────────
-- 4. orders
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mining.orders (
    id              SERIAL PRIMARY KEY,
    org_id          UUID,
    listing_id      INTEGER
                        REFERENCES mining.mineral_listings (id) ON DELETE SET NULL,
    rfq_id          INTEGER
                        REFERENCES mining.rfqs (id) ON DELETE SET NULL,
    buyer_id        INTEGER,
    seller_id       INTEGER,
    quantity_mt     DECIMAL(12, 2),
    unit_price      DECIMAL(12, 2),
    total_amount    DECIMAL(15, 2),
    currency        VARCHAR(10),
    status          VARCHAR(30)  NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled', 'disputed')),
    payment_status  VARCHAR(20)  NOT NULL DEFAULT 'unpaid'
                        CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    delivery_port   VARCHAR(200),
    incoterm        VARCHAR(20),
    contract_url    VARCHAR(500),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_org_id         ON mining.orders (org_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id      ON mining.orders (listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_rfq_id          ON mining.orders (rfq_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id        ON mining.orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id       ON mining.orders (seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON mining.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status  ON mining.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at      ON mining.orders (created_at);

-- ────────────────────────────────────────────────────────────
-- 5. logistics_shipments
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mining.logistics_shipments (
    id                  SERIAL PRIMARY KEY,
    org_id              UUID,
    order_id            INTEGER      NOT NULL
                            REFERENCES mining.orders (id) ON DELETE CASCADE,
    carrier             VARCHAR(200),
    vessel_name         VARCHAR(200),
    container_number    VARCHAR(100),
    bl_number           VARCHAR(100),
    origin_port         VARCHAR(200),
    destination_port    VARCHAR(200),
    departure_date      DATE,
    estimated_arrival   DATE,
    actual_arrival      DATE,
    status              VARCHAR(20)  NOT NULL DEFAULT 'booked'
                            CHECK (status IN ('booked', 'in_transit', 'at_port', 'delivered')),
    tracking_events     JSONB        NOT NULL DEFAULT '[]',
    documents           JSONB        NOT NULL DEFAULT '[]',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logistics_shipments_org_id   ON mining.logistics_shipments (org_id);
CREATE INDEX IF NOT EXISTS idx_logistics_shipments_order_id ON mining.logistics_shipments (order_id);
CREATE INDEX IF NOT EXISTS idx_logistics_shipments_status   ON mining.logistics_shipments (status);

-- ────────────────────────────────────────────────────────────
-- 6. warehouses
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mining.warehouses (
    id              SERIAL PRIMARY KEY,
    org_id          UUID,
    name            VARCHAR(200)  NOT NULL,
    country         VARCHAR(100),
    city            VARCHAR(100),
    address         TEXT,
    capacity_mt     DECIMAL(12, 2),
    available_mt    DECIMAL(12, 2),
    minerals_stored JSONB         NOT NULL DEFAULT '[]',
    is_certified    BOOLEAN       NOT NULL DEFAULT FALSE,
    certifications  JSONB         NOT NULL DEFAULT '[]',
    contact_email   VARCHAR(255),
    contact_phone   VARCHAR(50),
    status          VARCHAR(20)   NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive')),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouses_org_id  ON mining.warehouses (org_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_country ON mining.warehouses (country);
CREATE INDEX IF NOT EXISTS idx_warehouses_status  ON mining.warehouses (status);

-- ────────────────────────────────────────────────────────────
-- 7. disputes
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mining.disputes (
    id                SERIAL PRIMARY KEY,
    org_id            UUID,
    order_id          INTEGER      NOT NULL
                          REFERENCES mining.orders (id) ON DELETE CASCADE,
    complainant_id    INTEGER,
    respondent_id     INTEGER,
    category          VARCHAR(100),
    description       TEXT,
    evidence_urls     JSONB        NOT NULL DEFAULT '[]',
    status            VARCHAR(20)  NOT NULL DEFAULT 'filed'
                          CHECK (status IN ('filed', 'under_review', 'resolved', 'closed')),
    resolution        TEXT,
    admin_notes       TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_org_id   ON mining.disputes (org_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON mining.disputes (order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status   ON mining.disputes (status);

-- ────────────────────────────────────────────────────────────
-- 8. company_verifications
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mining.company_verifications (
    id                   SERIAL PRIMARY KEY,
    org_id               UUID         NOT NULL UNIQUE,
    company_name         VARCHAR(200),
    registration_number  VARCHAR(100),
    country              VARCHAR(100),
    documents            JSONB        NOT NULL DEFAULT '[]',
    status               VARCHAR(20)  NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_by          INTEGER,
    verified_at          TIMESTAMPTZ,
    rejection_reason     TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_verifications_org_id ON mining.company_verifications (org_id);
CREATE INDEX IF NOT EXISTS idx_company_verifications_status ON mining.company_verifications (status);

-- ────────────────────────────────────────────────────────────
-- 9. trade_documents
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mining.trade_documents (
    id            SERIAL PRIMARY KEY,
    org_id        UUID,
    order_id      INTEGER
                      REFERENCES mining.orders (id) ON DELETE SET NULL,
    listing_id    INTEGER
                      REFERENCES mining.mineral_listings (id) ON DELETE SET NULL,
    type          VARCHAR(50)
                      CHECK (type IN ('invoice', 'bl', 'packing_list', 'certificate', 'contract', 'other')),
    name          VARCHAR(300),
    url           VARCHAR(500),
    uploaded_by   INTEGER,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_documents_org_id     ON mining.trade_documents (org_id);
CREATE INDEX IF NOT EXISTS idx_trade_documents_order_id   ON mining.trade_documents (order_id);
CREATE INDEX IF NOT EXISTS idx_trade_documents_listing_id ON mining.trade_documents (listing_id);
CREATE INDEX IF NOT EXISTS idx_trade_documents_type       ON mining.trade_documents (type);
