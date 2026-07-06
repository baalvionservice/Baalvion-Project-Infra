-- Down for 025.

ALTER TABLE trade.organizations DROP COLUMN IF EXISTS verified_badge;
ALTER TABLE trade.organizations DROP COLUMN IF EXISTS badge_issued_at;

-- Restore the pre-025 doc_type allow-list. If any row has since adopted a new KYC
-- doc_type value this ADD CONSTRAINT will fail — that is the expected/safe behavior
-- for a rollback that would otherwise silently orphan verification documents.
ALTER TABLE tradeops.documents DROP CONSTRAINT IF EXISTS chk_documents_doc_type;
ALTER TABLE tradeops.documents ADD CONSTRAINT chk_documents_doc_type CHECK (doc_type IN (
    'commercial_invoice','packing_list','bill_of_lading','certificate_of_origin','insurance_document','other'
));

DROP TABLE IF EXISTS tradeops.tax_id_types;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.verification_checklist_items;
DROP TABLE IF EXISTS tradeops.verification_checklist_items;
