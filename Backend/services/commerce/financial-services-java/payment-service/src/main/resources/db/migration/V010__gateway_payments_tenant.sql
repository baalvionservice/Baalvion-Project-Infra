-- Per-tenant scoping for the gateway-checkout vertical. Today's PSP gateway reads one global key
-- set per provider from app.psp.* env; this lets a charge instead resolve PER-TENANT (per website
-- slug) keys from the CMS "Integrations & Keys" vault — replicating the deleted Node service.
--
-- website_slug carries the tenant scope ('__global__' for single-tenant / env-key deploys, set by
-- the entity @PrePersist). The Idempotency-Key becomes unique PER SITE so the SAME key can be
-- reused across tenants without colliding, while a retried create within one tenant still returns
-- the existing charge.

ALTER TABLE payments.gateway_payments
  ADD COLUMN website_slug VARCHAR(190) NOT NULL DEFAULT '__global__';

-- Replace the global Idempotency-Key uniqueness with a per-site one.
ALTER TABLE payments.gateway_payments
  DROP CONSTRAINT IF EXISTS uk_gateway_idempotency_key;
ALTER TABLE payments.gateway_payments
  ADD CONSTRAINT uk_gateway_site_idem UNIQUE (website_slug, idempotency_key);

-- Webhook application + capture/refund resolve a charge per (site, provider, provider_ref).
CREATE INDEX idx_gwpay_site_provider_ref
  ON payments.gateway_payments(website_slug, provider, provider_ref);

-- Re-affirm the non-superuser runtime role baalvion_app has DML on the table after the schema
-- change. Postgres checks table privileges BEFORE RLS, so without these grants every query fails
-- on permission. Idempotent and role-guarded so it is safe where baalvion_app is not yet
-- provisioned (027_app_role). Mirrors V008/V009__grant_baalvion_app.sql.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
    RAISE NOTICE 'baalvion_app role absent — skipping grants for payments.gateway_payments; provision the role (027_app_role) and re-run.';
    RETURN;
  END IF;
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON payments.gateway_payments TO baalvion_app';
END$$;
