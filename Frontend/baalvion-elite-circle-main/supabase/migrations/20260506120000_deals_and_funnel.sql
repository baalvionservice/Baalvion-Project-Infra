-- Deals
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL,
  title text NOT NULL,
  pitch text NOT NULL,
  description text,
  problem text,
  solution text,
  business_model text,
  funding_required numeric,
  expected_return text,
  stage text,
  category text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deals viewable by authenticated" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Founders can insert own deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (auth.uid() = founder_id);
CREATE POLICY "Founders can update own deals" ON public.deals FOR UPDATE TO authenticated USING (auth.uid() = founder_id);
CREATE POLICY "Founders can delete own deals" ON public.deals FOR DELETE TO authenticated USING (auth.uid() = founder_id);
CREATE TRIGGER deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Deal interests
CREATE TABLE IF NOT EXISTS public.deal_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(deal_id, investor_id)
);
ALTER TABLE public.deal_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investor views own interest" ON public.deal_interests FOR SELECT TO authenticated USING (auth.uid() = investor_id);
CREATE POLICY "Founder views interests on own deals" ON public.deal_interests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.founder_id = auth.uid()));
CREATE POLICY "Investor creates own interest" ON public.deal_interests FOR INSERT TO authenticated WITH CHECK (auth.uid() = investor_id);
CREATE POLICY "Founder updates interests on own deals" ON public.deal_interests FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.founder_id = auth.uid()));
CREATE POLICY "Investor deletes own interest" ON public.deal_interests FOR DELETE TO authenticated USING (auth.uid() = investor_id);
CREATE TRIGGER deal_interests_updated_at BEFORE UPDATE ON public.deal_interests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.notify_deal_interest()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_founder_id uuid; v_title text; v_investor_name text;
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
CREATE TRIGGER trg_notify_deal_interest AFTER INSERT ON public.deal_interests FOR EACH ROW EXECUTE FUNCTION public.notify_deal_interest();

CREATE OR REPLACE FUNCTION public.notify_deal_interest_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT title INTO v_title FROM deals WHERE id = NEW.deal_id;
  IF NEW.status = 'approved' THEN
    PERFORM create_notification(NEW.investor_id, 'connection_approved', 'Connection approved',
      'Your interest in "' || v_title || '" was approved. You can now connect.',
      '/deals/' || NEW.deal_id);
  ELSIF NEW.status = 'rejected' THEN
    PERFORM create_notification(NEW.investor_id, 'connection_rejected', 'Connection update',
      'Your interest in "' || v_title || '" was not approved at this time.',
      '/deals/' || NEW.deal_id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_deal_interest_status AFTER UPDATE ON public.deal_interests FOR EACH ROW EXECUTE FUNCTION public.notify_deal_interest_status();

-- Member applications
CREATE TABLE IF NOT EXISTS public.member_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  company text,
  bio text,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewer_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.member_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own application" ON public.member_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all applications" ON public.member_applications FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own application" ON public.member_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pending application" ON public.member_applications FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins update applications" ON public.member_applications FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER member_applications_updated_at BEFORE UPDATE ON public.member_applications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.notify_application_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
CREATE TRIGGER trg_notify_application_status AFTER UPDATE ON public.member_applications FOR EACH ROW EXECUTE FUNCTION public.notify_application_status();

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_interests;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
