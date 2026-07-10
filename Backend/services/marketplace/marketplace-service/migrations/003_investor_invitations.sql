-- Admin-triggered investor invitations — separate from the self-serve investor
-- onboarding flow (investors table). An invite is a pre-application record with a
-- token; accepting it (see investorService.create) links back to the created investor.
BEGIN;
SET search_path TO marketplace, public;

CREATE TABLE IF NOT EXISTS investor_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  investor_type VARCHAR(20) NOT NULL DEFAULT 'angel',
  note TEXT,
  token VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',        -- pending|accepted|revoked|expired
  invited_by VARCHAR(120),
  invited_by_name VARCHAR(200),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investor_invitations_org ON investor_invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_investor_invitations_email ON investor_invitations(lower(email));
CREATE INDEX IF NOT EXISTS idx_investor_invitations_status ON investor_invitations(status);

COMMIT;
