-- Revert 006 — drop brute-force tracking columns.
ALTER TABLE trade.users DROP COLUMN IF EXISTS failed_login_attempts;
ALTER TABLE trade.users DROP COLUMN IF EXISTS locked_until;
ALTER TABLE trade.users DROP COLUMN IF EXISTS last_login_at;
