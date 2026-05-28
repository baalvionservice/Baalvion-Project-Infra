-- Migration 015: Law Service (Law Elite Network) — full schema
-- Run once against baalvion_db after migration 014

CREATE SCHEMA IF NOT EXISTS legal;

-- ─── Lawyers ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal.lawyers (
    id              SERIAL PRIMARY KEY,
    user_id         TEXT NOT NULL,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    specializations TEXT[]       DEFAULT '{}',
    bar_number      VARCHAR(100),
    jurisdictions   TEXT[]       DEFAULT '{}',
    experience      INTEGER      DEFAULT 0,
    hourly_rate     DECIMAL(10,2) DEFAULT 0,
    rating          DECIMAL(3,2)  DEFAULT 0,
    total_reviews   INTEGER      DEFAULT 0,
    bio             TEXT,
    profile_photo   TEXT,
    languages       TEXT[]       DEFAULT '{}',
    availability    JSONB        DEFAULT '{}',
    verified        BOOLEAN      DEFAULT false,
    status          VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('active','suspended','pending')),
    created_at      TIMESTAMPTZ  DEFAULT now(),
    updated_at      TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_lawyers_user_id  ON legal.lawyers (user_id);
CREATE INDEX IF NOT EXISTS idx_legal_lawyers_status   ON legal.lawyers (status);
CREATE INDEX IF NOT EXISTS idx_legal_lawyers_verified ON legal.lawyers (verified);
CREATE INDEX IF NOT EXISTS idx_legal_lawyers_rating   ON legal.lawyers (rating DESC);

