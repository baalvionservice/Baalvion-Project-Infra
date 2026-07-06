-- 021 — Tasks module (Phase 1 Trade Agent workspace).
--
-- Generic, tenant-scoped task/to-do tracking for trade-agent workflows (follow-ups,
-- field visits, opportunity chases) with an optional polymorphic link back to the
-- entity the task concerns (RFQ, deal, shipment, ...).
--
-- One table in schema `tradeops`:
--   • tasks — TENANT-SCOPED, RLS. status walks open → in_progress → completed
--     (or cancelled). due_date/completed_at drive dashboard widgets.
--
-- Design guarantees (mirror 008…020):
--   • Tenant isolation — RLS fail-closed.
--   • migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
--     bodies; the RLS policy is written explicitly.

CREATE TABLE IF NOT EXISTS tradeops.tasks (
    id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            text          NOT NULL DEFAULT 'T-DEMO',
    assigned_to_user_id  text,
    assigned_to_org_id   text,
    created_by_user_id   text,
    related_entity_type  text,
    related_entity_id    text,
    title                text          NOT NULL,
    description          text,
    category             text,
    priority             text          NOT NULL DEFAULT 'medium',
    status               text          NOT NULL DEFAULT 'open',
    due_date             timestamptz,
    completed_at         timestamptz,
    created_at           timestamptz   NOT NULL DEFAULT now(),
    updated_at           timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT chk_tasks_priority CHECK (priority IN ('low','medium','high','urgent')),
    CONSTRAINT chk_tasks_status CHECK (status IN ('open','in_progress','completed','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_status     ON tradeops.tasks (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_assignee    ON tradeops.tasks (tenant_id, assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_related_entity      ON tradeops.tasks (related_entity_type, related_entity_id) WHERE related_entity_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_brin        ON tradeops.tasks USING brin (created_at);

ALTER TABLE tradeops.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.tasks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.tasks;
CREATE POLICY tenant_isolation ON tradeops.tasks
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
