-- Give data-room documents a category so access grants can actually be scoped.
--
-- document_access_grants has carried a `category` since 001, but data_room_documents never had
-- one — so there was nothing to match a scoped grant against and the NDA had to grant 'all'.
-- Staged disclosure (share the financials now, the customer contracts after exclusivity) was
-- impossible to express. Same vocabulary as document_requests / due_diligence_items.
--
-- Existing rows are backfilled from the request they answered where there is one, and otherwise
-- left NULL — deliberately NOT guessed. NULL means "uncategorised", and the service treats it as
-- visible only to a holder of an 'all' grant, so nothing already shared becomes more exposed.

BEGIN;
SET search_path TO marketplace, public;

ALTER TABLE marketplace.data_room_documents
    ADD COLUMN IF NOT EXISTS category VARCHAR(20);

UPDATE marketplace.data_room_documents d
   SET category = r.category
  FROM marketplace.document_requests r
 WHERE d.document_request_id = r.id
   AND d.category IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_room_documents_category
    ON marketplace.data_room_documents (deal_id, category);

COMMIT;
