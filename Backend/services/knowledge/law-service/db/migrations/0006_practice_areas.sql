-- 0006_practice_areas.sql — practice-area lookup table replacing the ad-hoc
-- free-text `lawyers.specializations` array as the source of truth for the
-- registration wizard's Professional Details step and cascading search
-- filters. `specializations` is retained (see migration 0007) as a
-- denormalized mirror so existing full-text search / listLawyers filtering
-- keeps working unchanged during the transition.

CREATE TABLE IF NOT EXISTS legal.practice_areas (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(120) NOT NULL UNIQUE,
    slug       VARCHAR(120) NOT NULL UNIQUE,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    "order"    INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO legal.practice_areas (name, slug, "order") VALUES
    ('Criminal', 'criminal', 1),
    ('Civil', 'civil', 2),
    ('Family', 'family', 3),
    ('Corporate', 'corporate', 4),
    ('Tax', 'tax', 5),
    ('Immigration', 'immigration', 6),
    ('Cyber Law', 'cyber-law', 7),
    ('Intellectual Property', 'intellectual-property', 8),
    ('Arbitration', 'arbitration', 9),
    ('Real Estate', 'real-estate', 10),
    ('Labour', 'labour', 11),
    ('Banking', 'banking', 12),
    ('International Law', 'international-law', 13),
    ('Others', 'others', 14)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS legal.lawyer_practice_areas (
    id               SERIAL PRIMARY KEY,
    lawyer_id        INTEGER NOT NULL REFERENCES legal.lawyers(id) ON DELETE CASCADE,
    practice_area_id INTEGER NOT NULL REFERENCES legal.practice_areas(id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (lawyer_id, practice_area_id)
);
CREATE INDEX IF NOT EXISTS idx_lawyer_practice_areas_lawyer ON legal.lawyer_practice_areas (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_practice_areas_practice ON legal.lawyer_practice_areas (practice_area_id);
