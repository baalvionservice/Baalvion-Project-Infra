-- Baalvion Invest — marketplace schema (Phase 0 foundation)
-- Schema-per-domain; every table carries org_id for tenant isolation (RLS rolled out
-- in a later phase under a NOSUPERUSER app role, per @baalvion/tenancy).
BEGIN;

CREATE SCHEMA IF NOT EXISTS marketplace;
SET search_path TO marketplace, public;

-- ── Identity & profiles ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  legal_name VARCHAR(300) NOT NULL,
  brand_name VARCHAR(300),
  registration_no VARCHAR(60),
  country VARCHAR(2),
  industry_code VARCHAR(40),
  stage VARCHAR(20) NOT NULL DEFAULT 'startup',        -- startup|sme|growth|enterprise
  website VARCHAR(300),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',          -- draft|submitted|approved|rejected|suspended
  kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_by VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_profiles (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  summary TEXT, problem TEXT, solution TEXT,
  traction_json JSONB NOT NULL DEFAULT '{}',
  team_size INT, founded_year INT,
  revenue_band VARCHAR(40), funding_raised NUMERIC(20,2),
  funding_target NUMERIC(20,2), valuation_target NUMERIC(20,2),
  deck_url VARCHAR(500), is_published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL, role VARCHAR(120), email VARCHAR(255),
  linkedin VARCHAR(300), equity_pct NUMERIC(6,3), bio TEXT
);

CREATE TABLE IF NOT EXISTS company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,                            -- financial|legal|ip|business_plan|cap_table|deck
  file_url VARCHAR(600) NOT NULL, file_size BIGINT, mime VARCHAR(120),
  visibility VARCHAR(20) NOT NULL DEFAULT 'private',    -- private|nda|approved
  uploaded_by VARCHAR(120), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL,                            -- angel|vc|family_office|pe|institutional|corporate|strategic
  legal_name VARCHAR(300) NOT NULL, country VARCHAR(2),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  aml_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  accreditation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_by VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investor_profiles (
  investor_id UUID PRIMARY KEY REFERENCES investors(id) ON DELETE CASCADE,
  thesis TEXT, aum_band VARCHAR(40), website VARCHAR(300), contact_email VARCHAR(255),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investment_preferences (
  investor_id UUID PRIMARY KEY REFERENCES investors(id) ON DELETE CASCADE,
  industries TEXT[] NOT NULL DEFAULT '{}',
  stages TEXT[] NOT NULL DEFAULT '{}',
  geographies TEXT[] NOT NULL DEFAULT '{}',
  ticket_min NUMERIC(20,2), ticket_max NUMERIC(20,2),
  risk_appetite VARCHAR(20)                             -- conservative|balanced|aggressive
);

-- ── Discovery, matching & pipeline ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  round VARCHAR(20),                                    -- pre_seed|seed|series_a|series_b|growth
  amount_sought NUMERIC(20,2), pre_money_valuation NUMERIC(20,2),
  equity_offered_pct NUMERIC(6,3), min_ticket NUMERIC(20,2),
  deadline DATE, status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft|live|closed
  visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  reasons_json JSONB NOT NULL DEFAULT '{}',
  model_version VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'suggested',      -- suggested|viewed|dismissed|actioned
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, investor_id)
);

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (investor_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS saved_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (investor_id, company_id)
);

