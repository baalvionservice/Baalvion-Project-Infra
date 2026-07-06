-- Down for 039. Restores the pre-039 notifications type allow-list (migration
-- 023's version). Fails if any row has since adopted a Phase 2 type — expected,
-- safe rollback behavior (same reasoning as migration 025's down file).
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
