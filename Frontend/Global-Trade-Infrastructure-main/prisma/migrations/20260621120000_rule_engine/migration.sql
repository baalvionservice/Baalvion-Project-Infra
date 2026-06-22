-- Phase 1 Rule Engine: configuration-over-code rule store.
-- Tables: rule_sets, rules, rule_revisions.
-- organizationId is NULLABLE on rule_sets/rules: NULL = platform-global baseline
-- inherited by every tenant; non-null = a tenant-specific override. RLS lets a
-- tenant READ global + own rows and WRITE only its own (global rows are managed
-- by privileged platform tooling that bypasses RLS, e.g. scripts/seed-rules.cjs).

-- Enums
CREATE TYPE "RuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "ConflictStrategy" AS ENUM ('PRIORITY', 'FIRST_MATCH', 'ALL_MATCH', 'DENY_OVERRIDES', 'ALLOW_OVERRIDES');
CREATE TYPE "TradeDirection" AS ENUM ('IMPORT', 'EXPORT', 'BOTH');

-- rule_sets
CREATE TABLE "rule_sets" (
  "id"               UUID NOT NULL,
  "organizationId"   UUID,
  "key"              TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "description"      TEXT,
  "category"         TEXT NOT NULL,
  "status"           "RuleStatus" NOT NULL DEFAULT 'ACTIVE',
  "conflictStrategy" "ConflictStrategy" NOT NULL DEFAULT 'DENY_OVERRIDES',
  "defaultDecision"  TEXT NOT NULL DEFAULT 'ALLOW',
  "effectiveFrom"    TIMESTAMP(3),
  "effectiveTo"      TIMESTAMP(3),
  "priority"         INTEGER NOT NULL DEFAULT 0,
  "metadata"         JSONB,
  "version"          INTEGER NOT NULL DEFAULT 1,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  "deletedAt"        TIMESTAMP(3),
  CONSTRAINT "rule_sets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "rule_sets_organizationId_key_idx" ON "rule_sets"("organizationId", "key");
CREATE INDEX "rule_sets_category_idx" ON "rule_sets"("category");
CREATE INDEX "rule_sets_status_idx" ON "rule_sets"("status");
CREATE INDEX "rule_sets_deletedAt_idx" ON "rule_sets"("deletedAt");
-- One live set per (org, key); one live GLOBAL set per key. NULLs are distinct
-- in a plain unique index, so the global case needs its own partial index.
CREATE UNIQUE INDEX "rule_sets_org_key_uq" ON "rule_sets"("organizationId", "key") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "rule_sets_global_key_uq" ON "rule_sets"("key") WHERE "organizationId" IS NULL AND "deletedAt" IS NULL;

-- rules
CREATE TABLE "rules" (
  "id"              UUID NOT NULL,
  "ruleSetId"       UUID NOT NULL,
  "organizationId"  UUID,
  "key"             TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "priority"        INTEGER NOT NULL DEFAULT 0,
  "status"          "RuleStatus" NOT NULL DEFAULT 'ACTIVE',
  "condition"       JSONB NOT NULL,
  "effect"          JSONB NOT NULL,
  "country"         TEXT,
  "region"          TEXT,
  "hsCode"          TEXT,
  "productCategory" TEXT,
  "orgType"         TEXT,
  "role"            TEXT,
  "direction"       "TradeDirection" NOT NULL DEFAULT 'BOTH',
  "tags"            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "effectiveFrom"   TIMESTAMP(3),
  "effectiveTo"     TIMESTAMP(3),
  "metadata"        JSONB,
  "version"         INTEGER NOT NULL DEFAULT 1,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "deletedAt"       TIMESTAMP(3),
  CONSTRAINT "rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rules_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "rule_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "rules_ruleSetId_idx" ON "rules"("ruleSetId");
CREATE INDEX "rules_organizationId_idx" ON "rules"("organizationId");
CREATE INDEX "rules_status_idx" ON "rules"("status");
CREATE INDEX "rules_country_idx" ON "rules"("country");
CREATE INDEX "rules_hsCode_idx" ON "rules"("hsCode");
CREATE INDEX "rules_deletedAt_idx" ON "rules"("deletedAt");
CREATE UNIQUE INDEX "rules_set_key_uq" ON "rules"("ruleSetId", "key") WHERE "deletedAt" IS NULL;

-- rule_revisions (append-only history)
CREATE TABLE "rule_revisions" (
  "id"             UUID NOT NULL,
  "organizationId" UUID,
  "ruleSetId"      UUID,
  "ruleId"         UUID,
  "entityType"     TEXT NOT NULL,
  "entityKey"      TEXT NOT NULL,
  "version"        INTEGER NOT NULL,
  "action"         TEXT NOT NULL,
  "snapshot"       JSONB NOT NULL,
  "actorId"        TEXT NOT NULL,
  "actorRole"      TEXT,
  "reason"         TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rule_revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rule_revisions_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "rule_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "rule_revisions_organizationId_idx" ON "rule_revisions"("organizationId");
CREATE INDEX "rule_revisions_ruleSetId_idx" ON "rule_revisions"("ruleSetId");
CREATE INDEX "rule_revisions_ruleId_idx" ON "rule_revisions"("ruleId");
CREATE INDEX "rule_revisions_entityType_entityKey_idx" ON "rule_revisions"("entityType", "entityKey");
CREATE INDEX "rule_revisions_createdAt_idx" ON "rule_revisions"("createdAt");

-- Least-privilege grants (role created by the prior tenant-isolation migration)
GRANT SELECT, INSERT, UPDATE, DELETE ON "rule_sets", "rules", "rule_revisions" TO baalvion_app;

-- Row-Level Security: read global (NULL org) OR own-tenant rows; write own only.
DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['rule_sets', 'rules', 'rule_revisions']
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

-- rule_sets / rules are mutable by their owning tenant (UPDATE/DELETE policies).
CREATE POLICY tenant_update ON "rule_sets" FOR UPDATE
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) <> ''
    AND "organizationId" = current_setting('app.current_tenant', true)::uuid
  );
CREATE POLICY tenant_delete ON "rule_sets" FOR DELETE
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) <> ''
    AND "organizationId" = current_setting('app.current_tenant', true)::uuid
  );
CREATE POLICY tenant_update ON "rules" FOR UPDATE
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) <> ''
    AND "organizationId" = current_setting('app.current_tenant', true)::uuid
  );
CREATE POLICY tenant_delete ON "rules" FOR DELETE
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) <> ''
    AND "organizationId" = current_setting('app.current_tenant', true)::uuid
  );

-- rule_revisions is append-only (immutable history, CR-14). Reuses the
-- enforce_append_only() trigger function created by the tenant-isolation migration.
CREATE TRIGGER rule_revisions_no_mutate
  BEFORE UPDATE OR DELETE ON "rule_revisions"
  FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
