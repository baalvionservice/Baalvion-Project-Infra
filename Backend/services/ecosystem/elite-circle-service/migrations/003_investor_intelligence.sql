-- Investor intelligence: richer investor fields + socials, investments, news.
SET search_path TO elite_circle, public;

ALTER TABLE investors ADD COLUMN IF NOT EXISTS firm_type TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS headquarters TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS aum_usd NUMERIC;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'enriched';
ALTER TABLE investors ADD COLUMN IF NOT EXISTS enrichment_confidence TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE TABLE IF NOT EXISTS investor_socials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  handle TEXT,
  followers INTEGER,
  source TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_investor_socials_investor ON investor_socials(investor_id);

CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  target_company TEXT NOT NULL,
  round TEXT,
  amount_usd NUMERIC,
  invested_on DATE,
  source_url TEXT,
  source_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_investments_investor ON investments(investor_id, invested_on DESC);

CREATE TABLE IF NOT EXISTS investor_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  url TEXT,
  headline TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  sentiment TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_investor_news_investor ON investor_news(investor_id, published_at DESC);
