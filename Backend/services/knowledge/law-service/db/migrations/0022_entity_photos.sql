-- 0022_entity_photos.sql — photos for ANY entity, keyed by (type, slug) rather
-- than a database row, so the site's built-in people, films, teams and courts
-- can have real photos without first being copied into the admin tables.
-- Same rules as person_photos: bytes live in the row (LEN-owned storage), a
-- credit and an allowed licence are mandatory, a replacement is a new row so a
-- photo URL never changes content, and nothing is hard-deleted.

CREATE TABLE IF NOT EXISTS legal.entity_photos (
    id            SERIAL PRIMARY KEY,
    entity_type   VARCHAR(30)  NOT NULL,
    entity_slug   VARCHAR(200) NOT NULL,
    content_type  VARCHAR(40)  NOT NULL,
    data          BYTEA NOT NULL,
    width         INTEGER,
    height        INTEGER,
    sha256        VARCHAR(64)  NOT NULL,
    alt_text      VARCHAR(300),
    credit        VARCHAR(500) NOT NULL,
    license       VARCHAR(60)  NOT NULL,
    license_url   VARCHAR(500),
    source_url    VARCHAR(500),
    is_primary    BOOLEAN NOT NULL DEFAULT false,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (entity_type, entity_slug, sha256)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_entity_primary_photo ON legal.entity_photos (entity_type, entity_slug) WHERE is_primary AND is_active;
CREATE INDEX IF NOT EXISTS idx_entity_photos_lookup ON legal.entity_photos (entity_type, entity_slug);
