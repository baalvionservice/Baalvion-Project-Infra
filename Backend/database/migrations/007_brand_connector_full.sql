-- Migration 007: Brand Connector Service — full schema extension
-- Run once against baalvion_db after migration 006

CREATE SCHEMA IF NOT EXISTS brand;

-- ─── Leads ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.leads (
    id                  SERIAL PRIMARY KEY,
    org_id              UUID,
    company_name        VARCHAR(200) NOT NULL,
    niche               VARCHAR(100),
    email               VARCHAR(255),
    instagram_handle    VARCHAR(100),
    website             VARCHAR(500),
    score               DECIMAL(5,2) DEFAULT 0,
    priority            VARCHAR(20)  DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
    score_breakdown     JSONB        DEFAULT '{}',
    status              VARCHAR(30)  DEFAULT 'new' CHECK (status IN ('new','contacted','replied','booked','closed','lost')),
    assigned_to         INTEGER,
    last_scored_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  DEFAULT now(),
    updated_at          TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_leads_org_id   ON brand.leads (org_id);
CREATE INDEX IF NOT EXISTS idx_brand_leads_status   ON brand.leads (status);
CREATE INDEX IF NOT EXISTS idx_brand_leads_priority ON brand.leads (priority);
CREATE INDEX IF NOT EXISTS idx_brand_leads_score    ON brand.leads (score DESC);

-- ─── Lead Notes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.lead_notes (
    id          SERIAL PRIMARY KEY,
    lead_id     INTEGER NOT NULL REFERENCES brand.leads(id) ON DELETE CASCADE,
    text        TEXT    NOT NULL,
    author_id   INTEGER,
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_lead_notes_lead_id ON brand.lead_notes (lead_id);

-- ─── Deals ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.deals (
    id           SERIAL PRIMARY KEY,
    org_id       UUID,
    lead_id      INTEGER REFERENCES brand.leads(id) ON DELETE SET NULL,
    company_name VARCHAR(200) NOT NULL,
    value        DECIMAL(12,2) DEFAULT 0,
    stage        VARCHAR(30)  DEFAULT 'new' CHECK (stage IN ('new','contacted','qualified','proposal','negotiation','closed_won','closed_lost')),
    assigned_to  INTEGER,
    source       VARCHAR(30)  DEFAULT 'manual' CHECK (source IN ('outreach','manual')),
    created_at   TIMESTAMPTZ  DEFAULT now(),
    updated_at   TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_deals_org_id ON brand.deals (org_id);
CREATE INDEX IF NOT EXISTS idx_brand_deals_stage  ON brand.deals (stage);

-- ─── Deal Notes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.deal_notes (
    id          SERIAL PRIMARY KEY,
    deal_id     INTEGER NOT NULL REFERENCES brand.deals(id) ON DELETE CASCADE,
    text        TEXT    NOT NULL,
    author_id   INTEGER,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Proposals ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.proposals (
    id                SERIAL PRIMARY KEY,
    org_id            UUID,
    deal_id           INTEGER REFERENCES brand.deals(id) ON DELETE SET NULL,
    company_name      VARCHAR(200),
    total_price       DECIMAL(12,2) DEFAULT 0,
    status            VARCHAR(20)  DEFAULT 'draft' CHECK (status IN ('draft','sent','approved','rejected')),
    deliverables      JSONB        DEFAULT '[]',
    pricing_breakdown JSONB        DEFAULT '[]',
    notes             TEXT,
    sent_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  DEFAULT now(),
    updated_at        TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_proposals_org_id  ON brand.proposals (org_id);
CREATE INDEX IF NOT EXISTS idx_brand_proposals_deal_id ON brand.proposals (deal_id);

-- ─── Payments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.payments (
    id             SERIAL PRIMARY KEY,
    org_id         UUID,
    proposal_id    INTEGER REFERENCES brand.proposals(id) ON DELETE SET NULL,
    deal_id        INTEGER REFERENCES brand.deals(id)    ON DELETE SET NULL,
    company_name   VARCHAR(200),
    amount         DECIMAL(12,2) NOT NULL,
    status         VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','paid','escrow','released','refunded')),
    method         VARCHAR(30)  CHECK (method IN ('card','upi','netbanking')),
    transaction_id VARCHAR(200),
    paid_at        TIMESTAMPTZ,
    released_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  DEFAULT now(),
    updated_at     TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_payments_org_id ON brand.payments (org_id);
CREATE INDEX IF NOT EXISTS idx_brand_payments_status ON brand.payments (status);

-- ─── Outreach Campaigns ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.outreach_campaigns (
    id               SERIAL PRIMARY KEY,
    org_id           UUID,
    name             VARCHAR(200) NOT NULL,
    type             VARCHAR(20)  DEFAULT 'email' CHECK (type IN ('email','dm')),
    status           VARCHAR(20)  DEFAULT 'draft' CHECK (status IN ('draft','running','paused','completed')),
    total_leads      INTEGER      DEFAULT 0,
    sent_count       INTEGER      DEFAULT 0,
    reply_count      INTEGER      DEFAULT 0,
    message_template TEXT,
    subject          VARCHAR(500),
    created_at       TIMESTAMPTZ  DEFAULT now(),
    updated_at       TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_outreach_campaigns_org ON brand.outreach_campaigns (org_id);

-- ─── Outreach Messages ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.outreach_messages (
    id           SERIAL PRIMARY KEY,
    org_id       UUID,
    campaign_id  INTEGER NOT NULL REFERENCES brand.outreach_campaigns(id) ON DELETE CASCADE,
    lead_id      INTEGER REFERENCES brand.leads(id) ON DELETE SET NULL,
    lead_name    VARCHAR(200),
    subject      VARCHAR(500),
    message      TEXT,
    status       VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','replied')),
    sent_at      TIMESTAMPTZ,
    reply_text   TEXT,
    is_interested BOOLEAN     DEFAULT false,
    created_at   TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_outreach_messages_campaign ON brand.outreach_messages (campaign_id);

-- ─── Scrape Sessions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.scrape_sessions (
    id         SERIAL PRIMARY KEY,
    org_id     UUID,
    query      VARCHAR(500),
    platform   VARCHAR(30) CHECK (platform IN ('instagram','linkedin')),
    lead_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Scraped Leads ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.scraped_leads (
    id           SERIAL PRIMARY KEY,
    org_id       UUID,
    session_id   INTEGER REFERENCES brand.scrape_sessions(id) ON DELETE CASCADE,
    platform     VARCHAR(30),
    company_name VARCHAR(200),
    handle       VARCHAR(100),
    followers    INTEGER,
    niche        VARCHAR(100),
    bio          TEXT,
    website      VARCHAR(500),
    email        VARCHAR(255),
    score        DECIMAL(5,2) DEFAULT 0,
    is_enriched  BOOLEAN      DEFAULT false,
    imported     BOOLEAN      DEFAULT false,
    enrichment   JSONB        DEFAULT '{}',
    created_at   TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_scraped_leads_session ON brand.scraped_leads (session_id);
CREATE INDEX IF NOT EXISTS idx_brand_scraped_leads_org     ON brand.scraped_leads (org_id);

-- ─── Plans ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.plans (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(50)  NOT NULL UNIQUE,
    description   TEXT,
    monthly_price DECIMAL(10,2) DEFAULT 0,
    annual_price  DECIMAL(10,2) DEFAULT 0,
    commission    DECIMAL(5,2)  DEFAULT 0,
    features      JSONB         DEFAULT '[]',
    limits        JSONB         DEFAULT '{}',
    is_active     BOOLEAN       DEFAULT true,
    created_at    TIMESTAMPTZ   DEFAULT now()
);
INSERT INTO brand.plans (name, description, monthly_price, annual_price, commission, features, limits) VALUES
  ('STARTER',    'For individuals and small brands',  2999,  29990, 10, '["Up to 3 campaigns","Basic analytics","Email support"]', '{"campaigns":3,"teamMembers":1}'),
  ('GROWTH',     'For growing brands and agencies',   7999,  79990,  8, '["Up to 20 campaigns","Advanced analytics","Priority support","AI matching"]', '{"campaigns":20,"teamMembers":5}'),
  ('ENTERPRISE', 'For large brands and enterprises',  19999, 199990, 5, '["Unlimited campaigns","Full analytics suite","Dedicated support","AI matching","Custom integrations"]', '{"campaigns":-1,"teamMembers":-1}')
ON CONFLICT (name) DO NOTHING;

-- ─── Subscriptions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.subscriptions (
    id                    SERIAL PRIMARY KEY,
    org_id                UUID        NOT NULL,
    plan_id               INTEGER     REFERENCES brand.plans(id),
    status                VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','cancelled','past_due','trialing')),
    current_period_start  TIMESTAMPTZ DEFAULT now(),
    current_period_end    TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
    cancel_at_period_end  BOOLEAN     DEFAULT false,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_subscriptions_org ON brand.subscriptions (org_id);

-- ─── Invoices ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.invoices (
    id              SERIAL PRIMARY KEY,
    org_id          UUID,
    subscription_id INTEGER REFERENCES brand.subscriptions(id) ON DELETE SET NULL,
    amount          DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(10)   DEFAULT 'INR',
    status          VARCHAR(20)   DEFAULT 'pending' CHECK (status IN ('paid','pending','failed')),
    plan_name       VARCHAR(100),
    pdf_url         VARCHAR(500),
    created_at      TIMESTAMPTZ   DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_invoices_org ON brand.invoices (org_id);

-- ─── Team Members ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.team_members (
    id         SERIAL PRIMARY KEY,
    org_id     UUID        NOT NULL,
    user_id    INTEGER,
    name       VARCHAR(200),
    email      VARCHAR(255) NOT NULL,
    role       VARCHAR(30)  DEFAULT 'viewer' CHECK (role IN ('admin','manager','viewer')),
    status     VARCHAR(20)  DEFAULT 'invited' CHECK (status IN ('active','invited')),
    joined_at  TIMESTAMPTZ,
    created_at TIMESTAMPTZ  DEFAULT now(),
    UNIQUE (org_id, email)
);
CREATE INDEX IF NOT EXISTS idx_brand_team_members_org ON brand.team_members (org_id);

-- ─── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.notifications (
    id         SERIAL PRIMARY KEY,
    org_id     UUID,
    user_id    INTEGER,
    title      VARCHAR(500) NOT NULL,
    message    TEXT,
    read       BOOLEAN      DEFAULT false,
    type       VARCHAR(50),
    link       VARCHAR(500),
    related_id VARCHAR(100),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_notifications_user ON brand.notifications (user_id, read);
CREATE INDEX IF NOT EXISTS idx_brand_notifications_org  ON brand.notifications (org_id);

-- ─── Onboarding States ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.onboarding_states (
    id           SERIAL PRIMARY KEY,
    org_id       UUID    NOT NULL UNIQUE,
    user_id      INTEGER,
    step         INTEGER DEFAULT 0,
    data         JSONB   DEFAULT '{}',
    completed    BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── Automation Rules ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.automation_rules (
    id            SERIAL PRIMARY KEY,
    org_id        UUID,
    name          VARCHAR(200) NOT NULL,
    event_trigger VARCHAR(100) NOT NULL,
    conditions    JSONB        DEFAULT '{}',
    actions       JSONB        DEFAULT '[]',
    is_active     BOOLEAN      DEFAULT true,
    created_at    TIMESTAMPTZ  DEFAULT now(),
    updated_at    TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_automation_org ON brand.automation_rules (org_id);

-- ─── Disputes ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.disputes (
    id                   SERIAL PRIMARY KEY,
    org_id               UUID,
    campaign_id          INTEGER REFERENCES brand.campaigns(id) ON DELETE SET NULL,
    creator_id           INTEGER REFERENCES brand.influencer_profiles(id) ON DELETE SET NULL,
    brand_id             INTEGER REFERENCES brand.brand_profiles(id) ON DELETE SET NULL,
    deliverable_id       INTEGER,
    category             VARCHAR(100),
    reason               TEXT,
    proposed_resolution  TEXT,
    evidence_urls        JSONB       DEFAULT '[]',
    status               VARCHAR(30) DEFAULT 'filed' CHECK (status IN ('filed','under_review','admin_decision','resolved')),
    admin_notes          TEXT,
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_disputes_org    ON brand.disputes (org_id);
CREATE INDEX IF NOT EXISTS idx_brand_disputes_status ON brand.disputes (status);

-- ─── System Logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand.system_logs (
    id         SERIAL PRIMARY KEY,
    org_id     UUID,
    event      VARCHAR(100) NOT NULL,
    message    TEXT,
    metadata   JSONB        DEFAULT '{}',
    created_at TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_system_logs_event ON brand.system_logs (event);
CREATE INDEX IF NOT EXISTS idx_brand_system_logs_org   ON brand.system_logs (org_id);
