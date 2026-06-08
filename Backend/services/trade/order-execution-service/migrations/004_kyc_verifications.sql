-- 004_kyc_verifications.sql — tenant-bound KYC verification registry (closes the
-- caller-supplied kycId IDOR on the order placement gate).
--
-- The PLATFORM owns the binding (tenant_id, subject_ref) -> provider_verification_id + status.
-- The order gate resolves KYC by the ORDER's tenant + a subject ref
-- (WHERE tenant_id = <order tenant> AND subject_ref = <ref>), never by a caller-supplied
-- provider id. The Onfido verification id is stored SERVER-SIDE and is never accepted from
-- order placement, so a caller cannot reference another tenant's verification.
--
-- RLS pattern copied EXACTLY from oms.orders (001_init.sql): enable + FORCE + policy
-- USING/WITH CHECK on the app.current_tenant / app.tenant_bypass GUCs. Run as the
-- privileged owner role (MIGRATION_DB_USER).
BEGIN;

CREATE TABLE IF NOT EXISTS oms.kyc_verifications (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                text NOT NULL,
  subject_ref              text NOT NULL,
  subject_type             text NOT NULL DEFAULT 'BUSINESS'
                           CHECK (subject_type IN ('INDIVIDUAL','BUSINESS')),
  provider                 text NOT NULL DEFAULT 'onfido',
  -- The Onfido verification id — stored server-side, NEVER accepted from order placement.
  provider_verification_id text,
  status                   text NOT NULL DEFAULT 'NOT_STARTED'
                           CHECK (status IN ('NOT_STARTED','PENDING','APPROVED','REJECTED','REVIEW','RESUBMIT')),
  reasons                  jsonb,
  idempotency_key          text,
  last_checked_at          timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- One registry row per (tenant, subject): the gate resolves a single binding.
CREATE UNIQUE INDEX IF NOT EXISTS uq_kyc_tenant_subject
  ON oms.kyc_verifications (tenant_id, subject_ref);
-- One row per Onfido run — the webhook resolves a verification by its provider id.
CREATE UNIQUE INDEX IF NOT EXISTS uq_kyc_provider_vid
  ON oms.kyc_verifications (provider_verification_id)
  WHERE provider_verification_id IS NOT NULL;

-- R1: RLS — copied EXACTLY from oms.orders (001_init.sql).
ALTER TABLE oms.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE oms.kyc_verifications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON oms.kyc_verifications;
CREATE POLICY tenant_isolation ON oms.kyc_verifications
  USING ((current_setting('app.tenant_bypass', true) = 'on')
      OR (current_setting('app.current_tenant', true) IS NOT NULL
          AND current_setting('app.current_tenant', true) <> ''
          AND tenant_id::text = current_setting('app.current_tenant', true)))
  WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on')
      OR (current_setting('app.current_tenant', true) IS NOT NULL
          AND current_setting('app.current_tenant', true) <> ''
          AND tenant_id::text = current_setting('app.current_tenant', true)));

GRANT SELECT, INSERT, UPDATE, DELETE ON oms.kyc_verifications TO baalvion_app;

COMMIT;
