-- 0004_subscription_billing.sql — recurring-billing fields on subscriptions.
-- Enables the billing worker to renew due subscriptions (extend the period and
-- record a payment) or cancel them at period end, instead of subscriptions that
-- are created once and never re-billed.

ALTER TABLE legal.subscriptions ADD COLUMN IF NOT EXISTS price                NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE legal.subscriptions ADD COLUMN IF NOT EXISTS currency             VARCHAR(3)    NOT NULL DEFAULT 'USD';
ALTER TABLE legal.subscriptions ADD COLUMN IF NOT EXISTS interval_days        INTEGER       NOT NULL DEFAULT 30;
ALTER TABLE legal.subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN       NOT NULL DEFAULT false;
ALTER TABLE legal.subscriptions ADD COLUMN IF NOT EXISTS last_payment_at      TIMESTAMPTZ;
ALTER TABLE legal.subscriptions ADD COLUMN IF NOT EXISTS renewal_count        INTEGER       NOT NULL DEFAULT 0;

-- Find-due-subscriptions scan: active rows ordered by expiry.
CREATE INDEX IF NOT EXISTS idx_subscriptions_due ON legal.subscriptions (status, expires_at);
