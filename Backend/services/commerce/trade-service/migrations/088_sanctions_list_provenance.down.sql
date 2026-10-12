-- 088 down — remove sanctions-list provenance.
-- Imported rows cannot satisfy the original uniqueness rule, so they are removed
-- before it is restored. Hand-curated rows (source_id IS NULL) are untouched.
DROP TABLE IF EXISTS tradeops.compliance_list_imports;
DELETE FROM tradeops.compliance_sanctioned_parties WHERE source_id IS NOT NULL;
DROP INDEX IF EXISTS tradeops.uq_sanctioned_parties_source;
DROP INDEX IF EXISTS tradeops.uq_sanctioned_parties_curated;
DROP INDEX IF EXISTS tradeops.idx_sanctioned_parties_active_source;
ALTER TABLE tradeops.compliance_sanctioned_parties ADD CONSTRAINT uq_sanctioned_parties UNIQUE (list_source, party_type, name, country);
ALTER TABLE tradeops.compliance_sanctioned_parties DROP COLUMN IF EXISTS delisted_at;
ALTER TABLE tradeops.compliance_sanctioned_parties DROP COLUMN IF EXISTS last_seen_at;
ALTER TABLE tradeops.compliance_sanctioned_parties DROP COLUMN IF EXISTS source_list_date;
ALTER TABLE tradeops.compliance_sanctioned_parties DROP COLUMN IF EXISTS source_id;
