-- 0019_people_profiles.sql — admin-managed public-figure profiles for Law Elite
-- Network (People pillar). The website reads these over /v1/people; anything
-- not in this table falls back to the site's bundled roster. Nothing here is
-- ever hard-deleted: profiles are archived, photos are deactivated.

CREATE TABLE IF NOT EXISTS legal.people (
    id                SERIAL PRIMARY KEY,
    slug              VARCHAR(200) NOT NULL UNIQUE,
    full_name         VARCHAR(300) NOT NULL,
    display_name      VARCHAR(300),
    category          VARCHAR(40)  NOT NULL,
    country_code      VARCHAR(2),
    status            VARCHAR(20)  NOT NULL DEFAULT 'active',
    birth_date        VARCHAR(20),
    birth_place       VARCHAR(300),
    death_date        VARCHAR(20),
    short_bio         TEXT,
    biography         TEXT,
    career            JSONB NOT NULL DEFAULT '[]',
    education         JSONB NOT NULL DEFAULT '[]',
    awards            JSONB NOT NULL DEFAULT '[]',
    notable_works     JSONB NOT NULL DEFAULT '[]',
    timeline          JSONB NOT NULL DEFAULT '[]',
    social            JSONB NOT NULL DEFAULT '{}',
    official_website  VARCHAR(500),
    sources           JSONB NOT NULL DEFAULT '[]',
    wikidata_id       VARCHAR(20),
    seo_title         VARCHAR(200),
    seo_description   VARCHAR(400),
    verified          BOOLEAN NOT NULL DEFAULT false,
    source_note       TEXT,
    published         BOOLEAN NOT NULL DEFAULT false,
    indexable         BOOLEAN NOT NULL DEFAULT false,
    archived          BOOLEAN NOT NULL DEFAULT false,
    last_reviewed_at  TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_people_category ON legal.people (category) WHERE published AND NOT archived;

-- Photo bytes live in the row: LEN-owned storage with no external dependency.
-- A replacement is a new row, so a photo URL is immutable and cacheable forever.
CREATE TABLE IF NOT EXISTS legal.person_photos (
    id            SERIAL PRIMARY KEY,
    person_id     INTEGER NOT NULL REFERENCES legal.people(id) ON DELETE RESTRICT,
    content_type  VARCHAR(40) NOT NULL,
    data          BYTEA NOT NULL,
    width         INTEGER,
    height        INTEGER,
    sha256        VARCHAR(64) NOT NULL,
    alt_text      VARCHAR(300),
    credit        VARCHAR(500) NOT NULL,
    license       VARCHAR(60)  NOT NULL,
    license_url   VARCHAR(500),
    source_url    VARCHAR(500),
    is_primary    BOOLEAN NOT NULL DEFAULT false,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (person_id, sha256)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_person_primary_photo ON legal.person_photos (person_id) WHERE is_primary AND is_active;

-- Tagging: connects a person to topics, articles, cases, teams, other people...
CREATE TABLE IF NOT EXISTS legal.person_links (
    id           SERIAL PRIMARY KEY,
    person_id    INTEGER NOT NULL REFERENCES legal.people(id) ON DELETE RESTRICT,
    kind         VARCHAR(30) NOT NULL,
    target_slug  VARCHAR(200) NOT NULL,
    relationship VARCHAR(200),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (person_id, kind, target_slug)
);
CREATE INDEX IF NOT EXISTS idx_person_links_target ON legal.person_links (kind, target_slug);
