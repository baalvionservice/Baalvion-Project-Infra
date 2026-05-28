-- Investor Intelligence Platform — Postgres schema
-- Run this once in your Postgres database before importing the n8n workflow.

CREATE EXTENSION IF NOT EXISTS pg_trgm;           -- for fuzzy name matching later
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- investors ----------
CREATE TABLE IF NOT EXISTS investors (
    id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                     TEXT NOT NULL,
    firm_type                TEXT,                -- VC | Angel | Family Office | PE | CVC
    region                   TEXT,
    headquarters             TEXT,
    website                  TEXT,
    aum_usd                  NUMERIC,
    focus_sectors            JSONB DEFAULT '[]'::jsonb,
    dedupe_key               TEXT UNIQUE,         -- lowercased + normalized name; fill via trigger or app
    enrichment_status        TEXT NOT NULL DEFAULT 'pending',  -- pending | processing | enriched | enrichment_failed
    enrichment_confidence    TEXT,                -- high | medium | low
    enrichment_notes         TEXT,
    enrichment_started_at    TIMESTAMPTZ,
    enrichment_completed_at  TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investors_status
    ON investors (enrichment_status, created_at);

CREATE INDEX IF NOT EXISTS idx_investors_name_trgm
    ON investors USING GIN (name gin_trgm_ops);

-- ---------- investor_socials ----------
CREATE TABLE IF NOT EXISTS investor_socials (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id       UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
    platform          TEXT NOT NULL CHECK (platform IN ('twitter','linkedin','instagram','facebook')),
    url               TEXT NOT NULL,
    handle            TEXT,
    source            TEXT,                       -- where we verified it
    last_checked_at   TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (investor_id, platform)
);

-- ---------- investments (Workflow B will fill this) ----------
CREATE TABLE IF NOT EXISTS investments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id     UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
    target_company  TEXT NOT NULL,
    round           TEXT,
    amount_usd      NUMERIC,
    invested_on     DATE,
    source_url      TEXT,
    source_name     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investments_investor_date
    ON investments (investor_id, invested_on DESC);

-- ---------- news_raw (Workflow C) ----------
CREATE TABLE IF NOT EXISTS news_raw (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id   UUID REFERENCES investors(id) ON DELETE SET NULL,
    url           TEXT NOT NULL,
    headline      TEXT,
    body          TEXT,
    source        TEXT,
    content_hash  TEXT UNIQUE,
    status        TEXT NOT NULL DEFAULT 'pending',  -- pending | rewritten | published | skipped
    fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- articles_published (Workflow E) ----------
CREATE TABLE IF NOT EXISTS articles_published (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    news_raw_id    UUID REFERENCES news_raw(id),
    slug           TEXT UNIQUE,
    title          TEXT,
    body           TEXT,
    cms_post_id    TEXT,
    published_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status         TEXT NOT NULL DEFAULT 'live'
);

-- ---------- audit_log ----------
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    table_name  TEXT NOT NULL,
    row_id      TEXT NOT NULL,
    action      TEXT NOT NULL,
    actor       TEXT,
    payload     JSONB,
    at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- sanity seed (delete after first test) ----------
INSERT INTO investors (name, firm_type, region, website, dedupe_key)
VALUES
  ('Naval Ravikant', 'Angel', 'US', 'https://nav.al', 'naval-ravikant'),
  ('Andreessen Horowitz', 'VC', 'US', 'https://a16z.com', 'andreessen-horowitz'),
  ('Peak XV Partners', 'VC', 'India', 'https://www.peakxv.com', 'peak-xv-partners')
ON CONFLICT (dedupe_key) DO NOTHING;
