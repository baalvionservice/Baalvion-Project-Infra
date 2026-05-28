-- Paid memberships, rich founder profiles, and founder<->founder connections.
SET search_path TO insiders, public;

-- Founder profile fields (self-editable; profiles.write policy is owner-only).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'founder';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_about TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS idea TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interview JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stage TEXT;

-- Memberships (paid access gate).
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'founder',
  status TEXT NOT NULL DEFAULT 'inactive',   -- inactive | active | cancelled
  amount_usd NUMERIC,
  currency TEXT DEFAULT 'USD',
  payment_ref TEXT,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
DROP TRIGGER IF EXISTS memberships_updated_at ON memberships;
CREATE TRIGGER memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Founder <-> founder (member) connections.
CREATE TABLE IF NOT EXISTS member_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | accepted | declined
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id)
);
CREATE INDEX IF NOT EXISTS idx_member_conn_from ON member_connections(from_user_id);
CREATE INDEX IF NOT EXISTS idx_member_conn_to ON member_connections(to_user_id);
DROP TRIGGER IF EXISTS member_connections_updated_at ON member_connections;
CREATE TRIGGER member_connections_updated_at BEFORE UPDATE ON member_connections FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE OR REPLACE FUNCTION notify_member_connection()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = insiders, public AS $$
DECLARE v_from TEXT;
BEGIN
  SELECT COALESCE(full_name, username) INTO v_from FROM profiles WHERE id = NEW.from_user_id;
  PERFORM create_notification(NEW.to_user_id, 'member_connection', 'New connection request',
    COALESCE(v_from, 'A founder') || ' wants to connect with you.', '/founders');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_member_connection ON member_connections;
CREATE TRIGGER trg_notify_member_connection AFTER INSERT ON member_connections FOR EACH ROW EXECUTE FUNCTION notify_member_connection();

CREATE OR REPLACE FUNCTION notify_member_connection_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = insiders, public AS $$
DECLARE v_to TEXT;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, username) INTO v_to FROM profiles WHERE id = NEW.to_user_id;
  IF NEW.status = 'accepted' THEN
    PERFORM create_notification(NEW.from_user_id, 'member_connection', 'Connection accepted',
      COALESCE(v_to, 'A founder') || ' accepted your connection request.', '/founders');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_member_connection_status ON member_connections;
CREATE TRIGGER trg_notify_member_connection_status AFTER UPDATE ON member_connections FOR EACH ROW EXECUTE FUNCTION notify_member_connection_status();
