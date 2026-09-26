-- 0018_member_follows_saved.sql — reader accounts: follow entities (people,
-- topics, movies, sports, cases...) and save articles. Both are private to the
-- owning user; no endpoint exposes one member's rows to another.

CREATE TABLE IF NOT EXISTS legal.member_follows (
    user_id      TEXT NOT NULL,
    entity_type  VARCHAR(30) NOT NULL,
    entity_slug  VARCHAR(200) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, entity_type, entity_slug)
);
-- Fan-out on publish looks up followers by entity, not by user.
CREATE INDEX IF NOT EXISTS idx_member_follows_entity ON legal.member_follows (entity_type, entity_slug);

CREATE TABLE IF NOT EXISTS legal.member_saved_articles (
    user_id       TEXT NOT NULL,
    article_slug  VARCHAR(300) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, article_slug)
);

-- Idempotent fan-out: one follow_update notification per (user, article).
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_follow_update
    ON legal.notifications (user_id, (data->>'articleSlug'))
    WHERE type = 'follow_update';
