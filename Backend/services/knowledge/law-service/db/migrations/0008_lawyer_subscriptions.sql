-- 0008_lawyer_subscriptions.sql — lawyers can now hold a subscription too
-- (the wizard's Subscription step gates account activation), not only
-- clients. Additive + backward compatible: client_id becomes nullable,
-- existing rows are backfilled to subscriber_type='client' so the billing
-- worker and every current consumer keeps working unchanged.

ALTER TABLE legal.subscriptions ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE legal.subscriptions ADD COLUMN IF NOT EXISTS lawyer_id INTEGER REFERENCES legal.lawyers(id);
ALTER TABLE legal.subscriptions ADD COLUMN IF NOT EXISTS subscriber_type VARCHAR(10) NOT NULL DEFAULT 'client';
UPDATE legal.subscriptions SET subscriber_type = 'client' WHERE subscriber_type IS NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_lawyer ON legal.subscriptions (lawyer_id);
