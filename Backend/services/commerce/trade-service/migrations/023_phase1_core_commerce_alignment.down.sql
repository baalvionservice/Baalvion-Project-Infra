-- Down for 023. Column/constraint additions are reverted. The ADD VALUE calls on
-- enum_orders_status / enum_quotations_status / enum_users_role are NOT reverted —
-- Postgres has no DROP VALUE; removing one requires rebuilding the type against
-- every dependent column/row, which is unsafe to do blindly against live data.
-- The added values are inert no-ops for any row that never adopts them.

ALTER TABLE trade.notifications DROP CONSTRAINT IF EXISTS chk_notifications_type;

ALTER TABLE trade.chat_messages DROP COLUMN IF EXISTS "isRead";
ALTER TABLE trade.chat_messages DROP COLUMN IF EXISTS "readAt";

ALTER TABLE trade.marketplace_listings DROP COLUMN IF EXISTS images;
ALTER TABLE trade.marketplace_listings DROP COLUMN IF EXISTS videos;
ALTER TABLE trade.marketplace_listings DROP COLUMN IF EXISTS specifications;

ALTER TABLE trade.organizations DROP COLUMN IF EXISTS legal_name;
ALTER TABLE trade.organizations DROP COLUMN IF EXISTS industry;
ALTER TABLE trade.organizations DROP COLUMN IF EXISTS business_type;
ALTER TABLE trade.organizations DROP COLUMN IF EXISTS company_size;
ALTER TABLE trade.organizations DROP COLUMN IF EXISTS website;

ALTER TABLE trade.quotations DROP COLUMN IF EXISTS "validUntil";
ALTER TABLE trade.quotations DROP COLUMN IF EXISTS "paymentTerms";
ALTER TABLE trade.quotations DROP COLUMN IF EXISTS moq;
