-- Phase 1 Global Country Knowledge Base (GCKB): generic, configuration-driven
-- reference store. Three tables — gckb_records (discriminated, self-referential),
-- gckb_relationships (generic typed edges) and gckb_revisions (append-only
-- history). organizationId is NULLABLE: NULL = platform-global canonical baseline
-- inherited by every tenant; non-null = tenant override. RLS: read global + own,
-- write own. Global baseline is provisioned by privileged tooling (RLS-bypassing).

-- gckb_records ──────────────────────────────────────────────────────────────
CREATE TABLE "gckb_records" (
  "id"              UUID NOT NULL,
  "organizationId"  UUID,
  "entityType"      TEXT NOT NULL,
  "recordKey"       TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "countryId"       UUID,
  "parentId"        UUID,
  "code"            TEXT,
  "policyType"      TEXT,
  "hsCode"          TEXT,
  "productCategory" TEXT,
  "attributes"      JSONB NOT NULL DEFAULT '{}',
  "tags"            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "version"         INTEGER NOT NULL DEFAULT 1,
  "status"          TEXT NOT NULL DEFAULT 'DRAFT',
  "effectiveFrom"   TIMESTAMP(3),
  "effectiveTo"     TIMESTAMP(3),
  "publishedAt"     TIMESTAMP(3),
  "authority"       TEXT,
  "source"          TEXT,
  "checksum"        TEXT NOT NULL,
  "auditReference"  TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "deletedAt"       TIMESTAMP(3),
  CONSTRAINT "gckb_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "gckb_records_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "gckb_records"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "gckb_records_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "gckb_records"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "gckb_records_organizationId_idx" ON "gckb_records"("organizationId");
CREATE INDEX "gckb_records_entityType_idx" ON "gckb_records"("entityType");
CREATE INDEX "gckb_records_entityType_recordKey_idx" ON "gckb_records"("entityType", "recordKey");
CREATE INDEX "gckb_records_countryId_idx" ON "gckb_records"("countryId");
CREATE INDEX "gckb_records_parentId_idx" ON "gckb_records"("parentId");
CREATE INDEX "gckb_records_policyType_idx" ON "gckb_records"("policyType");
CREATE INDEX "gckb_records_hsCode_idx" ON "gckb_records"("hsCode");
CREATE INDEX "gckb_records_productCategory_idx" ON "gckb_records"("productCategory");
CREATE INDEX "gckb_records_code_idx" ON "gckb_records"("code");
CREATE INDEX "gckb_records_status_idx" ON "gckb_records"("status");
CREATE INDEX "gckb_records_effectiveFrom_idx" ON "gckb_records"("effectiveFrom");
CREATE INDEX "gckb_records_effectiveTo_idx" ON "gckb_records"("effectiveTo");
CREATE INDEX "gckb_records_deletedAt_idx" ON "gckb_records"("deletedAt");
-- JSON/array search acceleration (keyword + tag search).
CREATE INDEX "gckb_records_attributes_gin" ON "gckb_records" USING GIN ("attributes" jsonb_path_ops);
CREATE INDEX "gckb_records_tags_gin" ON "gckb_records" USING GIN ("tags");
-- One live record per natural key (tenant scope), and one live GLOBAL record per key.
CREATE UNIQUE INDEX "gckb_records_org_key_uq" ON "gckb_records"("organizationId", "entityType", "recordKey") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "gckb_records_global_key_uq" ON "gckb_records"("entityType", "recordKey") WHERE "organizationId" IS NULL AND "deletedAt" IS NULL;

-- gckb_relationships ────────────────────────────────────────────────────────
CREATE TABLE "gckb_relationships" (
  "id"             UUID NOT NULL,
  "organizationId" UUID,
  "fromId"         UUID NOT NULL,
  "relationType"   TEXT NOT NULL,
  "toType"         TEXT NOT NULL,
  "toId"           TEXT,
  "toRef"          TEXT,
  "metadata"       JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gckb_relationships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "gckb_relationships_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "gckb_records"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "gckb_relationships_fromId_idx" ON "gckb_relationships"("fromId");
CREATE INDEX "gckb_relationships_toType_toId_idx" ON "gckb_relationships"("toType", "toId");
CREATE INDEX "gckb_relationships_relationType_idx" ON "gckb_relationships"("relationType");
CREATE INDEX "gckb_relationships_organizationId_idx" ON "gckb_relationships"("organizationId");

-- gckb_revisions (append-only) ───────────────────────────────────────────────
CREATE TABLE "gckb_revisions" (
  "id"             UUID NOT NULL,
  "organizationId" UUID,
  "recordId"       UUID,
  "entityType"     TEXT NOT NULL,
  "recordKey"      TEXT NOT NULL,
  "version"        INTEGER NOT NULL,
  "action"         TEXT NOT NULL,
  "snapshot"       JSONB NOT NULL,
  "checksum"       TEXT NOT NULL,
  "actorId"        TEXT NOT NULL,
  "actorRole"      TEXT,
  "source"         TEXT,
  "reason"         TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gckb_revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "gckb_revisions_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "gckb_records"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "gckb_revisions_recordId_idx" ON "gckb_revisions"("recordId");
CREATE INDEX "gckb_revisions_entityType_recordKey_idx" ON "gckb_revisions"("entityType", "recordKey");
CREATE INDEX "gckb_revisions_organizationId_idx" ON "gckb_revisions"("organizationId");
CREATE INDEX "gckb_revisions_createdAt_idx" ON "gckb_revisions"("createdAt");

-- Least-privilege grants (role created by the tenant-isolation migration)
GRANT SELECT, INSERT, UPDATE, DELETE ON "gckb_records", "gckb_relationships", "gckb_revisions" TO baalvion_app;

-- Row-Level Security: read global (NULL org) OR own-tenant; write own only.
DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['gckb_records', 'gckb_relationships', 'gckb_revisions']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($pol$
      CREATE POLICY tenant_or_global_read ON %I
        FOR SELECT
        USING (
          "organizationId" IS NULL
          OR (
            current_setting('app.current_tenant', true) IS NOT NULL
            AND current_setting('app.current_tenant', true) <> ''
            AND "organizationId" = current_setting('app.current_tenant', true)::uuid
          )
        )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_write ON %I
        FOR INSERT
        WITH CHECK (
          current_setting('app.current_tenant', true) IS NOT NULL
          AND current_setting('app.current_tenant', true) <> ''
          AND "organizationId" = current_setting('app.current_tenant', true)::uuid
        )
    $pol$, t);
  END LOOP;
END
$rls$;

-- gckb_records / gckb_relationships are mutable by their owning tenant.
CREATE POLICY tenant_update ON "gckb_records" FOR UPDATE
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) <> ''
    AND "organizationId" = current_setting('app.current_tenant', true)::uuid
  );
CREATE POLICY tenant_delete ON "gckb_records" FOR DELETE
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) <> ''
    AND "organizationId" = current_setting('app.current_tenant', true)::uuid
  );
CREATE POLICY tenant_delete ON "gckb_relationships" FOR DELETE
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) <> ''
    AND "organizationId" = current_setting('app.current_tenant', true)::uuid
  );

-- gckb_revisions is append-only (immutable history, CR-14). Reuses the
-- enforce_append_only() trigger function from the tenant-isolation migration.
CREATE TRIGGER gckb_revisions_no_mutate
  BEFORE UPDATE OR DELETE ON "gckb_revisions"
  FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
