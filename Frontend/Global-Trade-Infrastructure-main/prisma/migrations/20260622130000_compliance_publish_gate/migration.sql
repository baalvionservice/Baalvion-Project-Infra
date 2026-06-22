-- Phase 2 Compliance Publish Gate: AI content moderation (moderation_cases) and
-- a publish gate (publish_gates) that aggregates restricted-goods, sanctions,
-- country-rule and moderation screens into one publish decision. Both are mutable
-- workflow rows (optimistic-locked); every row is tenant-owned and RLS-scoped.

-- ── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'CLEARED', 'FLAGGED', 'BLOCKED');
CREATE TYPE "PublishGateStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'SUSPENDED');
CREATE TYPE "PublishGateDecision" AS ENUM ('APPROVE', 'REVIEW', 'REJECT');

-- ── moderation_cases ─────────────────────────────────────────────────────────
CREATE TABLE "moderation_cases" (
  "id"             UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "subjectType"    TEXT NOT NULL,
  "subjectId"      TEXT NOT NULL,
  "reference"      TEXT,
  "status"         "ModerationStatus" NOT NULL DEFAULT 'PENDING',
  "decision"       TEXT,
  "score"          INTEGER NOT NULL DEFAULT 0,
  "model"          TEXT NOT NULL DEFAULT 'heuristic-v1',
  "labels"         JSONB,
  "reasons"        JSONB,
  "decidedBy"      TEXT,
  "decidedAt"      TIMESTAMP(3),
  "metadata"       JSONB,
  "version"        INTEGER NOT NULL DEFAULT 1,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "moderation_cases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "moderation_cases_score_bounds" CHECK ("score" >= 0 AND "score" <= 100)
);
CREATE INDEX "moderation_cases_organizationId_idx" ON "moderation_cases"("organizationId");
CREATE INDEX "moderation_cases_subject_idx" ON "moderation_cases"("subjectType", "subjectId");
CREATE INDEX "moderation_cases_status_idx" ON "moderation_cases"("status");
CREATE INDEX "moderation_cases_createdAt_idx" ON "moderation_cases"("createdAt");
CREATE UNIQUE INDEX "moderation_cases_org_reference_uq"
  ON "moderation_cases"("organizationId", "reference") WHERE "reference" IS NOT NULL;

-- ── publish_gates ────────────────────────────────────────────────────────────
CREATE TABLE "publish_gates" (
  "id"               UUID NOT NULL,
  "organizationId"   UUID NOT NULL,
  "subjectType"      TEXT NOT NULL,
  "subjectId"        TEXT NOT NULL,
  "reference"        TEXT,
  "tradeId"          UUID,
  "status"           "PublishGateStatus" NOT NULL DEFAULT 'DRAFT',
  "decision"         "PublishGateDecision",
  "checks"           JSONB,
  "blockers"         JSONB,
  "warnings"         JSONB,
  "requiredActions"  JSONB,
  "goods"            JSONB,
  "sanctions"        JSONB,
  "country"          JSONB,
  "moderationCaseId" UUID,
  "evaluatedAt"      TIMESTAMP(3),
  "decidedBy"        TEXT,
  "decidedAt"        TIMESTAMP(3),
  "publishedAt"      TIMESTAMP(3),
  "metadata"         JSONB,
  "version"          INTEGER NOT NULL DEFAULT 1,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  "deletedAt"        TIMESTAMP(3),
  CONSTRAINT "publish_gates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "publish_gates_organizationId_idx" ON "publish_gates"("organizationId");
CREATE INDEX "publish_gates_subject_idx" ON "publish_gates"("subjectType", "subjectId");
CREATE INDEX "publish_gates_status_idx" ON "publish_gates"("status");
CREATE INDEX "publish_gates_tradeId_idx" ON "publish_gates"("tradeId");
CREATE INDEX "publish_gates_deletedAt_idx" ON "publish_gates"("deletedAt");
-- At most one live gate per subject, and idempotent submission by reference.
CREATE UNIQUE INDEX "publish_gates_subject_uq"
  ON "publish_gates"("organizationId", "subjectType", "subjectId") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "publish_gates_org_reference_uq"
  ON "publish_gates"("organizationId", "reference") WHERE "reference" IS NOT NULL AND "deletedAt" IS NULL;

-- ── Least-privilege grants ───────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON "moderation_cases", "publish_gates" TO baalvion_app;

-- ── Row-Level Security: every row is strictly tenant-scoped ──────────────────
DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['moderation_cases', 'publish_gates']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($pol$
      CREATE POLICY tenant_read ON %I FOR SELECT USING (
        current_setting('app.current_tenant', true) IS NOT NULL
        AND current_setting('app.current_tenant', true) <> ''
        AND "organizationId" = current_setting('app.current_tenant', true)::uuid
      )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_insert ON %I FOR INSERT WITH CHECK (
        current_setting('app.current_tenant', true) IS NOT NULL
        AND current_setting('app.current_tenant', true) <> ''
        AND "organizationId" = current_setting('app.current_tenant', true)::uuid
      )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_update ON %I FOR UPDATE USING (
        current_setting('app.current_tenant', true) IS NOT NULL
        AND current_setting('app.current_tenant', true) <> ''
        AND "organizationId" = current_setting('app.current_tenant', true)::uuid
      )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_delete ON %I FOR DELETE USING (
        current_setting('app.current_tenant', true) IS NOT NULL
        AND current_setting('app.current_tenant', true) <> ''
        AND "organizationId" = current_setting('app.current_tenant', true)::uuid
      )
    $pol$, t);
  END LOOP;
END
$rls$;
