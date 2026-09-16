-- CanWeMarry — initial schema.
--
-- Identity is NOT owned here. `users.id` is the platform subject claim from the
-- RS256 token issued by auth-service; there is deliberately no email, password or
-- credential column in this schema. The service stores only what the support
-- product needs, so a compromise of this database yields no credentials.
SET search_path TO canwemarry, public;

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = canwemarry, public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$;

-- ── Accounts, roles, profiles ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY,                    -- == platform identity subject (JWT `sub`)
  status          TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','DEACTIVATED')),
  suspended_until TIMESTAMPTZ,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Role is modelled as a constrained assignment rather than a lookup table: the
-- permissions each role grants live in domain/permissions.js, not in the database,
-- so authorization cannot be silently widened by an UPDATE.
CREATE TABLE IF NOT EXISTS user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('USER','SUPPORTER','VOLUNTEER','MODERATOR','ADMIN')),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

CREATE TABLE IF NOT EXISTS profiles (
  user_id                  UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  handle                   TEXT NOT NULL UNIQUE CHECK (handle ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  display_name             TEXT,
  bio                      TEXT,
  avatar_url               TEXT,
  country_code             CHAR(2),
  region                   TEXT,
  languages                TEXT[] NOT NULL DEFAULT '{}',
  -- Privacy defaults are closed. Discoverability and location are opt-in, and a new
  -- account's cases start PRIVATE unless the person deliberately widens them.
  is_discoverable          BOOLEAN NOT NULL DEFAULT FALSE,
  show_location            BOOLEAN NOT NULL DEFAULT FALSE,
  default_case_visibility  TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (default_case_visibility IN ('PUBLIC','COMMUNITY','PRIVATE')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_discoverable ON profiles(is_discoverable) WHERE is_discoverable;

-- ── Communities ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS communities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,63}$'),
  name         TEXT NOT NULL,
  description  TEXT,
  visibility   TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC','PRIVATE')),
  join_policy  TEXT NOT NULL DEFAULT 'REQUEST' CHECK (join_policy IN ('OPEN','REQUEST','INVITE')),
  country_code CHAR(2),
  region       TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_communities_active ON communities(is_active, visibility);

CREATE TABLE IF NOT EXISTS community_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('MEMBER','MODERATOR','ADMIN')),
  status       TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVE','BANNED','LEFT')),
  joined_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (community_id, user_id)
);
-- The access context reads this on every request; keep the ACTIVE lookup covered.
CREATE INDEX IF NOT EXISTS idx_community_members_active ON community_members(user_id, status) WHERE status = 'ACTIVE';

