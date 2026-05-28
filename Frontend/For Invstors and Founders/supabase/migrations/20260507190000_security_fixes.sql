-- 1. Restrict tag_analytics_reports INSERT to admin role
DROP POLICY IF EXISTS "System can insert reports" ON public.tag_analytics_reports;
CREATE POLICY "Admins can insert reports"
  ON public.tag_analytics_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Restrict user_roles SELECT to own row or admins
DROP POLICY IF EXISTS "Roles viewable by authenticated users" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Storage policies for elite-proofs: owner UPDATE/DELETE + admin DELETE
DROP POLICY IF EXISTS "Owners can update own elite proofs" ON storage.objects;
CREATE POLICY "Owners can update own elite proofs"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'elite-proofs' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'elite-proofs' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owners can delete own elite proofs" ON storage.objects;
CREATE POLICY "Owners can delete own elite proofs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'elite-proofs' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins can delete any elite proof" ON storage.objects;
CREATE POLICY "Admins can delete any elite proof"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'elite-proofs' AND has_role(auth.uid(), 'admin'::app_role));

-- 4. Realtime: scope channel subscriptions to per-user topics (user:<uid>)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only subscribe to own topic" ON realtime.messages;
CREATE POLICY "Users can only subscribe to own topic"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (realtime.topic() = 'user:' || (auth.uid())::text);
