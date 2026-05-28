-- 022_enterprise.sql
-- Enterprise identity & governance: SSO/SAML/OIDC, SCIM, dynamic RBAC, org units,
-- org policies, SLA, white-label, OAuth apps, cost centers, audit-export sinks.
-- Secret columns (*_enc) are AES-256-GCM encrypted at the app layer (cryptoVault).

BEGIN;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS tier         TEXT NOT NULL DEFAULT 'starter',  -- starter|growth|enterprise
  ADD COLUMN IF NOT EXISTS enforce_sso  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enforce_mfa  BOOLEAN NOT NULL DEFAULT FALSE;

-- 1) SSO connections (one per org; SAML or OIDC).
CREATE TABLE IF NOT EXISTS public.sso_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL,
  type            TEXT NOT NULL,                 -- saml|oidc
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  -- SAML
  idp_entity_id   TEXT,
  idp_sso_url     TEXT,
  idp_cert        TEXT,                          -- IdP signing cert (public)
  -- OIDC
  oidc_issuer     TEXT,
  oidc_client_id  TEXT,
  oidc_secret_enc TEXT,
  attribute_map   JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {email, firstName, groups,...}
  group_role_map  JSONB NOT NULL DEFAULT '{}'::jsonb,  -- IdP group -> baalvion role
  default_role    TEXT NOT NULL DEFAULT 'viewer',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sso_org ON public.sso_connections (org_id);

-- 2) SCIM bearer tokens (hashed) + provisioning logs.
CREATE TABLE IF NOT EXISTS public.scim_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL,
  token_hash  TEXT NOT NULL,
  token_prefix TEXT NOT NULL,
  created_by  BIGINT,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scim_token_hash ON public.scim_tokens (token_hash);

CREATE TABLE IF NOT EXISTS public.scim_provisioning_logs (
  id            BIGSERIAL PRIMARY KEY,
  org_id        UUID NOT NULL,
  operation     TEXT NOT NULL,                  -- create|update|patch|delete|group_sync
  resource_type TEXT NOT NULL,                  -- User|Group
  external_id   TEXT,
  status        TEXT NOT NULL,                  -- ok|conflict|error
  detail        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scim_log_org ON public.scim_provisioning_logs (org_id, created_at DESC);
-- SCIM external id mapping on users for idempotent provisioning.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS scim_external_id TEXT,
  ADD COLUMN IF NOT EXISTS provisioned_via TEXT,            -- scim|sso_jit|manual
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS custom_role_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_scim ON public.users (org_id, scim_external_id) WHERE scim_external_id IS NOT NULL;

-- 3) Dynamic RBAC: custom roles + granular dotted permissions + inheritance.
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  inherits    JSONB NOT NULL DEFAULT '[]'::jsonb,   -- array of role names (built-in or custom)
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_custom_role ON public.custom_roles (org_id, name);

CREATE TABLE IF NOT EXISTS public.custom_role_permissions (
  id         BIGSERIAL PRIMARY KEY,
  role_id    UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL                          -- e.g. proxy.sessions.write
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_role_perm ON public.custom_role_permissions (role_id, permission);

-- 4) Org governance: units (department/team/sub-org) + policies.
CREATE TABLE IF NOT EXISTS public.org_units (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL,
  parent_id     UUID,
  type          TEXT NOT NULL DEFAULT 'team',        -- department|team|sub_org
  name          TEXT NOT NULL,
  delegated_admin_user_id BIGINT,
  quota_gb      NUMERIC,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_units_org ON public.org_units (org_id);

CREATE TABLE IF NOT EXISTS public.org_unit_members (
  id          BIGSERIAL PRIMARY KEY,
  org_unit_id UUID NOT NULL REFERENCES public.org_units(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL,
  role        TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_unit_member ON public.org_unit_members (org_unit_id, user_id);

CREATE TABLE IF NOT EXISTS public.org_policies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL,
  policy_type TEXT NOT NULL,                         -- mfa_required|ip_allowlist|geo_restrict|api_restrict|billing_approval
  config      JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_policy ON public.org_policies (org_id, policy_type);

-- 5) SLA management.
CREATE TABLE IF NOT EXISTS public.sla_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL,
  tier            TEXT NOT NULL DEFAULT 'enterprise',
  uptime_target   NUMERIC NOT NULL DEFAULT 99.9,
  latency_target_ms INTEGER NOT NULL DEFAULT 1000,
  success_target  NUMERIC NOT NULL DEFAULT 99.0,
  credits_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{belowPct, creditPct}]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sla_org ON public.sla_definitions (org_id);

CREATE TABLE IF NOT EXISTS public.sla_periods (
  id           BIGSERIAL PRIMARY KEY,
  org_id       UUID NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end   TIMESTAMPTZ NOT NULL,
  uptime       NUMERIC,
  p95_latency  NUMERIC,
  success_rate NUMERIC,
  violated     BOOLEAN NOT NULL DEFAULT FALSE,
  credit_amount NUMERIC NOT NULL DEFAULT 0,
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sla_period ON public.sla_periods (org_id, period_start, period_end);

-- 6) White-label.
CREATE TABLE IF NOT EXISTS public.white_label_configs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL,
  domain       TEXT,
  brand_name   TEXT,
  logo_url     TEXT,
  primary_color TEXT,
  support_email TEXT,
  login_bg_url TEXT,
  custom_css   TEXT,
  email_from   TEXT,
  enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_wl_org ON public.white_label_configs (org_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_wl_domain ON public.white_label_configs (domain) WHERE domain IS NOT NULL;

-- 7) API governance: OAuth apps + service accounts + cost centers + audit sinks.
CREATE TABLE IF NOT EXISTS public.oauth_apps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL,
  name          TEXT NOT NULL,
  client_id     TEXT NOT NULL,
  client_secret_hash TEXT NOT NULL,
  redirect_uris JSONB NOT NULL DEFAULT '[]'::jsonb,
  scopes        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_oauth_client ON public.oauth_apps (client_id);

CREATE TABLE IF NOT EXISTS public.cost_centers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL,
  code        TEXT NOT NULL,
  name        TEXT,
  org_unit_id UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cost_center ON public.cost_centers (org_id, code);
-- attribute api keys to a cost center / org unit for department billing.
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS cost_center_id UUID,
  ADD COLUMN IF NOT EXISTS org_unit_id UUID;

CREATE TABLE IF NOT EXISTS public.audit_export_destinations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL,
  type       TEXT NOT NULL,                         -- splunk_hec|datadog|webhook|s3
  config_enc TEXT NOT NULL,                          -- encrypted endpoint+token
  sources    JSONB NOT NULL DEFAULT '["auth","admin","abuse","billing"]'::jsonb,
  enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_dest_org ON public.audit_export_destinations (org_id);

COMMIT;
