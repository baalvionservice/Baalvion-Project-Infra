-- 069 — Let the insurance layer raise notifications.
--
-- trade.notifications.type is CHECK-constrained to a fixed vocabulary, so every
-- insurance notification was silently rejected: service/insurance/notify.js caught
-- the constraint violation, logged it and returned null, meaning a claim could sit
-- in `evidence_required` with nobody told and a payout could land with no notice.
-- These nine types are the insurance lifecycle events a human has to act on.

ALTER TABLE "trade".notifications DROP CONSTRAINT IF EXISTS chk_notifications_type;
ALTER TABLE "trade".notifications
    ADD CONSTRAINT chk_notifications_type CHECK (
        type IS NULL OR type IN (
            'info','new_rfq','quotation_received','quotation_accepted','quotation_rejected',
            'quotation_countered','order_status_update','payment_update','shipment_update',
            'new_message','po_issued','po_accepted','po_rejected','task_assigned',
            'support_ticket_reply','system_announcement','verification_requested',
            'verification_approved','verification_rejected','document_expiring',
            'compliance_issue','trust_score_updated','tender_invitation',
            -- Insurance (migration 066/069)
            'policy_bound','policy_expiring','policy_expired',
            'claim_filed','claim_evidence_required','claim_under_review',
            'claim_approved','claim_rejected','claim_paid',
            'general_average_declared'
        )
    );
