-- 0026_home_widgets.sql — admin-managed items for the Law Elite Network homepage
-- widgets (breaking bar, ticker, audio briefing, docket, photo gallery, video
-- shorts). One row is one entry in one widget. The site renders a widget only
-- while it has live, published entries, so an empty table shows nothing rather
-- than placeholder copy. Never hard-deleted; archive instead.

CREATE TABLE IF NOT EXISTS legal.home_widget_items (
    id           SERIAL PRIMARY KEY,
    widget       VARCHAR(20)  NOT NULL,
    title        VARCHAR(300) NOT NULL,
    summary      TEXT NOT NULL DEFAULT '',
    source_name  VARCHAR(200),
    url          TEXT,
    image_url    TEXT,
    credit       TEXT,
    value        VARCHAR(100),
    extra        JSONB NOT NULL DEFAULT '{}',
    event_at     TIMESTAMPTZ,
    expires_at   TIMESTAMPTZ,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    published    BOOLEAN NOT NULL DEFAULT false,
    archived     BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS home_widget_items_live_idx ON legal.home_widget_items (widget, published, archived, sort_order);
