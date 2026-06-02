-- Multi-jurisdiction sanctions index (OFAC + EU + UN). Additive: the existing screening path is
-- unchanged. `sanctioned_entities` becomes the canonical multi-source ENTITY index (it already carries
-- list_source); `merge_key` enables cross-source dedup; `sanctions_source_map` records which source
-- records collapse into one logical entity (traceability + sourceIds); `sanctions_alias_index` is a
-- flat alias lookup table. All three are GLOBAL reference data (no tenant, no RLS), like sanctioned_entities.

-- 1. Canonical entity index: cross-source merge key + full addresses.
ALTER TABLE risk.sanctioned_entities ADD COLUMN IF NOT EXISTS merge_key varchar(600);
ALTER TABLE risk.sanctioned_entities ADD COLUMN IF NOT EXISTS addresses jsonb NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_sanctioned_merge_key ON risk.sanctioned_entities(merge_key);

-- 2. Cross-source map: one row per (source, external_id) → its merge group + resolved entity.
CREATE TABLE risk.sanctions_source_map (
  id          uuid PRIMARY KEY,
  merge_key   varchar(600) NOT NULL,
  list_source varchar(32)  NOT NULL,
  external_id varchar(128) NOT NULL,
  entity_id   uuid         NOT NULL,
  created_at  timestamp    NOT NULL,
  updated_at  timestamp    NOT NULL,
  CONSTRAINT uk_source_map_src UNIQUE (list_source, external_id)
);
CREATE INDEX idx_source_map_merge_key ON risk.sanctions_source_map(merge_key);

-- 3. Alias lookup index: one row per (entity, normalized alias) for fast exact-alias lookup + audit.
CREATE TABLE risk.sanctions_alias_index (
  id               uuid PRIMARY KEY,
  entity_id        uuid         NOT NULL,
  list_source      varchar(32)  NOT NULL,
  alias_normalized varchar(512) NOT NULL,
  created_at       timestamp    NOT NULL
);
CREATE INDEX idx_alias_index_norm ON risk.sanctions_alias_index(alias_normalized);
CREATE INDEX idx_alias_index_entity ON risk.sanctions_alias_index(entity_id);
