-- 0020_legal_case_court_profiles.sql — admin-managed public case and court
-- reference profiles for Law Elite Network's Legal pillar. Distinct from
-- legal.cases (a client's private matter): these are published, factual
-- write-ups of notable public cases. Never hard-deleted; archive instead.

CREATE TABLE IF NOT EXISTS legal.court_profiles (
    id            SERIAL PRIMARY KEY,
    slug          VARCHAR(200) NOT NULL UNIQUE,
    name          VARCHAR(300) NOT NULL,
    level         VARCHAR(20)  NOT NULL DEFAULT 'other',
    country_code  VARCHAR(2),
    description   TEXT NOT NULL DEFAULT '',
    url           VARCHAR(500),
    published     BOOLEAN NOT NULL DEFAULT false,
    indexable     BOOLEAN NOT NULL DEFAULT false,
    archived      BOOLEAN NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal.case_profiles (
    id                     SERIAL PRIMARY KEY,
    slug                   VARCHAR(200) NOT NULL UNIQUE,
    case_name              VARCHAR(400) NOT NULL,
    court_slug             VARCHAR(200) NOT NULL,
    jurisdiction           VARCHAR(300) NOT NULL DEFAULT '',
    country_code           VARCHAR(2),
    status                 VARCHAR(20)  NOT NULL DEFAULT 'concluded',
    summary                TEXT NOT NULL DEFAULT '',
    parties                JSONB NOT NULL DEFAULT '[]',
    lawyers                JSONB NOT NULL DEFAULT '[]',
    judges                 JSONB NOT NULL DEFAULT '[]',
    important_dates        JSONB NOT NULL DEFAULT '[]',
    timeline               JSONB NOT NULL DEFAULT '[]',
    documents              JSONB NOT NULL DEFAULT '[]',
    related_article_slugs  JSONB NOT NULL DEFAULT '[]',
    seo_title              VARCHAR(200),
    seo_description        VARCHAR(400),
    verified               BOOLEAN NOT NULL DEFAULT false,
    source_note            TEXT,
    last_reviewed_at       TIMESTAMPTZ,
    published              BOOLEAN NOT NULL DEFAULT false,
    indexable              BOOLEAN NOT NULL DEFAULT false,
    archived               BOOLEAN NOT NULL DEFAULT false,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_profiles_court ON legal.case_profiles (court_slug) WHERE published AND NOT archived;
