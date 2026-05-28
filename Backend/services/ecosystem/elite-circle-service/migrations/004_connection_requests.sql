-- Founder -> Investor intro/connection requests + notification triggers.
SET search_path TO elite_circle, public;

CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  response_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (from_user_id, investor_id)
);
CREATE INDEX IF NOT EXISTS idx_connreq_from ON connection_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connreq_status ON connection_requests(status, created_at);

DROP TRIGGER IF EXISTS connection_requests_updated_at ON connection_requests;
CREATE TRIGGER connection_requests_updated_at BEFORE UPDATE ON connection_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE OR REPLACE FUNCTION notify_connection_request()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = elite_circle, public AS $$
DECLARE v_inv_user UUID; v_inv_name TEXT; v_founder TEXT;
BEGIN
  SELECT user_id, name INTO v_inv_user, v_inv_name FROM investors WHERE id = NEW.investor_id;
  SELECT COALESCE(full_name, username) INTO v_founder FROM profiles WHERE id = NEW.from_user_id;
  PERFORM create_notification(NEW.from_user_id, 'connection_request', 'Intro request sent',
    'Your intro request to ' || COALESCE(v_inv_name, 'the investor') || ' was received. Our team will broker the connection.', '/connections');
  IF v_inv_user IS NOT NULL AND v_inv_user <> NEW.from_user_id THEN
    PERFORM create_notification(v_inv_user, 'connection_request', 'A founder wants to connect',
      COALESCE(v_founder, 'A founder') || ' requested an introduction.', '/connections');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_connection_request ON connection_requests;
CREATE TRIGGER trg_notify_connection_request AFTER INSERT ON connection_requests FOR EACH ROW EXECUTE FUNCTION notify_connection_request();

CREATE OR REPLACE FUNCTION notify_connection_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = elite_circle, public AS $$
DECLARE v_inv_name TEXT;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT name INTO v_inv_name FROM investors WHERE id = NEW.investor_id;
  IF NEW.status = 'accepted' THEN
    PERFORM create_notification(NEW.from_user_id, 'connection_accepted', 'Intro accepted',
      'Your intro request to ' || COALESCE(v_inv_name, 'the investor') || ' was accepted. You can now reach out directly.', '/investors');
  ELSIF NEW.status = 'declined' THEN
    PERFORM create_notification(NEW.from_user_id, 'connection_declined', 'Intro update',
      COALESCE(NEW.response_message, 'Your intro request to ' || COALESCE(v_inv_name, 'the investor') || ' was not accepted at this time.'), '/connections');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_connection_status ON connection_requests;
CREATE TRIGGER trg_notify_connection_status AFTER UPDATE ON connection_requests FOR EACH ROW EXECUTE FUNCTION notify_connection_status();
