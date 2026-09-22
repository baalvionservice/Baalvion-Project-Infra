-- 0036_show_participants.sql — one row per person who took part in a video show (a Bigg Boss housemate, a
-- Roadies contestant, ...). Seeded with what is known (name, seasons, result); an editor adds the write-up,
-- facts, quick answers and sources. A page is only indexable once written. Never hard-deleted.

CREATE TABLE IF NOT EXISTS legal.show_participants (
    id              SERIAL PRIMARY KEY,
    slug            VARCHAR(200) NOT NULL,
    show_slug       VARCHAR(200) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    appearances     JSONB NOT NULL DEFAULT '[]',
    known_for       TEXT,
    overview        TEXT NOT NULL DEFAULT '',
    facts           JSONB NOT NULL DEFAULT '[]',
    faq             JSONB NOT NULL DEFAULT '[]',
    sources         JSONB NOT NULL DEFAULT '[]',
    seo_title       VARCHAR(200),
    seo_description VARCHAR(320),
    reviewed_at     TIMESTAMPTZ,
    indexable       BOOLEAN NOT NULL DEFAULT false,
    published       BOOLEAN NOT NULL DEFAULT true,
    archived        BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (show_slug, slug)
);
CREATE INDEX IF NOT EXISTS show_participants_show_idx ON legal.show_participants (show_slug, published, archived);
