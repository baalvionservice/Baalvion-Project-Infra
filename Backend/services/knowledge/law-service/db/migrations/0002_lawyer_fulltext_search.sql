-- 0002_lawyer_fulltext_search.sql
-- Replaces the ILIKE '%term%' lawyer search (un-ranked, un-indexable, won't scale)
-- with a weighted Postgres full-text index + trigram autocomplete. Core to the
-- "find any lawyer across 188 countries" product surface.

-- A trigger-maintained tsvector (NOT a GENERATED column: unaccent/array_to_string
-- are not IMMUTABLE, which a generated column forbids). Weighting:
--   A = name (highest)   B = specializations   C = city/country/jurisdictions   D = bio
ALTER TABLE legal.lawyers ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION legal.lawyers_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', unaccent(coalesce(NEW.name, ''))), 'A') ||
        setweight(to_tsvector('simple', unaccent(array_to_string(coalesce(NEW.specializations, '{}'), ' '))), 'B') ||
        setweight(to_tsvector('simple', unaccent(
            coalesce(NEW.city, '') || ' ' || coalesce(NEW.country, '') || ' ' ||
            array_to_string(coalesce(NEW.jurisdictions, '{}'), ' ') || ' ' ||
            array_to_string(coalesce(NEW.languages, '{}'), ' ')
        )), 'C') ||
        setweight(to_tsvector('simple', unaccent(coalesce(NEW.bio, ''))), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lawyers_search_vector ON legal.lawyers;
CREATE TRIGGER trg_lawyers_search_vector
    BEFORE INSERT OR UPDATE ON legal.lawyers
    FOR EACH ROW EXECUTE FUNCTION legal.lawyers_search_vector_update();

-- Back-fill existing rows (fires the trigger via a no-op touch).
UPDATE legal.lawyers SET search_vector = NULL WHERE search_vector IS NULL;
UPDATE legal.lawyers SET name = name;

-- Indexes: GIN over the tsvector for ranked search; trigram over name for fast,
-- typo-tolerant autocomplete ("ame" → "Amelia").
CREATE INDEX IF NOT EXISTS idx_lawyers_search_vector ON legal.lawyers USING gin (search_vector);
CREATE INDEX IF NOT EXISTS idx_lawyers_name_trgm     ON legal.lawyers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lawyers_city_trgm     ON legal.lawyers USING gin (city gin_trgm_ops);

-- Supporting btree indexes for the common directory filters + default ordering.
CREATE INDEX IF NOT EXISTS idx_lawyers_status_rating ON legal.lawyers (status, rating DESC, total_reviews DESC);
CREATE INDEX IF NOT EXISTS idx_lawyers_country_code  ON legal.lawyers (country_code);
