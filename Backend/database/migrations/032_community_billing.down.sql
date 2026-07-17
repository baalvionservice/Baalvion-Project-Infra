-- Rollback 032: Community Service billing webhook dedup
DROP TABLE IF EXISTS community.community_billing_webhook_events;
ALTER TABLE community.communities DROP COLUMN IF EXISTS price_usd_cents;
