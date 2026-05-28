-- Investors directory (investor data for the platform).
SET search_path TO elite_circle, public;

CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  firm TEXT,
  title TEXT,
  avatar_url TEXT,
  thesis TEXT,
  focus_sectors JSONB DEFAULT '[]'::jsonb,
  stages JSONB DEFAULT '[]'::jsonb,
  check_min NUMERIC,
  check_max NUMERIC,
  location TEXT,
  website TEXT,
  linkedin_url TEXT,
  portfolio JSONB DEFAULT '[]'::jsonb,
  deals_backed INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS investors_updated_at ON investors;
CREATE TRIGGER investors_updated_at BEFORE UPDATE ON investors FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
