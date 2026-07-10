-- Down for 054.
ALTER TABLE tradeops.goods_receipt_lines DROP CONSTRAINT IF EXISTS fk_grn_line_putaway_task;
ALTER TABLE tradeops.goods_receipt_lines DROP COLUMN IF EXISTS putaway_task_id;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.putaway_tasks;
DROP TABLE IF EXISTS tradeops.putaway_tasks;
