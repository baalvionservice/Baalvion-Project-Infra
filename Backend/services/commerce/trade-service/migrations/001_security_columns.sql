-- 001 — security/identity columns (idempotent; reconciles columns added during
-- the Phase A hardening pass so migrations are the source of truth going forward).
ALTER TABLE trade.users ADD COLUMN IF NOT EXISTS tenant_id varchar(64) NOT NULL DEFAULT 'T-DEMO';
ALTER TABLE trade.users ADD COLUMN IF NOT EXISTS mfa_enabled boolean DEFAULT false;
ALTER TABLE trade.users ADD COLUMN IF NOT EXISTS mfa_secret text;
ALTER TABLE trade.users ADD COLUMN IF NOT EXISTS mfa_backup_codes jsonb DEFAULT '[]';
ALTER TABLE trade.organizations ADD COLUMN IF NOT EXISTS code varchar(64)
