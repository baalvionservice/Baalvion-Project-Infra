-- Revert 069 — restore the pre-insurance notification vocabulary. Any insurance
-- notification already written would violate it, so those rows are removed first.
DELETE FROM "trade".notifications WHERE type IN (
    'policy_bound','policy_expiring','policy_expired','claim_filed','claim_evidence_required',
    'claim_under_review','claim_approved','claim_rejected','claim_paid','general_average_declared'
);
ALTER TABLE "trade".notifications DROP CONSTRAINT IF EXISTS chk_notifications_type;
ALTER TABLE "trade".notifications
    ADD CONSTRAINT chk_notifications_type CHECK (
        type IS NULL OR type IN (
            'info','new_rfq','quotation_received','quotation_accepted','quotation_rejected',
            'quotation_countered','order_status_update','payment_update','shipment_update',
            'new_message','po_issued','po_accepted','po_rejected','task_assigned',
            'support_ticket_reply','system_announcement','verification_requested',
            'verification_approved','verification_rejected','document_expiring',
            'compliance_issue','trust_score_updated','tender_invitation'
        )
    );
