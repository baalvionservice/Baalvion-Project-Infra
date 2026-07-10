-- 054 — Warehouse Management System, Phase A: putaway tasks.
--
--   • tradeops.putaway_tasks — the persisted output of the rule-based putaway
--     engine (service/warehouse/putaway/*): a suggested bin for a received line
--     item, which a warehouse worker can accept or manually override.
--   • goods_receipt_lines.putaway_task_id — back-reference so a GRN line shows
--     its putaway status without a reverse scan.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style, same as 043).

CREATE TABLE IF NOT EXISTS tradeops.putaway_tasks (
    id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         text          NOT NULL DEFAULT 'T-DEMO',
    warehouse_id      uuid          NOT NULL,
    grn_line_id       uuid,
    package_id        uuid,
    suggested_bin_id  uuid,
    assigned_bin_id   uuid,
    status            text          NOT NULL DEFAULT 'pending',
    strategy          text          NOT NULL DEFAULT 'rule_based',
    quantity          numeric(14,3) NOT NULL,
    unit              text          NOT NULL DEFAULT 'unit',
    reason_codes      jsonb         NOT NULL DEFAULT '[]'::jsonb,
    override_reason   text,
    assigned_by       text,
    assigned_at       timestamptz,
    completed_at      timestamptz,
    metadata          jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version           integer       NOT NULL DEFAULT 1,
    created_by        text,
    updated_by        text,
    created_at        timestamptz   NOT NULL DEFAULT now(),
    updated_at        timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_putaway_warehouse      FOREIGN KEY (warehouse_id) REFERENCES tradeops.warehouses (id) ON DELETE CASCADE,
    CONSTRAINT fk_putaway_grn_line       FOREIGN KEY (grn_line_id) REFERENCES tradeops.goods_receipt_lines (id) ON DELETE SET NULL,
    CONSTRAINT fk_putaway_package        FOREIGN KEY (package_id) REFERENCES tradeops.packages (id) ON DELETE SET NULL,
    CONSTRAINT fk_putaway_suggested_bin  FOREIGN KEY (suggested_bin_id) REFERENCES tradeops.warehouse_bins (id) ON DELETE SET NULL,
    CONSTRAINT fk_putaway_assigned_bin   FOREIGN KEY (assigned_bin_id) REFERENCES tradeops.warehouse_bins (id) ON DELETE SET NULL,
    CONSTRAINT chk_putaway_status        CHECK (status IN ('pending','suggested','assigned','completed','cancelled')),
    CONSTRAINT chk_putaway_strategy      CHECK (strategy IN ('rule_based','manual_override'))
);

CREATE INDEX IF NOT EXISTS idx_putaway_tenant     ON tradeops.putaway_tasks (tenant_id);
CREATE INDEX IF NOT EXISTS idx_putaway_warehouse  ON tradeops.putaway_tasks (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_putaway_status     ON tradeops.putaway_tasks (status);
CREATE INDEX IF NOT EXISTS idx_putaway_grn_line   ON tradeops.putaway_tasks (grn_line_id);

ALTER TABLE tradeops.putaway_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.putaway_tasks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.putaway_tasks;
CREATE POLICY tenant_isolation ON tradeops.putaway_tasks
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

ALTER TABLE tradeops.goods_receipt_lines ADD COLUMN IF NOT EXISTS putaway_task_id uuid;
ALTER TABLE tradeops.goods_receipt_lines ADD CONSTRAINT fk_grn_line_putaway_task FOREIGN KEY (putaway_task_id) REFERENCES tradeops.putaway_tasks (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_grn_line_putaway_task ON tradeops.goods_receipt_lines (putaway_task_id);
