-- Rollback for auth-unification migration 000. Non-destructive of user rows.
DROP INDEX IF EXISTS auth.idx_users_pw_reset_required;
DROP INDEX IF EXISTS auth.idx_users_imported_from;
ALTER TABLE auth.users DROP COLUMN IF EXISTS password_reset_required;
ALTER TABLE auth.users DROP COLUMN IF EXISTS imported_from;