-- ─── Clients ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal.clients (
    id                  SERIAL PRIMARY KEY,
    user_id             TEXT NOT NULL,
    name                VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL,
    phone               VARCHAR(50),
    location            VARCHAR(255),
    preferred_language  VARCHAR(10)  DEFAULT 'en',
    subscription_tier   VARCHAR(20)  DEFAULT 'BASIC' CHECK (subscription_tier IN ('BASIC','PROFESSIONAL','ENTERPRISE')),
    created_at          TIMESTAMPTZ  DEFAULT now(),
    updated_at          TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_clients_user_id ON legal.clients (user_id);
CREATE INDEX IF NOT EXISTS idx_legal_clients_tier    ON legal.clients (subscription_tier);

-- ─── Cases ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal.cases (
    id          SERIAL PRIMARY KEY,
    client_id   INTEGER NOT NULL REFERENCES legal.clients(id) ON DELETE CASCADE,
    lawyer_id   INTEGER REFERENCES legal.lawyers(id) ON DELETE SET NULL,
    title       VARCHAR(500) NOT NULL,
    description TEXT,
    category    TEXT,
    status      VARCHAR(20)  DEFAULT 'open' CHECK (status IN ('open','in_progress','closed','archived')),
    priority    VARCHAR(20)  DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
    outcome     TEXT,
    closed_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  DEFAULT now(),
    updated_at  TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_cases_client_id ON legal.cases (client_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_lawyer_id ON legal.cases (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status    ON legal.cases (status);
CREATE INDEX IF NOT EXISTS idx_legal_cases_priority  ON legal.cases (priority);

-- ─── Bookings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal.bookings (
    id           SERIAL PRIMARY KEY,
    client_id    INTEGER NOT NULL REFERENCES legal.clients(id) ON DELETE CASCADE,
    lawyer_id    INTEGER NOT NULL REFERENCES legal.lawyers(id) ON DELETE CASCADE,
    case_id      INTEGER REFERENCES legal.cases(id) ON DELETE SET NULL,
    type         VARCHAR(30) NOT NULL CHECK (type IN ('consultation','representation','review')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration     INTEGER      DEFAULT 60,
    status       VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
    notes        TEXT,
    total_amount DECIMAL(10,2) DEFAULT 0,
    created_at   TIMESTAMPTZ  DEFAULT now(),
    updated_at   TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_bookings_client_id    ON legal.bookings (client_id);
CREATE INDEX IF NOT EXISTS idx_legal_bookings_lawyer_id    ON legal.bookings (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_legal_bookings_status       ON legal.bookings (status);
CREATE INDEX IF NOT EXISTS idx_legal_bookings_scheduled_at ON legal.bookings (scheduled_at DESC);

-- ─── Messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal.messages (
    id          SERIAL PRIMARY KEY,
    case_id     INTEGER REFERENCES legal.cases(id) ON DELETE SET NULL,
    booking_id  INTEGER REFERENCES legal.bookings(id) ON DELETE SET NULL,
    sender_id   TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content     TEXT NOT NULL,
    type        VARCHAR(20)  DEFAULT 'text' CHECK (type IN ('text','file','system')),
    file_url    TEXT,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_messages_sender_id   ON legal.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_legal_messages_receiver_id ON legal.messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_legal_messages_case_id     ON legal.messages (case_id);
CREATE INDEX IF NOT EXISTS idx_legal_messages_booking_id  ON legal.messages (booking_id);

-- ─── Documents ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal.documents (
    id         SERIAL PRIMARY KEY,
    owner_id   TEXT NOT NULL,
    case_id    INTEGER REFERENCES legal.cases(id) ON DELETE SET NULL,
    name       VARCHAR(500) NOT NULL,
    type       TEXT,
    url        TEXT NOT NULL,
    size       INTEGER      DEFAULT 0,
    category   VARCHAR(30)  DEFAULT 'other' CHECK (category IN ('evidence','contract','brief','court_filing','other')),
    created_at TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_documents_owner_id ON legal.documents (owner_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_case_id  ON legal.documents (case_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_category ON legal.documents (category);

-- ─── Payments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal.payments (
    id              SERIAL PRIMARY KEY,
    booking_id      INTEGER REFERENCES legal.bookings(id) ON DELETE SET NULL,
    client_id       INTEGER NOT NULL REFERENCES legal.clients(id) ON DELETE CASCADE,
    lawyer_id       INTEGER REFERENCES legal.lawyers(id) ON DELETE SET NULL,
    amount          DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(3)   DEFAULT 'USD',
    status          VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','refunded')),
    provider        TEXT,
    provider_tx_id  TEXT,
    created_at      TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_payments_client_id      ON legal.payments (client_id);
CREATE INDEX IF NOT EXISTS idx_legal_payments_lawyer_id      ON legal.payments (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_legal_payments_booking_id     ON legal.payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_legal_payments_status         ON legal.payments (status);
CREATE INDEX IF NOT EXISTS idx_legal_payments_provider_tx_id ON legal.payments (provider_tx_id);

-- ─── Subscriptions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal.subscriptions (
    id         SERIAL PRIMARY KEY,
    client_id  INTEGER NOT NULL REFERENCES legal.clients(id) ON DELETE CASCADE,
    tier       VARCHAR(20) NOT NULL CHECK (tier IN ('BASIC','PROFESSIONAL','ENTERPRISE')),
    status     VARCHAR(20)  DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
    started_at TIMESTAMPTZ  DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ  DEFAULT now(),
    updated_at TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_subscriptions_client_id ON legal.subscriptions (client_id);
CREATE INDEX IF NOT EXISTS idx_legal_subscriptions_status    ON legal.subscriptions (status);

-- ─── Reviews ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal.reviews (
    id         SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES legal.bookings(id) ON DELETE CASCADE,
    client_id  INTEGER NOT NULL REFERENCES legal.clients(id) ON DELETE CASCADE,
    lawyer_id  INTEGER NOT NULL REFERENCES legal.lawyers(id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMPTZ  DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_legal_reviews_booking_unique ON legal.reviews (booking_id);
CREATE INDEX IF NOT EXISTS idx_legal_reviews_lawyer_id ON legal.reviews (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_legal_reviews_client_id ON legal.reviews (client_id);

-- ─── Articles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal.articles (
    id           SERIAL PRIMARY KEY,
    author_id    TEXT NOT NULL,
    title        VARCHAR(500) NOT NULL,
    slug         VARCHAR(500) NOT NULL UNIQUE,
    content      TEXT,
    category     TEXT,
    tags         TEXT[]       DEFAULT '{}',
    status       VARCHAR(20)  DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    published_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  DEFAULT now(),
    updated_at   TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_articles_author_id    ON legal.articles (author_id);
CREATE INDEX IF NOT EXISTS idx_legal_articles_slug         ON legal.articles (slug);
CREATE INDEX IF NOT EXISTS idx_legal_articles_status       ON legal.articles (status);
CREATE INDEX IF NOT EXISTS idx_legal_articles_published_at ON legal.articles (published_at DESC);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal.notifications (
    id         SERIAL PRIMARY KEY,
    user_id    TEXT NOT NULL,
    type       TEXT NOT NULL,
    title      VARCHAR(500) NOT NULL,
    message    TEXT NOT NULL,
    read       BOOLEAN      DEFAULT false,
    data       JSONB        DEFAULT '{}',
    created_at TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_notifications_user_id ON legal.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_legal_notifications_read    ON legal.notifications (read) WHERE read = false;

-- ─── Referrals ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal.referrals (
    id          SERIAL PRIMARY KEY,
    referrer_id TEXT NOT NULL,
    referee_id  TEXT,
    code        VARCHAR(50) NOT NULL UNIQUE,
    status      VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','completed')),
    reward      DECIMAL(10,2) DEFAULT 0,
    created_at  TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_referrals_referrer_id ON legal.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_legal_referrals_code        ON legal.referrals (code);
CREATE INDEX IF NOT EXISTS idx_legal_referrals_status      ON legal.referrals (status);
