-- 006 — brute-force protection: per-account failed-login tracking + temporary
-- lockout. Complements the IP rate limiter (which throttles by source) with an
-- account-scoped control that survives across IPs.
ALTER TABLE trade.users ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE trade.users ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE trade.users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
