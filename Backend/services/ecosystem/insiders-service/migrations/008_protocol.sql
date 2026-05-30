-- Protocol platform — the experts/students/creator-economy sub-app (admin/expert/student portals).
-- Replaces the frontend's src/data/mockData.ts with real, persisted tables. All objects live in the
-- insiders schema; authorization is enforced in the app layer (controller/queryController.js POLICIES).
SET search_path TO insiders, public;

-- Experts (a.k.a. CAD owners) ---------------------------------------------------
CREATE TABLE IF NOT EXISTS protocol_experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,                                   -- specialty / headline
  email TEXT,
  country TEXT,
  avatar TEXT,                                  -- initials for the UI badge
  status TEXT NOT NULL DEFAULT 'pending',       -- pending | active | suspended
  rating NUMERIC DEFAULT 0,
  students INTEGER DEFAULT 0,                    -- denormalized counter for dashboards
  revenue NUMERIC DEFAULT 0,                     -- denormalized USD counter
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students / members ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS protocol_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expert_id UUID REFERENCES protocol_experts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'offline',        -- online | offline
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feed posts (published by experts) --------------------------------------------
CREATE TABLE IF NOT EXISTS protocol_feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES protocol_experts(id) ON DELETE SET NULL,
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT,
  avatar TEXT,
  type TEXT NOT NULL DEFAULT 'text',             -- text | audio | video
  content TEXT,
  duration TEXT,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protocol_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES protocol_feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Live / scheduled calls --------------------------------------------------------
CREATE TABLE IF NOT EXISTS protocol_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES protocol_experts(id) ON DELETE SET NULL,
  host_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'video',            -- video | audio
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'upcoming',        -- live | upcoming | ended
  attendees INTEGER DEFAULT 0,
  duration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invite links ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS protocol_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES protocol_experts(id) ON DELETE SET NULL,
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  code TEXT UNIQUE NOT NULL,
  link TEXT,
  expiry TEXT,
  max_users INTEGER DEFAULT 50,
  used_by INTEGER DEFAULT 0,
  price TEXT DEFAULT 'Free',
  status TEXT NOT NULL DEFAULT 'active',           -- active | expired
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products (content vault / store) ---------------------------------------------
CREATE TABLE IF NOT EXISTS protocol_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES protocol_experts(id) ON DELETE SET NULL,
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'document',           -- message | document | prompt | ai
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  original_price NUMERIC,
  sales INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders (a student buys a product) --------------------------------------------
CREATE TABLE IF NOT EXISTS protocol_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES protocol_products(id) ON DELETE SET NULL,
  buyer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Regional rollups (admin Country/CAD view) ------------------------------------
CREATE TABLE IF NOT EXISTS protocol_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  flag TEXT,
  experts INTEGER DEFAULT 0,
  students INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS protocol_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protocol_students_expert ON protocol_students(expert_id);
CREATE INDEX IF NOT EXISTS idx_protocol_feed_expert     ON protocol_feed_posts(expert_id);
CREATE INDEX IF NOT EXISTS idx_protocol_calls_expert    ON protocol_calls(expert_id);
CREATE INDEX IF NOT EXISTS idx_protocol_invites_owner   ON protocol_invites(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_protocol_products_expert ON protocol_products(expert_id);
CREATE INDEX IF NOT EXISTS idx_protocol_orders_buyer    ON protocol_orders(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_protocol_notifs_user     ON protocol_notifications(user_id);
