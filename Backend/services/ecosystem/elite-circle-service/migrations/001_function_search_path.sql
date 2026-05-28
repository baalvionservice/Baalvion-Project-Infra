-- Functions/triggers reference tables unqualified, so they must pin search_path
-- to the `elite_circle` schema (they run with the caller's path otherwise, e.g. when
-- invoked as elite_circle.fn() over a public-default connection).
SET search_path TO elite_circle, public;

CREATE OR REPLACE FUNCTION increment_thread_views(thread_id UUID)
RETURNS VOID LANGUAGE SQL SET search_path = elite_circle, public AS $$
  UPDATE forum_threads SET views = COALESCE(views, 0) + 1 WHERE id = thread_id
$$;

CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SET search_path = elite_circle, public AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID, p_type TEXT, p_title TEXT, p_message TEXT, p_link TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SET search_path = elite_circle, public AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION notify_deal_interest()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = elite_circle, public AS $$
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

CREATE OR REPLACE FUNCTION notify_deal_interest_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = elite_circle, public AS $$
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

CREATE OR REPLACE FUNCTION notify_application_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = elite_circle, public AS $$
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
