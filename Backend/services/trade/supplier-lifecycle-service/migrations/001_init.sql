-- 001_init.sql — supplier lifecycle. Run as the privileged owner role.
BEGIN;
CREATE SCHEMA IF NOT EXISTS supplier;

CREATE TABLE IF NOT EXISTS supplier.suppliers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      text NOT NULL,
  legal_name  text NOT NULL,
  country     char(2) NOT NULL,
  stage       text NOT NULL DEFAULT 'prospect' CHECK (stage IN ('prospect','onboarding','qualified','active','suspended','offboarded','blacklisted')),
  risk_score  numeric(5,2),
  trust_score int,
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, legal_name, country)
);

CREATE TABLE IF NOT EXISTS supplier.qualification_docs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      text NOT NULL,
  supplier_id uuid NOT NULL REFERENCES supplier.suppliers(id) ON DELETE CASCADE,
  doc_type    text NOT NULL,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  expires_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier.scorecards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      text NOT NULL,
  supplier_id uuid NOT NULL REFERENCES supplier.suppliers(id) ON DELETE CASCADE,
  period      text NOT NULL,
  quality_kpi numeric(5,2),
  otd_kpi     numeric(5,2),
  defect_ppm  int,
  composite   numeric(5,2),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, supplier_id, period)
);

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['suppliers','qualification_docs','scorecards'] LOOP
    EXECUTE format('ALTER TABLE supplier.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE supplier.%I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON supplier.%I', tbl);
    EXECUTE format($f$CREATE POLICY tenant_isolation ON supplier.%I
      USING ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND org_id::text = current_setting('app.current_tenant', true)))
      WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND org_id::text = current_setting('app.current_tenant', true)))$f$, tbl);
  END LOOP;
END $$;
COMMIT;
