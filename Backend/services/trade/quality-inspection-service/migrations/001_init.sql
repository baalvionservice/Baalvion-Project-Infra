-- 001_init.sql — quality & inspection. Run as the privileged owner role.
BEGIN;
CREATE SCHEMA IF NOT EXISTS quality;

CREATE TABLE IF NOT EXISTS quality.inspections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       text NOT NULL,
  order_id     text,
  product_id   text,
  supplier_id  text,
  type         text NOT NULL CHECK (type IN ('incoming','in_process','pre_shipment','container_loading')),
  aql_level    text,
  status       text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','passed','failed','cancelled')),
  inspector_id text,
  scheduled_at timestamptz,
  result       jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insp_order ON quality.inspections (order_id);
CREATE INDEX IF NOT EXISTS idx_insp_supplier ON quality.inspections (supplier_id);

CREATE TABLE IF NOT EXISTS quality.defects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        text NOT NULL,
  inspection_id uuid NOT NULL REFERENCES quality.inspections(id) ON DELETE CASCADE,
  severity      text NOT NULL CHECK (severity IN ('critical','major','minor')),
  description   text NOT NULL,
  qty           int  NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quality.capa (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        text NOT NULL,
  inspection_id uuid NOT NULL REFERENCES quality.inspections(id) ON DELETE CASCADE,
  action        text NOT NULL,
  owner_id      text,
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','closed')),
  due_at        timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['inspections','defects','capa'] LOOP
    EXECUTE format('ALTER TABLE quality.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE quality.%I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON quality.%I', tbl);
    EXECUTE format($f$CREATE POLICY tenant_isolation ON quality.%I
      USING ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND org_id::text = current_setting('app.current_tenant', true)))
      WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND org_id::text = current_setting('app.current_tenant', true)))$f$, tbl);
  END LOOP;
END $$;
COMMIT;
