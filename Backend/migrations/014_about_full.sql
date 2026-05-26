-- Migration 014: About Service (CMS) — full schema
-- Run once against baalvion_db after migration 013

CREATE SCHEMA IF NOT EXISTS about;

-- ─── Pages ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS about.pages (
    id               SERIAL PRIMARY KEY,
    org_id           UUID,
    slug             VARCHAR(200) NOT NULL UNIQUE,
    title            VARCHAR(500) NOT NULL,
    content          TEXT,
    meta_title       VARCHAR(200),
    meta_description TEXT,
    og_image         VARCHAR(500),
    status           VARCHAR(20)  DEFAULT 'draft' CHECK (status IN ('draft','published')),
    page_type        VARCHAR(50),
    display_order    INTEGER      DEFAULT 0,
    published_at     TIMESTAMPTZ,
    created_by       INTEGER,
    created_at       TIMESTAMPTZ  DEFAULT now(),
    updated_at       TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_about_pages_slug   ON about.pages (slug);
CREATE INDEX IF NOT EXISTS idx_about_pages_status ON about.pages (status);
CREATE INDEX IF NOT EXISTS idx_about_pages_order  ON about.pages (display_order);

-- ─── Team Members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS about.team_members (
    id             SERIAL PRIMARY KEY,
    org_id         UUID,
    name           VARCHAR(200) NOT NULL,
    title          VARCHAR(200),
    department     VARCHAR(100),
    bio            TEXT,
    avatar_url     VARCHAR(500),
    cover_image    VARCHAR(500),
    email          VARCHAR(255),
    linkedin_url   VARCHAR(500),
    twitter_url    VARCHAR(500),
    github_url     VARCHAR(500),
    is_leadership  BOOLEAN DEFAULT false,
    is_featured    BOOLEAN DEFAULT false,
    display_order  INTEGER DEFAULT 0,
    joined_year    INTEGER,
    status         VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','alumni')),
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_about_team_org        ON about.team_members (org_id);
CREATE INDEX IF NOT EXISTS idx_about_team_leadership ON about.team_members (is_leadership);
CREATE INDEX IF NOT EXISTS idx_about_team_order      ON about.team_members (display_order);

-- ─── News Posts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS about.news_posts (
    id           SERIAL PRIMARY KEY,
    org_id       UUID,
    title        VARCHAR(500) NOT NULL,
    slug         VARCHAR(500) NOT NULL UNIQUE,
    content      TEXT,
    summary      TEXT,
    category     VARCHAR(30)  DEFAULT 'blog' CHECK (category IN ('press_release','blog','announcement','media_coverage','partnership')),
    tags         JSONB        DEFAULT '[]',
    cover_image  VARCHAR(500),
    source_url   VARCHAR(500),
    author_id    INTEGER,
    author_name  VARCHAR(200),
    status       VARCHAR(20)  DEFAULT 'draft' CHECK (status IN ('draft','published')),
    is_featured  BOOLEAN      DEFAULT false,
    published_at TIMESTAMPTZ,
    views_count  INTEGER      DEFAULT 0,
    created_at   TIMESTAMPTZ  DEFAULT now(),
    updated_at   TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_about_news_slug     ON about.news_posts (slug);
CREATE INDEX IF NOT EXISTS idx_about_news_status   ON about.news_posts (status);
CREATE INDEX IF NOT EXISTS idx_about_news_category ON about.news_posts (category);
CREATE INDEX IF NOT EXISTS idx_about_news_featured ON about.news_posts (is_featured);

-- ─── FAQs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS about.faqs (
    id            SERIAL PRIMARY KEY,
    org_id        UUID,
    category      VARCHAR(100),
    question      TEXT    NOT NULL,
    answer        TEXT    NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_featured   BOOLEAN DEFAULT false,
    status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_about_faqs_org      ON about.faqs (org_id);
CREATE INDEX IF NOT EXISTS idx_about_faqs_category ON about.faqs (category);
CREATE INDEX IF NOT EXISTS idx_about_faqs_order    ON about.faqs (display_order);

-- ─── Contact Submissions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS about.contact_submissions (
    id            SERIAL PRIMARY KEY,
    org_id        UUID,
    name          VARCHAR(200) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    company       VARCHAR(200),
    subject       VARCHAR(300),
    message       TEXT NOT NULL,
    inquiry_type  VARCHAR(50),
    status        VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')),
    response      TEXT,
    responded_at  TIMESTAMPTZ,
    responded_by  INTEGER,
    ip_address    VARCHAR(50),
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_about_contact_status ON about.contact_submissions (status);
CREATE INDEX IF NOT EXISTS idx_about_contact_date   ON about.contact_submissions (created_at DESC);
