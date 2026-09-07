-- Real stored objects in the data room.
--
-- data_room_documents only ever had `file_url` — a client-supplied string. Nothing was actually
-- stored, nothing was scanned, and a "document" was whatever URL a party chose to register. These
-- columns describe an object this service holds: the storage key it wrote, the original filename,
-- the verified mime type and the byte count.
--
-- file_url is kept (not dropped) for rows written before this: they reference something external
-- and there is no honest way to turn those into stored objects retrospectively.

BEGIN;
SET search_path TO marketplace, public;

ALTER TABLE marketplace.data_room_documents
  ADD COLUMN IF NOT EXISTS storage_key VARCHAR(600),
  ADD COLUMN IF NOT EXISTS filename    VARCHAR(300),
  ADD COLUMN IF NOT EXISTS mime        VARCHAR(120),
  ADD COLUMN IF NOT EXISTS size_bytes  BIGINT;

CREATE INDEX IF NOT EXISTS idx_data_room_documents_storage_key
  ON marketplace.data_room_documents (storage_key);

COMMIT;
