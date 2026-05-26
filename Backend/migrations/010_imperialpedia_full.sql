-- Migration 010: Imperialpedia Service — full schema
-- Run once against baalvion_db after migration 009

CREATE SCHEMA IF NOT EXISTS imperialpedia;

-- ─── Articles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imperialpedia.articles (
    id               SERIAL PRIMARY KEY,
    org_id           UUID,
    title            VARCHAR(500) NOT NULL,
    slug             VARCHAR(500) NOT NULL UNIQUE,
    content          TEXT,
    summary          TEXT,
    category         VARCHAR(100),
    tags             JSONB        DEFAULT '[]',
    author_id        INTEGER,
    author_name      VARCHAR(200),
    status           VARCHAR(20)  DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    published_at     TIMESTAMPTZ,
    views_count      INTEGER      DEFAULT 0,
    likes_count      INTEGER      DEFAULT 0,
    cover_image      VARCHAR(500),
    reading_time_min INTEGER      DEFAULT 0,
    created_at       TIMESTAMPTZ  DEFAULT now(),
    updated_at       TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_imp_articles_slug     ON imperialpedia.articles (slug);
CREATE INDEX IF NOT EXISTS idx_imp_articles_status   ON imperialpedia.articles (status);
CREATE INDEX IF NOT EXISTS idx_imp_articles_author   ON imperialpedia.articles (author_id);
CREATE INDEX IF NOT EXISTS idx_imp_articles_category ON imperialpedia.articles (category);

-- ─── Asset Summaries ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imperialpedia.asset_summaries (
    id               SERIAL PRIMARY KEY,
    symbol           VARCHAR(20)  NOT NULL UNIQUE,
    name             VARCHAR(200),
    asset_type       VARCHAR(50),
    exchange         VARCHAR(50),
    current_price    DECIMAL(12,4) DEFAULT 0,
    change_pct_24h   DECIMAL(6,2)  DEFAULT 0,
    market_cap       DECIMAL(20,2) DEFAULT 0,
    volume_24h       DECIMAL(20,2) DEFAULT 0,
    ai_summary       TEXT,
    sentiment        VARCHAR(10)   DEFAULT 'neutral' CHECK (sentiment IN ('bullish','bearish','neutral')),
    key_metrics      JSONB         DEFAULT '{}',
    last_updated_at  TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   DEFAULT now(),
    updated_at       TIMESTAMPTZ   DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_imp_assets_type ON imperialpedia.asset_summaries (asset_type);

-- ─── Community Posts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imperialpedia.community_posts (
    id             SERIAL PRIMARY KEY,
    org_id         UUID,
    author_id      INTEGER NOT NULL,
    author_name    VARCHAR(200),
    title          VARCHAR(500) NOT NULL,
    content        TEXT NOT NULL,
    category       VARCHAR(100),
    tags           JSONB   DEFAULT '[]',
    upvotes        INTEGER DEFAULT 0,
    downvotes      INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned      BOOLEAN DEFAULT false,
    status         VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','removed')),
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_imp_posts_author   ON imperialpedia.community_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_imp_posts_category ON imperialpedia.community_posts (category);
CREATE INDEX IF NOT EXISTS idx_imp_posts_status   ON imperialpedia.community_posts (status);

-- ─── Comments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imperialpedia.comments (
    id          SERIAL PRIMARY KEY,
    post_id     INTEGER NOT NULL REFERENCES imperialpedia.community_posts(id) ON DELETE CASCADE,
    author_id   INTEGER,
    author_name VARCHAR(200),
    content     TEXT    NOT NULL,
    upvotes     INTEGER DEFAULT 0,
    parent_id   INTEGER REFERENCES imperialpedia.comments(id) ON DELETE CASCADE,
    status      VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','removed')),
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_imp_comments_post   ON imperialpedia.comments (post_id);
CREATE INDEX IF NOT EXISTS idx_imp_comments_parent ON imperialpedia.comments (parent_id);

-- ─── Votes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imperialpedia.votes (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post','comment','article')),
    target_id   INTEGER NOT NULL,
    value       INTEGER NOT NULL CHECK (value IN (1,-1)),
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_imp_votes_target ON imperialpedia.votes (target_type, target_id);

-- ─── Creator Profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imperialpedia.creator_profiles (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL UNIQUE,
    display_name     VARCHAR(200),
    bio              TEXT,
    avatar_url       VARCHAR(500),
    specialization   JSONB   DEFAULT '[]',
    article_count    INTEGER DEFAULT 0,
    followers_count  INTEGER DEFAULT 0,
    total_views      INTEGER DEFAULT 0,
    reputation_score DECIMAL(6,2) DEFAULT 0,
    is_verified      BOOLEAN DEFAULT false,
    social_links     JSONB   DEFAULT '{}',
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_imp_creators_reputation ON imperialpedia.creator_profiles (reputation_score DESC);

-- ─── Leaderboard Entries ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imperialpedia.leaderboard_entries (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL,
    display_name   VARCHAR(200),
    avatar_url     VARCHAR(500),
    period         VARCHAR(10) DEFAULT 'monthly' CHECK (period IN ('weekly','monthly','alltime')),
    score          DECIMAL(10,2) DEFAULT 0,
    rank           INTEGER,
    articles_count INTEGER DEFAULT 0,
    views_total    INTEGER DEFAULT 0,
    likes_total    INTEGER DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, period)
);
CREATE INDEX IF NOT EXISTS idx_imp_leaderboard_period ON imperialpedia.leaderboard_entries (period, rank);

-- ─── Calculator Results ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imperialpedia.calculator_results (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER,
    calculator_type  VARCHAR(50) NOT NULL,
    inputs           JSONB NOT NULL,
    results          JSONB NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_imp_calc_user ON imperialpedia.calculator_results (user_id);
