-- 001_init.sql — trade documentation. Run as the privileged owner role.
BEGIN;
CREATE SCHEMA IF NOT EXISTS tradedoc;

CREATE TABLE IF NOT EXISTS tradedoc.documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      text NOT NULL,
  order_id    text,
  doc_type    text NOT NULL CHECK (doc_type IN ('commercial_invoice','packing_list','bill_of_lading','certificate_of_origin','lc','inspection_cert')),
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','signed','void')),
  version     int  NOT NULL DEFAULT 1,
  storage_key text,
  checksum    text,
  issued_at   timestamptz,
  issued_by   text,
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, doc_type, order_id, version)
);
CREATE INDEX IF NOT EXISTS idx_docs_order ON tradedoc.documents (order_id);

CREATE TABLE IF NOT EXISTS tradedoc.signatures (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      text NOT NULL,
  document_id uuid NOT NULL REFERENCES tradedoc.documents(id) ON DELETE CASCADE,
  signer_id   text NOT NULL,
  signature   text NOT NULL,
  signed_at   timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['documents','signatures'] LOOP
    EXECUTE format('ALTER TABLE tradedoc.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE tradedoc.%I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON tradedoc.%I', tbl);
    EXECUTE format($f$CREATE POLICY tenant_isolation ON tradedoc.%I
      USING ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND org_id::text = current_setting('app.current_tenant', true)))
      WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND org_id::text = current_setting('app.current_tenant', true)))$f$, tbl);
  END LOOP;
END $$;
COMMIT;
