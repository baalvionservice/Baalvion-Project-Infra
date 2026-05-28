-- Baalvion Insiders — baseline schema (ported from Supabase, RLS removed;
-- authorization is enforced in the application layer). All objects live in the
-- `insiders` schema. Auth is self-hosted (insiders.users replaces auth.users).

CREATE SCHEMA IF NOT EXISTS insiders;
SET search_path TO insiders, public;

-- ── Enums ────────────────────────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'premium', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE product_category AS ENUM ('flights', 'hosting', 'courses', 'merchandise', 'vip_deals'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE thread_status AS ENUM ('open', 'closed', 'pinned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Auth: users + refresh tokens (replaces Supabase auth.users) ───────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verify_token TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ── Profiles (1:1 with users; id == users.id) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- ── Gamification ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points_required INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ── Forums ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  slug TEXT UNIQUE NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status thread_status DEFAULT 'open',
  views INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS thread_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS thread_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, tag_id)
);

-- ── Marketplace ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category product_category NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2),
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Deals & funnel ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL,
  title TEXT NOT NULL,
  pitch TEXT NOT NULL,
  description TEXT,
  problem TEXT,
  solution TEXT,
  business_model TEXT,
  funding_required NUMERIC,
  expected_return TEXT,
  stage TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deal_id, investor_id)
);

CREATE TABLE IF NOT EXISTS member_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT,
  bio TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Elite circle ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS elite_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role_title TEXT,
  company TEXT,
  bio TEXT,
  linkedin_url TEXT,
  proof_url TEXT,
  invite_code TEXT,
  reason_for_joining TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elite_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_name TEXT NOT NULL,
  badge_color TEXT NOT NULL,
  tier TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elite_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  threads_created INTEGER DEFAULT 0,
  upvotes_received INTEGER DEFAULT 0,
  engagement_score NUMERIC DEFAULT 0,
  rank INTEGER,
  badge TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elite_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications, activity, settings, analytics ──────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tag_analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL DEFAULT 'weekly',
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  report_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Shared functions / triggers ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
DROP TRIGGER IF EXISTS update_forum_threads_updated_at ON forum_threads;
CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON forum_threads FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON forum_posts;
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
DROP TRIGGER IF EXISTS deals_updated_at ON deals;
CREATE TRIGGER deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
DROP TRIGGER IF EXISTS deal_interests_updated_at ON deal_interests;
CREATE TRIGGER deal_interests_updated_at BEFORE UPDATE ON deal_interests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
DROP TRIGGER IF EXISTS member_applications_updated_at ON member_applications;
CREATE TRIGGER member_applications_updated_at BEFORE UPDATE ON member_applications FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Role check (kept for parity; the app layer also enforces this).
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Notification helper (mirrors Supabase create_notification RPC).
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID, p_type TEXT, p_title TEXT, p_message TEXT, p_link TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Atomic thread view counter (mirrors increment_thread_views RPC).
CREATE OR REPLACE FUNCTION increment_thread_views(thread_id UUID)
RETURNS VOID LANGUAGE SQL AS $$
  UPDATE forum_threads SET views = COALESCE(views, 0) + 1 WHERE id = thread_id
$$;

-- ── Notification triggers (replace the Supabase realtime/trigger behaviour) ────
CREATE OR REPLACE FUNCTION notify_deal_interest()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_founder_id UUID; v_title TEXT; v_investor_name TEXT;
BEGIN
  SELECT founder_id, title INTO v_founder_id, v_title FROM deals WHERE id = NEW.deal_id;
  SELECT COALESCE(full_name, username) INTO v_investor_name FROM profiles WHERE id = NEW.investor_id;
  IF v_founder_id IS NOT NULL AND v_founder_id <> NEW.investor_id THEN
    PERFORM create_notification(v_founder_id, 'deal_interest', 'New investor interest',
      COALESCE(v_investor_name, 'An investor') || ' is interested in "' || v_title || '"',
      '/deals/' || NEW.deal_id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_deal_interest ON deal_interests;
CREATE TRIGGER trg_notify_deal_interest AFTER INSERT ON deal_interests FOR EACH ROW EXECUTE FUNCTION notify_deal_interest();

CREATE OR REPLACE FUNCTION notify_deal_interest_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_title TEXT;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT title INTO v_title FROM deals WHERE id = NEW.deal_id;
  IF NEW.status = 'approved' THEN
    PERFORM create_notification(NEW.investor_id, 'connection_approved', 'Connection approved',
      'Your interest in "' || v_title || '" was approved. You can now connect.', '/deals/' || NEW.deal_id);
  ELSIF NEW.status = 'rejected' THEN
    PERFORM create_notification(NEW.investor_id, 'connection_rejected', 'Connection update',
      'Your interest in "' || v_title || '" was not approved at this time.', '/deals/' || NEW.deal_id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_deal_interest_status ON deal_interests;
CREATE TRIGGER trg_notify_deal_interest_status AFTER UPDATE ON deal_interests FOR EACH ROW EXECUTE FUNCTION notify_deal_interest_status();

CREATE OR REPLACE FUNCTION notify_application_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF NEW.status = 'approved' THEN
    PERFORM create_notification(NEW.user_id, 'application_status', 'Welcome to Baalvion Insiders',
      'Your application has been approved. Full access unlocked.', '/dashboard');
  ELSIF NEW.status = 'rejected' THEN
    PERFORM create_notification(NEW.user_id, 'application_status', 'Application update',
      COALESCE(NEW.reviewer_note, 'Your application was not approved at this time.'), '/apply');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_application_status ON member_applications;
CREATE TRIGGER trg_notify_application_status AFTER UPDATE ON member_applications FOR EACH ROW EXECUTE FUNCTION notify_application_status();

-- ── Seed reference data ───────────────────────────────────────────────────────
INSERT INTO badges (name, description, icon, points_required) VALUES
  ('Newcomer', 'Welcome to Baalvion Insiders', '🌟', 0),
  ('Active Member', 'Posted 10 times', '💬', 100),
  ('Elite Contributor', 'Earned 500 points', '👑', 500),
  ('Market Expert', 'Shared valuable market insights', '📈', 1000),
  ('Top Insider', 'Reached top 10 leaderboard', '🏆', 2000)
ON CONFLICT DO NOTHING;

INSERT INTO forum_categories (name, description, icon, slug, order_index) VALUES
  ('Market Strategy', 'Discuss trading strategies and market analysis', '📊', 'market-strategy', 1),
  ('System Cracking', 'Share insights on innovative business systems', '🔓', 'system-cracking', 2),
  ('Startup Hub', 'Connect with entrepreneurs and investors', '🚀', 'startup-hub', 3),
  ('Wealth Building', 'Investment strategies and wealth creation', '💰', 'wealth-building', 4),
  ('Elite Lounge', 'Exclusive discussions for premium members', '👔', 'elite-lounge', 5)
ON CONFLICT (slug) DO NOTHING;
