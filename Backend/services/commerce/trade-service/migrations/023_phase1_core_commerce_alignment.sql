-- 023 — Phase 1 MVP core-commerce alignment.
--
-- Closes a batch of gaps found auditing trade-service against the "Baalvion Global
-- Trade Platform Phase 1 MVP" spec: the RFQ→Quote→PO→Order→Payment path was missing
-- fields the spec requires. All changes are strictly ADDITIVE (new enum values, new
-- nullable/defaulted columns, one CHECK constraint whose allow-list already covers
-- every value in current use) — no existing column, row, or enum value is altered
-- or removed, so this is safe to apply against a populated table.
--
--   • trade.enum_orders_status      — add the Phase 1 8-state flow values
--   • trade.enum_quotations_status  — add 'countered' (explicit counter-offer state)
--   • trade.enum_users_role         — add 'buyer' / 'seller' / 'trade_agent'
--   • trade.quotations              — validUntil / paymentTerms / moq
--   • trade.organizations           — legal_name / industry / business_type /
--                                     company_size / website (company profile)
--   • trade.marketplace_listings    — images / videos / specifications (product)
--   • trade.chat_messages           — isRead / readAt (read receipts)
--   • trade.notifications           — CHECK constraint enumerating the notification
--                                     types the spec calls for (RFQ/quote/order/
--                                     payment/shipment/message/PO/system + the
--                                     pre-existing task/ticket/info types)
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies.

ALTER TYPE trade.enum_orders_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE trade.enum_orders_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE trade.enum_orders_status ADD VALUE IF NOT EXISTS 'ready_to_ship';
ALTER TYPE trade.enum_orders_status ADD VALUE IF NOT EXISTS 'dispatched';
ALTER TYPE trade.enum_orders_status ADD VALUE IF NOT EXISTS 'in_transit';
ALTER TYPE trade.enum_orders_status ADD VALUE IF NOT EXISTS 'completed';

ALTER TYPE trade.enum_quotations_status ADD VALUE IF NOT EXISTS 'countered';

ALTER TYPE trade.enum_users_role ADD VALUE IF NOT EXISTS 'buyer';
ALTER TYPE trade.enum_users_role ADD VALUE IF NOT EXISTS 'seller';
ALTER TYPE trade.enum_users_role ADD VALUE IF NOT EXISTS 'trade_agent';

ALTER TABLE trade.quotations ADD COLUMN IF NOT EXISTS "validUntil" timestamptz;
ALTER TABLE trade.quotations ADD COLUMN IF NOT EXISTS "paymentTerms" character varying(255);
ALTER TABLE trade.quotations ADD COLUMN IF NOT EXISTS moq integer;

ALTER TABLE trade.organizations ADD COLUMN IF NOT EXISTS legal_name character varying(255);
ALTER TABLE trade.organizations ADD COLUMN IF NOT EXISTS industry character varying(120);
ALTER TABLE trade.organizations ADD COLUMN IF NOT EXISTS business_type character varying(120);
ALTER TABLE trade.organizations ADD COLUMN IF NOT EXISTS company_size character varying(40);
ALTER TABLE trade.organizations ADD COLUMN IF NOT EXISTS website character varying(255);

ALTER TABLE trade.marketplace_listings ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;
ALTER TABLE trade.marketplace_listings ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]'::jsonb;
ALTER TABLE trade.marketplace_listings ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '{}'::jsonb;

ALTER TABLE trade.chat_messages ADD COLUMN IF NOT EXISTS "isRead" boolean DEFAULT false;
ALTER TABLE trade.chat_messages ADD COLUMN IF NOT EXISTS "readAt" timestamptz;

ALTER TABLE trade.notifications DROP CONSTRAINT IF EXISTS chk_notifications_type;
ALTER TABLE trade.notifications ADD CONSTRAINT chk_notifications_type CHECK (type IS NULL OR type IN (
    'info',
    'new_rfq',
    'quotation_received',
    'quotation_accepted',
    'quotation_rejected',
    'quotation_countered',
    'order_status_update',
    'payment_update',
    'shipment_update',
    'new_message',
    'po_issued',
    'po_accepted',
    'po_rejected',
    'task_assigned',
    'support_ticket_reply',
    'system_announcement'
));
