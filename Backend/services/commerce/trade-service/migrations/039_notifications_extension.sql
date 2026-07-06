-- 039 — Phase 2 Trust/Verification/Compliance Foundation: Notifications wiring.
--
-- Additively extends the trade.notifications type CHECK (migration 023) with the
-- Phase 2 verification/compliance/trust-score notification types
-- (service/verification/notify.js). No existing value removed.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies.

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
    'system_announcement',
    'verification_requested',
    'verification_approved',
    'verification_rejected',
    'document_expiring',
    'compliance_issue',
    'trust_score_updated'
));
