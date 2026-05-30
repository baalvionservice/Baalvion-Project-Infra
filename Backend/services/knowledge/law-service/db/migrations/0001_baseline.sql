-- 0001_baseline.sql — schema + extensions the platform relies on.
-- Idempotent and safe on an already-synced database: it only ensures the `legal`
-- schema and the Postgres extensions used by full-text + fuzzy search.

CREATE SCHEMA IF NOT EXISTS legal;

-- pg_trgm  → trigram similarity for typo-tolerant lawyer/name autocomplete.
-- unaccent → diacritic-insensitive search (José == Jose) for a global directory.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
