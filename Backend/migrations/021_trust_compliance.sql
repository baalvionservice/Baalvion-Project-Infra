-- 021_trust_compliance.sql
-- Trust & Safety / KYC / risk / moderation / threat-intel / enforcement / GDPR /
-- compliance audit. Append-only tables reuse public.deny_audit_mutation() (017).

BEGIN;

-- Organization trust posture.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'unverified',  -- unverified|pending|approved|rejected|review
  ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'low';         -- low|medium|high|critical

-- 1) KYC / KYB verifications.
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL,
  user_id      BIGINT,
  subject_type TEXT NOT NULL DEFAULT 'individual',  -- individual|business
  provider     TEXT NOT NULL DEFAULT 'sumsub',
  applicant_id TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',      -- pending|approved|rejected|review
  level        TEXT,
  country      TEXT,
  risk_country BOOLEAN NOT NULL DEFAULT FALSE,
  sanctions_hit BOOLEAN NOT NULL DEFAULT FALSE,
  pep_hit      BOOLEAN NOT NULL DEFAULT FALSE,
  decision     TEXT,
  reviewer_id  BIGINT,
  notes        TEXT,
  raw          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kyc_org ON public.kyc_verifications (org_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON public.kyc_verifications (status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_kyc_applicant ON public.kyc_verifications (provider, applicant_id) WHERE applicant_id IS NOT NULL;

-- 2) Risk scores (latest + history per org).
CREATE TABLE IF NOT EXISTS public.risk_scores (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL,
  score       NUMERIC NOT NULL,
  level       TEXT NOT NULL,                          -- low|medium|high|critical
  signals     JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_risk_org_time ON public.risk_scores (org_id, computed_at DESC);

-- 3) Moderation / takedown cases + immutable event history.
CREATE TABLE IF NOT EXISTS public.moderation_cases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID,
  type        TEXT NOT NULL,                          -- abuse_report|dmca|le_request|dispute|manual
  source      TEXT,
  status      TEXT NOT NULL DEFAULT 'OPEN',           -- OPEN|INVESTIGATING|ACTION_TAKEN|ESCALATED|RESOLVED|REJECTED
  severity    TEXT NOT NULL DEFAULT 'medium',
  subject     TEXT,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  assignee_id BIGINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_modcase_status ON public.moderation_cases (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_modcase_org ON public.moderation_cases (org_id);

CREATE TABLE IF NOT EXISTS public.moderation_events (
  id         BIGSERIAL PRIMARY KEY,
  case_id    UUID NOT NULL REFERENCES public.moderation_cases(id) ON DELETE CASCADE,
  actor_id   BIGINT,
  action     TEXT NOT NULL,
  from_status TEXT,
  to_status  TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_modevent_case ON public.moderation_events (case_id, created_at);
DROP TRIGGER IF EXISTS trg_modevent_no_mutate ON public.moderation_events;
CREATE TRIGGER trg_modevent_no_mutate BEFORE UPDATE OR DELETE ON public.moderation_events
  FOR EACH ROW EXECUTE FUNCTION public.deny_audit_mutation();

-- 4) Destination threat intelligence (indicators from feeds).
CREATE TABLE IF NOT EXISTS public.destination_intel (
  id         BIGSERIAL PRIMARY KEY,
  indicator  TEXT NOT NULL,                           -- ip or domain
  kind       TEXT NOT NULL DEFAULT 'ip',              -- ip|domain
  source     TEXT NOT NULL,                           -- spamhaus|abuseipdb|virustotal|openphish|tor
  category   TEXT,                                    -- malware|phishing|botnet|tor|sanctioned
  score      NUMERIC NOT NULL DEFAULT 100,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_destintel ON public.destination_intel (indicator, source);
CREATE INDEX IF NOT EXISTS idx_destintel_indicator ON public.destination_intel (indicator);

-- 5) Enforcement actions (sanctions). Live flags also pushed to Redis for gateway.
CREATE TABLE IF NOT EXISTS public.enforcement_actions (
  id         BIGSERIAL PRIMARY KEY,
  org_id     UUID NOT NULL,
  action     TEXT NOT NULL,                           -- suspend|ban|throttle|geo_restrict|bandwidth_limit|provider_isolate
  reason     TEXT,
  params     JSONB NOT NULL DEFAULT '{}'::jsonb,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT,
  case_id    UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_enforce_org_active ON public.enforcement_actions (org_id, active);

-- 6) GDPR: consent + DSAR requests.
CREATE TABLE IF NOT EXISTS public.consent_records (
  id         BIGSERIAL PRIMARY KEY,
  org_id     UUID,
  user_id    BIGINT,
  purpose    TEXT NOT NULL,                           -- tos|privacy|marketing|dpa
  granted    BOOLEAN NOT NULL,
  version    TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consent_user ON public.consent_records (user_id, purpose);

CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID,
  user_id      BIGINT,
  type         TEXT NOT NULL,                          -- export|delete
  status       TEXT NOT NULL DEFAULT 'pending',        -- pending|processing|completed|rejected
  requested_by BIGINT,
  download_url TEXT,
  signature    TEXT,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gdpr_org ON public.gdpr_requests (org_id, type);

-- 7) Compliance audit log (append-only, signed).
CREATE TABLE IF NOT EXISTS public.compliance_audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  org_id     UUID,
  actor_id   BIGINT,
  domain     TEXT NOT NULL,                            -- kyc|moderation|gdpr|enforcement|access|risk
  action     TEXT NOT NULL,
  payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  signature  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compaudit_domain ON public.compliance_audit_logs (domain, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compaudit_org ON public.compliance_audit_logs (org_id);
DROP TRIGGER IF EXISTS trg_compaudit_no_mutate ON public.compliance_audit_logs;
CREATE TRIGGER trg_compaudit_no_mutate BEFORE UPDATE OR DELETE ON public.compliance_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.deny_audit_mutation();

COMMIT;