CREATE TABLE IF NOT EXISTS pipeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
  stage VARCHAR(40) NOT NULL DEFAULT 'new',             -- new|reviewing|dd|term_sheet|closed|passed
  owner VARCHAR(120), last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_views (
  id BIGSERIAL PRIMARY KEY,
  subject_type VARCHAR(20) NOT NULL,                    -- company|opportunity|investor
  subject_id UUID NOT NULL, viewer_org_id UUID,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Deal room & due diligence ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id_company UUID NOT NULL, org_id_investor UUID NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  lead_investor_id UUID REFERENCES investors(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',           -- open|dd|negotiating|term_sheet|signing|funding|closed|withdrawn
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deal_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id VARCHAR(120) NOT NULL, org_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'participant',      -- lead|participant|advisor|legal|observer
  UNIQUE (deal_id, user_id)
);

CREATE TABLE IF NOT EXISTS deal_messages (
  id BIGSERIAL PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sender_id VARCHAR(120) NOT NULL, body TEXT,
  attachments_json JSONB NOT NULL DEFAULT '[]',
  kind VARCHAR(10) NOT NULL DEFAULT 'chat',             -- chat|system
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nda_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  party_org_id UUID NOT NULL, template_id VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', signed_at TIMESTAMPTZ,
  signature_ref VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL,                        -- financial|legal|operational|compliance|tax
  title VARCHAR(300) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'requested',      -- requested|uploaded|approved|rejected
  requested_by VARCHAR(120), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_room_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  document_request_id UUID REFERENCES document_requests(id) ON DELETE SET NULL,
  file_url VARCHAR(600) NOT NULL, version INT NOT NULL DEFAULT 1,
  uploaded_by VARCHAR(120), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  document_id UUID, category VARCHAR(20),
  grantee_org_id UUID NOT NULL,
  condition VARCHAR(20) NOT NULL DEFAULT 'nda',         -- kyc|nda|verified|approved
  granted_by VARCHAR(120), expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS due_diligence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL, item VARCHAR(300) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',           -- open|in_progress|complete|flagged
  owner VARCHAR(120), evidence_url VARCHAR(600)
);

-- ── Term sheet, signature, escrow, cap table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS term_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  current_version INT NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',          -- draft|sent|countered|accepted|rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS term_sheet_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_sheet_id UUID NOT NULL REFERENCES term_sheets(id) ON DELETE CASCADE,
  version INT NOT NULL,
  amount NUMERIC(20,2), equity_pct NUMERIC(6,3), valuation NUMERIC(20,2),
  board_rights_json JSONB NOT NULL DEFAULT '{}',
  investor_rights_json JSONB NOT NULL DEFAULT '{}',
  exit_rights_json JSONB NOT NULL DEFAULT '{}',
  author_org_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,                          -- propose|counter|accept|reject
  note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (term_sheet_id, version)
);

CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  document_type VARCHAR(20) NOT NULL,                   -- nda|term_sheet|spa
  provider VARCHAR(20) NOT NULL,                        -- aadhaar_esign|docusign|adobe_sign
  envelope_id VARCHAR(200), signer_id VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'sent',           -- sent|viewed|signed|declined|expired
  signed_at TIMESTAMPTZ, audit_url VARCHAR(600)
);

CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  escrow_ref VARCHAR(200),                              -- escrow-service transaction id
  amount NUMERIC(20,2) NOT NULL, currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'initiated',      -- initiated|funded|approval_pending|released|refunded
  release_conditions_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cap_table_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  holder_type VARCHAR(20) NOT NULL,                     -- founder|investor|esop|other
  holder_id VARCHAR(120), security_type VARCHAR(20) NOT NULL DEFAULT 'equity',
  shares NUMERIC(20,4), ownership_pct NUMERIC(7,4),
  as_of DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS cap_table_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  event VARCHAR(20) NOT NULL,                           -- issue|transfer|dilution|conversion
  delta_json JSONB NOT NULL DEFAULT '{}',
  effective_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- thin activity projection (source of truth = audit-service)
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY, org_id UUID, actor VARCHAR(120),
  action VARCHAR(80) NOT NULL, subject_type VARCHAR(40), subject_id UUID,
  meta_json JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_companies_org ON companies(org_id, status);
CREATE INDEX IF NOT EXISTS idx_investors_org ON investors(org_id, status);
CREATE INDEX IF NOT EXISTS idx_opps_status ON opportunities(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_opps_company ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_matches_investor ON matches(investor_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(org_id_company, status);
CREATE INDEX IF NOT EXISTS idx_deals_investor ON deals(org_id_investor, status);
CREATE INDEX IF NOT EXISTS idx_dealmsg_deal ON deal_messages(deal_id, created_at);
CREATE INDEX IF NOT EXISTS idx_docreq_deal ON document_requests(deal_id, status);
CREATE INDEX IF NOT EXISTS idx_grants_deal ON document_access_grants(deal_id, grantee_org_id);
CREATE INDEX IF NOT EXISTS idx_tsv_ts ON term_sheet_versions(term_sheet_id, version);
CREATE INDEX IF NOT EXISTS idx_escrow_deal ON escrow_transactions(deal_id, status);
CREATE INDEX IF NOT EXISTS idx_captable_company ON cap_table_entries(company_id);

COMMIT;
