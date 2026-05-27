-- Auth-unification migration 000 — add password_reset_required + provenance to auth.users
-- NON-DESTRUCTIVE, IDEMPOTENT. Run ONCE against the auth DB BEFORE import-island-users.mjs --apply.
-- Required by every island import (law/trade/elite-circle/insiders/keycloak) and the
-- force-reset analysis (A5). auth.users currently has NO such column (see 001_auth_schema.sql).

ALTER TABLE auth.users
    ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN NOT NULL DEFAULT FALSE;

-- Provenance: which island a user was imported from. Enables targeted rollback
-- (DELETE FROM auth.users WHERE imported_from = '<island>') and audit. NULL = native auth-service user.
ALTER TABLE auth.users
    ADD COLUMN IF NOT EXISTS imported_from VARCHAR(40);

CREATE INDEX IF NOT EXISTS idx_users_pw_reset_required
    ON auth.users (password_reset_required) WHERE password_reset_required = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_imported_from
    ON auth.users (imported_from) WHERE imported_from IS NOT NULL;
