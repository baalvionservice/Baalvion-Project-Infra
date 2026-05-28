-- Migration 013: IR Service (Investor Relations) — full schema
-- Run once against baalvion_db after migration 012

CREATE SCHEMA IF NOT EXISTS ir;

-- ─── Reports ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ir.reports (
    id               SERIAL PRIMARY KEY,
    org_id           UUID NOT NULL,
    title            VARCHAR(500) NOT NULL,
    report_type      VARCHAR(20)  NOT NULL CHECK (report_type IN ('annual','quarterly','interim','sustainability','proxy')),
    fiscal_year      INTEGER,
    fiscal_quarter   INTEGER      CHECK (fiscal_quarter BETWEEN 1 AND 4),
    period_start     DATE,
    period_end       DATE,
    status           VARCHAR(20)  DEFAULT 'draft' CHECK (status IN ('draft','review','published')),
    summary          TEXT,
    highlights       JSONB        DEFAULT '[]',
    document_url     VARCHAR(500),
    cover_image      VARCHAR(500),
    downloads_count  INTEGER      DEFAULT 0,
    published_at     TIMESTAMPTZ,
    created_by       INTEGER,
    created_at       TIMESTAMPTZ  DEFAULT now(),
    updated_at       TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ir_reports_org    ON ir.reports (org_id);
CREATE INDEX IF NOT EXISTS idx_ir_reports_type   ON ir.reports (report_type);
CREATE INDEX IF NOT EXISTS idx_ir_reports_year   ON ir.reports (fiscal_year DESC);
CREATE INDEX IF NOT EXISTS idx_ir_reports_status ON ir.reports (status);

-- ─── Filings ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ir.filings (
    id               SERIAL PRIMARY KEY,
    org_id           UUID NOT NULL,
    filing_type      VARCHAR(100) NOT NULL,
    title            VARCHAR(500) NOT NULL,
    regulator        VARCHAR(100),
    filing_date      DATE NOT NULL,
    period_of_report DATE,
    document_url     VARCHAR(500),
    accession_number VARCHAR(100),
    status           VARCHAR(20)  DEFAULT 'filed' CHECK (status IN ('filed','amended','withdrawn')),
    description      TEXT,
    created_by       INTEGER,
    created_at       TIMESTAMPTZ  DEFAULT now(),
    updated_at       TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ir_filings_org      ON ir.filings (org_id);
CREATE INDEX IF NOT EXISTS idx_ir_filings_type     ON ir.filings (filing_type);
CREATE INDEX IF NOT EXISTS idx_ir_filings_date     ON ir.filings (filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_ir_filings_regulator ON ir.filings (regulator);

-- ─── IR Documents ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ir.ir_documents (
    id              SERIAL PRIMARY KEY,
    org_id          UUID NOT NULL,
    category        VARCHAR(100),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    document_url    VARCHAR(500) NOT NULL,
    file_size_kb    INTEGER,
    language        VARCHAR(10)  DEFAULT 'en',
    tags            JSONB        DEFAULT '[]',
    is_public       BOOLEAN      DEFAULT true,
    downloads_count INTEGER      DEFAULT 0,
    published_at    TIMESTAMPTZ,
    created_by      INTEGER,
    created_at      TIMESTAMPTZ  DEFAULT now(),
    updated_at      TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ir_docs_org      ON ir.ir_documents (org_id);
CREATE INDEX IF NOT EXISTS idx_ir_docs_category ON ir.ir_documents (category);
CREATE INDEX IF NOT EXISTS idx_ir_docs_public   ON ir.ir_documents (is_public);

-- ─── Earnings Calls ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ir.earnings_calls (
    id               SERIAL PRIMARY KEY,
    org_id           UUID NOT NULL,
    title            VARCHAR(500) NOT NULL,
    fiscal_year      INTEGER,
    fiscal_quarter   INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),
    scheduled_at     TIMESTAMPTZ NOT NULL,
    duration_min     INTEGER     DEFAULT 60,
    webcast_url      VARCHAR(500),
    dial_in_number   VARCHAR(100),
    dial_in_passcode VARCHAR(50),
    status           VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','completed','cancelled')),
    recording_url    VARCHAR(500),
    transcript_url   VARCHAR(500),
    transcript_text  TEXT,
    summary          TEXT,
    participants     JSONB       DEFAULT '[]',
    created_by       INTEGER,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ir_earnings_org    ON ir.earnings_calls (org_id);
CREATE INDEX IF NOT EXISTS idx_ir_earnings_date   ON ir.earnings_calls (scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_ir_earnings_status ON ir.earnings_calls (status);

-- ─── IR Shareholders ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ir.ir_shareholders (
    id           SERIAL PRIMARY KEY,
    org_id       UUID NOT NULL,
    name         VARCHAR(300) NOT NULL,
    type         VARCHAR(20)  DEFAULT 'retail' CHECK (type IN ('institutional','retail','insider','mutual_fund','etf')),
    holding_pct  DECIMAL(6,4) DEFAULT 0,
    shares_held  BIGINT       DEFAULT 0,
    value_usd    DECIMAL(20,2) DEFAULT 0,
    change_pct   DECIMAL(6,2) DEFAULT 0,
    country      VARCHAR(100),
    as_of_date   DATE,
    created_at   TIMESTAMPTZ  DEFAULT now(),
    updated_at   TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ir_shareholders_org     ON ir.ir_shareholders (org_id);
CREATE INDEX IF NOT EXISTS idx_ir_shareholders_holding ON ir.ir_shareholders (holding_pct DESC);

-- ─── IR Contacts ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ir.ir_contacts (
    id         SERIAL PRIMARY KEY,
    org_id     UUID NOT NULL,
    name       VARCHAR(200) NOT NULL,
    title      VARCHAR(200),
    email      VARCHAR(255),
    phone      VARCHAR(50),
    department VARCHAR(100),
    is_primary BOOLEAN     DEFAULT false,
    bio        TEXT,
    photo_url  VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ir_contacts_org ON ir.ir_contacts (org_id);

-- ─── IR Events ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ir.ir_events (
    id               SERIAL PRIMARY KEY,
    org_id           UUID NOT NULL,
    title            VARCHAR(500) NOT NULL,
    event_type       VARCHAR(20)  DEFAULT 'earnings_call' CHECK (event_type IN ('earnings_call','agm','investor_day','roadshow','conference','webinar')),
    scheduled_at     TIMESTAMPTZ  NOT NULL,
    end_at           TIMESTAMPTZ,
    location         VARCHAR(300),
    webcast_url      VARCHAR(500),
    description      TEXT,
    registration_url VARCHAR(500),
    status           VARCHAR(20)  DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','completed','cancelled')),
    created_by       INTEGER,
    created_at       TIMESTAMPTZ  DEFAULT now(),
    updated_at       TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ir_events_org    ON ir.ir_events (org_id);
CREATE INDEX IF NOT EXISTS idx_ir_events_date   ON ir.ir_events (scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_ir_events_status ON ir.ir_events (status);
