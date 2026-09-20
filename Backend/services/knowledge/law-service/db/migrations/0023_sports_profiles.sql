-- 0023_sports_profiles.sql — admin-managed sports team and competition
-- reference profiles for Law Elite Network's Sports pillar, plus a sports_info
-- block on people so an athlete can be tied to a team from the admin panel.
-- Editorial/reference only: no rosters-as-data, schedules, standings or scores.
-- Never hard-deleted; archive instead.

CREATE TABLE IF NOT EXISTS legal.sports_teams (
    id            SERIAL PRIMARY KEY,
    slug          VARCHAR(200) NOT NULL UNIQUE,
    name          VARCHAR(300) NOT NULL,
    sport         VARCHAR(100) NOT NULL DEFAULT 'Other',
    country_code  VARCHAR(2),
    description   TEXT NOT NULL DEFAULT '',
    url           VARCHAR(500),
    verified      BOOLEAN NOT NULL DEFAULT false,
    source_note   TEXT,
    published     BOOLEAN NOT NULL DEFAULT false,
    indexable     BOOLEAN NOT NULL DEFAULT false,
    archived      BOOLEAN NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal.sports_competitions (
    id                     SERIAL PRIMARY KEY,
    slug                   VARCHAR(200) NOT NULL UNIQUE,
    name                   VARCHAR(400) NOT NULL,
    sport                  VARCHAR(100) NOT NULL DEFAULT 'Other',
    level                  VARCHAR(20)  NOT NULL DEFAULT 'other',
    country_code           VARCHAR(2),
    description            TEXT NOT NULL DEFAULT '',
    event_date             VARCHAR(20),
    people_involved        JSONB NOT NULL DEFAULT '[]',
    related_article_slugs  JSONB NOT NULL DEFAULT '[]',
    videos                 JSONB NOT NULL DEFAULT '[]',
    verified               BOOLEAN NOT NULL DEFAULT false,
    source_note            TEXT,
    published              BOOLEAN NOT NULL DEFAULT false,
    indexable              BOOLEAN NOT NULL DEFAULT false,
    archived               BOOLEAN NOT NULL DEFAULT false,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE legal.people ADD COLUMN IF NOT EXISTS sports_info JSONB NOT NULL DEFAULT '{}';
