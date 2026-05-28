-- Migration 011: Real Estate Service (AmariseMaisonAvenue) — full schema
-- Run once against baalvion_db after migration 010

CREATE SCHEMA IF NOT EXISTS real_estate;

-- ─── Agents ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS real_estate.agents (
    id               SERIAL PRIMARY KEY,
    org_id           UUID,
    user_id          INTEGER,
    name             VARCHAR(200) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    phone            VARCHAR(50),
    avatar_url       VARCHAR(500),
    bio              TEXT,
    specialization   JSONB        DEFAULT '[]',
    license_number   VARCHAR(100),
    license_expiry   DATE,
    languages        JSONB        DEFAULT '[]',
    rating           DECIMAL(3,2) DEFAULT 0,
    review_count     INTEGER      DEFAULT 0,
    active_listings  INTEGER      DEFAULT 0,
    deals_closed     INTEGER      DEFAULT 0,
    status           VARCHAR(20)  DEFAULT 'active' CHECK (status IN ('active','inactive')),
    created_at       TIMESTAMPTZ  DEFAULT now(),
    updated_at       TIMESTAMPTZ  DEFAULT now(),
    UNIQUE (org_id, email)
);
CREATE INDEX IF NOT EXISTS idx_re_agents_org    ON real_estate.agents (org_id);
CREATE INDEX IF NOT EXISTS idx_re_agents_status ON real_estate.agents (status);

-- ─── Properties ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS real_estate.properties (
    id             SERIAL PRIMARY KEY,
    org_id         UUID,
    agent_id       INTEGER REFERENCES real_estate.agents(id) ON DELETE SET NULL,
    title          VARCHAR(500) NOT NULL,
    description    TEXT,
    property_type  VARCHAR(30)  DEFAULT 'apartment' CHECK (property_type IN ('apartment','villa','house','commercial','plot','office')),
    listing_type   VARCHAR(10)  DEFAULT 'sale' CHECK (listing_type IN ('sale','rent','lease')),
    price          DECIMAL(15,2) NOT NULL,
    currency       VARCHAR(10)  DEFAULT 'USD',
    bedrooms       INTEGER      DEFAULT 0,
    bathrooms      INTEGER      DEFAULT 0,
    area_sqft      DECIMAL(10,2),
    area_sqm       DECIMAL(10,2),
    floor_number   INTEGER,
    total_floors   INTEGER,
    year_built     INTEGER,
    country        VARCHAR(100),
    city           VARCHAR(100),
    area           VARCHAR(200),
    address        TEXT,
    latitude       DECIMAL(10,7),
    longitude      DECIMAL(10,7),
    amenities      JSONB        DEFAULT '[]',
    features       JSONB        DEFAULT '{}',
    status         VARCHAR(20)  DEFAULT 'draft' CHECK (status IN ('draft','active','under_offer','sold','rented','archived')),
    is_featured    BOOLEAN      DEFAULT false,
    views_count    INTEGER      DEFAULT 0,
    inquiry_count  INTEGER      DEFAULT 0,
    created_at     TIMESTAMPTZ  DEFAULT now(),
    updated_at     TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_re_props_org    ON real_estate.properties (org_id);
CREATE INDEX IF NOT EXISTS idx_re_props_type   ON real_estate.properties (property_type);
CREATE INDEX IF NOT EXISTS idx_re_props_status ON real_estate.properties (status);
CREATE INDEX IF NOT EXISTS idx_re_props_city   ON real_estate.properties (city);
CREATE INDEX IF NOT EXISTS idx_re_props_price  ON real_estate.properties (price);
CREATE INDEX IF NOT EXISTS idx_re_props_agent  ON real_estate.properties (agent_id);

-- ─── Property Images ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS real_estate.property_images (
    id            SERIAL PRIMARY KEY,
    property_id   INTEGER NOT NULL REFERENCES real_estate.properties(id) ON DELETE CASCADE,
    url           VARCHAR(500) NOT NULL,
    caption       VARCHAR(300),
    is_cover      BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_re_images_property ON real_estate.property_images (property_id);

-- ─── Viewings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS real_estate.viewings (
    id           SERIAL PRIMARY KEY,
    org_id       UUID,
    property_id  INTEGER NOT NULL REFERENCES real_estate.properties(id) ON DELETE CASCADE,
    agent_id     INTEGER REFERENCES real_estate.agents(id) ON DELETE SET NULL,
    user_id      INTEGER,
    user_name    VARCHAR(200),
    user_email   VARCHAR(255),
    user_phone   VARCHAR(50),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_min INTEGER     DEFAULT 60,
    notes        TEXT,
    status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
    feedback     TEXT,
    rating       INTEGER     CHECK (rating BETWEEN 1 AND 5),
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_re_viewings_property ON real_estate.viewings (property_id);
CREATE INDEX IF NOT EXISTS idx_re_viewings_agent    ON real_estate.viewings (agent_id);
CREATE INDEX IF NOT EXISTS idx_re_viewings_user     ON real_estate.viewings (user_id);
CREATE INDEX IF NOT EXISTS idx_re_viewings_date     ON real_estate.viewings (scheduled_at);

-- ─── Inquiries ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS real_estate.inquiries (
    id            SERIAL PRIMARY KEY,
    org_id        UUID,
    property_id   INTEGER NOT NULL REFERENCES real_estate.properties(id) ON DELETE CASCADE,
    agent_id      INTEGER REFERENCES real_estate.agents(id) ON DELETE SET NULL,
    user_id       INTEGER,
    name          VARCHAR(200) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    message       TEXT,
    inquiry_type  VARCHAR(20) DEFAULT 'general' CHECK (inquiry_type IN ('general','viewing','offer','price')),
    status        VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
    response      TEXT,
    responded_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_re_inquiries_property ON real_estate.inquiries (property_id);
CREATE INDEX IF NOT EXISTS idx_re_inquiries_agent    ON real_estate.inquiries (agent_id);
CREATE INDEX IF NOT EXISTS idx_re_inquiries_status   ON real_estate.inquiries (status);

-- ─── Property Documents ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS real_estate.property_documents (
    id          SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES real_estate.properties(id) ON DELETE CASCADE,
    org_id      UUID,
    type        VARCHAR(50),
    name        VARCHAR(300),
    url         VARCHAR(500),
    uploaded_by INTEGER,
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_re_docs_property ON real_estate.property_documents (property_id);

-- ─── Favorites ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS real_estate.favorites (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    property_id INTEGER NOT NULL REFERENCES real_estate.properties(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_re_favorites_user ON real_estate.favorites (user_id);