-- ── Cases ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cases (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference                TEXT NOT NULL UNIQUE,       -- short human handle, e.g. CWM-7K3P2Q
  owner_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id             UUID REFERENCES communities(id) ON DELETE SET NULL,
  title                    TEXT NOT NULL,
  summary                  TEXT NOT NULL,
  situation                TEXT,
  support_needed           TEXT[] NOT NULL DEFAULT '{}',
  visibility               TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PUBLIC','COMMUNITY','PRIVATE')),
  status                   TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','OPEN','ON_HOLD','RESOLVED','CLOSED')),
  moderation_state         TEXT NOT NULL DEFAULT 'VISIBLE' CHECK (moderation_state IN ('VISIBLE','UNDER_REVIEW','HIDDEN','REMOVED')),
  country_code             CHAR(2),
  region                   TEXT,
  allow_supporter_requests BOOLEAN NOT NULL DEFAULT TRUE,
  is_locked                BOOLEAN NOT NULL DEFAULT FALSE,
  supporter_count          INTEGER NOT NULL DEFAULT 0,
  comment_count            INTEGER NOT NULL DEFAULT 0,
  resolved_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A community-scoped case must name the community it is scoped to, or the
  -- visibility rule has nothing to check membership against and would fall open.
  CONSTRAINT cases_community_required CHECK (visibility <> 'COMMUNITY' OR community_id IS NOT NULL)
);
-- The list query filters on visibility + moderation_state + status and orders by
-- recency; this index matches that access path.
CREATE INDEX IF NOT EXISTS idx_cases_feed ON cases(visibility, moderation_state, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_owner ON cases(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_community ON cases(community_id) WHERE community_id IS NOT NULL;

-- Participants carry a platform user id and a relation label — and nothing else.
-- There is no name, contact or free-text column here by design: a person who has not
-- consented cannot be identified through this table, because the columns that would
-- identify them do not exist.
CREATE TABLE IF NOT EXISTS case_participants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id        UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  relation       TEXT NOT NULL CHECK (relation IN ('SELF','PARTNER','FAMILY_MEMBER','MEDIATOR','LEGAL_ADVISOR','COUNSELLOR','OTHER')),
  consent_status TEXT NOT NULL DEFAULT 'INVITED' CHECK (consent_status IN ('SELF','INVITED','GRANTED','DECLINED','WITHDRAWN')),
  invited_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, user_id),
  -- An implicit-consent row must belong to a real account (the case owner).
  CONSTRAINT case_participants_self_has_user CHECK (consent_status <> 'SELF' OR user_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_case_participants_case ON case_participants(case_id);
CREATE INDEX IF NOT EXISTS idx_case_participants_consenting ON case_participants(user_id, consent_status)
  WHERE consent_status IN ('SELF','GRANTED');

CREATE TABLE IF NOT EXISTS case_supporters (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','ACCEPTED','DECLINED','WITHDRAWN','REVOKED')),
  message      TEXT,
  responded_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_case_supporters_accepted ON case_supporters(user_id, status) WHERE status = 'ACCEPTED';
CREATE INDEX IF NOT EXISTS idx_case_supporters_case ON case_supporters(case_id, status);

-- ── Discussion ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id     UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  moderation_state TEXT NOT NULL DEFAULT 'VISIBLE' CHECK (moderation_state IN ('VISIBLE','UNDER_REVIEW','HIDDEN','REMOVED')),
  is_locked        BOOLEAN NOT NULL DEFAULT FALSE,
  comment_count    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id, moderation_state, created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type      TEXT NOT NULL CHECK (target_type IN ('POST','CASE')),
  target_id        UUID NOT NULL,
  parent_id        UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body             TEXT NOT NULL,
  moderation_state TEXT NOT NULL DEFAULT 'VISIBLE' CHECK (moderation_state IN ('VISIBLE','UNDER_REVIEW','HIDDEN','REMOVED')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);

-- Supportive reactions only. There is no downvote, no anger and no dislike kind, and
-- adding one would require a migration and a review — which is the point.
CREATE TABLE IF NOT EXISTS reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('CASE','POST','COMMENT')),
  target_id   UUID NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('SUPPORT','THANKS','HELPFUL')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);

-- ── Notifications ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_inbox ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- ── Safety: reports and moderation ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type     TEXT NOT NULL CHECK (target_type IN ('CASE','POST','COMMENT','PROFILE','COMMUNITY')),
  target_id       UUID NOT NULL,
  reason          TEXT NOT NULL CHECK (reason IN (
                    'HARASSMENT','THREAT_OR_VIOLENCE','PRIVACY_VIOLATION','IMPERSONATION',
                    'SPAM','HATE_SPEECH','SELF_HARM_RISK','COERCION','OFF_TOPIC','OTHER')),
  details         TEXT,
  severity        TEXT NOT NULL DEFAULT 'NORMAL' CHECK (severity IN ('LOW','NORMAL','HIGH','CRITICAL')),
  status          TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','TRIAGED','ACTIONED','DISMISSED')),
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_note TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One standing report per person per target; re-reporting the same thing adds noise
  -- to the queue rather than signal.
  UNIQUE (reporter_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_reports_queue ON reports(status, severity, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  report_id   UUID REFERENCES reports(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('CASE','POST','COMMENT','PROFILE','COMMUNITY','USER')),
  target_id   UUID NOT NULL,
  action      TEXT NOT NULL CHECK (action IN (
                'HIDE','UNHIDE','LOCK','UNLOCK','WARN','SUSPEND','UNSUSPEND',
                'REMOVE','RESTORE','DISMISS_REPORT')),
  reason      TEXT NOT NULL,     -- required: an unexplained moderation action is not reviewable
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moderation_target ON moderation_actions(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actor ON moderation_actions(actor_id, created_at DESC);

-- ── Resource directory ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  title         TEXT NOT NULL,
  summary       TEXT NOT NULL,
  body          TEXT,
  category      TEXT NOT NULL CHECK (category IN ('LEGAL','MEDIATION','COUNSELLING','SAFETY','RIGHTS','FINANCIAL','OTHER')),
  country_code  CHAR(2),
  region        TEXT,
  url           TEXT,
  provider_name TEXT,
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  published_at  TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resources_published ON resources(category, country_code) WHERE is_published;

-- ── Audit ────────────────────────────────────────────────────────────────────

-- Append-only record of moderation and administrative actions. The client IP and
-- user agent are stored as keyed hashes, never in the clear, so the log answers
-- "was this the same origin?" without retaining an identifier for the person.
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID,
  actor_roles     TEXT[] NOT NULL DEFAULT '{}',
  action          TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       UUID,
  request_id      TEXT,
  ip_hash         TEXT,
  user_agent_hash TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_recent ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);

-- ── updated_at triggers ──────────────────────────────────────────────────────

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','profiles','communities','community_members','cases',
                           'case_participants','case_supporters','posts','comments',
                           'reports','resources']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_updated_at', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION handle_updated_at()',
                   t || '_updated_at', t);
  END LOOP;
END $$;
