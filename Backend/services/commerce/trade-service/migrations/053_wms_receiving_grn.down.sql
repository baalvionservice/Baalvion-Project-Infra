-- Down for 053.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.goods_receipt_lines;
DROP TABLE IF EXISTS tradeops.goods_receipt_lines;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.goods_receipt_notes;
DROP TABLE IF EXISTS tradeops.goods_receipt_notes;
