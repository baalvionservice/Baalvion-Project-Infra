-- 001_init.sql — product registry. Run as the privileged owner role.
BEGIN;
CREATE SCHEMA IF NOT EXISTS product;

CREATE TABLE IF NOT EXISTS product.products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         text NOT NULL,
  sku            text NOT NULL,
  gtin           text,
  name           text NOT NULL,
  hs_code        text NOT NULL,
  uom            text NOT NULL DEFAULT 'EA',
  origin_country char(2),
  hazmat         boolean NOT NULL DEFAULT false,
  attributes     jsonb NOT NULL DEFAULT '{}',
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','retired','draft')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, sku)
);
CREATE INDEX IF NOT EXISTS idx_products_hs ON product.products (hs_code);

CREATE TABLE IF NOT EXISTS product.hs_doc_requirements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       text NOT NULL,
  hs_prefix    text NOT NULL,
  dest_country char(2) NOT NULL,
  doc_type     text NOT NULL,
  mandatory    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hsreq_lookup ON product.hs_doc_requirements (hs_prefix, dest_country);

-- R1 RLS
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['products','hs_doc_requirements'] LOOP
    EXECUTE format('ALTER TABLE product.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE product.%I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON product.%I', tbl);
    EXECUTE format($f$CREATE POLICY tenant_isolation ON product.%I
      USING ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND org_id::text = current_setting('app.current_tenant', true)))
      WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND org_id::text = current_setting('app.current_tenant', true)))$f$, tbl);
  END LOOP;
END $$;
COMMIT;
