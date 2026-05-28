-- Platform v2: rich onboarding fields + scoring, team, traction time-series,
-- verification, data rooms, and investor CRM (saved lists + pipeline).
SET search_path TO insiders, public;

-- ── Profile: onboarding + scoring + richer startup fields ─────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_experience JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS founder_strengths JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS problem TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS solution TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS why_now TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS differentiation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS market_tam TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_model TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_market TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS raising BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS round_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS raise_amount NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS valuation NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instrument TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS use_of_funds TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pitch_deck_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS readiness_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- ── Team (founder's company = their profile; members link to it) ──────────────
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_user_id UUID,
  name TEXT NOT NULL,
  member_role TEXT NOT NULL DEFAULT 'team',  -- cofounder | team | advisor | contractor
  title TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_company_members_founder ON company_members(founder_id);

-- ── Traction (time-series; the slope is the feature) ──────────────────────────
CREATE TABLE IF NOT EXISTS traction_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,        -- mrr | arr | users | gmv | growth | burn | runway ...
  label TEXT,
  value NUMERIC NOT NULL,
  unit TEXT,                       -- $ | users | % | months
  as_of DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_traction_founder ON traction_metrics(founder_id, metric_key, as_of DESC);

-- ── Verification ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,              -- email | domain | linkedin | startup | investor
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | verified | rejected
  evidence JSONB DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, kind)
);

-- ── Data room access (founder grants an investor scoped, revocable access) ─────
CREATE TABLE IF NOT EXISTS data_room_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  investor_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'granted',  -- granted | revoked
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (founder_id, investor_user_id)
);

-- ── Investor CRM: saved lists + pipeline ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_user_id UUID NOT NULL,
  founder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  list_name TEXT DEFAULT 'Watchlist',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (investor_user_id, founder_id)
);

CREATE TABLE IF NOT EXISTS investor_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_user_id UUID NOT NULL,
  founder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'sourced',  -- sourced | reviewing | meeting | diligence | term_sheet | passed
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (investor_user_id, founder_id)
);
DROP TRIGGER IF EXISTS investor_pipeline_updated_at ON investor_pipeline;
CREATE TRIGGER investor_pipeline_updated_at BEFORE UPDATE ON investor_pipeline FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
